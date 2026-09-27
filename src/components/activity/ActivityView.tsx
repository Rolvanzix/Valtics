import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Loader2, 
  Clock, 
  FileCode, 
  ShieldCheck, 
  Zap, 
  Layers,
  RefreshCw
} from 'lucide-react';
import { PublicKey } from '@solana/web3.js';
import { useNetwork } from '../../context/NetworkContext';
import { METEORA_DBC_PROGRAM_ID, getExplorerUrl } from '../../config/constants';
import { getRecordedActivities, onActivityRecorded } from '../../services/activityStorage';
import { AddressBadge } from '../common/AddressBadge';
import { formatRelativeTime } from '../../utils/format';
import { MarketActivityChart } from '../charts/MarketActivityChart';
import { Table, Column } from '../ui/Table';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { BlockchainContextBar } from '../common/BlockchainContextBar';

interface ParsedTxResult {
  signature: string;
  slot: number;
  blockTime: number | null;
  feeSol: number;
  status: 'confirmed' | 'failed';
  interactsWithMeteoraDbc: boolean;
  logs: string[];
}

interface ActivityItem {
  signature: string;
  timestamp: number;
  type: string;
  pool: string;
  asset: string;
  status: 'confirmed' | 'failed';
}

export const ActivityView: React.FC = () => {
  const { connection, network } = useNetwork();
  const [signatureQuery, setSignatureQuery] = useState<string>('');
  const [isQuerying, setIsQuerying] = useState<boolean>(false);
  const [txResult, setTxResult] = useState<ParsedTxResult | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  const [isLoadingLedger, setIsLoadingLedger] = useState<boolean>(true);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // Load real on-chain ledger entries from Solana RPC & user-executed transactions
  const loadLedger = async () => {
    setIsLoadingLedger(true);
    try {
      const userRecorded = getRecordedActivities();
      const userItems: ActivityItem[] = userRecorded.map((r) => ({
        signature: r.signature,
        timestamp: r.timestamp,
        type: r.type === 'swap' ? 'Swap / Trade' : r.type === 'pool_created' ? 'Dynamic Bonding Curve Initialized' : 'Meteora DBC Event',
        pool: r.pool,
        asset: r.asset,
        status: r.status,
      }));

      // Query real on-chain program signatures from Solana Devnet
      let onChainItems: ActivityItem[] = [];
      try {
        const sigs = await connection.getSignaturesForAddress(
          new PublicKey(METEORA_DBC_PROGRAM_ID),
          { limit: 12 }
        );
        if (sigs && sigs.length > 0) {
          onChainItems = sigs.map((s) => ({
            signature: s.signature,
            timestamp: s.blockTime ? s.blockTime * 1000 : Date.now(),
            type: s.memo ? `Memo: ${s.memo.slice(0, 30)}` : 'Meteora DBC Program Call',
            pool: METEORA_DBC_PROGRAM_ID,
            asset: 'DBC Devnet Pool',
            status: s.err ? 'failed' : 'confirmed',
          }));
        }
      } catch (rpcErr) {
        console.warn('RPC signatures query for DBC program:', rpcErr);
      }

      // Merge and deduplicate
      const seen = new Set<string>();
      const combined: ActivityItem[] = [];
      for (const item of [...userItems, ...onChainItems]) {
        if (!seen.has(item.signature)) {
          seen.add(item.signature);
          combined.push(item);
        }
      }

      combined.sort((a, b) => b.timestamp - a.timestamp);
      setActivities(combined);
    } catch (err) {
      console.warn('Error building activity ledger:', err);
    } finally {
      setIsLoadingLedger(false);
    }
  };

  useEffect(() => {
    loadLedger();
    const unsub = onActivityRecorded(() => {
      loadLedger();
    });
    return () => unsub();
  }, [connection, network]);

  const handleInspectSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    const sig = signatureQuery.trim();
    setTxError(null);
    setTxResult(null);

    if (!sig) return;
    if (sig.length < 64) {
      setTxError('Invalid transaction signature. Solana signatures are typically 87-88 characters base58 string.');
      return;
    }

    setIsQuerying(true);
    try {
      const parsed = await connection.getParsedTransaction(sig, {
        maxSupportedTransactionVersion: 1,
        commitment: 'confirmed',
      });

      if (!parsed) {
        setTxError(`Transaction signature was not found on Solana ${network.toUpperCase()}. Verify the network cluster.`);
        return;
      }

      const logMessages = parsed.meta?.logMessages || [];
      const interactsWithMeteoraDbc = logMessages.some((msg) =>
        msg.includes(METEORA_DBC_PROGRAM_ID)
      );

      setTxResult({
        signature: sig,
        slot: parsed.slot,
        blockTime: parsed.blockTime,
        feeSol: (parsed.meta?.fee || 5000) / 1e9,
        status: parsed.meta?.err ? 'failed' : 'confirmed',
        interactsWithMeteoraDbc,
        logs: logMessages,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to query transaction';
      setTxError(msg);
    } finally {
      setIsQuerying(false);
    }
  };

  const columns: Column<ActivityItem>[] = [
    {
      key: 'type',
      header: 'Instruction / Event',
      render: (item) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-zinc-100 text-xs">{item.type}</div>
          <div className="text-[11px] text-zinc-400 font-mono">{item.asset}</div>
        </div>
      ),
    },
    {
      key: 'pool',
      header: 'Pool Account (PDA)',
      render: (item) => <AddressBadge address={item.pool} head={4} tail={4} />,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (item) => (
        <Badge variant={item.status === 'confirmed' ? 'positive' : 'negative'} size="xs" dot>
          {item.status === 'confirmed' ? 'Confirmed' : 'Failed'}
        </Badge>
      ),
    },
    {
      key: 'timestamp',
      header: 'Age',
      align: 'right',
      render: (item) => (
        <span className="font-mono-nums text-zinc-400 text-xs">{formatRelativeTime(item.timestamp)}</span>
      ),
    },
    {
      key: 'signature',
      header: 'Signature',
      align: 'right',
      render: (item) => <AddressBadge address={item.signature} type="tx" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight font-sans">
            On-Chain Activity & Audit Ledger
          </h1>
          <Badge variant="neutral" size="xs">
            Solana {network.toUpperCase()}
          </Badge>
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          Inspect verifiable Meteora Dynamic Bonding Curve transactions directly on Solana ledger
        </p>
      </div>

      {/* Explicit On-Chain Cluster & Wallet Bar */}
      <BlockchainContextBar screenTitle="Activity & Audit Ledger" />

      {/* Real-Time Market Activity Telemetry Chart */}
      <MarketActivityChart height={210} />

      {/* Transaction Signature Inspector */}
      <Card>
        <form onSubmit={handleInspectSignature} className="p-5 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5 font-sans">
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span>Solana Transaction Signature Inspector</span>
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">
              Direct ledger query via {network}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="flex-1">
              <Input
                placeholder="Paste Solana transaction signature (e.g. 5wK4p7...)"
                value={signatureQuery}
                onChange={(e) => setSignatureQuery(e.target.value)}
                tabular
                leftIcon={<Search className="w-3.5 h-3.5 text-zinc-500" />}
              />
            </div>
            <Button
              type="submit"
              variant="secondary"
              isLoading={isQuerying}
              className="shrink-0"
            >
              Inspect Signature
            </Button>
          </div>

          {txError && (
            <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/40 text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{txError}</span>
            </div>
          )}

          {/* Inspected Tx Result */}
          {txResult && (
            <div className="p-4 rounded-xl bg-[#090d14] border border-zinc-800 space-y-3 font-mono-nums">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                <div className="flex items-center gap-2 font-sans">
                  <Badge variant={txResult.status === 'confirmed' ? 'positive' : 'negative'} size="xs" dot>
                    {txResult.status === 'confirmed' ? 'Confirmed On-Chain' : 'Transaction Failed'}
                  </Badge>
                  {txResult.interactsWithMeteoraDbc && (
                    <Badge variant="accent" size="xs">
                      Meteora DBC Program Call
                    </Badge>
                  )}
                </div>

                <a
                  href={getExplorerUrl(txResult.signature, 'tx', network)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-400 hover:text-zinc-200 text-xs flex items-center gap-1 font-sans transition-colors"
                >
                  <span>Explorer</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-zinc-500 block font-sans">Slot Height</span>
                  <span className="font-semibold text-zinc-100">#{txResult.slot.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block font-sans">Fee Paid</span>
                  <span className="font-semibold text-zinc-100">{txResult.feeSol} SOL</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block font-sans">Block Time</span>
                  <span className="text-zinc-300">
                    {txResult.blockTime ? new Date(txResult.blockTime * 1000).toLocaleTimeString() : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block font-sans">Program Target</span>
                  <AddressBadge address={METEORA_DBC_PROGRAM_ID} label="Meteora DBC" />
                </div>
              </div>

              {/* Logs drawer */}
              {txResult.logs.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
                  <span className="text-[10px] font-sans font-semibold uppercase text-zinc-400 tracking-wider block">
                    Execution Logs ({txResult.logs.length})
                  </span>
                  <div className="p-2.5 rounded-lg bg-black/40 border border-zinc-900 max-h-40 overflow-y-auto font-mono text-[11px] text-zinc-400 space-y-0.5">
                    {txResult.logs.map((log, i) => (
                      <div
                        key={i}
                        className={
                          log.includes(METEORA_DBC_PROGRAM_ID)
                            ? 'text-amber-400 font-semibold'
                            : log.includes('success')
                            ? 'text-emerald-400'
                            : ''
                        }
                      >
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      </Card>

      {/* Live On-Chain Activity Ledger Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-sans flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cryptographic Activity Ledger</span>
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-zinc-500">
              Solana {network.toUpperCase()}
            </span>
            <Button
              variant="ghost"
              size="xs"
              onClick={loadLedger}
              isLoading={isLoadingLedger}
              leftIcon={<RefreshCw className="w-3 h-3" />}
            >
              Refresh
            </Button>
          </div>
        </div>

        {isLoadingLedger ? (
          <div className="py-12 text-center text-zinc-400 space-y-2 bg-[#090d14] rounded-xl border border-zinc-800">
            <Loader2 className="w-6 h-6 animate-spin text-amber-400 mx-auto" />
            <p className="text-xs font-sans">Querying on-chain signatures from Solana {network.toUpperCase()}...</p>
          </div>
        ) : activities.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table
                columns={columns}
                data={activities}
                keyExtractor={(item) => item.signature}
              />
            </div>

            {/* Mobile Activity Cards View */}
            <div className="md:hidden space-y-2.5">
              {activities.map((item) => (
                <div
                  key={item.signature}
                  className="p-3.5 rounded-xl border border-zinc-800/80 bg-[#090d14] space-y-2.5 font-sans"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-semibold text-zinc-100 text-xs truncate">
                        {item.type}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono">
                        {item.asset}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5">
                      <Badge variant={item.status === 'confirmed' ? 'positive' : 'negative'} size="xs" dot>
                        {item.status === 'confirmed' ? 'Confirmed' : 'Failed'}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-800/50">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-zinc-500">Pool:</span>
                      <AddressBadge address={item.pool} head={3} tail={3} />
                    </div>
                    <span className="text-[11px] text-zinc-400 font-mono-nums">
                      {formatRelativeTime(item.timestamp)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-zinc-800/40 text-xs">
                    <span className="text-[10px] text-zinc-500">Transaction</span>
                    <AddressBadge address={item.signature} type="tx" />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="py-10 text-center text-zinc-400 space-y-2 bg-[#090d14] rounded-xl border border-zinc-800">
            <Clock className="w-6 h-6 text-zinc-500 mx-auto" />
            <p className="text-sm font-semibold text-zinc-200">No On-Chain Activity Recorded Yet</p>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Execute a swap on an active market or create a dynamic bonding curve pool to generate verifiable transactions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
