import React from 'react';
import { ExternalLink, ShieldCheck, Terminal, Cpu } from 'lucide-react';
import { METEORA_DBC_PROGRAM_ID } from '../../config/constants';
import { AddressBadge } from '../common/AddressBadge';
import { useNetwork } from '../../context/NetworkContext';
import { ValticsLogo } from '../brand/ValticsLogo';

export const Footer: React.FC = () => {
  const { network } = useNetwork();

  return (
    <footer className="w-full border-t border-zinc-800/80 bg-[#06080e] text-zinc-400 text-xs py-8 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-zinc-800/60">
          <div className="space-y-2">
            <ValticsLogo size="sm" showText={true} tagline={false} />
            <p className="text-zinc-400 text-xs max-w-xl leading-relaxed">
              Programmable markets and bonding curves for tokenized assets. Built on Meteora Dynamic Bonding Curve (DBC) infrastructure on Solana.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-1.5">
            <span className="text-[11px] text-zinc-400 font-mono">
              Meteora DBC Program ID:
            </span>
            <AddressBadge address={METEORA_DBC_PROGRAM_ID} head={8} tail={8} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[11px] text-zinc-400">
          <div className="space-y-1">
            <span className="font-semibold text-zinc-300 block uppercase tracking-wider text-[10px]">
              Security Architecture
            </span>
            <p className="leading-relaxed">
              Non-custodial platform. Every market creation, reserve deposit, or fee claim is formulated as raw Solana instructions signed directly inside your client wallet.
            </p>
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-zinc-300 block uppercase tracking-wider text-[10px]">
              DBC Graduation Model
            </span>
            <p className="leading-relaxed">
              Upon reaching target quote threshold, liquidity migrates automatically into Meteora DAMM or DLMM with customizable LP token lockups.
            </p>
          </div>

          <div className="space-y-2">
            <span className="font-semibold text-zinc-300 block uppercase tracking-wider text-[10px]">
              Official Resources
            </span>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://docs.meteora.ag"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-zinc-200 flex items-center gap-1 transition-colors"
              >
                <span>Meteora Docs</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://explorer.solana.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-zinc-200 flex items-center gap-1 transition-colors"
              >
                <span>Solana Explorer</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://status.solana.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-zinc-200 flex items-center gap-1 transition-colors"
              >
                <span>Cluster Health</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-zinc-400">
          <span>VALTICS Financial Infrastructure © {new Date().getFullYear()}</span>
          <span>Target Cluster: {network.toUpperCase()}</span>
        </div>
      </div>
    </footer>
  );
};
