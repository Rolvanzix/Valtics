import React from 'react';
import { X, Shield, Key, ExternalLink, AlertCircle } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { AddressBadge } from './AddressBadge';
import { formatCurrency } from '../../utils/format';
import { ValticsMark } from '../brand/ValticsLogo';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const { connected, connecting, publicKeyStr, balanceSol, walletName, availableWallets, connect, disconnect, error } = useWallet();

  if (!isOpen) return null;

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

            <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-lg p-3 text-xs text-emerald-300 flex items-start gap-2">
              <Shield className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <div>
                <span className="font-semibold block">Secured Connection</span>
                All pool creation and instruction signatures require explicit approval in your wallet extension.
              </div>
            </div>

            <button
              id="disconnect-wallet-btn"
              type="button"
              onClick={async () => {
                await disconnect();
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-lg bg-zinc-800 hover:bg-rose-950 hover:text-rose-300 hover:border-rose-900/60 border border-zinc-700 text-sm font-medium transition-colors"
            >
              Disconnect Wallet
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Connect your institutional or self-custody Solana wallet to deploy Meteora Dynamic Bonding Curves, deposit reserves, or claim creator trading fees.
            </p>

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
                      window.open(
                        w.name === 'Phantom'
                          ? 'https://phantom.app/'
                          : 'https://solflare.com/',
                        '_blank'
                      );
                    }
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/80 hover:border-zinc-700 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{w.icon}</span>
                    <div>
                      <div className="text-sm font-medium text-zinc-200">{w.name}</div>
                      <div className="text-[11px] text-zinc-400">
                        {w.installed ? 'Detected in browser' : 'Not detected — click to install'}
                      </div>
                    </div>
                  </div>
                  {!w.installed && <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />}
                </button>
              ))}
            </div>

            <div className="border-t border-zinc-800/80 pt-3">
              <div className="flex items-start gap-2 text-[11px] text-zinc-400 leading-normal">
                <Key className="w-3.5 h-3.5 shrink-0 mt-0.5 text-zinc-400" />
                <span>
                  <strong>Zero Secret Storage:</strong> VALTICS will never request your seed phrase, private keys, or auto-sign authority. All signing occurs through your local extension.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
