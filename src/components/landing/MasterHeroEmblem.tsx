import React from 'react';

export const MasterHeroEmblem: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Background radial glow */}
      <div 
        className="absolute w-[480px] h-[480px] sm:w-[580px] sm:h-[580px] rounded-full pointer-events-none blur-3xl opacity-60"
        style={{
          background: 'radial-gradient(circle, rgba(138, 32, 255, 0.35) 0%, rgba(216, 42, 168, 0.22) 40%, rgba(255, 138, 32, 0.18) 70%, transparent 100%)',
        }}
      />

      {/* Planetary Horizon Arc (curved thin glowing line across the bottom of the emblem) */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[140%] max-w-[700px] h-[160px] pointer-events-none overflow-hidden flex justify-center">
        <svg viewBox="0 0 800 200" fill="none" className="w-full h-full">
          <defs>
            <linearGradient id="horizon-glow" x1="0" y1="0" x2="800" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6010F0" stopOpacity="0" />
              <stop offset="25%" stopColor="#8A20FF" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#D82AA8" stopOpacity="0.8" />
              <stop offset="68%" stopColor="#FF8A20" stopOpacity="0.9" />
              <stop offset="85%" stopColor="#8A20FF" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#6010F0" stopOpacity="0" />
            </linearGradient>
            <filter id="arc-blur" x="-20%" y="-50%" width="140%" height="200%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>
          <ellipse cx="400" cy="220" rx="380" ry="140" stroke="url(#horizon-glow)" strokeWidth="3" filter="url(#arc-blur)" />
          <ellipse cx="400" cy="220" rx="380" ry="140" stroke="url(#horizon-glow)" strokeWidth="1.2" opacity="0.95" />
        </svg>
      </div>

      {/* The 3D Luminous Ribbon "V" Emblem */}
      <svg
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 w-full max-w-[360px] sm:max-w-[440px] lg:max-w-[480px] h-auto drop-shadow-[0_10px_45px_rgba(96,16,240,0.45)]"
      >
        <defs>
          {/* Left Wing Gradient (Deep Purple to Electric Violet) */}
          <linearGradient id="m-left-wing" x1="90" y1="120" x2="260" y2="390" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#8A20FF" />
            <stop offset="35%" stopColor="#7914F8" />
            <stop offset="70%" stopColor="#6010F0" />
            <stop offset="100%" stopColor="#3F04A0" />
          </linearGradient>

          {/* Ribbon Fold Bottom Shadow */}
          <linearGradient id="m-fold-shadow" x1="225" y1="300" x2="285" y2="390" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#150228" stopOpacity="0.98" />
            <stop offset="55%" stopColor="#320658" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#660FA0" stopOpacity="0.3" />
          </linearGradient>

          {/* Ray 1 (Inner Wing): Electric Purple to Deep Magenta */}
          <linearGradient id="m-ray-1" x1="230" y1="375" x2="355" y2="130" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6010F0" />
            <stop offset="28%" stopColor="#8A20FF" />
            <stop offset="65%" stopColor="#D82AA8" />
            <stop offset="100%" stopColor="#EB3EBE" />
          </linearGradient>

          {/* Ray 2 (Middle Wing): Magenta to Vivid Orange */}
          <linearGradient id="m-ray-2" x1="270" y1="350" x2="405" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#D82AA8" />
            <stop offset="40%" stopColor="#F5526C" />
            <stop offset="75%" stopColor="#FF8A20" />
            <stop offset="100%" stopColor="#FFA642" />
          </linearGradient>

          {/* Ray 3 (Outer Wing): Radiant Orange to Golden Ember */}
          <linearGradient id="m-ray-3" x1="310" y1="305" x2="445" y2="155" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF8A20" />
            <stop offset="45%" stopColor="#FF9B33" />
            <stop offset="80%" stopColor="#FFB352" />
            <stop offset="100%" stopColor="#FFD182" />
          </linearGradient>

          {/* Surface Gloss Highlight */}
          <linearGradient id="m-gloss" x1="100" y1="120" x2="240" y2="280" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 1. Left descending sweeping ribbon arm */}
        <path
          d="M80 120 C 112 120, 155 125, 170 165 L 255 355 C 260 370, 250 390, 230 395 C 205 400, 180 382, 168 352 L 85 175 C 78 158, 70 132, 80 120 Z"
          fill="url(#m-left-wing)"
        />

        {/* Left gloss rim */}
        <path
          d="M85 125 C 112 125, 148 130, 162 165 L 230 320"
          stroke="url(#m-gloss)"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.65"
        />

        {/* 2. Ribbon bottom loop wrap / fold shadow */}
        <path
          d="M168 352 C 185 390, 230 402, 268 375 C 292 355, 300 320, 280 290 L 245 230 C 240 222, 228 222, 222 235 L 200 285 C 182 315, 175 335, 168 352 Z"
          fill="url(#m-fold-shadow)"
        />

        {/* 3. Ray 1: Inner Ascending Wing (Magenta-Violet) */}
        <path
          d="M240 375 L 345 150 C 355 130, 380 125, 395 140 C 408 152, 408 175, 392 195 L 285 405 C 272 420, 245 415, 235 395 C 232 388, 235 380, 240 375 Z"
          fill="url(#m-ray-1)"
        />

        {/* 4. Ray 2: Middle Ascending Wing (Magenta-Orange) */}
        <path
          d="M280 340 L 385 135 C 395 115, 420 110, 435 125 C 450 138, 448 162, 435 180 L 330 385 C 318 400, 295 402, 282 385 C 275 372, 272 355, 280 340 Z"
          fill="url(#m-ray-2)"
        />

        {/* 5. Ray 3: Outer Ascending Wing (Orange-Gold) */}
        <path
          d="M325 295 L 415 165 C 425 150, 445 145, 460 160 C 472 172, 472 192, 460 208 L 375 355 C 365 370, 342 370, 332 355 C 322 338, 320 308, 325 295 Z"
          fill="url(#m-ray-3)"
        />
      </svg>
    </div>
  );
};
