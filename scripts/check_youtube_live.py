#!/usr/bin/env python3
"""Report whether YouTube channels are live right now.

Fetches https://www.youtube.com/channel/<id>/live (or /@handle/live) and
reads the channel id, name and live status from the page.
Usage: check_youtube_live.py CHANNEL_ID|@handle|VIDEO_ID [...]
"""
import re
import sys
import urllib.request

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                  '(KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    # Skip the EU cookie consent interstitial
    'Cookie': 'CONSENT=YES+1; SOCS=CAI',
}

print('| Query | Channel id | Channel name | Live now | Video |')
print('|---|---|---|---|---|')
for cid in sys.argv[1:]:
    try:
        if cid.startswith('@'):
            url = f'https://www.youtube.com/{cid}/live'
        elif re.fullmatch(r'[\w-]{11}', cid):
            url = f'https://www.youtube.com/watch?v={cid}'
        else:
            url = f'https://www.youtube.com/channel/{cid}/live'
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=20) as res:
            html = res.read().decode('utf-8', 'replace')
    except Exception as e:  # noqa: BLE001 - report any network error
        print(f'| {cid} | | ! {type(e).__name__}: {str(e)[:60]} | | |')
        continue
    name = re.search(r'<meta property="og:title" content="([^"]*)"', html)
    owner = re.search(r'"ownerChannelName":"([^"]*)"', html) or re.search(r'"author":"([^"]*)"', html)
    live = '"isLiveNow":true' in html or '"isLive":true' in html
    video = re.search(r'"videoId":"([\w-]{11})"', html)
    channel_id = re.search(r'"(?:externalId|channelId)":"(UC[\w-]{22})"', html)
    print(f'| {cid} | {channel_id.group(1) if channel_id else "?"} | {(owner or name).group(1) if (owner or name) else "?"} | '
          f'{"yes" if live else "no"} | {video.group(1) if video and live else ""} |')
