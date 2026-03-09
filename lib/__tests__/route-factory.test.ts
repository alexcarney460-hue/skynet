import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../api-auth', () => ({
  authenticateApiKey: vi.fn(),
}));

const mockRpc = vi.fn();
vi.mock('../usage', () => ({
  checkAndDecrement: vi.fn(),
}));

const mockInsert = vi.fn().mockReturnValue({
  then: (cb: (res: { error: null }) => void) => cb({ error: null }),
});
vi.mock('../supabase', () => ({
  createServiceClient: () => ({
    from: () => ({ insert: mockInsert }),
  }),
}));

import { createMetricRoute } from '../route-factory';
import { authenticateApiKey } from '../api-auth';
import { checkAndDecrement } from '../usage';

const mockAuth = vi.mocked(authenticateApiKey);
const mockUsage = vi.mocked(checkAndDecrement);

// Helper to build a mock NextRequest
function mockRequest({
  method = 'GET',
  searchParams = new URLSearchParams(),
  body = null as Record<string, unknown> | null,
  headers = {} as Record<string, string>,
}: {
  method?: string;
  searchParams?: URLSearchParams;
  body?: Record<string, unknown> | null;
  headers?: Record<string, string>;
} = {}) {
  return {
    method,
    nextUrl: { searchParams },
    headers: {
      get: (key: string) => headers[key] ?? null,
    },
    json: body !== null ? vi.fn().mockResolvedValue(body) : vi.fn().mockRejectedValue(new Error('no body')),
  } as unknown as import('next/server').NextRequest;
}

// Simple test config
const testConfig = {
  metricType: 'drift' as const,
  parseQuery: (params: URLSearchParams) => {
    const val = params.get('value');
    if (!val) throw new Error('Missing value');
    return { value: Number(val) };
  },
  parseBody: (body: Record<string, unknown>) => {
    if (typeof body.value !== 'number') throw new Error('Missing value');
    return { value: body.value as number };
  },
  evaluate: (input: { value: number }) => ({
    score: input.value * 2,
    label: input.value > 50 ? 'high' : 'low',
  }),
};

