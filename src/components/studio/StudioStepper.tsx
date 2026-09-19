import React from 'react';
import { Check, ArrowRight } from 'lucide-react';

export interface StepItem {
  id: number;
  key: string;
  title: string;
  subtitle: string;
}

export const CREATE_MARKET_STEPS: StepItem[] = [
  { id: 1, key: 'asset', title: 'Asset', subtitle: 'Paste mint & validate' },
  { id: 2, key: 'market', title: 'Market', subtitle: 'Configure' },
  { id: 3, key: 'review', title: 'Review', subtitle: 'Create' },
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
    <div className="w-full bg-[#0c101a] border border-zinc-800 rounded-xl p-3 sm:p-4">
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
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all shrink-0 cursor-pointer ${
                  isCurrent
                    ? 'bg-amber-500/10 border border-amber-500/40 text-white'
                    : isCompleted
                    ? 'bg-zinc-900/60 border border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    : 'text-zinc-500 border border-transparent opacity-60 cursor-not-allowed'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 transition-colors ${
                    isCurrent
                      ? 'bg-amber-500 text-zinc-950 shadow-xs shadow-amber-500/30'
                      : isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {isCompleted && !isCurrent ? <Check className="w-3.5 h-3.5" /> : step.id}
                </div>
                <div className="hidden md:block">
                  <div className={`text-xs font-medium ${isCurrent ? 'text-amber-400 font-semibold' : 'text-zinc-200'}`}>
                    {step.title}
                  </div>
                  <div className="text-[10px] text-zinc-400 leading-tight">
                    {step.subtitle}
                  </div>
                </div>
              </button>

              {idx < steps.length - 1 && (
                <div className="hidden lg:flex items-center text-zinc-700 shrink-0">
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
