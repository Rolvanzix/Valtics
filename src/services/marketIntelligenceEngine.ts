import { GoogleGenAI } from '@google/genai';
import { scanAndRedactCredentials, safeServerLog } from './agentSecurityGuard';

const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();

let genAI: GoogleGenAI | null = null;
if (GEMINI_API_KEY) {
  genAI = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

export interface MarketSuggestionParams {
  assetSymbol: string;
  assetName: string;
  currentPrice: number;
  change24hPct?: number | null;
  category?: string;
  targetDateIso?: string;
}

export interface MarketSuggestionResult {
  suggestedQuestion: string;
  suggestedType: 'STANDARD' | 'BREAKING';
  suggestedCategory: string;
  suggestedEndTime: string;
  suggestedResolutionSource: string;
  rationale: string;
  suggestedPriceTarget: number;
}

export interface MarketValidationInput {
  question: string;
  resolutionSource: string;
  endTime: string;
  marketType: 'STANDARD' | 'BREAKING';
  assetSymbol?: string;
}

export interface MarketValidationResult {
  isValid: boolean;
  checks: {
    clearQuestion: boolean;
    yesNoOutcome: boolean;
    publicResolutionSource: boolean;
    definedResolutionTime: boolean;
    futureHorizonValid: boolean;
    objectiveNotPrivate: boolean;
  };
  critique: string[];
  suggestions: string[];
  qualificationSummary: string;
}

export interface MarketBriefInput {
  assetSymbol: string;
  assetName: string;
  currentPrice: number;
  marketQuestion: string;
  marketPhase: string;
  yesPrice: number | null;
  noPrice: number | null;
  volume: number | null;
  endTime: string | null;
  resolutionSource: string | null;
}

export interface MarketBriefResult {
  facts: string[];
  marketData: {
    priceSemantics: string;
    impliedSignal: string;
    orderBookSpread?: string;
  };
  aiInterpretation: string[];
  disclaimer: string;
}

/**
 * 1. AI Market Assistant: Suggests objective YES/NO prediction market question based on asset metrics & date
 */
export async function generateMarketSuggestion(
  params: MarketSuggestionParams
): Promise<MarketSuggestionResult> {
  const { assetSymbol, assetName, currentPrice, change24hPct = 0, category = 'rwa', targetDateIso } = params;

  // Compute a default date ~30 days in the future if none provided
  const targetDate = targetDateIso ? new Date(targetDateIso) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const formattedDate = targetDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const isTargetFarFuture = targetDate.getTime() - Date.now() > 48 * 3600 * 1000;
  const marketType: 'STANDARD' | 'BREAKING' = isTargetFarFuture ? 'STANDARD' : 'BREAKING';

  // Target price heuristic (+5% to +10% round target)
  const multiplier = (change24hPct || 0) >= 0 ? 1.05 : 1.08;
  const rawTarget = currentPrice * multiplier;
  const roundTarget = rawTarget > 100 ? Math.round(rawTarget / 10) * 10 : Number(rawTarget.toFixed(2));

  const fallbackResult: MarketSuggestionResult = {
    suggestedQuestion: `Will ${assetName || assetSymbol} trade above $${roundTarget.toLocaleString()} before ${formattedDate}?`,
    suggestedType: marketType,
    suggestedCategory: category || 'tokenized',
    suggestedEndTime: targetDate.toISOString(),
    suggestedResolutionSource: `Pyth Network Oracle (${assetSymbol}/USD feed) and official benchmark index`,
    rationale: `Formulated around current price ($${currentPrice.toLocaleString()}) targeting a +${Math.round((multiplier - 1) * 100)}% benchmark over a ${isTargetFarFuture ? '30-day standard' : 'near-term breaking'} forecast window.`,
    suggestedPriceTarget: roundTarget,
  };

  if (!genAI) {
    return fallbackResult;
  }

  try {
    const prompt = `You are the VALTICS Market Intelligence Engine.
Valtics is a programmable markets layer for tokenized assets on Solana.
Panta Protocol provides the underlying binary prediction-market infrastructure.

Given the asset context:
- Asset Name: ${assetName}
- Symbol: ${assetSymbol}
- Current Live Price: $${currentPrice}
- 24h Change: ${change24hPct}%
- Category: ${category}
- Target Resolution Horizon: ${formattedDate} (${targetDate.toISOString()})

Generate an institutional-grade, unambiguous, objectively verifiable YES/NO prediction market question.
Rules:
1. Must be strictly answerable with YES or NO.
2. Must mention an explicit numerical price or benchmark condition and explicit resolution date.
3. Must name an authoritative public resolution source (e.g. Pyth Network oracle, COMEX, LBMA, official SEC/ETF filings).
4. Never assume private data.
5. If horizon is >48 hours, market type is STANDARD; otherwise BREAKING.

Respond with strict JSON matching this structure:
{
  "suggestedQuestion": "Will Tokenized Gold (PAXG) trade above $2,850 by November 15, 2026?",
  "suggestedType": "STANDARD",
  "suggestedCategory": "${category}",
  "suggestedEndTime": "${targetDate.toISOString()}",
  "suggestedResolutionSource": "Pyth Network Hermes Feed (Crypto.PAXG/USD)",
  "rationale": "Brief 1-2 sentence explanation connecting current asset momentum to the forecast target.",
  "suggestedPriceTarget": ${roundTarget}
}`;

    const res = await withTimeout(
      genAI.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      }),
      3000
    );

    if (res.text) {
      const parsed = JSON.parse(res.text);
      if (parsed.suggestedQuestion) {
        return {
          suggestedQuestion: String(parsed.suggestedQuestion).trim(),
          suggestedType: parsed.suggestedType === 'BREAKING' ? 'BREAKING' : 'STANDARD',
          suggestedCategory: parsed.suggestedCategory || category,
          suggestedEndTime: parsed.suggestedEndTime || targetDate.toISOString(),
          suggestedResolutionSource: parsed.suggestedResolutionSource || fallbackResult.suggestedResolutionSource,
          rationale: parsed.rationale || fallbackResult.rationale,
          suggestedPriceTarget: Number(parsed.suggestedPriceTarget) || roundTarget,
        };
      }
    }
  } catch (err) {
    safeServerLog('IntelligenceError', 'Error calling Gemini for market suggestion: ' + String(err));
  }

  return fallbackResult;
}

