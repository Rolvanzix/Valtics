import React from 'react';
import { useNetwork } from '../../context/NetworkContext';
import { AlertCircle } from 'lucide-react';

interface EnvironmentSwitchProps {
  compact?: boolean;
  className?: string;
  showStatusTip?: boolean;
}

export const EnvironmentSwitch: React.FC<EnvironmentSwitchProps> = ({
  compact = false,
  className = '',
  showStatusTip = false,
}) => {
  const { environmentStatusMessage, isWrongNetwork, networkError } = useNetwork();

  return (
    <div className={`inline-flex flex-col items-start ${className}`}>
      {/* Devnet Cluster Indicator */}
      <div
        aria-label="Solana Devnet environment"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#070a12] border border-amber-500/30 shadow-inner select-none font-sans text-xs text-amber-200 font-semibold"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        <span className="tracking-wide">
          {compact ? 'DEVNET' : 'SOLANA DEVNET'}
        </span>
      </div>

      {/* Mismatch Warning Alert */}
      {isWrongNetwork && (
        <div className="flex items-center gap-1 mt-1 text-[10px] text-rose-400 font-mono" title={networkError || 'Network mismatch'}>
          <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
          <span className="truncate max-w-[140px]">Cluster mismatch</span>
        </div>
      )}

      {/* Optional Status Tip */}
      {showStatusTip && (
        <span className="text-[10px] font-mono mt-1 text-amber-400/80">
          {environmentStatusMessage}
        </span>
      )}
    </div>
  );
};
