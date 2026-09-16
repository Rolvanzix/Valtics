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
    <div className={`rounded-xl border border-zinc-800 bg-[#0c1018] p-5 sm:p-6 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-violet-950/50 border border-violet-800/40 text-violet-400">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-zinc-100 font-sans tracking-tight">
              Real On-Chain Activity & Audit Log
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-semibold">
              Live Solana RPC
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-normal">
            Direct cryptographic ledger query for {addressLabel} on Solana {network.toUpperCase()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadOnChainTransactions}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors border border-zinc-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            <span>Refresh Ledger</span>
          </button>

          <a
            href={getExplorerUrl(address, 'address', network as any)}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-amber-400 hover:text-amber-300 text-xs font-medium flex items-center gap-1.5 transition-colors border border-zinc-700/80"
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
        <div className="py-12 flex flex-col items-center justify-center gap-2 text-zinc-400">
          <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
          <span className="text-xs font-mono">
            Querying getSignaturesForAddress from Solana {network.toUpperCase()} RPC...
          </span>
        </div>
      ) : transactions.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/80 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Timestamp</th>
                <th className="pb-3 font-medium">Signature</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Network</th>
                <th className="pb-3 font-medium text-right">Explorer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 font-sans">
              {transactions.map((tx) => {
                const isFinalized = tx.status === 'Finalized';
                const isFailed = tx.status === 'Failed';

                return (
                  <tr key={tx.signature} className="hover:bg-zinc-800/30 transition-colors">
                    {/* Type */}
                    <td className="py-3 pr-4 font-medium text-zinc-200">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-[11px] font-mono">
                        {tx.type}
                      </span>
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 pr-4 font-mono text-zinc-400 text-[11px] whitespace-nowrap">
                      {tx.timestampFormatted}
                    </td>

                    {/* Signature */}
                    <td className="py-3 pr-4 font-mono text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-200">
                          {tx.signature.slice(0, 6)}...{tx.signature.slice(-6)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(tx.signature, tx.signature)}
                          className="text-zinc-500 hover:text-zinc-300 transition-colors p-0.5"
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
                    <td className="py-3 pr-4 font-mono text-[11px] text-zinc-400 capitalize">
                      Solana {tx.network}
                    </td>

                    {/* Explorer Action */}
                    <td className="py-3 text-right">
                      <a
                        href={tx.explorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-medium hover:underline"
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
      ) : (
        /* Real Honest On-Chain Empty State — Never Invent Data */
        <div className="p-8 rounded-lg bg-[#0e1422] border border-zinc-800/80 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-zinc-800/80 border border-zinc-700 mx-auto flex items-center justify-center text-zinc-400">
            <ShieldCheck className="w-5 h-5 text-zinc-400" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">
              0 On-Chain Transactions Recorded
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed font-normal">
              Solana {network.toUpperCase()} RPC confirmed no transaction history for account{' '}
              <span className="font-mono text-zinc-300">{address.slice(0, 6)}...{address.slice(-6)}</span>.
              Real transactions will automatically stream here as swaps and state modifications occur.
            </p>
          </div>

          <div className="pt-2">
            <a
              href={getExplorerUrl(address, 'address', network as any)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-amber-400 transition-colors border border-zinc-700"
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
