export interface PresetPlaylist {
  id: string;
  name: string;
  description: string;
  icon: string;
  url: string;
}

export const presetPlaylists: PresetPlaylist[] = [
  {
    id: 'sri-lanka',
    name: 'Sri Lankan Channels',
    description: 'TV channels from Sri Lanka',
    icon: '🇱🇰',
    url: 'https://iptv-org.github.io/iptv/countries/lk.m3u',
  },
  {
    id: 'sports',
    name: 'Sports Channels',
    description: 'Sports channels from around the world',
    icon: '⚽',
    url: 'https://iptv-org.github.io/iptv/categories/sports.m3u',
  },
];
