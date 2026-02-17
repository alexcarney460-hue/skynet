export const DIVIDER = '─────────────────────────────────';

export function section(title: string): string {
  return `${title}\n${DIVIDER}`;
}

export function pair(key: string, value: string | boolean | number): string {
  const v = typeof value === 'boolean' ? (value ? 'YES' : 'NO') : String(value);
  return `${key.padEnd(20)} ${v}`;
}

export function table(
  rows: { [key: string]: string | boolean | number }[],
  columns: (keyof (typeof rows)[0])[]
): string {
  if (rows.length === 0) return '(no items)';

  const colWidths = columns.map(col => {
    const maxLen = Math.max(
      String(col).length,
      ...rows.map(row => String(row[col] || '').length)
    );
    return maxLen + 2;
  });

  const header = columns
    .map((col, i) => String(col).padEnd(colWidths[i]))
    .join('');

  const lines = [header, ...rows.map(row =>
    columns
      .map((col, i) => {
        const val = String(row[col] || '').padEnd(colWidths[i]);
        return val;
      })
      .join('')
  )];

  return lines.join('\n');
}

export function status(state: string): string {
  const states: { [key: string]: string } = {
    READY: 'READY',
    INDEXED: 'INDEXED',
    ACTIVE: 'ACTIVE',
    LOCKED: 'LOCKED',
    UNLOCKED: 'UNLOCKED',
  };
  return states[state] || state;
}

export function price(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function error(message: string): string {
  return `ERROR: ${message}`;
}

export function success(message: string): string {
  return `✓ ${message}`;
}

export function info(text: string): string {
  return text;
}
