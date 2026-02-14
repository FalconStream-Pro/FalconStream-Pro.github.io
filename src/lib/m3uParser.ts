export interface Channel {
  id: string;
  name: string;
  url: string;
  logo: string;
  group: string;
  tvgId: string;
  tvgName: string;
}

export function parseM3U(content: string): Channel[] {
  const lines = content.split(/\r?\n/);
  const channels: Channel[] = [];
  let currentMeta: Partial<Channel> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('#EXTINF:')) {
      const nameMatch = line.match(/,(.+)$/);
      const logoMatch = line.match(/tvg-logo="([^"]*)"/);
      const groupMatch = line.match(/group-title="([^"]*)"/);
      const tvgIdMatch = line.match(/tvg-id="([^"]*)"/);
      const tvgNameMatch = line.match(/tvg-name="([^"]*)"/);

      currentMeta = {
        name: nameMatch ? nameMatch[1].trim() : 'Unknown Channel',
        logo: logoMatch ? logoMatch[1] : '',
        group: groupMatch ? groupMatch[1] : 'Uncategorized',
        tvgId: tvgIdMatch ? tvgIdMatch[1] : '',
        tvgName: tvgNameMatch ? tvgNameMatch[1] : '',
      };
    } else if (line && !line.startsWith('#') && currentMeta) {
      channels.push({
        id: `ch-${channels.length}`,
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
