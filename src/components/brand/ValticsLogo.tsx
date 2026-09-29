import React, { useState } from 'react';

interface ValticsLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showText?: boolean;
  tagline?: boolean;
  glow?: boolean;
}

const sizeMap = {
  xs: 22,
  sm: 28,
  md: 36,
  lg: 46,
  xl: 58,
  '2xl': 72,
};

export const ValticsMark: React.FC<{
  size?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  glow?: boolean;
  withBackground?: boolean;
}> = ({
  size = 'md',
  className = '',
  glow = false,
}) => {
  const dimension = typeof size === 'number' ? size : sizeMap[size];
  const [imgError, setImgError] = useState(false);

  return (
    <div 
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: dimension, height: dimension }}
    >
      {glow && (
        <div 
          className="absolute -inset-1 rounded-xl opacity-60 blur-md pointer-events-none transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: 'radial-gradient(circle, rgba(103, 12, 220, 0.45) 0%, rgba(215, 110, 221, 0.35) 40%, rgba(249, 146, 37, 0.35) 75%, transparent 100%)',
          }}
        />
      )}

      {!imgError ? (
        <img
          src="/valtics-logo.svg"
          alt="VALTICS"
          width={dimension}
          height={dimension}
          onError={() => setImgError(true)}
          className="relative select-none shrink-0 object-contain rounded-lg drop-shadow-[0_2px_10px_rgba(103,12,220,0.35)]"
        />
      ) : (
        /* Standalone Vector Fallback if SVG fails to load */
        <svg
          width={dimension}
          height={dimension}
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative shrink-0 select-none"
        >
          <defs>
            <linearGradient id="fallback-bg" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#09011B" />
              <stop offset="100%" stopColor="#1C0142" />
            </linearGradient>
            <linearGradient id="fallback-left-wing" x1="36" y1="48" x2="105" y2="155" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#D76EDD" />
              <stop offset="40%" stopColor="#670CDC" />
              <stop offset="100%" stopColor="#3B0489" />
            </linearGradient>
            <linearGradient id="fallback-ray-1" x1="92" y1="152" x2="142" y2="52" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#3B0489" />
              <stop offset="40%" stopColor="#670CDC" />
              <stop offset="70%" stopColor="#D76EDD" />
              <stop offset="100%" stopColor="#BA3351" />
            </linearGradient>
            <linearGradient id="fallback-ray-2" x1="108" y1="142" x2="162" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#BA3351" />
              <stop offset="60%" stopColor="#F99225" />
              <stop offset="100%" stopColor="#FFAE52" />
            </linearGradient>
            <linearGradient id="fallback-ray-3" x1="124" y1="128" x2="178" y2="60" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#BA3351" />
              <stop offset="45%" stopColor="#F99225" />
              <stop offset="100%" stopColor="#FFC27A" />
            </linearGradient>
          </defs>
          <rect width="200" height="200" rx="36" fill="url(#fallback-bg)" />
          <path
            d="M32 48 C 45 48, 62 50, 68 66 L 102 142 C 104 148, 100 156, 92 158 C 82 160, 72 153, 67 141 L 34 70 C 31 63, 28 53, 32 48 Z"
            fill="url(#fallback-left-wing)"
          />
          <path
            d="M96 150 L 138 60 C 142 52, 152 50, 158 56 C 163 61, 163 70, 157 78 L 114 162 C 109 168, 98 166, 94 158 C 93 155, 94 152, 96 150 Z"
            fill="url(#fallback-ray-1)"
          />
          <path
            d="M112 136 L 154 54 C 158 46, 168 44, 174 50 C 180 55, 179 65, 174 72 L 132 154 C 127 160, 118 161, 113 154 C 110 149, 109 142, 112 136 Z"
            fill="url(#fallback-ray-2)"
          />
          <path
            d="M130 118 L 166 66 C 170 60, 178 58, 184 64 C 189 69, 189 77, 184 83 L 150 142 C 146 148, 137 148, 133 142 C 129 135, 128 123, 130 118 Z"
            fill="url(#fallback-ray-3)"
          />
        </svg>
      )}
    </div>
  );
};

export const ValticsLogo: React.FC<ValticsLogoProps> = ({
  size = 'md',
  className = '',
  showText = true,
  tagline = false,
  glow = true,
}) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <ValticsMark size={size} glow={glow} />

      {showText && (
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-sm sm:text-base tracking-tight text-white font-sans leading-none flex items-center">
              VALTICS
            </span>
            <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded-md bg-gradient-to-r from-violet-500/20 via-pink-500/20 to-amber-500/20 text-amber-300 border border-amber-500/30 font-bold tracking-wider leading-none">
              DBC
            </span>
          </div>
          {tagline && (
            <span className="text-[10px] text-zinc-400 font-medium tracking-tight mt-0.5">
              Meteora Dynamic Bonding Curves on Solana
            </span>
          )}
        </div>
      )}
    </div>
  );
};
