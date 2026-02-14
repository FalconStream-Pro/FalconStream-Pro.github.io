'use client';

import { useState, useEffect } from 'react';
import { PresetPlaylist } from '@/lib/presetPlaylists';

interface HeroSectionProps {
  featured: PresetPlaylist[];
  onSelect: (preset: PresetPlaylist) => void;
  loading: boolean;
}

export default function HeroSection({ featured, onSelect, loading }: HeroSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (featured.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % featured.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [featured.length]);

  const current = featured[activeIndex];
  if (!current) return null;

  return (
    <div className="relative mb-8 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-purple-900 to-indigo-900">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.3),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(147,51,234,0.2),transparent_50%)]" />

      <div className="relative flex flex-col items-start gap-4 px-6 py-10 sm:px-10 sm:py-14 md:py-16">
        <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          FEATURED
        </div>

        <div className="flex items-center gap-4">
          <span className="text-5xl sm:text-6xl">{current.icon}</span>
          <div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">
              {current.name}
            </h2>
            <p className="mt-1 text-sm text-gray-300 sm:text-base">{current.description}</p>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-3">
          <button
            onClick={() => onSelect(current)}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 transition-all hover:bg-gray-100 disabled:opacity-50 sm:px-6 sm:py-3 sm:text-base"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Browse Channels
          </button>
          {current.region && (
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/70 backdrop-blur-sm sm:text-sm">
              {current.region}
            </span>
          )}
        </div>

        {/* Dots indicator */}
        {featured.length > 1 && (
          <div className="mt-4 flex gap-2">
            {featured.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === activeIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Show featured item ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
