'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from './ui/Checkbox';

interface ConsentModalProps {
  onAccept: () => void;
}

export default function ConsentModal({ onAccept }: ConsentModalProps) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-lg animate-scale-in border-border bg-white shadow-2xl dark:bg-gray-900">
        <CardHeader className="pb-4">
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <img
              src="https://res.cloudinary.com/dkj22lm1g/image/upload/v1771081619/FalconStream-Pro_jqpcgb.webp"
              alt="FalconStream Pro"
              className="h-14 w-14 rounded-xl object-contain shadow-md"
            />
            <div className="text-center sm:text-left">
              <CardTitle className="text-xl sm:text-2xl">
                FalconStream Pro
              </CardTitle>
              <CardDescription>Legal Disclaimer</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="max-h-60 overflow-y-auto rounded-lg bg-muted p-4 text-sm leading-relaxed text-muted-foreground">
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

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50">
            <Checkbox checked={checked} onChange={setChecked} />
            <span className="text-sm text-muted-foreground">
              I have read and agree to the terms above. I accept full legal
              responsibility for my actions.
            </span>
          </label>

          <Button
            onClick={onAccept}
            disabled={!checked}
            className="w-full py-3 text-sm font-semibold sm:text-base"
            size="lg"
          >
            I Agree &amp; Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
