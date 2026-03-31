/** @type {import('next').NextConfig} */
const nextConfig = {
  // Packages with native Node.js addons (.node binaries) must be excluded from
  // the server bundle so Next.js resolves them from node_modules at runtime.
  serverExternalPackages: ['better-sqlite3', 'ssh2'],
};

export default nextConfig;
