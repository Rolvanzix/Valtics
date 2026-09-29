import React from 'react';
import {
  Compass,
  Search,
  PlusCircle,
  BookOpen,
  MessageSquareCode,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Layers,
  Cpu,
} from 'lucide-react';
import { ValticsAgentAvatar } from '../brand/ValticsAgentAvatar';
import { AgentWorkspaceMode } from '../../types/agent';
import { useValticsAgent } from '../../context/AgentContext';

interface AgentLandingScreenProps {
  onSelectMode: (mode: AgentWorkspaceMode) => void;
}

export const AgentLandingScreen: React.FC<AgentLandingScreenProps> = ({ onSelectMode }) => {
  const { marketSummary } = useValticsAgent();

  const startingActions: Array<{
    id: AgentWorkspaceMode;
    title: string;
    description: string;
    badge: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    borderHover: string;
    buttonText: string;
  }> = [
    {
      id: 'scan',
      title: 'SCAN MARKET',
      description: 'Analyze a market and identify relevant information, key variables, and risk factors.',
      badge: 'Deep Inspection',
      icon: Search,
      accentColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      borderHover: 'hover:border-cyan-500/50 hover:bg-cyan-950/10',
      buttonText: 'Launch Market Scanner',
    },
    {
      id: 'explore',
      title: 'EXPLORE',
      description: 'Investigate a market or topic through structured, guided institutional research.',
      badge: 'Guided Research',
      icon: Compass,
      accentColor: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
      borderHover: 'hover:border-violet-500/50 hover:bg-violet-950/10',
      buttonText: 'Explore Topics',
    },
    {
      id: 'create',
      title: 'CREATE MARKET',
      description: 'Get guided through the 10-step process of defining an on-chain market without ambiguity.',
      badge: 'Curve Architect',
      icon: PlusCircle,
      accentColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      borderHover: 'hover:border-emerald-500/50 hover:bg-emerald-950/10',
      buttonText: 'Start Guided Creation',
    },
    {
      id: 'understand',
      title: 'UNDERSTAND',
      description: 'Learn about VALTICS, Meteora Dynamic Bonding Curves, or specific financial concepts.',
      badge: 'Knowledge Hub',
      icon: BookOpen,
      accentColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      borderHover: 'hover:border-amber-500/50 hover:bg-amber-950/10',
      buttonText: 'Review Architecture',
    },
    {
      id: 'chat',
      title: 'ASK AGENT',
      description: 'Start a natural conversation with the Agent for custom inquiries, audits, and prompts.',
      badge: 'Interactive Intelligence',
      icon: MessageSquareCode,
      accentColor: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
      borderHover: 'hover:border-pink-500/50 hover:bg-pink-950/10',
      buttonText: 'Open Terminal',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Primary Identity Hero Card */}
      <div className="relative rounded-2xl border border-[#670CDC]/30 bg-[#1C0142]/85 p-6 sm:p-8 backdrop-blur-md overflow-hidden shadow-2xl shadow-[#09011B]/80">
        {/* Subtle Brand Ambient Lighting */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#670CDC]/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#F99225]/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
          {/* Brand Persona Mascot Avatar */}
          <div className="shrink-0 flex flex-col items-center">
            <ValticsAgentAvatar size="xl" glow={true} active={true} />
            <span className="mt-2 text-[10px] font-mono text-[#D76EDD] uppercase tracking-wider font-semibold">
              AGENT ONLINE
            </span>
          </div>

          {/* Core Content */}
          <div className="space-y-3 text-center md:text-left flex-1 min-w-0">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#140130] border border-[#670CDC]/30 text-[11px] font-mono text-[#D76EDD]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F99225] animate-pulse" />
              <span>SOLANA DEVNET INTELLIGENCE LAYER</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#F7F3FF] tracking-tight font-sans">
              VALTICS AGENT
            </h2>

            <p className="text-sm sm:text-base text-[#F7F3FF] font-sans max-w-2xl leading-relaxed">
              AI-powered market intelligence, research and guidance inside VALTICS.
            </p>

            <p className="text-xs text-[#B8A9CC] font-sans max-w-2xl leading-relaxed">
              Scan active bonding curves, evaluate liquidity factors, formulate non-custodial market parameters, and explore tokenized asset mechanics. The Agent assists your decision-making while you retain full transaction approval authority.
            </p>

            {/* Live Stats Ticker */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 max-w-xl text-left">
              <div className="bg-[#140130]/80 border border-[#670CDC]/20 rounded-lg p-2 font-mono">
                <span className="text-[10px] text-[#7E6D96] block uppercase">Devnet Markets</span>
                <span className="text-sm font-bold text-[#F7F3FF]">
                  {marketSummary?.totalMarkets ?? 0} Active
                </span>
              </div>
              <div className="bg-[#140130]/80 border border-[#670CDC]/20 rounded-lg p-2 font-mono">
                <span className="text-[10px] text-[#7E6D96] block uppercase">Curve Progress</span>
                <span className="text-sm font-bold text-[#F99225]">
                  {marketSummary?.avgCurveProgress ?? 0}% Avg
                </span>
              </div>
              <div className="bg-[#140130]/80 border border-[#670CDC]/20 rounded-lg p-2 font-mono">
                <span className="text-[10px] text-[#7E6D96] block uppercase">Program Core</span>
                <span className="text-sm font-bold text-[#D76EDD]">Meteora DBC</span>
              </div>
              <div className="bg-[#140130]/80 border border-[#670CDC]/20 rounded-lg p-2 font-mono">
                <span className="text-[10px] text-[#7E6D96] block uppercase">Control Mode</span>
                <span className="text-sm font-bold text-[#B8A9CC]">Non-Custodial</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Starting Actions Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
            Intelligence Starting Actions
          </h3>
          <span className="text-[11px] text-zinc-500 font-mono">Select a workflow to begin</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {startingActions.map((action) => {
            const Icon = action.icon;
            return (
              <div
                key={action.id}
                onClick={() => onSelectMode(action.id)}
                className={`group rounded-xl border border-zinc-800/90 bg-[#090d14]/70 p-5 transition-all cursor-pointer flex flex-col justify-between space-y-4 ${action.borderHover}`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg border ${action.accentColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                      {action.badge}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-zinc-100 group-hover:text-white transition-colors">
                      {action.title}
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed font-sans">
                      {action.description}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs font-medium text-zinc-300 group-hover:text-white">
                  <span>{action.buttonText}</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strict Non-Custodial Boundaries Footer Banner */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-400 font-sans">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Institutional Trust Guardrail:</strong> VALTICS Agent evaluates observable facts and formulates proposals. It cannot independently execute or sign transactions.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] text-zinc-500">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span>Solana Devnet Cluster</span>
        </div>
      </div>
    </div>
  );
};
