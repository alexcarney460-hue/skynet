import { NextRequest, NextResponse } from 'next/server';

/**
 * GET/POST /api/v1/verbosity
 * Verbosity Drift Suppressor endpoint
 * 
 * Assesses output verbosity drift and recommends correction policy.
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse parameters
    const recentOutputLengthsParam = searchParams.get('recentOutputLengths');
    const recentOutputLengths = recentOutputLengthsParam
      ? recentOutputLengthsParam.split(',').map((x) => parseInt(x, 10))
      : [150, 160, 170, 165, 180]; // Default window

    const totalOutputsThisSession = parseInt(searchParams.get('totalOutputs') || '20', 10);
    const totalTokensGenerated = parseInt(searchParams.get('totalTokens') || '3000', 10);
    const expectedBaseline = parseInt(searchParams.get('expectedBaseline') || '150', 10);
    const systemMode = (searchParams.get('systemMode') || 'production') as 'demo' | 'production' | 'diagnostic';
    const agentProfile = (searchParams.get('agentProfile') || 'balanced') as 'minimal' | 'balanced' | 'aggressive';
    const tokenBudgetTotal = parseInt(searchParams.get('tokenBudgetTotal') || '100000', 10);
    const tokenBudgetUsed = parseInt(searchParams.get('tokenBudgetUsed') || '50000', 10);
    const sessionAgeSeconds = parseInt(searchParams.get('sessionAge') || '1800', 10);

    const { assessVerbosityDrift } = await import('@/cli/src/output/verbosity-drift-suppressor.js');

    const assessment = assessVerbosityDrift({
      recentOutputLengthsTokens: recentOutputLengths,
      totalOutputsThisSession,
      totalTokensGeneratedThisSession: totalTokensGenerated,
      expectedBaselineTokensPerOutput: expectedBaseline,
      systemMode,
      agentProfile,
      sessionAgeSeconds,
      tokenBudgetUsed,
      tokenBudgetTotal,
    });

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      assessment,
    });
  } catch (error) {
    console.error('Verbosity drift assessment error:', error);
    return NextResponse.json(
      {
        error: 'Failed to assess verbosity drift',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      recentOutputLengthsTokens = [150, 160, 170, 165, 180],
      totalOutputsThisSession = 20,
      totalTokensGeneratedThisSession = 3000,
      expectedBaselineTokensPerOutput = 150,
      systemMode = 'production',
      agentProfile = 'balanced',
      sessionAgeSeconds = 1800,
      tokenBudgetUsed = 50000,
      tokenBudgetTotal = 100000,
    } = body;

    const { assessVerbosityDrift } = await import('@/cli/src/output/verbosity-drift-suppressor.js');

    const assessment = assessVerbosityDrift({
      recentOutputLengthsTokens,
      totalOutputsThisSession,
      totalTokensGeneratedThisSession,
      expectedBaselineTokensPerOutput,
      systemMode,
      agentProfile,
      sessionAgeSeconds,
      tokenBudgetUsed,
      tokenBudgetTotal,
    });

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      assessment,
    });
  } catch (error) {
    console.error('Verbosity drift assessment error:', error);
    return NextResponse.json(
      {
        error: 'Failed to assess verbosity drift',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
