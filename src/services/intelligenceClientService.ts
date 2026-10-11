import {
  MarketSuggestionParams,
  MarketSuggestionResult,
  MarketValidationInput,
  MarketValidationResult,
  MarketBriefInput,
  MarketBriefResult,
} from './marketIntelligenceEngine';

export async function fetchMarketSuggestion(
  params: MarketSuggestionParams
): Promise<MarketSuggestionResult> {
  const res = await fetch('/api/intelligence/suggest-market', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    throw new Error('Failed to fetch AI market suggestion');
  }
  const json = await res.json();
  return json.data;
}

export async function fetchMarketValidation(
  input: MarketValidationInput
): Promise<MarketValidationResult> {
  const res = await fetch('/api/intelligence/validate-market', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error('Failed to validate market');
  }
  const json = await res.json();
  return json.data;
}

export async function fetchMarketBrief(
  input: MarketBriefInput
): Promise<MarketBriefResult> {
  const res = await fetch('/api/intelligence/market-brief', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error('Failed to generate market brief');
  }
  const json = await res.json();
  return json.data;
}
