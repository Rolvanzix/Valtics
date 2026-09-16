import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Layers, 
  Activity, 
  RotateCcw, 
  Shield, 
  Coins, 
  Info,
  ChevronRight
} from 'lucide-react';
import { NavigationTab } from '../layout/Header';
import { StudioStepper, STUDIO_STEPS } from './StudioStepper';
import { Step1Asset, Step1AssetData } from './Step1Asset';
import { Step2MarketProfile } from './Step2MarketProfile';
import { Step3CurveConfig } from './Step3CurveConfig';
import { Step4Visualization } from './Step4Visualization';
import { Step5Preview } from './Step5Preview';
import { Step6Create } from './Step6Create';
import { 
  CurveStudioConfigInput, 
  createDefaultCurveStudioInput 
} from '../../services/meteoraCreation';
import { 
  MARKET_PROFILES, 
  MarketProfileKey, 
  applyProfilePresetToInput 
} from '../../config/marketProfiles';
import { CurveModelParams } from '../../types';
import { useNetwork } from '../../context/NetworkContext';
import { QUOTE_MINTS } from '../../config/constants';
import { ValticsMark } from '../brand/ValticsLogo';

interface CurveStudioViewProps {
  onSelectTab: (tab: NavigationTab) => void;
  onApplyToCreation?: (params: CurveModelParams) => void;
  onOpenWalletModal?: () => void;
  onSelectMarketDetail?: (poolId: string) => void;
}

export const CurveStudioView: React.FC<CurveStudioViewProps> = ({
  onSelectTab,
  onApplyToCreation,
  onOpenWalletModal,
  onSelectMarketDetail,
}) => {
  const { network } = useNetwork();
  const activeQuoteMints = QUOTE_MINTS[network === 'mainnet-beta' ? 'mainnet-beta' : 'devnet'];

  // Current active step in workflow (1 through 6)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Step 1: Asset State
  const [assetData, setAssetData] = useState<Step1AssetData>({
    assetName: 'Apollo U.S. Treasury Bill 3M',
    ticker: 'USTB-3M',
    baseMint: '2mK3mR8aXWvQv8qY4p7X6e2UvL5fT9bK3gR3RwhK6eUu',
    assetCategory: 'Treasuries',
    referencePrice: '1.00',
    quoteSymbol: 'USDC',
    quoteMint: activeQuoteMints.USDC.mint,
    decimals: 6,
    totalSupply: '100,000,000',
  });

  // Step 2: Selected Market Profile Preset
  const [selectedProfile, setSelectedProfile] = useState<MarketProfileKey>('conservative');

  // Unified Curve Studio Configuration Input for Meteora DBC
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
    setConfigInput((prev) => {
      const refPriceNum = parseFloat(updated.referencePrice) || 1.0;
      const parsedSupply = parseInt(updated.totalSupply.replace(/,/g, '')) || 10000000;
      return {
        ...prev,
        assetName: updated.assetName,
        ticker: updated.ticker,
        baseMint: updated.baseMint,
        assetCategory: updated.assetCategory,
        quoteSymbol: updated.quoteSymbol,
        quoteMint: updated.quoteMint,
        tokenDecimals: updated.decimals,
        totalSupply: parsedSupply,
        referencePrice: refPriceNum,
        startingPriceQuote: prev.startingPriceQuote || refPriceNum,
      };
    });
  };

  // Handler when Step 2 profile changes
  const handleProfileSelect = (key: MarketProfileKey) => {
    setSelectedProfile(key);
    const refPriceNum = parseFloat(assetData.referencePrice) || 1.0;
    setConfigInput((prev) => applyProfilePresetToInput(prev, key, refPriceNum));
  };

  // Step advancement helper
  const goToStep = (stepNumber: number) => {
    if (stepNumber > currentStep) {
      // Mark prior steps as completed
      setCompletedSteps((prev) => {
        const set = new Set([...prev, currentStep]);
        return Array.from(set);
      });
    }
    setCurrentStep(stepNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    if (confirm('Reset Curve Studio configuration to defaults?')) {
      setCurrentStep(1);
      setCompletedSteps([]);
      setSelectedProfile('conservative');
      const base = createDefaultCurveStudioInput();
      setConfigInput(applyProfilePresetToInput(base, 'conservative', 1.0));
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-radial from-amber-500/10 via-[#0c101a] to-[#080b12] border border-zinc-800/80 rounded-2xl p-5 sm:p-7 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4 max-w-2xl">
            <ValticsMark size={52} glow className="shrink-0 hidden sm:inline-flex" />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  Primary Product Feature
                </span>
                <span className="text-zinc-400 text-xs">•</span>
                <span className="text-zinc-400 text-xs font-mono">Meteora Dynamic Bonding Curve v1</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                VALTICS Curve Studio
              </h1>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Design, simulate, and configure production-grade Dynamic Bonding Curve markets for tokenized Real World Assets on Solana.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleReset}
              className="py-2 px-3.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
              <span>Reset Configuration</span>
            </button>
          </div>
        </div>
      </div>

      {/* Multi-Step Interactive Navigation Stepper */}
      <StudioStepper
        currentStep={currentStep}
        onSelectStep={goToStep}
        completedSteps={completedSteps}
      />

      {/* Step Content Renderers */}
      <div className="transition-all duration-200">
        {currentStep === 1 && (
          <Step1Asset
            data={assetData}
            onChange={handleAssetDataChange}
            onNext={() => goToStep(2)}
          />
        )}

        {currentStep === 2 && (
          <Step2MarketProfile
            selectedProfile={selectedProfile}
            onSelectProfile={handleProfileSelect}
            onNext={() => goToStep(3)}
            onBack={() => goToStep(1)}
            quoteSymbol={assetData.quoteSymbol}
          />
        )}

        {currentStep === 3 && (
          <Step3CurveConfig
            input={configInput}
            onChange={setConfigInput}
            onNext={() => goToStep(4)}
            onBack={() => goToStep(2)}
          />
        )}

        {currentStep === 4 && (
          <Step4Visualization
            input={configInput}
            onNext={() => goToStep(5)}
            onBack={() => goToStep(3)}
          />
        )}

        {currentStep === 5 && (
          <Step5Preview
            input={configInput}
            onNext={() => goToStep(6)}
            onBack={() => goToStep(4)}
            onOpenWalletModal={onOpenWalletModal || (() => {})}
          />
        )}

        {currentStep === 6 && (
          <Step6Create
            input={configInput}
            onBack={() => goToStep(5)}
            onSelectTab={onSelectTab}
            onSelectMarketDetail={onSelectMarketDetail}
            onOpenWalletModal={onOpenWalletModal}
          />
        )}
      </div>
    </div>
  );
};
