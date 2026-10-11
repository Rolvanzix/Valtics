import React from 'react';
import { LandingNav } from './LandingNav';
import { MasterHeroEmblem } from './MasterHeroEmblem';
import { MasterFeatureTrio } from './MasterFeatureTrio';
import { ProductPreviewFrame } from './ProductPreviewFrame';
import { NavigationTab } from '../layout/Header';
import { ArrowRight, Layers, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';
import { ValticsLogo } from '../brand/ValticsLogo';

interface LandingPageViewProps {
  onEnterApp: (targetTab?: NavigationTab) => void;
  onOpenWalletModal?: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({ 
  onEnterApp,
  onOpenWalletModal 
}) => {
  const handleScrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#000010] text-[#F5F5F7] relative overflow-x-hidden selection:bg-[#8A20FF]/30 selection:text-white font-sans">
      {/* 1. Master Top Navigation */}
      <LandingNav
        onEnterApp={onEnterApp}
        onNavigateSection={handleScrollToSection}
        onOpenWalletModal={onOpenWalletModal}
      />

      <main className="relative z-10">
        {/* ======================================================== */}
        {/* HERO SECTION — EXACT MASTER REFERENCE SCREENSHOT        */}
        {/* ======================================================== */}
        <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-20 lg:pt-44 lg:pb-24">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Left Column: Eyebrow + Huge Heading + Paragraph + Button */}
              <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-left">
                {/* Eyebrow */}
                <div className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-mono font-medium tracking-[0.24em] uppercase text-[#A7A7B8]">
                  <span>TOKENIZED ASSETS</span>
                  <span className="text-[#6010F0]">×</span>
                  <span>AI AGENTS</span>
                  <span className="text-[#D82AA8]">×</span>
                  <span>PREDICTION MARKETS</span>
                </div>

                {/* Main Heading: "Markets Reimagined." */}
                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-[#F5F5F7] leading-[1.02] font-sans">
                  Markets <br className="hidden sm:inline" />
                  <span className="valtics-gradient-text">Reimagined.</span>
                </h1>

                {/* Subtitle / Description */}
                <p className="text-base sm:text-lg text-[#A7A7B8] max-w-[500px] leading-relaxed font-normal">
                  Programmable markets for tokenized assets, powered by AI agents and prediction markets.
                </p>

                {/* CTA Button: "Get Started →" */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onEnterApp('overview')}
                    className="valtics-button text-sm sm:text-base font-semibold px-8 py-3.5"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              {/* Right Column: Luminous 3D Ribbon "V" Emblem over Horizon Arc */}
              <div className="lg:col-span-5 flex justify-center items-center">
                <MasterHeroEmblem className="w-full" />
              </div>
            </div>

            {/* ======================================================== */}
            {/* THREE MASTER FEATURE CARDS TRIO                         */}
            {/* Programmable Markets | AI Agents | Prediction Markets    */}
            {/* ======================================================== */}
            <div className="mt-16 sm:mt-24 lg:mt-32">
              <MasterFeatureTrio onEnterApp={onEnterApp} />
            </div>

            {/* ======================================================== */}
            {/* SUBTLE BRAND DIVIDER FROM SCREENSHOT                    */}
            {/* "BUILT FOR A MORE OPEN FINANCIAL FUTURE"                 */}
            {/* ======================================================== */}
            <div className="mt-24 sm:mt-32 mb-12 flex items-center justify-center gap-4">
              <div className="h-[1px] flex-1 max-w-[200px] sm:max-w-[320px] bg-white/[0.07]" />
              <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.28em] text-[#66667A] uppercase text-center whitespace-nowrap">
                BUILT FOR A MORE OPEN FINANCIAL FUTURE
              </span>
              <div className="h-[1px] flex-1 max-w-[200px] sm:max-w-[320px] bg-white/[0.07]" />
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* INTERACTIVE APP PREVIEW (Full Stack Showcase)           */}
        {/* ======================================================== */}
        <section id="system" className="relative py-12">
          <ProductPreviewFrame onEnterApp={onEnterApp} />
        </section>

        {/* ======================================================== */}
        {/* BOTTOM CALL TO ACTION                                    */}
        {/* ======================================================== */}
        <section className="py-24 sm:py-32 relative text-center">
          <div className="max-w-4xl mx-auto px-6 sm:px-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#F5F5F7] mb-4">
              Build and trade on the <span className="valtics-gradient-text">next generation</span> of markets.
            </h2>
            <p className="text-sm sm:text-base text-[#A7A7B8] max-w-lg mx-auto mb-8 leading-relaxed">
              Explore live tokenized assets, run AI agent workflows, and discover Solana prediction markets.
            </p>
            <button
              type="button"
              onClick={() => onEnterApp('overview')}
              className="valtics-button px-8 py-3.5 text-sm font-semibold"
            >
              <span>Launch Valtics</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[rgba(138,32,255,0.18)] bg-[#000008] py-8 text-center text-xs font-mono text-[#66667A]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <ValticsLogo size="sm" showText={true} />
          <span>© 2026 VALTICS. Markets Reimagined. Solana Devnet.</span>
        </div>
      </footer>
    </div>
  );
};
