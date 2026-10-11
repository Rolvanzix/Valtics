import { ValticsPredictionMarket } from '../types/panta';

export interface TokenizedAssetRelevance {
  isRelevant: boolean;
  assetLabel?: string;
  matchedKeyword?: string;
  rationale?: string;
}

// Canonical asset keyword dictionaries mapped to Valtics tokenized asset classes
const ASSET_KEYWORDS: Array<{
  keyword: string;
  regex: RegExp;
  label: string;
  category: string;
}> = [
  // Crypto settlement assets
  { keyword: 'bitcoin', regex: /\b(btc|bitcoin)\b/i, label: 'Bitcoin (BTC)', category: 'Tokenized Digital Asset' },
  { keyword: 'ethereum', regex: /\b(eth|ethereum)\b/i, label: 'Ethereum (ETH)', category: 'Tokenized Digital Asset' },
  { keyword: 'solana', regex: /\b(sol|solana)\b/i, label: 'Solana (SOL)', category: 'Tokenized Digital Asset' },
  { keyword: 'stablecoin', regex: /\b(usdc|usdt|stablecoin)\b/i, label: 'Digital Dollar (USDC)', category: 'Digital Settlement' },

  // Commodities & Metals
  { keyword: 'gold', regex: /\b(gold|xau|paxg|xaut)\b/i, label: 'Physical Gold (XAU/PAXG)', category: 'Tokenized Commodity' },
  { keyword: 'silver', regex: /\b(silver|xag)\b/i, label: 'Physical Silver (XAG)', category: 'Tokenized Commodity' },
  { keyword: 'oil', regex: /\b(crude oil|brent|wti)\b/i, label: 'Crude Oil (WTI)', category: 'Tokenized Commodity' },

  // Equities & Indices
  { keyword: 'sp500', regex: /\b(s&p|sp500|spy)\b/i, label: 'S&P 500 Benchmark', category: 'Tokenized Index' },
  { keyword: 'nasdaq', regex: /\b(nasdaq|qqq)\b/i, label: 'Nasdaq-100 Benchmark', category: 'Tokenized Index' },

  // Bonds & Macro Rates
  { keyword: 'treasury', regex: /\b(treasury|treasuries|us10y|fed rate|interest rate|yield)\b/i, label: 'US Treasury & Rates', category: 'Tokenized Bond' },
];

/**
 * Evaluates whether a Panta prediction market is reliably relevant to
 * tokenized assets represented in Valtics.
 * 
 * Strict boundary:
 * If no recognizable asset keyword or verified metadata match exists, returns isRelevant: false.
 * Prevents false claims on general, political, or entertainment prediction markets.
 */
export function evaluateTokenizedAssetRelevance(market: ValticsPredictionMarket): TokenizedAssetRelevance {
  const title = (market.title || market.question || '').toLowerCase();
  const desc = (market.description || '').toLowerCase();
  const tags = (market.tags || []).map((t) => t.toLowerCase());
  const category = (market.category || '').toLowerCase();

  const combinedSearchText = `${title} ${desc} ${tags.join(' ')}`;

  for (const entry of ASSET_KEYWORDS) {
    if (entry.regex.test(combinedSearchText)) {
      return {
        isRelevant: true,
        assetLabel: entry.label,
        matchedKeyword: entry.keyword,
        rationale: `Directly references ${entry.label} (${entry.category})`,
      };
    }
  }

  // If category is crypto or finance, check if tags contain known tokens
  if (category === 'crypto') {
    return {
      isRelevant: true,
      assetLabel: 'Cryptocurrency Benchmark',
      matchedKeyword: 'crypto',
      rationale: 'Classified under Panta Crypto settlement sector',
    };
  }

  return {
    isRelevant: false,
  };
}

/**
 * Filter a list of Panta prediction markets that are specifically relevant to
 * a given Valtics tokenized asset symbol or name.
 */
export function getMarketsRelatedToAsset(
  markets: ValticsPredictionMarket[],
  assetSymbol?: string | null,
  assetName?: string | null
): ValticsPredictionMarket[] {
  if (!markets || markets.length === 0) return [];
  if (!assetSymbol && !assetName) return [];

  const sym = (assetSymbol || '').toLowerCase().trim();
  const name = (assetName || '').toLowerCase().trim();

  return markets.filter((market) => {
    const text = `${market.title || market.question || ''} ${market.description || ''} ${(market.tags || []).join(' ')}`.toLowerCase();

    // Direct symbol match (e.g. "SOL", "USDY", "PAXG", "TBILL")
    if (sym && (text.includes(sym) || (market.tags || []).some(t => t.toLowerCase() === sym))) {
      return true;
    }

    // Direct name match or aliases
    if (name) {
      const words = name.split(/\s+/).filter(w => w.length > 2);
      for (const word of words) {
        if (text.includes(word)) return true;
      }
    }

    // Specific known mappings
    if ((sym === 'usdy' || name.includes('ondo')) && (text.includes('ondo') || text.includes('usdy'))) return true;
    if ((sym === 'paxg' || name.includes('gold')) && (text.includes('gold') || text.includes('paxg') || text.includes('xau'))) return true;
    if ((sym === 'sol' || name.includes('solana')) && (text.includes('solana') || text.includes('sol'))) return true;
    if ((sym.includes('treasury') || sym.includes('tbill') || sym.includes('ustb') || name.includes('treasury') || name.includes('buidl')) && (text.includes('treasury') || text.includes('yield') || text.includes('buidl') || text.includes('us10y'))) return true;
    if ((sym === 'met' || name.includes('meteora')) && (text.includes('meteora') || text.includes('damm') || text.includes('dbc'))) return true;

    return false;
  });
}
