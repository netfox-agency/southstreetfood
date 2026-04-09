#!/usr/bin/env bash
# Download boissons files from the main Drive (not uber subfolder)
set -u

DEST="tmp/drive-import/produits/boissons"
mkdir -p "$DEST"

declare -a FILES=(
  "1Rd_orsQmDDZjwtmG7kwTwQ3qzK2q4sZB|coca cherry.png"
  "1FTwz_5rMKGMwl1BQkTgI7Lc78cpplA1L|coca cola.png"
  "1eevLqSw44NDm2DQ3B2qLKyR4Yw_mVQGh|coca zéro.png"
  "1XGbRPUB2ktgeDHec0j7u3DuAHsk_WqpF|cristaline.png"
  "1j8SHWfj9ytriYqmspZD3ap1JCR7wtNoS|fanta orange.png"
  "1fICp_z61s_rpyz_YZBbI0YYbMqnh5Gqk|hawai.png"
  "1TvxhimCmqhzdcfTua7DzNa7QOUse_Lol|lipton icetea peche.png"
  "1OcnaMWxRyl5Ibq8F2xB_Va7jYwUuxFW6|oasis fraise.png"
  "1nT_2qCeFf87e7wKx2IQqGUvgNMh33url|oasis tropical.png"
  "1mFUt1Gxu4rlTC2o9uBuieeFkkPn_uf_R|orangina.png"
)

total=${#FILES[@]}
echo "📥 Downloading $total drinks to: $DEST"
echo

ok=0
i=0
for entry in "${FILES[@]}"; do
  i=$((i + 1))
  IFS='|' read -r fid fname <<< "$entry"
  out="$DEST/$fname"

  if [[ -f "$out" && -s "$out" ]]; then
    printf "  [%2d/%d] ⏭  %s\n" "$i" "$total" "$fname"
    continue
  fi

  url="https://drive.usercontent.google.com/download?id=${fid}&export=download&confirm=t"
  http_code=$(curl -sSL -o "$out" -w "%{http_code}" \
    -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
    "$url")

  if [[ "$http_code" != "200" ]]; then
    printf "  [%2d/%d] ❌ %s (HTTP %s)\n" "$i" "$total" "$fname" "$http_code"
    rm -f "$out"
    continue
  fi

  size=$(stat -f%z "$out" 2>/dev/null || stat -c%s "$out")
  printf "  [%2d/%d] ✅ %s (%d KB)\n" "$i" "$total" "$fname" $((size / 1024))
  ok=$((ok + 1))
  sleep 0.3
done

echo
echo "✅ $ok/$total downloaded"
