import React, { useState } from 'react';
import { CurvePoint } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/format';

interface BondingCurveChartProps {
  points: CurvePoint[];
  quoteAsset: string;
  currentProgressPct?: number;
  height?: number;
  showTelemetryHeader?: boolean;
}

export const BondingCurveChart: React.FC<BondingCurveChartProps> = ({
  points,
  quoteAsset,
  currentProgressPct = 0,
  height = 280,
  showTelemetryHeader = true,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!points || points.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-zinc-500 text-xs bg-[#090d14] rounded-xl border border-zinc-800">
        No bonding curve simulation points available
      </div>
    );
  }

  const width = 680;
  const padding = { top: 24, right: 36, bottom: 44, left: 64 };

  const minPrice = Math.min(...points.map((p) => p.currentPriceUsd));
  const maxPrice = Math.max(...points.map((p) => p.currentPriceUsd));
  const priceRange = maxPrice - minPrice || 1;

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Path coordinates
  const pathD = points
    .map((p, idx) => {
      const x = padding.left + (idx / (points.length - 1)) * chartW;
      const y = padding.top + chartH - ((p.currentPriceUsd - minPrice) / priceRange) * chartH;
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');

  // Gradient area
  const areaD = `${pathD} L ${padding.left + chartW} ${padding.top + chartH} L ${padding.left} ${padding.top + chartH} Z`;

  // Active hover point or default to current curve position or end point
  const activePoint =
    hoveredIdx !== null
      ? points[hoveredIdx]
      : points[Math.min(Math.floor((currentProgressPct / 100) * (points.length - 1)), points.length - 1)];

  const activeIdx = hoveredIdx !== null ? hoveredIdx : Math.floor((currentProgressPct / 100) * (points.length - 1));
  const activeX = padding.left + (activeIdx / (points.length - 1)) * chartW;
  const activeY = padding.top + chartH - ((activePoint.currentPriceUsd - minPrice) / priceRange) * chartH;

  // Graduation threshold index (at 100% tokens sold)
  const gradY = padding.top + chartH - ((points[points.length - 1].currentPriceUsd - minPrice) / priceRange) * chartH;

  return (
    <div className="w-full bg-[#090d14] border border-zinc-800/90 rounded-xl p-4 sm:p-5 space-y-4">
      {/* High-Contrast Financial Telemetry Header */}
      {showTelemetryHeader && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0d121c] p-3 rounded-lg border border-zinc-800 font-mono-nums text-xs">
          <div>
            <span className="text-[10px] uppercase font-sans text-zinc-400 block font-medium">
              Curve Progress
            </span>
            <span className="text-zinc-100 font-bold text-sm">
              {formatPercent(activePoint.tokensSoldPct)}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-sans text-zinc-400 block font-medium">
              Spot Price ({quoteAsset})
            </span>
            <span className="text-amber-400 font-bold text-sm">
              {formatCurrency(activePoint.currentPriceUsd)}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-sans text-zinc-400 block font-medium">
              Accumulated Quote
            </span>
            <span className="text-zinc-100 font-bold text-sm">
              {formatCurrency(activePoint.accumulatedQuoteUsd)}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-sans text-zinc-400 block font-medium">
              Implied Market Cap
            </span>
            <span className="text-zinc-100 font-bold text-sm">
              {formatCurrency(activePoint.marketCapUsd)}
            </span>
          </div>
        </div>
      )}

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            {/* Signature VALTICS Brand Curve Gradient Fill */}
            <linearGradient id="curveGradientFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.18" />
              <stop offset="50%" stopColor="#ec4899" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.22" />
            </linearGradient>

            {/* Signature VALTICS Brand Stroke Gradient */}
            <linearGradient id="curveStrokeGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="45%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>

            {/* Glowing filter for active spot */}
            <filter id="spotGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#f59e0b" floodOpacity="0.7" />
            </filter>
          </defs>

          {/* Grid lines (5 horizontal steps) */}
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
                  stroke="#1c2538"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-zinc-400 text-[10px] font-mono select-none"
                >
                  ${priceVal < 0.01 ? priceVal.toFixed(4) : priceVal.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* Vertical progress markers */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const x = padding.left + pct * chartW;
            return (
              <g key={pct}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={padding.top + chartH}
                  stroke="#161e2e"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={padding.top + chartH + 18}
                  textAnchor="middle"
                  className="fill-zinc-400 text-[10px] font-mono select-none"
                >
                  {Math.round(pct * 100)}%
                </text>
              </g>
            );
          })}

          {/* Area under curve */}
          <path d={areaD} fill="url(#curveGradientFill)" />

          {/* Graduation Target Reference Line */}
          <line
            x1={padding.left}
            y1={gradY}
            x2={padding.left + chartW}
            y2={gradY}
            stroke="#10b981"
            strokeDasharray="4 4"
            strokeWidth="1.2"
            opacity="0.6"
          />
          <text
            x={padding.left + chartW - 6}
            y={gradY - 6}
            textAnchor="end"
            className="fill-emerald-400 text-[9px] font-mono font-medium"
          >
            DAMM v2 Graduation Target (${maxPrice.toFixed(2)})
          </text>

          {/* Primary Curve Line with Signature Brand Gradient */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#curveStrokeGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Active / Current Point Indicator */}
          <g transform={`translate(${activeX}, ${activeY})`} filter="url(#spotGlow)">
            {/* Crosshairs */}
            <line
              x1={0}
              y1={padding.top + chartH - activeY}
              x2={0}
              y2={padding.top - activeY}
              stroke="#f59e0b"
              strokeDasharray="2 2"
              strokeWidth="1"
              opacity="0.7"
            />
            <line
              x1={padding.left - activeX}
              y1={0}
              x2={padding.left + chartW - activeX}
              y2={0}
              stroke="#f59e0b"
              strokeDasharray="2 2"
              strokeWidth="1"
              opacity="0.4"
            />
            {/* Outer ring and solid center */}
            <circle r="7" fill="#f59e0b" fillOpacity="0.25" />
            <circle r="4" fill="#f59e0b" stroke="#090d14" strokeWidth="1.5" />
          </g>

          {/* Invisible interactive hover slices */}
          {points.map((_, idx) => {
            const sliceW = chartW / points.length;
            const x = padding.left + idx * sliceW - sliceW / 2;
            return (
              <rect
                key={idx}
                x={x}
                y={padding.top}
                width={sliceW}
                height={chartH}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHoveredIdx(idx)}
              />
            );
          })}
        </svg>

        {/* X-Axis Description */}
        <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono px-4 pt-1">
          <span>Starting Allocation (0 Tokens Sold)</span>
          <span>Target Curve Capacity (100% Tokens Sold)</span>
        </div>
      </div>
    </div>
  );
};
