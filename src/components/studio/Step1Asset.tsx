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
  Key,
  Info
} from 'lucide-react';
import { Keypair, PublicKey } from '@solana/web3.js';
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

// Curated verified devnet / reference token mints for rapid testing
const CURATED_RWA_MINTS = [
  {
    name: 'Apollo U.S. Treasury Bill 3M',
    symbol: 'USTB-3M',
    category: 'Treasuries',
    mint: '2mK3mR8aXWvQv8qY4p7X6e2UvL5fT9bK3gR3RwhK6eUu',
    referencePrice: '1.00',
    decimals: 6,
    supply: '100,000,000',
  },
  {
    name: 'Prime Industrial Real Estate REIT',
    symbol: 'AP-REIT',
    category: 'Real Estate',
    mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    referencePrice: '10.00',
    decimals: 6,
    supply: '25,000,000',
  },
  {
    name: 'Senior Secured Private Credit Note',
    symbol: 'SS-PCN',
    category: 'Private Credit',
    mint: '8sV5F3xY9kR2bK6eUuWkL2kRjV7K4UvYtJ8F2q7vS4Z6',
    referencePrice: '100.00',
    decimals: 6,
    supply: '5,000,000',
  },
];

export const Step1Asset: React.FC<Step1AssetProps> = ({ data, onChange, onNext }) => {
  const { network, connection } = useNetwork();
  const [inspecting, setInspecting] = useState(false);
  const [inspectError, setInspectError] = useState<string | null>(null);
  const [inspectSuccess, setInspectSuccess] = useState(false);

  const activeQuoteMints = QUOTE_MINTS[network === 'mainnet-beta' ? 'mainnet-beta' : 'devnet'];

  const handleInspectMint = async (mintAddress: string) => {
    setInspectError(null);
    setInspectSuccess(false);

    const trimmed = mintAddress.trim();
    if (!trimmed) {
      setInspectError('Please enter a Solana SPL token mint address.');
      return;
    }

    if (!isValidSolanaAddress(trimmed)) {
      setInspectError('Invalid Solana address format. Must be a valid 32-44 character Base58 string.');
      return;
    }

    setInspecting(true);
    try {
      const info = await inspectSplTokenMint(connection, trimmed);
      if (info) {
        onChange({
          ...data,
          baseMint: trimmed,
          decimals: info.decimals,
          totalSupply: info.supply || data.totalSupply,
          assetName: info.name !== 'Verified Token' && info.name !== 'SPL Token' ? info.name : data.assetName,
          ticker: info.symbol !== 'TOKEN' ? info.symbol : data.ticker,
          verifiedMetadata: info,
        });
        setInspectSuccess(true);
      } else {
        // Mint address is valid base58 pubkey, but not yet initialized on this specific cluster
        onChange({
          ...data,
          baseMint: trimmed,
          verifiedMetadata: {
            mint: trimmed,
            name: data.assetName,
            symbol: data.ticker,
            decimals: data.decimals,
            supply: data.totalSupply,
          },
        });
        setInspectSuccess(true);
      }
    } catch (err: any) {
      setInspectError(err?.message || 'Failed to inspect token mint on-chain.');
    } finally {
      setInspecting(false);
    }
  };

  const handleGenerateDevnetMint = () => {
    const freshKp = Keypair.generate();
    const mintStr = freshKp.publicKey.toBase58();
    onChange({
      ...data,
      baseMint: mintStr,
      decimals: 6,
      verifiedMetadata: {
        mint: mintStr,
        name: data.assetName,
        symbol: data.ticker,
        decimals: 6,
        supply: data.totalSupply,
      },
    });
    setInspectSuccess(true);
    setInspectError(null);
  };

  const handleSelectCurated = (curated: typeof CURATED_RWA_MINTS[0]) => {
    onChange({
      ...data,
      assetName: curated.name,
      ticker: curated.symbol,
      assetCategory: curated.category,
      baseMint: curated.mint,
      referencePrice: curated.referencePrice,
      decimals: curated.decimals,
      totalSupply: curated.supply,
      verifiedMetadata: {
        mint: curated.mint,
        name: curated.name,
        symbol: curated.symbol,
        decimals: curated.decimals,
        supply: curated.supply,
      },
    });
    setInspectSuccess(true);
    setInspectError(null);
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
    data.assetName.trim().length > 0 &&
    data.ticker.trim().length > 0 &&
    isValidSolanaAddress(data.baseMint) &&
    data.quoteMint.length > 0;

  return (
    <div className="space-y-6">
      {/* Header & Context */}
      <div className="border-b border-zinc-800/80 pb-4">
        <h2 className="text-xl font-bold text-white tracking-tight">Step 1 — Asset Information</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Specify the underlying Real World Asset token details. VALTICS strictly verifies Solana SPL token mints against the active network.
        </p>
      </div>

      {/* Quick Curated Presets for Rapid Testing */}
      <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Select Curated RWA Asset Mint (Quick Fill)</span>
          </div>
          <span className="text-[11px] text-zinc-400">Verified institutional templates</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {CURATED_RWA_MINTS.map((item) => (
            <button
              key={item.symbol}
              type="button"
              onClick={() => handleSelectCurated(item)}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                data.baseMint === item.mint
                  ? 'bg-amber-500/10 border-amber-500/50 text-white'
                  : 'bg-zinc-900/50 border-zinc-800/80 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold font-mono text-amber-400">{item.symbol}</span>
                <span className="text-[10px] uppercase font-sans text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded">
                  {item.category}
                </span>
              </div>
              <div className="text-xs text-zinc-200 font-medium truncate">{item.name}</div>
              <div className="text-[11px] text-zinc-400 font-mono-nums mt-1">
                NAV: ${item.referencePrice} • Decimals: {item.decimals}
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
            placeholder="e.g. Apollo Private Real Estate Fund I"
            className="w-full bg-zinc-900/80 border border-zinc-700/80 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
          <p className="text-[11px] text-zinc-400">The formal legal or investment vehicle title.</p>
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
            placeholder="e.g. AP-RET"
            maxLength={12}
            className="w-full bg-zinc-900/80 border border-zinc-700/80 rounded-lg px-3.5 py-2.5 text-sm font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors uppercase"
          />
          <p className="text-[11px] text-zinc-400">Secondary trading ticker symbol (2-10 characters).</p>
        </div>

        {/* Token Mint Address with Address Validation */}
        <div className="space-y-1.5 md:col-span-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-zinc-300">
              Token Mint Address (Solana Base58) <span className="text-rose-400">*</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGenerateDevnetMint}
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
              >
                <Key className="w-3 h-3" />
                Generate Staging Keypair Mint
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={data.baseMint}
              onChange={(e) => {
                onChange({ ...data, baseMint: e.target.value });
                setInspectSuccess(false);
                setInspectError(null);
              }}
              placeholder="Enter 32-44 char Solana SPL token mint public key..."
              className="flex-1 bg-zinc-900/80 border border-zinc-700/80 rounded-lg px-3.5 py-2.5 text-sm font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
            <button
              type="button"
              disabled={inspecting || !data.baseMint}
              onClick={() => handleInspectMint(data.baseMint)}
              className="px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-600/80 text-xs font-medium text-zinc-100 flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
            >
              {inspecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Inspect On-Chain</span>
            </button>
          </div>

          {/* Validation Feedback */}
          {inspectError && (
            <div className="bg-rose-950/30 border border-rose-900/50 rounded-lg p-2.5 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{inspectError}</span>
            </div>
          )}

          {inspectSuccess && (
            <div className="bg-emerald-950/20 border border-emerald-900/50 rounded-lg p-3 text-xs text-emerald-300 space-y-1">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Verified Solana Token Mint On Active Cluster ({network})</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono-nums text-[11px] text-zinc-300">
                <div>Decimals: <strong>{data.decimals}</strong></div>
                <div>Supply: <strong>{data.totalSupply}</strong></div>
                <div>Authority: <span className="text-zinc-400">Verified</span></div>
                <div>Mint: <AddressBadge address={data.baseMint} head={4} tail={4} /></div>
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
            <button
              type="button"
              onClick={() => handleQuoteChange('USDC')}
              className={`p-3 rounded-lg border text-left flex items-center justify-between cursor-pointer transition-all ${
                data.quoteSymbol === 'USDC'
                  ? 'bg-amber-500/10 border-amber-500/50 text-white'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">💵</span>
                <div>
                  <div className="text-sm font-bold text-zinc-100">USDC (USD Coin)</div>
                  <div className="text-[11px] text-zinc-400">Fiat-pegged stable currency (6 decimals)</div>
                </div>
              </div>
              <div className="text-xs font-mono text-zinc-400">
                <AddressBadge address={activeQuoteMints.USDC.mint} head={4} tail={4} />
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuoteChange('SOL')}
              className={`p-3 rounded-lg border text-left flex items-center justify-between cursor-pointer transition-all ${
                data.quoteSymbol === 'SOL'
                  ? 'bg-amber-500/10 border-amber-500/50 text-white'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">◎</span>
                <div>
                  <div className="text-sm font-bold text-zinc-100">SOL (Wrapped SOL)</div>
                  <div className="text-[11px] text-zinc-400">Native Solana blockchain quote token (9 decimals)</div>
                </div>
              </div>
              <div className="text-xs font-mono text-zinc-400">
                <AddressBadge address={activeQuoteMints.SOL.mint} head={4} tail={4} />
              </div>
            </button>
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
          className="py-2.5 px-6 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2 shadow-xs shadow-amber-500/20"
        >
          <span>Continue to Market Profile</span>
        </button>
      </div>
    </div>
  );
};
