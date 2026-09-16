import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Activity,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  Layers,
  ArrowUpDown,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { REFERENCE_POOLS } from '../../config/constants';
import { DBCPoolState } from '../../types';
import { AddressBadge } from '../common/AddressBadge';
import { formatCurrency, formatPercent, formatBps, formatNumber } from '../../utils/format';
import { useNetwork } from '../../context/NetworkContext';
import { fetchOnChainPool } from '../../services/meteora';
import { inspectSplTokenMint } from '../../services/solana';
import { isValidSolanaAddress } from '../../utils/security';
import { MarketDetailView } from './MarketDetailView';
import { NavigationTab } from '../layout/Header';
import { Table, Column } from '../ui/Table';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { ProvenanceBadge, ProvenanceLegend } from '../common/DataProvenance';
import { BlockchainContextBar } from '../common/BlockchainContextBar';
import { VerificationStatusBadge } from '../passport/VerificationStatusBadge';
import { getAssetProfile } from '../../data/assetProfiles';
import { FileCheck2 } from 'lucide-react';

interface MarketsViewProps {
  onSelectTab: (tab: NavigationTab) => void;
  onSelectPoolForInspector?: (pool: DBCPoolState) => void;
  selectedMarketAddress?: string | null;
  onOpenWalletModal?: () => void;
}

