import React, { useState, useEffect } from 'react';

interface Stage {
  id: number;
  label: string;
  phrase: string;
  math: string;
  detail: string;
}

const STAGES: Stage[] = [
  {
    id: 1,
    label: 'Asset',
    phrase: 'A discrete tokenized asset enters the system.',
    math: 'Collateral = Mint(SPL_Token, S₀)',
    detail: 'Tokenized Treasury, RWA, or Fund Unit suspended in an unbonded state.',
  },
  {
    id: 2,
    label: 'Rules',
    phrase: 'Boundary constraints and bonding curve invariants lock into place.',
    math: 'P(S) = P₀ · (1 + α · S^β)',
    detail: 'Deterministic mathematical pricing schedule replaces centralized market makers.',
  },
  {
    id: 3,
    label: 'Liquidity',
    phrase: 'Bilateral reserve conduits project continuous liquidity rails.',
    math: 'R_quote = ∫ P(s) ds  [from 0 to S]',
    detail: 'Quote reserves (USDC) and asset reserves form orderbook-free counterparty buffer.',
  },
  {
    id: 4,
    label: 'Value',
    phrase: 'An autonomous, self-clearing market emerges on Solana.',
    math: 'Graduation → Open Meteora DAMM Pool',
    detail: 'Sub-400ms finality with verified 100% liquidity graduation at threshold.',
  },
];

