import { createContext, useContext, useState, useCallback } from 'react';

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      {label && <span className="label">{label}</span>}
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-faint">{hint}</span>}
    </label>
  );
}

const STATUS_STYLES = {
  VERIFIED: 'bg-emerald-50 text-emerald-700',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  PENDING: 'bg-amber-50 text-amber-700',
  UNRECONCILED: 'bg-rose-50 text-rose-700',
  DUPLICATE: 'bg-slate-100 text-slate-600',
  EXPIRED: 'bg-slate-100 text-slate-500',
  CANCELLED: 'bg-slate-100 text-slate-500',
};

export function StatusPill({ status }) {
  const cls = STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-600';
  return (
    <span className={`chip ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}

export function Empty({ title, children }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl2 border border-dashed border-black/10 px-6 py-14 text-center">
      <p className="text-sm font-semibold text-ink">{title}</p>
      {children && <p className="mt-1 max-w-sm text-sm text-ink-faint">{children}</p>}
    </div>
  );
}

export function Spinner({ className = 'h-5 w-5' }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

// Minimal toast system.
const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, tone = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex flex-col items-center gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-pop ${
              t.tone === 'error' ? 'bg-rose-600' : t.tone === 'success' ? 'bg-emerald-600' : 'bg-ink'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
