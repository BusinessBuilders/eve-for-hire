#!/bin/bash
# Test script for contact form API (BUS-170)

DOMAIN="mikes-plumbing-austin.com"

# Find which port Next.js is actually using
PORT=3000
if grep -q "Local:        http://localhost:3001" dev.log; then
  PORT=3001
elif grep -q "Local:        http://localhost:3000" dev.log; then
  PORT=3000
fi

URL="http://localhost:$PORT/api/contact/$DOMAIN"

echo "Testing contact form for $DOMAIN..."
echo "Target URL: $URL"

RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "message": "This is a test message from the verification script."
  }' \
  "$URL")

echo "Response: $RESPONSE"

if [[ "$RESPONSE" == *"\"ok\":true"* ]]; then
  echo "✅ Success! Contact form API is functional."
  exit 0
else
  echo "❌ Failed! Response did not contain 'ok:true'."
  # Show logs if failed
  echo "Last 10 lines of dev.log:"
  tail -n 10 dev.log
  exit 1
fi
