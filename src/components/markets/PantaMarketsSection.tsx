import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  TrendingUp,
  RefreshCw,
  Search,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Layers,
  Sparkles,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { ValticsPredictionMarket, PantaMarketStatus, PantaSyncStatus } from '../../types/panta';
import { fetchPantaMarkets } from '../../services/pantaService';
import { PantaMarketCard } from './PantaMarketCard';
import { PantaMarketDetailModal } from './PantaMarketDetailModal';
import { PantaTradingModal } from './PantaTradingModal';
import { PantaHealthModal } from '../panta/PantaHealthModal';
import { evaluateTokenizedAssetRelevance } from '../../utils/pantaRelevance';

interface PantaMarketsSectionProps {
  onSelectMarket?: (market: ValticsPredictionMarket) => void;
  initialCategory?: string;
}

const PAGE_SIZE = 6;
const AUTO_REFRESH_INTERVAL_MS = 30000; // 30s background revalidation

type PantaSortOption = 'volume' | 'newest' | 'endingSoon' | 'mostActive';

export const PantaMarketsSection: React.FC<PantaMarketsSectionProps> = ({
  onSelectMarket,
  initialCategory = 'all',
}) => {
  const [rawMarkets, setRawMarkets] = useState<ValticsPredictionMarket[]>([]);
  const [syncStatus, setSyncStatus] = useState<PantaSyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Filter & Search Controls
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [onlyTokenizedAssetRelevant, setOnlyTokenizedAssetRelevant] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<PantaSortOption>('volume');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Detail Modal State
  const [activeModalMarket, setActiveModalMarket] = useState<ValticsPredictionMarket | null>(null);
  const [healthModalOpen, setHealthModalOpen] = useState<boolean>(false);
  const [tradingMarket, setTradingMarket] = useState<ValticsPredictionMarket | null>(null);
  const [tradingOutcome, setTradingOutcome] = useState<'YES' | 'NO'>('YES');

  // Track last fetch timestamp to prevent duplicate immediate refetches on window focus
  const lastFetchTimeRef = useRef<number>(0);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput.trim());
      setCurrentPage(1);
    }, 240);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch markets from Panta service
  const loadPantaMarkets = useCallback(async (isManual = false) => {
    if (isManual) {
      setIsRefreshing(true);
    } else if (rawMarkets.length === 0) {
      setIsLoading(true);
    }
    setError(null);
    setErrorCode(null);

    try {
      lastFetchTimeRef.current = Date.now();
      const result = await fetchPantaMarkets({
        limit: 50,
      });

      if (result.syncStatus) {
        setSyncStatus(result.syncStatus);
      }

      if (!result.success || !result.data) {
        setError(result.error?.message || 'Unable to retrieve prediction market feeds from Panta');
        setErrorCode(result.error?.code || 'FETCH_ERROR');
      } else {
        // Strict deduplication by market ID to prevent duplicate elements
        const uniqueMap = new Map<string, ValticsPredictionMarket>();
        result.data.markets.forEach((m) => {
          if (m && m.id) uniqueMap.set(m.id, m);
        });
        setRawMarkets(Array.from(uniqueMap.values()));
        setLastUpdated(new Date(result.timestamp || Date.now()));
      }
    } catch (err: any) {
      setError(err?.message || 'Unexpected failure while loading Panta prediction markets');
      setErrorCode('UNEXPECTED_ERROR');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [rawMarkets.length]);

  // Initial load
  useEffect(() => {
    loadPantaMarkets(false);
  }, [loadPantaMarkets]);

  // Background revalidation (paused when tab is hidden or backgrounded)
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        loadPantaMarkets(false);
      }
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [loadPantaMarkets]);

  // Revalidate on window focus if stale > 30s
  useEffect(() => {
    const handleFocus = () => {
      if (Date.now() - lastFetchTimeRef.current > AUTO_REFRESH_INTERVAL_MS) {
        loadPantaMarkets(false);
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadPantaMarkets]);

  // Extract unique categories available from real Panta API response
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    rawMarkets.forEach((m) => {
      if (m.category) set.add(m.category.toLowerCase());
    });
    return Array.from(set);
  }, [rawMarkets]);

  // Reset page when category, status, or tokenized relevance changes
  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const handleRelevanceToggle = () => {
    setOnlyTokenizedAssetRelevant((prev) => !prev);
    setCurrentPage(1);
  };

  // Standard categories matching Valtics requirements
  const STANDARD_CATEGORIES = [
    { id: 'all', label: 'All' },
    { id: 'crypto', label: 'Crypto' },
    { id: 'tokenized', label: 'Tokenized Assets' },
    { id: 'sports', label: 'Sports' },
    { id: 'events', label: 'Events' },
    { id: 'other', label: 'Other' },
  ];

  // Filtered and sorted markets
  const filteredMarkets = useMemo(() => {
    const filtered = rawMarkets.filter((m) => {
      // Category filter
      if (selectedCategory !== 'all') {
        const cat = (m.category || '').toLowerCase();
        if (selectedCategory === 'tokenized') {
          const relevance = evaluateTokenizedAssetRelevance(m);
          if (!relevance.isRelevant && cat !== 'tokenized' && cat !== 'rwa') return false;
        } else if (selectedCategory === 'crypto') {
          if (cat !== 'crypto') return false;
        } else if (selectedCategory === 'sports') {
          if (cat !== 'sports') return false;
        } else if (selectedCategory === 'events') {
          if (cat !== 'events' && cat !== 'current-events' && cat !== 'politics') return false;
        } else if (selectedCategory === 'other') {
          const isStandard = ['crypto', 'tokenized', 'rwa', 'sports', 'events', 'current-events'].includes(cat) || evaluateTokenizedAssetRelevance(m).isRelevant;
          if (isStandard) return false;
        } else if (cat !== selectedCategory) {
          return false;
        }
      }

      // Status filter
      if (selectedStatus !== 'all' && m.status !== selectedStatus) {
        return false;
      }

      // Tokenized asset relevance filter toggle
      if (onlyTokenizedAssetRelevant) {
        const relevance = evaluateTokenizedAssetRelevance(m);
        if (!relevance.isRelevant) return false;
      }

      // Search query filter (title, question, description, tags, id)
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

    // Sort order
    return [...filtered].sort((a, b) => {
      if (sortBy === 'volume') {
        return (b.volume || 0) - (a.volume || 0);
      }
      if (sortBy === 'mostActive') {
        return (b.tradeCount || b.volume || 0) - (a.tradeCount || a.volume || 0);
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
  }, [rawMarkets, selectedCategory, selectedStatus, onlyTokenizedAssetRelevant, debouncedQuery, sortBy]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredMarkets.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedMarkets = useMemo(() => {
    const startIndex = (safePage - 1) * PAGE_SIZE;
    return filteredMarkets.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredMarkets, safePage]);

  const startIndexDisplay = filteredMarkets.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endIndexDisplay = Math.min(safePage * PAGE_SIZE, filteredMarkets.length);

  // Friendly error advice generator
  const getErrorGuidance = () => {
    if (errorCode === 'PANTA_RATE_LIMIT_ERROR' || errorCode === 'RATE_LIMIT_EXCEEDED') {
      return 'Panta API rate limit reached. The service is temporarily throttling requests to protect capacity. Please wait a few moments before retrying.';
    }
    if (errorCode === 'PANTA_GATEWAY_TIMEOUT' || errorCode === 'NETWORK_FAILURE') {
      return 'The connection to the Panta prediction gateway timed out. Please check your network connection and retry.';
    }
    if (errorCode === 'PANTA_AUTHENTICATION_ERROR') {
      return 'Panta API authentication challenge. Please verify that the upstream API key configuration is active.';
    }
    return error || 'Failed to communicate with the external prediction market protocol.';
  };

  return (
    <section className="space-y-4 pt-6 border-t border-[rgba(138,32,255,0.18)] font-sans text-[#F5F5F7]">
      {/* 1. Section Header: Title, Distinct Data Badge, Search & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold text-[#F5F5F7] tracking-tight font-sans">
              Prediction Markets
            </h2>
            <button
              type="button"
              onClick={() => setHealthModalOpen(true)}
              title="Click to audit Panta API & Solana Devnet RPC connectivity"
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#080821] border border-[rgba(138,32,255,0.25)] hover:border-[#8A20FF] text-[11px] font-mono text-[#F5F5F7] cursor-pointer transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF8A20] animate-pulse" />
              <span>External Feeds</span>
              <span className="text-[#66667A]">·</span>
              <span className="text-[#FFA642]">Panta Protocol</span>
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
            Probabilistic YES/NO prediction benchmarks on Solana to complement tokenized asset positioning.
          </p>
        </div>

        {/* Right Search & Refresh Controls */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-[#66667A] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search prediction markets..."
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
            onClick={() => loadPantaMarkets(true)}
            disabled={isRefreshing}
            title={lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Refresh Panta feeds'}
            className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg bg-[#080821] border border-[rgba(138,32,255,0.25)] hover:border-[#8A20FF] text-[#A7A7B8] hover:text-[#F5F5F7] transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#FF8A20]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Filter Bar: Categories, Status & Sorting */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-1">
        {/* Category Filter Segments */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          <div className="flex items-center gap-1 p-1 bg-[#080821] border border-[rgba(138,32,255,0.25)] rounded-lg shrink-0">
            {STANDARD_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-[#6010F0] text-white font-semibold shadow-xs'
                    : 'text-[#A7A7B8] hover:text-[#F5F5F7] hover:bg-[#140130]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Status Filter Segment */}
          <div className="flex items-center gap-1 p-1 bg-[#080821] border border-[rgba(138,32,255,0.25)] rounded-lg shrink-0">
            {(['all', 'active', 'resolving', 'resolved'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => handleStatusChange(st)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer capitalize whitespace-nowrap ${
                  selectedStatus === st
                    ? 'bg-[#6010F0] text-white font-semibold shadow-xs'
                    : 'text-[#A7A7B8] hover:text-[#F5F5F7] hover:bg-[#140130]'
                }`}
              >
                {st === 'all' ? 'All Status' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Right Sort Controls & Tokenized Asset Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Sorting Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#080821] border border-[rgba(138,32,255,0.25)] rounded-lg px-2.5 py-1 text-xs text-[#A7A7B8]">
            <span className="text-[10px] uppercase font-mono text-[#7E6D96]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as PantaSortOption)}
              className="bg-transparent text-[#F5F5F7] outline-none font-mono text-xs cursor-pointer"
            >
              <option value="volume" className="bg-[#080821] text-[#F5F5F7]">Highest Volume</option>
              <option value="newest" className="bg-[#080821] text-[#F5F5F7]">Newest</option>
              <option value="endingSoon" className="bg-[#080821] text-[#F5F5F7]">Ending Soon</option>
              <option value="mostActive" className="bg-[#080821] text-[#F5F5F7]">Most Active</option>
            </select>
          </div>

          {/* Tokenized-Asset Relevance Filter Toggle */}
          <button
            type="button"
            onClick={handleRelevanceToggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border shrink-0 ${
              onlyTokenizedAssetRelevant
                ? 'bg-[#FF8A20]/20 text-[#FFA642] border-[#FF8A20]/50 font-semibold'
                : 'bg-[#080821] text-[#A7A7B8] hover:text-[#F5F5F7] border-[rgba(138,32,255,0.25)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tokenized Only</span>
          </button>
        </div>
      </div>

      {/* 3. Main Content: Loading, Error, Empty, or Grid with Pagination */}
      {isLoading ? (
        /* Loading Skeletons matching exact grid layout */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="bg-[#120128] border border-[#670CDC]/20 rounded-xl p-5 space-y-4 animate-pulse h-[280px] flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-20 bg-[#1C0142] rounded" />
                  <div className="h-4 w-14 bg-[#1C0142] rounded" />
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#1C0142] rounded-lg shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-3/4 bg-[#1C0142] rounded" />
                    <div className="h-3 w-full bg-[#1C0142]/60 rounded" />
                  </div>
                </div>
                <div className="h-14 bg-[#100126] rounded-lg" />
              </div>
              <div className="h-4 w-1/2 bg-[#1C0142] rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        /* Contained Panta Error State */
        <div className="rounded-xl border border-[#BA3351]/40 bg-[#1C0142]/90 p-6 sm:p-8 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#BA3351]/20 border border-[#BA3351]/50 flex items-center justify-center mx-auto text-[#FF9EAF]">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-[#F7F3FF] text-sm">
              Panta Prediction Service Unavailable
            </h3>
            <p className="text-xs text-[#B8A9CC] mt-1.5 max-w-md mx-auto leading-relaxed">
              {getErrorGuidance()}
            </p>
            {errorCode && (
              <span className="inline-block mt-2 font-mono text-[10px] text-[#FF9EAF] px-2 py-0.5 bg-[#BA3351]/20 rounded">
                Code: {errorCode}
              </span>
            )}
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => loadPantaMarkets(true)}
              className="px-5 py-2 min-h-[44px] rounded-lg bg-[#F99225] hover:bg-[#FFA742] text-[#09011B] text-xs font-semibold transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Connection</span>
            </button>
          </div>
        </div>
      ) : filteredMarkets.length === 0 ? (
        /* Empty State */
        <div className="rounded-xl border border-[#670CDC]/20 bg-[#120128] p-8 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#1C0142] border border-[#670CDC]/30 flex items-center justify-center mx-auto text-[#B8A9CC]">
            <HelpCircle className="w-5 h-5 text-[#670CDC]" />
          </div>
          <div>
            <h3 className="font-semibold text-[#F7F3FF] text-sm">
              No Prediction Markets Found
            </h3>
            <p className="text-xs text-[#B8A9CC] mt-1 max-w-md mx-auto leading-relaxed">
              {searchInput || selectedCategory !== 'all' || selectedStatus !== 'all' || onlyTokenizedAssetRelevant
                ? 'No Panta prediction markets matched your filter criteria. Try clearing your filters or search term.'
                : 'No active prediction markets currently returned by the Panta Solana feed.'}
            </p>
          </div>
          {(searchInput || selectedCategory !== 'all' || selectedStatus !== 'all' || onlyTokenizedAssetRelevant) && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSelectedCategory('all');
                setSelectedStatus('all');
                setOnlyTokenizedAssetRelevant(false);
                setCurrentPage(1);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-[#1C0142] hover:bg-[#250155] border border-[#670CDC]/25 text-xs text-[#F7F3FF] transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        /* Responsive Grid of Real Panta Markets */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
            {paginatedMarkets.map((market) => (
              <PantaMarketCard
                key={market.id}
                market={market}
                onOpenDetails={(m) => {
                  if (onSelectMarket) {
                    onSelectMarket(m);
                  } else {
                    setActiveModalMarket(m);
                  }
                }}
                onTrade={(m, outcome) => {
                  setTradingMarket(m);
                  setTradingOutcome(outcome);
                }}
              />
            ))}
          </div>

          {/* 4. Pagination Controls Bar */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#670CDC]/20 text-xs font-mono">
              <span className="text-[#B8A9CC] text-center sm:text-left">
                Showing <span className="text-[#F7F3FF] font-semibold">{startIndexDisplay}</span> to{' '}
                <span className="text-[#F7F3FF] font-semibold">{endIndexDisplay}</span> of{' '}
                <span className="text-[#F7F3FF] font-semibold">{filteredMarkets.length}</span> markets
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="px-3 py-1.5 min-h-[36px] rounded-lg bg-[#140130] border border-[#670CDC]/25 hover:border-[#670CDC]/60 text-[#B8A9CC] hover:text-[#F7F3FF] disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <div className="px-3 py-1.5 rounded-lg bg-[#100126] border border-[#670CDC]/20 text-[#F7F3FF] font-semibold">
                  <span>{safePage}</span> / <span>{totalPages}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="px-3 py-1.5 min-h-[36px] rounded-lg bg-[#140130] border border-[#670CDC]/25 hover:border-[#670CDC]/60 text-[#B8A9CC] hover:text-[#F7F3FF] disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Detail Modal for Selected Market */}
      <PantaMarketDetailModal
        market={activeModalMarket}
        onClose={() => setActiveModalMarket(null)}
      />

      {/* 6. Trading Modal for Acquiring YES / NO Shares */}
      {tradingMarket && (
        <PantaTradingModal
          market={tradingMarket}
          initialOutcome={tradingOutcome}
          onClose={() => setTradingMarket(null)}
          onTradeSuccess={() => {
            loadPantaMarkets(true);
          }}
        />
      )}

      {/* Developer Health Check Diagnostic Modal */}
      <PantaHealthModal
        isOpen={healthModalOpen}
        onClose={() => setHealthModalOpen(false)}
      />
    </section>
  );
};
