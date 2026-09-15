import React from 'react';

interface ValticsLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showText?: boolean;
  tagline?: boolean;
  glow?: boolean;
}

const sizeMap = {
  xs: 20,
  sm: 26,
  md: 34,
  lg: 44,
  xl: 56,
  '2xl': 72,
};

export const ValticsMark: React.FC<{ size?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'; className?: string; glow?: boolean }> = ({
  size = 'md',
  className = '',
  glow = false,
}) => {
  const dimension = typeof size === 'number' ? size : sizeMap[size];

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      {glow && (
        <div 
          className="absolute -inset-1.5 rounded-full opacity-60 blur-md pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, rgba(249, 115, 22, 0.3) 60%, transparent 100%)',
          }}
        />
      )}
      <svg
        width={dimension}
        height={dimension}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative shrink-0"
      >
        <defs>
          {/* Main Left Wing Ribbon: Electric Violet to Deep Indigo */}
          <linearGradient id="valtics-left-wing" x1="40" y1="45" x2="105" y2="160" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="35%" stopColor="#8B5CF6" />
            <stop offset="75%" stopColor="#6D28D9" />
            <stop offset="100%" stopColor="#4C1D95" />
          </linearGradient>

          {/* Under-fold 3D Shadow for ribbon bend */}
          <linearGradient id="valtics-fold-shadow" x1="95" y1="120" x2="115" y2="155" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E0B36" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#581C87" stopOpacity="0.4" />
          </linearGradient>

          {/* Ray 1: Inner Ascending Wing (Violet-Magenta to Coral) */}
          <linearGradient id="valtics-ray-1" x1="95" y1="150" x2="140" y2="50" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="30%" stopColor="#A855F7" />
            <stop offset="65%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#FB923C" />
          </linearGradient>

          {/* Ray 2: Middle Ascending Wing (Magenta-Rose to Blazing Orange) */}
          <linearGradient id="valtics-ray-2" x1="110" y1="150" x2="160" y2="50" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#BE185D" />
            <stop offset="35%" stopColor="#E11D48" />
            <stop offset="70%" stopColor="#F97316" />
            <stop offset="100%" stopColor="#FBBF24" />
          </linearGradient>

          {/* Ray 3: Outer Ascending Wing (Warm Coral to Golden Sunlight) */}
          <linearGradient id="valtics-ray-3" x1="120" y1="150" x2="175" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#EA580C" />
            <stop offset="40%" stopColor="#F97316" />
            <stop offset="80%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#FDE047" />
          </linearGradient>
        </defs>

        {/* 1. Left descending sweeping ribbon arm */}
        <path
          d="M32 48 C 45 48, 62 50, 68 66 L 102 142 C 104 148, 100 156, 92 158 C 82 160, 72 153, 67 141 L 34 70 C 31 63, 28 53, 32 48 Z"
          fill="url(#valtics-left-wing)"
        />

        {/* 2. Ribbon bottom loop wrap / fold shadow */}
        <path
          d="M67 141 C 74 156, 92 161, 107 150 C 117 142, 120 128, 112 116 L 98 92 C 96 89, 91 89, 89 94 L 80 114 C 73 126, 70 134, 67 141 Z"
          fill="url(#valtics-fold-shadow)"
        />

        {/* 3. Ray 1: Inner Ascending Wing (Slanted bar with rounded top) */}
        <path
          d="M96 150 L 138 60 C 142 52, 152 50, 158 56 C 163 61, 163 70, 157 78 L 114 162 C 109 168, 98 166, 94 158 C 93 155, 94 152, 96 150 Z"
          fill="url(#valtics-ray-1)"
        />

        {/* 4. Ray 2: Middle Ascending Wing */}
        <path
          d="M112 136 L 154 54 C 158 46, 168 44, 174 50 C 180 55, 179 65, 174 72 L 132 154 C 127 160, 118 161, 113 154 C 110 149, 109 142, 112 136 Z"
          fill="url(#valtics-ray-2)"
        />

        {/* 5. Ray 3: Outer Ascending Wing */}
        <path
          d="M130 118 L 166 66 C 170 60, 178 58, 184 64 C 189 69, 189 77, 184 83 L 150 142 C 146 148, 137 148, 133 142 C 129 135, 128 123, 130 118 Z"
          fill="url(#valtics-ray-3)"
        />
      </svg>
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
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <ValticsMark size={size} glow={glow} />

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base tracking-tight text-white font-sans leading-none flex items-center">
              VALTICS
            </span>
            <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded-full bg-gradient-to-r from-violet-500/20 via-pink-500/20 to-amber-500/20 text-amber-300 border border-amber-500/30 font-bold tracking-wider">
              DBC
            </span>
          </div>
          {tagline && (
            <span className="text-[10px] text-zinc-400 font-medium tracking-tight mt-1">
              Meteora Dynamic Bonding Curves on Solana
            </span>
          )}
        </div>
      )}
    </div>
  );
};
