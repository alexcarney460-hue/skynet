import { SupabaseClient } from '@supabase/supabase-js';

export interface EntitlementCheck {
  hasFullUnlock: boolean;
  unlockedArtifactIds: string[];
}

/**
 * Centralized entitlement logic.
 * User owns artifact IF: full_unlock OR artifact-specific unlock
 */
export async function getUserEntitlements(
  userId: string,
  supabase: SupabaseClient
): Promise<EntitlementCheck> {
  try {
    const { data, error } = await supabase
      .from('user_unlocks')
      .select('artifact_id, unlock_type')
      .eq('user_id', userId);

    if (error) throw error;

    const hasFullUnlock = data?.some(row => row.unlock_type === 'full') ?? false;
    const unlockedArtifactIds = (data ?? [])
      .filter(row => row.unlock_type === 'artifact' && row.artifact_id)
      .map(row => row.artifact_id);

    return { hasFullUnlock, unlockedArtifactIds };
  } catch (err) {
    console.error('getUserEntitlements error:', err);
    throw err;
  }
}

/**
 * Check if user owns specific artifact.
 * Returns true if: full_unlock OR artifact-specific unlock exists
 */
export async function userOwnsArtifact(
  userId: string,
  artifactId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  try {
    const entitlements = await getUserEntitlements(userId, supabase);
    return entitlements.hasFullUnlock || entitlements.unlockedArtifactIds.includes(artifactId);
  } catch (err) {
    console.error('userOwnsArtifact error:', err);
    return false;
  }
}
