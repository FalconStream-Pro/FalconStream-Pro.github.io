'use client';

import { useCallback, useRef, useState, type DragEvent } from 'react';
import { Upload, Link2, Loader2, AlertCircle, FileUp } from 'lucide-react';
import { cn, buildProxiedUrl } from '@/lib/utils';

interface AddPlaylistProps {
  proxyUrl?: string;
  onLoaded: (content: string, source: { name: string; url?: string }) => void;
}

export default function AddPlaylist({ proxyUrl, onLoaded }: AddPlaylistProps) {
  const [dragging, setDragging] = useState(false);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const readFile = useCallback(
    (file: File) => {
      setError('');
      if (!/\.m3u8?$/i.test(file.name)) {
        setError('That file is not a playlist. Choose a .m3u or .m3u8 file.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || '');
        if (!text.includes('#EXTINF')) {
          setError('This file has no channels in it.');
          return;
        }
        onLoaded(text, { name: file.name.replace(/\.m3u8?$/i, '') });
      };
      reader.onerror = () => setError('The file could not be read.');
      reader.readAsText(file);
    },
    [onLoaded],
  );

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  };

  const loadUrl = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const target = url.trim();
    if (!target) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(buildProxiedUrl(target, proxyUrl));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (!text.includes('#EXTINF')) throw new Error('empty');
      let name = 'Playlist';
      try {
        name = decodeURIComponent(new URL(target).pathname.split('/').pop() || '').replace(/\.m3u8?$/i, '') || new URL(target).hostname;
      } catch {
        // keep default name
      }
      onLoaded(text, { name, url: target });
    } catch (err) {
      setError(
        (err as Error).message === 'empty'
          ? 'That URL did not return a playlist with channels.'
          : 'Could not load that URL. Check the address, or turn on the proxy in Settings if the server blocks browsers.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section aria-labelledby="add-title" className="space-y-4">
      <div>
        <h2 id="add-title" className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground">
          <FileUp className="h-5 w-5 text-primary" /> Bring your own playlist
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Files never leave your device. Everything is parsed in your browser.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), fileRef.current?.click())}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 text-center transition',
            dragging ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/40',
          )}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Upload className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-foreground">Drop an .m3u file here</span>
            <span className="block text-xs text-muted-foreground">or click to choose one</span>
          </span>
          <input
            ref={fileRef}
            type="file"
            accept=".m3u,.m3u8,audio/x-mpegurl,application/vnd.apple.mpegurl"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) readFile(f);
              e.target.value = '';
            }}
          />
        </div>

        <form onSubmit={loadUrl} className="flex flex-col justify-center gap-3 rounded-2xl border border-border bg-card p-6">
          <label htmlFor="playlist-url" className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Link2 className="h-4 w-4 text-primary" /> Load from a link
          </label>
          <div className="flex gap-2">
            <input
              id="playlist-url"
              type="url"
              inputMode="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/playlist.m3u"
              className="h-10 min-w-0 flex-1 rounded-xl border border-input bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Load'}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Works with any public M3U / M3U8 playlist URL.</p>
        </form>
      </div>

      {error && (
        <p role="alert" className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </p>
      )}
    </section>
  );
}
