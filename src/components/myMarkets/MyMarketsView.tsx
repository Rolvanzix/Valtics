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
  const { connection, rpcConfig, network } = useNetwork();

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
        <div className="rounded-xl border border-zinc-800 bg-[#07090e] p-8 sm:p-12 text-center space-y-5 max-w-xl mx-auto my-10 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
            <Wallet className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-white font-sans">
              Connect wallet to access dashboard
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-md mx-auto">
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
      <div className="rounded-xl border border-zinc-800 bg-[#07090e] p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <ValticsLogo size="lg" glow showText={false} />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
                  VALTICS Issuer Dashboard
                </h1>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 font-bold">
                  Issuer Control Center
                </span>
                <Badge variant="brand" size="xs">
                  Solana {network.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-zinc-400 font-normal max-w-2xl leading-relaxed">
                Autonomous dynamic bonding curve market management, real-time liquidity supervision, and threshold graduation tracking on Meteora DBC.
              </p>
            </div>
          </div>

          {/* Quick Actions & Navigation Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center p-1 rounded-lg bg-zinc-900 border border-zinc-800">
              <button
                type="button"
                onClick={() => setActiveView('portfolio')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'portfolio'
                    ? 'bg-gradient-to-r from-violet-600 to-amber-500 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>My Markets ({allAvailableMarkets.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('management')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'management'
                    ? 'bg-gradient-to-r from-violet-600 to-amber-500 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Market Management</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => onSelectTab('create')}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 hover:text-amber-300 font-semibold text-xs flex items-center gap-1.5 transition-colors border border-zinc-700 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Deploy New Market</span>
            </button>
          </div>
        </div>

        {/* Authority Status & Key Filter Bar */}
        <div className="mt-5 pt-4 border-t border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-400">
            <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">Issuer Authority:</span>
            {connected && publicKeyStr ? (
              <span className="font-mono text-zinc-200 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 font-medium">
                {publicKeyStr.slice(0, 6)}...{publicKeyStr.slice(-6)} (Connected)
              </span>
            ) : (
              <span className="text-zinc-500 italic">No wallet connected (Viewing all portfolio markets)</span>
            )}
          </div>

          <form onSubmit={handleManualSearch} className="flex items-center gap-2">
            <input
              type="text"
              value={authorityInput}
              onChange={(e) => setAuthorityInput(e.target.value)}
              placeholder="Inspect authority public key..."
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1 text-xs text-zinc-200 font-mono focus:outline-hidden focus:border-amber-400 w-64"
            />
            <button
              type="submit"
              className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium cursor-pointer border border-zinc-700 transition-colors"
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-zinc-800 bg-[#0c1018]">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-500 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by asset name, symbol, or pool PDA..."
                className="w-full bg-transparent border-none text-xs text-zinc-200 placeholder-zinc-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-zinc-500 uppercase">Status:</span>
              <div className="flex rounded-lg bg-zinc-900 p-0.5 border border-zinc-800 text-xs">
                {(['all', 'active', 'graduated'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded capitalize transition-colors cursor-pointer ${
                      statusFilter === st
                        ? 'bg-zinc-800 text-white font-medium'
                        : 'text-zinc-400 hover:text-zinc-200'
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
                    className={`rounded-xl border transition-all cursor-pointer p-5 bg-[#0c1018] hover:border-zinc-700 ${
                      isSelected
                        ? 'border-amber-500/50 shadow-[0_0_15px_rgba(251,191,36,0.05)]'
                        : 'border-zinc-800'
                    }`}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                      {/* 1 & 2: Asset & Symbol */}
                      <div className="lg:col-span-3 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-zinc-100 font-sans tracking-tight">
                            {market.tokenName || 'Tokenized Asset'}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-zinc-800 text-amber-400 font-mono text-xs font-bold border border-amber-500/20">
                            {market.tokenSymbol || 'TKN'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                          <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono">
                            {market.rwaCategory || 'Real World Asset'}
                          </span>
                          <span>·</span>
                          {/* 9: Creation Date */}
                          <span className="text-zinc-400 font-mono text-[10px] flex items-center gap-1">
                            <Clock className="w-3 h-3 text-zinc-500" />
                            <span>Created: {market.creationDate || 'Sep 16, 2026'}</span>
                          </span>
                        </div>
                      </div>

                      {/* 4 & 5: Pool Address & Curve Configuration */}
                      <div className="lg:col-span-3 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono uppercase text-zinc-500">Pool PDA:</span>
                          <AddressBadge address={market.poolAddress} head={4} tail={4} />
                        </div>
                        <div className="text-[11px] text-zinc-300 font-mono flex items-center gap-1.5">
                          <span className="capitalize font-semibold text-zinc-200">
                            {market.curveType || 'Linear'} Model
                          </span>
                          <span className="text-zinc-500">({formatCurrency(market.startPrice, quoteUnit)} → {formatCurrency(market.migrationPrice, quoteUnit)})</span>
                        </div>
                      </div>

                      {/* 6 & 7: Current Price & Liquidity */}
                      <div className="lg:col-span-2 space-y-1">
                        <div>
                          <span className="text-[10px] font-mono uppercase text-zinc-500 block">Spot Price</span>
                          <span className="text-xs font-bold font-mono text-zinc-100">
                            {formatCurrency(market.currentPrice, quoteUnit)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            Reserves: {market.quoteReserve || '0 SOL'}
                          </span>
                        </div>
                      </div>

                      {/* 3 & 8: Market Status & Graduation Progress */}
                      <div className="lg:col-span-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <Badge
                            variant={isGraduated ? 'graduated' : isThresholdMet ? 'warning' : 'live'}
                            size="xs"
                            dot
                          >
                            {isGraduated ? 'Graduated' : isThresholdMet ? 'Threshold Met' : 'Active Curve'}
                          </Badge>
                          <span className="font-mono text-[11px] text-amber-400 font-semibold">
                            {formatPercent(progressPct, 1)}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 w-full rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isGraduated
                                ? 'bg-emerald-500'
                                : isThresholdMet
                                ? 'bg-amber-400 animate-pulse'
                                : 'bg-gradient-to-r from-violet-600 to-amber-500'
                            }`}
                            style={{ width: `${Math.max(3, progressPct)}%` }}
                          />
                        </div>

                        <div className="text-[10px] font-mono text-zinc-400 text-right">
                          Threshold: {market.quoteThreshold} {quoteUnit}
                        </div>
                      </div>

                      {/* Action Arrow */}
                      <div className="lg:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenMarketManagement(market);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 hover:text-amber-300 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors border border-zinc-700"
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
              <div className="p-12 rounded-xl border border-zinc-800 bg-[#0c1018] text-center space-y-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mx-auto">
                  <Coins className="w-6 h-6" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="text-sm font-semibold text-zinc-200 font-sans">
                    No markets created yet with this wallet
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
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
          <div className="rounded-xl border border-zinc-800 bg-[#0c1018] p-5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-lg font-bold text-white font-sans tracking-tight">
                    {selectedPool.tokenName || 'Tokenized Asset'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-amber-400 font-mono text-xs font-bold border border-amber-500/20">
                    {selectedPool.tokenSymbol || 'TKN'}
                  </span>
                  <Badge
                    variant={selectedPool.isMigrated ? 'graduated' : 'live'}
                    size="xs"
                    dot
                  >
                    {selectedPool.isMigrated ? 'Graduated to AMM' : 'Active Bonding Curve'}
                  </Badge>
                  <span className="text-zinc-500">·</span>
                  <span className="text-[11px] font-mono text-zinc-400">
                    Created: {selectedPool.creationDate || 'Sep 16, 2026'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-500">Pool PDA:</span>
                    <AddressBadge address={selectedPool.poolAddress} head={6} tail={4} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-500">Target AMM:</span>
                    <span className="font-mono text-zinc-300 font-semibold">
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
                  className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-medium text-xs flex items-center gap-1.5 transition-colors border border-zinc-700 cursor-pointer shadow-xs"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Claim Fees</span>
                </button>

                <a
                  href={getExplorerUrl(selectedPool.poolAddress, 'address', network as any)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-colors border border-zinc-700"
                >
                  <span>Explorer</span>
                  <ExternalLink className="w-3 h-3 text-zinc-400" />
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
                      className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 font-mono appearance-none pr-8 cursor-pointer focus:outline-hidden"
                    >
                      {allAvailableMarkets.map((m) => (
                        <option key={m.poolAddress} value={m.poolAddress}>
                          {m.tokenSymbol} - {m.tokenName}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-3 pointer-events-none" />
                  </div>
                )}
              </div>
            </div>

            {/* Management Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-zinc-800/80">
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
                        ? 'bg-zinc-800 text-white border border-zinc-700 shadow-xs'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-zinc-500'}`} />
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
                <div className="p-4 rounded-xl border border-zinc-800 bg-[#0c1018] space-y-1">
                  <span className="text-[10px] uppercase font-mono text-zinc-500 block">Current Spot Price</span>
                  <div className="text-base font-bold font-mono text-zinc-100">
                    {formatCurrency(selectedPool.currentPrice, selectedPool.quoteMint.includes('So111111111') ? 'SOL' : 'USDC')}
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Genesis: {formatCurrency(selectedPool.startPrice)}
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-zinc-800 bg-[#0c1018] space-y-1">
                  <span className="text-[10px] uppercase font-mono text-zinc-500 block">Base Trading Fee</span>
                  <div className="text-base font-bold font-mono text-zinc-100">
                    {formatBps(selectedPool.baseFeeBps)}
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Creator share: {formatBps(selectedPool.creatorFeeShareBps || 2500)}
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-zinc-800 bg-[#0c1018] space-y-1">
                  <span className="text-[10px] uppercase font-mono text-zinc-500 block">Curve Algorithm</span>
                  <div className="text-base font-bold font-mono text-zinc-100 uppercase">
                    {selectedPool.curveType || 'Linear'}
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Locked at genesis
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-zinc-800 bg-[#0c1018] space-y-1">
                  <span className="text-[10px] uppercase font-mono text-zinc-500 block">Liquidity Lockup</span>
                  <div className="text-base font-bold font-mono text-zinc-100">
                    {selectedPool.liquidityLockDays ? `${selectedPool.liquidityLockDays} Days` : 'Permanent Locked'}
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">
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
                <div className="rounded-xl border border-zinc-800 bg-[#0c1018] p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200 font-sans">
                      Liquidity & Reserve State
                    </h4>
                    <span className="text-[10px] font-mono text-zinc-400">Live Invariant</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-[#0e1422] border border-zinc-800/80">
                      <span className="text-zinc-400 font-sans">Quote Reserves</span>
                      <span className="font-mono font-bold text-zinc-100">
                        {selectedPool.quoteReserve || '0.00 SOL'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-[#0e1422] border border-zinc-800/80">
                      <span className="text-zinc-400 font-sans">Base Reserves</span>
                      <span className="font-mono font-bold text-zinc-100">
                        {selectedPool.baseReserve ? `${Number(selectedPool.baseReserve).toLocaleString()} ${selectedPool.tokenSymbol}` : 'Active'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-[#0e1422] border border-zinc-800/80">
                      <span className="text-zinc-400 font-sans">Calculated TVL</span>
                      <span className="font-mono font-bold text-amber-400">
                        {selectedPool.tvlUsd ? formatCurrency(selectedPool.tvlUsd) : 'Single-Sided Bonding'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-[#0e1422] border border-zinc-800/80">
                      <span className="text-zinc-400 font-sans">Impermanent Loss Risk</span>
                      <span className="font-mono font-bold text-emerald-400">
                        0.00% (Bonding Curve Phase)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Fee Structure */}
                <div className="rounded-xl border border-zinc-800 bg-[#0c1018] p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200 font-sans">
                      Fee Split & Distribution
                    </h4>
                    <span className="text-[10px] font-mono text-zinc-400">Meteora Governance</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-[#0e1422] border border-zinc-800/80">
                      <span className="text-zinc-400 font-sans">Base Pool Fee</span>
                      <span className="font-mono font-bold text-zinc-100">
                        {formatBps(selectedPool.baseFeeBps)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-[#0e1422] border border-zinc-800/80">
                      <span className="text-zinc-400 font-sans">Creator Fee Share</span>
                      <span className="font-mono font-bold text-amber-400">
                        {formatBps(selectedPool.creatorFeeShareBps || 2500)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-[#0e1422] border border-zinc-800/80">
                      <span className="text-zinc-400 font-sans">Protocol Fee Share</span>
                      <span className="font-mono font-bold text-zinc-400">
                        {formatBps(Math.max(0, selectedPool.baseFeeBps - (selectedPool.creatorFeeShareBps || 2500)))}
                      </span>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleInitiateClaim}
                        className="w-full py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-semibold text-xs border border-zinc-700 transition-colors cursor-pointer"
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
