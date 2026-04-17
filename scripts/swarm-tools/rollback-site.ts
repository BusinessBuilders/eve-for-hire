import { openSshSession } from '../../lib/site/ssh';
import {
  remoteSiteRootPath,
  remoteSiteVersionsPath,
} from '../../lib/site/caddy';

async function main() {
  const args = process.argv.slice(2);
  const [domain, versionId] = args;

  if (!domain) {
    console.error('Usage: tsx rollback-site.ts <domain> [versionId]');
    console.log('If versionId is omitted, it rolls back to the previous version.');
    process.exit(1);
  }

  console.log(`[swarm-tool] rolling back ${domain}...`);
  let session;
  try {
    session = await openSshSession();

    const siteRoot = remoteSiteRootPath(domain);
    const versionsDir = remoteSiteVersionsPath(domain);
    const currentSymlink = `${siteRoot}/current`;

    let targetVersion = versionId;

    if (!targetVersion) {
      // Find the previous version
      const versions = await session.listDirectory(versionsDir);
      const sortedVersions = versions
        .filter(v => /^\d{14}$/.test(v))
        .sort((a, b) => b.localeCompare(a));

      if (sortedVersions.length < 2) {
        console.error(`[swarm-tool] No previous version found for ${domain}`);
        process.exit(1);
      }

      // The current version is sortedVersions[0], previous is sortedVersions[1]
      targetVersion = sortedVersions[1];
    }

    const targetVersionPath = `${versionsDir}/${targetVersion}`;
    console.log(`[swarm-tool] switching ${domain} to version ${targetVersion}`);

    // Update the symlink
    await session.runRemoteCommand(`ln -sfn "${targetVersionPath}" "${currentSymlink}"`);

    // Reload Caddy.
    await session.runRemoteCommand('caddy reload --config /etc/caddy/Caddyfile');

    console.log(`[swarm-tool] Rollback complete for ${domain} to version ${targetVersion}`);
  } catch (err: any) {
    console.error(`[swarm-tool] Rollback failed:`, err.message);
    process.exit(1);
  } finally {
    session?.close();
  }
}

main().catch(console.error);
