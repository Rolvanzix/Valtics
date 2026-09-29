import React from 'react';

interface ValticsAgentAvatarProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  className?: string;
  glow?: boolean;
  active?: boolean;
}

const sizeConfig = {
  xs: { dim: 22, stroke: 1.5 },
  sm: { dim: 30, stroke: 1.5 },
  md: { dim: 40, stroke: 1.8 },
  lg: { dim: 52, stroke: 2 },
  xl: { dim: 76, stroke: 2 },
  hero: { dim: 112, stroke: 2.2 },
};

export const ValticsAgentAvatar: React.FC<ValticsAgentAvatarProps> = ({
  size = 'md',
  className = '',
  glow = true,
  active = true,
}) => {
  const { dim } = sizeConfig[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: dim, height: dim }}
    >
      {/* Ambient Cybernetic Halo */}
      {glow && (
        <div
          className="absolute -inset-1 rounded-2xl opacity-60 blur-md pointer-events-none transition-opacity"
          style={{
            background:
              'radial-gradient(circle, rgba(103, 12, 220, 0.45) 0%, rgba(215, 110, 221, 0.35) 40%, rgba(249, 146, 37, 0.35) 75%, transparent 100%)',
          }}
        />
      )}

      {/* Cybernetic Mascot Illustration */}
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative shrink-0 drop-shadow-[0_4px_16px_rgba(103,12,220,0.4)]"
      >
        <defs>
          {/* Base Matte Techwear Gradient */}
          <linearGradient id="agent-hoodie" x1="20" y1="50" x2="100" y2="115" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1C0142" />
            <stop offset="60%" stopColor="#12012B" />
            <stop offset="100%" stopColor="#09011B" />
          </linearGradient>

          {/* Left Wing Purple Horn */}
          <linearGradient id="agent-purple-horn" x1="20" y1="20" x2="65" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#D76EDD" />
            <stop offset="45%" stopColor="#670CDC" />
            <stop offset="85%" stopColor="#3B0489" />
            <stop offset="100%" stopColor="#1C0142" />
          </linearGradient>

          {/* Right Wing Amber/Coral Horn */}
          <linearGradient id="agent-amber-horn" x1="60" y1="20" x2="105" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFAE52" />
            <stop offset="35%" stopColor="#F99225" />
            <stop offset="70%" stopColor="#BA3351" />
            <stop offset="100%" stopColor="#670CDC" />
          </linearGradient>

          {/* Visor Deep Glass */}
          <linearGradient id="agent-visor" x1="30" y1="45" x2="90" y2="85" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#160136" />
            <stop offset="100%" stopColor="#09011B" />
          </linearGradient>

          {/* Neon Visor Eye Glow */}
          <linearGradient id="agent-eye-glow" x1="0" y1="0" x2="10" y2="10" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F7F3FF" />
            <stop offset="100%" stopColor="#D76EDD" />
          </linearGradient>
        </defs>

        {/* 1. Tech Hoodie Silhouette / Shoulders */}
        <path
          d="M22 104C22 90 32 82 46 80L50 85L70 85L74 80C88 82 98 90 98 104C98 110 94 114 86 114H34C26 114 22 110 22 104Z"
          fill="url(#agent-hoodie)"
          stroke="#27272a"
          strokeWidth="1.5"
        />

        {/* Chest Valtics V emblem */}
        <path
          d="M54 94L60 102L66 94L63.5 94L60 99L56.5 94H54Z"
          fill="#A855F7"
          opacity="0.9"
        />

        {/* 2. Cyber Crest / Horns (Signature Valtics Brand Wings) */}
        {/* Left Horn */}
        <path
          d="M36 46L24 16C28 15 36 17 48 24L58 48L36 46Z"
          fill="url(#agent-purple-horn)"
        />
        {/* Right Horn */}
        <path
          d="M62 48L74 14C85 17 94 22 96 28L84 46L62 48Z"
          fill="url(#agent-amber-horn)"
        />
        {/* Secondary Inner Fin */}
        <path
          d="M74 44L84 26L89 31L80 44H74Z"
          fill="#FDE047"
          opacity="0.9"
        />

        {/* 3. Helmet Head Shell */}
        <ellipse
          cx="60"
          cy="60"
          rx="32"
          ry="27"
          fill="#11131a"
          stroke="#3f3f46"
          strokeWidth="1.8"
        />

        {/* 4. Visor Glass */}
        <path
          d="M34 60C34 50 45 44 60 44C75 44 86 50 86 60C86 70 75 75 60 75C45 75 34 70 34 60Z"
          fill="url(#agent-visor)"
          stroke="#581c87"
          strokeWidth="1.5"
        />

        {/* 5. Expressive Neon Visor Face (Wink + Smile) */}
        {/* Left Eye: Neon circle/pupil */}
        <ellipse cx="49" cy="58" rx="4" ry="4.5" fill="#E879F9" />
        <ellipse cx="49" cy="58" rx="2" ry="2.2" fill="#FFFFFF" />

        {/* Right Eye: Charismatic Winking Arc */}
        <path
          d="M68 59C70 55 74 55 76 59"
          stroke="#FB923C"
          strokeWidth="2.8"
          strokeLinecap="round"
        />

        {/* Friendly Smug Smile */}
        <path
          d="M54 67C57 70 63 70 66 67"
          stroke="#E879F9"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      {/* Online Devnet Active Pulse Dot */}
      {active && (
        <span className="absolute bottom-0 right-0 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-zinc-900" />
        </span>
      )}
    </div>
  );
};
