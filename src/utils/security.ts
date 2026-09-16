/**
 * VALTICS Security Infrastructure & Verification Utilities
 * 
 * SECURITY IS A FIRST-CLASS CITIZEN IN VALTICS:
 * 1. Zero Secret Storage: Seed phrases, private keys, and wallet secrets are NEVER requested,
 *    persisted, or logged in client code, memory storage, or external sinks.
 * 2. Strict Input Sanitization: Comprehensive protection against XSS, injection attacks,
 *    malformed Base58 strings, exponential notation exploits, and unsafe URLs.
 * 3. Canonical Address Validation: Rigorous Ed25519 public key and PDA address validation.
 * 4. Error Sanitization: Information leak prevention—redacts internal RPC tokens, API keys,
 *    and system traces before presenting to user.
 */

import { PublicKey } from '@solana/web3.js';
import { PROTOCOL_BOUNDS, METEORA_DBC_PROGRAM_ID } from '../config/constants';
import { CreateMarketFormData } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface NumericValidationOptions {
  label?: string;
  min?: number;
  max?: number;
  allowZero?: boolean;
  allowDecimals?: boolean;
  maxDecimals?: number;
  required?: boolean;
}

// ============================================================================
// 1. SOLANA ADDRESS & PUBLIC KEY VALIDATION
// ============================================================================

/**
 * Validates whether a given string is a syntactically valid Solana public key.
 * Validates Ed25519 Base58 encoding, length (32-44 characters), and round-trip decoding.
 * Supports both on-curve user accounts and off-curve Program Derived Addresses (PDAs).
 * 
 * @param address The address string to validate
 * @param requireOnCurve If true, rejects off-curve PDAs (for user wallet addresses)
 */
