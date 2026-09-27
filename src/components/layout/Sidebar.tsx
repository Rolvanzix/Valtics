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
  const { isMainnet } = useNetwork();
  const [primerOpen, setPrimerOpen] = useState(false);

  const navItems: {
    id: NavigationTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'explore-assets', label: 'Screener', icon: Compass },
    { id: 'markets', label: 'Markets', icon: Layers },
    { id: 'create', label: 'Create', icon: PlusCircle },
    { id: 'my-markets', label: 'Portfolio', icon: Coins },
    { id: 'activity', label: 'Activity', icon: Activity },
  ];

  return (
    <>
      <aside
        className={`hidden lg:flex flex-col justify-between border-r border-zinc-800/80 bg-[#090c13] transition-all duration-200 select-none z-30 shrink-0 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Top Section: Brand & Nav */}
        <div className="flex flex-col">
          {/* Brand Header */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-zinc-800/80">
            <div
              onClick={() => onSelectTab('overview')}
              className="cursor-pointer flex items-center overflow-hidden"
            >
              <ValticsLogo size={collapsed ? 'sm' : 'md'} showText={!collapsed} tagline={false} glow={false} />
            </div>
            <button
              type="button"
              onClick={onToggleCollapse}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors cursor-pointer"
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
                className="w-full py-2 px-3 rounded-lg bg-white hover:bg-zinc-100 text-zinc-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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
                      ? 'bg-zinc-800/90 text-white font-medium'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 font-normal'
                  } ${collapsed ? 'justify-center px-2' : ''}`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-zinc-400'
                    }`}
                  />
                  {!collapsed && (
                    <span className="truncate">{item.label}</span>
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
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isMainnet
                      ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                      : 'bg-amber-400'
                  }`}
                />
                <span
                  className={`text-[11px] font-semibold tracking-wide ${
                    isMainnet ? 'text-emerald-300' : 'text-zinc-300'
                  }`}
                >
                  {isMainnet ? 'MAINNET' : 'TESTNET'}
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
                className={`w-2 h-2 rounded-full ${
                  isMainnet
                    ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                    : 'bg-amber-400'
                }`}
                title={isMainnet ? 'Solana Mainnet (Production)' : 'Solana Testnet (Development)'}
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

