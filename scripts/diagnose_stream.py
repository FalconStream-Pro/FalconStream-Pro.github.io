#!/usr/bin/env python3
"""Follow an HLS stream hop by hop (master -> variant -> segment) and print
the status, content type and CORS header of each response, as a browser on
https://falconstream-pro.github.io would see them.

Usage: diagnose_stream.py URL [URL ...]
"""
import sys
import urllib.parse
import urllib.request

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                  '(KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    'Origin': 'https://falconstream-pro.github.io',
    'Referer': 'https://falconstream-pro.github.io/',
}


def hop(url, depth):
    pad = '  ' * depth
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=20) as res:
            body = res.read(400_000)
            print(f'{pad}{res.status} {url}')
            print(f'{pad}   final={res.geturl()}')
            print(f'{pad}   content-type={res.headers.get("Content-Type")} '
                  f'acao={res.headers.get("Access-Control-Allow-Origin")} bytes={len(body)}')
    except Exception as e:  # noqa: BLE001 - report any network error
        print(f'{pad}! {url}: {type(e).__name__}: {str(e)[:100]}')
        return
    if not body.lstrip().startswith(b'#EXTM3U') or depth > 3:
        return
    text = body.decode('utf-8', 'replace')
    for line in text.splitlines()[:12]:
        print(f'{pad}   | {line[:150]}')
    uris = [l.strip() for l in text.splitlines() if l.strip() and not l.startswith('#')]
    if uris:
        nxt = uris[0] if '#EXT-X-STREAM-INF' in text else uris[-1]
        hop(urllib.parse.urljoin(res.geturl(), nxt), depth + 1)


for u in sys.argv[1:]:
    print(f'== {u}')
    hop(u, 0)
