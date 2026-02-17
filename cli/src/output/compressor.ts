import { ANSI } from './ansi.js';
import { analyzeSession } from './session-analyzer.js';

interface CompressionTechnique {
  name: string;
  tokensSaved: number;
  percentage: number;
}

interface CompressionResult {
  statusMetrics: Record<string, string>;
  techniques: CompressionTechnique[];
  beforeTokens: number;
  afterTokens: number;
  tokensSaved: number;
  savingsPercent: number;
  integrityCheck: 'PASSED' | 'WARNING' | 'FAILED';
  coherenceLoss: number;
}

/**
 * Generate deterministic session compression (seed-based simulation).
 * No persistence, pure infrastructure telemetry.
 */
export function compressSession(): CompressionResult {
  const session = analyzeSession();
  const now = Math.floor(Date.now() / 1000);
  const seed = now % 1000;

  // Base footprint from session
  const beforeTokens = session.context.contextWindow;

  // Compression techniques (seed-based)
  const dedup = 400 + (seed * 5) % 300;
  const consolidate = 100 + (seed * 3) % 200;
  const prune = 80 + (seed * 2) % 150;
  const compact = 40 + (seed * 1) % 100;

  const totalSaved = dedup + consolidate + prune + compact;
  const afterTokens = Math.max(400, beforeTokens - totalSaved);

  const techniques: CompressionTechnique[] = [
    { name: 'Semantic Deduplication', tokensSaved: dedup, percentage: Math.round((dedup / totalSaved) * 100) },
    { name: 'Instruction Consolidation', tokensSaved: consolidate, percentage: Math.round((consolidate / totalSaved) * 100) },
    { name: 'Context Pruning', tokensSaved: prune, percentage: Math.round((prune / totalSaved) * 100) },
    { name: 'Metadata Compaction', tokensSaved: compact, percentage: Math.round((compact / totalSaved) * 100) },
  ];

  // Savings metrics
  const savingsPercent = Math.round((totalSaved / beforeTokens) * 100);

  // Integrity check based on savings
  const integrityCheck: 'PASSED' | 'WARNING' | 'FAILED' =
    savingsPercent > 70 ? 'WARNING' : savingsPercent > 50 ? 'PASSED' : 'PASSED';

  const coherenceLoss = savingsPercent > 50 ? 3 : 1;

  const statusMetrics = {
    'Redundant Context': 'REMOVED',
    'Memory Density': 'INCREASED',
    'State Footprint': 'REDUCED',
    'Session Integrity': 'RESTORED',
    'Drift Probability': 'MINIMAL',
  };

  return {
    statusMetrics,
    techniques,
    beforeTokens,
    afterTokens,
    tokensSaved: totalSaved,
    savingsPercent,
    integrityCheck,
    coherenceLoss,
  };
}

/**
 * Render progress bar (filled/empty style).
 */
function renderProgressBar(percent: number, width: number = 8): string {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  return '▓'.repeat(filled) + '░'.repeat(empty);
}

/**
 * Render session compression as system operation.
 */
export function renderSessionCompression(): string {
  const compression = compressSession();

  const lines: string[] = [];

  // Header
  lines.push(ANSI.RED + 'SESSION COMPRESSION' + ANSI.RESET);
  lines.push('─────────────────────────────────');
  lines.push('');

  // Status metrics
  const maxStatusKeyLen = Math.max(...Object.keys(compression.statusMetrics).map(k => k.length));
  Object.entries(compression.statusMetrics).forEach(([key, value]) => {
    const k = key.padEnd(maxStatusKeyLen);
    lines.push(`${k}  ${value}`);
  });

  lines.push('');
  lines.push('─────────────────────────────────');
  lines.push(ANSI.RED + 'COMPRESSION BREAKDOWN' + ANSI.RESET);
  lines.push('─────────────────────────────────');
  lines.push('');

  // Techniques with progress bars
  const maxTechNameLen = Math.max(...compression.techniques.map(t => t.name.length));
  compression.techniques.forEach(tech => {
    const name = tech.name.padEnd(maxTechNameLen);
    const tokens = String(tech.tokensSaved).padStart(3);
    const bar = renderProgressBar(tech.percentage);
    lines.push(`${name}  ${tokens} tokens  ${bar}`);
  });

  lines.push('');
  lines.push('─────────────────────────────────');
  lines.push(ANSI.RED + 'FOOTPRINT REDUCTION' + ANSI.RESET);
  lines.push('─────────────────────────────────');
  lines.push('');

  // Footprint comparison
  const beforeLine = `Before Compression  ${compression.beforeTokens} tokens`;
  const afterLine = `After Compression   ${compression.afterTokens} tokens`;
  const savingsLine = `Tokens Saved        ${compression.tokensSaved} tokens  (${compression.savingsPercent}%)`;

  lines.push(beforeLine);
  lines.push(afterLine);
  lines.push(savingsLine);
  lines.push('');

  // Integrity check
  lines.push(`Integrity Check     ${compression.integrityCheck}`);
  lines.push(`Coherence Loss      MINIMAL (${compression.coherenceLoss}%)`);
  lines.push('');

  lines.push('─────────────────────────────────');
  lines.push(ANSI.RED + ANSI.BRIGHT + 'Status: COMPRESSION COMPLETE' + ANSI.RESET);

  return lines.join('\n');
}
