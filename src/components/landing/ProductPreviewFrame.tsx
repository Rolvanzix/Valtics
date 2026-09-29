import React, { useState } from 'react';
import { ArrowUpRight, Lock } from 'lucide-react';
import { NavigationTab } from '../layout/Header';

interface ProductPreviewFrameProps {
  onEnterApp: (targetTab?: NavigationTab) => void;
}

export const ProductPreviewFrame: React.FC<ProductPreviewFrameProps> = ({ onEnterApp }) => {
  const [activeTab, setActiveTab] = useState<'screener' | 'studio' | 'create'>('screener');
  const [tilt, setTilt] = useState({ x: 1, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only apply tilt on hover-capable devices
    if (window.matchMedia('(hover: none)').matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      x: 1 - y * 3.5,
      y: x * 3.5,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 1, y: 0 });
  };

  return (
    <section id="showcase" className="py-24 sm:py-36 lg:py-44 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        {/* Section Headline */}
        <div className="max-w-2xl mb-12 sm:mb-16">
          <span className="text-[11px] font-mono tracking-widest uppercase text-emerald-400 block mb-3">
            03 / THE DESTINATION
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white font-display [text-wrap:balance] leading-[1.08] mb-4">
            Where markets actually happen.
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 font-light leading-relaxed">
            We explained the market. Here is where it executes on Solana — real-time Pyth Hermes oracle benchmarks, interactive curve simulations, and autonomous market creation.
          </p>
        </div>

        {/* Layered Showcase Chassis */}
        <div
          className="relative transition-transform duration-300 ease-out"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Subtle Backing Frame Layer */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent rounded-2xl transform -translate-y-2 scale-[0.99] blur-xs pointer-events-none" />

          {/* Foreground Browser Chassis */}
          <div
            className="relative rounded-2xl bg-[#080b12] border border-white/[0.12] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.95)] overflow-hidden transition-all duration-300"
            style={{
              transform: `perspective(1400px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            }}
          >
            {/* Top Minimal Chrome Bar */}
            <div className="bg-[#0b0e17] px-4 sm:px-6 py-3.5 border-b border-white/[0.06] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/[0.15]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/[0.15]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/[0.15]" />
                </div>

                <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-black/40 border border-white/[0.06] text-[10px] sm:text-[11px] font-mono text-zinc-400">
                  <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="truncate max-w-[130px] sm:max-w-none">
                    app.valtics.fi/{activeTab === 'screener' ? 'markets' : activeTab}
                  </span>
                </div>
              </div>

              {/* View Selector Tabs */}
              <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-lg border border-white/[0.06] overflow-x-auto no-scrollbar">
                {[
                  { id: 'screener', label: 'Exchange Screener' },
                  { id: 'studio', label: 'Curve Studio' },
                  { id: 'create', label: 'Market Creator' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id as any)}
                    className={`px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-mono rounded transition-colors cursor-pointer whitespace-nowrap ${
                      activeTab === t.id
                        ? 'bg-white/[0.1] text-white font-medium'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Direct App Launch Button */}
              <button
                type="button"
                onClick={() =>
                  onEnterApp(
                    activeTab === 'screener'
                      ? 'explore-assets'
                      : activeTab === 'studio'
                      ? 'studio'
                      : 'create'
                  )
                }
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono text-zinc-950 bg-white hover:bg-zinc-200 transition-colors cursor-pointer shrink-0"
              >
                <span>Launch</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Interior Screen Surface */}
            <div className="p-4 sm:p-6 lg:p-8 bg-[#06080e] min-h-[440px]">
              {/* TAB 1: Real-Time Screener Preview */}
              {activeTab === 'screener' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] text-xs font-mono text-zinc-400">
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      TOKENIZED BENCHMARKS (HERMES V2)
                    </span>
                    <span className="text-emerald-400 text-[11px]">ORACLE VERIFIED · 100% LIVE</span>
                  </div>

                  <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left text-xs font-mono whitespace-nowrap">
                      <thead>
                        <tr className="border-b border-white/[0.06] text-zinc-500 text-[10px] uppercase">
                          <th className="py-2.5 px-3">Asset</th>
                          <th className="py-2.5 px-3">Price (USD)</th>
                          <th className="py-2.5 px-3">24h Change</th>
                          <th className="py-2.5 px-3">24h Range</th>
                          <th className="py-2.5 px-3">Valuation</th>
                          <th className="py-2.5 px-3">Issuer / Benchmark</th>
                          <th className="py-2.5 px-3 text-right">Deployment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {[
                          { name: 'ARK 21Shares Bitcoin ETF', sym: 'ARKB', price: '$89.42', ch: '+3.42%', pos: true, rng: '$91.20 / $86.50', val: '$3.42B', iss: 'ARK Invest / 21Shares' },
                          { name: 'iShares Bitcoin Trust', sym: 'IBIT', price: '$51.18', ch: '+3.25%', pos: true, rng: '$52.00 / $49.80', val: '$18.9B', iss: 'BlackRock iShares' },
                          { name: 'Ondo US Dollar Yield', sym: 'USDY', price: '$1.05', ch: '+0.04%', pos: true, rng: '$1.06 / $1.04', val: '$480M', iss: 'Ondo Finance' },
                          { name: 'Gold Spot Benchmark', sym: 'XAU/USD', price: '$2,714.50', ch: '-0.18%', pos: false, rng: '$2,728.00 / $2,702.10', val: '$16.2T', iss: 'LBMA / COMEX Benchmark' },
                          { name: 'Paxos Gold Tokenized', sym: 'PAXG', price: '$2,716.20', ch: '-0.15%', pos: false, rng: '$2,730.00 / $2,704.00', val: '$510M', iss: 'Paxos Trust Company' },
                        ].map((row) => (
                          <tr
                            key={row.sym}
                            onClick={() => onEnterApp('markets')}
                            className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                          >
                            <td className="py-3 px-3">
                              <span className="text-white font-medium block">{row.name}</span>
                              <span className="text-[10px] text-zinc-500">{row.sym}</span>
                            </td>
                            <td className="py-3 px-3 text-white font-mono-nums font-medium">{row.price}</td>
                            <td className={`py-3 px-3 font-mono-nums ${row.pos ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {row.ch}
                            </td>
                            <td className="py-3 px-3 text-zinc-400 font-mono-nums">{row.rng}</td>
                            <td className="py-3 px-3 text-zinc-300 font-mono-nums">{row.val}</td>
                            <td className="py-3 px-3 text-zinc-400">{row.iss}</td>
                            <td className="py-3 px-3 text-right">
                              <span className="text-[11px] text-emerald-400 group-hover:underline">
                                Deploy DBC →
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: Parametric Curve Studio Preview */}
              {activeTab === 'studio' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
                  <div className="lg:col-span-8 space-y-4">
                    <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pb-2 border-b border-white/[0.06]">
                      <span>DYNAMIC BONDING SIMULATION</span>
                      <span className="text-emerald-400">P(S) = P₀ + α·S²·²</span>
                    </div>

                    <div className="h-56 bg-black/40 border border-white/[0.06] rounded-xl p-4 flex flex-col justify-between">
                      <div className="w-full h-36">
                        <svg viewBox="0 0 500 120" className="w-full h-full" preserveAspectRatio="none">
                          <path d="M 0 115 Q 150 110, 300 60 T 500 10" fill="none" stroke="#10b981" strokeWidth="2.5" />
                          <line x1="0" y1="28" x2="500" y2="28" stroke="#ffffff" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
                          <text x="490" y="24" textAnchor="end" fill="#10b981" fontSize="9" fontFamily="monospace">
                            Graduation Horizon: $69,000 USDC
                          </text>
                        </svg>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 pt-2 border-t border-white/[0.06]">
                        <span>INITIAL: $0.000028</span>
                        <span>TARGET: $0.001420</span>
                        <span>SLIPPAGE CAP: &lt; 0.12%</span>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-4 space-y-3 font-mono text-xs">
                    <div className="p-3 rounded bg-white/[0.02] border border-white/[0.06]">
                      <span className="text-zinc-500 block text-[10px]">QUOTE CURRENCY</span>
                      <span className="text-white font-medium">USDC · Circle SPL</span>
                    </div>
                    <div className="p-3 rounded bg-white/[0.02] border border-white/[0.06]">
                      <span className="text-zinc-500 block text-[10px]">GRADUATION TARGET</span>
                      <span className="text-emerald-400 font-medium">$69,000 Verified</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onEnterApp('studio')}
                      className="w-full py-2.5 rounded text-xs font-mono text-zinc-950 bg-white hover:bg-zinc-200 transition-colors cursor-pointer mt-2"
                    >
                      Open Curve Studio →
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: Market Deployment Engine Preview */}
              {activeTab === 'create' && (
                <div className="max-w-2xl mx-auto space-y-6 text-xs font-mono py-4">
                  <div className="text-center pb-4 border-b border-white/[0.06]">
                    <span className="text-white font-medium text-sm font-sans block mb-1">
                      Institutional Market Creation
                    </span>
                    <span className="text-zinc-400 text-xs">
                      Meteora Dynamic Bonding Curve Protocol · Solana Invariant
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px]">
                    {['Asset Spec', 'Curve Math', 'Collateral', 'Deploy'].map((st, idx) => (
                      <div
                        key={st}
                        className={`p-2.5 rounded border ${
                          idx === 0
                            ? 'bg-white/[0.06] border-emerald-400/80 text-white'
                            : 'bg-black/30 border-white/[0.06] text-zinc-500'
                        }`}
                      >
                        <span className="block text-emerald-400">0{idx + 1}</span>
                        <span>{st}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded bg-white/[0.02] border border-white/[0.06] space-y-2">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Program Target:</span>
                      <span className="text-white">Meteora DBC v1.5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Authorization:</span>
                      <span className="text-emerald-400">Verified Solana Wallet Key</span>
                    </div>
                  </div>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => onEnterApp('create')}
                      className="px-6 py-2.5 rounded text-xs font-mono text-zinc-950 bg-white hover:bg-zinc-200 transition-colors cursor-pointer"
                    >
                      Launch Deployment Wizard →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
