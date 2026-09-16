import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Coins, 
  Sliders, 
  Lock, 
  Zap, 
  FileText, 
  Loader2,
  Wallet,
  ExternalLink
} from 'lucide-react';
import { 
  CreateMarketFormData, 
  CurveAlgorithmType, 
  MigrationOptionType, 
  TransactionIntent,
  CurveModelParams
} from '../../types';
import { useNetwork } from '../../context/NetworkContext';
import { useWallet } from '../../context/WalletContext';
import { METEORA_DBC_PROGRAM_ID, QUOTE_MINTS } from '../../config/constants';
import { validateMarketCreationForm, isValidSolanaAddress, sanitizeErrorMessage } from '../../utils/security';
import { inspectSplTokenMint } from '../../services/solana';
import { AddressBadge } from '../common/AddressBadge';
import { TxPreflightModal } from '../common/TxPreflightModal';
import { formatCurrency, formatNumber, formatBps } from '../../utils/format';
import { NavigationTab } from '../layout/Header';
import { BlockchainContextBar } from '../common/BlockchainContextBar';
import { 
  prepareMeteoraPoolTransaction, 
  executeAndConfirmPoolTransaction, 
  createPoolStateFromDeployment, 
  CurveStudioConfigInput 
} from '../../services/meteoraCreation';
import { saveCreatedMarket } from '../../services/marketStorage';

interface CreateMarketViewProps {
  initialParams?: CurveModelParams | null;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenWalletModal: () => void;
}

