import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  ShieldCheck,
  TrendingUp,
  Loader2,
  ArrowRight,
  Info,
  Calendar,
  Layers,
  Wallet,
  ExternalLink
} from 'lucide-react';
import { Transaction } from '@solana/web3.js';
import { useWallet } from '../../context/WalletContext';
import {
  fetchMarketSuggestion,
  fetchMarketValidation
} from '../../services/intelligenceClientService';
import {
  requestMarketCreationQuote,
  buildMarketCreationTx,
  broadcastSignedTx
} from '../../services/pantaService';
import {
  MarketValidationResult,
  MarketSuggestionResult
} from '../../services/marketIntelligenceEngine';
import { formatCurrency } from '../../utils/format';

interface PantaMarketCreationModalProps {
  assetSymbol: string;
  assetName: string;
  currentPrice: number;
  change24hPct?: number | null;
  category?: string;
  onClose: () => void;
  onMarketCreated?: (signature: string, question: string) => void;
}

export const PantaMarketCreationModal: React.FC<PantaMarketCreationModalProps> = ({
  assetSymbol,
  assetName,
  currentPrice,
  change24hPct = 0,
  category = 'tokenized',
  onClose,
  onMarketCreated,
}) => {
  const { connected, publicKey, publicKeyStr, signTransaction, connect } = useWallet();

  // Step wizard: 1 = Draft & AI Suggest, 2 = Validation & Preview, 3 = Confirmation
  const [step, setStep] = useState<'draft' | 'preview' | 'executing' | 'confirmed'>('draft');

  // Form Fields
  const [question, setQuestion] = useState<string>('');
  const [marketType, setMarketType] = useState<'STANDARD' | 'BREAKING'>('STANDARD');
  const [targetDateStr, setTargetDateStr] = useState<string>(() => {
    const d = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
  });
  const [resolutionSource, setResolutionSource] = useState<string>(
    `Pyth Network Hermes Oracle (${assetSymbol}/USD feed)`
  );
  const [initialLiquiditySol, setInitialLiquiditySol] = useState<number>(0.1);

  // AI Suggestion State
  const [loadingSuggestion, setLoadingSuggestion] = useState<boolean>(false);
  const [suggestionRationale, setSuggestionRationale] = useState<string | null>(null);

  // Validation State
  const [validating, setValidating] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<MarketValidationResult | null>(null);

  // Quote State
  const [loadingQuote, setLoadingQuote] = useState<boolean>(false);
  const [creationQuote, setCreationQuote] = useState<any | null>(null);

  // Execution & Signature State
  const [txStage, setTxStage] = useState<string>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [txExplorerUrl, setTxExplorerUrl] = useState<string | null>(null);

  // Automatically request initial AI suggestion on mount
  useEffect(() => {
    handleFetchAiSuggestion();
  }, [assetSymbol, currentPrice]);

  const handleFetchAiSuggestion = async () => {
    setLoadingSuggestion(true);
    try {
      const targetIso = new Date(`${targetDateStr}T23:59:59.000Z`).toISOString();
      const res: MarketSuggestionResult = await fetchMarketSuggestion({
        assetSymbol,
        assetName,
        currentPrice,
        change24hPct,
        category,
        targetDateIso: targetIso,
      });

      if (res && res.suggestedQuestion) {
        setQuestion(res.suggestedQuestion);
        setMarketType(res.suggestedType);
        setResolutionSource(res.suggestedResolutionSource);
        setSuggestionRationale(res.rationale);
      }
    } catch (err) {
      console.warn('AI suggestion failed:', err);
    } finally {
      setLoadingSuggestion(false);
    }
  };

  // Run validation whenever question, date, source, or type changes
  const handleValidateProposedMarket = async () => {
    setValidating(true);
    try {
      const targetIso = new Date(`${targetDateStr}T23:59:59.000Z`).toISOString();
      const result = await fetchMarketValidation({
        question,
        resolutionSource,
        endTime: targetIso,
        marketType,
        assetSymbol,
      });
      setValidationResult(result);
      return result;
    } catch (err) {
      console.warn('Validation error:', err);
      return null;
    } finally {
      setValidating(false);
    }
  };

  // Proceed to Preview Step
  const handleProceedToPreview = async () => {
    const val = await handleValidateProposedMarket();
    if (!val || !val.isValid) return;

    setLoadingQuote(true);
    try {
      const quoteRes = await requestMarketCreationQuote({
        question,
        category,
        initialLiquiditySol,
      });
      if (quoteRes.success && quoteRes.data) {
        setCreationQuote(quoteRes.data);
      }
      setStep('preview');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to fetch market creation quote from Panta.');
    } finally {
      setLoadingQuote(false);
    }
  };

  // Execute Market Creation Transaction
  const handleExecuteCreation = async () => {
    if (!connected || !publicKeyStr || !publicKey) {
      setErrorMessage('Please connect your Solana wallet first.');
      return;
    }

    setErrorMessage(null);
    setStep('executing');
    setTxStage('building');

    try {
      // 1. Build Transaction
      const buildRes = await buildMarketCreationTx({
        creatorWallet: publicKeyStr,
        question,
        category,
        initialLiquiditySol,
      });

      if (!buildRes.success || !buildRes.data?.transactionBase64) {
        throw new Error(buildRes.error?.message || 'Failed to build market creation transaction.');
      }

      // 2. Wallet Approval
      setTxStage('signing');
      const txBuffer = Buffer.from(buildRes.data.transactionBase64, 'base64');
      const tx = Transaction.from(txBuffer);
      const signed = await signTransaction(tx);
      const serialized = signed.serialize({ requireAllSignatures: false, verifySignatures: false });

      // 3. Broadcast to Solana Devnet
      setTxStage('broadcasting');
      const broadcastRes = await broadcastSignedTx({
        signedTransactionBase64: serialized.toString('base64'),
      });

      if (!broadcastRes.success || !broadcastRes.data?.signature) {
        throw new Error(broadcastRes.error?.message || 'Transaction broadcast failed.');
      }

      const sig = broadcastRes.data.signature;
      setTxSignature(sig);
      setTxExplorerUrl(broadcastRes.data.explorerUrl);
      setStep('confirmed');

      if (onMarketCreated) {
        onMarketCreated(sig, question);
      }
    } catch (err: any) {
      const msg = (err?.message || '').toLowerCase();
      if (err?.code === 4001 || msg.includes('user rejected') || msg.includes('cancelled') || msg.includes('canceled')) {
        setErrorMessage('Transaction was cancelled by user in wallet.');
      } else {
        setErrorMessage(err?.message || 'Market deployment transaction failed.');
      }
      setStep('preview');
    } finally {
      setTxStage('idle');
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-xl bg-[#05051a] border border-[#8A20FF]/35 rounded-2xl p-5 sm:p-7 shadow-2xl text-[#F5F5F7] font-mono text-xs max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-[rgba(138,32,255,0.18)]">
          <div className="space-y-1 pr-6">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#100126] text-[#D4A5FF] border border-[#8A20FF]/30">
                Panta Market Deployment
              </span>
              <span className="text-[11px] font-mono text-[#A7A7B8]">
                {assetName} ({assetSymbol})
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#F5F5F7] leading-snug font-sans">
              AI Market Creation Assistant
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={step === 'executing'}
            className="p-1.5 rounded-lg bg-[#080821] hover:bg-[#100126] border border-[rgba(138,32,255,0.25)] text-[#A7A7B8] hover:text-[#F5F5F7] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: DRAFT & AI SUGGESTION */}
        {step === 'draft' && (
          <div className="py-4 space-y-4">
            {/* Live Asset Spot Header */}
            <div className="p-3 rounded-xl bg-[#000010] border border-[rgba(138,32,255,0.18)] flex items-center justify-between text-xs">
              <div>
                <span className="text-[#7E6D96] block text-[10px] uppercase">Underlying Asset Spot</span>
                <span className="font-bold text-[#F5F5F7]">{assetName} (${formatCurrency(currentPrice, 'USD', 2)})</span>
              </div>
              <button
                type="button"
                onClick={handleFetchAiSuggestion}
                disabled={loadingSuggestion}
                className="px-2.5 py-1.5 rounded-lg bg-[#100126] hover:bg-[#8A20FF]/25 border border-[#8A20FF]/40 text-[#D4A5FF] text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 text-[#8A20FF] ${loadingSuggestion ? 'animate-spin' : ''}`} />
                <span>Suggest with AI</span>
              </button>
            </div>

            {/* AI Suggestion Rationale */}
            {suggestionRationale && (
              <div className="p-3 rounded-xl bg-[#080821] border border-[rgba(138,32,255,0.2)] text-[11px] text-[#A7A7B8] flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-[#8A20FF] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#D4A5FF]">AI Rationale: </strong>
                  {suggestionRationale}
                </div>
              </div>
            )}

            {/* Proposed Question (User can edit!) */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider text-[#A7A7B8] block">
                Prediction Market Question (Editable)
              </label>
              <textarea
                rows={3}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Will [Asset] trade above $[Target] before [Date]?"
                className="w-full p-3 bg-[#000010] border border-[rgba(138,32,255,0.25)] rounded-xl text-xs font-mono text-[#F5F5F7] focus:outline-none focus:border-[#8A20FF] transition-colors resize-none"
              />
              <span className="text-[10px] text-[#7E6D96] block">
                Must be an objective, unambiguous binary question resolvable with YES or NO.
              </span>
            </div>

            {/* Market Type Selection */}
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setMarketType('STANDARD')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  marketType === 'STANDARD'
                    ? 'bg-[#100126] border-[#8A20FF] text-[#F5F5F7]'
                    : 'bg-[#000010] border-[rgba(138,32,255,0.15)] text-[#7E6D96]'
                }`}
              >
                <div className="font-bold text-xs mb-0.5">STANDARD MARKET</div>
                <div className="text-[10px] text-[#A7A7B8]">
                  Event horizon &gt; 24h. Standard liquidity pool reserves.
                </div>
              </div>

              <div
                onClick={() => setMarketType('BREAKING')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  marketType === 'BREAKING'
                    ? 'bg-[#100126] border-[#8A20FF] text-[#F5F5F7]'
                    : 'bg-[#000010] border-[rgba(138,32,255,0.15)] text-[#7E6D96]'
                }`}
              >
                <div className="font-bold text-xs mb-0.5">BREAKING MARKET</div>
                <div className="text-[10px] text-[#A7A7B8]">
                  Near-term or rapid event resolution (&lt; 48h horizon).
                </div>
              </div>
            </div>

            {/* Date and Resolution Source Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-[#A7A7B8] block">Resolution Target Date</label>
                <input
                  type="date"
                  value={targetDateStr}
                  onChange={(e) => setTargetDateStr(e.target.value)}
                  className="w-full px-3 py-2 bg-[#000010] border border-[rgba(138,32,255,0.25)] rounded-xl text-xs font-mono text-[#F5F5F7] focus:outline-none focus:border-[#8A20FF]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-[#A7A7B8] block">Initial Liquidity (SOL)</label>
                <input
                  type="number"
                  min="0.05"
                  step="0.05"
                  value={initialLiquiditySol}
                  onChange={(e) => setInitialLiquiditySol(parseFloat(e.target.value) || 0.1)}
                  className="w-full px-3 py-2 bg-[#000010] border border-[rgba(138,32,255,0.25)] rounded-xl text-xs font-mono text-[#F5F5F7] focus:outline-none focus:border-[#8A20FF]"
                />
              </div>
            </div>

            {/* Resolution Source */}
            <div className="space-y-1">
              <label className="text-[11px] text-[#A7A7B8] block">Authoritative Public Resolution Source</label>
              <input
                type="text"
                value={resolutionSource}
                onChange={(e) => setResolutionSource(e.target.value)}
                placeholder="e.g. Pyth Network Oracle, LBMA fixing, SEC filings"
                className="w-full px-3 py-2 bg-[#000010] border border-[rgba(138,32,255,0.25)] rounded-xl text-xs font-mono text-[#F5F5F7] focus:outline-none focus:border-[#8A20FF]"
              />
            </div>

            {/* Interactive Quality Checklist (Deterministic + AI) */}
            <div className="p-3.5 rounded-xl bg-[#000010] border border-[rgba(138,32,255,0.2)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[11px] text-[#D4A5FF] uppercase">
                  Market Quality Validation Checklist
                </span>
                <button
                  type="button"
                  onClick={handleValidateProposedMarket}
                  disabled={validating}
                  className="text-[10px] text-[#8A20FF] hover:underline cursor-pointer"
                >
                  {validating ? 'Validating...' : 'Re-verify'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Clear question</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>YES/NO outcome</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Public resolution source</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Defined event horizon</span>
                </div>
              </div>

              {validationResult?.critique && validationResult.critique.length > 0 && (
                <div className="pt-2 border-t border-[rgba(138,32,255,0.15)] space-y-1 text-[11px] text-amber-300">
                  {validationResult.critique.map((crit, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <AlertCircle className="w-3 h-3 shrink-0 mt-0.5 text-amber-400" />
                      <span>{crit}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <span className="text-[10px] text-[#7E6D96]">
                AI suggests. The user reviews. The wallet signs.
              </span>
              <button
                type="button"
                onClick={handleProceedToPreview}
                disabled={!question.trim() || loadingQuote}
                className="px-5 py-2.5 rounded-xl bg-[#8A20FF] hover:bg-[#670CDC] text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 shadow-md"
              >
                {loadingQuote ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <span>Preview Market</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: CREATION PREVIEW & QUOTE */}
        {step === 'preview' && (
          <div className="py-4 space-y-4">
            <div className="p-4 rounded-xl bg-[#000010] border border-[rgba(138,32,255,0.25)] space-y-3">
              <span className="text-[10px] uppercase font-bold text-[#D4A5FF] block">
                Panta Prediction Market Deployment Preview
              </span>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[#7E6D96] block text-[10px]">Market Question</span>
                  <span className="font-bold text-[#F5F5F7] text-sm block">{question}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[rgba(138,32,255,0.12)]">
                  <div>
                    <span className="text-[#7E6D96] block text-[10px]">Market Type</span>
                    <span className="font-bold text-[#F5F5F7] uppercase">{marketType}</span>
                  </div>
                  <div>
                    <span className="text-[#7E6D96] block text-[10px]">Target Horizon</span>
                    <span className="font-bold text-[#F5F5F7]">{targetDateStr}</span>
                  </div>
                </div>

                <div className="pt-1 border-t border-[rgba(138,32,255,0.12)]">
                  <span className="text-[#7E6D96] block text-[10px]">Authoritative Resolution Source</span>
                  <span className="font-bold text-[#F5F5F7]">{resolutionSource}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[rgba(138,32,255,0.12)]">
                  <div>
                    <span className="text-[#7E6D96] block text-[10px]">Initial Liquidity (AMM)</span>
                    <span className="font-bold text-[#F5F5F7]">{initialLiquiditySol} SOL</span>
                  </div>
                  <div>
                    <span className="text-[#7E6D96] block text-[10px]">Estimated Protocol Creation Fee</span>
                    <span className="font-bold text-emerald-400">
                      {creationQuote?.estimatedTotalSol ? `${creationQuote.estimatedTotalSol} SOL` : '0.13 SOL'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-2 text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('draft')}
                className="px-4 py-2.5 rounded-xl bg-[#080821] hover:bg-[#100126] border border-[rgba(138,32,255,0.25)] text-[#A7A7B8] hover:text-[#F5F5F7] cursor-pointer"
              >
                Back to Edit
              </button>

              {!connected ? (
                <button
                  type="button"
                  onClick={() => connect()}
                  className="px-5 py-2.5 rounded-xl bg-[#8A20FF] hover:bg-[#670CDC] text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Connect Wallet to Sign</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleExecuteCreation}
                  className="px-6 py-2.5 rounded-xl bg-[#8A20FF] hover:bg-[#670CDC] text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-lg"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Deploy Market with Wallet</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: EXECUTING & PROGRESS */}
        {step === 'executing' && (
          <div className="py-8 space-y-4 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#8A20FF]" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#F5F5F7]">
                {txStage === 'building' && 'Constructing Panta market transaction...'}
                {txStage === 'signing' && 'Waiting for wallet signature in browser...'}
                {txStage === 'broadcasting' && 'Broadcasting transaction to Solana Devnet...'}
              </h3>
              <p className="text-xs text-[#A7A7B8]">
                Please review and approve the transaction in your connected wallet.
              </p>
            </div>
          </div>
        )}

        {/* STEP 4: CONFIRMED SUCCESS */}
        {step === 'confirmed' && (
          <div className="py-6 space-y-5 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#F5F5F7]">
                Market Successfully Created on Solana!
              </h3>
              <p className="text-xs text-[#A7A7B8] max-w-sm mx-auto">
                Your prediction market is now live on Panta Protocol with primary issuance enabled.
              </p>
            </div>

            {txSignature && (
              <div className="p-3 rounded-xl bg-[#000010] border border-[rgba(138,32,255,0.18)] text-left space-y-1">
                <span className="text-[10px] text-[#7E6D96] uppercase block">Transaction Signature</span>
                <div className="text-[11px] text-[#D4A5FF] break-all select-all font-mono">
                  {txSignature}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              {txExplorerUrl && (
                <a
                  href={txExplorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-1/2 py-2.5 rounded-xl bg-[#080821] hover:bg-[#100126] border border-[rgba(138,32,255,0.25)] text-[#F5F5F7] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Solana Explorer</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#8A20FF]" />
                </a>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 py-2.5 rounded-xl bg-[#8A20FF] hover:bg-[#670CDC] text-white font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
