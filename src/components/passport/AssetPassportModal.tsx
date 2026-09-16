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
      <div className="relative z-10 w-full max-w-4xl bg-[#080c14] border border-zinc-800 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-[#0b101c]/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-sky-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold font-mono">
              {asset.ticker.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-mono text-zinc-400">
                  VALTICS ASSET PASSPORT
                </span>
                <span className="text-zinc-600">·</span>
                <span className="text-xs font-mono text-zinc-500">
                  MINT: {asset.tokenMint.slice(0, 4)}...{asset.tokenMint.slice(-4)}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2 font-sans">
                <span>{asset.assetName}</span>
                <span className="text-sm font-mono text-amber-400">({asset.ticker})</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <VerificationStatusBadge status={asset.verificationStatus} size="md" />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Category Filter Pills */}
        <div className="px-6 py-2.5 bg-[#090d16] border-b border-zinc-800/60 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Complete Passport
            </button>
            <button
              onClick={() => setActiveTab('on-chain')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'on-chain'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              1. On-Chain Data
            </button>
            <button
              onClick={() => setActiveTab('external')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'external'
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              2. External Reference
            </button>
            <button
              onClick={() => setActiveTab('issuer')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'issuer'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              3. Issuer Data
            </button>
            <button
              onClick={() => setActiveTab('metrics')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'metrics'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              4. Calculated Metrics
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400 shrink-0">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
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
          <div className="bg-[#0b101c] rounded-xl border border-zinc-800/80 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-amber-400" />
                <span>Structured Asset Profile</span>
              </h3>
              <span className="text-[10px] font-mono text-zinc-400">
                Specification Standard v2.4 · Immutable Coordinate Registry
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Asset Name */}
              <div className="p-3 rounded-lg bg-[#070a12] border border-zinc-800/60 space-y-1">
                <span className="text-[10px] uppercase font-mono text-zinc-400 block">Asset Name</span>
                <span className="font-semibold text-zinc-100 text-sm">{asset.assetName}</span>
              </div>

              {/* Ticker */}
              <div className="p-3 rounded-lg bg-[#070a12] border border-zinc-800/60 space-y-1">
                <span className="text-[10px] uppercase font-mono text-zinc-400 block">Ticker / Symbol</span>
                <span className="font-mono font-bold text-amber-400 text-sm">{asset.ticker}</span>
              </div>

              {/* Asset Type */}
              <div className="p-3 rounded-lg bg-[#070a12] border border-zinc-800/60 space-y-1">
                <span className="text-[10px] uppercase font-mono text-zinc-400 block">Asset Classification Type</span>
                <span className="font-medium text-sky-300">{asset.assetType}</span>
              </div>

              {/* Verification Status */}
              <div className="p-3 rounded-lg bg-[#070a12] border border-zinc-800/60 space-y-1">
                <span className="text-[10px] uppercase font-mono text-zinc-400 block">Verification Status</span>
                <div className="pt-0.5">
                  <VerificationStatusBadge status={asset.verificationStatus} size="sm" />
                </div>
              </div>

              {/* Underlying / Reference Asset */}
              <div className="p-3 rounded-lg bg-[#070a12] border border-zinc-800/60 space-y-1 md:col-span-2">
                <span className="text-[10px] uppercase font-mono text-zinc-400 block">Underlying / Reference Asset</span>
                <p className="font-mono text-zinc-200 leading-relaxed">{asset.underlyingReferenceAsset}</p>
              </div>

              {/* Token Mint Address */}
              <div className="p-3 rounded-lg bg-[#070a12] border border-zinc-800/60 space-y-1 md:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono text-zinc-400">Solana Token Mint</span>
                  <span className="text-[10px] font-mono text-amber-400/80">
                    {asset.onChainData.tokenProgram}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 pt-1 font-mono text-xs text-zinc-300">
                  <span className="truncate">{asset.tokenMint}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleCopy(asset.tokenMint, 'mint')}
                      className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                      title="Copy Mint Address"
                    >
                      {copiedKey === 'mint' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <a
                      href={getExplorerUrl(asset.tokenMint, 'address', network)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                      title="View on Solana Explorer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Issuer Profile */}
              <div className="p-3 rounded-lg bg-[#070a12] border border-zinc-800/60 space-y-1 md:col-span-2">
                <span className="text-[10px] uppercase font-mono text-zinc-400 block">Issuer & Authority</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Entity Name</span>
                    <span className="font-semibold text-zinc-200">{asset.issuer.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Jurisdiction & Domicile</span>
                    <span className="text-zinc-300">{asset.issuer.jurisdiction}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Legal Structure</span>
                    <span className="text-zinc-300">{asset.issuer.entityType}</span>
                  </div>
                </div>
                {asset.issuer.leiCode && (
                  <div className="pt-2 text-[10px] font-mono text-zinc-400 border-t border-zinc-800/60 mt-2 flex items-center justify-between">
                    <span>LEI Code: <strong className="text-zinc-300">{asset.issuer.leiCode}</strong></span>
                    {asset.issuer.registrationNumber && (
                      <span>Reg: <strong className="text-zinc-300">{asset.issuer.registrationNumber}</strong></span>
                    )}
                  </div>
                )}
              </div>

              {/* Reference Price & Price Source */}
              <div className="p-3 rounded-lg bg-[#070a12] border border-zinc-800/60 space-y-1">
                <span className="text-[10px] uppercase font-mono text-zinc-400 block">Reference Price</span>
                <div className="text-base font-bold font-mono text-white flex items-center gap-2">
                  {asset.referencePrice !== null ? (
                    <span>{asset.referencePriceFormatted || `$${asset.referencePrice.toFixed(4)}`}</span>
                  ) : (
                    <span className="text-zinc-500 font-normal italic">Data unavailable</span>
                  )}
                  {asset.referencePrice === null && (
                    <Badge variant="neutral" size="xs">No Live Feed</Badge>
                  )}
                </div>
              </div>

              {/* Price Source */}
              <div className="p-3 rounded-lg bg-[#070a12] border border-zinc-800/60 space-y-1">
                <span className="text-[10px] uppercase font-mono text-zinc-400 block">Price Source Attribution</span>
                <p className="font-mono text-xs text-zinc-300 leading-tight">
                  {asset.priceSource}
                </p>
              </div>

              {/* Last Updated Timestamp */}
              <div className="p-3 rounded-lg bg-[#070a12] border border-zinc-800/60 space-y-1 md:col-span-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono text-zinc-400 block">Last Verification Timestamp</span>
                  <span className="font-mono text-xs text-zinc-200">{asset.lastUpdatedTimestamp}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono text-zinc-400 block">Solana Verification Epoch</span>
                  <span className="font-mono text-xs text-amber-400/90">{asset.lastUpdatedEpoch}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* THE 4 SEPARATE AND UNAMBIGUOUS DATA LAYERS */}
          {/* ========================================================================= */}
          <div className="space-y-4">
            <div className="border-b border-zinc-800 pb-2">
              <h3 className="text-sm font-semibold text-white">
                Separated Cryptographic & Information Layers
              </h3>
              <p className="text-xs text-zinc-400">
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
                  <div className="bg-[#050b0e] p-2.5 rounded border border-emerald-900/30">
                    <span className="text-[10px] text-zinc-400 block">Live Spot Price</span>
                    <span className="text-sm font-bold text-emerald-300">
                      {formatCurrency(asset.onChainData.spotPrice)} {asset.onChainData.quoteSymbol}
                    </span>
                  </div>

                  <div className="bg-[#050b0e] p-2.5 rounded border border-emerald-900/30">
                    <span className="text-[10px] text-zinc-400 block">Quote Reserves</span>
                    <span className="text-sm font-semibold text-zinc-200">
                      {asset.onChainData.quoteReserve}
                    </span>
                  </div>

                  <div className="bg-[#050b0e] p-2.5 rounded border border-emerald-900/30">
                    <span className="text-[10px] text-zinc-400 block">Curve Progress</span>
                    <span className="text-sm font-semibold text-amber-400">
                      {formatPercent(asset.onChainData.curveProgressPct)}
                    </span>
                  </div>

                  <div className="bg-[#050b0e] p-2.5 rounded border border-emerald-900/30">
                    <span className="text-[10px] text-zinc-400 block">Graduation State</span>
                    <span className="text-sm font-semibold text-zinc-300">
                      {asset.onChainData.isMigrated ? 'Graduated to DLMM' : 'Active DBC Phase'}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-zinc-400 bg-[#050b0e] p-2.5 rounded border border-emerald-900/30 flex items-center justify-between">
                  <span>Pool PDA: <strong className="text-zinc-200">{asset.onChainData.poolAddress}</strong></span>
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
              <div className="rounded-xl border border-violet-800/50 bg-[#0e0918] p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-violet-900/50 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-violet-950 border border-violet-700/60 flex items-center justify-center font-mono text-violet-400 font-bold text-xs">
                      2
                    </span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-violet-300 font-mono">
                      LAYER 2 · EXTERNAL REFERENCE DATA
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-950/80 text-violet-400 border border-violet-800/60">
                    Source: {asset.externalReferenceData.sourceType}
                  </span>
                </div>

                {asset.externalReferenceData.referencePrice !== null ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                    <div className="bg-[#090610] p-2.5 rounded border border-violet-900/30">
                      <span className="text-[10px] text-zinc-400 block">External Benchmark NAV</span>
                      <span className="text-sm font-bold text-violet-300">
                        ${asset.externalReferenceData.referencePrice.toFixed(4)}
                      </span>
                    </div>

                    <div className="bg-[#090610] p-2.5 rounded border border-violet-900/30">
                      <span className="text-[10px] text-zinc-400 block">Confidence / Spread</span>
                      <span className="text-sm font-semibold text-zinc-200">
                        {asset.externalReferenceData.confidenceInterval || 'Standard Benchmark'}
                      </span>
                    </div>

                    <div className="bg-[#090610] p-2.5 rounded border border-violet-900/30">
                      <span className="text-[10px] text-zinc-400 block">ISIN / CUSIP ID</span>
                      <span className="text-sm font-semibold text-zinc-200">
                        {asset.externalReferenceData.isinOrCusip || 'Unregistered'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded bg-[#090610] border border-violet-900/30 text-xs text-zinc-400 space-y-1">
                    <div className="flex items-center gap-2 text-violet-300 font-semibold">
                      <HelpCircle className="w-4 h-4 text-violet-400" />
                      <span>Data Unavailable (No Fabricated Prices)</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-zinc-400">
                      VALTICS strictly prohibits fabricating stock prices or financial quotes. Because this asset does not possess a certified public oracle feed, live stock exchange link, or registered SEC pricing filing, this layer is explicitly marked as Data Unavailable.
                    </p>
                  </div>
                )}

                <div className="text-[11px] font-mono text-zinc-400 bg-[#090610] p-2.5 rounded border border-violet-900/30">
                  <span className="text-zinc-500">Oracle / Attestation Identifier: </span>
                  <span className="text-zinc-300">{asset.externalReferenceData.priceSource}</span>
                  {asset.externalReferenceData.lastOraclePing && (
                    <span className="text-zinc-500 block text-[10px] mt-0.5">
                      Last Check: {asset.externalReferenceData.lastOraclePing}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* LAYER 3: ISSUER-PROVIDED DATA */}
            {(activeTab === 'all' || activeTab === 'issuer') && (
              <div className="rounded-xl border border-sky-800/50 bg-[#080d16] p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-sky-900/50 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-sky-950 border border-sky-700/60 flex items-center justify-center font-mono text-sky-400 font-bold text-xs">
                      3
                    </span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-sky-300 font-mono">
                      LAYER 3 · ISSUER-PROVIDED DATA
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950/80 text-sky-400 border border-sky-800/60">
                    Self-Reported Offering Disclosures
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="bg-[#05080f] p-3 rounded border border-sky-900/30 space-y-1">
                    <span className="text-[10px] uppercase font-mono text-zinc-400 block">Stated Offering Summary</span>
                    <p className="text-zinc-200 leading-relaxed font-sans">{asset.issuerProvidedData.description}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono text-xs">
                    <div className="bg-[#05080f] p-2.5 rounded border border-sky-900/30">
                      <span className="text-[10px] text-zinc-400 block">Target Yield / APY</span>
                      <span className="text-sm font-semibold text-sky-300">
                        {asset.issuerProvidedData.targetApyOrDividend || 'None Stated'}
                      </span>
                    </div>

                    <div className="bg-[#05080f] p-2.5 rounded border border-sky-900/30">
                      <span className="text-[10px] text-zinc-400 block">Accreditation Mandate</span>
                      <span className="text-sm font-semibold text-zinc-200">
                        {asset.issuerProvidedData.investorAccreditationRequired ? 'Mandatory (KYC/AML)' : 'Permissionless'}
                      </span>
                    </div>

                    <div className="bg-[#05080f] p-2.5 rounded border border-sky-900/30">
                      <span className="text-[10px] text-zinc-400 block">Distribution Schedule</span>
                      <span className="text-sm font-semibold text-zinc-200">
                        {asset.issuerProvidedData.distributionSchedule || 'On-Chain AMM'}
                      </span>
                    </div>
                  </div>

                  {asset.issuerProvidedData.prospectusIpfsCid && (
                    <div className="text-[11px] font-mono text-zinc-400 bg-[#05080f] p-2.5 rounded border border-sky-900/30 flex items-center justify-between">
                      <span>Prospectus IPFS CID: <strong className="text-sky-300">{asset.issuerProvidedData.prospectusIpfsCid}</strong></span>
                      <span className="text-sky-400 text-[10px]">Attestation Record</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* LAYER 4: CALCULATED METRICS */}
            {(activeTab === 'all' || activeTab === 'metrics') && (
              <div className="rounded-xl border border-amber-800/50 bg-[#120e06] p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-amber-900/50 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-amber-950 border border-amber-700/60 flex items-center justify-center font-mono text-amber-400 font-bold text-xs">
                      4
                    </span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 font-mono">
                      LAYER 4 · CALCULATED METRICS
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-800/60">
                    Deterministic Bonding Curve Derivations
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="bg-[#0a0703] p-2.5 rounded border border-amber-900/30">
                    <span className="text-[10px] text-zinc-400 block">Premium / Discount to NAV</span>
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
                        <span className="text-zinc-500 italic font-normal text-xs">N/A (No Ref Price)</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#0a0703] p-2.5 rounded border border-amber-900/30">
                    <span className="text-[10px] text-zinc-400 block">Implied Market Cap</span>
                    <span className="text-sm font-semibold text-zinc-100">
                      {formatCurrency(asset.calculatedMetrics.marketCapUsd)}
                    </span>
                  </div>

                  <div className="bg-[#0a0703] p-2.5 rounded border border-amber-900/30">
                    <span className="text-[10px] text-zinc-400 block">Liquidity Depth (TVL)</span>
                    <span className="text-sm font-semibold text-zinc-100">
                      {formatCurrency(asset.calculatedMetrics.tvlUsd)}
                    </span>
                  </div>

                  <div className="bg-[#0a0703] p-2.5 rounded border border-amber-900/30">
                    <span className="text-[10px] text-zinc-400 block">AMM Base Fee</span>
                    <span className="text-sm font-semibold text-amber-300">
                      {(asset.calculatedMetrics.effectiveSpreadBps / 100).toFixed(2)}% ({asset.calculatedMetrics.effectiveSpreadBps} bps)
                    </span>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-zinc-400 bg-[#0a0703] p-2.5 rounded border border-amber-900/30 flex items-center justify-between">
                  <span>Remaining Quote to Graduation: <strong className="text-amber-300">{asset.calculatedMetrics.distanceToGraduationQuote}</strong></span>
                  <span className="text-zinc-500 text-[10px]">Single-sided DBC curve formula</span>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* ATTESTATION DETAILS & PROOF-OF-RESERVE AUDIT PANEL */}
          {/* ========================================================================= */}
          {asset.attestationDetails && (
            <div className="bg-[#0a0e1a] rounded-xl border border-zinc-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                  <FileText className="w-4 h-4 text-violet-400" />
                  <span>Attestation Audit Record</span>
                </div>
                <button
                  onClick={() => setAuditAttestationOpen(!auditAttestationOpen)}
                  className="text-xs text-amber-400 hover:text-amber-300 font-mono transition-colors"
                >
                  {auditAttestationOpen ? 'Hide Audit Cryptographic Proof' : 'Inspect Cryptographic Proof'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block">Auditor / Valuer:</span>
                  <span className="text-zinc-200">{asset.attestationDetails.auditorOrValuer}</span>
                </div>
                <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block">Verification Method:</span>
                  <span className="text-zinc-200">{asset.attestationDetails.verificationMethod}</span>
                </div>
              </div>

              {auditAttestationOpen && asset.attestationDetails.attestationHash && (
                <div className="p-3 rounded bg-black border border-zinc-800 font-mono text-[11px] space-y-2">
                  <div className="text-zinc-400">
                    <span className="text-zinc-500 block text-[10px] uppercase">SHA-256 Merkle Collateral Hash</span>
                    <span className="text-amber-400 break-all">{asset.attestationDetails.attestationHash}</span>
                  </div>
                  {asset.attestationDetails.documentUrl && (
                    <div className="text-zinc-400 pt-1 border-t border-zinc-800/80 flex items-center justify-between">
                      <span>Attestation Document CID:</span>
                      <a
                        href={asset.attestationDetails.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-400 hover:underline flex items-center gap-1 text-[10px]"
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
        <div className="px-6 py-3.5 border-t border-zinc-800/80 bg-[#090d16] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
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
