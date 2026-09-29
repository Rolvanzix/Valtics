import React, { useState, useEffect, useRef, useCallback } from 'react';

type CurveType = 'exponential' | 'linear' | 'floor-rwa';
type HoveredTarget = 'none' | 'asset' | 'curve' | 'value';

export const HeroVisual: React.FC = () => {
  const [curveModel, setCurveModel] = useState<CurveType>('exponential');
  const [pulseTime, setPulseTime] = useState(0);
  const [cursorX, setCursorX] = useState<number | null>(null);
  const [hoveredTarget, setHoveredTarget] = useState<HoveredTarget>('none');
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Subtle, rhythmic autonomous wave
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const delta = now - lastTime;
      if (delta >= 40) {
        setPulseTime((prev) => (prev + delta * 0.015) % 100);
        lastTime = now;
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const width = 1000;
  const height = 400;
  const originX = 270;
  const originY = 320;
  const graphW = 460;
  const graphH = 240;

  const pointsCount = 60;
  const points: { x: number; y: number; s: number; p: number; r: number; slope: number }[] = [];

  for (let i = 0; i <= pointsCount; i++) {
    const t = i / pointsCount;
    const px = originX + t * graphW;
    let py = originY;
    let price = 0;
    let slope = 0;
    const supply = t * 1000000;

    if (curveModel === 'linear') {
      py = originY - t * graphH * 0.82;
      price = 0.00005 + t * 0.00185;
      slope = 0.82;
    } else if (curveModel === 'exponential') {
      py = originY - Math.pow(t, 2.3) * graphH * 0.94;
      price = 0.000028 + Math.pow(t, 2.3) * 0.00245;
      slope = 2.3 * Math.pow(Math.max(t, 0.05), 1.3);
    } else {
      // Floor-Protected RWA
      const floorH = graphH * 0.22;
      const variableH = Math.pow(t, 1.85) * graphH * 0.72;
      py = originY - (floorH + variableH);
      price = 0.00045 + Math.pow(t, 1.85) * 0.0018;
      slope = 1.85 * Math.pow(Math.max(t, 0.05), 0.85);
    }
    const reserves = t * 69000;
    points.push({ x: px, y: py, s: supply, p: price, r: reserves, slope });
  }

  const pathD = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${originX + graphW},${originY} L ${originX},${originY} Z`;

  // Active equilibrium point
  let activeIndex = Math.floor(
    (Math.sin((pulseTime / 100) * Math.PI * 2) * 0.5 + 0.5) * (points.length - 1)
  );
  if (cursorX !== null) {
    const clampedRatio = Math.max(0, Math.min(1, (cursorX - originX) / graphW));
    activeIndex = Math.round(clampedRatio * (points.length - 1));
  }
  const currentEq = points[activeIndex] || points[0];

  // Pointer interaction for desktop and mobile touch
  const handlePointerMove = useCallback((clientX: number) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = width / rect.width;
    const relativeX = (clientX - rect.left) * scaleX;
    if (relativeX >= originX - 25 && relativeX <= originX + graphW + 25) {
      setCursorX(relativeX);
      setHoveredTarget('curve');
    } else {
      setCursorX(null);
    }
  }, [originX, graphW, width]);

  const assetX = 90;
  const assetY = 200;
  const valueX = 910;
  const valueY = 200;

  // Flow offset for subtle moving dashes along liquidity streams
  const dashSpeed = hoveredTarget === 'asset' || hoveredTarget === 'value' ? 3.5 : 2;
  const dashOffset = (pulseTime * dashSpeed) % 36;

  // Dynamic tangent line angle based on slope
  const tangentDx = 38;
  const tangentDy = Math.min(30, Math.max(8, currentEq.slope * 14));

  return (
    <div className="w-full max-w-5xl mx-auto select-none mt-10 sm:mt-14">
      {/* Visual Header Strip: Narrative Flow & Model Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-white/[0.06] text-xs font-mono">
        <div className="flex items-center gap-2 sm:gap-3 text-zinc-500 text-[10px] sm:text-[11px] overflow-x-auto no-scrollbar py-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className={`transition-colors ${hoveredTarget === 'curve' ? 'text-emerald-400 font-semibold' : 'text-zinc-300 font-medium'}`}>
            MARKET
          </span>
          <span className="text-zinc-600">→</span>
          <span className={`transition-colors ${hoveredTarget === 'asset' ? 'text-emerald-400 font-semibold' : 'text-zinc-400'}`}>
            ASSET
          </span>
          <span className="text-zinc-600">→</span>
          <span className="text-zinc-400">RULES</span>
          <span className="text-zinc-600">→</span>
          <span className="text-zinc-400">LIQUIDITY</span>
          <span className="text-zinc-600">→</span>
          <span className={`transition-colors ${hoveredTarget === 'value' ? 'text-emerald-400 font-semibold' : 'text-zinc-300 font-medium'}`}>
            VALUE
          </span>
        </div>

        {/* Minimal Model Switcher */}
        <div className="flex items-center gap-1 self-start sm:self-auto bg-white/[0.02] p-0.5 rounded border border-white/[0.06]">
          {[
            { id: 'exponential', label: 'Exponential' },
            { id: 'linear', label: 'Linear' },
            { id: 'floor-rwa', label: 'Floor-Protected' },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setCurveModel(m.id as CurveType)}
              className={`px-2.5 py-1 text-[10px] sm:text-[11px] rounded transition-all cursor-pointer ${
                curveModel === m.id
                  ? 'bg-white/[0.1] text-white font-medium shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* The Architectural Vector Plane (Generous, Living Visual) */}
      <div className="relative w-full aspect-[2.1/1] sm:aspect-[2.4/1] min-h-[300px] sm:min-h-[360px] max-h-[460px] flex items-center justify-center my-3">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full cursor-crosshair overflow-visible touch-none"
          preserveAspectRatio="xMidYMid meet"
          onMouseMove={(e) => handlePointerMove(e.clientX)}
          onTouchMove={(e) => {
            if (e.touches[0]) handlePointerMove(e.touches[0].clientX);
          }}
          onMouseLeave={() => {
            setCursorX(null);
            setHoveredTarget('none');
          }}
          onTouchEnd={() => {
            setCursorX(null);
            setHoveredTarget('none');
          }}
        >
          <defs>
            <linearGradient id="heroCurveArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={hoveredTarget === 'curve' ? 0.22 : 0.16} />
              <stop offset="60%" stopColor="#10b981" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>

            <linearGradient id="laserGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="1" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.95" />
            </linearGradient>

            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Coordinate Grid Lines */}
          <line x1={originX} y1={originY} x2={originX + graphW} y2={originY} stroke="#27272a" strokeWidth="1" />
          <line x1={originX} y1={originY} x2={originX} y2={originY - graphH} stroke="#27272a" strokeWidth="1" />

          {/* Horizontal Level Guides */}
          {[0.25, 0.5, 0.75, 1.0].map((frac) => {
            const y = originY - frac * graphH;
            return (
              <g key={frac}>
                <line x1={originX} y1={y} x2={originX + graphW} y2={y} stroke="#18181b" strokeWidth="1" strokeDasharray="2 4" />
                <text x={originX - 12} y={y + 3} textAnchor="end" fill="#52525b" fontSize="8.5" fontFamily="monospace">
                  {(frac * 100).toFixed(0)}%
                </text>
              </g>
            );
          })}

          {/* Vertical Supply Guides */}
          {[0.25, 0.5, 0.75, 1.0].map((frac) => {
            const x = originX + frac * graphW;
            return (
              <g key={frac}>
                <line x1={x} y1={originY} x2={x} y2={originY - graphH} stroke="#18181b" strokeWidth="1" strokeDasharray="2 4" />
                <text x={x} y={originY + 16} textAnchor="middle" fill="#52525b" fontSize="8" fontFamily="monospace">
                  {(frac * 1000).toFixed(0)}k S
                </text>
              </g>
            );
          })}

          {/* Autonomous Graduation Horizon Line */}
          <line
            x1={originX}
            y1={originY - graphH * 0.88}
            x2={originX + graphW}
            y2={originY - graphH * 0.88}
            stroke="#10b981"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity={hoveredTarget === 'value' ? '0.8' : '0.45'}
          />
          <text
            x={originX + graphW}
            y={originY - graphH * 0.88 - 6}
            textAnchor="end"
            fill="#10b981"
            fontSize="8.5"
            fontFamily="monospace"
            letterSpacing="0.06em"
          >
            GRADUATION HORIZON: $69,000 USDC · 100% DAMM MIGRATION
          </text>

          {/* Flowing Liquidity Conduit from Asset Node to Curve Origin */}
          <path
            d={`M ${assetX + 44} ${assetY} C 170 ${assetY}, 190 ${originY - 40}, ${originX} ${points[0].y}`}
            fill="none"
            stroke="#10b981"
            strokeWidth={hoveredTarget === 'asset' ? '2' : '1.2'}
            strokeDasharray="4 6"
            strokeDashoffset={-dashOffset}
            opacity={hoveredTarget === 'asset' ? '0.95' : '0.55'}
            className="transition-all duration-300"
          />

          {/* Flowing Liquidity Conduit from Curve Cap to Value Clearing Node */}
          <path
            d={`M ${originX + graphW} ${points[points.length - 1].y} C ${originX + graphW + 70} ${points[points.length - 1].y}, 810 ${valueY}, ${valueX - 44} ${valueY}`}
            fill="none"
            stroke="#10b981"
            strokeWidth={hoveredTarget === 'value' ? '2' : '1.2'}
            strokeDasharray="4 6"
            strokeDashoffset={-dashOffset}
            opacity={hoveredTarget === 'value' ? '0.95' : '0.55'}
            className="transition-all duration-300"
          />

          {/* Shaded Area Under Curve */}
          <path d={areaD} fill="url(#heroCurveArea)" />

          {/* Primary Bonding Curve Line */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#laserGrad)"
            strokeWidth={hoveredTarget === 'curve' ? '2.8' : '2.2'}
            filter="url(#softGlow)"
            className="transition-all duration-200"
          />

          {/* Instantaneous Tangent Line */}
          <line
            x1={currentEq.x - tangentDx}
            y1={currentEq.y + tangentDy}
            x2={currentEq.x + tangentDx}
            y2={currentEq.y - tangentDy}
            stroke="#71717a"
            strokeWidth="1.2"
            strokeDasharray="2 2"
          />

          {/* Drop Lines to Axes */}
          <line x1={currentEq.x} y1={currentEq.y} x2={currentEq.x} y2={originY} stroke="#3f3f46" strokeWidth="1" strokeDasharray="1 3" />
          <line x1={originX} y1={currentEq.y} x2={currentEq.x} y2={currentEq.y} stroke="#3f3f46" strokeWidth="1" strokeDasharray="1 3" />

          {/* Dynamic Equilibrium Point Indicator */}
          <circle cx={currentEq.x} cy={currentEq.y} r="4.5" fill="#10b981" />
          <circle cx={currentEq.x} cy={currentEq.y} r="9" fill="none" stroke="#10b981" strokeWidth="1" opacity="0.6" />
          <circle cx={currentEq.x} cy={currentEq.y} r="15" fill="none" stroke="#10b981" strokeWidth="0.5" strokeDasharray="2 3" opacity="0.35" />

          {/* Floating Coordinate Telemetry Box over Active Equilibrium */}
          <g transform={`translate(${currentEq.x}, ${currentEq.y - 34})`} className="pointer-events-none">
            <rect x="-58" y="-16" width="116" height="24" rx="4" fill="#06080e" stroke="#27272a" strokeWidth="1" />
            <text x="0" y="-1" textAnchor="middle" fill="#f4f4f5" fontSize="9" fontFamily="monospace" fontWeight="500">
              P: ${currentEq.p.toFixed(6)}
            </text>
            <text x="0" y="7" textAnchor="middle" fill="#10b981" fontSize="7.5" fontFamily="monospace">
              Reserves: ${currentEq.r.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </text>
          </g>

          {/* ASSET NODE (Left) - Interactive */}
          <g
            transform={`translate(${assetX}, ${assetY})`}
            onMouseEnter={() => setHoveredTarget('asset')}
            onMouseLeave={() => setHoveredTarget('none')}
            onClick={() => setHoveredTarget('asset')}
            className="cursor-pointer group"
          >
            <circle
              r="40"
              fill="none"
              stroke={hoveredTarget === 'asset' ? '#10b981' : '#27272a'}
              strokeWidth="1"
              strokeDasharray="2 4"
              className="transition-colors duration-300"
            />
            <circle
              r="26"
              fill="#090c14"
              stroke={hoveredTarget === 'asset' ? '#e4e4e7' : '#52525b'}
              strokeWidth="1.2"
              className="transition-colors duration-300"
            />
            <polygon points="0,-12 12,0 0,12 -12,0" fill="none" stroke="#e4e4e7" strokeWidth="1.2" />
            <circle r="3" fill="#10b981" />

            {/* Hover Tooltip for Asset Node */}
            {hoveredTarget === 'asset' && (
              <g transform="translate(0, -42)" className="pointer-events-none">
                <rect x="-64" y="-14" width="128" height="20" rx="3" fill="#06080e" stroke="#10b981" strokeWidth="1" />
                <text x="0" y="0" textAnchor="middle" fill="#10b981" fontSize="8" fontFamily="monospace">
                  SPL Collateral: 1,000,000 Units
                </text>
              </g>
            )}

            <text x="0" y="52" textAnchor="middle" fill="#e4e4e7" fontSize="10.5" fontFamily="monospace" fontWeight="600">
              ASSET
            </text>
            <text x="0" y="66" textAnchor="middle" fill="#71717a" fontSize="8.5" fontFamily="monospace">
              SPL · Collateral
            </text>
            <text x="0" y="78" textAnchor="middle" fill="#10b981" fontSize="7.5" fontFamily="monospace">
              Verified Mint
            </text>
          </g>

          {/* VALUE CLEARING NODE (Right) - Interactive */}
          <g
            transform={`translate(${valueX}, ${valueY})`}
            onMouseEnter={() => setHoveredTarget('value')}
            onMouseLeave={() => setHoveredTarget('none')}
            onClick={() => setHoveredTarget('value')}
            className="cursor-pointer group"
          >
            <circle
              r="40"
              fill="none"
              stroke={hoveredTarget === 'value' ? '#10b981' : '#27272a'}
              strokeWidth="1"
              strokeDasharray="2 4"
              className="transition-colors duration-300"
            />
            <circle
              r="26"
              fill="#090c14"
              stroke={hoveredTarget === 'value' ? '#e4e4e7' : '#52525b'}
              strokeWidth="1.2"
              className="transition-colors duration-300"
            />
            <polygon points="0,-12 12,-6 12,6 0,12 -12,6 -12,-6" fill="none" stroke="#e4e4e7" strokeWidth="1.2" />
            <circle r="3" fill="#10b981" />

            {/* Hover Tooltip for Value Node */}
            {hoveredTarget === 'value' && (
              <g transform="translate(0, -42)" className="pointer-events-none">
                <rect x="-68" y="-14" width="136" height="20" rx="3" fill="#06080e" stroke="#10b981" strokeWidth="1" />
                <text x="0" y="0" textAnchor="middle" fill="#10b981" fontSize="8" fontFamily="monospace">
                  Meteora DAMM Pool: $69k
                </text>
              </g>
            )}

            <text x="0" y="52" textAnchor="middle" fill="#e4e4e7" fontSize="10.5" fontFamily="monospace" fontWeight="600">
              VALUE
            </text>
            <text x="0" y="66" textAnchor="middle" fill="#71717a" fontSize="8.5" fontFamily="monospace">
              Liquid Clearing
            </text>
            <text x="0" y="78" textAnchor="middle" fill="#10b981" fontSize="7.5" fontFamily="monospace">
              DAMM Migration
            </text>
          </g>

          {/* Axes labels */}
          <text x={originX + graphW} y={originY + 28} textAnchor="end" fill="#52525b" fontSize="8.5" fontFamily="monospace">
            SUPPLY / CAPITAL DEPTH (S) →
          </text>
          <text x={originX - 12} y={originY - graphH - 8} textAnchor="end" fill="#52525b" fontSize="8.5" fontFamily="monospace">
            PRICE (P) ↑
          </text>
        </svg>
      </div>

      {/* Whisper-Quiet Technical Telemetry Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 sm:pt-4 border-t border-white/[0.06] text-[10px] sm:text-[11px] font-mono text-zinc-500">
        <div>
          <span className="text-zinc-600">INVARIANT: </span>
          <span className="text-zinc-300 font-mono-nums">
            {curveModel === 'exponential' && 'P(S) = P₀ + α · (S / S_max)²·³'}
            {curveModel === 'linear' && 'P(S) = P₀ + m · S'}
            {curveModel === 'floor-rwa' && 'P(S) = P_floor + β · S^γ'}
          </span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <div>
            <span className="text-zinc-600">EXECUTION: </span>
            <span className="text-zinc-300">Solana Meteora DBC</span>
          </div>
          <div>
            <span className="text-zinc-600">ORACLE: </span>
            <span className="text-emerald-400">Pyth Hermes Live (0.3s)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
