import React from 'react';
import { 
  Compass, 
  Layers, 
  Sliders, 
  PlusCircle, 
  Coins, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  TrendingUp, 
  Sparkles,
  HelpCircle,
  Zap,
  Lock
} from 'lucide-react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ValticsMark } from '../brand/ValticsLogo';
import { NavigationTab } from '../layout/Header';

interface PlatformPrimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavigationTab) => void;
}

export const PlatformPrimerModal: React.FC<PlatformPrimerModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const steps = [
    {
      tab: 'overview' as NavigationTab,
      num: '01',
      title: 'Real-Time Telemetry & Ecosystem Pulse',
      desc: 'Monitor network TPS, total volume locked, average graduation rates, and top-performing tokenized asset pools on Solana.',
      icon: Compass,
      color: 'from-violet-500/20 to-violet-500/5 text-violet-400 border-violet-500/30',
    },
    {
      tab: 'markets' as NavigationTab,
      num: '02',
      title: 'Live RWA Markets & Price Discovery',
      desc: 'Browse tokenized treasury bills, carbon credits, private credit, and commodities trading along deterministic bonding curves.',
      icon: Layers,
      color: 'from-pink-500/20 to-pink-500/5 text-pink-400 border-pink-500/30',
    },
    {
      tab: 'studio' as NavigationTab,
      num: '03',
      title: 'Interactive Curve Studio',
      desc: 'Simulate Linear, Exponential, and Sigmoid pricing curves before committing funds. Calculate slippage, depth, and graduation targets.',
      icon: Sliders,
      color: 'from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/30',
    },
    {
      tab: 'create' as NavigationTab,
      num: '04',
      title: 'No-Code Market Deployment',
      desc: 'Deploy a production Meteora Dynamic Bonding Curve pool in 4 simple steps with verified rent reserves and smart contract preflight safety.',
      icon: PlusCircle,
      color: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/30',
    },
    {
      tab: 'my-markets' as NavigationTab,
      num: '05',
      title: 'Creator Authority & Fee Claims',
      desc: 'Track accrued trading fees across your deployed pools and execute cryptographic claim instructions directly to your connected wallet.',
      icon: Coins,
      color: 'from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/30',
    },
    {
      tab: 'agent' as NavigationTab,
      num: '06',
      title: 'VALTICS Agent Native Intelligence',
      desc: 'Scan Devnet markets, evaluate bonding curve health, research tokenized subjects, and synthesize tailored curve models for your assets.',
      icon: Sparkles,
      color: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/30',
    },
  ];

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <ValticsMark size={24} glow />
          <span className="text-[#F7F3FF] font-bold text-base">
            VALTICS Architecture & Platform Guide
          </span>
          <Badge variant="brand" size="xs">
            Simple Guide
          </Badge>
        </div>
      }
      description="Understand how Meteora Dynamic Bonding Curves deliver programmable liquidity for tokenized assets"
      maxWidth="3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-[#7E6D96] font-mono">
            Meteora DBC · Solana Program Architecture
          </span>
          <Button
            variant="brand"
            size="sm"
            onClick={() => {
              onClose();
              onNavigate('studio');
            }}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Launch Curve Simulator
          </Button>
        </div>
      }
    >
      <div className="space-y-6 text-xs text-[#B8A9CC] py-1 font-sans">
        {/* The 3-Phase Lifecycle Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-[#1C0142] via-[#140130] to-[#1C0142] border border-[#670CDC]/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[#F7F3FF] text-xs uppercase tracking-wider font-sans flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#F99225]" />
              <span>The 3-Phase Market Lifecycle (Brand Spectrum)</span>
            </span>
            <span className="text-[10px] font-mono text-[#D76EDD]">Zero Impermanent Loss</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Phase 1 */}
            <div className="p-3 rounded-lg bg-[#120128] border border-[#670CDC]/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[#670CDC] uppercase">
                  Phase 1 · Genesis
                </span>
                <span className="w-2 h-2 rounded-full bg-[#670CDC]" />
              </div>
              <h4 className="font-bold text-[#F7F3FF] text-xs">Deterministic Pricing</h4>
              <p className="text-[11px] text-[#B8A9CC] leading-relaxed">
                Initial supply is deposited in the pool vault PDA. Buyers execute deterministic swaps along the mathematical curve with 0 liquidity fragmentation.
              </p>
            </div>

            {/* Phase 2 */}
            <div className="p-3 rounded-lg bg-[#120128] border border-[#D76EDD]/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[#D76EDD] uppercase">
                  Phase 2 · Dynamic Bonding
                </span>
                <span className="w-2 h-2 rounded-full bg-[#D76EDD] animate-pulse" />
              </div>
              <h4 className="font-bold text-[#F7F3FF] text-xs">Autonomous Depth</h4>
              <p className="text-[11px] text-[#B8A9CC] leading-relaxed">
                As buy volume enters, quote currency accumulates in the vault. Trading fees (e.g. 0.25%) accrue dynamically to the creator authority.
              </p>
            </div>

            {/* Phase 3 */}
            <div className="p-3 rounded-lg bg-[#120128] border border-[#F99225]/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[#F99225] uppercase">
                  Phase 3 · AMM Graduation
                </span>
                <span className="w-2 h-2 rounded-full bg-[#F99225]" />
              </div>
              <h4 className="font-bold text-[#F7F3FF] text-xs">Permanent DAMM Migration</h4>
              <p className="text-[11px] text-[#B8A9CC] leading-relaxed">
                Reaching the graduation threshold automatically triggers LP migration to Meteora DAMM, locking perpetual deep liquidity forever.
              </p>
            </div>
          </div>
        </div>

        {/* How to navigate the platform */}
        <div className="space-y-2.5">
          <h3 className="font-bold text-[#F7F3FF] text-xs uppercase tracking-wider font-sans">
            How to Navigate VALTICS
          </h3>
          <div className="space-y-2">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  onClick={() => {
                    onClose();
                    onNavigate(step.tab);
                  }}
                  className="p-3 rounded-xl bg-[#140130] hover:bg-[#1C0142] border border-[#670CDC]/25 hover:border-[#670CDC]/60 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg border bg-gradient-to-br ${step.color} shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-[#7E6D96]">{step.num}</span>
                        <h4 className="font-semibold text-[#EDE4FA] text-xs group-hover:text-[#F7F3FF] truncate">
                          {step.title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-[#B8A9CC] mt-0.5 leading-snug line-clamp-1">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#7E6D96] group-hover:text-[#F99225] shrink-0 group-hover:translate-x-0.5 transition-all" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Institutional Safeguards Checklist */}
        <div className="p-3.5 rounded-xl bg-[#100126] border border-[#670CDC]/20 space-y-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7E6D96] font-sans block">
            Institutional Safeguards Embedded in Every Action
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#EDE4FA]">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong className="text-[#F7F3FF]">Preflight Simulation:</strong> Every transaction previews required signers, writable accounts, and exact fees.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong className="text-[#F7F3FF]">Non-Custodial:</strong> Liquidity is held strictly by Solana Program Derived Addresses (PDAs).</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong className="text-[#F7F3FF]">Solana Devnet:</strong> Deploy and test verifiable bonding curve liquidity safely on Solana Devnet.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong className="text-[#F7F3FF]">Verifiable Ledger:</strong> Direct transaction hash inspection on the Solana ledger at any time.</span>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