export const CreateMarketView: React.FC<CreateMarketViewProps> = ({
  initialParams,
  onSelectTab,
  onOpenWalletModal,
}) => {
  const { network, connection } = useNetwork();
  const { connected, publicKey, publicKeyStr, signTransaction } = useWallet();

  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<CreateMarketFormData>({
    isNewMint: false,
    baseMint: '',
    tokenName: 'Apollo Private Real Estate Token',
    tokenSymbol: 'AP-RET',
    decimals: 9,
    totalSupply: '10,000,000',
    curveAllocationTokens: '8,000,000',
    quoteMint: QUOTE_MINTS[network === 'mainnet-beta' ? 'mainnet-beta' : 'devnet'].USDC.mint,
    quoteSymbol: 'USDC',
    curveType: 'linear',
    startingPriceQuote: '1.00',
    migrationPriceQuote: '1.25',
    migrationQuoteThreshold: '9,000,000',
    baseFeeBps: 50,
    dynamicFeeEnabled: true,
    feeDecaySeconds: 86400,
    maxPriceChangeBps: 200,
    antiSniperRateLimiterSeconds: 300,
    migrationOption: 'MET_DAMM_V2',
    liquidityLockDays: 365,
    creatorFeePercentage: 20,
    rwaComplianceNotes: 'Reg D 506(c) accredited issuer compliant token with transfer restriction hook.',
  });

  const [inspectingMint, setInspectingMint] = useState(false);
  const [mintLookupSuccess, setMintLookupSuccess] = useState(false);
  const [mintLookupError, setMintLookupError] = useState<string | null>(null);

  // Pre-flight modal states
  const [preflightOpen, setPreflightOpen] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [signingError, setSigningError] = useState<string | null>(null);
  const [confirmedTxSignature, setConfirmedTxSignature] = useState<string | null>(null);

  // Apply initial curve parameters if forwarded from Curve Studio
  useEffect(() => {
    if (initialParams) {
      setFormData((prev) => ({
        ...prev,
        curveType: initialParams.curveType,
        totalSupply: formatNumber(initialParams.totalSupply),
        curveAllocationTokens: formatNumber((initialParams.totalSupply * initialParams.allocationToCurvePct) / 100),
        startingPriceQuote: initialParams.startPriceUsd.toString(),
        migrationPriceQuote: ((initialParams.migrationMarketCapUsd / initialParams.totalSupply)).toFixed(4),
        quoteSymbol: initialParams.quoteAsset === 'SOL' ? 'SOL' : 'USDC',
        quoteMint: QUOTE_MINTS[network === 'mainnet-beta' ? 'mainnet-beta' : 'devnet'][initialParams.quoteAsset === 'SOL' ? 'SOL' : 'USDC'].mint,
        baseFeeBps: initialParams.feeBps,
        migrationOption: initialParams.migrationTarget,
        liquidityLockDays: initialParams.vestingDays,
      }));
    }
  }, [initialParams, network]);

  const handleMintInspect = async () => {
    setMintLookupError(null);
    setMintLookupSuccess(false);
    if (!formData.baseMint || !isValidSolanaAddress(formData.baseMint)) {
      setMintLookupError('Please provide a valid 32-44 char Solana SPL token mint address.');
      return;
    }
    setInspectingMint(true);
    try {
      const info = await inspectSplTokenMint(connection, formData.baseMint);
      if (info) {
        setFormData((prev) => ({
          ...prev,
          decimals: info.decimals,
          totalSupply: info.supply || prev.totalSupply,
          tokenName: info.name,
          tokenSymbol: info.symbol,
        }));
        setMintLookupSuccess(true);
      } else {
        setMintLookupError(`Token mint ${formData.baseMint.slice(0, 8)}... was not found on ${network}. Verify cluster network.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error querying mint';
      setMintLookupError(msg);
    } finally {
      setInspectingMint(false);
    }
  };

  const validation = validateMarketCreationForm(formData);

  const transactionIntent: TransactionIntent = {
    title: 'Initialize Meteora Dynamic Bonding Curve Pool',
    description: `Deploy a non-custodial Meteora Dynamic Bonding Curve pool for ${formData.tokenSymbol} paired with ${formData.quoteSymbol} on Solana ${network.toUpperCase()}.`,
    programId: METEORA_DBC_PROGRAM_ID,
    network,
    instructionsCount: 3,
    estimatedFeeSol: 0.00001,
    rentExemptReserveSol: 0.0485,
    requiredSigners: [publicKeyStr || 'Connected Wallet'],
    accounts: [
      { label: 'Dynamic Bonding Curve Program', pubkey: METEORA_DBC_PROGRAM_ID, isSigner: false, isWritable: false },
      { label: 'Base Asset Mint', pubkey: formData.baseMint || '11111111111111111111111111111111', isSigner: false, isWritable: false },
      { label: 'Quote Asset Mint', pubkey: formData.quoteMint, isSigner: false, isWritable: false },
      { label: 'Creator Authority', pubkey: publicKeyStr || 'Not connected', isSigner: true, isWritable: true },
      { label: 'Pool PDA', pubkey: 'PDA: Dynamic Curve Pool Account', isSigner: false, isWritable: true },
      { label: 'Base Vault PDA', pubkey: 'PDA: SPL Token Vault', isSigner: false, isWritable: true },
      { label: 'Quote Vault PDA', pubkey: 'PDA: Quote Reserve Vault', isSigner: false, isWritable: true },
    ],
    criticalParameters: [
      { label: 'Starting Price', value: `${formData.startingPriceQuote} ${formData.quoteSymbol}` },
      { label: 'Migration Target Price', value: `${formData.migrationPriceQuote} ${formData.quoteSymbol}` },
      { label: 'Quote Threshold', value: `${formData.migrationQuoteThreshold} ${formData.quoteSymbol}` },
      { label: 'Base Trading Fee', value: formatBps(formData.baseFeeBps) },
      { label: 'AMM Destination', value: formData.migrationOption },
      { label: 'Liquidity Lockup', value: `${formData.liquidityLockDays} days`, flagged: formData.liquidityLockDays === 0 },
      { label: 'Anti-Sniper Window', value: `${formData.antiSniperRateLimiterSeconds}s` },
      { label: 'Creator Fee Share', value: `${formData.creatorFeePercentage}%` },
    ],
  };

  const handleExecuteSigning = async () => {
    setIsSigning(true);
    setSigningError(null);
    try {
      if (!connected || !publicKeyStr || !publicKey || !signTransaction) {
        throw new Error('Wallet must be connected to sign the on-chain instruction.');
      }

      if (!isValidSolanaAddress(formData.baseMint)) {
        throw new Error('Please specify a valid Solana SPL token mint address in Step 1 before deploying.');
      }

      const cleanTotalSupply = Number(formData.totalSupply.replace(/,/g, '')) || 10_000_000;
      const cleanAllocation = Number(formData.curveAllocationTokens.replace(/,/g, '')) || 8_000_000;
      const allocPct = Math.min(100, Math.max(1, (cleanAllocation / cleanTotalSupply) * 100));

      const input: CurveStudioConfigInput = {
        assetName: formData.tokenName,
        ticker: formData.tokenSymbol,
        baseMint: formData.baseMint,
        assetCategory: 'Private Credit',
        quoteSymbol: formData.quoteSymbol,
        quoteMint: formData.quoteMint,
        tokenDecimals: formData.decimals || 6,
        totalSupply: cleanTotalSupply,
        profileKey: formData.curveType === 'linear' ? 'conservative' : formData.curveType === 'exponential' ? 'growth' : 'balanced',
        startingPriceQuote: parseFloat(formData.startingPriceQuote) || 1.0,
        migrationPriceQuote: parseFloat(formData.migrationPriceQuote) || 1.25,
        migrationQuoteThreshold: parseFloat(formData.migrationQuoteThreshold.replace(/,/g, '')) || 1_000_000,
        curveAllocationPct: allocPct,
        baseFeeMode: 'FeeSchedulerLinear',
        startingFeeBps: formData.baseFeeBps,
        endingFeeBps: Math.max(10, Math.floor(formData.baseFeeBps / 2)),
        feeDecaySeconds: formData.feeDecaySeconds || 86400,
        creatorTradingFeePercentage: formData.creatorFeePercentage || 20,
        dynamicFeeEnabled: formData.dynamicFeeEnabled,
        collectFeeMode: 'QuoteToken',
        creatorPermanentLockedLpPct: formData.liquidityLockDays > 0 ? 100 : 0,
        creatorUnlockedLpPct: formData.liquidityLockDays > 0 ? 0 : 100,
        partnerPermanentLockedLpPct: 0,
        partnerUnlockedLpPct: 0,
        migrationOption: 'MET_DAMM_V2',
        migrationFeeOptionBps: 25,
        antiSniperSlots: 100,
        payerAddress: publicKeyStr,
      };

      // 1. Prepare transaction
      const prepared = await prepareMeteoraPoolTransaction(connection, publicKey, input);

      // 2. Execute & Confirm on Solana
      const res = await executeAndConfirmPoolTransaction({
        connection,
        prepared,
        signTransaction,
        input,
        network,
      });

      if (!res?.signature) {
        throw new Error('Transaction execution completed without confirmation.');
      }

      // 3. Persist pool state
      const poolState = createPoolStateFromDeployment(res, input, network);
      saveCreatedMarket(poolState);

      setConfirmedTxSignature(res.signature);
    } catch (err: unknown) {
      const msg = sanitizeErrorMessage(err);
      setSigningError(msg);
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Wizard Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight">
            Create Dynamic Bonding Curve Market
          </h1>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-950/40 text-violet-300 border border-violet-500/30">
            Issuer Terminal
          </span>
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          Configure Meteora Dynamic Bonding Curve parameters, automated AMM graduation, and dynamic fee schedulers
        </p>
      </div>

      {/* Explicit On-Chain Cluster & Wallet Bar */}
      <BlockchainContextBar screenTitle="Pool Deployment Wizard" />

      {/* Step Stepper */}
      <div className="grid grid-cols-5 gap-2 border-b border-zinc-800 pb-4 text-xs">
        {[
          { num: 1, label: 'Asset & Mint' },
          { num: 2, label: 'Curve Model' },
          { num: 3, label: 'Graduation & Lock' },
          { num: 4, label: 'Fee Protections' },
          { num: 5, label: 'Pre-Flight Review' },
        ].map((s) => (
          <button
            key={s.num}
            type="button"
            onClick={() => setStep(s.num)}
            className={`flex flex-col sm:flex-row items-center gap-1.5 p-2 rounded-lg transition-all text-center sm:text-left ${
              step === s.num
                ? 'bg-[#141b2b] text-white font-semibold border border-violet-500/40 shadow-xs'
                : step > s.num
                ? 'text-emerald-400'
                : 'text-zinc-500'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 ${
                step === s.num
                  ? 'bg-gradient-to-r from-violet-600 to-amber-500 text-white font-bold shadow-xs'
                  : step > s.num
                  ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                  : 'bg-zinc-900 text-zinc-500'
              }`}
            >
              {s.num}
            </span>
            <span className="text-[11px] truncate hidden sm:inline">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Wizard Form Container */}
      <div className="rounded-xl border border-zinc-800 bg-[#0c1018] p-6 space-y-6 text-xs">
        {/* STEP 1: ASSET & MINT */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="border-b border-zinc-800/80 pb-3">
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>Base Asset & Mint Specification</span>
              </h3>
              <p className="text-zinc-400 text-[11px] mt-0.5">
                Specify the tokenized asset mint address and pairing quote token
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-zinc-300 block mb-1.5 uppercase">
                  Base Token Mint Address
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter 32-44 char Solana SPL or Token-2022 Mint Address"
                    value={formData.baseMint}
                    onChange={(e) => setFormData({ ...formData, baseMint: e.target.value.trim() })}
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 font-mono focus:outline-none focus:border-zinc-700"
                  />
                  <button
                    type="button"
                    onClick={handleMintInspect}
                    disabled={inspectingMint}
                    className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs flex items-center gap-1.5 shrink-0"
                  >
                    {inspectingMint ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Verify Mint'}
                  </button>
                </div>
                {mintLookupError && (
                  <span className="text-rose-400 text-[11px] mt-1 block">{mintLookupError}</span>
                )}
                {mintLookupSuccess && (
                  <span className="text-emerald-400 text-[11px] mt-1 block">
                    ✓ Verified on-chain SPL Token Mint ({formData.decimals} decimals)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                    Asset Name / Identifier
                  </label>
                  <input
                    type="text"
                    value={formData.tokenName}
                    onChange={(e) => setFormData({ ...formData, tokenName: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-zinc-100"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                    Asset Ticker Symbol
                  </label>
                  <input
                    type="text"
                    value={formData.tokenSymbol}
                    onChange={(e) => setFormData({ ...formData, tokenSymbol: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-zinc-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                    Quote Pairing Asset
                  </label>
                  <select
                    value={formData.quoteSymbol}
                    onChange={(e) => {
                      const sym = e.target.value as 'SOL' | 'USDC';
                      const qMint = QUOTE_MINTS[network === 'mainnet-beta' ? 'mainnet-beta' : 'devnet'][sym].mint;
                      setFormData({ ...formData, quoteSymbol: sym, quoteMint: qMint });
                    }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-200"
                  >
                    <option value="USDC">USDC (USD Coin - Stable RWA benchmark)</option>
                    <option value="SOL">SOL (Native Wrapped SOL)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                    Quote Mint Address
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formData.quoteMint}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded px-3 py-2 text-zinc-400 font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CURVE MODEL */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="border-b border-zinc-800/80 pb-3">
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Dynamic Bonding Curve Parameters</span>
              </h3>
              <p className="text-zinc-400 text-[11px] mt-0.5">
                Formulate the pricing trajectory and total tokens allocated to the bonding curve
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['linear', 'exponential', 'sigmoid', 'piecewise'] as CurveAlgorithmType[]).map((algo) => (
                  <button
                    key={algo}
                    type="button"
                    onClick={() => setFormData({ ...formData, curveType: algo })}
                    className={`py-2 px-3 rounded-lg border text-center capitalize transition-colors ${
                      formData.curveType === algo
                        ? 'border-amber-500/50 bg-amber-500/10 text-amber-300 font-semibold'
                        : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {algo} Curve
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                    Total Mint Supply
                  </label>
                  <input
                    type="text"
                    value={formData.totalSupply}
                    onChange={(e) => setFormData({ ...formData, totalSupply: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 font-mono text-zinc-100"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                    Tokens Allocated to Bonding Curve
                  </label>
                  <input
                    type="text"
                    value={formData.curveAllocationTokens}
                    onChange={(e) => setFormData({ ...formData, curveAllocationTokens: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 font-mono text-zinc-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                    Starting Spot Price ({formData.quoteSymbol})
                  </label>
                  <input
                    type="text"
                    value={formData.startingPriceQuote}
                    onChange={(e) => setFormData({ ...formData, startingPriceQuote: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 font-mono text-amber-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                    Migration Target Price ({formData.quoteSymbol})
                  </label>
                  <input
                    type="text"
                    value={formData.migrationPriceQuote}
                    onChange={(e) => setFormData({ ...formData, migrationPriceQuote: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 font-mono text-zinc-100"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                    Migration Quote Threshold ({formData.quoteSymbol})
                  </label>
                  <input
                    type="text"
                    value={formData.migrationQuoteThreshold}
                    onChange={(e) => setFormData({ ...formData, migrationQuoteThreshold: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 font-mono text-emerald-400"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: GRADUATION & LIQUIDITY LOCK */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="border-b border-zinc-800/80 pb-3">
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Graduation Target & Liquidity Lock</span>
              </h3>
              <p className="text-zinc-400 text-[11px] mt-0.5">
                Define destination AMM upon curve completion and institutional lockup periods
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-zinc-300 block mb-2 uppercase">
                  Meteora AMM Target Architecture
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setFormData({ ...formData, migrationOption: 'MET_DAMM_V2' })}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      formData.migrationOption === 'MET_DAMM_V2'
                        ? 'border-emerald-500/50 bg-emerald-950/20 text-emerald-200'
                        : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="font-semibold text-xs text-zinc-100 mb-1">
                      Meteora DLMM / DAMM v2 (Recommended)
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Concentrated dynamic liquidity with active bin step management and automated dynamic fee reduction factors.
                    </p>
                  </div>

                  <div
                    onClick={() => setFormData({ ...formData, migrationOption: 'MET_DAMM' })}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      formData.migrationOption === 'MET_DAMM'
                        ? 'border-emerald-500/50 bg-emerald-950/20 text-emerald-200'
                        : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="font-semibold text-xs text-zinc-100 mb-1">
                      Meteora DAMM v1 (Dynamic AMM)
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Standard constant product AMM with dynamic volatility-based fee adjustments.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                    LP Token Lock Duration (Days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="3650"
                    value={formData.liquidityLockDays}
                    onChange={(e) => setFormData({ ...formData, liquidityLockDays: Number(e.target.value) })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 font-mono text-zinc-100"
                  />
                  <span className="text-[10px] text-zinc-400 mt-1 block">
                    Institutional standard: 365 days minimum. Locked via Meteora Locker Program.
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                    Creator Trading Fee Share (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={formData.creatorFeePercentage}
                    onChange={(e) => setFormData({ ...formData, creatorFeePercentage: Number(e.target.value) })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 font-mono text-zinc-100"
                  />
                  <span className="text-[10px] text-zinc-400 mt-1 block">
                    Accrued to issuer wallet authority continuously during bonding curve phase.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: FEE ARCHITECTURE & PROTECTIONS */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="border-b border-zinc-800/80 pb-3">
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Dynamic Fee Architecture & Anti-Sniper Protections</span>
              </h3>
              <p className="text-zinc-400 text-[11px] mt-0.5">
                Configure rate limiting and fee decay to prevent front-running on launch
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                    Base Trading Fee (BPS)
                  </label>
                  <input
                    type="number"
                    min="25"
                    max="1000"
                    step="5"
                    value={formData.baseFeeBps}
                    onChange={(e) => setFormData({ ...formData, baseFeeBps: Number(e.target.value) })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 font-mono text-zinc-100"
                  />
                  <span className="text-[10px] text-zinc-400 mt-1 block">
                    {formatBps(formData.baseFeeBps)} standard fee charged on buy/sell swaps.
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                    Anti-Sniper Rate Limiter (Seconds)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="3600"
                    step="10"
                    value={formData.antiSniperRateLimiterSeconds}
                    onChange={(e) => setFormData({ ...formData, antiSniperRateLimiterSeconds: Number(e.target.value) })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 font-mono text-zinc-100"
                  />
                  <span className="text-[10px] text-zinc-400 mt-1 block">
                    Applies Meteora FeeRateLimiter to restrict high-frequency frontrunner bot clusters.
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-zinc-900/50 border border-zinc-800/80 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="dynamic-fee-toggle"
                    checked={formData.dynamicFeeEnabled}
                    onChange={(e) => setFormData({ ...formData, dynamicFeeEnabled: e.target.checked })}
                    className="rounded border-zinc-700 bg-zinc-900 text-amber-500"
                  />
                  <label htmlFor="dynamic-fee-toggle" className="font-semibold text-zinc-200 cursor-pointer">
                    Enable Dynamic Fee Decay Scheduler
                  </label>
                </div>
                <p className="text-[11px] text-zinc-400 leading-normal pl-5">
                  Starts with an initial elevated fee tier that decays exponentially over 24 hours down to base fee, protecting early buyers from sandwich attacks.
                </p>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                  RWA Compliance Disclosure / Metadata
                </label>
                <textarea
                  rows={2}
                  value={formData.rwaComplianceNotes}
                  onChange={(e) => setFormData({ ...formData, rwaComplianceNotes: e.target.value })}
                  placeholder="Optional compliance notes, transfer hook details, or SPV jurisdiction..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-200 text-xs focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: PRE-FLIGHT REVIEW & INSTRUCTION DEPLOYMENT */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="border-b border-zinc-800/80 pb-3">
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Pre-Flight Security & Deployment Verification</span>
              </h3>
              <p className="text-zinc-400 text-[11px] mt-0.5">
                Audit parameters against Meteora DBC smart contract bounds before instruction formulation
              </p>
            </div>

            {/* Validation Errors or Warnings */}
            {!validation.isValid && (
              <div className="p-3.5 rounded-lg bg-rose-950/30 border border-rose-900/60 text-xs text-rose-300 space-y-1">
                <span className="font-semibold block flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Validation Blockers ({validation.errors.length})</span>
                </span>
                <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                  {validation.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {validation.warnings.length > 0 && (
              <div className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-900/50 text-xs text-amber-300 space-y-1">
                <span className="font-semibold block flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Institutional Notices ({validation.warnings.length})</span>
                </span>
                <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                  {validation.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Complete Configuration Summary Table */}
            <div className="rounded-lg border border-zinc-800 bg-[#090d14] p-4 space-y-3 font-mono-nums">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">
                Deployment Specification
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded bg-zinc-900/40 border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-400 block font-sans">Token Symbol</span>
                  <span className="text-zinc-100 font-semibold">{formData.tokenSymbol}</span>
                </div>
                <div className="p-2.5 rounded bg-zinc-900/40 border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-400 block font-sans">Quote Pair</span>
                  <span className="text-amber-400 font-semibold">{formData.quoteSymbol}</span>
                </div>
                <div className="p-2.5 rounded bg-zinc-900/40 border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-400 block font-sans">Curve Algorithm</span>
                  <span className="text-zinc-100 capitalize">{formData.curveType}</span>
                </div>
                <div className="p-2.5 rounded bg-zinc-900/40 border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-400 block font-sans">Migration AMM</span>
                  <span className="text-emerald-400 font-semibold">{formData.migrationOption}</span>
                </div>
                <div className="p-2.5 rounded bg-zinc-900/40 border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-400 block font-sans">Starting Spot Price</span>
                  <span className="text-zinc-100">{formData.startingPriceQuote} {formData.quoteSymbol}</span>
                </div>
                <div className="p-2.5 rounded bg-zinc-900/40 border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-400 block font-sans">Target Quote Cap</span>
                  <span className="text-zinc-100">{formData.migrationQuoteThreshold} {formData.quoteSymbol}</span>
                </div>
                <div className="p-2.5 rounded bg-zinc-900/40 border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-400 block font-sans">Base Fee</span>
                  <span className="text-zinc-100">{formatBps(formData.baseFeeBps)}</span>
                </div>
                <div className="p-2.5 rounded bg-zinc-900/40 border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-400 block font-sans">LP Lock</span>
                  <span className="text-zinc-100">{formData.liquidityLockDays} Days</span>
                </div>
              </div>
            </div>

            {/* Target Program & Instruction Review */}
            <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-semibold">Verified Smart Contract:</span>
                <AddressBadge address={METEORA_DBC_PROGRAM_ID} label="Meteora DBC" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-semibold">Target Network:</span>
                <span className="font-mono text-zinc-200 uppercase">{network}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-semibold">Estimated Rent Exemption:</span>
                <span className="font-mono text-zinc-200">~0.0485 SOL</span>
              </div>
            </div>

            {/* Action Trigger */}
            <div className="pt-2">
              {connected ? (
                <button
                  type="button"
                  disabled={!validation.isValid}
                  onClick={() => setPreflightOpen(true)}
                  className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-violet-600 via-pink-500 to-amber-500 hover:opacity-90 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-violet-950/30 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Review & Sign On-Chain Deployment</span>
                </button>
              ) : (
                <div className="p-4 rounded-lg bg-zinc-900/80 border border-zinc-800 text-center space-y-2">
                  <p className="text-xs text-zinc-300">
                    Draft configuration is ready. To execute on-chain deployment to Meteora DBC on {network.toUpperCase()}, please connect your Solana wallet.
                  </p>
                  <button
                    type="button"
                    onClick={onOpenWalletModal}
                    className="py-2 px-4 rounded-lg bg-gradient-to-r from-violet-600 to-amber-500 hover:opacity-90 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-opacity cursor-pointer"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Connect Wallet to Deploy</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800/80">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep(step - 1)}
            className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          {step < 5 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-amber-500 hover:opacity-90 text-white text-xs font-semibold flex items-center gap-1.5 transition-opacity cursor-pointer shadow-xs"
            >
              <span>Next Stage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="text-[11px] text-zinc-400 font-mono">Stage 5 of 5</span>
          )}
        </div>
      </div>

      {/* Real Pre-flight Security & Signing Modal */}
      <TxPreflightModal
        isOpen={preflightOpen}
        intent={transactionIntent}
        onClose={() => setPreflightOpen(false)}
        onConfirm={handleExecuteSigning}
        isSigning={isSigning}
        error={signingError}
        txSignature={confirmedTxSignature}
      />
    </div>
  );
};
