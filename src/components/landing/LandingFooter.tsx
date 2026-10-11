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
    <footer className="border-t border-[#670CDC]/20 bg-[#09011B] py-14 text-xs font-mono text-[#7E6D96]">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-4">
            <ValticsLogo size="sm" showText={true} tagline={false} glow={false} />
            <span className="text-[#670CDC]/40 hidden sm:inline">/</span>
            <span className="text-[#B8A9CC] text-[11px] hidden sm:inline">
              Autonomous Market Infrastructure
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-[#B8A9CC]">
            <button
              type="button"
              onClick={() => onNavigateSection('system')}
              className="hover:text-[#F7F3FF] transition-colors cursor-pointer"
            >
              Platform
            </button>
            <button
              type="button"
              onClick={() => onNavigateSection('transformation')}
              className="hover:text-[#F7F3FF] transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => onNavigateSection('showcase')}
              className="hover:text-[#F7F3FF] transition-colors cursor-pointer"
            >
              Showcase
            </button>
            <button
              type="button"
              onClick={() => onEnterApp('overview')}
              className="text-[#F7F3FF] hover:text-[#F99225] transition-colors cursor-pointer font-semibold"
            >
              Enter Valtics
            </button>
            <button
              type="button"
              onClick={() => setLegalModalOpen('terms')}
              className="hover:text-[#EDE4FA] transition-colors cursor-pointer"
            >
              Terms
            </button>
            <button
              type="button"
              onClick={() => setLegalModalOpen('privacy')}
              className="hover:text-[#EDE4FA] transition-colors cursor-pointer"
            >
              Privacy
            </button>
          </nav>

          {/* Right Network & Copyright */}
          <div className="text-[11px] text-[#7E6D96] text-center md:text-right">
            <span>Solana Meteora DBC</span>
            <span className="mx-2">·</span>
            <span>© VALTICS</span>
          </div>
        </div>
      </div>

      {/* Non-Custodial Legal Notice Modal */}
      {legalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#140130] border border-[#670CDC]/30 rounded-xl max-w-lg w-full p-6 text-[#EDE4FA] relative shadow-2xl shadow-[#09011B]/95">
            <div className="flex items-center justify-between pb-3 border-b border-[#670CDC]/20 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-[#F7F3FF] font-sans text-sm">
                  {legalModalOpen === 'terms' ? 'Protocol Terms' : 'Privacy Notice'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLegalModalOpen(null)}
                className="text-[#B8A9CC] hover:text-[#F7F3FF] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-[#B8A9CC] font-sans">
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

            <div className="mt-5 pt-3 border-t border-[#670CDC]/20 flex justify-end">
              <button
                type="button"
                onClick={() => setLegalModalOpen(null)}
                className="px-4 py-1.5 rounded-lg bg-[#1E0148] hover:bg-[#280261] border border-[#670CDC]/30 text-[#F7F3FF] text-xs font-mono cursor-pointer"
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
