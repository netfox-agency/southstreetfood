#!/usr/bin/env python3
"""Download files listed in tmp/gdown-uber.log directly (bypass gdown rate limit)."""
import os
import re
import sys
import time
import urllib.request
import urllib.error

DEST = "tmp/drive-import/uber south street"
LOG = "tmp/gdown-uber.log"
os.makedirs(DEST, exist_ok=True)

# Parse "Processing file <ID> <filename>"
files = []
with open(LOG) as f:
    for line in f:
        m = re.match(r"^Processing file (\S+) (.+)$", line.rstrip())
        if m:
            fid, fname = m.group(1), m.group(2)
            if fname == ".DS_Store":
                continue
            files.append((fid, fname))

print(f"📥 Downloading {len(files)} files...\n")

ok, skipped, errors = 0, 0, 0
for i, (fid, fname) in enumerate(files, 1):
    out = os.path.join(DEST, fname)
    if os.path.exists(out) and os.path.getsize(out) > 0:
        print(f"  [{i:2}/{len(files)}] ⏭  {fname} (already exists)")
        skipped += 1
        continue

    url = f"https://drive.usercontent.google.com/download?id={fid}&export=download&confirm=t"
    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        })
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read()
        # Sanity check: reject HTML (error page)
        if data[:15].lower().startswith(b"<!doctype html") or data[:6].lower() == b"<html":
            print(f"  [{i:2}/{len(files)}] ❌ {fname} (got HTML)")
            errors += 1
            continue
        with open(out, "wb") as f:
            f.write(data)
        size_kb = len(data) // 1024
        print(f"  [{i:2}/{len(files)}] ✅ {fname} ({size_kb} KB)")
        ok += 1
        time.sleep(0.3)  # gentle rate limit
    except urllib.error.HTTPError as e:
        print(f"  [{i:2}/{len(files)}] ❌ {fname} (HTTP {e.code})")
        errors += 1
    except Exception as e:
        print(f"  [{i:2}/{len(files)}] ❌ {fname} ({e})")
        errors += 1

print(f"\n━━━━━━━━━━━━━━━━━━━━━━━━━━━")
print(f"✅ {ok} downloaded  ⏭ {skipped} skipped  ❌ {errors} errors")
print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━")
sys.exit(0 if errors == 0 else 1)
