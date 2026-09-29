import React, { useState } from 'react';
import {
  BookOpen,
  HelpCircle,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Layers,
  Sparkles,
  MessageSquareCode,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { METEORA_DBC_PROGRAM_ID } from '../../config/constants';

interface AgentUnderstandViewProps {
  onAskConceptInChat: (query: string) => void;
}

export const AgentUnderstandView: React.FC<AgentUnderstandViewProps> = ({ onAskConceptInChat }) => {
  const [expandedId, setExpandedId] = useState<string>('dbc-core');

  const concepts = [
    {
      id: 'dbc-core',
      title: 'What is a Meteora Dynamic Bonding Curve (DBC)?',
      badge: 'Core Protocol',
      summary: 'Continuous deterministic on-chain liquidity pricing governed by mathematical curve functions.',
      content: `A Dynamic Bonding Curve is an on-chain smart contract that acts as an autonomous counterparty for token trades. Instead of relying on centralized market makers or thinly-traded orderbooks, trades interact directly with the program's vault.

Key Advantages:
- Guaranteed Execution: Every buy mints tokens from the curve vault; every sell burns or deposits tokens back.
- Mathematical Determinism: Spot price is calculated from reserve ratios according to the chosen algorithm (Linear, Sigmoid, or Exponential).
- Zero Spread Exploitation: Trading fee spreads accrue directly to the liquidity pool and issuer rather than intermediaries.`,
      suggestedQuery: 'Explain the mathematical mechanics behind Meteora Dynamic Bonding Curves on Solana.',
    },
    {
      id: 'migration',
      title: 'How does Automated DAMM Graduation work?',
      badge: 'Lifecycle',
      summary: 'The atomic milestone where bonding curve liquidity transitions into a permanent Automated Market Maker pool.',
      content: `The bonding curve serves as the initial price discovery phase. Once buyers accumulate the designated quote reserve target (e.g., 10,000 Devnet USDC or 100 Devnet SOL), the curve achieves 100% threshold completion.

At this point:
1. The Meteora contract triggers an atomic migration instruction.
2. The entire accumulated quote reserve and remaining token supply are deposited into a Meteora Dynamic AMM (DAMM) pool.
3. Liquidity is permanently locked according to the issuer-specified vesting duration (30-365 days).
4. Trading continues perpetually on the open AMM with deep liquidity.`,
      suggestedQuery: 'What happens to liquidity when a bonding curve reaches the graduation threshold on Solana Devnet?',
    },
    {
      id: 'quote-assets',
      title: 'Devnet Quote Assets: Devnet USDC vs Devnet SOL',
      badge: 'Denomination',
      summary: 'Selecting the appropriate reserve currency for your asset archetype.',
      content: `VALTICS operates strictly on Solana Devnet with two standard quote mints:

1. Devnet USDC (4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU):
   - Decimals: 6
   - Best for: Stable Real-World Assets, Treasury bills, sovereign debt, and private credit notes. Prevents baseline price volatility caused by SOL price swings.

2. Devnet Wrapped SOL (So11111111111111111111111111111111111111112):
   - Decimals: 9
   - Best for: Native Solana ecosystem tokens, experimental utility assets, and community governance. Free faucet SOL can be used directly.`,
      suggestedQuery: 'How should an issuer choose between Devnet USDC and Devnet SOL as the quote mint for a bonding curve?',
    },
    {
      id: 'anti-sniper',
      title: 'Anti-Sniper Protection & Slot Rate Limiting',
      badge: 'Security',
      summary: 'Neutralizing MEV frontrunners and bot snipers on token launch.',
      content: `In standard token launches, bot swarms frequently exploit block 0 by purchasing substantial supply in the same block as deployment, dumping on genuine participants moments later.

Meteora DBC solves this via anti-sniper slot windows:
- Across the first 40 to 100 slots (~16 to 40 seconds on Solana), maximum buy volume per wallet is strictly rate-limited.
- Large volume spikes trigger elevated dynamic fee degradation.
- This creates an egalitarian launch environment where human market participants can participate on equal footing.`,
      suggestedQuery: 'How does the anti-sniper rate limiter protect market creators and genuine participants during pool launch?',
    },
    {
      id: 'non-custodial',
      title: 'Non-Custodial Architecture: Connected Wallet ≠ Agent Control',
      badge: 'Safety Invariant',
      summary: 'Why the Agent advises but never signs or initiates transactions autonomously.',
      content: `VALTICS maintains strict institutional boundaries:
- The Agent operates purely as an analytical intelligence layer.
- The Agent can synthesize curve proposals and detect ambiguities, but CANNOT broadcast or sign Solana transactions.
- All blockchain operations (market deployment, swaps, liquidity claims) require your explicit manual review and signature via your browser wallet (Phantom, Solflare, etc.).
- Your private keys and seed phrases are never accessed, requested, or transmitted.`,
      suggestedQuery: 'Explain the non-custodial security model of VALTICS Agent and why human approval is mandatory.',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-800 bg-[#090d14]/90 p-5 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/30">
            KNOWLEDGE BASE
          </span>
          <span className="text-[11px] text-zinc-500 font-mono">VALTICS Platform Architecture</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
          Understand VALTICS & Bonding Curve Mechanics
        </h2>
        <p className="text-xs text-zinc-400 font-sans max-w-2xl">
          Learn how Meteora Dynamic Bonding Curves, autonomous pricing, and non-custodial graduation operate on Solana Devnet.
        </p>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {concepts.map((concept) => {
          const isExpanded = expandedId === concept.id;

          return (
            <div
              key={concept.id}
              className={`rounded-xl border transition-all ${
                isExpanded
                  ? 'border-amber-500/40 bg-[#0a0e17]'
                  : 'border-zinc-800 bg-[#090d14]/70 hover:border-zinc-700'
              }`}
            >
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? '' : concept.id)}
                className="w-full p-4 sm:p-5 flex items-center justify-between text-left cursor-pointer"
              >
                <div className="space-y-1 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                      {concept.badge}
                    </span>
                    <h3 className="font-bold text-sm text-zinc-100">{concept.title}</h3>
                  </div>
                  <p className="text-xs text-zinc-400 font-sans">{concept.summary}</p>
                </div>

                <div className="p-1 rounded bg-zinc-800/60 text-zinc-400 shrink-0">
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 sm:px-5 pb-5 pt-2 border-t border-zinc-800/80 space-y-4">
                  <div className="text-xs text-zinc-300 leading-relaxed font-sans whitespace-pre-line space-y-2">
                    {concept.content}
                  </div>

                  <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                    <span className="text-[11px] text-zinc-500 font-mono">
                      Have specific questions about this concept?
                    </span>

                    <button
                      type="button"
                      onClick={() => onAskConceptInChat(concept.suggestedQuery)}
                      className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-700"
                    >
                      <MessageSquareCode className="w-3.5 h-3.5 text-amber-400" />
                      <span>Ask Agent</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
