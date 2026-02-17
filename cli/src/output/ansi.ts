// ANSI color codes for Skynet branding
export const ANSI = {
  // Skynet signature red
  RED: '\x1b[38;2;255;0;0m',
  RESET: '\x1b[0m',
  
  // Utility
  DIM: '\x1b[2m',
  BRIGHT: '\x1b[1m',
};

/**
 * Format text with Skynet red color.
 * Used for the SKYNET header only.
 */
export function skynetRed(text: string): string {
  return `${ANSI.RED}${text}${ANSI.RESET}`;
}

/**
 * Format text as dimmed (system messages, secondary info).
 */
export function dim(text: string): string {
  return `${ANSI.DIM}${text}${ANSI.RESET}`;
}