export const AssetToMarketVisual: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isAuto, setIsAuto] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Slow, purposeful, calm sequence
  useEffect(() => {
    if (!isAuto) return;
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev % 4) + 1);
    }, 4500);
    return () => clearInterval(timer);
  }, [isAuto]);

  const active = STAGES[currentStep - 1];

  const width = 960;
  const height = 480;
  const cx = width / 2;
  const cy = height / 2 - 10;

  return (
    <section id="transformation" className="py-24 sm:py-32 lg:py-40 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12">
        {/* Minimal Typographic Kicker */}
        <div className="max-w-xl mb-10 sm:mb-14">
          <span className="text-[11px] font-mono tracking-widest uppercase text-emerald-400 block mb-3">
            01 / TRANSFORMATION
          </span>
          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white font-display [text-wrap:balance] leading-[1.02]">
            From asset.<br />To market.
          </h2>
        </div>

        {/* Narrative Stepper (Smooth Horizontal Scroll on Mobile, No Clutter) */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-6 sm:mb-8 text-xs font-mono">
          <div className="flex items-center gap-4 sm:gap-10 overflow-x-auto no-scrollbar scroll-smooth w-full sm:w-auto py-1">
            {STAGES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setCurrentStep(s.id);
                  setIsAuto(false);
                }}
                className={`py-1.5 px-1 cursor-pointer transition-all whitespace-nowrap flex items-center gap-2 ${
                  currentStep === s.id
                    ? 'text-white font-semibold border-b-2 border-emerald-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span className={`text-[10px] ${currentStep === s.id ? 'text-emerald-400' : 'text-zinc-600'}`}>
                  0{s.id}
                </span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsAuto(!isAuto)}
            className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors hidden sm:inline-block cursor-pointer shrink-0"
          >
            {isAuto ? 'Pause sequence' : 'Resume sequence'}
          </button>
        </div>

        {/* The Generous Visual Transformation Canvas */}
        <div className="relative w-full aspect-[1.35/1] sm:aspect-[1.8/1] lg:aspect-[2/1] min-h-[340px] sm:min-h-[440px] lg:min-h-[500px] flex items-center justify-center my-4 overflow-hidden rounded-xl bg-radial from-white/[0.02] to-transparent border border-white/[0.04]">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-full select-none"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#34d399" stopOpacity="0.2" />
              </linearGradient>

              <linearGradient id="curveWave" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#10b981" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#34d399" stopOpacity="1" />
              </linearGradient>

              <filter id="metamorphGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Subtle Horizon & Coordinate Plane Axes */}
            <line x1={60} y1={cy} x2={width - 60} y2={cy} stroke="#181e2b" strokeWidth="1" strokeDasharray="3 5" />
            <line x1={cx} y1={30} x2={cx} y2={height - 30} stroke="#181e2b" strokeWidth="1" strokeDasharray="3 5" />

            {/* Concentric Coordinate Rings */}
            <circle cx={cx} cy={cy} r="190" fill="none" stroke="#121724" strokeWidth="1" strokeDasharray="2 4" />
            <circle cx={cx} cy={cy} r="130" fill="none" stroke="#182030" strokeWidth="1" />
            <circle cx={cx} cy={cy} r="64" fill="none" stroke="#222d42" strokeWidth="1" />

            {/* STAGE 1: Solitary Asset Prism */}
            {currentStep === 1 && (
              <g
                className="transition-all duration-700 ease-out cursor-pointer"
                onMouseEnter={() => setHoveredNode('prism')}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Concentric Radar Ping */}
                <circle cx={cx} cy={cy} r="90" fill="none" stroke="#10b981" strokeWidth="1" opacity="0.25" strokeDasharray="4 6" />

                {/* Monolithic Token Prism */}
                <polygon
                  points={`${cx},${cy - 65} ${cx + 55},${cy} ${cx},${cy + 65} ${cx - 55},${cy}`}
                  fill="#080b12"
                  stroke={hoveredNode === 'prism' ? '#10b981' : '#e4e4e7'}
                  strokeWidth="2"
                  filter="url(#metamorphGlow)"
                  className="transition-colors duration-300"
                />
                <circle cx={cx} cy={cy} r="4" fill="#10b981" />
                <line x1={cx - 55} y1={cy} x2={cx + 55} y2={cy} stroke="#52525b" strokeWidth="1.2" strokeDasharray="2 2" />
                <line x1={cx} y1={cy - 65} x2={cx} y2={cy + 65} stroke="#52525b" strokeWidth="1.2" strokeDasharray="2 2" />

                {/* Micro Inscription Badges */}
                <text x={cx} y={cy + 110} textAnchor="middle" fill="#e4e4e7" fontSize="12" fontFamily="monospace" fontWeight="600" letterSpacing="0.08em">
                  TOKENIZED ASSET COLLATERAL
                </text>
                <text x={cx} y={cy + 130} textAnchor="middle" fill="#71717a" fontSize="10" fontFamily="monospace">
                  SPL Program Standard · Isolated Initial State
                </text>
              </g>
            )}

            {/* STAGE 2: Invariant Rules Crystallize */}
            {currentStep === 2 && (
              <g className="transition-all duration-700 ease-out">
                <polygon
                  points={`${cx},${cy - 48} ${cx + 48},${cy} ${cx},${cy + 48} ${cx - 48},${cy}`}
                  fill="#080b12"
                  stroke="#71717a"
                  strokeWidth="1.5"
                />
                {/* Structural Boundary Calipers */}
                <rect x={cx - 100} y={cy - 100} width="200" height="200" fill="none" stroke="#27272a" strokeWidth="1" strokeDasharray="4 4" />
                <circle cx={cx - 100} cy={cy - 100} r="4" fill="#10b981" />
                <circle cx={cx + 100} cy={cy - 100} r="4" fill="#10b981" />
                <circle cx={cx - 100} cy={cy + 100} r="4" fill="#10b981" />
                <circle cx={cx + 100} cy={cy + 100} r="4" fill="#10b981" />

                {/* Caliper Measurement Ticks */}
                <line x1={cx - 110} y1={cy} x2={cx - 90} y2={cy} stroke="#10b981" strokeWidth="1.5" />
                <line x1={cx + 90} y1={cy} x2={cx + 110} y2={cy} stroke="#10b981" strokeWidth="1.5" />
                <line x1={cx} y1={cy - 110} x2={cx} y2={cy - 90} stroke="#10b981" strokeWidth="1.5" />
                <line x1={cx} y1={cy + 90} x2={cx} y2={cy + 110} stroke="#10b981" strokeWidth="1.5" />

                <text x={cx} y={cy + 140} textAnchor="middle" fill="#10b981" fontSize="12" fontFamily="monospace" fontWeight="600" letterSpacing="0.08em">
                  DETERMINISTIC BONDING INVARIANTS LOCKED
                </text>
                <text x={cx} y={cy + 160} textAnchor="middle" fill="#71717a" fontSize="10" fontFamily="monospace">
                  P(S) = P₀ · (1 + α · S^β) · Autonomous Escrow Rules
                </text>
              </g>
            )}

            {/* STAGE 3: Bilateral Liquidity Conduits Connect */}
            {currentStep === 3 && (
              <g className="transition-all duration-700 ease-out">
                {/* Central Escrow Core */}
                <circle cx={cx} cy={cy} r="28" fill="#080b12" stroke="#e4e4e7" strokeWidth="2" />
                <circle cx={cx} cy={cy} r="6" fill="#10b981" />

                {/* Sweeping Bilateral Reserve Depth Waves */}
                <path
                  d={`M ${cx - 240} ${cy + 60} Q ${cx} ${cy - 120}, ${cx + 240} ${cy + 60}`}
                  fill="none"
                  stroke="url(#curveWave)"
                  strokeWidth="2.5"
                  filter="url(#metamorphGlow)"
                />
                <path
                  d={`M ${cx - 240} ${cy - 60} Q ${cx} ${cy + 120}, ${cx + 240} ${cy - 60}`}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="1.5"
                  strokeDasharray="4 5"
                  opacity="0.7"
                />

                {/* Liquidity Anchor Nodes */}
                <circle cx={cx - 240} cy={cy + 60} r="5" fill="#10b981" />
                <circle cx={cx + 240} cy={cy + 60} r="5" fill="#10b981" />
                <circle cx={cx - 240} cy={cy - 60} r="4" fill="#ffffff" />
                <circle cx={cx + 240} cy={cy - 60} r="4" fill="#ffffff" />

                <text x={cx} y={cy + 130} textAnchor="middle" fill="#e4e4e7" fontSize="12" fontFamily="monospace" fontWeight="600" letterSpacing="0.08em">
                  BILATERAL RESERVE RAILS PROJECTED
                </text>
                <text x={cx} y={cy + 150} textAnchor="middle" fill="#10b981" fontSize="10" fontFamily="monospace">
                  Continuous Orderbook-Free Reserves Formed
                </text>
              </g>
            )}

            {/* STAGE 4: Autonomous Market Fully Active */}
            {currentStep === 4 && (
              <g className="transition-all duration-700 ease-out">
                {/* Planetary Orbital Ring */}
                <ellipse cx={cx} cy={cy} rx="240" ry="90" fill="none" stroke="url(#ringGrad)" strokeWidth="2.5" filter="url(#metamorphGlow)" />
                <ellipse cx={cx} cy={cy} rx="160" ry="60" fill="none" stroke="#27272a" strokeWidth="1.2" strokeDasharray="4 6" />

                {/* Core Market Sovereign Engine */}
                <circle cx={cx} cy={cy} r="22" fill="#06080d" stroke="#10b981" strokeWidth="2" />
                <circle cx={cx} cy={cy} r="7" fill="#10b981" />

                {/* Satellite Participant Nodes with Radial Beams */}
                {[20, 110, 200, 290].map((deg) => {
                  const rad = (deg * Math.PI) / 180;
                  const px = cx + Math.cos(rad) * 240;
                  const py = cy + Math.sin(rad) * 90;
                  return (
                    <g key={deg}>
                      <line x1={cx} y1={cy} x2={px} y2={py} stroke="#10b981" strokeWidth="0.8" opacity="0.3" strokeDasharray="2 3" />
                      <circle cx={px} cy={py} r="5" fill="#ffffff" stroke="#10b981" strokeWidth="1.5" />
                    </g>
                  );
                })}

                <text x={cx} y={cy + 140} textAnchor="middle" fill="#10b981" fontSize="12" fontFamily="monospace" fontWeight="600" letterSpacing="0.08em">
                  AUTONOMOUS MARKET CLEARING ON SOLANA
                </text>
                <text x={cx} y={cy + 160} textAnchor="middle" fill="#e4e4e7" fontSize="10" fontFamily="monospace">
                  Sub-400ms Finality · 100% Transition to Open Meteora DAMM
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Quiet Subtitle & Formula Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-white/[0.08] text-xs font-mono">
          <div>
            <p className="text-zinc-200 text-sm font-light">
              {active.phrase}
            </p>
            <p className="text-zinc-500 text-xs mt-0.5">
              {active.detail}
            </p>
          </div>
          <code className="text-emerald-400 bg-white/[0.03] px-3.5 py-1.5 rounded border border-white/[0.06] shrink-0 font-mono text-xs">
            {active.math}
          </code>
        </div>
      </div>
    </section>
  );
};
