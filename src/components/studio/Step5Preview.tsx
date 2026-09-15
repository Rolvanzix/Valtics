import React from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Coins, 
  Sliders, 
  Lock, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  Server,
  Zap
} from 'lucide-react';
import { CurveStudioConfigInput } from '../../services/meteoraCreation';
import { useNetwork } from '../../context/NetworkContext';
import { useWallet } from '../../context/WalletContext';
import { METEORA_DBC_PROGRAM_ID } from '../../config/constants';
import { AddressBadge } from '../common/AddressBadge';
import { formatCurrency, formatNumber, formatBps } from '../../utils/format';

interface Step5PreviewProps {
  input: CurveStudioConfigInput;
  onNext: () => void;
  onBack: () => void;
  onOpenWalletModal: () => void;
}

export const Step5Preview: React.FC<Step5PreviewProps> = ({
  input,
  onNext,
  onBack,
  onOpenWalletModal,
}) => {
  const { network, rpcConfig } = useNetwork();
  const { connected, publicKeyStr, balanceSol } = useWallet();

  const curveTokenSupply = (input.totalSupply * input.curveAllocationPct) / 100;
  const impliedMarketCapAtMigration = input.migrationPriceQuote * input.totalSupply;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-zinc-800/80 pb-4">
        <h2 className="text-xl font-bold text-white tracking-tight">Step 5 — Complete Market Configuration Preview</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Review the full operational and smart contract parameters before preparing the on-chain deployment transaction.
        </p>
      </div>

      {/* Wallet / Network Readiness Bar */}
      <div className="bg-[#0c101a] border border-zinc-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-zinc-400">Deployment Target Cluster</div>
            <div className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Solana {network.toUpperCase()}</span>
              <span className="text-xs text-zinc-400 font-normal">({rpcConfig.name})</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {connected && publicKeyStr ? (
            <div className="text-right">
              <div className="text-xs text-zinc-400">Connected Authority & Fee Payer</div>
              <div className="text-xs font-mono text-zinc-200 flex items-center gap-2 justify-end">
                <AddressBadge address={publicKeyStr} head={4} tail={4} />
                <span className="text-zinc-400 font-mono-nums">
                  ({balanceSol !== null ? `${balanceSol.toFixed(3)} SOL` : 'Loading...'})
                </span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenWalletModal}
              className="py-2 px-4 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-medium cursor-pointer"
            >
              Connect Wallet for Deployment
            </button>
          )}
        </div>
      </div>

      {/* Structured Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Asset Information */}
        <div className="bg-[#0c101a] border border-zinc-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-zinc-800/80 pb-2.5">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>Asset Specifications</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-zinc-800/50">
              <span className="text-zinc-400">Asset Name</span>
              <span className="font-semibold text-zinc-100">{input.assetName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-800/50">
              <span className="text-zinc-400">Ticker Symbol</span>
              <span className="font-mono font-bold text-amber-400">{input.ticker}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-800/50">
              <span className="text-zinc-400">Asset Category</span>
              <span className="font-medium text-zinc-200">{input.assetCategory}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-800/50">
              <span className="text-zinc-400">Underlying SPL Token Mint</span>
              <AddressBadge address={input.baseMint} head={6} tail={6} />
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-800/50">
              <span className="text-zinc-400">Token Decimals</span>
              <span className="font-mono text-zinc-200">{input.tokenDecimals}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-800/50">
              <span className="text-zinc-400">Total Authorized Supply</span>
              <span className="font-mono text-zinc-200">{formatNumber(input.totalSupply)} {input.ticker}</span>
            </div>
            {input.referencePrice && (
              <div className="flex justify-between py-1 border-b border-zinc-800/50">
                <span className="text-zinc-400">Audited Reference Price (NAV)</span>
                <span className="font-mono font-bold text-emerald-400">${input.referencePrice}</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Quote Asset & Network */}
        <div className="bg-[#0c101a] border border-zinc-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-zinc-800/80 pb-2.5">
            <Server className="w-4 h-4 text-blue-400" />
            <span>Quote Token & Program Infrastructure</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-zinc-800/50">
              <span className="text-zinc-400">Quote Asset Pair</span>
              <span className="font-bold text-zinc-100">{input.quoteSymbol}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-800/50">
              <span className="text-zinc-400">Quote Token Mint</span>
              <AddressBadge address={input.quoteMint} head={6} tail={6} />
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-800/50">
              <span className="text-zinc-400">Meteora DBC Program ID</span>
              <AddressBadge address={METEORA_DBC_PROGRAM_ID} head={6} tail={6} />
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-800/50">
              <span className="text-zinc-400">Solana Network</span>
              <span className="font-mono uppercase text-zinc-200">{network}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-800/50">
              <span className="text-zinc-400">RPC Endpoint URL</span>
              <span className="font-mono text-zinc-400 text-[11px] truncate max-w-[200px]">
                {rpcConfig.endpoint}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-800/50">
              <span className="text-zinc-400">Selected Profile Preset</span>
              <span className="font-semibold text-amber-400 uppercase tracking-wide text-[11px]">
                {input.profileKey}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Curve Configuration & Economics */}
        <div className="bg-[#0c101a] border border-zinc-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-zinc-800/80 pb-2.5">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>Curve Mathematics & Valuation</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-zinc-800/50">
              <span className="text-zinc-400">Starting Genesis Price</span>
              <span className="font-mono font-bold text-amber-400">
                {formatCurrency(input.startingPriceQuote, input.quoteSymbol)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-800/50">
              <span className="text-zinc-400">Graduation Spot Price</span>
              <span className="font-mono font-bold text-amber-400">
                {formatCurrency(input.migrationPriceQuote, input.quoteSymbol)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-800/50">
              <span className="text-zinc-400">Curve Supply Allocation</span>
              <span className="font-mono text-zinc-100">
                {input.curveAllocationPct}% ({formatNumber(curveTokenSupply)} {input.ticker})
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-800/50">
              <span className="text-zinc-400">Implied Valuation at Graduation</span>
              <span className="font-mono font-bold text-zinc-100">
                {formatCurrency(impliedMarketCapAtMigration, input.quoteSymbol)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-800/50">
              <span className="text-zinc-400">Graduation Reserve Threshold</span>
              <span className="font-mono font-bold text-emerald-400">
                {formatCurrency(input.migrationQuoteThreshold, input.quoteSymbol)}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Fee Structure & Migration Destination */}
        <div className="bg-[#0c101a] border border-zinc-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-zinc-800/80 pb-2.5">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Fees & DAMM v2 Migration Settings</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-zinc-800/50">
              <span className="text-zinc-400">Base Fee Mode</span>
              <span className="font-mono text-zinc-200">{input.baseFeeMode}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-800/50">
              <span className="text-zinc-400">Trading Fee Range</span>
              <span className="font-mono text-zinc-100 font-semibold">
                {input.startingFeeBps} bps → {input.endingFeeBps} bps
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-800/50">
              <span className="text-zinc-400">Fee Decay Window</span>
              <span className="text-zinc-200">{input.feeDecaySeconds / 3600} Hours</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-800/50">
              <span className="text-zinc-400">Creator Fee Share</span>
              <span className="font-mono font-bold text-amber-400">{input.creatorTradingFeePercentage}%</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-800/50">
              <span className="text-zinc-400">Dynamic Volatility Fee</span>
              <span className="text-zinc-200">{input.dynamicFeeEnabled ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-800/50">
              <span className="text-zinc-400">Graduation Destination</span>
              <span className="font-semibold text-blue-400">MET_DAMM_V2 (Meteora Dynamic AMM v2)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-800/50">
              <span className="text-zinc-400">Post-Graduation LP Lock</span>
              <span className="font-semibold text-emerald-400">
                {input.creatorPermanentLockedLpPct}% Permanently Locked
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Expected Transaction Requirements (Detailed Breakdown) */}
      <div className="bg-[#0c101a] border border-zinc-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-zinc-800/80 pb-3">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Expected Transaction & Blockchain Requirements</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 font-mono-nums text-xs">
          <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/80">
            <span className="text-[10px] font-sans text-zinc-400 uppercase block font-medium">
              Instructions
            </span>
            <span className="text-zinc-100 font-bold text-sm">2 (createConfig + createPool)</span>
          </div>

          <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/80">
            <span className="text-[10px] font-sans text-zinc-400 uppercase block font-medium">
              Estimated Rent Exemption
            </span>
            <span className="text-amber-400 font-bold text-sm">~0.065 SOL</span>
            <span className="text-[10px] text-zinc-400 block font-sans">Config + Pool PDAs</span>
          </div>

          <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/80">
            <span className="text-[10px] font-sans text-zinc-400 uppercase block font-medium">
              Network Transaction Fee
            </span>
            <span className="text-zinc-100 font-bold text-sm">~0.000005 SOL</span>
            <span className="text-[10px] text-zinc-400 block font-sans">Standard 5,000 lamports</span>
          </div>

          <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/80">
            <span className="text-[10px] font-sans text-zinc-400 uppercase block font-medium">
              Required Signers
            </span>
            <span className="text-zinc-100 font-bold text-sm">2 Signers</span>
            <span className="text-[10px] text-zinc-400 block font-sans">Wallet + Config Keypair</span>
          </div>
        </div>

        <div className="bg-blue-950/20 border border-blue-900/40 rounded-lg p-3 text-xs text-blue-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Token Vault Deposit:</strong> Upon initialization, the Meteora DBC contract establishes a dedicated token vault PDA for <code>{input.ticker}</code>. The issuer wallet must authorize and deposit the curve allocation of tokens ({formatNumber(curveTokenSupply)} {input.ticker}) into the vault.
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
        <button
          type="button"
          onClick={onBack}
          className="py-2.5 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs transition-colors flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Visualization</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="py-2.5 px-6 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm transition-colors cursor-pointer flex items-center gap-2 shadow-xs shadow-amber-500/20"
        >
          <span>Proceed to On-Chain Creation</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
