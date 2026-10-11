import React from 'react';
import { PlusCircle, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

interface PremiumEmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const PremiumEmptyState: React.FC<PremiumEmptyStateProps> = ({
  title = 'No markets yet',
  description = 'Create your first programmable market.',
  actionLabel = 'Create market',
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}) => {
  return (
    <div className={`py-12 px-6 rounded-2xl border border-[#162032] bg-[#070b14]/70 text-center flex flex-col items-center justify-center space-y-4 ${className}`}>
      {/* Minimal Vector Curve Illustration */}
      <div className="relative w-20 h-16 flex items-center justify-center">
        <svg viewBox="0 0 80 50" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="empty-curve-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#670CDC" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#BA3351" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#F99225" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="empty-curve-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#670CDC" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#09011B" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path
            d="M 6 42 Q 35 40 48 24 T 74 8 L 74 44 L 6 44 Z"
            fill="url(#empty-curve-fill)"
          />
          <path
            d="M 6 42 Q 35 40 48 24 T 74 8"
            fill="none"
            stroke="url(#empty-curve-grad)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="74" cy="8" r="3.5" fill="#F99225" stroke="#F7F3FF" strokeWidth="1.5" />
          <circle cx="6" cy="42" r="2.5" fill="#670CDC" />
        </svg>
      </div>

      {/* Concise Copy */}
      <div className="space-y-1 max-w-sm">
        <h3 className="text-base font-semibold text-[#F7F3FF] font-sans tracking-tight">
          {title}
        </h3>
        <p className="text-xs text-[#B8A9CC] font-sans">
          {description}
        </p>
      </div>

      {/* Primary & Optional Secondary Action */}
      <div className="pt-1 flex items-center gap-3">
        {onAction && (
          <Button
            variant="brand"
            size="sm"
            onClick={onAction}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            {actionLabel}
          </Button>
        )}
        {onSecondaryAction && secondaryActionLabel && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onSecondaryAction}
          >
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};
