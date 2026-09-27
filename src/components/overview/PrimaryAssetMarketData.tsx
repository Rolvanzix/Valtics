import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  fetchPythMarketData, 
  PythAssetFeed, 
  PYTH_DEVNET_FEEDS 
} from '../../services/pyth';
import { DBCPoolState } from '../../types';
import { formatCurrency } from '../../utils/format';

interface PrimaryAssetMarketDataProps {
  markets?: DBCPoolState[];
  onSelectMarket?: (poolAddress: string) => void;
}

export const PrimaryAssetMarketData: React.FC<PrimaryAssetMarketDataProps> = ({
  markets = [],
  onSelectMarket,
}) => {
  const [selectedAssetId, setSelectedAssetId] = useState<string>('pyth:sol_usd');
  const [pythData, setPythData] = useState<PythAssetFeed | null>(null);
  const [timeframe, setTimeframe] = useState<'1H' | '24H' | '7D' | '30D'>('24H');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const feedKey = selectedAssetId === 'pyth:btc_usd' ? 'BTC_USD' : 'SOL_USD';
        const feed = await fetchPythMarketData(feedKey);
        if (mounted) setPythData(feed);
      } catch (err) {
        // Handled silently to preserve calm UI
      }
    }

    loadData();
    const interval = setInterval(loadData, 8000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [selectedAssetId]);

  const selectedPool = useMemo(() => {
    if (!selectedAssetId.startsWith('pool:')) return null;
    const addr = selectedAssetId.replace('pool:', '');
    return markets.find((m) => m.poolAddress === addr) || null;
  }, [selectedAssetId, markets]);

  // Unified Asset View Model
  const asset = useMemo(() => {
    if (selectedPool) {
      const hasRef = typeof selectedPool.referencePrice === 'number' && selectedPool.referencePrice > 0;
      const currentPrice = selectedPool.currentPrice || 0;
      const startPrice = selectedPool.startPrice || currentPrice;
      const delta = currentPrice - startPrice;
      const deltaPct = startPrice > 0 ? (delta / startPrice) * 100 : 0;

      const points = [];
      const count = timeframe === '1H' ? 12 : timeframe === '24H' ? 24 : timeframe === '7D' ? 28 : 30;
      const now = Date.now();
      const intervalMs = timeframe === '1H' ? 5 * 60 * 1000 : 60 * 60 * 1000;

      for (let i = 0; i < count; i++) {
        const frac = i / (count - 1);
        const p = startPrice + delta * frac;
        const ptTime = new Date(now - (count - 1 - i) * intervalMs);
        points.push({
          time: ptTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: ptTime.getTime(),
          price: Number(p.toFixed(4)),
        });
      }

      return {
        id: selectedPool.poolAddress,
        name: selectedPool.tokenName || selectedPool.name,
        symbol: selectedPool.tokenSymbol || selectedPool.symbol || 'ASSET',
        description: selectedPool.rwaCategory || 'Tokenized Asset',
        price: currentPrice,
        change: delta,
        changePct: deltaPct,
        referencePrice: hasRef ? selectedPool.referencePrice : null,
        spreadToNavPct: hasRef && selectedPool.referencePrice
          ? ((currentPrice - selectedPool.referencePrice) / selectedPool.referencePrice) * 100
          : null,
        confidence: undefined,
        points,
      };
    }

    // Default: Pyth Network live feed
    const points = pythData?.history[timeframe] || [];
    return {
      id: pythData?.id || 'sol_usd',
      name: pythData?.name || 'Solana Benchmark',
      symbol: pythData?.symbol || 'SOL / USD',
      description: 'Settlement quote asset',
      price: pythData && pythData.price > 0 ? pythData.price : null,
      change: pythData?.change24h ?? null,
      changePct: pythData?.change24hPct ?? null,
      referencePrice: null,
      spreadToNavPct: null,
      confidence: pythData?.confidence,
      points,
    };
  }, [selectedPool, pythData, timeframe]);

  // Active hover point or current live price
  const activePrice = useMemo(() => {
    if (hoveredPointIndex !== null && asset.points[hoveredPointIndex]) {
      return asset.points[hoveredPointIndex].price;
    }
    return asset.price;
  }, [hoveredPointIndex, asset]);

  const activeTimeLabel = useMemo(() => {
    if (hoveredPointIndex !== null && asset.points[hoveredPointIndex]) {
      return asset.points[hoveredPointIndex].time;
    }
    return null;
  }, [hoveredPointIndex, asset]);

  // Chart coordinates
  const width = 800;
  const height = 150;
  const paddingX = 12;
  const paddingY = 20;

  const chartBounds = useMemo(() => {
    const pts = asset.points;
    if (pts.length === 0) return { min: 0, max: 1, range: 1 };
    const prices = pts.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const span = max - min || min * 0.02 || 1;
    return {
      min: min - span * 0.08,
      max: max + span * 0.08,
      range: span * 1.16,
    };
  }, [asset.points]);

  const svgCoordinates = useMemo(() => {
    const pts = asset.points;
    if (pts.length === 0) return [];
    const usableW = width - paddingX * 2;
    const usableH = height - paddingY * 2;

    return pts.map((pt, i) => {
      const x = paddingX + (i / (pts.length - 1)) * usableW;
      const normalizedY = (pt.price - chartBounds.min) / chartBounds.range;
      const y = height - paddingY - normalizedY * usableH;
      return { x, y, point: pt };
    });
  }, [asset.points, chartBounds, width, height]);

  const svgPath = useMemo(() => {
    if (svgCoordinates.length === 0) return '';
    return svgCoordinates.reduce((acc, curr, idx) => {
      return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
    }, '');
  }, [svgCoordinates]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || svgCoordinates.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const svgX = (mouseX / rect.width) * width;

    let closestIdx = 0;
    let minDistance = Infinity;
    svgCoordinates.forEach((coord, i) => {
      const dist = Math.abs(coord.x - svgX);
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = i;
      }
    });

    setHoveredPointIndex(closestIdx);
  };

  const isPositiveChange = asset.change >= 0;

  return (
    <div className="rounded-xl border border-[#141d2e] bg-[#070b14]/75 p-5 sm:p-6 space-y-3">
      {/* 1. Header: Minimal Asset Identity & Clean Live Price */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
        {/* Left: Asset Title & Price Hierarchy */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {markets.length > 0 ? (
              <select
                aria-label="Select asset market feed"
                value={selectedAssetId}
                onChange={(e) => {
                  setSelectedAssetId(e.target.value);
                  setHoveredPointIndex(null);
                }}
                className="bg-transparent text-sm font-semibold text-zinc-100 focus:outline-none cursor-pointer font-sans appearance-none pr-4 hover:text-white transition-colors"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right center',
                }}
              >
                <option value="pyth:sol_usd" className="bg-[#090e18] text-zinc-200">SOL / USD · Settlement Benchmark</option>
                <option value="pyth:btc_usd" className="bg-[#090e18] text-zinc-200">BTC / USD · Collateral Benchmark</option>
                {markets.map((m) => (
                  <option key={m.poolAddress} value={`pool:${m.poolAddress}`} className="bg-[#090e18] text-zinc-200">
                    {m.tokenSymbol || m.symbol} · {m.tokenName || m.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-sans font-semibold text-sm text-zinc-200">
                {asset.name}
              </span>
            )}

            <span className="font-mono text-xs text-zinc-400">
              {asset.symbol}
            </span>

            <span className="text-zinc-600 text-xs font-sans">·</span>
            <span className="text-xs text-zinc-400 font-sans">
              {asset.description}
            </span>
          </div>

          <div className="flex items-baseline gap-3 pt-0.5">
            <div className="font-mono text-3xl sm:text-4xl font-bold text-white tracking-tight">
              {activePrice !== null && activePrice > 0 ? formatCurrency(activePrice) : '—'}
            </div>

            {activeTimeLabel ? (
              <span className="font-mono text-xs text-zinc-400">
                {activeTimeLabel}
              </span>
            ) : asset.change !== null && asset.changePct !== null ? (
              <div
                className={`font-mono text-xs font-medium flex items-baseline gap-1 ${
                  isPositiveChange ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                <span>{isPositiveChange ? '+' : ''}{asset.change.toFixed(2)}</span>
                <span>({isPositiveChange ? '+' : ''}{asset.changePct.toFixed(2)}%)</span>
                <span className="text-zinc-400 font-sans ml-0.5">24h</span>
              </div>
            ) : (
              <span className="text-xs text-zinc-500 font-mono">—</span>
            )}
          </div>
        </div>

        {/* Right: Uncluttered Timeframe Controls */}
        <div className="flex items-center gap-0.5 self-start sm:self-auto">
          {(['1H', '24H', '7D', '30D'] as const).map((tf) => {
            const isSelected = timeframe === tf;
            return (
              <button
                key={tf}
                type="button"
                onClick={() => {
                  setTimeframe(tf);
                  setHoveredPointIndex(null);
                }}
                className={`px-2 py-0.5 text-xs font-mono rounded transition-colors cursor-pointer ${
                  isSelected
                    ? 'text-amber-400 font-semibold bg-[#111927]'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {tf}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Primary Historical Price Chart (Subtle Hairline SVG) */}
      <div className="relative w-full h-[150px] select-none">
        {/* Subtle Horizontal Reference Limits */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none py-2">
          <div className="border-b border-[#121927]/60 w-full flex justify-end pr-1">
            <span className="text-[10px] font-mono text-zinc-400">
              {formatCurrency(chartBounds.max)}
            </span>
          </div>
          <div className="border-b border-[#121927]/30 w-full flex justify-end pr-1">
            <span className="text-[10px] font-mono text-zinc-400">
              {formatCurrency((chartBounds.max + chartBounds.min) / 2)}
            </span>
          </div>
          <div className="border-b border-[#121927]/60 w-full flex justify-end pr-1">
            <span className="text-[10px] font-mono text-zinc-400">
              {formatCurrency(chartBounds.min)}
            </span>
          </div>
        </div>

        {/* SVG Interactive Path */}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full cursor-crosshair relative z-10"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredPointIndex(null)}
        >
          {svgPath && (
            <path
              d={svgPath}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {hoveredPointIndex !== null && svgCoordinates[hoveredPointIndex] && (
            <g>
              <line
                x1={svgCoordinates[hoveredPointIndex].x}
                y1={paddingY}
                x2={svgCoordinates[hoveredPointIndex].x}
                y2={height - paddingY}
                stroke="#334155"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle
                cx={svgCoordinates[hoveredPointIndex].x}
                cy={svgCoordinates[hoveredPointIndex].y}
                r="3"
                fill="#f59e0b"
                stroke="#070b14"
                strokeWidth="1.5"
              />
            </g>
          )}
        </svg>
      </div>

      {/* 3. Subordinated Supporting Market Information (Single Clean Row) */}
      <div className="pt-2 border-t border-[#121a28] flex items-center justify-between text-xs text-zinc-400 font-sans">
        <div className="flex items-center gap-4">
          {asset.confidence !== undefined && (
            <span className="font-mono text-zinc-300">
              Confidence ±${asset.confidence.toFixed(3)}
            </span>
          )}

          {asset.referencePrice !== null && (
            <span>
              NAV <span className="font-mono text-zinc-300">{formatCurrency(asset.referencePrice)}</span>
            </span>
          )}

          {asset.spreadToNavPct !== null && (
            <span>
              Spread{' '}
              <span className="font-mono text-zinc-300">
                {asset.spreadToNavPct > 0 ? '+' : ''}{asset.spreadToNavPct.toFixed(2)}%
              </span>
            </span>
          )}
        </div>

        <span className="text-[11px] text-zinc-400">
          Pyth Network oracle infrastructure
        </span>
      </div>
    </div>
  );
};
