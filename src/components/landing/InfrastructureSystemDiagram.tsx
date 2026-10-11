import React, { useState, useEffect } from 'react';

type SectionHighlight = 'asset' | 'rules' | 'liquidity' | 'market' | 'value';

interface StageMeta {
  id: SectionHighlight;
  step: string;
  name: string;
  subtitle: string;
  formula: string;
  desc: string;
}

const STAGES_META: StageMeta[] = [
  {
    id: 'asset',
    step: '01',
    name: 'ASSET',
    subtitle: 'Tokenized Collateral',
    formula: 'Mint(SPL_Token, S₀)',
    desc: 'Discrete tokenized ETF, treasury, or fund collateral held in sovereign on-chain escrow.',
  },
  {
    id: 'rules',
    step: '02',
    name: 'RULES',
    subtitle: 'Invariant Inscription',
    formula: 'P(S) = P₀ + α · (S / S_max)^β',
    desc: 'Deterministic mathematical constraints lock marginal pricing without human intermediaries.',
  },
  {
    id: 'liquidity',
    step: '03',
    name: 'LIQUIDITY',
    subtitle: 'Bilateral Reserves',
    formula: 'R_quote = ∫ P(s) ds',
    desc: 'Continuous quote reserves form an autonomous liquidity depth buffer without orderbooks.',
  },
  {
    id: 'market',
    step: '04',
    name: 'MARKET',
    subtitle: 'Autonomous Execution',
    formula: 'Slot Finality < 400ms',
    desc: 'Counterparty-free swaps execute continuously on the Solana Meteora DBC program.',
  },
  {
    id: 'value',
    step: '05',
    name: 'VALUE',
    subtitle: 'Graduation & AMM',
    formula: '100% Migration → DAMM Pool',
    desc: 'At $69,000 reserve threshold, liquidity automatically migrates to open Meteora AMMs.',
  },
];

