'use client';

import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Checkbox } from './ui/Checkbox';
import { LOGO_URL } from './AppHeader';

interface ConsentModalProps {
  onAccept: () => void;
}

export default function ConsentModal({ onAccept }: ConsentModalProps) {
  const [checked, setChecked] = useState(false);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-0 backdrop-blur-md sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-title"
    >
      <div className="w-full max-w-lg animate-in fade-in-0 slide-in-from-bottom-4 rounded-t-3xl border border-border bg-card shadow-2xl sm:rounded-3xl">
        <div className="flex items-center gap-4 border-b border-border p-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_URL} alt="" className="h-14 w-14 rounded-2xl object-contain shadow-md" />
          <div>
            <h2 id="consent-title" className="text-xl font-semibold tracking-tight text-foreground">
              Welcome to FalconStream Pro
            </h2>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <ShieldAlert className="h-4 w-4" /> Please read before continuing
            </p>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <div className="scrollbar-thin max-h-56 overflow-y-auto rounded-2xl bg-muted/60 p-4 text-sm leading-relaxed text-muted-foreground">
            <p className="mb-3">
              <strong className="text-foreground">IMPORTANT:</strong> By using this application, you acknowledge
              and agree that:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>You are solely responsible for the content you access through this player.</li>
              <li>You own or have the legal right to stream any content accessed via uploaded M3U files.</li>
              <li>The developers and maintainers of this application assume NO LIABILITY for any content streamed through this player.</li>
              <li>You are responsible for ensuring your use complies with all applicable copyright laws and regulations.</li>
              <li>This application is a media player tool only and does not host, provide, or endorse any streaming content.</li>
              <li>Any misuse of this application for accessing unauthorized content is strictly prohibited.</li>
            </ul>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border p-4 transition hover:bg-muted/50">
            <Checkbox checked={checked} onChange={setChecked} />
            <span className="text-sm text-muted-foreground">
              I have read and agree to the terms above. I accept full legal
              responsibility for my actions.
            </span>
          </label>

          <button
            type="button"
            onClick={onAccept}
            disabled={!checked}
            className="h-12 w-full rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            I Agree &amp; Continue
          </button>
        </div>
      </div>
    </div>
  );
}
