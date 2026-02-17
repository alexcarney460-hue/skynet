import { NextResponse } from 'next/server';

/**
 * GET /api/health
 * Simple health check endpoint (no dependencies)
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  });
}
