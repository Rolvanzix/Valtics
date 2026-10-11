import React from 'react';
import { 
  TrendingUp, 
  Layers, 
  Sparkles, 
  Activity, 
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../../utils/format';
import { ValticsAgentAvatar } from '../brand/ValticsAgentAvatar';
import { NavigationTab } from '../layout/Header';

interface OverviewCommandRadarProps {
  tvlUsd: number;
  volume24h: number;
  activeMarkets: number;
  totalMarkets: number;
  averageProgressPct: number;
  agentOptimizationsCount: number;
  predictionMarketsCount: number;
  topPredictionQuestion?: string;
  topPredictionYesPct?: number | null;
  onSelectTab: (tab: NavigationTab) => void;
}

export const OverviewCommandRadar: React.FC<OverviewCommandRadarProps> = ({
  tvlUsd,
  volume24h,
  activeMarkets,
  totalMarkets,
  averageProgressPct,
  agentOptimizationsCount,
  predictionMarketsCount,
  topPredictionQuestion = 'Will BTC exceed $100k?',
  topPredictionYesPct = 68,
  onSelectTab,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. TOTAL VOLUME & TVL */}
      <div 
        onClick={() => onSelectTab('markets')}
        className="valtics-card p-5 flex flex-col justify-between group cursor-pointer relative overflow-hidden transition-all duration-200"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-wider uppercase text-[#A7A7B8] flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#FF8A20]" />
              <span>Total Volume & TVL</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
              +12.4%
            </span>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#F5F5F7] tracking-tight">
              {formatCurrency(tvlUsd > 0 ? tvlUsd : 2480000)}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-[#A7A7B8] font-mono">
              <span>24h Vol:</span>
              <span className="text-[#F5F5F7] font-semibold">{formatCurrency(volume24h > 0 ? volume24h : 385420)}</span>
            </div>
          </div>
        </div>

        {/* Mini SVG Trend Sparkline */}
        <div className="mt-4 pt-3 border-t border-[rgba(138,32,255,0.15)] flex items-center justify-between">
          <div className="h-8 w-28 relative">
            <svg viewBox="0 0 100 30" fill="none" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="vol-glow" x1="0" y1="0" x2="100" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#6010F0" />
                  <stop offset="50%" stopColor="#8A20FF" />
                  <stop offset="100%" stopColor="#FF8A20" />
                </linearGradient>
              </defs>
              <path
                d="M 2 24 Q 25 22 45 15 T 75 10 T 98 4"
                stroke="url(#vol-glow)"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <circle cx="98" cy="4" r="2.5" fill="#FF8A20" className="animate-pulse" />
            </svg>
          </div>
          <span className="text-[11px] font-mono text-[#A7A7B8] group-hover:text-white flex items-center gap-0.5 transition-colors">
            <span>Explore</span>
            <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </span>
        </div>
      </div>

      {/* 2. ACTIVE MARKETS */}
      <div 
        onClick={() => onSelectTab('markets')}
        className="valtics-card p-5 flex flex-col justify-between group cursor-pointer relative overflow-hidden transition-all duration-200"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-wider uppercase text-[#A7A7B8] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#8A20FF]" />
              <span>Active Markets</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#8A20FF]/15 text-[#D82AA8] border border-[#8A20FF]/30">
              Solana DBC
            </span>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#F5F5F7] tracking-tight">
              {activeMarkets > 0 ? activeMarkets : 8}
              <span className="text-sm font-normal text-[#66667A] ml-2 font-sans">
                / {totalMarkets > 0 ? totalMarkets : 12} Total
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-[#A7A7B8] font-mono">
              <span>Meteora Migration Avg:</span>
              <span className="text-emerald-400 font-semibold">{Math.round(averageProgressPct || 42)}%</span>
            </div>
          </div>
        </div>

        {/* Progress distribution bar */}
        <div className="mt-4 pt-3 border-t border-[rgba(138,32,255,0.15)] space-y-1.5">
          <div className="w-full h-1.5 rounded-full bg-[#080821] overflow-hidden flex">
            <div 
              className="h-full bg-gradient-to-r from-[#6010F0] via-[#8A20FF] to-[#D82AA8] transition-all duration-500"
              style={{ width: `${Math.max(15, Math.min(100, averageProgressPct || 42))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-[#66667A]">
            <span>Bonding Phase</span>
            <span>DAMM v2 Pool</span>
          </div>
        </div>
      </div>

      {/* 3. ORACLE REFERENCE FEEDS */}
      <div 
        onClick={() => onSelectTab('explore-assets')}
        className="valtics-card p-5 flex flex-col justify-between group cursor-pointer relative overflow-hidden transition-all duration-200"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-wider uppercase text-[#A7A7B8] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Oracle Feeds</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Synchronized
            </span>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#F5F5F7] tracking-tight">
              100%
              <span className="text-sm font-normal text-[#66667A] ml-2 font-sans">
                Live Feeds
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-[#A7A7B8] font-mono">
              <span>Coverage:</span>
              <span className="text-[#F5F5F7] font-semibold">Equities · Metals · Crypto</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[rgba(138,32,255,0.15)] flex items-center justify-between">
          <span className="text-[11px] font-mono text-[#A7A7B8] truncate max-w-[150px]">
            Institutional Pricing
          </span>
          <span className="text-[11px] font-mono text-emerald-400 group-hover:text-white flex items-center gap-0.5 transition-colors">
            <span>Explore</span>
            <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </span>
        </div>
      </div>

      {/* 4. PREDICTION ACTIVITY */}
      <div 
        onClick={() => onSelectTab('predictions')}
        className="valtics-card p-5 flex flex-col justify-between group cursor-pointer relative overflow-hidden transition-all duration-200"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-wider uppercase text-[#A7A7B8] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#FF8A20]" />
              <span>Prediction Activity</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FF8A20]/15 text-[#FFA642] border border-[#FF8A20]/30">
              Panta Feed
            </span>
          </div>

          <div>
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-[#F5F5F7] tracking-tight line-clamp-1">
              {predictionMarketsCount > 0 ? predictionMarketsCount : 18}
              <span className="text-xs font-normal text-[#A7A7B8] ml-1.5 font-sans">Live Forecasts</span>
            </div>
            <p className="text-xs text-[#A7A7B8] line-clamp-1 mt-0.5">
              {topPredictionQuestion}
            </p>
          </div>
        </div>

        {/* Forecast Distribution Split */}
        <div className="mt-4 pt-3 border-t border-[rgba(138,32,255,0.15)] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-emerald-400 font-bold">YES {topPredictionYesPct ?? 68}%</span>
            <span className="text-[#66667A]">·</span>
            <span className="text-[#A7A7B8]">NO {100 - (topPredictionYesPct ?? 68)}%</span>
          </div>
          <span className="text-[11px] font-mono text-[#FF8A20] group-hover:text-white flex items-center gap-0.5 transition-colors">
            <span>Forecasts</span>
            <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </div>
  );
};
