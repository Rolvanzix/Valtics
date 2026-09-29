import React, { useState } from 'react';
import { 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink, 
  RefreshCw, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Keypair } from '@solana/web3.js';
import { useNetwork } from '../../context/NetworkContext';
import { isValidSolanaAddress } from '../../utils/security';
import { inspectSplTokenMint } from '../../services/solana';
import { QUOTE_MINTS, getExplorerUrl } from '../../config/constants';
import { TokenMetadata } from '../../types';

export const ASSET_CATEGORIES = [
  'Treasuries',
  'Real Estate',
  'Private Credit',
  'Structured Note',
  'Commodities',
  'Infrastructure',
] as const;

export interface Step1AssetData {
  assetName: string;
  ticker: string;
  baseMint: string;
  baseMintKeypair?: Keypair;
  assetCategory: string;
  referencePrice: string;
  quoteSymbol: 'USDC' | 'SOL';
  quoteMint: string;
  decimals: number;
  totalSupply: string;
  verifiedMetadata?: TokenMetadata | null;
}

interface Step1AssetProps {
  data: Step1AssetData;
  onChange: (data: Step1AssetData) => void;
  onNext: () => void;
}

// Verified Devnet tokens for quick testing
const DEVNET_PRESET_MINTS = [
  {
    name: 'USD Coin (Devnet)',
    symbol: 'USDC',
    category: 'Treasuries',
    mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
    referencePrice: '1.00',
  },
  {
    name: 'Wrapped SOL (Devnet)',
    symbol: 'SOL',
    category: 'Structured Note',
    mint: 'So11111111111111111111111111111111111111112',
    referencePrice: '140.00',
  },
];

