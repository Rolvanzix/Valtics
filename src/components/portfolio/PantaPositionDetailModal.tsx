import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Info,
  Clock,
  Layers,
  Award,
  Wallet
} from 'lucide-react';
import { Transaction } from '@solana/web3.js';
import { PantaPosition, ValticsPredictionMarket } from '../../types/panta';
import { requestClaimQuote, buildClaimTx, broadcastSignedTx, fetchPantaMarketById } from '../../services/pantaService';
import { useWallet } from '../../context/WalletContext';
import { formatCurrency, formatNumber } from '../../utils/format';

interface PantaPositionDetailModalProps {
  position: PantaPosition | null;
  onClose: () => void;
  onViewMarket?: (marketId: string) => void;
  onClaimSuccess?: (signature: string, positionId: string) => void;
}

export const PantaPositionDetailModal: React.FC<PantaPositionDetailModalProps> = ({
  position,
  onClose,
  onViewMarket,
  onClaimSuccess,
}) => {
  const { connected, publicKey, publicKeyStr, signTransaction, connect } = useWallet();

  const [market, setMarket] = useState<ValticsPredictionMarket | null>(null);
  const [loadingMarket, setLoadingMarket] = useState<boolean>(false);

  // Claim process states
  const [claimStage, setClaimStage] = useState<
    'idle' | 'checking_eligibility' | 'building_tx' | 'waiting_for_wallet' | 'broadcasting' | 'confirmed' | 'failed' | 'user_rejected'
  >('idle');
  const [claimEligibility, setClaimEligibility] = useState<{
    canClaim: boolean;
    claimableAmount: number;
    claimState?: string;
    reason?: string;
  } | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [txExplorerUrl, setTxExplorerUrl] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && claimStage !== 'waiting_for_wallet' && claimStage !== 'broadcasting') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, claimStage]);

  // Load associated market details
  useEffect(() => {
    if (!position?.marketId) return;
    setLoadingMarket(true);
    fetchPantaMarketById(position.marketId)
      .then((res) => {
        if (res.success && res.data) {
          setMarket(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingMarket(false));
  }, [position?.marketId]);

  // Check claim eligibility on mount if position is flagged or market resolved
  useEffect(() => {
    if (!position || !publicKeyStr) return;
    setClaimStage('checking_eligibility');
    requestClaimQuote(publicKeyStr, position.marketId)
      .then((res) => {
        if (res.success && res.data) {
          setClaimEligibility(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setClaimStage('idle'));
  }, [position, publicKeyStr]);

  // Execute Claim Flow: Eligibility -> Build TX -> Wallet Sign -> Broadcast
  const handleExecuteClaim = async () => {
    if (!position || !connected || !publicKeyStr || !publicKey) {
      setClaimError('Wallet must be connected to claim.');
      return;
    }

    setClaimError(null);

    // 1. Check eligibility
    setClaimStage('checking_eligibility');
    const quoteRes = await requestClaimQuote(publicKeyStr, position.marketId);
    if (!quoteRes.success || !quoteRes.data?.canClaim) {
      setClaimStage('failed');
      setClaimError(quoteRes.data?.reason || quoteRes.error?.message || 'Position is not currently eligible for payout claim.');
      return;
    }

    // 2. Build Unsigned Transaction
    setClaimStage('building_tx');
    const buildRes = await buildClaimTx(publicKeyStr, position.marketId);
    if (!buildRes.success || !buildRes.data?.transactionBase64) {
      setClaimStage('failed');
      setClaimError(buildRes.error?.message || 'Failed to construct claim transaction.');
      return;
    }

    // 3. User Wallet Approval
    setClaimStage('waiting_for_wallet');
    let signedTxBase64: string;
    try {
      const txBuffer = Buffer.from(buildRes.data.transactionBase64, 'base64');
      const tx = Transaction.from(txBuffer);
      const signedTx = await signTransaction(tx);
      const serialized = signedTx.serialize({ requireAllSignatures: false, verifySignatures: false });
      signedTxBase64 = serialized.toString('base64');
    } catch (err: any) {
      const msg = (err?.message || '').toLowerCase();
      if (err?.code === 4001 || msg.includes('user rejected') || msg.includes('cancelled') || msg.includes('canceled')) {
        setClaimStage('user_rejected');
        setClaimError('Claim transaction was cancelled in your wallet.');
      } else {
        setClaimStage('failed');
        setClaimError(err?.message || 'Wallet signing failed.');
      }
      return;
    }

    // 4. Broadcast & Confirmation
    setClaimStage('broadcasting');
    const broadcastRes = await broadcastSignedTx({
      signedTransactionBase64: signedTxBase64,
    });

    if (!broadcastRes.success || !broadcastRes.data?.signature) {
      setClaimStage('failed');
      setClaimError(broadcastRes.error?.message || 'Transaction broadcast or on-chain execution failed.');
      return;
    }

    const sig = broadcastRes.data.signature;
    setTxSignature(sig);
    setTxExplorerUrl(broadcastRes.data.explorerUrl);
    setClaimStage('confirmed');

    if (onClaimSuccess) {
      onClaimSuccess(sig, position.id);
    }
  };

  if (!position) return null;

  const currentPrice = position.currentPrice ?? (position.outcome === 'YES' ? market?.yesPrice : market?.noPrice) ?? null;
  const positionValue = position.currentValue ?? (currentPrice !== null ? position.shares * currentPrice : null);
  const pnl = position.unrealizedPnl ?? (positionValue !== null ? positionValue - position.totalInvested : null);
  const pnlPct = position.totalInvested > 0 && pnl !== null ? (pnl / position.totalInvested) * 100 : null;

  const marketPhase = position.marketPhase || market?.marketPhase || 'secondary_trading';
  const marketStatus = position.marketStatus || market?.status || 'active';
  const isWinningClaimable = (position.canClaim || claimEligibility?.canClaim) && !position.claimed;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-xl bg-[#05051a] border border-[rgba(138,32,255,0.35)] rounded-2xl p-5 sm:p-7 shadow-2xl text-[#F5F5F7]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-[rgba(138,32,255,0.18)]">
          <div className="space-y-1.5 pr-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold ${
                  position.outcome === 'YES'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-[#8A20FF]/25 text-[#D4A5FF] border border-[#8A20FF]/40'
                }`}
              >
                {position.outcome} Outcome Position
              </span>

              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#080821] text-[#A7A7B8] border border-[rgba(138,32,255,0.2)] uppercase">
                {marketPhase.replace('_', ' ')}
              </span>

              {marketStatus === 'resolved' && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                  RESOLVED
                </span>
              )}
            </div>

            <h2 className="text-base sm:text-lg font-bold text-[#F5F5F7] leading-snug">
              {position.marketTitle || market?.question || 'Prediction Market Position'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={claimStage === 'waiting_for_wallet' || claimStage === 'broadcasting'}
            className="p-1.5 rounded-lg bg-[#080821] hover:bg-[#100126] border border-[rgba(138,32,255,0.25)] text-[#A7A7B8] hover:text-[#F5F5F7] transition-colors cursor-pointer disabled:opacity-40"
            title="Close position details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Claim Success State */}
        {claimStage === 'confirmed' ? (
          <div className="py-6 space-y-5 animate-in fade-in">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-[#F5F5F7]">Payout Successfully Claimed!</h3>
              <p className="text-xs font-mono text-[#A7A7B8]">
                Collateral payout has been redeemed and credited to your Solana wallet.
              </p>
            </div>

            <div className="rounded-xl bg-[#000010] border border-[rgba(138,32,255,0.2)] p-4 space-y-2.5 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-[#A7A7B8]">Claimed Amount</span>
                <span className="text-emerald-400 font-bold">
                  {formatCurrency(claimEligibility?.claimableAmount || position.shares, 'USD', 2)} USDC
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A7A7B8]">Redeemed Shares</span>
                <span className="text-[#F5F5F7]">{formatNumber(position.shares, 0)} {position.outcome}</span>
              </div>
              {txSignature && (
                <div className="pt-2 border-t border-[rgba(138,32,255,0.12)]">
                  <span className="text-[#A7A7B8] block text-[11px] mb-1">Transaction Signature</span>
                  <div className="p-2 rounded bg-[#080821] text-[11px] break-all text-[#D4A5FF] select-all">
                    {txSignature}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              {txExplorerUrl && (
                <a
                  href={txExplorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-1/2 py-2.5 rounded-xl bg-[#080821] hover:bg-[#100126] border border-[rgba(138,32,255,0.25)] text-xs font-mono text-[#F5F5F7] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>View on Explorer</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#8A20FF]" />
                </a>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 py-2.5 rounded-xl bg-[#8A20FF] hover:bg-[#670CDC] text-xs font-mono font-semibold text-white transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Position Details & Metrics */
          <div className="py-4 space-y-5">
            {/* Winning Banner if Claimable */}
            {isWinningClaimable && (
              <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2 text-emerald-300">
                  <Award className="w-4 h-4 shrink-0 text-emerald-400" />
                  <div>
                    <span className="font-bold block">Winning position ready to claim</span>
                    <span className="text-[11px] text-emerald-400/80">
                      Redeem 1:1 payout collateral for {formatCurrency(claimEligibility?.claimableAmount || position.shares, 'USD', 2)} USDC
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleExecuteClaim}
                  disabled={claimStage !== 'idle'}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {claimStage === 'checking_eligibility' || claimStage === 'building_tx' || claimStage === 'waiting_for_wallet' || claimStage === 'broadcasting' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'CLAIM'
                  )}
                </button>
              </div>
            )}

            {/* Core Position Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="bg-[#000010] p-3 rounded-xl border border-[rgba(138,32,255,0.18)]">
                <span className="text-[#7E6D96] block text-[10px] uppercase">Shares Held</span>
                <span className="text-base font-bold text-[#F5F5F7] mt-0.5 block">
                  {formatNumber(position.shares, 2)}
                </span>
              </div>

              <div className="bg-[#000010] p-3 rounded-xl border border-[rgba(138,32,255,0.18)]">
                <span className="text-[#7E6D96] block text-[10px] uppercase">Avg Entry Cost</span>
                <span className="text-base font-bold text-[#F5F5F7] mt-0.5 block">
                  {formatCurrency(position.averageCost, 'USD', 2)}
                </span>
              </div>

              <div className="bg-[#000010] p-3 rounded-xl border border-[rgba(138,32,255,0.18)]">
                <span className="text-[#7E6D96] block text-[10px] uppercase">Market Price</span>
                <span className="text-base font-bold text-[#F5F5F7] mt-0.5 block">
                  {currentPrice !== null ? formatCurrency(currentPrice, 'USD', 2) : '—'}
                </span>
              </div>

              <div className="bg-[#000010] p-3 rounded-xl border border-[rgba(138,32,255,0.18)]">
                <span className="text-[#7E6D96] block text-[10px] uppercase">Current Value</span>
                <span className="text-base font-bold text-[#F5F5F7] mt-0.5 block">
                  {positionValue !== null ? formatCurrency(positionValue, 'USD', 2) : '—'}
                </span>
              </div>
            </div>

            {/* Financial Ledger Details */}
            <div className="rounded-xl bg-[#000010] border border-[rgba(138,32,255,0.18)] p-4 space-y-2.5 font-mono text-xs">
              <div className="flex justify-between py-1 border-b border-[rgba(138,32,255,0.12)]">
                <span className="text-[#A7A7B8]">Total Invested</span>
                <span className="text-[#F5F5F7] font-semibold">{formatCurrency(position.totalInvested, 'USD', 2)} USDC</span>
              </div>

              <div className="flex justify-between py-1 border-b border-[rgba(138,32,255,0.12)]">
                <span className="text-[#A7A7B8]">Unrealized P/L</span>
                {pnl !== null ? (
                  <span className={`font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {pnl >= 0 ? '+' : ''}{formatCurrency(pnl, 'USD', 2)} ({pnlPct !== null ? `${pnl >= 0 ? '+' : ''}${pnlPct.toFixed(1)}%` : ''})
                  </span>
                ) : (
                  <span className="text-[#7E6D96]">Not reliably calculable</span>
                )}
              </div>

              <div className="flex justify-between py-1 border-b border-[rgba(138,32,255,0.12)]">
                <span className="text-[#A7A7B8]">Claim Status</span>
                <span className="font-semibold text-[#D4A5FF]">
                  {position.claimed
                    ? 'Already Claimed'
                    : isWinningClaimable
                    ? 'Claimable Payout'
                    : marketStatus === 'resolved'
                    ? 'Resolved (Unredeemable / Lost)'
                    : 'Active / Open Position'}
                </span>
              </div>

              {(position.endTime || position.resolutionTime || market?.endTime) && (
                <div className="flex justify-between py-1">
                  <span className="text-[#A7A7B8]">Event Cutoff / Resolution</span>
                  <span className="text-[#F5F5F7]">
                    {new Date(position.resolutionTime || position.endTime || market!.endTime!).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {/* Claim Stage Progression Notice */}
            {(claimStage === 'building_tx' || claimStage === 'waiting_for_wallet' || claimStage === 'broadcasting') && (
              <div className="p-3 rounded-xl bg-[#100126] border border-[#8A20FF]/35 space-y-1.5 font-mono text-xs">
                <div className="flex items-center gap-2 text-[#D4A5FF] font-semibold">
                  <Loader2 className="w-4 h-4 animate-spin text-[#8A20FF]" />
                  <span>
                    {claimStage === 'building_tx' && 'Preparing claim transaction on Solana...'}
                    {claimStage === 'waiting_for_wallet' && 'Waiting for wallet signature in browser...'}
                    {claimStage === 'broadcasting' && 'Broadcasting transaction to Solana Devnet...'}
                  </span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {claimError && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2 text-xs font-mono text-amber-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{claimError}</span>
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              {onViewMarket && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onViewMarket(position.marketId);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#080821] hover:bg-[#100126] border border-[rgba(138,32,255,0.25)] text-xs font-mono font-semibold text-[#F5F5F7] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>VIEW MARKET</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#8A20FF]" />
                </button>
              )}

              {isWinningClaimable && (
                <button
                  type="button"
                  onClick={handleExecuteClaim}
                  disabled={claimStage !== 'idle'}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-lg disabled:opacity-50"
                >
                  <span>CLAIM WINNINGS ({formatCurrency(claimEligibility?.claimableAmount || position.shares, 'USD', 2)})</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