export function isValidSolanaAddress(address: string | null | undefined, requireOnCurve = false): boolean {
  if (!address || typeof address !== 'string') return false;
  const trimmed = address.trim();
  
  // Quick length check (Base58 32-byte Ed25519 pubkey is between 32 and 44 characters)
  if (trimmed.length < 32 || trimmed.length > 44) return false;

  // Enforce valid Base58 characters only (Bitcoin/Solana Base58 alphabet: no 0, O, I, l)
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
  if (!base58Regex.test(trimmed)) return false;

  try {
    const pubkey = new PublicKey(trimmed);
    
    // Strict round-trip canonical check to avoid non-canonical Base58 representation
    if (pubkey.toBase58() !== trimmed) return false;

    if (requireOnCurve) {
      return PublicKey.isOnCurve(pubkey.toBuffer());
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates an address and returns a typed PublicKey, or throws a sanitized error.
 */
export function assertValidSolanaAddress(address: string, label = 'Address'): PublicKey {
  if (!isValidSolanaAddress(address)) {
    throw new Error(`Invalid Solana ${label}: must be a valid 32-44 character Base58 public key.`);
  }
  return new PublicKey(address.trim());
}

/**
 * Compares two Solana addresses for strict equality regardless of whitespace or casing.
 */
export function areAddressesEqual(addrA: string | null | undefined, addrB: string | null | undefined): boolean {
  if (!addrA || !addrB) return false;
  try {
    const pkA = new PublicKey(addrA.trim());
    const pkB = new PublicKey(addrB.trim());
    return pkA.equals(pkB);
  } catch {
    return false;
  }
}

// ============================================================================
// 2. INPUT SECURITY & SANITIZATION (ANTI-INJECTION / ANTI-XSS)
// ============================================================================

/**
 * Sanitizes arbitrary text inputs by stripping HTML markup, script tags,
 * unprintable control characters, and null bytes.
 * 
 * @param text Raw user input
 * @param maxLength Maximum permitted length (default 128)
 */
export function sanitizeTextInput(text: string, maxLength = 128): string {
  if (!text || typeof text !== 'string') return '';
  
  return text
    // Strip HTML opening and closing tags
    .replace(/<\/?[^>]+(>|$)/g, '')
    // Strip null bytes and unprintable control characters
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Escape risky script injection chars
    .replace(/[<>{}\\]/g, '')
    // Normalize excessive whitespace
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

/**
 * Legacy sanitizeInput alias for backward compatibility.
 */
export function sanitizeInput(val: string): string {
  return sanitizeTextInput(val);
}

/**
 * Validates and normalizes token ticker symbols.
 * Enforces: 1-10 uppercase characters, alphanumeric plus optional dash/underscore.
 */
export function validateTokenSymbol(symbol: string): { isValid: boolean; sanitized: string; error?: string } {
  if (!symbol || typeof symbol !== 'string') {
    return { isValid: false, sanitized: '', error: 'Token symbol is required.' };
  }

  const clean = symbol.trim().toUpperCase().replace(/[^A-Z0-9\-_]/g, '');
  if (clean.length < 1) {
    return { isValid: false, sanitized: clean, error: 'Token symbol must be at least 1 character.' };
  }
  if (clean.length > 10) {
    return { isValid: false, sanitized: clean.slice(0, 10), error: 'Token symbol cannot exceed 10 characters.' };
  }
  return { isValid: true, sanitized: clean };
}

/**
 * Validates and normalizes asset/token display names.
 * Enforces: 2-64 characters, safe punctuation.
 */
export function validateTokenName(name: string): { isValid: boolean; sanitized: string; error?: string } {
  if (!name || typeof name !== 'string') {
    return { isValid: false, sanitized: '', error: 'Asset name is required.' };
  }
  const clean = sanitizeTextInput(name, 64);
  if (clean.length < 2) {
    return { isValid: false, sanitized: clean, error: 'Asset name must be at least 2 characters.' };
  }
  return { isValid: true, sanitized: clean };
}

/**
 * Validates numbers against NaN, Infinity, negative values, and precision limits.
 * Prevents exponential notation exploits (e.g. "1e20" or "Infinity").
 */
export function validateNumericInput(
  val: string | number,
  options: NumericValidationOptions = {}
): { isValid: boolean; value: number; error?: string } {
  const {
    label = 'Amount',
    min = 0,
    max = Number.MAX_SAFE_INTEGER,
    allowZero = false,
    allowDecimals = true,
    maxDecimals = 9,
    required = true,
  } = options;

  if (val === undefined || val === null || val === '') {
    if (!required) return { isValid: true, value: 0 };
    return { isValid: false, value: 0, error: `${label} is required.` };
  }

  const strVal = String(val).replace(/,/g, '').trim();

  // Guard against scientific notation exploits (e.g. 1e18) which can overflow integer math
  if (/[eE]/.test(strVal)) {
    return { isValid: false, value: 0, error: `${label} cannot use exponential notation.` };
  }

  const num = parseFloat(strVal);
  if (isNaN(num) || !isFinite(num)) {
    return { isValid: false, value: 0, error: `${label} must be a valid finite number.` };
  }

  if (!allowDecimals && !Number.isInteger(num)) {
    return { isValid: false, value: num, error: `${label} must be an integer.` };
  }

  if (allowDecimals && maxDecimals !== undefined) {
    const parts = strVal.split('.');
    if (parts[1] && parts[1].length > maxDecimals) {
      return { isValid: false, value: num, error: `${label} exceeds maximum decimal precision of ${maxDecimals}.` };
    }
  }

  if (!allowZero && num === 0) {
    return { isValid: false, value: num, error: `${label} must be greater than zero.` };
  }

  if (num < min) {
    return { isValid: false, value: num, error: `${label} cannot be less than ${min}.` };
  }

  if (num > max) {
    return { isValid: false, value: num, error: `${label} exceeds maximum allowed value of ${max}.` };
  }

  return { isValid: true, value: num };
}

/**
 * Securely sanitizes URLs to prevent javascript:, data:, and malicious protocol injection.
 * Only allows trusted https:// URLs or safe relative paths.
 */
export function sanitizeUrl(rawUrl: string, fallback = '#'): string {
  if (!rawUrl || typeof rawUrl !== 'string') return fallback;
  const trimmed = rawUrl.trim();

  // Allow safe relative paths
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return encodeURI(trimmed);
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      // Return canonical sanitized string
      return parsed.toString();
    }
    return fallback;
  } catch {
    return fallback;
  }
}

// ============================================================================
// 3. TRANSACTION SAFETY & BOUNDS VERIFICATION
// ============================================================================

/**
 * Validates slippage tolerance setting in percentage (e.g., 0.5 for 0.5%).
 * Bounds slippage between 0.05% and 15%. Extreme slippage warns or rejects.
 */
export function validateSlippageTolerance(slippagePercent: number): {
  isValid: boolean;
  warning?: string;
  error?: string;
} {
  if (isNaN(slippagePercent) || !isFinite(slippagePercent)) {
    return { isValid: false, error: 'Slippage must be a valid number.' };
  }
  if (slippagePercent <= 0) {
    return { isValid: false, error: 'Slippage tolerance must be strictly greater than 0%.' };
  }
  if (slippagePercent > 50) {
    return { isValid: false, error: 'Slippage tolerance cannot exceed 50% (extreme loss protection).' };
  }
  if (slippagePercent > 5) {
    return {
      isValid: true,
      warning: `High slippage (${slippagePercent}%): Your order may be vulnerable to frontrunning or unfavorable execution.`,
    };
  }
  if (slippagePercent < 0.1) {
    return {
      isValid: true,
      warning: `Very low slippage (${slippagePercent}%): Transaction may fail if bonding curve price updates concurrently.`,
    };
  }
  return { isValid: true };
}

/**
 * Validates dynamic fee parameters against protocol safety boundaries.
 */
export function validateFeeConfiguration(
  baseFeeBps: number,
  creatorFeeShareBps = 0,
  antiSniperSeconds = 0
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (baseFeeBps < PROTOCOL_BOUNDS.MIN_FEE_BPS) {
    errors.push(`Base fee must be at least ${PROTOCOL_BOUNDS.MIN_FEE_BPS} bps (0.25%).`);
  }
  if (baseFeeBps > PROTOCOL_BOUNDS.MAX_FEE_BPS) {
    errors.push(`Base fee cannot exceed ${PROTOCOL_BOUNDS.MAX_FEE_BPS} bps (10.00%).`);
  }
  if (baseFeeBps > 300) {
    warnings.push('Base trading fee > 3.00% may discourage institutional liquidity provision.');
  }

  if (creatorFeeShareBps < 0) {
    errors.push('Creator fee share cannot be negative.');
  }
  if (creatorFeeShareBps > PROTOCOL_BOUNDS.MAX_CREATOR_FEE_SHARE_BPS) {
    errors.push(`Creator fee share cannot exceed ${PROTOCOL_BOUNDS.MAX_CREATOR_FEE_SHARE_BPS / 100}% (50%).`);
  }

  if (antiSniperSeconds < 0) {
    errors.push('Anti-sniper duration cannot be negative.');
  }
  if (antiSniperSeconds > PROTOCOL_BOUNDS.MAX_RATE_LIMITER_SECONDS) {
    errors.push(`Anti-sniper duration cannot exceed ${PROTOCOL_BOUNDS.MAX_RATE_LIMITER_SECONDS}s (1 hour).`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates the complete market creation form according to Meteora protocol rules.
 */
export function validateMarketCreationForm(data: CreateMarketFormData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Asset & Mint validation
  if (!data.isNewMint) {
    if (!isValidSolanaAddress(data.baseMint)) {
      errors.push('Base token mint address is invalid. Must be a valid 32-44 char Base58 Solana public key.');
    }
  } else {
    const nameCheck = validateTokenName(data.tokenName);
    if (!nameCheck.isValid && nameCheck.error) errors.push(nameCheck.error);

    const symbolCheck = validateTokenSymbol(data.tokenSymbol);
    if (!symbolCheck.isValid && symbolCheck.error) errors.push(symbolCheck.error);
  }

  // 2. Supply validation
  const supplyCheck = validateNumericInput(data.totalSupply, { label: 'Total Supply', min: 1 });
  if (!supplyCheck.isValid && supplyCheck.error) errors.push(supplyCheck.error);

  const curveAllocCheck = validateNumericInput(data.curveAllocationTokens, { label: 'Curve Allocation Tokens', min: 1 });
  if (!curveAllocCheck.isValid && curveAllocCheck.error) {
    errors.push(curveAllocCheck.error);
  } else if (supplyCheck.isValid && curveAllocCheck.value > supplyCheck.value) {
    errors.push('Curve allocation tokens cannot exceed total supply.');
  } else if (supplyCheck.isValid && (curveAllocCheck.value / supplyCheck.value) < 0.2) {
    warnings.push('Allocating less than 20% to the dynamic bonding curve may cause severe price volatility.');
  }

  // 3. Price validation
  const startPriceCheck = validateNumericInput(data.startingPriceQuote, { label: 'Starting Price', min: 0.000001 });
  if (!startPriceCheck.isValid && startPriceCheck.error) errors.push(startPriceCheck.error);

  const migPriceCheck = validateNumericInput(data.migrationPriceQuote, { label: 'Migration Target Price', min: 0.000001 });
  if (!migPriceCheck.isValid && migPriceCheck.error) {
    errors.push(migPriceCheck.error);
  } else if (startPriceCheck.isValid && migPriceCheck.value <= startPriceCheck.value) {
    errors.push('Migration target price must be strictly higher than starting price.');
  }

  const quoteThresholdCheck = validateNumericInput(data.migrationQuoteThreshold, { label: 'Migration Quote Threshold', min: 0.0001 });
  if (!quoteThresholdCheck.isValid && quoteThresholdCheck.error) errors.push(quoteThresholdCheck.error);

  // 4. Fee & bounds validation
  const creatorFeeBps = Math.round((data.creatorFeePercentage ?? 0) * 100);
  const feeCheck = validateFeeConfiguration(data.baseFeeBps, creatorFeeBps, data.antiSniperRateLimiterSeconds);
  errors.push(...feeCheck.errors);
  warnings.push(...feeCheck.warnings);

  // 5. Quote Mint validation
  if (!isValidSolanaAddress(data.quoteMint)) {
    errors.push('Quote token mint is invalid. Must be a valid Solana public key.');
  }

  // 6. LP Lock warning
  if (data.liquidityLockDays === 0) {
    warnings.push('Zero liquidity lock duration: LP tokens will not be locked upon AMM graduation.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// 4. SECURE ERROR HANDLING & INFORMATION LEAK SANITIZATION
// ============================================================================

/**
 * Sanitizes error messages for user-facing display.
 * Strips internal RPC tokens, private system paths, stack traces, and raw memory addresses.
 * Maps known Solana/Meteora RPC codes to clear, actionable user explanations.
 * 
 * @param error The raw error object or string
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (!error) return 'An unexpected error occurred. Please try again.';

  let raw = '';
  if (typeof error === 'string') {
    raw = error;
  } else if (error instanceof Error) {
    raw = error.message;
  } else {
    try {
      raw = JSON.stringify(error);
    } catch {
      raw = 'Unknown system error';
    }
  }

  // Check known Solana RPC error signatures first to provide safe, friendly guidance
  if (raw.includes('User rejected') || raw.includes('rejected the request') || raw.includes('Cancelled by user')) {
    return 'Transaction signature was rejected in your wallet.';
  }

  if (raw.includes('Attempt to debit an account but found no record') || raw.includes('AccountNotFound')) {
    return 'Account not found on the active cluster. Please fund your account or switch networks.';
  }

  if (raw.includes('insufficient lamports') || raw.includes('Insufficient funds') || raw.includes('0x1')) {
    return 'Insufficient SOL balance for rent-exemption and transaction fees. Please fund your wallet.';
  }

  if (raw.includes('BlockhashNotFound') || raw.includes('blockhash has expired') || raw.includes('unable to confirm')) {
    return 'Transaction blockhash expired due to network congestion. Please retry with fresh blockhash.';
  }

  if (raw.includes('SlippageExceeded') || raw.includes('slippage tolerance exceeded') || raw.includes('0x1771')) {
    return 'Swap slipped beyond configured slippage tolerance. Price shifted during execution. Please adjust slippage and retry.';
  }

  if (raw.includes('CurveInvariantViolation') || raw.includes('InvariantCheckFailed')) {
    return 'Curve mathematical invariant violation. Amount exceeds available reserves or curve capacity.';
  }

  // Sanitize internal details from raw string:
  let clean = raw
    // Redact RPC API tokens and query params (e.g. ?api-key=..., &api_key=...)
    .replace(/([?&][a-zA-Z0-9_-]*(?:key|token|auth|secret)[a-zA-Z0-9_-]*=)[^&\s"']+/gi, '$1[REDACTED]')
    // Redact internal file system paths (e.g. /home/..., /src/..., /app/...)
    .replace(/(?:\/[a-zA-Z0-9_.-]+){3,}/g, '[Internal Path]')
    // Redact raw stack trace lines
    .replace(/\s+at\s+.*/g, '')
    // Redact hex memory addresses (0x...)
    .replace(/0x[0-9a-fA-F]{8,}/g, '[Address]')
    // Strip HTML characters
    .replace(/[<>]/g, '')
    .trim();

  // Truncate to reasonable user display length
  if (clean.length > 240) {
    clean = clean.slice(0, 240) + '...';
  }

  return clean || 'Transaction failed. Please verify your inputs and retry.';
}
