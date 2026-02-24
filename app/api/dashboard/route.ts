import { NextResponse } from 'next/server';
import { getDashboardData } from '@/lib/dashboard-data';

export async function GET() {
  try {
    const data = await getDashboardData();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Dashboard API error', error);
    return NextResponse.json(
      {
        error: 'dashboard_unavailable',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
