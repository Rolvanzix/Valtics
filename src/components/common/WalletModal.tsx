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
        className="w-full max-w-md bg-[#160136] border border-[#670CDC]/30 rounded-2xl p-5 text-[#F7F3FF] shadow-2xl shadow-[#09011B]/95 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#670CDC]/20 pb-3">
          <div className="flex items-center gap-2.5">
            <ValticsMark size={24} glow />
            <div>
              <h3 className="font-bold text-base tracking-tight text-[#F7F3FF] font-sans">
                {connected ? 'Solana Devnet Wallet' : 'Connect Devnet Wallet'}
              </h3>
              <p className="text-[11px] text-[#B8A9CC]">
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
            className="text-[#B8A9CC] hover:text-[#F7F3FF] p-1.5 rounded-lg hover:bg-[#1C0142] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Wrong Network Warning Banner */}
        {isWrongNetwork && (
          <div className="bg-[#BA3351]/20 border border-[#BA3351]/50 rounded-xl p-3 text-xs text-[#FF9EAF] flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#BA3351]" />
            <div>
              <span className="font-semibold block text-[#FF9EAF]">
                Solana Devnet Required
              </span>
              <span className="text-[#B8A9CC]">
                {networkError || 'Your wallet or RPC is not on Solana Devnet. All transactions are blocked.'}
              </span>
            </div>
          </div>
        )}

        {/* Connected State */}
        {connected ? (
          <div className="space-y-4 font-sans">
            <div className="bg-[#120128] border border-[#670CDC]/25 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-[#B8A9CC]">
                <span>Active Provider</span>
                <div className="flex items-center gap-1.5 font-medium text-[#F7F3FF]">
                  <span className="w-2 h-2 rounded-full bg-[#F99225]"></span>
                  <span>{walletName || 'Solana Wallet'}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1C0142] text-[#D76EDD] font-mono border border-[#670CDC]/30">
                    Devnet
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-[#B8A9CC]">
                <span>Public Address</span>
                <AddressBadge address={publicKeyStr || ''} head={6} tail={6} />
              </div>
              <div className="flex items-center justify-between text-xs text-[#B8A9CC]">
                <span>Native Balance</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono-nums font-semibold text-[#F7F3FF]">
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
                    className="text-[#B8A9CC] hover:text-[#F7F3FF] p-0.5 rounded transition-colors cursor-pointer"
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
                className="w-full py-2 px-3 rounded-lg bg-[#F99225]/15 hover:bg-[#F99225]/25 border border-[#F99225]/40 text-[#F99225] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                {airdropping ? 'Requesting 1 Devnet SOL...' : 'Request 1 Devnet SOL'}
              </button>

              {airdropMsg && (
                <p className="text-[11px] text-[#B8A9CC] text-center">{airdropMsg}</p>
              )}
            </div>

            {/* Links & Explorer */}
            {publicKeyStr && (
              <div className="flex justify-center">
                <a
                  href={getExplorerUrl(publicKeyStr, 'address', 'devnet')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#B8A9CC] hover:text-[#F7F3FF] inline-flex items-center gap-1 transition-colors"
                >
                  <span>
                    View account on Solana Explorer (Devnet)
                  </span>
                  <ExternalLink className="w-3 h-3 text-[#D76EDD]" />
                </a>
              </div>
            )}

            <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-xl p-3 text-xs text-emerald-300 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <div>
                <span className="font-semibold block text-emerald-200">Non-Custodial Architecture</span>
                <span className="text-[#B8A9CC]">Valtics interfaces solely via your browser wallet. Private keys are never requested or stored.</span>
              </div>
            </div>

            <button
              id="disconnect-wallet-btn"
              type="button"
              onClick={async () => {
                await disconnect();
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-lg bg-[#1C0142] hover:bg-[#BA3351]/20 hover:text-[#FF9EAF] hover:border-[#BA3351]/60 border border-[#670CDC]/30 text-sm font-medium transition-colors cursor-pointer text-[#F7F3FF]"
            >
              Disconnect wallet
            </button>
          </div>
        ) : (
          /* Disconnected State */
          <div className="space-y-4 font-sans">
            <p className="text-xs text-[#B8A9CC] leading-relaxed">
              Connect a real Solana browser extension on{' '}
              <strong className="text-[#F7F3FF]">Solana Devnet</strong>{' '}
              to create Meteora Dynamic Bonding Curves and deploy verifiable liquidity.
            </p>

            {/* Error Display */}
            {error && (
              <div className="bg-[#BA3351]/20 border border-[#BA3351]/50 rounded-xl p-3 text-xs text-[#FF9EAF] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#BA3351]" />
                <div className="flex-1">
                  <span className="block font-medium text-[#FF9EAF]">Connection Error</span>
                  <span className="text-[11px] text-[#B8A9CC] leading-normal">{error}</span>
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
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-[#670CDC]/25 bg-[#140130] hover:bg-[#1C0142] hover:border-[#670CDC]/50 transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{w.icon}</span>
                    <div>
                      <span className="font-medium text-sm text-[#F7F3FF] block group-hover:text-white">
                        {w.name}
                      </span>
                      <span className="text-[10px] text-[#7E6D96]">{w.description}</span>
                    </div>
                  </div>
                  <div>
                    {w.installed ? (
                      <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/40">
                        Connect
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-[#B8A9CC] group-hover:text-[#F7F3FF]">
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
