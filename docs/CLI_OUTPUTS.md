# Skynet CLI — Example Outputs

## `skynet status`

```
SYSTEM STATUS
─────────────────────────────────
Registry State:      INDEXED
Artifacts Online:    43
Auth State:          AUTHENTICATED
User ID:             a1b2c3d4...
Full Unlock:         YES
Unlocked Artifacts:  43
API Version:         v1.0
CLI Version:         1.0.0
─────────────────────────────────
```

## `skynet artifacts`

```
ARTIFACTS (43 total)
─────────────────────────────────

memory-optimization-v1                $8.99     UNLOCKED
system-prompt-elite                   $8.99     LOCKED
token-efficiency-pack                 $8.99     UNLOCKED
session-init-advanced                 $8.99     LOCKED
router-intelligence-v2                $8.99     LOCKED
cost-reduction-framework              $8.99     UNLOCKED
agent-memory-vault                    $8.99     LOCKED
context-window-optimizer              $8.99     UNLOCKED

─────────────────────────────────

Run: skynet artifact <slug> for details
```

## `skynet artifact memory-optimization-v1`

```
ARTIFACT DETAIL
─────────────────────────────────
Title:               Memory Optimization System
Slug:                memory-optimization-v1
Category:            memory_system
Version:             1.0
Price:               $8.99
Status:              UNLOCKED
─────────────────────────────────

DESCRIPTION
A performance-optimized memory system designed for autonomous agents.
Reduces token overhead while maintaining semantic fidelity through
advanced compression algorithms and hierarchical recall mechanisms.

[To view full content - Run: skynet artifact memory-optimization-v1 --content]
```

## `skynet artifact memory-optimization-v1 --content`

```
ARTIFACT DETAIL
─────────────────────────────────
Title:               Memory Optimization System
Slug:                memory-optimization-v1
Category:            memory_system
Version:             1.0
Price:               $8.99
Status:              UNLOCKED
─────────────────────────────────

DESCRIPTION
A performance-optimized memory system designed for autonomous agents...

─────────────────────────────────

CONTENT
# Memory Optimization System

## Overview
This system provides a canonical approach to agent memory management...

[Full artifact content displayed here]

─────────────────────────────────
```

## `skynet entitlements`

```
ENTITLEMENTS
─────────────────────────────────
User ID:             a1b2c3d4...
Full Unlock:         YES
Individual Unlocks:  0
─────────────────────────────────
```

## `skynet auth:logout`

```
AUTHENTICATION
─────────────────────────────────
✓ Logged out successfully
─────────────────────────────────
```

## Error Example: `skynet entitlements` (not authenticated)

```
ERROR: Unauthorized. Run: skynet auth login
```

## Error Example: `skynet artifact nonexistent`

```
ERROR: HTTP 404
```
