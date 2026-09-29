import React, { useState } from 'react';
import {
  LayoutDashboard,
  Layers,
  PlusCircle,
  Coins,
  Activity,
  ChevronLeft,
  ChevronRight,
  Compass,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { NavigationTab } from './Header';
import { ValticsLogo } from '../brand/ValticsLogo';
import { PlatformPrimerModal } from '../common/PlatformPrimerModal';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onReturnToLanding?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  onReturnToLanding,
}) => {
  const [primerOpen, setPrimerOpen] = useState(false);

  const navItems: {
    id: NavigationTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'explore-assets', label: 'Screener', icon: Compass },
    { id: 'markets', label: 'Markets', icon: Layers },
    { id: 'agent', label: 'Valtics Agent', icon: Sparkles, badge: 'AI' },
    { id: 'create', label: 'Create', icon: PlusCircle },
    { id: 'my-markets', label: 'Portfolio', icon: Coins },
    { id: 'activity', label: 'Activity', icon: Activity },
  ];

  return (
    <>
      <aside
        className={`hidden lg:flex flex-col justify-between border-r border-[#670CDC]/20 bg-[#0E0124] transition-all duration-200 select-none z-30 shrink-0 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Top Section: Brand & Nav */}
        <div className="flex flex-col">
          {/* Brand Header */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-[#670CDC]/20">
            <div
              onClick={onReturnToLanding || (() => onSelectTab('overview'))}
              title={onReturnToLanding ? 'Return to Valtics Website' : 'Overview'}
              className="cursor-pointer flex items-center overflow-hidden"
            >
              <ValticsLogo size={collapsed ? 'sm' : 'md'} showText={!collapsed} tagline={false} glow={false} />
            </div>
            <button
              type="button"
              onClick={onToggleCollapse}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="p-1 rounded text-[#B8A9CC] hover:text-[#F7F3FF] hover:bg-[#1C0142] transition-colors cursor-pointer"
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Obvious Primary Action */}
          {!collapsed && (
            <div className="p-3">
              <button
                type="button"
                onClick={() => onSelectTab('create')}
                className="w-full py-2 px-3 rounded-lg bg-[#F99225] hover:bg-[#FFA742] text-[#09011B] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-[#F99225]/20"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Create market</span>
              </button>
            </div>
          )}

          {/* Navigation Items */}
          <nav className="px-2 py-1 space-y-0.5">
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
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#3B0489]/70 text-[#F7F3FF] font-semibold border border-[#670CDC]/40 shadow-xs shadow-[#670CDC]/15'
                      : 'text-[#B8A9CC] hover:text-[#F7F3FF] hover:bg-[#1C0142]/60 font-normal'
                  } ${collapsed ? 'justify-center px-2' : ''}`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-[#F99225]' : 'text-[#B8A9CC]'
                    }`}
                  />
                  {!collapsed && (
                    <div className="flex items-center justify-between flex-1 min-w-0">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
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

        {/* Bottom Section: Clean, uncluttered single-line status & guide */}
        <div className="p-3 border-t border-zinc-800/80">
          {!collapsed ? (
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <div className="flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="text-[11px] font-semibold tracking-wide text-zinc-300">
                  DEVNET
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPrimerOpen(true)}
                className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors"
                title="Platform guide"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <span
                className="w-2 h-2 rounded-full bg-amber-400"
                title="Solana Devnet"
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

