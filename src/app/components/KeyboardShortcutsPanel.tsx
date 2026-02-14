'use client';

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
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            ⌨️ Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            aria-label="Close shortcuts panel"
          >
            ✕
          </button>
        </div>
        <div className="space-y-2">
          {shortcuts.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {s.description}
              </span>
              <kbd className="rounded-md border border-gray-200 bg-gray-100 px-2 py-1 font-mono text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