export const MarketsView: React.FC<MarketsViewProps> = ({
  onSelectTab,
  onSelectPoolForInspector,
  selectedMarketAddress,
  onOpenWalletModal,
}) => {
  const { connection, network, rpcConfig } = useNetwork();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'NEAR_GRADUATION' | 'GRADUATED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchingOnChain, setIsSearchingOnChain] = useState<boolean>(false);
  const [onChainResult, setOnChainResult] = useState<DBCPoolState | null>(null);
  const [onChainSearchError, setOnChainSearchError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'tvl' | 'price' | 'progress' | 'name' | 'volume'>('tvl');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Map curated reference pools with full institutional telemetry
  const standardPools: DBCPoolState[] = useMemo(() => {
    return REFERENCE_POOLS.map((ref) => ({
      poolAddress: ref.poolAddress,
      configAddress: 'Config7vS4Z6hT9bK3gR3RwhK6eUuWkL2kRjV7K4Uv',
      baseMint: ref.baseMint,
      quoteMint: ref.quoteMint,
      baseVault: 'VaultB1cT2eR3uK6fP5hW9jQ2mD7zC4vB8xM1q9aL4nS',
      quoteVault: 'VaultQ2mD7zC4vB8xM1q9aL4nS7vX8bY1cT2eR3uK6fP',
      creator: 'Auth4vB8xM1q9aL4nS7vX8bY1cT2eR3uK6fP5hW9jQ2m',
      migrationOption: ref.migrationOption === 'MET_DAMM' ? 0 : 1,
      migrationOptionLabel: ref.migrationOption,
      baseReserve: '1000000000',
      quoteReserve: '50000000',
      quoteThreshold: ref.quoteThreshold,
      currentPrice: ref.currentPrice,
      startPrice: ref.startPrice,
      migrationPrice: ref.migrationPrice,
      referencePrice: ref.referencePrice,
      referencePriceLabel: ref.referencePriceLabel,
      quoteCurveProgressPct: ref.progressPct,
      baseCurveProgressPct: ref.progressPct,
      isMigrated: ref.isMigrated,
      baseFeeBps: ref.feeBps,
      tokenName: ref.name,
      tokenSymbol: ref.symbol,
      rwaCategory: ref.rwaCategory,
      tvlUsd: ref.tvlUsd,
      curveType: ref.curveType,
      antiSniperSlots: ref.antiSniperSlots,
      liquidityLockDays: ref.liquidityLockDays,
      creatorFeeShareBps: ref.creatorFeeShareBps,
      totalSupply: ref.totalSupply,
      curveAllocationTokens: ref.curveAllocationTokens,
      network: network,
      description: ref.description,
      riskNotes: ref.riskNotes,
      recentTxs: ref.recentTxs,
      activity24h: ref.activity24h,
    }));
  }, [network]);

  // Initial active detail pool if selectedMarketAddress is passed
  const initialPool = useMemo(() => {
    if (!selectedMarketAddress) return null;
    return standardPools.find((p) => p.poolAddress === selectedMarketAddress) || null;
  }, [selectedMarketAddress, standardPools]);

  const [activeDetailPool, setActiveDetailPool] = useState<DBCPoolState | null>(initialPool);

  // If initialPool changes via prop, update activeDetailPool
  React.useEffect(() => {
    if (selectedMarketAddress) {
      const match = standardPools.find((p) => p.poolAddress === selectedMarketAddress);
      if (match) setActiveDetailPool(match);
    }
  }, [selectedMarketAddress, standardPools]);

  // Live on-chain account lookup handler
  const handleOnChainLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    setOnChainSearchError(null);
    setOnChainResult(null);

    if (!query) return;

    if (!isValidSolanaAddress(query)) {
      setOnChainSearchError('Invalid Solana address format. Must be 32-44 characters base58 string.');
      return;
    }

    setIsSearchingOnChain(true);
    try {
      const pool = await fetchOnChainPool(connection, rpcConfig.endpoint, query);
      if (pool) {
        setOnChainResult(pool);
        return;
      }

      const mintInfo = await inspectSplTokenMint(connection, query);
      if (mintInfo) {
        setOnChainResult({
          poolAddress: query,
          configAddress: '',
          baseMint: query,
          quoteMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          baseVault: '',
          quoteVault: '',
          creator: mintInfo.mintAuthority || '',
          migrationOption: 1,
          migrationOptionLabel: 'MET_DAMM_V2',
          baseReserve: mintInfo.supply || '0',
          quoteReserve: '0',
          quoteThreshold: 'Uninitialized DBC',
          currentPrice: 0,
          startPrice: 0,
          migrationPrice: 0,
          quoteCurveProgressPct: 0,
          baseCurveProgressPct: 0,
          isMigrated: false,
          baseFeeBps: 50,
          tokenName: mintInfo.name,
          tokenSymbol: mintInfo.symbol,
          rwaCategory: 'Structured Note',
          tvlUsd: 0,
          network: network,
        });
        return;
      }

      setOnChainSearchError(`No Meteora DBC pool or SPL Token Mint found on Solana ${network} for: ${query}`);
    } catch (err: any) {
      setOnChainSearchError(err?.message || 'RPC communication error while querying account.');
    } finally {
      setIsSearchingOnChain(false);
    }
  };

  // Combine standard and on-chain queried pools
  const allPools = useMemo(() => {
    if (onChainResult) {
      const exists = standardPools.some((p) => p.poolAddress === onChainResult.poolAddress);
      return exists ? standardPools : [onChainResult, ...standardPools];
    }
    return standardPools;
  }, [standardPools, onChainResult]);

  // Filter & Search Logic
  const filteredPools = useMemo(() => {
    return allPools.filter((pool) => {
      // 1. Category Filter
      if (selectedCategory !== 'ALL' && pool.rwaCategory !== selectedCategory) {
        return false;
      }

      // 2. Status Filter
      if (statusFilter === 'ACTIVE' && pool.isMigrated) {
        return false;
      }
      if (statusFilter === 'GRADUATED' && !pool.isMigrated) {
        return false;
      }
      if (statusFilter === 'NEAR_GRADUATION' && (pool.isMigrated || pool.quoteCurveProgressPct < 60)) {
        return false;
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = pool.tokenName?.toLowerCase().includes(q);
        const symMatch = pool.tokenSymbol?.toLowerCase().includes(q);
        const addrMatch = pool.poolAddress.toLowerCase().includes(q);
        const mintMatch = pool.baseMint.toLowerCase().includes(q);
        return nameMatch || symMatch || addrMatch || mintMatch;
      }

      return true;
    });
  }, [allPools, selectedCategory, statusFilter, searchQuery]);

  // Sorting Logic
  const sortedPools = useMemo(() => {
    return [...filteredPools].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'tvl') {
        comparison = (a.tvlUsd || 0) - (b.tvlUsd || 0);
      } else if (sortField === 'price') {
        comparison = a.currentPrice - b.currentPrice;
      } else if (sortField === 'progress') {
        comparison = a.quoteCurveProgressPct - b.quoteCurveProgressPct;
      } else if (sortField === 'name') {
        comparison = (a.tokenName || '').localeCompare(b.tokenName || '');
      } else if (sortField === 'volume') {
        const volA = a.activity24h?.volumeUsd || 0;
        const volB = b.activity24h?.volumeUsd || 0;
        comparison = volA - volB;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredPools, sortField, sortDirection]);

  // Categories list
  const categories = ['ALL', 'Treasuries', 'Real Estate', 'Private Credit', 'Structured Note'];

  // If a pool detail terminal is active, render the full 10-section MarketDetailView!
  if (activeDetailPool) {
    return (
      <MarketDetailView
        pool={activeDetailPool}
        onBack={() => setActiveDetailPool(null)}
        onSelectTab={onSelectTab}
        onOpenWalletModal={onOpenWalletModal}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Market Directory Introduction */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
              Markets Directory
            </h1>
            <Badge variant="brand" size="xs">
              Solana {network.toUpperCase()}
            </Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Searchable on-chain directory of tokenized RWA dynamic bonding curves with algorithmic price discovery
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<FileCheck2 className="w-3.5 h-3.5 text-amber-400" />}
            onClick={() => onSelectTab('passport')}
          >
            Asset Passports
          </Button>
          <Button
            variant="brand"
            size="sm"
            onClick={() => onSelectTab('create')}
          >
            Launch New Market
          </Button>
        </div>
      </div>

      {/* Explicit Network, Connected Wallet, and DBC Program State */}
      <BlockchainContextBar screenTitle="Markets Directory" />

      {/* SEARCH, FILTER & QUERY BAR */}
      <div className="rounded-xl border border-zinc-800 bg-[#090d16] p-4 space-y-3">
        <form onSubmit={handleOnChainLookup} className="flex flex-col md:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by asset name, symbol, pool address, or token mint..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0d121f] border border-zinc-700/80 rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-hidden focus:border-violet-500 font-mono transition-colors"
            />
          </div>

          <Button
            type="submit"
            variant="secondary"
            size="sm"
            isLoading={isSearchingOnChain}
            disabled={!searchQuery.trim()}
          >
            Query On-Chain RPC
          </Button>
        </form>

        {/* On-Chain Lookup Error Feedback */}
        {onChainSearchError && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{onChainSearchError}</span>
          </div>
        )}

        {/* Filters & Sorting Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/60">
          {/* Asset Type Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[11px] text-zinc-400 mr-1 flex items-center gap-1 font-sans">
              <Filter className="w-3 h-3 text-zinc-500" />
              <span>Asset Type:</span>
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-violet-600 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-[#0d121f] p-0.5 rounded-lg border border-zinc-800">
            {(
              [
                { id: 'ALL', label: 'All Status' },
                { id: 'ACTIVE', label: 'Active Bonding' },
                { id: 'NEAR_GRADUATION', label: 'Near Graduation (>60%)' },
                { id: 'GRADUATED', label: 'Graduated' },
              ] as const
            ).map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                  statusFilter === st.id
                    ? 'bg-[#1a2336] text-amber-300 font-bold'
                    : 'text-zinc-400 hover:text-zinc-300'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-400 font-sans">Sort By:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as any)}
              className="bg-[#0d121f] border border-zinc-700/80 rounded-lg px-2.5 py-1 text-xs text-zinc-200 font-mono focus:outline-hidden"
            >
              <option value="tvl">Total Liquidity</option>
              <option value="price">Spot Price</option>
              <option value="progress">Graduation Progress</option>
              <option value="volume">24h Volume</option>
              <option value="name">Asset Name</option>
            </select>
            <button
              type="button"
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="p-1.5 rounded-lg bg-[#0d121f] border border-zinc-800 text-zinc-400 hover:text-zinc-200"
              title={`Sort ${sortDirection === 'asc' ? 'Ascending' : 'Descending'}`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* DIRECTORY TABLE / CARDS */}
      <Card>
        <div className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono-nums">
              <thead>
                <tr className="border-b border-zinc-800 bg-[#0c1018] text-[10px] uppercase font-sans text-zinc-400">
                  <th className="py-3 px-4 font-semibold">Asset / Market</th>
                  <th className="py-3 px-3 font-semibold">Asset Type</th>
                  <th className="py-3 px-3 font-semibold">Current Price</th>
                  <th className="py-3 px-3 font-semibold">Reference Price</th>
                  <th className="py-3 px-3 font-semibold">Total Liquidity</th>
                  <th className="py-3 px-3 font-semibold">24h Activity</th>
                  <th className="py-3 px-3 font-semibold">Curve Status</th>
                  <th className="py-3 px-3 font-semibold">Graduation</th>
                  <th className="py-3 px-3 font-semibold">Network</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {sortedPools.length > 0 ? (
                  sortedPools.map((pool) => {
                    const quoteSymbol = pool.quoteMint.includes('So111') ? 'SOL' : 'USDC';

                    return (
                      <tr
                        key={pool.poolAddress}
                        onClick={() => {
                          setActiveDetailPool(pool);
                          if (onSelectPoolForInspector) onSelectPoolForInspector(pool);
                        }}
                        className="hover:bg-zinc-900/40 cursor-pointer transition-colors group"
                      >
                        {/* 1. Asset Name, Symbol, and Verification Badge */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="font-sans font-bold text-zinc-100 group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                              <span>{pool.tokenName || 'Unnamed Pool'}</span>
                              <span className="font-mono text-zinc-400 text-[10px]">
                                (${pool.tokenSymbol || 'TKN'})
                              </span>
                            </div>
                            <VerificationStatusBadge
                              status={getAssetProfile(pool.baseMint)?.verificationStatus || (pool.rwaCategory === 'Treasuries' ? 'Verified' : 'Issuer provided')}
                              size="xs"
                            />
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono mt-0.5 flex items-center gap-1.5">
                            <span>PDA: {pool.poolAddress.slice(0, 4)}...{pool.poolAddress.slice(-4)}</span>
                          </div>
                        </td>

                        {/* 2. Asset Type */}
                        <td className="py-3 px-3">
                          <Badge variant="brand" size="xs">
                            {pool.rwaCategory || 'RWA'}
                          </Badge>
                        </td>

                        {/* 3. Current Price */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-amber-400">
                            {formatCurrency(pool.currentPrice, quoteSymbol === 'SOL' ? 'SOL' : 'USD')}
                          </div>
                          <div className="text-[9px] text-zinc-400 font-mono">
                            {quoteSymbol}
                          </div>
                        </td>

                        {/* 4. Reference Price if available */}
                        <td className="py-3 px-3">
                          {pool.referencePrice ? (
                            <div>
                              <span className="text-zinc-200 font-semibold">
                                {formatCurrency(pool.referencePrice)}
                              </span>
                              <span className="block text-[9px] text-sky-400 font-sans">
                                {pool.referencePriceLabel || 'NAV'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-zinc-400 text-[10px] font-sans">
                              Unavailable
                            </span>
                          )}
                        </td>

                        {/* 5. Total Liquidity */}
                        <td className="py-3 px-3">
                          <div className="font-semibold text-zinc-200">
                            {formatCurrency(pool.tvlUsd || 0)}
                          </div>
                          <div className="text-[9px] text-zinc-400 font-mono">
                            Vault Reserve TVL
                          </div>
                        </td>

                        {/* 6. 24h Activity if available */}
                        <td className="py-3 px-3">
                          {pool.activity24h && pool.activity24h.isIndexed ? (
                            <div>
                              <span className="text-zinc-200 font-semibold">
                                {formatCurrency(pool.activity24h.volumeUsd)}
                              </span>
                              <span className="block text-[9px] text-zinc-400 font-sans">
                                {pool.activity24h.tradeCount} swaps
                              </span>
                            </div>
                          ) : (
                            <div className="text-[10px] text-zinc-400 font-sans">
                              <span>Unavailable</span>
                              <span className="block text-[9px] text-zinc-400">(No Indexer)</span>
                            </div>
                          )}
                        </td>

                        {/* 7. Curve Status */}
                        <td className="py-3 px-3">
                          {pool.isMigrated ? (
                            <Badge variant="graduated" size="xs" dot>
                              Graduated
                            </Badge>
                          ) : (
                            <Badge variant="live" size="xs" dot>
                              Active Curve
                            </Badge>
                          )}
                        </td>

                        {/* 8. Graduation Status */}
                        <td className="py-3 px-3">
                          <div className="w-28 space-y-1">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-amber-400 font-bold">{pool.quoteCurveProgressPct.toFixed(1)}%</span>
                              <span className="text-zinc-400">{pool.quoteThreshold}</span>
                            </div>
                            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  pool.isMigrated
                                    ? 'bg-emerald-400'
                                    : 'bg-gradient-to-r from-violet-500 to-amber-400'
                                }`}
                                style={{ width: `${Math.min(100, pool.quoteCurveProgressPct)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* 9. Network */}
                        <td className="py-3 px-3">
                          <span className="text-[11px] font-mono text-zinc-300">
                            Solana {network.toUpperCase()}
                          </span>
                        </td>

                        {/* 10. Market Detail Navigation */}
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="secondary"
                            size="xs"
                            rightIcon={<ArrowUpRight className="w-3 h-3" />}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDetailPool(pool);
                              if (onSelectPoolForInspector) onSelectPoolForInspector(pool);
                            }}
                          >
                            Open Terminal
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-zinc-500 space-y-2">
                      <p className="text-sm">No markets found matching the filter criteria.</p>
                      <Button
                        variant="subtle"
                        size="xs"
                        onClick={() => {
                          setSelectedCategory('ALL');
                          setStatusFilter('ALL');
                          setSearchQuery('');
                        }}
                      >
                        Reset All Filters
                      </Button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Global Data Honesty & Provenance Legend */}
      <ProvenanceLegend />
    </div>
  );
};
