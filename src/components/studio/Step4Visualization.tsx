import React, { useState, useMemo } from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  AlertTriangle, 
  TrendingUp, 
  Layers, 
  Info, 
  Coins, 
  CheckCircle2,
  Lock,
  BarChart3
} from 'lucide-react';
import { CurveStudioConfigInput } from '../../services/meteoraCreation';
import { formatCurrency, formatNumber, formatPercent } from '../../utils/format';

interface Step4VisualizationProps {
  input: CurveStudioConfigInput;
  onNext: () => void;
  onBack: () => void;
}

interface SimulatedPoint {
  index: number;
  percent: number; // 0 to 100
  tokensSold: number;
  spotPrice: number;
  accumulatedQuote: number;
  marketCap: number;
  liquidityConcentration: number; // Bins density
}

export const Step4Visualization: React.FC<Step4VisualizationProps> = ({
  input,
  onNext,
  onBack,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [chartMode, setChartMode] = useState<'curve' | 'vault' | 'concentration'>('curve');

  const curveTokenSupply = (input.totalSupply * input.curveAllocationPct) / 100;
  const startPrice = input.startingPriceQuote;
  const endPrice = input.migrationPriceQuote;
  const priceDelta = endPrice - startPrice;

  // Generate 25 points along the deterministic invariant curve
  const points: SimulatedPoint[] = useMemo(() => {
    const steps = 24;
    const list: SimulatedPoint[] = [];

    for (let i = 0; i <= steps; i++) {
      const frac = i / steps;
      const tokensSold = curveTokenSupply * frac;

      // Meteora DBC invariant simulation: linear/exponential fee & price profile
      let spotPrice = startPrice;
      if (input.profileKey === 'growth') {
        // slight exponential curve
        const growthFactor = Math.log(Math.max(1.05, endPrice / startPrice));
        spotPrice = startPrice * Math.exp(growthFactor * frac);
      } else if (input.profileKey === 'conservative') {
        // tight linear progression
        spotPrice = startPrice + priceDelta * frac;
      } else {
        // balanced piecewise linear
        spotPrice = startPrice + priceDelta * Math.pow(frac, 1.15);
      }

      // Accumulated quote in vault
      const accumulatedQuote = input.migrationQuoteThreshold * Math.pow(frac, 1.2);
      const marketCap = spotPrice * input.totalSupply;

      // Liquidity concentration across price bins (higher near migration & starting anchor)
      const distFromMid = Math.abs(frac - 0.5) * 2;
      const liquidityConcentration = 15 + (1 - distFromMid) * 60 + frac * 25;

      list.push({
        index: i,
        percent: frac * 100,
        tokensSold,
        spotPrice,
        accumulatedQuote,
        marketCap,
        liquidityConcentration,
      });
    }

    return list;
  }, [input, curveTokenSupply, startPrice, endPrice, priceDelta]);

  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : points[points.length - 1];

  // SVG Chart Geometry
  const width = 760;
  const height = 300;
  const padding = { top: 25, right: 35, bottom: 45, left: 65 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const minPrice = Math.min(...points.map((p) => p.spotPrice)) * 0.98;
  const maxPrice = Math.max(...points.map((p) => p.spotPrice)) * 1.02;
  const priceRange = maxPrice - minPrice || 1;

  // Path for spot price curve
  const curvePathD = points
    .map((p, idx) => {
      const x = padding.left + (idx / (points.length - 1)) * chartW;
      const y = padding.top + chartH - ((p.spotPrice - minPrice) / priceRange) * chartH;
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');

  const curveAreaD = `${curvePathD} L ${padding.left + chartW} ${padding.top + chartH} L ${padding.left} ${padding.top + chartH} Z`;

  // Path for accumulated quote vault reserve
  const maxVault = input.migrationQuoteThreshold * 1.05;
  const vaultPathD = points
    .map((p, idx) => {
      const x = padding.left + (idx / (points.length - 1)) * chartW;
      const y = padding.top + chartH - (p.accumulatedQuote / maxVault) * chartH;
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');

  // Milestone checkpoints for summary table
  const milestones = [
    points[0],
    points[Math.floor(points.length * 0.25)],
    points[Math.floor(points.length * 0.5)],
    points[Math.floor(points.length * 0.75)],
    points[points.length - 1],
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-zinc-800/80 pb-4">
        <h2 className="text-xl font-bold text-white tracking-tight">Step 4 — Curve Mathematical Visualization</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Simulate the deterministic price curve invariant, capital vault accumulation, and DLMM graduation threshold.
        </p>
      </div>

      {/* Mandatory Disclaimer Banner */}
      <div className="bg-zinc-900/90 border border-zinc-700/80 rounded-xl p-4 text-xs text-zinc-300 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-zinc-100 block text-xs uppercase tracking-wide">
            Model & Projection Notice
          </span>
          <p className="text-[11px] leading-relaxed text-zinc-400">
            This visualization is a deterministic simulation of the bonding curve algorithm and invariant equations configured in the smart contract. It illustrates mathematical trajectory based on tokens sold; it does <strong>not</strong> predict future secondary market prices, trading volume, or guarantee liquidity demand.
          </p>
        </div>
      </div>

      {/* Chart Telemetry Display */}
      <div className="bg-[#0c101a] border border-zinc-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white font-sans">Interactive Invariant Simulation</span>
            <span className="text-[11px] text-zinc-400">
              (Hover across chart to inspect mathematical step)
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-900/80 p-1 rounded-lg border border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => setChartMode('curve')}
              className={`px-3 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                chartMode === 'curve' ? 'bg-amber-500 text-zinc-950 font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Spot Price Trajectory
            </button>
            <button
              type="button"
              onClick={() => setChartMode('vault')}
              className={`px-3 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                chartMode === 'vault' ? 'bg-amber-500 text-zinc-950 font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Quote Vault Reserve
            </button>
            <button
              type="button"
              onClick={() => setChartMode('concentration')}
              className={`px-3 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                chartMode === 'concentration' ? 'bg-amber-500 text-zinc-950 font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              DLMM Bin Concentration
            </button>
          </div>
        </div>

        {/* Live Hover Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-950/80 p-3.5 rounded-lg border border-zinc-800/80 font-mono-nums text-xs">
          <div>
            <span className="text-[10px] uppercase font-sans text-zinc-400 block font-medium">Curve Sold</span>
            <span className="text-zinc-100 font-bold text-sm">
              {activePoint.percent.toFixed(1)}% ({formatNumber(activePoint.tokensSold)})
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-sans text-zinc-400 block font-medium">
              Spot Price ({input.quoteSymbol})
            </span>
            <span className="text-amber-400 font-bold text-sm">
              {formatCurrency(activePoint.spotPrice, input.quoteSymbol)}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-sans text-zinc-400 block font-medium">
              Vault Reserve ({input.quoteSymbol})
            </span>
            <span className="text-zinc-100 font-bold text-sm">
              {formatCurrency(activePoint.accumulatedQuote, input.quoteSymbol)}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-sans text-zinc-400 block font-medium">
              Implied Market Cap
            </span>
            <span className="text-zinc-100 font-bold text-sm">
              {formatCurrency(activePoint.marketCap, input.quoteSymbol)}
            </span>
          </div>
        </div>

        {/* SVG Visualization Area */}
        <div className="relative w-full overflow-hidden bg-zinc-950/60 rounded-lg border border-zinc-800/60 p-2">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto select-none"
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <defs>
              <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="vaultGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid horizontal lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = padding.top + chartH * ratio;
              return (
                <line
                  key={ratio}
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + chartW}
                  y2={y}
                  stroke="#27272a"
                  strokeDasharray="3 3"
                />
              );
            })}

            {/* Reference Price Baseline if provided in Step 1 */}
            {input.referencePrice && chartMode === 'curve' && (
              (() => {
                const refY = padding.top + chartH - ((input.referencePrice - minPrice) / priceRange) * chartH;
                if (refY >= padding.top && refY <= padding.top + chartH) {
                  return (
                    <g>
                      <line
                        x1={padding.left}
                        y1={refY}
                        x2={padding.left + chartW}
                        y2={refY}
                        stroke="#10b981"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={padding.left + chartW - 10}
                        y={refY - 5}
                        fill="#10b981"
                        fontSize="9"
                        textAnchor="end"
                        fontFamily="monospace"
                      >
                        Reference NAV: ${input.referencePrice}
                      </text>
                    </g>
                  );
                }
                return null;
              })()
            )}

            {/* Mode 1: Spot Price Trajectory */}
            {chartMode === 'curve' && (
              <>
                <path d={curveAreaD} fill="url(#curveGradient)" />
                <path d={curvePathD} fill="none" stroke="#f59e0b" strokeWidth="2.5" />
              </>
            )}

            {/* Mode 2: Vault Reserve Accumulation */}
            {chartMode === 'vault' && (
              <>
                <path d={vaultPathD} fill="none" stroke="#3b82f6" strokeWidth="2.5" />
                <line
                  x1={padding.left}
                  y1={padding.top}
                  x2={padding.left + chartW}
                  y2={padding.top}
                  stroke="#3b82f6"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left + 8}
                  y={padding.top + 12}
                  fill="#60a5fa"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  Graduation Threshold: {formatCurrency(input.migrationQuoteThreshold, input.quoteSymbol)}
                </text>
              </>
            )}

            {/* Mode 3: Concentration Bins */}
            {chartMode === 'concentration' && (
              points.map((p, idx) => {
                const binW = (chartW / points.length) * 0.8;
                const x = padding.left + (idx / points.length) * chartW;
                const binH = (p.liquidityConcentration / 100) * chartH;
                const y = padding.top + chartH - binH;
                return (
                  <rect
                    key={idx}
                    x={x}
                    y={y}
                    width={binW}
                    height={binH}
                    fill="#a855f7"
                    opacity="0.7"
                    rx="2"
                  />
                );
              })
            )}

            {/* Graduation Threshold Milestone Line */}
            <line
              x1={padding.left + chartW}
              y1={padding.top}
              x2={padding.left + chartW}
              y2={padding.top + chartH}
              stroke="#10b981"
              strokeWidth="2"
            />
            <text
              x={padding.left + chartW - 5}
              y={padding.top + 14}
              fill="#10b981"
              fontSize="9"
              textAnchor="end"
              fontWeight="bold"
            >
              DAMM v2 Graduation Target
            </text>

            {/* Starting Price Marker */}
            <circle
              cx={padding.left}
              cy={padding.top + chartH - ((points[0].spotPrice - minPrice) / priceRange) * chartH}
              r="4.5"
              fill="#f59e0b"
              stroke="#090d14"
              strokeWidth="2"
            />
            <text
              x={padding.left + 8}
              y={padding.top + chartH - ((points[0].spotPrice - minPrice) / priceRange) * chartH + 4}
              fill="#d4d4d8"
              fontSize="9"
              fontFamily="monospace"
            >
              Start: {formatCurrency(points[0].spotPrice, input.quoteSymbol)}
            </text>

            {/* Interactive Cursor Hover Overlay */}
            {points.map((p, idx) => {
              const x = padding.left + (idx / (points.length - 1)) * chartW;
              const y = padding.top + chartH - ((p.spotPrice - minPrice) / priceRange) * chartH;
              const isHovered = hoveredIdx === idx;

              return (
                <g key={idx}>
                  <rect
                    x={x - chartW / points.length / 2}
                    y={padding.top}
                    width={chartW / points.length}
                    height={chartH}
                    fill="transparent"
                    className="cursor-crosshair"
                    onMouseEnter={() => setHoveredIdx(idx)}
                  />
                  {isHovered && (
                    <>
                      <line
                        x1={x}
                        y1={padding.top}
                        x2={x}
                        y2={padding.top + chartH}
                        stroke="#f59e0b"
                        strokeWidth="1.5"
                        strokeDasharray="2 2"
                      />
                      <circle
                        cx={x}
                        cy={chartMode === 'curve' ? y : padding.top + chartH - (p.accumulatedQuote / maxVault) * chartH}
                        r="5"
                        fill="#f59e0b"
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                    </>
                  )}
                </g>
              );
            })}

            {/* X-Axis Labels (Tokens Sold %) */}
            {[0, 25, 50, 75, 100].map((pct) => {
              const x = padding.left + (pct / 100) * chartW;
              return (
                <text
                  key={pct}
                  x={x}
                  y={padding.top + chartH + 18}
                  fill="#71717a"
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {pct}%
                </text>
              );
            })}
            <text
              x={padding.left + chartW / 2}
              y={padding.top + chartH + 34}
              fill="#a1a1aa"
              fontSize="10"
              textAnchor="middle"
            >
              Bonding Curve Tokens Sold (%)
            </text>
          </svg>
        </div>
      </div>

      {/* Graduation Milestone Ledger */}
      <div className="bg-[#0c101a] border border-zinc-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Deterministic Graduation Milestones</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 font-sans uppercase text-[10px]">
                <th className="py-2 px-3">Stage</th>
                <th className="py-2 px-3 text-right">Tokens Sold</th>
                <th className="py-2 px-3 text-right">Spot Price ({input.quoteSymbol})</th>
                <th className="py-2 px-3 text-right">Accumulated Quote</th>
                <th className="py-2 px-3 text-right">Implied Market Cap</th>
                <th className="py-2 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono-nums">
              {milestones.map((m, idx) => (
                <tr key={idx} className="hover:bg-zinc-900/40 transition-colors">
                  <td className="py-2.5 px-3 font-sans font-medium text-zinc-200">
                    {idx === 0
                      ? '0% (Genesis Launch)'
                      : idx === 4
                      ? '100% (DAMM v2 Graduation)'
                      : `${m.percent.toFixed(0)}% Progress`}
                  </td>
                  <td className="py-2.5 px-3 text-right text-zinc-300">{formatNumber(m.tokensSold)}</td>
                  <td className="py-2.5 px-3 text-right text-amber-400 font-semibold">
                    {formatCurrency(m.spotPrice, input.quoteSymbol)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-zinc-200">
                    {formatCurrency(m.accumulatedQuote, input.quoteSymbol)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-zinc-300">
                    {formatCurrency(m.marketCap, input.quoteSymbol)}
                  </td>
                  <td className="py-2.5 px-3 text-center font-sans">
                    {idx === 4 ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold text-[10px]">
                        Migrates to DAMM v2
                      </span>
                    ) : (
                      <span className="text-zinc-400 text-[11px]">Bonding Phase</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
        <button
          type="button"
          onClick={onBack}
          className="py-2.5 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs transition-colors flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="py-2.5 px-6 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm transition-colors cursor-pointer flex items-center gap-2 shadow-xs shadow-amber-500/20"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
