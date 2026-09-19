import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowDownUp,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Zap,
  Info,
  Sliders,
  DollarSign,
  Copy,
  Check,
  Layers,
  ArrowRight,
  RefreshCw,
  Clock,
  Sparkles,
  Lock,
} from 'lucide-react';
import { PublicKey } from '@solana/web3.js';
import { DBCPoolState } from '../../types';
import { useNetwork } from '../../context/NetworkContext';
import { useWallet } from '../../context/WalletContext';
import {
  getMeteoraSwapQuote,
  buildMeteoraSwapTransaction,
  executeAndVerifyMeteoraTransaction,
  MeteoraQuoteResponse,
  MeteoraIntegrationError,
  VerifiedTransactionReceipt,
  DBC_PROGRAM_ID_STR,
} from '../../services/meteoraService';
import { getExplorerUrl } from '../../config/constants';
import { formatCurrency, formatPercent, formatBps } from '../../utils/format';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ValticsMark } from '../brand/ValticsLogo';
import { auditTransactionSafety } from '../../utils/txSafety';
import { validateNumericInput, validateSlippageTolerance, sanitizeErrorMessage } from '../../utils/security';

interface MeteoraSwapModalProps {
  isOpen: boolean;
  pool: DBCPoolState;
  onClose: () => void;
  onSwapSuccess?: (receipt: VerifiedTransactionReceipt) => void;
  onOpenWalletModal?: () => void;
}

type ExecutionStage =
  | 'idle'
  | 'preflight_review'
  | 'preflight_simulation'
  | 'awaiting_signature'
  | 'broadcasting'
  | 'confirming_block'
  | 'verifying_onchain'
  | 'confirmed';

