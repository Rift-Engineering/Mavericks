#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
OUT_DIR="$ROOT/scripts/demo-video/output"
mkdir -p "$OUT_DIR"

echo "Starting PostgreSQL if needed..."
sudo pg_ctlcluster 16 main start 2>/dev/null || true

echo "Starting Next.js dev server..."
pnpm dev >"$OUT_DIR/dev.log" 2>&1 &
DEV_PID=$!
cleanup() {
  kill "$DEV_PID" 2>/dev/null || true
}
trap cleanup EXIT

for _ in $(seq 1 90); do
  if curl -sf "http://127.0.0.1:3000/login" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
if ! curl -sf "http://127.0.0.1:3000/login" >/dev/null 2>&1; then
  echo "Dev server did not become ready" >&2
  exit 1
fi

echo "Recording screen walkthrough..."
WEBM=$(pnpm exec tsx scripts/demo-video/record-demo.ts | tail -n1)
if [[ ! -f "$WEBM" ]]; then
  echo "Recording failed: $WEBM" >&2
  exit 1
fi
echo "Recorded: $WEBM"

NARR_WAV="$OUT_DIR/narration.wav"
echo "Synthesising voiceover..."
espeak-ng -s 150 -v en-us -f "$ROOT/scripts/demo-video/narration.txt" -w "$NARR_WAV"

DUR_V=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$WEBM")
DUR_A=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$NARR_WAV")

FIT="$OUT_DIR/narration_fit.wav"
python3 - "$NARR_WAV" "$FIT" "$DUR_V" "$DUR_A" <<'PY'
import subprocess
import sys

src, dst, dv, da = sys.argv[1:]
v = float(dv)
a = float(da)
if a <= 0:
    raise SystemExit("bad audio duration")
# ffmpeg atempo: playback speed factor (2.0 = double speed, half duration).
# Fit narration length a into video length v: need factor = a/v.
if abs(a - v) < 0.05:
    subprocess.check_call(["cp", src, dst])
elif a > v:
    factor = a / v
    parts = []
    while factor > 2.0:
        parts.append("atempo=2.0")
        factor /= 2.0
    parts.append(f"atempo={factor:.6f}")
    chain = ",".join(parts)
    subprocess.check_call(["ffmpeg", "-y", "-i", src, "-filter:a", chain, dst])
else:
    pad = v - a
    if pad > 0.05:
        subprocess.check_call(
            ["ffmpeg", "-y", "-i", src, "-af", f"apad=pad_dur={pad}", dst]
        )
    else:
        subprocess.check_call(["cp", src, dst])
PY

DUR_FIT=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$FIT")
echo "Video ${DUR_V}s, narration adjusted to ${DUR_FIT}s (target ${DUR_V}s)"

MP4_OUT="$ROOT/public/tokyo-mavericks-walkthrough.mp4"
echo "Muxing to $MP4_OUT ..."
ffmpeg -y -i "$WEBM" -i "$FIT" -c:v libx264 -preset fast -crf 22 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "$MP4_OUT"

ls -la "$MP4_OUT"
echo "Done."
