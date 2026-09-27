import React from 'react';

interface AssetLogoProps {
  symbol: string;
  category?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AssetLogo: React.FC<AssetLogoProps> = ({
  symbol,
  category = 'Tokenized Asset',
  size = 'md',
  className = '',
}) => {
  const clean = (symbol || 'AS').replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase();

  // Pick color accent according to financial asset category
  const lowerCat = category.toLowerCase();
  let bgStyles = 'bg-zinc-900 border-zinc-800 text-zinc-200';
  let badgeAccent = 'text-zinc-400';

  if (lowerCat.includes('commodity') || clean === 'XAU' || clean === 'PAXG' || clean === 'GLD') {
    bgStyles = 'bg-amber-950/20 border-amber-800/40 text-amber-200';
    badgeAccent = 'text-amber-400';
  } else if (lowerCat.includes('bond') || clean === 'USDY' || clean === 'GOVT' || clean === 'TLT') {
    bgStyles = 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200';
    badgeAccent = 'text-emerald-400';
  } else if (lowerCat.includes('fund') || clean.startsWith('ARK') || clean === 'BITB' || clean === 'SPY' || clean === 'QQQ') {
    bgStyles = 'bg-violet-950/20 border-violet-800/40 text-violet-200';
    badgeAccent = 'text-violet-400';
  } else if (lowerCat.includes('equity') || clean === 'AAPL' || clean === 'MSFT' || clean === 'NVDA' || clean === 'TSLA') {
    bgStyles = 'bg-sky-950/20 border-sky-800/40 text-sky-200';
    badgeAccent = 'text-sky-400';
  } else if (lowerCat.includes('digital') || clean === 'BTC' || clean === 'ETH' || clean === 'SOL') {
    bgStyles = 'bg-orange-950/20 border-orange-800/40 text-orange-200';
    badgeAccent = 'text-orange-400';
  }

  const sizeClasses = {
    sm: 'w-7 h-7 text-[10px] rounded-md',
    md: 'w-8 h-8 text-xs rounded-lg',
    lg: 'w-10 h-10 text-sm rounded-xl',
  }[size];

  return (
    <div
      className={`shrink-0 flex items-center justify-center font-mono font-semibold tracking-wider border shadow-xs select-none transition-colors ${sizeClasses} ${bgStyles} ${className}`}
      title={`${symbol} (${category})`}
    >
      <span>{clean}</span>
    </div>
  );
};