/**
 * 2. Market Quality Validation: Rigorous deterministic and AI validation
 */
export async function validateMarketQuality(
  input: MarketValidationInput
): Promise<MarketValidationResult> {
  const { question, resolutionSource, endTime, marketType } = input;
  const cleanQ = (question || '').trim();
  const cleanSource = (resolutionSource || '').trim();

  // 1. Deterministic Checks
  const hasQuestionMark = cleanQ.endsWith('?');
  const isYesNo = /^(will|is|can|does|did|has|shall|would|could)\b/i.test(cleanQ);
  const mentionsTarget = /\b(\$|above|below|reach|exceed|hit|surpass|launch|resolve)\b/i.test(cleanQ);
  const clearQuestion = cleanQ.length >= 15 && hasQuestionMark && mentionsTarget;
  const yesNoOutcome = isYesNo || /\b(yes|no)\b/i.test(cleanQ) || hasQuestionMark;

  const publicResolutionSource = cleanSource.length >= 5 && !/private|insider|rumor|secret/i.test(cleanSource);

  let futureHorizonValid = false;
  let definedResolutionTime = false;
  try {
    const end = new Date(endTime).getTime();
    const now = Date.now();
    definedResolutionTime = !isNaN(end);
    // Panta rules: STANDARD requires > 48h horizon; BREAKING can be < 48h
    if (definedResolutionTime && end > now) {
      const diffHours = (end - now) / (1000 * 3600);
      if (marketType === 'STANDARD') {
        futureHorizonValid = diffHours >= 24; // Panta standard window
      } else {
        futureHorizonValid = diffHours >= 1; // Breaking event window
      }
    }
  } catch {
    definedResolutionTime = false;
    futureHorizonValid = false;
  }

  const objectiveNotPrivate = !/\b(my|our|i think|feel|opinion|private|insider|leaked)\b/i.test(cleanQ);

  const checks = {
    clearQuestion,
    yesNoOutcome,
    publicResolutionSource,
    definedResolutionTime,
    futureHorizonValid,
    objectiveNotPrivate,
  };

  const critique: string[] = [];
  const suggestions: string[] = [];

  if (!checks.yesNoOutcome || !isYesNo) {
    critique.push('Question should begin with "Will", "Did", or "Is" to enforce an unambiguous binary YES/NO resolution.');
    suggestions.push('Format: "Will [Asset] trade [above/below] $[Price] before [Date]?"');
  }

  if (!checks.clearQuestion) {
    critique.push('Question is too short or ambiguous. Must define a concrete milestone or numeric condition.');
  }

  if (!checks.publicResolutionSource) {
    critique.push('Publicly verifiable resolution source is required (e.g., Pyth Network Oracle, Bloomberg, LBMA, SEC Filings).');
  }

  if (!checks.definedResolutionTime) {
    critique.push('A valid ISO resolution date/time must be specified.');
  } else if (!checks.futureHorizonValid) {
    critique.push(
      marketType === 'STANDARD'
        ? 'Standard Panta markets require an event horizon at least 24 hours into the future.'
        : 'Event time must be in the future.'
    );
  }

  if (!checks.objectiveNotPrivate) {
    critique.push('Resolution must rely on objective public records, not private sentiment or subjective views.');
  }

  const isValid = Object.values(checks).every(Boolean);

  return {
    isValid,
    checks,
    critique,
    suggestions,
    qualificationSummary: isValid
      ? `Validated as compliant ${marketType} Panta Prediction Market.`
      : `Market does not yet qualify for ${marketType} issuance. Review the checklist requirements below.`,
  };
}

