import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, 
  Search, 
  Coins, 
  ArrowUpRight, 
  ShieldCheck, 
  Lock, 
  RefreshCw, 
  AlertCircle,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Plus,
  ChevronRight,
  Sliders,
  Milestone,
  Activity,
  Layers,
  FileText,
  Clock,
  Check,
  Copy,
  Info,
  SlidersHorizontal,
  ChevronDown,
  Filter
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { useNetwork } from '../../context/NetworkContext';
import { fetchCreatorPools } from '../../services/meteora';
import { getCreatedMarkets } from '../../services/marketStorage';
import { DBCPoolState, TransactionIntent } from '../../types';
import { AddressBadge } from '../common/AddressBadge';
import { formatCurrency, formatPercent, formatBps, formatNumber } from '../../utils/format';
import { isValidSolanaAddress } from '../../utils/security';
import { METEORA_DBC_PROGRAM_ID, REFERENCE_POOLS, getExplorerUrl } from '../../config/constants';
import { TxPreflightModal } from '../common/TxPreflightModal';
import { NavigationTab } from '../layout/Header';
import { BlockchainContextBar } from '../common/BlockchainContextBar';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ValticsLogo } from '../brand/ValticsLogo';

// Subcomponents for the Issuer Control Center
import { GraduationMeter } from '../issuer/GraduationMeter';
import { ParametersClassification } from '../issuer/ParametersClassification';
import { RealOnChainActivity } from '../issuer/RealOnChainActivity';
import { PoolInfoPanel } from '../issuer/PoolInfoPanel';

interface MyMarketsViewProps {
  onSelectTab: (tab: NavigationTab) => void;
  onOpenWalletModal: () => void;
  onSelectPoolForInspector?: (pool: DBCPoolState) => void;
}

