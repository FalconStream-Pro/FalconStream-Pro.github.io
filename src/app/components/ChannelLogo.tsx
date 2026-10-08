'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { describeChannel } from '@/lib/m3uParser';

const PALETTE = [
  'from-indigo-500 to-violet-500',
  'from-sky-500 to-cyan-400',
  'from-emerald-500 to-teal-400',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-fuchsia-500 to-purple-500',
];

function initials(name: string): string {
  const words = describeChannel(name).title.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'TV';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function colorFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

interface ChannelLogoProps {
  name: string;
  logo?: string;
  className?: string;
}

/** Channel logo on a neutral tile, falling back to colored initials. */
export default function ChannelLogo({ name, logo, className }: ChannelLogoProps) {
  const [failed, setFailed] = useState(false);
  const showImage = logo && !failed;

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-xl',
        showImage ? 'bg-white p-1 ring-1 ring-black/5 dark:bg-white/95' : `bg-gradient-to-br ${colorFor(name)}`,
        className,
      )}
      aria-hidden="true"
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="h-full w-full object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-[0.7em] font-bold tracking-wide text-white">{initials(name)}</span>
      )}
    </div>
  );
}
