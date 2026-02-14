'use client';

import { useRef, useState } from 'react';
import { PresetPlaylist } from '@/lib/presetPlaylists';

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
      <h3 className="mb-3 px-1 text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
        {title}
        <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500">
          {presets.length} {presets.length === 1 ? 'collection' : 'collections'}
        </span>
      </h3>

      <div className="relative">
        {/* Left scroll button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute -left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white opacity-0 shadow-lg backdrop-blur-sm transition-opacity group-hover/row:opacity-100"
            aria-label="Scroll left"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
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
              className="group/card flex w-40 shrink-0 flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 text-center transition-all hover:border-blue-400 hover:shadow-xl hover:-translate-y-1 hover:scale-105 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800/80 dark:hover:border-blue-500 sm:w-44"
            >
              <span className="text-3xl transition-transform group-hover/card:scale-110 sm:text-4xl">
                {preset.icon}
              </span>
              <div className="min-w-0 w-full">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                  {preset.name}
                </p>
                <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">
                  {preset.description}
                </p>
              </div>
              {loadingId === preset.id && (
                <div className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              )}
            </button>
          ))}
        </div>

        {/* Right scroll button */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute -right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white opacity-0 shadow-lg backdrop-blur-sm transition-opacity group-hover/row:opacity-100"
            aria-label="Scroll right"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
