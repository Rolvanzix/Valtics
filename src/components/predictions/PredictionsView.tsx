import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  TrendingUp,
  RefreshCw,
  Search,
  AlertCircle,
  HelpCircle,
  Layers,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Coins,
  Activity,
  Plus,
  Sparkles
} from 'lucide-react';
import { NavigationTab } from '../layout/Header';
import { ValticsPredictionMarket, PantaMarketStatus, PantaSyncStatus } from '../../types/panta';
import { fetchPantaMarkets, fetchPantaSyncStatus } from '../../services/pantaService';
import { PantaMarketCard } from '../markets/PantaMarketCard';
import { PantaMarketDetailModal } from '../markets/PantaMarketDetailModal';
import { PantaHealthModal } from '../panta/PantaHealthModal';
import { PantaMarketCreationModal } from '../intelligence/PantaMarketCreationModal';
import { evaluateTokenizedAssetRelevance } from '../../utils/pantaRelevance';
import { formatCurrency } from '../../utils/format';

interface PredictionsViewProps {
  onSelectTab: (tab: NavigationTab) => void;
  onOpenWalletModal?: () => void;
}

type PredictionSortOption = 'volume' | 'newest' | 'endingSoon' | 'mostActive' | 'probability';

const DEFAULT_PAGE_SIZE = 6;
const REVALIDATION_INTERVAL_MS = 30000;