export const InfrastructureSystemDiagram: React.FC = () => {
  const [highlight, setHighlight] = useState<SectionHighlight>('liquidity');
  const [pulsePhase, setPulsePhase] = useState(0);

  useEffect(() => {
    let animId: number;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      if (dt > 50) {
        setPulsePhase((prev) => (prev + dt * 0.02) % 100);
        last = now;
      }
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  const width = 1000;
  const height = 340;
  const yAxis = 160;

  // 5 Node Positions along the horizontal bus
  const nodes = [
    { id: 'asset', x: 100, label: 'ASSET', sub: 'Collateral' },
    { id: 'rules', x: 300, label: 'RULES', sub: 'Invariants' },
    { id: 'liquidity', x: 500, label: 'LIQUIDITY', sub: 'Reserves' },
    { id: 'market', x: 700, label: 'MARKET', sub: 'Execution' },
    { id: 'value', x: 900, label: 'VALUE', sub: 'Settlement' },
  ] as const;

  const currentMeta = STAGES_META.find((s) => s.id === highlight) || STAGES_META[2];
  const busDashOffset = (pulsePhase * 2) % 32;

  return (
    <section id="system" className="py-24 sm:py-32 lg:py-40 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12">
        {/* Section Headline */}
        <div className="max-w-xl mb-10 sm:mb-14">
          <span className="text-[11px] font-mono tracking-widest uppercase text-emerald-400 block mb-3">
            02 / THE ARCHITECTURE
          </span>
          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white font-display [text-wrap:balance] leading-[1.02]">
            The market<br />pipeline.
          </h2>
        </div>

        {/* 1. BIG ARCHITECTURAL SCHEMATIC VISUAL */}
        <div className="relative w-full aspect-[1.6/1] sm:aspect-[2.5/1] min-h-[290px] sm:min-h-[360px] lg:min-h-[380px] flex items-center justify-center rounded-xl bg-[#140130] border border-[#670CDC]/30 p-3 sm:p-6 shadow-2xl shadow-[#09011B]/95 overflow-hidden">
          {/* Subtle Grid Watermark */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, #e2e8f0 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />

          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-full select-none"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="systemBusGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#8023EC" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#D11CA5" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#F99225" stopOpacity="0.9" />
              </linearGradient>

              <filter id="nodeGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Continuous Backbone Conduits Connecting All 5 Pillars */}
            <line
              x1={nodes[0].x}
              y1={yAxis}
              x2={nodes[nodes.length - 1].x}
              y2={yAxis}
              stroke="#350968"
              strokeWidth="2"
            />
            <line
              x1={nodes[0].x}
              y1={yAxis}
              x2={nodes[nodes.length - 1].x}
              y2={yAxis}
              stroke="url(#systemBusGrad)"
              strokeWidth="2"
              strokeDasharray="4 6"
              strokeDashoffset={-busDashOffset}
              opacity="0.85"
            />

            {/* Render Each Node */}
            {nodes.map((node) => {
              const isSelected = highlight === node.id;
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${yAxis})`}
                  onMouseEnter={() => setHighlight(node.id as SectionHighlight)}
                  onClick={() => setHighlight(node.id as SectionHighlight)}
                  className="cursor-pointer group"
                >
                  {/* Outer Orbit Guide */}
                  <circle
                    r="44"
                    fill="none"
                    stroke={isSelected ? '#F99225' : 'rgba(103, 12, 220, 0.25)'}
                    strokeWidth="1"
                    strokeDasharray={isSelected ? 'none' : '2 4'}
                    className="transition-colors duration-300"
                  />

                  {/* Inner Solid Capsule */}
                  <circle
                    r="32"
                    fill="#100126"
                    stroke={isSelected ? '#F99225' : '#670CDC'}
                    strokeWidth={isSelected ? '1.5' : '1'}
                    className="transition-colors duration-300"
                  />

                  {/* Central Geometric Glyph matching shared visual language */}
                  {node.id === 'asset' && (
                    <polygon points="0,-12 12,0 0,12 -12,0" fill="#19013D" stroke="#EDE4FA" strokeWidth="1.2" />
                  )}
                  {node.id === 'rules' && (
                    <rect x="-8" y="-8" width="16" height="16" fill="#19013D" stroke="#EDE4FA" strokeWidth="1.2" rx="2" />
                  )}
                  {node.id === 'liquidity' && (
                    <path d="M -9 5 Q 0 -11 9 5 Z" fill="#19013D" stroke="#EDE4FA" strokeWidth="1.2" />
                  )}
                  {node.id === 'market' && (
                    <circle r="9" fill="#19013D" stroke="#EDE4FA" strokeWidth="1.2" />
                  )}
                  {node.id === 'value' && (
                    <polygon points="0,-12 11,-6 11,6 0,12 -11,6 -11,-6" fill="#19013D" stroke="#EDE4FA" strokeWidth="1.2" />
                  )}

                  {/* Status Dot */}
                  <circle r="3" fill="#F99225" />

                  {/* Active Indicator Pulse Ring */}
                  {isSelected && (
                    <circle
                      r="40"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="1"
                      opacity="0.45"
                      filter="url(#nodeGlow)"
                    />
                  )}

                  {/* Text Labels Under Node */}
                  <text
                    x="0"
                    y="64"
                    textAnchor="middle"
                    fill={isSelected ? '#F7F3FF' : '#B8A9CC'}
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="600"
                    letterSpacing="0.06em"
                  >
                    {node.label}
                  </text>
                  <text
                    x="0"
                    y="78"
                    textAnchor="middle"
                    fill={isSelected ? '#F99225' : '#7E6D96'}
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {node.sub}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* 2. DYNAMIC TECHNICAL METADATA STRIP */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-8 border-t border-[#670CDC]/20 text-xs font-mono">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-[#F99225] uppercase tracking-widest font-semibold">
                STAGE {currentMeta.step} · {currentMeta.name}
              </span>
              <span className="text-[#670CDC]/40">/</span>
              <span className="text-[#B8A9CC]">{currentMeta.subtitle}</span>
            </div>
            <p className="text-[#EDE4FA] text-sm font-light leading-relaxed">
              {currentMeta.desc}
            </p>
          </div>

          <div className="shrink-0 bg-[#100126] px-4 py-2.5 rounded border border-[#670CDC]/30">
            <span className="text-[10px] text-[#7E6D96] block uppercase tracking-wider mb-0.5">
              INVARIANT / METRIC
            </span>
            <span className="text-[#F99225] font-medium font-mono text-xs sm:text-sm">
              {currentMeta.formula}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
