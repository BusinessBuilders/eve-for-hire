# OpenClaw sandbox — security audit (nova, 2026-07-02)

**Auditor:** Fable (read-only). **Host:** `nova` / `nova-1` (100.105.14.117), user `nova`.
**Access proven:** `ssh nova` → `curl http://127.0.0.1:18789/health` → `200 {"ok":true,"status":"live"}`.
**Gateway:** `openclaw-gateway` v2026.3.28, systemd user unit `openclaw-gateway.service`
(`node .../openclaw/dist/index.js gateway --port 18789`), PID 763393, up 41 days.
Config: `/mnt/ssd/openclaw-data/openclaw.json` (symlinked from `~/.openclaw`).

Scope of this pass: read-only inventory of the sandbox mechanism, exposure, tool-policy
gates, and secret hygiene. **No upgrade performed** — deferred per the goal doc pending
William's go-ahead (plan at the end).

---

## What the agent runtime looks like

- **Sandbox mechanism:** Docker, image `openclaw-sandbox:bookworm-slim`, one container per
  agent (`openclaw-sbx-agent-<id>-<hash>`). The public-chat agent's container is **strongly
  locked**: `Privileged=false`, `NetworkMode=none`, `ReadonlyRootfs=true`, `CapAdd=[]`,
  `User=1000:1000`, and its only mount is the agent workspace **read-only** (`rw=false`).
  This is a genuine, code-enforced jail — not prompt-only.
- **Tool policy (public-chat agent, `agents.list[].tools`):** `sandbox.mode=all`,
  `workspaceAccess=none`, allow-list `[sessions_list, sessions_history]`, deny-list
  `[read, write, exec, process, browser, cron, gateway, web_search, web_fetch, canvas,
  group:automation, group:runtime, group:fs]`. Dangerous capabilities are removed at the
  policy layer, so the model cannot talk its way into them.
- **Node command deny-list (`gateway.nodes.denyCommands`):** `camera.snap`, `camera.clip`,
  `screen.record`, `contacts.add`, `calendar.add`, `reminders.add`, `sms.send` — code-enforced
  deny for physical-world / messaging actions.
- **Approval store:** `exec-approvals.json` points at a Unix socket
  (`~/.openclaw/exec-approvals.sock`) guarded by its own token; `defaults` and `agents`
  approval maps are currently empty (no standing pre-approvals). This is the single-fire CAS
  gate the goal doc references and it is present.
- **Auth:** gateway `auth.mode=token` (48-char token). Unauthenticated and wrong-token calls
  to non-public paths return 404/reject; only `/health` is public.

**Verdict on "safeguards can't be talked past":** the dangerous-tool gates for the public
chat agent are code-enforced (Docker isolation + allow/deny policy + node deny-list), not
prompt instructions. That part of the DoD holds for the public agent.

---

## Findings (severity-ranked)

### F1 — HIGH — Gateway token hardcoded in proxy source (and reused as the remote token)
`/mnt/ssd/openclaw-proxy/server.js` line 5:
`const OPENCLAW_TOKEN = process.env.OPENCLAW_TOKEN || '0c31…527';`
The same value is `gateway.remote.token` in `openclaw.json`. The file is mode **664**
(group/other-readable) and the literal token is the fallback, so the gateway credential lives
in plaintext in a world-readable source file and is easy to leak into git/backups/logs.
**Fix (minimal):** remove the literal fallback (`process.env.OPENCLAW_TOKEN` only; fail fast
if unset), `chmod 640` (or 600) the file, load the token from an env file that is `chmod 600`,
and **rotate** the gateway token afterward (it should be treated as already exposed — it is
printed above only because William asked for an audit of his own box; rotate regardless).

### F2 — MEDIUM — Eve OpenAI-compat proxy on `:8097` accepts "any non-empty API key"
`eve-openai-proxy.py` header: *"API Key: eve (any non-empty value works)."* The listener is
`*:8097` (all interfaces), i.e. reachable to anything on the tailnet, and it is also
reverse-tunnelled to the Contabo VPS (`vps-tunnel.sh`, `-R 8097:127.0.0.1:8097`). Effectively
an unauthenticated LLM endpoint on the tailnet. It fronts the gateway using the F1 token.
**Fix:** require a real shared secret (compare against an env value; reject otherwise), and
bind to `127.0.0.1` on nova since the only legitimate consumer reaches it through the SSH
reverse tunnel, not directly.

### F3 — MEDIUM — Services bound to `0.0.0.0` (tailnet-exposed) instead of loopback
`gateway.bind = "lan"` → `0.0.0.0:18789`; likewise the behavior-MCP servers on `9500/9501/9502`
and the OpenAI proxy on `18790` all listen on `0.0.0.0`. The tailnet includes several devices
and a `clawdbot-standard-pc` node. Anything with tailnet access can reach these.
**Fix:** bind the gateway and MCP servers to `127.0.0.1` (or the tailscale interface only) and
rely on the SSH tunnel / a tailscale ACL for the VPS path. Confirm which consumers truly need
off-host access before tightening — the VPS reaches OpenClaw via the reverse tunnel to
`127.0.0.1:8097`, so it does **not** need `18789` exposed.

### F4 — LOW — Telegram `groupPolicy: "open"`
Any group the bot is added to can interact. DMs are gated (`dmPolicy: "pairing"`), which is
good; groups are not. **Fix:** set an allow-list of group IDs or `groupPolicy: "closed"` unless
open groups are intentional.

### F5 — INFO — Good hygiene already in place (no action)
`openclaw.json` is `600`, `credentials/` is `700`, `logs/` is `700`; `commands.log` and
`config-audit.jsonl` show **no** secret patterns (`sk-…`, `pk1_`, `whsec_` → 0 hits). The
config-write audit trail is a nice touch. Numerous `~/.openclaw-backup-*` symlinks all point at
the live data dir (harmless but confusing — consider pruning).

---

## Definition-of-done status (Workstream C)

- [x] Gateway access proven (SSH + `/health` 200), how-to recorded above.
- [x] Written sandbox findings + risk report delivered (this file).
- [x] Dangerous-tool safeguards confirmed **code-enforced** for the public agent (Docker
      no-net/read-only/non-root jail + allow-deny tool policy + node deny-list), not prompt-only.
- [~] Secret hygiene: file perms are correct, but **F1 (hardcoded token) must be fixed +
      token rotated** before this box is checked. F2/F3 reduce blast radius.
- [ ] Upgrade: **deferred** — see plan below. William's call.

## Upgrade plan (deferred — do not run without go-ahead)

Current: v2026.3.28 (npm global `openclaw`). Before any upgrade:
1. Snapshot `~/.openclaw` → tar to `/mnt/ssd` and off-box; record `npm ls -g openclaw` version;
   tag the config (`openclaw.json` is already versioned via `.bak` files).
2. Stop `openclaw-gateway.service`; `npm i -g openclaw@latest` in a staging path or off-hours.
3. Re-run the exact checks in this report (health call, container flags, tool-policy deny-list,
   `/health` + auth rejection) to confirm every safeguard still holds post-upgrade.
4. Cut over; keep the snapshot for rollback (`npm i -g openclaw@<old>` + restore `~/.openclaw`).

## Recommended fix order
F1 (rotate + de-hardcode the token) → F2 (proxy auth + loopback) → F3 (bind loopback) → F4.
All are low-effort config/source edits; none require an upgrade.
