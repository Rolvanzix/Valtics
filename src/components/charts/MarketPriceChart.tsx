import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { formatCurrency } from '../../utils/format';
import { fetchPythHistoricalOHLC, PythPricePoint } from '../../services/pyth';

interface MarketPriceChartProps {
  currentPrice: number | null;
  startPrice?: number;
  migrationPrice?: number;
  quoteSymbol?: string;
  height?: number;
  tokenSymbol?: string;
  pythSymbol?: string;
  feedId?: string;
  feedStatus?: 'ok' | 'unsupported' | 'unavailable' | 'loading' | 'error';
  onHoverPrice?: (price: number | null, time: string | null) => void;
}

export const MarketPriceChart: React.FC<MarketPriceChartProps> = ({
  currentPrice,
  quoteSymbol = 'USD',
  height = 240,
  tokenSymbol,
  pythSymbol,
  feedId,
  feedStatus,
  onHoverPrice,
}) => {
  const [timeframe, setTimeframe] = useState<'24H' | '7D' | 'ALL'>('24H');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [priceData, setPriceData] = useState<PythPricePoint[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);
  const [historyStatus, setHistoryStatus] = useState<
    'ok' | 'unsupported' | 'unavailable' | 'error'
  >('unavailable');

  const symbolToQuery = pythSymbol || tokenSymbol || feedId || '';

  // Fetch real Pyth historical OHLC data
  useEffect(() => {
    let mounted = true;
    if (!symbolToQuery) {
      setIsLoadingHistory(false);
      setHistoryStatus('unavailable');
      setPriceData([]);
      return;
    }

    if (feedStatus === 'unsupported') {
      setIsLoadingHistory(false);
      setHistoryStatus('unsupported');
      setPriceData([]);
      return;
    }

    setIsLoadingHistory(true);
    fetchPythHistoricalOHLC(symbolToQuery, timeframe)
      .then((res) => {
        if (!mounted) return;
        setHistoryStatus(res.status);
        if (res.status === 'ok' && res.bars.length > 0) {
          setPriceData(res.bars);
        } else {
          setPriceData([]);
        }
        setIsLoadingHistory(false);
      })
      .catch(() => {
        if (!mounted) return;
        setHistoryStatus('error');
        setPriceData([]);
        setIsLoadingHistory(false);
      });

    return () => {
      mounted = false;
    };
  }, [symbolToQuery, timeframe, feedStatus]);

  const activePoint =
    hoveredIndex !== null && priceData[hoveredIndex]
      ? priceData[hoveredIndex]
      : priceData[priceData.length - 1];

  const minPrice = useMemo(() => {
    if (priceData.length === 0) return 0;
    const lows = priceData.map((d) => d.low || d.close);
    return Math.min(...lows) * 0.998;
  }, [priceData]);

  const maxPrice = useMemo(() => {
    if (priceData.length === 0) return 1;
    const highs = priceData.map((d) => d.high || d.close);
    return Math.max(...highs) * 1.002;
  }, [priceData]);

  const priceRange = Math.max(0.0001, maxPrice - minPrice);

  const paddingX = 20;
  const paddingY = 16;
  const chartWidth = 700;
  const chartHeight = height - paddingY * 2;

  const getX = (index: number) =>
    paddingX + (index / Math.max(1, priceData.length - 1)) * (chartWidth - paddingX * 2);
  const getY = (val: number) =>
    paddingY + chartHeight - ((val - minPrice) / priceRange) * chartHeight;

  // Clean SVG Line path
  const linePath = useMemo(() => {
    if (priceData.length === 0) return '';
    return priceData.reduce((path, pt, i) => {
      const x = getX(i);
      const y = getY(pt.close);
      return `${path} ${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }, '');
  }, [priceData, minPrice, maxPrice]);

  const areaPath = useMemo(() => {
    if (priceData.length === 0 || !linePath) return '';
    const firstX = getX(0);
    const lastX = getX(priceData.length - 1);
    const bottomY = paddingY + chartHeight;
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [linePath, priceData]);

  const firstClose = priceData[0]?.close ?? currentPrice ?? 0;
  const lastClose = priceData[priceData.length - 1]?.close ?? currentPrice ?? 0;
  const isUp = lastClose >= firstClose;
  const strokeColor = isUp ? '#34d399' : '#f87171';
  const fillGradientId = `chartGradient-${isUp ? 'up' : 'down'}`;

  // Timeframe selector header
  const timeframeHeader = (
    <div className="flex items-center justify-between">
      <div className="text-xs font-mono text-zinc-500">
        {hoveredIndex !== null && activePoint ? (
          <span>
            {activePoint.time} • {formatCurrency(activePoint.close, quoteSymbol)}
          </span>
        ) : (
          <span>Historical performance (Pyth Pro)</span>
        )}
      </div>

      <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-0.5 rounded-lg">
        {(['24H', '7D', 'ALL'] as const).map((tf) => (
          <button
            key={tf}
            type="button"
            onClick={() => setTimeframe(tf)}
            className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
              timeframe === tf
                ? 'bg-zinc-800 text-white font-medium'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tf}
          </button>
        ))}
      </div>
    </div>
  );

  if (isLoadingHistory) {
    return (
      <div className="space-y-3">
        {timeframeHeader}
        <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-500 font-mono text-xs select-none" style={{ height }}>
          <RefreshCw className="w-4 h-4 animate-spin text-zinc-400 mb-2" />
          <span className="text-zinc-400">Loading Pyth historical data...</span>
        </div>
      </div>
    );
  }

  if (historyStatus === 'unsupported' || feedStatus === 'unsupported') {
    return (
      <div className="space-y-3">
        {timeframeHeader}
        <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-500 font-mono text-xs select-none" style={{ height }}>
          <span className="text-zinc-300 font-medium">Pyth feed not entitled</span>
          <span className="text-[11px] text-zinc-500 mt-1 max-w-md">
            This asset requires an institutional exchange license grant (e.g. Cboe BZX equities) under Pyth Network.
          </span>
        </div>
      </div>
    );
  }

  if (priceData.length === 0) {
    return (
      <div className="space-y-3">
        {timeframeHeader}
        <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-500 font-mono text-xs select-none" style={{ height }}>
          <span className="text-zinc-400">Historical performance unavailable</span>
          <span className="text-[11px] text-zinc-600 mt-1">
            Pyth historical OHLC data is not currently published for this interval.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {timeframeHeader}

      {/* SVG Chart Stage */}
      <div className="relative w-full overflow-hidden select-none" style={{ height }}>
        <svg
          viewBox={`0 0 ${chartWidth} ${height}`}
          className="w-full h-full overflow-visible"
          onMouseLeave={() => {
            setHoveredIndex(null);
            if (onHoverPrice) onHoverPrice(null, null);
          }}
        >
          <defs>
            <linearGradient id={fillGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.15" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Minimal Horizontal Gridlines */}
          {[0, 0.5, 1].map((ratio) => {
            const y = paddingY + chartHeight * ratio;
            const price = maxPrice - ratio * priceRange;
            return (
              <g key={ratio}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={chartWidth - paddingX}
                  y2={y}
                  stroke="#27272a"
                  strokeWidth="0.75"
                  strokeDasharray="4 4"
                />
                <text
                  x={chartWidth - paddingX}
                  y={y - 4}
                  textAnchor="end"
                  fill="#71717a"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {formatCurrency(price, quoteSymbol)}
                </text>
              </g>
            );
          })}

          {/* Area Fill & Main Line */}
          <path d={areaPath} fill={`url(#${fillGradientId})`} />
          <path
            d={linePath}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Active Hover Cursor */}
          {hoveredIndex !== null && activePoint && (
            <g>
              <line
                x1={getX(hoveredIndex)}
                y1={paddingY}
                x2={getX(hoveredIndex)}
                y2={paddingY + chartHeight}
                stroke="#52525b"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <circle
                cx={getX(hoveredIndex)}
                cy={getY(activePoint.close)}
                r="4"
                fill={strokeColor}
                stroke="#090d14"
                strokeWidth="2"
              />
            </g>
          )}

          {/* Mouse Hit Areas */}
          {priceData.map((pt, i) => {
            const x = getX(i);
            const stepWidth = (chartWidth - paddingX * 2) / Math.max(1, priceData.length);
            return (
              <rect
                key={i}
                x={x - stepWidth / 2}
                y={paddingY}
                width={stepWidth}
                height={chartHeight}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => {
                  setHoveredIndex(i);
                  if (onHoverPrice) onHoverPrice(pt.close, pt.time);
                }}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
};
