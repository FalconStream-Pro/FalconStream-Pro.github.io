'use client';

import { useState } from 'react';

interface ConsentModalProps {
  onAccept: () => void;
}

export default function ConsentModal({ onAccept }: ConsentModalProps) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 sm:p-8">
        <div className="mb-4 flex items-center gap-3">
          <span className="text-3xl">⚠️</span>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
            Legal Disclaimer
          </h2>
        </div>

        <div className="mb-6 max-h-60 overflow-y-auto rounded-lg bg-gray-50 p-4 text-sm leading-relaxed text-gray-700 dark:bg-gray-800 dark:text-gray-300">
          <p className="mb-3">
            <strong>IMPORTANT:</strong> By using this application, you acknowledge
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

        <label className="mb-6 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 accent-blue-600"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            I have read and agree to the terms above. I accept full legal
            responsibility for my actions.
          </span>
        </label>

        <button
          onClick={onAccept}
          disabled={!checked}
          className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40 sm:text-base"
        >
          I Agree &amp; Continue
        </button>
      </div>
    </div>
  );
}
