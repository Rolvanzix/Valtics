import React from 'react';
import {
  LayoutDashboard,
  Layers,
  PlusCircle,
  Sliders,
  Coins,
  Activity,
  FileCheck2,
} from 'lucide-react';
import { NavigationTab } from './Header';

interface MobileBottomNavProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const navItems: {
    id: NavigationTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'markets', label: 'Markets', icon: Layers },
    { id: 'create', label: 'Create', icon: PlusCircle },
    { id: 'my-markets', label: 'Dashboard', icon: Coins },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080c14]/95 backdrop-blur-md border-t border-zinc-800/80 px-2 py-1.5 flex items-center justify-around select-none font-sans">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors min-w-[56px] min-h-[44px] cursor-pointer ${
              isActive
                ? 'text-zinc-100 font-medium'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-zinc-100' : 'text-zinc-500'}`} />
            <span className="text-[11px] tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