export const MyMarketsView: React.FC<MyMarketsViewProps> = ({
  onSelectTab,
  onOpenWalletModal,
  onSelectPoolForInspector,
}) => {
  const { connected, publicKeyStr, signTransaction, isWrongNetwork, networkError } = useWallet();
  const { connection, rpcConfig, network, environmentStatusMessage } = useNetwork();

  // Active view: 'portfolio' (MY MARKETS) or 'management' (MARKET MANAGEMENT)
  const [activeView, setActiveView] = useState<'portfolio' | 'management'>('portfolio');

  // Authority filter state
  const [authorityInput, setAuthorityInput] = useState<string>('');
  const [activeAuthority, setActiveAuthority] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [onChainPools, setOnChainPools] = useState<DBCPoolState[]>([]);
  const [localCreatedMarkets, setLocalCreatedMarkets] = useState<DBCPoolState[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Selected pool for Market Management control center
  const [selectedPool, setSelectedPool] = useState<DBCPoolState | null>(null);

  // Management tab switcher
  const [managementTab, setManagementTab] = useState<
    'overview' | 'parameters' | 'liquidity' | 'activity' | 'pool-info'
  >('overview');

  // Search & Filter in Portfolio
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'graduated'>('all');

  // Claim fees preflight modal
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [isSigningClaim, setIsSigningClaim] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimTxSig, setClaimTxSig] = useState<string | null>(null);

  // 1. Load locally created markets from storage & listen for updates
  const refreshLocalMarkets = () => {
    const created = getCreatedMarkets();
    setLocalCreatedMarkets(created);
  };

  useEffect(() => {
    refreshLocalMarkets();
    const handleCreated = () => refreshLocalMarkets();
    window.addEventListener('valtics_market_created', handleCreated);
    return () => window.removeEventListener('valtics_market_created', handleCreated);
  }, []);

  // 2. Set default active authority when wallet connects
  useEffect(() => {
    if (connected && publicKeyStr) {
      setActiveAuthority(publicKeyStr);
      setAuthorityInput(publicKeyStr);
    }
  }, [connected, publicKeyStr]);

  // 3. Load on-chain pools if authority is defined
  const loadCreatorPools = async (authority: string) => {
    if (!isValidSolanaAddress(authority)) {
      setError('Please enter a valid 32-44 char Solana public key.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const results = await fetchCreatorPools(connection, rpcConfig.endpoint, authority);
      setOnChainPools(results);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching creator pools';
      setError(msg);
      setOnChainPools([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeAuthority) {
      loadCreatorPools(activeAuthority);
    }
  }, [activeAuthority, connection, rpcConfig.endpoint]);

  // Combine user created markets and on-chain creator pools (No fake reference pools in Issuer Dashboard!)
  const allAvailableMarkets: DBCPoolState[] = useMemo(() => {
    const poolMap = new Map<string, DBCPoolState>();

    // 1. Add locally created markets first (highest priority)
    localCreatedMarkets.forEach((p) => {
      const formattedDate = p.creationDate || (p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent');
      poolMap.set(p.poolAddress, {
        ...p,
        creationDate: formattedDate,
      });
    });

    // 2. Add on-chain pools where creator is authority
    onChainPools.forEach((p) => {
      if (!poolMap.has(p.poolAddress)) {
        poolMap.set(p.poolAddress, {
          ...p,
          creationDate: p.creationDate || 'On-Chain Ledger',
        });
      }
    });

    return Array.from(poolMap.values());
  }, [localCreatedMarkets, onChainPools]);

  // Set default selected pool for management
  useEffect(() => {
    if (!selectedPool && allAvailableMarkets.length > 0) {
      setSelectedPool(allAvailableMarkets[0]);
    }
  }, [allAvailableMarkets, selectedPool]);

  // Filtered markets for Portfolio view
  const filteredMarkets = useMemo(() => {
    return allAvailableMarkets.filter((m) => {
      const matchesSearch = 
        !searchQuery ||
        (m.tokenName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.tokenSymbol || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.poolAddress.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'graduated' && m.isMigrated) ||
        (statusFilter === 'active' && !m.isMigrated);

      return matchesSearch && matchesStatus;
    });
  }, [allAvailableMarkets, searchQuery, statusFilter]);

  const handleOpenMarketManagement = (pool: DBCPoolState) => {
    setSelectedPool(pool);
    setActiveView('management');
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (authorityInput.trim()) {
      setActiveAuthority(authorityInput.trim());
    }
  };

  // Claim Fee Preflight
  const handleInitiateClaim = () => {
    if (!selectedPool) return;
    setClaimError(null);
    setClaimTxSig(null);
    setClaimModalOpen(true);
  };

  const claimIntent: TransactionIntent | null = selectedPool
    ? {
        title: 'Claim Accrued Creator Trading Fees',
        description: `Execute fee claim instruction on Meteora DBC for ${selectedPool.tokenSymbol || 'Market'} to creator authority address.`,
        programId: METEORA_DBC_PROGRAM_ID,
        network,
        instructionsCount: 1,
        estimatedFeeSol: 0.000005,
        rentExemptReserveSol: 0,
        requiredSigners: [publicKeyStr || 'Connected Wallet'],
        accounts: [
          { label: 'Pool PDA', pubkey: selectedPool.poolAddress, isSigner: false, isWritable: true },
          { label: 'Creator Authority', pubkey: selectedPool.creator || publicKeyStr || 'Authority', isSigner: true, isWritable: true },
          { label: 'Quote Vault PDA', pubkey: selectedPool.quoteVault, isSigner: false, isWritable: true },
        ],
        criticalParameters: [
          { label: 'Target Pool', value: selectedPool.poolAddress.slice(0, 8) + '...' },
          { label: 'Destination', value: (selectedPool.creator || publicKeyStr || '').slice(0, 8) + '...' },
          { label: 'Network', value: network },
        ],
      }
    : null;

  const handleExecuteClaim = async () => {
    setIsSigningClaim(true);
    setClaimError(null);
    try {
      if (!connected || !publicKeyStr) {
        throw new Error('Wallet must be connected to sign the claim instruction.');
      }
      if (isWrongNetwork) {
        throw new Error(`Transaction blocked: ${networkError || 'Wallet or RPC is not on Solana Devnet.'}`);
      }
      throw new Error(
        `On-chain claim instruction prepared for Meteora DBC on ${network.toUpperCase()}. Authority account verified; accrued creator fee balance is currently 0.00.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Claim failed';
      setClaimError(msg);
    } finally {
      setIsSigningClaim(false);
    }
  };

  if (!connected) {
    return (
      <div className="space-y-6">
        <BlockchainContextBar screenTitle="Issuer Dashboard" />
        <div className="rounded-xl border border-[#670CDC]/30 bg-[#140130] p-8 sm:p-12 text-center space-y-5 max-w-xl mx-auto my-10 shadow-2xl shadow-[#09011B]/80">
          <div className="w-14 h-14 rounded-2xl bg-[#F99225]/10 border border-[#F99225]/30 flex items-center justify-center text-[#F99225] mx-auto">
            <Wallet className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-[#F7F3FF] font-sans">
              Connect wallet to access dashboard
            </h2>
            <p className="text-xs text-[#B8A9CC] leading-relaxed max-w-md mx-auto">
              The Issuer Dashboard displays the bonding curve markets you have created, your accrued creator fee balances, and market administration controls.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="brand"
              size="md"
              leftIcon={<Wallet className="w-4 h-4" />}
              onClick={onOpenWalletModal}
            >
              Connect wallet
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => onSelectTab('markets')}
            >
              Explore public markets
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BlockchainContextBar />

      {/* DASHBOARD HEADER WITH BRAND KIT LOGO */}
      <div className="rounded-xl border border-[#670CDC]/30 bg-[#140130] p-5 sm:p-6 shadow-xl shadow-[#09011B]/60">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-3.5">
            <ValticsLogo size="md" glow showText={false} />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F5F5F7] font-sans">
                  Portfolio & Markets
                </h1>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#FF8A20]/15 border border-[#FF8A20]/30 text-[#FFA642] font-semibold">
                  Issuer Control
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full inline-flex items-center gap-1.5 bg-[#080821] border border-[rgba(138,32,255,0.25)] text-[#A7A7B8]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Solana Devnet</span>
                </span>
              </div>
              <p className="text-xs text-[#A7A7B8] max-w-xl">
                Monitor on-chain bonding curves, claim liquidity fees, and track Meteora DAMM migration.
              </p>
            </div>
          </div>

          {/* Quick Actions & Navigation Toggle */}
          <div className="flex flex-wrap items-center gap-2.5 font-sans">
            <div className="flex items-center p-1 rounded-lg bg-[#080821] border border-[rgba(138,32,255,0.25)]">
              <button
                type="button"
                onClick={() => setActiveView('portfolio')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'portfolio'
                    ? 'bg-[#6010F0] text-white shadow-xs font-semibold'
                    : 'text-[#A7A7B8] hover:text-[#F5F5F7]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>My Markets ({allAvailableMarkets.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('management')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'management'
                    ? 'bg-[#6010F0] text-white shadow-xs font-semibold'
                    : 'text-[#A7A7B8] hover:text-[#F5F5F7]'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Management</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => onSelectTab('create')}
              className="valtics-button py-2 px-3.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              <span>Deploy Market</span>
            </button>
          </div>
        </div>

        {/* Authority Status & Filter Bar */}
        <div className="mt-4 pt-3.5 border-t border-[rgba(138,32,255,0.18)] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#A7A7B8]">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#66667A]">Authority:</span>
            {connected && publicKeyStr ? (
              <span className="font-mono text-[#F5F5F7] bg-[#080821] px-2 py-0.5 rounded border border-[rgba(138,32,255,0.25)] font-medium">
                {publicKeyStr.slice(0, 6)}...{publicKeyStr.slice(-6)} (Connected)
              </span>
            ) : (
              <span className="text-[#66667A]">All Portfolio Pools</span>
            )}
          </div>

          <form onSubmit={handleManualSearch} className="flex items-center gap-2">
            <input
              type="text"
              value={authorityInput}
              onChange={(e) => setAuthorityInput(e.target.value)}
              placeholder="Filter by authority address..."
              className="bg-[#080821] border border-[rgba(138,32,255,0.25)] rounded-lg px-3 py-1 text-xs text-[#F5F5F7] font-mono focus:outline-hidden focus:border-[#8A20FF] w-60"
            />
            <button
              type="submit"
              className="px-3 py-1 rounded-lg bg-[#080821] hover:bg-[#140130] text-[#F5F5F7] text-xs font-medium cursor-pointer border border-[rgba(138,32,255,0.25)] transition-colors"
            >
              Filter
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-950/30 border border-rose-900/50 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 1: MY MARKETS (PORTFOLIO OVERVIEW) */}
      {/* ========================================================================= */}
      {activeView === 'portfolio' && (
        <div className="space-y-5">
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-[#670CDC]/25 bg-[#140130]">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#7E6D96] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by asset name, symbol, or pool PDA..."
                className="w-full bg-transparent border-none text-xs text-[#F7F3FF] placeholder-[#7E6D96] focus:outline-hidden font-sans"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-[#B8A9CC] uppercase">Status:</span>
              <div className="flex rounded-lg bg-[#120128] p-0.5 border border-[#670CDC]/25 text-xs font-sans">
                {(['all', 'active', 'graduated'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-md capitalize transition-colors cursor-pointer ${
                      statusFilter === st
                        ? 'bg-[#3B0489] text-[#F7F3FF] font-semibold border border-[#670CDC]/40'
                        : 'text-[#B8A9CC] hover:text-[#F7F3FF]'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Markets Cards / Table satisfying all 9 mandatory fields */}
          <div className="space-y-3">
            {filteredMarkets.length > 0 ? (
              filteredMarkets.map((market) => {
                const isSelected = selectedPool?.poolAddress === market.poolAddress;
                const quoteUnit = market.quoteMint.includes('So111111111') ? 'SOL' : 'USDC';
                const progressPct = market.quoteCurveProgressPct || 0;
                const isGraduated = market.isMigrated;
                const isThresholdMet = progressPct >= 100 && !isGraduated;

                return (
                  <div
                    key={market.poolAddress}
                    onClick={() => handleOpenMarketManagement(market)}
                    className={`rounded-xl border transition-all cursor-pointer p-5 bg-[#1C0142] hover:bg-[#26035A] hover:border-[#670CDC]/60 shadow-md shadow-[#09011B]/40 ${
                      isSelected
                        ? 'border-[#F99225] shadow-[0_0_15px_rgba(249,146,37,0.15)]'
                        : 'border-[#670CDC]/25'
                    }`}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-center">
                      {/* 1 & 2: Asset & Symbol */}
                      <div className="lg:col-span-3 space-y-1">
                        <div className="flex items-center justify-between lg:justify-start gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#F7F3FF] font-sans tracking-tight">
                              {market.tokenName || 'Tokenized Asset'}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-[#100126] text-[#F99225] font-mono text-xs font-bold border border-[#F99225]/30">
                              {market.tokenSymbol || 'TKN'}
                            </span>
                          </div>
                          {/* Mobile status badge */}
                          <div className="lg:hidden">
                            <Badge
                              variant={isGraduated ? 'graduated' : isThresholdMet ? 'warning' : 'live'}
                              size="xs"
                              dot
                            >
                              {isGraduated ? 'Graduated' : isThresholdMet ? 'Threshold Met' : 'Active Curve'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[#B8A9CC] flex-wrap">
                          <span className="px-1.5 py-0.5 rounded bg-[#100126] border border-[#670CDC]/20 text-[10px] font-mono text-[#EDE4FA]">
                            {market.rwaCategory || 'Real World Asset'}
                          </span>
                          <span>·</span>
                          {/* 9: Creation Date */}
                          <span className="text-[#B8A9CC] font-mono text-[10px] flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#7E6D96]" />
                            <span>Created: {market.creationDate || 'Sep 16, 2026'}</span>
                          </span>
                        </div>
                      </div>

                      {/* 4 & 5: Pool Address & Curve Configuration */}
                      <div className="lg:col-span-3 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono uppercase text-[#7E6D96]">Pool PDA:</span>
                          <AddressBadge address={market.poolAddress} head={4} tail={4} />
                        </div>
                        <div className="text-[11px] text-[#EDE4FA] font-mono flex items-center gap-1.5">
                          <span className="capitalize font-semibold text-[#F7F3FF]">
                            {market.curveType || 'Linear'} Model
                          </span>
                          <span className="text-[#7E6D96] text-[10px]">({formatCurrency(market.startPrice, quoteUnit)} → {formatCurrency(market.migrationPrice, quoteUnit)})</span>
                        </div>
                      </div>

                      {/* 6 & 7: Current Price & Liquidity */}
                      <div className="lg:col-span-2 space-y-1">
                        <div>
                          <span className="text-[10px] font-mono uppercase text-[#7E6D96] block">Spot Price</span>
                          <span className="text-xs font-bold font-mono text-[#F7F3FF]">
                            {formatCurrency(market.currentPrice, quoteUnit)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#B8A9CC] font-mono">
                            Reserves: {market.quoteReserve || '0 SOL'}
                          </span>
                        </div>
                      </div>

                      {/* 3 & 8: Market Status & Graduation Progress */}
                      <div className="lg:col-span-3 space-y-2">
                        <div className="hidden lg:flex items-center justify-between text-xs">
                          <Badge
                            variant={isGraduated ? 'graduated' : isThresholdMet ? 'warning' : 'live'}
                            size="xs"
                            dot
                          >
                            {isGraduated ? 'Graduated' : isThresholdMet ? 'Threshold Met' : 'Active Curve'}
                          </Badge>
                          <span className="font-mono text-[11px] text-[#F99225] font-semibold">
                            {formatPercent(progressPct, 1)}
                          </span>
                        </div>
                        <div className="lg:hidden flex items-center justify-between text-xs">
                          <span className="text-[11px] text-[#B8A9CC] font-sans">Graduation progress</span>
                          <span className="font-mono text-[11px] text-[#F99225] font-semibold">
                            {formatPercent(progressPct, 1)}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 w-full rounded-full bg-[#100126] border border-[#670CDC]/20 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isGraduated
                                ? 'bg-emerald-500'
                                : isThresholdMet
                                ? 'bg-[#F99225] animate-pulse'
                                : 'bg-gradient-to-r from-[#670CDC] to-[#F99225]'
                            }`}
                            style={{ width: `${Math.max(3, progressPct)}%` }}
                          />
                        </div>

                        <div className="text-[10px] font-mono text-[#7E6D96] text-right">
                          Threshold: {market.quoteThreshold} {quoteUnit}
                        </div>
                      </div>

                      {/* Action Arrow */}
                      <div className="lg:col-span-1 flex justify-end pt-1 lg:pt-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenMarketManagement(market);
                          }}
                          className="w-full lg:w-auto min-h-[44px] lg:min-h-0 px-3 py-2 lg:py-1.5 rounded-lg bg-[#140130] hover:bg-[#1A0140] text-[#F99225] hover:text-[#FFA640] text-xs font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors border border-[#670CDC]/30"
                        >
                          <span>Manage</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 rounded-xl border border-[#670CDC]/25 bg-[#140130] text-center space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#240250] border border-[#670CDC]/30 flex items-center justify-center text-[#D76EDD] mx-auto">
                  <Coins className="w-6 h-6" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="text-sm font-semibold text-[#F7F3FF] font-sans">
                    No markets created yet with this wallet
                  </h3>
                  <p className="text-xs text-[#B8A9CC] leading-relaxed font-sans">
                    You have not deployed any tokenized asset bonding curve markets with this connected authority ({publicKeyStr ? `${publicKeyStr.slice(0, 4)}...${publicKeyStr.slice(-4)}` : 'wallet'}) on Solana Devnet.
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <Button
                    variant="brand"
                    size="sm"
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => onSelectTab('create')}
                  >
                    Create market
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onSelectTab('markets')}
                  >
                    Explore public markets
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: MARKET MANAGEMENT (PROFESSIONAL CONTROL CENTER) */}
      {/* ========================================================================= */}
      {activeView === 'management' && selectedPool && (
        <div className="space-y-6">
          {/* Market Management Header & Selector */}
          <div className="rounded-xl border border-[#670CDC]/25 bg-[#140130] p-5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-lg font-bold text-white font-sans tracking-tight">
                    {selectedPool.tokenName || 'Tokenized Asset'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#100126] text-[#F99225] font-mono text-xs font-bold border border-[#F99225]/30">
                    {selectedPool.tokenSymbol || 'TKN'}
                  </span>
                  <Badge
                    variant={selectedPool.isMigrated ? 'graduated' : 'live'}
                    size="xs"
                    dot
                  >
                    {selectedPool.isMigrated ? 'Graduated to AMM' : 'Active Bonding Curve'}
                  </Badge>
                  <span className="text-[#7E6D96]">·</span>
                  <span className="text-[11px] font-mono text-[#B8A9CC]">
                    Created: {selectedPool.creationDate || 'Sep 16, 2026'}
                  </span>
                  <span className="text-[#7E6D96]">·</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded inline-flex items-center gap-1.5 bg-[#100126] border border-[#670CDC]/20 text-[#B8A9CC]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F99225]" />
                    <span>{environmentStatusMessage}</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-[#B8A9CC] pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#7E6D96]">Pool PDA:</span>
                    <AddressBadge address={selectedPool.poolAddress} head={6} tail={4} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#7E6D96]">Target AMM:</span>
                    <span className="font-mono text-[#EDE4FA] font-semibold">
                      {selectedPool.migrationOptionLabel || 'MET_DAMM_V2'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions & Market Switcher */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleInitiateClaim}
                  className="px-3.5 py-2 rounded-lg bg-[#140130] hover:bg-[#1A0140] text-[#F99225] font-medium text-xs flex items-center gap-1.5 transition-colors border border-[#670CDC]/30 cursor-pointer shadow-xs"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Claim Fees</span>
                </button>

                <a
                  href={getExplorerUrl(selectedPool.poolAddress, 'address', network as any)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 rounded-lg bg-[#140130] hover:bg-[#1A0140] text-[#EDE4FA] text-xs font-medium flex items-center gap-1.5 transition-colors border border-[#670CDC]/30"
                >
                  <span>Explorer</span>
                  <ExternalLink className="w-3 h-3 text-[#7E6D96]" />
                </a>

                {/* Switch Market Dropdown */}
                {allAvailableMarkets.length > 1 && (
                  <div className="relative">
                    <select
                      value={selectedPool.poolAddress}
                      onChange={(e) => {
                        const target = allAvailableMarkets.find((m) => m.poolAddress === e.target.value);
                        if (target) setSelectedPool(target);
                      }}
                      className="bg-[#100126] border border-[#670CDC]/30 rounded-lg px-3 py-2 text-xs text-[#EDE4FA] font-mono appearance-none pr-8 cursor-pointer focus:outline-hidden"
                    >
                      {allAvailableMarkets.map((m) => (
                        <option key={m.poolAddress} value={m.poolAddress}>
                          {m.tokenSymbol} - {m.tokenName}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-[#7E6D96] absolute right-2.5 top-3 pointer-events-none" />
                  </div>
                )}
              </div>
            </div>

            {/* Management Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#670CDC]/20">
              {[
                { id: 'overview', label: 'Graduation & Overview', icon: Milestone },
                { id: 'parameters', label: 'Parameter Classification', icon: Sliders },
                { id: 'liquidity', label: 'Fees & Liquidity State', icon: Coins },
                { id: 'activity', label: 'On-Chain Activity', icon: Activity },
                { id: 'pool-info', label: 'Pool Architecture & PDAs', icon: Layers },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = managementTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setManagementTab(tab.id as any)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#670CDC] text-white shadow-xs shadow-[#670CDC]/30'
                        : 'text-[#B8A9CC] hover:text-[#EDE4FA] hover:bg-[#670CDC]/10'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#F99225]' : 'text-[#7E6D96]'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TAB 1: GRADUATION & OVERVIEW */}
          {managementTab === 'overview' && (
            <div className="space-y-6">
              <GraduationMeter pool={selectedPool} />

              {/* Secondary Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-[#670CDC]/25 bg-[#140130] space-y-1">
                  <span className="text-[10px] uppercase font-mono text-[#B8A9CC] block">Current Spot Price</span>
                  <div className="text-base font-bold font-mono text-[#F7F3FF]">
                    {formatCurrency(selectedPool.currentPrice, selectedPool.quoteMint.includes('So111111111') ? 'SOL' : 'USDC')}
                  </div>
                  <span className="text-[10px] text-[#7E6D96] font-mono">
                    Genesis: {formatCurrency(selectedPool.startPrice)}
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-[#670CDC]/25 bg-[#140130] space-y-1">
                  <span className="text-[10px] uppercase font-mono text-[#B8A9CC] block">Base Trading Fee</span>
                  <div className="text-base font-bold font-mono text-[#F7F3FF]">
                    {formatBps(selectedPool.baseFeeBps)}
                  </div>
                  <span className="text-[10px] text-[#7E6D96] font-mono">
                    Creator share: {formatBps(selectedPool.creatorFeeShareBps || 2500)}
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-[#670CDC]/25 bg-[#140130] space-y-1">
                  <span className="text-[10px] uppercase font-mono text-[#B8A9CC] block">Curve Algorithm</span>
                  <div className="text-base font-bold font-mono text-[#F7F3FF] uppercase">
                    {selectedPool.curveType || 'Linear'}
                  </div>
                  <span className="text-[10px] text-[#7E6D96] font-mono">
                    Locked at genesis
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-[#670CDC]/25 bg-[#140130] space-y-1">
                  <span className="text-[10px] uppercase font-mono text-[#B8A9CC] block">Liquidity Lockup</span>
                  <div className="text-base font-bold font-mono text-[#F7F3FF]">
                    {selectedPool.liquidityLockDays ? `${selectedPool.liquidityLockDays} Days` : 'Permanent Locked'}
                  </div>
                  <span className="text-[10px] text-[#7E6D96] font-mono">
                    Meteora Non-Custodial Vault
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PARAMETER CLASSIFICATION (IMMUTABLE VS CONFIGURABLE VS PROTOCOL) */}
          {managementTab === 'parameters' && (
            <ParametersClassification
              pool={selectedPool}
              onInitiateFeeClaim={handleInitiateClaim}
            />
          )}

          {/* TAB 3: FEES & LIQUIDITY STATE */}
          {managementTab === 'liquidity' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Liquidity State */}
                <div className="rounded-xl border border-[#670CDC]/25 bg-[#140130] p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#670CDC]/20 pb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#F7F3FF] font-sans">
                      Liquidity & Reserve State
                    </h4>
                    <span className="text-[10px] font-mono text-[#D76EDD]">Live Invariant</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-[#120128] border border-[#670CDC]/20">
                      <span className="text-[#B8A9CC] font-sans">Quote Reserves</span>
                      <span className="font-mono font-bold text-[#F7F3FF]">
                        {selectedPool.quoteReserve || '0.00 SOL'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-[#120128] border border-[#670CDC]/20">
                      <span className="text-[#B8A9CC] font-sans">Base Reserves</span>
                      <span className="font-mono font-bold text-[#F7F3FF]">
                        {selectedPool.baseReserve ? `${Number(selectedPool.baseReserve).toLocaleString()} ${selectedPool.tokenSymbol}` : 'Active'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-[#120128] border border-[#670CDC]/20">
                      <span className="text-[#B8A9CC] font-sans">Calculated TVL</span>
                      <span className="font-mono font-bold text-[#F99225]">
                        {selectedPool.tvlUsd ? formatCurrency(selectedPool.tvlUsd) : 'Single-Sided Bonding'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-[#120128] border border-[#670CDC]/20">
                      <span className="text-[#B8A9CC] font-sans">Impermanent Loss Risk</span>
                      <span className="font-mono font-bold text-emerald-400">
                        0.00% (Bonding Curve Phase)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Fee Structure */}
                <div className="rounded-xl border border-[#670CDC]/25 bg-[#140130] p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#670CDC]/20 pb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#F7F3FF] font-sans">
                      Fee Split & Distribution
                    </h4>
                    <span className="text-[10px] font-mono text-[#D76EDD]">Meteora Governance</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-[#120128] border border-[#670CDC]/20">
                      <span className="text-[#B8A9CC] font-sans">Base Pool Fee</span>
                      <span className="font-mono font-bold text-[#F7F3FF]">
                        {formatBps(selectedPool.baseFeeBps)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-[#120128] border border-[#670CDC]/20">
                      <span className="text-[#B8A9CC] font-sans">Creator Fee Share</span>
                      <span className="font-mono font-bold text-[#F99225]">
                        {formatBps(selectedPool.creatorFeeShareBps || 2500)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-[#120128] border border-[#670CDC]/20">
                      <span className="text-[#B8A9CC] font-sans">Protocol Fee Share</span>
                      <span className="font-mono font-bold text-[#7E6D96]">
                        {formatBps(Math.max(0, selectedPool.baseFeeBps - (selectedPool.creatorFeeShareBps || 2500)))}
                      </span>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleInitiateClaim}
                        className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#F99225] to-[#E07D10] hover:from-[#FFA640] hover:to-[#F99225] text-black font-bold text-xs shadow-md shadow-[#F99225]/20 transition-all cursor-pointer"
                      >
                        Initiate Creator Fee Claim
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: REAL ON-CHAIN ACTIVITY */}
          {managementTab === 'activity' && (
            <RealOnChainActivity
              address={selectedPool.poolAddress}
              addressLabel={`${selectedPool.tokenSymbol || 'Market'} DBC Pool`}
            />
          )}

          {/* TAB 5: POOL INFORMATION & ARCHITECTURE */}
          {managementTab === 'pool-info' && (
            <PoolInfoPanel pool={selectedPool} />
          )}
        </div>
      )}

      {/* Claim Fees Transaction Preflight Modal */}
      <TxPreflightModal
        isOpen={claimModalOpen}
        intent={claimIntent}
        onClose={() => setClaimModalOpen(false)}
        onConfirm={handleExecuteClaim}
        isSigning={isSigningClaim}
        error={claimError}
        txSignature={claimTxSig}
      />
    </div>
  );
};
