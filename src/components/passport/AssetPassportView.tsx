import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  ShieldCheck,
  ShieldAlert,
  Layers,
  Filter,
  ExternalLink,
  Info,
  Clock,
  Building2,
  Database,
  Calculator,
  UserCheck,
  AlertTriangle,
  HelpCircle,
  FileCheck2,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  Lock,
  Compass,
  FileText
} from 'lucide-react';
import { StructuredAssetProfile, VerificationStatus, AssetClassificationType } from '../../types/asset';
import { STRUCTURED_ASSET_PROFILES, getAssetProfile, getAllAssetProfiles } from '../../data/assetProfiles';
import { onMarketCreated } from '../../services/marketStorage';
import { VerificationStatusBadge } from './VerificationStatusBadge';
import { AssetPassportModal } from './AssetPassportModal';
import { formatCurrency, formatPercent } from '../../utils/format';
import { getExplorerUrl } from '../../config/constants';
import { useNetwork } from '../../context/NetworkContext';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { NavigationTab } from '../layout/Header';

interface AssetPassportViewProps {
  onSelectTab: (tab: NavigationTab) => void;
  onSelectMarketForTrade?: (poolAddress: string) => void;
  initialSelectedMint?: string | null;
}

export const AssetPassportView: React.FC<AssetPassportViewProps> = ({
  onSelectTab,
  onSelectMarketForTrade,
  initialSelectedMint,
}) => {
  const { network } = useNetwork();
  const [profiles, setProfiles] = useState<StructuredAssetProfile[]>(() => getAllAssetProfiles());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | VerificationStatus>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [activePassportAsset, setActivePassportAsset] = useState<StructuredAssetProfile | null>(() => {
    if (initialSelectedMint) {
      return getAssetProfile(initialSelectedMint) || getAllAssetProfiles()[0];
    }
    return null;
  });
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [verificationSimulatorOpen, setVerificationSimulatorOpen] = useState<boolean>(false);

  // Subscribe to newly created markets in real-time
  useEffect(() => {
    const unsub = onMarketCreated(() => {
      setProfiles(getAllAssetProfiles());
    });
    return unsub;
  }, []);

  // Filter profiles
  const filteredProfiles = useMemo(() => {
    return profiles.filter((asset) => {
      // Status filter
      if (selectedStatus !== 'ALL' && asset.verificationStatus !== selectedStatus) {
        return false;
      }
      // Type filter
      if (selectedType !== 'ALL' && asset.assetType !== selectedType) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          asset.assetName.toLowerCase().includes(q) ||
          asset.ticker.toLowerCase().includes(q) ||
          asset.tokenMint.toLowerCase().includes(q) ||
          asset.issuer.name.toLowerCase().includes(q) ||
          asset.underlyingReferenceAsset.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [profiles, searchQuery, selectedStatus, selectedType]);

  const handleOpenPassport = (asset: StructuredAssetProfile) => {
    setActivePassportAsset(asset);
    setIsModalOpen(true);
  };

  // Verification simulator handler: upgrades an unverified or issuer-provided asset to verified
  const handleSimulateVerification = (assetId: string) => {
    setProfiles((prev) =>
      prev.map((item) => {
        if (item.id === assetId) {
          return {
            ...item,
            verificationStatus: 'Verified' as VerificationStatus,
            representsRealWorldSecurity: true,
            legalDisclaimer: 'Verified under institutional attestation standard. Qualified custodian deposit receipt confirmed by independent auditor.',
            lastUpdatedTimestamp: 'Just now (Attestation Recorded)',
            lastUpdatedEpoch: Date.now(),
            attestationDetails: {
              attestationHash: '0x99a1847291038472910384719283746102938475610293847561029384756102',
              auditorOrValuer: 'Deloitte & Touche LLP / Qualified Custodian',
              documentType: 'Legal Prospectus & Proof of Reserve Audit',
              documentUrl: 'ipfs://bafybeiverifiedattestationrecord2026',
              verificationDate: 'Sep 16, 2026',
              verificationMethod: 'Cryptographic Custody Proof + Legal Counsel Attestation',
              certifyingEntity: 'VALTICS Institutional Attestation Registry (Tier 1)',
            },
          };
        }
        return item;
      })
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* 1. Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              VALTICS ASSET INFORMATION LAYER
            </span>
            <span className="text-xs font-mono text-zinc-400">
              Solana Cluster: <strong className="text-zinc-300">{network.toUpperCase()}</strong>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
            Asset Passport & Verification Registry
          </h1>
          <p className="text-sm text-zinc-400 max-w-3xl leading-relaxed">
            Standardized asset profiles for tokenized RWAs and equity-like instruments. Every asset explicitly separates on-chain market state from external reference benchmarks and issuer self-disclosures.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setVerificationSimulatorOpen(!verificationSimulatorOpen)}
            leftIcon={<Compass className="w-4 h-4 text-violet-400" />}
          >
            {verificationSimulatorOpen ? 'Hide Verification Criteria' : 'Verification Standard'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onSelectTab('markets')}
            rightIcon={<ArrowUpRight className="w-4 h-4" />}
          >
            Browse Live Markets
          </Button>
        </div>
      </div>

      {/* 2. Institutional Integrity & Labeling Standard Accordion / Notice */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#090d16] border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-sm text-zinc-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Strict Asset Verification Standards & Categorization Rules</span>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">Securities Disclosure Standard</span>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          VALTICS strictly prohibits claiming an on-chain token represents real-world equity or debt unless backed by a verified legal prospectus and qualified custodian attestation. Stock prices and oracle feeds are <strong className="text-zinc-200">never fabricated</strong>. All assets are classified into four unambiguous verification statuses:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="p-3 rounded-lg bg-[#060a12] border border-emerald-800/40 space-y-1">
            <div className="flex items-center gap-2">
              <VerificationStatusBadge status="Verified" size="xs" />
            </div>
            <p className="text-[11px] text-zinc-400 leading-normal">
              Independently verified by a qualified custodian, licensed auditor, or SEC/regulator filing.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#060a12] border border-sky-800/40 space-y-1">
            <div className="flex items-center gap-2">
              <VerificationStatusBadge status="Issuer provided" size="xs" />
            </div>
            <p className="text-[11px] text-zinc-400 leading-normal">
              Disclosures provided directly by the token issuer. Not independently certified by third parties.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#060a12] border border-amber-800/40 space-y-1">
            <div className="flex items-center gap-2">
              <VerificationStatusBadge status="Unverified" size="xs" />
            </div>
            <p className="text-[11px] text-zinc-400 leading-normal">
              Permissionless community creation. No legal prospectus, custodian, or transfer agent verified.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#060a12] border border-zinc-800 space-y-1">
            <div className="flex items-center gap-2">
              <VerificationStatusBadge status="Data unavailable" size="xs" />
            </div>
            <p className="text-[11px] text-zinc-400 leading-normal">
              No benchmark pricing or certified oracle feed exists. Never simulated or artificially populated.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Verification Standard / Auditor Panel (Optional Drawer) */}
      {verificationSimulatorOpen && (
        <div className="p-5 rounded-2xl bg-[#0a0f1d] border border-violet-800/50 space-y-4">
          <div className="flex items-center justify-between border-b border-violet-900/40 pb-3">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-violet-400" />
              <h3 className="text-sm font-bold text-white">
                VALTICS 3-Tier Verification Checklist & Attestation Engine
              </h3>
            </div>
            <span className="text-xs font-mono text-violet-300">Auditor Terminal</span>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            To achieve the <strong className="text-emerald-400">Verified</strong> passport credential on VALTICS, token issuers must provide cryptographic proofs corresponding to three institutional criteria:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-[#060812] border border-violet-900/30 space-y-2">
              <div className="flex items-center gap-2 text-violet-300 font-semibold">
                <span className="w-5 h-5 rounded-full bg-violet-950 border border-violet-700 flex items-center justify-center font-mono text-[10px]">1</span>
                <span>Legal Entity & LEI Registration</span>
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Verification of registered legal jurisdiction, corporate articles of incorporation, and active Global Legal Entity Identifier (LEI).
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#060812] border border-violet-900/30 space-y-2">
              <div className="flex items-center gap-2 text-violet-300 font-semibold">
                <span className="w-5 h-5 rounded-full bg-violet-950 border border-violet-700 flex items-center justify-center font-mono text-[10px]">2</span>
                <span>Qualified Custody / Proof of Reserves</span>
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Daily or monthly cryptographic attestation from a chartered custodian bank (e.g. BNY Mellon) or licensed independent appraiser (e.g. CBRE).
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#060812] border border-violet-900/30 space-y-2">
              <div className="flex items-center gap-2 text-violet-300 font-semibold">
                <span className="w-5 h-5 rounded-full bg-violet-950 border border-violet-700 flex items-center justify-center font-mono text-[10px]">3</span>
                <span>Token-2022 Transfer Restriction Audit</span>
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Smart contract audit proving that transfer hooks or permissioning accurately enforce regulatory exemptions (Reg D, Reg S) if applicable.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Filter & Search Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#090d16] p-4 rounded-xl border border-zinc-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by asset name, ticker, mint, or issuer..."
            className="w-full pl-9 pr-3 py-2 bg-[#060910] border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-hidden focus:border-amber-500/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-[#060910] p-1 rounded-lg border border-zinc-800">
            {(['ALL', 'Verified', 'Issuer provided', 'Unverified', 'Data unavailable'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  selectedStatus === status
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {status === 'ALL' ? 'All Statuses' : status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Asset Registry Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
          <span>
            Showing <strong>{filteredProfiles.length}</strong> Registered Asset Profiles
          </span>
          <span>VALTICS Structured Registry v2.4</span>
        </div>

        {filteredProfiles.length === 0 ? (
          <div className="text-center py-16 bg-[#090d16] rounded-2xl border border-zinc-800 space-y-3">
            <HelpCircle className="w-8 h-8 text-zinc-500 mx-auto" />
            <h3 className="text-sm font-semibold text-zinc-300">No Asset Profiles Match Criteria</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Try adjusting your verification status filter or search query.
            </p>
            <Button
              variant="secondary"
              size="xs"
              onClick={() => {
                setSearchQuery('');
                setSelectedStatus('ALL');
                setSelectedType('ALL');
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredProfiles.map((asset) => (
              <div
                key={asset.id}
                className="rounded-2xl border border-zinc-800 bg-[#090d16] hover:border-zinc-700/80 transition-all p-5 flex flex-col justify-between space-y-4 shadow-md"
              >
                {/* Card Top: Asset Name, Ticker, Status */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-[#0f1422] border border-zinc-800 flex items-center justify-center font-bold text-amber-400 font-mono text-sm shrink-0">
                        {asset.ticker.slice(0, 3)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white font-sans hover:text-amber-400 transition-colors">
                            {asset.assetName}
                          </h3>
                          <span className="text-xs font-mono font-bold text-amber-400">
                            {asset.ticker}
                          </span>
                        </div>
                        <span className="text-[11px] font-medium text-sky-400/90 block">
                          {asset.assetType}
                        </span>
                      </div>
                    </div>

                    <VerificationStatusBadge status={asset.verificationStatus} size="sm" />
                  </div>

                  {/* Underlying Asset Description */}
                  <div className="p-3 rounded-lg bg-[#060910] border border-zinc-800/80 text-xs text-zinc-300 space-y-1">
                    <span className="text-[10px] uppercase font-mono text-zinc-400 block">
                      Underlying / Reference Asset
                    </span>
                    <p className="font-mono text-[11px] leading-relaxed line-clamp-2 text-zinc-200">
                      {asset.underlyingReferenceAsset}
                    </p>
                  </div>

                  {/* 10 Required Profile Datapoints Breakdown */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                    {/* Reference Price */}
                    <div className="p-2 rounded bg-[#060910] border border-zinc-800/50">
                      <span className="text-[9px] text-zinc-400 uppercase block">Reference Price</span>
                      <span className="text-xs font-bold text-white">
                        {asset.referencePrice !== null ? (
                          asset.referencePriceFormatted || `$${asset.referencePrice.toFixed(4)}`
                        ) : (
                          <span className="text-zinc-500 font-normal italic">Data unavail.</span>
                        )}
                      </span>
                    </div>

                    {/* Price Source */}
                    <div className="p-2 rounded bg-[#060910] border border-zinc-800/50">
                      <span className="text-[9px] text-zinc-400 uppercase block">Price Source</span>
                      <span className="text-[11px] text-zinc-300 truncate block" title={asset.priceSource}>
                        {asset.priceSource}
                      </span>
                    </div>

                    {/* Issuer Entity */}
                    <div className="p-2 rounded bg-[#060910] border border-zinc-800/50">
                      <span className="text-[9px] text-zinc-400 uppercase block">Issuer</span>
                      <span className="text-[11px] text-zinc-300 truncate block" title={asset.issuer.name}>
                        {asset.issuer.name}
                      </span>
                    </div>

                    {/* Last Updated */}
                    <div className="p-2 rounded bg-[#060910] border border-zinc-800/50">
                      <span className="text-[9px] text-zinc-400 uppercase block">Last Attestation</span>
                      <span className="text-[11px] text-zinc-300 truncate block">
                        {asset.lastUpdatedTimestamp.split(',')[0]}
                      </span>
                    </div>
                  </div>

                  {/* Four Separated Categories Indicator Strip */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1 text-[10px] font-mono">
                    <div className="p-1.5 rounded bg-emerald-950/20 border border-emerald-800/30 text-emerald-300 text-center">
                      <span className="block text-[8px] text-emerald-500 uppercase">1. On-Chain</span>
                      <strong className="truncate block">{formatCurrency(asset.onChainData.spotPrice)}</strong>
                    </div>

                    <div className="p-1.5 rounded bg-violet-950/20 border border-violet-800/30 text-violet-300 text-center">
                      <span className="block text-[8px] text-violet-500 uppercase">2. Reference</span>
                      <strong className="truncate block">
                        {asset.referencePrice !== null ? `$${asset.referencePrice.toFixed(2)}` : 'Unavail.'}
                      </strong>
                    </div>

                    <div className="p-1.5 rounded bg-sky-950/20 border border-sky-800/30 text-sky-300 text-center">
                      <span className="block text-[8px] text-sky-500 uppercase">3. Issuer Data</span>
                      <strong className="truncate block">{asset.issuer.jurisdiction.split(',')[0]}</strong>
                    </div>

                    <div className="p-1.5 rounded bg-amber-950/20 border border-amber-800/30 text-amber-300 text-center">
                      <span className="block text-[8px] text-amber-500 uppercase">4. Metrics</span>
                      <strong className="truncate block">
                        {asset.calculatedMetrics.premiumDiscountToNavPct !== null
                          ? `${asset.calculatedMetrics.premiumDiscountToNavPct > 0 ? '+' : ''}${asset.calculatedMetrics.premiumDiscountToNavPct.toFixed(1)}%`
                          : 'Spread N/A'}
                      </strong>
                    </div>
                  </div>

                  {/* Real World Security Attestation Flag */}
                  <div className="flex items-center justify-between text-[11px] font-mono px-2 py-1 rounded bg-[#060910] border border-zinc-800/60">
                    <span className="text-zinc-400">Legal Securities Attestation:</span>
                    {asset.representsRealWorldSecurity ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verified Legal Claim</span>
                      </span>
                    ) : (
                      <span className="text-amber-400/90 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Unverified / Issuer Self-Reported</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Bottom: Actions */}
                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 truncate">
                    <span>Mint:</span>
                    <span className="text-zinc-300 truncate max-w-[120px]">{asset.tokenMint}</span>
                    <a
                      href={getExplorerUrl(asset.tokenMint, 'address', network)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-white"
                      title="View Mint on Solana Explorer"
                    >
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {asset.verificationStatus !== 'Verified' && (
                      <button
                        onClick={() => handleSimulateVerification(asset.id)}
                        className="text-[10px] font-mono px-2 py-1 rounded bg-violet-950/40 text-violet-300 border border-violet-800/50 hover:bg-violet-900/40 transition-colors"
                        title="Simulate recording proof-of-reserve attestation"
                      >
                        Audit & Verify
                      </button>
                    )}
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={() => handleOpenPassport(asset)}
                      rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                    >
                      Open Passport
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. Passport Detail Modal */}
      <AssetPassportModal
        asset={activePassportAsset}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectMarket={onSelectMarketForTrade}
      />
    </div>
  );
};
