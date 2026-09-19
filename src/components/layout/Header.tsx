import React, { useState } from 'react';
import { ShieldCheck, Wallet, ChevronDown, LogOut, ArrowUpRight } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { NetworkStatus } from '../common/NetworkStatus';
import { AddressBadge } from '../common/AddressBadge';
import { formatCurrency } from '../../utils/format';
import { ValticsMark } from '../brand/ValticsLogo';

export type NavigationTab = 'overview' | 'markets' | 'passport' | 'create' | 'studio' | 'my-markets' | 'activity';

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
    { id: 'markets', label: 'Explore markets' },
    { id: 'create', label: 'Create market' },
    { id: 'my-markets', label: 'Dashboard' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-[#090d14]/95 backdrop-blur-md">
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
                <span className="font-extrabold text-base tracking-tight text-zinc-100 font-sans group-hover:text-white transition-colors">
                  VALTICS
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-zinc-800/80 text-amber-400 border border-amber-500/20">
                  DBC Core
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 hidden sm:block tracking-tight font-medium">
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
                    ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
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
                className={`flex items-center gap-2 pl-2.5 pr-2 py-1 rounded-md border transition-colors text-xs ${
                  isWrongNetwork
                    ? 'border-rose-800/80 bg-rose-950/40 text-rose-200'
                    : 'border-zinc-800 bg-[#0e131d] hover:border-zinc-700 text-zinc-200'
                }`}
              >
                {isWrongNetwork ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-900/60 text-rose-200 font-medium">
                    Wrong Network (Devnet required)
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5 font-mono-nums">
                    <span className="text-emerald-400 font-medium hidden sm:inline">
                      {balanceSol !== null ? `${balanceSol.toFixed(3)} SOL` : '—'}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-zinc-700 hidden sm:inline" />
                    <span className="text-zinc-300 font-mono">
                      {publicKeyStr.slice(0, 4)}...{publicKeyStr.slice(-4)}
                    </span>
                  </div>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {walletDropdownOpen && (
                <div
                  id="wallet-dropdown-menu"
                  className="absolute right-0 mt-2 w-64 rounded-lg border border-zinc-800 bg-[#0c1018] shadow-2xl z-50 p-3 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                    <span className="text-zinc-400 text-[11px]">Connected Wallet</span>
                    <span className="font-semibold text-zinc-200">{walletName || 'Solana Wallet'}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold">Account</span>
                    <AddressBadge address={publicKeyStr} head={6} tail={6} className="w-full justify-between" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold">SOL Balance</span>
                    <div className="font-mono-nums text-sm font-semibold text-zinc-100">
                      {balanceSol !== null ? formatCurrency(balanceSol, 'SOL') : 'Fetching balance...'}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/80">
                    <button
                      id="wallet-disconnect-action"
                      type="button"
                      onClick={async () => {
                        await disconnect();
                        setWalletDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded bg-zinc-800/80 hover:bg-rose-950/60 hover:text-rose-300 text-zinc-300 text-xs transition-colors"
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-semibold shadow-xs transition-all tracking-tight active:scale-[0.98]"
            >
              <Wallet className="w-3.5 h-3.5 text-zinc-950" />
              <span>Connect Wallet</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden flex items-center overflow-x-auto px-4 py-2 border-t border-zinc-800/60 gap-1 bg-[#080b11]">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectTab(item.id)}
            className={`px-2.5 py-1 rounded text-xs whitespace-nowrap font-medium transition-colors ${
              activeTab === item.id
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
