'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info';
}

let toastListeners: ((msg: ToastMessage) => void)[] = [];

export function showToast(text: string, type: ToastMessage['type'] = 'info') {
  const msg: ToastMessage = { id: `${Date.now()}-${Math.random()}`, text, type };
  toastListeners.forEach((fn) => fn(msg));
}

const icons = { success: CheckCircle2, error: XCircle, info: Info };
const colors = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  info: 'text-primary',
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((msg: ToastMessage) => {
    setToasts((prev) => [...prev.slice(-2), msg]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== msg.id)), 3200);
  }, []);

  useEffect(() => {
    toastListeners.push(addToast);
    return () => {
      toastListeners = toastListeners.filter((fn) => fn !== addToast);
    };
  }, [addToast]);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[80] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6"
    >
      {toasts.map((toast) => {
        const Icon = icons[toast.type];
        return (
          <div
            key={toast.id}
            role={toast.type === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto flex max-w-sm animate-in fade-in-0 slide-in-from-bottom-2 items-center gap-2.5 rounded-2xl border border-border bg-card/95 px-4 py-3 text-sm font-medium text-foreground shadow-xl backdrop-blur"
          >
            <Icon className={cn('h-4 w-4 shrink-0', colors[toast.type])} />
            {toast.text}
          </div>
        );
      })}
    </div>
  );
}
