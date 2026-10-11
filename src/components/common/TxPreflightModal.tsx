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
          <span className="text-[#F7F3FF] font-bold">Preflight Transaction Verification</span>
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
                <p className="text-xs text-[#EDE4FA]">
                  Your instruction has been cryptographically signed, committed, and finalized on-chain.
                </p>
                <div className="mt-3 pt-2 border-t border-emerald-900/40 flex items-center justify-between">
                  <span className="text-xs text-[#B8A9CC] font-mono">Signature:</span>
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
              <div className="p-3.5 rounded-xl bg-[#1C0142] border border-[#670CDC]/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-[#B8A9CC] font-semibold tracking-wider flex items-center gap-1.5">
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
                          ? 'border-emerald-900/30 bg-emerald-950/20 text-[#F7F3FF]'
                          : chk.status === 'warning'
                          ? 'border-[#F99225]/40 bg-[#F99225]/15 text-[#F99225]'
                          : 'border-[#BA3351]/40 bg-[#BA3351]/20 text-[#FF9EAF]'
                      }`}
                    >
                      {chk.status === 'verified' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-[#F99225] shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-semibold block text-[#F7F3FF]">{chk.label}</span>
                        <span className="text-[10px] text-[#B8A9CC] leading-tight block mt-0.5">
                          {chk.detail}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {!safetyReport.isSafeToProceed && safetyReport.blockReason && (
                  <div className="p-2.5 rounded-lg bg-[#BA3351]/20 border border-[#BA3351]/50 text-xs text-[#FF9EAF] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#BA3351] shrink-0" />
                    <span>
                      <strong>Execution Blocked:</strong> {safetyReport.blockReason}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Pillar 1: What am I doing? */}
            <div className="p-3.5 rounded-xl bg-[#140130] border border-[#670CDC]/25 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-[#F99225] font-semibold tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F99225]" />
                  Pillar 1 · What am I doing?
                </span>
                <Badge variant="accent" size="xs">
                  {intent.network}
                </Badge>
              </div>
              <h4 className="text-sm font-bold text-[#F7F3FF] font-sans">{intent.title}</h4>
              <p className="text-xs text-[#B8A9CC] leading-relaxed font-normal">
                {intent.description}
              </p>
            </div>

            {/* Pillar 2 & 3: Why am I doing it? & What will happen? */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[#140130] border border-[#670CDC]/25 space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#B8A9CC] font-semibold tracking-wider">
                  Pillar 2 · Why am I doing it?
                </span>
                <p className="text-xs text-[#B8A9CC] leading-relaxed">
                  Establish an algorithmic liquidity pool and deterministic pricing curve for tokenized real-world assets on Meteora DBC without capital fragmentation.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#140130] border border-[#670CDC]/25 space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#B8A9CC] font-semibold tracking-wider">
                  Pillar 3 · What will happen?
                </span>
                <p className="text-xs text-[#B8A9CC] leading-relaxed">
                  The program derives pool and vault PDAs, initializes curve parameters, deposits the base reserve, and locks trading configurations until graduation.
                </p>
              </div>
            </div>

            {/* Critical Financial & Protocol Parameters */}
            <div className="rounded-xl border border-[#670CDC]/25 bg-[#1C0142] p-3.5 space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#B8A9CC] block font-sans">
                Boundaries & Operational Parameters
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {intent.criticalParameters.map((param) => (
                  <div
                    key={param.label}
                    className={`p-2 rounded-lg border ${
                      param.flagged
                        ? 'border-[#F99225]/40 bg-[#F99225]/15 text-[#F99225]'
                        : 'border-[#670CDC]/20 bg-[#120128] text-[#B8A9CC]'
                    }`}
                  >
                    <span className="text-[10px] text-[#7E6D96] block font-sans truncate">
                      {param.label}
                    </span>
                    <span className="font-mono-nums font-semibold text-[#F7F3FF] text-xs mt-0.5 block truncate">
                      {param.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Target Program & Required Accounts */}
            <div className="rounded-xl border border-[#670CDC]/25 bg-[#140130] p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#B8A9CC] font-sans">
                  Target Program (Verified Meteora DBC)
                </span>
                <AddressBadge address={intent.programId} label="Meteora DBC" />
              </div>

              <div className="border-t border-[#670CDC]/20 pt-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#B8A9CC] block mb-1.5 font-sans">
                  Target Accounts & Authorities ({intent.accounts.length})
                </span>
                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                  {intent.accounts.map((acc, idx) => (
                    <div
                      key={`${acc.pubkey}-${idx}`}
                      className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-[#120128] border border-[#670CDC]/20 font-mono-nums"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-[#B8A9CC] font-sans text-[10px]">{acc.label}:</span>
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
            <div className="rounded-xl border border-[#670CDC]/25 bg-[#1C0142] p-3.5 space-y-2">
              <span className="text-[10px] font-mono uppercase text-emerald-400 font-semibold tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Pillar 4 · What will it cost?
              </span>
              <div className="grid grid-cols-2 gap-3 text-xs bg-[#120128] p-2.5 rounded-lg border border-[#670CDC]/20 font-mono-nums">
                <div>
                  <span className="text-[10px] text-[#7E6D96] font-sans block">Network Tx Fee</span>
                  <span className="text-[#F7F3FF] font-semibold mt-0.5 block">
                    ~{intent.estimatedFeeSol} SOL (<span className="text-emerald-400">&lt;$0.001</span>)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#7E6D96] font-sans block">Rent-Exempt Storage Reserve</span>
                  <span className="text-[#F7F3FF] font-semibold mt-0.5 block">
                    ~{intent.rentExemptReserveSol} SOL
                  </span>
                </div>
              </div>
            </div>

            {/* Sanitized Error display */}
            {sanitizedError && (
              <div className="p-3 rounded-lg bg-[#BA3351]/20 border border-[#BA3351]/50 text-xs text-[#FF9EAF] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-[#BA3351] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-[#FF9EAF]">Execution Failed</span>
                  <span className="text-[#B8A9CC]">{sanitizedError}</span>
                </div>
              </div>
            )}

            {/* Pillar 5: What do I need to confirm? */}
            <div className="p-3 rounded-xl bg-[#F99225]/10 border border-[#F99225]/30 space-y-2">
              <span className="text-[10px] font-mono uppercase text-[#F99225] font-semibold tracking-wider">
                Pillar 5 · Explicit Approval Required (No Auto-Signing)
              </span>
              <label className="flex items-start gap-2.5 text-xs text-[#B8A9CC] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={confirmedRisk}
                  onChange={(e) => setConfirmedRisk(e.target.checked)}
                  className="mt-0.5 rounded border-[#670CDC]/40 bg-[#120128] text-[#F99225] focus:ring-0 cursor-pointer"
                />
                <span className="leading-snug">
                  I have independently verified the target accounts, network fees, bonding curve formulas, and authoritatively instruct this transaction on Solana <strong className="text-[#F7F3FF]">{intent.network}</strong>.
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
