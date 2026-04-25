/** @type {import('next').NextConfig} */
const nextConfig = {
  // Packages with native Node.js addons (.node binaries) must be excluded from
  // the server bundle so Next.js resolves them from node_modules at runtime.
  serverExternalPackages: ['ssh2'],
  // CI and local build pipelines in this repo do not install ESLint.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
