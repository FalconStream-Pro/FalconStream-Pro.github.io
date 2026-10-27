#!/usr/bin/env python3
"""List Sri Lankan radio stations from radio-browser.info as an M3U playlist.

Keeps stations a browser on an HTTPS site can play: HTTPS stream URL, an MP3
or AAC (or HLS) stream, and not marked broken by radio-browser's own checks.
Entries are tagged radio="true" so the player uses the browser's audio player.

Usage: find_radio.py OUT.m3u [COUNTRY_CODE]
"""
import json
import sys
import urllib.request

MIRRORS = ['de1', 'de2', 'fi1', 'nl1', 'at1']
HEADERS = {'User-Agent': 'FalconStreamPro/1.0 (stream finder)'}
PLAYABLE = {'MP3', 'AAC', 'AAC+', 'OGG'}


def stations(country):
    for m in MIRRORS:
        url = (f'https://{m}.api.radio-browser.info/json/stations/bycountrycodeexact/{country}'
               '?hidebroken=true&order=clickcount&reverse=true')
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=30) as res:
                return json.load(res)
        except Exception as e:  # noqa: BLE001 - try the next mirror
            print(f'! {m}: {type(e).__name__}: {e}', file=sys.stderr)
    return []


def main():
    out = sys.argv[1]
    country = sys.argv[2] if len(sys.argv) > 2 else 'LK'
    rows, seen, lines = [], set(), ['#EXTM3U']
    found = stations(country)
    for s in found:
        url = (s.get('url_resolved') or s.get('url') or '').strip()
        codec = (s.get('codec') or '').upper()
        hls = s.get('hls') == 1 or '.m3u8' in url
        ok = url.startswith('https://') and (hls or codec in PLAYABLE) and s.get('lastcheckok') == 1
        name = ' '.join(s.get('name', '').split())
        rows.append(f"| {'✅' if ok else '-'} | {name} | {codec or '?'} | {s.get('bitrate') or '?'} | "
                    f"{s.get('votes')} | {s.get('clickcount')} | {url} |")
        if not ok or url in seen:
            continue
        seen.add(url)
        logo = s.get('favicon') or ''
        if not logo.startswith('https://'):
            logo = ''
        radio = '' if hls else ' radio="true"'
        lines.append(f'#EXTINF:-1 tvg-id="" tvg-logo="{logo}" group-title="Radio"{radio},{name}')
        lines.append(url)
    with open(out, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines) + '\n')
    report = (f'### radio-browser.info stations for {country}: {len(found)} listed, '
              f'{len(seen)} playable on an HTTPS site\n\n'
              '| Kept | Station | Codec | kbps | Votes | Clicks | URL |\n|---|---|---|---|---|---|---|\n'
              + '\n'.join(rows) + '\n')
    print(report)
    print(open(out, encoding='utf-8').read())


if __name__ == '__main__':
    main()
