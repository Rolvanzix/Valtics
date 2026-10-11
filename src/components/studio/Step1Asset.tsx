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
      <div className="border-b border-[#670CDC]/20 pb-4">
        <h2 className="text-xl font-bold text-[#F7F3FF] tracking-tight font-sans">Asset</h2>
        <p className="text-xs text-[#B8A9CC] mt-1">
          Paste an existing Solana token mint address to validate on-chain via Devnet RPC.
        </p>
      </div>

      {/* Devnet Preset Tokens */}
      <div className="bg-[#140130] border border-[#670CDC]/25 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#EDE4FA] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#F99225]" />
            <span>Devnet Preset Tokens</span>
          </span>
          <span className="text-[11px] text-[#B8A9CC]">Quick selection for testing</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {DEVNET_PRESET_MINTS.map((item) => (
            <button
              key={item.mint}
              type="button"
              onClick={() => handleSelectDevnetPreset(item)}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                data.baseMint === item.mint
                  ? 'border-[#F99225]/60 bg-[#F99225]/15 text-[#F7F3FF] shadow-xs'
                  : 'border-[#670CDC]/20 bg-[#100126] hover:bg-[#1E0148] text-[#EDE4FA]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-xs text-[#F7F3FF]">{item.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1E0148] text-[#B8A9CC] font-mono border border-[#670CDC]/20">
                  {item.symbol}
                </span>
              </div>
              <div className="text-[11px] text-[#B8A9CC] font-mono flex items-center justify-between">
                <span className="truncate max-w-[180px]">{item.mint.slice(0, 8)}...{item.mint.slice(-6)}</span>
                <span className="text-[#F99225] text-[10px]">Select & Inspect</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Primary Asset Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-[#140130] border border-[#670CDC]/25 rounded-xl p-5">
        {/* Asset Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-[#EDE4FA]">
            Asset Name <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={data.assetName}
            onChange={(e) => onChange({ ...data, assetName: e.target.value })}
            placeholder="e.g. USD Coin (Devnet)"
            className="w-full bg-[#0C001C] border border-[#670CDC]/30 rounded-lg px-3.5 py-2.5 text-sm text-[#F7F3FF] placeholder-[#7E6D96] focus:outline-none focus:border-[#670CDC] transition-colors"
          />
          <p className="text-[11px] text-[#B8A9CC]">The token or asset display name.</p>
        </div>

        {/* Ticker */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-[#EDE4FA]">
            Asset Ticker Symbol <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={data.ticker}
            onChange={(e) => onChange({ ...data, ticker: e.target.value.toUpperCase() })}
            placeholder="e.g. USDC"
            maxLength={12}
            className="w-full bg-[#0C001C] border border-[#670CDC]/30 rounded-lg px-3.5 py-2.5 text-sm font-mono text-[#F7F3FF] placeholder-[#7E6D96] focus:outline-none focus:border-[#670CDC] transition-colors uppercase"
          />
          <p className="text-[11px] text-[#B8A9CC]">Secondary trading ticker symbol (2-10 characters).</p>
        </div>

        {/* Token Mint Address with Address Validation */}
        <div className="space-y-1.5 md:col-span-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-[#EDE4FA]">
              Token Mint Address (Solana Devnet Base58) <span className="text-rose-400">*</span>
            </label>
            <span className="text-[11px] text-[#B8A9CC] font-mono">SPL Token Standard</span>
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
              className="flex-1 bg-[#0C001C] border border-[#670CDC]/30 rounded-lg px-3.5 py-2.5 text-sm font-mono text-[#F7F3FF] placeholder-[#7E6D96] focus:outline-none focus:border-[#670CDC] transition-colors"
            />
            <button
              type="button"
              disabled={inspecting || !data.baseMint}
              onClick={() => handleInspectMint(data.baseMint)}
              className="px-5 py-2.5 rounded-lg font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-[#F99225] hover:bg-[#ff9f3b] text-[#09011B]"
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
            <div className="bg-[#100126] border border-emerald-500/40 rounded-xl p-4 text-xs text-emerald-300 space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-900/40 pb-2">
                <div className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-[#F7F3FF]">Validated Asset on Solana Devnet</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-400">
                    {data.verifiedMetadata.isToken2022 ? 'Token-2022' : 'SPL Token Standard'}
                  </span>
                  <a
                    href={getExplorerUrl(data.baseMint, 'address', 'devnet')}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#B8A9CC] hover:text-[#F7F3FF] inline-flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-[11px]">
                <div>
                  <span className="text-[#7E6D96] block">Decimals:</span>
                  <span className="text-[#EDE4FA] font-medium">{data.decimals}</span>
                </div>
                <div>
                  <span className="text-[#7E6D96] block">Supply:</span>
                  <span className="text-[#EDE4FA] font-medium truncate block">{data.totalSupply}</span>
                </div>
                <div>
                  <span className="text-[#7E6D96] block">Cluster:</span>
                  <span className="text-[#F99225] font-medium">Solana Devnet</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Asset Category */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-[#EDE4FA]">Asset Category</label>
          <select
            value={data.assetCategory}
            onChange={(e) => onChange({ ...data, assetCategory: e.target.value })}
            className="w-full bg-[#0C001C] border border-[#670CDC]/30 rounded-lg px-3.5 py-2.5 text-sm text-[#F7F3FF] focus:outline-none focus:border-[#670CDC] transition-colors cursor-pointer"
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
          <label className="block text-xs font-medium text-[#EDE4FA]">
            Initial Reference / Par Valuation ($USD)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-[#7E6D96] text-sm">$</span>
            <input
              type="number"
              step="0.01"
              min="0.0001"
              value={data.referencePrice}
              onChange={(e) => onChange({ ...data, referencePrice: e.target.value })}
              className="w-full bg-[#0C001C] border border-[#670CDC]/30 rounded-lg pl-7 pr-3.5 py-2.5 text-sm font-mono text-[#F7F3FF] focus:outline-none focus:border-[#670CDC] transition-colors"
            />
          </div>
        </div>

        {/* Quote Asset Selector */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="block text-xs font-medium text-[#EDE4FA]">Pairing Reserve Asset (Quote)</label>
          <div className="grid grid-cols-2 gap-3">
            {(['USDC', 'SOL'] as const).map((sym) => (
              <button
                key={sym}
                type="button"
                onClick={() => handleQuoteChange(sym)}
                className={`p-3 rounded-lg border text-left flex items-center justify-between cursor-pointer transition-all ${
                  data.quoteSymbol === sym
                    ? 'border-[#F99225]/60 bg-[#F99225]/15 text-[#F7F3FF]'
                    : 'border-[#670CDC]/20 bg-[#100126] text-[#B8A9CC] hover:bg-[#1E0148] hover:text-[#F7F3FF]'
                }`}
              >
                <div>
                  <span className="font-semibold text-xs block text-[#F7F3FF]">
                    {sym === 'USDC' ? 'USD Coin (USDC)' : 'Solana (SOL)'}
                  </span>
                  <span className="text-[10px] text-[#B8A9CC]">
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
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#F99225] hover:bg-[#FFA33D] text-[#09011B] font-bold text-xs uppercase tracking-wide cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-[#F99225]/20"
        >
          <span>Continue to Market Parameters</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
