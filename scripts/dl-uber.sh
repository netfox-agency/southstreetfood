#!/usr/bin/env bash
# Download all files listed in tmp/gdown-uber.log via curl (bypasses gdown rate limit + Python SSL issues)
set -u

LOG="tmp/gdown-uber.log"
DEST="tmp/drive-import/uber south street"
mkdir -p "$DEST"

ok=0
skipped=0
errors=0
total=0

# Count first
total=$(grep -cE "^Processing file " "$LOG")
echo "📥 Downloading $total files to: $DEST"
echo

i=0
while IFS= read -r line; do
  if [[ "$line" =~ ^Processing\ file\ ([^ ]+)\ (.+)$ ]]; then
    fid="${BASH_REMATCH[1]}"
    fname="${BASH_REMATCH[2]}"
    i=$((i + 1))

    if [[ "$fname" == ".DS_Store" ]]; then
      continue
    fi

    out="$DEST/$fname"
    if [[ -f "$out" && -s "$out" ]]; then
      printf "  [%2d/%d] ⏭  %s (exists)\n" "$i" "$total" "$fname"
      skipped=$((skipped + 1))
      continue
    fi

    url="https://drive.usercontent.google.com/download?id=${fid}&export=download&confirm=t"
    http_code=$(curl -sSL -o "$out" -w "%{http_code}" \
      -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
      "$url")

    if [[ "$http_code" != "200" ]]; then
      printf "  [%2d/%d] ❌ %s (HTTP %s)\n" "$i" "$total" "$fname" "$http_code"
      rm -f "$out"
      errors=$((errors + 1))
      continue
    fi

    # Reject HTML error pages
    first_bytes=$(head -c 20 "$out" | tr '[:upper:]' '[:lower:]')
    if [[ "$first_bytes" == *"<!doctype html"* || "$first_bytes" == "<html"* ]]; then
      printf "  [%2d/%d] ❌ %s (got HTML)\n" "$i" "$total" "$fname"
      rm -f "$out"
      errors=$((errors + 1))
      continue
    fi

    size=$(stat -f%z "$out" 2>/dev/null || stat -c%s "$out" 2>/dev/null)
    size_kb=$((size / 1024))
    printf "  [%2d/%d] ✅ %s (%d KB)\n" "$i" "$total" "$fname" "$size_kb"
    ok=$((ok + 1))
    sleep 0.3
  fi
done < "$LOG"

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ $ok downloaded  ⏭ $skipped skipped  ❌ $errors errors"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━"
