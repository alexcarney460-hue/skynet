import { test, expect } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';

/**
 * Generate a unique email for each test run to avoid conflicts.
 */
function uniqueEmail(): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `e2e-${ts}-${rand}@test.skynetx.io`;
}

/**
 * Signup helper — returns account or null if rate-limited.
 */
async function signup(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<{ userId: string; apiKey: string; email: string } | null> {
  const res = await request.post('/api/auth/signup', {
    data: { email, password },
  });

  // Rate-limited or Supabase unavailable locally — skip dependent tests
  if (res.status() === 429 || res.status() === 500) return null;
  expect(res.status()).toBe(200);

  const body = await res.json();
  expect(body.api_key).toBeTruthy();
  expect(body.api_key).toMatch(/^sk_live_/);
  expect(body.user_id).toBeTruthy();
  expect(body.email).toBe(email);

  return { userId: body.user_id, apiKey: body.api_key, email: body.email };
}

// ── Test 2: Signup flow ──────────────────────────────────────────────────────

test.describe('Signup flow', () => {
  test('creates account and returns API key with 100 free credits', async ({ request }) => {
    const email = uniqueEmail();
    const account = await signup(request, email, 'testpass123');
    if (!account) { test.skip(); return; }

    // Verify the key works by checking usage
    const usageRes = await request.get('/api/v1/usage', {
      headers: { Authorization: `Bearer ${account.apiKey}` },
    });
    expect(usageRes.status()).toBe(200);

    const usage = await usageRes.json();
    expect(usage.credits).toBe(100);
    expect(usage.totalPurchased).toBe(0);
  });

  test('rejects signup with short password', async ({ request }) => {
    const res = await request.post('/api/auth/signup', {
      data: { email: uniqueEmail(), password: '12345' },
    });
    // 400 (bad input) or 429 (rate limited)
    expect([400, 429]).toContain(res.status());
  });

  test('rejects signup with missing email', async ({ request }) => {
    const res = await request.post('/api/auth/signup', {
      data: { password: 'testpass123' },
    });
    expect([400, 429]).toContain(res.status());
  });
});

// ── Test 3: API call with key (drift endpoint) ──────────────────────────────

test.describe('Drift API', () => {
  let apiKey: string;

  test.beforeAll(async ({ request }) => {
    const account = await signup(request, uniqueEmail(), 'testpass123');
    if (!account) return;
    apiKey = account.apiKey;
  });

  test('returns a drift score via GET with query params', async ({ request }) => {
    if (!apiKey) { test.skip(); return; }

    const res = await request.get('/api/v1/drift', {
      params: {
        memoryUsedPercent: '72',
        tokenBurnRate: '45',
        contextDriftPercent: '31',
        sessionAgeMinutes: '48',
      },
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(typeof body.score).toBe('number');
    expect(body.score).toBeGreaterThanOrEqual(0);
    expect(body.score).toBeLessThanOrEqual(1);
    expect(['OPTIMAL', 'WARNING', 'AT_RISK', 'CRITICAL']).toContain(body.status);
    expect(body.recommendations).toBeInstanceOf(Array);
    expect(body.timestamp).toBeTruthy();
    expect(typeof body._credits).toBe('number');
  });

  test('returns a drift score via POST with JSON body', async ({ request }) => {
    if (!apiKey) { test.skip(); return; }

    const res = await request.post('/api/v1/drift', {
      data: {
        memoryUsedPercent: 10,
        tokenBurnRate: 5,
        contextDriftPercent: 2,
        sessionAgeMinutes: 3,
      },
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(typeof body.score).toBe('number');
    expect(body.status).toBe('OPTIMAL');
  });
});

// ── Test 4: Usage tracking ───────────────────────────────────────────────────

test.describe('Usage tracking', () => {
  test('credits decrement after API call', async ({ request }) => {
    const account = await signup(request, uniqueEmail(), 'testpass123');
    if (!account) { test.skip(); return; }

    const headers = { Authorization: `Bearer ${account.apiKey}` };

    // Check initial credits
    const before = await request.get('/api/v1/usage', { headers });
    expect(before.status()).toBe(200);
    const creditsBefore = (await before.json()).credits;
    expect(creditsBefore).toBe(100);

    // Make one API call that costs 1 credit
    const driftRes = await request.get('/api/v1/drift', {
      params: { memoryUsedPercent: '50' },
      headers,
    });
    expect(driftRes.status()).toBe(200);

    // Check credits again — should be decremented by 1
    const after = await request.get('/api/v1/usage', { headers });
    expect(after.status()).toBe(200);
    const creditsAfter = (await after.json()).credits;
    expect(creditsAfter).toBe(creditsBefore - 1);
  });
});

// ── Test 5: Purchase initiation ──────────────────────────────────────────────

test.describe('Purchase initiation', () => {
  let apiKey: string;

  test.beforeAll(async ({ request }) => {
    const account = await signup(request, uniqueEmail(), 'testpass123');
    if (!account) return;
    apiKey = account.apiKey;
  });

  test('returns payment details for starter pack', async ({ request }) => {
    if (!apiKey) { test.skip(); return; }

    const res = await request.post('/api/v1/purchase', {
      data: { pack: 'starter' },
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.payment_id).toBeTruthy();
    expect(body.wallet).toBeTruthy();
    expect(body.amount_usd).toBe(5);
    expect(body.pack).toBe('starter');
    expect(body.credits).toBe(1_000);
    expect(body.network).toBe('evm');
    expect(body.instructions).toContain('$5');
  });

  test('rejects invalid pack name', async ({ request }) => {
    if (!apiKey) { test.skip(); return; }

    const res = await request.post('/api/v1/purchase', {
      data: { pack: 'nonexistent' },
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    expect(res.status()).toBe(400);

    const body = await res.json();
    expect(body.error).toContain('Invalid pack');
    expect(body.packs).toBeInstanceOf(Array);
  });
});

// ── Test 6: Invalid key rejection ────────────────────────────────────────────

test.describe('Invalid key rejection', () => {
  test('returns 401 for completely invalid key', async ({ request }) => {
    const res = await request.get('/api/v1/drift', {
      headers: { Authorization: 'Bearer bad_key_12345' },
    });
    expect(res.status()).toBe(401);

    const body = await res.json();
    expect(body.error).toContain('Missing or invalid API key');
  });

  test('returns 401 for fake sk_ key not in database', async ({ request }) => {
    const res = await request.get('/api/v1/drift', {
      headers: { Authorization: 'Bearer sk_fake_0000000000000000000000000000abcd' },
    });
    expect([401, 503]).toContain(res.status());
  });

  test('returns 401 when no auth header is provided', async ({ request }) => {
    const res = await request.get('/api/v1/drift');
    expect(res.status()).toBe(401);

    const body = await res.json();
    expect(body.error).toBeTruthy();
  });
});

// ── Test 7: Rate limit / credit info in responses ────────────────────────────

test.describe('Credit info in API responses', () => {
  test('metric responses include _credits field', async ({ request }) => {
    const account = await signup(request, uniqueEmail(), 'testpass123');
    if (!account) { test.skip(); return; }

    const res = await request.get('/api/v1/drift', {
      params: { memoryUsedPercent: '50' },
      headers: { Authorization: `Bearer ${account.apiKey}` },
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(typeof body._credits).toBe('number');
    expect(body._credits).toBeLessThan(100);
  });
});
