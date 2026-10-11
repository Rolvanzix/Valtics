import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  RefreshCw, 
  ExternalLink, 
  Copy, 
  Check, 
  Loader2, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';
import { useNetwork } from '../../context/NetworkContext';
import { fetchRealOnChainSignaturesForAddress, RealOnChainTxItem } from '../../services/solana';
import { getExplorerUrl } from '../../config/constants';
import { Badge } from '../ui/Badge';

interface RealOnChainActivityProps {
  address: string;
  addressLabel?: string;
  className?: string;
}

export const RealOnChainActivity: React.FC<RealOnChainActivityProps> = ({
  address,
  addressLabel = 'Pool PDA',
  className = '',
}) => {
  const { connection, network } = useNetwork();
  const [loading, setLoading] = useState<boolean>(true);
  const [transactions, setTransactions] = useState<RealOnChainTxItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedSig, setCopiedSig] = useState<string | null>(null);

  const loadOnChainTransactions = async () => {
    if (!address) return;
    setLoading(true);
    setError(null);

    try {
      const realTxs = await fetchRealOnChainSignaturesForAddress(connection, address, network, 15);
      setTransactions(realTxs);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error querying Solana RPC';
      setError(msg);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOnChainTransactions();
  }, [address, connection, network]);

  const handleCopy = (text: string, sig: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSig(sig);
    setTimeout(() => setCopiedSig(null), 2000);
  };

  return (
    <div className={`rounded-xl border border-[#670CDC]/25 bg-[#140130] p-5 sm:p-6 space-y-4 shadow-xl shadow-[#09011B]/60 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#670CDC]/20 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#670CDC]/20 border border-[#670CDC]/40 text-[#EDE4FA]">
              <Activity className="w-4 h-4 text-[#F99225]" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-[#F7F3FF] font-sans tracking-tight">
              Real On-Chain Activity & Audit Log
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1E0148] text-[#EDE4FA] border border-[#670CDC]/25 font-semibold">
              Live Solana RPC
            </span>
          </div>
          <p className="text-xs text-[#B8A9CC] font-normal">
            Direct cryptographic ledger query for {addressLabel} on Solana {network.toUpperCase()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadOnChainTransactions}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-[#140130] hover:bg-[#1A0140] disabled:opacity-50 text-[#EDE4FA] text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors border border-[#670CDC]/30"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#F99225]' : ''}`} />
            <span>Refresh Ledger</span>
          </button>

          <a
            href={getExplorerUrl(address, 'address', network as any)}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-lg bg-[#140130] hover:bg-[#1A0140] text-[#F99225] hover:text-[#FFA640] text-xs font-medium flex items-center gap-1.5 transition-colors border border-[#670CDC]/30"
          >
            <span>Account in Explorer</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Transactions List or Honest Empty State */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2 text-[#B8A9CC]">
          <Loader2 className="w-6 h-6 animate-spin text-[#F99225]" />
          <span className="text-xs font-mono">
            Querying getSignaturesForAddress from Solana {network.toUpperCase()} RPC...
          </span>
        </div>
      ) : transactions.length > 0 ? (
        <>
          {/* Mobile Card Layout (md:hidden) */}
          <div className="md:hidden space-y-3">
            {transactions.map((tx) => {
              const isFinalized = tx.status === 'Finalized';
              const isFailed = tx.status === 'Failed';

              return (
                <div
                  key={tx.signature}
                  className="p-3.5 rounded-xl border border-[#670CDC]/25 bg-[#100126] space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-[#140130] text-[#EDE4FA] text-[11px] font-mono border border-[#670CDC]/20">
                      {tx.type}
                    </span>
                    <Badge
                      variant={isFinalized ? 'graduated' : isFailed ? 'danger' : 'live'}
                      size="xs"
                      dot
                    >
                      {tx.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#B8A9CC] font-mono">
                    <span>{tx.timestampFormatted}</span>
                    <span className="capitalize text-[#B8A9CC]">Solana {tx.network}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#670CDC]/20">
                    <div className="flex items-center gap-1.5 font-mono text-xs text-[#EDE4FA]">
                      <span>{tx.signature.slice(0, 6)}...{tx.signature.slice(-6)}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(tx.signature, tx.signature)}
                        className="text-[#7E6D96] hover:text-[#EDE4FA] transition-colors p-1"
                        title="Copy Transaction Signature"
                      >
                        {copiedSig === tx.signature ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <a
                      href={tx.explorerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="min-h-[36px] px-3 py-1 rounded-lg bg-[#140130] hover:bg-[#1A0140] text-[11px] text-[#F99225] hover:text-[#FFA640] font-medium flex items-center gap-1 transition-colors border border-[#670CDC]/30"
                    >
                      <span>Inspect</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table (hidden md:block) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#670CDC]/20 text-[11px] font-mono text-[#7E6D96] uppercase tracking-wider">
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Timestamp</th>
                  <th className="pb-3 font-medium">Signature</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Network</th>
                  <th className="pb-3 font-medium text-right">Explorer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#670CDC]/15 font-sans">
                {transactions.map((tx) => {
                  const isFinalized = tx.status === 'Finalized';
                  const isFailed = tx.status === 'Failed';

                  return (
                    <tr key={tx.signature} className="hover:bg-[#1A023B] transition-colors">
                      {/* Type */}
                      <td className="py-3 pr-4 font-medium">
                        <span className="px-2 py-0.5 rounded-md bg-[#240A36] text-[#F99225] border border-[#F99225]/30 text-[11px] font-mono font-semibold">
                          {tx.type}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 pr-4 font-mono text-[#B8A9CC] text-[11px] whitespace-nowrap">
                        {tx.timestampFormatted}
                      </td>

                      {/* Signature */}
                      <td className="py-3 pr-4 font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#EDE4FA]">
                            {tx.signature.slice(0, 6)}...{tx.signature.slice(-6)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(tx.signature, tx.signature)}
                            className="text-[#7E6D96] hover:text-[#F7F3FF] transition-colors p-0.5 cursor-pointer"
                            title="Copy Transaction Signature"
                          >
                            {copiedSig === tx.signature ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 pr-4">
                        <Badge
                          variant={isFinalized ? 'graduated' : isFailed ? 'danger' : 'live'}
                          size="xs"
                          dot
                        >
                          {tx.status}
                        </Badge>
                      </td>

                      {/* Network */}
                      <td className="py-3 pr-4 font-mono text-[11px] text-[#B8A9CC] capitalize">
                        Solana {tx.network}
                      </td>

                      {/* Explorer Action */}
                      <td className="py-3 text-right">
                        <a
                          href={tx.explorerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-[#F99225] hover:text-[#FFA640] font-medium hover:underline"
                        >
                          <span>Inspect</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* Real Honest On-Chain Empty State — Never Invent Data */
        <div className="p-8 rounded-xl bg-[#100126] border border-[#670CDC]/25 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#140130] border border-[#670CDC]/30 mx-auto flex items-center justify-center text-[#D76EDD]">
            <ShieldCheck className="w-5 h-5 text-[#D76EDD]" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="text-xs font-bold text-[#F7F3FF] uppercase tracking-wider font-mono">
              0 On-Chain Transactions Recorded
            </h4>
            <p className="text-xs text-[#B8A9CC] leading-relaxed font-normal">
              Solana {network.toUpperCase()} RPC confirmed no transaction history for account{' '}
              <span className="font-mono text-[#EDE4FA]">{address.slice(0, 6)}...{address.slice(-6)}</span>.
              Real transactions will automatically stream here as swaps and state modifications occur.
            </p>
          </div>

          <div className="pt-2">
            <a
              href={getExplorerUrl(address, 'address', network as any)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#140130] hover:bg-[#1A023B] text-xs font-medium text-[#F99225] transition-colors border border-[#670CDC]/30"
            >
              <span>Verify Address in Solana Explorer</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
