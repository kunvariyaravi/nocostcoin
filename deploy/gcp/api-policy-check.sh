#!/bin/bash
# Verify the node's API policy as reached through nginx on this VM.
set -u

HOST="api.nocostcoin.com"
BASE="http://127.0.0.1"
TOKEN="${NOCOSTCOIN_API_TOKEN:-}"

code() {
  curl -s -o /dev/null -w '%{http_code}' "$@"
}

echo "--- reads are public ---"
printf 'GET  /stats          -> %s (expect 200)\n' "$(code -H "Host: $HOST" "$BASE/stats")"
printf 'GET  /health         -> %s (expect 200)\n' "$(code -H "Host: $HOST" "$BASE/health")"
printf 'GET  /consensus      -> %s (expect 200)\n' "$(code -H "Host: $HOST" "$BASE/consensus")"

echo "--- /blocks?limit is clamped ---"
printf 'GET  /blocks?limit=999999 -> %s (expect 200, bounded)\n' \
  "$(code -H "Host: $HOST" "$BASE/blocks?limit=999999")"

echo "--- wallet-spending endpoints require the token ---"
printf 'POST /transaction/create  (no token) -> %s (expect 401)\n' \
  "$(code -X POST -H "Host: $HOST" -H 'Content-Type: application/json' \
        -d '{"receiver":"ab","amount":1}' "$BASE/transaction/create")"
printf 'POST /transaction/create  (token)    -> %s (expect 200/400/500, not 401)\n' \
  "$(code -X POST -H "Host: $HOST" -H 'Content-Type: application/json' \
        -H "Authorization: Bearer $TOKEN" \
        -d '{"receiver":"ab","amount":1}' "$BASE/transaction/create")"
printf 'POST /validator/register  (no token) -> %s (expect 401)\n' \
  "$(code -X POST -H "Host: $HOST" -H 'Content-Type: application/json' \
        -d '{"stake":1000}' "$BASE/validator/register")"
printf 'POST /wallet/new          (no token) -> %s (expect 401)\n' \
  "$(code -X POST -H "Host: $HOST" "$BASE/wallet/new")"

echo "--- faucet is public (enabled by choice) ---"
printf 'POST /faucet              (no token) -> %s (expect 400/500, not 401/403)\n' \
  "$(code -X POST -H "Host: $HOST" -H 'Content-Type: application/json' \
        -d '{"address":"ab"}' "$BASE/faucet")"

echo "--- transaction/send is open (caller-signed) ---"
printf 'POST /transaction/send    (no token) -> %s (expect 400/500, not 401)\n' \
  "$(code -X POST -H "Host: $HOST" -H 'Content-Type: application/json' \
        -d '{}' "$BASE/transaction/send")"
