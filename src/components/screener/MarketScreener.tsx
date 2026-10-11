import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Clock,
  Layers,
  ShieldAlert,
} from 'lucide-react';
import {
  ScreenerAsset,
  ScreenerCategory,
  ScreenerSortField,
  SortDirection,
  fetchScreenerData,
} from '../../services/screenerService';
import { AssetLogo } from './AssetLogo';
import { formatCurrency, formatPercent, formatNumber } from '../../utils/format';
import { DBCPoolState } from '../../types';
import { NavigationTab } from '../layout/Header';

interface MarketScreenerProps {
  onSelectAsset: (asset: ScreenerAsset) => void;
  onSelectTab?: (tab: NavigationTab) => void;
  initialCategory?: ScreenerCategory;
}

export const MarketScreener: React.FC<MarketScreenerProps> = ({
  onSelectAsset,
  onSelectTab,
  initialCategory = 'all',
}) => {
  const [category, setCategory] = useState<ScreenerCategory>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sortBy, setSortBy] = useState<ScreenerSortField>('volume');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [assets, setAssets] = useState<ScreenerAsset[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Mobile expanded rows state
  const [expandedMobileRow, setExpandedMobileRow] = useState<string | null>(null);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 280);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load data
  const loadData = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else if (assets.length === 0) {
        setIsLoading(true);
      }

      setHasError(false);

      try {
        const result = await fetchScreenerData({
          category,
          query: debouncedQuery,
          page,
          pageSize,
          sortBy,
          sortDirection,
        });

        setAssets(result.assets);
        setTotalCount(result.totalCount);
        setTotalPages(result.totalPages);
        setLastRefreshedAt(new Date(result.lastUpdated));
      } catch (err: any) {
        setHasError(true);
        setErrorMessage(err?.message || 'Failed to connect to Pyth Market Data Gateway');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [category, debouncedQuery, page, pageSize, sortBy, sortDirection, assets.length]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 12-second background refresh interval (aligned with Pyth oracle cadence)
  useEffect(() => {
    const interval = setInterval(() => {
      loadData(false);
    }, 12000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Handle column sorting
  const handleSort = (field: ScreenerSortField) => {
    if (sortBy === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      // Sensible defaults: numbers descending, strings ascending
      if (['price', 'change24hPct', 'high24h', 'low24h', 'volume', 'marketCap'].includes(field)) {
        setSortDirection('desc');
      } else {
        setSortDirection('asc');
      }
    }
    setPage(1);
  };

  const handleCopyAddress = (e: React.MouseEvent, address: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const categories: { id: ScreenerCategory; label: string }[] = [
    { id: 'all', label: 'All assets' },
    { id: 'equity', label: 'Tokenized equities' },
    { id: 'commodity', label: 'Tokenized commodities' },
    { id: 'fund', label: 'Tokenized funds & ETFs' },
    { id: 'bond', label: 'Tokenized bonds & rates' },
    { id: 'crypto', label: 'Digital settlement' },
    { id: 'rwa', label: 'Real-world assets' },
  ];

  // Helper for sorting header arrows
  const renderSortIndicator = (field: ScreenerSortField) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-3 h-3 text-[#7E6D96] opacity-0 group-hover:opacity-100 transition-opacity ml-1" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-[#F99225] ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#F99225] ml-1" />
    );
  };

  return (
    <div className="space-y-4 font-sans text-[#EDE4FA]">
      {/* 1. Terminal Header: Title, Live Status, Search & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-[rgba(138,32,255,0.18)]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-[#F5F5F7] tracking-tight font-sans">
              Market Screener
            </h1>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#080821] border border-[rgba(138,32,255,0.25)] text-[11px] font-mono text-[#F5F5F7]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Pyth Live Feeds</span>
              <span className="text-[#66667A]">·</span>
              <span className="text-[#A7A7B8]">Solana Devnet</span>
            </div>
          </div>
          <p className="text-xs text-[#A7A7B8] mt-1">
            Standardized reference benchmarks and tokenized assets powered by Pyth Network oracle feeds.
          </p>
        </div>

        {/* Right Utility: Search & Manual Refresh */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#66667A] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ticker, name, or issuer..."
              className="w-full bg-[#080821] border border-[rgba(138,32,255,0.25)] focus:border-[#8A20FF] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#F5F5F7] placeholder-[#66667A] outline-none font-sans transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#66667A] hover:text-[#F5F5F7] text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            title={`Last updated: ${lastRefreshedAt.toLocaleTimeString()}`}
            className="p-2 rounded-lg bg-[#080821] border border-[rgba(138,32,255,0.25)] hover:border-[#8A20FF] text-[#A7A7B8] hover:text-[#F5F5F7] transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#FF8A20]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Standardized Category Filter Tabs (Zero-pill discipline: segmented interactive controls) */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1 p-1 bg-[#080821] border border-[rgba(138,32,255,0.25)] rounded-lg shrink-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setCategory(cat.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                category === cat.id
                  ? 'bg-[#6010F0] text-white font-semibold shadow-xs'
                  : 'text-[#A7A7B8] hover:text-[#F5F5F7] hover:bg-[#140130]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Total Assets Count Display */}
        <div className="hidden sm:flex items-center text-xs font-mono text-[#66667A] shrink-0">
          <span>{totalCount} instruments listed</span>
        </div>
      </div>

      {/* 3. Main Market Screener View */}
      {hasError ? (
        /* Error State */
        <div className="rounded-xl border border-[#BA3351]/40 bg-[#1C0142] p-8 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#BA3351]/20 border border-[#BA3351]/50 flex items-center justify-center mx-auto text-[#FF9EAF]">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-[#F7F3FF] text-sm">Pyth Oracle Connection Error</h3>
            <p className="text-xs text-[#B8A9CC] mt-1 max-w-md mx-auto">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => loadData(true)}
            className="px-4 py-2 bg-[#670CDC] hover:bg-[#7C18F0] text-[#F7F3FF] rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      ) : isLoading ? (
        /* Loading Skeleton Table */
        <div className="rounded-xl border border-[#670CDC]/25 bg-[#140130] overflow-hidden shadow-xl shadow-[#09011B]/60">
          <div className="p-4 border-b border-[#670CDC]/20 flex items-center justify-between text-xs text-[#7E6D96] font-mono">
            <span className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#F99225]" />
              Loading real-time market data from Pyth API...
            </span>
          </div>
          <div className="divide-y divide-[#670CDC]/15">
            {Array.from({ length: 10 }).map((_, idx) => (
              <div key={idx} className="p-3.5 flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#1A0140]" />
                  <div className="space-y-1.5">
                    <div className="w-24 h-3 rounded bg-[#1A0140]" />
                    <div className="w-12 h-2.5 rounded bg-[#1A0140]/60" />
                  </div>
                </div>
                <div className="space-y-1.5 text-right">
                  <div className="w-20 h-3 rounded bg-[#1A0140] ml-auto" />
                  <div className="w-14 h-2.5 rounded bg-[#1A0140]/60 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : assets.length === 0 ? (
        /* Empty State */
        <div className="rounded-xl border border-[#670CDC]/25 bg-[#140130] p-12 text-center space-y-3 shadow-xl shadow-[#09011B]/60">
          <div className="w-10 h-10 rounded-full bg-[#100126] border border-[#670CDC]/30 flex items-center justify-center mx-auto text-[#D76EDD]">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-[#F7F3FF] text-sm">No tokenized assets found</h3>
          <p className="text-xs text-[#B8A9CC] max-w-sm mx-auto">
            No instruments match the selected filter or search query. Try clearing your filters or changing your search terms.
          </p>
          {(searchQuery || category !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCategory('all');
                setPage(1);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-[#670CDC]/20 text-[#EDE4FA] border border-[#670CDC]/30 hover:bg-[#670CDC]/30 text-xs font-medium transition-colors cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ======================================================== */}
          {/* DESKTOP TABLE VIEW: Wide, Standardized, Information-Dense */}
          {/* ======================================================== */}
          <div className="hidden md:block rounded-xl border border-[#670CDC]/25 bg-[#140130] overflow-x-auto shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#670CDC]/25 bg-[#100126] text-[#B8A9CC] font-medium select-none text-[11px]">
                  {/* # Index */}
                  <th className="py-2.5 px-3 w-10 text-center text-[#7E6D96] font-mono">#</th>

                  {/* Asset & Symbol */}
                  <th
                    onClick={() => handleSort('name')}
                    className="py-2.5 px-3 min-w-[200px] cursor-pointer hover:text-[#F7F3FF] transition-colors group"
                  >
                    <div className="flex items-center">
                      <span>Asset / Symbol</span>
                      {renderSortIndicator('name')}
                    </div>
                  </th>

                  {/* Asset Type */}
                  <th
                    onClick={() => handleSort('category')}
                    className="py-2.5 px-3 min-w-[130px] cursor-pointer hover:text-white transition-colors group"
                  >
                    <div className="flex items-center">
                      <span>Category</span>
                      {renderSortIndicator('category')}
                    </div>
                  </th>

                  {/* Price */}
                  <th
                    onClick={() => handleSort('price')}
                    className="py-2.5 px-3 text-right min-w-[110px] cursor-pointer hover:text-white transition-colors group"
                  >
                    <div className="flex items-center justify-end">
                      <span>Price (USD)</span>
                      {renderSortIndicator('price')}
                    </div>
                  </th>

                  {/* 24h Change */}
                  <th
                    onClick={() => handleSort('change24hPct')}
                    className="py-2.5 px-3 text-right min-w-[95px] cursor-pointer hover:text-white transition-colors group"
                  >
                    <div className="flex items-center justify-end">
                      <span>24h Change</span>
                      {renderSortIndicator('change24hPct')}
                    </div>
                  </th>

                  {/* 24h High */}
                  <th
                    onClick={() => handleSort('high24h')}
                    className="py-2.5 px-3 text-right min-w-[95px] cursor-pointer hover:text-white transition-colors group"
                  >
                    <div className="flex items-center justify-end">
                      <span>24h High</span>
                      {renderSortIndicator('high24h')}
                    </div>
                  </th>

                  {/* 24h Low */}
                  <th
                    onClick={() => handleSort('low24h')}
                    className="py-2.5 px-3 text-right min-w-[95px] cursor-pointer hover:text-white transition-colors group"
                  >
                    <div className="flex items-center justify-end">
                      <span>24h Low</span>
                      {renderSortIndicator('low24h')}
                    </div>
                  </th>

                  {/* 24h Volume */}
                  <th
                    onClick={() => handleSort('volume')}
                    className="py-2.5 px-3 text-right min-w-[100px] cursor-pointer hover:text-white transition-colors group"
                  >
                    <div className="flex items-center justify-end">
                      <span>24h Volume</span>
                      {renderSortIndicator('volume')}
                    </div>
                  </th>

                  {/* Valuation / Market Cap */}
                  <th
                    onClick={() => handleSort('marketCap')}
                    className="py-2.5 px-3 text-right min-w-[110px] cursor-pointer hover:text-white transition-colors group"
                  >
                    <div className="flex items-center justify-end">
                      <span>Valuation</span>
                      {renderSortIndicator('marketCap')}
                    </div>
                  </th>

                  {/* Issuer */}
                  <th
                    onClick={() => handleSort('issuer')}
                    className="py-2.5 px-3 min-w-[140px] cursor-pointer hover:text-white transition-colors group"
                  >
                    <div className="flex items-center">
                      <span>Issuer</span>
                      {renderSortIndicator('issuer')}
                    </div>
                  </th>

                  {/* Market Status */}
                  <th
                    onClick={() => handleSort('status')}
                    className="py-2.5 px-3 min-w-[100px] cursor-pointer hover:text-white transition-colors group"
                  >
                    <div className="flex items-center">
                      <span>Market Status</span>
                      {renderSortIndicator('status')}
                    </div>
                  </th>

                  {/* Action / Contract Copy */}
                  <th className="py-2.5 px-3 w-16 text-center">Contract</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-sans">
                {assets.map((asset, index) => {
                  const isPositive = asset.change24hPct !== null && asset.change24hPct >= 0;
                  const isNegative = asset.change24hPct !== null && asset.change24hPct < 0;
                  const rowNumber = (page - 1) * pageSize + index + 1;

                  return (
                    <tr
                      key={asset.id}
                      onClick={() => onSelectAsset(asset)}
                      className="hover:bg-[#26035A] transition-colors cursor-pointer group"
                    >
                      {/* Row Index */}
                      <td className="py-2.5 px-3 text-center text-[#7E6D96] font-mono text-[11px]">
                        {rowNumber}
                      </td>

                      {/* Asset & Symbol */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <AssetLogo
                            symbol={asset.symbol}
                            category={asset.category}
                            size="md"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-[#F7F3FF] group-hover:text-white transition-colors truncate max-w-[200px]">
                              {asset.name}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[#F99225] font-medium text-[11px]">
                                {asset.symbol}
                              </span>
                              {asset.poolAddress && (
                                <span className="text-[10px] text-[#F99225] font-mono bg-[#240A36] px-1 rounded border border-[#F99225]/30 font-semibold">
                                  DBC
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-2.5 px-3">
                        <span className="text-[#B8A9CC] text-xs truncate block max-w-[130px]">
                          {asset.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-2.5 px-3 text-right">
                        <span className="font-mono font-bold text-[#F7F3FF] text-xs tracking-tight">
                          {asset.price !== null && asset.price > 0 ? formatCurrency(asset.price) : '—'}
                        </span>
                      </td>

                      {/* 24h Change */}
                      <td className="py-2.5 px-3 text-right font-mono text-xs">
                        {asset.change24hPct !== null ? (
                          <span
                            className={`font-semibold ${
                              isPositive
                                ? 'text-emerald-400'
                                : isNegative
                                ? 'text-rose-400'
                                : 'text-[#B8A9CC]'
                            }`}
                          >
                            {isPositive ? '+' : ''}
                            {asset.change24hPct.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-[#7E6D96]">—</span>
                        )}
                      </td>

                      {/* 24h High */}
                      <td className="py-2.5 px-3 text-right font-mono text-xs text-[#EDE4FA]">
                        {asset.high24h !== null && asset.high24h > 0 ? (
                          formatCurrency(asset.high24h)
                        ) : (
                          <span className="text-[#7E6D96]">—</span>
                        )}
                      </td>

                      {/* 24h Low */}
                      <td className="py-2.5 px-3 text-right font-mono text-xs text-[#EDE4FA]">
                        {asset.low24h !== null && asset.low24h > 0 ? (
                          formatCurrency(asset.low24h)
                        ) : (
                          <span className="text-[#7E6D96]">—</span>
                        )}
                      </td>

                      {/* 24h Volume */}
                      <td className="py-2.5 px-3 text-right font-mono text-xs text-[#EDE4FA]">
                        {asset.volume !== null && asset.volume > 0 ? (
                          formatCurrency(asset.volume)
                        ) : (
                          <span className="text-[#7E6D96]">—</span>
                        )}
                      </td>

                      {/* Valuation / Market Cap */}
                      <td className="py-2.5 px-3 text-right font-mono text-xs text-[#EDE4FA]">
                        {asset.marketCap !== null && asset.marketCap > 0 ? (
                          formatCurrency(asset.marketCap)
                        ) : (
                          <span className="text-[#7E6D96]">—</span>
                        )}
                      </td>

                      {/* Issuer */}
                      <td className="py-2.5 px-3">
                        <span className="text-[#B8A9CC] text-xs truncate block max-w-[140px]" title={asset.issuer}>
                          {asset.issuer}
                        </span>
                      </td>

                      {/* Market Status */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          {asset.marketStatus === 'Live' ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                              <span className="text-emerald-400/90 text-[11px] font-medium">Live</span>
                            </>
                          ) : asset.marketStatus === 'Market Closed' ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-[#F99225] shrink-0" />
                              <span className="text-[#F99225] text-[11px]">Closed</span>
                            </>
                          ) : asset.marketStatus === 'Unsupported' ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-[#670CDC] shrink-0" />
                              <span className="text-[#B8A9CC] text-[11px]">Institutional</span>
                            </>
                          ) : (
                            <span className="text-[#7E6D96] text-[11px]">—</span>
                          )}
                        </div>
                      </td>

                      {/* Contract Copy */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={(e) => handleCopyAddress(e, asset.mintAddress || asset.id, asset.id)}
                          title="Copy mint/feed address"
                          className="p-1 rounded hover:bg-[#670CDC]/20 text-[#7E6D96] hover:text-[#F7F3FF] transition-colors cursor-pointer"
                        >
                          {copiedId === asset.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ======================================================== */}
          {/* MOBILE RESPONSIVE VIEW: Preserves Asset, Price, 24h & Vol */}
          {/* ======================================================== */}
          <div className="md:hidden rounded-xl border border-[#670CDC]/25 bg-[#140130] divide-y divide-[#670CDC]/20 overflow-hidden shadow-sm">
            {assets.map((asset) => {
              const isPositive = asset.change24hPct !== null && asset.change24hPct >= 0;
              const isNegative = asset.change24hPct !== null && asset.change24hPct < 0;
              const isExpanded = expandedMobileRow === asset.id;

              return (
                <div key={asset.id} className="p-3.5 hover:bg-[#26035A] transition-colors">
                  {/* Primary Row: Tap to navigate or expand */}
                  <div
                    onClick={() => onSelectAsset(asset)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    {/* Left: Logo, Name, Symbol */}
                    <div className="flex items-center gap-3 min-w-0 pr-3">
                      <AssetLogo symbol={asset.symbol} category={asset.category} size="md" />
                      <div className="min-w-0">
                        <div className="font-semibold text-[#F7F3FF] text-sm truncate">{asset.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-[#B8A9CC] font-mono">
                          <span className="font-bold text-[#F99225]">{asset.symbol}</span>
                          <span>·</span>
                          <span className="text-[#7E6D96] truncate max-w-[90px]">{asset.issuer}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Price & 24h Change */}
                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-sm text-[#F7F3FF]">
                        {asset.price !== null && asset.price > 0 ? formatCurrency(asset.price) : '—'}
                      </div>
                      <div className="mt-0.5 font-mono text-xs">
                        {asset.change24hPct !== null ? (
                          <span
                            className={`font-semibold ${
                              isPositive
                                ? 'text-emerald-400'
                                : isNegative
                                ? 'text-rose-400'
                                : 'text-[#B8A9CC]'
                            }`}
                          >
                            {isPositive ? '+' : ''}
                            {asset.change24hPct.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-[#7E6D96]">—</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mobile Quick Drawer Toggle */}
                  <div className="mt-2.5 pt-2 border-t border-[#670CDC]/20 flex items-center justify-between text-[11px] text-[#7E6D96]">
                    <div className="flex items-center gap-2 font-mono">
                      <span>Vol:</span>
                      <span className="text-[#EDE4FA]">
                        {asset.volume !== null && asset.volume > 0 ? formatCurrency(asset.volume) : '—'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedMobileRow(isExpanded ? null : asset.id);
                        }}
                        className="inline-flex items-center gap-1 text-[#B8A9CC] hover:text-[#F7F3FF] transition-colors p-1"
                      >
                        <span>{isExpanded ? 'Less' : 'Details'}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleCopyAddress(e, asset.mintAddress || asset.id, asset.id)}
                        className="inline-flex items-center gap-1 p-1 text-[#B8A9CC] hover:text-[#F7F3FF]"
                        title="Copy mint/feed"
                      >
                        {copiedId === asset.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Secondary Info on Mobile */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-[#670CDC]/20 grid grid-cols-2 gap-2 text-xs font-mono bg-[#100126] p-2.5 rounded-lg border border-[#670CDC]/20">
                      <div>
                        <span className="text-[#7E6D96] block text-[10px]">24H HIGH</span>
                        <span className="text-[#EDE4FA]">
                          {asset.high24h !== null && asset.high24h > 0 ? formatCurrency(asset.high24h) : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#7E6D96] block text-[10px]">24H LOW</span>
                        <span className="text-[#EDE4FA]">
                          {asset.low24h !== null && asset.low24h > 0 ? formatCurrency(asset.low24h) : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#7E6D96] block text-[10px]">VALUATION</span>
                        <span className="text-[#EDE4FA]">
                          {asset.marketCap !== null && asset.marketCap > 0 ? formatCurrency(asset.marketCap) : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#7E6D96] block text-[10px]">MARKET STATUS</span>
                        <span className="text-[#EDE4FA]">{asset.marketStatus}</span>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-[#670CDC]/15 flex items-center justify-between text-[11px]">
                        <span className="text-[#7E6D96]">Contract / Feed ID:</span>
                        <span className="text-[#B8A9CC] truncate max-w-[150px] font-mono">
                          {asset.mintAddress.slice(0, 6)}...{asset.mintAddress.slice(-6)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 4. Pagination & Terminal Metrics Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs font-sans text-[#B8A9CC]">
            <div className="flex items-center gap-2 font-mono text-[11px] text-[#7E6D96]">
              <span>Showing {assets.length} of {totalCount} assets</span>
              <span>·</span>
              <span>Source: Pyth Network Verified Oracle</span>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-2.5 py-1.5 rounded-lg bg-[#140130] border border-[#670CDC]/30 hover:border-[#670CDC]/60 disabled:opacity-40 disabled:cursor-not-allowed text-[#B8A9CC] hover:text-[#F7F3FF] transition-colors cursor-pointer flex items-center gap-1 font-mono text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              <span className="font-mono text-xs px-2 text-[#F7F3FF]">
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-2.5 py-1.5 rounded-lg bg-[#140130] border border-[#670CDC]/30 hover:border-[#670CDC]/60 disabled:opacity-40 disabled:cursor-not-allowed text-[#B8A9CC] hover:text-[#F7F3FF] transition-colors cursor-pointer flex items-center gap-1 font-mono text-xs"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
