import React from 'react';
import { useNetwork } from '../../context/NetworkContext';
import { AppEnvironment } from '../../types';
import { AlertCircle } from 'lucide-react';

interface EnvironmentSwitchProps {
  compact?: boolean;
  className?: string;
  showStatusTip?: boolean;
}

export const EnvironmentSwitch: React.FC<EnvironmentSwitchProps> = ({
  compact = false,
  className = '',
  showStatusTip = false,
}) => {
  const { environment, setEnvironment, isMainnet, isTestnet, environmentStatusMessage, isWrongNetwork, networkError } = useNetwork();

  const handleSelect = (env: AppEnvironment) => {
    if (env !== environment) {
      setEnvironment(env);
    }
  };

  return (
    <div className={`inline-flex flex-col items-start ${className}`}>
      {/* Segmented Control: [ TESTNET ] [ MAINNET ] */}
      <div
        role="group"
        aria-label="Blockchain environment selector"
        className="inline-flex items-center p-0.5 rounded-lg bg-[#070a12] border border-zinc-800 shadow-inner select-none font-sans text-xs"
      >
        {/* TESTNET TAB: Subtle but clear development indicator */}
        <button
          type="button"
          onClick={() => handleSelect('testnet')}
          className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-md transition-all cursor-pointer text-xs ${
            isTestnet
              ? 'bg-zinc-800 text-amber-200 font-semibold border border-amber-500/30 shadow-xs'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
          title="Switch to Solana Testnet / Devnet development cluster"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isTestnet ? 'bg-amber-400' : 'bg-zinc-600'
            }`}
          />
          <span className="tracking-wide">
            {compact ? (
              <>
                <span className="hidden xs:inline">TESTNET</span>
                <span className="xs:hidden">TEST</span>
              </>
            ) : (
              <>
                <span className="hidden md:inline">TESTNET / DEVNET</span>
                <span className="md:hidden">TESTNET</span>
              </>
            )}
          </span>
        </button>

        {/* MAINNET TAB: Deliberate production-state indicator */}
        <button
          type="button"
          onClick={() => handleSelect('mainnet')}
          className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-md transition-all cursor-pointer text-xs ${
            isMainnet
              ? 'bg-emerald-950/60 text-emerald-300 font-bold border border-emerald-500/50 shadow-[0_0_8px_rgba(52,211,153,0.25)]'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
          title="Switch to Solana Mainnet production cluster (Production security rules apply)"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isMainnet ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]' : 'bg-zinc-600'
            }`}
          />
          <span className="tracking-wide">
            <span className="hidden xs:inline">MAINNET</span>
            <span className="xs:hidden">MAIN</span>
          </span>
        </button>
      </div>

      {/* Mismatch Warning Alert */}
      {isWrongNetwork && (
        <div className="flex items-center gap-1 mt-1 text-[10px] text-rose-400 font-mono" title={networkError || 'Network mismatch'}>
          <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
          <span className="truncate max-w-[140px]">Cluster mismatch</span>
        </div>
      )}

      {/* Optional Concise Status Message */}
      {showStatusTip && (
        <span
          className={`text-[10px] font-mono mt-1 ${
            isMainnet ? 'text-emerald-400/90 font-medium' : 'text-amber-400/80'
          }`}
        >
          {environmentStatusMessage}
        </span>
      )}
    </div>
  );
};
