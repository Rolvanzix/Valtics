import React from 'react';
import { X, ExternalLink, AlertCircle, ShieldCheck, RefreshCw, AlertTriangle } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { useNetwork } from '../../context/NetworkContext';
import { AddressBadge } from './AddressBadge';
import { formatCurrency } from '../../utils/format';
import { ValticsMark } from '../brand/ValticsLogo';
import { sanitizeUrl } from '../../utils/security';
import { getExplorerUrl } from '../../config/constants';

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
    balanceLoading,
    walletName,
    availableWallets,
    connect,
    disconnect,
    refreshBalance,
    requestDevnetAirdrop,
    error,
    isWrongNetwork: isWalletWrongNetwork,
    networkError: walletNetworkError,
    clearError,
  } = useWallet();

  const { isWrongNetwork: isRpcWrongNetwork, networkError: rpcNetworkError } = useNetwork();

  const isWrongNetwork = isWalletWrongNetwork || isRpcWrongNetwork;
  const networkError = walletNetworkError || rpcNetworkError;

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
      onClick={() => {
        clearError();
        onClose();
      }}
    >
      <div
        id="wallet-modal-container"
        className="w-full max-w-md bg-[#0c101a] border border-zinc-800 rounded-xl p-5 text-zinc-200 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <ValticsMark size={24} glow />
            <div>
              <h3 className="font-bold text-base tracking-tight text-white font-sans">
                {connected ? 'Solana Devnet Wallet' : 'Connect Devnet Wallet'}
              </h3>
              <p className="text-[11px] text-zinc-400">
                Solana Devnet (Test Cluster)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              clearError();
              onClose();
            }}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Wrong Network Warning Banner */}
        {isWrongNetwork && (
          <div className="bg-rose-950/40 border border-rose-800/70 rounded-lg p-3 text-xs text-rose-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <div>
              <span className="font-semibold block text-rose-300">
                Solana Devnet Required
              </span>
              <span>
                {networkError || 'Your wallet or RPC is not on Solana Devnet. All transactions are blocked.'}
              </span>
            </div>
          </div>
        )}

        {/* Connected State */}
        {connected ? (
          <div className="space-y-4">
            <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-lg p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Active Provider</span>
                <div className="flex items-center gap-1.5 font-medium text-zinc-200">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>{walletName || 'Solana Wallet'}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                    Devnet
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Public Address</span>
                <AddressBadge address={publicKeyStr || ''} head={6} tail={6} />
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Native Balance</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono-nums font-semibold text-zinc-100">
                    {balanceLoading ? (
                      'Refreshing...'
                    ) : balanceSol !== null ? (
                      formatCurrency(balanceSol, 'SOL')
                    ) : (
                      'Unavailable'
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => refreshBalance()}
                    disabled={balanceLoading}
                    title="Refresh on-chain balance"
                    className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${balanceLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Devnet Faucet Airdrop Action */}
            <div className="space-y-2">
              <button
                type="button"
                disabled={airdropping || isWrongNetwork}
                onClick={async () => {
                  setAirdropping(true);
                  setAirdropMsg(null);
                  const ok = await requestDevnetAirdrop();
                  setAirdropping(false);
                  setAirdropMsg(
                    ok
                      ? '1 SOL airdropped successfully on Devnet!'
                      : 'Devnet airdrop faucet rate limit reached. Please use a devnet web faucet or transfer test SOL.'
                  );
                }}
                className="w-full py-2 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                {airdropping ? 'Requesting 1 Devnet SOL...' : 'Request 1 Devnet SOL'}
              </button>

              {airdropMsg && (
                <p className="text-[11px] text-zinc-400 text-center">{airdropMsg}</p>
              )}
            </div>

            {/* Links & Explorer */}
            {publicKeyStr && (
              <div className="flex justify-center">
                <a
                  href={getExplorerUrl(publicKeyStr, 'address', 'devnet')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-zinc-400 hover:text-zinc-200 inline-flex items-center gap-1 transition-colors"
                >
                  <span>
                    View account on Solana Explorer (Devnet)
                  </span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-lg p-3 text-xs text-emerald-300 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <div>
                <span className="font-semibold block">Non-Custodial Architecture</span>
                Valtics interfaces solely via your browser wallet. Private keys are never requested or stored.
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
              Disconnect wallet
            </button>
          </div>
        ) : (
          /* Disconnected State */
          <div className="space-y-4">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Connect a real Solana browser extension on{' '}
              <strong className="text-zinc-200">Solana Devnet</strong>{' '}
              to create Meteora Dynamic Bonding Curves and deploy verifiable liquidity.
            </p>

            {/* Error Display */}
            {error && (
              <div className="bg-rose-950/30 border border-rose-900/50 rounded-lg p-3 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <div className="flex-1">
                  <span className="block font-medium">Connection Error</span>
                  <span className="text-[11px] text-rose-300/90 leading-normal">{error}</span>
                </div>
              </div>
            )}

            {/* Wallet Options List */}
            <div className="space-y-2">
              {availableWallets.map((w) => (
                <button
                  key={w.name}
                  type="button"
                  disabled={connecting}
                  onClick={async () => {
                    if (w.installed) {
                      await connect(w.adapterKey);
                    } else {
                      handleExternalLink(w.installUrl);
                    }
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/80 hover:border-zinc-700 transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{w.icon}</span>
                    <div>
                      <span className="font-medium text-sm text-zinc-200 block group-hover:text-white">
                        {w.name}
                      </span>
                      <span className="text-[10px] text-zinc-500">{w.description}</span>
                    </div>
                  </div>
                  <div>
                    {w.installed ? (
                      <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/40">
                        Connect
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-zinc-400 group-hover:text-zinc-200">
                        Install ↗
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
