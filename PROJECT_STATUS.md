# Skynet Project Status

**Date**: 2026-02-17  
**Status**: Foundation Complete & Ready for Integration  
**Next Phase**: Supabase + Stripe Integration

---

## Project Structure

```
skynet/
├── app/                          Next.js App Router
│   ├── api/v1/
│   │   ├── artifacts/            GET /v1/artifacts (public list)
│   │   ├── artifacts/[slug]/      GET /v1/artifacts/{slug} (detail)
│   │   └── me/entitlements/       GET /v1/me/entitlements (auth)
│   ├── layout.tsx                Root layout
│   └── page.tsx                  Home (placeholder)
├── cli/                          Terminal CLI (Node.js)
│   ├── src/
│   │   ├── api/                  Skynet API client wrapper
│   │   ├── commands/             CLI command handlers
│   │   ├── auth/                 Token storage
│   │   ├── output/               Formatting utilities
│   │   ├── bin/skynet.ts         Entry point
│   │   └── types.ts              Shared types
│   ├── package.json              CLI dependencies
│   ├── tsconfig.json             TypeScript config
│   └── README.md                 CLI guide
├── lib/
│   ├── entitlements.ts           Centralized ownership logic
│   └── auth.ts                   Supabase auth helpers
├── docs/
│   ├── schema.sql                Supabase SQL (ready to deploy)
│   ├── DEPLOYMENT.md             Step-by-step deployment guide
│   └── CLI_OUTPUTS.md            Example CLI output
├── .env.example                  Environment template
├── package.json                  Web dependencies
├── tsconfig.json                 TypeScript config
├── tailwind.config.ts            Tailwind setup
├── README.md                     Project guide
└── .git/                         Version control

```

---

## What's Built

### ✅ Web API Foundation

**3 Core Endpoints** (Phase 1 complete):

1. **GET /v1/artifacts** — Public preview list
   - Returns: slug, title, category, price, preview_excerpt
   - No content_text exposed
   - No auth required

2. **GET /v1/artifacts/{slug}** — Detail view
   - Returns preview-safe fields (public)
   - If authenticated & entitled: returns full content_text
   - Entitlement checked server-side via RLS

3. **GET /v1/me/entitlements** — User ownership status
   - Auth required (401 if not authenticated)
   - Returns: full_unlock (bool), unlocked_artifacts (UUID[])
   - Source of truth for entitlement checks

### ✅ Entitlements System

**Centralized logic** in `lib/entitlements.ts`:

```typescript
getUserEntitlements(userId, supabase)
  → { hasFullUnlock: bool, unlockedArtifactIds: UUID[] }

userOwnsArtifact(userId, artifactId, supabase)
  → boolean
```

**Rules**:
- Full unlock grants access to ALL artifacts (past + future)
- Individual artifact unlock grants access to that artifact only
- No expiration (permanent, one-time purchase)

### ✅ Supabase Schema

**Ready to deploy** (`docs/schema.sql`):

- Tables: artifacts, packs, pack_items, user_unlocks
- Security Definer functions: get_artifact_previews(), get_pack_with_previews()
- RLS policies: artifacts (locked), user_unlocks (own-only), packs (public)
- No content_text exposed outside authenticated + entitled context

### ✅ Terminal CLI

**Lightweight, system-like interface** (`cli/`):

```
Commands:
  skynet status                    System status + auth state
  skynet artifacts                 List all artifacts
  skynet artifact <slug>           View artifact (preview or full)
    --content                      Show full content if unlocked
  skynet entitlements              Show user unlock status
  skynet auth:login                Authenticate (magic link)
  skynet auth:logout               Clear auth token
```

**Architecture**:
- Node.js + TypeScript
- Commander.js for CLI framework
- Minimal dependencies
- All business logic via API calls
- Token storage in `~/.skynet/auth.json`
- Clean, structured output (no emojis, no decorations)

### ✅ Documentation

- **README.md** — Project overview
- **docs/DEPLOYMENT.md** — GitHub, Supabase, Stripe, Coinbase setup
- **docs/schema.sql** — Supabase schema (ready to apply)
- **docs/CLI_OUTPUTS.md** — Example CLI output
- **cli/README.md** — CLI user guide

---

## Missing (Blockers for Step 2)

### 🔴 Supabase Credentials