describe('createMetricRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET handler', () => {
    it('should return 401 when authentication fails', async () => {
      mockAuth.mockResolvedValue({ error: 'Invalid API key', status: 401 });

      const route = createMetricRoute(testConfig);
      const req = mockRequest({ searchParams: new URLSearchParams('value=42') });
      const response = await route.GET(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid API key');
    });

    it('should return 429 when credits are exhausted', async () => {
      mockAuth.mockResolvedValue({ userId: 'user-1' });
      mockUsage.mockResolvedValue({
        allowed: false,
        reason: 'No credits remaining.',
        credits: 0,
        rateUsed: 0,
      });

      const route = createMetricRoute(testConfig);
      const req = mockRequest({ searchParams: new URLSearchParams('value=42') });
      const response = await route.GET(req);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toContain('No credits remaining');
      expect(data.credits).toBe(0);
    });

    it('should return 400 when input parsing fails', async () => {
      mockAuth.mockResolvedValue({ userId: 'user-1' });

      const route = createMetricRoute(testConfig);
      // Missing required "value" param
      const req = mockRequest({ searchParams: new URLSearchParams() });
      const response = await route.GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Failed to evaluate drift');
    });

    it('should parse input BEFORE checking credits', async () => {
      mockAuth.mockResolvedValue({ userId: 'user-1' });

      const route = createMetricRoute(testConfig);
      // Missing value => parseQuery throws before checkAndDecrement is called
      const req = mockRequest({ searchParams: new URLSearchParams() });
      await route.GET(req);

      // checkAndDecrement should NOT have been called
      expect(mockUsage).not.toHaveBeenCalled();
    });

    it('should return successful evaluation result', async () => {
      mockAuth.mockResolvedValue({ userId: 'user-1' });
      mockUsage.mockResolvedValue({
        allowed: true,
        credits: 999,
        rateUsed: 1,
      });

      const route = createMetricRoute(testConfig);
      const req = mockRequest({ searchParams: new URLSearchParams('value=42') });
      const response = await route.GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.score).toBe(84); // 42 * 2
      expect(data.label).toBe('low');
      expect(data._credits).toBe(999);
      expect(data.timestamp).toBeDefined();
    });

    it('should include timestamp in ISO format', async () => {
      mockAuth.mockResolvedValue({ userId: 'user-1' });
      mockUsage.mockResolvedValue({ allowed: true, credits: 100, rateUsed: 1 });

      const route = createMetricRoute(testConfig);
      const req = mockRequest({ searchParams: new URLSearchParams('value=10') });
      const response = await route.GET(req);
      const data = await response.json();

      // Verify timestamp is valid ISO string
      expect(() => new Date(data.timestamp)).not.toThrow();
      expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('POST handler', () => {
    it('should return 400 for invalid JSON body', async () => {
      const route = createMetricRoute(testConfig);
      const req = {
        json: vi.fn().mockRejectedValue(new Error('invalid json')),
        headers: { get: () => null },
        nextUrl: { searchParams: new URLSearchParams() },
      } as unknown as import('next/server').NextRequest;

      const response = await route.POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid JSON body');
    });

    it('should return 400 when body parsing fails', async () => {
      mockAuth.mockResolvedValue({ userId: 'user-1' });

      const route = createMetricRoute(testConfig);
      // Missing "value" in body
      const req = mockRequest({ body: { notValue: 'x' } });
      const response = await route.POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Failed to evaluate drift');
    });

    it('should return successful evaluation from POST body', async () => {
      mockAuth.mockResolvedValue({ userId: 'user-1' });
      mockUsage.mockResolvedValue({ allowed: true, credits: 500, rateUsed: 2 });

      const route = createMetricRoute(testConfig);
      const req = mockRequest({ body: { value: 75 } });
      const response = await route.POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.score).toBe(150); // 75 * 2
      expect(data.label).toBe('high');
      expect(data._credits).toBe(500);
    });
  });

  describe('telemetry logging', () => {
    it('should log telemetry event with correct data', async () => {
      mockAuth.mockResolvedValue({ userId: 'user-1' });
      mockUsage.mockResolvedValue({ allowed: true, credits: 100, rateUsed: 1 });

      const route = createMetricRoute(testConfig);
      const req = mockRequest({
        searchParams: new URLSearchParams('value=42'),
        headers: { 'x-agent-id': 'agent-abc', 'x-session-id': 'sess-xyz' },
      });
      await route.GET(req);

      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'user-1',
        agent_id: 'agent-abc',
        session_id: 'sess-xyz',
        metric_type: 'drift',
        input: { value: 42 },
        result: { score: 84, label: 'low' },
      });
    });

    it('should handle missing agent/session headers', async () => {
      mockAuth.mockResolvedValue({ userId: 'user-1' });
      mockUsage.mockResolvedValue({ allowed: true, credits: 100, rateUsed: 1 });

      const route = createMetricRoute(testConfig);
      const req = mockRequest({ searchParams: new URLSearchParams('value=10') });
      await route.GET(req);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          agent_id: null,
          session_id: null,
        }),
      );
    });
  });

  describe('route creation', () => {
    it('should return object with GET and POST handlers', () => {
      const route = createMetricRoute(testConfig);

      expect(typeof route.GET).toBe('function');
      expect(typeof route.POST).toBe('function');
    });

    it('should work with different metric types', async () => {
      mockAuth.mockResolvedValue({ userId: 'user-1' });
      mockUsage.mockResolvedValue({ allowed: true, credits: 100, rateUsed: 1 });

      const pressureConfig = {
        ...testConfig,
        metricType: 'pressure' as const,
      };
      const route = createMetricRoute(pressureConfig);
      const req = mockRequest({ searchParams: new URLSearchParams('value=10') });
      await route.GET(req);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ metric_type: 'pressure' }),
      );
    });
  });
});
