import React from 'react';
import { ShieldCheck, Wallet, Lock, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { ValticsMark } from '../brand/ValticsLogo';
import { ValticsAgentAvatar } from '../brand/ValticsAgentAvatar';

interface AgentWalletGateProps {
  onOpenWalletModal: () => void;
}

export const AgentWalletGate: React.FC<AgentWalletGateProps> = ({ onOpenWalletModal }) => {
  const { connecting, connect, availableWallets } = useWallet();

  const installedWallet = availableWallets.find((w) => w.installed);

  const handleConnect = async () => {
    if (installedWallet) {
      await connect(installedWallet.adapterKey);
    } else {
      onOpenWalletModal();
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
      {/* Container with institutional glass styling */}
      <div className="relative rounded-2xl border border-zinc-800 bg-[#090d14]/90 p-8 sm:p-10 shadow-2xl backdrop-blur-md overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
          {/* Brand & Mascot Indicator */}
          <div className="flex flex-col items-center gap-2">
            <ValticsAgentAvatar size="lg" glow={true} active={true} />
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-mono mt-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>VALTICS NATIVE INTELLIGENCE</span>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2 max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
              Connect Wallet to Access VALTICS Agent
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed font-sans">
              VALTICS Agent operates as the native intelligence layer of the platform, providing real-time Devnet market scanning, tokenized asset research, and dynamic bonding curve optimization.
            </p>
          </div>

          {/* Non-Custodial Security & Permission Matrix */}
          <div className="w-full max-w-lg bg-[#0c111a] border border-zinc-800/90 rounded-xl p-4 text-left space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Non-Custodial Architecture & Agent Boundaries</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-zinc-400 font-sans">
              <div className="flex items-start gap-2 bg-zinc-900/40 p-2 rounded border border-zinc-800/60">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Reads Devnet public address for context</span>
              </div>
              <div className="flex items-start gap-2 bg-zinc-900/40 p-2 rounded border border-zinc-800/60">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Analyzes your created Devnet pools</span>
              </div>
              <div className="flex items-start gap-2 bg-zinc-900/40 p-2 rounded border border-zinc-800/60">
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>ZERO private key or seed phrase access</span>
              </div>
              <div className="flex items-start gap-2 bg-zinc-900/40 p-2 rounded border border-zinc-800/60">
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>NO autonomous transaction execution</span>
              </div>
            </div>

            <p className="text-[10px] text-zinc-500 font-mono italic">
              Connected Wallet ≠ Agent Wallet Control. All blockchain transactions require your explicit manual review and signature.
            </p>
          </div>

          {/* Action Button */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleConnect}
              disabled={connecting}
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg hover:shadow-white/10 active:scale-[0.98] disabled:opacity-50"
            >
              <Wallet className="w-4 h-4 text-zinc-950" />
              <span>{connecting ? 'Connecting Wallet...' : 'Connect Devnet Wallet'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-950" />
            </button>

            <button
              type="button"
              onClick={onOpenWalletModal}
              className="w-full sm:w-auto px-4 py-3 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-800 transition-colors cursor-pointer"
            >
              Choose Specific Wallet
            </button>
          </div>

          {/* Cluster Note */}
          <div className="pt-2 text-[11px] text-zinc-500 font-mono flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Solana Devnet Cluster · Free Devnet Faucet Available</span>
          </div>
        </div>
      </div>
    </div>
  );
};
