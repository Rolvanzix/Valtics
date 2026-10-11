import React, { useState } from 'react';
import { ArrowUpRight, Lock, LayoutDashboard, Layers, Sliders, ExternalLink } from 'lucide-react';
import { NavigationTab } from '../layout/Header';
import { OverviewView } from '../overview/OverviewView';
import { MarketScreener } from '../screener/MarketScreener';
import { CurveStudioView } from '../studio/CurveStudioView';

interface ProductPreviewFrameProps {
  onEnterApp: (targetTab?: NavigationTab) => void;
}

export const ProductPreviewFrame: React.FC<ProductPreviewFrameProps> = ({ onEnterApp }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'markets' | 'studio'>('overview');

  const previewTabs: Array<{
    id: 'overview' | 'markets' | 'studio';
    targetNav: NavigationTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    path: string;
  }> = [
    {
      id: 'overview',
      targetNav: 'overview',
      label: 'Command Center',
      icon: LayoutDashboard,
      path: 'app.valtics.fi/overview',
    },
    {
      id: 'markets',
      targetNav: 'markets',
      label: 'Live Screener',
      icon: Layers,
      path: 'app.valtics.fi/markets',
    },
    {
      id: 'studio',
      targetNav: 'studio',
      label: 'Curve Studio',
      icon: Sliders,
      path: 'app.valtics.fi/studio',
    },
  ];

  const currentTabConfig = previewTabs.find((t) => t.id === activeTab) || previewTabs[0];

  return (
    <section id="system" className="py-16 sm:py-24 relative font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        {/* Section Headline */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-12">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-mono font-medium tracking-[0.24em] uppercase text-[#A7A7B8]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE APPLICATION ENVIRONMENT</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#F5F5F7] leading-[1.08]">
              The <span className="valtics-gradient-text">Live Product</span> in Action.
            </h2>
            <p className="text-xs sm:text-sm text-[#A7A7B8] leading-relaxed max-w-xl">
              Interact with the live Valtics product below. Real-time Pyth oracle benchmarks, live bonding curves on Solana devnet, and autonomous AI agent intelligence.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onEnterApp(currentTabConfig.targetNav)}
              className="valtics-button text-xs font-semibold px-5 py-2.5 flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <span>Launch Full App</span>
              <ArrowUpRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Browser Frame Chassis */}
        <div className="rounded-2xl border border-[rgba(138,32,255,0.28)] bg-[#05051a] shadow-[0_20px_80px_rgba(96,16,240,0.18)] overflow-hidden transition-all">
          {/* Top Browser Chrome Bar */}
          <div className="bg-[#080821] px-4 sm:px-6 py-3 border-b border-[rgba(138,32,255,0.2)] flex flex-wrap items-center justify-between gap-3 select-none">
            {/* Window Controls & Address Bar */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Colored Dots */}
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="w-3 h-3 rounded-full bg-[#6010F0]/60" />
                <div className="w-3 h-3 rounded-full bg-[#D82AA8]/60" />
                <div className="w-3 h-3 rounded-full bg-[#FF8A20]/60" />
              </div>

              {/* URL Bar */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#000010] border border-[rgba(138,32,255,0.25)] text-[11px] font-mono text-[#A7A7B8]">
                <Lock className="w-3 h-3 text-[#FF8A20] shrink-0" />
                <span className="truncate max-w-[140px] sm:max-w-none text-[#F5F5F7]">
                  https://{currentTabConfig.path}
                </span>
                <span className="hidden sm:inline text-emerald-400 text-[10px] font-semibold ml-1">
                  ● DEVNET
                </span>
              </div>
            </div>

            {/* View Selector Tabs */}
            <div className="flex items-center gap-1 bg-[#000010] p-1 rounded-xl border border-[rgba(138,32,255,0.2)]">
              {previewTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-gradient-to-r from-[#6010F0]/40 to-[#D82AA8]/30 text-white border border-[rgba(138,32,255,0.45)] font-semibold shadow-xs'
                        : 'text-[#A7A7B8] hover:text-[#F5F5F7]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Expand / Maximize to full App */}
            <button
              type="button"
              onClick={() => onEnterApp(currentTabConfig.targetNav)}
              className="text-xs font-mono text-[#D82AA8] hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Expand</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Interior Live Surface (Renders the Actual Application Component) */}
          <div className="p-3 sm:p-6 lg:p-8 bg-[#000010] min-h-[580px] max-h-[780px] overflow-y-auto no-scrollbar">
            {activeTab === 'overview' && (
              <div className="transform scale-[0.98] sm:scale-100 origin-top transition-transform">
                <OverviewView
                  onSelectTab={(tab) => onEnterApp(tab)}
                  onSelectPool={() => onEnterApp('markets')}
                  onSelectAssetPage={() => onEnterApp('markets')}
                />
              </div>
            )}

            {activeTab === 'markets' && (
              <div className="transform scale-[0.98] sm:scale-100 origin-top transition-transform">
                <MarketScreener
                  onSelectAsset={() => onEnterApp('markets')}
                  onSelectTab={(tab) => onEnterApp(tab)}
                  initialCategory="all"
                />
              </div>
            )}

            {activeTab === 'studio' && (
              <div className="transform scale-[0.98] sm:scale-100 origin-top transition-transform">
                <CurveStudioView
                  onSelectTab={(tab) => onEnterApp(tab)}
                  onApplyToCreation={() => onEnterApp('create')}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
