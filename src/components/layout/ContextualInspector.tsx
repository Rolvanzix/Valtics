import React, { useState } from 'react';
import {
  X,
  Layers,
  Activity,
  Zap,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Cpu,
  Coins,
  RefreshCw,
} from 'lucide-react';
import { DBCPoolState } from '../../types';
import { useWallet } from '../../context/WalletContext';
import { useNetwork } from '../../context/NetworkContext';
import { formatCurrency, formatPercent } from '../../utils/format';
import { AddressBadge } from '../common/AddressBadge';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface ContextualInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPool: DBCPoolState | null;
  onNavigateToStudio?: () => void;
}

export const ContextualInspector: React.FC<ContextualInspectorProps> = ({
  isOpen,
  onClose,
  selectedPool,
  onNavigateToStudio,
}) => {
  const { connected, balanceSol, publicKeyStr } = useWallet();
  const { currentNetwork, tps, slotHeight, latencyMs } = useNetwork();
  const [activeTab, setActiveTab] = useState<'pool' | 'telemetry' | 'calculator'>('pool');

  if (!isOpen) return null;

  return (
    <aside className="w-80 border-l border-zinc-800/90 bg-[#080c14] flex flex-col justify-between overflow-hidden shrink-0 z-20 text-xs">
      {/* Inspector Header */}
      <div className="h-14 px-4 border-b border-zinc-800 flex items-center justify-between bg-[#0a0f18]">
        <div className="flex items-center gap-2 font-semibold text-zinc-100 text-xs">
          <Activity className="w-4 h-4 text-amber-400" />
          <span>Contextual Inspector</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 bg-[#090d14] text-[11px] font-medium text-zinc-400">
        <button
          type="button"
          onClick={() => setActiveTab('pool')}
          className={`flex-1 py-2 text-center border-b-2 transition-colors ${
            activeTab === 'pool'
              ? 'border-amber-400 text-amber-300 font-semibold bg-[#0d131f]'
              : 'border-transparent hover:text-zinc-200'
          }`}
        >
          Pool Metrics
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('telemetry')}
          className={`flex-1 py-2 text-center border-b-2 transition-colors ${
            activeTab === 'telemetry'
              ? 'border-amber-400 text-amber-300 font-semibold bg-[#0d131f]'
              : 'border-transparent hover:text-zinc-200'
          }`}
        >
          Node Telemetry
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'pool' ? (
          selectedPool ? (
            <div className="space-y-4">
              {/* Pool Header */}
              <div className="bg-[#0e1420] p-3 rounded-lg border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-zinc-100">
                    {selectedPool.tokenSymbol || 'DBC Asset'}
                  </span>
                  <Badge variant={selectedPool.isMigrated ? 'graduated' : 'live'} size="xs" dot>
                    {selectedPool.isMigrated ? 'DAMM v2' : 'Active Curve'}
                  </Badge>
                </div>
                <div className="text-[11px] text-zinc-400 font-medium truncate">
                  {selectedPool.tokenName || 'Meteora Dynamic Curve'}
                </div>
                <div className="pt-2 border-t border-zinc-800/80">
                  <span className="text-[10px] text-zinc-500 uppercase block font-medium">Pool Address</span>
                  <AddressBadge address={selectedPool.poolAddress} head={6} tail={6} className="mt-1" />
                </div>
              </div>

              {/* Progress & Valuation */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider block">
                  Graduation Readiness
                </span>
                <div className="bg-[#0e1420] p-3 rounded-lg border border-zinc-800 space-y-2">
                  <div className="flex justify-between items-baseline font-mono-nums">
                    <span className="text-zinc-400 text-[11px]">Quote Progress</span>
                    <span className="text-amber-400 font-bold text-sm">
                      {formatPercent(selectedPool.quoteCurveProgressPct)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-amber-400"
                      style={{ width: `${selectedPool.quoteCurveProgressPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono-nums">
                    <span>Base Progress: {formatPercent(selectedPool.baseCurveProgressPct)}</span>
                    <span>Fee: {(selectedPool.baseFeeBps / 100).toFixed(2)}%</span>
                  </div>
                </div>
              </div>

              {/* Reserves */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider block">
                  On-Chain Vaults
                </span>
                <div className="bg-[#0e1420] p-3 rounded-lg border border-zinc-800 space-y-2 font-mono-nums">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Base Reserve</span>
                    <span className="text-zinc-200 font-medium truncate max-w-[140px]">
                      {Number(selectedPool.baseReserve).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Quote Reserve</span>
                    <span className="text-amber-400 font-semibold truncate max-w-[140px]">
                      {Number(selectedPool.quoteReserve).toFixed(3)} SOL
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Target Target</span>
                    <span className="text-zinc-300 truncate max-w-[140px]">
                      {Number(selectedPool.quoteThreshold || 85).toFixed(0)} SOL
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {onNavigateToStudio && (
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={onNavigateToStudio}
                  leftIcon={<TrendingUp className="w-3.5 h-3.5" />}
                >
                  Analyze in Curve Studio
                </Button>
              )}
            </div>
          ) : (
            <div className="py-8 text-center space-y-2 text-zinc-500">
              <Layers className="w-8 h-8 mx-auto opacity-40 text-zinc-400" />
              <p className="text-xs">Select any pool from the Markets table to inspect real-time curve telemetry.</p>
            </div>
          )
        ) : (
          /* Node & Cluster Telemetry */
          <div className="space-y-4">
            <div className="bg-[#0e1420] p-3.5 rounded-lg border border-zinc-800 space-y-3 font-mono-nums text-xs">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-500 font-sans">Active Cluster</span>
                <span className="text-zinc-100 font-semibold">{currentNetwork?.name || 'Solana Cluster'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 font-sans">Throughput (TPS)</span>
                <span className="text-emerald-400 font-bold">{tps || 2450} tx/s</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 font-sans">RPC Latency</span>
                <span className="text-zinc-200">{latencyMs ? `${latencyMs} ms` : '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 font-sans">Current Slot</span>
                <span className="text-zinc-200">#{slotHeight ? slotHeight.toLocaleString() : '326,419'}</span>
              </div>
            </div>

            {/* Wallet Snapshot */}
            <div className="bg-[#0e1420] p-3.5 rounded-lg border border-zinc-800 space-y-2">
              <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider block">
                Session Wallet
              </span>
              {connected && publicKeyStr ? (
                <div className="space-y-1.5 font-mono-nums">
                  <div className="text-sm font-bold text-emerald-400">
                    {balanceSol !== null ? `${balanceSol.toFixed(4)} SOL` : 'Fetching...'}
                  </div>
                  <AddressBadge address={publicKeyStr} head={6} tail={6} />
                </div>
              ) : (
                <p className="text-xs text-zinc-500">Wallet disconnected. Connect to sign transactions.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-zinc-800 text-[10px] text-zinc-500 bg-[#060910] flex items-center justify-between font-mono">
        <span>VALTICS DBC CORE</span>
        <span className="text-emerald-400 font-medium">SYMMETRIC RPC</span>
      </div>
    </aside>
  );
};
