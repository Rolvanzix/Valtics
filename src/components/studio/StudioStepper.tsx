import React from 'react';
import { Check, ArrowRight } from 'lucide-react';

export interface StepItem {
  id: number;
  key: string;
  title: string;
  subtitle: string;
}

export const CREATE_MARKET_STEPS: StepItem[] = [
  { id: 1, key: 'asset', title: 'Asset', subtitle: 'Mint & NAV' },
  { id: 2, key: 'params', title: 'Market parameters', subtitle: 'Quote & fees' },
  { id: 3, key: 'curve', title: 'Bonding curve', subtitle: 'Pricing & target' },
  { id: 4, key: 'review', title: 'Review', subtitle: 'Verification' },
  { id: 5, key: 'deploy', title: 'Deploy', subtitle: 'Solana Devnet' },
];

export const STUDIO_STEPS = CREATE_MARKET_STEPS;

interface StudioStepperProps {
  currentStep: number;
  onSelectStep: (step: number) => void;
  completedSteps: number[];
  steps?: StepItem[];
}

export const StudioStepper: React.FC<StudioStepperProps> = ({
  currentStep,
  onSelectStep,
  completedSteps,
  steps = CREATE_MARKET_STEPS,
}) => {
  return (
    <div className="w-full bg-[#140130] border border-[#670CDC]/25 rounded-xl p-3 font-sans">
      <div className="flex items-center justify-between overflow-x-auto gap-2 sm:gap-4 no-scrollbar">
        {steps.map((step, idx) => {
          const isCurrent = currentStep === step.id;
          const isCompleted = completedSteps.includes(step.id);
          const isClickable = isCompleted || step.id <= Math.max(...completedSteps, 1) + 1;

          return (
            <React.Fragment key={step.id}>
              <button
                type="button"
                onClick={() => isClickable && onSelectStep(step.id)}
                disabled={!isClickable}
                className={`flex items-center gap-2.5 px-3 py-2 min-h-[44px] rounded-lg text-left transition-colors shrink-0 cursor-pointer ${
                  isCurrent
                    ? 'bg-[#1E0148] border border-[#670CDC]/50 text-[#F7F3FF]'
                    : isCompleted
                    ? 'bg-[#100126] border border-[#670CDC]/20 text-[#EDE4FA] hover:border-[#670CDC]/40'
                    : 'text-[#7E6D96] border border-transparent opacity-60 cursor-not-allowed'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-medium shrink-0 transition-colors ${
                    isCurrent
                      ? 'bg-[#F99225] text-[#09011B] font-bold'
                      : isCompleted
                      ? 'bg-[#670CDC]/25 text-[#EDE4FA] border border-[#670CDC]/40'
                      : 'bg-[#1E0148] text-[#7E6D96]'
                  }`}
                >
                  {isCompleted && !isCurrent ? <Check className="w-3.5 h-3.5" /> : step.id}
                </div>
                <div>
                  <div className={`text-xs font-medium whitespace-nowrap ${isCurrent ? 'text-[#F7F3FF] font-semibold' : 'text-[#EDE4FA]'}`}>
                    {step.title}
                  </div>
                  <div className="text-[10px] text-[#B8A9CC] leading-tight hidden sm:block whitespace-nowrap">
                    {step.subtitle}
                  </div>
                </div>
              </button>

              {idx < steps.length - 1 && (
                <div className="hidden lg:flex items-center text-[#670CDC]/40 shrink-0">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
