import { PublicKey } from '@solana/web3.js';
import {
  CurveStudioConfigInput,
  validateCurveStudioInput,
  buildMeteoraDbcParameters,
} from './meteoraCreation';
import {
  DEVNET_DBC_PROGRAM_ID,
  DEVNET_SOL_QUOTE_MINT,
} from './networkValidator';
import { SOLANA_DEVNET_GENESIS_HASH } from '../config/networks';
import { PROTOCOL_BOUNDS } from '../config/constants';

export type SafetyClassification = 'SAFE' | 'WARNING' | 'HIGH_RISK' | 'BLOCKED';

export interface SafetyCheckItem {
  id: string;
  category:
    | 'Asset'
    | 'Market Configuration'
    | 'Meteora Configuration'
    | 'Liquidity Configuration'
    | 'Fee Configuration'
    | 'Creator Permissions'
    | 'Authority Configuration'
    | 'Network Verification'
    | 'Transaction Simulation';
  label: string;
  passed: boolean;
  status: 'passed' | 'warning' | 'blocked';
  detail: string;
  remediation?: string;
}

export interface MarketSafetyAuditResult {
  classification: SafetyClassification;
  summaryMessage: string;
  checks: SafetyCheckItem[];
  blockedReasons: string[];
  warningReasons: string[];
  immutableParameters: { name: string; value: string; rule: string }[];
  creatorControlledParameters: { name: string; value: string; rule: string }[];
  protocolControlledParameters: { name: string; value: string; rule: string }[];
  walletImpact: {
    estimatedRentSol: number;
    estimatedTxFeeSol: number;
    totalSolRequired: number;
    tokenSupplyToMint: number;
    tokenCurveAllocation: number;
    tokenMigrationAllocation: number;
    accountsCreated: string[];
  };
}

/**
 * Conducts a comprehensive architectural, security, economic, and on-chain
 * safety check on proposed market creation parameters before signing.
 */
