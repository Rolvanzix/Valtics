import React, { useState } from 'react';
import {
  Sliders,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  Info,
  Layers,
  MessageSquareCode,
  Check,
} from 'lucide-react';
import { CurveModelParams } from '../../types';

interface AgentCurveArchitectProps {
  onApplyCurveToCreation: (params: CurveModelParams) => void;
  onAskAgentCritique: (summaryText: string) => void;
}

type AssetArchetype = 'treasury' | 'credit' | 'real_estate' | 'crypto';

export const AgentCurveArchitect: React.FC<AgentCurveArchitectProps> = ({
  onApplyCurveToCreation,
  onAskAgentCritique,
}) => {
  const [archetype, setArchetype] = useState<AssetArchetype>('treasury');
  const [quoteAsset, setQuoteAsset] = useState<'USDC' | 'SOL'>('USDC');
  const [curveType, setCurveType] = useState<'linear' | 'exponential' | 'sigmoid' | 'piecewise'>('linear');
  const [startPrice, setStartPrice] = useState<number>(1.0);
  const [targetCap, setTargetCap] = useState<number>(15000000);
  const [curveAllocationPct, setCurveAllocationPct] = useState<number>(80);
  const [feeBps, setFeeBps] = useState<number>(50);
  const [antiSniperSlots, setAntiSniperSlots] = useState<number>(40);
  const [vestingDays, setVestingDays] = useState<number>(90);

  const applyArchetype = (type: AssetArchetype) => {
    setArchetype(type);
    switch (type) {
      case 'treasury':
        setCurveType('linear');
        setStartPrice(1.0);
        setTargetCap(12000000);
        setCurveAllocationPct(80);
        setFeeBps(25);
        setAntiSniperSlots(40);
        setQuoteAsset('USDC');
        break;
      case 'credit':
        setCurveType('sigmoid');
        setStartPrice(1.0);
        setTargetCap(20000000);
        setCurveAllocationPct(80);
        setFeeBps(75);
        setAntiSniperSlots(50);
        setQuoteAsset('USDC');
        break;
      case 'real_estate':
        setCurveType('linear');
        setStartPrice(10.0);
        setTargetCap(25000000);
        setCurveAllocationPct(75);
        setFeeBps(100);
        setAntiSniperSlots(40);
        setQuoteAsset('USDC');
        break;
      case 'crypto':
        setCurveType('exponential');
        setStartPrice(0.01);
        setTargetCap(5000000);
        setCurveAllocationPct(85);
        setFeeBps(100);
        setAntiSniperSlots(60);
        setQuoteAsset('SOL');
        break;
    }
  };

  // Derived curve calculations
  const totalSupply = 10000000;
  const tokensOnCurve = (totalSupply * curveAllocationPct) / 100;
  const quoteAtGraduationEstimate = ((targetCap * 0.15) / (quoteAsset === 'SOL' ? 150 : 1)).toFixed(0);

  const currentParams: CurveModelParams = {
    curveType,
    totalSupply,
    allocationToCurvePct: curveAllocationPct,
    startPriceUsd: startPrice,
    migrationMarketCapUsd: targetCap,
    quoteAsset,
    quotePriceUsd: quoteAsset === 'SOL' ? 150 : 1.0,
    feeBps,
    antiSniperSlots,
    migrationTarget: 'meteora_damm' as any,
    vestingDays,
  };

  const handleApply = () => {
    onApplyCurveToCreation(currentParams);
  };

  const handleCritique = () => {
    const prompt = `Please review and critique this proposed Meteora DBC curve model on Solana Devnet:
- Asset Archetype: ${archetype}
- Curve Algorithm: ${curveType.toUpperCase()}
- Start Price: $${startPrice} ${quoteAsset}
- Target Graduation Market Cap: $${(targetCap / 1_000_000).toFixed(1)}M
- Curve Allocation: ${curveAllocationPct}% (${tokensOnCurve.toLocaleString()} tokens)
- Trading Fee: ${feeBps} bps (${(feeBps / 100).toFixed(2)}%)
- Anti-Sniper Window: ${antiSniperSlots} slots
- Quote Mint: Devnet ${quoteAsset}
Is this model optimal for liquidity discovery, and what adjustments would you recommend?`;
    onAskAgentCritique(prompt);
  };

  return (
    <div className="space-y-6">
      {/* Archetype Selector Cards */}
      <div className="space-y-2">
        <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
          Select Asset Archetype Preset
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              id: 'treasury',
              title: 'Tokenized Treasury',
              desc: 'Par NAV anchored ($1.00), tight 25 bps spread, linear discovery',
              badge: 'Sovereign Debt',
            },
            {
              id: 'credit',
              title: 'Private Credit Facility',
              desc: 'Controlled S-curve pricing, 75 bps fee, high capital efficiency',
              badge: 'Structured Yield',
            },
            {
              id: 'real_estate',
              title: 'Real Estate Equity',
              desc: 'Property-backed asset notes, conservative discovery, 100 bps spread',
              badge: 'Asset-Backed',
            },
            {
              id: 'crypto',
              title: 'Utility / Community',
              desc: 'Dynamic exponential curve in SOL quote, high volatility discovery',
              badge: 'Growth Asset',
            },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => applyArchetype(item.id as AssetArchetype)}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                archetype === item.id
                  ? 'border-emerald-500 bg-emerald-950/20 text-white shadow-md'
                  : 'border-zinc-800 bg-[#090d14]/70 hover:border-zinc-700 text-zinc-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  {item.badge}
                </span>
                {archetype === item.id && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                )}
              </div>
              <h4 className="text-xs font-semibold text-zinc-100">{item.title}</h4>
              <p className="text-[11px] text-zinc-400 mt-1 leading-normal font-sans">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Configuration & Interactive Tuning */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Sliders & Controls */}
        <div className="lg:col-span-2 space-y-4 rounded-xl border border-zinc-800 bg-[#090d14]/80 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider font-mono">
                Mathematical Curve Parameters
              </h3>
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">Devnet Meteora DBC Core</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Curve Algorithm Type */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium">Curve Mathematical Shape</label>
              <select
                value={curveType}
                onChange={(e) => setCurveType(e.target.value as any)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-hidden focus:border-zinc-600"
              >
                <option value="linear">Linear (Predictable Discovery)</option>
                <option value="sigmoid">Sigmoid / S-Curve (Stabilized Plateau)</option>
                <option value="exponential">Exponential (Rapid Growth)</option>
                <option value="piecewise">Piecewise (Floor Anchored)</option>
              </select>
            </div>

            {/* Quote Asset */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium">Quote Asset (Devnet)</label>
              <div className="flex items-center gap-2">
                {(['USDC', 'SOL'] as const).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuoteAsset(q)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer border ${
                      quoteAsset === q
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
                    }`}
                  >
                    Devnet {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Starting Price */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Initial Spot Price</span>
                <span className="font-mono text-zinc-200 font-semibold">${startPrice} {quoteAsset}</span>
              </div>
              <input
                type="range"
                min="0.01"
                max="100"
                step="0.05"
                value={startPrice}
                onChange={(e) => setStartPrice(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Target Valuation */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Target Graduation Market Cap</span>
                <span className="font-mono text-zinc-200 font-semibold">${(targetCap / 1_000_000).toFixed(1)}M</span>
              </div>
              <input
                type="range"
                min="1000000"
                max="50000000"
                step="1000000"
                value={targetCap}
                onChange={(e) => setTargetCap(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Curve Allocation % */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Supply Allocated to Curve</span>
                <span className="font-mono text-zinc-200 font-semibold">{curveAllocationPct}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={curveAllocationPct}
                onChange={(e) => setCurveAllocationPct(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Trading Fee Bps */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Trading Fee Spread</span>
                <span className="font-mono text-zinc-200 font-semibold">{feeBps} bps ({(feeBps / 100).toFixed(2)}%)</span>
              </div>
              <input
                type="range"
                min="10"
                max="250"
                step="5"
                value={feeBps}
                onChange={(e) => setFeeBps(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Anti-Sniper Window */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Anti-Sniper Window</span>
                <span className="font-mono text-zinc-200 font-semibold">{antiSniperSlots} slots (~{(antiSniperSlots * 0.4).toFixed(0)}s)</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="10"
                value={antiSniperSlots}
                onChange={(e) => setAntiSniperSlots(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Liquidity Lock Days */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">DAMM Liquidity Lock Duration</span>
                <span className="font-mono text-zinc-200 font-semibold">{vestingDays} days</span>
              </div>
              <input
                type="range"
                min="30"
                max="365"
                step="30"
                value={vestingDays}
                onChange={(e) => setVestingDays(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Model Summary & Action Cards */}
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-[#090d14]/90 p-5 space-y-4">
            <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider font-mono">
              Simulated Curve Output
            </h4>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between py-1.5 border-b border-zinc-800/80">
                <span className="text-zinc-500">Graduation Target</span>
                <span className="text-emerald-400 font-semibold">~{quoteAtGraduationEstimate} {quoteAsset}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-800/80">
                <span className="text-zinc-500">Tokens in Curve</span>
                <span className="text-zinc-200">{tokensOnCurve.toLocaleString()} tokens</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-800/80">
                <span className="text-zinc-500">Migration Target</span>
                <span className="text-cyan-400">Meteora DAMM</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-800/80">
                <span className="text-zinc-500">Vesting Lock</span>
                <span className="text-zinc-200">{vestingDays} Days</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-zinc-500">Cluster</span>
                <span className="text-amber-400">Solana Devnet</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleApply}
                className="w-full py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <span>Export to Market Creator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleCritique}
                className="w-full py-2.5 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs transition-colors flex items-center justify-center gap-2 border border-zinc-700 cursor-pointer"
              >
                <MessageSquareCode className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ask Agent to Critique Model</span>
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-4 text-[11px] text-zinc-400 flex items-start gap-2.5 font-sans">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              All curve parameters conform to the official Meteora Dynamic Bonding Curve smart contract constraints on Solana Devnet.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
