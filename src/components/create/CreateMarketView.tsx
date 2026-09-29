import React, { useState, useEffect } from 'react';
import { NavigationTab } from '../layout/Header';
import { StudioStepper, CREATE_MARKET_STEPS } from '../studio/StudioStepper';
import { Step1Asset, Step1AssetData } from '../studio/Step1Asset';
import { Step2MarketParameters } from '../studio/Step2MarketParameters';
import { Step3BondingCurve } from '../studio/Step3BondingCurve';
import { Step4Review } from '../studio/Step4Review';
import { Step6Create } from '../studio/Step6Create';
import { 
  CurveStudioConfigInput, 
  createDefaultCurveStudioInput 
} from '../../services/meteoraCreation';
import { 
  MarketProfileKey, 
  applyProfilePresetToInput 
} from '../../config/marketProfiles';
import { CurveModelParams } from '../../types';
import { useNetwork } from '../../context/NetworkContext';
import { QUOTE_MINTS } from '../../config/constants';

interface CreateMarketViewProps {
  initialParams?: CurveModelParams | null;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenWalletModal: () => void;
  onSelectMarketDetail?: (poolId: string) => void;
}

export const CreateMarketView: React.FC<CreateMarketViewProps> = ({
  onSelectTab,
  onOpenWalletModal,
  onSelectMarketDetail,
}) => {
  const { network, environmentStatusMessage } = useNetwork();
  const activeQuoteMints = QUOTE_MINTS.devnet;

  // 5 Workflow steps: 1: Asset, 2: Market parameters, 3: Bonding curve, 4: Review, 5: Deploy
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Step 1: Asset State
  const [assetData, setAssetData] = useState<Step1AssetData>({
    assetName: '',
    ticker: '',
    baseMint: '',
    assetCategory: 'Treasuries',
    referencePrice: '1.00',
    quoteSymbol: 'USDC',
    quoteMint: activeQuoteMints.USDC.mint,
    decimals: 6,
    totalSupply: '10,000,000',
    verifiedMetadata: null,
  });

  // Step 2: Selected Market Profile Preset
  const [selectedProfile, setSelectedProfile] = useState<MarketProfileKey>('conservative');

  // Unified Curve Configuration Input for Meteora DBC
  const [configInput, setConfigInput] = useState<CurveStudioConfigInput>(() => {
    const base = createDefaultCurveStudioInput();
    return applyProfilePresetToInput(base, 'conservative', 1.0);
  });

  // Sync quote mint when network or symbol changes
  useEffect(() => {
    const quote = activeQuoteMints[configInput.quoteSymbol];
    if (quote && configInput.quoteMint !== quote.mint) {
      setConfigInput((prev) => ({
        ...prev,
        quoteMint: quote.mint,
      }));
    }
  }, [network, configInput.quoteSymbol, activeQuoteMints]);

  // Handler when Step 1 changes
  const handleAssetDataChange = (updated: Step1AssetData) => {
    setAssetData(updated);

    const refPrice = parseFloat(updated.referencePrice) || 1.0;
    const supply = parseFloat(updated.totalSupply.replace(/,/g, '')) || 10_000_000;

    setConfigInput((prev) => {
      const reApplied = applyProfilePresetToInput(prev, selectedProfile, refPrice);
      return {
        ...reApplied,
        assetName: updated.assetName || prev.assetName,
        ticker: updated.ticker || prev.ticker,
        baseMint: updated.baseMint,
        assetCategory: updated.assetCategory,
        referencePrice: refPrice,
        tokenDecimals: updated.decimals,
        totalSupply: supply,
      };
    });
  };

  const markStepComplete = (stepId: number) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
  };

  const goToNextStep = (stepId: number) => {
    markStepComplete(stepId);
    setCurrentStep(stepId + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPrevStep = (stepId: number) => {
    setCurrentStep(stepId - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
            Create Market
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Initialize dynamic bonding curve liquidity and verifiable reference benchmarks on Solana Devnet.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono shrink-0 self-start sm:self-auto bg-zinc-900 border border-zinc-800 text-zinc-300">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span>{environmentStatusMessage}</span>
        </div>
      </div>

      {/* Stepper with 5 clear steps */}
      <StudioStepper
        currentStep={currentStep}
        onSelectStep={(step) => {
          setCurrentStep(step);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        completedSteps={completedSteps}
        steps={CREATE_MARKET_STEPS}
      />

      {/* STEP 1: Asset */}
      {currentStep === 1 && (
        <Step1Asset
          data={assetData}
          onChange={handleAssetDataChange}
          onNext={() => goToNextStep(1)}
        />
      )}

      {/* STEP 2: Market parameters */}
      {currentStep === 2 && (
        <Step2MarketParameters
          input={configInput}
          onChange={setConfigInput}
          selectedProfile={selectedProfile}
          onSelectProfile={setSelectedProfile}
          onNext={() => goToNextStep(2)}
          onBack={() => goToPrevStep(2)}
        />
      )}

      {/* STEP 3: Bonding curve */}
      {currentStep === 3 && (
        <Step3BondingCurve
          input={configInput}
          onChange={setConfigInput}
          onNext={() => goToNextStep(3)}
          onBack={() => goToPrevStep(3)}
        />
      )}

      {/* STEP 4: Review */}
      {currentStep === 4 && (
        <Step4Review
          input={configInput}
          onNext={() => goToNextStep(4)}
          onBack={() => goToPrevStep(4)}
          onEditStep={(step) => {
            setCurrentStep(step);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* STEP 5: Deploy */}
      {currentStep === 5 && (
        <Step6Create
          input={configInput}
          onBack={() => goToPrevStep(5)}
          onSelectTab={onSelectTab}
          onSelectMarketDetail={onSelectMarketDetail}
          onOpenWalletModal={onOpenWalletModal}
        />
      )}
    </div>
  );
};
