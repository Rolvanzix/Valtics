import React, { useState } from 'react';
import { CurvePoint } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/format';

interface CurveChartProps {
  points: CurvePoint[];
  quoteAsset: string;
}

export const CurveChart: React.FC<CurveChartProps> = ({ points, quoteAsset }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!points || points.length === 0) {
    return <div className="h-64 flex items-center justify-center text-zinc-500 text-xs">No curve data</div>;
  }

  const width = 640;
  const height = 280;
  const padding = { top: 20, right: 30, bottom: 40, left: 60 };

  const minPrice = Math.min(...points.map((p) => p.currentPriceUsd));
  const maxPrice = Math.max(...points.map((p) => p.currentPriceUsd));
  const priceRange = maxPrice - minPrice || 1;

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Generate SVG path for line
  const pathD = points
    .map((p, idx) => {
      const x = padding.left + (idx / (points.length - 1)) * chartW;
      const y = padding.top + chartH - ((p.currentPriceUsd - minPrice) / priceRange) * chartH;
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');

  // Gradient area under curve
  const areaD = `${pathD} L ${padding.left + chartW} ${padding.top + chartH} L ${padding.left} ${padding.top + chartH} Z`;

  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : points[points.length - 1];
  const activeX = hoveredIdx !== null ? padding.left + (hoveredIdx / (points.length - 1)) * chartW : null;
  const activeY =
    hoveredIdx !== null
      ? padding.top + chartH - ((activePoint.currentPriceUsd - minPrice) / priceRange) * chartH
      : null;

  return (
    <div className="w-full bg-[#090d14] border border-zinc-800 rounded-xl p-4 space-y-4">
      {/* Dynamic Telemetry Banner on Hover */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0d121c] p-3 rounded-lg border border-zinc-800/80 font-mono-nums text-xs">
        <div>
          <span className="text-[10px] uppercase font-sans text-zinc-400 block">Curve Progress</span>
          <span className="text-zinc-100 font-semibold text-sm">
            {formatPercent(activePoint.tokensSoldPct)}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-sans text-zinc-400 block">Spot Price</span>
          <span className="text-amber-400 font-semibold text-sm">
            {formatCurrency(activePoint.currentPriceUsd)}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-sans text-zinc-400 block">Accumulated Quote</span>
          <span className="text-zinc-100 font-semibold text-sm">
            {formatCurrency(activePoint.accumulatedQuoteUsd)}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-sans text-zinc-400 block">Market Cap</span>
          <span className="text-zinc-100 font-semibold text-sm">
            {formatCurrency(activePoint.marketCapUsd)}
          </span>
        </div>
      </div>

      {/* SVG Container */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + chartH * ratio;
            const priceVal = maxPrice - ratio * priceRange;
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + chartW}
                  y2={y}
                  stroke="#1e2638"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="JetBrains Mono"
                >
                  ${priceVal >= 1 ? priceVal.toFixed(2) : priceVal.toFixed(4)}
                </text>
              </g>
            );
          })}

          {/* X-axis ticks */}
          {[0, 25, 50, 75, 100].map((pct) => {
            const x = padding.left + (pct / 100) * chartW;
            return (
              <g key={pct}>
                <line
                  x1={x}
                  y1={padding.top + chartH}
                  x2={x}
                  y2={padding.top + chartH + 5}
                  stroke="#273349"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={padding.top + chartH + 18}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="JetBrains Mono"
                >
                  {pct}%
                </text>
              </g>
            );
          })}

          {/* Area fill under curve */}
          <path d={areaD} fill="url(#curveGradient)" />

          {/* Curve Path */}
          <path
            d={pathD}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Active crosshair */}
          {activeX !== null && activeY !== null && (
            <g>
              <line
                x1={activeX}
                y1={padding.top}
                x2={activeX}
                y2={padding.top + chartH}
                stroke="#f59e0b"
                strokeDasharray="2 2"
                strokeWidth="1.5"
              />
              <circle
                cx={activeX}
                cy={activeY}
                r="4.5"
                fill="#f59e0b"
                stroke="#090d14"
                strokeWidth="2"
              />
            </g>
          )}

          {/* Interactive touch/mouse overlay columns */}
          {points.map((_, idx) => {
            const colWidth = chartW / points.length;
            const x = padding.left + idx * colWidth - colWidth / 2;
            return (
              <rect
                key={idx}
                x={x}
                y={padding.top}
                width={colWidth}
                height={chartH}
                fill="transparent"
                onMouseEnter={() => setHoveredIdx(idx)}
                className="cursor-crosshair"
              />
            );
          })}
        </svg>
      </div>

      <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
        <span>X-Axis: Supply Sold into Dynamic Bonding Curve</span>
        <span>Y-Axis: Spot Price ({quoteAsset} / USD)</span>
      </div>
    </div>
  );
};
