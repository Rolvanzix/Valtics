import React from 'react';
import { ExternalLink, ArrowRight, ShieldCheck, Cpu, Layers } from 'lucide-react';
import { DBCPoolState } from '../../types';
import { AddressBadge } from '../common/AddressBadge';
import { formatCurrency, formatPercent, formatBps } from '../../utils/format';
import { getExplorerUrl } from '../../config/constants';
import { useNetwork } from '../../context/NetworkContext';
import { Dialog } from '../ui/Dialog';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { GraduationGauge } from '../charts/GraduationGauge';

interface PoolDetailModalProps {
  pool: DBCPoolState | null;
  onClose: () => void;
  onNavigateToStudio?: () => void;
}

export const PoolDetailModal: React.FC<PoolDetailModalProps> = ({
  pool,
  onClose,
  onNavigateToStudio,
}) => {
  const { network } = useNetwork();

  if (!pool) return null;

  return (
    <Dialog
      isOpen={!!pool}
      onClose={onClose}
      title={pool.tokenName || `Pool ${pool.poolAddress.slice(0, 6)}...`}
      description={`Meteora Dynamic Bonding Curve State · Solana ${network.toUpperCase()}`}
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <a
            href={getExplorerUrl(pool.poolAddress, 'address', network)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#B8A9CC] hover:text-[#F7F3FF] flex items-center gap-1.5 transition-colors font-medium"
          >
            <span>View on Solana Explorer</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {onNavigateToStudio && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                onClose();
                onNavigateToStudio();
              }}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Model in Curve Studio
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-5">
        {/* Status badges */}
        <div className="flex items-center gap-2">
          <Badge variant="accent" size="sm">
            {pool.rwaCategory || 'Tokenized Asset'}
          </Badge>
          {pool.isMigrated ? (
            <Badge variant="graduated" size="sm" dot>
              Graduated to Meteora DAMM
            </Badge>
          ) : (
            <Badge variant="live" size="sm" dot>
              Active Dynamic Curve
            </Badge>
          )}
          <span className="text-[#B8A9CC] font-mono text-xs ml-auto">
            {pool.tokenSymbol || 'TKN'}
          </span>
        </div>

        {/* Gauge + Core Telemetry */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-[#140130] p-4 rounded-xl border border-[#670CDC]/25">
          <div className="sm:col-span-5 flex justify-center">
            <GraduationGauge
              currentPct={pool.quoteCurveProgressPct}
              targetThresholdLabel={pool.quoteThreshold || 'Continuous'}
              size={170}
            />
          </div>

          <div className="sm:col-span-7 space-y-2.5 text-xs font-mono-nums border-t sm:border-t-0 sm:border-l border-[#670CDC]/20 pt-3 sm:pt-0 sm:pl-4">
            <div className="flex justify-between py-1 border-b border-[#670CDC]/15">
              <span className="text-[#B8A9CC] font-sans">Current Spot Price:</span>
              <span className="font-bold text-[#F99225] text-sm">
                {formatCurrency(pool.currentPrice)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#670CDC]/15">
              <span className="text-[#B8A9CC] font-sans">Base Trading Fee:</span>
              <span className="text-[#F7F3FF]">{formatBps(pool.baseFeeBps)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#670CDC]/15">
              <span className="text-[#B8A9CC] font-sans">Migration Target:</span>
              <span className="text-[#F7F3FF]">{pool.migrationOptionLabel}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#B8A9CC] font-sans">AMM Status:</span>
              <span className={pool.isMigrated ? 'text-violet-400 font-semibold' : 'text-[#F99225]'}>
                {pool.isMigrated ? 'Graduated & Locked' : 'Accumulating Quote'}
              </span>
            </div>
          </div>
        </div>

        {/* On-Chain PDA Account Registry */}
        <div className="rounded-xl bg-[#140130] border border-[#670CDC]/25 p-4 space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#B8A9CC] block font-sans">
            Verified On-Chain Accounts
          </span>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-[#670CDC]/20">
              <span className="text-[#B8A9CC]">Pool Account (PDA):</span>
              <AddressBadge address={pool.poolAddress} head={6} tail={6} />
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[#670CDC]/20">
              <span className="text-[#B8A9CC]">Base Asset Mint:</span>
              <AddressBadge address={pool.baseMint} head={6} tail={6} />
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[#670CDC]/20">
              <span className="text-[#B8A9CC]">Quote Asset Mint:</span>
              <AddressBadge address={pool.quoteMint} head={6} tail={6} />
            </div>
            {pool.creator && (
              <div className="flex items-center justify-between py-1 border-b border-[#670CDC]/20">
                <span className="text-[#B8A9CC]">Creator Authority:</span>
                <AddressBadge address={pool.creator} head={6} tail={6} />
              </div>
            )}
            {pool.configAddress && (
              <div className="flex items-center justify-between py-1">
                <span className="text-[#B8A9CC]">DBC Curve Config:</span>
                <AddressBadge address={pool.configAddress} head={6} tail={6} />
              </div>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
};
