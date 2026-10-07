'use client';

import { X } from 'lucide-react';
import type { SavedChannel } from '@/lib/storage';
import ChannelLogo from '../ChannelLogo';

interface SavedRowProps {
  title: string;
  icon: React.ReactNode;
  items: SavedChannel[];
  onOpen: (item: SavedChannel) => void;
  onClear?: () => void;
}

/** Horizontal row of remembered channels (history, favorites). */
export default function SavedRow({ title, icon, items, onOpen, onClear }: SavedRowProps) {
  if (items.length === 0) return null;
  return (
    <section aria-label={title} className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          {icon}
          {title}
        </h2>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>
      <div className="scrollbar-hide fade-x -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onOpen(item)}
            className="group flex w-56 shrink-0 snap-start items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
          >
            <ChannelLogo name={item.name} logo={item.logo} className="h-12 w-12 text-sm" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-foreground">{item.name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {item.playlistName || item.group}
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
