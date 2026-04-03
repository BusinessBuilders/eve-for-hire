#!/usr/bin/env bash
# Eve for Hire — API Smoke Test
# Usage: BASE_URL=https://eve.center ./scripts/smoke-test.sh
# Defaults to http://localhost:3000 if BASE_URL not set.

set -euo pipefail

BASE="${BASE_URL:-http://localhost:3000}"
PASS=0
FAIL=0

GREEN='\033[0;32m'
RED='\033[0;31m'
RESET='\033[0m'

check() {
  local name="$1"
  local expected_status="$2"
  local actual_status="$3"
  local body="$4"

  if [ "$actual_status" = "$expected_status" ]; then
    echo -e "${GREEN}PASS${RESET} [$actual_status] $name"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}FAIL${RESET} [$actual_status != $expected_status] $name"
    echo "      body: ${body:0:200}"
    FAIL=$((FAIL + 1))
  fi
}

echo "Smoke testing $BASE"
echo "---"

# 1. Landing page loads
resp=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/")
check "GET / returns 200" "200" "$resp" ""

# 2. Chat API accepts a message (SSE stream)
body=$(curl -s -o - -w "\n%{http_code}" -X POST "$BASE/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","parts":[{"type":"text","text":"hello"}]}]}')
status=$(echo "$body" | tail -1)
check "POST /api/chat returns 200" "200" "$status" "$body"

# 3. Domain search
body=$(curl -s -o - -w "\n%{http_code}" "$BASE/api/domains/search?q=acme")
status=$(echo "$body" | tail -1)
check "GET /api/domains/search returns 200" "200" "$status" "$body"

# 4. Orders checkout rejects empty body
body=$(curl -s -o - -w "\n%{http_code}" -X POST "$BASE/api/orders/checkout" \
  -H "Content-Type: application/json" \
  -d '{}')
status=$(echo "$body" | tail -1)
check "POST /api/orders/checkout with empty body returns 400" "400" "$status" "$body"

# 5. Orders list returns 200
body=$(curl -s -o - -w "\n%{http_code}" "$BASE/api/orders")
status=$(echo "$body" | tail -1)
check "GET /api/orders returns 200" "200" "$status" "$body"

# 6. Unknown order returns 404
body=$(curl -s -o - -w "\n%{http_code}" "$BASE/api/orders/00000000-0000-0000-0000-000000000000")
status=$(echo "$body" | tail -1)
check "GET /api/orders/fake-id returns 404" "404" "$status" "$body"

# 7. Contact form rejects missing fields
body=$(curl -s -o - -w "\n%{http_code}" -X POST "$BASE/api/contact/example.com" \
  -H "Content-Type: application/json" \
  -d '{"name":""}')
status=$(echo "$body" | tail -1)
check "POST /api/contact/{domain} with missing fields returns 400" "400" "$status" "$body"

# 8. Contact form CORS preflight returns 204
resp=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$BASE/api/contact/example.com" \
  -H "Access-Control-Request-Method: POST")
check "OPTIONS /api/contact/{domain} returns 204" "204" "$resp" ""

echo "---"
echo "Results: ${PASS} passed, ${FAIL} failed"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
