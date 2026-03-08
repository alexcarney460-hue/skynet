import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const ALLOWED_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
  : ['https://skynetx.io', 'https://www.skynetx.io'];

function getOrigin(req: NextRequest): string {
  const origin = req.headers.get('origin') || '';
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  return ALLOWED_ORIGINS[0];
}

export function middleware(req: NextRequest) {
  const origin = getOrigin(req);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Agent-Id, X-Session-Id',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Agent-Id, X-Session-Id');
  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
