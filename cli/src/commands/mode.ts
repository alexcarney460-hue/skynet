import { setMode, getMode, OptimizationMode } from '../config/config.js';
import { ANSI } from '../output/ansi.js';

/**
 * Display system posture update on mode change.
 */
export async function modeCommand(newMode?: string): Promise<string> {
  if (!newMode) {
    // Show current mode
    const currentMode = getMode();
    return `${ANSI.RED}CURRENT POSTURE${ANSI.RESET}
─────────────────────────────────

Optimization Mode  ${currentMode}

`;
  }

  // Normalize to uppercase
  const normalizedMode = newMode.toUpperCase() as OptimizationMode;

  // Validate mode
  if (!['MINIMAL', 'BALANCED', 'AGGRESSIVE'].includes(normalizedMode)) {
    throw new Error(`Invalid mode: ${newMode}. Use: minimal | balanced | aggressive`);
  }

  // Set new mode
  setMode(normalizedMode);

  const lines: string[] = [];

  lines.push(ANSI.RED + 'SYSTEM POSTURE UPDATE' + ANSI.RESET);
  lines.push('─────────────────────────────────');
  lines.push('');

  // Mode details
  const modeDetails: Record<OptimizationMode, { policy: string; drift: string; state: string }> = {
    MINIMAL: {
      policy: 'QUALITY-FIRST',
      drift: 'MONITORED',
      state: 'STABLE',
    },
    BALANCED: {
      policy: 'STANDARD',
      drift: 'CONTROLLED',
      state: 'PERSISTENT',
    },
    AGGRESSIVE: {
      policy: 'STRICT',
      drift: 'MINIMIZED',
      state: 'OPTIMIZED',
    },
  };

  const details = modeDetails[normalizedMode];

  lines.push(`Optimization Mode   ${normalizedMode}`);
  lines.push(`Token Policy        ${details.policy}`);
  lines.push(`Session Drift       ${details.drift}`);
  lines.push(`State               ${details.state}`);
  lines.push('');
  lines.push('─────────────────────────────────');
  lines.push(ANSI.RED + ANSI.BRIGHT + 'Mode: APPLIED' + ANSI.RESET);
  lines.push('');

  return lines.join('\n');
}
