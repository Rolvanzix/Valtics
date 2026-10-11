import React from 'react';
import { Layers, Sparkles, TrendingUp, Plus, ArrowRight } from 'lucide-react';
import { NavigationTab } from '../layout/Header';

interface MasterFeatureTrioProps {
  onEnterApp: (targetTab?: NavigationTab) => void;
}

export const MasterFeatureTrio: React.FC<MasterFeatureTrioProps> = ({ onEnterApp }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch select-none">
      {/* ---------------------------------------------------- */}
      {/* CARD 1: PROGRAMMABLE MARKETS                        */}
      {/* ---------------------------------------------------- */}
      <div 
        onClick={() => onEnterApp('markets')}
        className="valtics-card p-6 sm:p-7 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
      >
        <div className="space-y-3">
          {/* Top Icon */}
          <div className="w-10 h-10 rounded-xl bg-[rgba(138,32,255,0.12)] border border-[rgba(138,32,255,0.3)] flex items-center justify-center text-[#8A20FF]">
            <Layers className="w-5 h-5" />
          </div>

          <h3 className="text-xl font-bold text-[#F5F5F7] tracking-tight group-hover:text-white transition-colors">
            Programmable Markets
          </h3>

          <p className="text-sm text-[#A7A7B8] leading-relaxed">
            Create and trade tokenized assets with customizable market logic.
          </p>
        </div>

        {/* Visual UI Element (70% Visual) */}
        <div className="mt-8 relative pt-2">
          {/* Ambient Glow */}
          <div className="absolute inset-0 bg-[#6010F0]/10 blur-xl rounded-full pointer-events-none" />

          {/* Floating UI Card Preview */}
          <div className="relative bg-[#05051a]/95 border border-[rgba(138,32,255,0.25)] rounded-2xl p-4 shadow-2xl transition-transform duration-300 group-hover:-translate-y-1">
            {/* Header in card */}
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(138,32,255,0.15)] mb-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#F5F5F7]">
                <span className="w-3.5 h-3.5 rounded-full bg-[#8A20FF] flex items-center justify-center text-[9px] text-white">
                  ✦
                </span>
                <span>Create Market</span>
              </div>
              <span className="text-[10px] font-mono text-[#8A20FF] px-2 py-0.5 rounded-full bg-[#8A20FF]/10 border border-[#8A20FF]/25">
                DBC Core
              </span>
            </div>

            {/* Glowing Bonding Curve SVG */}
            <div className="h-24 w-full relative">
              <svg viewBox="0 0 280 90" fill="none" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="curve-glow" x1="0" y1="0" x2="280" y2="0" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#6010F0" />
                    <stop offset="50%" stopColor="#8A20FF" />
                    <stop offset="100%" stopColor="#D82AA8" />
                  </linearGradient>
                  <linearGradient id="curve-fill" x1="0" y1="0" x2="0" y2="90" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#8A20FF" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#6010F0" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Shaded Area Under Curve */}
                <path
                  d="M 10 75 Q 70 70 120 55 T 220 28 T 270 10 L 270 90 L 10 90 Z"
                  fill="url(#curve-fill)"
                />

                {/* Luminous Curve Line */}
                <path
                  d="M 10 75 Q 70 70 120 55 T 220 28 T 270 10"
                  stroke="url(#curve-glow)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Target Pin Point */}
                <circle cx="270" cy="10" r="4.5" fill="#D82AA8" className="animate-pulse" />
                <circle cx="270" cy="10" r="8" stroke="#D82AA8" strokeWidth="1.5" opacity="0.6" />
              </svg>
            </div>

            {/* Floating Action Elements */}
            <div className="flex items-center justify-between pt-2">
              <div className="w-7 h-7 rounded-full bg-[#8A20FF] flex items-center justify-center text-white shadow-md shadow-[#8A20FF]/40">
                <Plus className="w-4 h-4" />
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#080821] border border-[rgba(138,32,255,0.3)] text-xs font-mono text-[#F5F5F7]">
                <span className="w-4 h-4 rounded-full bg-[#6010F0] text-white flex items-center justify-center text-[10px] font-bold">
                  T
                </span>
                <span>Tokenized SPL</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* CARD 2: AI AGENTS                                   */}
      {/* ---------------------------------------------------- */}
      <div 
        onClick={() => onEnterApp('agent')}
        className="valtics-card p-6 sm:p-7 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
      >
        <div className="space-y-3">
          {/* Top Icon */}
          <div className="w-10 h-10 rounded-xl bg-[rgba(216,42,168,0.12)] border border-[rgba(216,42,168,0.3)] flex items-center justify-center text-[#D82AA8]">
            <Sparkles className="w-5 h-5" />
          </div>

          <h3 className="text-xl font-bold text-[#F5F5F7] tracking-tight group-hover:text-white transition-colors">
            AI Agents
          </h3>

          <p className="text-sm text-[#A7A7B8] leading-relaxed">
            Automate strategies, analyze data, and act in real time.
          </p>
        </div>

        {/* Visual UI Element (70% Visual) */}
        <div className="mt-8 relative pt-2 flex items-center justify-center">
          {/* Ambient Glow */}
          <div className="absolute inset-0 bg-[#D82AA8]/12 blur-xl rounded-full pointer-events-none" />

          {/* Interactive Agent Illustration Container */}
          <div className="relative w-full bg-[#05051a]/95 border border-[rgba(138,32,255,0.25)] rounded-2xl p-4 shadow-2xl transition-transform duration-300 group-hover:-translate-y-1 flex flex-col items-center">
            {/* Robot Head Graphic */}
            <div className="relative my-2">
              <svg width="110" height="90" viewBox="0 0 110 90" fill="none" className="overflow-visible">
                <defs>
                  <linearGradient id="bot-body" x1="20" y1="10" x2="90" y2="80" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#4A0BA8" />
                    <stop offset="50%" stopColor="#2E046B" />
                    <stop offset="100%" stopColor="#12012E" />
                  </linearGradient>
                  <linearGradient id="bot-face" x1="30" y1="25" x2="80" y2="70" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#0B011E" />
                    <stop offset="100%" stopColor="#000008" />
                  </linearGradient>
                  <linearGradient id="bot-glow" x1="0" y1="0" x2="110" y2="90" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#8A20FF" />
                    <stop offset="100%" stopColor="#D82AA8" />
                  </linearGradient>
                </defs>

                {/* Headset arc */}
                <path d="M 22 45 C 22 20, 88 20, 88 45" stroke="#8A20FF" strokeWidth="4" strokeLinecap="round" />
                {/* Left earpiece */}
                <rect x="15" y="38" width="10" height="20" rx="4" fill="#D82AA8" />
                {/* Right earpiece */}
                <rect x="85" y="38" width="10" height="20" rx="4" fill="#D82AA8" />

                {/* Head shape */}
                <rect x="25" y="22" width="60" height="50" rx="16" fill="url(#bot-body)" stroke="#8A20FF" strokeWidth="1.5" />
                {/* Visor face */}
                <rect x="32" y="30" width="46" height="34" rx="10" fill="url(#bot-face)" />

                {/* Glowing Blue Eyes */}
                <ellipse cx="45" cy="47" rx="3.5" ry="5.5" fill="#50A2FF" className="animate-pulse" />
                <ellipse cx="65" cy="47" rx="3.5" ry="5.5" fill="#50A2FF" className="animate-pulse" />

                {/* Antenna */}
                <line x1="55" y1="22" x2="55" y2="10" stroke="#8A20FF" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="55" cy="8" r="3" fill="#D82AA8" />
              </svg>

              {/* Floating Mini Chart Card */}
              <div className="absolute -left-3 top-4 bg-[#080821] border border-[rgba(138,32,255,0.3)] rounded-lg p-1.5 shadow-lg">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-3 bg-[#8A20FF] rounded-xs" />
                  <div className="w-1.5 h-5 bg-[#D82AA8] rounded-xs" />
                  <div className="w-1.5 h-2 bg-[#6010F0] rounded-xs" />
                </div>
              </div>

              {/* Floating Star Badge */}
              <div className="absolute -right-3 bottom-1 bg-[#080821] border border-[rgba(216,42,168,0.4)] rounded-lg p-1.5 text-[#D82AA8] shadow-lg">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Bottom Status bar */}
            <div className="w-full pt-2 flex items-center justify-between border-t border-[rgba(138,32,255,0.15)] text-[11px] font-mono">
              <span className="text-[#A7A7B8]">Autonomous Strategy</span>
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* CARD 3: PREDICTION MARKETS                          */}
      {/* ---------------------------------------------------- */}
      <div 
        onClick={() => onEnterApp('predictions')}
        className="valtics-card p-6 sm:p-7 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
      >
        <div className="space-y-3">
          {/* Top Icon */}
          <div className="w-10 h-10 rounded-xl bg-[rgba(255,138,32,0.12)] border border-[rgba(255,138,32,0.3)] flex items-center justify-center text-[#FF8A20]">
            <TrendingUp className="w-5 h-5" />
          </div>

          <h3 className="text-xl font-bold text-[#F5F5F7] tracking-tight group-hover:text-white transition-colors">
            Prediction Markets
          </h3>

          <p className="text-sm text-[#A7A7B8] leading-relaxed">
            Bet on what's next. Turn your insights into opportunity.
          </p>
        </div>

        {/* Visual UI Element (70% Visual) */}
        <div className="mt-8 relative pt-2">
          {/* Ambient Glow */}
          <div className="absolute inset-0 bg-[#FF8A20]/10 blur-xl rounded-full pointer-events-none" />

          {/* Floating Prediction Card Preview */}
          <div className="relative bg-[#05051a]/95 border border-[rgba(138,32,255,0.25)] rounded-2xl p-4 shadow-2xl transition-transform duration-300 group-hover:-translate-y-1">
            {/* Question */}
            <h4 className="text-xs font-semibold text-[#F5F5F7] line-clamp-1 mb-2">
              Will BTC hit $100k in 2025?
            </h4>

            {/* Glowing Prediction Chart */}
            <div className="h-16 w-full relative mb-3">
              <svg viewBox="0 0 240 60" fill="none" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="pred-glow" x1="0" y1="0" x2="240" y2="0" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#D82AA8" />
                    <stop offset="60%" stopColor="#FF8A20" />
                    <stop offset="100%" stopColor="#FFA642" />
                  </linearGradient>
                  <linearGradient id="pred-fill" x1="0" y1="0" x2="0" y2="60" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FF8A20" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#D82AA8" stopOpacity="0" />
                  </linearGradient>
                </defs>

                <path
                  d="M 5 50 Q 50 45 90 35 T 160 20 T 235 8 L 235 60 L 5 60 Z"
                  fill="url(#pred-fill)"
                />

                <path
                  d="M 5 50 Q 50 45 90 35 T 160 20 T 235 8"
                  stroke="url(#pred-glow)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                <circle cx="90" cy="35" r="3" fill="#D82AA8" />
                <circle cx="160" cy="20" r="3" fill="#FF8A20" />
                <circle cx="235" cy="8" r="4" fill="#FFA642" className="animate-pulse" />
              </svg>
            </div>

            {/* YES / NO Outcome Buttons (from screenshot) */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-[#6010F0] text-white py-1.5 px-3 flex items-center justify-between text-xs font-semibold shadow-xs">
                <span>Yes</span>
                <span className="font-mono">68%</span>
              </div>

              <div className="rounded-lg bg-[#080821] border border-white/10 text-[#A7A7B8] py-1.5 px-3 flex items-center justify-between text-xs font-medium">
                <span>No</span>
                <span className="font-mono">32%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
