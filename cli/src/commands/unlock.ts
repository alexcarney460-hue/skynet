import { renderPanel, renderInfo, renderList, formatPrice } from '../output/renderer.js';

/**
 * Mock unlock command.
 * Real implementation will create Stripe/Coinbase checkout session.
 */
export async function unlockCommand(slug?: string, full: boolean = false): Promise<string> {
  const rows = [];

  if (full) {
    rows.push({ key: 'Unlock Type', value: 'Full Registry' });
    rows.push({ key: 'Artifacts', value: '43+ (all current & future)' });
    rows.push({ key: 'Price', value: formatPrice(2999) });
  } else if (slug) {
    rows.push({ key: 'Artifact', value: slug });
    rows.push({ key: 'Price', value: formatPrice(899) });
    rows.push({ key: 'Type', value: 'Individual Unlock' });
  } else {
    return 'ERROR: Specify artifact slug or use --full flag';
  }

  let output = renderPanel('CAPABILITY UNLOCK', rows);
  output += '\nPAYMENT METHODS\n─────────────────────────────────\n\n';

  const methods = [
    { text: 'Stripe (card / ACH)', indent: 0 },
    { text: 'Coinbase Commerce (crypto)', indent: 0 },
  ];

  output += renderList(methods);
  output += '\n\n';
  output += renderInfo('Magic link auth required. Run: skynet auth:login');

  return output;
}
