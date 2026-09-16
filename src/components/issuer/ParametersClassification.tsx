import React, { useState } from 'react';
import { 
  Lock, 
  Sliders, 
  ShieldAlert, 
  Info, 
  Check, 
  Copy, 
  ExternalLink, 
  AlertTriangle,
  Coins,
  Settings,
  ShieldCheck,
  Edit2,
  X
} from 'lucide-react';
import { DBCPoolState } from '../../types';
import { formatCurrency, formatBps, formatNumber } from '../../utils/format';
import { Badge } from '../ui/Badge';
import { AddressBadge } from '../common/AddressBadge';
import { getExplorerUrl } from '../../config/constants';
import { useNetwork } from '../../context/NetworkContext';

interface ParametersClassificationProps {
  pool: DBCPoolState;
  onInitiateFeeClaim?: () => void;
  onUpdateCreatorRecipient?: (newRecipient: string) => void;
}

export const ParametersClassification: React.FC<ParametersClassificationProps> = ({
  pool,
  onInitiateFeeClaim,
  onUpdateCreatorRecipient,
}) => {
  const { network } = useNetwork();
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'immutable' | 'configurable' | 'protocol'>('all');
  const [isEditingRecipient, setIsEditingRecipient] = useState(false);
  const [recipientInput, setRecipientInput] = useState(pool.creator || '');
  const [recipientSavedMessage, setRecipientSavedMessage] = useState<string | null>(null);

  const quoteUnit = pool.quoteMint.includes('So111111111') ? 'SOL' : 'USDC';

  const handleSaveRecipient = (e: React.FormEvent) => {
    e.preventDefault();
    if (recipientInput.trim().length < 32) return;
    if (onUpdateCreatorRecipient) {
      onUpdateCreatorRecipient(recipientInput.trim());
    }
    setRecipientSavedMessage('Authority fee destination updated for on-chain withdrawal instruction routing.');
    setIsEditingRecipient(false);
    setTimeout(() => setRecipientSavedMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Parameter Mutability Philosophy Banner */}
      <div className="rounded-xl border border-zinc-800 bg-[#0c1018] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-zinc-100 font-sans tracking-tight">
              Parameter Governance & Mutability Matrix
            </h3>
          </div>
          <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
            Meteora DBC v1.0 Rules
          </span>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed font-normal">
          In strict compliance with Meteora protocol specifications on Solana, bonding curve parameters are partitioned into three immutable security tiers. Parameters that govern mathematical pricing and asset binding cannot be modified after genesis.
        </p>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-800/80">
          {[
            { id: 'all', label: 'All Parameters' },
            { id: 'immutable', label: '1. Immutable Parameters', count: 6 },
            { id: 'configurable', label: '2. Configurable (Issuer)', count: 2 },
            { id: 'protocol', label: '3. Protocol-Controlled', count: 3 },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === tab.id
                  ? 'bg-zinc-800 text-white font-semibold border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="text-[10px] font-mono opacity-60">({tab.count})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {recipientSavedMessage && (
        <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{recipientSavedMessage}</span>
        </div>
      )}

      {/* SECTION 1: IMMUTABLE PARAMETERS */}
      {(activeSubTab === 'all' || activeSubTab === 'immutable') && (
        <div className="rounded-xl border border-zinc-800 bg-[#0c1018] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-zinc-800 text-zinc-400">
                <Lock className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200 font-sans">
                Tier 1: Immutable Parameters (On-Chain Locked)
              </h4>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-950/40 border border-rose-800/40 text-rose-300 font-semibold">
              Read-Only · Sol Runtime Invariant
            </span>
          </div>

          <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/60 text-[11px] text-zinc-400 leading-relaxed">
            <span className="text-zinc-300 font-medium">Why are these locked? </span>
            The Meteora DBC smart contract fixes these parameters at initialization to prevent curve front-running, token dilution, or post-deposit dilution. No key, including the creator authority or VALTICS, can modify them.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* 1. Curve Algorithm */}
            <div className="p-3.5 rounded-lg bg-[#0e1422] border border-zinc-800/80 space-y-1.5 opacity-95">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono text-zinc-400">Curve Mathematical Model</span>
                <Lock className="w-3 h-3 text-rose-400/80" />
              </div>
              <div className="text-xs font-bold text-zinc-100 uppercase font-mono">
                {pool.curveType || 'Linear Dynamic Curve'}
              </div>
              <span className="text-[10px] text-zinc-500 block">
                Continuous bonding invariant f(x) locked at deployment
              </span>
            </div>

            {/* 2. Base Asset Mint */}
            <div className="p-3.5 rounded-lg bg-[#0e1422] border border-zinc-800/80 space-y-1.5 opacity-95">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono text-zinc-400">Base Token Mint</span>
                <Lock className="w-3 h-3 text-rose-400/80" />
              </div>
              <div className="text-xs font-bold text-zinc-100 font-mono truncate">
                <AddressBadge address={pool.baseMint} head={6} tail={4} />
              </div>
              <span className="text-[10px] text-zinc-500 block">
                Target SPL / Token-2022 asset address
              </span>
            </div>

            {/* 3. Quote Mint */}
            <div className="p-3.5 rounded-lg bg-[#0e1422] border border-zinc-800/80 space-y-1.5 opacity-95">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono text-zinc-400">Quote Asset Pairing</span>
                <Lock className="w-3 h-3 text-rose-400/80" />
              </div>
              <div className="text-xs font-bold text-zinc-100 font-mono">
                {quoteUnit} ({pool.quoteMint.slice(0, 4)}...{pool.quoteMint.slice(-4)})
              </div>
              <span className="text-[10px] text-zinc-500 block">
                Fixed pricing currency reserve
              </span>
            </div>

            {/* 4. Genesis Starting Price */}
            <div className="p-3.5 rounded-lg bg-[#0e1422] border border-zinc-800/80 space-y-1.5 opacity-95">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono text-zinc-400">Genesis Starting Price</span>
                <Lock className="w-3 h-3 text-rose-400/80" />
              </div>
              <div className="text-xs font-bold text-zinc-100 font-mono">
                {formatCurrency(pool.startPrice, quoteUnit)}
              </div>
              <span className="text-[10px] text-zinc-500 block">
                Origin spot valuation coordinate (x=0)
              </span>
            </div>

            {/* 5. Migration Target Threshold */}
            <div className="p-3.5 rounded-lg bg-[#0e1422] border border-zinc-800/80 space-y-1.5 opacity-95">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono text-zinc-400">Migration Quote Threshold</span>
                <Lock className="w-3 h-3 text-rose-400/80" />
              </div>
              <div className="text-xs font-bold text-zinc-100 font-mono">
                {pool.quoteThreshold} {quoteUnit}
              </div>
              <span className="text-[10px] text-zinc-500 block">
                Exact threshold needed for AMM migration
              </span>
            </div>

            {/* 6. Migration Target DEX */}
            <div className="p-3.5 rounded-lg bg-[#0e1422] border border-zinc-800/80 space-y-1.5 opacity-95">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono text-zinc-400">Graduation AMM Target</span>
                <Lock className="w-3 h-3 text-rose-400/80" />
              </div>
              <div className="text-xs font-bold text-zinc-100 font-mono">
                {pool.migrationOptionLabel || 'MET_DAMM_V2'}
              </div>
              <span className="text-[10px] text-zinc-500 block">
                Meteora DLMM / DAMM v2 liquidity destination
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: CONFIGURABLE (ISSUER-CONTROLLED) PARAMETERS */}
      {(activeSubTab === 'all' || activeSubTab === 'configurable') && (
        <div className="rounded-xl border border-zinc-800 bg-[#0c1018] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-amber-500/20 text-amber-400">
                <Sliders className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200 font-sans">
                Tier 2: Configurable Parameters (Issuer Authority Control)
              </h4>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/40 border border-amber-800/40 text-amber-300 font-semibold">
              Authority Modifiable
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Creator Fee Recipient Account */}
            <div className="p-4 rounded-lg bg-[#0e1422] border border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-zinc-200 block font-sans">
                    Creator Fee Destination Account
                  </span>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">
                    Wallet address designated to receive claimed bonding curve trading fees
                  </span>
                </div>
                <Badge variant="brand" size="xs">
                  Active
                </Badge>
              </div>

              {!isEditingRecipient ? (
                <div className="flex items-center justify-between p-2.5 rounded-md bg-zinc-900 border border-zinc-800">
                  <span className="font-mono text-xs text-zinc-200 truncate max-w-[240px]">
                    {pool.creator}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingRecipient(true)}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Change</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSaveRecipient} className="space-y-2">
                  <input
                    type="text"
                    value={recipientInput}
                    onChange={(e) => setRecipientInput(e.target.value)}
                    placeholder="Enter new Solana public key..."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1.5 text-xs text-zinc-200 font-mono focus:outline-hidden focus:border-amber-400"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingRecipient(false)}
                      className="px-2.5 py-1 rounded text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs cursor-pointer"
                    >
                      Save Destination
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Trading Fee Claims Panel */}
            <div className="p-4 rounded-lg bg-[#0e1422] border border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-zinc-200 block font-sans">
                    Accrued Trading Fee Claims
                  </span>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">
                    Creator revenue accrued from dynamic bonding curve trades
                  </span>
                </div>
                <span className="font-mono text-xs text-emerald-400 font-bold">
                  {formatBps(pool.creatorFeeShareBps || 2500)} share
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-[10px] uppercase font-mono text-zinc-500 block">Claimable Balance</span>
                  <span className="text-sm font-bold font-mono text-zinc-100">
                    0.00 {quoteUnit}
                  </span>
                </div>
                {onInitiateFeeClaim && (
                  <button
                    type="button"
                    onClick={onInitiateFeeClaim}
                    className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium cursor-pointer border border-zinc-700 transition-colors"
                  >
                    Claim Fees
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: PROTOCOL-CONTROLLED PARAMETERS */}
      {(activeSubTab === 'all' || activeSubTab === 'protocol') && (
        <div className="rounded-xl border border-zinc-800 bg-[#0c1018] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-violet-950 text-violet-400">
                <ShieldAlert className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200 font-sans">
                Tier 3: Protocol-Controlled Parameters (Meteora Governance)
              </h4>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-950/40 border border-violet-800/40 text-violet-300 font-semibold">
              Meteora Program Enforced
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-lg bg-[#0e1422] border border-zinc-800/80 space-y-1">
              <span className="text-[10px] uppercase font-mono text-zinc-400 block">Protocol Base Fee Split</span>
              <div className="text-xs font-bold font-mono text-zinc-200">
                {formatBps(pool.baseFeeBps)} Base Pool Fee
              </div>
              <span className="text-[10px] text-zinc-500 block">
                Split between creator and protocol treasury
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-[#0e1422] border border-zinc-800/80 space-y-1">
              <span className="text-[10px] uppercase font-mono text-zinc-400 block">DLMM Bin Step on Migration</span>
              <div className="text-xs font-bold font-mono text-zinc-200">
                25 BPS (0.25%) Default Bin Size
              </div>
              <span className="text-[10px] text-zinc-500 block">
                Configured for stable RWA price bands upon DAMM creation
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-[#0e1422] border border-zinc-800/80 space-y-1">
              <span className="text-[10px] uppercase font-mono text-zinc-400 block">Solana Rent Exemption Reserve</span>
              <div className="text-xs font-bold font-mono text-zinc-200">
                ~0.0485 SOL per PDA Vault
              </div>
              <span className="text-[10px] text-zinc-500 block">
                Runtime minimum balance for account persistence
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
