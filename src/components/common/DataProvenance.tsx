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
      bg: 'bg-[#100126]',
      textCol: 'text-[#B8A9CC]',
      border: 'border-[#670CDC]/20',
      icon: <AlertCircle className="w-3 h-3 text-[#7E6D96] shrink-0" />,
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
    <div className={`py-4 px-5 rounded-xl border border-[#670CDC]/25 bg-[#140130]/70 space-y-2 text-xs ${className}`}>
      <div className="flex items-center gap-2 font-medium text-[#F7F3FF] font-sans">
        <Info className="w-3.5 h-3.5 text-[#D76EDD]" />
        <span>Data Provenance Standard</span>
        <span className="text-[#B8A9CC] font-normal">· Every metric is segregated into four verifiable tiers</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
          <span className="text-[#B8A9CC] font-sans">1. On-chain state from Solana RPC</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D76EDD] shrink-0" />
          <span className="text-[#B8A9CC] font-sans">2. Independent reference NAV</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#670CDC] shrink-0" />
          <span className="text-[#B8A9CC] font-sans">3. Issuer registration disclosure</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F99225] shrink-0" />
          <span className="text-[#B8A9CC] font-sans">4. Mathematical DBC calculations</span>
        </div>
      </div>
    </div>
  );
};
