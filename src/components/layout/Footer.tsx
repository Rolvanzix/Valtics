import React, { useState } from 'react';
import { ValticsLogo } from '../brand/ValticsLogo';
import { NavigationTab } from './Header';
import { ShieldCheck, FileText, X } from 'lucide-react';

interface FooterProps {
  onSelectTab?: (tab: NavigationTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab }) => {
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);

  return (
    <>
      <footer className="w-full border-t border-[#670CDC]/20 bg-[#060012] py-6 mt-16 text-xs text-[#B8A9CC] select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand & Copyright */}
          <div className="flex items-center gap-3">
            <ValticsLogo size="xs" showText={true} tagline={false} />
            <span className="text-[#670CDC]/40 hidden sm:inline">·</span>
            <span className="text-[11px] text-[#7E6D96] font-mono">
              © {new Date().getFullYear()} VALTICS
            </span>
          </div>

          {/* Essential Navigation | Terms | Privacy */}
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs">
            {onSelectTab && (
              <>
                <button
                  type="button"
                  onClick={() => onSelectTab('overview')}
                  className="text-[#B8A9CC] hover:text-[#F7F3FF] transition-colors cursor-pointer"
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => onSelectTab('explore-assets')}
                  className="text-[#B8A9CC] hover:text-[#F7F3FF] transition-colors cursor-pointer"
                >
                  Screener
                </button>
                <button
                  type="button"
                  onClick={() => onSelectTab('markets')}
                  className="text-[#B8A9CC] hover:text-[#F7F3FF] transition-colors cursor-pointer"
                >
                  Markets
                </button>
                <button
                  type="button"
                  onClick={() => onSelectTab('agent')}
                  className="text-[#B8A9CC] hover:text-[#F7F3FF] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>Agent</span>
                  <span className="text-[9px] font-mono px-1 rounded bg-[#670CDC]/20 text-[#D76EDD] border border-[#670CDC]/30">AI</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectTab('create')}
                  className="text-[#B8A9CC] hover:text-[#F7F3FF] transition-colors cursor-pointer"
                >
                  Create
                </button>
                <span className="text-[#670CDC]/40 hidden sm:inline">|</span>
              </>
            )}

            <button
              type="button"
              onClick={() => setLegalModal('terms')}
              className="text-[#B8A9CC] hover:text-[#F7F3FF] transition-colors cursor-pointer"
            >
              Terms
            </button>
            <span className="text-[#670CDC]/40">·</span>
            <button
              type="button"
              onClick={() => setLegalModal('privacy')}
              className="text-[#B8A9CC] hover:text-[#F7F3FF] transition-colors cursor-pointer"
            >
              Privacy
            </button>
          </nav>

          {/* Active Network Indicator */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[#7E6D96]">Network:</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold uppercase bg-[#1C0142] text-[#F7F3FF] border border-[#670CDC]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F99225]" />
              <span>DEVNET</span>
            </span>
          </div>
        </div>
      </footer>

      {/* Institutional Legal Modal */}
      {legalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-[#0c1018] p-6 shadow-2xl space-y-4 text-xs font-sans text-zinc-300">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                {legalModal === 'terms' ? (
                  <FileText className="w-4 h-4 text-zinc-400" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                )}
                <h3 className="font-semibold text-sm text-zinc-100">
                  {legalModal === 'terms' ? 'Terms of Protocol Use' : 'Privacy & Data Standards'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 leading-relaxed text-zinc-400">
              {legalModal === 'terms' ? (
                <>
                  <p>
                    VALTICS is non-custodial financial infrastructure for tokenized asset markets on Solana. All market creation, bonding curve transactions, and swaps are formulated and signed directly client-side via connected user wallets.
                  </p>
                  <p>
                    Market benchmark prices and asset statistics are sourced from Pyth Network oracle feeds. VALTICS does not custody assets, administer private keys, or execute trades on behalf of users.
                  </p>
                  <p>
                    Users are responsible for ensuring that tokenized asset transactions comply with applicable regulatory frameworks in their respective jurisdictions.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    VALTICS is committed to financial privacy. The platform does not track personal identifying information, sell user data, or inject third-party ad telemetry.
                  </p>
                  <p>
                    Blockchain interactions (public keys, transaction signatures, and bonding curve states) are publicly verifiable records maintained on the Solana blockchain.
                  </p>
                  <p>
                    Client-side preferences are stored strictly locally in your browser session.
                  </p>
                </>
              )}
            </div>

            <div className="pt-3 border-t border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
