'use client';

import { useCallback, useState, DragEvent, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Upload, Loader2, Link, AlertCircle } from 'lucide-react';

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
    <div className="flex w-full flex-col items-center gap-6 animate-fade-in">
      <Card
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`flex w-full max-w-xl cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all sm:p-10 ${
          dragging
            ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
            : 'border-border hover:border-primary/40 hover:shadow-md'
        }`}
      >
        <div className="mb-4 rounded-full bg-muted p-3">
          <Upload className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="mb-1 text-sm font-medium text-foreground">
          Drag &amp; drop your M3U file here
        </p>
        <p className="mb-4 text-xs text-muted-foreground">
          Supports .m3u and .m3u8 formats
        </p>
        <label>
          <Button variant="default" size="sm" className="cursor-pointer" asChild>
            <span>Browse Files</span>
          </Button>
          <input
            type="file"
            accept=".m3u,.m3u8"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </Card>

      <div className="w-full max-w-xl space-y-2">
        <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <Link className="h-3 w-3" />
          Or load from URL
        </p>
        <div className="flex gap-2">
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/playlist.m3u"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleUrlFetch();
            }}
          />
          <Button
            onClick={handleUrlFetch}
            disabled={loading || !url.trim()}
            size="default"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Load'
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
