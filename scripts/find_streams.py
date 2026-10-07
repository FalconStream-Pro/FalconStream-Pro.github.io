#!/usr/bin/env python3
"""Fetch web pages (and the scripts/iframes they load) and print any stream
URLs found: .m3u8/.mpd links and YouTube video/channel embeds.

Usage: find_streams.py URL [URL ...]
"""
import re
import sys
import urllib.parse
import urllib.request

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                  '(KHTML, like Gecko) Chrome/124.0 Safari/537.36',
}
STREAM_RE = re.compile(r'''https?:[\\/]+[^\s"'<>()]+?\.(?:m3u8|mpd)[^\s"'<>()]*''', re.I)
YOUTUBE_RE = re.compile(r'(?:youtube(?:-nocookie)?\.com/(?:embed|live|channel|watch\?v=)[/=]?|youtu\.be/)[\w\-]+', re.I)
SUBRESOURCE_RE = re.compile(r'''<(?:script|iframe)[^>]+src=["']([^"']+)["']''', re.I)


def fetch(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=20) as res:
        return res.read(3_000_000).decode('utf-8', 'replace')


def scan(url, depth=0, seen=None):
    seen = seen if seen is not None else set()
    if url in seen or depth > 1:
        return
    seen.add(url)
    try:
        text = fetch(url)
    except Exception as e:  # noqa: BLE001 - report any network error
        print(f'  ! {url}: {type(e).__name__}: {str(e)[:80]}')
        return
    for m in sorted(set(STREAM_RE.findall(text))):
        print(f'  stream  {m.replace(chr(92), "")}  (in {url})')
    for m in sorted(set(YOUTUBE_RE.findall(text))):
        print(f'  youtube {m}  (in {url})')
    for src in SUBRESOURCE_RE.findall(text):
        sub = urllib.parse.urljoin(url, src)
        host = urllib.parse.urlparse(sub).netloc
        # Skip common analytics/CDN libraries
        if any(h in host for h in ('google', 'facebook', 'jquery', 'cloudflare', 'jsdelivr', 'doubleclick')):
            continue
        scan(sub, depth + 1, seen)


for page in sys.argv[1:]:
    print(f'== {page}')
    scan(page)
