import { ANSI, skynetRed, dim } from './ansi.js';

export function showSplash() {
  const splash = `
${ANSI.RED}${ANSI.BRIGHT}
  SSSSSS   KK KK  Y     Y  N  N   EEEEEE  TTTTTT
  SS       K K    Y     Y  NN N   EE      TT
  SSSSSS   KKK     Y   Y   N NN   EEEE    TT
      SS   K K      Y Y    N  N   EE      TT
  SSSSSS   K  K      Y     N   N  EEEEEE  TT
${ANSI.RESET}
${dim('Registry of Performance-Optimized Agent Systems')}
${dim('v1.0.0')}

`;

  process.stdout.write(splash);
}
