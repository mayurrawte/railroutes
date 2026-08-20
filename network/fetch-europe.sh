#!/bin/bash
# Fetch European mainline rail from Overpass in 9 tiles, politely (sequential + pauses).
set -u
mkdir -p europe-tiles
TILES=(
  "35,-10,45,5"   "45,-10,55,5"   "55,-10,72,5"
  "35,5,45,18"    "45,5,55,18"    "55,5,72,18"
  "35,18,45,32"   "45,18,55,32"   "55,18,72,32"
)
for t in "${TILES[@]}"; do
  out="europe-tiles/tile_${t//,/;}.json"
  out="${out//;/_}"
  if [ -s "$out" ] && python3 -c "import json,sys; json.load(open('$out'))" 2>/dev/null; then
    echo "SKIP $t (already fetched)"
    continue
  fi
  echo "FETCH $t"
  for attempt in 1 2 3; do
    curl -s --max-time 900 -X POST \
      -d "[out:json][timeout:900][bbox:$t];way[\"railway\"=\"rail\"][\"usage\"=\"main\"];out geom;" \
      https://overpass-api.de/api/interpreter -o "$out"
    if python3 -c "import json,sys; d=json.load(open('$out')); sys.exit(0 if 'elements' in d else 1)" 2>/dev/null; then
      echo "  OK $(du -h "$out" | cut -f1)"
      break
    fi
    echo "  retry $attempt failed; waiting 60s"
    sleep 60
  done
  sleep 30  # be polite between tiles
done
echo "ALL TILES DONE"
ls -lh europe-tiles/
