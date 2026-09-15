import { PublicKey } from '@solana/web3.js';
import { PROTOCOL_BOUNDS } from '../config/constants';
import { CreateMarketFormData } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function isValidSolanaAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  const trimmed = address.trim();
  if (trimmed.length < 32 || trimmed.length > 44) return false;
  try {
    const pubkey = new PublicKey(trimmed);
    return PublicKey.isOnCurve(pubkey.toBuffer());
  } catch {
    return false;
  }
}

export function validateMarketCreationForm(data: CreateMarketFormData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Asset validation
  if (!data.isNewMint) {
    if (!data.baseMint || !isValidSolanaAddress(data.baseMint)) {
      errors.push('Base token mint address is invalid. Must be a valid 32-44 char base58 Solana public key.');
    }
  } else {
    if (!data.tokenName || data.tokenName.trim().length < 2) {
      errors.push('Token name is required (min 2 characters).');
    }
    if (!data.tokenSymbol || data.tokenSymbol.trim().length < 2) {
      errors.push('Token symbol is required (2-10 characters).');
    }
  }

  const supply = parseFloat(data.totalSupply.replace(/,/g, ''));
  if (isNaN(supply) || supply <= 0) {
    errors.push('Total supply must be a positive number.');
  }

  const curveAlloc = parseFloat(data.curveAllocationTokens.replace(/,/g, ''));
  if (isNaN(curveAlloc) || curveAlloc <= 0) {
    errors.push('Curve allocation tokens must be a positive number.');
  } else if (supply > 0 && curveAlloc > supply) {
    errors.push('Curve allocation cannot exceed total supply.');
  } else if (supply > 0 && (curveAlloc / supply) < 0.2) {
    warnings.push('Allocating less than 20% to the dynamic bonding curve may cause extreme price impact.');
  }

  // Price & Threshold validation
  const startPrice = parseFloat(data.startingPriceQuote);
  const migPrice = parseFloat(data.migrationPriceQuote);
  if (isNaN(startPrice) || startPrice <= 0) {
    errors.push('Starting price must be greater than zero.');
  }
  if (isNaN(migPrice) || migPrice <= 0) {
    errors.push('Migration target price must be greater than zero.');
  }
  if (!isNaN(startPrice) && !isNaN(migPrice) && migPrice <= startPrice) {
    errors.push('Migration price must be higher than starting price for bonding curve accumulation.');
  }

  const quoteThreshold = parseFloat(data.migrationQuoteThreshold.replace(/,/g, ''));
  if (isNaN(quoteThreshold) || quoteThreshold <= 0) {
    errors.push('Migration quote threshold must be a positive amount.');
  }

  // Fee bounds
  if (data.baseFeeBps < PROTOCOL_BOUNDS.MIN_FEE_BPS) {
    errors.push(`Base fee must be at least ${PROTOCOL_BOUNDS.MIN_FEE_BPS} bps (0.25%).`);
  }
  if (data.baseFeeBps > PROTOCOL_BOUNDS.MAX_FEE_BPS) {
    errors.push(`Base fee cannot exceed ${PROTOCOL_BOUNDS.MAX_FEE_BPS} bps (10.00%).`);
  }
  if (data.baseFeeBps > 300) {
    warnings.push('High trading fee (>3.00%) may discourage initial liquidity adoption.');
  }

  // Lock and vesting
  if (data.liquidityLockDays === 0) {
    warnings.push('Zero liquidity lock duration: LP tokens will not be locked upon graduation to Meteora AMM. Institutional investors generally expect at least 180-365 days lock.');
  }

  // Anti-sniper
  if (data.antiSniperRateLimiterSeconds > PROTOCOL_BOUNDS.MAX_RATE_LIMITER_SECONDS) {
    errors.push(`Anti-sniper rate limiter duration cannot exceed ${PROTOCOL_BOUNDS.MAX_RATE_LIMITER_SECONDS} seconds.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function sanitizeInput(val: string): string {
  return val.replace(/[<>{}]/g, '').trim();
}
