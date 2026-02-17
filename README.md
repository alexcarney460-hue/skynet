# SKYNET — Registry of Performance-Optimized Agent Systems

## Project Identity

Skynet is a **capability infrastructure layer**, not a simple data API.

- **Monetization**: Artifact-centric (individual $8.99 | full registry $29.99)
- **Tech**: Next.js 14 (App Router) + Supabase + Stripe + Crypto payments
- **Domain**: skynet.io
- **Design Philosophy**: Minimal, dark, technical, zero marketing fluff

---

## Architecture

### Interfaces

**Web API (Next.js Routes)**
- RESTful `/v1` endpoints
- Public + authenticated access
- Server-side entitlements enforcement

**Terminal CLI (`cli/`)**
- Standalone Node.js application
- Lightweight (~5MB bundled)
- System-style output (no decorations)
- All business logic via API calls

### Core Endpoints

```
GET  /v1/artifacts                      Public: list previews
GET  /v1/artifacts/{slug}               Public preview | Auth full
GET  /v1/me/entitlements                Auth required: ownership status
```

### Entitlements Logic

User owns artifact IF:
- `full_unlock = true` (registry unlock), OR
- `artifact_id` unlocked (individual artifact)

Centralized in `lib/entitlements.ts`.

### CLI Commands

```
skynet status              System status
skynet artifacts           List artifacts
skynet artifact <slug>     View artifact
skynet entitlements        Show unlocks
skynet auth:login          Magic link auth
```

See `cli/README.md` for full command reference.

---

## Setup

### 1. Environment

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=<your-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<stripe-pk>
STRIPE_SECRET_KEY=<stripe-sk>
STRIPE_WEBHOOK_SECRET=<stripe-webhook>
COINBASE_COMMERCE_API_KEY=<coinbase-api>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Supabase Schema

Apply SQL in `docs/schema.sql` to Supabase:

```bash
# Tables: artifacts, packs, pack_items, user_unlocks
# Functions: get_artifact_previews(), get_pack_with_previews()
# RLS: artifacts locked, user_unlocks own-only, packs public
```

### 3. Dev Server

```bash
npm install
npm run dev
# http://localhost:3000/api/v1/artifacts
```

---

## Architecture Notes

### No Premature Abstractions

- API is minimal (3 endpoints only)
- No SDK generation
- No microservices
- Extensible for future without refactor

### Future Phases

- **Phase 2**: Auth (magic link) + Dashboard
- **Phase 3**: Stripe checkout + Crypto payments
- **Phase 4**: Usage tracking + Rate limiting (non-breaking)

---

## GitHub & Deployment

```bash
# GitHub: skynet-registry (private)
# Vercel: connected to master branch
# Env vars: auto-synced from .env.local
```

---

## Next Steps

1. ✅ API foundation (v1 routes + entitlements)
2. ⏳ Supabase schema + credentials
3. ⏳ Auth flow (magic link)
4. ⏳ Dashboard (user unlocks)
5. ⏳ Stripe + Crypto payments
6. ⏳ Webhook handlers

---

**Status**: Step 1 complete. Awaiting Supabase credentials + Stripe keys.
