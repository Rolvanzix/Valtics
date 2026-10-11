import React, { useState, useEffect } from 'react';
import { TrendingUp, ArrowRight, Activity, ExternalLink, HelpCircle } from 'lucide-react';
import { ValticsPredictionMarket } from '../../types/panta';
import { fetchPantaMarkets } from '../../services/pantaService';
import { formatCurrency } from '../../utils/format';
import { NavigationTab } from '../layout/Header';

interface PredictionActivityCommandCardProps {
  onSelectTab: (tab: NavigationTab) => void;
  onSelectMarketModal?: (market: ValticsPredictionMarket) => void;
}

export const PredictionActivityCommandCard: React.FC<PredictionActivityCommandCardProps> = ({
  onSelectTab,
  onSelectMarketModal,
}) => {
  const [markets, setMarkets] = useState<ValticsPredictionMarket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    fetchPantaMarkets({ limit: 3 })
      .then((res) => {
        if (mounted && res.success && res.data) {
          setMarkets(res.data.markets);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const primaryMarket = markets.length > 0 ? markets[0] : null;
  const yesProbPercent = primaryMarket?.probability !== null && primaryMarket?.probability !== undefined
    ? Math.round(primaryMarket.probability * 100)
    : 68;
  const noProbPercent = 100 - yesProbPercent;

  return (
    <div className="valtics-card p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden h-full space-y-4">
      {/* Ambient Glow */}
      <div 
        className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none blur-3xl opacity-20"
        style={{ background: 'radial-gradient(circle, #FF8A20 0%, #D82AA8 60%, transparent 100%)' }}
      />

      <div className="space-y-4 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(138,32,255,0.18)] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[rgba(255,138,32,0.15)] border border-[rgba(255,138,32,0.3)] flex items-center justify-center text-[#FF8A20]">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F5F5F7] tracking-tight">
                Prediction Benchmarks
              </h3>
              <span className="text-[10px] text-[#A7A7B8] font-mono block">
                Panta Protocol · Solana
              </span>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#FF8A20]/15 text-[#FFA642] border border-[#FF8A20]/30">
            Live Feed
          </span>
        </div>

        {/* Featured Prediction Market Card (from Master reference screenshot style) */}
        <div className="bg-[#05051a]/95 border border-[rgba(138,32,255,0.25)] rounded-xl p-3.5 shadow-xl space-y-3">
          {/* Question / Title */}
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-xs font-semibold text-[#F5F5F7] line-clamp-2 leading-snug">
              {primaryMarket ? primaryMarket.title : 'Will BTC hit $100k in 2025?'}
            </h4>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase bg-[#140130] text-[#A7A7B8] shrink-0 border border-[rgba(138,32,255,0.2)]">
              {primaryMarket?.category || 'Crypto'}
            </span>
          </div>

          {/* Glowing Prediction Curve SVG */}
          <div className="h-14 w-full relative">
            <svg viewBox="0 0 240 55" fill="none" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="pred-card-glow" x1="0" y1="0" x2="240" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#D82AA8" />
                  <stop offset="60%" stopColor="#FF8A20" />
                  <stop offset="100%" stopColor="#FFA642" />
                </linearGradient>
                <linearGradient id="pred-card-fill" x1="0" y1="0" x2="0" y2="55" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FF8A20" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#D82AA8" stopOpacity="0" />
                </linearGradient>
              </defs>

              <path
                d="M 5 45 Q 50 40 90 30 T 160 18 T 235 6 L 235 55 L 5 55 Z"
                fill="url(#pred-card-fill)"
              />
              <path
                d="M 5 45 Q 50 40 90 30 T 160 18 T 235 6"
                stroke="url(#pred-card-glow)"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <circle cx="90" cy="30" r="2.5" fill="#D82AA8" />
              <circle cx="160" cy="18" r="2.5" fill="#FF8A20" />
              <circle cx="235" cy="6" r="3.5" fill="#FFA642" className="animate-pulse" />
            </svg>
          </div>

          {/* YES / NO Outcome Buttons Split */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <div className="rounded-lg bg-[#6010F0] text-white py-1.5 px-3 flex items-center justify-between text-xs font-semibold shadow-xs">
              <span>Yes</span>
              <span className="font-mono">{yesProbPercent}%</span>
            </div>

            <div className="rounded-lg bg-[#080821] border border-white/10 text-[#A7A7B8] py-1.5 px-3 flex items-center justify-between text-xs font-medium">
              <span>No</span>
              <span className="font-mono">{noProbPercent}%</span>
            </div>
          </div>
        </div>

        {/* Volume & Provenance notice */}
        <div className="flex items-center justify-between text-[11px] font-mono text-[#A7A7B8]">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-[#FF8A20]" />
            <span>Volume: {primaryMarket?.volume ? formatCurrency(primaryMarket.volume, 'USD', 0) : '$420,500'}</span>
          </div>
          <span className="text-[#66667A]">Crowd Forecast</span>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-2 relative z-10">
        <button
          type="button"
          onClick={() => onSelectTab('predictions')}
          className="w-full valtics-button-secondary text-xs font-semibold py-2.5 justify-center cursor-pointer hover:border-[#FF8A20] transition-colors"
        >
          <span>Explore All Predictions</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#A7A7B8] group-hover:text-white" />
        </button>
      </div>
    </div>
  );
};
