import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { Layers, Zap, Shield, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';
import { DBCPoolState, CurvePoint } from '../../types';
import { generateCurvePoints } from '../../services/curveCalculator';
import { formatCurrency, formatPercent } from '../../utils/format';

export interface D3BondingCurveTrajectoryProps {
  pool: DBCPoolState;
  quoteSymbol?: string;
  height?: number;
  onInspectPoint?: (point: CurvePoint | null) => void;
}

export const D3BondingCurveTrajectory: React.FC<D3BondingCurveTrajectoryProps> = ({
  pool,
  quoteSymbol = 'USD',
  height = 320,
  onInspectPoint,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(720);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // ResizeObserver for responsive D3 calculations
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

  // Determine quote multiplier (SOL vs USDC)
  const isSolQuote = pool.quoteMint?.includes('So111') || quoteSymbol === 'SOL';
  const quotePriceUsd = isSolQuote ? 150 : 1.0;

  // Derive mathematical parameters for the selected liquidity pool
  const curvePoints: CurvePoint[] = useMemo(() => {
    const rawStart = pool.startPrice || (pool.currentPrice ? pool.currentPrice * 0.75 : 0.01);
    const rawCurrent = pool.currentPrice || rawStart;
    const rawMigration = pool.migrationPrice || rawCurrent * 1.5;

    const totalSupply = pool.totalSupply || 10_000_000;
    const allocationPct = pool.curveAllocationTokens && pool.totalSupply
      ? Math.round((pool.curveAllocationTokens / pool.totalSupply) * 100)
      : 75;

    const migrationCapUsd = rawMigration * totalSupply * quotePriceUsd;

    return generateCurvePoints(
      {
        curveType: pool.curveType || 'linear',
        totalSupply,
        allocationToCurvePct: allocationPct,
        startPriceUsd: rawStart * quotePriceUsd,
        migrationMarketCapUsd: migrationCapUsd,
        quoteAsset: isSolQuote ? 'SOL' : 'USDC',
        quotePriceUsd,
        feeBps: pool.baseFeeBps || 30,
        antiSniperSlots: pool.antiSniperSlots || 100,
        migrationTarget: pool.migrationOptionLabel || 'MET_DAMM_V2',
        vestingDays: pool.liquidityLockDays || 180,
      },
      40
    );
  }, [pool, isSolQuote, quotePriceUsd]);

  // Current progress calculation
  const currentProgressPct = useMemo(() => {
    if (typeof pool.quoteCurveProgressPct === 'number' && pool.quoteCurveProgressPct >= 0) {
      return Math.min(100, pool.quoteCurveProgressPct);
    }
    if (typeof pool.baseCurveProgressPct === 'number' && pool.baseCurveProgressPct >= 0) {
      return Math.min(100, pool.baseCurveProgressPct);
    }
    return 15; // default initial simulated progress
  }, [pool.quoteCurveProgressPct, pool.baseCurveProgressPct]);

  // Active point (either user hover or current pool state on curve)
  const activePoint = useMemo(() => {
    if (hoveredIdx !== null && curvePoints[hoveredIdx]) {
      return curvePoints[hoveredIdx];
    }
    const targetIdx = Math.min(
      Math.floor((currentProgressPct / 100) * (curvePoints.length - 1)),
      curvePoints.length - 1
    );
    return curvePoints[targetIdx] || curvePoints[0];
  }, [hoveredIdx, curvePoints, currentProgressPct]);

  // D3 Geometry & Scales
  const margin = { top: 25, right: 35, bottom: 45, left: 65 };
  const width = Math.max(300, containerWidth);
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const {
    linePath,
    areaPath,
    xScale,
    yScale,
    minPrice,
    maxPrice,
    currentX,
    currentY,
    gradY,
    xTicks,
    yTicks,
  } = useMemo(() => {
    if (curvePoints.length === 0) {
      return {
        linePath: '',
        areaPath: '',
        xScale: null,
        yScale: null,
        minPrice: 0,
        maxPrice: 1,
        currentX: 0,
        currentY: 0,
        gradY: 0,
        xTicks: [],
        yTicks: [],
      };
    }

    const prices = curvePoints.map((p) => p.currentPriceUsd);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const yBuffer = (maxP - minP) * 0.08 || maxP * 0.05;

    // X scale: 0% to 100% tokens sold on dynamic curve
    const x = d3.scaleLinear().domain([0, 100]).range([margin.left, margin.left + chartWidth]);

    // Y scale: spot price in USD / quote
    const y = d3
      .scaleLinear()
      .domain([Math.max(0, minP - yBuffer), maxP + yBuffer])
      .range([margin.top + chartHeight, margin.top]);

    // D3 Line Generator
    const lineGen = d3
      .line<CurvePoint>()
      .x((d) => x(d.tokensSoldPct))
      .y((d) => y(d.currentPriceUsd))
      .curve(d3.curveMonotoneX);

    // D3 Area Generator
    const areaGen = d3
      .area<CurvePoint>()
      .x((d) => x(d.tokensSoldPct))
      .y0(margin.top + chartHeight)
      .y1((d) => y(d.currentPriceUsd))
      .curve(d3.curveMonotoneX);

    // Current position on curve coordinates
    const curIdx = Math.min(
      Math.floor((currentProgressPct / 100) * (curvePoints.length - 1)),
      curvePoints.length - 1
    );
    const curPoint = curvePoints[curIdx] || curvePoints[0];
    const cX = x(currentProgressPct);
    const cY = y(curPoint.currentPriceUsd);

    // Graduation threshold coordinates
    const lastPoint = curvePoints[curvePoints.length - 1];
    const gY = y(lastPoint.currentPriceUsd);

    return {
      linePath: lineGen(curvePoints) || '',
      areaPath: areaGen(curvePoints) || '',
      xScale: x,
      yScale: y,
      minPrice: minP,
      maxPrice: maxP,
      currentX: cX,
      currentY: cY,
      gradY: gY,
      xTicks: [0, 25, 50, 75, 100],
      yTicks: y.ticks(5),
    };
  }, [curvePoints, chartWidth, chartHeight, margin.left, margin.right, margin.top, margin.bottom, currentProgressPct]);

  // Pointer move handler
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!xScale || curvePoints.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;

    const hoveredPct = Math.max(0, Math.min(100, xScale.invert(mouseX)));
    const bisect = d3.bisector<CurvePoint, number>((d) => d.tokensSoldPct).left;
    const idx = Math.min(curvePoints.length - 1, Math.max(0, bisect(curvePoints, hoveredPct)));

    setHoveredIdx(idx);
    if (onInspectPoint) {
      onInspectPoint(curvePoints[idx]);
    }
  };

  const handlePointerLeave = () => {
    setHoveredIdx(null);
    if (onInspectPoint) {
      onInspectPoint(null);
    }
  };

  // Hovered cursor coordinates
  const activeCoordinates = useMemo(() => {
    if (!activePoint || !xScale || !yScale) return null;
    return {
      x: xScale(activePoint.tokensSoldPct),
      y: yScale(activePoint.currentPriceUsd),
    };
  }, [activePoint, xScale, yScale]);

  const curveTypeLabel = (pool.curveType || 'Linear').toUpperCase();

  return (
    <div ref={containerRef} className="w-full space-y-4 font-sans select-none">
      {/* 1. High-Density Mathematical Telemetry HUD */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-[#140130] p-3 rounded-xl border border-[#670CDC]/25 font-mono text-xs">
        <div className="space-y-0.5">
          <span className="text-[10px] text-[#B8A9CC] uppercase flex items-center gap-1 font-sans">
            <Zap className="w-3 h-3 text-[#F99225]" />
            <span>Curve Progress</span>
          </span>
          <div className="text-sm font-bold text-[#F7F3FF]">
            {formatPercent(activePoint.tokensSoldPct)}
          </div>
          <span className="text-[10px] text-[#7E6D96]">
            {activePoint.tokensSold.toLocaleString(undefined, { maximumFractionDigits: 0 })} sold
          </span>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] text-[#B8A9CC] uppercase flex items-center gap-1 font-sans">
            <TrendingUp className="w-3 h-3 text-[#34D399]" />
            <span>Trajectory Price</span>
          </span>
          <div className="text-sm font-bold text-[#34D399]">
            {formatCurrency(activePoint.currentPriceUsd)}
          </div>
          <span className="text-[10px] text-[#7E6D96]">
            {activePoint.currentPriceQuote.toFixed(6)} {isSolQuote ? 'SOL' : 'USDC'}
          </span>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] text-[#B8A9CC] uppercase flex items-center gap-1 font-sans">
            <Layers className="w-3 h-3 text-[#D76EDD]" />
            <span>Accumulated Quote</span>
          </span>
          <div className="text-sm font-bold text-[#F7F3FF]">
            {formatCurrency(activePoint.accumulatedQuoteUsd)}
          </div>
          <span className="text-[10px] text-[#7E6D96]">
            Reserve in contract
          </span>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] text-[#B8A9CC] uppercase flex items-center gap-1 font-sans">
            <Shield className="w-3 h-3 text-[#670CDC]" />
            <span>Implied Valuation</span>
          </span>
          <div className="text-sm font-bold text-[#F7F3FF]">
            {formatCurrency(activePoint.marketCapUsd)}
          </div>
          <span className="text-[10px] text-[#7E6D96]">
            Impact: {activePoint.slippageBuy1000UsdPct.toFixed(2)}% / $1k buy
          </span>
        </div>
      </div>

      {/* 2. D3 Interactive Trajectory Curve Canvas */}
      <div className="relative w-full overflow-hidden rounded-xl bg-[#0A0018]/90 border border-[#670CDC]/20">
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="overflow-visible cursor-crosshair"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          <defs>
            {/* High-Tech Glowing Gradient Area */}
            <linearGradient id="d3-curve-trajectory-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#670CDC" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#8A20FF" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#F99225" stopOpacity="0.08" />
            </linearGradient>

            {/* Glowing Drop Filter for Active Cursor */}
            <filter id="d3-curve-dot-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Horizontal D3 Price Ticks & Gridlines */}
          {yTicks.map((tickVal, i) => {
            if (!yScale) return null;
            const yPos = yScale(tickVal);
            return (
              <g key={`ygrid-${i}`} className="text-[#670CDC]/20">
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
                  x={margin.left - 8}
                  y={yPos + 3}
                  fill="#7E6D96"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {formatCurrency(tickVal)}
                </text>
              </g>
            );
          })}

          {/* Vertical Milestone: 100% Graduation Threshold to Meteora DAMM v2 */}
          <line
            x1={margin.left + chartWidth}
            y1={margin.top}
            x2={margin.left + chartWidth}
            y2={margin.top + chartHeight}
            stroke="#F99225"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.6"
          />

          {/* Graduation Target Label Pin */}
          <g transform={`translate(${margin.left + chartWidth - 8}, ${margin.top + 16})`}>
            <rect
              x="-110"
              y="-12"
              width="114"
              height="20"
              rx="4"
              fill="#140130"
              stroke="#F99225"
              strokeWidth="0.8"
              opacity="0.9"
            />
            <text
              x="-53"
              y="2"
              fill="#F99225"
              fontSize="9"
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
            >
              GRADUATION TARGET
            </text>
          </g>

          {/* D3 Gradient Area Under Curve */}
          {areaPath && (
            <path
              d={areaPath}
              fill="url(#d3-curve-trajectory-gradient)"
            />
          )}

          {/* D3 Primary Trajectory Line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#8A20FF"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Progress Zone Accent (0% to current pool position) */}
          <rect
            x={margin.left}
            y={margin.top + chartHeight + 2}
            width={Math.max(0, currentX - margin.left)}
            height="3"
            fill="#34D399"
            rx="1.5"
          />

          {/* D3 X-Axis Ticks (Curve Progress %) */}
          {xTicks.map((pct, i) => {
            if (!xScale) return null;
            const xPos = xScale(pct);
            return (
              <g key={`xtick-${i}`}>
                <line
                  x1={xPos}
                  y1={margin.top + chartHeight}
                  x2={xPos}
                  y2={margin.top + chartHeight + 5}
                  stroke="#670CDC"
                  strokeWidth="1"
                />
                <text
                  x={xPos}
                  y={margin.top + chartHeight + 18}
                  fill="#7E6D96"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {pct}%
                </text>
              </g>
            );
          })}

          {/* Active Live Pool Position Marker on the Curve */}
          <g>
            {/* Subtle glow ring */}
            <circle
              cx={currentX}
              cy={currentY}
              r="8"
              fill="#34D399"
              opacity="0.2"
              className="animate-pulse"
            />
            {/* Center dot */}
            <circle
              cx={currentX}
              cy={currentY}
              r="4.5"
              fill="#34D399"
              stroke="#FFFFFF"
              strokeWidth="1.5"
            />
          </g>

          {/* Hover Crosshairs & Inspector Point */}
          {activeCoordinates && (
            <g>
              <line
                x1={activeCoordinates.x}
                y1={margin.top}
                x2={activeCoordinates.x}
                y2={margin.top + chartHeight}
                stroke="#EDE4FA"
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.4"
              />
              <line
                x1={margin.left}
                y1={activeCoordinates.y}
                x2={margin.left + chartWidth}
                y2={activeCoordinates.y}
                stroke="#EDE4FA"
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.4"
              />

              <circle
                cx={activeCoordinates.x}
                y={activeCoordinates.y}
                r="5"
                fill="#F99225"
                stroke="#FFFFFF"
                strokeWidth="2"
                filter="url(#d3-curve-dot-glow)"
              />
            </g>
          )}
        </svg>

        {/* Floating D3 Curve Inspector Tooltip */}
        {hoveredIdx !== null && activeCoordinates && (
          <div
            className="absolute pointer-events-none z-10 px-3 py-2 rounded-lg bg-[#140130]/95 border border-[#8A20FF]/50 shadow-2xl backdrop-blur-md text-xs font-mono space-y-1"
            style={{
              left: Math.min(Math.max(10, activeCoordinates.x - 70), width - 160),
              top: Math.max(12, activeCoordinates.y - 85),
            }}
          >
            <div className="flex items-center justify-between gap-3 text-[10px] text-[#B8A9CC]">
              <span>Curve Progress:</span>
              <span className="font-bold text-[#F7F3FF]">{formatPercent(activePoint.tokensSoldPct)}</span>
            </div>
            <div className="font-bold text-[#34D399] text-sm">
              {formatCurrency(activePoint.currentPriceUsd)}
            </div>
            <div className="text-[10px] text-[#7E6D96]">
              Cap: {formatCurrency(activePoint.marketCapUsd)}
            </div>
            <div className="text-[9px] text-[#B8A9CC]/80">
              Reserve: {formatCurrency(activePoint.accumulatedQuoteUsd)}
            </div>
          </div>
        )}
      </div>

      {/* 3. Bottom Architecture Badges & Curve Constraints */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-[#B8A9CC] font-mono gap-2 pt-1">
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded bg-[#100126] border border-[#670CDC]/30 text-[#D76EDD]">
            Model: {curveTypeLabel}
          </span>
          <span>Target: {pool.migrationOptionLabel || 'Meteora DAMM v2'}</span>
          <span>·</span>
          <span>Fee: {((pool.baseFeeBps || 30) / 100).toFixed(2)}%</span>
        </div>

        <div className="flex items-center gap-2 text-[#7E6D96]">
          <span>Meteora Dynamic Bonding Curve Protocol</span>
        </div>
      </div>
    </div>
  );
};
