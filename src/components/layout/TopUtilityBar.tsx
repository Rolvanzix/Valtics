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
import { EnvironmentSwitch } from '../common/EnvironmentSwitch';

interface TopUtilityBarProps {
  onOpenWalletModal: () => void;
  inspectorOpen: boolean;
  onToggleInspector: () => void;
  onOpenMobileMenu?: () => void;
  onSearchQuery?: (q: string) => void;
  onOpenPrimer?: () => void;
  onReturnToLanding?: () => void;
}

export const TopUtilityBar: React.FC<TopUtilityBarProps> = ({
  onOpenWalletModal,
  inspectorOpen,
  onToggleInspector,
  onOpenMobileMenu,
  onSearchQuery,
  onOpenPrimer,
  onReturnToLanding,
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
    <header className="sticky top-0 z-40 w-full h-14 sm:h-16 border-b border-[rgba(138,32,255,0.18)] bg-[#05051a]/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-3 select-none">
      {/* Left side: Mobile menu toggle + Brand icon + Search input */}
      <div className="flex items-center gap-2.5 sm:gap-3 flex-1 max-w-md">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open mobile navigation menu"
          className="lg:hidden min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-[#A7A7B8] hover:text-[#F5F5F7] hover:bg-[#080821] transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile logo only */}
        <div className="lg:hidden flex items-center shrink-0">
          <ValticsLogo size="xs" showText={true} glow={true} />
        </div>

        {/* Global Financial Search */}
        <div className="relative flex-1 hidden sm:block">
          <Search className="w-3.5 h-3.5 text-[#66667A] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchVal}
            onChange={handleSearchChange}
            placeholder="Search pools, token symbols, or SPL mint addresses..."
            className="w-full bg-[#080821] border border-[rgba(138,32,255,0.25)] focus:border-[#8A20FF] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#F5F5F7] placeholder-[#66667A] focus:outline-hidden transition-all font-sans"
          />
        </div>
      </div>

      {/* Right side controls: Network switcher, Latency, Wallet, Inspector Toggle */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {onReturnToLanding && (
          <button
            type="button"
            onClick={onReturnToLanding}
            title="Return to Valtics Website"
            className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono text-[#A7A7B8] hover:text-[#F5F5F7] hover:bg-[#080821] rounded-md border border-[rgba(138,32,255,0.25)] transition-colors cursor-pointer"
          >
            <span>Website</span>
          </button>
        )}

        {/* Devnet Cluster Indicator */}
        <EnvironmentSwitch />

        {/* Connected Wallet Pill or Connect Button */}
        {connected && publicKeyStr ? (
          <div className="relative">
            <button
              id="wallet-user-pill"
              type="button"
              onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
              className={`min-h-[40px] flex items-center gap-1.5 sm:gap-2 pl-2 sm:pl-2.5 pr-2 py-1.5 rounded-lg border transition-colors text-xs cursor-pointer font-sans ${
                isWrongNetwork
                  ? 'border-[#BA3351]/80 bg-[#250315] text-[#FF9EAF]'
                  : 'border-[rgba(138,32,255,0.25)] bg-[#080821] hover:border-[rgba(138,32,255,0.5)] text-[#F5F5F7]'
              }`}
            >
              {isWrongNetwork ? (
                <span className="text-xs px-1.5 py-0.5 rounded bg-[#BA3351]/40 text-[#FF9EAF] font-medium">
                  Wrong Network
                </span>
              ) : (
                <>
                  <span className="text-emerald-400 font-medium font-mono-nums hidden sm:inline">
                    {balanceSol !== null ? `${balanceSol.toFixed(3)} SOL` : '—'}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-[#670CDC]/40 hidden sm:inline" />
                  <span className="font-mono text-[#A7A7B8]">
                    {publicKeyStr.slice(0, 4)}...{publicKeyStr.slice(-4)}
                  </span>
                </>
              )}
              <ChevronDown className="w-3 h-3 text-[#A7A7B8]" />
            </button>

            {walletDropdownOpen && (
              <div
                id="wallet-dropdown-menu"
                className="absolute right-0 mt-2 w-64 rounded-xl border border-[#670CDC]/30 bg-[#160136] shadow-2xl shadow-[#09011B]/95 z-50 p-3 space-y-3 text-xs font-sans"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#670CDC]/20">
                  <span className="text-[#7E6D96] text-xs">Provider</span>
                  <span className="font-medium text-[#F7F3FF]">{walletName || 'Solana Wallet'}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-[#B8A9CC] font-medium">Account Address</span>
                  <AddressBadge address={publicKeyStr} head={6} tail={6} className="w-full justify-between" />
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-[#B8A9CC] font-medium">SOL Balance</span>
                  <div className="font-mono-nums text-sm font-semibold text-[#F7F3FF]">
                    {balanceSol !== null ? formatCurrency(balanceSol, 'SOL') : 'Fetching...'}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#670CDC]/20">
                  <button
                    type="button"
                    onClick={async () => {
                      await disconnect();
                      setWalletDropdownOpen(false);
                    }}
                    className="w-full min-h-[40px] flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md bg-[#1C0142] hover:bg-[#BA3351]/20 hover:text-[#FF9EAF] border border-[#670CDC]/30 text-[#F7F3FF] text-xs transition-colors cursor-pointer"
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
            className="min-h-[40px] flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg bg-[#F99225] hover:bg-[#FFA742] text-[#09011B] text-xs font-bold tracking-tight transition-colors cursor-pointer shadow-md shadow-[#F99225]/20 active:scale-[0.98] font-sans"
          >
            <Wallet className="w-3.5 h-3.5 text-[#09011B]" />
            <span className="hidden xs:inline">Connect wallet</span>
            <span className="xs:hidden">Connect</span>
          </button>
        )}

        {/* Platform Guide & Primer Button */}
        {onOpenPrimer && (
          <button
            type="button"
            onClick={onOpenPrimer}
            title="How VALTICS works (Architecture Guide)"
            className="min-h-[40px] min-w-[40px] rounded-lg border border-[#670CDC]/25 bg-[#140130] text-[#B8A9CC] hover:text-[#F7F3FF] hover:border-[#670CDC]/50 transition-colors cursor-pointer hidden sm:flex items-center justify-center"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        )}

        {/* Right-Side Contextual Inspector Panel Toggle */}
        <button
          type="button"
          onClick={onToggleInspector}
          title={inspectorOpen ? 'Hide contextual inspector' : 'Open contextual inspector'}
          aria-label={inspectorOpen ? 'Hide contextual inspector' : 'Open contextual inspector'}
          className={`min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg border transition-colors cursor-pointer ${
            inspectorOpen
              ? 'bg-[#3B0489] border-[#670CDC]/60 text-[#F7F3FF]'
              : 'border-[#670CDC]/25 bg-[#140130] text-[#B8A9CC] hover:text-[#F7F3FF] hover:border-[#670CDC]/50'
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
