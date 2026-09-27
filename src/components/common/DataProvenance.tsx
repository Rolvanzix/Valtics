import React from 'react';
import { ShieldCheck, UserCheck, Calculator, AlertCircle, Info, Radio } from 'lucide-react';

export type ProvenanceType = 'on-chain' | 'external' | 'issuer' | 'calculated' | 'unavailable';

interface ProvenanceBadgeProps {
  type: ProvenanceType;
  label?: string;
  size?: 'xs' | 'sm';
  showIcon?: boolean;
  className?: string;
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({
  type,
  label,
  size = 'xs',
  showIcon = true,
  className = '',
}) => {
  const configs: Record<ProvenanceType, { text: string; bg: string; textCol: string; border: string; icon: React.ReactNode; tooltip: string }> = {
    'on-chain': {
      text: label || 'On-Chain Verified',
      bg: 'bg-emerald-950/30',
      textCol: 'text-emerald-300',
      border: 'border-emerald-800/30',
      icon: <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />,
      tooltip: 'Directly verified from Solana RPC account state and DBC vaults',
    },
    'external': {
      text: label || 'Reference NAV',
      bg: 'bg-violet-950/30',
      textCol: 'text-violet-300',
      border: 'border-violet-800/30',
      icon: <Radio className="w-3 h-3 text-violet-400 shrink-0" />,
      tooltip: 'Independent external benchmark, oracle feed, or certified appraisal',
    },
    'issuer': {
      text: label || 'Issuer Disclosed',
      bg: 'bg-sky-950/30',
      textCol: 'text-sky-300',
      border: 'border-sky-800/30',
      icon: <UserCheck className="w-3 h-3 text-sky-400 shrink-0" />,
      tooltip: 'Self-reported by asset issuer in pool registration',
    },
    'calculated': {
      text: label || 'Calculated Metric',
      bg: 'bg-amber-950/30',
      textCol: 'text-amber-300',
      border: 'border-amber-800/30',
      icon: <Calculator className="w-3 h-3 text-amber-400 shrink-0" />,
      tooltip: 'Derived mathematically from reserves and dynamic bonding curve formula',
    },
    'unavailable': {
      text: label || 'Unavailable',
      bg: 'bg-zinc-900/40',
      textCol: 'text-zinc-400',
      border: 'border-zinc-800',
      icon: <AlertCircle className="w-3 h-3 text-zinc-500 shrink-0" />,
      tooltip: 'Data is unavailable or no verified external oracle is connected',
    },
  };

  const config = configs[type] || configs['unavailable'];
  const sizeClasses = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';

  return (
    <span
      title={config.tooltip}
      className={`inline-flex items-center gap-1 rounded font-sans font-medium border ${config.bg} ${config.textCol} ${config.border} ${sizeClasses} ${className}`}
    >
      {showIcon && config.icon}
      <span>{config.text}</span>
    </span>
  );
};

export const ProvenanceLegend: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`py-4 px-5 rounded-xl border border-zinc-800/60 bg-[#090d15]/50 space-y-2 text-xs ${className}`}>
      <div className="flex items-center gap-2 font-medium text-zinc-300 font-sans">
        <Info className="w-3.5 h-3.5 text-zinc-400" />
        <span>Data Provenance Standard</span>
        <span className="text-zinc-500 font-normal">· Every metric is segregated into four verifiable tiers</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
          <span className="text-zinc-400 font-sans">1. On-chain state from Solana RPC</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
          <span className="text-zinc-400 font-sans">2. Independent reference NAV</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
          <span className="text-zinc-400 font-sans">3. Issuer registration disclosure</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
          <span className="text-zinc-400 font-sans">4. Mathematical DBC calculations</span>
        </div>
      </div>
    </div>
  );
};
