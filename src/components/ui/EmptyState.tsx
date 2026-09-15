import React, { ReactNode } from 'react';
import { Layers, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`rounded-xl border border-dashed border-zinc-800 bg-[#090d14]/40 p-8 sm:p-12 flex flex-col items-center justify-center text-center max-w-md mx-auto my-4 space-y-4 ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-zinc-850 border border-zinc-800 flex items-center justify-center text-zinc-400">
        {icon || <Layers className="w-6 h-6 text-zinc-500" />}
      </div>
      <div className="space-y-1.5">
        <h4 className="font-semibold text-sm sm:text-base text-zinc-200 tracking-tight">{title}</h4>
        <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  technicalDetails?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Encountered RPC Exception',
  message,
  onRetry,
  technicalDetails,
  className = '',
}) => {
  return (
    <div
      className={`rounded-xl border border-rose-900/40 bg-rose-950/20 p-5 space-y-3.5 text-xs text-rose-200 ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        <div className="space-y-1 flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-rose-300 tracking-tight">{title}</h4>
          <p className="text-zinc-400 leading-relaxed text-xs">{message}</p>
        </div>
      </div>

      {technicalDetails && (
        <details className="mt-2 bg-black/40 p-2.5 rounded border border-rose-900/30 text-[10px] text-zinc-400 font-mono">
          <summary className="cursor-pointer text-zinc-400 hover:text-zinc-300 font-sans uppercase font-medium">
            Technical Diagnostic Data
          </summary>
          <pre className="mt-2 whitespace-pre-wrap break-all">{technicalDetails}</pre>
        </details>
      )}

      {onRetry && (
        <div className="pt-1 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            leftIcon={<RefreshCw className="w-3 h-3" />}
            className="border-rose-800/60 hover:bg-rose-950/40 text-rose-300"
          >
            Retry Connection
          </Button>
        </div>
      )}
    </div>
  );
};
