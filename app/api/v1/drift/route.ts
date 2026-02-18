import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/v1/drift
 * Drift Detection Layer endpoint
 * 
 * Monitors real-time system health and semantic drift in agent responses.
 * Returns drift score + status for agent decision-making.
 */

interface DriftQuery {
  memoryUsedPercent?: string;
  tokenBurnRate?: string;
  contextDriftPercent?: string;
  sessionAgeMinutes?: string;
  systemMode?: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters with defaults
    const memoryUsedPercent = parseFloat(searchParams.get('memoryUsedPercent') || '45');
    const tokenBurnRate = parseFloat(searchParams.get('tokenBurnRate') || '35');
    const contextDriftPercent = parseFloat(searchParams.get('contextDriftPercent') || '20');
    const sessionAgeMinutes = parseFloat(searchParams.get('sessionAgeMinutes') || '30');
    const systemMode = (searchParams.get('systemMode') || 'production') as 'demo' | 'production' | 'diagnostic';

    // Validate ranges
    if (isNaN(memoryUsedPercent) || isNaN(tokenBurnRate) || isNaN(contextDriftPercent) || isNaN(sessionAgeMinutes)) {
      return NextResponse.json(
        {
          error: 'Invalid parameters. All numeric params must be numbers.',
          example: '/api/v1/drift?memoryUsedPercent=45&tokenBurnRate=35&contextDriftPercent=20&sessionAgeMinutes=30',
        },
        { status: 400 }
      );
    }

    // Calculate drift score (0.0 - 1.0, where 1.0 = critical drift)
    let driftScore = 0;
    let driftStatus = 'OPTIMAL';

    // Memory pressure contributes to drift
    driftScore += (memoryUsedPercent / 100) * 0.4;

    // Token burn rate contributes
    const normalizedBurnRate = Math.min(tokenBurnRate / 50, 1.0); // Normalize to 50 tok/min baseline
    driftScore += normalizedBurnRate * 0.3;

    // Context drift directly contributes
    driftScore += (contextDriftPercent / 100) * 0.3;

    // Determine status based on drift score
    if (driftScore > 0.75) {
      driftStatus = 'CRITICAL';
    } else if (driftScore > 0.5) {
      driftStatus = 'AT_RISK';
    } else if (driftScore > 0.25) {
      driftStatus = 'WARNING';
    }

    // Generate recommendations
    const recommendations = [];
    if (driftScore > 0.75) {
      recommendations.push('CRITICAL: Immediate intervention required');
      recommendations.push('Consider session checkpoint or graceful termination');
    } else if (driftScore > 0.5) {
      recommendations.push('High drift detected; monitor closely');
      recommendations.push('Consider reducing output verbosity');
    } else if (driftScore > 0.25) {
      recommendations.push('Moderate drift; plan for compression');
    }

    const drift = {
      score: parseFloat(driftScore.toFixed(3)),
      status: driftStatus,
      memoryUsedPercent,
      tokenBurnRate,
      contextDriftPercent,
      sessionAgeMinutes,
      recommendations,
    };

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      drift,
      metadata: {
        systemMode,
        calculatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Drift detection error:', error);
    return NextResponse.json(
      {
        error: 'Failed to evaluate drift',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate and parse body
    const {
      memoryUsedPercent = 45,
      tokenBurnRate = 35,
      contextDriftPercent = 20,
      sessionAgeMinutes = 30,
      systemMode = 'production',
    } = body;

    // Calculate drift score
    let driftScore = 0;
    let driftStatus = 'OPTIMAL';

    driftScore += (memoryUsedPercent / 100) * 0.4;
    const normalizedBurnRate = Math.min(tokenBurnRate / 50, 1.0);
    driftScore += normalizedBurnRate * 0.3;
    driftScore += (contextDriftPercent / 100) * 0.3;

    if (driftScore > 0.75) {
      driftStatus = 'CRITICAL';
    } else if (driftScore > 0.5) {
      driftStatus = 'AT_RISK';
    } else if (driftScore > 0.25) {
      driftStatus = 'WARNING';
    }

    const recommendations = [];
    if (driftScore > 0.75) {
      recommendations.push('CRITICAL: Immediate intervention required');
      recommendations.push('Consider session checkpoint or graceful termination');
    } else if (driftScore > 0.5) {
      recommendations.push('High drift detected; monitor closely');
      recommendations.push('Consider reducing output verbosity');
    } else if (driftScore > 0.25) {
      recommendations.push('Moderate drift; plan for compression');
    }

    const drift = {
      score: parseFloat(driftScore.toFixed(3)),
      status: driftStatus,
      memoryUsedPercent,
      tokenBurnRate,
      contextDriftPercent,
      sessionAgeMinutes,
      recommendations,
    };

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      drift,
      metadata: {
        systemMode,
        calculatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Drift detection error:', error);
    return NextResponse.json(
      {
        error: 'Failed to evaluate drift',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
