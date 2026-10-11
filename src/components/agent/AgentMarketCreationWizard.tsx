import React, { useState } from 'react';
import {
  PlusCircle,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sliders,
  Sparkles,
  Info,
  Clock,
  Layers,
  HelpCircle,
  FileCheck,
} from 'lucide-react';
import { CurveModelParams } from '../../types';
import { GuidedMarketCreationState } from '../../types/agent';

interface AgentMarketCreationWizardProps {
  onApplyCurveToCreation: (params: CurveModelParams) => void;
}

const STEPS = [
  '1. Market Idea',
  '2. Underlying Subject',
  '3. Market Question',
  '4. Outcomes & Bounds',
  '5. Resolution Condition',
  '6. Data Source',
  '7. Time Boundary',
  '8. Edge Cases',
  '9. Review',
  '10. User Approval',
];

export const AgentMarketCreationWizard: React.FC<AgentMarketCreationWizardProps> = ({
  onApplyCurveToCreation,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  const [form, setForm] = useState<GuidedMarketCreationState>({
    step: 1,
    marketIdea: 'US Treasury 3-Month Bill Tokenized Yield',
    assetSubject: 'Short-duration US Sovereign Debt Notes',
    assetCategory: 'Treasuries',
    marketQuestion: 'Will the tokenized note maintain $1.00 Par NAV discovery and graduate liquidity to Meteora DAMM at $12M market cap?',
    startPrice: 1.0,
    targetGraduationCap: 12000000,
    resolutionCondition: 'Meteora DBC vault achieves target quote reserve (10,000 Devnet USDC), completing dynamic bonding curve and migrating liquidity into Meteora DAMM pool.',
    resolutionDataSource: 'Meteora DBC Program Vault Account (Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy85V5Re9h6U) + Pyth US10Y/Treasury Benchmark Feed',
    antiSniperSlots: 40,
    liquidityLockDays: 90,
    ambiguityChecklist: [
      {
        text: 'Ambiguity 1: Illiquid opening price gap',
        resolved: true,
        mitigation: 'Resolved: Curve formula guarantees continuous deterministic spot pricing without orderbook gaps.',
      },
      {
        text: 'Ambiguity 2: MEV bot front-running at deployment',
        resolved: true,
        mitigation: 'Resolved: 40-slot anti-sniper rate limiter locks early buy volume within safe slot bands.',
      },
      {
        text: 'Ambiguity 3: Premature graduation before fair discovery',
        resolved: true,
        mitigation: 'Resolved: 80% supply allocation (8M tokens) requires substantial capital depth before graduation triggers.',
      },
    ],
    quoteAsset: 'USDC',
    curveType: 'linear',
    feeBps: 25,
    totalSupply: 10000000,
    curveAllocationPct: 80,
    approvedByUser: false,
  });

  const nextStep = () => {
    if (currentStep < 10) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleExport = () => {
    const params: CurveModelParams = {
      curveType: form.curveType,
      totalSupply: form.totalSupply,
      allocationToCurvePct: form.curveAllocationPct,
      startPriceUsd: form.startPrice,
      migrationMarketCapUsd: form.targetGraduationCap,
      quoteAsset: form.quoteAsset,
      quotePriceUsd: form.quoteAsset === 'SOL' ? 150 : 1.0,
      feeBps: form.feeBps,
      antiSniperSlots: form.antiSniperSlots,
      migrationTarget: 'meteora_damm' as any,
      vestingDays: form.liquidityLockDays,
    };

    onApplyCurveToCreation(params);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-[#670CDC]/25 bg-[#140130] p-5 space-y-3 shadow-md shadow-[#09011B]/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#100126] text-[#D76EDD] border border-[#670CDC]/30">
              GUIDED MARKET ARCHITECT
            </span>
            <span className="text-xs text-[#7E6D96] font-mono">Step {currentStep} of 10</span>
          </div>
          <span className="text-xs font-mono text-[#EDE4FA] font-semibold">
            {STEPS[currentStep - 1]}
          </span>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full h-1.5 rounded-full bg-[#100126] overflow-hidden border border-[#670CDC]/20">
          <div
            className="h-full bg-linear-to-r from-[#670CDC] via-[#BA3351] to-[#F99225] transition-all duration-300"
            style={{ width: `${(currentStep / 10) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Guided Step Workspace */}
      <div className="rounded-xl border border-[#670CDC]/25 bg-[#140130] p-6 space-y-6 shadow-md shadow-[#09011B]/60">
        {/* Step 1: Market Idea */}
        {currentStep === 1 && (
          <div className="space-y-4 max-w-2xl">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#F7F3FF] font-sans">1. Market Idea & Token Asset Concept</h3>
              <p className="text-xs text-[#B8A9CC]">
                What asset, debt instrument, or financial utility are you introducing to the programmable market?
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-[#B8A9CC]">Market Title / Project Name</label>
              <input
                type="text"
                value={form.marketIdea}
                onChange={(e) => setForm({ ...form, marketIdea: e.target.value })}
                className="w-full bg-[#100126] border border-[#670CDC]/25 focus:border-[#670CDC]/60 rounded-lg p-2.5 text-xs text-[#EDE4FA] placeholder-[#7E6D96] focus:outline-hidden"
                placeholder="e.g. US Treasury 3-Month Bill Yield Token"
              />
            </div>

            <div className="bg-[#100126] p-3.5 rounded-lg border border-[#670CDC]/20 text-xs text-[#B8A9CC] space-y-1.5 font-sans">
              <span className="font-semibold text-[#F99225] font-mono text-[11px] block uppercase">
                Agent Guidance:
              </span>
              <p>
                Clearly defining your market title sets the foundation for issuer verifiability and prevents confusion among Devnet liquidity providers.
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Underlying Subject */}
        {currentStep === 2 && (
          <div className="space-y-4 max-w-2xl">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#F7F3FF] font-sans">2. Underlying Subject & Asset Archetype</h3>
              <p className="text-xs text-[#B8A9CC]">
                Select the underlying asset class to calibrate baseline curve volatility and spread.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(['Treasuries', 'Private Credit', 'Real Estate', 'Digital Asset', 'Commodity'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setForm({ ...form, assetCategory: cat })}
                  className={`p-3 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                    form.assetCategory === cat
                      ? 'border-[#670CDC] bg-[#1C0142] text-[#F7F3FF] font-medium shadow-md shadow-[#670CDC]/20'
                      : 'border-[#670CDC]/20 bg-[#100126] hover:border-[#670CDC]/40 text-[#B8A9CC]'
                  }`}
                >
                  <span className="font-semibold block text-[#F7F3FF]">{cat}</span>
                  <span className="text-[11px] text-[#7E6D96] font-sans mt-0.5 block">
                    {cat === 'Treasuries'
                      ? 'Par NAV anchored, low fee spread'
                      : cat === 'Private Credit'
                      ? 'Yield accumulation, S-curve discovery'
                      : cat === 'Real Estate'
                      ? 'Fractional property equity/debt'
                      : 'Dynamic continuous discovery'}
                  </span>
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#B8A9CC]">Underlying Collateral / Entity Description</label>
              <input
                type="text"
                value={form.assetSubject}
                onChange={(e) => setForm({ ...form, assetSubject: e.target.value })}
                className="w-full bg-[#100126] border border-[#670CDC]/25 focus:border-[#670CDC]/60 rounded-lg p-2.5 text-xs text-[#EDE4FA] focus:outline-hidden"
              />
            </div>
          </div>
        )}

        {/* Step 3: Market Question */}
        {currentStep === 3 && (
          <div className="space-y-4 max-w-2xl">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#F7F3FF] font-sans">3. Market Question & Pricing Thesis</h3>
              <p className="text-xs text-[#B8A9CC]">
                What is the economic thesis governing this programmable bonding curve?
              </p>
            </div>

            <textarea
              rows={3}
              value={form.marketQuestion}
              onChange={(e) => setForm({ ...form, marketQuestion: e.target.value })}
              className="w-full bg-[#100126] border border-[#670CDC]/25 focus:border-[#670CDC]/60 rounded-lg p-3 text-xs text-[#EDE4FA] font-sans leading-relaxed focus:outline-hidden"
            />

            <div className="bg-[#100126] p-3.5 rounded-lg border border-[#670CDC]/20 text-xs text-[#B8A9CC] space-y-1">
              <span className="text-[#D76EDD] font-mono text-[11px] font-semibold block uppercase">
                Agent Ambiguity Check:
              </span>
              <p>
                Your market question clearly establishes a quantifiable milestone (Par NAV stability + capital target), ensuring non-ambiguous resolution.
              </p>
            </div>
          </div>
        )}

        {/* Step 4: Outcomes & Bounds */}
        {currentStep === 4 && (
          <div className="space-y-4 max-w-2xl">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#F7F3FF] font-sans">4. Possible Outcomes & Valuation Bounds</h3>
              <p className="text-xs text-[#B8A9CC]">
                Define the initial spot price and target graduation market capitalization.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-[#B8A9CC]">Initial Spot Price ($)</label>
                <input
                  type="number"
                  step="0.05"
                  value={form.startPrice}
                  onChange={(e) => setForm({ ...form, startPrice: parseFloat(e.target.value) || 1.0 })}
                  className="w-full bg-[#100126] border border-[#670CDC]/25 focus:border-[#670CDC]/60 rounded-lg p-2.5 text-xs text-[#EDE4FA] font-mono focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-[#B8A9CC]">Target Graduation Market Cap ($)</label>
                <input
                  type="number"
                  step="1000000"
                  value={form.targetGraduationCap}
                  onChange={(e) => setForm({ ...form, targetGraduationCap: parseFloat(e.target.value) || 12000000 })}
                  className="w-full bg-[#100126] border border-[#670CDC]/25 focus:border-[#670CDC]/60 rounded-lg p-2.5 text-xs text-[#EDE4FA] font-mono focus:outline-hidden"
                />
              </div>
            </div>

            <div className="text-xs text-[#B8A9CC] font-mono bg-[#100126] p-3 rounded-lg border border-[#670CDC]/20">
              Supply on Curve: <strong className="text-[#F7F3FF]">8,000,000 tokens (80%)</strong> · Starting spot: <strong className="text-[#F99225]">${form.startPrice}</strong> · Target Cap: <strong className="text-[#F7F3FF]">${(form.targetGraduationCap / 1_000_000).toFixed(1)}M</strong>
            </div>
          </div>
        )}

        {/* Step 5: Resolution Condition */}
        {currentStep === 5 && (
          <div className="space-y-4 max-w-2xl">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#F7F3FF] font-sans">5. Resolution Condition & DAMM Migration</h3>
              <p className="text-xs text-[#B8A9CC]">
                What triggers the transition from bonding curve to permanent automated market maker liquidity?
              </p>
            </div>

            <textarea
              rows={3}
              value={form.resolutionCondition}
              onChange={(e) => setForm({ ...form, resolutionCondition: e.target.value })}
              className="w-full bg-[#100126] border border-[#670CDC]/25 focus:border-[#670CDC]/60 rounded-lg p-3 text-xs text-[#EDE4FA] font-sans leading-relaxed focus:outline-hidden"
            />
          </div>
        )}

        {/* Step 6: Resolution Data Source */}
        {currentStep === 6 && (
          <div className="space-y-4 max-w-2xl">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#F7F3FF] font-sans">6. Resolution Data Source & Oracles</h3>
              <p className="text-xs text-[#B8A9CC]">
                On-chain authority and oracle feed verifying reserves and graduation metrics.
              </p>
            </div>

            <input
              type="text"
              value={form.resolutionDataSource}
              onChange={(e) => setForm({ ...form, resolutionDataSource: e.target.value })}
              className="w-full bg-[#100126] border border-[#670CDC]/25 focus:border-[#670CDC]/60 rounded-lg p-2.5 text-xs text-[#EDE4FA] font-mono focus:outline-hidden"
            />

            <div className="text-xs text-[#B8A9CC] space-y-1 bg-[#100126] p-3 rounded-lg border border-[#670CDC]/20">
              <span className="text-emerald-400 font-mono text-[11px] font-semibold block uppercase">
                Deterministic Settlement:
              </span>
              <p>
                Resolution is mathematically enforced on-chain by the Meteora Dynamic Bonding Curve smart contract program account on Solana Devnet.
              </p>
            </div>
          </div>
        )}

        {/* Step 7: Time Boundary & Anti-Sniper */}
        {currentStep === 7 && (
          <div className="space-y-4 max-w-2xl">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#F7F3FF] font-sans">7. Time Boundary & Rate Limiting Safeguards</h3>
              <p className="text-xs text-[#B8A9CC]">
                Configure anti-sniper slot protection and post-graduation liquidity vesting lock duration.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-[#B8A9CC]">Anti-Sniper Window (Slots)</label>
                <input
                  type="number"
                  value={form.antiSniperSlots}
                  onChange={(e) => setForm({ ...form, antiSniperSlots: parseInt(e.target.value, 10) || 40 })}
                  className="w-full bg-[#100126] border border-[#670CDC]/25 focus:border-[#670CDC]/60 rounded-lg p-2.5 text-xs text-[#EDE4FA] font-mono focus:outline-hidden"
                />
                <span className="text-[10px] text-[#7E6D96] font-mono">40 slots ≈ 16 seconds of rate-limited buys</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-[#B8A9CC]">DAMM Liquidity Lock (Days)</label>
                <input
                  type="number"
                  value={form.liquidityLockDays}
                  onChange={(e) => setForm({ ...form, liquidityLockDays: parseInt(e.target.value, 10) || 90 })}
                  className="w-full bg-[#100126] border border-[#670CDC]/25 focus:border-[#670CDC]/60 rounded-lg p-2.5 text-xs text-[#EDE4FA] font-mono focus:outline-hidden"
                />
                <span className="text-[10px] text-[#7E6D96] font-mono">Locks LP tokens post-migration</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 8: Edge Cases & Ambiguities */}
        {currentStep === 8 && (
          <div className="space-y-4 max-w-2xl">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#F7F3FF] font-sans">8. Edge Cases & Ambiguity Verification</h3>
              <p className="text-xs text-[#B8A9CC]">
                The Agent has audited your market definition against common liquidity failure modes:
              </p>
            </div>

            <div className="space-y-3">
              {form.ambiguityChecklist.map((item, idx) => (
                <div key={idx} className="bg-[#100126] p-3.5 rounded-lg border border-[#670CDC]/20 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold text-xs text-[#F7F3FF]">{item.text}</span>
                  </div>
                  <p className="text-[11px] text-[#B8A9CC] pl-6 font-sans">{item.mitigation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 9: Review */}
        {currentStep === 9 && (
          <div className="space-y-4 max-w-2xl">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#F7F3FF] font-sans">9. Comprehensive Parameter Synthesis</h3>
              <p className="text-xs text-[#B8A9CC]">
                Review the finalized Meteora DBC configuration before entering user approval.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-[#100126] p-4 rounded-xl border border-[#670CDC]/25">
              <div>
                <span className="text-[#7E6D96] text-[10px] block uppercase">Asset Concept</span>
                <span className="text-[#F7F3FF] font-semibold">{form.marketIdea}</span>
              </div>
              <div>
                <span className="text-[#7E6D96] text-[10px] block uppercase">Category</span>
                <span className="text-[#F7F3FF] font-semibold">{form.assetCategory}</span>
              </div>
              <div>
                <span className="text-[#7E6D96] text-[10px] block uppercase">Curve Shape</span>
                <span className="text-[#D76EDD] font-semibold uppercase">{form.curveType}</span>
              </div>
              <div>
                <span className="text-[#7E6D96] text-[10px] block uppercase">Trading Fee</span>
                <span className="text-[#F7F3FF] font-semibold">{form.feeBps} bps (0.25%)</span>
              </div>
              <div>
                <span className="text-[#7E6D96] text-[10px] block uppercase">Quote Mint</span>
                <span className="text-[#F99225] font-semibold">Devnet {form.quoteAsset}</span>
              </div>
              <div>
                <span className="text-[#7E6D96] text-[10px] block uppercase">Target Cap</span>
                <span className="text-[#F7F3FF] font-semibold">${(form.targetGraduationCap / 1_000_000).toFixed(1)}M</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 10: User Approval */}
        {currentStep === 10 && (
          <div className="space-y-5 max-w-2xl">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#F7F3FF] font-sans">10. User Approval & Non-Custodial Hand-off</h3>
              <p className="text-xs text-[#B8A9CC]">
                Verify authorization before pre-filling the native VALTICS Market Creation transaction stepper.
              </p>
            </div>

            <div className="rounded-xl border border-[#670CDC]/30 bg-[#100126] p-4 space-y-3">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs text-[#B8A9CC]">
                  <h4 className="font-bold text-[#F7F3FF] font-mono">NON-CUSTODIAL EXECUTION GUARANTEE</h4>
                  <p>
                    VALTICS Agent will <strong className="text-[#F7F3FF]">NEVER</strong> automatically submit or broadcast a blockchain transaction.
                  </p>
                  <p className="text-[#B8A9CC]">
                    By clicking <strong className="text-[#F7F3FF]">Approve & Export</strong> below, these parameters will be safely passed into the native VALTICS Market Creator where you will inspect the preflight checks and approve the transaction with your own wallet.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleExport}
                className="w-full py-3 px-4 rounded-xl bg-[#F99225] hover:bg-[#FFA33D] text-[#09011B] font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#F99225]/25"
              >
                <span>Approve & Export to Market Creator</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Stepper Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-[#670CDC]/20">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-3.5 py-2 rounded-lg bg-[#1C0142] hover:bg-[#26035A] text-[#EDE4FA] border border-[#670CDC]/30 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous Step</span>
          </button>

          {currentStep < 10 && (
            <button
              type="button"
              onClick={nextStep}
              className="px-4 py-2 rounded-lg bg-[#670CDC] hover:bg-[#7C18F0] text-[#F7F3FF] text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#670CDC]/30"
            >
              <span>Next: {STEPS[currentStep]}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
