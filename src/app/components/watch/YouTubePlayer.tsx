'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Youtube } from 'lucide-react';
import { parseYouTube, youTubeEmbedUrl, youTubeWatchUrl } from '@/lib/youtube';
import { getMuted } from '@/lib/storage';

interface YouTubePlayerProps {
  url: string;
  channelName: string;
}

/**
 * Plays a broadcaster's official YouTube live stream. YouTube shows its own
 * message when the channel is not live right now.
 */
export default function YouTubePlayer({ url, channelName }: YouTubePlayerProps) {
  const target = parseYouTube(url);
  const [muted, setMuted] = useState(false);
  useEffect(() => setMuted(getMuted()), []);
  if (!target) return null;

  return (
    <div className="space-y-2">
      <div className="relative isolate aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl shadow-black/30 ring-1 ring-white/5">
        <iframe
          key={url}
          src={youTubeEmbedUrl(target, muted)}
          title={`${channelName} live on YouTube`}
          className="h-full w-full"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          data-youtube-player
        />
      </div>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 px-1 text-xs text-muted-foreground">
        <Youtube className="h-4 w-4 text-red-500" />
        Streaming from the channel&apos;s official YouTube live. If it isn&apos;t live right now, YouTube says so in the player.
        <a href={youTubeWatchUrl(target)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-foreground hover:underline">
          Open on YouTube <ExternalLink className="h-3 w-3" />
        </a>
      </p>
    </div>
  );
}
