import { SkynetClient } from '../api/client.js';
import { renderPanel, renderSectionHeader } from '../output/renderer.js';
import { ANSI } from '../output/ansi.js';
import { showSplash } from '../output/splash.js';

export async function demoCommand(client: SkynetClient): Promise<string> {
  const output: string[] = [];

  // Step 1: Splash
  output.push('\n');
  showSplash();
  output.push(ANSI.DIM + '→ Initializing registry...\n' + ANSI.RESET);
  await sleep(1000);

  // Step 2: Status
  output.push(renderPanel('SYSTEM STATUS', [
    { key: 'Registry State', value: 'INDEXED' },
    { key: 'Artifacts', value: 'Loading...' },
    { key: 'Auth State', value: 'READY' },
  ]));
  output.push('\n');
  await sleep(800);

  // Step 3: List artifacts
  try {
    const artifacts = await client.listArtifacts();
    output.push(renderSectionHeader(`Available Artifacts (${artifacts.length} total)`));
    output.push('\n');

    for (const artifact of artifacts) {
      output.push(ANSI.RED + '  ◆ ' + ANSI.RESET + artifact.title);
      output.push(ANSI.DIM + `    ${artifact.description}` + ANSI.RESET + '\n');
      await sleep(300);
    }

    output.push('\n');
    await sleep(500);

    // Step 4: Detail view
    const firstArtifact = artifacts[0];
    output.push(renderPanel('ARTIFACT DETAIL', [
      { key: 'Title', value: firstArtifact.title },
      { key: 'Category', value: firstArtifact.category },
      { key: 'Version', value: firstArtifact.version },
      { key: 'Price', value: `$${(firstArtifact.price_cents / 100).toFixed(2)}` },
      { key: 'Status', value: 'AVAILABLE' },
    ]));
    output.push('\n');
    await sleep(1000);

    output.push(renderSectionHeader('Description'));
    output.push(firstArtifact.description + '\n');
    await sleep(500);

    // Step 5: Stats
    output.push(ANSI.RED + ANSI.BRIGHT + 'SKYNET REGISTRY READY' + ANSI.RESET + '\n');
    output.push(renderPanel('STATS', [
      { key: 'Total Artifacts', value: artifacts.length },
      { key: 'Total Value', value: `$${(artifacts.length * 8.99).toFixed(2)}` },
      { key: 'API Status', value: 'LIVE' },
      { key: 'CLI Version', value: '1.0.0' },
    ]));

    output.push('\n' + ANSI.DIM + '→ Ready for deployment with OpenClaw agents' + ANSI.RESET + '\n');
  } catch (err) {
    output.push('Error loading artifacts\n');
  }

  return output.join('');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
