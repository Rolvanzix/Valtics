import React, { ReactNode } from 'react';
import { ShieldCheck, AlertTriangle, ArrowRight, Wallet, CheckCircle } from 'lucide-react';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { Badge } from './Badge';

export interface ConfirmationStepData {
  // Pillar 1: What am I doing?
  actionTitle: string;
  actionSummary: string;

  // Pillar 2: Why am I doing it?
  rationale: string;

  // Pillar 3: What will happen?
  expectedOutcomes: string[];

  // Pillar 4: What will it cost?
  estimatedCost: {
    solFee: number;
    rentReserveSol?: number;
    totalSol: number;
    quoteBreakdown?: string;
  };

  // Pillar 5: What do I need to confirm?
  confirmationChecklist: {
    id: string;
    text: string;
    critical?: boolean;
  }[];

  // Parameters list
  parameters?: { label: string; value: string; flag?: boolean }[];

  programId?: string;
  targetAddress?: string;
}

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  data: ConfirmationStepData;
  isLoading?: boolean;
  confirmButtonText?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  data,
  isLoading = false,
  confirmButtonText = 'Approve & Transmit Instruction',
}) => {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title={
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#F99225]" />
          <span className="text-[#F7F3FF]">Preflight Execution Verification</span>
        </div>
      }
      description="Audited Solana smart contract parameters & cryptographic cost breakdown"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-xs text-[#B8A9CC]">
            <span className="font-mono text-emerald-400 font-semibold">
              {data.estimatedCost.totalSol.toFixed(4)} SOL
            </span>
            <span>Total Estimated Outlay</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onConfirm}
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              {confirmButtonText}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs font-sans">
        {/* Pillar 1 & 2: What am I doing & Why */}
        <div className="rounded-xl border border-[#670CDC]/30 bg-[#1C0142] p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-[#B8A9CC] font-semibold tracking-wider">
              1. Action & Rationale
            </span>
            <Badge variant="accent" size="xs">
              Institutional Protocol Action
            </Badge>
          </div>
          <h4 className="font-bold text-sm text-[#F7F3FF]">{data.actionTitle}</h4>
          <p className="text-[#B8A9CC] leading-relaxed">{data.actionSummary}</p>
          <div className="pt-2 border-t border-[#670CDC]/20 text-[#B8A9CC] flex items-start gap-1.5">
            <span className="font-semibold text-[#F7F3FF] shrink-0">Objective:</span>
            <span>{data.rationale}</span>
          </div>
        </div>

        {/* Pillar 3: What will happen? */}
        <div className="rounded-xl border border-[#670CDC]/30 bg-[#140130] p-4 space-y-2">
          <span className="text-[10px] font-mono uppercase text-[#B8A9CC] font-semibold tracking-wider block">
            2. Programmatic Outcomes
          </span>
          <ul className="space-y-1.5 text-[#B8A9CC]">
            {data.expectedOutcomes.map((outcome, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{outcome}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pillar 4: What will it cost? */}
        <div className="rounded-xl border border-[#670CDC]/30 bg-[#1C0142] p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-[#B8A9CC] font-semibold tracking-wider">
              3. Verifiable On-Chain Cost Breakdown
            </span>
            <span className="font-mono text-xs text-[#D76EDD]">Solana Network</span>
          </div>
          <div className="grid grid-cols-3 gap-2 bg-[#120128] p-3 rounded-lg border border-[#670CDC]/25 font-mono-nums">
            <div>
              <span className="text-[10px] text-[#7E6D96] block uppercase font-sans">Network Gas</span>
              <span className="text-[#F7F3FF] font-medium">~{data.estimatedCost.solFee.toFixed(4)} SOL</span>
            </div>
            {data.estimatedCost.rentReserveSol !== undefined && (
              <div>
                <span className="text-[10px] text-[#7E6D96] block uppercase font-sans">Rent Reserve</span>
                <span className="text-[#F7F3FF] font-medium">{data.estimatedCost.rentReserveSol.toFixed(4)} SOL</span>
              </div>
            )}
            <div>
              <span className="text-[10px] text-[#7E6D96] block uppercase font-sans">Total Required</span>
              <span className="text-[#F99225] font-bold">{data.estimatedCost.totalSol.toFixed(4)} SOL</span>
            </div>
          </div>
        </div>

        {/* Pillar 5: What do I need to confirm? */}
        <div className="rounded-xl border border-[#F99225]/30 bg-[#F99225]/10 p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-[#F99225] font-semibold text-xs">
            <AlertTriangle className="w-4 h-4 text-[#F99225] shrink-0" />
            <span>4. Required Operator Confirmations</span>
          </div>
          <ul className="space-y-1 text-[#F7F3FF] text-[11px]">
            {data.confirmationChecklist.map((item) => (
              <li key={item.id} className="flex items-start gap-2">
                <span className="text-[#F99225] font-bold">•</span>
                <span className={item.critical ? 'text-[#F99225] font-medium' : 'text-[#B8A9CC]'}>
                  {item.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Dialog>
  );
};
