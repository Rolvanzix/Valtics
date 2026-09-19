import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Coins, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink, 
  RefreshCw, 
  Sparkles,
  Info,
  Zap,
  ArrowRight
} from 'lucide-react';
import { PublicKey } from '@solana/web3.js';
import { useNetwork } from '../../context/NetworkContext';
import { isValidSolanaAddress } from '../../utils/security';
import { inspectSplTokenMint } from '../../services/solana';
import { QUOTE_MINTS, getExplorerUrl } from '../../config/constants';
import { AddressBadge } from '../common/AddressBadge';
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
  const { network, connection } = useNetwork();
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
    const mint = activeQuoteMints[symbol].mint;
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

      {/* Quick Curated Presets for Rapid Testing */}
      <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Devnet Reference Assets (Quick Fill & Validate)</span>
          </div>
          <span className="text-[11px] text-zinc-400 font-mono">Solana Devnet</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {DEVNET_PRESET_MINTS.map((item) => (
            <button
              key={item.symbol}
              type="button"
              onClick={() => handleSelectDevnetPreset(item)}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                data.baseMint === item.mint
                  ? 'bg-amber-500/10 border-amber-500/50 text-white ring-1 ring-amber-500/30'
                  : 'bg-zinc-900/50 border-zinc-800/80 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold font-mono text-amber-400">${item.symbol}</span>
                <span className="text-[10px] uppercase font-sans text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded">
                  {item.category}
                </span>
              </div>
              <div className="text-xs text-zinc-200 font-medium truncate">{item.name}</div>
              <div className="text-[11px] text-zinc-400 font-mono mt-1 flex items-center justify-between">
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
            <span className="text-[11px] text-zinc-400 font-mono">SPL Token / Token-2022</span>
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
              placeholder="Enter 32-44 char Solana SPL token mint public key on Devnet..."
              className="flex-1 bg-zinc-900/80 border border-zinc-700/80 rounded-lg px-3.5 py-2.5 text-sm font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
            <button
              type="button"
              disabled={inspecting || !data.baseMint}
              onClick={() => handleInspectMint(data.baseMint)}
              className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {inspecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Validate</span>
            </button>
          </div>

          {/* Validation Feedback */}
          {errorMessage && (
            <div className="bg-rose-950/30 border border-rose-900/50 rounded-lg p-3 text-xs text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold text-rose-200 block">
                  {validationState === 'invalid_address' ? 'Invalid Address Format' : 'Asset Not Found on Devnet'}
                </span>
                <p className="text-[11px] text-rose-300/90 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

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
                    href={getExplorerUrl(data.baseMint, 'address', network as any)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono"
                  >
                    <span>Explorer</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                <div className="bg-black/40 p-2.5 rounded-lg border border-emerald-950/80">
                  <span className="text-[10px] uppercase font-sans text-zinc-400 block">Decimals</span>
                  <span className="font-bold text-white text-sm">{data.verifiedMetadata.decimals}</span>
                </div>
                <div className="bg-black/40 p-2.5 rounded-lg border border-emerald-950/80">
                  <span className="text-[10px] uppercase font-sans text-zinc-400 block">On-Chain Supply</span>
                  <span className="font-bold text-white text-sm truncate block">{data.verifiedMetadata.supply || '0'}</span>
                </div>
                <div className="bg-black/40 p-2.5 rounded-lg border border-emerald-950/80">
                  <span className="text-[10px] uppercase font-sans text-zinc-400 block">Mint Authority</span>
                  <span className="text-zinc-300 text-[11px] truncate block">
                    {data.verifiedMetadata.mintAuthority ? `${data.verifiedMetadata.mintAuthority.slice(0, 4)}...${data.verifiedMetadata.mintAuthority.slice(-4)}` : 'Fixed Supply'}
                  </span>
                </div>
                <div className="bg-black/40 p-2.5 rounded-lg border border-emerald-950/80">
                  <span className="text-[10px] uppercase font-sans text-zinc-400 block">Freeze Authority</span>
                  <span className="text-zinc-300 text-[11px] truncate block">
                    {data.verifiedMetadata.freezeAuthority ? `${data.verifiedMetadata.freezeAuthority.slice(0, 4)}...${data.verifiedMetadata.freezeAuthority.slice(-4)}` : 'None (Revoked)'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Asset Category */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-zinc-300">
            Asset Category <span className="text-rose-400">*</span>
          </label>
          <select
            value={data.assetCategory}
            onChange={(e) => onChange({ ...data, assetCategory: e.target.value })}
            className="w-full bg-zinc-900/80 border border-zinc-700/80 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
          >
            {ASSET_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-zinc-400">Determines risk classification and institutional disclosure profile.</p>
        </div>

        {/* Reference Price (NAV / Par Value) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-zinc-300">
            Reference Price / Stated NAV (USD)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-sm text-zinc-400 font-mono">$</span>
            <input
              type="number"
              step="any"
              min="0.0001"
              value={data.referencePrice}
              onChange={(e) => onChange({ ...data, referencePrice: e.target.value })}
              placeholder="e.g. 1.00"
              className="w-full bg-zinc-900/80 border border-zinc-700/80 rounded-lg pl-8 pr-3.5 py-2.5 text-sm font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          <p className="text-[11px] text-zinc-400">Benchmark par value or audited appraisal price for curve alignment.</p>
        </div>

        {/* Quote Token Selection */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="block text-xs font-medium text-zinc-300">
            Quote Currency Pair <span className="text-rose-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleQuoteChange('USDC')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleQuoteChange('USDC');
                }
              }}
              className={`p-3 rounded-lg border text-left flex items-center justify-between cursor-pointer transition-all ${
                data.quoteSymbol === 'USDC'
                  ? 'bg-amber-500/10 border-amber-500/50 text-white'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Coins className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-zinc-100">USDC (USD Coin)</div>
                  <div className="text-[11px] text-zinc-400">Fiat-pegged stable currency (6 decimals)</div>
                </div>
              </div>
              <div className="text-xs font-mono text-zinc-400">
                <AddressBadge address={activeQuoteMints.USDC.mint} head={4} tail={4} />
              </div>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() => handleQuoteChange('SOL')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleQuoteChange('SOL');
                }
              }}
              className={`p-3 rounded-lg border text-left flex items-center justify-between cursor-pointer transition-all ${
                data.quoteSymbol === 'SOL'
                  ? 'bg-amber-500/10 border-amber-500/50 text-white'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Zap className="w-5 h-5 text-violet-400 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-zinc-100">SOL (Wrapped SOL)</div>
                  <div className="text-[11px] text-zinc-400">Native Solana blockchain quote token (9 decimals)</div>
                </div>
              </div>
              <div className="text-xs font-mono text-zinc-400">
                <AddressBadge address={activeQuoteMints.SOL.mint} head={4} tail={4} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Info className="w-3.5 h-3.5 text-zinc-400" />
          <span>Real Solana SPL mint addresses are mandatory for Meteora Dynamic Bonding Curves.</span>
        </div>

        <button
          type="button"
          disabled={!isFormValid}
          onClick={onNext}
          className="py-2.5 px-6 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2 shadow-xs shadow-amber-500/20"
        >
          <span>Configure market</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
