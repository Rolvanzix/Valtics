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
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* 1. Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#670CDC]/20 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-mono px-2 py-0.5 rounded bg-[#100126] text-[#EDE4FA] border border-[#670CDC]/30">
              Information layer
            </span>
            <span className="text-xs font-mono text-[#B8A9CC]">
              Solana <strong className="text-[#EDE4FA]">{network.toUpperCase()}</strong>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F7F3FF] tracking-tight font-sans">
            Asset Passport & Verification Registry
          </h1>
          <p className="text-xs text-[#B8A9CC] max-w-3xl leading-relaxed">
            Standardized asset profiles for tokenized RWAs. Verifiable legal disclosures, custodian attestations, and external reference price feeds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setVerificationSimulatorOpen(!verificationSimulatorOpen)}
            leftIcon={<Compass className="w-3.5 h-3.5 text-[#B8A9CC]" />}
          >
            {verificationSimulatorOpen ? 'Hide Criteria' : 'Verification criteria'}
          </Button>
          <Button
            variant="brand"
            size="sm"
            onClick={() => onSelectTab('markets')}
            rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
          >
            Browse markets
          </Button>
        </div>
      </div>

      {/* 2. Institutional Integrity & Labeling Standard Accordion / Notice */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#140130] border border-[#670CDC]/25 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-sm text-[#F7F3FF]">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Strict Asset Verification Standards & Categorization Rules</span>
          </div>
          <span className="text-[11px] font-mono text-[#B8A9CC]">Securities Disclosure Standard</span>
        </div>

        <p className="text-xs text-[#B8A9CC] leading-relaxed">
          VALTICS strictly prohibits claiming an on-chain token represents real-world equity or debt unless backed by a verified legal prospectus and qualified custodian attestation. Stock prices and oracle feeds are <strong className="text-[#F7F3FF]">never fabricated</strong>. All assets are classified into four unambiguous verification statuses:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-[#100126] border border-emerald-800/40 space-y-1">
            <div className="flex items-center gap-2">
              <VerificationStatusBadge status="Verified" size="xs" />
            </div>
            <p className="text-[11px] text-[#B8A9CC] leading-normal">
              Independently verified by a qualified custodian, licensed auditor, or SEC/regulator filing.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#100126] border border-violet-800/40 space-y-1">
            <div className="flex items-center gap-2">
              <VerificationStatusBadge status="Issuer provided" size="xs" />
            </div>
            <p className="text-[11px] text-[#B8A9CC] leading-normal">
              Disclosures provided directly by the token issuer. Not independently certified by third parties.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#100126] border border-[#F99225]/30 space-y-1">
            <div className="flex items-center gap-2">
              <VerificationStatusBadge status="Unverified" size="xs" />
            </div>
            <p className="text-[11px] text-[#B8A9CC] leading-normal">
              Permissionless community creation. No legal prospectus, custodian, or transfer agent verified.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#100126] border border-[#670CDC]/20 space-y-1">
            <div className="flex items-center gap-2">
              <VerificationStatusBadge status="Data unavailable" size="xs" />
            </div>
            <p className="text-[11px] text-[#B8A9CC] leading-normal">
              No benchmark pricing or certified oracle feed exists. Never simulated or artificially populated.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Verification Standard / Auditor Panel (Optional Drawer) */}
      {verificationSimulatorOpen && (
        <div className="p-5 rounded-2xl bg-[#18013A] border border-[#670CDC]/40 space-y-4">
          <div className="flex items-center justify-between border-b border-[#670CDC]/30 pb-3">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#D76EDD]" />
              <h3 className="text-sm font-bold text-[#F7F3FF]">
                VALTICS 3-Tier Verification Checklist & Attestation Engine
              </h3>
            </div>
            <span className="text-xs font-mono text-[#D76EDD]">Auditor Terminal</span>
          </div>

          <p className="text-xs text-[#B8A9CC] leading-relaxed">
            To achieve the <strong className="text-emerald-400">Verified</strong> passport credential on VALTICS, token issuers must provide cryptographic proofs corresponding to three institutional criteria:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-[#100126] border border-[#670CDC]/25 space-y-2">
              <div className="flex items-center gap-2 text-[#D76EDD] font-semibold">
                <span className="w-5 h-5 rounded-full bg-[#240250] border border-[#670CDC]/50 flex items-center justify-center font-mono text-[10px] text-[#F7F3FF]">1</span>
                <span>Legal Entity & LEI Registration</span>
              </div>
              <p className="text-[#B8A9CC] text-[11px] leading-relaxed">
                Verification of registered legal jurisdiction, corporate articles of incorporation, and active Global Legal Entity Identifier (LEI).
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#100126] border border-[#670CDC]/25 space-y-2">
              <div className="flex items-center gap-2 text-[#D76EDD] font-semibold">
                <span className="w-5 h-5 rounded-full bg-[#240250] border border-[#670CDC]/50 flex items-center justify-center font-mono text-[10px] text-[#F7F3FF]">2</span>
                <span>Qualified Custody / Proof of Reserves</span>
              </div>
              <p className="text-[#B8A9CC] text-[11px] leading-relaxed">
                Daily or monthly cryptographic attestation from a chartered custodian bank (e.g. BNY Mellon) or licensed independent appraiser (e.g. CBRE).
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#100126] border border-[#670CDC]/25 space-y-2">
              <div className="flex items-center gap-2 text-[#D76EDD] font-semibold">
                <span className="w-5 h-5 rounded-full bg-[#240250] border border-[#670CDC]/50 flex items-center justify-center font-mono text-[10px] text-[#F7F3FF]">3</span>
                <span>Token-2022 Transfer Restriction Audit</span>
              </div>
              <p className="text-[#B8A9CC] text-[11px] leading-relaxed">
                Smart contract audit proving that transfer hooks or permissioning accurately enforce regulatory exemptions (Reg D, Reg S) if applicable.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Filter & Search Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#140130] p-4 rounded-xl border border-[#670CDC]/25">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#B8A9CC] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by asset name, ticker, mint, or issuer..."
            className="w-full pl-9 pr-3 py-2 bg-[#100126] border border-[#670CDC]/30 rounded-lg text-xs text-[#F7F3FF] placeholder-[#7E6D96] focus:outline-hidden focus:border-[#670CDC]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-[#100126] p-1 rounded-lg border border-[#670CDC]/25">
            {(['ALL', 'Verified', 'Issuer provided', 'Unverified', 'Data unavailable'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  selectedStatus === status
                    ? 'bg-[#F99225]/20 text-[#F99225] border border-[#F99225]/40 font-semibold'
                    : 'text-[#B8A9CC] hover:text-[#F7F3FF]'
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
        <div className="flex items-center justify-between text-xs text-[#B8A9CC] font-mono">
          <span>
            Showing <strong>{filteredProfiles.length}</strong> Registered Asset Profiles
          </span>
          <span>VALTICS Structured Registry v2.4</span>
        </div>

        {filteredProfiles.length === 0 ? (
          <div className="text-center py-16 bg-[#140130] rounded-2xl border border-[#670CDC]/25 space-y-3">
            <HelpCircle className="w-8 h-8 text-[#B8A9CC] mx-auto opacity-50" />
            <h3 className="text-sm font-semibold text-[#F7F3FF]">No Asset Profiles Match Criteria</h3>
            <p className="text-xs text-[#B8A9CC] max-w-sm mx-auto">
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
                className="rounded-2xl border border-[#670CDC]/25 bg-[#140130] hover:border-[#670CDC]/60 hover:bg-[#1C0142] transition-all p-5 flex flex-col justify-between space-y-4 shadow-lg shadow-[#09011B]/50"
              >
                {/* Card Top: Asset Name, Ticker, Status */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-[#240250] border border-[#670CDC]/40 flex items-center justify-center font-bold text-[#F99225] font-mono text-sm shrink-0">
                        {asset.ticker.slice(0, 3)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-[#F7F3FF] font-sans hover:text-[#F99225] transition-colors">
                            {asset.assetName}
                          </h3>
                          <span className="text-xs font-mono font-bold text-[#F99225]">
                            {asset.ticker}
                          </span>
                        </div>
                        <span className="text-[11px] font-medium text-[#D76EDD] block">
                          {asset.assetType}
                        </span>
                      </div>
                    </div>

                    <VerificationStatusBadge status={asset.verificationStatus} size="sm" />
                  </div>

                  {/* Underlying Asset Description */}
                  <div className="p-3 rounded-xl bg-[#100126] border border-[#670CDC]/20 text-xs text-[#B8A9CC] space-y-1">
                    <span className="text-[10px] uppercase font-mono text-[#7E6D96] block">
                      Underlying / Reference Asset
                    </span>
                    <p className="font-mono text-[11px] leading-relaxed line-clamp-2 text-[#EDE4FA]">
                      {asset.underlyingReferenceAsset}
                    </p>
                  </div>

                  {/* 10 Required Profile Datapoints Breakdown */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                    {/* Reference Price */}
                    <div className="p-2 rounded bg-[#100126] border border-[#670CDC]/20">
                      <span className="text-[9px] text-[#7E6D96] uppercase block">Reference Price</span>
                      <span className="text-xs font-bold text-[#F7F3FF]">
                        {asset.referencePrice !== null ? (
                          asset.referencePriceFormatted || `$${asset.referencePrice.toFixed(4)}`
                        ) : (
                          <span className="text-[#7E6D96] font-normal italic">Data unavail.</span>
                        )}
                      </span>
                    </div>

                    {/* Price Source */}
                    <div className="p-2 rounded bg-[#100126] border border-[#670CDC]/20">
                      <span className="text-[9px] text-[#7E6D96] uppercase block">Price Source</span>
                      <span className="text-[11px] text-[#EDE4FA] truncate block" title={asset.priceSource}>
                        {asset.priceSource}
                      </span>
                    </div>

                    {/* Issuer Entity */}
                    <div className="p-2 rounded bg-[#100126] border border-[#670CDC]/20">
                      <span className="text-[9px] text-[#7E6D96] uppercase block">Issuer</span>
                      <span className="text-[11px] text-[#EDE4FA] truncate block" title={asset.issuer.name}>
                        {asset.issuer.name}
                      </span>
                    </div>

                    {/* Last Updated */}
                    <div className="p-2 rounded bg-[#100126] border border-[#670CDC]/20">
                      <span className="text-[9px] text-[#7E6D96] uppercase block">Last Attestation</span>
                      <span className="text-[11px] text-[#EDE4FA] truncate block">
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
                  <div className="flex items-center justify-between text-[11px] font-mono px-2 py-1 rounded bg-[#100126] border border-[#670CDC]/20">
                    <span className="text-[#B8A9CC]">Legal Securities Attestation:</span>
                    {asset.representsRealWorldSecurity ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verified Legal Claim</span>
                      </span>
                    ) : (
                      <span className="text-[#F99225] flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Unverified / Issuer Self-Reported</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Bottom: Actions */}
                <div className="pt-3 border-t border-[#670CDC]/20 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1 text-[11px] font-mono text-[#7E6D96] truncate">
                    <span>Mint:</span>
                    <span className="text-[#EDE4FA] truncate max-w-[120px]">{asset.tokenMint}</span>
                    <a
                      href={getExplorerUrl(asset.tokenMint, 'address', network)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#B8A9CC] hover:text-[#F7F3FF]"
                      title="View Mint on Solana Explorer"
                    >
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {asset.verificationStatus !== 'Verified' && (
                      <button
                        onClick={() => handleSimulateVerification(asset.id)}
                        className="text-[10px] font-mono px-2 py-1 rounded bg-[#670CDC]/20 text-[#D76EDD] border border-[#670CDC]/30 hover:bg-[#670CDC]/30 transition-colors"
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