/**
 * 3. AI Market Brief: FACTS vs MARKET DATA vs AI INTERPRETATION with strict price semantics
 */
export async function generateMarketBrief(
  input: MarketBriefInput
): Promise<MarketBriefResult> {
  const {
    assetSymbol,
    assetName,
    currentPrice,
    marketQuestion,
    marketPhase,
    yesPrice,
    noPrice,
    volume,
    endTime,
    resolutionSource,
  } = input;

  const isPrimary = marketPhase === 'primary_issuance';
  const priceSemantics = isPrimary
    ? 'In Primary Market, YES and NO prices act as probability-like forecast signals ($0.00 – $1.00) driven directly by protocol participant capital commitments.'
    : 'In Secondary Market, prices represent order-book bid and ask quotes rather than direct probabilities, determined by Central Limit Order Book (CLOB) liquidity.';

  const impliedSignal = yesPrice !== null
    ? `${Math.round(yesPrice * 100)}% Implied YES Consensus · ${Math.round((noPrice || (1 - yesPrice)) * 100)}% NO`
    : 'Pricing data currently initializing';

  // Base Facts
  const facts: string[] = [
    `Asset: ${assetName} (${assetSymbol}) currently trading at $${currentPrice.toLocaleString()} on live Pyth Hermes oracle benchmark.`,
    `Prediction Market Question: "${marketQuestion}".`,
    `Current Phase: ${marketPhase.toUpperCase().replace('_', ' ')}.`,
    `Authoritative Resolution Source: ${resolutionSource || 'Panta Autonomous Oracle Network'}.`,
    `Resolution Target Time: ${endTime ? new Date(endTime).toUTCString() : 'Pending event conclusion'}.`,
    `Cumulative Traded Volume: ${volume !== null ? `$${volume.toLocaleString()} USDC` : '$0 USDC'}.`,
  ];

  const disclaimer =
    'VALTICS MARKET INTELLIGENCE DISCLAIMER: AI research summaries are for analytical structuring and information synthesis only. AI analysis never guarantees market outcomes, and prediction market prices do not represent certainty. All decisions remain strictly user-directed with explicit wallet signing.';

  // Default interpretation fallback
  const fallbackInterpretation: string[] = [
    `The current consensus reflects participant sentiment regarding ${assetSymbol}'s price trajectory relative to the target threshold.`,
    `Market participants should evaluate macroeconomic variables, benchmark historical volatility, and oracle update latency when assessing position sizing.`,
    `Liquidity depth in the ${isPrimary ? 'primary AMM pool' : 'secondary order book'} indicates active protocol participation without artificial wash activity.`,
  ];

  if (!genAI) {
    return {
      facts,
      marketData: {
        priceSemantics,
        impliedSignal,
      },
      aiInterpretation: fallbackInterpretation,
      disclaimer,
    };
  }

  try {
    const prompt = `You are the VALTICS Market Intelligence Engine.
Provide an institutional-grade research brief for this Panta prediction market attached to a tokenized asset.

STRICT PRINCIPLE:
- SEPARATE FACTS from AI INTERPRETATION from MARKET DATA.
- NEVER claim that AI guarantees an outcome.
- NEVER declare a market price is certain.
- Note whether the market is PRIMARY (prices are probability-like demand signals) or SECONDARY (prices are order-book market prices).

Input Data:
- Asset: ${assetName} (${assetSymbol}) at $${currentPrice}
- Market Question: ${marketQuestion}
- Phase: ${marketPhase}
- YES Price: ${yesPrice !== null ? '$' + yesPrice : 'N/A'}
- NO Price: ${noPrice !== null ? '$' + noPrice : 'N/A'}
- Volume: ${volume !== null ? '$' + volume : 'N/A'}
- Resolution Source: ${resolutionSource}

Respond with strict JSON matching:
{
  "aiInterpretation": [
    "Key analytical observation about the spread between oracle price and market target.",
    "Macroeconomic or tokenized asset context relevant to the forecast horizon.",
    "Risk consideration regarding volatility and oracle settlement mechanics."
  ]
}`;

    const res = await withTimeout(
      genAI.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      }),
      3000
    );

    if (res.text) {
      const parsed = JSON.parse(res.text);
      if (Array.isArray(parsed.aiInterpretation) && parsed.aiInterpretation.length > 0) {
        return {
          facts,
          marketData: {
            priceSemantics,
            impliedSignal,
          },
          aiInterpretation: parsed.aiInterpretation.map(String),
          disclaimer,
        };
      }
    }
  } catch (err) {
    safeServerLog('IntelligenceBriefError', 'Error generating AI brief: ' + String(err));
  }

  return {
    facts,
    marketData: {
      priceSemantics,
      impliedSignal,
    },
    aiInterpretation: fallbackInterpretation,
    disclaimer,
  };
}
