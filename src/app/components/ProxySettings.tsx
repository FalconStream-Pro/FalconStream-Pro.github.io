'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Shield, ShieldCheck, ShieldOff, X, ExternalLink } from 'lucide-react';

export const PRESET_PROXIES = [
  {
    label: 'corsproxy.io',
    value: 'https://corsproxy.io/?url=',
    description: 'Popular public CORS proxy',
  },
  {
    label: 'AllOrigins',
    value: 'https://api.allorigins.win/raw?url=',
    description: 'Open-source CORS proxy',
  },
  {
    label: 'Custom',
    value: '',
    description: 'Enter your own proxy URL',
  },
];

interface ProxySettingsProps {
  open: boolean;
  onClose: () => void;
  proxyEnabled: boolean;
  proxyUrl: string;
  onSave: (enabled: boolean, url: string) => void;
}

export default function ProxySettings({
  open,
  onClose,
  proxyEnabled,
  proxyUrl,
  onSave,
}: ProxySettingsProps) {
  const [enabled, setEnabled] = useState(proxyEnabled);
  const [selectedPreset, setSelectedPreset] = useState(() => {
    const found = PRESET_PROXIES.find((p) => p.value && p.value === proxyUrl);
    return found ? found.value : '';
  });
  const [customUrl, setCustomUrl] = useState(() => {
    const isPreset = PRESET_PROXIES.some((p) => p.value && p.value === proxyUrl);
    return isPreset ? '' : proxyUrl;
  });

  const effectiveUrl = selectedPreset || customUrl.trim();

  const handleSave = () => {
    onSave(enabled, enabled ? effectiveUrl : '');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md rounded-2xl border border-border bg-background p-0 shadow-xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Shield className="h-4 w-4 text-primary" />
            <DialogTitle className="text-sm font-semibold">CORS Proxy Settings</DialogTitle>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-4">
          {/* Explanation */}
          <p className="text-xs leading-relaxed text-muted-foreground">
            Some TV channels are blocked due to geographic restrictions or missing CORS headers.
            Routing stream requests through a CORS proxy can help bypass these limitations.
          </p>

          {/* Enable toggle */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-2">
              {enabled ? (
                <ShieldCheck className="h-4 w-4 text-green-500" />
              ) : (
                <ShieldOff className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm font-medium text-foreground">
                {enabled ? 'Proxy enabled' : 'Proxy disabled'}
              </span>
            </div>
            <button
              onClick={() => setEnabled((v) => !v)}
              role="switch"
              aria-checked={enabled}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                enabled ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Proxy selection */}
          {enabled && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground">
                Select a proxy provider:
              </p>
              <div className="space-y-2">
                {PRESET_PROXIES.map((preset) => (
                  <label
                    key={preset.label}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                      (preset.value && selectedPreset === preset.value) ||
                      (!preset.value && !selectedPreset)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="proxy-preset"
                      className="mt-0.5 accent-primary"
                      checked={
                        preset.value
                          ? selectedPreset === preset.value
                          : !selectedPreset
                      }
                      onChange={() => setSelectedPreset(preset.value)}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {preset.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {preset.value || preset.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              {/* Custom URL input */}
              {!selectedPreset && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Custom proxy base URL
                  </label>
                  <Input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://my-proxy.example.com/?url="
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    The stream URL will be appended (URL-encoded) after this base.
                  </p>
                </div>
              )}

              {/* Preview */}
              {effectiveUrl && (
                <div className="rounded-lg bg-muted/50 px-3 py-2">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Requests will be routed as:
                  </p>
                  <p className="break-all font-mono text-xs text-foreground">
                    {effectiveUrl}
                    <span className="text-primary">{'<stream-url>'}</span>
                  </p>
                </div>
              )}

              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <ExternalLink className="h-3 w-3 shrink-0" />
                For true geo-blocking bypass, host a proxy in the target region or use a VPN.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={enabled && !effectiveUrl}
          >
            Save settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
