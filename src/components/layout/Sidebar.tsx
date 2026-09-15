import React, { useState } from 'react';
import {
  LayoutDashboard,
  Layers,
  PlusCircle,
  Sliders,
  Coins,
  Activity,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Zap,
  HelpCircle,
} from 'lucide-react';
import { NavigationTab } from './Header';
import { ValticsLogo } from '../brand/ValticsLogo';
import { useNetwork } from '../../context/NetworkContext';
import { PlatformPrimerModal } from '../common/PlatformPrimerModal';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
}) => {
  const { currentNetwork, tps, slotHeight } = useNetwork();
  const [primerOpen, setPrimerOpen] = useState(false);

  const navItems: {
    id: NavigationTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'markets', label: 'Markets', icon: Layers, badge: 'Live' },
    { id: 'create', label: 'Create Market', icon: PlusCircle },
    { id: 'studio', label: 'Curve Studio', icon: Sliders },
    { id: 'my-markets', label: 'My Markets', icon: Coins },
    { id: 'activity', label: 'Activity & Audit', icon: Activity },
  ];

  return (
    <>
      <aside
        className={`hidden lg:flex flex-col justify-between border-r border-zinc-800/90 bg-[#07090e] transition-all duration-200 select-none z-30 shrink-0 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Top Section: Brand & Nav */}
        <div className="flex flex-col">
          {/* Brand Header */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-zinc-800/80">
            <div
              onClick={() => onSelectTab('overview')}
              className="cursor-pointer flex items-center overflow-hidden"
            >
              <ValticsLogo size={collapsed ? 'sm' : 'md'} showText={!collapsed} tagline={false} glow={true} />
            </div>
            <button
              type="button"
              onClick={onToggleCollapse}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors cursor-pointer"
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Quick Launch CTA (Signature Valtics Brand Gradient) */}
          {!collapsed && (
            <div className="p-3 border-b border-zinc-800/60">
              <button
                type="button"
                onClick={() => onSelectTab('create')}
                className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-[#8b5cf6] via-[#ec4899] to-[#f59e0b] hover:opacity-95 active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-violet-900/25 border border-white/10 transition-all cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Deploy DBC Market</span>
              </button>
            </div>
          )}

          {/* Navigation Items */}
          <nav className="p-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  id={`sidebar-nav-${item.id}`}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-all relative cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-950/40 via-[#0e1320] to-amber-950/20 text-white border border-violet-500/35 shadow-xs font-bold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 font-medium'
                  } ${collapsed ? 'justify-center px-2' : ''}`}
                >
                  {/* Active Indicator Bar */}
                  {isActive && (
                    <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-gradient-to-b from-violet-400 via-pink-400 to-amber-400" />
                  )}

                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-amber-400' : 'text-zinc-500 group-hover:text-zinc-300'
                    }`}
                  />
                  {!collapsed && (
                    <div className="flex-1 flex items-center justify-between min-w-0">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full uppercase ${
                            isActive
                              ? 'bg-amber-500/20 text-amber-300 font-semibold'
                              : 'bg-zinc-800 text-zinc-500'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Network Status & Documentation & Primer */}
        <div className="p-3 border-t border-zinc-800/80 space-y-2 bg-[#05070d]">
          {!collapsed ? (
            <>
              {/* How it works primer trigger */}
              <button
                type="button"
                onClick={() => setPrimerOpen(true)}
                className="w-full p-2 rounded-lg bg-violet-950/20 hover:bg-violet-950/40 border border-violet-800/30 text-[11px] text-violet-300 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5 font-medium">
                  <HelpCircle className="w-3.5 h-3.5 text-violet-400" />
                  <span>Platform Guide</span>
                </span>
                <span className="text-[10px] text-zinc-400">3-Step</span>
              </button>

              {/* Live Network Telemetry */}
              <div className="p-2.5 rounded-lg bg-[#0c101a] border border-zinc-800 text-[11px] space-y-1.5 font-mono-nums">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{currentNetwork?.name || 'Solana Network'}</span>
                  </span>
                  <span className="text-emerald-400 font-semibold">{tps || 2450} TPS</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-zinc-400">
                  <span>Slot Height</span>
                  <span>#{slotHeight ? slotHeight.toLocaleString() : '326,419'}</span>
                </div>
              </div>

              {/* Protocol Badge */}
              <div className="flex items-center justify-between text-[10px] text-zinc-400 px-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  <span>Meteora DBC v1.5</span>
                </span>
                <a
                  href="https://docs.meteora.ag"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-zinc-300 flex items-center gap-0.5"
                >
                  <span>Docs</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setPrimerOpen(true)}
                title="Platform Guide"
                className="p-1.5 rounded-md text-violet-400 hover:bg-violet-950/40 transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              <span
                className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"
                title={`${currentNetwork?.name || 'Solana'} (${tps || 2450} TPS)`}
              />
            </div>
          )}
        </div>
      </aside>

      {/* Primer modal */}
      <PlatformPrimerModal
        isOpen={primerOpen}
        onClose={() => setPrimerOpen(false)}
        onNavigate={onSelectTab}
      />
    </>
  );
};
