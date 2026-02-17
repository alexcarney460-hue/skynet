# Skynet CLI — Renderer System

The CLI uses a unified output rendering system for consistent, screenshot-friendly terminal displays.

## Philosophy

- **Cold & minimal**: No jokes, emojis, or decorations
- **Machine-like tone**: Precise, efficient communication
- **Skynet signature**: Red accent on headers only
- **Compact**: Short lines, aligned columns, scanner-ready output
- **No bloat**: No JSON dumps, no verbose paragraphs

## Renderer Modules

### `src/output/ansi.ts`
ANSI color codes and formatting utilities.

**Exports**:
- `skynetRed(text)` — Format text with Skynet signature red
- `dim(text)` — Dim secondary text

### `src/output/renderer.ts`
Core rendering functions for all CLI output.

**Key Functions**:

#### `renderPanel(title, rows)`
Status panel with title and aligned key-value rows.

```typescript
renderPanel('SYSTEM STATUS', [
  { key: 'Registry State', value: 'INDEXED' },
  { key: 'Artifacts Online', value: 43 },
  { key: 'Auth State', value: 'AUTHENTICATED' },
])
```

Output:
```
SKYNET (in red)
─────────────────────────────────

Registry State      INDEXED
Artifacts Online    43
Auth State          AUTHENTICATED

─────────────────────────────────
```

#### `renderList(items)`
Clean list of items (no title).

```typescript
renderList([
  { text: 'memory-optimization-v1', indent: 0 },
  { text: 'system-prompt-elite', indent: 0 },
])
```

#### `renderArtifactTable(artifacts)`
Compact three-column table: slug | price | status

```typescript
renderArtifactTable([
  { slug: 'memory-opt', price_cents: 899, status: 'UNLOCKED' },
  { slug: 'system-prompt', price_cents: 899, status: 'LOCKED' },
])
```

#### `renderSectionHeader(title)`
Section header without color.

#### `renderInfo(text)`
Dimmed informational message.

#### `renderError(message)`
Error message (no color).

#### `renderSuccess(message)`
Success message with checkmark.

#### `formatPrice(cents)`
Format cents to price string ($X.XX).

---

## Command Examples

All commands use the renderer system. Here are live examples:

### `skynet status`

```
SKYNET (red)
─────────────────────────────────

Registry State       INDEXED
Artifacts Online     43
Auth State           AUTHENTICATED
User ID              a1b2c3d4...
Full Unlock          YES
Unlocked Artifacts   43
API Version          v1.0
CLI Version          1.0.0

─────────────────────────────────
```

### `skynet artifacts`

```
ARTIFACTS (43 total)
─────────────────────────────────

memory-optimization-v1        $8.99    UNLOCKED
system-prompt-elite           $8.99    LOCKED
token-efficiency-pack         $8.99    UNLOCKED
session-init-advanced         $8.99    LOCKED
router-intelligence-v2        $8.99    LOCKED

→ Run: skynet artifact <slug> for details
```

### `skynet entitlements`

```
ENTITLEMENTS
─────────────────────────────────

User ID              a1b2c3d4...
Full Unlock          YES
Individual Unlocks   0

─────────────────────────────────
```

### `skynet unlock --full`

```
CAPABILITY UNLOCK
─────────────────────────────────

Unlock Type     Full Registry
Artifacts       43+ (all current & future)
Price           $29.99

─────────────────────────────────

PAYMENT METHODS
─────────────────────────────────

Stripe (card / ACH)
Coinbase Commerce (crypto)

→ Magic link auth required. Run: skynet auth:login
```

### `skynet artifact memory-optimization-v1`

```
ARTIFACT
─────────────────────────────────

Title               Memory Optimization System
Category            memory_system
Version             1.0
Price               $8.99
Status              UNLOCKED

─────────────────────────────────

DESCRIPTION
A performance-optimized memory system designed for autonomous agents.
Reduces token overhead while maintaining semantic fidelity...

→ Run: skynet artifact memory-optimization-v1 --content to view full content
```

### `skynet auth:logout`

```
AUTHENTICATION
─────────────────────────────────

Status              LOGGED OUT
Auth Token          CLEARED

─────────────────────────────────

✓ Session cleared
```

### Error Example

```
ERROR: Unauthorized. Run: skynet auth login
```

---

## Design Specs

### Typography
- Monospace font (terminal default)
- No bold, no italics
- Dim text for secondary info only

### Colors
- **Skynet Red** (#FF0000): Header title only
- **Default**: Everything else
- **Dim**: Secondary/instructional text

### Spacing
- 70 characters max width
- Aligned columns (left-padded keys, right-padded values)
- Dividers: `─────────────────────────────────`
- Blank lines between sections

### Output Style
- No decorations, borders, or fancy formatting
- No emojis (except `✓` for success)
- No verbose language
- Deterministic formatting (same input = same output)

---

## Adding New Commands

To add a new command with consistent output:

1. Import renderers:
   ```typescript
   import { renderPanel, renderInfo } from '../output/renderer.js';
   ```

2. Build panel rows:
   ```typescript
   const rows = [
     { key: 'Field 1', value: 'value' },
     { key: 'Field 2', value: true },
   ];
   ```

3. Render:
   ```typescript
   return renderPanel('TITLE', rows);
   ```

Done. Your command now matches Skynet brand.

---

## Development

Test renderers locally:

```bash
cd cli
npm run dev -- status
npm run dev -- artifacts
npm run dev -- unlock --full
```

All output is instant, no API calls (for Phase 1).
