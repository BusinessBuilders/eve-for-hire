import { renderSitePages } from '../../lib/site/template';
import { openSshSession } from '../../lib/site/ssh';
import {
  generateSiteCaddyConfig,
  remoteSiteConfigPath,
  remoteSiteRootPath,
  remoteSiteVersionsPath,
  bootstrapCommands,
} from '../../lib/site/caddy';
import fs from 'fs';

async function main() {
  const args = process.argv.slice(2);
  const [contentPath, domain] = args;

  if (!contentPath || !domain) {
    console.error('Usage: tsx deploy-site.ts <content.json> <domain>');
    process.exit(1);
  }

  const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
  const pages = renderSitePages(content, domain);

  // Generate version ID (ISO timestamp without symbols)
  const versionId = new Date().toISOString().replace(/[:\-TZ.]/g, '').slice(0, 14);
  console.log(`[swarm-tool] deploying ${domain} (version ${versionId}) to VPS`);

  let session;
  try {
    session = await openSshSession();

    // Bootstrap Caddy directory structure (idempotent).
    for (const cmd of bootstrapCommands()) {
      await session.runRemoteCommand(cmd);
    }

    // Paths
    const siteRoot = remoteSiteRootPath(domain);
    const versionsDir = remoteSiteVersionsPath(domain);
    const currentVersionPath = `${versionsDir}/${versionId}`;
    const currentSymlink = `${siteRoot}/current`;

    // Create directories
    await session.runRemoteCommand(`mkdir -p "${currentVersionPath}"`);

    // Upload all generated pages to the versioned directory
    for (const [filename, html] of Object.entries(pages)) {
      await session.uploadFile(`${currentVersionPath}/${filename}`, html);
    }

    // Atomic switch: Update the 'current' symlink
    // We create a temporary symlink and move it for atomicity if possible, 
    // but ln -sf is usually good enough for static files.
    await session.runRemoteCommand(`ln -sfn "${currentVersionPath}" "${currentSymlink}"`);

    // Write the per-site Caddy config.
    const caddyConfig = generateSiteCaddyConfig(domain);
    await session.uploadFile(remoteSiteConfigPath(domain), caddyConfig);

    // Reload Caddy.
    await session.runRemoteCommand('caddy reload --config /etc/caddy/Caddyfile');

    // Pruning: Keep last 5 versions
    console.log(`[swarm-tool] pruning old versions for ${domain}`);
    const versions = await session.listDirectory(versionsDir);
    const sortedVersions = versions
      .filter(v => /^\d{14}$/.test(v))
      .sort((a, b) => b.localeCompare(a));
    
    if (sortedVersions.length > 5) {
      const toDelete = sortedVersions.slice(5);
      for (const v of toDelete) {
        await session.runRemoteCommand(`rm -rf "${versionsDir}/${v}"`);
      }
    }

    console.log(`[swarm-tool] VPS deploy complete for ${domain} (v${versionId})`);
  } catch (err: any) {
    console.error(`[swarm-tool] SSH deploy failed:`, err.message);
    process.exit(1);
  } finally {
    session?.close();
  }
}

main().catch(console.error);
