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
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-[#670CDC]/30 bg-[#140130] hover:border-[#670CDC]/60 text-xs font-medium text-[#F7F3FF] transition-colors cursor-pointer"
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
          {network === 'devnet' ? 'Devnet' : 'Custom Devnet RPC'}
        </span>

        {latencyMs >= 0 && (
          <span className="text-[10px] font-mono-nums text-[#B8A9CC] hidden sm:inline">
            {latencyMs}ms
          </span>
        )}

        <ChevronDown className="w-3.5 h-3.5 text-[#B8A9CC]" />
      </button>

      {isOpen && (
        <div
          id="network-dropdown-menu"
          className="absolute right-0 mt-2 w-72 rounded-xl border border-[#670CDC]/35 bg-[#160136] shadow-2xl shadow-[#09011B]/95 z-50 p-2.5 text-xs text-[#F7F3FF]"
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#670CDC]/20 px-2 text-[#B8A9CC]">
            <span className="font-semibold uppercase tracking-wider text-[10px] font-mono">Solana RPC Cluster</span>
            <button
              type="button"
              onClick={handleRefresh}
              className="text-[#B8A9CC] hover:text-[#F7F3FF] transition-colors flex items-center gap-1 cursor-pointer"
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
                className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                  network === ep.network
                    ? 'bg-[#3B0489]/60 text-[#F7F3FF] font-semibold border-l-2 border-[#F99225]'
                    : 'text-[#B8A9CC] hover:bg-[#26035A] hover:text-[#F7F3FF]'
                }`}
              >
                <div className="truncate pr-2">
                  <div className="text-[#F7F3FF] font-medium">{ep.name}</div>
                  <div className="text-[10px] text-[#7E6D96] truncate font-mono">{ep.endpoint}</div>
                </div>
                {network === ep.network && <Check className="w-3.5 h-3.5 text-[#F99225] shrink-0" />}
              </button>
            ))}
          </div>

          <div className="mt-2 pt-2 border-t border-[#670CDC]/20 px-1">
            <div className="flex items-center justify-between text-[11px] text-[#B8A9CC] mb-1 font-mono-nums">
              <span>Cluster Slot:</span>
              <span className="text-[#F7F3FF] font-medium">#{currentSlot ? currentSlot.toLocaleString() : '—'}</span>
            </div>

            <form onSubmit={handleCustomSubmit} className="mt-2">
              <label className="block text-[10px] uppercase font-semibold text-[#B8A9CC] mb-1">
                Custom RPC Endpoint
              </label>
              <div className="flex gap-1.5">
                <input
                  type="url"
                  placeholder="https://rpc.your-provider.com"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  className="flex-1 bg-[#120128] border border-[#670CDC]/30 rounded-lg px-2.5 py-1.5 text-[11px] text-[#F7F3FF] focus:outline-hidden focus:border-[#670CDC] font-mono placeholder-[#7E6D96]"
                />
                <button
                  type="submit"
                  disabled={!customInput.trim()}
                  className="px-3 py-1.5 bg-[#3B0489] hover:bg-[#670CDC] disabled:opacity-40 text-[#F7F3FF] rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
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