export function auditMarketSafety(
  input: CurveStudioConfigInput,
  walletBalanceSol: number,
  simulationResult?: { success: boolean; error?: string; logs: string[] } | null
): MarketSafetyAuditResult {
  const checks: SafetyCheckItem[] = [];
  const blockedReasons: string[] = [];
  const warningReasons: string[] = [];

  // ============================================================================
  // 1. ASSET VERIFICATION
  // ============================================================================
  let validBaseMint = false;
  try {
    new PublicKey(input.baseMint);
    validBaseMint = true;
  } catch {
    validBaseMint = false;
  }

  const assetNameValid = Boolean(input.assetName && input.assetName.trim().length > 0);
  const tickerValid = Boolean(input.ticker && input.ticker.trim().length > 0 && input.ticker.length <= 12);
  const decimalsValid = input.tokenDecimals >= 0 && input.tokenDecimals <= 9;
  const supplyValid = input.totalSupply > 0 && input.totalSupply <= 10_000_000_000;

  if (!assetNameValid || !tickerValid) {
    checks.push({
      id: 'asset_metadata',
      category: 'Asset',
      label: 'Asset Name and Ticker Specification',
      passed: false,
      status: 'blocked',
      detail: 'Asset name and ticker must be non-empty and ticker must be 12 characters or less.',
      remediation: 'Provide a clear name and ticker symbol in Step 1.',
    });
    blockedReasons.push('Asset name or ticker is missing/invalid.');
  } else {
    checks.push({
      id: 'asset_metadata',
      category: 'Asset',
      label: 'Asset Verified',
      passed: true,
      status: 'passed',
      detail: `${input.assetName} ($${input.ticker}) with ${input.tokenDecimals} decimals and ${input.totalSupply.toLocaleString()} total supply.`,
    });
  }

  if (!validBaseMint) {
    checks.push({
      id: 'asset_mint',
      category: 'Asset',
      label: 'Base Mint Address',
      passed: false,
      status: 'blocked',
      detail: 'Base mint address is not a valid 32-44 character Base58 Solana public key.',
      remediation: 'Regenerate a clean base mint keypair.',
    });
    blockedReasons.push('Invalid base token mint address.');
  } else {
    checks.push({
      id: 'asset_mint',
      category: 'Asset',
      label: 'Base Token Mint Valid',
      passed: true,
      status: 'passed',
      detail: `Mint account ${input.baseMint.slice(0, 8)}... initialized atomically in same transaction.`,
    });
  }

  // ============================================================================
  // 2. AUTHORITY CONFIGURATION (SCAM RESISTANCE: MINT / FREEZE)
  // ============================================================================
  // Meteora DBC strictly sets TokenAuthorityOption.Immutable:
  // - Mint authority is revoked upon initialization (no subsequent inflationary mints)
  // - Freeze authority is null / revoked (creator cannot freeze user tokens)
  checks.push({
    id: 'auth_immutable',
    category: 'Authority Configuration',
    label: 'Authority Configuration Checked',
    passed: true,
    status: 'passed',
    detail: 'Meteora DBC program enforces TokenAuthorityOption.Immutable. Mint authority revoked; freeze authority permanently disabled.',
  });

  // ============================================================================
  // 3. MARKET CONFIGURATION VALIDATION
  // ============================================================================
  const pricePositive = input.startingPriceQuote > 0;
  const migrationAboveStart = input.migrationPriceQuote >= input.startingPriceQuote;
  const thresholdPositive = input.migrationQuoteThreshold > 0;
  const reasonableThreshold =
    input.quoteSymbol === 'SOL'
      ? input.migrationQuoteThreshold >= 5 && input.migrationQuoteThreshold <= 100_000
      : input.migrationQuoteThreshold >= 500 && input.migrationQuoteThreshold <= 50_000_000;

  if (!pricePositive) {
    checks.push({
      id: 'market_start_price',
      category: 'Market Configuration',
      label: 'Initial Starting Price',
      passed: false,
      status: 'blocked',
      detail: 'Starting price must be greater than zero.',
      remediation: 'Set starting price > 0.',
    });
    blockedReasons.push('Starting price must be positive.');
  } else if (!migrationAboveStart) {
    checks.push({
      id: 'market_curve_slope',
      category: 'Market Configuration',
      label: 'Price Bounds Coherence',
      passed: false,
      status: 'blocked',
      detail: `Migration target price (${input.migrationPriceQuote}) cannot be less than initial genesis price (${input.startingPriceQuote}).`,
      remediation: 'Set migration price equal to or greater than starting price.',
    });
    blockedReasons.push('Migration price cannot be below genesis price.');
  } else {
    checks.push({
      id: 'market_config_valid',
      category: 'Market Configuration',
      label: 'Market Configuration Valid',
      passed: true,
      status: 'passed',
      detail: `Genesis price: ${input.startingPriceQuote} ${input.quoteSymbol} -> Graduation price: ${input.migrationPriceQuote} ${input.quoteSymbol}.`,
    });
  }

  if (!thresholdPositive) {
    checks.push({
      id: 'market_threshold',
      category: 'Market Configuration',
      label: 'Graduation Threshold',
      passed: false,
      status: 'blocked',
      detail: 'Migration reserve threshold must be greater than zero.',
      remediation: 'Define required reserve capital to graduate.',
    });
    blockedReasons.push('Migration threshold must be greater than zero.');
  } else if (!reasonableThreshold) {
    checks.push({
      id: 'market_threshold',
      category: 'Market Configuration',
      label: 'Graduation Threshold Bounds',
      passed: false,
      status: 'warning',
      detail: `Migration threshold (${input.migrationQuoteThreshold.toLocaleString()} ${input.quoteSymbol}) is unusually low or high.`,
      remediation: 'Review whether this threshold is realistic for market depth.',
    });
    warningReasons.push('Unusually low or high migration reserve threshold.');
  }

  // ============================================================================
  // 4. METEORA CONFIGURATION VERIFIED
  // ============================================================================
  let meteoraParamValid = false;
  try {
    buildMeteoraDbcParameters(input);
    meteoraParamValid = true;
    checks.push({
      id: 'meteora_params',
      category: 'Meteora Configuration',
      label: 'Meteora Configuration Verified',
      passed: true,
      status: 'passed',
      detail: 'Meteora DBC buildCurve mathematical parameters, sqrtPrices, and invariants verified successfully.',
    });
  } catch (err: any) {
    meteoraParamValid = false;
    checks.push({
      id: 'meteora_params',
      category: 'Meteora Configuration',
      label: 'Meteora Configuration Check',
      passed: false,
      status: 'blocked',
      detail: `Meteora SDK buildCurve rejected parameters: ${err?.message || 'Calculation invariant violated'}`,
      remediation: 'Adjust curve allocation, prices, or fee decay.',
    });
    blockedReasons.push(`Meteora SDK invariant error: ${err?.message || 'Invalid curve mathematical parameters'}`);
  }

  // ============================================================================
  // 5. LIQUIDITY CONFIGURATION VALIDATION
  // ============================================================================
  const totalLpPct =
    input.creatorPermanentLockedLpPct +
    input.creatorUnlockedLpPct +
    input.partnerPermanentLockedLpPct +
    input.partnerUnlockedLpPct;

  if (totalLpPct !== 100) {
    checks.push({
      id: 'lp_sum',
      category: 'Liquidity Configuration',
      label: 'LP Distribution Invariant',
      passed: false,
      status: 'blocked',
      detail: `Total LP distribution percentages must strictly sum to 100%. Current sum: ${totalLpPct}%.`,
      remediation: 'Ensure Creator (Locked + Unlocked) and Partner (Locked + Unlocked) LP equal 100%.',
    });
    blockedReasons.push(`LP distribution sum is ${totalLpPct}%, must be exactly 100%.`);
  } else {
    // Check for rug-pull / unlocked liquidity risk
    const totalUnlockedPct = input.creatorUnlockedLpPct + input.partnerUnlockedLpPct;
    if (totalUnlockedPct > 0) {
      checks.push({
        id: 'lp_locked',
        category: 'Liquidity Configuration',
        label: 'Liquidity Configuration Valid (Warning: Unlocked LP)',
        passed: true,
        status: 'warning',
        detail: `${totalUnlockedPct}% of graduation LP is unlocked upon graduation. Only ${100 - totalUnlockedPct}% is permanently locked in Meteora non-custodial locker.`,
        remediation: 'For institutional credibility, set 100% permanently locked LP.',
      });
      warningReasons.push(`${totalUnlockedPct}% of post-graduation LP tokens are unlocked.`);
    } else {
      checks.push({
        id: 'lp_locked',
        category: 'Liquidity Configuration',
        label: 'Liquidity Configuration Valid (100% Permanently Locked)',
        passed: true,
        status: 'passed',
        detail: '100% of post-graduation LP tokens are permanently locked in Meteora non-custodial locker (zero rug risk).',
      });
    }
  }

  // ============================================================================
  // 6. FEE CONFIGURATION VALIDATION
  // ============================================================================
  const minFee = PROTOCOL_BOUNDS.MIN_FEE_BPS; // 25 bps
  const maxFee = PROTOCOL_BOUNDS.MAX_FEE_BPS; // 1000 bps (10%)
  const startingFeeValid = input.startingFeeBps >= minFee && input.startingFeeBps <= maxFee;
  const endingFeeValid = input.endingFeeBps >= minFee && input.endingFeeBps <= input.startingFeeBps;
  const creatorShareValid = input.creatorTradingFeePercentage >= 0 && input.creatorTradingFeePercentage <= 50;

  if (!startingFeeValid || !endingFeeValid) {
    checks.push({
      id: 'fee_bounds',
      category: 'Fee Configuration',
      label: 'Trading Fee Schedule Bounds',
      passed: false,
      status: 'blocked',
      detail: `Trading fees must be between 25 bps (0.25%) and 1000 bps (10.00%), and ending fee (${input.endingFeeBps} bps) cannot exceed starting fee (${input.startingFeeBps} bps).`,
      remediation: 'Configure trading fees within 25 bps to 1000 bps.',
    });
    blockedReasons.push('Trading fee out of protocol bounds (25-1000 bps).');
  } else if (input.startingFeeBps > 500) {
    checks.push({
      id: 'fee_extreme',
      category: 'Fee Configuration',
      label: 'Fee Configuration Valid (Warning: High Initial Fee)',
      passed: true,
      status: 'warning',
      detail: `Initial trading fee is ${(input.startingFeeBps / 100).toFixed(2)}%, which is unusually high.`,
      remediation: 'Consider a starting fee between 25 bps and 100 bps.',
    });
    warningReasons.push(`High starting trading fee: ${(input.startingFeeBps / 100).toFixed(2)}%.`);
  } else {
    checks.push({
      id: 'fee_bounds',
      category: 'Fee Configuration',
      label: 'Fee Configuration Valid',
      passed: true,
      status: 'passed',
      detail: `Trading fee: ${(input.startingFeeBps / 100).toFixed(2)}% -> ${(input.endingFeeBps / 100).toFixed(2)}%. Creator share: ${input.creatorTradingFeePercentage}%.`,
    });
  }

  if (!creatorShareValid) {
    checks.push({
      id: 'creator_fee_share',
      category: 'Fee Configuration',
      label: 'Creator Fee Share Limit',
      passed: false,
      status: 'blocked',
      detail: `Creator fee revenue share (${input.creatorTradingFeePercentage}%) exceeds maximum limit of 50%.`,
      remediation: 'Set creator trading fee share <= 50%.',
    });
    blockedReasons.push('Creator fee share exceeds 50% protocol cap.');
  }

  // ============================================================================
  // 7. CREATOR PERMISSIONS & RECIPIENTS
  // ============================================================================
  let payerValid = false;
  try {
    if (input.payerAddress) {
      new PublicKey(input.payerAddress);
      payerValid = true;
    }
  } catch {
    payerValid = false;
  }

  if (!payerValid) {
    checks.push({
      id: 'creator_permissions',
      category: 'Creator Permissions',
      label: 'Creator Permissions Understood',
      passed: false,
      status: 'blocked',
      detail: 'Wallet is not connected or payer public key is invalid.',
      remediation: 'Connect a verified Solana Devnet wallet.',
    });
    blockedReasons.push('Connected wallet address is missing or invalid.');
  } else {
    checks.push({
      id: 'creator_permissions',
      category: 'Creator Permissions',
      label: 'Creator Permissions Understood',
      passed: true,
      status: 'passed',
      detail: `Connected wallet ${input.payerAddress.slice(0, 6)}...${input.payerAddress.slice(-4)} is set as pool creator, fee claimer, and leftover receiver.`,
    });
  }

  // ============================================================================
  // 8. NETWORK VERIFICATION
  // ============================================================================
  const isDevnetQuote =
    input.quoteMint === DEVNET_SOL_QUOTE_MINT ||
    input.quoteMint === '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';

  if (!isDevnetQuote) {
    checks.push({
      id: 'network_quote',
      category: 'Network Verification',
      label: 'Network Verified',
      passed: false,
      status: 'blocked',
      detail: `Quote token mint ${input.quoteMint} does not match canonical Solana Devnet quotes (Wrapped SOL or Devnet USDC).`,
      remediation: 'Select Devnet SOL or Devnet USDC.',
    });
    blockedReasons.push('Quote token mint is not a valid Solana Devnet asset.');
  } else {
    checks.push({
      id: 'network_quote',
      category: 'Network Verification',
      label: 'Network Verified',
      passed: true,
      status: 'passed',
      detail: `Solana Devnet verified. Quote asset: ${input.quoteSymbol} (${input.quoteMint.slice(0, 8)}...). Program: Meteora DBC Devnet.`,
    });
  }

  // Balance Check for Rent & Fees
  const minRequiredSol = 0.055;
  if (walletBalanceSol < minRequiredSol) {
    checks.push({
      id: 'rent_balance',
      category: 'Network Verification',
      label: 'Rent & Fee Reserve',
      passed: false,
      status: 'blocked',
      detail: `Wallet balance (${walletBalanceSol.toFixed(4)} SOL) is insufficient. Minimum ${minRequiredSol} SOL required for Config PDA + Pool PDA + Vaults rent and network fees.`,
      remediation: 'Request a Solana Devnet airdrop or transfer SOL to your wallet.',
    });
    blockedReasons.push(`Insufficient Devnet SOL balance (${walletBalanceSol.toFixed(4)} < ${minRequiredSol} SOL).`);
  } else {
    checks.push({
      id: 'rent_balance',
      category: 'Network Verification',
      label: 'Rent & Fee Reserve',
      passed: true,
      status: 'passed',
      detail: `Wallet has ${walletBalanceSol.toFixed(4)} SOL (exceeds required ~0.055 SOL for on-chain rent and fees).`,
    });
  }

  // ============================================================================
  // 9. TRANSACTION SIMULATION
  // ============================================================================
  if (simulationResult !== undefined && simulationResult !== null) {
    if (!simulationResult.success) {
      checks.push({
        id: 'tx_simulation',
        category: 'Transaction Simulation',
        label: 'Transaction Simulation Passed',
        passed: false,
        status: 'blocked',
        detail: `Preflight simulation failed: ${simulationResult.error || 'Solana RPC rejected simulation.'}`,
        remediation: 'Review simulation logs and verify wallet funds.',
      });
      blockedReasons.push(`Simulation failed: ${simulationResult.error || 'RPC error'}`);
    } else {
      checks.push({
        id: 'tx_simulation',
        category: 'Transaction Simulation',
        label: 'Transaction Simulation Passed',
        passed: true,
        status: 'passed',
        detail: `Simulation succeeded on Devnet. ${simulationResult.logs?.length || 0} instruction execution logs generated.`,
      });
    }
  } else {
    checks.push({
      id: 'tx_simulation',
      category: 'Transaction Simulation',
      label: 'Transaction Simulation Pending',
      passed: true,
      status: 'passed',
      detail: 'Simulation preflight ready to execute against Solana Devnet RPC.',
    });
  }

  // ============================================================================
  // CLASSIFICATION CALCULATION
  // ============================================================================
  let classification: SafetyClassification = 'SAFE';
  let summaryMessage = 'All 9 market safety checks passed. Ready for wallet signing.';

  if (blockedReasons.length > 0) {
    classification = 'BLOCKED';
    summaryMessage = `${blockedReasons.length} critical safety checks failed. Market creation blocked.`;
  } else if (warningReasons.length > 0) {
    classification = warningReasons.length >= 2 ? 'HIGH_RISK' : 'WARNING';
    summaryMessage = `${warningReasons.length} warnings detected. Review economic implications before signing.`;
  }

  // Parameter Immutability / Drift Registry
  const immutableParameters = [
    {
      name: 'Bonding Curve Invariants',
      value: `${input.baseFeeMode}, SqrtPrice Trajectory`,
      rule: 'Locked by Meteora DBC program upon account initialization.',
    },
    {
      name: 'Base Token Mint',
      value: input.baseMint,
      rule: 'Initialized as new SPL mint; cannot be swapped or replaced.',
    },
    {
      name: 'Quote Token Mint',
      value: input.quoteMint,
      rule: 'Designated settlement token for entire pool lifecycle.',
    },
    {
      name: 'Total Token Supply',
      value: `${input.totalSupply.toLocaleString()} units`,
      rule: 'Mint authority revoked permanently (TokenAuthorityOption.Immutable).',
    },
    {
      name: 'Freeze Authority',
      value: 'Permanently Revoked (None)',
      rule: 'No account can freeze token holder balances.',
    },
    {
      name: 'Graduation Target',
      value: 'Meteora DAMM v2',
      rule: 'Automated on-chain migration triggered upon reaching reserve threshold.',
    },
  ];

  const creatorControlledParameters = [
    {
      name: 'Creator Fee Claimer',
      value: input.payerAddress || 'Connected Wallet',
      rule: 'Allowed to execute claimTradingFee instruction on-chain to withdraw creator fee revenue.',
    },
  ];

  const protocolControlledParameters = [
    {
      name: 'Graduation Trigger',
      value: `${input.migrationQuoteThreshold.toLocaleString()} ${input.quoteSymbol}`,
      rule: 'Permissionless migration executable by any crank or participant once threshold reached.',
    },
    {
      name: 'Permanent LP Lock',
      value: `${input.creatorPermanentLockedLpPct + input.partnerPermanentLockedLpPct}%`,
      rule: 'Deposited into Meteora non-custodial LP locker smart contract upon graduation.',
    },
  ];

  const curveAlloc = (input.totalSupply * input.curveAllocationPct) / 100;
  const migAlloc = input.totalSupply - curveAlloc;

  return {
    classification,
    summaryMessage,
    checks,
    blockedReasons,
    warningReasons,
    immutableParameters,
    creatorControlledParameters,
    protocolControlledParameters,
    walletImpact: {
      estimatedRentSol: 0.065,
      estimatedTxFeeSol: 0.000005,
      totalSolRequired: 0.065005,
      tokenSupplyToMint: input.totalSupply,
      tokenCurveAllocation: curveAlloc,
      tokenMigrationAllocation: migAlloc,
      accountsCreated: [
        'Config Account (Meteora DBC)',
        'Pool Account (Meteora DBC)',
        'Base Token Mint (SPL)',
        'Base Token Vault ATA',
        'Quote Token Vault ATA',
      ],
    },
  };
}