**Required to proceed**:
- `NEXT_PUBLIC_SUPABASE_URL` (e.g., https://your-project.supabase.co)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public key)
- `SUPABASE_SERVICE_ROLE_KEY` (server-side key)

**Action**:
1. Create Supabase project (or use existing shared instance)
2. Apply `docs/schema.sql` to database
3. Enable Supabase Auth (email magic link)

### 🔴 Stripe Keys

**Required for checkout** (Phase 3):
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (pk_test_... or pk_live_...)
- `STRIPE_SECRET_KEY` (sk_test_... or sk_live_...)
- `STRIPE_WEBHOOK_SECRET` (whsec_...)

### 🔴 Coinbase Commerce Keys (Optional)

**Required for crypto payments** (Phase 3):
- `COINBASE_COMMERCE_API_KEY`
- `COINBASE_COMMERCE_WEBHOOK_SECRET`

### 🔴 GitHub Repository

**Ready to push**:
- Local repo initialized at `C:\Users\Claud\.openclaw\workspace\skynet`
- Remote: `skynet-registry` (private)

---

## Next Steps (Roadmap)

### Step 2: Supabase Integration & Auth ⏳
**Blockers**: Supabase credentials

**Tasks**:
- [ ] Fill .env.local with Supabase keys
- [ ] Apply schema.sql to database
- [ ] Test /v1/artifacts endpoint
- [ ] Create /auth/callback route (magic link)
- [ ] Build /dashboard (list user unlocks)
- [ ] Test CLI auth flow
- [ ] Test API entitlements

### Step 3: Stripe + Crypto Payments ⏳
**Blockers**: Stripe + Coinbase keys

**Tasks**:
- [ ] Create /api/checkout/session route
- [ ] Create /api/stripe/webhook handler
- [ ] Create /api/crypto/webhook handler (Coinbase)
- [ ] Build checkout UI
- [ ] Test full unlock flow
- [ ] Test individual artifact unlock
- [ ] Test CLI unlock command

### Step 4: Deployment & Polish
**Tasks**:
- [ ] Push to GitHub (skynet-registry)
- [ ] Deploy to Vercel
- [ ] Configure custom domain (skynet.io)
- [ ] Test live endpoints
- [ ] Distribute CLI binary (Windows, macOS, Linux)
- [ ] Create CLI installation guide

---

## Tech Stack Summary

| Layer | Tech | Rationale |
|-------|------|-----------|
| **Web** | Next.js 14 | App Router, serverless API routes, fast |
| **Database** | Supabase (Postgres) | Managed, RLS, Auth built-in |
| **Auth** | Supabase Auth | Magic link, JWT, simple integration |
| **Payment** | Stripe | Industry standard, mature |
| **Crypto** | Coinbase Commerce | Mature, webhook-compatible |
| **CLI** | Node.js + Commander.js | Lightweight, portable, zero bloat |
| **Hosting** | Vercel | Optimized for Next.js, edge functions |
| **Domain** | skynetx.io | Pre-configured |

---

## Git History

Commits so far:
1. "Initial scaffold: API foundation..." — v1 routes + entitlements
2. "Add schema, deployment guide, README" — Documentation + Supabase setup
3. "Add CLI: terminal interface..." — CLI structure + commands
4. "Add CLI documentation and example outputs" — CLI guide + examples

---

## Key Design Decisions

1. **API-centric CLI**: All business logic server-side. CLI is dumb client.
2. **No SDK**: CLI calls public /v1 routes only. No internal APIs.
3. **Stateless entitlements**: Owned artifacts determined at request time, not pre-computed.
4. **Full unlock = permanent**: No expiration, no subscription model.
5. **Minimal CLI**: No colors, no decorations, system-like output.
6. **Credential separation**: Supabase service key never exposed; webhook uses it only.

---

## File Sizes (Approx)

```
app/api/**/*.ts              ~8 KB
lib/*.ts                     ~3 KB
cli/src/**/*.ts              ~12 KB
docs/schema.sql              ~4 KB
.env.example                 ~1 KB
────────────────────────────
Total (code)                 ~30 KB
```

CLI binary (standalone): ~5 MB (Node.js 18 runtime included)

---

## Contact & Handoff

**Repository**: C:\Users\Claud\.openclaw\workspace\skynet  
**Local dev**: npm run dev (port 3001)  
**CLI dev**: cd cli && npm run dev -- status

**Awaiting**: Supabase + Stripe credentials, GitHub repo creation.

Once provided, proceed with Step 2 immediately.
