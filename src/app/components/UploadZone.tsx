'use client';

import { useCallback, useState, DragEvent, ChangeEvent } from 'react';

interface UploadZoneProps {
  onFileLoaded: (content: string) => void;
  onUrlLoaded: (content: string) => void;
}

export default function UploadZone({ onFileLoaded, onUrlLoaded }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const readFile = useCallback(
    (file: File) => {
      setError('');
      if (!file.name.match(/\.m3u8?$/i)) {
        setError('Please upload a valid .m3u or .m3u8 file');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) onFileLoaded(text);
      };
      reader.onerror = () => setError('Failed to read file');
      reader.readAsText(file);
    },
    [onFileLoaded]
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) readFile(file);
    },
    [readFile]
  );

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readFile(file);
  };

  const handleUrlFetch = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(url.trim());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      onUrlLoaded(text);
    } catch {
      setError('Failed to fetch playlist from URL. Check the URL or CORS settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col items-center gap-6 p-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`flex w-full max-w-xl cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all sm:p-12 ${
          dragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
            : 'border-gray-300 hover:border-blue-400 dark:border-gray-600 dark:hover:border-blue-500'
        }`}
      >
        <svg
          className="mb-4 h-12 w-12 text-gray-400 dark:text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
        <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Drag &amp; drop your M3U file here
        </p>
        <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
          or click to browse
        </p>
        <label className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
          Browse Files
          <input
            type="file"
            accept=".m3u,.m3u8"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      <div className="w-full max-w-xl">
        <p className="mb-2 text-center text-xs text-gray-500 dark:text-gray-400">
          Or load from URL
        </p>
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/playlist.m3u"
            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleUrlFetch();
            }}
          />
          <button
            onClick={handleUrlFetch}
            disabled={loading || !url.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              'Load'
            )}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-center text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
