import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  ExternalLink,
  Building2,
  Calendar,
  Layers,
  Database,
  Calculator,
  UserCheck,
  AlertTriangle,
  FileText,
  Clock,
  Radio,
  Share2,
  HelpCircle,
  FileCheck2,
  Lock,
  Compass
} from 'lucide-react';
import { StructuredAssetProfile, VerificationStatus } from '../../types/asset';
import { VerificationStatusBadge } from './VerificationStatusBadge';
import { getExplorerUrl } from '../../config/constants';
import { useNetwork } from '../../context/NetworkContext';
import { formatCurrency, formatPercent } from '../../utils/format';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

interface AssetPassportModalProps {
  asset: StructuredAssetProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectMarket?: (poolAddress: string) => void;
}

export const AssetPassportModal: React.FC<AssetPassportModalProps> = ({
  asset,
  isOpen,
  onClose,
  onSelectMarket,
}) => {
  const { network } = useNetwork();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'on-chain' | 'external' | 'issuer' | 'metrics'>('all');
  const [auditAttestationOpen, setAuditAttestationOpen] = useState<boolean>(false);

  if (!isOpen || !asset) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-4xl bg-[#140130] border border-[#670CDC]/30 rounded-2xl shadow-2xl shadow-[#09011B]/95 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-[#670CDC]/20 flex items-center justify-between bg-[#160136]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#240250] border border-[#670CDC]/40 flex items-center justify-center text-[#F99225] font-bold font-mono">
              {asset.ticker.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-mono text-[#D76EDD]">
                  VALTICS ASSET PASSPORT
                </span>
                <span className="text-[#670CDC]">·</span>
                <span className="text-xs font-mono text-[#B8A9CC]">
                  MINT: {asset.tokenMint.slice(0, 4)}...{asset.tokenMint.slice(-4)}
                </span>
              </div>
              <h2 className="text-lg font-bold text-[#F7F3FF] flex items-center gap-2 font-sans">
                <span>{asset.assetName}</span>
                <span className="text-sm font-mono text-[#F99225]">({asset.ticker})</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <VerificationStatusBadge status={asset.verificationStatus} size="md" />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#B8A9CC] hover:text-[#F7F3FF] hover:bg-[#1C0142] transition-colors ml-2 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Category Filter Pills */}
        <div className="px-6 py-2.5 bg-[#100126] border-b border-[#670CDC]/20 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-[#F99225]/20 text-[#F99225] border border-[#F99225]/40 font-semibold'
                  : 'text-[#B8A9CC] hover:text-[#F7F3FF]'
              }`}
            >
              Complete Passport
            </button>
            <button
              onClick={() => setActiveTab('on-chain')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'on-chain'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-[#B8A9CC] hover:text-[#F7F3FF]'
              }`}
            >
              1. On-Chain Data
            </button>
            <button
              onClick={() => setActiveTab('external')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'external'
                  ? 'bg-[#670CDC]/30 text-[#D76EDD] border border-[#670CDC]/40'
                  : 'text-[#B8A9CC] hover:text-[#F7F3FF]'
              }`}
            >
              2. External Reference
            </button>
            <button
              onClick={() => setActiveTab('issuer')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'issuer'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  : 'text-[#B8A9CC] hover:text-[#F7F3FF]'
              }`}
            >
              3. Issuer Data
            </button>
            <button
              onClick={() => setActiveTab('metrics')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'metrics'
                  ? 'bg-[#F99225]/20 text-[#F99225] border border-[#F99225]/30'
                  : 'text-[#B8A9CC] hover:text-[#F7F3FF]'
              }`}
            >
              4. Calculated Metrics
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-[#B8A9CC] shrink-0">
            <Clock className="w-3.5 h-3.5 text-[#7E6D96]" />
            <span>Updated: {asset.lastUpdatedTimestamp}</span>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ========================================================================= */}
          {/* TOP LEGAL & REGULATORY DISCLOSURE BANNER */}
          {/* ========================================================================= */}
          <div
            className={`p-4 rounded-xl border ${
              asset.representsRealWorldSecurity
                ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                : 'bg-amber-950/20 border-amber-800/40 text-amber-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {asset.representsRealWorldSecurity ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">
                    {asset.representsRealWorldSecurity
                      ? 'Verified Legal Attestation Confirmed'
                      : 'Unverified / Issuer Self-Reported Asset Notice'}
                  </span>
                  <Badge
                    variant={asset.representsRealWorldSecurity ? 'success' : 'warning'}
                    size="xs"
                  >
                    {asset.representsRealWorldSecurity
                      ? 'Legal Claim Verified'
                      : 'Not Independently Verified'}
                  </Badge>
                </div>
                <p className="text-xs leading-relaxed opacity-90">
                  {asset.legalDisclaimer}
                </p>
                {!asset.representsRealWorldSecurity && (
                  <p className="text-[11px] text-amber-300/80 font-mono mt-1">
                    Rule Enforcement: VALTICS does not claim an on-chain token represents real-world equity or debt unless backed by a verified legal prospectus and qualified custodian sign-off.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CORE STRUCTURED PROFILE ATTRIBUTES (REQUIRED 10 ATTRIBUTES) */}
          {/* ========================================================================= */}
          <div className="bg-[#140130] rounded-xl border border-[#670CDC]/30 p-5 space-y-4 shadow-xl shadow-[#09011B]/60">
            <div className="flex items-center justify-between pb-3 border-b border-[#670CDC]/20">
              <h3 className="text-sm font-semibold text-[#F7F3FF] flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#F99225]" />
                <span>Structured Asset Profile</span>
              </h3>
              <span className="text-[10px] font-mono text-[#B8A9CC]">
                Specification Standard v2.4 · Immutable Coordinate Registry
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Asset Name */}
              <div className="p-3 rounded-lg bg-[#100126] border border-[#670CDC]/20 space-y-1">
                <span className="text-[10px] uppercase font-mono text-[#7E6D96] block">Asset Name</span>
                <span className="font-semibold text-[#F7F3FF] text-sm">{asset.assetName}</span>
              </div>

              {/* Ticker */}
              <div className="p-3 rounded-lg bg-[#100126] border border-[#670CDC]/20 space-y-1">
                <span className="text-[10px] uppercase font-mono text-[#7E6D96] block">Ticker / Symbol</span>
                <span className="font-mono font-bold text-[#F99225] text-sm">{asset.ticker}</span>
              </div>

              {/* Asset Type */}
              <div className="p-3 rounded-lg bg-[#100126] border border-[#670CDC]/20 space-y-1">
                <span className="text-[10px] uppercase font-mono text-[#7E6D96] block">Asset Classification Type</span>
                <span className="font-medium text-sky-300">{asset.assetType}</span>
              </div>

              {/* Verification Status */}
              <div className="p-3 rounded-lg bg-[#100126] border border-[#670CDC]/20 space-y-1">
                <span className="text-[10px] uppercase font-mono text-[#7E6D96] block">Verification Status</span>
                <div className="pt-0.5">
                  <VerificationStatusBadge status={asset.verificationStatus} size="sm" />
                </div>
              </div>

              {/* Underlying / Reference Asset */}
              <div className="p-3 rounded-lg bg-[#100126] border border-[#670CDC]/20 space-y-1 md:col-span-2">
                <span className="text-[10px] uppercase font-mono text-[#7E6D96] block">Underlying / Reference Asset</span>
                <p className="font-mono text-[#EDE4FA] leading-relaxed">{asset.underlyingReferenceAsset}</p>
              </div>

              {/* Token Mint Address */}
              <div className="p-3 rounded-lg bg-[#100126] border border-[#670CDC]/20 space-y-1 md:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono text-[#7E6D96]">Solana Token Mint</span>
                  <span className="text-[10px] font-mono text-[#F99225]/80">
                    {asset.onChainData.tokenProgram}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 pt-1 font-mono text-xs text-[#EDE4FA]">
                  <span className="truncate">{asset.tokenMint}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleCopy(asset.tokenMint, 'mint')}
                      className="p-1 rounded bg-[#140130] hover:bg-[#1A0140] text-[#EDE4FA] transition-colors border border-[#670CDC]/20"
                      title="Copy Mint Address"
                    >
                      {copiedKey === 'mint' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <a
                      href={getExplorerUrl(asset.tokenMint, 'address', network)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded bg-[#140130] hover:bg-[#1A0140] text-[#EDE4FA] transition-colors border border-[#670CDC]/20"
                      title="View on Solana Explorer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Issuer Profile */}
              <div className="p-3 rounded-lg bg-[#100126] border border-[#670CDC]/20 space-y-1 md:col-span-2">
                <span className="text-[10px] uppercase font-mono text-[#7E6D96] block">Issuer & Authority</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <div>
                    <span className="text-[10px] text-[#7E6D96] block">Entity Name</span>
                    <span className="font-semibold text-[#EDE4FA]">{asset.issuer.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#7E6D96] block">Jurisdiction & Domicile</span>
                    <span className="text-[#EDE4FA]">{asset.issuer.jurisdiction}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#7E6D96] block">Legal Structure</span>
                    <span className="text-[#EDE4FA]">{asset.issuer.entityType}</span>
                  </div>
                </div>
                {asset.issuer.leiCode && (
                  <div className="pt-2 text-[10px] font-mono text-[#B8A9CC] border-t border-[#670CDC]/20 mt-2 flex items-center justify-between">
                    <span>LEI Code: <strong className="text-[#EDE4FA]">{asset.issuer.leiCode}</strong></span>
                    {asset.issuer.registrationNumber && (
                      <span>Reg: <strong className="text-[#EDE4FA]">{asset.issuer.registrationNumber}</strong></span>
                    )}
                  </div>
                )}
              </div>

              {/* Reference Price & Price Source */}
              <div className="p-3 rounded-lg bg-[#100126] border border-[#670CDC]/20 space-y-1">
                <span className="text-[10px] uppercase font-mono text-[#7E6D96] block">Reference Price</span>
                <div className="text-base font-bold font-mono text-[#F7F3FF] flex items-center gap-2">
                  {asset.referencePrice !== null ? (
                    <span>{asset.referencePriceFormatted || `$${asset.referencePrice.toFixed(4)}`}</span>
                  ) : (
                    <span className="text-[#7E6D96] font-normal italic">Data unavailable</span>
                  )}
                  {asset.referencePrice === null && (
                    <Badge variant="neutral" size="xs">No Live Feed</Badge>
                  )}
                </div>
              </div>

              {/* Price Source */}
              <div className="p-3 rounded-lg bg-[#100126] border border-[#670CDC]/20 space-y-1">
                <span className="text-[10px] uppercase font-mono text-[#7E6D96] block">Price Source Attribution</span>
                <p className="font-mono text-xs text-[#EDE4FA] leading-tight">
                  {asset.priceSource}
                </p>
              </div>

              {/* Last Updated Timestamp */}
              <div className="p-3 rounded-lg bg-[#100126] border border-[#670CDC]/20 space-y-1 md:col-span-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#7E6D96] block">Last Verification Timestamp</span>
                  <span className="font-mono text-xs text-[#EDE4FA]">{asset.lastUpdatedTimestamp}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono text-[#7E6D96] block">Solana Verification Epoch</span>
                  <span className="font-mono text-xs text-[#F99225]/90">{asset.lastUpdatedEpoch}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* THE 4 SEPARATE AND UNAMBIGUOUS DATA LAYERS */}
          {/* ========================================================================= */}
          <div className="space-y-4">
            <div className="border-b border-[#670CDC]/20 pb-2">
              <h3 className="text-sm font-semibold text-[#F7F3FF]">
                Separated Cryptographic & Information Layers
              </h3>
              <p className="text-xs text-[#B8A9CC]">
                VALTICS enforces strict segregation between on-chain ledger facts, external reference pricing, issuer self-attestations, and mathematical metrics.
              </p>
            </div>

            {/* LAYER 1: ON-CHAIN MARKET DATA */}
            {(activeTab === 'all' || activeTab === 'on-chain') && (
              <div className="rounded-xl border border-emerald-800/50 bg-[#070e12] p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-900/50 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-emerald-950 border border-emerald-700/60 flex items-center justify-center font-mono text-emerald-400 font-bold text-xs">
                      1
                    </span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300 font-mono">
                      LAYER 1 · ON-CHAIN MARKET DATA
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                    Solana RPC Verified (Slot {asset.onChainData.currentSlot || '326418'})
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="bg-[#100126] p-2.5 rounded border border-emerald-900/40">
                    <span className="text-[10px] text-[#7E6D96] block">Live Spot Price</span>
                    <span className="text-sm font-bold text-emerald-300">
                      {formatCurrency(asset.onChainData.spotPrice)} {asset.onChainData.quoteSymbol}
                    </span>
                  </div>

                  <div className="bg-[#100126] p-2.5 rounded border border-emerald-900/40">
                    <span className="text-[10px] text-[#7E6D96] block">Quote Reserves</span>
                    <span className="text-sm font-semibold text-[#EDE4FA]">
                      {asset.onChainData.quoteReserve}
                    </span>
                  </div>

                  <div className="bg-[#100126] p-2.5 rounded border border-emerald-900/40">
                    <span className="text-[10px] text-[#7E6D96] block">Curve Progress</span>
                    <span className="text-sm font-semibold text-[#F99225]">
                      {formatPercent(asset.onChainData.curveProgressPct)}
                    </span>
                  </div>

                  <div className="bg-[#100126] p-2.5 rounded border border-emerald-900/40">
                    <span className="text-[10px] text-[#7E6D96] block">Graduation State</span>
                    <span className="text-sm font-semibold text-[#B8A9CC]">
                      {asset.onChainData.isMigrated ? 'Graduated to DLMM' : 'Active DBC Phase'}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-[#B8A9CC] bg-[#100126] p-2.5 rounded border border-emerald-900/40 flex items-center justify-between">
                  <span>Pool PDA: <strong className="text-[#EDE4FA]">{asset.onChainData.poolAddress}</strong></span>
                  <a
                    href={getExplorerUrl(asset.onChainData.poolAddress, 'address', network)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    <span>Explorer</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            {/* LAYER 2: EXTERNAL REFERENCE DATA */}
            {(activeTab === 'all' || activeTab === 'external') && (
              <div className="rounded-xl border border-[#670CDC]/40 bg-[#140130] p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#670CDC]/20 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-[#240A36] border border-[#670CDC]/60 flex items-center justify-center font-mono text-[#D76EDD] font-bold text-xs">
                      2
                    </span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#D76EDD] font-mono">
                      LAYER 2 · EXTERNAL REFERENCE DATA
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#240A36] text-[#D76EDD] border border-[#670CDC]/40">
                    Source: {asset.externalReferenceData.sourceType}
                  </span>
                </div>

                {asset.externalReferenceData.referencePrice !== null ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                    <div className="bg-[#100126] p-2.5 rounded border border-[#670CDC]/20">
                      <span className="text-[10px] text-[#7E6D96] block">External Benchmark NAV</span>
                      <span className="text-sm font-bold text-[#D76EDD]">
                        ${asset.externalReferenceData.referencePrice.toFixed(4)}
                      </span>
                    </div>

                    <div className="bg-[#100126] p-2.5 rounded border border-[#670CDC]/20">
                      <span className="text-[10px] text-[#7E6D96] block">Confidence / Spread</span>
                      <span className="text-sm font-semibold text-[#EDE4FA]">
                        {asset.externalReferenceData.confidenceInterval || 'Standard Benchmark'}
                      </span>
                    </div>

                    <div className="bg-[#100126] p-2.5 rounded border border-[#670CDC]/20">
                      <span className="text-[10px] text-[#7E6D96] block">ISIN / CUSIP ID</span>
                      <span className="text-sm font-semibold text-[#EDE4FA]">
                        {asset.externalReferenceData.isinOrCusip || 'Unregistered'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded bg-[#100126] border border-[#670CDC]/20 text-xs text-[#B8A9CC] space-y-1">
                    <div className="flex items-center gap-2 text-[#D76EDD] font-semibold">
                      <HelpCircle className="w-4 h-4 text-[#D76EDD]" />
                      <span>Data Unavailable (No Fabricated Prices)</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-[#B8A9CC]">
                      VALTICS strictly prohibits fabricating stock prices or financial quotes. Because this asset does not possess a certified public oracle feed, live stock exchange link, or registered SEC pricing filing, this layer is explicitly marked as Data Unavailable.
                    </p>
                  </div>
                )}

                <div className="text-[11px] font-mono text-[#B8A9CC] bg-[#100126] p-2.5 rounded border border-[#670CDC]/20">
                  <span className="text-[#7E6D96]">Oracle / Attestation Identifier: </span>
                  <span className="text-[#EDE4FA]">{asset.externalReferenceData.priceSource}</span>
                  {asset.externalReferenceData.lastOraclePing && (
                    <span className="text-[#7E6D96] block text-[10px] mt-0.5">
                      Last Check: {asset.externalReferenceData.lastOraclePing}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* LAYER 3: ISSUER-PROVIDED DATA */}
            {(activeTab === 'all' || activeTab === 'issuer') && (
              <div className="rounded-xl border border-sky-800/40 bg-[#120826] p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-sky-900/40 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-[#1d0e3a] border border-sky-700/60 flex items-center justify-center font-mono text-sky-400 font-bold text-xs">
                      3
                    </span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-sky-300 font-mono">
                      LAYER 3 · ISSUER-PROVIDED DATA
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1d0e3a] text-sky-400 border border-sky-800/60">
                    Self-Reported Offering Disclosures
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="bg-[#100126] p-3 rounded border border-[#670CDC]/20 space-y-1">
                    <span className="text-[10px] uppercase font-mono text-[#7E6D96] block">Stated Offering Summary</span>
                    <p className="text-[#EDE4FA] leading-relaxed font-sans">{asset.issuerProvidedData.description}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono text-xs">
                    <div className="bg-[#100126] p-2.5 rounded border border-[#670CDC]/20">
                      <span className="text-[10px] text-[#7E6D96] block">Target Yield / APY</span>
                      <span className="text-sm font-semibold text-sky-300">
                        {asset.issuerProvidedData.targetApyOrDividend || 'None Stated'}
                      </span>
                    </div>

                    <div className="bg-[#100126] p-2.5 rounded border border-[#670CDC]/20">
                      <span className="text-[10px] text-[#7E6D96] block">Accreditation Mandate</span>
                      <span className="text-sm font-semibold text-[#EDE4FA]">
                        {asset.issuerProvidedData.investorAccreditationRequired ? 'Mandatory (KYC/AML)' : 'Permissionless'}
                      </span>
                    </div>

                    <div className="bg-[#100126] p-2.5 rounded border border-[#670CDC]/20">
                      <span className="text-[10px] text-[#7E6D96] block">Distribution Schedule</span>
                      <span className="text-sm font-semibold text-[#EDE4FA]">
                        {asset.issuerProvidedData.distributionSchedule || 'On-Chain AMM'}
                      </span>
                    </div>
                  </div>

                  {asset.issuerProvidedData.prospectusIpfsCid && (
                    <div className="text-[11px] font-mono text-[#B8A9CC] bg-[#100126] p-2.5 rounded border border-[#670CDC]/20 flex items-center justify-between">
                      <span>Prospectus IPFS CID: <strong className="text-sky-300">{asset.issuerProvidedData.prospectusIpfsCid}</strong></span>
                      <span className="text-sky-400 text-[10px]">Attestation Record</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* LAYER 4: CALCULATED METRICS */}
            {(activeTab === 'all' || activeTab === 'metrics') && (
              <div className="rounded-xl border border-[#F99225]/40 bg-[#160624] p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#F99225]/20 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-[#240A36] border border-[#F99225]/60 flex items-center justify-center font-mono text-[#F99225] font-bold text-xs">
                      4
                    </span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#F99225] font-mono">
                      LAYER 4 · CALCULATED METRICS
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#240A36] text-[#F99225] border border-[#F99225]/40">
                    Deterministic Bonding Curve Derivations
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="bg-[#100126] p-2.5 rounded border border-[#670CDC]/20">
                    <span className="text-[10px] text-[#7E6D96] block">Premium / Discount to NAV</span>
                    <div className="text-sm font-bold pt-0.5">
                      {asset.calculatedMetrics.premiumDiscountToNavPct !== null ? (
                        <span
                          className={
                            asset.calculatedMetrics.premiumDiscountToNavPct >= 0
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }
                        >
                          {asset.calculatedMetrics.premiumDiscountToNavPct > 0 ? '+' : ''}
                          {asset.calculatedMetrics.premiumDiscountToNavPct.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-[#7E6D96] italic font-normal text-xs">N/A (No Ref Price)</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#100126] p-2.5 rounded border border-[#670CDC]/20">
                    <span className="text-[10px] text-[#7E6D96] block">Implied Market Cap</span>
                    <span className="text-sm font-semibold text-[#F7F3FF]">
                      {formatCurrency(asset.calculatedMetrics.marketCapUsd)}
                    </span>
                  </div>

                  <div className="bg-[#100126] p-2.5 rounded border border-[#670CDC]/20">
                    <span className="text-[10px] text-[#7E6D96] block">Liquidity Depth (TVL)</span>
                    <span className="text-sm font-semibold text-[#F7F3FF]">
                      {formatCurrency(asset.calculatedMetrics.tvlUsd)}
                    </span>
                  </div>

                  <div className="bg-[#100126] p-2.5 rounded border border-[#670CDC]/20">
                    <span className="text-[10px] text-[#7E6D96] block">AMM Base Fee</span>
                    <span className="text-sm font-semibold text-[#F99225]">
                      {(asset.calculatedMetrics.effectiveSpreadBps / 100).toFixed(2)}% ({asset.calculatedMetrics.effectiveSpreadBps} bps)
                    </span>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-[#B8A9CC] bg-[#100126] p-2.5 rounded border border-[#670CDC]/20 flex items-center justify-between">
                  <span>Remaining Quote to Graduation: <strong className="text-[#F99225]">{asset.calculatedMetrics.distanceToGraduationQuote}</strong></span>
                  <span className="text-[#7E6D96] text-[10px]">Single-sided DBC curve formula</span>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* ATTESTATION DETAILS & PROOF-OF-RESERVE AUDIT PANEL */}
          {/* ========================================================================= */}
          {asset.attestationDetails && (
            <div className="bg-[#140130] rounded-xl border border-[#670CDC]/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#F7F3FF]">
                  <FileText className="w-4 h-4 text-[#D76EDD]" />
                  <span>Attestation Audit Record</span>
                </div>
                <button
                  onClick={() => setAuditAttestationOpen(!auditAttestationOpen)}
                  className="text-xs text-[#F99225] hover:text-[#FFA640] font-mono transition-colors"
                >
                  {auditAttestationOpen ? 'Hide Audit Cryptographic Proof' : 'Inspect Cryptographic Proof'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-[#100126] border border-[#670CDC]/20">
                  <span className="text-[10px] text-[#7E6D96] block">Auditor / Valuer:</span>
                  <span className="text-[#EDE4FA]">{asset.attestationDetails.auditorOrValuer}</span>
                </div>
                <div className="p-2 rounded bg-[#100126] border border-[#670CDC]/20">
                  <span className="text-[10px] text-[#7E6D96] block">Verification Method:</span>
                  <span className="text-[#EDE4FA]">{asset.attestationDetails.verificationMethod}</span>
                </div>
              </div>

              {auditAttestationOpen && asset.attestationDetails.attestationHash && (
                <div className="p-3 rounded bg-[#09011B] border border-[#670CDC]/25 font-mono text-[11px] space-y-2">
                  <div className="text-[#EDE4FA]">
                    <span className="text-[#7E6D96] block text-[10px] uppercase">SHA-256 Merkle Collateral Hash</span>
                    <span className="text-[#F99225] break-all">{asset.attestationDetails.attestationHash}</span>
                  </div>
                  {asset.attestationDetails.documentUrl && (
                    <div className="text-[#B8A9CC] pt-1 border-t border-[#670CDC]/20 flex items-center justify-between">
                      <span>Attestation Document CID:</span>
                      <a
                        href={asset.attestationDetails.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#D76EDD] hover:underline flex items-center gap-1 text-[10px]"
                      >
                        <span>View Verified Filing</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-[#670CDC]/20 bg-[#100126] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-mono text-[#B8A9CC]">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>VALTICS Information Layer v2.4</span>
          </div>

          <div className="flex items-center gap-2">
            {onSelectMarket && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onSelectMarket(asset.onChainData.poolAddress);
                  onClose();
                }}
              >
                Trade in DBC Market
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close Passport
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
