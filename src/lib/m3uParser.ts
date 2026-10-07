export interface Channel {
  id: string;
  name: string;
  url: string;
  logo: string;
  group: string;
  tvgId: string;
  tvgName: string;
}

/**
 * Stable channel id derived from the stream URL, so favorites and history
 * keep pointing at the same channel across reloads and playlists.
 */
export function channelId(url: string): string {
  let h = 2166136261;
  for (let i = 0; i < url.length; i++) {
    h ^= url.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `ch-${(h >>> 0).toString(36)}`;
}

export function parseM3U(content: string): Channel[] {
  const lines = content.split(/\r?\n/);
  const channels: Channel[] = [];
  const seen = new Set<string>();
  let currentMeta: Partial<Channel> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('#EXTINF:')) {
      const nameMatch = line.match(/,([^,]+)$/) || line.match(/,(.+)$/);
      const logoMatch = line.match(/tvg-logo="([^"]*)"/);
      const groupMatch = line.match(/group-title="([^"]*)"/);
      const tvgIdMatch = line.match(/tvg-id="([^"]*)"/);
      const tvgNameMatch = line.match(/tvg-name="([^"]*)"/);

      currentMeta = {
        name: nameMatch ? nameMatch[1].trim() : 'Unknown Channel',
        logo: logoMatch ? logoMatch[1] : '',
        // iptv-org uses "A;B" for multiple categories; the first is enough
        group: groupMatch && groupMatch[1] ? groupMatch[1].split(';')[0].trim() : 'Uncategorized',
        tvgId: tvgIdMatch ? tvgIdMatch[1] : '',
        tvgName: tvgNameMatch ? tvgNameMatch[1] : '',
      };
    } else if (line && !line.startsWith('#') && currentMeta) {
      let id = channelId(line);
      // The same URL listed twice still needs a unique id
      for (let n = 2; seen.has(id); n++) id = `${channelId(line)}-${n}`;
      seen.add(id);
      channels.push({
        id,
        name: currentMeta.name || 'Unknown Channel',
        url: line,
        logo: currentMeta.logo || '',
        group: currentMeta.group || 'Uncategorized',
        tvgId: currentMeta.tvgId || '',
        tvgName: currentMeta.tvgName || '',
      });
      currentMeta = null;
    }
  }

  return channels;
}

/** Split "Hiru TV (360p) [Not 24/7]" into a clean name and its tags. */
export function describeChannel(name: string): { title: string; tags: string[] } {
  const tags: string[] = [];
  const title = name
    .replace(/\(([^)]*)\)|\[([^\]]*)\]/g, (_, a, b) => {
      tags.push((a || b).trim());
      return '';
    })
    .replace(/\s+/g, ' ')
    .trim();
  return { title: title || name, tags };
}
