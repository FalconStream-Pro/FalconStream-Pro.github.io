#!/usr/bin/env python3
"""Check every stream in an M3U playlist.

For each entry, fetches the playlist, follows master -> variant playlists and
downloads one media segment. Also reports whether a browser could play it
(HTTPS + CORS header), since the web player runs in the browser.

Usage: check_streams.py PLAYLIST.m3u [--write-working OUT.m3u]
Prints a Markdown table; appends it to $GITHUB_STEP_SUMMARY when set.
"""
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                  '(KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    'Origin': 'https://falconstream-pro.github.io',
}
TIMEOUT = 20


def fetch(url, limit=2_000_000):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=TIMEOUT) as res:
        return res.geturl(), res.headers, res.read(limit)


YOUTUBE_CHANNEL_RE = re.compile(r'youtube(?:-nocookie)?\.com/.*(?:channel=|/channel/)(UC[\w-]{22})')


def check_youtube(channel_id):
    """A YouTube channel works if it is live now and allows embedding."""
    headers = {**HEADERS, 'Accept-Language': 'en-US,en;q=0.9', 'Cookie': 'CONSENT=YES+1; SOCS=CAI'}
    try:
        req = urllib.request.Request(f'https://www.youtube.com/channel/{channel_id}/live', headers=headers)
        with urllib.request.urlopen(req, timeout=TIMEOUT) as res:
            html = res.read().decode('utf-8', 'replace')
    except Exception as e:  # noqa: BLE001 - report any network error
        return False, f'YouTube: {type(e).__name__}', 'youtube'
    if '"isLiveNow":true' not in html and '"isLive":true' not in html:
        return False, 'not live on YouTube right now', 'youtube'
    video = re.search(r'"videoId":"([\w-]{11})"', html)
    if not video:
        return False, 'live, but no video id found', 'youtube'
    oembed = ('https://www.youtube.com/oembed?format=json&url='
              + urllib.parse.quote(f'https://www.youtube.com/watch?v={video.group(1)}'))
    try:
        with urllib.request.urlopen(urllib.request.Request(oembed, headers=headers), timeout=TIMEOUT) as res:
            title = json.loads(res.read()).get('title', '')
    except Exception:  # noqa: BLE001 - 401 means embedding is disabled
        return False, 'live, but embedding is disabled', 'youtube'
    return True, f'live: {title[:50]}', 'youtube'


def check(url):
    """Return (ok, detail, cors) for a stream URL."""
    yt = YOUTUBE_CHANNEL_RE.search(url)
    if yt:
        return check_youtube(yt.group(1))
    cors = None
    current = url
    for depth in range(5):
        try:
            final, headers, body = fetch(current)
        except Exception as e:  # noqa: BLE001 - report any network error
            return False, f'{type(e).__name__}: {str(e)[:80]}', cors
        if depth == 0:
            cors = headers.get('Access-Control-Allow-Origin')
        if not body.lstrip().startswith(b'#EXTM3U'):
            if depth == 0:
                return False, 'not an HLS playlist', cors
            if len(body) < 1000:
                return False, f'segment too small ({len(body)} B)', cors
            return True, f'segment OK ({len(body) // 1024} KB)', cors
        text = body.decode('utf-8', 'replace')
        if 'skd://' in text or 'com.widevine' in text or 'METHOD=SAMPLE-AES' in text:
            return False, 'DRM protected', cors
        uris = [l.strip() for l in text.splitlines() if l.strip() and not l.startswith('#')]
        if not uris:
            return False, 'empty playlist', cors
        # Master playlist: first variant. Media playlist: newest segment.
        nxt = uris[0] if '#EXT-X-STREAM-INF' in text else uris[-1]
        current = urllib.parse.urljoin(final, nxt)
    return False, 'too many playlist levels', cors


def parse(path):
    entries, extinf = [], None
    with open(path, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line.startswith('#EXTINF'):
                extinf = line
            elif line and not line.startswith('#') and extinf:
                entries.append((extinf, line))
                extinf = None
    return entries


def main():
    path = sys.argv[1]
    out = sys.argv[sys.argv.index('--write-working') + 1] if '--write-working' in sys.argv else None
    entries = parse(path)
    with ThreadPoolExecutor(max_workers=8) as pool:
        results = list(pool.map(lambda e: check(e[1]), entries))

    rows = ['| Status | Channel | Browser | Detail | URL |', '|---|---|---|---|---|']
    working = []
    for (extinf, url), (ok, detail, cors) in zip(entries, results):
        name = extinf.split(',', 1)[1]
        if cors == 'youtube':
            browser = 'YouTube embed' if ok else '-'
        else:
            browser = 'yes' if ok and url.startswith('https://') and cors else (
                'needs proxy' if ok else '-')
        rows.append(f"| {'✅' if ok else '❌'} | {name} | {browser} | {detail} | {url} |")
        if ok:
            working.append(f'{extinf}\n{url}')
    report = f'### {path}: {len(working)}/{len(entries)} working\n\n' + '\n'.join(rows) + '\n'
    print(report)
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a', encoding='utf-8') as f:
            f.write(report + '\n')
    if out:
        with open(out, 'w', encoding='utf-8') as f:
            f.write('#EXTM3U\n' + '\n'.join(working) + '\n')


if __name__ == '__main__':
    main()
