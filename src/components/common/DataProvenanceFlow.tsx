import React from 'react';
import { ArrowRight, ArrowDown, Database, Radio, CheckCircle2, ShieldCheck } from 'lucide-react';

interface DataProvenanceFlowProps {
  className?: string;
}

export const DataProvenanceFlow: React.FC<DataProvenanceFlowProps> = ({ className = '' }) => {
  const steps = [
    {
      id: 'on-chain',
      step: '01',
      title: 'On-chain market',
      desc: 'DBC bonding reserves and spot pricing executed on Solana.',
      badge: 'Solana RPC',
      badgeColor: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40',
      icon: Database,
      accent: 'border-emerald-500/30 group-hover:border-emerald-500/60',
      glow: 'from-emerald-500/10 to-transparent',
    },
    {
      id: 'reference-data',
      step: '02',
      title: 'Reference data',
      desc: 'Benchmark appraisal values and certified external oracle feeds.',
      badge: 'NAV Benchmark',
      badgeColor: 'text-violet-400 bg-violet-950/40 border-violet-800/40',
      icon: Radio,
      accent: 'border-violet-500/30 group-hover:border-violet-500/60',
      glow: 'from-violet-500/10 to-transparent',
    },
    {
      id: 'validation',
      step: '03',
      title: 'Validation',
      desc: 'Automated collateralization verification and legal jurisdiction checks.',
      badge: 'Attestation Engine',
      badgeColor: 'text-sky-400 bg-sky-950/40 border-sky-800/40',
      icon: CheckCircle2,
      accent: 'border-sky-500/30 group-hover:border-sky-500/60',
      glow: 'from-sky-500/10 to-transparent',
    },
    {
      id: 'verified-state',
      step: '04',
      title: 'Verified state',
      desc: 'Cryptographically proven metrics and real-time NAV parity tracking.',
      badge: 'Verified Ledger',
      badgeColor: 'text-amber-400 bg-amber-950/40 border-amber-800/40',
      icon: ShieldCheck,
      accent: 'border-amber-500/30 group-hover:border-amber-500/60',
      glow: 'from-amber-500/10 to-transparent',
    },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Horizontal Flow on Desktop, Vertical on Mobile */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          const isLast = idx === steps.length - 1;

          return (
            <div key={s.id} className="relative group flex flex-col">
              {/* Card Node */}
              <div
                className={`flex-1 p-4 rounded-xl border ${s.accent} bg-[#080d19]/80 backdrop-blur-xs transition-all duration-200 flex flex-col justify-between space-y-3 relative overflow-hidden`}
              >
                {/* Subtle gradient corner */}
                <div
                  className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${s.glow} pointer-events-none rounded-tr-xl opacity-40`}
                />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-[#0f172a] border border-zinc-800 flex items-center justify-center">
                        <Icon className="w-3.5 h-3.5 text-zinc-300" />
                      </div>
                      <span className="font-mono text-[10px] text-zinc-500 font-semibold">{s.step}</span>
                    </div>

                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${s.badgeColor}`}>
                      {s.badge}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-zinc-100 font-sans tracking-tight">
                      {s.title}
                    </h4>
                    <p className="text-[11px] text-zinc-400 font-sans leading-snug mt-1">
                      {s.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#162032] flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                  <span>STATUS</span>
                  <span className="text-emerald-400 flex items-center gap-1 font-sans">
                    <span className="w-1 h-1 rounded-full bg-emerald-400" />
                    Live
                  </span>
                </div>
              </div>

              {/* Desktop connector chevron */}
              {!isLast && (
                <div className="hidden md:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-4 h-4 rounded-full bg-[#0d1424] border border-[#22304d] items-center justify-center text-zinc-400">
                  <ArrowRight className="w-2.5 h-2.5 text-zinc-400" />
                </div>
              )}

              {/* Mobile connector down chevron */}
              {!isLast && (
                <div className="md:hidden flex justify-center py-1">
                  <ArrowDown className="w-3.5 h-3.5 text-zinc-600" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
