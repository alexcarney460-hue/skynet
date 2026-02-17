# Skynet - Seeding Test Data

## Overview

Sample data includes 6 real-world agent system artifacts + 1 test pack with all artifacts linked.

**Artifacts** (each $8.99):
1. ReasoningChain v2 — Structured reasoning prompt template
2. EphemeralMemory v1 — Session-scoped memory system
3. ToolOrchestration v3 — Reliable tool execution framework
4. PromptEval v1 — Systematic prompt testing suite
5. AgentDiagnostics v2 — Production monitoring & instrumentation
6. FastInference v1 — Sub-second latency techniques

**Pack**: "Complete Agent System" — All 6 artifacts bundled

---

## Steps to Seed

### 1. Open Supabase SQL Editor

Go to your Supabase project → SQL Editor → New Query

### 2. Paste Schema (if not already applied)

Copy contents of `docs/schema.sql` and execute.

### 3. Paste Seed Data

Copy contents of `docs/seed-data.sql` and execute.

The script will:
- Insert 6 artifacts with full content
- Create 1 pack
- Link all 6 artifacts to the pack (in logical order)
- Verify insertion counts

### 4. Verify

Run this query to see artifacts:

```sql
SELECT slug, title, price_cents, version FROM artifacts ORDER BY created_at;
```

Should return 6 rows.

Run this to see the pack with items:

```sql
SELECT * FROM public.get_pack_with_previews('complete-agent-system');
```

Should return 6 artifact rows (1 per pack item).

---

## Testing After Seeding

### 1. Test Public API

```bash
curl https://skynetx.io/api/v1/artifacts
```

Should return 6 artifacts with previews (no `content_text`).

### 2. Test CLI

```bash
skynet artifacts
skynet artifact reasoning-chain-prompt
```

### 3. Test Full Content Access

Requires Bearer token + entitlement in `user_unlocks` table.

---

## Cleanup (if needed)

To delete all data and start fresh:

```sql
DELETE FROM pack_items;
DELETE FROM packs;
DELETE FROM artifacts;
DELETE FROM user_unlocks;
```

Then re-run seed script.

---

## Adding More Artifacts

Edit `docs/seed-data.sql`, add more `INSERT` statements following the same format, then re-run.

Template:

```sql
INSERT INTO artifacts (slug, category, title, description, content_text, preview_excerpt, price_cents, version) VALUES
('unique-slug', 'category', 'Title', 'One-liner description',
  'Full content goes here...',
  'Short preview (1-2 sentences)',
  899, '1.0');
```

Commit any changes:

```bash
git add docs/seed-data.sql
git commit -m "Add [artifact name] to seed data"
```
