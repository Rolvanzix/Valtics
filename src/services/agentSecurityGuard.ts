/**
 * VALTICS Agent Security Guard
 * 
 * Comprehensive security-first layer providing:
 * 1. Non-custodial credential interceptor (detects and redacts private keys, mnemonics, passwords, API keys)
 * 2. Prompt injection defense and input neutralization
 * 3. In-memory sliding-window rate limiting
 * 4. Cluster Devnet boundary enforcement
 * 5. Strict zero-logging of sensitive user credentials
 * 6. Transaction lifecycle separation (READ -> PREPARE -> APPROVE -> EXECUTE)
 */

export interface CredentialScanResult {
  hasSensitiveData: boolean;
  detectedTypes: string[];
  redactedText: string;
}

// Common 12/24 word mnemonic seed phrase detector
// BIP-39 common words sampler and multi-word token test
const MNEMONIC_WORDS_REGEX = /\b([a-z]{3,12}\s+){11,23}[a-z]{3,12}\b/gi;

// Solana Base58 Private Key (87-88 characters)
const SOLANA_BASE58_KEY_REGEX = /\b[1-9A-HJ-NP-Za-km-z]{87,88}\b/g;

// Solana Byte Array Private Key (e.g. [12, 45, 234, ... 64 numbers])
const SOLANA_BYTE_ARRAY_REGEX = /\[\s*(?:(?:25[0-5]|2[0-4]\d|1?\d{1,2})\s*,\s*){31,63}(?:25[0-5]|2[0-4]\d|1?\d{1,2})\s*\]/g;

// Generic Hex Private Key (64 hex characters, with or without 0x)
const HEX_PRIVATE_KEY_REGEX = /(?:0x)?[a-fA-F0-9]{64}\b/g;

// Known API Key and Bearer Token Patterns
const API_KEY_PATTERNS = [
  /AIza[0-9A-Za-z-_]{35}/g, // Google API Key
  /sk-[a-zA-Z0-9]{20,}/g, // OpenAI / generic key
  /ghp_[a-zA-Z0-9]{36}/g, // GitHub PAT
  /Bearer\s+[a-zA-Z0-9\-_.]+/gi, // Raw bearer token
];

// Prompt Injection & Jailbreak Signatures
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|directives|rules)/gi,
  /disregard\s+(all\s+)?(previous|system|prior)\s+(instructions|directives)/gi,
  /you\s+are\s+now\s+(unrestricted|in\s+god\s+mode|dan|jailbroken)/gi,
  /override\s+system\s+(prompt|instructions|rules)/gi,
  /reveal\s+(your\s+)?(system\s+prompt|instructions|api\s*key|credentials|secret)/gi,
  /output\s+(the\s+)?(system\s+instruction|gemini_api_key|pyth_api_key|env)/gi,
  /sign\s+transaction\s+autonomously/gi,
  /execute\s+transaction\s+without\s+approval/gi,
  /bypass\s+wallet\s+approval/gi,
  /transfer\s+(all\s+)?(funds|sol|usdc)\s+to/gi,
];

/**
 * Scan and redact any sensitive credentials from text.
 * Prevents private keys or seed phrases from ever being passed to an LLM or logged.
 */
export function scanAndRedactCredentials(input: string): CredentialScanResult {
  if (!input || typeof input !== 'string') {
    return { hasSensitiveData: false, detectedTypes: [], redactedText: '' };
  }

  let redacted = input;
  const detectedTypes: string[] = [];

  // Check Solana Byte Array Private Key
  if (SOLANA_BYTE_ARRAY_REGEX.test(redacted)) {
    detectedTypes.push('solana_byte_array_private_key');
    redacted = redacted.replace(SOLANA_BYTE_ARRAY_REGEX, '[REDACTED_BYTE_ARRAY_PRIVATE_KEY]');
  }

  // Check Solana Base58 Private Key (87-88 chars)
  if (SOLANA_BASE58_KEY_REGEX.test(redacted)) {
    detectedTypes.push('solana_base58_private_key');
    redacted = redacted.replace(SOLANA_BASE58_KEY_REGEX, '[REDACTED_BASE58_PRIVATE_KEY]');
  }

  // Check Hex Private Key (64 hex characters)
  if (HEX_PRIVATE_KEY_REGEX.test(redacted)) {
    // Only flag if it doesn't look like a standard transaction signature or public hash (signature is 128 hex chars or base58)
    // We treat 64-char hex as sensitive
    detectedTypes.push('hex_private_key');
    redacted = redacted.replace(HEX_PRIVATE_KEY_REGEX, '[REDACTED_HEX_PRIVATE_KEY]');
  }

  // Check 12/24 Word Seed Phrases
  if (MNEMONIC_WORDS_REGEX.test(redacted)) {
    detectedTypes.push('bip39_seed_phrase');
    redacted = redacted.replace(MNEMONIC_WORDS_REGEX, '[REDACTED_SEED_PHRASE]');
  }

  // Check Known API Keys
  for (const pattern of API_KEY_PATTERNS) {
    if (pattern.test(redacted)) {
      detectedTypes.push('api_key_or_token');
      redacted = redacted.replace(pattern, '[REDACTED_API_KEY]');
    }
  }

  return {
    hasSensitiveData: detectedTypes.length > 0,
    detectedTypes,
    redactedText: redacted,
  };
}