export const Step1Asset: React.FC<Step1AssetProps> = ({ data, onChange, onNext }) => {
  const { connection } = useNetwork();

  const [inspecting, setInspecting] = useState(false);
  const [validationState, setValidationState] = useState<'idle' | 'valid' | 'invalid_address' | 'not_found'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeQuoteMints = QUOTE_MINTS.devnet;

  const handleInspectMint = async (mintAddress: string) => {
    const trimmed = mintAddress.trim();
    if (!trimmed) {
      setValidationState('invalid_address');
      setErrorMessage('Please enter a Solana SPL token mint address.');
      return;
    }

    if (!isValidSolanaAddress(trimmed)) {
      setValidationState('invalid_address');
      setErrorMessage('Invalid address format. Must be a valid 32-44 character Base58 string.');
      return;
    }

    setInspecting(true);
    setValidationState('idle');
    setErrorMessage(null);

    // Devnet RPC Inspection
    try {
      const info = await inspectSplTokenMint(connection, trimmed);
      if (info) {
        onChange({
          ...data,
          baseMint: trimmed,
          decimals: info.decimals,
          totalSupply: info.supply || data.totalSupply,
          assetName: info.name && !info.name.startsWith('Token ') ? info.name : data.assetName || info.name,
          ticker: info.symbol && info.symbol !== 'TKN' ? info.symbol : data.ticker || info.symbol,
          verifiedMetadata: info,
        });
        setValidationState('valid');
      } else {
        setValidationState('not_found');
        setErrorMessage('Asset not found on Devnet. The entered address does not exist on Solana Devnet or is not an initialized SPL/Token-2022 mint.');
        onChange({
          ...data,
          baseMint: trimmed,
          verifiedMetadata: null,
        });
      }
    } catch (err: any) {
      setValidationState('not_found');
      setErrorMessage(err?.message || 'Failed to inspect token mint on Devnet RPC.');
      onChange({
        ...data,
        baseMint: trimmed,
        verifiedMetadata: null,
      });
    } finally {
      setInspecting(false);
    }
  };

  const handleSelectDevnetPreset = (preset: typeof DEVNET_PRESET_MINTS[0]) => {
    onChange({
      ...data,
      assetName: preset.name,
      ticker: preset.symbol,
      assetCategory: preset.category,
      baseMint: preset.mint,
      referencePrice: preset.referencePrice,
    });
    handleInspectMint(preset.mint);
  };

  const handleQuoteChange = (symbol: 'USDC' | 'SOL') => {
    const mint = activeQuoteMints[symbol]?.mint || activeQuoteMints.USDC.mint;
    onChange({
      ...data,
      quoteSymbol: symbol,
      quoteMint: mint,
    });
  };

  const isFormValid =
    validationState === 'valid' &&
    data.verifiedMetadata !== null &&
    data.assetName.trim().length > 0 &&
    data.ticker.trim().length > 0 &&
    isValidSolanaAddress(data.baseMint) &&
    data.quoteMint.length > 0;

  return (
    <div className="space-y-6">
      {/* Header & Context */}
      <div className="border-b border-zinc-800/80 pb-4">
        <h2 className="text-xl font-bold text-white tracking-tight font-sans">Asset</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Paste an existing Solana token mint address to validate on-chain via Devnet RPC.
        </p>
      </div>

      {/* Devnet Preset Tokens */}
      <div className="bg-[#0c101a] border border-zinc-800/80 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Devnet Preset Tokens</span>
          </span>
          <span className="text-[11px] text-zinc-400">Quick selection for testing</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {DEVNET_PRESET_MINTS.map((item) => (
            <button
              key={item.mint}
              type="button"
              onClick={() => handleSelectDevnetPreset(item)}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                data.baseMint === item.mint
                  ? 'border-amber-500/60 bg-amber-500/10 text-white shadow-xs'
                  : 'border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/60 text-zinc-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-xs text-white">{item.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                  {item.symbol}
                </span>
              </div>
              <div className="text-[11px] text-zinc-400 font-mono flex items-center justify-between">
                <span className="truncate max-w-[180px]">{item.mint.slice(0, 8)}...{item.mint.slice(-6)}</span>
                <span className="text-amber-400 text-[10px]">Select & Inspect</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Primary Asset Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-[#0c101a] border border-zinc-800 rounded-xl p-5">
        {/* Asset Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-zinc-300">
            Asset Name <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={data.assetName}
            onChange={(e) => onChange({ ...data, assetName: e.target.value })}
            placeholder="e.g. USD Coin (Devnet)"
            className="w-full bg-zinc-900/80 border border-zinc-700/80 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
          <p className="text-[11px] text-zinc-400">The token or asset display name.</p>
        </div>

        {/* Ticker */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-zinc-300">
            Asset Ticker Symbol <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={data.ticker}
            onChange={(e) => onChange({ ...data, ticker: e.target.value.toUpperCase() })}
            placeholder="e.g. USDC"
            maxLength={12}
            className="w-full bg-zinc-900/80 border border-zinc-700/80 rounded-lg px-3.5 py-2.5 text-sm font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors uppercase"
          />
          <p className="text-[11px] text-zinc-400">Secondary trading ticker symbol (2-10 characters).</p>
        </div>

        {/* Token Mint Address with Address Validation */}
        <div className="space-y-1.5 md:col-span-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-zinc-300">
              Token Mint Address (Solana Devnet Base58) <span className="text-rose-400">*</span>
            </label>
            <span className="text-[11px] text-zinc-400 font-mono">SPL Token Standard</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={data.baseMint}
              onChange={(e) => {
                onChange({ ...data, baseMint: e.target.value });
                setValidationState('idle');
                setErrorMessage(null);
              }}
              placeholder="Enter 32-44 char Solana SPL token mint on Devnet..."
              className="flex-1 bg-zinc-900/80 border border-zinc-700/80 rounded-lg px-3.5 py-2.5 text-sm font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
            <button
              type="button"
              disabled={inspecting || !data.baseMint}
              onClick={() => handleInspectMint(data.baseMint)}
              className="px-5 py-2.5 rounded-lg font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-amber-500 hover:bg-amber-400 text-zinc-950"
            >
              {inspecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Validate</span>
            </button>
          </div>

          {/* Validation Feedback */}
          {errorMessage && (
            <div className="bg-rose-950/30 border border-rose-900/50 rounded-lg p-3 text-xs text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="space-y-0.5 flex-1">
                <span className="font-semibold text-rose-200 block">
                  {validationState === 'invalid_address' ? 'Invalid Address Format' : 'Asset Not Found'}
                </span>
                <p className="text-[11px] text-rose-300/90 leading-relaxed font-sans">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Devnet Validated Display */}
          {validationState === 'valid' && data.verifiedMetadata && (
            <div className="bg-emerald-950/20 border border-emerald-900/50 rounded-xl p-4 text-xs text-emerald-300 space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-900/40 pb-2">
                <div className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white">Validated Asset on Solana Devnet</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-400">
                    {data.verifiedMetadata.isToken2022 ? 'Token-2022' : 'SPL Token Standard'}
                  </span>
                  <a
                    href={getExplorerUrl(data.baseMint, 'address', 'devnet')}
                    target="_blank"
                    rel="noreferrer"
                    className="text-zinc-400 hover:text-zinc-200 inline-flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-[11px]">
                <div>
                  <span className="text-zinc-500 block">Decimals:</span>
                  <span className="text-zinc-200 font-medium">{data.decimals}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Supply:</span>
                  <span className="text-zinc-200 font-medium truncate block">{data.totalSupply}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Cluster:</span>
                  <span className="text-amber-400 font-medium">Solana Devnet</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Asset Category */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-zinc-300">Asset Category</label>
          <select
            value={data.assetCategory}
            onChange={(e) => onChange({ ...data, assetCategory: e.target.value })}
            className="w-full bg-zinc-900/80 border border-zinc-700/80 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
          >
            {ASSET_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Reference Price */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-zinc-300">
            Initial Reference / Par Valuation ($USD)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-zinc-500 text-sm">$</span>
            <input
              type="number"
              step="0.01"
              min="0.0001"
              value={data.referencePrice}
              onChange={(e) => onChange({ ...data, referencePrice: e.target.value })}
              className="w-full bg-zinc-900/80 border border-zinc-700/80 rounded-lg pl-7 pr-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        {/* Quote Asset Selector */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="block text-xs font-medium text-zinc-300">Pairing Reserve Asset (Quote)</label>
          <div className="grid grid-cols-2 gap-3">
            {(['USDC', 'SOL'] as const).map((sym) => (
              <button
                key={sym}
                type="button"
                onClick={() => handleQuoteChange(sym)}
                className={`p-3 rounded-lg border text-left flex items-center justify-between cursor-pointer transition-all ${
                  data.quoteSymbol === sym
                    ? 'border-amber-500/60 bg-amber-500/10 text-white'
                    : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                }`}
              >
                <div>
                  <span className="font-semibold text-xs block text-white">
                    {sym === 'USDC' ? 'USD Coin (USDC)' : 'Solana (SOL)'}
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    {sym === 'USDC' ? 'Circle Dollar SPL · Stable' : 'Native Solana · Variable'}
                  </span>
                </div>
                <span className="text-xs font-mono font-medium">{sym}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Next Button */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          disabled={!isFormValid}
          onClick={onNext}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs uppercase tracking-wide cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
        >
          <span>Continue to Market Parameters</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
