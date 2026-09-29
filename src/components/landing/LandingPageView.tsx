import React from 'react';
import { LandingNav } from './LandingNav';
import { HeroVisual } from './HeroVisual';
import { AssetToMarketVisual } from './AssetToMarketVisual';
import { InfrastructureSystemDiagram } from './InfrastructureSystemDiagram';
import { ProductPreviewFrame } from './ProductPreviewFrame';
import { LandingFooter } from './LandingFooter';
import { NavigationTab } from '../layout/Header';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { BackgroundGrid } from '../common/BackgroundGrid';

interface LandingPageViewProps {
  onEnterApp: (targetTab?: NavigationTab) => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({ onEnterApp }) => {
  const handleScrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#09011B] text-[#F7F3FF] relative overflow-x-hidden selection:bg-[#670CDC]/30 selection:text-[#F7F3FF]">
      {/* Precision Financial Infrastructure Background */}
      <BackgroundGrid />

      {/* 1. Minimal Pristine Navigation */}
      <LandingNav
        onEnterApp={onEnterApp}
        onNavigateSection={handleScrollToSection}
      />

      <main className="relative z-10">
        {/* ACT I: HERO — MARKETS */}
        <section className="relative pt-32 pb-16 sm:pt-44 sm:pb-24 lg:pt-52 lg:pb-28">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 text-center">
            {/* Minimal Operational Marker */}
            <div className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] font-mono tracking-widest uppercase text-zinc-400 mb-6 sm:mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Autonomous Liquidity Infrastructure on Solana</span>
            </div>

            {/* Single Dominant Syne Headline (Responsive & No Clipping) */}
            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tighter text-white font-display max-w-5xl mx-auto leading-[0.94] mb-6 sm:mb-8 [text-wrap:balance]">
              Markets, reimagined.
            </h1>

            {/* Exact Preferred Supporting Message */}
            <p className="text-base sm:text-lg lg:text-xl text-zinc-400 font-light max-w-lg mx-auto mb-8 sm:mb-12 leading-relaxed [text-wrap:balance]">
              Dynamic market infrastructure for tokenized assets.
            </p>

            {/* Architectural CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16">
              <button
                type="button"
                onClick={() => onEnterApp('overview')}
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 text-xs font-mono tracking-wider uppercase text-zinc-950 bg-white hover:bg-zinc-200 rounded-md transition-all cursor-pointer active:scale-[0.98]"
              >
                <span>Enter Valtics</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-950 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => handleScrollToSection('transformation')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-mono tracking-wider uppercase text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <span>Explore the system</span>
                <ArrowDown className="w-3.5 h-3.5 text-zinc-500" />
              </button>
            </div>

            {/* The Main Hero Living Market Visualization */}
            <HeroVisual />
          </div>
        </section>

        {/* Narrative Flow Axis Divider: MARKETS → ASSETS */}
        <div className="w-full flex flex-col items-center justify-center py-4 select-none">
          <div className="text-[10px] font-mono tracking-widest text-zinc-600 uppercase mb-2">
            MARKETS → ASSETS
          </div>
          <div className="w-[1px] h-16 sm:h-20 bg-gradient-to-b from-white/[0.12] to-transparent" />
        </div>

        {/* ACT II: ASSETS & TRANSFORMATION — From Asset to Market */}
        <AssetToMarketVisual />

        {/* Narrative Flow Axis Divider: RULES → LIQUIDITY */}
        <div className="w-full flex flex-col items-center justify-center py-4 select-none">
          <div className="text-[10px] font-mono tracking-widest text-zinc-600 uppercase mb-2">
            RULES → LIQUIDITY
          </div>
          <div className="w-[1px] h-16 sm:h-20 bg-gradient-to-b from-white/[0.12] to-transparent" />
        </div>

        {/* ACT III: LIQUIDITY & SYSTEM PIPELINE */}
        <InfrastructureSystemDiagram />

        {/* Narrative Flow Axis Divider: LIQUIDITY → VALUE → VALTICS */}
        <div className="w-full flex flex-col items-center justify-center py-4 select-none">
          <div className="text-[10px] font-mono tracking-widest text-zinc-600 uppercase mb-2">
            LIQUIDITY → VALUE → VALTICS
          </div>
          <div className="w-[1px] h-16 sm:h-20 bg-gradient-to-b from-white/[0.12] to-transparent" />
        </div>

        {/* ACT IV: VALUE & FUNCTIONING MARKET SYSTEMS */}
        <ProductPreviewFrame onEnterApp={onEnterApp} />

        {/* ACT V: FINAL STATEMENT & DESTINATION */}
        <section className="py-36 sm:py-48 lg:py-56 relative text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-8 lg:px-12">
            <span className="text-[11px] font-mono tracking-widest uppercase text-emerald-400 block mb-6">
              THE PLATFORM
            </span>

            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tighter text-white font-display mb-6 [text-wrap:balance] leading-[1.02]">
              Build the next generation of markets.
            </h2>

            <p className="text-base sm:text-lg text-zinc-400 font-light max-w-lg mx-auto mb-10 sm:mb-12 leading-relaxed">
              Deploy deterministic bonding curves, link live oracle benchmarks, and launch counterparty-free markets in seconds.
            </p>

            <button
              type="button"
              onClick={() => onEnterApp('overview')}
              className="inline-flex items-center gap-3 px-8 py-3.5 text-xs font-mono tracking-wider uppercase text-zinc-950 bg-white hover:bg-zinc-200 rounded-md transition-all cursor-pointer shadow-xl active:scale-[0.98]"
            >
              <span>Enter Valtics</span>
              <ArrowRight className="w-4 h-4 text-zinc-950" />
            </button>
          </div>
        </section>
      </main>

      {/* ACT VI: Minimal Footer */}
      <LandingFooter
        onEnterApp={onEnterApp}
        onNavigateSection={handleScrollToSection}
      />
    </div>
  );
};
