# Design: Rollback Mechanism for Site Deployments (BUS-149)

**Date:** 2026-04-14  
**Author:** CTO Agent  
**Status:** Draft

## Overview

Currently, the `deploy-site` tool overwrites the content of `/var/www/sites/{domain}/` on every deployment. If a deployment is broken or contains errors, there is no easy way to revert to a previous version without re-triggering the entire build pipeline.

A "rollback" mechanism will allow the swarm to quickly revert a site to its last known good state.

## Proposed Architecture

We will move from a flat directory structure to a versioned structure on the VPS.

### 1. VPS Directory Structure
Instead of:
`/var/www/sites/{domain}/*` (flat files)

We will use:
```
/var/www/sites/{domain}/
  ├── current -> ./versions/20260414T120000Z  (symlink)
  └── versions/
      ├── 20260414T110000Z/
      └── 20260414T120000Z/
```

### 2. Caddy Configuration
The Caddyfile will point to the `current` symlink:
```
{domain} {
  root * /var/www/sites/${domain}/current
  file_server
  ...
}
```

### 3. Rollback Logic

#### Deployment Workflow (New):
1. **Timestamp**: Generate a version ID (e.g., ISO timestamp `20260414T120000Z`).
2. **Upload**: Create `/var/www/sites/{domain}/versions/{versionID}/` and upload files.
3. **Atomic Switch**: Update the symlink `/var/www/sites/{domain}/current` to point to the new version.
4. **Reload**: Reload Caddy.
5. **Pruning**: Keep the last N versions (e.g., 5) and delete older ones to save disk space.

#### Rollback Workflow:
1. **Identify**: Find the previous version in the `versions/` directory.
2. **Switch**: Update the symlink `/var/www/sites/{domain}/current` to point to the previous version.
3. **Reload**: Reload Caddy.

### 4. Database Integration
The `orders` table in SQLite will store the `currentVersionID` and a history of `deployedVersions` in the `deploy` metadata field.

## Implementation Steps

1. **Update `lib/site/ssh.ts`**: Add support for symlink creation and directory listing.
2. **Update `lib/site/caddy.ts`**: Point `remoteSiteRootPath` to include `/current`.
3. **Update `scripts/swarm-tools/deploy-site.ts`**: Implement the versioned upload and symlink switch.
4. **New Tool `scripts/swarm-tools/rollback-site.ts`**: Implement the rollback logic.

## Success Criteria

- [ ] Successful deployment creates a new timestamped directory.
- [ ] Rollback tool restores the site to the previous timestamp within seconds.
- [ ] Disk space is managed by pruning old versions.
