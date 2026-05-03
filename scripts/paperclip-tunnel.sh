#!/usr/bin/env bash
# Paperclip API Tunnel — exposes the local Paperclip API via Cloudflare quick tunnel
# Usage: ./scripts/paperclip-tunnel.sh [--url-only]
#
# Architecture:
#   Public Internet → Cloudflare Tunnel → Caddy (:3101) → Paperclip API (:3100)
#
# Caddy rewrites Host/X-Forwarded-Host headers to "localhost" so Paperclip's
# private-hostname guard accepts the proxied requests.
#
# Requirements: cloudflared, caddy (both available in PATH)
#
# Note: Cloudflare quick tunnels generate random URLs that change on restart.
# For a stable production URL, use one of these alternatives:
#   1. Tailscale Funnel:  sudo tailscale set --operator=$USER && tailscale funnel --bg 3100
#   2. Cloudflare named tunnel with a domain (requires Cloudflare account)
#   3. ngrok with a paid account for stable subdomain

set -euo pipefail

PAPERCLIP_PORT="${PAPERCLIP_PORT:-3100}"
CADDY_PORT="${CADDY_PROXY_PORT:-3101}"
CADDY_DIR="/tmp/caddy-paperclip-proxy"
URL_ONLY=false

if [[ "${1:-}" == "--url-only" ]]; then
  URL_ONLY=true
fi

# Check dependencies
for cmd in cloudflared caddy; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "ERROR: $cmd not found in PATH" >&2
    exit 1
  fi
done

# Check if Paperclip is running
if ! ss -tlnp 2>/dev/null | grep -q ":${PAPERCLIP_PORT} "; then
  echo "ERROR: Paperclip API not listening on port ${PAPERCLIP_PORT}" >&2
  exit 1
fi

# Start Caddy reverse proxy if not already running
if ! ss -tlnp 2>/dev/null | grep -q ":${CADDY_PORT} "; then
  mkdir -p "$CADDY_DIR"
  cat > "$CADDY_DIR/Caddyfile" <<CADDY
:${CADDY_PORT} {
	reverse_proxy localhost:${PAPERCLIP_PORT} {
		header_up Host localhost
		header_up X-Forwarded-Host localhost
	}
}
CADDY
  (cd "$CADDY_DIR" && caddy start 2>/dev/null)
  echo "Caddy proxy started on :${CADDY_PORT} → :${PAPERCLIP_PORT}"
else
  echo "Caddy proxy already running on :${CADDY_PORT}"
fi

# Start Cloudflare quick tunnel
echo "Starting Cloudflare quick tunnel..."
TUNNEL_LOG=$(mktemp)
cloudflared tunnel --url "http://localhost:${CADDY_PORT}" > "$TUNNEL_LOG" 2>&1 &
CLOUDFLARED_PID=$!

# Wait for tunnel URL to appear
TUNNEL_URL=""
for i in $(seq 1 15); do
  TUNNEL_URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$TUNNEL_LOG" 2>/dev/null | head -1)
  if [[ -n "$TUNNEL_URL" ]]; then
    break
  fi
  sleep 1
done

if [[ -z "$TUNNEL_URL" ]]; then
  echo "ERROR: Failed to get tunnel URL after 15 seconds" >&2
  echo "Check logs: $TUNNEL_LOG" >&2
  kill "$CLOUDFLARED_PID" 2>/dev/null || true
  exit 1
fi

echo ""
echo "============================================"
echo "  Paperclip API Tunnel Active"
echo "============================================"
echo ""
echo "  Public URL:  $TUNNEL_URL"
echo "  Paperclip:   localhost:${PAPERCLIP_PORT}"
echo "  Caddy proxy: localhost:${CADDY_PORT}"
echo "  Tunnel PID:  $CLOUDFLARED_PID"
echo ""
echo "  Test: curl -H 'Authorization: Bearer TOKEN' $TUNNEL_URL/api/agents/me"
echo ""

if $URL_ONLY; then
  echo "$TUNNEL_URL"
fi
