import React from 'react';
import { ShieldCheck, UserCheck, AlertTriangle, HelpCircle } from 'lucide-react';
import { VerificationStatus } from '../../types/asset';

interface VerificationStatusBadgeProps {
  status: VerificationStatus;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showTooltip?: boolean;
  className?: string;
}

export const VerificationStatusBadge: React.FC<VerificationStatusBadgeProps> = ({
  status,
  size = 'sm',
  showIcon = true,
  showTooltip = true,
  className = '',
}) => {
  const configs: Record<
    VerificationStatus,
    {
      label: string;
      bg: string;
      text: string;
      border: string;
      icon: React.ReactNode;
      tooltip: string;
      dotColor: string;
    }
  > = {
    Verified: {
      label: 'Verified',
      bg: 'bg-emerald-950/40',
      text: 'text-emerald-300',
      border: 'border-emerald-600/40',
      dotColor: 'bg-emerald-400',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
      tooltip: 'Independently audited & legally attested. Holding confirmed by qualified custodian or verified oracle.',
    },
    'Issuer provided': {
      label: 'Issuer provided',
      bg: 'bg-sky-950/40',
      text: 'text-sky-300',
      border: 'border-sky-600/40',
      dotColor: 'bg-sky-400',
      icon: <UserCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />,
      tooltip: 'Metadata & prospectus supplied by the token issuer. Not independently audited by a third-party validator.',
    },
    Unverified: {
      label: 'Unverified',
      bg: 'bg-amber-950/40',
      text: 'text-amber-300',
      border: 'border-amber-600/40',
      dotColor: 'bg-amber-400',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
      tooltip: 'Permissionless creation. No legal entity, custodian attestation, or securities filing verified.',
    },
    'Data unavailable': {
      label: 'Data unavailable',
      bg: 'bg-zinc-900',
      text: 'text-zinc-400',
      border: 'border-zinc-700/60',
      dotColor: 'bg-zinc-500',
      icon: <HelpCircle className="w-3.5 h-3.5 text-zinc-400 shrink-0" />,
      tooltip: 'No benchmark pricing, stock exchange feed, or collateral data is currently published.',
    },
  };

  const config = configs[status] || configs['Data unavailable'];

  const sizeStyles = {
    xs: 'text-[9px] px-1.5 py-0.5 gap-1',
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-semibold',
  };

  return (
    <span
      title={showTooltip ? config.tooltip : undefined}
      className={`inline-flex items-center rounded-full font-mono border ${config.bg} ${config.text} ${config.border} ${sizeStyles[size]} ${className}`}
    >
      {showIcon ? config.icon : <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />}
      <span className="tracking-tight whitespace-nowrap">{config.label}</span>
    </span>
  );
};
