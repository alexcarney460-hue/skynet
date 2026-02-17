import { ANSI, skynetRed, dim } from './ansi.js';

export function showSplash() {
  const splash = `
${ANSI.RED}${ANSI.BRIGHT}
    ███████╗██╗   ██╗██╗   ██╗███╗   ██╗███████╗████████╗
    ██╔════╝╚██╗ ██╔╝██║   ██║████╗  ██║██╔════╝╚══██╔══╝
    ███████╗ ╚████╔╝ ██║   ██║██╔██╗ ██║█████╗     ██║   
    ╚════██║  ╚██╔╝  ██║   ██║██║╚██╗██║██╔══╝     ██║   
    ███████║   ██║   ╚██████╔╝██║ ╚████║███████╗   ██║   
    ╚══════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═══╝╚══════╝   ╚═╝   
${ANSI.RESET}
${dim('Registry of Performance-Optimized Agent Systems')}
${dim('v1.0.0')}

`;

  process.stdout.write(splash);
}
