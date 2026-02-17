import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/v1/pressure
 * Context Pressure Regulator endpoint
 * 
 * Accepts query parameters or JSON body with current session state.
 * Returns pressure level + recommendations for agent decision-making.
 */

interface PressureQuery {
  memoryUsedPercent?: string;
  tokenBurnRatePerMin?: string;
  contextDriftPercent?: string;
  sessionAgeSeconds?: string;
  tokenBudgetTotal?: string;
  tokenBudgetUsed?: string;
  contextWindowMaxBytes?: string;
  contextWindowUsedBytes?: string;
  systemMode?: string;
  agentProfile?: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters with defaults
    const memoryUsedPercent = parseFloat(searchParams.get('memoryUsedPercent') || '45');
    const tokenBurnRatePerMin = parseFloat(searchParams.get('tokenBurnRatePerMin') || '35');
    const contextDriftPercent = parseFloat(searchParams.get('contextDriftPercent') || '20');
    const sessionAgeSeconds = parseFloat(searchParams.get('sessionAgeSeconds') || '600');
    const tokenBudgetTotal = parseFloat(searchParams.get('tokenBudgetTotal') || '100000');
    const tokenBudgetUsed = parseFloat(searchParams.get('tokenBudgetUsed') || '35000');
    const contextWindowMaxBytes = parseFloat(searchParams.get('contextWindowMaxBytes') || '200000');
    const contextWindowUsedBytes = parseFloat(searchParams.get('contextWindowUsedBytes') || '90000');
    const systemMode = (searchParams.get('systemMode') || 'production') as 'demo' | 'production' | 'diagnostic';
    const agentProfile = (searchParams.get('agentProfile') || 'balanced') as 'minimal' | 'balanced' | 'aggressive';

    // Validate ranges
    if (
      isNaN(memoryUsedPercent) ||
      isNaN(tokenBurnRatePerMin) ||
      isNaN(contextDriftPercent) ||
      isNaN(sessionAgeSeconds)
    ) {
      return NextResponse.json(
        {
          error: 'Invalid parameters. All numeric params must be numbers.',
          example:
            '/api/v1/pressure?memoryUsedPercent=45&tokenBurnRatePerMin=35&contextDriftPercent=20&sessionAgeSeconds=600&tokenBudgetTotal=100000&tokenBudgetUsed=35000',
        },
        { status: 400 }
      );
    }

    // Inline pressure evaluation (no CLI dependency)
    let pressureLevel = 'LOW';
    if (memoryUsedPercent > 80 || contextDriftPercent > 40) {
      pressureLevel = 'CRITICAL';
    } else if (memoryUsedPercent > 65 || contextDriftPercent > 30) {
      pressureLevel = 'HIGH';
    } else if (memoryUsedPercent > 50 || contextDriftPercent > 20) {
      pressureLevel = 'MODERATE';
    }

    const pressure = {
      level: pressureLevel,
      sessionAgeSeconds,
      memoryUsedPercent,
      tokenBurnRatePerMin,
      contextDriftPercent,
      recommendations: [
        pressureLevel === 'CRITICAL' ? 'CRITICAL: Consider checkpointing immediately' : null,
        pressureLevel === 'HIGH' ? 'Monitor drift closely; prepare for compression' : null,
        tokenBurnRatePerMin > 50 ? 'High token burn detected; reduce output verbosity' : null,
      ].filter(Boolean),
    };

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      pressure,
      metadata: {
        systemMode,
        agentProfile,
      },
    });
  } catch (error) {
    console.error('Pressure regulator error:', error);
    return NextResponse.json(
      {
        error: 'Failed to evaluate pressure',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const {
      memoryUsedPercent = 45,
      tokenBurnRatePerMin = 35,
      contextDriftPercent = 20,
      sessionAgeSeconds = 600,
      tokenBudgetTotal = 100000,
      tokenBudgetUsed = 35000,
      contextWindowMaxBytes = 200000,
      contextWindowUsedBytes = 90000,
      systemMode = 'production',
      agentProfile = 'balanced',
    } = body;

    // Inline pressure evaluation (no CLI dependency)
    let pressureLevel = 'LOW';
    if (memoryUsedPercent > 80 || contextDriftPercent > 40) {
      pressureLevel = 'CRITICAL';
    } else if (memoryUsedPercent > 65 || contextDriftPercent > 30) {
      pressureLevel = 'HIGH';
    } else if (memoryUsedPercent > 50 || contextDriftPercent > 20) {
      pressureLevel = 'MODERATE';
    }

    const pressure = {
      level: pressureLevel,
      sessionAgeSeconds,
      memoryUsedPercent,
      tokenBurnRatePerMin,
      contextDriftPercent,
      recommendations: [
        pressureLevel === 'CRITICAL' ? 'CRITICAL: Consider checkpointing immediately' : null,
        pressureLevel === 'HIGH' ? 'Monitor drift closely; prepare for compression' : null,
        tokenBurnRatePerMin > 50 ? 'High token burn detected; reduce output verbosity' : null,
      ].filter(Boolean),
    };

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      pressure,
      metadata: {
        systemMode,
        agentProfile,
      },
    });
  } catch (error) {
    console.error('Pressure regulator error:', error);
    return NextResponse.json(
      {
        error: 'Failed to evaluate pressure',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