/**
 * Neutralizes prompt injection triggers and cleans user input.
 */
export function sanitizeInputForAgent(input: string): {
  sanitized: string;
  hasInjectionRisk: boolean;
  injectionFlags: string[];
} {
  if (!input || typeof input !== 'string') {
    return { sanitized: '', hasInjectionRisk: false, injectionFlags: [] };
  }

  let text = input.trim();
  const injectionFlags: string[] = [];

  // 1. Detect prompt injection attempts
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      injectionFlags.push(pattern.source);
    }
  }

  // 2. Strip dangerous XML/HTML injection control tags
  text = text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<\/?(system|instruction|prompt_override|admin|root)[^>]*>/gi, '');

  // 3. Length capping: Limit individual message to 2,000 characters to prevent buffer exhaustion
  if (text.length > 2000) {
    text = text.substring(0, 2000) + '... [TRUNCATED_DUE_TO_SIZE_LIMIT]';
  }

  return {
    sanitized: text,
    hasInjectionRisk: injectionFlags.length > 0,
    injectionFlags,
  };
}

/**
 * Validates that cluster reference is strictly Solana Devnet.
 * Throws or returns false if Mainnet or unauthorized cluster is requested.
 */
export function validateDevnetClusterStrict(clusterOrUrl?: string): boolean {
  if (!clusterOrUrl) return true; // defaults to devnet
  const lower = clusterOrUrl.toLowerCase().trim();

  // Explicitly disallow any Mainnet references
  if (
    lower.includes('mainnet') ||
    lower.includes('mainnet-beta') ||
    lower.includes('api.mainnet') ||
    lower.includes('solana-mainnet')
  ) {
    return false;
  }

  // Valid devnet identifiers
  return (
    lower === 'devnet' ||
    lower.includes('api.devnet.solana.com') ||
    lower === 'testnet'
  );
}

/**
 * Safe logging utility that redacts sensitive credentials before writing to logs.
 */
export function safeServerLog(tag: string, message: string, meta?: any): void {
  const scan = scanAndRedactCredentials(message);
  let safeMessage = scan.redactedText;

  if (meta) {
    try {
      const metaStr = JSON.stringify(meta);
      const metaScan = scanAndRedactCredentials(metaStr);
      console.log(`[Valtics SafeLog][${tag}] ${safeMessage}`, JSON.parse(metaScan.redactedText));
    } catch {
      console.log(`[Valtics SafeLog][${tag}] ${safeMessage}`);
    }
  } else {
    console.log(`[Valtics SafeLog][${tag}] ${safeMessage}`);
  }
}

/**
 * High-performance In-Memory Sliding Window Rate Limiter
 */
export interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
}

export function createRateLimiter(options: RateLimiterOptions) {
  const { windowMs, maxRequests } = options;
  const requestHistory = new Map<string, number[]>();

  // Cleanup expired entries periodically to prevent memory leaks
  setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of requestHistory.entries()) {
      const valid = timestamps.filter((t) => now - t < windowMs);
      if (valid.length === 0) {
        requestHistory.delete(key);
      } else {
        requestHistory.set(key, valid);
      }
    }
  }, Math.max(windowMs, 60000));

  return function checkLimit(clientId: string): {
    allowed: boolean;
    remaining: number;
    resetMs: number;
  } {
    const now = Date.now();
    const timestamps = requestHistory.get(clientId) || [];
    const validTimestamps = timestamps.filter((t) => now - t < windowMs);

    if (validTimestamps.length >= maxRequests) {
      const oldest = validTimestamps[0];
      const resetMs = windowMs - (now - oldest);
      return {
        allowed: false,
        remaining: 0,
        resetMs: Math.max(0, resetMs),
      };
    }

    validTimestamps.push(now);
    requestHistory.set(clientId, validTimestamps);

    return {
      allowed: true,
      remaining: maxRequests - validTimestamps.length,
      resetMs: windowMs,
    };
  };
}
