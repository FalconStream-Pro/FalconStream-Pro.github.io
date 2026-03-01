'use client';

import { useRef, useState } from 'react';
import { PresetPlaylist } from '@/lib/presetPlaylists';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryRowProps {
  title: string;
  presets: PresetPlaylist[];
  onSelect: (preset: PresetPlaylist) => void;
  loadingId: string | null;
}

export default function CategoryRow({ title, presets, onSelect, loadingId }: CategoryRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  };

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <div className="group/row relative mb-6">
      <h3 className="mb-3 px-1 text-base font-semibold text-foreground sm:text-lg">
        {title}
        <span className="ml-2 text-xs font-normal text-muted-foreground">
          {presets.length} {presets.length === 1 ? 'collection' : 'collections'}
        </span>
      </h3>

      <div className="relative">
        {/* Left scroll button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute -left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/90 p-2 shadow-lg ring-1 ring-border backdrop-blur-sm transition-opacity hover:bg-accent sm:opacity-0 sm:group-hover/row:opacity-100"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={updateScrollButtons}
          className="scrollbar-hide flex gap-3 overflow-x-auto scroll-smooth pb-2"
        >
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onSelect(preset)}
              disabled={loadingId !== null}
              aria-label={`Load ${preset.name}`}
              aria-busy={loadingId === preset.id}
              className={cn(
                "group/card flex w-36 shrink-0 flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all sm:w-44 sm:p-4",
                "border-border bg-card hover:border-primary/50 hover:shadow-lg hover:-translate-y-1",
                "disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              )}
            >
              <span className="text-3xl transition-transform group-hover/card:scale-110 sm:text-4xl">
                {preset.icon}
              </span>
              <div className="min-w-0 w-full">
                <p className="truncate text-sm font-semibold text-card-foreground">
                  {preset.name}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {preset.description}
                </p>
              </div>
              {loadingId === preset.id && (
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
              )}
            </button>
          ))}
        </div>

        {/* Right scroll button */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute -right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/90 p-2 shadow-lg ring-1 ring-border backdrop-blur-sm transition-opacity hover:bg-accent sm:opacity-0 sm:group-hover/row:opacity-100"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5 text-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}
