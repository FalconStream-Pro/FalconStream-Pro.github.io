#!/usr/bin/env python3
"""Download channel logos from iptv-org's logo database into the site, so
they load from our own origin instead of hotlinking imgur/Wikimedia.

Usage: fetch_logos.py OUT_DIR TVG_ID [TVG_ID ...]
Writes OUT_DIR/<id>.png (max 256px, transparent background kept), or
OUT_DIR/<id>.svg for vector logos. Needs Pillow.
"""
import csv
import io
import os
import sys
import urllib.request

from PIL import Image

LOGOS_CSV = 'https://raw.githubusercontent.com/iptv-org/database/master/data/logos.csv'
HEADERS = {'User-Agent': 'Mozilla/5.0 (FalconStream logo fetcher)'}

out_dir, ids = sys.argv[1], sys.argv[2:]
os.makedirs(out_dir, exist_ok=True)
with urllib.request.urlopen(urllib.request.Request(LOGOS_CSV, headers=HEADERS), timeout=30) as res:
    rows = list(csv.DictReader(io.StringIO(res.read().decode('utf-8'))))

failed = 0
for cid in ids:
    # Prefer the largest logo listed for the channel
    cands = sorted((r for r in rows if r['channel'] == f'{cid}.lk' and not r['feed']),
                   key=lambda r: int(r['width'] or 0) * int(r['height'] or 0), reverse=True)
    ok = False
    for r in cands:
        try:
            with urllib.request.urlopen(urllib.request.Request(r['url'], headers=HEADERS), timeout=30) as res:
                data = res.read()
            if data.lstrip()[:5] in (b'<?xml', b'<svg ') or b'<svg' in data[:500]:
                with open(os.path.join(out_dir, f'{cid}.svg'), 'wb') as f:
                    f.write(data)
            else:
                img = Image.open(io.BytesIO(data))
                img = img.convert('RGBA')
                img.thumbnail((256, 256))
                img.save(os.path.join(out_dir, f'{cid}.png'), optimize=True)
            print(f'ok   {cid:<18} {r["url"]}')
            ok = True
            break
        except Exception as e:  # noqa: BLE001 - try the next candidate
            print(f'skip {cid:<18} {r["url"]}: {type(e).__name__}: {str(e)[:80]}')
    if not ok:
        failed += 1
        print(f'FAIL {cid}: no logo could be downloaded')
# Channels without a logo fall back to initials in the UI
print(f'{failed} channel(s) without a logo')
