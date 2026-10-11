import React from 'react';
import {
  LayoutDashboard,
  Layers,
  PlusCircle,
  Sliders,
  Coins,
  Activity,
  FileCheck2,
  Sparkles,
  TrendingUp,
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
    { id: 'predictions', label: 'Predictions', icon: TrendingUp },
    { id: 'agent', label: 'Agent', icon: Sparkles },
    { id: 'create', label: 'Create', icon: PlusCircle },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#05051a]/95 backdrop-blur-md border-t border-[rgba(138,32,255,0.18)] px-2 py-1.5 flex items-center justify-around select-none font-sans shadow-2xl">
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
                ? 'text-[#F5F5F7] font-semibold bg-[rgba(138,32,255,0.18)] border border-[rgba(138,32,255,0.4)] shadow-xs'
                : 'text-[#A7A7B8] hover:text-[#F5F5F7]'
            }`}
          >
            <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-[#FF8A20]' : 'text-[#66667A]'}`} />
            <span className="text-[11px] tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
