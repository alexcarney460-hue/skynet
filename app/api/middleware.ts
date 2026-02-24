import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const response = NextResponse.next();
  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