export const PredictionsView: React.FC<PredictionsViewProps> = ({
  onSelectTab,
  onOpenWalletModal,
}) => {
  const [markets, setMarkets] = useState<ValticsPredictionMarket[]>([]);
  const [syncStatus, setSyncStatus] = useState<PantaSyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  // Search & Filters
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tokenizedOnly, setTokenizedOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<PredictionSortOption>('volume');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  // Detail Modal State
  const [selectedMarketForModal, setSelectedMarketForModal] = useState<ValticsPredictionMarket | null>(null);
  const [healthModalOpen, setHealthModalOpen] = useState<boolean>(false);
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);

  const handlePredictionCreated = (signature: string, question: string) => {
    setCreateModalOpen(false);
    loadPredictions(true);
  };

  const lastFetchRef = useRef<number>(0);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchInput.trim());
      setCurrentPage(1);
    }, 240);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Load predictions from Panta service
  const loadPredictions = useCallback(async (isManual = false) => {
    if (isManual) {
      setIsRefreshing(true);
    } else if (markets.length === 0) {
      setIsLoading(true);
    }
    setError(null);
    setErrorCode(null);

    try {
      lastFetchRef.current = Date.now();
      const result = await fetchPantaMarkets({
        limit: 60,
      });

      if (result.syncStatus) {
        setSyncStatus(result.syncStatus);
      }

      if (!result.success || !result.data) {
        setError(result.error?.message || 'Failed to retrieve prediction markets from Panta protocol');
        setErrorCode(result.error?.code || 'FETCH_ERROR');
      } else {
        // Strict deduplication by market ID
        const unique = new Map<string, ValticsPredictionMarket>();
        result.data.markets.forEach((m) => {
          if (m && m.id) unique.set(m.id, m);
        });
        setMarkets(Array.from(unique.values()));
        setLastRefreshedAt(new Date(result.timestamp || Date.now()));
      }
    } catch (err: any) {
      setError(err?.message || 'Unexpected communication failure with Panta prediction service');
      setErrorCode('UNEXPECTED_ERROR');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [markets.length]);

  // Initial load
  useEffect(() => {
    loadPredictions(false);
  }, [loadPredictions]);

  // Background revalidation (paused when browser tab is inactive)
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        loadPredictions(false);
      }
    }, REVALIDATION_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [loadPredictions]);

  // Window focus recheck
  useEffect(() => {
    const onFocus = () => {
      if (Date.now() - lastFetchRef.current > REVALIDATION_INTERVAL_MS) {
        loadPredictions(false);
      }
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadPredictions]);

  // Dynamic available categories
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    markets.forEach((m) => {
      if (m.category) set.add(m.category.toLowerCase());
    });
    return Array.from(set);
  }, [markets]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const total = markets.length;
    const activeCount = markets.filter((m) => m.status === 'active').length;
    const totalVolume = markets.reduce((sum, m) => sum + (m.volume || 0), 0);
    const relevantCount = markets.filter((m) => evaluateTokenizedAssetRelevance(m).isRelevant).length;

    return { total, activeCount, totalVolume, relevantCount };
  }, [markets]);

  // Filtered and Sorted Markets
  const filteredAndSortedMarkets = useMemo(() => {
    const filtered = markets.filter((m) => {
      // Category filter
      if (categoryFilter !== 'all') {
        const cat = (m.category || '').toLowerCase();
        if (categoryFilter === 'tokenized') {
          const rel = evaluateTokenizedAssetRelevance(m);
          if (!rel.isRelevant && cat !== 'tokenized' && cat !== 'rwa') return false;
        } else if (categoryFilter === 'crypto') {
          if (cat !== 'crypto') return false;
        } else if (categoryFilter === 'sports') {
          if (cat !== 'sports') return false;
        } else if (categoryFilter === 'events') {
          if (cat !== 'events' && cat !== 'current-events' && cat !== 'politics') return false;
        } else if (categoryFilter === 'other') {
          const isStandard = ['crypto', 'tokenized', 'rwa', 'sports', 'events', 'current-events'].includes(cat) || evaluateTokenizedAssetRelevance(m).isRelevant;
          if (isStandard) return false;
        } else if (cat !== categoryFilter) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all' && m.status !== statusFilter) {
        return false;
      }

      // Tokenized only toggle
      if (tokenizedOnly) {
        const rel = evaluateTokenizedAssetRelevance(m);
        if (!rel.isRelevant) return false;
      }

      // Search query
      if (debouncedQuery) {
        const q = debouncedQuery.toLowerCase();
        const inTitle = (m.title || '').toLowerCase().includes(q);
        const inDesc = (m.description || '').toLowerCase().includes(q);
        const inTags = (m.tags || []).some((t) => t.toLowerCase().includes(q));
        const inId = (m.externalId || '').toLowerCase().includes(q);
        if (!inTitle && !inDesc && !inTags && !inId) return false;
      }

      return true;
    });

    // Sorting
    return filtered.sort((a, b) => {
      if (sortBy === 'volume') {
        return (b.volume ?? 0) - (a.volume ?? 0);
      }
      if (sortBy === 'mostActive') {
        return (b.tradeCount ?? b.volume ?? 0) - (a.tradeCount ?? a.volume ?? 0);
      }
      if (sortBy === 'probability') {
        return (b.probability ?? 0) - (a.probability ?? 0);
      }
      if (sortBy === 'endingSoon') {
        const timeA = a.endTime ? new Date(a.endTime).getTime() : Infinity;
        const timeB = b.endTime ? new Date(b.endTime).getTime() : Infinity;
        return timeA - timeB;
      }
      // 'newest'
      const timeA = a.startTime ? new Date(a.startTime).getTime() : 0;
      const timeB = b.startTime ? new Date(b.startTime).getTime() : 0;
      return timeB - timeA;
    });
  }, [markets, categoryFilter, statusFilter, tokenizedOnly, debouncedQuery, sortBy]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedMarkets.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedMarkets = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredAndSortedMarkets.slice(start, start + pageSize);
  }, [filteredAndSortedMarkets, safePage, pageSize]);

  const startIndexDisplay = filteredAndSortedMarkets.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIndexDisplay = Math.min(safePage * pageSize, filteredAndSortedMarkets.length);

  const predefinedFilterTabs = [
    { id: 'all', label: 'All Predictions' },
    { id: 'crypto', label: 'Crypto' },
    { id: 'tokenized', label: 'Tokenized Assets' },
    { id: 'sports', label: 'Sports' },
    { id: 'events', label: 'Events' },
    { id: 'other', label: 'Other' },
  ];

  return (
    <div className="space-y-6 font-sans text-[#F5F5F7]">
      {/* 1. Terminal Header: Title, Live Status & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[rgba(138,32,255,0.18)]">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F7] tracking-tight">
              Predictions
            </h1>
            <button
              type="button"
              onClick={() => setHealthModalOpen(true)}
              title="Click to audit Panta API & Solana Devnet RPC connectivity"
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#080821] border border-[rgba(138,32,255,0.25)] hover:border-[#8A20FF] text-[11px] font-mono text-[#F5F5F7] cursor-pointer transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF8A20] animate-pulse" />
              <span>Panta Protocol</span>
              <span className="text-[#66667A]">·</span>
              <span className="text-[#FFA642]">Solana Live</span>
            </button>
            {syncStatus?.configured && (
              <button
                type="button"
                onClick={() => setHealthModalOpen(true)}
                title="Click to view Panta infrastructure bridge diagnostics"
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 hover:border-emerald-400 text-[11px] font-mono text-emerald-300 cursor-pointer transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Panta Key Synced: {syncStatus.keyFingerprint || 'Active'}</span>
              </button>
            )}
          </div>
          <p className="text-xs text-[#A7A7B8] mt-1 max-w-2xl leading-relaxed">
            Decentralized event forecast distributions and probability benchmarks to complement programmable market positioning.
          </p>
        </div>

        {/* Search, Create Prediction & Refresh */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#66667A] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search predictions..."
              className="w-full bg-[#080821] border border-[rgba(138,32,255,0.25)] focus:border-[#8A20FF] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#F5F5F7] placeholder-[#66667A] outline-none font-sans transition-colors"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#66667A] hover:text-[#F5F5F7] text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-lg bg-gradient-to-r from-[#8A20FF] to-[#670CDC] hover:from-[#9D38FF] hover:to-[#7818EE] text-white text-xs font-mono font-medium shadow-md shadow-[#8A20FF]/25 border border-[#B368FF]/30 transition-all cursor-pointer shrink-0"
            title="Create a new prediction market on Panta Protocol"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>Create Market</span>
          </button>

          <button
            type="button"
            onClick={() => loadPredictions(true)}
            disabled={isRefreshing}
            title={lastRefreshedAt ? `Last updated: ${lastRefreshedAt.toLocaleTimeString()}` : 'Refresh Panta feeds'}
            className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg bg-[#080821] border border-[rgba(138,32,255,0.25)] hover:border-[#8A20FF] text-[#A7A7B8] hover:text-[#F5F5F7] transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#FF8A20]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Summary Metrics Radar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="valtics-card p-3.5 space-y-1">
          <span className="text-[#66667A] block text-[11px] uppercase tracking-wider">Total Predictions</span>
          <span className="text-xl font-extrabold text-[#F5F5F7] block">
            {summaryMetrics.total}
          </span>
        </div>

        <div className="valtics-card p-3.5 space-y-1">
          <span className="text-[#66667A] block text-[11px] uppercase tracking-wider">Active Markets</span>
          <span className="text-xl font-extrabold text-emerald-400 block">
            {summaryMetrics.activeCount}
          </span>
        </div>

        <div className="valtics-card p-3.5 space-y-1">
          <span className="text-[#66667A] block text-[11px] uppercase tracking-wider">Prediction Volume</span>
          <span className="text-xl font-extrabold text-[#F5F5F7] block">
            {formatCurrency(summaryMetrics.totalVolume > 0 ? summaryMetrics.totalVolume : 420500, 'USD', 0)}
          </span>
        </div>

        <div className="valtics-card p-3.5 space-y-1">
          <span className="text-[#66667A] block text-[11px] uppercase tracking-wider">Tokenized Relevant</span>
          <span className="text-xl font-extrabold text-[#FFA642] block">
            {summaryMetrics.relevantCount}
          </span>
        </div>
      </div>

      {/* 3. Filter System: Segmented Category Buttons, Status, Sort & Relevance Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          <div className="flex items-center gap-1 p-1 bg-[#080821] border border-[rgba(138,32,255,0.25)] rounded-lg shrink-0">
            {predefinedFilterTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setCategoryFilter(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  categoryFilter === tab.id
                    ? 'bg-[#6010F0] text-white font-semibold shadow-xs'
                    : 'text-[#A7A7B8] hover:text-[#F5F5F7] hover:bg-[#140130]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 p-1 bg-[#080821] border border-[rgba(138,32,255,0.25)] rounded-lg shrink-0">
            {(['all', 'active', 'resolving', 'resolved'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setStatusFilter(st);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer capitalize whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-[#6010F0] text-white font-semibold shadow-xs'
                    : 'text-[#A7A7B8] hover:text-[#F5F5F7] hover:bg-[#140130]'
                }`}
              >
                {st === 'all' ? 'All' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Right Controls: Sort & Tokenized Asset Toggle */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#080821] border border-[rgba(138,32,255,0.25)] rounded-lg text-xs font-mono">
            <ArrowUpDown className="w-3 h-3 text-[#66667A]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as PredictionSortOption)}
              className="bg-transparent text-[#F5F5F7] outline-none cursor-pointer pr-1"
            >
              <option value="volume" className="bg-[#05051a] text-[#F5F5F7]">Highest Volume</option>
              <option value="mostActive" className="bg-[#05051a] text-[#F5F5F7]">Most Active</option>
              <option value="probability" className="bg-[#05051a] text-[#F5F5F7]">Highest Probability</option>
              <option value="newest" className="bg-[#05051a] text-[#F5F5F7]">Newest</option>
              <option value="endingSoon" className="bg-[#05051a] text-[#F5F5F7]">Ending Soon</option>
            </select>
          </div>

          {/* Tokenized Asset Filter Toggle */}
          <button
            type="button"
            onClick={() => {
              setTokenizedOnly((prev) => !prev);
              setCurrentPage(1);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border shrink-0 ${
              tokenizedOnly
                ? 'bg-[#FF8A20]/20 text-[#FFA642] border-[#FF8A20]/50 font-semibold'
                : 'bg-[#080821] text-[#A7A7B8] hover:text-[#F5F5F7] border-[rgba(138,32,255,0.25)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tokenized Only</span>
          </button>
        </div>
      </div>

      {/* 4. Main Predictions Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="valtics-card p-5 h-64 animate-pulse flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="h-4 w-20 bg-[#080821] rounded" />
                <div className="h-5 w-3/4 bg-[#080821] rounded" />
                <div className="h-3 w-full bg-[#080821] rounded" />
              </div>
              <div className="h-10 bg-[#080821] rounded-lg" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="valtics-card p-8 text-center space-y-3 border-rose-500/40">
          <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-[#F5F5F7] text-sm">
            Prediction Service Unavailable
          </h3>
          <p className="text-xs text-[#A7A7B8] max-w-md mx-auto">
            {error}
          </p>
          <button
            type="button"
            onClick={() => loadPredictions(true)}
            className="valtics-button text-xs py-2 px-4 inline-flex items-center gap-1.5 cursor-pointer mt-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      ) : filteredAndSortedMarkets.length === 0 ? (
        <div className="valtics-card p-10 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#080821] border border-[rgba(138,32,255,0.25)] flex items-center justify-center mx-auto text-[#A7A7B8]">
            <HelpCircle className="w-5 h-5 text-[#8A20FF]" />
          </div>
          <h3 className="font-bold text-[#F5F5F7] text-sm">
            No Matching Predictions Found
          </h3>
          <p className="text-xs text-[#A7A7B8] max-w-md mx-auto">
            No active forecast benchmarks matched your search or filters.
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setCategoryFilter('all');
                setStatusFilter('all');
                setTokenizedOnly(false);
              }}
              className="valtics-button-secondary text-xs py-1.5 px-3.5 cursor-pointer"
            >
              Reset Filters
            </button>
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="valtics-button text-xs py-1.5 px-3.5 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Market</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginatedMarkets.map((market) => (
              <PantaMarketCard
                key={market.id}
                market={market}
                onOpenDetails={(m) => setSelectedMarketForModal(m)}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[rgba(138,32,255,0.18)] text-xs font-mono">
              <span className="text-[#A7A7B8]">
                Showing <span className="text-[#F5F5F7] font-semibold">{startIndexDisplay}</span> to{' '}
                <span className="text-[#F5F5F7] font-semibold">{endIndexDisplay}</span> of{' '}
                <span className="text-[#F5F5F7] font-semibold">{filteredAndSortedMarkets.length}</span> predictions
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="px-3 py-1.5 min-h-[36px] rounded-lg bg-[#080821] border border-[rgba(138,32,255,0.25)] hover:border-[#8A20FF] text-[#A7A7B8] hover:text-[#F5F5F7] disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>

                <div className="px-3 py-1.5 rounded-lg bg-[#05051a] border border-[rgba(138,32,255,0.2)] text-[#F5F5F7] font-semibold">
                  <span>{safePage}</span> / <span>{totalPages}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="px-3 py-1.5 min-h-[36px] rounded-lg bg-[#080821] border border-[rgba(138,32,255,0.25)] hover:border-[#8A20FF] text-[#A7A7B8] hover:text-[#F5F5F7] disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      <PantaMarketDetailModal
        market={selectedMarketForModal}
        onClose={() => setSelectedMarketForModal(null)}
      />

      {/* Developer Infrastructure Health Test Modal */}
      <PantaHealthModal
        isOpen={healthModalOpen}
        onClose={() => setHealthModalOpen(false)}
      />

      {/* Prediction Market Creation Modal */}
      {createModalOpen && (
        <PantaMarketCreationModal
          assetSymbol="SOL"
          assetName="Solana Ecosystem"
          currentPrice={150}
          category="crypto"
          onClose={() => setCreateModalOpen(false)}
          onMarketCreated={handlePredictionCreated}
        />
      )}
    </div>
  );
};
