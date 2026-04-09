#!/usr/bin/env python3
"""Crop uber south street images to remove pink stripe (left) + size letter (right)."""
from PIL import Image
import os

SRC = "tmp/drive-import/uber south street"
DST = "tmp/drive-import/uber south street cropped"
os.makedirs(DST, exist_ok=True)

# Symmetric crop: keep center 500×600 out of 740×600
# → trim 120px from each side
TRIM_LEFT = 120
TRIM_RIGHT = 120
TRIM_TOP = 0
TRIM_BOTTOM = 0

files = [f for f in sorted(os.listdir(SRC)) if f.lower().endswith((".png", ".jpg", ".jpeg")) and f != ".DS_Store"]
print(f"✂️  Cropping {len(files)} images ({TRIM_LEFT}px L / {TRIM_RIGHT}px R)...\n")

for fname in files:
    src_path = os.path.join(SRC, fname)
    dst_path = os.path.join(DST, fname)

    img = Image.open(src_path)
    w, h = img.size

    left = TRIM_LEFT
    right = w - TRIM_RIGHT
    top = TRIM_TOP
    bottom = h - TRIM_BOTTOM

    if right <= left or bottom <= top:
        print(f"  ⚠️  {fname} too small, skipping ({w}×{h})")
        continue

    cropped = img.crop((left, top, right, bottom))
    cropped.save(dst_path, optimize=True)
    new_w, new_h = cropped.size
    print(f"  ✅ {fname:30} {w}×{h} → {new_w}×{new_h}")

print(f"\n✨ Done. Cropped images in: {DST}")
