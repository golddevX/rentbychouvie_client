'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';

type ToastTone = 'success' | 'error' | 'info';

type Toast = {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
};

type ToastContextValue = {
  pushToast: (toast: Omit<Toast, 'id'>) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function toneClass(tone: ToastTone) {
  if (tone === 'success') return 'border-emerald-200 bg-emerald-50 text-emerald-900';
  if (tone === 'error') return 'border-rose-200 bg-rose-50 text-rose-900';
  return 'border-stone-200 bg-white text-stone-900';
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = (toast: Omit<Toast, 'id'>) => {
    const next = { ...toast, id: Date.now() + Math.floor(Math.random() * 1000) };
    setToasts((current) => [...current, next]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== next.id));
    }, 3200);
  };

  const value = useMemo(() => ({ pushToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[90] flex w-[min(92vw,380px)] flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-[22px] border px-4 py-4 shadow-[var(--shadow-soft)] ${toneClass(toast.tone)}`}
          >
            <p className="text-sm font-semibold">{toast.title}</p>
            {toast.description ? (
              <p className="mt-1 text-sm leading-6 text-current/75">{toast.description}</p>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside ToastProvider');
  }
  return context;
}
