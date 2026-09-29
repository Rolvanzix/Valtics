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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
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
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
                VALTICS AGENT
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-500/30">
                MARKET INTELLIGENCE
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-sans">
              AI-powered market intelligence, research and guidance inside VALTICS
            </p>
          </div>
        </div>

        {/* Right: Wallet Context Badges */}
        <div className="flex items-center gap-2 font-mono text-xs self-start md:self-auto">
          <div className="bg-zinc-900/90 border border-zinc-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span className="text-zinc-500">Wallet:</span>
            {publicKeyStr ? (
              <AddressBadge address={publicKeyStr} showCopy={true} />
            ) : (
              <span className="text-zinc-400">Connected</span>
            )}
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <span className="text-zinc-500">Devnet:</span>
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
            <p className="text-[11px] text-rose-400 font-mono">Please open your wallet extension (Phantom/Solflare) settings and select Developer Settings → Change Network to Testnet/Devnet.</p>
          </div>
        </div>
      )}

      {/* Mode Navigation Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none select-none border-b border-zinc-800/60">
        {navModes.map((mode) => {
          const Icon = mode.icon;
          const isActive = activeView === mode.id;

          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => setActiveView(mode.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-zinc-800 text-white font-semibold border border-zinc-700 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 ${
                  isActive ? 'text-purple-400' : 'text-zinc-500'
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
          <div className="rounded-xl border border-zinc-800 bg-[#090d14]/90 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <ValticsAgentAvatar size="md" glow={true} active={true} />
              <div>
                <h4 className="text-xs font-bold text-white font-sans">VALTICS Persona</h4>
                <span className="text-[10px] text-purple-400 font-mono">Cybernetic Core v1.4</span>
              </div>
            </div>

            <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
              Specialized institutional intelligence analyst for Meteora Dynamic Bonding Curves and Solana tokenized assets.
            </p>

            <div className="pt-2 border-t border-zinc-800/80 space-y-1.5 text-[11px] font-mono">
              <div className="flex justify-between">
                <span className="text-zinc-500">Status:</span>
                <span className="text-emerald-400 font-semibold">Online & Verified</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Cluster:</span>
                <span className="text-amber-400">Solana Devnet</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Authority:</span>
                <span className="text-zinc-300">Non-Custodial</span>
              </div>
            </div>
          </div>

          {/* Observed Devnet Telemetry */}
          <div className="rounded-xl border border-zinc-800 bg-[#090d14]/90 p-4 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
              <span className="text-zinc-400 font-semibold text-[11px] uppercase">Observed Telemetry</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-zinc-500">Active DBC Pools:</span>
                <span className="text-zinc-200 font-bold">{marketSummary?.totalMarkets ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Avg Progress:</span>
                <span className="text-emerald-400 font-bold">{marketSummary?.avgCurveProgress ?? 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Near DAMM:</span>
                <span className="text-cyan-400 font-bold">{marketSummary?.nearGraduationCount ?? 0}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800/80">
              <span className="text-zinc-500 text-[10px] block uppercase mb-1">Meteora DBC Program</span>
              <span className="text-[10px] text-zinc-300 break-all font-mono">
                {METEORA_DBC_PROGRAM_ID}
              </span>
            </div>
          </div>

          {/* Non-Custodial Security Card */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-4 space-y-2.5 text-xs font-sans">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs font-mono">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>TRANSACTION SECURITY BOUNDARY</span>
            </div>
            
            <div className="space-y-1.5 font-mono text-[10px] text-zinc-300">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold text-[9px]">1</span>
                <span className="text-zinc-400">READ:</span>
                <span className="text-zinc-200">Public Devnet & Pyth state</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold text-[9px]">2</span>
                <span className="text-zinc-400">PREPARE:</span>
                <span className="text-zinc-200">Agent parameter draft</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-emerald-800/80 text-emerald-200 flex items-center justify-center font-bold text-[9px]">3</span>
                <span className="text-emerald-400 font-semibold">APPROVE:</span>
                <span className="text-zinc-200">Explicit user review</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-emerald-700 text-emerald-100 flex items-center justify-center font-bold text-[9px]">4</span>
                <span className="text-emerald-300 font-semibold">EXECUTE:</span>
                <span className="text-zinc-200">Connected browser wallet</span>
              </div>
            </div>

            <p className="text-[10px] text-zinc-400 pt-1 border-t border-zinc-800/80 leading-relaxed">
              VALTICS Agent operates zero-custody. The Agent will <strong>NEVER</strong> access private keys, sign transactions, or execute on-chain instructions autonomously.
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
