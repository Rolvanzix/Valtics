import React, { useState } from 'react';
import { Wifi, ChevronDown, Check, Server, RefreshCw } from 'lucide-react';
import { useNetwork } from '../../context/NetworkContext';
import { ClusterNetwork } from '../../types';
import { DEFAULT_NETWORKS } from '../../config/networks';

export const NetworkStatus: React.FC = () => {
  const { network, setNetwork, setCustomRpc, latencyMs, currentSlot, isRpcHealthy, refreshHealth } = useNetwork();
  const [isOpen, setIsOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRefreshing(true);
    await refreshHealth();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim().startsWith('http')) {
      setCustomRpc(customInput.trim());
      setIsOpen(false);
    }
  };

  const getLatencyColor = () => {
    if (!isRpcHealthy || latencyMs < 0) return 'bg-rose-500 text-rose-400';
    if (latencyMs < 200) return 'bg-emerald-500 text-emerald-400';
    if (latencyMs < 600) return 'bg-amber-500 text-amber-400';
    return 'bg-rose-500 text-rose-400';
  };

  return (
    <div className="relative">
      <button
        id="network-selector-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-zinc-800 bg-[#0e131d] hover:border-zinc-700 text-xs font-medium text-zinc-300 transition-colors"
      >
        <span className="relative flex h-2 w-2">
          {isRpcHealthy && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${getLatencyColor().split(' ')[0]}`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${getLatencyColor().split(' ')[0]}`} />
        </span>

        <span className="capitalize font-mono-nums">
          {network === 'mainnet-beta' ? 'Mainnet' : network === 'devnet' ? 'Devnet' : 'Custom RPC'}
        </span>

        {latencyMs >= 0 && (
          <span className="text-[10px] font-mono-nums text-zinc-400 hidden sm:inline">
            {latencyMs}ms
          </span>
        )}

        <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
      </button>

      {isOpen && (
        <div
          id="network-dropdown-menu"
          className="absolute right-0 mt-2 w-72 rounded-lg border border-zinc-800 bg-[#0c1018] shadow-2xl z-50 p-2 text-xs"
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800/80 px-2 text-zinc-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Solana RPC Cluster</span>
            <button
              type="button"
              onClick={handleRefresh}
              className="text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1"
              title="Refresh ping"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="text-[10px]">Ping</span>
            </button>
          </div>

          <div className="space-y-1">
            {DEFAULT_NETWORKS.map((ep) => (
              <button
                key={ep.endpoint}
                type="button"
                onClick={() => {
                  setNetwork(ep.network);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-2.5 py-2 rounded flex items-center justify-between transition-colors ${
                  network === ep.network
                    ? 'bg-zinc-800/80 text-zinc-100 font-medium'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <div className="truncate pr-2">
                  <div className="text-zinc-200">{ep.name}</div>
                  <div className="text-[10px] text-zinc-400 truncate font-mono">{ep.endpoint}</div>
                </div>
                {network === ep.network && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
              </button>
            ))}
          </div>

          <div className="mt-2 pt-2 border-t border-zinc-800/80 px-1">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1 font-mono-nums">
              <span>Cluster Slot:</span>
              <span className="text-zinc-300 font-medium">#{currentSlot ? currentSlot.toLocaleString() : '—'}</span>
            </div>

            <form onSubmit={handleCustomSubmit} className="mt-2">
              <label className="block text-[10px] uppercase font-semibold text-zinc-400 mb-1">
                Custom RPC Endpoint
              </label>
              <div className="flex gap-1">
                <input
                  type="url"
                  placeholder="https://rpc.your-provider.com"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[11px] text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono"
                />
                <button
                  type="submit"
                  disabled={!customInput.trim()}
                  className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 rounded text-[11px] font-medium"
                >
                  Set
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
