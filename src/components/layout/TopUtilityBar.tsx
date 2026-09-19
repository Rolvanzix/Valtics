import React, { useState } from 'react';
import {
  Search,
  Wallet,
  ChevronDown,
  LogOut,
  PanelRightClose,
  PanelRightOpen,
  Menu,
  Globe,
  Check,
  Zap,
  HelpCircle,
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { useNetwork } from '../../context/NetworkContext';
import { NetworkStatus } from '../common/NetworkStatus';
import { AddressBadge } from '../common/AddressBadge';
import { formatCurrency } from '../../utils/format';
import { ValticsLogo } from '../brand/ValticsLogo';

interface TopUtilityBarProps {
  onOpenWalletModal: () => void;
  inspectorOpen: boolean;
  onToggleInspector: () => void;
  onOpenMobileMenu?: () => void;
  onSearchQuery?: (q: string) => void;
  onOpenPrimer?: () => void;
}

export const TopUtilityBar: React.FC<TopUtilityBarProps> = ({
  onOpenWalletModal,
  inspectorOpen,
  onToggleInspector,
  onOpenMobileMenu,
  onSearchQuery,
  onOpenPrimer,
}) => {
  const { connected, publicKeyStr, balanceSol, disconnect, walletName, isWrongNetwork } = useWallet();
  const { currentNetwork, supportedNetworks, selectNetwork, latencyMs } = useNetwork();
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
  const [networkDropdownOpen, setNetworkDropdownOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchVal(e.target.value);
    onSearchQuery?.(e.target.value);
  };

  return (
    <header className="sticky top-0 z-40 w-full h-16 border-b border-zinc-800/80 bg-[#090d14]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-3 select-none">
      {/* Left side: Mobile menu toggle + Brand icon + Search input */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile logo only */}
        <div className="lg:hidden flex items-center">
          <ValticsLogo size="xs" showText={true} glow={true} />
        </div>

        {/* Global Financial Search */}
        <div className="relative flex-1 hidden sm:block">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchVal}
            onChange={handleSearchChange}
            placeholder="Search pools, token symbols, or SPL mint addresses..."
            className="w-full bg-[#0d121c] border border-zinc-800 focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/30 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-hidden transition-all"
          />
        </div>
      </div>

      {/* Right side controls: Network switcher, Latency, Wallet, Inspector Toggle */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Network Selector Pill */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNetworkDropdownOpen(!networkDropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-[#0e141f] hover:border-zinc-700 text-xs text-zinc-300 transition-colors"
          >
            <span
              className="w-1.5 h-1.5 rounded-full bg-amber-400"
            />
            <span className="font-medium hidden md:inline">{currentNetwork?.name || 'Solana Cluster'}</span>
            {latencyMs !== null && (
              <span className="font-mono text-[10px] text-zinc-500 hidden sm:inline">
                {latencyMs}ms
              </span>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
          </button>

          {networkDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-lg border border-zinc-700 bg-[#0c1018] shadow-2xl z-50 p-1.5 text-xs">
              <div className="px-2 py-1.5 text-[10px] uppercase font-semibold text-zinc-500 font-mono">
                Solana Cluster
              </div>
              {(supportedNetworks || []).map((net) => {
                const isSelected = net.endpoint === currentNetwork?.endpoint;
                return (
                  <button
                    key={net.endpoint}
                    type="button"
                    onClick={() => {
                      selectNetwork(net);
                      setNetworkDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-xs transition-colors text-left ${
                      isSelected
                        ? 'bg-amber-500/10 text-amber-300 font-medium'
                        : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-zinc-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span>{net.name}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Connected Wallet Pill or Connect Button */}
        {connected && publicKeyStr ? (
          <div className="relative">
            <button
              id="wallet-user-pill"
              type="button"
              onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
              className={`flex items-center gap-2 pl-2.5 pr-2 py-1.5 rounded-lg border transition-colors text-xs ${
                isWrongNetwork
                  ? 'border-rose-800/80 bg-rose-950/40 text-rose-200'
                  : 'border-zinc-800 bg-[#0e131d] hover:border-zinc-700 text-zinc-200'
              }`}
            >
              {isWrongNetwork ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-900/60 text-rose-200 font-medium">
                  Wrong Network
                </span>
              ) : (
                <>
                  <span className="text-emerald-400 font-semibold font-mono-nums hidden sm:inline">
                    {balanceSol !== null ? `${balanceSol.toFixed(3)} SOL` : '—'}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-zinc-700 hidden sm:inline" />
                  <span className="font-mono text-zinc-300">
                    {publicKeyStr.slice(0, 4)}...{publicKeyStr.slice(-4)}
                  </span>
                </>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
            </button>

            {walletDropdownOpen && (
              <div
                id="wallet-dropdown-menu"
                className="absolute right-0 mt-2 w-64 rounded-lg border border-zinc-700 bg-[#0c1018] shadow-2xl z-50 p-3 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <span className="text-zinc-500 text-[11px]">Provider</span>
                  <span className="font-semibold text-zinc-200">{walletName || 'Solana Wallet'}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">Account Address</span>
                  <AddressBadge address={publicKeyStr} head={6} tail={6} className="w-full justify-between" />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">SOL Balance</span>
                  <div className="font-mono-nums text-sm font-semibold text-zinc-100">
                    {balanceSol !== null ? formatCurrency(balanceSol, 'SOL') : 'Fetching...'}
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={async () => {
                      await disconnect();
                      setWalletDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded bg-zinc-800/80 hover:bg-rose-950/60 hover:text-rose-300 text-zinc-300 text-xs transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Disconnect wallet</span>
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
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#8b5cf6] via-[#ec4899] to-[#f59e0b] hover:opacity-95 active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-violet-900/25 border border-white/10 transition-all tracking-tight cursor-pointer"
          >
            <Wallet className="w-3.5 h-3.5 text-white" />
            <span>Connect wallet</span>
          </button>
        )}

        {/* Platform Guide & Primer Button */}
        {onOpenPrimer && (
          <button
            type="button"
            onClick={onOpenPrimer}
            title="How VALTICS works (Architecture Guide)"
            className="p-2 rounded-lg border border-zinc-800 bg-[#0e141f] text-zinc-400 hover:text-amber-300 hover:border-amber-500/40 transition-colors cursor-pointer hidden sm:flex items-center justify-center"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        )}

        {/* Right-Side Contextual Inspector Panel Toggle */}
        <button
          type="button"
          onClick={onToggleInspector}
          title={inspectorOpen ? 'Hide contextual inspector' : 'Open contextual inspector'}
          className={`p-2 rounded-lg border transition-colors cursor-pointer ${
            inspectorOpen
              ? 'bg-amber-500/10 border-amber-500/50 text-amber-300'
              : 'border-zinc-800 bg-[#0e141f] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
          }`}
        >
          {inspectorOpen ? (
            <PanelRightClose className="w-4 h-4" />
          ) : (
            <PanelRightOpen className="w-4 h-4" />
          )}
        </button>
      </div>
    </header>
  );
};
