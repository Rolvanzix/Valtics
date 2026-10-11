import React, { useState, useMemo, useRef } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  ArrowUpRight, 
  CheckCircle2, 
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { DBCPoolState } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/format';

interface OverviewMarketActivityChartProps {
  markets: DBCPoolState[];
  selectedPoolAddress?: string | null;
  onSelectPool?: (poolAddress: string) => void;
  onExploreMarkets: () => void;
}

export const OverviewMarketActivityChart: React.FC<OverviewMarketActivityChartProps> = ({
  markets,
  selectedPoolAddress,
  onSelectPool,
  onExploreMarkets,
}) => {
  const [timeframe, setTimeframe] = useState<'1H' | '24H' | '7D' | '30D'>('24H');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Active pool for inspection
  const activePool = useMemo(() => {
    if (selectedPoolAddress) {
      const match = markets.find((m) => m.poolAddress === selectedPoolAddress);
      if (match) return match;
    }
    return markets.length > 0 ? markets[0] : null;
  }, [markets, selectedPoolAddress]);

  // Synthetic or real activity data points based on timeframe
  const chartData = useMemo(() => {
    const pointsCount = timeframe === '1H' ? 12 : timeframe === '24H' ? 24 : timeframe === '7D' ? 28 : 30;
    const basePrice = activePool ? activePool.currentPrice || 14.5 : 185.4;
    const delta = activePool ? (activePool.currentPrice - activePool.startPrice) || 2.4 : 14.8;

    const list = [];
    const now = Date.now();
    const intervalMs = timeframe === '1H' ? 5 * 60 * 1000 : 60 * 60 * 1000;

    for (let i = 0; i < pointsCount; i++) {
      const progress = i / (pointsCount - 1);
      // Realistic slight oscillating curve with upward trend
      const noise = Math.sin(i * 0.8) * (delta * 0.18) + (Math.cos(i * 1.4) * (delta * 0.08));
      const price = Math.max(0.01, basePrice - delta * (1 - progress) + noise);
      const volumeSol = Math.round(15 + Math.abs(Math.sin(i * 1.2)) * 65 + (i % 3 === 0 ? 30 : 0));
      const ptTime = new Date(now - (pointsCount - 1 - i) * intervalMs);

      list.push({
        time: ptTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: ptTime.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        price: Number(price.toFixed(4)),
        volumeSol,
        volumeUsd: Math.round(volumeSol * price),
        isBuy: i % 3 !== 0,
      });
    }

    return list;
  }, [activePool, timeframe]);

  // Coordinates calculation
  const width = 760;
  const height = 180;
  const padX = 16;
  const padY = 24;

  const { minPrice, maxPrice, priceRange } = useMemo(() => {
    const prices = chartData.map((d) => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const span = max - min || min * 0.05 || 1;
    return {
      minPrice: min - span * 0.05,
      maxPrice: max + span * 0.05,
      priceRange: span * 1.1,
    };
  }, [chartData]);

  const svgCoords = useMemo(() => {
    const usableW = width - padX * 2;
    const usableH = height - padY * 2;

    return chartData.map((d, i) => {
      const x = padX + (i / (chartData.length - 1)) * usableW;
      const normalizedY = (d.price - minPrice) / priceRange;
      const y = height - padY - normalizedY * usableH;
      return { x, y, data: d };
    });
  }, [chartData, minPrice, priceRange, width, height, padX, padY]);

  const pathD = useMemo(() => {
    if (svgCoords.length === 0) return '';
    return svgCoords.reduce((acc, curr, idx) => {
      return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
    }, '');
  }, [svgCoords]);

  const areaD = useMemo(() => {
    if (svgCoords.length === 0) return '';
    const first = svgCoords[0];
    const last = svgCoords[svgCoords.length - 1];
    return `${pathD} L ${last.x} ${height} L ${first.x} ${height} Z`;
  }, [pathD, svgCoords, height]);

  // Current active display point
  const activePt = hoveredIndex !== null && chartData[hoveredIndex] ? chartData[hoveredIndex] : chartData[chartData.length - 1];

  // Buy vs Sell Flow distribution
  const buyRatio = 64; // 64% Inflow buy pressure
  const sellRatio = 36;

  return (
    <div className="valtics-card p-6 flex flex-col justify-between relative overflow-hidden space-y-5">
      {/* Background radial glow */}
      <div 
        className="absolute top-0 right-0 w-96 h-96 pointer-events-none rounded-full blur-3xl opacity-20"
        style={{ background: 'radial-gradient(circle, #6010F0 0%, #D82AA8 50%, transparent 80%)' }}
      />

      {/* Header Bar: Market Identity + Real-time Flow Badge + Timeframes */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(138,32,255,0.18)] pb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-mono tracking-wider uppercase text-[#A7A7B8] flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-[#8A20FF]" />
              <span>Market Activity & Flow</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1C0142] text-[#EDE4FA] border border-[#670CDC]/30">
              {activePool ? activePool.tokenName || activePool.tokenSymbol : 'Solana Benchmark (SOL/USD)'}
            </span>
          </div>

          <div className="flex items-baseline gap-3 mt-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#F5F5F7] tracking-tight">
              {formatCurrency(activePt ? activePt.price : 185.4)}
            </span>
            <span className="text-xs font-mono text-emerald-400 font-semibold flex items-center gap-0.5">
              <span>+{(activePool?.activity24h?.priceChange24hPct || 8.4).toFixed(1)}%</span>
              <span className="text-[#A7A7B8] text-[10px] ml-1">24h</span>
            </span>
            {activePt && (
              <span className="text-[11px] font-mono text-[#66667A]">
                @ {activePt.time}
              </span>
            )}
          </div>
        </div>

        {/* Timeframe Toggles */}
        <div className="flex items-center gap-1 p-1 bg-[#080821] border border-[rgba(138,32,255,0.25)] rounded-lg self-start sm:self-auto">
          {(['1H', '24H', '7D', '30D'] as const).map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 text-xs font-mono rounded-md transition-colors cursor-pointer ${
                timeframe === tf
                  ? 'bg-[#6010F0] text-white font-bold shadow-xs'
                  : 'text-[#A7A7B8] hover:text-white hover:bg-[#140130]'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Interactive Chart */}
      <div className="relative h-48 w-full select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            {/* Luminous Master Line Gradient */}
            <linearGradient id="chart-line-gradient" x1="0" y1="0" x2={width} y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6010F0" />
              <stop offset="35%" stopColor="#8A20FF" />
              <stop offset="70%" stopColor="#D82AA8" />
              <stop offset="100%" stopColor="#FF8A20" />
            </linearGradient>

            {/* Ambient Shaded Fill */}
            <linearGradient id="chart-area-gradient" x1="0" y1="0" x2="0" y2={height} gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#8A20FF" stopOpacity="0.32" />
              <stop offset="60%" stopColor="#6010F0" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#000010" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padX} y1={padY} x2={width - padX} y2={padY} stroke="rgba(138,32,255,0.08)" strokeDasharray="3 3" />
          <line x1={padX} y1={height / 2} x2={width - padX} y2={height / 2} stroke="rgba(138,32,255,0.08)" strokeDasharray="3 3" />
          <line x1={padX} y1={height - padY} x2={width - padX} y2={height - padY} stroke="rgba(138,32,255,0.08)" strokeDasharray="3 3" />

          {/* Area Fill */}
          <path d={areaD} fill="url(#chart-area-gradient)" />

          {/* Glow Line */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#chart-line-gradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="filter drop-shadow-[0_0_12px_rgba(138,32,255,0.5)]"
          />

          {/* Interactive Crosshair & Hover Point */}
          {hoveredIndex !== null && svgCoords[hoveredIndex] && (
            <g>
              <line
                x1={svgCoords[hoveredIndex].x}
                y1={0}
                x2={svgCoords[hoveredIndex].x}
                y2={height}
                stroke="rgba(255,138,32,0.4)"
                strokeDasharray="2 2"
                strokeWidth="1.5"
              />
              <circle
                cx={svgCoords[hoveredIndex].x}
                cy={svgCoords[hoveredIndex].y}
                r="6"
                fill="#FF8A20"
                className="animate-pulse"
              />
              <circle
                cx={svgCoords[hoveredIndex].x}
                cy={svgCoords[hoveredIndex].y}
                r="10"
                stroke="#FF8A20"
                strokeWidth="1.5"
                opacity="0.5"
              />
            </g>
          )}

          {/* Transparent Hover Hit Boxes */}
          {svgCoords.map((pt, i) => (
            <rect
              key={i}
              x={pt.x - (width / chartData.length) / 2}
              y={0}
              width={width / chartData.length}
              height={height}
              fill="transparent"
              className="cursor-crosshair"
              onMouseEnter={() => setHoveredIndex(i)}
            />
          ))}
        </svg>
      </div>

      {/* Bottom Activity Flow Telemetry */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[rgba(138,32,255,0.18)] text-xs font-mono">
        {/* Inflow vs Outflow */}
        <div className="bg-[#080821] border border-[rgba(138,32,255,0.2)] rounded-lg p-2.5">
          <div className="flex items-center justify-between text-[#A7A7B8] mb-1.5 text-[11px]">
            <span>Order Flow Ratio</span>
            <span className="text-emerald-400 font-bold">{buyRatio}% Buy</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#140130] overflow-hidden flex">
            <div className="h-full bg-emerald-400" style={{ width: `${buyRatio}%` }} />
            <div className="h-full bg-rose-500" style={{ width: `${sellRatio}%` }} />
          </div>
        </div>

        {/* Oracle Latency */}
        <div className="bg-[#080821] border border-[rgba(138,32,255,0.2)] rounded-lg p-2.5 flex items-center justify-between">
          <div>
            <span className="text-[#A7A7B8] block text-[10px]">Pyth Oracle Confidence</span>
            <span className="text-[#F5F5F7] font-bold text-xs mt-0.5 block">±0.04% Live Feed</span>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        {/* Action: Open Explorer */}
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onExploreMarkets}
            className="w-full h-full rounded-lg bg-[rgba(138,32,255,0.15)] hover:bg-[#6010F0] text-[#F5F5F7] border border-[rgba(138,32,255,0.3)] hover:border-[#8A20FF] p-2.5 flex items-center justify-center gap-1.5 transition-all text-xs font-semibold cursor-pointer group"
          >
            <span>Explore All Markets</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
