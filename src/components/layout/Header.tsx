import React, { useState } from 'react';
import { ShieldCheck, Wallet, ChevronDown, LogOut, ArrowUpRight } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { NetworkStatus } from '../common/NetworkStatus';
import { AddressBadge } from '../common/AddressBadge';
import { formatCurrency } from '../../utils/format';
import { ValticsMark } from '../brand/ValticsLogo';

export type NavigationTab = 'overview' | 'explore-assets' | 'markets' | 'predictions' | 'portfolio' | 'passport' | 'create' | 'studio' | 'my-markets' | 'activity' | 'agent';

interface HeaderProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenWalletModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenWalletModal,
}) => {
  const { connected, publicKeyStr, balanceSol, disconnect, walletName, isWrongNetwork } = useWallet();
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);

  const navItems: { id: NavigationTab; label: string; badge?: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'explore-assets', label: 'Explore assets' },
    { id: 'markets', label: 'Explore markets' },
    { id: 'predictions', label: 'Predictions' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'agent', label: 'Valtics Agent', badge: 'AI' },
    { id: 'create', label: 'Create market' },
    { id: 'my-markets', label: 'Dashboard' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#670CDC]/20 bg-[#09011B]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-6">
          <div
            id="brand-logo"
            onClick={() => onSelectTab('overview')}
            className="cursor-pointer flex items-center gap-3 group select-none"
          >
            <ValticsMark size={32} glow className="transition-transform group-hover:scale-105" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-[#F7F3FF] font-sans group-hover:text-white transition-colors">
                  VALTICS
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#1C0142] text-[#F99225] border border-[#F99225]/30">
                  DBC Core
                </span>
              </div>
              <p className="text-[10px] text-[#B8A9CC] hidden sm:block tracking-tight font-medium">
                Create programmable markets around tokenized assets
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                id={`nav-${item.id}`}
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeTab === item.id
                    ? 'bg-[#3B0489]/70 text-[#F7F3FF] shadow-xs border border-[#670CDC]/40'
                    : 'text-[#B8A9CC] hover:text-[#F7F3FF] hover:bg-[#1C0142]/60'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2.5">
          {/* Solana Cluster & Latency */}
          <NetworkStatus />

          {/* Wallet Connection Button */}
          {connected && publicKeyStr ? (
            <div className="relative">
              <button
                id="wallet-user-pill"
                type="button"
                onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
                className={`flex items-center gap-2 pl-2.5 pr-2 py-1 rounded-lg border transition-colors text-xs cursor-pointer ${
                  isWrongNetwork
                    ? 'border-rose-800/80 bg-rose-950/40 text-rose-200'
                    : 'border-[#670CDC]/30 bg-[#140130] hover:border-[#670CDC]/60 text-[#F7F3FF]'
                }`}
              >
                {isWrongNetwork ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-900/60 text-rose-200 font-medium">
                    Wrong Network (Devnet required)
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5 font-mono-nums">
                    <span className="text-emerald-400 font-semibold hidden sm:inline">
                      {balanceSol !== null ? `${balanceSol.toFixed(3)} SOL` : '—'}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-[#670CDC] hidden sm:inline" />
                    <span className="text-[#F7F3FF] font-mono">
                      {publicKeyStr.slice(0, 4)}...{publicKeyStr.slice(-4)}
                    </span>
                  </div>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-[#B8A9CC]" />
              </button>

              {walletDropdownOpen && (
                <div
                  id="wallet-dropdown-menu"
                  className="absolute right-0 mt-2 w-64 rounded-xl border border-[#670CDC]/30 bg-[#140130] shadow-2xl shadow-[#09011B]/95 z-50 p-3.5 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#670CDC]/20">
                    <span className="text-[#B8A9CC] text-[11px]">Connected Wallet</span>
                    <span className="font-semibold text-[#F7F3FF]">{walletName || 'Solana Wallet'}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-[#B8A9CC] uppercase font-semibold">Account</span>
                    <AddressBadge address={publicKeyStr} head={6} tail={6} className="w-full justify-between" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-[#B8A9CC] uppercase font-semibold">SOL Balance</span>
                    <div className="font-mono-nums text-sm font-bold text-[#F99225]">
                      {balanceSol !== null ? formatCurrency(balanceSol, 'SOL') : 'Fetching balance...'}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#670CDC]/20">
                    <button
                      id="wallet-disconnect-action"
                      type="button"
                      onClick={async () => {
                        await disconnect();
                        setWalletDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#1C0142] hover:bg-rose-950/60 hover:text-rose-300 text-[#B8A9CC] border border-[#670CDC]/25 text-xs transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Disconnect</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              id="connect-wallet-btn"
              type="button"
              onClick={onOpenWalletModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#670CDC] hover:bg-[#7818EE] text-[#F7F3FF] text-xs font-semibold shadow-md shadow-[#670CDC]/30 transition-all tracking-tight active:scale-[0.98] cursor-pointer font-sans"
            >
              <Wallet className="w-3.5 h-3.5 text-[#F99225]" />
              <span>Connect Wallet</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden flex items-center overflow-x-auto px-4 py-2 border-t border-[#670CDC]/20 gap-1 bg-[#0E0124]">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectTab(item.id)}
            className={`px-2.5 py-1 rounded-md text-xs whitespace-nowrap font-medium transition-colors cursor-pointer ${
              activeTab === item.id
                ? 'bg-[#3B0489] text-[#F7F3FF] font-semibold border border-[#670CDC]/40'
                : 'text-[#B8A9CC] hover:text-[#F7F3FF]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
