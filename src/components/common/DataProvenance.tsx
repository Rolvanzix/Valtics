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
      text: label || '1. Verified On-Chain',
      bg: 'bg-emerald-950/40',
      textCol: 'text-emerald-300',
      border: 'border-emerald-800/40',
      icon: <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />,
      tooltip: 'Directly verified from Solana RPC account state and DBC vaults',
    },
    'external': {
      text: label || '2. External Reference',
      bg: 'bg-violet-950/40',
      textCol: 'text-violet-300',
      border: 'border-violet-800/40',
      icon: <Radio className="w-3 h-3 text-violet-400 shrink-0" />,
      tooltip: 'Independent external benchmark, oracle feed, or certified appraisal',
    },
    'issuer': {
      text: label || '3. Issuer Disclosed',
      bg: 'bg-sky-950/40',
      textCol: 'text-sky-300',
      border: 'border-sky-800/40',
      icon: <UserCheck className="w-3 h-3 text-sky-400 shrink-0" />,
      tooltip: 'Self-reported by asset issuer in pool registration',
    },
    'calculated': {
      text: label || '4. Calculated Metric',
      bg: 'bg-amber-950/40',
      textCol: 'text-amber-300',
      border: 'border-amber-800/40',
      icon: <Calculator className="w-3 h-3 text-amber-400 shrink-0" />,
      tooltip: 'Derived mathematically from reserves and dynamic bonding curve formula',
    },
    'unavailable': {
      text: label || 'Data Unavailable',
      bg: 'bg-zinc-900',
      textCol: 'text-zinc-400',
      border: 'border-zinc-800',
      icon: <AlertCircle className="w-3 h-3 text-zinc-500 shrink-0" />,
      tooltip: 'Data is unavailable or no verified external oracle is connected',
    },
  };

  const config = configs[type] || configs['unavailable'];
  const sizeClasses = size === 'xs' ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5';

  return (
    <span
      title={config.tooltip}
      className={`inline-flex items-center gap-1 rounded font-mono font-medium border ${config.bg} ${config.textCol} ${config.border} ${sizeClasses} ${className}`}
    >
      {showIcon && config.icon}
      <span>{config.text}</span>
    </span>
  );
};

export const ProvenanceLegend: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`p-3 rounded-lg bg-[#080b12] border border-zinc-800/80 space-y-2 text-[11px] ${className}`}>
      <div className="flex items-center gap-1.5 font-semibold text-zinc-300 font-sans">
        <Info className="w-3.5 h-3.5 text-violet-400" />
        <span>Institutional Data Provenance Standard (4-Layer Segregation)</span>
      </div>
      <p className="text-zinc-400 text-[10px] leading-relaxed">
        VALTICS strictly enforces truth in financial infrastructure. Numbers are never fabricated. Every datapoint is explicitly classified into one of four isolated layers:
      </p>
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <div className="flex items-center gap-1.5">
          <ProvenanceBadge type="on-chain" size="xs" />
          <span className="text-zinc-400 text-[10px]">Real-time Solana account PDA state</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ProvenanceBadge type="external" size="xs" />
          <span className="text-zinc-400 text-[10px]">Independent oracle or certified NAV appraisal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ProvenanceBadge type="issuer" size="xs" />
          <span className="text-zinc-400 text-[10px]">Provided during mint registration</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ProvenanceBadge type="calculated" size="xs" />
          <span className="text-zinc-400 text-[10px]">Deterministic mathematical derivation</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ProvenanceBadge type="unavailable" size="xs" />
          <span className="text-zinc-400 text-[10px]">No feed or indexer registered</span>
        </div>
      </div>
    </div>
  );
};
