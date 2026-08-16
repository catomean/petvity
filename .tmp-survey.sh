#!/usr/bin/env bash
# Survey which fleet repos contain commerce code, and how much.
for d in /home/g/dev/*/; do
  n=$(basename "$d")
  files=$(grep -rl --include=*.ts --include=*.tsx -iE "orderItems|order_items|addToCart|checkout|stripe" "$d" 2>/dev/null | grep -v node_modules | grep -v '/\.next/' | wc -l)
  if [ "$files" -gt 0 ]; then
    stripe=$(grep -rl --include=*.ts --include=*.tsx -i "stripe" "$d" 2>/dev/null | grep -v node_modules | grep -v '/\.next/' | wc -l)
    cart=$(grep -rl --include=*.ts --include=*.tsx -iE "addToCart|useCart|cartItem" "$d" 2>/dev/null | grep -v node_modules | grep -v '/\.next/' | wc -l)
    prod=$(grep -rl --include=*.ts --include=*.tsx -iE "priceCents|price_cents" "$d" 2>/dev/null | grep -v node_modules | grep -v '/\.next/' | wc -l)
    printf "%-20s total=%-4s stripe=%-4s cart=%-4s priceCents=%s\n" "$n" "$files" "$stripe" "$cart" "$prod"
  fi
done
