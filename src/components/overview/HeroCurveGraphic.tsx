import React, { useState, useEffect } from 'react';
import { ArrowUpRight } from 'lucide-react';

interface HeroCurveGraphicProps {
  onExploreMarkets?: () => void;
  onCreateMarket?: () => void;
}

export const HeroCurveGraphic: React.FC<HeroCurveGraphicProps> = ({
  onExploreMarkets,
}) => {
  const [activeStep, setActiveStep] = useState(48); // % along curve
  const [isHovering, setIsHovering] = useState(false);

  // Subtle auto-tick when not hovering
  useEffect(() => {
    if (isHovering) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => {
        const next = prev + 0.3;
        return next > 85 ? 20 : next;
      });
    }, 120);
    return () => clearInterval(interval);
  }, [isHovering]);

  const startPrice = 0.0012;
  const endPrice = 0.0185;
  const normalized = activeStep / 100;
  const simulatedPrice = startPrice + (endPrice - startPrice) * Math.pow(normalized, 1.6);
  const simulatedReserve = (activeStep * 0.95).toFixed(1);

  // SVG dimensions
  const svgWidth = 480;
  const svgHeight = 200;
  const padLeft = 40;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 30;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const pointsCount = 24;
  const points = Array.from({ length: pointsCount }, (_, i) => {
    const t = i / (pointsCount - 1);
    const x = padLeft + t * plotW;
    const pNorm = Math.pow(t, 1.6);
    const y = padTop + plotH - pNorm * plotH;
    return { x, y, t };
  });

  const pathD = points
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(' ');

  const areaD = `${pathD} L ${padLeft + plotW} ${padTop + plotH} L ${padLeft} ${padTop + plotH} Z`;

  const cursorX = padLeft + normalized * plotW;
  const cursorY = padTop + plotH - Math.pow(normalized, 1.6) * plotH;

  return (
    <div className="rounded-xl border border-zinc-800 bg-[#0b0f17] overflow-hidden">
      {/* Top Header */}
      <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="font-medium text-zinc-200">Dynamic Bonding Curve</span>
        </div>
        <div className="text-zinc-400 font-mono text-[11px]">
          Target: <span className="text-zinc-200 font-medium">85 SOL</span>
        </div>
      </div>

      {/* Snapshot metrics */}
      <div className="grid grid-cols-3 divide-x divide-zinc-800/80 border-b border-zinc-800 bg-[#090d14] px-4 py-3">
        <div>
          <span className="text-[11px] text-zinc-500 font-sans block">Spot Price</span>
          <span className="font-mono text-sm font-semibold text-zinc-100 mt-0.5 block">
            {simulatedPrice.toFixed(4)} SOL
          </span>
        </div>
        <div className="pl-4">
          <span className="text-[11px] text-zinc-500 font-sans block">Curve Progress</span>
          <span className="font-mono text-sm font-semibold text-zinc-100 mt-0.5 block">
            {activeStep.toFixed(0)}%
          </span>
        </div>
        <div className="pl-4">
          <span className="text-[11px] text-zinc-500 font-sans block">Vault Reserve</span>
          <span className="font-mono text-sm font-semibold text-zinc-100 mt-0.5 block">
            {simulatedReserve} SOL
          </span>
        </div>
      </div>

      {/* Interactive SVG Chart */}
      <div 
        className="p-4 cursor-crosshair relative select-none"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const relX = e.clientX - rect.left - padLeft;
          const pct = Math.max(5, Math.min(95, (relX / plotW) * 100));
          setActiveStep(pct);
        }}
      >
        <svg 
          viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
          className="w-full h-40 sm:h-44 overflow-visible"
        >
          {/* Subtle Grid Lines */}
          <line x1={padLeft} y1={padTop + plotH * 0.33} x2={padLeft + plotW} y2={padTop + plotH * 0.33} stroke="#1f2937" strokeDasharray="3 3" strokeWidth="0.8" />
          <line x1={padLeft} y1={padTop + plotH * 0.66} x2={padLeft + plotW} y2={padTop + plotH * 0.66} stroke="#1f2937" strokeDasharray="3 3" strokeWidth="0.8" />

          {/* Area under curve */}
          <path d={areaD} fill="#10b981" fillOpacity="0.08" />

          {/* Curve line */}
          <path d={pathD} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />

          {/* Vertical scrub line at active position */}
          <line 
            x1={cursorX} 
            y1={padTop} 
            x2={cursorX} 
            y2={padTop + plotH} 
            stroke="#6b7280" 
            strokeWidth="1" 
            strokeDasharray="2 2" 
          />

          {/* Active Node */}
          <circle cx={cursorX} cy={cursorY} r="4.5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />

          {/* Axis Labels */}
          <text x={padLeft} y={padTop + plotH + 18} fill="#6b7280" className="font-mono text-[10px]">0%</text>
          <text x={padLeft + plotW * 0.5} y={padTop + plotH + 18} textAnchor="middle" fill="#6b7280" className="font-mono text-[10px]">50%</text>
          <text x={padLeft + plotW} y={padTop + plotH + 18} textAnchor="end" fill="#6b7280" className="font-mono text-[10px]">100%</text>
        </svg>
      </div>

      {/* Footer */}
      {onExploreMarkets && (
        <div className="px-5 py-2.5 bg-[#090d14] border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <span>Deterministic pricing algorithm</span>
          <button
            type="button"
            onClick={onExploreMarkets}
            className="text-zinc-200 hover:text-white transition-colors flex items-center gap-1 font-medium"
          >
            <span>View markets</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
