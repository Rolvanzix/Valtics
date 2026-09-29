import React, { useState } from 'react';
import { ValticsLogo } from '../brand/ValticsLogo';
import { NavigationTab } from '../layout/Header';
import { ShieldCheck, X } from 'lucide-react';

interface LandingFooterProps {
  onEnterApp: (targetTab?: NavigationTab) => void;
  onNavigateSection: (sectionId: string) => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({
  onEnterApp,
  onNavigateSection,
}) => {
  const [legalModalOpen, setLegalModalOpen] = useState<'terms' | 'privacy' | null>(null);

  return (
    <footer className="border-t border-white/[0.06] bg-[#05070a] py-14 text-xs font-mono text-zinc-500">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-4">
            <ValticsLogo size="sm" showText={true} tagline={false} glow={false} />
            <span className="text-zinc-700 hidden sm:inline">/</span>
            <span className="text-zinc-500 text-[11px] hidden sm:inline">
              Autonomous Market Infrastructure
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-zinc-400">
            <button
              type="button"
              onClick={() => onNavigateSection('system')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Platform
            </button>
            <button
              type="button"
              onClick={() => onNavigateSection('transformation')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => onNavigateSection('showcase')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Showcase
            </button>
            <button
              type="button"
              onClick={() => onEnterApp('overview')}
              className="text-white hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Enter Valtics
            </button>
            <button
              type="button"
              onClick={() => setLegalModalOpen('terms')}
              className="hover:text-zinc-300 transition-colors cursor-pointer"
            >
              Terms
            </button>
            <button
              type="button"
              onClick={() => setLegalModalOpen('privacy')}
              className="hover:text-zinc-300 transition-colors cursor-pointer"
            >
              Privacy
            </button>
          </nav>

          {/* Right Network & Copyright */}
          <div className="text-[11px] text-zinc-600 text-center md:text-right">
            <span>Solana Meteora DBC</span>
            <span className="mx-2">·</span>
            <span>© VALTICS</span>
          </div>
        </div>
      </div>

      {/* Non-Custodial Legal Notice Modal */}
      {legalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#0b0e14] border border-zinc-800 rounded-xl max-w-lg w-full p-6 text-zinc-300 relative shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-white font-sans text-sm">
                  {legalModalOpen === 'terms' ? 'Protocol Terms' : 'Privacy Notice'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLegalModalOpen(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-zinc-400 font-sans">
              {legalModalOpen === 'terms' ? (
                <>
                  <p>
                    VALTICS provides decentralized, non-custodial software interfaces for interacting with Meteora Dynamic Bonding Curves on Solana.
                  </p>
                  <p>
                    All bonding curve transactions, collateral deposits, and liquidity graduations are autonomous smart contract operations.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    VALTICS does not collect personal identity records or store custodial credentials.
                  </p>
                  <p>
                    All state transitions are performed directly on public Solana ledgers and non-custodial RPC nodes.
                  </p>
                </>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setLegalModalOpen(null)}
                className="px-4 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-mono"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
