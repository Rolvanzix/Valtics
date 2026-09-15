import React, { useState } from 'react';
import {
  Globe,
  Wallet,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useNetwork } from '../../context/NetworkContext';
import { useWallet } from '../../context/WalletContext';
import { DBC_PROGRAM_ID_STR } from '../../services/meteoraService';
import { getExplorerUrl } from '../../config/constants';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export interface BlockchainAddressItem {
  label: string;
  address: string;
  type?: 'address' | 'tx';
}

interface BlockchainContextBarProps {
  screenTitle?: string;
  addresses?: BlockchainAddressItem[];
  compact?: boolean;
  className?: string;
}

export const BlockchainContextBar: React.FC<BlockchainContextBarProps> = ({
  screenTitle,
  addresses = [],
  compact = false,
  className = '',
}) => {
  const { network, endpoint, isRpcHealthy, latencyMs } = useNetwork();
  const { connected, publicKeyStr, balanceSol, walletName, connect } = useWallet();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const allAddresses: BlockchainAddressItem[] = [
    { label: 'Meteora DBC Program', address: DBC_PROGRAM_ID_STR },
    ...addresses,
  ];

  return (
    <div
      className={`rounded-xl border border-zinc-800/80 bg-[#070b12] text-xs shadow-sm overflow-hidden ${className}`}
    >
      <div className="px-4 py-2.5 bg-gradient-to-r from-zinc-900/60 via-zinc-900/30 to-transparent border-b border-zinc-800/60 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Network Cluster Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isRpcHealthy ? 'bg-emerald-400' : 'bg-rose-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isRpcHealthy ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
            </span>
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-zinc-400" />
              <span className="font-semibold text-zinc-200 uppercase tracking-wider text-[11px] font-mono">
                Solana {network.toUpperCase()}
              </span>
            </div>
          </div>

          <Badge variant="neutral" size="xs">
            {latencyMs >= 0 ? `${latencyMs}ms` : 'Active'}
          </Badge>

          <span className="hidden md:inline text-zinc-600">|</span>

          {/* Meteora DBC Protocol Spec */}
          <div className="hidden sm:flex items-center gap-1.5 text-zinc-400">
            <Cpu className="w-3 h-3 text-amber-400" />
            <span className="text-[11px] text-zinc-300">Meteora DBC SDK v1.5.12</span>
          </div>
        </div>

        {/* Right: Wallet Context */}
        <div className="flex items-center gap-2.5">
          {connected && publicKeyStr ? (
            <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 px-2.5 py-1 rounded-lg">
              <Wallet className="w-3.5 h-3.5 text-amber-400" />
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <span className="text-zinc-400">{walletName || 'Wallet'}:</span>
                <span className="text-zinc-200 font-semibold">
                  {publicKeyStr.slice(0, 4)}...{publicKeyStr.slice(-4)}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(publicKeyStr, 'wallet')}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors ml-0.5"
                  title="Copy address"
                >
                  {copiedKey === 'wallet' ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>

              {balanceSol !== null && (
                <span className="text-[10px] font-mono text-amber-400/90 font-medium border-l border-zinc-800 pl-2">
                  {balanceSol.toFixed(3)} SOL
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-400 font-mono">Wallet: Disconnected</span>
              <Button
                variant="brand"
                size="xs"
                onClick={() => connect('phantom')}
                leftIcon={<Wallet className="w-3 h-3" />}
              >
                Connect Wallet
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Strip: Relevant Addresses */}
      {allAddresses.length > 0 && !compact && (
        <div className="px-4 py-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 bg-[#090d15] text-[11px] font-mono">
          <span className="text-zinc-400 uppercase tracking-wider text-[10px] font-sans font-semibold">
            On-Chain Coordinates:
          </span>
          {allAddresses.map((item, idx) => (
            <div key={`${item.label}-${idx}`} className="flex items-center gap-1.5">
              <span className="text-zinc-400 font-sans">{item.label}:</span>
              <span className="text-zinc-300 font-mono bg-zinc-900/60 px-1.5 py-0.5 rounded border border-zinc-800/60">
                {item.address.slice(0, 4)}...{item.address.slice(-4)}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(item.address, `addr-${idx}`)}
                className="text-zinc-400 hover:text-zinc-200 transition-colors"
                title="Copy full address"
              >
                {copiedKey === `addr-${idx}` ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
              <a
                href={getExplorerUrl(item.address, item.type || 'address', network)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-amber-400 transition-colors"
                title="View on Solana Explorer"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
