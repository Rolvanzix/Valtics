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
      className={`rounded-xl border border-dashed border-[#670CDC]/30 bg-[#140130]/60 p-8 sm:p-12 flex flex-col items-center justify-center text-center max-w-md mx-auto my-4 space-y-4 ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-[#1C0142] border border-[#670CDC]/30 flex items-center justify-center text-[#D76EDD]">
        {icon || <Layers className="w-6 h-6 text-[#B8A9CC]" />}
      </div>
      <div className="space-y-1.5">
        <h4 className="font-semibold text-sm sm:text-base text-[#F7F3FF] tracking-tight font-sans">{title}</h4>
        <p className="text-xs text-[#B8A9CC] leading-relaxed max-w-sm font-sans">{description}</p>
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
      className={`rounded-xl border border-[#BA3351]/50 bg-[#250315]/80 p-5 space-y-3.5 text-xs text-[#FF9EAF] ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-[#BA3351] shrink-0 mt-0.5" />
        <div className="space-y-1 flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-[#FF9EAF] tracking-tight font-sans">{title}</h4>
          <p className="text-[#B8A9CC] leading-relaxed text-xs font-sans">{message}</p>
        </div>
      </div>

      {technicalDetails && (
        <details className="mt-2 bg-[#09011B]/80 p-2.5 rounded-lg border border-[#BA3351]/30 text-[10px] text-[#B8A9CC] font-mono">
          <summary className="cursor-pointer text-[#B8A9CC] hover:text-[#F7F3FF] font-sans uppercase font-medium">
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
            className="border-[#BA3351]/60 hover:bg-[#BA3351]/20 text-[#FF9EAF]"
          >
            Retry Connection
          </Button>
        </div>
      )}
    </div>
  );
};
