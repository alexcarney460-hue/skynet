import { ANSI, skynetRed, dim } from './ansi.js';

export function showSplash() {
  const splash = `
${ANSI.RED}${ANSI.BRIGHT}

████████████████████████████████████████████████████████████████████████████████
████████████████████████████████████████████████████████████████████████████████
████                                                                          ████
████                                                                          ████
████          SSSSSSS  KK    KK  YYYY    YYYY  NNN   NNN  EEEEEEE  TTTT    ████
████          SS       KK   KK   YYYY    YYYY  NNNN  NNN  EE       TTTT    ████
████          SSSSS    KKKKKK    YYYY    YYYY  NN NN NNN  EEEEE    TTTT    ████
████          SS       KK  KK     YYYY  YYYY   NN  NNNNN  EE       TTTT    ████
████          SSSSSSS  KK   KK      YYYY       NN   NNNN  EEEEEEE  TTTT    ████
████                                                                          ████
████          Registry of Performance-Optimized Agent Systems               ████
████                                                                          ████
████████████████████████████████████████████████████████████████████████████████
████████████████████████████████████████████████████████████████████████████████

${ANSI.RESET}
${dim('v1.0.0  •  Live on Vercel  •  API Ready')}

`;

  process.stdout.write(splash);
}
