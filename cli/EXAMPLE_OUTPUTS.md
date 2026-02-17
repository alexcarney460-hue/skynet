# Skynet CLI — Example Outputs

All outputs use the unified renderer system for consistency and screenshot-friendliness.

---

## `skynet status`

```
SKYNET
─────────────────────────────────

Registry State       INDEXED
Artifacts Online     43
Auth State           UNAUTHENTICATED
API Version          v1.0
CLI Version          1.0.0

─────────────────────────────────
```

### With Authentication

```
SKYNET
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

---

## `skynet artifacts`

```
ARTIFACTS (43 total)
─────────────────────────────────

memory-optimization-v1        $8.99    UNLOCKED
system-prompt-elite           $8.99    LOCKED
token-efficiency-pack         $8.99    UNLOCKED
session-init-advanced         $8.99    LOCKED
router-intelligence-v2        $8.99    LOCKED
cost-reduction-framework      $8.99    UNLOCKED
agent-memory-vault            $8.99    LOCKED
context-window-optimizer      $8.99    UNLOCKED

→ Run: skynet artifact <slug> for details
```

---

## `skynet artifact memory-optimization-v1`

### Locked (No Auth)

```
ARTIFACT
─────────────────────────────────

Title               Memory Optimization System
Category            memory_system
Version             1.0
Price               $8.99
Status              LOCKED

─────────────────────────────────

DESCRIPTION
A performance-optimized memory system designed for autonomous agents.
Reduces token overhead while maintaining semantic fidelity through
advanced compression algorithms and hierarchical recall mechanisms.


→ Run: skynet unlock memory-optimization-v1 to view full content
```

### Unlocked (With Auth)

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
Reduces token overhead while maintaining semantic fidelity through
advanced compression algorithms and hierarchical recall mechanisms.


→ Run: skynet artifact memory-optimization-v1 --content to view full content
```

### With `--content` Flag (Unlocked)

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
Reduces token overhead while maintaining semantic fidelity through
advanced compression algorithms and hierarchical recall mechanisms.

─────────────────────────────────

CONTENT
# Memory Optimization System

## Overview
This system provides a canonical approach to agent memory management,
optimizing for token efficiency while preserving semantic accuracy.

[Full artifact content displayed here...]

─────────────────────────────────
```

---

## `skynet entitlements`

### No Unlocks

```
ENTITLEMENTS
─────────────────────────────────

User ID              a1b2c3d4...
Full Unlock          NO
Individual Unlocks   0

─────────────────────────────────
```

### With Full Registry Unlock

```
ENTITLEMENTS
─────────────────────────────────

User ID              a1b2c3d4...
Full Unlock          YES
Individual Unlocks   0

─────────────────────────────────
```

### With Individual Artifact Unlocks

```
ENTITLEMENTS
─────────────────────────────────

User ID              a1b2c3d4...
Full Unlock          NO
Individual Unlocks   3

─────────────────────────────────

UNLOCKED ARTIFACTS
─────────────────────────────────

memory-optimization-v1...
token-efficiency-pack-v...
session-init-advanced-...
```

---

## `skynet unlock memory-optimization-v1`

```
CAPABILITY UNLOCK
─────────────────────────────────

Artifact            memory-optimization-v1
Price               $8.99
Type                Individual Unlock

─────────────────────────────────

PAYMENT METHODS
─────────────────────────────────

Stripe (card / ACH)
Coinbase Commerce (crypto)

→ Magic link auth required. Run: skynet auth:login
```

---

## `skynet unlock --full`

```
CAPABILITY UNLOCK
─────────────────────────────────

Unlock Type         Full Registry
Artifacts           43+ (all current & future)
Price               $29.99

─────────────────────────────────

PAYMENT METHODS
─────────────────────────────────

Stripe (card / ACH)
Coinbase Commerce (crypto)

→ Magic link auth required. Run: skynet auth:login
```

---

## `skynet auth:logout`

```
AUTHENTICATION
─────────────────────────────────

Status              LOGGED OUT
Auth Token          CLEARED

─────────────────────────────────

✓ Session cleared
```

---

## Error Examples

### Unauthorized

```
ERROR: Unauthorized. Run: skynet auth login
```

### Not Found

```
ERROR: HTTP 404
```

### API Offline

```
ERROR: API request failed: Connect ECONNREFUSED
```

### Missing Arguments

```
ERROR: Specify artifact slug or use --full flag
```

---

## Design Notes

### Alignment

All key-value panels are left-aligned with consistent spacing:

```
LeftKey              Value
LongerKey            Value
VeryLongKey          Value
```

Keys are padded to match the longest key in the panel.

### Typography

- **Font**: Monospace (terminal default)
- **Spacing**: 70 character max width for readability
- **Separators**: `─────────────────────────────────` (35 dashes)
- **No colors**: Except Skynet red on main header

### Structure

1. **Header** (with Skynet red)
2. **Divider**
3. **Blank line**
4. **Content** (key-value pairs or list items)
5. **Blank line**
6. **Divider**

---

## Testing Locally

To see live output:

```bash
cd cli
npm install
npm run dev -- status
npm run dev -- artifacts
npm run dev -- artifact memory-optimization-v1
npm run dev -- entitlements
npm run dev -- unlock --full
npm run dev -- auth:logout
```

All commands output instantly (no API calls in Phase 1).
