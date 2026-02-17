import { ANSI, skynetRed, dim } from './ansi.js';

export function showSplash() {
  const splash = `
${ANSI.RED}${ANSI.BRIGHT}
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                                                       ┃
┃                    S K Y N E T                       ┃
┃                                                       ┃
┃   Registry of Performance-Optimized Agent Systems   ┃
┃                                                       ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
${ANSI.RESET}
${dim('v1.0.0')}

`;

  process.stdout.write(splash);
}
