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
      <div className="border-b border-[#670CDC]/20 pb-4">
        <h2 className="text-xl font-bold text-[#F7F3FF] tracking-tight">Step 5 — Complete Market Configuration Preview</h2>
        <p className="text-xs text-[#B8A9CC] mt-1">
          Review the full operational and smart contract parameters before preparing the on-chain deployment transaction.
        </p>
      </div>

      {/* Wallet / Network Readiness Bar */}
      <div className="bg-[#140130] border border-[#670CDC]/25 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xl shadow-[#09011B]/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#670CDC]/20 border border-[#670CDC]/40 flex items-center justify-center text-[#EDE4FA]">
            <Server className="w-5 h-5 text-[#F99225]" />
          </div>
          <div>
            <div className="text-xs text-[#B8A9CC]">Deployment Target Cluster</div>
            <div className="text-sm font-bold text-[#F7F3FF] font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Solana {network.toUpperCase()}</span>
              <span className="text-xs text-[#B8A9CC] font-normal">({rpcConfig.name})</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {connected && publicKeyStr ? (
            <div className="text-right">
              <div className="text-xs text-[#B8A9CC]">Connected Authority & Fee Payer</div>
              <div className="text-xs font-mono text-[#EDE4FA] flex items-center gap-2 justify-end">
                <AddressBadge address={publicKeyStr} head={4} tail={4} />
                <span className="text-[#B8A9CC] font-mono-nums">
                  ({balanceSol !== null ? `${balanceSol.toFixed(3)} SOL` : 'Loading...'})
                </span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenWalletModal}
              className="py-2 px-4 rounded-lg bg-[#F99225]/20 hover:bg-[#F99225]/30 text-[#F99225] border border-[#F99225]/40 text-xs font-medium cursor-pointer"
            >
              Connect Wallet for Deployment
            </button>
          )}
        </div>
      </div>

      {/* Structured Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Asset Information */}
        <div className="bg-[#140130] border border-[#670CDC]/25 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F7F3FF] border-b border-[#670CDC]/20 pb-2.5">
            <Coins className="w-4 h-4 text-[#F99225]" />
            <span>Asset Specifications</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-[#670CDC]/15">
              <span className="text-[#B8A9CC]">Asset Name</span>
              <span className="font-semibold text-[#F7F3FF]">{input.assetName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#670CDC]/15">
              <span className="text-[#B8A9CC]">Ticker Symbol</span>
              <span className="font-mono font-bold text-[#F99225]">{input.ticker}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#670CDC]/15">
              <span className="text-[#B8A9CC]">Asset Category</span>
              <span className="font-medium text-[#EDE4FA]">{input.assetCategory}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#670CDC]/15">
              <span className="text-[#B8A9CC]">Underlying SPL Token Mint</span>
              <AddressBadge address={input.baseMint} head={6} tail={6} />
            </div>
            <div className="flex justify-between py-1 border-b border-[#670CDC]/15">
              <span className="text-[#B8A9CC]">Token Decimals</span>
              <span className="font-mono text-[#EDE4FA]">{input.tokenDecimals}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#670CDC]/15">
              <span className="text-[#B8A9CC]">Total Authorized Supply</span>
              <span className="font-mono text-[#EDE4FA]">{formatNumber(input.totalSupply)} {input.ticker}</span>
            </div>
            {input.referencePrice && (
              <div className="flex justify-between py-1 border-b border-[#670CDC]/15">
                <span className="text-[#B8A9CC]">Audited Reference Price (NAV)</span>
                <span className="font-mono font-bold text-emerald-400">${input.referencePrice}</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Quote Asset & Network */}
        <div className="bg-[#140130] border border-[#670CDC]/25 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F7F3FF] border-b border-[#670CDC]/20 pb-2.5">
            <Server className="w-4 h-4 text-[#8023EC]" />
            <span>Quote Token & Program Infrastructure</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-[#670CDC]/15">
              <span className="text-[#B8A9CC]">Quote Asset Pair</span>
              <span className="font-bold text-[#F7F3FF]">{input.quoteSymbol}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#670CDC]/15">
              <span className="text-[#B8A9CC]">Quote Token Mint</span>
              <AddressBadge address={input.quoteMint} head={6} tail={6} />
            </div>
            <div className="flex justify-between py-1 border-b border-[#670CDC]/15">
              <span className="text-[#B8A9CC]">Meteora DBC Program ID</span>
              <AddressBadge address={METEORA_DBC_PROGRAM_ID} head={6} tail={6} />
            </div>
            <div className="flex justify-between py-1 border-b border-[#670CDC]/15">
              <span className="text-[#B8A9CC]">Solana Network</span>
              <span className="font-mono uppercase text-[#EDE4FA]">{network}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#670CDC]/15">
              <span className="text-[#B8A9CC]">RPC Endpoint URL</span>
              <span className="font-mono text-[#B8A9CC] text-[11px] truncate max-w-[200px]">
                {rpcConfig.endpoint}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#670CDC]/15">
              <span className="text-[#B8A9CC]">Selected Profile Preset</span>
              <span className="font-semibold text-[#F99225] uppercase tracking-wide text-[11px]">
                {input.profileKey}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Curve Configuration & Economics */}
        <div className="bg-[#140130] border border-[#670CDC]/25 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F7F3FF] border-b border-[#670CDC]/20 pb-2.5">
            <Sliders className="w-4 h-4 text-[#F99225]" />
            <span>Curve Mathematics & Valuation</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-[#670CDC]/15">
              <span className="text-[#B8A9CC]">Starting Genesis Price</span>
              <span className="font-mono font-bold text-[#F99225]">
                {formatCurrency(input.startingPriceQuote, input.quoteSymbol)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#670CDC]/15">
              <span className="text-[#B8A9CC]">Graduation Spot Price</span>
              <span className="font-mono font-bold text-[#F99225]">
                {formatCurrency(input.migrationPriceQuote, input.quoteSymbol)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#670CDC]/15">
              <span className="text-[#B8A9CC]">Curve Supply Allocation</span>
              <span className="font-mono text-[#F7F3FF]">
                {input.curveAllocationPct}% ({formatNumber(curveTokenSupply)} {input.ticker})
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#670CDC]/15">
              <span className="text-[#B8A9CC]">Implied Valuation at Graduation</span>
              <span className="font-mono font-bold text-[#F7F3FF]">
                {formatCurrency(impliedMarketCapAtMigration, input.quoteSymbol)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#670CDC]/15">
              <span className="text-[#B8A9CC]">Graduation Reserve Threshold</span>
              <span className="font-mono font-bold text-emerald-400">
                {formatCurrency(input.migrationQuoteThreshold, input.quoteSymbol)}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Fee Structure & Migration Destination */}
        <div className="bg-[#140130] border border-[#670CDC]/25 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F7F3FF] border-b border-[#670CDC]/20 pb-2.5">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Fees & DAMM v2 Migration Settings</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-[#670CDC]/15">
              <span className="text-[#B8A9CC]">Base Fee Mode</span>
              <span className="font-mono text-[#EDE4FA]">{input.baseFeeMode}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#670CDC]/15">
              <span className="text-[#B8A9CC]">Trading Fee Range</span>
              <span className="font-mono text-[#F7F3FF] font-semibold">
                {input.startingFeeBps} bps → {input.endingFeeBps} bps
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#670CDC]/15">
              <span className="text-[#B8A9CC]">Fee Decay Window</span>
              <span className="text-[#EDE4FA]">{input.feeDecaySeconds / 3600} Hours</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#670CDC]/15">
              <span className="text-[#B8A9CC]">Creator Fee Share</span>
              <span className="font-mono font-bold text-[#F99225]">{input.creatorTradingFeePercentage}%</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#670CDC]/15">
              <span className="text-[#B8A9CC]">Dynamic Volatility Fee</span>
              <span className="text-[#EDE4FA]">{input.dynamicFeeEnabled ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#670CDC]/15">
              <span className="text-[#B8A9CC]">Graduation Destination</span>
              <span className="font-semibold text-[#8023EC]">MET_DAMM_V2 (Meteora Dynamic AMM v2)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#670CDC]/15">
              <span className="text-[#B8A9CC]">Post-Graduation LP Lock</span>
              <span className="font-semibold text-emerald-400">
                {input.creatorPermanentLockedLpPct}% Permanently Locked
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Expected Transaction Requirements (Detailed Breakdown) */}
      <div className="bg-[#140130] border border-[#670CDC]/25 rounded-xl p-5 space-y-4 shadow-xl shadow-[#09011B]/60">
        <div className="flex items-center gap-2 text-sm font-bold text-[#F7F3FF] border-b border-[#670CDC]/20 pb-3">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Expected Transaction & Blockchain Requirements</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 font-mono-nums text-xs">
          <div className="bg-[#100126] p-3 rounded-lg border border-[#670CDC]/20">
            <span className="text-[10px] font-sans text-[#7E6D96] uppercase block font-medium">
              Instructions
            </span>
            <span className="text-[#F7F3FF] font-bold text-sm">2 (createConfig + createPool)</span>
          </div>

          <div className="bg-[#100126] p-3 rounded-lg border border-[#670CDC]/20">
            <span className="text-[10px] font-sans text-[#7E6D96] uppercase block font-medium">
              Estimated Rent Exemption
            </span>
            <span className="text-[#F99225] font-bold text-sm">~0.065 SOL</span>
            <span className="text-[10px] text-[#B8A9CC] block font-sans">Config + Pool PDAs</span>
          </div>

          <div className="bg-[#100126] p-3 rounded-lg border border-[#670CDC]/20">
            <span className="text-[10px] font-sans text-[#7E6D96] uppercase block font-medium">
              Network Transaction Fee
            </span>
            <span className="text-[#F7F3FF] font-bold text-sm">~0.000005 SOL</span>
            <span className="text-[10px] text-[#B8A9CC] block font-sans">Standard 5,000 lamports</span>
          </div>

          <div className="bg-[#100126] p-3 rounded-lg border border-[#670CDC]/20">
            <span className="text-[10px] font-sans text-[#7E6D96] uppercase block font-medium">
              Required Signers
            </span>
            <span className="text-[#F7F3FF] font-bold text-sm">2 Signers</span>
            <span className="text-[10px] text-[#B8A9CC] block font-sans">Wallet + Config Keypair</span>
          </div>
        </div>

        <div className="bg-[#1E0148]/60 border border-[#670CDC]/30 rounded-lg p-3 text-xs text-[#EDE4FA] flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#8023EC] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Token Vault Deposit:</strong> Upon initialization, the Meteora DBC contract establishes a dedicated token vault PDA for <code>{input.ticker}</code>. The issuer wallet must authorize and deposit the curve allocation of tokens ({formatNumber(curveTokenSupply)} {input.ticker}) into the vault.
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-[#670CDC]/20">
        <button
          type="button"
          onClick={onBack}
          className="py-2.5 px-4 rounded-lg bg-[#1C0142] hover:bg-[#26035A] text-[#EDE4FA] font-medium text-xs transition-colors flex items-center gap-2 cursor-pointer border border-[#670CDC]/30"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="py-2.5 px-6 rounded-lg bg-[#F99225] hover:bg-[#FFA33D] text-[#09011B] font-bold text-sm transition-colors cursor-pointer flex items-center gap-2 shadow-md shadow-[#F99225]/20"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
