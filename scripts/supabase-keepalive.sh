#!/usr/bin/env bash

set -euo pipefail

: "${NEXT_PUBLIC_SUPABASE_URL:?NEXT_PUBLIC_SUPABASE_URL must be set}"
: "${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:?NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set}"

supabase_url="${NEXT_PUBLIC_SUPABASE_URL%/}"

curl --fail --silent --show-error --get --output /dev/null \
  --header "apikey: ${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}" \
  --data-urlencode "select=id" \
  --data-urlencode "limit=1" \
  "${supabase_url}/rest/v1/members"
