import React, { useState } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  Copy,
  Check,
  Calendar,
  Layers,
  HelpCircle,
  TrendingUp,
  Info,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Users,
  Activity,
  ArrowRight,
  BookOpen,
  DollarSign
} from 'lucide-react';
import { ValticsPredictionMarket } from '../../types/panta';
import { evaluateTokenizedAssetRelevance } from '../../utils/pantaRelevance';
import { formatCurrency, formatNumber } from '../../utils/format';
import { PantaTradingModal } from './PantaTradingModal';
import { ValticsMarketBrief } from '../intelligence/ValticsMarketBrief';
import { getRealPythMarketPrice } from '../../services/pythMarketData';

interface PantaMarketDetailViewProps {
  market: ValticsPredictionMarket;
  onBack?: () => void;
  onSelectTab?: (tab: string) => void;
  onOpenWalletModal?: () => void;
}

export const PantaMarketDetailView: React.FC<PantaMarketDetailViewProps> = ({
  market,
  onBack,
  onSelectTab,
  onOpenWalletModal,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeMarketTab, setActiveMarketTab] = useState<'primary' | 'secondary' | 'lifecycle'>('primary');
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<'YES' | 'NO'>('YES');

  const relevance = evaluateTokenizedAssetRelevance(market);
  const [liveAssetPrice, setLiveAssetPrice] = useState<number | null>(null);

  React.useEffect(() => {
    const assetKey = relevance.matchedKeyword || 'sol';
    getRealPythMarketPrice(assetKey)
      .then((res) => {
        if (res.isAvailable && res.price !== null) {
          setLiveAssetPrice(res.price);
        }
      })
      .catch(() => {});
  }, [relevance.matchedKeyword]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Safe formatting of dates
  const formatDateFull = (raw?: string | null) => {
    if (!raw) return null;
    try {
      const d = new Date(raw);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      });
    } catch {
      return null;
    }
  };

  const formattedStart = formatDateFull(market.startTime);
  const formattedEnd = formatDateFull(market.endTime);
  const formattedResolution = formatDateFull(market.resolutionTime);

  const yesProbPercent = market.probability !== null
    ? Math.round(market.probability * 100)
    : (market.yesPrice !== null ? Math.round(market.yesPrice * 100) : null);
  const noProbPercent = yesProbPercent !== null ? 100 - yesProbPercent : null;

  // Market type label
  const marketTypeLabel = (() => {
    const t = (market.marketType || 'binary').toLowerCase();
    if (t === 'binary') return 'Binary Outcome (YES / NO)';
    if (t === 'orderbook') return 'Central Limit Order Book (CLOB)';
    if (t === 'categorical') return 'Categorical Multi-Choice';
    return t.toUpperCase();
  })();

  // Market phase label
  const currentPhase = market.marketPhase || (market.status === 'resolved' ? 'resolved' : 'secondary_trading');

  // Lifecycle steps
  const lifecycleSteps = [
    { id: 'creation', label: '1. Market Created', desc: 'PDA initialized on Solana', status: 'completed' },
    {
      id: 'primary',
      label: '2. Primary Issuance',
      desc: 'Users acquire shares from protocol pool',
      status: currentPhase === 'primary_issuance' ? 'active' : 'completed'
    },
    {
      id: 'secondary',
      label: '3. Secondary Trading',
      desc: 'Shares trade via Panta order book',
      status: currentPhase === 'secondary_trading' || currentPhase === 'active' ? 'active' : (currentPhase === 'primary_issuance' ? 'upcoming' : 'completed')
    },
    {
      id: 'resolving',
      label: '4. Oracle Verification',
      desc: 'Resolution criteria evaluated by source oracle',
      status: currentPhase === 'resolving' ? 'active' : (currentPhase === 'resolved' ? 'completed' : 'upcoming')
    },
    {
      id: 'settled',
      label: '5. Settlement & Claims',
      desc: 'Winning outcome redeemable 1:1 for collateral',
      status: currentPhase === 'resolved' ? 'completed' : 'upcoming'
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Navigation Top Bar */}
      {onBack && (
        <div className="flex items-center justify-between pb-2 border-b border-[rgba(138,32,255,0.18)]">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-mono text-[#A7A7B8] hover:text-[#F5F5F7] transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 text-[#8A20FF]" />
            <span>Back to Markets</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-mono text-[#A7A7B8]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Panta Market Live Feed</span>
          </div>
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-[#05051a] border border-[rgba(138,32,255,0.25)] rounded-2xl p-6 sm:p-8 space-y-5 shadow-xl">
        {/* Badges Row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded text-xs font-mono font-medium bg-[#100126] text-[#D4A5FF] border border-[#8A20FF]/30">
              {marketTypeLabel}
            </span>

            {market.category && (
              <span className="px-2.5 py-1 rounded text-xs font-mono uppercase tracking-wider bg-[#080821] text-[#A7A7B8] border border-[rgba(138,32,255,0.2)]">
                {market.category}
              </span>
            )}

            {relevance.isRelevant && (
              <span
                title={relevance.rationale}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium bg-[#F99225]/15 text-[#F99225] border border-[#F99225]/30"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{relevance.assetLabel || 'Tokenized Asset Connection'}</span>
              </span>
            )}

            <span className="px-2.5 py-1 rounded text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
              {market.status.toUpperCase()}
            </span>
          </div>

          <div className="text-xs font-mono text-[#A7A7B8]">
            Phase: <span className="text-[#F5F5F7] font-semibold uppercase">{currentPhase.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Title / Question */}
        <div className="flex items-start gap-4">
          {market.image ? (
            <img
              src={market.image}
              alt=""
              className="w-14 h-14 rounded-xl object-cover bg-[#000010] border border-[rgba(138,32,255,0.3)] shrink-0"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-[#080821] border border-[rgba(138,32,255,0.25)] flex items-center justify-center shrink-0 text-[#8A20FF]">
              <HelpCircle className="w-7 h-7" />
            </div>
          )}

          <div className="space-y-1.5 flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-[#F5F5F7] tracking-tight leading-snug">
              {market.question || market.title}
            </h1>
            <p className="text-xs font-mono text-[#A7A7B8]">
              Market Identifier: <span className="text-[#D4A5FF]">{market.externalId}</span>
            </p>
          </div>
        </div>

        {/* Core Financial Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[rgba(138,32,255,0.18)] text-xs font-mono">
          <div className="bg-[#080821] p-3 rounded-xl border border-[rgba(138,32,255,0.15)]">
            <span className="text-[#7E6D96] block text-[10px] uppercase">Prediction Volume</span>
            <span className="text-base font-bold text-[#F5F5F7] mt-0.5 block">
              {market.volume !== null ? formatCurrency(market.volume, 'USD', 0) : '$0'}
            </span>
          </div>

          <div className="bg-[#080821] p-3 rounded-xl border border-[rgba(138,32,255,0.15)]">
            <span className="text-[#7E6D96] block text-[10px] uppercase">Market Liquidity</span>
            <span className="text-base font-bold text-[#F5F5F7] mt-0.5 block">
              {market.liquidity !== null ? formatCurrency(market.liquidity, 'USD', 0) : 'Unavailable'}
            </span>
          </div>

          <div className="bg-[#080821] p-3 rounded-xl border border-[rgba(138,32,255,0.15)]">
            <span className="text-[#7E6D96] block text-[10px] uppercase">Trades Executed</span>
            <span className="text-base font-bold text-[#F5F5F7] mt-0.5 block">
              {market.tradeCount !== null ? formatNumber(market.tradeCount, 0) : '—'}
            </span>
          </div>

          <div className="bg-[#080821] p-3 rounded-xl border border-[rgba(138,32,255,0.15)]">
            <span className="text-[#7E6D96] block text-[10px] uppercase">Unique Traders</span>
            <span className="text-base font-bold text-[#F5F5F7] mt-0.5 block">
              {market.tradersCount !== null ? formatNumber(market.tradersCount, 0) : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Institutional Valtics Market Brief (Differentiation Feature) */}
      <ValticsMarketBrief
        market={market}
        assetSymbol={relevance.matchedKeyword?.toUpperCase() || (market.category === 'Crypto' ? 'SOL' : 'ASSET')}
        assetName={relevance.assetLabel || market.title}
        assetPrice={liveAssetPrice || (market.category === 'Crypto' ? 155 : 2650)}
      />

      {/* Primary vs Secondary Market Mechanism Navigation */}
      <div className="bg-[#05051a] border border-[rgba(138,32,255,0.25)] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-[rgba(138,32,255,0.18)] pb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveMarketTab('primary')}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                activeMarketTab === 'primary'
                  ? 'bg-[#8A20FF] text-white shadow-md'
                  : 'bg-[#080821] text-[#A7A7B8] hover:text-[#F5F5F7]'
              }`}
            >
              Primary Market (Protocol)
            </button>

            <button
              type="button"
              onClick={() => setActiveMarketTab('secondary')}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                activeMarketTab === 'secondary'
                  ? 'bg-[#8A20FF] text-white shadow-md'
                  : 'bg-[#080821] text-[#A7A7B8] hover:text-[#F5F5F7]'
              }`}
            >
              Secondary Market (Order Book)
            </button>

            <button
              type="button"
              onClick={() => setActiveMarketTab('lifecycle')}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                activeMarketTab === 'lifecycle'
                  ? 'bg-[#8A20FF] text-white shadow-md'
                  : 'bg-[#080821] text-[#A7A7B8] hover:text-[#F5F5F7]'
              }`}
            >
              Market Lifecycle
            </button>
          </div>

          <span className="text-xs font-mono text-[#A7A7B8]">
            Currency: <span className="text-[#F5F5F7] font-bold">{market.settlementCurrency || 'USDC'}</span>
          </span>
        </div>

        {/* PRIMARY MARKET VIEW */}
        {activeMarketTab === 'primary' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Mechanism Explanation Banner */}
            <div className="bg-[#000010] border border-[rgba(138,32,255,0.2)] rounded-xl p-4 flex items-start gap-3 text-xs leading-relaxed text-[#A7A7B8]">
              <Info className="w-5 h-5 text-[#8A20FF] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#F5F5F7]">PRIMARY MARKET ARCHITECTURE: </span>
                Users acquire newly issued YES and NO shares directly from protocol liquidity reserves.
                In the Primary Market, YES and NO prices are market-driven and together represent a probability-like forecast signal ($0.00 – $1.00).
              </div>
            </div>

            {/* Probability Bar */}
            <div className="bg-[#080821] border border-[rgba(138,32,255,0.18)] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#A7A7B8]">Primary Consensus Probability</span>
                <span className="text-[#F5F5F7] font-bold text-sm">
                  {yesProbPercent !== null ? `YES ${yesProbPercent}% · NO ${noProbPercent}%` : 'Pending'}
                </span>
              </div>

              {yesProbPercent !== null && (
                <div className="w-full h-3 rounded-full bg-[#000010] overflow-hidden flex">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                    style={{ width: `${yesProbPercent}%` }}
                  />
                  <div
                    className="h-full bg-gradient-to-r from-[#8A20FF] to-[#670CDC] transition-all duration-500"
                    style={{ width: `${100 - yesProbPercent}%` }}
                  />
                </div>
              )}

              {/* Price Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="rounded-xl bg-[#000010] border border-emerald-500/30 p-4 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-emerald-400">YES Outcome Token</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                        {yesProbPercent !== null ? `${yesProbPercent}% prob` : '—'}
                      </span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-[#F5F5F7]">
                      {market.yesPrice !== null ? formatCurrency(market.yesPrice, 'USD', 2) : '—'}
                    </div>
                    <p className="text-[11px] text-[#A7A7B8] leading-tight">
                      Pays out $1.00 {market.settlementCurrency || 'USDC'} if resolution criteria evaluates YES.
                    </p>
                  </div>

                  {currentPhase === 'primary_issuance' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOutcome('YES');
                        setTradeModalOpen(true);
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs font-mono font-bold text-emerald-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Acquire YES Shares</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div className="text-[11px] font-mono text-[#7E6D96] py-1 border-t border-[rgba(138,32,255,0.1)]">
                      Primary issuance closed · Trade on order book
                    </div>
                  )}
                </div>

                <div className="rounded-xl bg-[#000010] border border-[rgba(138,32,255,0.3)] p-4 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-[#A7A7B8]">NO Outcome Token</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#080821] text-[#A7A7B8]">
                        {noProbPercent !== null ? `${noProbPercent}% prob` : '—'}
                      </span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-[#F5F5F7]">
                      {market.noPrice !== null ? formatCurrency(market.noPrice, 'USD', 2) : '—'}
                    </div>
                    <p className="text-[11px] text-[#A7A7B8] leading-tight">
                      Pays out $1.00 {market.settlementCurrency || 'USDC'} if resolution criteria evaluates NO.
                    </p>
                  </div>

                  {currentPhase === 'primary_issuance' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOutcome('NO');
                        setTradeModalOpen(true);
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-[#8A20FF]/25 hover:bg-[#8A20FF]/35 border border-[#8A20FF]/40 text-xs font-mono font-bold text-[#D4A5FF] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Acquire NO Shares</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div className="text-[11px] font-mono text-[#7E6D96] py-1 border-t border-[rgba(138,32,255,0.1)]">
                      Primary issuance closed · Trade on order book
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECONDARY MARKET VIEW */}
        {activeMarketTab === 'secondary' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Mechanism Explanation Banner */}
            <div className="bg-[#000010] border border-[rgba(138,32,255,0.2)] rounded-xl p-4 flex items-start gap-3 text-xs leading-relaxed text-[#A7A7B8]">
              <BookOpen className="w-5 h-5 text-[#FFA742] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#F5F5F7]">SECONDARY MARKET (ORDER BOOK): </span>
                Users trade existing outcome shares through Panta's peer-to-peer Central Limit Order Book (CLOB).
                Secondary market prices represent order-book bid and ask quotes rather than direct probability signals.
              </div>
            </div>

            {/* Order Book Overview Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-[#000010] p-3 rounded-lg border border-[rgba(138,32,255,0.15)]">
                <span className="text-[#7E6D96] block text-[10px]">Best Bid</span>
                <span className="text-sm font-bold text-emerald-400 mt-0.5 block">
                  {market.secondaryMarket?.bestBid ? formatCurrency(market.secondaryMarket.bestBid, 'USD', 2) : '—'}
                </span>
              </div>

              <div className="bg-[#000010] p-3 rounded-lg border border-[rgba(138,32,255,0.15)]">
                <span className="text-[#7E6D96] block text-[10px]">Best Ask</span>
                <span className="text-sm font-bold text-red-400 mt-0.5 block">
                  {market.secondaryMarket?.bestAsk ? formatCurrency(market.secondaryMarket.bestAsk, 'USD', 2) : '—'}
                </span>
              </div>

              <div className="bg-[#000010] p-3 rounded-lg border border-[rgba(138,32,255,0.15)]">
                <span className="text-[#7E6D96] block text-[10px]">Spread</span>
                <span className="text-sm font-bold text-[#F5F5F7] mt-0.5 block">
                  {market.secondaryMarket?.spread !== undefined && market.secondaryMarket?.spread !== null
                    ? formatCurrency(market.secondaryMarket.spread, 'USD', 2)
                    : '—'}
                </span>
              </div>

              <div className="bg-[#000010] p-3 rounded-lg border border-[rgba(138,32,255,0.15)]">
                <span className="text-[#7E6D96] block text-[10px]">Last Traded Price</span>
                <span className="text-sm font-bold text-[#D4A5FF] mt-0.5 block">
                  {market.secondaryMarket?.lastPrice ? formatCurrency(market.secondaryMarket.lastPrice, 'USD', 2) : '—'}
                </span>
              </div>
            </div>

            {/* Depth Preview Table */}
            {market.secondaryMarket?.orderbook && (
              <div className="bg-[#080821] border border-[rgba(138,32,255,0.18)] rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-[#A7A7B8]">
                  Order Book Depth Snapshot
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  {/* Bids */}
                  <div className="space-y-1.5">
                    <span className="text-emerald-400 text-[11px] block font-semibold">Bids (Buy Orders)</span>
                    <div className="space-y-1">
                      {market.secondaryMarket.orderbook.bids.map((b, idx) => (
                        <div key={idx} className="flex justify-between p-2 rounded bg-[#000010]/60 border border-emerald-500/10">
                          <span className="text-emerald-400 font-bold">{formatCurrency(b.price, 'USD', 2)}</span>
                          <span className="text-[#A7A7B8]">{formatNumber(b.size, 0)} shares</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Asks */}
                  <div className="space-y-1.5">
                    <span className="text-red-400 text-[11px] block font-semibold">Asks (Sell Orders)</span>
                    <div className="space-y-1">
                      {market.secondaryMarket.orderbook.asks.map((a, idx) => (
                        <div key={idx} className="flex justify-between p-2 rounded bg-[#000010]/60 border border-red-500/10">
                          <span className="text-red-400 font-bold">{formatCurrency(a.price, 'USD', 2)}</span>
                          <span className="text-[#A7A7B8]">{formatNumber(a.size, 0)} shares</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* LIFECYCLE TIMELINE VIEW */}
        {activeMarketTab === 'lifecycle' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="bg-[#080821] border border-[rgba(138,32,255,0.18)] rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-mono uppercase tracking-wider text-[#A7A7B8]">
                Market Lifecycle Pipeline
              </h4>

              <div className="space-y-3">
                {lifecycleSteps.map((step, idx) => {
                  const isCurrent = step.status === 'active';
                  const isDone = step.status === 'completed';
                  return (
                    <div
                      key={step.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-mono transition-all ${
                        isCurrent
                          ? 'bg-[#100126] border-[#8A20FF] text-[#F5F5F7] shadow-md'
                          : isDone
                          ? 'bg-[#000010] border-emerald-500/25 text-[#A7A7B8]'
                          : 'bg-[#000010]/50 border-[rgba(138,32,255,0.1)] text-[#7E6D96]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                          isDone ? 'bg-emerald-400' : isCurrent ? 'bg-[#8A20FF] animate-pulse' : 'bg-[#1C0142]'
                        }`} />
                        <div>
                          <span className="font-bold text-[#F5F5F7] block">{step.label}</span>
                          <span className="text-[11px] text-[#A7A7B8] font-sans">{step.desc}</span>
                        </div>
                      </div>

                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        isDone ? 'bg-emerald-500/10 text-emerald-400' : isCurrent ? 'bg-[#8A20FF]/20 text-[#D4A5FF]' : 'text-[#7E6D96]'
                      }`}>
                        {step.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Resolution Details & Criteria */}
      <div className="bg-[#05051a] border border-[rgba(138,32,255,0.25)] rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl text-xs">
        <h3 className="text-sm font-semibold font-mono uppercase text-[#F5F5F7] tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Resolution Criteria & Oracle Rules</span>
        </h3>

        {/* Criteria description */}
        <div className="bg-[#000010] border border-[rgba(138,32,255,0.18)] rounded-xl p-4 text-[#EDE4FA] leading-relaxed whitespace-pre-wrap font-sans text-xs sm:text-sm">
          {market.resolutionCriteria || market.description || 'Resolution criteria will be evaluated against official data feeds at market expiration.'}
        </div>

        {/* Resolution Source metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
          <div className="p-3 rounded-lg bg-[#080821] border border-[rgba(138,32,255,0.15)]">
            <span className="text-[#7E6D96] block text-[10px] uppercase">Authoritative Resolution Source</span>
            <span className="text-xs font-semibold text-[#F5F5F7] mt-1 block">
              {market.resolutionSource || 'Panta Autonomous Resolution Oracle'}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#080821] border border-[rgba(138,32,255,0.15)]">
            <span className="text-[#7E6D96] block text-[10px] uppercase">Current Resolution Outcome</span>
            <span className="text-xs font-semibold text-[#F5F5F7] mt-1 block">
              {market.resolutionOutcome || 'UNRESOLVED'}
            </span>
          </div>
        </div>

        {/* Timing Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono pt-2 border-t border-[rgba(138,32,255,0.15)]">
          <div className="p-3 rounded-lg bg-[#080821] border border-[rgba(138,32,255,0.15)]">
            <span className="text-[#7E6D96] block text-[10px]">Start / Inception Time</span>
            <span className="text-xs text-[#F5F5F7] mt-1 block">
              {formattedStart || 'Genesis date'}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#080821] border border-[rgba(138,32,255,0.15)]">
            <span className="text-[#7E6D96] block text-[10px]">Trading Cutoff / Expiry</span>
            <span className="text-xs text-[#F5F5F7] mt-1 block">
              {formattedEnd || 'Open-ended'}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#080821] border border-[rgba(138,32,255,0.15)]">
            <span className="text-[#7E6D96] block text-[10px]">Target Resolution Evaluation</span>
            <span className="text-xs text-[#F5F5F7] mt-1 block">
              {formattedResolution || formattedEnd || 'At event conclusion'}
            </span>
          </div>
        </div>
      </div>

      {/* Contract & Technical On-Chain PDA */}
      <div className="bg-[#05051a] border border-[rgba(138,32,255,0.25)] rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl text-xs font-mono">
        <div className="flex items-center justify-between">
          <span className="text-[#A7A7B8]">Solana Market Account (PDA)</span>
          <button
            type="button"
            onClick={() => handleCopy(market.externalId, 'id')}
            className="flex items-center gap-1 text-[11px] text-[#FFA742] hover:text-[#F99225] cursor-pointer"
          >
            {copiedKey === 'id' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedKey === 'id' ? 'Copied' : 'Copy Address'}</span>
          </button>
        </div>
        <div className="p-3 rounded-lg bg-[#000010] border border-[rgba(138,32,255,0.18)] break-all text-[#F5F5F7]">
          {market.externalId}
        </div>

        {market.creatorAddress && (
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[#A7A7B8]">Market Creator / Authority</span>
              <button
                type="button"
                onClick={() => handleCopy(market.creatorAddress!, 'creator')}
                className="flex items-center gap-1 text-[11px] text-[#FFA742] hover:text-[#F99225] cursor-pointer"
              >
                {copiedKey === 'creator' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'creator' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="p-3 rounded-lg bg-[#000010] border border-[rgba(138,32,255,0.18)] break-all text-[#F5F5F7]">
              {market.creatorAddress}
            </div>
          </div>
        )}

        {/* Action Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[rgba(138,32,255,0.18)]">
          <div className="flex items-center gap-2 text-xs text-[#A7A7B8]">
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Phase 3: Live Solana Trading Active
            </span>
            <span>Non-custodial quote → build → sign → broadcast flow</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {currentPhase === 'primary_issuance' ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedOutcome('YES');
                  setTradeModalOpen(true);
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-[#8A20FF] hover:bg-[#670CDC] text-xs font-mono font-bold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Trade Market</span>
              </button>
            ) : (
              <div className="text-xs font-mono text-[#FFA742] px-3 py-1.5 rounded-lg bg-[#080821] border border-[rgba(138,32,255,0.2)]">
                Secondary trading integration coming next.
              </div>
            )}

            {market.sourceUrl && (
              <a
                href={market.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-[#080821] hover:bg-[#100126] border border-[rgba(138,32,255,0.25)] text-xs font-semibold text-[#F5F5F7] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Inspect on Panta</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Trading Modal */}
      {tradeModalOpen && (
        <PantaTradingModal
          market={market}
          initialOutcome={selectedOutcome}
          onClose={() => setTradeModalOpen(false)}
        />
      )}
    </div>
  );
};
