import React from 'react';
import {
  Sparkles,
  Search,
  Compass,
  PlusCircle,
  BookOpen,
  MessageSquareCode,
  LayoutDashboard,
  ShieldCheck,
  Zap,
  Activity,
  ArrowRight,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { useValticsAgent, AgentProvider } from '../../context/AgentContext';
import { AgentWalletGate } from './AgentWalletGate';
import { AgentLandingScreen } from './AgentLandingScreen';
import { AgentStructuredScanner } from './AgentStructuredScanner';
import { AgentExploreView } from './AgentExploreView';
import { AgentMarketCreationWizard } from './AgentMarketCreationWizard';
import { AgentUnderstandView } from './AgentUnderstandView';
import { AgentChatView } from './AgentChatView';
import { ValticsAgentAvatar } from '../brand/ValticsAgentAvatar';
import { AddressBadge } from '../common/AddressBadge';
import { METEORA_DBC_PROGRAM_ID } from '../../config/constants';
import { CurveModelParams } from '../../types';
import { AgentWorkspaceMode } from '../../types/agent';

interface AgentWorkspaceProps {
  onOpenWalletModal: () => void;
  onApplyCurveToCreation: (params: CurveModelParams) => void;
  onNavigateToMarket?: (poolAddress: string) => void;
}

const AgentWorkspaceInner: React.FC<AgentWorkspaceProps> = ({
  onOpenWalletModal,
  onApplyCurveToCreation,
}) => {
  const { connected, publicKeyStr, balanceSol, isWrongNetwork, networkError } = useWallet();
  const { activeView, setActiveView, sendMessage, marketSummary } = useValticsAgent();

  if (!connected) {
    return <AgentWalletGate onOpenWalletModal={onOpenWalletModal} />;
  }

  const handleInspectInChat = (prompt: string) => {
    setActiveView('chat');
    sendMessage(prompt);
  };

  const navModes: Array<{
    id: AgentWorkspaceMode;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'landing', label: 'Workspace Home', icon: LayoutDashboard },
    { id: 'scan', label: 'Scan Market', icon: Search },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'create', label: 'Create Market', icon: PlusCircle },
    { id: 'understand', label: 'Understand', icon: BookOpen },
    { id: 'chat', label: 'Ask Agent', icon: MessageSquareCode },
  ];

  return (
    <div className="space-y-6">
      {/* Top Utility Bar & Mode Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[rgba(138,32,255,0.18)] pb-4">
        {/* Left: Brand Identity with Persona Avatar */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => setActiveView('landing')}
            className="cursor-pointer transition-transform hover:scale-105"
            title="Return to Agent Home"
          >
            <ValticsAgentAvatar size="sm" glow={true} active={true} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#F5F5F7] tracking-tight font-sans">
                Valtics Agent
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#D82AA8]/15 text-[#D82AA8] border border-[#D82AA8]/30">
                Autonomous Core
              </span>
            </div>
            <p className="text-xs text-[#A7A7B8] font-sans mt-0.5">
              AI-powered market intelligence, curve architecture, and risk surveillance on Solana
            </p>
          </div>
        </div>

        {/* Right: Wallet Context Badges */}
        <div className="flex items-center gap-2 font-mono text-xs self-start md:self-auto">
          <div className="bg-[#080821] border border-[rgba(138,32,255,0.25)] px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span className="text-[#66667A]">Wallet:</span>
            {publicKeyStr ? (
              <AddressBadge address={publicKeyStr} showCopy={true} />
            ) : (
              <span className="text-[#F5F5F7]">Connected</span>
            )}
          </div>

          <div className="bg-[#080821] border border-[rgba(138,32,255,0.25)] px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <span className="text-[#66667A]">Devnet:</span>
            <span className="text-emerald-400 font-semibold">
              {balanceSol !== null ? balanceSol.toFixed(3) : '0.000'} SOL
            </span>
          </div>
        </div>
      </div>

      {/* Wrong Network Recovery Banner */}
      {isWrongNetwork && (
        <div className="bg-rose-950/40 border border-rose-800/80 rounded-xl p-4 text-xs text-rose-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-rose-300">Solana Devnet Required</h4>
            <p>{networkError || 'Your connected wallet is not on Solana Devnet. All intelligence scanning and curve preparation are restricted to Devnet.'}</p>
            <p className="text-[11px] text-rose-400 font-mono">Please open your wallet settings and select Developer Settings → Change Network to Devnet.</p>
          </div>
        </div>
      )}

      {/* Mode Navigation Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none select-none border-b border-[rgba(138,32,255,0.18)]">
        {navModes.map((mode) => {
          const Icon = mode.icon;
          const isActive = activeView === mode.id;

          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => setActiveView(mode.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#6010F0] text-white font-semibold shadow-xs'
                  : 'text-[#A7A7B8] hover:text-[#F5F5F7] hover:bg-[#080821]'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 ${
                  isActive ? 'text-[#FF8A20]' : 'text-[#66667A]'
                }`}
              />
              <span>{mode.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Workspace Layout (Center Main Workspace + Optional Right Telemetry Rail) */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Agent Workspace (3 cols on large displays, 4 on mobile) */}
        <div className="xl:col-span-3 min-w-0">
          {activeView === 'landing' && (
            <AgentLandingScreen onSelectMode={(mode) => setActiveView(mode)} />
          )}

          {activeView === 'scan' && (
            <AgentStructuredScanner
              onInspectInChat={handleInspectInChat}
              onNavigateToCreate={() => setActiveView('create')}
            />
          )}

          {activeView === 'explore' && (
            <AgentExploreView onExploreInChat={handleInspectInChat} />
          )}

          {activeView === 'create' && (
            <AgentMarketCreationWizard onApplyCurveToCreation={onApplyCurveToCreation} />
          )}

          {activeView === 'understand' && (
            <AgentUnderstandView onAskConceptInChat={handleInspectInChat} />
          )}

          {activeView === 'chat' && (
            <AgentChatView onApplyCurveToCreation={onApplyCurveToCreation} />
          )}
        </div>

        {/* Right Contextual Information Panel (1 col on desktop, clean collapsible / stacked) */}
        <div className="space-y-4">
          {/* Persona Card */}
          <div className="rounded-xl border border-[#670CDC]/25 bg-[#140130] p-4 space-y-3 shadow-md shadow-[#09011B]/60">
            <div className="flex items-center gap-3">
              <ValticsAgentAvatar size="md" glow={true} active={true} />
              <div>
                <h4 className="text-xs font-bold text-[#F7F3FF] font-sans">VALTICS Persona</h4>
                <span className="text-[10px] text-[#D76EDD] font-mono">Cybernetic Core v1.4</span>
              </div>
            </div>

            <p className="text-[11px] text-[#B8A9CC] font-sans leading-relaxed">
              Specialized institutional intelligence analyst for Meteora Dynamic Bonding Curves and Solana tokenized assets.
            </p>

            <div className="pt-2 border-t border-[#670CDC]/20 space-y-1.5 text-[11px] font-mono">
              <div className="flex justify-between">
                <span className="text-[#7E6D96]">Status:</span>
                <span className="text-emerald-400 font-semibold">Online & Verified</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7E6D96]">Cluster:</span>
                <span className="text-[#F99225] font-semibold">Solana Devnet</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7E6D96]">Authority:</span>
                <span className="text-[#EDE4FA]">Non-Custodial</span>
              </div>
            </div>
          </div>

          {/* Observed Devnet Telemetry */}
          <div className="rounded-xl border border-[#670CDC]/25 bg-[#140130] p-4 space-y-3 font-mono text-xs shadow-md shadow-[#09011B]/60">
            <div className="flex items-center justify-between border-b border-[#670CDC]/20 pb-2">
              <span className="text-[#B8A9CC] font-semibold text-[11px] uppercase">Observed Telemetry</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-[#7E6D96]">Active DBC Pools:</span>
                <span className="text-[#F7F3FF] font-bold">{marketSummary?.totalMarkets ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7E6D96]">Avg Progress:</span>
                <span className="text-emerald-400 font-bold">{marketSummary?.avgCurveProgress ?? 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7E6D96]">Near DAMM:</span>
                <span className="text-[#F99225] font-bold">{marketSummary?.nearGraduationCount ?? 0}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#670CDC]/20">
              <span className="text-[#7E6D96] text-[10px] block uppercase mb-1">Meteora DBC Program</span>
              <span className="text-[10px] text-[#EDE4FA] break-all font-mono">
                {METEORA_DBC_PROGRAM_ID}
              </span>
            </div>
          </div>

          {/* Non-Custodial Security Card */}
          <div className="rounded-xl border border-emerald-500/30 bg-[#100126] p-4 space-y-2.5 text-xs font-sans shadow-md shadow-[#09011B]/60">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs font-mono">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>TRANSACTION SECURITY BOUNDARY</span>
            </div>
            
            <div className="space-y-1.5 font-mono text-[10px] text-[#EDE4FA]">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-[#1C0142] border border-[#670CDC]/30 text-[#D76EDD] flex items-center justify-center font-bold text-[9px]">1</span>
                <span className="text-[#7E6D96]">READ:</span>
                <span className="text-[#EDE4FA]">Public Devnet & Pyth state</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-[#1C0142] border border-[#670CDC]/30 text-[#D76EDD] flex items-center justify-center font-bold text-[9px]">2</span>
                <span className="text-[#7E6D96]">PREPARE:</span>
                <span className="text-[#EDE4FA]">Agent parameter draft</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold text-[9px]">3</span>
                <span className="text-emerald-400 font-semibold">APPROVE:</span>
                <span className="text-[#EDE4FA]">Explicit user review</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-emerald-900 border border-emerald-400/50 text-emerald-200 flex items-center justify-center font-bold text-[9px]">4</span>
                <span className="text-emerald-300 font-semibold">EXECUTE:</span>
                <span className="text-[#EDE4FA]">Connected browser wallet</span>
              </div>
            </div>

            <p className="text-[10px] text-[#B8A9CC] pt-1 border-t border-[#670CDC]/20 leading-relaxed">
              VALTICS Agent operates zero-custody. The Agent will <strong className="text-[#F7F3FF]">NEVER</strong> access private keys, sign transactions, or execute on-chain instructions autonomously.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AgentWorkspace: React.FC<AgentWorkspaceProps> = (props) => {
  return (
    <AgentProvider>
      <AgentWorkspaceInner {...props} />
    </AgentProvider>
  );
};
