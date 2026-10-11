import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TrendingUp,
  RefreshCw,
  Wallet,
  ArrowRight,
  Award,
  Layers,
  Coins,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Clock,
  Filter,
  Check,
  ChevronRight,
  Sliders,
  DollarSign,
  Plus
} from 'lucide-react';
import { Transaction } from '@solana/web3.js';
import { useWallet } from '../../context/WalletContext';
import { PantaPosition, ValticsPredictionMarket } from '../../types/panta';
import {
  fetchPantaPositions,
  requestClaimQuote,
  buildClaimTx,
  buildClaimCreatorFeesTx,
  broadcastSignedTx,
  fetchPantaMarkets
} from '../../services/pantaService';
import { formatCurrency, formatNumber } from '../../utils/format';
import { PantaPositionDetailModal } from './PantaPositionDetailModal';
import { NavigationTab } from '../layout/Header';

interface ValticsPortfolioViewProps {
  onSelectTab: (tab: NavigationTab) => void;
  onOpenWalletModal: () => void;
  onSelectMarketDetail?: (marketId: string) => void;
}

export const ValticsPortfolioView: React.FC<ValticsPortfolioViewProps> = ({
  onSelectTab,
  onOpenWalletModal,
  onSelectMarketDetail,
}) => {
  const { connected, publicKeyStr, signTransaction, connect } = useWallet();

  const [activeSubTab, setActiveSubTab] = useState<'positions' | 'claimable' | 'creator-markets'>('positions');
  const [positions, setPositions] = useState<PantaPosition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Selected position detail modal
  const [selectedPosition, setSelectedPosition] = useState<PantaPosition | null>(null);

  // Filter state for positions
  const [filterPhase, setFilterPhase] = useState<'all' | 'open' | 'secondary' | 'resolved' | 'claimable'>('all');

  // Creator markets state
  const [createdMarkets, setCreatedMarkets] = useState<ValticsPredictionMarket[]>([]);
  const [loadingCreatedMarkets, setLoadingCreatedMarkets] = useState(false);

  // Claim action state
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimStatusMsg, setClaimStatusMsg] = useState<{ id: string; status: 'signing' | 'broadcasting' | 'success' | 'error'; msg: string; tx?: string } | null>(null);

  // Creator fee claim state
  const [claimingCreatorFeeId, setClaimingCreatorFeeId] = useState<string | null>(null);

  // 1. Fetch positions for connected wallet
  const loadPositions = useCallback(async (isManual = false) => {
    if (!publicKeyStr) {
      setPositions([]);
      setLoading(false);
      setIsRefreshing(false);
      return;
    }

    if (isManual) setIsRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetchPantaPositions(publicKeyStr);
      if (res.success && res.data) {
        setPositions(res.data);
      } else {
        setPositions([]);
        setError(res.error?.message || 'Failed to load wallet positions from Panta');
      }
    } catch (err: any) {
      setPositions([]);
      setError(err?.message || 'Network error while loading positions');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [publicKeyStr]);

  // 2. Fetch markets created by this wallet
  const loadCreatedMarkets = useCallback(async () => {
    if (!publicKeyStr) {
      setCreatedMarkets([]);
      return;
    }
    setLoadingCreatedMarkets(true);
    try {
      const res = await fetchPantaMarkets({ limit: 50 });
      if (res.success && res.data) {
        const authored = res.data.markets.filter(
          (m) => (m.creatorAddress || '').toLowerCase() === publicKeyStr.toLowerCase()
        );
        setCreatedMarkets(authored);
      }
    } catch {}
    finally {
      setLoadingCreatedMarkets(false);
    }
  }, [publicKeyStr]);

  useEffect(() => {
    loadPositions();
    loadCreatedMarkets();
  }, [loadPositions, loadCreatedMarkets]);

  // Handle Winning Position Claim
  const handleClaimPosition = async (pos: PantaPosition) => {
    if (!connected || !publicKeyStr) return;
    setClaimingId(pos.id);
    setClaimStatusMsg({ id: pos.id, status: 'signing', msg: 'Checking claim eligibility & preparing transaction...' });

    try {
      // 1. Check eligibility
      const checkRes = await requestClaimQuote(publicKeyStr, pos.marketId);
      if (!checkRes.success || !checkRes.data?.canClaim) {
        throw new Error(checkRes.data?.reason || checkRes.error?.message || 'Position is not eligible to claim at this time.');
      }

      // 2. Build Claim TX
      const buildRes = await buildClaimTx(publicKeyStr, pos.marketId);
      if (!buildRes.success || !buildRes.data?.transactionBase64) {
        throw new Error(buildRes.error?.message || 'Failed to build claim transaction.');
      }

      // 3. User Wallet Approval
      setClaimStatusMsg({ id: pos.id, status: 'signing', msg: 'Please approve claim in your wallet...' });
      const txBuffer = Buffer.from(buildRes.data.transactionBase64, 'base64');
      const tx = Transaction.from(txBuffer);
      const signed = await signTransaction(tx);
      const serialized = signed.serialize({ requireAllSignatures: false, verifySignatures: false });

      // 4. Broadcast
      setClaimStatusMsg({ id: pos.id, status: 'broadcasting', msg: 'Confirming claim on Solana Devnet...' });
      const broadcastRes = await broadcastSignedTx({ signedTransactionBase64: serialized.toString('base64') });
      if (!broadcastRes.success || !broadcastRes.data?.signature) {
        throw new Error(broadcastRes.error?.message || 'Claim broadcast failed on Solana.');
      }

      const sig = broadcastRes.data.signature;
      setClaimStatusMsg({
        id: pos.id,
        status: 'success',
        msg: `Claim successful! Payout credited to wallet.`,
        tx: sig,
      });

      // Refresh positions
      setTimeout(() => {
        loadPositions(true);
      }, 1500);
    } catch (err: any) {
      const msg = (err?.message || '').toLowerCase();
      const userCancelled = err?.code === 4001 || msg.includes('user rejected') || msg.includes('cancelled') || msg.includes('canceled');
      setClaimStatusMsg({
        id: pos.id,
        status: 'error',
        msg: userCancelled ? 'Claim cancelled by user.' : (err?.message || 'Failed to execute claim.'),
      });
    } finally {
      setClaimingId(null);
    }
  };

  // Handle Creator Fee Claim
  const handleClaimCreatorFees = async (market: ValticsPredictionMarket) => {
    if (!connected || !publicKeyStr) return;
    setClaimingCreatorFeeId(market.id);
    setClaimStatusMsg({ id: market.id, status: 'signing', msg: 'Building creator fee claim transaction...' });

    try {
      const buildRes = await buildClaimCreatorFeesTx(publicKeyStr, market.id);
      if (!buildRes.success || !buildRes.data?.transactionBase64) {
        throw new Error(buildRes.error?.message || 'Failed to construct creator fee claim transaction.');
      }

      setClaimStatusMsg({ id: market.id, status: 'signing', msg: 'Approve fee claim in your wallet...' });
      const txBuffer = Buffer.from(buildRes.data.transactionBase64, 'base64');
      const tx = Transaction.from(txBuffer);
      const signed = await signTransaction(tx);
      const serialized = signed.serialize({ requireAllSignatures: false, verifySignatures: false });

      setClaimStatusMsg({ id: market.id, status: 'broadcasting', msg: 'Broadcasting fee claim to Solana...' });
      const broadcastRes = await broadcastSignedTx({ signedTransactionBase64: serialized.toString('base64') });
      if (!broadcastRes.success || !broadcastRes.data?.signature) {
        throw new Error(broadcastRes.error?.message || 'Broadcast failed.');
      }

      setClaimStatusMsg({
        id: market.id,
        status: 'success',
        msg: 'Accrued creator fees successfully claimed!',
        tx: broadcastRes.data.signature,
      });
      loadCreatedMarkets();
    } catch (err: any) {
      setClaimStatusMsg({
        id: market.id,
        status: 'error',
        msg: err?.message || 'Creator fee claim cancelled or failed.',
      });
    } finally {
      setClaimingCreatorFeeId(null);
    }
  };

  // Filtered positions based on active pill
  const filteredPositions = useMemo(() => {
    return positions.filter((p) => {
      if (filterPhase === 'all') return true;
      if (filterPhase === 'open') return p.marketPhase === 'primary_issuance' || p.marketStatus === 'active';
      if (filterPhase === 'secondary') return p.marketPhase === 'secondary_trading';
      if (filterPhase === 'resolved') return p.marketStatus === 'resolved' || p.marketPhase === 'resolved';
      if (filterPhase === 'claimable') return p.canClaim || p.claimState === 'claimable';
      return true;
    });
  }, [positions, filterPhase]);

  // Claimable positions list
  const claimablePositions = useMemo(() => {
    return positions.filter((p) => (p.canClaim || p.claimState === 'claimable') && !p.claimed);
  }, [positions]);

  // Portfolio Totals (Only calculating where reliable)
  const portfolioSummary = useMemo(() => {
    let totalInvested = 0;
    let totalCurrentValue = 0;
    let hasAllValues = true;

    positions.forEach((p) => {
      totalInvested += p.totalInvested || 0;
      if (typeof p.currentValue === 'number') {
        totalCurrentValue += p.currentValue;
      } else {
        hasAllValues = false;
      }
    });

    const netPnl = hasAllValues && totalInvested > 0 ? totalCurrentValue - totalInvested : null;
    const netPnlPct = netPnl !== null && totalInvested > 0 ? (netPnl / totalInvested) * 100 : null;

    return {
      totalInvested,
      totalCurrentValue: hasAllValues ? totalCurrentValue : null,
      netPnl,
      netPnlPct,
      positionsCount: positions.length,
      claimableCount: claimablePositions.length,
    };
  }, [positions, claimablePositions]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-[#05051a] border border-[rgba(138,32,255,0.25)] rounded-2xl p-6 sm:p-8 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F5F5F7] font-sans">
                Portfolio & Positions
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#100126] border border-[#8A20FF]/35 text-[#D4A5FF] font-semibold">
                Panta Engine
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full inline-flex items-center gap-1.5 bg-[#080821] border border-[rgba(138,32,255,0.25)] text-[#A7A7B8]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Solana Devnet</span>
              </span>
            </div>
            <p className="text-xs text-[#A7A7B8]">
              Manage Panta prediction market positions, claim resolved payouts, and collect creator royalties.
            </p>
          </div>

          {/* Wallet State & Refresh */}
          <div className="flex items-center gap-2 font-mono text-xs">
            {connected && publicKeyStr ? (
              <button
                type="button"
                onClick={() => loadPositions(true)}
                disabled={isRefreshing}
                className="px-3 py-2 rounded-xl bg-[#080821] hover:bg-[#100126] border border-[rgba(138,32,255,0.25)] text-[#F5F5F7] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title="Refresh portfolio from Panta"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#8A20FF] ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onOpenWalletModal()}
                className="px-4 py-2 rounded-xl bg-[#8A20FF] hover:bg-[#670CDC] text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
        </div>

        {/* Portfolio Summary Strip */}
        {connected && publicKeyStr && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[rgba(138,32,255,0.18)] font-mono text-xs">
            <div className="bg-[#080821] p-3 rounded-xl border border-[rgba(138,32,255,0.15)]">
              <span className="text-[#7E6D96] block text-[10px] uppercase">Active Positions</span>
              <span className="text-base font-bold text-[#F5F5F7] mt-0.5 block">
                {portfolioSummary.positionsCount}
              </span>
            </div>

            <div className="bg-[#080821] p-3 rounded-xl border border-[rgba(138,32,255,0.15)]">
              <span className="text-[#7E6D96] block text-[10px] uppercase">Total Invested</span>
              <span className="text-base font-bold text-[#F5F5F7] mt-0.5 block">
                {formatCurrency(portfolioSummary.totalInvested, 'USD', 2)}
              </span>
            </div>

            <div className="bg-[#080821] p-3 rounded-xl border border-[rgba(138,32,255,0.15)]">
              <span className="text-[#7E6D96] block text-[10px] uppercase">Portfolio Value</span>
              <span className="text-base font-bold text-[#F5F5F7] mt-0.5 block">
                {portfolioSummary.totalCurrentValue !== null
                  ? formatCurrency(portfolioSummary.totalCurrentValue, 'USD', 2)
                  : '—'}
              </span>
            </div>

            <div className="bg-[#080821] p-3 rounded-xl border border-[rgba(138,32,255,0.15)]">
              <span className="text-[#7E6D96] block text-[10px] uppercase">Claimable Payouts</span>
              <span className={`text-base font-bold mt-0.5 block ${portfolioSummary.claimableCount > 0 ? 'text-emerald-400' : 'text-[#A7A7B8]'}`}>
                {portfolioSummary.claimableCount} {portfolioSummary.claimableCount === 1 ? 'Market' : 'Markets'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-[rgba(138,32,255,0.18)] pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveSubTab('positions')}
            className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'positions'
                ? 'bg-[#8A20FF] text-white shadow-md'
                : 'bg-[#080821] text-[#A7A7B8] hover:text-[#F5F5F7]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>My Positions ({positions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('claimable')}
            className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'claimable'
                ? 'bg-[#8A20FF] text-white shadow-md'
                : 'bg-[#080821] text-[#A7A7B8] hover:text-[#F5F5F7]'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span>Claimable ({claimablePositions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('creator-markets')}
            className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'creator-markets'
                ? 'bg-[#8A20FF] text-white shadow-md'
                : 'bg-[#080821] text-[#A7A7B8] hover:text-[#F5F5F7]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>My Markets ({createdMarkets.length})</span>
          </button>
        </div>

        {/* Quick Filter for Positions tab */}
        {activeSubTab === 'positions' && (
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            {(['all', 'open', 'secondary', 'resolved', 'claimable'] as const).map((phase) => (
              <button
                key={phase}
                type="button"
                onClick={() => setFilterPhase(phase)}
                className={`px-2.5 py-1 rounded-lg uppercase transition-colors cursor-pointer ${
                  filterPhase === phase
                    ? 'bg-[#100126] text-[#D4A5FF] border border-[#8A20FF]/40 font-bold'
                    : 'text-[#7E6D96] hover:text-[#A7A7B8]'
                }`}
              >
                {phase}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Global Status Message Bar */}
      {claimStatusMsg && (
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-mono animate-in fade-in ${
          claimStatusMsg.status === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : claimStatusMsg.status === 'error'
            ? 'bg-red-500/10 border-red-500/30 text-red-300'
            : 'bg-[#100126] border-[#8A20FF]/35 text-[#D4A5FF]'
        }`}>
          <div className="flex items-center gap-2">
            {claimStatusMsg.status === 'signing' || claimStatusMsg.status === 'broadcasting' ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#8A20FF]" />
            ) : claimStatusMsg.status === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
            <span>{claimStatusMsg.msg}</span>
          </div>

          <div className="flex items-center gap-2">
            {claimStatusMsg.tx && (
              <a
                href={`https://explorer.solana.com/tx/${claimStatusMsg.tx}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white"
              >
                View TX
              </a>
            )}
            <button
              type="button"
              onClick={() => setClaimStatusMsg(null)}
              className="text-[#A7A7B8] hover:text-white ml-2 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* WALLET NOT CONNECTED EMPTY STATE */}
      {!connected || !publicKeyStr ? (
        <div className="bg-[#05051a] border border-[rgba(138,32,255,0.2)] rounded-2xl p-12 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#080821] border border-[rgba(138,32,255,0.25)] flex items-center justify-center text-[#8A20FF]">
            <Wallet className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#F5F5F7]">Wallet Disconnected</h3>
            <p className="text-xs font-mono text-[#A7A7B8] max-w-md mx-auto">
              Connect your Solana browser wallet to view your active Panta prediction positions, claim winning outcomes, and collect creator fees.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenWalletModal()}
            className="px-6 py-2.5 rounded-xl bg-[#8A20FF] hover:bg-[#670CDC] text-xs font-mono font-bold text-white transition-all cursor-pointer shadow-md"
          >
            Connect Wallet
          </button>
        </div>
      ) : loading ? (
        /* LOADING STATE */
        <div className="bg-[#05051a] border border-[rgba(138,32,255,0.2)] rounded-2xl p-12 text-center space-y-3 shadow-xl">
          <Loader2 className="w-7 h-7 animate-spin mx-auto text-[#8A20FF]" />
          <p className="text-xs font-mono text-[#A7A7B8]">Querying Panta positions for {publicKeyStr.slice(0, 6)}...{publicKeyStr.slice(-6)}...</p>
        </div>
      ) : activeSubTab === 'positions' ? (
        /* TAB 1: POSITIONS LIST */
        filteredPositions.length === 0 ? (
          <div className="bg-[#05051a] border border-[rgba(138,32,255,0.2)] rounded-2xl p-12 text-center space-y-4 shadow-xl">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#080821] border border-[rgba(138,32,255,0.25)] flex items-center justify-center text-[#A7A7B8]">
              <TrendingUp className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#F5F5F7]">No positions yet.</h3>
              <p className="text-xs font-mono text-[#A7A7B8] max-w-md mx-auto">
                You haven't acquired any YES or NO shares in active prediction markets yet.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab('predictions')}
              className="px-6 py-2.5 rounded-xl bg-[#8A20FF] hover:bg-[#670CDC] text-xs font-mono font-bold text-white transition-all cursor-pointer shadow-md inline-flex items-center gap-1.5"
            >
              <span>EXPLORE MARKETS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* POSITIONS TABLE / TERMINAL */
          <div className="bg-[#05051a] border border-[rgba(138,32,255,0.25)] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[rgba(138,32,255,0.2)] bg-[#000010]/70 text-[#7E6D96] uppercase text-[10px]">
                    <th className="py-3 px-4">Market</th>
                    <th className="py-3 px-4">Side</th>
                    <th className="py-3 px-4 text-right">Shares</th>
                    <th className="py-3 px-4 text-right">Avg Entry</th>
                    <th className="py-3 px-4 text-right">Current Price</th>
                    <th className="py-3 px-4 text-right">Value</th>
                    <th className="py-3 px-4 text-right">P/L</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(138,32,255,0.12)]">
                  {filteredPositions.map((pos) => {
                    const price = pos.currentPrice ?? null;
                    const val = pos.currentValue ?? (price !== null ? pos.shares * price : null);
                    const pnl = pos.unrealizedPnl ?? (val !== null ? val - pos.totalInvested : null);
                    const isClaimable = (pos.canClaim || pos.claimState === 'claimable') && !pos.claimed;

                    return (
                      <tr
                        key={pos.id}
                        onClick={() => setSelectedPosition(pos)}
                        className="hover:bg-[#080821]/80 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-4 font-sans font-medium text-[#F5F5F7] max-w-xs truncate">
                          <span className="block truncate" title={pos.marketTitle}>{pos.marketTitle}</span>
                          <span className="text-[10px] font-mono text-[#7E6D96] block">
                            {pos.marketId.replace(/^panta-/, '')}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              pos.outcome === 'YES'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                                : 'bg-[#8A20FF]/25 text-[#D4A5FF] border border-[#8A20FF]/35'
                            }`}
                          >
                            {pos.outcome}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right font-semibold text-[#F5F5F7]">
                          {formatNumber(pos.shares, 0)}
                        </td>

                        <td className="py-3.5 px-4 text-right text-[#A7A7B8]">
                          {formatCurrency(pos.averageCost, 'USD', 2)}
                        </td>

                        <td className="py-3.5 px-4 text-right text-[#F5F5F7]">
                          {price !== null ? formatCurrency(price, 'USD', 2) : '—'}
                        </td>

                        <td className="py-3.5 px-4 text-right font-semibold text-[#F5F5F7]">
                          {val !== null ? formatCurrency(val, 'USD', 2) : '—'}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {pnl !== null ? (
                            <span className={`font-semibold ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {pnl >= 0 ? '+' : ''}{formatCurrency(pnl, 'USD', 2)}
                            </span>
                          ) : (
                            <span className="text-[#7E6D96]">—</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            pos.claimed
                              ? 'bg-[#080821] text-[#7E6D96]'
                              : isClaimable
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : pos.marketStatus === 'resolved'
                              ? 'bg-[#080821] text-[#7E6D96]'
                              : 'bg-[#100126] text-[#D4A5FF] border border-[#8A20FF]/20'
                          }`}>
                            {pos.claimed
                              ? 'CLAIMED'
                              : isClaimable
                              ? 'CLAIMABLE'
                              : pos.marketStatus === 'resolved'
                              ? 'RESOLVED'
                              : (pos.marketPhase || 'OPEN').toUpperCase().replace('_', ' ')}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          {isClaimable ? (
                            <button
                              type="button"
                              onClick={() => handleClaimPosition(pos)}
                              disabled={claimingId === pos.id}
                              className="px-3 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[11px] transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {claimingId === pos.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'CLAIM'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedPosition(pos)}
                              className="text-[11px] text-[#8A20FF] hover:text-[#D4A5FF] underline cursor-pointer"
                            >
                              Details
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : activeSubTab === 'claimable' ? (
        /* TAB 2: CLAIMABLE ASSETS */
        claimablePositions.length === 0 ? (
          <div className="bg-[#05051a] border border-[rgba(138,32,255,0.2)] rounded-2xl p-12 text-center space-y-3 shadow-xl">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#080821] border border-[rgba(138,32,255,0.25)] flex items-center justify-center text-[#7E6D96]">
              <Award className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-[#F5F5F7]">No Claimable Winnings</h3>
            <p className="text-xs font-mono text-[#A7A7B8] max-w-md mx-auto">
              Positions become claimable once their associated market resolution is officially evaluated and verified by the oracle.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {claimablePositions.map((pos) => (
              <div
                key={pos.id}
                className="bg-[#05051a] border border-emerald-500/35 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl font-mono text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {pos.outcome} OUTCOME WON
                    </span>
                    <span className="text-[11px] text-emerald-400 font-bold">
                      Winning position ready to claim
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#F5F5F7] font-sans">
                    {pos.marketTitle}
                  </h4>
                  <div className="text-[11px] text-[#A7A7B8] flex items-center gap-3">
                    <span>{formatNumber(pos.shares, 0)} Shares</span>
                    <span>·</span>
                    <span>Redeemable Collateral: <strong className="text-emerald-400">{formatCurrency(pos.shares, 'USD', 2)} USDC</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedPosition(pos)}
                    className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-[#080821] hover:bg-[#100126] border border-[rgba(138,32,255,0.25)] text-[#F5F5F7] cursor-pointer"
                  >
                    View Details
                  </button>

                  <button
                    type="button"
                    onClick={() => handleClaimPosition(pos)}
                    disabled={claimingId === pos.id}
                    className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {claimingId === pos.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Award className="w-3.5 h-3.5" />
                        <span>CLAIM ({formatCurrency(pos.shares, 'USD', 2)})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* TAB 3: CREATOR MARKETS & ROYALTIES */
        createdMarkets.length === 0 ? (
          <div className="bg-[#05051a] border border-[rgba(138,32,255,0.2)] rounded-2xl p-12 text-center space-y-4 shadow-xl">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#080821] border border-[rgba(138,32,255,0.25)] flex items-center justify-center text-[#7E6D96]">
              <Layers className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#F5F5F7]">No Markets Created Yet</h3>
              <p className="text-xs font-mono text-[#A7A7B8] max-w-md mx-auto">
                Markets authored by this wallet will appear here with royalty tracking and accrued creator fee claim buttons.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab('create')}
              className="px-6 py-2.5 rounded-xl bg-[#8A20FF] hover:bg-[#670CDC] text-xs font-mono font-bold text-white transition-all cursor-pointer shadow-md inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Deploy New Market</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4 font-mono text-xs">
            {createdMarkets.map((market) => (
              <div
                key={market.id}
                className="bg-[#05051a] border border-[rgba(138,32,255,0.25)] rounded-2xl p-5 space-y-3 shadow-xl"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#100126] text-[#D4A5FF] border border-[#8A20FF]/30 uppercase">
                        {(market.marketPhase || 'ACTIVE').replace('_', ' ')}
                      </span>
                      <span className="text-[11px] text-[#A7A7B8]">
                        Author: {publicKeyStr.slice(0, 6)}...{publicKeyStr.slice(-6)}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-[#F5F5F7] font-sans">
                      {market.question || market.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleClaimCreatorFees(market)}
                      disabled={claimingCreatorFeeId === market.id}
                      className="px-4 py-2 rounded-xl bg-[#8A20FF] hover:bg-[#670CDC] text-white font-bold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {claimingCreatorFeeId === market.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'CLAIM CREATOR FEES'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[rgba(138,32,255,0.12)] text-[11px]">
                  <div>
                    <span className="text-[#7E6D96] block text-[10px]">Volume</span>
                    <span className="text-[#F5F5F7] font-bold">{formatCurrency(market.volume || 0, 'USD', 0)}</span>
                  </div>
                  <div>
                    <span className="text-[#7E6D96] block text-[10px]">Primary Phase</span>
                    <span className="text-[#F5F5F7] font-bold uppercase">{market.marketPhase || 'secondary'}</span>
                  </div>
                  <div>
                    <span className="text-[#7E6D96] block text-[10px]">Trades Count</span>
                    <span className="text-[#F5F5F7] font-bold">{market.tradeCount ?? '—'}</span>
                  </div>
                  <div>
                    <span className="text-[#7E6D96] block text-[10px]">Claimable Royalties</span>
                    <span className="text-emerald-400 font-bold">0.00 USDC</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Position Detail Modal */}
      {selectedPosition && (
        <PantaPositionDetailModal
          position={selectedPosition}
          onClose={() => setSelectedPosition(null)}
          onViewMarket={(mId) => {
            if (onSelectMarketDetail) {
              onSelectMarketDetail(mId);
            } else {
              onSelectTab('predictions');
            }
          }}
          onClaimSuccess={() => {
            loadPositions(true);
          }}
        />
      )}
    </div>
  );
};
