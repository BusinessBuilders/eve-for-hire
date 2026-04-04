// pm2 ecosystem config — production deployment for eve.center (VPS)
// Usage:
//   1. Copy .env.example → .env.production and fill in real values
//   2. pm2 start ecosystem.config.js --env production
//   3. pm2 save && pm2 startup   (persist across reboots)
//
// To redeploy after a git pull + build:
//   pm2 reload ecosystem.config.js --env production

// Self-load .env.production into process.env so pm2 picks up secrets
// without needing `source .env.production` or export in the shell.
const fs = require('fs');
const path = require('path');
const envFile = path.join(__dirname, '.env.production');
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf8')
    .split('\n')
    .forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eq = trimmed.indexOf('=');
      if (eq === -1) return;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (key) process.env[key] = val; // always re-read .env.production so pm2 reload picks up changes
    });
}

module.exports = {
  apps: [
    {
      name: 'eve-for-hire',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/var/www/eve-for-hire-app',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,

        // Required: OpenClaw HTTP proxy — Eve's AI conversation interface.
        // route.ts POSTs to OPENCLAW_URL/api/chat; the proxy handles the WS gateway internally.
        // The Contabo VPS reaches Nova via a reverse SSH tunnel that Nova maintains:
        //   ssh -N -R 127.0.0.1:8097:127.0.0.1:8097 root@<vps-ip>
        // So the correct VPS value is http://127.0.0.1:8097 (set in .env.production).
        OPENCLAW_TOKEN: process.env.OPENCLAW_TOKEN || '',
        OPENCLAW_URL: process.env.OPENCLAW_URL || 'http://127.0.0.1:8097',

        // Required: Stripe — payments and webhook verification
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',

        // Required: Porkbun — domain registration
        PORKBUN_API_KEY: process.env.PORKBUN_API_KEY || '',
        PORKBUN_SECRET_KEY: process.env.PORKBUN_SECRET_KEY || '',

        // Required: Contabo VPS — site build & deploy pipeline
        CONTABO_VPS_IP: process.env.CONTABO_VPS_IP || '',
        CONTABO_SSH_USER: process.env.CONTABO_SSH_USER || 'root',
        CONTABO_SSH_PORT: process.env.CONTABO_SSH_PORT || '22',
        CONTABO_SSH_PRIVATE_KEY: process.env.CONTABO_SSH_PRIVATE_KEY || '',

        // Site URL — used for Stripe redirect URLs
        NEXT_PUBLIC_BASE_URL: 'https://eve.center',

        // Order database — stored outside app root so redeploys don't wipe orders
        ORDER_DB_PATH: '/var/data/orders.db',

        // Affiliate signups — stored outside app root so redeploys don't wipe data
        AFFILIATES_DATA_PATH: '/var/data/affiliates.json',

        // Admin secret — used to protect GET /api/affiliates (set a strong random string)
        ADMIN_SECRET: process.env.ADMIN_SECRET || '',
      },
    },
  ],
};
