import React from 'react';
import { X, Shield, Key, ExternalLink, AlertCircle, Lock, ShieldCheck } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { AddressBadge } from './AddressBadge';
import { formatCurrency } from '../../utils/format';
import { ValticsMark } from '../brand/ValticsLogo';
import { sanitizeUrl } from '../../utils/security';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const {
    connected,
    connecting,
    publicKeyStr,
    balanceSol,
    walletName,
    availableWallets,
    connect,
    disconnect,
    requestDevnetAirdrop,
    error,
  } = useWallet();

  const [airdropping, setAirdropping] = React.useState(false);
  const [airdropMsg, setAirdropMsg] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleExternalLink = (url: string) => {
    const safeUrl = sanitizeUrl(url);
    if (safeUrl && safeUrl !== '#') {
      window.open(safeUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      id="wallet-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        id="wallet-modal-container"
        className="w-full max-w-md bg-[#0c101a] border border-zinc-800 rounded-xl p-5 text-zinc-200 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <ValticsMark size={24} glow />
            <h3 className="font-bold text-base tracking-tight text-white font-sans">
              {connected ? 'Solana Account' : 'Connect Solana Wallet'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {connected ? (
          <div className="space-y-4">
            <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Active Provider</span>
                <span className="font-medium text-zinc-200">{walletName || 'Solana Wallet'}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Public Address</span>
                <AddressBadge address={publicKeyStr || ''} head={6} tail={6} />
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Native SOL Balance</span>
                <span className="font-mono-nums font-semibold text-zinc-100">
                  {balanceSol !== null ? formatCurrency(balanceSol, 'SOL') : 'Loading...'}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={airdropping}
                onClick={async () => {
                  setAirdropping(true);
                  setAirdropMsg(null);
                  const ok = await requestDevnetAirdrop();
                  setAirdropping(false);
                  setAirdropMsg(
                    ok ? 'Airdrop requested successfully!' : 'Airdrop rate limit reached. Please use a devnet faucet.'
                  );
                }}
                className="w-full py-2 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium transition-colors cursor-pointer"
              >
                {airdropping ? 'Requesting 1 SOL...' : 'Request 1 Devnet SOL'}
              </button>
            </div>

            {airdropMsg && (
              <p className="text-[11px] text-zinc-400 text-center">{airdropMsg}</p>
            )}

            <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-lg p-3 text-xs text-emerald-300 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <div>
                <span className="font-semibold block">Secured Connection Active</span>
                All curve deployments, swaps, and fee claim instructions require explicit cryptographic review and approval in your wallet.
              </div>
            </div>

            <button
              id="disconnect-wallet-btn"
              type="button"
              onClick={async () => {
                await disconnect();
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-lg bg-zinc-800 hover:bg-rose-950 hover:text-rose-300 hover:border-rose-900/60 border border-zinc-700 text-sm font-medium transition-colors cursor-pointer"
            >
              Disconnect Wallet
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Connect your institutional or self-custody Solana wallet to deploy Meteora Dynamic Bonding Curves, deposit reserves, or claim creator trading fees.
            </p>

            {/* Security Guarantee Box */}
            <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800 space-y-1.5 text-[11px] text-zinc-300">
              <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <Lock className="w-3.5 h-3.5" />
                <span>VALTICS Institutional Security Invariant</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-zinc-400 pl-0.5">
                <li>Zero Secret Storage: Seed phrases & private keys are never requested or stored.</li>
                <li>Zero Auto-Signing: No unexpected or background transactions.</li>
                <li>Browse Without Wallet: Analytical exploration is completely open.</li>
              </ul>
            </div>

            {error && (
              <div className="bg-rose-950/30 border border-rose-900/50 rounded-lg p-3 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              {availableWallets.map((w) => (
                <button
                  key={w.name}
                  type="button"
                  disabled={connecting}
                  onClick={async () => {
                    if (w.installed) {
                      const success = await connect(w.adapterKey);
                      if (success) onClose();
                    } else {
                      handleExternalLink(
                        w.name === 'Phantom'
                          ? 'https://phantom.app/'
                          : 'https://solflare.com/'
                      );
                    }
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/80 hover:border-zinc-700 transition-all text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{w.icon}</span>
                    <div>
                      <div className="text-sm font-medium text-zinc-200">{w.name}</div>
                      <div className="text-[11px] text-zinc-400">
                        {w.description}
                      </div>
                    </div>
                  </div>
                  {!w.installed && <ExternalLink className="w-3.5 h-3.5 text-zinc-400 shrink-0" />}
                </button>
              ))}
            </div>

            <div className="border-t border-zinc-800/80 pt-3">
              <div className="flex items-start gap-2 text-[11px] text-zinc-400 leading-normal">
                <Key className="w-3.5 h-3.5 shrink-0 mt-0.5 text-zinc-400" />
                <span>
                  <strong>Standard Wallet Adapter:</strong> VALTICS interfaces strictly through established Solana web3 standards.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
