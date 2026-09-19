import React, { useState, useMemo } from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Coins, 
  Sliders, 
  Lock, 
  TrendingUp,
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  Server,
  Zap,
  BarChart3
} from 'lucide-react';
import { CurveStudioConfigInput } from '../../services/meteoraCreation';
import { useNetwork } from '../../context/NetworkContext';
import { useWallet } from '../../context/WalletContext';
import { METEORA_DBC_PROGRAM_ID } from '../../config/constants';
import { formatCurrency, formatNumber, formatBps, formatPercent } from '../../utils/format';

interface Step3ReviewMarketProps {
  input: CurveStudioConfigInput;
  onNext: () => void;
  onBack: () => void;
  onOpenWalletModal?: () => void;
}

interface SimulatedPoint {
  index: number;
  percent: number;
  tokensSold: number;
  spotPrice: number;
  accumulatedQuote: number;
  marketCap: number;
}

export const Step3ReviewMarket: React.FC<Step3ReviewMarketProps> = ({
  input,
  onNext,
  onBack,
}) => {
  const { network } = useNetwork();
  const { connected } = useWallet();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const curveTokenSupply = (input.totalSupply * input.curveAllocationPct) / 100;
  const startPrice = input.startingPriceQuote;
  const endPrice = input.migrationPriceQuote;
  const priceDelta = endPrice - startPrice;
  const impliedMarketCapAtMigration = input.migrationPriceQuote * input.totalSupply;

  // Generate 24 points along the deterministic invariant curve
  const points: SimulatedPoint[] = useMemo(() => {
    const steps = 24;
    const list: SimulatedPoint[] = [];

    for (let i = 0; i <= steps; i++) {
      const frac = i / steps;
      const tokensSold = curveTokenSupply * frac;

      let spotPrice = startPrice;
      if (input.profileKey === 'growth') {
        const growthFactor = Math.log(Math.max(1.05, endPrice / startPrice));
        spotPrice = startPrice * Math.exp(growthFactor * frac);
      } else if (input.profileKey === 'conservative') {
        spotPrice = startPrice + priceDelta * frac;
      } else {
        spotPrice = startPrice + priceDelta * Math.pow(frac, 1.15);
      }

      const accumulatedQuote = input.migrationQuoteThreshold * Math.pow(frac, 1.2);
      const marketCap = spotPrice * input.totalSupply;

      list.push({
        index: i,
        percent: frac * 100,
        tokensSold,
        spotPrice,
        accumulatedQuote,
        marketCap,
      });
    }

    return list;
  }, [input, curveTokenSupply, startPrice, endPrice, priceDelta]);

  // Active point for telemetry banner (hovered or last point)
  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : points[points.length - 1];

  // SVG dimensions
  const svgWidth = 720;
  const svgHeight = 220;
  const padding = { top: 15, right: 30, bottom: 35, left: 65 };
  const chartW = svgWidth - padding.left - padding.right;
  const chartH = svgHeight - padding.top - padding.bottom;

  const minPrice = Math.min(...points.map((p) => p.spotPrice));
  const maxPrice = Math.max(...points.map((p) => p.spotPrice));
  const priceRange = maxPrice - minPrice || 1;

  const pathD = points
    .map((p, idx) => {
      const x = padding.left + (idx / (points.length - 1)) * chartW;
      const y = padding.top + chartH - ((p.spotPrice - minPrice) / priceRange) * chartH;
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');

  const areaD = `${pathD} L ${padding.left + chartW} ${padding.top + chartH} L ${padding.left} ${padding.top + chartH} Z`;

  return (
    <div className="space-y-6">
      {/* Contextual Header */}
      <div className="border-b border-zinc-800/80 pb-4">
        <h2 className="text-xl font-bold text-white tracking-tight font-sans">
          Review
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Verify bonding curve trajectory and financial specifications before deployment to Solana Devnet.
        </p>
      </div>

      {/* 1. Interactive Bonding Curve Model Preview */}
      <div className="bg-[#090d14] border border-zinc-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-sans">
                Bonding Curve Invariant Trajectory
              </h3>
              <p className="text-[11px] text-zinc-400">
                Deterministic price evolution as tokens are purchased from the reserve.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-zinc-500">Preset:</span>
            <span className="text-amber-400 font-bold uppercase">{input.profileKey}</span>
          </div>
        </div>

        {/* Telemetry Strip on Hover */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0d121c] p-3 rounded-lg border border-zinc-800 font-mono text-xs">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase block font-sans">Progress</span>
            <span className="text-zinc-100 font-semibold">{formatPercent(activePoint.percent)}</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 uppercase block font-sans">Spot Price</span>
            <span className="text-amber-400 font-semibold">{formatCurrency(activePoint.spotPrice, input.quoteSymbol)}</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 uppercase block font-sans">Reserve Quote</span>
            <span className="text-emerald-400 font-semibold">{formatNumber(activePoint.accumulatedQuote, 0)} {input.quoteSymbol}</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 uppercase block font-sans">Implied Valuation</span>
            <span className="text-zinc-200 font-semibold">{formatCurrency(activePoint.marketCap, input.quoteSymbol)}</span>
          </div>
        </div>

        {/* SVG Curve Canvas */}
        <div className="relative w-full overflow-hidden bg-[#060910] rounded-xl border border-zinc-900 p-2">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto select-none">
            <defs>
              <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
              const y = padding.top + chartH * (1 - pct);
              return (
                <line
                  key={pct}
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + chartW}
                  y2={y}
                  stroke="#27272a"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
              );
            })}

            {/* Area and Line */}
            <path d={areaD} fill="url(#curveGradient)" />
            <path d={pathD} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />

            {/* Interactive Points */}
            {points.map((p, idx) => {
              const cx = padding.left + (idx / (points.length - 1)) * chartW;
              const cy = padding.top + chartH - ((p.spotPrice - minPrice) / priceRange) * chartH;
              const isHovered = hoveredIdx === idx;
              return (
                <circle
                  key={idx}
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 5 : 3}
                  fill={isHovered ? '#ffffff' : '#f59e0b'}
                  stroke="#090d14"
                  strokeWidth="1.5"
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setHoveredIdx(idx)}
                />
              );
            })}

            {/* Y-Axis Labels */}
            <text x={padding.left - 8} y={padding.top + 8} fill="#71717a" fontSize="10" textAnchor="end" fontFamily="monospace">
              {maxPrice.toFixed(4)}
            </text>
            <text x={padding.left - 8} y={padding.top + chartH} fill="#71717a" fontSize="10" textAnchor="end" fontFamily="monospace">
              {minPrice.toFixed(4)}
            </text>

            {/* X-Axis Labels */}
            <text x={padding.left} y={svgHeight - 8} fill="#71717a" fontSize="10" fontFamily="monospace">
              Launch (0%)
            </text>
            <text x={padding.left + chartW} y={svgHeight - 8} fill="#f59e0b" fontSize="10" textAnchor="end" fontFamily="monospace">
              Graduation (100%)
            </text>
          </svg>
        </div>
      </div>

      {/* 2. Specification Summary Table */}
      <div className="bg-[#090d14] border border-zinc-800 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-sans flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Market Specifications Summary</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-1">
            <span className="text-zinc-500 text-[11px]">Asset & Mint</span>
            <div className="font-semibold text-zinc-100 truncate font-mono">
              {input.assetName} ({input.ticker})
            </div>
            <div className="text-[10px] text-zinc-400 font-mono truncate">
              {input.baseMint}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-1">
            <span className="text-zinc-500 text-[11px]">Quote Currency</span>
            <div className="font-semibold text-zinc-100 font-mono">
              {input.quoteSymbol} (Meteora Vault)
            </div>
            <div className="text-[10px] text-zinc-400 font-mono">
              Target Threshold: {formatNumber(input.migrationQuoteThreshold, 0)} {input.quoteSymbol}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-1">
            <span className="text-zinc-500 text-[11px]">Pricing Range</span>
            <div className="font-semibold text-amber-400 font-mono">
              {formatCurrency(input.startingPriceQuote, input.quoteSymbol)} → {formatCurrency(input.migrationPriceQuote, input.quoteSymbol)}
            </div>
            <div className="text-[10px] text-zinc-400 font-mono">
              Valuation: {formatCurrency(input.startingPriceQuote * input.totalSupply, input.quoteSymbol)} → {formatCurrency(impliedMarketCapAtMigration, input.quoteSymbol)}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-1">
            <span className="text-zinc-500 text-[11px]">Fee Tier</span>
            <div className="font-semibold text-emerald-400 font-mono">
              {formatBps(input.startingFeeBps)} Base Fee
            </div>
            <div className="text-[10px] text-zinc-400">
              {input.dynamicFeeEnabled ? 'Dynamic Fee Engine active' : 'Flat fee'}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-1">
            <span className="text-zinc-500 text-[11px]">Liquidity Lock</span>
            <div className="font-semibold text-zinc-200 font-mono">
              {input.creatorPermanentLockedLpPct === 100 ? '100% Permanent Lock' : 'Unlocked LP'}
            </div>
            <div className="text-[10px] text-zinc-400">
              Anti-sniper protection: {input.antiSniperSlots} slots
            </div>
          </div>

          <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-1">
            <span className="text-zinc-500 text-[11px]">Target Program</span>
            <div className="font-semibold text-zinc-200 font-mono">
              Meteora DBC (Solana Devnet)
            </div>
            <div className="text-[10px] text-zinc-400 font-mono truncate">
              {METEORA_DBC_PROGRAM_ID}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 border border-zinc-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs shadow-amber-500/20"
        >
          <span>Create market</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
