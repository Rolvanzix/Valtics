import React, { useState, useMemo } from 'react';
import { 
  X, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Loader2, 
  ArrowRight, 
  Info, 
  Layers, 
  Coins, 
  FileCheck,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { TransactionIntent, ClusterNetwork } from '../../types';
import { AddressBadge } from './AddressBadge';
import { formatCurrency } from '../../utils/format';
import { getExplorerUrl } from '../../config/constants';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Dialog } from '../ui/Dialog';
import { ValticsMark } from '../brand/ValticsLogo';
import { useNetwork } from '../../context/NetworkContext';
import { useWallet } from '../../context/WalletContext';
import { auditTransactionSafety } from '../../utils/txSafety';
import { sanitizeErrorMessage } from '../../utils/security';

interface TxPreflightModalProps {
  isOpen: boolean;
  intent: TransactionIntent | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isSigning: boolean;
  error: string | null;
  txSignature: string | null;
}

export const TxPreflightModal: React.FC<TxPreflightModalProps> = ({
  isOpen,
  intent,
  onClose,
  onConfirm,
  isSigning,
  error,
  txSignature,
}) => {
  const { network } = useNetwork();
  const { publicKeyStr, balanceSol } = useWallet();
  const [confirmedRisk, setConfirmedRisk] = useState(false);

  // Run deterministic transaction safety audit
  const safetyReport = useMemo(() => {
    if (!intent) return null;
    return auditTransactionSafety({
      network: intent.network,
      expectedNetwork: network,
      destinationProgramId: intent.programId,
      signerAddress: publicKeyStr,
      userSolBalance: balanceSol,
      estimatedFeeSol: intent.estimatedFeeSol,
      rentExemptSol: intent.rentExemptReserveSol,
    });
  }, [intent, network, publicKeyStr, balanceSol]);

  if (!isOpen || !intent) return null;

  const sanitizedError = error ? sanitizeErrorMessage(error) : null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={!isSigning ? onClose : () => {}}
      title={
        <div className="flex items-center gap-2.5">
          <ValticsMark size={22} glow />
          <span className="text-zinc-100 font-bold">Preflight Transaction Verification</span>
        </div>
      }
      description={`Meteora DBC Smart Contract Instruction · Solana ${intent.network.toUpperCase()}`}
      maxWidth="2xl"
    >
      <div className="space-y-4 text-xs">
        {/* Confirmed State */}
        {txSignature ? (
          <div className="space-y-4 py-3">
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-emerald-200">
                  Transaction Confirmed on Solana Ledger
                </h4>
                <p className="text-xs text-zinc-300">
                  Your instruction has been cryptographically signed, committed, and finalized on-chain.
                </p>
                <div className="mt-3 pt-2 border-t border-emerald-900/40 flex items-center justify-between">
                  <span className="text-xs text-zinc-400 font-mono">Signature:</span>
                  <AddressBadge address={txSignature} type="tx" />
                </div>
              </div>
            </div>

            <Button variant="secondary" size="md" onClick={onClose} fullWidth>
              Return to Markets Overview
            </Button>
          </div>
        ) : (
          <>
            {/* Safety Invariant Audit Report */}
            {safetyReport && (
              <div className="p-3 rounded-xl bg-[#090d16] border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-zinc-400 font-semibold tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Transaction Safety Verification Checklist
                  </span>
                  <Badge variant={safetyReport.isSafeToProceed ? 'live' : 'danger'} size="xs">
                    {safetyReport.isSafeToProceed ? 'Safety Checks Passed' : 'Action Required'}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  {safetyReport.checks.map((chk) => (
                    <div
                      key={chk.id}
                      className={`p-2 rounded-lg border flex items-start gap-2 ${
                        chk.status === 'verified'
                          ? 'border-emerald-900/30 bg-emerald-950/10 text-zinc-300'
                          : chk.status === 'warning'
                          ? 'border-amber-900/50 bg-amber-950/20 text-amber-200'
                          : 'border-rose-900/50 bg-rose-950/20 text-rose-200'
                      }`}
                    >
                      {chk.status === 'verified' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-semibold block text-zinc-200">{chk.label}</span>
                        <span className="text-[10px] text-zinc-400 leading-tight block mt-0.5">
                          {chk.detail}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {!safetyReport.isSafeToProceed && safetyReport.blockReason && (
                  <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-900/60 text-xs text-rose-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>
                      <strong>Execution Blocked:</strong> {safetyReport.blockReason}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Pillar 1: What am I doing? */}
            <div className="p-3.5 rounded-xl bg-[#090d14] border border-zinc-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-amber-400 font-semibold tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Pillar 1 · What am I doing?
                </span>
                <Badge variant="accent" size="xs">
                  {intent.network}
                </Badge>
              </div>
              <h4 className="text-sm font-bold text-zinc-100 font-sans">{intent.title}</h4>
              <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                {intent.description}
              </p>
            </div>

            {/* Pillar 2 & 3: Why am I doing it? & What will happen? */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-[#090d14] border border-zinc-800 space-y-1">
                <span className="text-[10px] font-mono uppercase text-zinc-400 font-semibold tracking-wider">
                  Pillar 2 · Why am I doing it?
                </span>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Establish an algorithmic liquidity pool and deterministic pricing curve for tokenized real-world assets on Meteora DBC without capital fragmentation.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#090d14] border border-zinc-800 space-y-1">
                <span className="text-[10px] font-mono uppercase text-zinc-400 font-semibold tracking-wider">
                  Pillar 3 · What will happen?
                </span>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  The program derives pool and vault PDAs, initializes curve parameters, deposits the base reserve, and locks trading configurations until graduation.
                </p>
              </div>
            </div>

            {/* Critical Financial & Protocol Parameters */}
            <div className="rounded-xl border border-zinc-800 bg-[#090d14] p-3.5 space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block font-sans">
                Boundaries & Operational Parameters
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {intent.criticalParameters.map((param) => (
                  <div
                    key={param.label}
                    className={`p-2 rounded-lg border ${
                      param.flagged
                        ? 'border-amber-900/60 bg-amber-950/20 text-amber-200'
                        : 'border-zinc-800/80 bg-zinc-900/40 text-zinc-300'
                    }`}
                  >
                    <span className="text-[10px] text-zinc-400 block font-sans truncate">
                      {param.label}
                    </span>
                    <span className="font-mono-nums font-semibold text-zinc-100 text-xs mt-0.5 block truncate">
                      {param.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Target Program & Required Accounts */}
            <div className="rounded-xl border border-zinc-800 bg-[#090d14] p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-sans">
                  Target Program (Verified Meteora DBC)
                </span>
                <AddressBadge address={intent.programId} label="Meteora DBC" />
              </div>

              <div className="border-t border-zinc-800/80 pt-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block mb-1.5 font-sans">
                  Target Accounts & Authorities ({intent.accounts.length})
                </span>
                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                  {intent.accounts.map((acc, idx) => (
                    <div
                      key={`${acc.pubkey}-${idx}`}
                      className="flex items-center justify-between text-[11px] p-1.5 rounded bg-zinc-900/60 border border-zinc-800/60 font-mono-nums"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-zinc-400 font-sans text-[10px]">{acc.label}:</span>
                        <AddressBadge address={acc.pubkey} head={4} tail={4} />
                      </div>
                      <div className="flex items-center gap-1 shrink-0 text-[10px]">
                        {acc.isSigner && (
                          <Badge variant="accent" size="xs">
                            Signer
                          </Badge>
                        )}
                        {acc.isWritable && (
                          <Badge variant="neutral" size="xs">
                            Writable
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pillar 4: What will it cost? */}
            <div className="rounded-xl border border-zinc-800 bg-[#090d14] p-3.5 space-y-2">
              <span className="text-[10px] font-mono uppercase text-emerald-400 font-semibold tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Pillar 4 · What will it cost?
              </span>
              <div className="grid grid-cols-2 gap-3 text-xs bg-zinc-900/40 p-2.5 rounded-lg border border-zinc-800/80 font-mono-nums">
                <div>
                  <span className="text-[10px] text-zinc-400 font-sans block">Network Tx Fee</span>
                  <span className="text-zinc-100 font-semibold mt-0.5 block">
                    ~{intent.estimatedFeeSol} SOL (<span className="text-emerald-400">&lt;$0.001</span>)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 font-sans block">Rent-Exempt Storage Reserve</span>
                  <span className="text-zinc-100 font-semibold mt-0.5 block">
                    ~{intent.rentExemptReserveSol} SOL
                  </span>
                </div>
              </div>
            </div>

            {/* Sanitized Error display */}
            {sanitizedError && (
              <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/60 text-xs text-rose-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Execution Failed</span>
                  <span>{sanitizedError}</span>
                </div>
              </div>
            )}

            {/* Pillar 5: What do I need to confirm? */}
            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
              <span className="text-[10px] font-mono uppercase text-amber-400 font-semibold tracking-wider">
                Pillar 5 · Explicit Approval Required (No Auto-Signing)
              </span>
              <label className="flex items-start gap-2.5 text-xs text-zinc-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={confirmedRisk}
                  onChange={(e) => setConfirmedRisk(e.target.checked)}
                  className="mt-0.5 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <span className="leading-snug">
                  I have independently verified the target accounts, network fees, bonding curve formulas, and authoritatively instruct this transaction on Solana <strong>{intent.network}</strong>.
                </span>
              </label>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                disabled={isSigning}
                onClick={onClose}
                className="flex-1 cursor-pointer"
              >
                Cancel
              </Button>

              <Button
                variant="brand"
                size="md"
                disabled={!confirmedRisk || isSigning || !safetyReport?.isSafeToProceed}
                isLoading={isSigning}
                onClick={onConfirm}
                className="flex-1 cursor-pointer"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Sign & Deploy on Solana
              </Button>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
};
