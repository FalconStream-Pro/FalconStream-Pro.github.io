'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Keyboard, X } from 'lucide-react';

interface KeyboardShortcutsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const groups = [
  {
    title: 'Playback',
    items: [
      { keys: ['Space', 'K'], description: 'Play / pause' },
      { keys: ['M'], description: 'Mute / unmute' },
      { keys: ['F'], description: 'Full screen' },
      { keys: ['P'], description: 'Picture in picture' },
    ],
  },
  {
    title: 'Channels',
    items: [
      { keys: ['↑', '↓'], description: 'Previous / next channel' },
      { keys: ['/'], description: 'Search this playlist' },
    ],
  },
  {
    title: 'App',
    items: [
      { keys: ['Ctrl', 'K'], description: 'Search everything' },
      { keys: ['T'], description: 'Light / dark theme' },
      { keys: ['?'], description: 'Show this panel' },
    ],
  },
];

export default function KeyboardShortcutsPanel({ open, onOpenChange }: KeyboardShortcutsPanelProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-card p-6 shadow-2xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <div className="mb-5 flex items-center justify-between">
            <DialogPrimitive.Title className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Keyboard className="h-5 w-5 text-primary" /> Keyboard shortcuts
            </DialogPrimitive.Title>
            <DialogPrimitive.Close className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close">
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Description className="sr-only">Keyboard shortcuts available in FalconStream Pro</DialogPrimitive.Description>
          <div className="space-y-5">
            {groups.map((g) => (
              <div key={g.title}>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{g.title}</p>
                <div className="space-y-1">
                  {g.items.map((s) => (
                    <div key={s.description} className="flex items-center justify-between rounded-xl px-2 py-1.5 text-sm">
                      <span className="text-foreground">{s.description}</span>
                      <span className="flex gap-1">
                        {s.keys.map((k) => (
                          <kbd key={k} className="min-w-7 rounded-md border border-border bg-muted px-1.5 py-0.5 text-center text-xs text-foreground">
                            {k}
                          </kbd>
                        ))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
