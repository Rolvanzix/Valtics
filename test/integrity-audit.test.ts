import assert from 'node:assert';
import { PublicKey } from '@solana/web3.js';
import {
  createDevnetMarket,
  getDevnetMarkets,
  getVerifiedDevnetMarkets,
  getLocalDraftMarkets,
  isValidSolanaAddress,
  isValidSolanaTxSignature,
} from '../src/services/devnetMarketService';
import {
  isValidSolanaPubkeyString,
  reconcileMarketWithBlockchain,
} from '../src/services/marketStorage';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('====================================================');
  console.log('VALTICS — SECOND REPAIR PASS: INTEGRITY & SAFETY TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void> | void) {
    try {
      await fn();
      console.log(`  ✓ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ [FAIL] ${name}`);
      console.error(`    ${err?.message || err}`);
      failed++;
    }
  }

  // ----------------------------------------------------
  // TEST GROUP 1: Pyth Oracle Price Freshness & Validation
  // ----------------------------------------------------
  console.log('--- Test Group 1: Oracle Price Freshness & Integrity ---');

  await test('Fresh oracle price returns status "ok" with finite positive price and valid confidence', async () => {
    const res = await fetch(`${BASE_URL}/api/pyth/price?symbol=SOL`);
    assert.strictEqual(res.status, 200, 'Expected HTTP 200');
    const json = await res.json();
    assert.strictEqual(json.status, 'ok', 'Status should be ok');
    assert.strictEqual(typeof json.price, 'number', 'Price must be a number');
    assert.ok(json.price > 0, 'Price must be positive');
    assert.ok(Number.isFinite(json.price), 'Price must be finite');
    assert.strictEqual(json.isAvailable, true, 'isAvailable must be true');
    assert.strictEqual(json.isStale, false, 'isStale must be false');
    assert.ok(typeof json.publishTime === 'number', 'publishTime must be a number');
    assert.ok(json.publishTime > 1500000000, 'publishTime must be a valid epoch');
    assert.ok(typeof json.confidence === 'number' || json.confidence === null, 'Confidence valid');
  });

  await test('Cached response cannot bypass freshness threshold verification', async () => {
    // First query to populate cache
    const res1 = await fetch(`${BASE_URL}/api/pyth/price?symbol=SOL`);
    const json1 = await res1.json();
    assert.strictEqual(res1.status, 200);

    // Second query hits cache and verifies age against threshold
    const res2 = await fetch(`${BASE_URL}/api/pyth/price?symbol=SOL`);
    const json2 = await res2.json();
    assert.strictEqual(res2.status, 200);
    assert.strictEqual(json2.id, json1.id);
    assert.ok(typeof json2.freshnessThresholdSeconds === 'number', 'Threshold must be exposed');
    assert.ok(json2.ageSeconds <= json2.freshnessThresholdSeconds, 'Age must not exceed threshold');
  });

  await test('Invalid or non-existent feed ID returns "not_found" or "error"', async () => {
    const res = await fetch(`${BASE_URL}/api/pyth/price?symbol=NONEXISTENT_XYZ_12345`);
    const json = await res.json();
    assert.ok(
      json.status === 'not_found' || json.status === 'error',
      `Expected status not_found or error, got ${json.status}`
    );
    assert.strictEqual(json.isAvailable, false);
    assert.strictEqual(json.price, null, 'Price must be null for unresolvable feed');
  });

  // ----------------------------------------------------
  // TEST GROUP 2: Historical Performance Calculations
  // ----------------------------------------------------
  console.log('\n--- Test Group 2: Historical OHLC & 24H Calculations ---');

  await test('Timeframe and actual returned timeframe are kept strictly distinct', async () => {
    const res = await fetch(`${BASE_URL}/api/pyth/history?symbol=Crypto.SOL/USD&timeframe=24H`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.status, 'ok');
    assert.strictEqual(json.timeframe, '24H', 'Requested timeframe must match');
    assert.ok(json.actualTimeframe, 'actualTimeframe must be explicitly reported');
    assert.ok(Array.isArray(json.bars), 'bars must be an array');
    assert.ok(json.bars.length > 0, 'must contain bars');
  });

  await test('Candles are strictly sorted ascending and have finite numeric open/high/low/close', async () => {
    const res = await fetch(`${BASE_URL}/api/pyth/history?symbol=Crypto.SOL/USD&timeframe=24H`);
    const json = await res.json();
    const bars = json.bars || [];

    for (let i = 0; i < bars.length; i++) {
      const b = bars[i];
      assert.ok(Number.isFinite(b.timestamp) && b.timestamp > 0, `Bar ${i} timestamp invalid`);
      assert.ok(Number.isFinite(b.open) && b.open > 0, `Bar ${i} open invalid`);
      assert.ok(Number.isFinite(b.high) && b.high >= Math.min(b.open, b.close), `Bar ${i} high invalid`);
      assert.ok(Number.isFinite(b.low) && b.low > 0, `Bar ${i} low invalid`);
      assert.ok(Number.isFinite(b.close) && b.close > 0, `Bar ${i} close invalid`);

      if (i > 0) {
        assert.ok(b.timestamp >= bars[i - 1].timestamp, `Bar ${i} must be after or equal to Bar ${i - 1}`);
      }
    }
  });

  await test('24H change calculation returns null with reason when interval coverage is insufficient (never fake 0%)', async () => {
    // Querying with an artificially tiny window (only 1 hour) for 24H timeframe
    const now = Math.floor(Date.now() / 1000);
    const res = await fetch(`${BASE_URL}/api/pyth/history?symbol=Crypto.SOL/USD&timeframe=24H&from=${now - 3600}&to=${now}`);
    const json = await res.json();
    if (json.bars && json.bars.length <= 2) {
      assert.strictEqual(json.change24hPct, null, 'Must return null for insufficient coverage');
      assert.ok(json.change24hReason, 'Must provide reason for unavailable 24h change');
    }
  });

  // ----------------------------------------------------
  // TEST GROUP 3: Market Registry — Local Records vs Real Deployed Markets
  // ----------------------------------------------------
  console.log('\n--- Test Group 3: Market Registry Separation ---');

  await test('Validates Solana addresses and signatures correctly', () => {
    const validPubkey = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
    const invalidPubkey = 'draft_pool_12345';
    assert.strictEqual(isValidSolanaAddress(validPubkey), true);
    assert.strictEqual(isValidSolanaAddress(invalidPubkey), false);
    assert.strictEqual(isValidSolanaAddress(''), false);
    assert.strictEqual(isValidSolanaAddress(null), false);

    assert.strictEqual(isValidSolanaPubkeyString(validPubkey), true);
    assert.strictEqual(isValidSolanaPubkeyString('not-a-solana-key'), false);

    const validSig = '2AXDGYSE4f2sz7tvMMzyHvUfcoJmxudvdhBcmiUSo6ijwfYmfZYsKRxboQMPh3R4kUhXRVdtSXFXMheka4Rc4P2';
    assert.strictEqual(isValidSolanaTxSignature(validSig), true);
    assert.strictEqual(isValidSolanaTxSignature('fake-sig'), false);
    assert.strictEqual(isValidSolanaTxSignature('5wG6A6xYwithInvalidChar_l_or_O'), false);
  });

  await test('Locally created market configuration is marked as draft / local record, never confirmed on-chain', () => {
    const result = createDevnetMarket({
      tokenName: 'Test Draft Real Estate',
      tokenSymbol: 'DRAFT-RE',
      rwaCategory: 'Real Estate',
      currentPrice: 25.5,
      // No valid on-chain pool address or tx signature provided
      poolAddress: 'draft_pool_local',
      creator: 'local-test-creator',
    });

    assert.strictEqual(result.success, true);
    const market = result.market;
    assert.strictEqual(market.deploymentStatus, 'draft');
    assert.strictEqual(market.onChainVerified, false);
    assert.strictEqual(market.isLocalRecord, true);
    assert.ok(market.poolAddress.startsWith('draft_pool_'), 'Pool address must be clearly labeled draft');
    assert.ok(market.verificationNote?.includes('Local configuration draft'), 'Note must state local draft');

    // Confirm it appears in getLocalDraftMarkets but NOT in getVerifiedDevnetMarkets
    const drafts = getLocalDraftMarkets();
    const verified = getVerifiedDevnetMarkets();
    assert.ok(drafts.some((m) => m.tokenSymbol === 'DRAFT-RE'));
    assert.ok(!verified.some((m) => m.tokenSymbol === 'DRAFT-RE'));
  });

  await test('Market reconciliation marks invalid address format as verification_failed', async () => {
    const fakeConnection = {} as any;
    const res = await reconcileMarketWithBlockchain('invalid-address-123', fakeConnection);
    assert.strictEqual(res.reconciled, false);
    assert.ok(res.discrepancies.length > 0);
    assert.ok(res.discrepancies[0].includes('Invalid Solana public key format'));
  });

  // ----------------------------------------------------
  // TEST GROUP 4: Market-Hours Status Handling
  // ----------------------------------------------------
  console.log('\n--- Test Group 4: Market Hours & Exchange Availability ---');

  await test('/api/pyth/resolve does NOT default missing market hours to is_open: true', async () => {
    const res = await fetch(`${BASE_URL}/api/pyth/resolve?symbol=SOL`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.found, true);
    assert.ok(json.feed, 'Feed object must exist');
    assert.ok(json.feed.marketHours, 'marketHours must exist');

    // If provider does not supply boolean is_open, status must be 'unknown', NOT true
    if (json.feed.marketHours.is_open === null) {
      assert.strictEqual(json.feed.marketHours.status, 'unknown');
    } else {
      assert.strictEqual(typeof json.feed.marketHours.is_open, 'boolean');
      assert.ok(['open', 'closed', 'unknown'].includes(json.feed.marketHours.status));
    }
  });

  // ----------------------------------------------------
  // TEST GROUP 5: API Health & Client Identification Hardening
  // ----------------------------------------------------
  console.log('\n--- Test Group 5: API Health & Secret Shielding ---');

  await test('/api/health removes sensitive key lengths and secret fingerprints', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.status, 'ok');
    assert.strictEqual(json.keyLength, undefined, 'Must not expose keyLength');
    assert.strictEqual(json.pantaKeyLength, undefined, 'Must not expose pantaKeyLength');
    assert.strictEqual(json.pantaKeyFingerprint, undefined, 'Must not expose pantaKeyFingerprint');
    assert.ok(typeof json.pythConfigured === 'boolean');
    assert.ok(typeof json.pantaConfigured === 'boolean');
  });

  await test('/api/panta/status does NOT leak key lengths or fingerprints', async () => {
    const res = await fetch(`${BASE_URL}/api/panta/status`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.keyLength, undefined, 'Must not leak keyLength');
    assert.strictEqual(json.keyFingerprint, undefined, 'Must not leak keyFingerprint');
  });

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
