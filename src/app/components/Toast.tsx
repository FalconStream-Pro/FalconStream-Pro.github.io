'use client';

import { useState, useEffect, useCallback } from 'react';

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

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((msg: ToastMessage) => {
    setToasts((prev) => [...prev.slice(-4), msg]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== msg.id));
    }, 3000);
  }, []);

  useEffect(() => {
    toastListeners.push(addToast);
    return () => {
      toastListeners = toastListeners.filter((fn) => fn !== addToast);
    };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`animate-slide-up rounded-lg px-4 py-3 text-sm font-medium shadow-lg backdrop-blur-sm ${
            toast.type === 'success'
              ? 'bg-green-600/90 text-white'
              : toast.type === 'error'
              ? 'bg-red-600/90 text-white'
              : 'bg-gray-800/90 text-white'
          }`}
        >
          {toast.type === 'success' && '✓ '}
          {toast.type === 'error' && '✕ '}
          {toast.text}
        </div>
      ))}
    </div>
  );
}