export const MeteoraSwapModal: React.FC<MeteoraSwapModalProps> = ({
  isOpen,
  pool,
  onClose,
  onSwapSuccess,
  onOpenWalletModal,
}) => {
  const { connection, network } = useNetwork();
  const { connected, publicKey, publicKeyStr, balanceSol, signTransaction, connect, isWrongNetwork, networkError } = useWallet();

  // Swap direction: false = Buy base token with quote, true = Sell base token for quote
  const [isSellMode, setIsSellMode] = useState<boolean>(false);
  const [amountIn, setAmountIn] = useState<string>('0.1');
  const [slippageBps, setSlippageBps] = useState<number>(100); // 1.0%

  // Quote State
  const [quote, setQuote] = useState<MeteoraQuoteResponse | null>(null);
  const [isQuoting, setIsQuoting] = useState<boolean>(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Execution & Safety Review State
  const [stage, setStage] = useState<ExecutionStage>('idle');
  const [confirmedRisk, setConfirmedRisk] = useState<boolean>(false);
  const [executingError, setExecutingError] = useState<MeteoraIntegrationError | null>(null);
  const [receipt, setReceipt] = useState<VerifiedTransactionReceipt | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const baseSymbol = pool.tokenSymbol || 'ASSET';
  const quoteSymbol = pool.quoteMint === 'So11111111111111111111111111111111111111112' ? 'SOL' : 'USDC';

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Re-fetch deterministic quote from Meteora SDK
  const refreshQuote = useCallback(async () => {
    if (!pool.poolAddress) {
      setQuote(null);
      setQuoteError(null);
      return;
    }

    const numCheck = validateNumericInput(amountIn, {
      min: 0.000001,
      maxDecimals: isSellMode ? 6 : (quoteSymbol === 'SOL' ? 9 : 6),
      label: 'Swap Amount',
    });

    if (!numCheck.isValid) {
      setQuote(null);
      setQuoteError(numCheck.error || 'Invalid amount');
      return;
    }

    try {
      setIsQuoting(true);
      setQuoteError(null);

      const quoteRes = await getMeteoraSwapQuote(connection, {
        poolAddress: pool.poolAddress,
        swapBaseForQuote: isSellMode,
        amountIn,
        slippageBps,
        baseDecimals: 6,
        quoteDecimals: quoteSymbol === 'SOL' ? 9 : 6,
      });

      setQuote(quoteRes);
    } catch (err: any) {
      setQuote(null);
      if (err instanceof MeteoraIntegrationError) {
        setQuoteError(err.humanMessage);
      } else {
        setQuoteError(sanitizeErrorMessage(err?.message || 'Failed to fetch quote from curve invariant.'));
      }
    } finally {
      setIsQuoting(false);
    }
  }, [connection, pool.poolAddress, isSellMode, amountIn, slippageBps, quoteSymbol]);

  // Debounced quote updates
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        refreshQuote();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen, refreshQuote]);

  // Safety audit report for swap transaction
  const safetyReport = useMemo(() => {
    if (!pool || !quote) return null;
    return auditTransactionSafety({
      network,
      expectedNetwork: network,
      destinationProgramId: DBC_PROGRAM_ID_STR,
      signerAddress: publicKeyStr,
      userSolBalance: balanceSol,
      estimatedFeeSol: 0.000005,
      tradeAmountSol: !isSellMode && quoteSymbol === 'SOL' ? Number(amountIn) : 0,
      slippagePercent: slippageBps / 100,
      baseMint: pool.baseMint,
      quoteMint: pool.quoteMint,
    });
  }, [pool, quote, network, publicKeyStr, balanceSol, isSellMode, quoteSymbol, amountIn, slippageBps]);

  // Reset state on close
  const handleClose = () => {
    if (
      stage === 'preflight_simulation' ||
      stage === 'awaiting_signature' ||
      stage === 'broadcasting' ||
      stage === 'confirming_block' ||
      stage === 'verifying_onchain'
    ) {
      return; // Do not dismiss while tx in-flight
    }
    setStage('idle');
    setConfirmedRisk(false);
    setExecutingError(null);
    setReceipt(null);
    onClose();
  };

  // Proceed to Step 2: Preflight Review
  const handleProceedToPreflight = () => {
    setExecutingError(null);
    setConfirmedRisk(false);
    setStage('preflight_review');
  };

  // Execute Swap via connected wallet
  const handleConfirmAndSign = async () => {
    if (!connected || !publicKey) {
      setExecutingError(
        new MeteoraIntegrationError(
          'WALLET_DISCONNECTED',
          'Wallet is not connected.',
          'Please connect your Solana wallet to proceed with transaction signing.'
        )
      );
      return;
    }

    if (isWrongNetwork) {
      setExecutingError(
        new MeteoraIntegrationError(
          'UNSUPPORTED_NETWORK',
          'Not on Solana Devnet.',
          networkError || 'Valtics is strictly restricted to Solana Devnet. Please switch your wallet to Devnet.'
        )
      );
      return;
    }

    if (!quote) {
      setExecutingError(
        new MeteoraIntegrationError(
          'SDK_ERROR',
          'No valid curve quote found.',
          'Please refresh quote before submitting.'
        )
      );
      return;
    }

    if (safetyReport && !safetyReport.isSafeToProceed) {
      setExecutingError(
        new MeteoraIntegrationError(
          'SAFETY_CHECK_FAILED',
          safetyReport.blockReason || 'Transaction safety checks failed.',
          'Please resolve the reported safety constraints before proceeding.'
        )
      );
      return;
    }

    try {
      setExecutingError(null);

      // 1. Build Transaction via SDK
      const { transaction } = await buildMeteoraSwapTransaction(connection, {
        walletPubkey: publicKey,
        poolAddress: pool.poolAddress,
        swapBaseForQuote: isSellMode,
        amountInRaw: quote.amountInRaw,
        minimumAmountOutRaw: quote.minimumAmountOutRaw,
      });

      // 2. Submit & verify on-chain
      const txReceipt = await executeAndVerifyMeteoraTransaction({
        connection,
        transaction,
        signTransaction,
        purpose: isSellMode
          ? `Meteora DBC Swap: Sell ${amountIn} ${baseSymbol} for ${quoteSymbol}`
          : `Meteora DBC Swap: Buy ${quote.expectedOutputFormatted} ${baseSymbol} with ${amountIn} ${quoteSymbol}`,
        expectedPoolAddress: pool.poolAddress,
        onStatusChange: (status) => setStage(status),
      });

      setReceipt(txReceipt);
      setStage('confirmed');
      if (onSwapSuccess) {
        onSwapSuccess(txReceipt);
      }
    } catch (err: any) {
      if (err instanceof MeteoraIntegrationError) {
        setExecutingError(err);
      } else {
        setExecutingError(
          new MeteoraIntegrationError(
            'TRANSACTION_FAILED',
            sanitizeErrorMessage(err?.message || 'Transaction execution failed.'),
            'Please check your wallet balance and try again.'
          )
        );
      }
      setStage('preflight_review');
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2.5">
          <ValticsMark size={22} glow />
          <span className="text-zinc-100 font-bold">
            {stage === 'confirmed'
              ? 'Swap Confirmed & Verified On-Chain'
              : stage === 'preflight_review' || stage !== 'idle'
              ? 'Preflight Transaction Verification'
              : `Meteora DBC Swap · ${pool.tokenName || baseSymbol}`}
          </span>
        </div>
      }
      description={`Official Meteora Dynamic Bonding Curve · Solana ${network.toUpperCase()}`}
      maxWidth="lg"
    >
      <div className="space-y-4 text-xs">
        {/* ================================================================= */}
        {/* STAGE: CONFIRMED RECEIPT                                          */}
        {/* ================================================================= */}
        {stage === 'confirmed' && receipt && (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-emerald-200">
                    Transaction Finalized & Verified On-Chain
                  </h4>
                  <p className="text-xs text-zinc-300">
                    Your curve swap was signed, committed to Solana block{' '}
                    <span className="font-mono text-emerald-300">#{receipt.slot}</span>, and verified
                    on the ledger with zero state errors.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-950/70 border border-emerald-900/40 space-y-2 font-mono text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 font-sans">Transaction Signature:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-200">
                      {receipt.signature.slice(0, 6)}...{receipt.signature.slice(-6)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(receipt.signature, 'sig')}
                      className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
                    >
                      {copiedKey === 'sig' ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                    <a
                      href={getExplorerUrl(receipt.signature, 'tx', network)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:text-emerald-300"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 font-sans">Network Fee:</span>
                  <span className="text-zinc-300">
                    {(receipt.networkFeeLamports / 1e9).toFixed(6)} SOL
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 font-sans">Verification Status:</span>
                  <Badge variant="live" size="xs">
                    Confirmed On-Chain
                  </Badge>
                </div>
              </div>
            </div>

            <Button variant="brand" size="md" onClick={handleClose} fullWidth className="cursor-pointer">
              Return to Market Terminal
            </Button>
          </div>
        )}

        {/* ================================================================= */}
        {/* STAGE: PREFLIGHT SAFETY REVIEW & SIGNING                           */}
        {/* ================================================================= */}
        {(stage === 'preflight_review' ||
          stage === 'preflight_simulation' ||
          stage === 'awaiting_signature' ||
          stage === 'broadcasting' ||
          stage === 'confirming_block' ||
          stage === 'verifying_onchain') &&
          quote && (
            <div className="space-y-4 py-1">
              {/* Mandatory Preflight Checklist Matrix */}
              <div className="p-3.5 rounded-xl bg-[#090d16] border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="text-[11px] font-mono uppercase text-amber-400 font-semibold tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    Transaction Safety Checklist
                  </span>
                  <Badge variant="accent" size="xs">
                    Solana {network.toUpperCase()}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-[11px]">
                  {/* Purpose */}
                  <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 col-span-full">
                    <span className="text-zinc-400 font-sans text-[10px] block uppercase">
                      Transaction Purpose
                    </span>
                    <span className="text-zinc-100 font-semibold font-sans mt-0.5 block">
                      {isSellMode
                        ? `Dynamic Bonding Curve Swap: Sell ${amountIn} ${baseSymbol} for ${quoteSymbol}`
                        : `Dynamic Bonding Curve Swap: Buy ${quote.expectedOutputFormatted} ${baseSymbol} with ${amountIn} ${quoteSymbol}`}
                    </span>
                  </div>

                  {/* Token / Asset */}
                  <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
                    <span className="text-zinc-400 font-sans text-[10px] block uppercase">
                      Token / Asset
                    </span>
                    <div className="text-zinc-200 font-semibold mt-0.5 truncate">
                      {pool.tokenName} (${baseSymbol})
                    </div>
                    <span className="text-[10px] text-zinc-400 truncate block">
                      Mint: {pool.baseMint.slice(0, 6)}...{pool.baseMint.slice(-4)}
                    </span>
                  </div>

                  {/* Quote Asset */}
                  <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
                    <span className="text-zinc-400 font-sans text-[10px] block uppercase">
                      Quote Asset
                    </span>
                    <div className="text-zinc-200 font-semibold mt-0.5">
                      {quoteSymbol} (Meteora Vault PDA)
                    </div>
                    <span className="text-[10px] text-zinc-400 truncate block">
                      Vault: {pool.quoteVault.slice(0, 6)}...{pool.quoteVault.slice(-4)}
                    </span>
                  </div>

                  {/* Amount In & Out */}
                  <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
                    <span className="text-zinc-400 font-sans text-[10px] block uppercase">
                      Swap Amount
                    </span>
                    <div className="text-amber-400 font-bold mt-0.5">
                      {amountIn} {isSellMode ? baseSymbol : quoteSymbol}
                    </div>
                    <span className="text-[10px] text-zinc-400 block">
                      Min received: {quote.minimumOutputFormatted} {isSellMode ? quoteSymbol : baseSymbol}
                    </span>
                  </div>

                  {/* Estimated Network Fee & Protocol Fee */}
                  <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
                    <span className="text-zinc-400 font-sans text-[10px] block uppercase">
                      Fees & Slippage
                    </span>
                    <div className="text-zinc-200 mt-0.5">
                      Gas: ~0.000005 SOL · Slippage: {slippageBps / 100}%
                    </div>
                    <span className="text-[10px] text-zinc-400 block">
                      Protocol fee: {quote.protocolFeeFormatted} {isSellMode ? baseSymbol : quoteSymbol}
                    </span>
                  </div>

                  {/* Destination / Pool */}
                  <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 col-span-full flex items-center justify-between">
                    <div>
                      <span className="text-zinc-400 font-sans text-[10px] block uppercase">
                        Destination Pool PDA (Verified DBC)
                      </span>
                      <span className="text-zinc-300 font-mono text-[11px]">
                        {pool.poolAddress}
                      </span>
                    </div>
                    <a
                      href={getExplorerUrl(pool.poolAddress, 'address', network)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-amber-400 transition-colors shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Progress Tracker when in flight */}
              {stage !== 'preflight_review' && (
                <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>
                      {stage === 'preflight_simulation' && 'Simulating transaction via RPC...'}
                      {stage === 'awaiting_signature' && 'Awaiting wallet signature...'}
                      {stage === 'broadcasting' && 'Broadcasting raw transaction to Solana cluster...'}
                      {stage === 'confirming_block' && 'Awaiting block confirmation...'}
                      {stage === 'verifying_onchain' && 'Verifying transaction outcome on-chain...'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    The transaction will only be confirmed once the Solana ledger strictly verifies its on-chain execution.
                  </p>
                </div>
              )}

              {/* Error Banner */}
              {executingError && (
                <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-900/60 space-y-1.5 text-xs text-rose-300">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-rose-200">
                        {executingError.humanMessage}
                      </span>
                      <p className="text-[11px] text-rose-300/90 mt-0.5 leading-relaxed">
                        {executingError.actionableTip}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Explicit Confirmation Checkbox */}
              {stage === 'preflight_review' && (
                <div className="p-3 rounded-xl bg-[#0b0f19] border border-zinc-800 space-y-2">
                  <label className="flex items-start gap-2.5 text-xs text-zinc-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={confirmedRisk}
                      onChange={(e) => setConfirmedRisk(e.target.checked)}
                      className="mt-0.5 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="leading-snug">
                      I have reviewed the destination pool PDA, slippage bounds ({slippageBps / 100}%),
                      and explicitly authorize this swap on Solana{' '}
                      <strong className="text-zinc-100">{network}</strong>.
                    </span>
                  </label>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="outline"
                  size="md"
                  disabled={stage !== 'preflight_review'}
                  onClick={() => setStage('idle')}
                  className="flex-1 cursor-pointer"
                >
                  Back
                </Button>

                <Button
                  variant="brand"
                  size="md"
                  disabled={!confirmedRisk || stage !== 'preflight_review' || (safetyReport && !safetyReport.isSafeToProceed)}
                  isLoading={stage !== 'preflight_review'}
                  onClick={handleConfirmAndSign}
                  className="flex-1 cursor-pointer"
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Confirm
                </Button>
              </div>
            </div>
          )}

        {/* ================================================================= */}
        {/* STAGE: INPUT & QUOTING                                            */}
        {/* ================================================================= */}
        {stage === 'idle' && (
          <div className="space-y-4">
            {/* Direction Selector Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-900/60 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setIsSellMode(false);
                  setAmountIn('0.1');
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  !isSellMode
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Buy {baseSymbol}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsSellMode(true);
                  setAmountIn('100');
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  isSellMode
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ArrowDownUp className="w-3.5 h-3.5" />
                <span>Sell {baseSymbol}</span>
              </button>
            </div>

            {/* Input Form */}
            <div className="space-y-3">
              {/* Pay Input */}
              <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                  <span>You Pay</span>
                  {connected && (
                    <span className="font-mono">
                      Balance:{' '}
                      {isSellMode
                        ? `Token Balance`
                        : `${balanceSol !== null ? balanceSol.toFixed(4) : '0'} ${quoteSymbol}`}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <input
                    type="number"
                    min="0.000001"
                    step="any"
                    value={amountIn}
                    onChange={(e) => setAmountIn(e.target.value)}
                    placeholder="0.0"
                    className="w-full bg-transparent text-xl font-bold font-mono text-zinc-100 focus:outline-none placeholder-zinc-700"
                  />
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-xs font-semibold text-zinc-200 shrink-0">
                    <span>{isSellMode ? baseSymbol : quoteSymbol}</span>
                  </div>
                </div>
              </div>

              {/* Receive Output */}
              <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                  <span>You Receive (Estimated)</span>
                  {isQuoting && (
                    <span className="flex items-center gap-1 text-amber-400">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Computing SDK quote...
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="text-xl font-bold font-mono text-emerald-400 truncate">
                    {quote ? quote.expectedOutputFormatted : isQuoting ? '...' : '0.0'}
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-xs font-semibold text-zinc-200 shrink-0">
                    <span>{isSellMode ? quoteSymbol : baseSymbol}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Slippage Settings */}
            <div className="p-3 rounded-xl bg-[#090d16] border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400 font-sans">Slippage Tolerance</span>
                <span className="font-mono text-zinc-200 font-semibold">{slippageBps / 100}%</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[50, 100, 200, 300].map((bps) => (
                  <button
                    key={bps}
                    type="button"
                    onClick={() => setSlippageBps(bps)}
                    className={`py-1 rounded text-xs font-mono transition-colors border cursor-pointer ${
                      slippageBps === bps
                        ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {bps / 100}%
                  </button>
                ))}
              </div>
            </div>

            {/* Error or Quote Breakdown */}
            {quoteError ? (
              <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-900/50 text-[11px] text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{quoteError}</span>
              </div>
            ) : quote ? (
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1.5 font-mono text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 font-sans">Effective Execution Price:</span>
                  <span className="text-zinc-200 font-semibold">
                    {formatCurrency(quote.effectivePriceQuotePerBase, quoteSymbol)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 font-sans">Guaranteed Minimum Output:</span>
                  <span className="text-emerald-400">
                    {quote.minimumOutputFormatted} {isSellMode ? quoteSymbol : baseSymbol}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 font-sans">Estimated Price Impact:</span>
                  <span
                    className={
                      quote.priceImpactPct > 5
                        ? 'text-amber-400 font-semibold'
                        : 'text-zinc-300'
                    }
                  >
                    {quote.priceImpactPct.toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 font-sans">Protocol Fee:</span>
                  <span className="text-zinc-400">
                    {quote.protocolFeeFormatted} {isSellMode ? baseSymbol : quoteSymbol}
                  </span>
                </div>
              </div>
            ) : null}

            {/* Action Button */}
            {!connected ? (
              <Button
                variant="brand"
                size="md"
                onClick={() => {
                  if (onOpenWalletModal) {
                    onOpenWalletModal();
                  } else {
                    connect();
                  }
                }}
                fullWidth
                className="cursor-pointer"
              >
                Connect wallet
              </Button>
            ) : (
              <Button
                variant="brand"
                size="md"
                disabled={!quote || isQuoting || !!quoteError}
                onClick={handleProceedToPreflight}
                fullWidth
                className="cursor-pointer"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Continue
              </Button>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
};
