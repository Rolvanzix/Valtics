import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Cpu, Terminal, CheckCircle2 } from 'lucide-react';
import { ValticsAgentAvatar } from '../brand/ValticsAgentAvatar';
import { NavigationTab } from '../layout/Header';

interface AgentActivityCommandCardProps {
  onSelectTab: (tab: NavigationTab) => void;
}

export const AgentActivityCommandCard: React.FC<AgentActivityCommandCardProps> = ({
  onSelectTab,
}) => {
  return (
    <div className="valtics-card p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden h-full space-y-4">
      {/* Background Glow */}
      <div 
        className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none blur-3xl opacity-25"
        style={{ background: 'radial-gradient(circle, #D82AA8 0%, #6010F0 60%, transparent 100%)' }}
      />

      <div className="space-y-4 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(138,32,255,0.18)] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[rgba(216,42,168,0.15)] border border-[rgba(216,42,168,0.3)] flex items-center justify-center text-[#D82AA8]">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F5F5F7] tracking-tight">
                Valtics Agent Core
              </h3>
              <span className="text-[10px] text-[#A7A7B8] font-mono block">
                Autonomous On-Chain Architecture
              </span>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active
          </span>
        </div>

        {/* Single Cohesive Agent Identity Box */}
        <div className="bg-[#05051a]/95 border border-[rgba(138,32,255,0.25)] rounded-xl p-4 flex flex-col sm:flex-row items-center sm:items-start gap-4 shadow-xl">
          <ValticsAgentAvatar size="md" glow={true} active={true} />
          <div className="space-y-2 min-w-0 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="text-sm font-bold text-[#F5F5F7]">Curve Intelligence</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                Risk Guard 100%
              </span>
            </div>
            <p className="text-xs text-[#A7A7B8] leading-relaxed">
              Surveilling bonding curves, quote reserves, and live oracle benchmarks in real time.
            </p>
            <div className="flex items-center justify-center sm:justify-start gap-3 pt-1 text-[11px] font-mono text-[#66667A]">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Solana Devnet
              </span>
              <span>·</span>
              <span className="text-[#A7A7B8]">Non-Custodial</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-2 relative z-10">
        <button
          type="button"
          onClick={() => onSelectTab('agent')}
          className="w-full valtics-button text-xs font-semibold py-2.5 justify-center cursor-pointer shadow-md"
        >
          <span>Launch Agent Workspace</span>
          <ArrowRight className="w-3.5 h-3.5 text-white" />
        </button>
      </div>
    </div>
  );
};
