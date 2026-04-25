import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { openSshSession } from '../../lib/site/ssh';
import {
  bootstrapCommands,
  generateSiteCaddyConfig,
  remoteSiteConfigPath,
  remoteSiteRootPath,
  remoteSiteVersionsPath,
} from '../../lib/site/caddy';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

const DEFAULT_POC_DOMAINS = [
  'mikes-plumbing-austin.com',
  'glowstudiopdx.com',
  'casabonitatacos.com',
] as const;

const REQUIRED_PAGES = ['index.html', 'about.html', 'services.html', 'contact.html'] as const;

type CliOptions = {
  domains: string[];
  dryRun: boolean;
};

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    domains: [...DEFAULT_POC_DOMAINS],
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (arg === '--domains') {
      const next = argv[i + 1];
      if (!next) throw new Error('Missing value for --domains (expected comma-separated list)');
      options.domains = next
        .split(',')
        .map((d) => d.trim().toLowerCase())
        .filter(Boolean);
      i += 1;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (options.domains.length === 0) {
    throw new Error('No domains to deploy. Use --domains or remove the flag.');
  }

  return options;
}

function printHelp(): void {
  console.log(`Usage: npx tsx scripts/swarm-tools/deploy-poc-sites.ts [options]\n\nOptions:\n  --domains <a,b,c>   Deploy only the provided comma-separated domains\n  --dry-run           Validate local files and print intended actions only\n  --help              Show this message`);
}

function localSiteDir(domain: string): string {
  return path.join(PROJECT_ROOT, 'scripts', 'poc-output', domain);
}

function loadSitePages(domain: string): Record<string, string> {
  const dir = localSiteDir(domain);
  if (!fs.existsSync(dir)) {
    throw new Error(`Missing local site directory: ${dir}. Run node scripts/create-poc-sites.mjs first.`);
  }

  const pages: Record<string, string> = {};
  for (const page of REQUIRED_PAGES) {
    const pagePath = path.join(dir, page);
    if (!fs.existsSync(pagePath)) {
      throw new Error(`Missing required page for ${domain}: ${pagePath}`);
    }
    pages[page] = fs.readFileSync(pagePath, 'utf8');
  }

  return pages;
}

function buildVersionId(): string {
  return new Date().toISOString().replace(/[:\-TZ.]/g, '').slice(0, 14);
}

async function deployDomain(
  session: Awaited<ReturnType<typeof openSshSession>>,
  domain: string,
  pages: Record<string, string>,
): Promise<void> {
  const versionId = buildVersionId();
  const siteRoot = remoteSiteRootPath(domain);
  const versionsDir = remoteSiteVersionsPath(domain);
  const versionPath = `${versionsDir}/${versionId}`;
  const currentSymlink = `${siteRoot}/current`;

  console.log(`[poc-deploy] ${domain}: creating version ${versionId}`);
  await session.runRemoteCommand(`mkdir -p "${versionPath}"`);

  for (const [filename, html] of Object.entries(pages)) {
    await session.uploadFile(`${versionPath}/${filename}`, html);
  }

  await session.runRemoteCommand(`ln -sfn "${versionPath}" "${currentSymlink}"`);

  const caddyConfig = generateSiteCaddyConfig(domain);
  await session.uploadFile(remoteSiteConfigPath(domain), caddyConfig);

  const versions = await session.listDirectory(versionsDir);
  const oldVersions = versions
    .filter((v) => /^\d{14}$/.test(v))
    .sort((a, b) => b.localeCompare(a))
    .slice(5);

  for (const oldVersion of oldVersions) {
    await session.runRemoteCommand(`rm -rf "${versionsDir}/${oldVersion}"`);
  }

  console.log(`[poc-deploy] ${domain}: uploaded ${Object.keys(pages).length} pages`);
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  const sitePayloads = options.domains.map((domain) => ({
    domain,
    pages: loadSitePages(domain),
  }));

  if (options.dryRun) {
    console.log('[poc-deploy] dry run: validated local files');
    for (const site of sitePayloads) {
      console.log(`- ${site.domain}: ${Object.keys(site.pages).join(', ')}`);
    }
    return;
  }

  const session = await openSshSession();
  try {
    for (const command of bootstrapCommands()) {
      await session.runRemoteCommand(command);
    }

    for (const site of sitePayloads) {
      await deployDomain(session, site.domain, site.pages);
    }

    await session.runRemoteCommand('caddy reload --config /etc/caddy/Caddyfile');

    console.log('[poc-deploy] all requested domains deployed successfully');
  } finally {
    session.close();
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[poc-deploy] failed: ${message}`);
  process.exit(1);
});
