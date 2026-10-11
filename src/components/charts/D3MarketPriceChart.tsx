import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { RefreshCw, Activity, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';
import { formatCurrency } from '../../utils/format';
import { fetchPythHistoricalOHLC, PythPricePoint } from '../../services/pyth';

export interface D3MarketPriceChartProps {
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

export const D3MarketPriceChart: React.FC<D3MarketPriceChartProps> = ({
  currentPrice,
  startPrice,
  migrationPrice,
  quoteSymbol = 'USD',
  height = 280,
  tokenSymbol,
  pythSymbol,
  feedId,
  feedStatus,
  onHoverPrice,
}) => {
  const [timeframe, setTimeframe] = useState<'24H' | '7D' | 'ALL'>('24H');
  const [priceData, setPriceData] = useState<PythPricePoint[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);
  const [historyStatus, setHistoryStatus] = useState<'ok' | 'unsupported' | 'unavailable' | 'error'>('unavailable');
  const [hoveredPoint, setHoveredPoint] = useState<PythPricePoint | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(720);

  const symbolToQuery = pythSymbol || tokenSymbol || feedId || '';

  // Resize observer for responsive D3 rendering
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Fetch real Pyth / institutional benchmark OHLC
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

  // Active point (either hovered point or latest point)
  const activePoint = useMemo(() => {
    if (hoveredPoint) return hoveredPoint;
    if (priceData.length > 0) return priceData[priceData.length - 1];
    return null;
  }, [hoveredPoint, priceData]);

  const displayedPrice = activePoint ? activePoint.close : currentPrice;
  const initialPrice = priceData.length > 0 ? priceData[0].open || priceData[0].close : startPrice || displayedPrice || 1;
  const priceChange = displayedPrice !== null && initialPrice ? displayedPrice - initialPrice : 0;
  const priceChangePct = displayedPrice !== null && initialPrice ? (priceChange / initialPrice) * 100 : 0;
  const isUp = priceChangePct >= 0;

  // Compute D3 chart geometry and scales
  const margin = { top: 20, right: 30, bottom: 35, left: 16 };
  const width = Math.max(300, containerWidth);
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // D3 Scales & Paths calculation
  const { linePath, areaPath, volumeBars, xScale, yScale, minP, maxP, yTicks, xTicks } = useMemo(() => {
    if (priceData.length === 0) {
      return {
        linePath: '',
        areaPath: '',
        volumeBars: [],
        xScale: null,
        yScale: null,
        minP: 0,
        maxP: 1,
        yTicks: [],
        xTicks: [],
      };
    }

    // Time domain
    const timeExtent = d3.extent<PythPricePoint, Date>(priceData, (d) => new Date(d.time));
    const startDt = timeExtent[0] || new Date();
    const endDt = timeExtent[1] || new Date();
    const x = d3.scaleTime().domain([startDt, endDt]).range([margin.left, margin.left + chartWidth]);

    // Price domain with 2% breathing room
    const lows = priceData.map((d) => d.low || d.close);
    const highs = priceData.map((d) => d.high || d.close);
    const minVal = Math.min(...lows);
    const maxVal = Math.max(...highs);
    const padding = (maxVal - minVal) * 0.05 || maxVal * 0.02 || 0.01;
    const yMin = Math.max(0, minVal - padding);
    const yMax = maxVal + padding;

    const y = d3.scaleLinear().domain([yMin, yMax]).range([margin.top + chartHeight, margin.top]);

    // D3 Line Generator with smooth curve
    const lineGen = d3
      .line<PythPricePoint>()
      .x((d) => x(new Date(d.time)))
      .y((d) => y(d.close))
      .curve(d3.curveMonotoneX);

    // D3 Area Generator
    const areaGen = d3
      .area<PythPricePoint>()
      .x((d) => x(new Date(d.time)))
      .y0(margin.top + chartHeight)
      .y1((d) => y(d.close))
      .curve(d3.curveMonotoneX);

    // Volume scale (bottom 22% of chart height)
    const maxVolVal = d3.max<PythPricePoint, number>(priceData, (d) => Number(d.volume || 0)) ?? 1;
    const maxVol = Number(maxVolVal) > 0 ? Number(maxVolVal) : 1;
    const volHeight = chartHeight * 0.22;
    const volY = d3.scaleLinear().domain([0, maxVol]).range([0, volHeight]);

    const barWidth = Math.max(2, (chartWidth / priceData.length) * 0.65);
    const vBars = priceData.map((d) => {
      const bx = x(new Date(d.time)) - barWidth / 2;
      const bHeight = volY(d.volume || 0);
      const by = margin.top + chartHeight - bHeight;
      return {
        x: bx,
        y: by,
        width: barWidth,
        height: Math.max(1, bHeight),
        isUp: (d.close || 0) >= (d.open || d.close || 0),
      };
    });

    const yT = y.ticks(4);
    const xT = x.ticks(timeframe === '24H' ? 5 : 4);

    return {
      linePath: lineGen(priceData) || '',
      areaPath: areaGen(priceData) || '',
      volumeBars: vBars,
      xScale: x,
      yScale: y,
      minP: yMin,
      maxP: yMax,
      yTicks: yT,
      xTicks: xT,
    };
  }, [priceData, chartWidth, chartHeight, margin.left, margin.right, margin.top, margin.bottom, timeframe]);

  // Pointer move handler using D3 bisector
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!xScale || priceData.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;

    // Convert mouseX to date using inverted scale
    const targetDate = xScale.invert(mouseX);
    const bisect = d3.bisector<PythPricePoint, Date>((d) => new Date(d.time)).left;
    const idx = bisect(priceData, targetDate);

    let selectedPoint = priceData[idx];
    if (idx > 0 && idx < priceData.length) {
      const prev = priceData[idx - 1];
      const next = priceData[idx];
      selectedPoint =
        Math.abs(new Date(next.time).getTime() - targetDate.getTime()) <
        Math.abs(new Date(prev.time).getTime() - targetDate.getTime())
          ? next
          : prev;
    } else if (idx >= priceData.length) {
      selectedPoint = priceData[priceData.length - 1];
    } else {
      selectedPoint = priceData[0];
    }

    if (selectedPoint) {
      setHoveredPoint(selectedPoint);
      if (onHoverPrice) {
        onHoverPrice(selectedPoint.close, selectedPoint.time);
      }
    }
  };

  const handlePointerLeave = () => {
    setHoveredPoint(null);
    if (onHoverPrice) {
      onHoverPrice(null, null);
    }
  };

  // Active cursor coordinates
  const activeCoordinates = useMemo(() => {
    if (!activePoint || !xScale || !yScale) return null;
    return {
      x: xScale(new Date(activePoint.time)),
      y: yScale(activePoint.close),
    };
  }, [activePoint, xScale, yScale]);

  const strokeColor = isUp ? '#10B981' : '#F43F5E';
  const gradientId = `d3-price-gradient-${feedId || tokenSymbol || 'default'}`;

  return (
    <div ref={containerRef} className="w-full space-y-3 font-sans select-none">
      {/* 1. Header Toolbar with Live Pyth Telemetry & Timeframe Selectors */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#670CDC]/20 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#1C0142] border border-[#670CDC]/30 text-[10px] font-mono text-[#D76EDD]">
            <Activity className="w-3 h-3 text-[#34D399]" />
            <span>D3 Real-Time Chart</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-bold font-mono text-[#F7F3FF]">
              {displayedPrice !== null ? formatCurrency(displayedPrice, quoteSymbol === 'SOL' ? 'SOL' : 'USD') : '—'}
            </span>
            {displayedPrice !== null && (
              <span
                className={`inline-flex items-center gap-0.5 text-xs font-mono font-semibold px-1.5 py-0.5 rounded ${
                  isUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}
              >
                {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {isUp ? '+' : ''}
                {priceChangePct.toFixed(2)}%
              </span>
            )}
          </div>
        </div>

        {/* Timeframe Tabs & Refresh Status */}
        <div className="flex items-center gap-2">
          {isLoadingHistory && (
            <div className="flex items-center gap-1 text-[11px] text-[#B8A9CC] font-mono animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin text-[#F99225]" />
              <span className="hidden sm:inline">Syncing feeds...</span>
            </div>
          )}

          <div className="flex items-center p-0.5 rounded-lg bg-[#140130] border border-[#670CDC]/30 text-xs font-mono">
            {(['24H', '7D', 'ALL'] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  timeframe === tf
                    ? 'bg-[#670CDC] text-white shadow-sm font-semibold'
                    : 'text-[#B8A9CC] hover:text-[#F7F3FF]'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Interactive SVG Canvas powered by D3 */}
      <div className="relative w-full overflow-hidden rounded-xl bg-[#0A0018]/80 border border-[#670CDC]/15">
        {priceData.length > 0 ? (
          <svg
            width="100%"
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="overflow-visible cursor-crosshair"
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
          >
            <defs>
              {/* Dynamic Gradient for D3 Area */}
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity="0.32" />
                <stop offset="50%" stopColor={strokeColor} stopOpacity="0.08" />
                <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
              </linearGradient>

              {/* Glowing Drop-shadow for active cursor */}
              <filter id="d3-cursor-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Horizontal Gridlines & D3 Y-Ticks */}
            {yTicks.map((tickVal, i) => {
              if (!yScale) return null;
              const yPos = yScale(tickVal);
              return (
                <g key={`ytick-${i}`} className="text-[#670CDC]/20">
                  <line
                    x1={margin.left}
                    y1={yPos}
                    x2={margin.left + chartWidth}
                    y2={yPos}
                    stroke="currentColor"
                    strokeDasharray="3 3"
                    strokeWidth="0.8"
                  />
                  <text
                    x={margin.left + chartWidth + 6}
                    y={yPos + 3}
                    fill="#7E6D96"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {formatCurrency(tickVal, quoteSymbol === 'SOL' ? 'SOL' : 'USD')}
                  </text>
                </g>
              );
            })}

            {/* Volume Histogram (bottom overlay) */}
            {volumeBars.map((bar, i) => (
              <rect
                key={`vol-${i}`}
                x={bar.x}
                y={bar.y}
                width={bar.width}
                height={bar.height}
                fill={bar.isUp ? '#10B981' : '#F43F5E'}
                opacity="0.18"
                rx="0.5"
              />
            ))}

            {/* D3 Gradient Area */}
            {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}

            {/* D3 Price Line */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke={strokeColor}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* D3 Time X-Axis Ticks */}
            {xTicks.map((dateVal, i) => {
              if (!xScale) return null;
              const xPos = xScale(dateVal);
              const dateStr =
                timeframe === '24H'
                  ? d3.timeFormat('%H:%M')(dateVal)
                  : d3.timeFormat('%b %d')(dateVal);
              return (
                <text
                  key={`xtick-${i}`}
                  x={xPos}
                  y={height - 10}
                  fill="#7E6D96"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {dateStr}
                </text>
              );
            })}

            {/* Active Scrubbing Crosshair & Glow Marker */}
            {activeCoordinates && (
              <g>
                {/* Vertical D3 Crosshair Line */}
                <line
                  x1={activeCoordinates.x}
                  y1={margin.top}
                  x2={activeCoordinates.x}
                  y2={margin.top + chartHeight}
                  stroke="#EDE4FA"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  opacity="0.45"
                />

                {/* Horizontal D3 Price Tracker Line */}
                <line
                  x1={margin.left}
                  y1={activeCoordinates.y}
                  x2={margin.left + chartWidth}
                  y2={activeCoordinates.y}
                  stroke="#EDE4FA"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  opacity="0.45"
                />

                {/* Pulsating Glowing Outer Ring */}
                <circle
                  cx={activeCoordinates.x}
                  y={activeCoordinates.y}
                  r="7"
                  fill={strokeColor}
                  opacity="0.25"
                  className="animate-ping"
                />

                {/* Cursor Dot */}
                <circle
                  cx={activeCoordinates.x}
                  y={activeCoordinates.y}
                  r="4"
                  fill="#FFFFFF"
                  stroke={strokeColor}
                  strokeWidth="2.5"
                  filter="url(#d3-cursor-glow)"
                />
              </g>
            )}
          </svg>
        ) : (
          <div className="h-[280px] flex flex-col items-center justify-center text-center p-6 space-y-2">
            <Layers className="w-8 h-8 text-[#670CDC]/40" />
            <div className="text-xs font-mono text-[#B8A9CC]">
              {historyStatus === 'unsupported'
                ? 'Institutional market data feed not entitled or restricted'
                : isLoadingHistory
                ? 'Retrieving live market candles...'
                : 'No historical OHLC points recorded for this pool interval'}
            </div>
            <p className="text-[11px] text-[#7E6D96] max-w-sm">
              Valtics verifies prices strictly against Pyth Network and decentralized oracles without synthesized mock feeds.
            </p>
          </div>
        )}

        {/* Floating D3 Inspection Tooltip Overlay */}
        {hoveredPoint && activeCoordinates && (
          <div
            className="absolute pointer-events-none z-10 px-3 py-2 rounded-lg bg-[#140130]/95 border border-[#670CDC]/40 shadow-xl backdrop-blur-md text-xs font-mono space-y-0.5"
            style={{
              left: Math.min(Math.max(10, activeCoordinates.x - 70), width - 150),
              top: Math.max(12, activeCoordinates.y - 75),
            }}
          >
            <div className="text-[10px] text-[#B8A9CC]">
              {d3.timeFormat('%Y-%m-%d %H:%M')(new Date(hoveredPoint.time))}
            </div>
            <div className="font-bold text-[#F7F3FF] text-sm">
              {formatCurrency(hoveredPoint.close, quoteSymbol === 'SOL' ? 'SOL' : 'USD')}
            </div>
            <div className="text-[10px] text-[#7E6D96] flex items-center gap-2">
              <span>H: {formatCurrency(hoveredPoint.high || hoveredPoint.close)}</span>
              <span>L: {formatCurrency(hoveredPoint.low || hoveredPoint.close)}</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Sub-footer telemetry info */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-[#7E6D96] font-mono px-1">
        <div className="flex items-center gap-3">
          <span>Range: {formatCurrency(minP)} – {formatCurrency(maxP)}</span>
          <span>·</span>
          <span>Bars: {priceData.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Source: Pyth Hermes v2 / Institutional Reference</span>
        </div>
      </div>
    </div>
  );
};
