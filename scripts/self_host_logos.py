#!/usr/bin/env python3
"""Copy the logos a playlist hotlinks into the site and point the playlist at
the copies, so they load from our own origin.

Usage: self_host_logos.py PLAYLIST.m3u OUT_DIR URL_PREFIX
For each entry whose tvg-logo is an http(s) URL, saves OUT_DIR/<tvg-id>.png
(max 256px, at least 48px) or .svg and rewrites tvg-logo to URL_PREFIX/<file>. Logos that
cannot be downloaded are cleared, so the site shows the station's initials
instead of a broken image. Needs Pillow.
"""
import io
import os
import re
import sys
import urllib.request

from PIL import Image

HEADERS = {'User-Agent': 'Mozilla/5.0 (FalconStream logo fetcher)'}


def save(data, dest_base):
    if b'<svg' in data[:1000]:
        with open(dest_base + '.svg', 'wb') as f:
            f.write(data)
        return dest_base + '.svg'
    img = Image.open(io.BytesIO(data))
    if img.format == 'ICO':
        # Use the largest icon in the file
        img.size = max(img.ico.sizes())
    if max(img.size) < 48:
        # Too small to show well (also Google's generic globe for unknown sites)
        raise ValueError(f'logo too small ({img.size[0]}x{img.size[1]})')
    img = img.convert('RGBA')
    img.thumbnail((256, 256))
    img.save(dest_base + '.png', optimize=True)
    return dest_base + '.png'


def main():
    playlist, out_dir, prefix = sys.argv[1], sys.argv[2], sys.argv[3].rstrip('/')
    os.makedirs(out_dir, exist_ok=True)
    lines = open(playlist, encoding='utf-8').read().split('\n')
    for i, line in enumerate(lines):
        if not line.startswith('#EXTINF'):
            continue
        logo = re.search(r'tvg-logo="([^"]*)"', line)
        tid = re.search(r'tvg-id="([^".]+)', line)
        if not logo or not tid or not logo.group(1).startswith('http'):
            continue
        url = logo.group(1)
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=30) as res:
                data = res.read()
            path = save(data, os.path.join(out_dir, tid.group(1)))
            new = f'{prefix}/{os.path.basename(path)}'
            print(f'ok   {tid.group(1):<16} {url}')
        except Exception as e:  # noqa: BLE001 - fall back to initials
            new = ''
            print(f'skip {tid.group(1):<16} {url}: {type(e).__name__}: {str(e)[:80]}')
        lines[i] = line.replace(f'tvg-logo="{url}"', f'tvg-logo="{new}"')
    with open(playlist, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))


if __name__ == '__main__':
    main()
