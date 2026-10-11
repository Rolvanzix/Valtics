import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Wallet,
  RefreshCw,
  Coins
} from 'lucide-react';
import { Transaction } from '@solana/web3.js';
import { ValticsPredictionMarket, PantaTradeQuote } from '../../types/panta';
import { requestTradeQuote, buildBuyTx, broadcastSignedTx } from '../../services/pantaService';
import { useWallet } from '../../context/WalletContext';
import { formatCurrency, formatNumber } from '../../utils/format';

export type TradeStage =
  | 'idle'
  | 'preparing_quote'
  | 'quote_received'
  | 'building_tx'
  | 'waiting_for_wallet'
  | 'submitting'
  | 'confirming'
  | 'confirmed'
  | 'failed'
  | 'user_rejected';

interface PantaTradingModalProps {
  market: ValticsPredictionMarket | null;
  initialOutcome?: 'YES' | 'NO';
  onClose: () => void;
  onTradeSuccess?: (signature: string, outcome: 'YES' | 'NO', amount: number) => void;
}

export const PantaTradingModal: React.FC<PantaTradingModalProps> = ({
  market,
  initialOutcome = 'YES',
  onClose,
  onTradeSuccess,
}) => {
  const { connected, publicKey, publicKeyStr, signTransaction, connect } = useWallet();

  const [outcome, setOutcome] = useState<'YES' | 'NO'>(initialOutcome);
  const [amountUsdc, setAmountUsdc] = useState<string>('25');
  const [tradeStage, setTradeStage] = useState<TradeStage>('idle');
  const [quote, setQuote] = useState<PantaTradeQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [txExplorerUrl, setTxExplorerUrl] = useState<string | null>(null);
  const [tradeTimestamp, setTradeTimestamp] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && tradeStage !== 'waiting_for_wallet' && tradeStage !== 'submitting' && tradeStage !== 'confirming') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, tradeStage]);

  // Determine market phase
  const currentPhase = market?.marketPhase || (market?.status === 'resolved' ? 'resolved' : 'secondary_trading');
  const isPrimary = currentPhase === 'primary_issuance';
  const isMarketResolved = market?.status === 'resolved' || currentPhase === 'resolved';

  const numAmount = useMemo(() => {
    const parsed = parseFloat(amountUsdc);
    return isNaN(parsed) || parsed <= 0 ? 0 : parsed;
  }, [amountUsdc]);

  // Fetch Quote from Real Panta Endpoint
  const fetchQuote = useCallback(
    async (targetOutcome: 'YES' | 'NO', amountVal: number) => {
      if (!market || amountVal <= 0 || !isPrimary) {
        setQuote(null);
        return;
      }

      setTradeStage('preparing_quote');
      setQuoteError(null);

      const res = await requestTradeQuote({
        marketId: market.id,
        outcome: targetOutcome,
        amountSolOrUsdc: amountVal,
      });

      if (res.success && res.data) {
        setQuote(res.data);
        setTradeStage('quote_received');
      } else {
        setQuote(null);
        setQuoteError(res.error?.message || 'Unable to fetch price quote from Panta protocol');
        setTradeStage('idle');
      }
    },
    [market, isPrimary]
  );

  // Debounce quote request
  useEffect(() => {
    if (!isPrimary || isMarketResolved) return;
    if (numAmount < 1) {
      setQuote(null);
      setTradeStage('idle');
      return;
    }

    const t = setTimeout(() => {
      fetchQuote(outcome, numAmount);
    }, 350);

    return () => clearTimeout(t);
  }, [outcome, numAmount, isPrimary, isMarketResolved, fetchQuote]);

  // Handle Trade Execution
  const handleExecuteTrade = async () => {
    if (!market || !connected || !publicKeyStr || !publicKey) {
      setErrorMessage('Please connect your Solana wallet first.');
      return;
    }

    if (numAmount < 1) {
      setErrorMessage('Minimum purchase amount is 1 USDC.');
      return;
    }

    setErrorMessage(null);

    // 1. Check quote freshness
    let currentQuote = quote;
    if (!currentQuote || (currentQuote.quoteExpiry && Date.now() > currentQuote.quoteExpiry)) {
      setTradeStage('preparing_quote');
      const qRes = await requestTradeQuote({
        marketId: market.id,
        outcome,
        amountSolOrUsdc: numAmount,
      });
      if (!qRes.success || !qRes.data) {
        setErrorMessage(qRes.error?.message || 'Quote expired or failed to refresh. Please retry.');
        setTradeStage('failed');
        return;
      }
      currentQuote = qRes.data;
      setQuote(currentQuote);
    }

    // 2. Build Unsigned Transaction on Server
    setTradeStage('building_tx');
    const buildRes = await buildBuyTx({
      marketId: market.id,
      buyerWallet: publicKeyStr,
      outcome,
      amount: numAmount,
    });

    if (!buildRes.success || !buildRes.data?.transactionBase64) {
      setErrorMessage(buildRes.error?.message || 'Failed to construct transaction with Panta protocol.');
      setTradeStage('failed');
      return;
    }

    // 3. User Wallet Signing
    setTradeStage('waiting_for_wallet');
    let signedTxBase64: string;
    try {
      const txBuffer = Buffer.from(buildRes.data.transactionBase64, 'base64');
      const tx = Transaction.from(txBuffer);

      // Request signature from user's connected wallet (Phantom, Solflare, Backpack)
      const signedTx = await signTransaction(tx);
      const serialized = signedTx.serialize({ requireAllSignatures: false, verifySignatures: false });
      signedTxBase64 = serialized.toString('base64');
    } catch (err: any) {
      const msg = (err?.message || '').toLowerCase();
      if (err?.code === 4001 || msg.includes('user rejected') || msg.includes('cancelled') || msg.includes('canceled')) {
        setTradeStage('user_rejected');
        setErrorMessage('Transaction cancelled by user in wallet.');
      } else {
        setTradeStage('failed');
        setErrorMessage(err?.message || 'Wallet signature request failed.');
      }
      return;
    }

    // 4. Submit & Broadcast
    setTradeStage('submitting');
    setTradeStage('confirming');

    const broadcastRes = await broadcastSignedTx({
      signedTransactionBase64: signedTxBase64,
    });

    if (!broadcastRes.success || !broadcastRes.data?.signature) {
      setTradeStage('failed');
      setErrorMessage(broadcastRes.error?.message || 'Transaction submission or verification failed on Solana.');
      return;
    }

    // 5. Confirmed Success
    const sig = broadcastRes.data.signature;
    setTxSignature(sig);
    setTxExplorerUrl(broadcastRes.data.explorerUrl);
    setTradeTimestamp(new Date().toISOString());
    setTradeStage('confirmed');

    if (onTradeSuccess) {
      onTradeSuccess(sig, outcome, numAmount);
    }
  };

  if (!market) return null;

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
          <div className="space-y-1 pr-6">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#100126] text-[#D4A5FF] border border-[#8A20FF]/30">
                Panta Primary Issuance
              </span>
              <span className="text-xs font-mono text-[#A7A7B8]">
                {market.settlementCurrency || 'USDC'} Settlement
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#F5F5F7] line-clamp-2 leading-snug">
              {market.question || market.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={tradeStage === 'waiting_for_wallet' || tradeStage === 'submitting' || tradeStage === 'confirming'}
            className="p-1.5 rounded-lg bg-[#080821] hover:bg-[#100126] border border-[rgba(138,32,255,0.25)] text-[#A7A7B8] hover:text-[#F5F5F7] transition-colors cursor-pointer disabled:opacity-40"
            title="Close trading modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Phase Check: Only primary market allows issuance */}
        {!isPrimary ? (
          <div className="py-8 space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#100126] border border-[#8A20FF]/40 flex items-center justify-center text-[#FFA742]">
              <Info className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-[#F5F5F7]">
                {isMarketResolved ? 'Market Resolved' : 'Secondary Trading Phase'}
              </h3>
              <p className="text-xs font-mono text-[#A7A7B8] max-w-md mx-auto">
                {isMarketResolved
                  ? 'This prediction market has resolved. Primary share issuance is closed.'
                  : 'Primary issuance has completed. This market is currently in the order-book phase.'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#000010] border border-[rgba(138,32,255,0.2)] text-xs font-mono text-[#FFA742]">
              Secondary trading integration coming next.
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-[#080821] hover:bg-[#100126] border border-[rgba(138,32,255,0.3)] text-xs font-mono text-[#F5F5F7] cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : tradeStage === 'confirmed' ? (
          /* TRADE CONFIRMATION SCREEN */
          <div className="py-6 space-y-5 animate-in fade-in">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-[#F5F5F7]">Trade Confirmed on Solana</h3>
              <p className="text-xs font-mono text-[#A7A7B8]">
                Your {outcome} outcome position was successfully acquired.
              </p>
            </div>

            <div className="rounded-xl bg-[#000010] border border-[rgba(138,32,255,0.2)] p-4 space-y-3 font-mono text-xs">
              <div className="flex justify-between py-1 border-b border-[rgba(138,32,255,0.12)]">
                <span className="text-[#A7A7B8]">Outcome Purchased</span>
                <span className={`font-bold ${outcome === 'YES' ? 'text-emerald-400' : 'text-[#8A20FF]'}`}>
                  {outcome} Outcome Shares
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[rgba(138,32,255,0.12)]">
                <span className="text-[#A7A7B8]">Amount Paid</span>
                <span className="text-[#F5F5F7] font-semibold">{formatCurrency(numAmount, 'USD', 2)}</span>
              </div>
              {quote?.expectedShares && (
                <div className="flex justify-between py-1 border-b border-[rgba(138,32,255,0.12)]">
                  <span className="text-[#A7A7B8]">Shares Acquired</span>
                  <span className="text-[#F5F5F7] font-semibold">{formatNumber(quote.expectedShares, 2)}</span>
                </div>
              )}
              {tradeTimestamp && (
                <div className="flex justify-between py-1 border-b border-[rgba(138,32,255,0.12)]">
                  <span className="text-[#A7A7B8]">Timestamp</span>
                  <span className="text-[#A7A7B8]">{new Date(tradeTimestamp).toLocaleTimeString()}</span>
                </div>
              )}
              {txSignature && (
                <div className="pt-2">
                  <span className="text-[#A7A7B8] block text-[11px] mb-1">Transaction Signature</span>
                  <div className="p-2 rounded bg-[#080821] text-[11px] break-all text-[#D4A5FF] select-all">
                    {txSignature}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              {txExplorerUrl && (
                <a
                  href={txExplorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-1/2 py-2.5 rounded-xl bg-[#080821] hover:bg-[#100126] border border-[rgba(138,32,255,0.25)] text-xs font-mono text-[#F5F5F7] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>View on Solana Explorer</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#8A20FF]" />
                </a>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-1/2 py-2.5 rounded-xl bg-[#8A20FF] hover:bg-[#670CDC] text-xs font-mono font-semibold text-white transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* TRADING INTERFACE */
          <div className="py-4 space-y-4">
            {/* Outcome Selection Buttons */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#A7A7B8] block">Select Outcome</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setOutcome('YES')}
                  disabled={tradeStage === 'waiting_for_wallet' || tradeStage === 'submitting' || tradeStage === 'confirming'}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    outcome === 'YES'
                      ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-lg'
                      : 'bg-[#080821] border-[rgba(138,32,255,0.2)] text-[#A7A7B8] hover:text-[#F5F5F7]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-sm text-emerald-400">YES</span>
                    <span className="text-xs font-mono text-[#F5F5F7]">
                      {market.yesPrice !== null ? formatCurrency(market.yesPrice, 'USD', 2) : '—'}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#A7A7B8] block">
                    Pays $1.00 on YES resolution
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setOutcome('NO')}
                  disabled={tradeStage === 'waiting_for_wallet' || tradeStage === 'submitting' || tradeStage === 'confirming'}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    outcome === 'NO'
                      ? 'bg-[#8A20FF]/20 border-[#8A20FF] text-white shadow-lg'
                      : 'bg-[#080821] border-[rgba(138,32,255,0.2)] text-[#A7A7B8] hover:text-[#F5F5F7]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-sm text-[#D4A5FF]">NO</span>
                    <span className="text-xs font-mono text-[#F5F5F7]">
                      {market.noPrice !== null ? formatCurrency(market.noPrice, 'USD', 2) : '—'}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#A7A7B8] block">
                    Pays $1.00 on NO resolution
                  </span>
                </button>
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <label className="text-[#A7A7B8]">Amount (USDC)</label>
                <div className="flex items-center gap-1.5">
                  {['10', '25', '50', '100'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmountUsdc(preset)}
                      className="px-2 py-0.5 rounded bg-[#080821] hover:bg-[#100126] border border-[rgba(138,32,255,0.2)] text-[10px] text-[#A7A7B8] hover:text-[#F5F5F7] cursor-pointer"
                    >
                      ${preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={amountUsdc}
                  onChange={(e) => setAmountUsdc(e.target.value)}
                  disabled={tradeStage === 'waiting_for_wallet' || tradeStage === 'submitting' || tradeStage === 'confirming'}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-[#000010] border border-[rgba(138,32,255,0.25)] rounded-xl text-base font-mono font-bold text-[#F5F5F7] focus:outline-none focus:border-[#8A20FF] transition-colors"
                />
                <span className="absolute right-4 top-3.5 text-xs font-mono text-[#A7A7B8] font-bold">
                  USDC
                </span>
              </div>
            </div>

            {/* Live Quote Breakdown from Panta Protocol */}
            <div className="rounded-xl bg-[#000010] border border-[rgba(138,32,255,0.2)] p-4 space-y-2.5 font-mono text-xs">
              <div className="flex items-center justify-between text-[#A7A7B8]">
                <span>Panta Protocol Quote</span>
                {tradeStage === 'preparing_quote' ? (
                  <span className="flex items-center gap-1 text-[11px] text-[#FFA742]">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Fetching live quote...</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-emerald-400">Live Curve Quote</span>
                )}
              </div>

              <div className="space-y-1.5 pt-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#7E6D96]">Average Execution Price</span>
                  <span className="text-[#F5F5F7] font-semibold">
                    {quote?.averagePrice ? formatCurrency(quote.averagePrice, 'USD', 2) : '—'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#7E6D96]">Estimated Shares</span>
                  <span className="text-[#F5F5F7] font-semibold">
                    {quote?.expectedShares ? `${formatNumber(quote.expectedShares, 2)} shares` : '—'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#7E6D96]">Potential Payout if {outcome}</span>
                  <span className="text-emerald-400 font-semibold">
                    {quote?.potentialPayout ? formatCurrency(quote.potentialPayout, 'USD', 2) : '—'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#7E6D96]">Panta Protocol Fee</span>
                  <span className="text-[#A7A7B8]">
                    {quote?.feeLamports ? `${quote.feeLamports / 1e9} SOL` : '0.000005 SOL'}
                  </span>
                </div>

                <div className="flex justify-between pt-1 border-t border-[rgba(138,32,255,0.12)] text-xs">
                  <span className="font-bold text-[#F5F5F7]">Total Acquisition Cost</span>
                  <span className="font-bold text-[#F5F5F7]">{formatCurrency(numAmount, 'USD', 2)} USDC</span>
                </div>
              </div>
            </div>

            {/* Error or Rejection Notices */}
            {quoteError && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-300 font-mono">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{quoteError}</span>
              </div>
            )}

            {tradeStage === 'user_rejected' && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-300 font-mono">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Transaction cancelled.</span>
                  <span>Approval was rejected in your wallet. No funds were debited.</span>
                </div>
              </div>
            )}

            {tradeStage === 'failed' && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-2.5 text-xs text-red-300 font-mono">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Transaction failed.</span>
                  <span>{errorMessage || 'Failed to complete transaction on Solana.'}</span>
                </div>
              </div>
            )}

            {/* Transaction Progression Indicator */}
            {(tradeStage === 'building_tx' || tradeStage === 'waiting_for_wallet' || tradeStage === 'submitting' || tradeStage === 'confirming') && (
              <div className="p-3 rounded-xl bg-[#100126] border border-[#8A20FF]/35 space-y-2 font-mono text-xs">
                <div className="flex items-center gap-2 text-[#D4A5FF] font-semibold">
                  <Loader2 className="w-4 h-4 animate-spin text-[#8A20FF]" />
                  <span>
                    {tradeStage === 'building_tx' && 'Building transaction from Panta quote...'}
                    {tradeStage === 'waiting_for_wallet' && 'Waiting for wallet approval in browser...'}
                    {tradeStage === 'submitting' && 'Broadcasting signed transaction to Devnet...'}
                    {tradeStage === 'confirming' && 'Confirming on-chain on Solana...'}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#080821] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#8A20FF] to-emerald-400 transition-all duration-300"
                    style={{
                      width:
                        tradeStage === 'building_tx'
                          ? '25%'
                          : tradeStage === 'waiting_for_wallet'
                          ? '50%'
                          : tradeStage === 'submitting'
                          ? '75%'
                          : '90%',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Action Button */}
            {!connected ? (
              <button
                type="button"
                onClick={() => connect()}
                className="w-full py-3.5 rounded-xl bg-[#8A20FF] hover:bg-[#670CDC] text-xs font-mono font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
              >
                <Wallet className="w-4 h-4" />
                <span>Connect Solana Wallet to Trade</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleExecuteTrade}
                disabled={
                  tradeStage === 'preparing_quote' ||
                  tradeStage === 'building_tx' ||
                  tradeStage === 'waiting_for_wallet' ||
                  tradeStage === 'submitting' ||
                  tradeStage === 'confirming' ||
                  numAmount < 1
                }
                className="w-full py-3.5 rounded-xl bg-[#8A20FF] hover:bg-[#670CDC] disabled:bg-[#080821] disabled:text-[#7E6D96] disabled:border disabled:border-[rgba(138,32,255,0.15)] text-xs font-mono font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg disabled:cursor-not-allowed"
              >
                {tradeStage === 'preparing_quote' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Preparing Quote...</span>
                  </>
                ) : tradeStage === 'building_tx' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Building Transaction...</span>
                  </>
                ) : tradeStage === 'waiting_for_wallet' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Check Your Wallet Extension...</span>
                  </>
                ) : tradeStage === 'confirming' || tradeStage === 'submitting' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Confirming on Solana...</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    <span>Acquire {outcome} Shares (${numAmount} USDC)</span>
                  </>
                )}
              </button>
            )}

            {/* Security Notice */}
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-[#7E6D96] pt-1">
              <ShieldAlert className="w-3 h-3 text-[#8A20FF]" />
              <span>Non-custodial: Your browser wallet reviews and signs every transaction</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
