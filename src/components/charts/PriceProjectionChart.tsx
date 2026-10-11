import React, { useState } from 'react';
import { formatCurrency, formatPercent } from '../../utils/format';

interface PriceProjectionProps {
  currentSpotPriceUsd: number;
  curveAlgorithm: string;
  totalSupply: number;
  reserveQuoteUsd: number;
}

export const PriceProjectionChart: React.FC<PriceProjectionProps> = ({
  currentSpotPriceUsd,
  totalSupply,
  reserveQuoteUsd,
}) => {
  const [selectedOrderSol, setSelectedOrderSol] = useState<number>(5);

  // Simulated purchase simulations: 1 SOL, 5 SOL, 25 SOL, 100 SOL
  const orderPresets = [1, 5, 20, 50, 100];

  // Mathematical simulated impact: marginal price progression
  const simulations = orderPresets.map((solAmount) => {
    const solUsdRate = 160; // Standard nominal reference
    const orderUsd = solAmount * solUsdRate;
    const baseReserveUsd = Math.max(reserveQuoteUsd, 10000);
    // Constant product / virtual reserve slippage model: deltaP = orderUsd / baseReserve
    const slippagePct = Math.min(45, (orderUsd / (baseReserveUsd * 2)) * 100);
    const avgExecutionPrice = currentSpotPriceUsd * (1 + slippagePct / 200);
    const tokensReceived = orderUsd / avgExecutionPrice;
    const newSpotPrice = currentSpotPriceUsd * (1 + slippagePct / 100);

    return {
      solAmount,
      orderUsd,
      slippagePct,
      tokensReceived,
      avgExecutionPrice,
      newSpotPrice,
    };
  });

  const activeSim = simulations.find((s) => s.solAmount === selectedOrderSol) || simulations[1];

  return (
    <div className="rounded-xl border border-[#670CDC]/25 bg-[#140130] p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#670CDC]/20 pb-3">
        <div>
          <h4 className="font-semibold text-xs uppercase tracking-wider text-[#F7F3FF]">
            Order Impact & Marginal Price Projection
          </h4>
          <p className="text-[11px] text-[#B8A9CC]">
            Simulate buy pressure on the Meteora DBC curve prior to order execution
          </p>
        </div>

        {/* Order Size Presets */}
        <div className="flex items-center gap-1 bg-[#100126] p-1 rounded-lg border border-[#670CDC]/25 self-start">
          {orderPresets.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => setSelectedOrderSol(amount)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-colors cursor-pointer ${
                selectedOrderSol === amount
                  ? 'bg-[#F99225] text-white font-bold shadow-xs'
                  : 'text-[#B8A9CC] hover:text-[#F7F3FF]'
              }`}
            >
              {amount} SOL
            </button>
          ))}
        </div>
      </div>

      {/* Projection Impact Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#100126] p-3.5 rounded-xl border border-[#670CDC]/20 font-mono-nums text-xs">
        <div>
          <span className="text-[10px] uppercase font-sans text-[#7E6D96] block">
            Order Value
          </span>
          <span className="text-[#F7F3FF] font-bold">
            {activeSim.solAmount} SOL (${activeSim.orderUsd.toLocaleString()})
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-sans text-[#7E6D96] block">
            Expected Slippage
          </span>
          <span
            className={`font-bold ${
              activeSim.slippagePct > 5
                ? 'text-rose-400'
                : activeSim.slippagePct > 2
                ? 'text-[#F99225]'
                : 'text-emerald-400'
            }`}
          >
            {formatPercent(activeSim.slippagePct)}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-sans text-[#7E6D96] block">
            Avg Execution Price
          </span>
          <span className="text-[#F7F3FF] font-medium">
            {formatCurrency(activeSim.avgExecutionPrice)}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-sans text-[#7E6D96] block">
            Post-Order Spot
          </span>
          <span className="text-[#F99225] font-bold">
            {formatCurrency(activeSim.newSpotPrice)}
          </span>
        </div>
      </div>

      {/* Visual Depth Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between text-[11px] text-[#B8A9CC]">
          <span>Current Spot: {formatCurrency(currentSpotPriceUsd)}</span>
          <span>Post-Trade: {formatCurrency(activeSim.newSpotPrice)} (+{formatPercent(activeSim.slippagePct)})</span>
        </div>
        <div className="w-full h-2 rounded-full bg-[#0E0124] border border-[#670CDC]/25 overflow-hidden flex">
          <div className="h-full bg-[#670CDC]" style={{ width: '40%' }} title="Baseline Spot" />
          <div
            className="h-full bg-[#F99225] transition-all duration-300"
            style={{ width: `${Math.min(50, activeSim.slippagePct * 2)}%` }}
            title="Marginal Slippage Delta"
          />
        </div>
      </div>
    </div>
  );
};
