/**
 * YouTube links in playlists: a channel's live stream or a single video.
 * Supported forms:
 *   https://www.youtube.com/embed/live_stream?channel=UC...
 *   https://www.youtube.com/channel/UC.../live
 *   https://www.youtube.com/watch?v=ID, https://youtu.be/ID
 */
export type YouTubeTarget = { channel: string } | { video: string };

export function parseYouTube(url: string): YouTubeTarget | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^(www|m)\./, '');
  if (host === 'youtu.be') {
    const id = u.pathname.slice(1);
    return /^[\w-]{11}$/.test(id) ? { video: id } : null;
  }
  if (host !== 'youtube.com' && host !== 'youtube-nocookie.com') return null;

  const channel = u.searchParams.get('channel') || u.pathname.match(/^\/channel\/(UC[\w-]{22})/)?.[1];
  if (channel && /^UC[\w-]{22}$/.test(channel)) return { channel };
  const video = u.searchParams.get('v') || u.pathname.match(/^\/(?:embed|live)\/([\w-]{11})$/)?.[1];
  if (video && /^[\w-]{11}$/.test(video)) return { video };
  return null;
}

export function isYouTube(url: string): boolean {
  return parseYouTube(url) !== null;
}

/** Privacy-enhanced embed URL that starts playing straight away. */
export function youTubeEmbedUrl(target: YouTubeTarget, muted: boolean): string {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: muted ? '1' : '0',
    playsinline: '1',
    rel: '0',
    modestbranding: '1',
  });
  if ('channel' in target) {
    params.set('channel', target.channel);
    return `https://www.youtube-nocookie.com/embed/live_stream?${params}`;
  }
  return `https://www.youtube-nocookie.com/embed/${target.video}?${params}`;
}

/** Link to watch on youtube.com, for when embedding is not possible. */
export function youTubeWatchUrl(target: YouTubeTarget): string {
  return 'channel' in target
    ? `https://www.youtube.com/channel/${target.channel}/live`
    : `https://www.youtube.com/watch?v=${target.video}`;
}
