// pm2 ecosystem config — production deployment for eve.center (VPS)
// Usage:
//   1. Copy .env.example → .env.production and fill in real values
//   2. pm2 start ecosystem.config.js --env production
//   3. pm2 save && pm2 startup   (persist across reboots)
//
// To redeploy after a git pull + build:
//   pm2 reload ecosystem.config.js --env production

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

        // Required: Anthropic AI — Eve's chat interface
        // Get key at https://console.anthropic.com/settings/keys
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',

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
      },
    },
  ],
};
