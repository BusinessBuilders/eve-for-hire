import { renderSitePages } from '../../lib/site/template';
import { openSshSession } from '../../lib/site/ssh';
import {
  generateSiteCaddyConfig,
  remoteSiteConfigPath,
  remoteSiteRootPath,
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

  console.log(`[swarm-tool] deploying ${domain} to VPS`);
  let session;
  try {
    session = await openSshSession();

    // Bootstrap Caddy directory structure (idempotent).
    for (const cmd of bootstrapCommands()) {
      await session.runRemoteCommand(cmd);
    }

    // Create site root directory.
    const siteRoot = remoteSiteRootPath(domain);
    await session.runRemoteCommand(`mkdir -p "${siteRoot}"`);

    // Upload all generated pages.
    for (const [filename, html] of Object.entries(pages)) {
      await session.uploadFile(`${siteRoot}/${filename}`, html);
    }

    // Write the per-site Caddy config.
    const caddyConfig = generateSiteCaddyConfig(domain);
    await session.uploadFile(remoteSiteConfigPath(domain), caddyConfig);

    // Reload Caddy.
    await session.runRemoteCommand('caddy reload --config /etc/caddy/Caddyfile');

    console.log(`[swarm-tool] VPS deploy complete for ${domain}`);
  } catch (err: any) {
    console.error(`[swarm-tool] SSH deploy failed:`, err.message);
    process.exit(1);
  } finally {
    session?.close();
  }
}

main().catch(console.error);
