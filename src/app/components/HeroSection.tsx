'use client';

import { useState, useEffect } from 'react';
import { PresetPlaylist } from '@/lib/presetPlaylists';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play } from 'lucide-react';

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
    <div className="relative mb-8 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 shadow-xl">
      {/* Animated gradient overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.3),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(147,51,234,0.2),transparent_50%)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

      <div className="relative flex flex-col items-start gap-3 px-5 py-8 sm:gap-4 sm:px-10 sm:py-14 md:py-16">
        <Badge variant="secondary" className="border-white/20 bg-white/10 text-white/90 backdrop-blur-sm">
          <span className="inline-block mr-1.5 h-2 w-2 animate-pulse rounded-full bg-red-500" />
          FEATURED
        </Badge>

        <div className="flex items-center gap-3 sm:gap-4">
          <span className="text-4xl sm:text-5xl md:text-6xl">{current.icon}</span>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-white sm:text-2xl md:text-4xl">
              {current.name}
            </h2>
            <p className="mt-0.5 text-sm text-gray-300 sm:mt-1 sm:text-base">{current.description}</p>
          </div>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-2 sm:mt-2 sm:gap-3">
          <Button
            onClick={() => onSelect(current)}
            disabled={loading}
            variant="secondary"
            size="lg"
            className="bg-white text-gray-900 shadow-lg hover:bg-gray-100"
          >
            <Play className="mr-2 h-4 w-4 fill-current" />
            Browse Channels
          </Button>
          {current.region && (
            <Badge variant="secondary" className="border-white/10 bg-white/10 text-white/70 backdrop-blur-sm">
              {current.region}
            </Badge>
          )}
        </div>

        {/* Dots indicator */}
        {featured.length > 1 && (
          <div className="mt-3 flex gap-2 sm:mt-4">
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
