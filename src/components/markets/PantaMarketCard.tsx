import React from 'react';
import { ExternalLink, Calendar, HelpCircle, TrendingUp, Layers, CheckCircle2, Clock, Users, ArrowUpRight } from 'lucide-react';
import { ValticsPredictionMarket } from '../../types/panta';
import { evaluateTokenizedAssetRelevance } from '../../utils/pantaRelevance';
import { formatCurrency, formatNumber } from '../../utils/format';

interface PantaMarketCardProps {
  market: ValticsPredictionMarket;
  onOpenDetails: (market: ValticsPredictionMarket) => void;
  onTrade?: (market: ValticsPredictionMarket, outcome: 'YES' | 'NO') => void;
}

export const PantaMarketCard: React.FC<PantaMarketCardProps> = ({
  market,
  onOpenDetails,
  onTrade,
}) => {
  const relevance = evaluateTokenizedAssetRelevance(market);

  // Formatted probabilities
  const yesProbPercent = market.probability !== null
    ? Math.round(market.probability * 100)
    : (market.yesPrice !== null ? Math.round(market.yesPrice * 100) : null);

  const noProbPercent = yesProbPercent !== null ? 100 - yesProbPercent : null;

  // Format dates safely without inventing
  const formatDate = (raw?: string | null) => {
    if (!raw) return null;
    try {
      const d = new Date(raw);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return null;
    }
  };

  const formattedStartDate = formatDate(market.startTime);
  const formattedEndDate = formatDate(market.endTime || market.resolutionTime);

  // Human-readable market type
  const marketTypeLabel = React.useMemo(() => {
    if (!market.marketType) return null;
    const t = market.marketType.toLowerCase();
    if (t === 'binary') return 'Binary YES/NO';
    if (t === 'orderbook') return 'Order-Book CLOB';
    if (t === 'categorical') return 'Multi-Choice';
    if (t === 'scalar') return 'Scalar Range';
    return market.marketType.toUpperCase();
  }, [market.marketType]);

  // Phase & Status Badge styling
  const renderPhaseStatusBadge = () => {
    const phase = market.marketPhase || market.status;
    switch (phase) {
      case 'primary_issuance':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#8A20FF]/15 text-[#D4A5FF] border border-[#8A20FF]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8A20FF] animate-pulse" />
            Primary Issuance
          </span>
        );
      case 'secondary_trading':
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Secondary Trading
          </span>
        );
      case 'resolving':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#F99225]/10 text-[#F99225] border border-[#F99225]/25">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F99225]" />
            Resolving
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#670CDC]/20 text-[#EDE4FA] border border-[#670CDC]/30">
            <CheckCircle2 className="w-3 h-3 text-[#FFA742]" />
            Resolved{market.resolutionOutcome ? `: ${market.resolutionOutcome}` : ''}
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#BA3351]/10 text-[#FF9EAF] border border-[#BA3351]/25">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#1C0142] text-[#B8A9CC] border border-[#670CDC]/20">
            {phase}
          </span>
        );
    }
  };

  return (
    <div
      onClick={() => onOpenDetails(market)}
      className="group relative bg-[#05051a] hover:bg-[#080824] border border-[rgba(138,32,255,0.18)] hover:border-[rgba(138,32,255,0.45)] rounded-xl p-5 transition-all flex flex-col justify-between cursor-pointer shadow-sm hover:shadow-lg h-full"
    >
      <div>
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Market Type */}
            {marketTypeLabel && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#100126] text-[#A7A7B8] border border-[rgba(138,32,255,0.2)]">
                {marketTypeLabel}
              </span>
            )}

            {/* Category */}
            {market.category && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-[#080821] text-[#A7A7B8] border border-[rgba(138,32,255,0.18)]">
                {market.category}
              </span>
            )}

            {/* Tokenized-Asset Relevance Flag */}
            {relevance.isRelevant && (
              <span
                title={relevance.rationale}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#F99225]/10 text-[#F99225] border border-[#F99225]/25"
              >
                <Layers className="w-2.5 h-2.5 shrink-0" />
                <span>{relevance.assetLabel || 'Tokenized Asset'}</span>
              </span>
            )}
          </div>

          {/* Phase / Status */}
          {renderPhaseStatusBadge()}
        </div>

        {/* Title / Question */}
        <div className="flex items-start gap-3 mb-4">
          {market.image ? (
            <img
              src={market.image}
              alt=""
              className="w-10 h-10 rounded-lg object-cover bg-[#000010] border border-[rgba(138,32,255,0.2)] shrink-0"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-[#080821] border border-[rgba(138,32,255,0.2)] flex items-center justify-center shrink-0 text-[#A7A7B8]">
              <HelpCircle className="w-5 h-5 text-[#8A20FF]" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-semibold text-[#F5F5F7] group-hover:text-white transition-colors line-clamp-2 leading-snug break-words">
              {market.question || market.title}
            </h3>
            {market.description && (
              <p className="text-xs text-[#A7A7B8] line-clamp-2 mt-1 leading-relaxed break-words font-sans">
                {market.description}
              </p>
            )}
          </div>
        </div>

        {/* Pricing / Odds Box */}
        <div className="bg-[#000010] border border-[rgba(138,32,255,0.18)] rounded-lg p-3 mb-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#A7A7B8] font-medium flex items-center gap-1">
              <span>Primary Implied Probability</span>
            </span>
            {yesProbPercent !== null ? (
              <span className="font-mono font-bold text-[#F5F5F7]">
                YES {yesProbPercent}% · NO {noProbPercent}%
              </span>
            ) : (
              <span className="font-mono text-xs text-[#7E6D96]">Pending</span>
            )}
          </div>

          {/* Probability Bar */}
          {yesProbPercent !== null ? (
            <div className="w-full h-2 rounded-full bg-[#080821] overflow-hidden flex">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                style={{ width: `${yesProbPercent}%` }}
              />
              <div
                className="h-full bg-gradient-to-r from-[#8A20FF] to-[#670CDC] transition-all duration-500"
                style={{ width: `${100 - yesProbPercent}%` }}
              />
            </div>
          ) : (
            <div className="w-full h-2 rounded-full bg-[#080821]" />
          )}

          {/* YES & NO Price Outcome Split */}
          <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
            {market.marketPhase === 'primary_issuance' && onTrade ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTrade(market, 'YES');
                }}
                className="rounded bg-[#080821] hover:bg-emerald-500/20 border border-emerald-500/25 px-2.5 py-1.5 flex items-center justify-between text-xs transition-colors cursor-pointer group/btn"
              >
                <span className="font-bold text-emerald-400 group-hover/btn:underline">YES</span>
                <span className="text-[#F5F5F7]">
                  {market.yesPrice !== null ? formatCurrency(market.yesPrice, 'USD', 2) : '—'}
                </span>
              </button>
            ) : (
              <div className="rounded bg-[#080821] border border-emerald-500/20 px-2.5 py-1.5 flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400">YES</span>
                <span className="text-[#F5F5F7]">
                  {market.yesPrice !== null ? formatCurrency(market.yesPrice, 'USD', 2) : '—'}
                </span>
              </div>
            )}

            {market.marketPhase === 'primary_issuance' && onTrade ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTrade(market, 'NO');
                }}
                className="rounded bg-[#080821] hover:bg-[#8A20FF]/25 border border-[rgba(138,32,255,0.3)] px-2.5 py-1.5 flex items-center justify-between text-xs transition-colors cursor-pointer group/btn"
              >
                <span className="font-bold text-[#A7A7B8] group-hover/btn:text-[#D4A5FF] group-hover/btn:underline">NO</span>
                <span className="text-[#F5F5F7]">
                  {market.noPrice !== null ? formatCurrency(market.noPrice, 'USD', 2) : '—'}
                </span>
              </button>
            ) : (
              <div className="rounded bg-[#080821] border border-[rgba(138,32,255,0.25)] px-2.5 py-1.5 flex items-center justify-between text-xs">
                <span className="font-bold text-[#A7A7B8]">NO</span>
                <span className="text-[#F5F5F7]">
                  {market.noPrice !== null ? formatCurrency(market.noPrice, 'USD', 2) : '—'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Extended Metrics: Volume, Liquidity, Activity */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-[11px] font-mono text-[#A7A7B8]">
          <div className="bg-[#080821]/80 rounded px-2.5 py-1.5 border border-[rgba(138,32,255,0.12)]">
            <span className="text-[#7E6D96] block text-[10px] uppercase">Volume</span>
            <span className="text-[#F5F5F7] font-semibold">
              {market.volume !== null ? formatCurrency(market.volume, 'USD', 0) : '$0'}
            </span>
          </div>

          <div className="bg-[#080821]/80 rounded px-2.5 py-1.5 border border-[rgba(138,32,255,0.12)]">
            <span className="text-[#7E6D96] block text-[10px] uppercase">Liquidity</span>
            <span className="text-[#F5F5F7] font-semibold">
              {market.liquidity !== null ? formatCurrency(market.liquidity, 'USD', 0) : 'Unavailable'}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Metrics & Timing */}
      <div className="border-t border-[rgba(138,32,255,0.18)] pt-3 space-y-2 text-xs">
        {/* Timing Row: Start & End */}
        <div className="flex items-center justify-between text-[11px] font-mono text-[#A7A7B8]">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-[#7E6D96]" />
            {formattedEndDate ? (
              <span>Ends: {formattedEndDate}</span>
            ) : (
              <span className="text-[#7E6D96]">Open-ended</span>
            )}
          </div>

          {/* Activity / Trades Count */}
          {market.tradeCount !== null ? (
            <div className="flex items-center gap-1 text-[#F5F5F7]">
              <Users className="w-3 h-3 text-[#8A20FF]" />
              <span>{formatNumber(market.tradeCount, 0)} trades</span>
            </div>
          ) : (
            <span className="text-[#7E6D96]">Activity: —</span>
          )}
        </div>

        {/* Source Attribution & Link */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-[#A7A7B8] font-mono px-2 py-0.5 rounded bg-[#080821] border border-[rgba(138,32,255,0.18)]">
            Panta Protocol
          </span>

          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#8A20FF] group-hover:text-[#FFA742] transition-colors">
            <span>Market Details</span>
            <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
};

