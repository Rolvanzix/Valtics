import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Layers, Radio, Zap, ShieldCheck, ExternalLink } from 'lucide-react';

export const TechnicalConceptsBar: React.FC = () => {
  const [expandedConcept, setExpandedConcept] = useState<string | null>(null);

  const concepts = [
    {
      id: 'dbc',
      title: 'Dynamic bonding curves',
      tagline: 'Deterministic pricing',
      icon: Zap,
      accent: 'text-amber-400',
      description:
        'Continuous algorithmic price curve executing directly on Solana via Meteora DBC. Zero liquidation risk, mathematically bounded slippage, and instant trading liquidity.',
      bullet: 'Mathematical invariant with custom starting and migration target price bands.',
    },
    {
      id: 'nav',
      title: 'Reference NAV',
      tagline: 'Audited par benchmarks',
      icon: Radio,
      accent: 'text-violet-400',
      description:
        'Real-world asset appraisal benchmarks provided by accredited issuers, independent oracles, or off-chain fund administrators to monitor market premium/discount.',
      bullet: 'Enables institutional tracking of market-to-NAV spread in real time.',
    },
    {
      id: 'migration',
      title: 'Liquidity migration',
      tagline: 'Automated DAMM v2 graduation',
      icon: Layers,
      accent: 'text-pink-400',
      description:
        'Once bonding curve reserves satisfy target quote thresholds (e.g. 85 SOL or 10,000 USDC), liquidity automatically migrates to Meteora DAMM v2 with permanently locked LP tokens.',
      bullet: 'Non-custodial, deterministic graduation without developer intervention.',
    },
    {
      id: 'provenance',
      title: 'Data provenance',
      tagline: 'Multi-tier cryptographic ledger',
      icon: ShieldCheck,
      accent: 'text-emerald-400',
      description:
        'Segregation of all market metrics into four distinct verification levels: on-chain Solana state, certified external reference, issuer disclosure, and derived calculation.',
      bullet: 'Eliminates ambiguities between on-chain truth and external estimates.',
    },
  ];

  return (
    <div className="rounded-xl border border-[#162033] bg-[#070b15]/70 overflow-hidden">
      {/* 4 Compact Columns */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#162033]">
        {concepts.map((c) => {
          const Icon = c.icon;
          const isExpanded = expandedConcept === c.id;

          return (
            <div key={c.id} className="p-3.5 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`w-3.5 h-3.5 ${c.accent}`} />
                  <span className="text-xs font-semibold text-zinc-200 font-sans">
                    {c.title}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-400 font-sans">
                  {c.tagline}
                </span>

                <button
                  type="button"
                  onClick={() => setExpandedConcept(isExpanded ? null : c.id)}
                  className="text-[10px] font-sans text-amber-400/90 hover:text-amber-300 transition-colors flex items-center gap-0.5 cursor-pointer ml-1"
                >
                  <span>{isExpanded ? 'Less' : 'Learn more'}</span>
                  {isExpanded ? (
                    <ChevronUp className="w-2.5 h-2.5" />
                  ) : (
                    <ChevronDown className="w-2.5 h-2.5" />
                  )}
                </button>
              </div>

              {/* Collapsible deeper explanation (Progressive Disclosure) */}
              {isExpanded && (
                <div className="pt-2 mt-1 border-t border-[#182438] text-[11px] text-zinc-300 space-y-1.5 animate-fadeIn">
                  <p className="leading-relaxed font-sans text-zinc-300">
                    {c.description}
                  </p>
                  <p className="text-[10px] font-mono text-zinc-400 pt-0.5">
                    • {c.bullet}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
