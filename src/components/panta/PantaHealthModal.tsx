import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Shield,
  Layers,
  Terminal,
  Server,
  Zap,
  ExternalLink,
  X
} from 'lucide-react';
import { fetchPantaHealth } from '../../services/pantaService';
import { PantaHealthResponse } from '../../types/panta';

interface PantaHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PantaHealthModal: React.FC<PantaHealthModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [healthData, setHealthData] = useState<PantaHealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const runHealthCheck = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPantaHealth();
      if (res.success && res.data) {
        setHealthData(res.data);
      } else {
        setError(res.error?.message || 'Failed to ping Panta health diagnostics');
      }
    } catch (err: any) {
      setError(err?.message || 'Connection failure');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      runHealthCheck();
    }
  }, [isOpen, runHealthCheck]);

  if (!isOpen) return null;

  const isPantaConnected = healthData?.pantaApi === 'CONNECTED';
  const isSolanaConnected = healthData?.solanaRpc === 'CONNECTED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
      <div 
        className="relative w-full max-w-lg bg-[#080821] border border-[rgba(138,32,255,0.35)] rounded-2xl shadow-2xl shadow-[#6010F0]/15 overflow-hidden text-[#F5F5F7]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow accent */}
        <div 
          className="absolute -top-24 -right-24 w-48 h-48 rounded-full pointer-events-none blur-3xl opacity-25"
          style={{ background: 'radial-gradient(circle, #8A20FF 0%, #FF8A20 60%, transparent 100%)' }}
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[rgba(138,32,255,0.2)] bg-[#05051a]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[rgba(138,32,255,0.15)] border border-[rgba(138,32,255,0.3)] flex items-center justify-center text-[#8A20FF]">
              <Activity className="w-4 h-4 text-[#FFA642]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F5F5F7] tracking-tight flex items-center gap-2">
                Panta Infrastructure Bridge Test
              </h3>
              <p className="text-[11px] font-mono text-[#A7A7B8]">
                Server-side connection & Solana devnet RPC audit
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A7A7B8] hover:text-[#F5F5F7] hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Diagnostics Body */}
        <div className="p-6 space-y-5">
          {/* Main Health Indicators */}
          <div className="grid grid-cols-2 gap-3 font-mono">
            {/* 1. Panta API Connection */}
            <div className="valtics-card p-4 space-y-2 border-[rgba(138,32,255,0.25)]">
              <div className="flex items-center justify-between text-xs text-[#A7A7B8]">
                <span>Panta API</span>
                <Server className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center gap-2">
                {isPantaConnected ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-extrabold text-emerald-300">CONNECTED</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-rose-400" />
                    <span className="text-sm font-extrabold text-rose-300">ERROR</span>
                  </>
                )}
              </div>
              <div className="text-[10px] text-[#A7A7B8] truncate">
                {healthData?.details?.endpoint || 'https://live-api.panta.market/api/v1'}
              </div>
            </div>

            {/* 2. Solana RPC Connection */}
            <div className="valtics-card p-4 space-y-2 border-[rgba(138,32,255,0.25)]">
              <div className="flex items-center justify-between text-xs text-[#A7A7B8]">
                <span>Solana RPC</span>
                <Zap className="w-3.5 h-3.5 text-[#FFA642]" />
              </div>
              <div className="flex items-center gap-2">
                {isSolanaConnected ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-extrabold text-emerald-300">CONNECTED</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-rose-400" />
                    <span className="text-sm font-extrabold text-rose-300">ERROR</span>
                  </>
                )}
              </div>
              <div className="text-[10px] text-[#A7A7B8]">
                {healthData?.solanaSlot ? `Slot #${healthData.solanaSlot.toLocaleString()}` : 'Devnet Cluster'}
              </div>
            </div>
          </div>

          {/* Environment & Security Invariants */}
          <div className="bg-[#05051a] border border-[rgba(138,32,255,0.2)] rounded-xl p-4 space-y-2.5 text-xs font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="text-[#A7A7B8]">Environment</span>
              <span className="font-bold text-[#FFA642] px-2 py-0.5 rounded bg-[#FFA642]/10 border border-[#FFA642]/20 text-[11px]">
                {healthData?.environment || 'DEVNET'}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="text-[#A7A7B8]">API Key Guard</span>
              <span className="text-emerald-400 flex items-center gap-1 font-semibold text-[11px]">
                <Shield className="w-3.5 h-3.5" />
                <span>Masked & Isolated ({healthData?.keyFingerprint || 'Configured'})</span>
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="text-[#A7A7B8]">Diagnostic Latency</span>
              <span className="text-[#F5F5F7] font-semibold">
                {healthData?.latencyMs ? `${healthData.latencyMs} ms` : '—'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#A7A7B8]">Signing Security</span>
              <span className="text-[#F5F5F7]">Client Wallet Only (Zero Custody)</span>
            </div>
          </div>

          {/* Error Message if any */}
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
              {error}
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-[10px] font-mono text-[#66667A]">
              Tested at {healthData?.timestamp ? new Date(healthData.timestamp).toLocaleTimeString() : 'Now'}
            </span>
            <button
              type="button"
              onClick={runHealthCheck}
              disabled={loading}
              className="valtics-button text-xs py-2 px-4 inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Testing Bridge...' : 'Retest Connection'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
