import { CurveModelParams, CurvePoint } from '../types';

export const RWA_PRESETS: Record<string, CurveModelParams> = {
  REAL_ESTATE: {
    curveType: 'linear',
    totalSupply: 10_000_000,
    allocationToCurvePct: 75,
    startPriceUsd: 10.0,
    migrationMarketCapUsd: 120_000_000,
    quoteAsset: 'USDC',
    quotePriceUsd: 1.0,
    feeBps: 30, // 0.30%
    antiSniperSlots: 100,
    migrationTarget: 'MET_DAMM_V2',
    vestingDays: 365,
  },
  PRIVATE_CREDIT: {
    curveType: 'piecewise',
    totalSupply: 50_000_000,
    allocationToCurvePct: 80,
    startPriceUsd: 1.0,
    migrationMarketCapUsd: 55_000_000,
    quoteAsset: 'USDC',
    quotePriceUsd: 1.0,
    feeBps: 25, // 0.25%
    antiSniperSlots: 150,
    migrationTarget: 'MET_DAMM_V2',
    vestingDays: 180,
  },
  TREASURY_BILL: {
    curveType: 'linear',
    totalSupply: 100_000_000,
    allocationToCurvePct: 90,
    startPriceUsd: 0.985,
    migrationMarketCapUsd: 102_000_000,
    quoteAsset: 'USDC',
    quotePriceUsd: 1.0,
    feeBps: 20, // 0.20%
    antiSniperSlots: 50,
    migrationTarget: 'MET_DAMM_V2',
    vestingDays: 90,
  },
  TOKENIZED_EQUITY: {
    curveType: 'sigmoid',
    totalSupply: 20_000_000,
    allocationToCurvePct: 70,
    startPriceUsd: 5.0,
    migrationMarketCapUsd: 180_000_000,
    quoteAsset: 'USDC',
    quotePriceUsd: 1.0,
    feeBps: 50, // 0.50%
    antiSniperSlots: 200,
    migrationTarget: 'MET_DAMM_V2',
    vestingDays: 365,
  },
};

export function generateCurvePoints(params: CurveModelParams, steps = 20): CurvePoint[] {
  const curveTokens = (params.totalSupply * params.allocationToCurvePct) / 100;
  const startPrice = params.startPriceUsd / params.quotePriceUsd;
  const finalPrice = (params.migrationMarketCapUsd / params.totalSupply) / params.quotePriceUsd;

  const points: CurvePoint[] = [];
  let cumulativeQuote = 0;

  for (let i = 0; i <= steps; i++) {
    const fraction = i / steps;
    const tokensSold = curveTokens * fraction;
    const tokensRemaining = curveTokens - tokensSold;
    let priceQuote = startPrice;

    if (params.curveType === 'linear') {
      priceQuote = startPrice + (finalPrice - startPrice) * fraction;
    } else if (params.curveType === 'exponential') {
      const growthFactor = Math.log(Math.max(1.001, finalPrice / startPrice));
      priceQuote = startPrice * Math.exp(growthFactor * fraction);
    } else if (params.curveType === 'sigmoid') {
      // S-Curve: smooth transition with steep discovery in middle
      const sigmoidFactor = 1 / (1 + Math.exp(-8 * (fraction - 0.5)));
      priceQuote = startPrice + (finalPrice - startPrice) * sigmoidFactor;
    } else if (params.curveType === 'piecewise') {
      // 3 tiers: Initial Institutional allocation (mild slope), Growth, Final Graduation
      if (fraction < 0.3) {
        priceQuote = startPrice + (finalPrice - startPrice) * 0.15 * (fraction / 0.3);
      } else if (fraction < 0.8) {
        const midFrac = (fraction - 0.3) / 0.5;
        priceQuote = startPrice + (finalPrice - startPrice) * (0.15 + 0.65 * midFrac);
      } else {
        const topFrac = (fraction - 0.8) / 0.2;
        priceQuote = startPrice + (finalPrice - startPrice) * (0.8 + 0.2 * topFrac);
      }
    }

    const priceUsd = priceQuote * params.quotePriceUsd;
    const marketCapUsd = priceUsd * params.totalSupply;

    // Approximate quote collected by trapezoidal integration
    if (i > 0) {
      const prevPrice = points[i - 1].currentPriceQuote;
      const stepTokens = tokensSold - points[i - 1].tokensSold;
      const stepQuote = ((prevPrice + priceQuote) / 2) * stepTokens;
      cumulativeQuote += stepQuote;
    }

    // Slippage calculation for a $1,000 USD institutional purchase at this depth
    const orderQuote = 1000 / params.quotePriceUsd;
    const instantaneousSlope = (finalPrice - startPrice) / Math.max(1, curveTokens);
    const estimatedImpact = Math.min(15, Math.max(0.01, (instantaneousSlope * orderQuote * 100) / priceQuote));

    points.push({
      step: i,
      tokensSold,
      tokensSoldPct: fraction * 100,
      tokensRemaining,
      currentPriceQuote: priceQuote,
      currentPriceUsd: priceUsd,
      accumulatedQuote: cumulativeQuote,
      accumulatedQuoteUsd: cumulativeQuote * params.quotePriceUsd,
      marketCapUsd,
      slippageBuy1000UsdPct: estimatedImpact,
    });
  }

  return points;
}
