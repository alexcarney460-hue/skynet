import { ANSI } from './ansi.js';

type StatusLevel = 'LOW' | 'MODERATE' | 'DEGRADED' | 'CRITICAL';
type RiskLevel = 'STABLE' | 'RISING' | 'ELEVATED' | 'CRITICAL';
type Action = 'NONE' | 'MONITORING' | 'COMPRESSION' | 'RESET';

interface SessionMetrics {
  memoryPressure: StatusLevel;
  contextDrift: StatusLevel;
  stateIntegrity: StatusLevel;
  stabilityRisk: RiskLevel;
}

interface ContextMetrics {
  activeMessages: number;
  contextWindow: number;
  memoryUtilization: number;
  driftFactor: number;
}

interface StateAssessment {
  coherenceScore: number;
  instructionAdherence: number;
  responseConsistency: number;
  recoveryPotential: 'LOW' | 'MODERATE' | 'HIGH';
}

interface SessionAnalysis {
  metrics: SessionMetrics;
  context: ContextMetrics;
  assessment: StateAssessment;
  recommendedAction: Action;
}

/**
 * Generate deterministic session analysis (seed-based simulation).
 * No real session tracking, pure infrastructure telemetry aesthetic.
 */
export function analyzeSession(): SessionAnalysis {
  const now = Math.floor(Date.now() / 1000);
  const seed = now % 1000;

  // Memory pressure (seed-based)
  const memPressureSeed = seed % 3;
  const memoryPressure: StatusLevel =
    memPressureSeed === 0 ? 'LOW' : memPressureSeed === 1 ? 'MODERATE' : 'DEGRADED';

  // Context drift detection
  const driftSeed = seed % 4;
  const contextDrift: StatusLevel =
    driftSeed === 0 ? 'LOW' : driftSeed === 1 ? 'MODERATE' : driftSeed === 2 ? 'DEGRADED' : 'CRITICAL';

  // State integrity
  const integritySeed = seed % 4;
  const stateIntegrity: StatusLevel =
    integritySeed === 0 ? 'LOW' : integritySeed === 1 ? 'MODERATE' : integritySeed === 2 ? 'DEGRADED' : 'CRITICAL';

  // Stability risk (derived from others)
  const riskScore = (memPressureSeed + driftSeed + integritySeed) / 3;
  const stabilityRisk: RiskLevel =
    riskScore < 1 ? 'STABLE' : riskScore < 1.5 ? 'RISING' : riskScore < 2 ? 'ELEVATED' : 'CRITICAL';

  // Context metrics
  const activeMessages = 50 + (seed * 7) % 150;
  const contextWindow = 2048;
  const memoryUtilization = 40 + (seed * 3) % 50;
  const driftFactor = 10 + (seed * 2) % 30;

  // State assessment
  const coherenceScore = 95 - (seed * 0.5) % 30;
  const instructionAdherence = 90 - (seed * 0.3) % 20;
  const responseConsistency = 92 - (seed * 0.4) % 25;
  const recoveryPotential: 'LOW' | 'MODERATE' | 'HIGH' =
    riskScore < 1 ? 'HIGH' : riskScore < 1.5 ? 'MODERATE' : 'LOW';

  // Recommended action based on worst metric
  let recommendedAction: Action = 'NONE';
  if (stabilityRisk === 'CRITICAL' || stateIntegrity === 'CRITICAL') {
    recommendedAction = 'RESET';
  } else if (stabilityRisk === 'ELEVATED' || contextDrift === 'DEGRADED') {
    recommendedAction = 'COMPRESSION';
  } else if (stabilityRisk === 'RISING' || memoryPressure === 'DEGRADED') {
    recommendedAction = 'MONITORING';
  }

  return {
    metrics: {
      memoryPressure,
      contextDrift,
      stateIntegrity,
      stabilityRisk,
    },
    context: {
      activeMessages,
      contextWindow,
      memoryUtilization,
      driftFactor,
    },
    assessment: {
      coherenceScore: Math.round(coherenceScore),
      instructionAdherence: Math.round(instructionAdherence),
      responseConsistency: Math.round(responseConsistency),
      recoveryPotential,
    },
    recommendedAction,
  };
}

/**
 * Render session analysis as infrastructure telemetry.
 */
export function renderSessionAnalysis(): string {
  const analysis = analyzeSession();
  const { metrics, context, assessment, recommendedAction } = analysis;

  const lines: string[] = [];

  // Header
  lines.push(ANSI.RED + 'SESSION ANALYSIS' + ANSI.RESET);
  lines.push('─────────────────────────────────');
  lines.push('');

  // Status metrics
  const statusRows = [
    ['Memory Pressure', metrics.memoryPressure],
    ['Context Drift', metrics.contextDrift],
    ['State Integrity', metrics.stateIntegrity],
    ['Stability Risk', metrics.stabilityRisk],
  ];

  const maxStatusKeyLen = Math.max(...statusRows.map(r => r[0].length));
  statusRows.forEach(row => {
    const key = row[0].padEnd(maxStatusKeyLen);
    lines.push(`${key}  ${row[1]}`);
  });

  lines.push('');
  lines.push('─────────────────────────────────');
  lines.push(ANSI.RED + 'CONTEXT METRICS' + ANSI.RESET);
  lines.push('─────────────────────────────────');
  lines.push('');

  // Context metrics
  const contextRows = [
    ['Active Messages', String(context.activeMessages)],
    ['Context Window', `${context.contextWindow} tokens`],
    ['Memory Utilization', `${context.memoryUtilization}%`],
    ['Drift Factor', `${context.driftFactor}%`],
  ];

  const maxContextKeyLen = Math.max(...contextRows.map(r => r[0].length));
  contextRows.forEach(row => {
    const key = row[0].padEnd(maxContextKeyLen);
    lines.push(`${key}  ${row[1]}`);
  });

  lines.push('');
  lines.push('─────────────────────────────────');
  lines.push(ANSI.RED + 'STATE ASSESSMENT' + ANSI.RESET);
  lines.push('─────────────────────────────────');
  lines.push('');

  // Assessment metrics
  const assessmentRows = [
    ['Coherence Score', `${assessment.coherenceScore}%`],
    ['Instruction Adherence', `${assessment.instructionAdherence}%`],
    ['Response Consistency', `${assessment.responseConsistency}%`],
    ['Recovery Potential', assessment.recoveryPotential],
  ];

  const maxAssessKeyLen = Math.max(...assessmentRows.map(r => r[0].length));
  assessmentRows.forEach(row => {
    const key = row[0].padEnd(maxAssessKeyLen);
    lines.push(`${key}  ${row[1]}`);
  });

  lines.push('');
  lines.push('─────────────────────────────────');
  lines.push(ANSI.RED + 'RECOMMENDED ACTION' + ANSI.RESET);
  lines.push('─────────────────────────────────');
  lines.push('');

  // Recommended action with details
  const actionMap: Record<Action, string[]> = {
    NONE: ['→ No action required'],
    MONITORING: ['→ Monitoring', '→ Continue normal operation'],
    COMPRESSION: ['→ COMPRESSION', '→ Context pruning required', '→ Reset memory buffer'],
    RESET: ['→ RESET', '→ Full context purge recommended', '→ Reinitialize session state'],
  };

  actionMap[recommendedAction].forEach(action => {
    lines.push(ANSI.DIM + action + ANSI.RESET);
  });

  lines.push('');

  return lines.join('\n');
}
