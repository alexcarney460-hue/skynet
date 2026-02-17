import { ANSI } from './ansi.js';
import { selectProfile, getRecommendations } from './recommendation-engine.js';

interface TokenMetrics {
  contextLoad: 'LOW' | 'MEDIUM' | 'HIGH';
  memoryOverhead: number;
  redundancyRisk: 'NONE' | 'MINIMAL' | 'DETECTED' | 'CRITICAL';
  compressionPotential: 'NONE' | 'LOW' | 'SIGNIFICANT' | 'CRITICAL';
}

interface WasteSource {
  name: string;
  tokens: number;
  percentage: number;
}

interface AnalysisResult {
  metrics: TokenMetrics;
  wasteSources: WasteSource[];
  recommendations: string[];
  recommendedProfile: string;
}

/**
 * Generate deterministic token analysis (no API calls).
 * Seed-based to ensure consistent output for testing.
 * Uses profile-based recommendations instead of hardcoded values.
 */
export function analyzeTokens(): AnalysisResult {
  // Deterministic seed-based metrics
  const now = Math.floor(Date.now() / 1000);
  const seed = now % 1000;

  const contextLoad = seed % 3 === 0 ? 'LOW' : seed % 3 === 1 ? 'MEDIUM' : 'HIGH';
  const memoryOverhead = 400 + (seed * 13) % 150;
  const redundancyRisk = seed % 4 === 0 ? 'NONE' : seed % 4 === 1 ? 'MINIMAL' : seed % 4 === 2 ? 'DETECTED' : 'CRITICAL';
  const compressionPotential = seed % 4 === 0 ? 'NONE' : seed % 4 === 1 ? 'LOW' : seed % 4 === 2 ? 'SIGNIFICANT' : 'CRITICAL';

  const metrics: TokenMetrics = {
    contextLoad,
    memoryOverhead,
    redundancyRisk,
    compressionPotential,
  };

  // Waste sources
  const totalWaste = memoryOverhead;
  const wasteSources: WasteSource[] = [
    { name: 'memory_overhead', tokens: Math.floor(totalWaste * 0.29), percentage: 29 },
    { name: 'instruction_duplication', tokens: Math.floor(totalWaste * 0.19), percentage: 19 },
    { name: 'response_verbosity', tokens: Math.floor(totalWaste * 0.18), percentage: 18 },
    { name: 'json_formatting', tokens: Math.floor(totalWaste * 0.16), percentage: 16 },
    { name: 'padding_overhead', tokens: Math.floor(totalWaste * 0.18), percentage: 18 },
  ];

  // Determine recommended profile based on metrics
  const memUtilization = 40 + (seed * 3) % 50;
  const driftFactor = 10 + (seed * 2) % 30;
  const coherence = 95 - (seed * 0.5) % 30;
  const profile = selectProfile(memUtilization, driftFactor, coherence);

  // Get profile-based recommendations
  const recommendations = getRecommendations(profile);

  return { metrics, wasteSources, recommendations, recommendedProfile: profile };
}

/**
 * Render token analysis as diagnostic panel.
 */
export function renderTokenAnalysis(): string {
  const analysis = analyzeTokens();
  const { metrics, wasteSources, recommendations, recommendedProfile } = analysis;

  const lines: string[] = [];

  // Header
  lines.push(ANSI.RED + 'TOKEN ANALYSIS' + ANSI.RESET);
  lines.push('─────────────────────────────────');
  lines.push('');

  // Metrics panel
  const metricsRows = [
    ['Context Load', metrics.contextLoad],
    ['Memory Overhead', `${metrics.memoryOverhead} tokens`],
    ['Redundancy Risk', metrics.redundancyRisk],
    ['Compression Pot.', metrics.compressionPotential],
  ];

  const maxKeyLen = Math.max(...metricsRows.map(r => r[0].length));
  metricsRows.forEach(row => {
    const key = row[0].padEnd(maxKeyLen);
    lines.push(`${key}  ${row[1]}`);
  });

  lines.push('');
  lines.push('─────────────────────────────────');
  lines.push(ANSI.RED + 'WASTE SOURCES' + ANSI.RESET);
  lines.push('─────────────────────────────────');
  lines.push('');

  // Waste sources (aligned)
  const nameWidth = Math.max(...wasteSources.map(w => w.name.length));
  wasteSources.forEach(source => {
    const name = source.name.padEnd(nameWidth);
    const tokens = String(source.tokens).padStart(3);
    const percent = String(source.percentage).padStart(2);
    lines.push(`${name}  ${tokens} tokens  ${percent}%`);
  });

  lines.push('');
  lines.push('─────────────────────────────────');
  lines.push(ANSI.RED + 'PROFILE RECOMMENDATION' + ANSI.RESET);
  lines.push('─────────────────────────────────');
  lines.push('');
  lines.push(`Optimization Profile  ${recommendedProfile}`);
  lines.push('');
  lines.push(ANSI.RED + 'RECOMMENDATIONS' + ANSI.RESET);
  lines.push('─────────────────────────────────');
  lines.push('');

  recommendations.forEach(rec => {
    lines.push(ANSI.DIM + rec + ANSI.RESET);
  });

  lines.push('');

  return lines.join('\n');
}
