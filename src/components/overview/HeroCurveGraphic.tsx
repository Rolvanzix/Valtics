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
    <div className="rounded-xl border border-[#670CDC]/30 bg-[#120128] overflow-hidden shadow-xl shadow-[#09011B]/60">
      {/* Top Header */}
      <div className="px-5 py-3.5 border-b border-[#670CDC]/20 bg-[#160136] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#F99225] shadow-xs shadow-[#F99225]/50" />
          <span className="font-semibold text-[#F7F3FF]">Dynamic Bonding Curve</span>
        </div>
        <div className="text-[#B8A9CC] font-mono text-[11px]">
          Target: <span className="text-[#F7F3FF] font-semibold">85 SOL</span>
        </div>
      </div>

      {/* Snapshot metrics */}
      <div className="grid grid-cols-3 divide-x divide-[#670CDC]/20 border-b border-[#670CDC]/20 bg-[#0E0124] px-4 py-3">
        <div>
          <span className="text-[11px] text-[#B8A9CC] font-sans block">Spot Price</span>
          <span className="font-mono text-sm font-semibold text-[#F7F3FF] mt-0.5 block">
            {simulatedPrice.toFixed(4)} SOL
          </span>
        </div>
        <div className="pl-4">
          <span className="text-[11px] text-[#B8A9CC] font-sans block">Curve Progress</span>
          <span className="font-mono text-sm font-semibold text-[#F99225] mt-0.5 block">
            {activeStep.toFixed(0)}%
          </span>
        </div>
        <div className="pl-4">
          <span className="text-[11px] text-[#B8A9CC] font-sans block">Vault Reserve</span>
          <span className="font-mono text-sm font-semibold text-[#F7F3FF] mt-0.5 block">
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
          <defs>
            <linearGradient id="heroCurveAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#670CDC" stopOpacity="0.28" />
              <stop offset="60%" stopColor="#D76EDD" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#670CDC" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="heroCurveLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#670CDC" />
              <stop offset="50%" stopColor="#D76EDD" />
              <stop offset="100%" stopColor="#F99225" />
            </linearGradient>
          </defs>

          {/* Subtle Grid Lines */}
          <line x1={padLeft} y1={padTop + plotH * 0.33} x2={padLeft + plotW} y2={padTop + plotH * 0.33} stroke="#2D066B" strokeDasharray="3 3" strokeWidth="0.8" />
          <line x1={padLeft} y1={padTop + plotH * 0.66} x2={padLeft + plotW} y2={padTop + plotH * 0.66} stroke="#2D066B" strokeDasharray="3 3" strokeWidth="0.8" />

          {/* Area under curve */}
          <path d={areaD} fill="url(#heroCurveAreaGrad)" />

          {/* Curve line */}
          <path d={pathD} fill="none" stroke="url(#heroCurveLineGrad)" strokeWidth="2.5" strokeLinecap="round" />

          {/* Vertical scrub line at active position */}
          <line 
            x1={cursorX} 
            y1={padTop} 
            x2={cursorX} 
            y2={padTop + plotH} 
            stroke="#9572CD" 
            strokeWidth="1" 
            strokeDasharray="2 2" 
          />

          {/* Active Node */}
          <circle cx={cursorX} cy={cursorY} r="5" fill="#F99225" stroke="#FFFFFF" strokeWidth="2" />

          {/* Axis Labels */}
          <text x={padLeft} y={padTop + plotH + 18} fill="#7E6D96" className="font-mono text-[10px]">0%</text>
          <text x={padLeft + plotW * 0.5} y={padTop + plotH + 18} textAnchor="middle" fill="#7E6D96" className="font-mono text-[10px]">50%</text>
          <text x={padLeft + plotW} y={padTop + plotH + 18} textAnchor="end" fill="#7E6D96" className="font-mono text-[10px]">100%</text>
        </svg>
      </div>

      {/* Footer */}
      {onExploreMarkets && (
        <div className="px-5 py-2.5 bg-[#0E0124] border-t border-[#670CDC]/20 flex items-center justify-between text-xs text-[#B8A9CC]">
          <span>Deterministic pricing algorithm</span>
          <button
            type="button"
            onClick={onExploreMarkets}
            className="text-[#F7F3FF] hover:text-[#F99225] transition-colors flex items-center gap-1 font-semibold"
          >
            <span>View markets</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
