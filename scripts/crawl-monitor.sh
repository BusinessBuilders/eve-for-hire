#!/bin/bash
# eve.center Crawl & Index Monitor
# Run on VPS via: bash /var/www/eve-for-hire-app/scripts/crawl-monitor.sh
# Purpose: Track search engine crawler activity and indexing progress

set -euo pipefail

LOG="/var/log/caddy/eve-center.log"
NOW=$(date -u +"%Y-%m-%d %H:%M UTC")

echo "========================================"
echo "eve.center Crawl Monitor — $NOW"
echo "========================================"
echo ""

# --- Real bot IPs (verified via reverse DNS) ---
# Bingbot: 40.77.*.*, 52.167.*.* (Microsoft Azure)
# YandexBot: 87.250.*.*, 95.108.*.*, 213.180.*.*, 5.255.*.*, 141.8.*.*
# Googlebot: 66.249.*.* (googlebot.com)
# Fake Googlebot: 153.66.157.17 (Starlink, NOT Google)

echo "=== SEARCH ENGINE ACTIVITY (last 24h) ==="
echo ""

# Googlebot (real only: 66.249.*)
echo "--- Googlebot (real: 66.249.*) ---"
grep '"remote_ip":"66\.249\.' "$LOG" | python3 -c "
import sys, json
from datetime import datetime
for line in sys.stdin:
    try:
        d = json.loads(line.strip())
        r = d.get('request',{})
        t = datetime.utcfromtimestamp(d.get('ts',0)).strftime('%m-%d %H:%M')
        print(f'  {t}  {r.get(\"remote_ip\",\"?\")}  {r.get(\"uri\",\"?\")}')
    except: pass
" 2>/dev/null | tail -5 || echo "  (no real Googlebot activity)"
echo ""

# Bingbot (real: 40.77.*, 52.167.*)
echo "--- Bingbot (real: 40.77.*, 52.167.*) ---"
grep -E '"remote_ip":"(40\.77|52\.167)\.' "$LOG" | python3 -c "
import sys, json
from datetime import datetime
for line in sys.stdin:
    try:
        d = json.loads(line.strip())
        r = d.get('request',{})
        t = datetime.utcfromtimestamp(d.get('ts',0)).strftime('%m-%d %H:%M')
        print(f'  {t}  {r.get(\"remote_ip\",\"?\")}  {r.get(\"uri\",\"?\")}')
    except: pass
" 2>/dev/null | tail -5 || echo "  (no Bingbot activity)"
echo ""

# YandexBot
echo "--- YandexBot ---"
grep -E '"remote_ip":"(87\.250|95\.108|213\.180|141\.8)\.' "$LOG" | python3 -c "
import sys, json
from datetime import datetime
from collections import Counter
pages = Counter()
for line in sys.stdin:
    try:
        d = json.loads(line.strip())
        r = d.get('request',{})
        uri = r.get('uri','?')
        if uri not in ['/robots.txt','/evecenter2026.txt'] and not uri.startswith('/_next/static'):
            t = datetime.utcfromtimestamp(d.get('ts',0)).strftime('%m-%d %H:%M')
            pages[uri] += 1
    except: pass
for uri, count in pages.most_common(15):
    print(f'  {count:3}x  {uri}')
if not pages:
    print('  (no YandexBot page crawls)')
" 2>/dev/null
echo ""

# --- Pages crawled by at least one real bot ---
echo "=== UNIQUE PAGES CRAWLED BY REAL BOTS ==="
grep -E '"remote_ip":"(40\.77|52\.167|87\.250|95\.108|213\.180|141\.8|66\.249)\.' "$LOG" | python3 -c "
import sys, json
from collections import defaultdict
bot_pages = defaultdict(set)
bot_names = {'40.77': 'Bing', '52.167': 'Bing', '87.250': 'Yandex', '95.108': 'Yandex', '213.180': 'Yandex', '141.8': 'Yandex', '66.249': 'Google'}
for line in sys.stdin:
    try:
        d = json.loads(line.strip())
        r = d.get('request',{})
        uri = r.get('uri','?')
        ip = r.get('remote_ip','?')
        if uri in ['/robots.txt','/evecenter2026.txt'] or uri.startswith('/_next/static') or uri.startswith('/favicon'):
            continue
        prefix = ip.split('.')[0] + '.' + ip.split('.')[1]
        bot = bot_names.get(prefix, '?')
        bot_pages[uri].add(bot)
    except: pass
for uri in sorted(bot_pages.keys()):
    bots = ', '.join(sorted(bot_pages[uri]))
    print(f'  {uri:50s} [{bots}]')
" 2>/dev/null
echo ""

# --- Fake bot / scanner activity ---
echo "=== KNOWN FAKE BOTS / SCANNERS ==="
echo "153.66.157.17 (Starlink, fake Googlebot):"
grep '"remote_ip":"153.66.157.17"' "$LOG" | wc -l | xargs echo "  Total requests:"
echo "5.255.104.172 (mass fingerprint scanner):"
grep '"remote_ip":"5.255.104.172"' "$LOG" | wc -l | xargs echo "  Total requests:"
echo ""

# --- Indexing status check ---
echo "=== QUICK HEALTH CHECK ==="
curl -s -o /dev/null -w "  / → %{http_code} (%{size_download} bytes, %{time_total}s)\n" "https://eve.center/"
curl -s -o /dev/null -w "  /robots.txt → %{http_code}\n" "https://eve.center/robots.txt"
curl -s -o /dev/null -w "  /sitemap.xml → %{http_code}\n" "https://eve.center/sitemap.xml"
curl -s -o /dev/null -w "  /feed.xml → %{http_code}\n" "https://eve.center/feed.xml"
curl -s -o /dev/null -w "  /favicon.ico → %{http_code}\n" "https://eve.center/favicon.ico"

echo ""
echo "========================================"
echo "Monitor complete — $NOW"
echo "========================================"
