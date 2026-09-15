import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X, ExternalLink } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  txSignature?: string;
  cluster?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => string;
  removeToast: (id: string) => void;
  success: (title: string, description?: string, txSignature?: string) => string;
  error: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newToast: ToastMessage = { ...toast, id };

    setToasts((prev) => [newToast, ...prev].slice(0, 5));

    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, [removeToast]);

  const success = useCallback((title: string, description?: string, txSignature?: string) => {
    return addToast({ type: 'success', title, description, txSignature });
  }, [addToast]);

  const error = useCallback((title: string, description?: string) => {
    return addToast({ type: 'error', title, description, duration: 8000 });
  }, [addToast]);

  const warning = useCallback((title: string, description?: string) => {
    return addToast({ type: 'warning', title, description });
  }, [addToast]);

  const info = useCallback((title: string, description?: string) => {
    return addToast({ type: 'info', title, description });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      {/* Toast Render Portal */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-3 sm:px-0">
        {toasts.map((toast) => {
          const typeStyles = {
            success: 'border-emerald-500/40 bg-[#0d1714] text-emerald-300',
            error: 'border-rose-500/40 bg-[#1a0f14] text-rose-300',
            warning: 'border-amber-500/40 bg-[#19140c] text-amber-300',
            info: 'border-zinc-700/60 bg-[#0e131d] text-zinc-300',
          }[toast.type];

          const IconComponent = {
            success: CheckCircle2,
            error: AlertCircle,
            warning: AlertTriangle,
            info: Info,
          }[toast.type];

          const iconColor = {
            success: 'text-emerald-400',
            error: 'text-rose-400',
            warning: 'text-amber-400',
            info: 'text-sky-400',
          }[toast.type];

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto rounded-lg border p-3.5 shadow-xl backdrop-blur-md transition-all flex items-start gap-3 ${typeStyles}`}
            >
              <IconComponent className={`w-4 h-4 shrink-0 mt-0.5 ${iconColor}`} />
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="font-semibold text-xs text-zinc-100 tracking-tight">
                  {toast.title}
                </div>
                {toast.description && (
                  <p className="text-[11px] text-zinc-400 leading-snug break-words">
                    {toast.description}
                  </p>
                )}
                {toast.txSignature && (
                  <div className="pt-1">
                    <a
                      href={`https://explorer.solana.com/tx/${toast.txSignature}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-400 hover:text-amber-300 underline underline-offset-2"
                    >
                      <span>Tx: {toast.txSignature.slice(0, 6)}...{toast.txSignature.slice(-4)}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
};
