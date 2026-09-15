import React, { useState, useMemo } from 'react';
import { 
  Sliders, 
  ArrowRight, 
  RotateCcw,
  Layers,
  Activity,
  TrendingUp,
  Shield,
  Coins
} from 'lucide-react';
import { CurveModelParams, CurveAlgorithmType } from '../../types';
import { RWA_PRESETS, generateCurvePoints } from '../../services/curveCalculator';
import { BondingCurveChart } from '../charts/BondingCurveChart';
import { PriceProjectionChart } from '../charts/PriceProjectionChart';
import { LiquidityDistributionChart } from '../charts/LiquidityDistributionChart';
import { formatCurrency, formatNumber, formatPercent } from '../../utils/format';
import { NavigationTab } from '../layout/Header';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Table, Column } from '../ui/Table';
import { CurvePoint } from '../../types';
import { Card } from '../ui/Card';

interface CurveStudioViewProps {
  onSelectTab: (tab: NavigationTab) => void;
  onApplyToCreation?: (params: CurveModelParams) => void;
}

export const CurveStudioView: React.FC<CurveStudioViewProps> = ({
  onSelectTab,
  onApplyToCreation,
}) => {
  const [activePresetKey, setActivePresetKey] = useState<string>('REAL_ESTATE');
  const [params, setParams] = useState<CurveModelParams>(RWA_PRESETS.REAL_ESTATE);
  const [visualTab, setVisualTab] = useState<'curve' | 'impact' | 'distribution'>('curve');

  const handleSelectPreset = (key: string) => {
    setActivePresetKey(key);
    if (RWA_PRESETS[key]) {
      setParams({ ...RWA_PRESETS[key] });
    }
  };

  const curvePoints = useMemo(() => {
    return generateCurvePoints(params, 24);
  }, [params]);

  const milestones = useMemo(() => {
    if (curvePoints.length === 0) return [];
    const indices = [
      0,
      Math.floor(curvePoints.length * 0.25),
      Math.floor(curvePoints.length * 0.5),
      Math.floor(curvePoints.length * 0.75),
      curvePoints.length - 1,
    ];
    return indices.map((idx) => curvePoints[idx]);
  }, [curvePoints]);

  const handleApply = () => {
    if (onApplyToCreation) {
      onApplyToCreation(params);
    }
    onSelectTab('create');
  };

  const milestoneColumns: Column<CurvePoint>[] = [
    {
      key: 'tokensSoldPct',
      header: 'Stage',
      render: (m) => (
        <div className="flex items-center gap-1.5 font-semibold text-zinc-100">
          <span>{m.tokensSoldPct.toFixed(0)}%</span>
          {m.tokensSoldPct === 100 && (
            <Badge variant="live" size="xs">
              Graduation
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'tokensSold',
      header: 'Tokens Sold',
      align: 'right',
      render: (m) => (
        <span className="font-mono-nums text-zinc-300">{formatNumber(m.tokensSold)}</span>
      ),
    },
    {
      key: 'currentPriceUsd',
      header: 'Spot Price',
      align: 'right',
      render: (m) => (
        <span className="font-mono-nums font-semibold text-amber-400">
          {formatCurrency(m.currentPriceUsd)}
        </span>
      ),
    },
    {
      key: 'marketCapUsd',
      header: 'Market Cap',
      align: 'right',
      render: (m) => (
        <span className="font-mono-nums text-zinc-200">{formatCurrency(m.marketCapUsd)}</span>
      ),
    },
    {
      key: 'accumulatedQuoteUsd',
      header: 'Quote Reserve',
      align: 'right',
      render: (m) => (
        <span className="font-mono-nums font-semibold text-emerald-400">
          {formatCurrency(m.accumulatedQuoteUsd)}
        </span>
      ),
    },
    {
      key: 'slippageBuy1000UsdPct',
      header: 'Instant Slippage ($1k)',
      align: 'right',
      render: (m) => (
        <span className="font-mono-nums text-zinc-400">{m.slippageBuy1000UsdPct.toFixed(2)}%</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight font-sans">
              Dynamic Bonding Curve Studio
            </h1>
            <Badge variant="brand" size="xs">
              Meteora Math Modeler
            </Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Simulate price trajectories, liquidity thresholds, and slippage curves for Meteora Dynamic Bonding Curves
          </p>
        </div>

        <Button
          variant="brand"
          size="sm"
          onClick={handleApply}
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
        >
          Use in Market Creation
        </Button>
      </div>

      {/* Preset Pills */}
      <div className="space-y-2">
        <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
          Institutional RWA Presets
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { key: 'REAL_ESTATE', label: 'Commercial Real Estate', desc: 'Linear bounded discovery' },
            { key: 'PRIVATE_CREDIT', label: 'Private Credit Note', desc: 'Piecewise institutional tiers' },
            { key: 'TREASURY_BILL', label: 'US Treasury Bill', desc: 'Tight near-par liquidity' },
            { key: 'TOKENIZED_EQUITY', label: 'Pre-IPO Equity', desc: 'Sigmoidal discovery S-curve' },
          ].map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => handleSelectPreset(preset.key)}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                activePresetKey === preset.key
                  ? 'border-amber-500/60 bg-amber-500/10 text-zinc-100 shadow-xs ring-1 ring-amber-500/20'
                  : 'border-zinc-800 bg-[#0c1018] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <div className="text-xs font-semibold text-zinc-200">{preset.label}</div>
              <div className="text-[10px] text-zinc-400 mt-0.5">{preset.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Studio Grid: Parameters on Left, Chart & Milestones on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Parameter Sliders & Inputs */}
        <div className="lg:col-span-4 rounded-xl border border-zinc-800 bg-[#0c1018] p-5 space-y-5 text-xs">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <span className="font-semibold text-zinc-200 text-xs uppercase tracking-wider flex items-center gap-1.5 font-sans">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Curve Configuration</span>
            </span>
            <button
              type="button"
              onClick={() => handleSelectPreset(activePresetKey)}
              className="text-zinc-400 hover:text-zinc-200 text-[11px] flex items-center gap-1 cursor-pointer"
              title="Reset to preset defaults"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Algorithm Type Segmented Control */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-zinc-400 block uppercase">
              Mathematical Model
            </label>
            <SegmentedControl
              options={[
                { value: 'linear', label: 'Linear' },
                { value: 'exponential', label: 'Exponential' },
                { value: 'sigmoid', label: 'Sigmoid' },
                { value: 'piecewise', label: 'Piecewise' },
              ]}
              value={params.curveType}
              onChange={(algo) => {
                setActivePresetKey('CUSTOM');
                setParams({ ...params, curveType: algo as CurveAlgorithmType });
              }}
              size="sm"
              fullWidth
            />
          </div>

          {/* Total Supply & Curve Allocation */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-zinc-400 mb-1">
                <span>Total Token Supply</span>
                <span className="font-mono text-zinc-200 font-semibold">{formatNumber(params.totalSupply)}</span>
              </div>
              <input
                type="range"
                min="1000000"
                max="500000000"
                step="1000000"
                value={params.totalSupply}
                onChange={(e) => {
                  setActivePresetKey('CUSTOM');
                  setParams({ ...params, totalSupply: Number(e.target.value) });
                }}
                className="w-full accent-amber-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-zinc-400 mb-1">
                <span>Curve Allocation</span>
                <span className="font-mono text-zinc-200 font-semibold">{params.allocationToCurvePct}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="95"
                step="5"
                value={params.allocationToCurvePct}
                onChange={(e) => {
                  setActivePresetKey('CUSTOM');
                  setParams({ ...params, allocationToCurvePct: Number(e.target.value) });
                }}
                className="w-full accent-amber-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Starting Price & Migration Market Cap */}
          <div className="space-y-3 pt-2 border-t border-zinc-800/80">
            <Input
              label="Initial Spot Price"
              type="number"
              step="0.01"
              min="0.001"
              value={params.startPriceUsd}
              onChange={(e) => {
                setActivePresetKey('CUSTOM');
                setParams({ ...params, startPriceUsd: Math.max(0.001, Number(e.target.value)) });
              }}
              prefixText="$"
              tabular
            />

            <Input
              label="Graduation Market Cap"
              type="number"
              step="100000"
              min={params.startPriceUsd * params.totalSupply}
              value={params.migrationMarketCapUsd}
              onChange={(e) => {
                setActivePresetKey('CUSTOM');
                setParams({ ...params, migrationMarketCapUsd: Number(e.target.value) });
              }}
              prefixText="$"
              tabular
            />
          </div>

          {/* Quote Currency & Base Fee */}
          <div className="space-y-3 pt-2 border-t border-zinc-800/80">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Quote Asset</label>
                <SegmentedControl
                  options={[
                    { value: 'USDC', label: 'USDC' },
                    { value: 'SOL', label: 'SOL' },
                  ]}
                  value={params.quoteAsset}
                  onChange={(val) => {
                    const q = val as 'SOL' | 'USDC';
                    setParams({
                      ...params,
                      quoteAsset: q,
                      quotePriceUsd: q === 'SOL' ? 160 : 1.0,
                    });
                  }}
                  size="sm"
                  fullWidth
                />
              </div>

              <Input
                label="Fee (BPS)"
                type="number"
                min="25"
                max="500"
                step="5"
                value={params.feeBps}
                onChange={(e) => setParams({ ...params, feeBps: Number(e.target.value) })}
                suffixText="bps"
                tabular
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                AMM Graduation Target
              </label>
              <SegmentedControl
                options={[
                  { value: 'MET_DAMM_V2', label: 'DAMM v2 / DLMM' },
                  { value: 'MET_DAMM', label: 'DAMM v1' },
                ]}
                value={params.migrationTarget}
                onChange={(target) => setParams({ ...params, migrationTarget: target as any })}
                size="sm"
                fullWidth
              />
            </div>
          </div>
        </div>

        {/* Right Column: Visualization Tabs & Milestone Table */}
        <div className="lg:col-span-8 space-y-4">
          {/* Visual switcher */}
          <div className="flex items-center justify-between">
            <SegmentedControl
              options={[
                { value: 'curve', label: 'Bonding Curve Path', icon: <TrendingUp className="w-3.5 h-3.5" /> },
                { value: 'impact', label: 'Order Slippage Impact', icon: <Activity className="w-3.5 h-3.5" /> },
                { value: 'distribution', label: 'Liquidity Distribution', icon: <Coins className="w-3.5 h-3.5" /> },
              ]}
              value={visualTab}
              onChange={(tab) => setVisualTab(tab as any)}
              size="sm"
            />
            <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">
              Meteora DBC Formulation
            </span>
          </div>

          {/* Active Chart */}
          {visualTab === 'curve' && (
            <BondingCurveChart points={curvePoints} quoteAsset={params.quoteAsset} />
          )}

          {visualTab === 'impact' && (
            <PriceProjectionChart
              currentSpotPriceUsd={params.startPriceUsd}
              curveAlgorithm={params.curveType}
              totalSupply={params.totalSupply}
              reserveQuoteUsd={params.startPriceUsd * (params.totalSupply * 0.1)}
            />
          )}

          {visualTab === 'distribution' && (
            <LiquidityDistributionChart
              baseReserve={(params.totalSupply * params.allocationToCurvePct) / 100}
              baseSymbol="ASSET"
              quoteReserve={params.migrationMarketCapUsd * 0.4}
              quoteSymbol={params.quoteAsset}
              targetQuoteThreshold={params.migrationMarketCapUsd * 0.8}
            />
          )}

          {/* Curve Progression Milestones Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Progression Milestones & Liquidity Depth
              </span>
              <span className="text-[11px] font-mono text-zinc-500">
                Meteora DBC Mathematical Projection
              </span>
            </div>

            <Table
              columns={milestoneColumns}
              data={milestones}
              keyExtractor={(m, idx) => idx}
              dense
            />
          </div>
        </div>
      </div>
    </div>
  );
};
