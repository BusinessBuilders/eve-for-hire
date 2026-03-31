#!/bin/bash
# Recreate the eve-landing nginx proxy container
# Run from VPS as root after any docker reset

set -e

DOMAIN="eve.center"
REPO_DIR="/var/www/eve-for-hire"
NGINX_CONF="$REPO_DIR/deploy/nginx/eve.center.conf"
SSL_DIR="/etc/letsencrypt/eve-center"

echo "Stopping old container (if any)..."
docker stop eve-landing 2>/dev/null || true
docker rm eve-landing 2>/dev/null || true

echo "Starting eve-landing nginx proxy..."
docker run -d \
  --name eve-landing \
  --restart unless-stopped \
  -p 80:80 \
  -p 443:443 \
  -v "$NGINX_CONF:/etc/nginx/conf.d/default.conf:ro" \
  -v "$SSL_DIR:/etc/letsencrypt/eve-center:ro" \
  nginx:alpine

echo "eve-landing started."
docker ps | grep eve-landing
