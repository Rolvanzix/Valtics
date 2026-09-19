import React, { useState, useEffect } from 'react';
import { NavigationTab } from '../layout/Header';
import { StudioStepper, CREATE_MARKET_STEPS } from '../studio/StudioStepper';
import { Step1Asset, Step1AssetData } from '../studio/Step1Asset';
import { Step2ConfigureMarket } from '../studio/Step2ConfigureMarket';
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
import { BlockchainContextBar } from '../common/BlockchainContextBar';

interface CreateMarketViewProps {
  initialParams?: CurveModelParams | null;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenWalletModal: () => void;
  onSelectMarketDetail?: (poolId: string) => void;
}

export const CreateMarketView: React.FC<CreateMarketViewProps> = ({
  initialParams,
  onSelectTab,
  onOpenWalletModal,
  onSelectMarketDetail,
}) => {
  const { network } = useNetwork();
  const activeQuoteMints = QUOTE_MINTS.devnet;

  // 3 Workflow steps: 1: Asset, 2: Market, 3: Review
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
    const quote = activeQuoteMints[assetData.quoteSymbol];
    if (quote && configInput.quoteMint !== quote.mint) {
      setConfigInput((prev) => ({
        ...prev,
        quoteSymbol: assetData.quoteSymbol,
        quoteMint: quote.mint,
      }));
    }
  }, [network, assetData.quoteSymbol, activeQuoteMints]);

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
        quoteSymbol: updated.quoteSymbol,
        quoteMint: updated.quoteMint,
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
      <BlockchainContextBar screenTitle="Create market" />

      {/* Stepper with 4 short contextual labels */}
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

      {/* STEP 2: Market */}
      {currentStep === 2 && (
        <Step2ConfigureMarket
          input={configInput}
          onChange={setConfigInput}
          selectedProfile={selectedProfile}
          onSelectProfile={setSelectedProfile}
          onNext={() => goToNextStep(2)}
          onBack={() => goToPrevStep(2)}
        />
      )}

      {/* STEP 3: Review */}
      {currentStep === 3 && (
        <Step6Create
          input={configInput}
          onBack={() => goToPrevStep(3)}
          onSelectTab={onSelectTab}
          onSelectMarketDetail={onSelectMarketDetail}
          onOpenWalletModal={onOpenWalletModal}
        />
      )}
    </div>
  );
};
