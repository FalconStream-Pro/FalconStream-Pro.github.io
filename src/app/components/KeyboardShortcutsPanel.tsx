'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface KeyboardShortcutsPanelProps {
  onClose: () => void;
}

const shortcuts = [
  { key: '↑ / ↓', description: 'Previous / Next channel' },
  { key: 'F', description: 'Toggle fullscreen' },
  { key: 'M', description: 'Toggle mute' },
  { key: 'T', description: 'Toggle dark / light theme' },
  { key: '?', description: 'Toggle this shortcuts panel' },
  { key: 'Esc', description: 'Close this panel' },
];

export default function KeyboardShortcutsPanel({ onClose }: KeyboardShortcutsPanelProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-sm animate-scale-in border-border bg-background p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">
            ⌨️ Keyboard Shortcuts
          </h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Close shortcuts panel"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-1">
          {shortcuts.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-muted"
            >
              <span className="text-sm text-muted-foreground">
                {s.description}
              </span>
              <kbd className="rounded-md border border-border bg-muted px-2 py-1 font-mono text-xs text-foreground">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
