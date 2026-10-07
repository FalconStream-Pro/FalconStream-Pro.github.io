'use client';

import { Search, Sun, Moon, Keyboard, Shield, ShieldCheck, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export const LOGO_URL =
  'https://res.cloudinary.com/dkj22lm1g/image/upload/v1771081619/FalconStream-Pro_jqpcgb.webp';

interface AppHeaderProps {
  isDark: boolean;
  proxyEnabled: boolean;
  watching: boolean;
  onHome: () => void;
  onSearch: () => void;
  onProxy: () => void;
  onShortcuts: () => void;
  onToggleTheme: () => void;
}

function HeaderButton({
  label, onClick, children, className,
}: { label: string; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground',
        className,
      )}
    >
      {children}
    </button>
  );
}

export default function AppHeader({
  isDark, proxyEnabled, watching, onHome, onSearch, onProxy, onShortcuts, onToggleTheme,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-2 px-3 sm:gap-4 sm:px-6">
        {watching && (
          <HeaderButton label="Back to playlists" onClick={onHome} className="-ml-1">
            <ArrowLeft className="h-5 w-5" />
          </HeaderButton>
        )}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onHome();
          }}
          className="flex shrink-0 items-center gap-2.5 rounded-xl pr-2"
          aria-label="FalconStream Pro home"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_URL} alt="" className="h-9 w-9 rounded-xl object-contain" />
          <span className="hidden text-base font-semibold tracking-tight text-foreground sm:block">
            FalconStream <span className="text-primary">Pro</span>
          </span>
        </a>

        <button
          type="button"
          onClick={onSearch}
          className="mx-auto flex h-10 w-full max-w-md items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="truncate">Search channels & playlists…</span>
          <kbd className="ml-auto hidden shrink-0 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium sm:inline">
            Ctrl K
          </kbd>
        </button>

        <nav aria-label="Settings" className="flex shrink-0 items-center gap-0.5">
          <HeaderButton
            label={proxyEnabled ? 'Proxy is on – settings' : 'Proxy settings'}
            onClick={onProxy}
            className={proxyEnabled ? 'text-emerald-500 hover:text-emerald-400' : ''}
          >
            {proxyEnabled ? <ShieldCheck className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
          </HeaderButton>
          <HeaderButton label="Keyboard shortcuts (?)" onClick={onShortcuts} className="hidden md:flex">
            <Keyboard className="h-5 w-5" />
          </HeaderButton>
          <HeaderButton label={isDark ? 'Switch to light theme' : 'Switch to dark theme'} onClick={onToggleTheme}>
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </HeaderButton>
        </nav>
      </div>
    </header>
  );
}
