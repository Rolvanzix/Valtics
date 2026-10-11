import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  TrendingUp,
  Clock,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Info,
  Loader2
} from 'lucide-react';
import { ValticsPredictionMarket } from '../../types/panta';
import { fetchMarketBrief } from '../../services/intelligenceClientService';
import { MarketBriefResult } from '../../services/marketIntelligenceEngine';
import { formatCurrency } from '../../utils/format';

interface ValticsMarketBriefProps {
  market: ValticsPredictionMarket;
  assetSymbol: string;
  assetName: string;
  assetPrice: number;
}

export const ValticsMarketBrief: React.FC<ValticsMarketBriefProps> = ({
  market,
  assetSymbol,
  assetName,
  assetPrice,
}) => {
  const [brief, setBrief] = useState<MarketBriefResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [collapsed, setCollapsed] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    setLoading(true);

    fetchMarketBrief({
      assetSymbol,
      assetName,
      currentPrice: assetPrice,
      marketQuestion: market.question || market.title,
      marketPhase: market.marketPhase || (market.status === 'resolved' ? 'resolved' : 'secondary_trading'),
      yesPrice: market.yesPrice,
      noPrice: market.noPrice,
      volume: market.volume,
      endTime: market.endTime,
      resolutionSource: market.resolutionSource,
    })
      .then((data) => {
        if (active) setBrief(data);
      })
      .catch((err) => {
        console.warn('Brief generation error:', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [market, assetSymbol, assetName, assetPrice]);

  const isPrimary = (market.marketPhase || 'secondary_trading') === 'primary_issuance';

  return (
    <div className="bg-[#05051a] border border-[#8A20FF]/30 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl font-mono text-xs text-[#F5F5F7]">
      {/* Brief Header */}
      <div className="flex items-center justify-between border-b border-[rgba(138,32,255,0.18)] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#100126] border border-[#8A20FF]/40 flex items-center justify-center text-[#D4A5FF]">
            <Sparkles className="w-4 h-4 text-[#8A20FF]" />
          </div>
          <div>
            <h4 className="text-sm font-bold tracking-tight text-[#F5F5F7] font-sans">
              VALTICS MARKET BRIEF
            </h4>
            <span className="text-[10px] text-[#A7A7B8]">
              Intelligence & Structured Analysis for {assetSymbol}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded text-[#A7A7B8] hover:text-[#F5F5F7] cursor-pointer"
        >
          {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="space-y-4 animate-in fade-in">
          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-[#000010] p-3 rounded-xl border border-[rgba(138,32,255,0.18)]">
            <div>
              <span className="text-[#7E6D96] block text-[10px] uppercase">Underlying Spot</span>
              <span className="font-bold text-[#F5F5F7]">{formatCurrency(assetPrice, 'USD', 2)}</span>
            </div>
            <div>
              <span className="text-[#7E6D96] block text-[10px] uppercase">Market Phase</span>
              <span className="font-bold text-[#D4A5FF] uppercase">{market.marketPhase?.replace('_', ' ') || 'ACTIVE'}</span>
            </div>
            <div>
              <span className="text-[#7E6D96] block text-[10px] uppercase">
                {isPrimary ? 'Primary Prob (YES)' : 'Secondary Market Price'}
              </span>
              <span className="font-bold text-emerald-400">
                {market.yesPrice !== null ? formatCurrency(market.yesPrice, 'USD', 2) : '—'}
              </span>
            </div>
            <div>
              <span className="text-[#7E6D96] block text-[10px] uppercase">Trading Volume</span>
              <span className="font-bold text-[#F5F5F7]">
                {market.volume !== null ? formatCurrency(market.volume, 'USD', 0) : '$0'}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="py-6 flex items-center justify-center gap-2 text-xs text-[#A7A7B8]">
              <Loader2 className="w-4 h-4 animate-spin text-[#8A20FF]" />
              <span>Generating institutional market research brief...</span>
            </div>
          ) : brief ? (
            <div className="space-y-4">
              {/* 1. FACTS */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider text-[#D4A5FF] font-bold block">
                  1. FACTS (VERIFIABLE DATA)
                </span>
                <div className="p-3 rounded-xl bg-[#080821] border border-[rgba(138,32,255,0.15)] space-y-1">
                  {brief.facts.map((fact, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[11px] text-[#A7A7B8]">
                      <span className="text-[#8A20FF]">•</span>
                      <span>{fact}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. MARKET DATA & PRICE SEMANTICS */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider text-[#FFA742] font-bold block">
                  2. MARKET DATA & PRICE SEMANTICS
                </span>
                <div className="p-3 rounded-xl bg-[#000010] border border-[rgba(138,32,255,0.2)] space-y-2 text-[11px]">
                  <div className="flex items-start gap-2 text-[#F5F5F7]">
                    <Info className="w-3.5 h-3.5 text-[#FFA742] shrink-0 mt-0.5" />
                    <span>{brief.marketData.priceSemantics}</span>
                  </div>
                  <div className="text-[11px] text-emerald-300 pl-5">
                    Consensus Signal: <strong>{brief.marketData.impliedSignal}</strong>
                  </div>
                </div>
              </div>

              {/* 3. AI INTERPRETATION */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold block">
                  3. AI INTERPRETATION (ANALYTICAL SYNTHESIS)
                </span>
                <div className="p-3 rounded-xl bg-[#080821] border border-emerald-500/20 space-y-1.5">
                  {brief.aiInterpretation.map((interp, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[11px] text-[#EDE4FA]">
                      <span className="text-emerald-400">→</span>
                      <span>{interp}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strictly Enforced Disclaimer */}
              <div className="p-2.5 rounded-lg bg-[#000010] border border-[rgba(138,32,255,0.15)] text-[10px] text-[#7E6D96] leading-relaxed">
                {brief.disclaimer}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
