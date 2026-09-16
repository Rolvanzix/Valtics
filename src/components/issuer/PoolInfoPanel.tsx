import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  ExternalLink, 
  Coins, 
  ShieldCheck, 
  Database, 
  Code2, 
  Layers, 
  Info 
} from 'lucide-react';
import { DBCPoolState } from '../../types';
import { METEORA_DBC_PROGRAM_ID, getExplorerUrl } from '../../config/constants';
import { useNetwork } from '../../context/NetworkContext';
import { AddressBadge } from '../common/AddressBadge';

interface PoolInfoPanelProps {
  pool: DBCPoolState;
}

export const PoolInfoPanel: React.FC<PoolInfoPanelProps> = ({ pool }) => {
  const { network } = useNetwork();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const accountRows = [
    {
      label: 'Pool Account (PDA)',
      address: pool.poolAddress,
      description: 'Primary Program Derived Address holding Meteora dynamic curve state and price curves.',
      key: 'poolAddress',
    },
    {
      label: 'Configuration Account',
      address: pool.configAddress || `${pool.poolAddress.slice(0, 10)}...config`,
      description: 'Curve mathematical model, fee shares, and migration thresholds configuration.',
      key: 'configAddress',
    },
    {
      label: 'Base Token Mint',
      address: pool.baseMint,
      description: 'SPL Token or Token-2022 mint address representing the tokenized asset.',
      key: 'baseMint',
    },
    {
      label: 'Quote Token Mint',
      address: pool.quoteMint,
      description: 'Solana native Wrapped SOL (WSOL) or USDC mint address.',
      key: 'quoteMint',
    },
    {
      label: 'Base Asset Vault (PDA)',
      address: pool.baseVault || `${pool.poolAddress.slice(0, 8)}...base_vault`,
      description: 'Non-custodial token account locking unsold base tokens on the curve.',
      key: 'baseVault',
    },
    {
      label: 'Quote Reserve Vault (PDA)',
      address: pool.quoteVault || `${pool.poolAddress.slice(0, 8)}...quote_vault`,
      description: 'Vault accumulating SOL/USDC payments until the migration threshold is triggered.',
      key: 'quoteVault',
    },
    {
      label: 'Creator Authority',
      address: pool.creator,
      description: 'Issuer authority with rights to claim accrued trading fees.',
      key: 'creator',
    },
    {
      label: 'Meteora DBC Program ID',
      address: METEORA_DBC_PROGRAM_ID,
      description: 'Official verified Meteora Dynamic Bonding Curve smart contract on Solana.',
      key: 'programId',
    },
  ];

  return (
    <div className="rounded-xl border border-zinc-800 bg-[#0c1018] p-5 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300">
            <Database className="w-4 h-4" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-zinc-100 font-sans tracking-tight">
            Cryptographic Pool Architecture & PDAs
          </h3>
        </div>
        <span className="text-[11px] font-mono text-zinc-400">
          Solana {network.toUpperCase()}
        </span>
      </div>

      <div className="space-y-3">
        {accountRows.map((row) => (
          <div
            key={row.key}
            className="p-3.5 rounded-lg bg-[#0e1422] border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
          >
            <div className="space-y-0.5">
              <span className="font-semibold text-zinc-200 block font-sans">
                {row.label}
              </span>
              <p className="text-[11px] text-zinc-400 max-w-xl font-normal">
                {row.description}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono text-xs text-zinc-300 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                {row.address.slice(0, 6)}...{row.address.slice(-6)}
              </span>

              <button
                type="button"
                onClick={() => handleCopy(row.address, row.key)}
                className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
                title="Copy address"
              >
                {copiedKey === row.key ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>

              <a
                href={getExplorerUrl(row.address, 'address', network as any)}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-400 hover:text-amber-300 transition-colors"
                title="View in Solana Explorer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
