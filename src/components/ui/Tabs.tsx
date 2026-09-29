import React, { ReactNode } from 'react';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  badge?: string | number;
  icon?: ReactNode;
}

export interface TabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (tabId: T) => void;
  variant?: 'underline' | 'pill';
  className?: string;
}

export function Tabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  className = '',
}: TabsProps<T>) {
  if (variant === 'pill') {
    return (
      <div className={`flex items-center gap-1.5 p-1 rounded-lg bg-[#140130] border border-[#670CDC]/25 ${className}`}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#3B0489] text-[#F7F3FF] shadow-xs border border-[#670CDC]/50 font-semibold'
                  : 'text-[#B8A9CC] hover:text-[#F7F3FF] hover:bg-[#1C0142]/60'
              }`}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-[#F99225]/20 text-[#F99225]' : 'bg-[#1C0142] text-[#B8A9CC]'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-6 border-b border-[#670CDC]/20 overflow-x-auto ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`group relative flex items-center gap-2 pb-3 pt-1 text-xs font-medium transition-colors whitespace-nowrap ${
              isActive ? 'text-[#F7F3FF] font-semibold' : 'text-[#B8A9CC] hover:text-[#F7F3FF]'
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-[#3B0489] text-[#F99225] border border-[#F99225]/30' : 'bg-[#1C0142] text-[#B8A9CC]'
                }`}
              >
                {tab.badge}
              </span>
            )}
            {/* Active underline indicator */}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#670CDC] via-[#D76EDD] to-[#F99225] rounded-t-sm" />
            )}
          </button>
        );
      })}
    </div>
  );
}
