/**
 * Profile-based recommendation engine.
 * Ties recommendations to monetization profiles: MINIMAL, BALANCED, AGGRESSIVE.
 * No hardcoded token values.
 */

export type OptimizationProfile = 'MINIMAL' | 'BALANCED' | 'AGGRESSIVE';

export interface ProfileConfig {
  name: OptimizationProfile;
  description: string;
  recommendations: string[];
  tokenSavingsTarget: string;
  useCase: string;
}

export const PROFILES: Record<OptimizationProfile, ProfileConfig> = {
  MINIMAL: {
    name: 'MINIMAL',
    description: 'Preserve quality, minimal optimization',
    recommendations: [
      '→ Monitor memory pressure',
      '→ Continue normal operation',
      '→ No immediate action required',
    ],
    tokenSavingsTarget: 'Low',
    useCase: 'Baseline performance, maximum quality',
  },

  BALANCED: {
    name: 'BALANCED',
    description: 'Optimal efficiency/quality tradeoff',
    recommendations: [
      '→ Apply standard optimizations',
      '→ Monitor context drift',
      '→ Compress session when utilization exceeds 70%',
      '→ Maintain response quality',
    ],
    tokenSavingsTarget: 'Moderate',
    useCase: 'Production workloads, cost-conscious',
  },

  AGGRESSIVE: {
    name: 'AGGRESSIVE',
    description: 'Maximum efficiency, aggressive optimization',
    recommendations: [
      '→ Apply aggressive compression',
      '→ Enable semantic deduplication',
      '→ Reduce context window dynamically',
      '→ Implement response caching',
      '→ Activate instruction consolidation',
    ],
    tokenSavingsTarget: 'Significant',
    useCase: 'High-volume, cost-critical workloads',
  },
};

/**
 * Determine optimal profile based on metrics.
 * Falls back to BALANCED if forcedMode is not provided.
 */
export function selectProfile(
  memoryUtilization: number,
  driftFactor: number,
  coherenceScore: number,
  forcedMode?: OptimizationProfile
): OptimizationProfile {
  // If mode is explicitly set, use it
  if (forcedMode) {
    return forcedMode;
  }

  // High utilization + high drift + lower coherence → AGGRESSIVE
  if (memoryUtilization > 70 && driftFactor > 20 && coherenceScore < 85) {
    return 'AGGRESSIVE';
  }

  // Moderate utilization or minor drift → BALANCED
  if (memoryUtilization > 60 || driftFactor > 15) {
    return 'BALANCED';
  }

  // Low utilization, stable drift → MINIMAL
  return 'MINIMAL';
}

/**
 * Get recommendations for a profile.
 */
export function getRecommendations(profile: OptimizationProfile): string[] {
  return PROFILES[profile].recommendations;
}

/**
 * Format profile display.
 */
export function formatProfile(profile: OptimizationProfile): string {
  return PROFILES[profile].description;
}
