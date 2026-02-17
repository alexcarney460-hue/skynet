import { skynetRed, dim } from './ansi.js';

const DIVIDER = '─────────────────────────────────';
const MAX_WIDTH = 70;

interface PanelRow {
  key: string;
  value: string | boolean | number;
}

interface ListItem {
  text: string;
  indent?: number;
}

/**
 * Render a status panel with title and key-value rows.
 * Compact, aligned, screenshot-friendly.
 */
export function renderPanel(title: string, rows: PanelRow[]): string {
  const lines: string[] = [];

  // Header with Skynet red
  lines.push(skynetRed(title));
  lines.push(DIVIDER);
  lines.push('');

  // Aligned rows
  const maxKeyLength = Math.max(...rows.map(r => r.key.length));
  rows.forEach(row => {
    const value = typeof row.value === 'boolean' 
      ? (row.value ? 'YES' : 'NO') 
      : String(row.value);
    const key = row.key.padEnd(maxKeyLength);
    lines.push(`${key}  ${value}`);
  });

  lines.push('');
  lines.push(DIVIDER);

  return lines.join('\n');
}

/**
 * Render a short list of items.
 * No title, just clean rows.
 */
export function renderList(items: ListItem[]): string {
  return items
    .map(item => {
      const indent = ' '.repeat((item.indent || 0) * 2);
      return `${indent}${item.text}`;
    })
    .join('\n');
}

/**
 * Render a table of artifacts (compact mode).
 * Three columns: slug | price | status
 */
export function renderArtifactTable(
  artifacts: Array<{
    slug: string;
    price_cents: number;
    status: 'LOCKED' | 'UNLOCKED';
  }>
): string {
  if (artifacts.length === 0) {
    return '(no artifacts available)';
  }

  // Column widths
  const slugWidth = Math.min(35, Math.max(...artifacts.map(a => a.slug.length)) + 1);
  const priceWidth = 8;
  const statusWidth = 10;

  const lines: string[] = [];
  artifacts.forEach(a => {
    const price = `$${(a.price_cents / 100).toFixed(2)}`;
    const slug = a.slug.padEnd(slugWidth);
    const priceStr = price.padStart(priceWidth);
    const status = a.status.padStart(statusWidth);

    lines.push(`${slug}${priceStr}  ${status}`);
  });

  return lines.join('\n');
}

/**
 * Render section header (no color).
 */
export function renderSectionHeader(title: string): string {
  return `${title}\n${DIVIDER}\n`;
}

/**
 * Format a price value.
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Render an info message (dimmed).
 */
export function renderInfo(text: string): string {
  return dim(`→ ${text}`);
}

/**
 * Render an error message.
 */
export function renderError(message: string): string {
  return `ERROR: ${message}`;
}

/**
 * Render a success message.
 */
export function renderSuccess(message: string): string {
  return `✓ ${message}`;
}
