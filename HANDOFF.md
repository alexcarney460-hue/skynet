# Skynet Handoff Document

**Date**: 2026-02-17  
**Status**: Handed off from Alfred to Alex (Alex Ablaze)  
**Phase**: Step 2 Ready (Supabase Integration)

---

## What You Have

### 1. **Web API** (Complete)

3 core endpoints ready to test:
- `GET /v1/artifacts` — public
- `GET /v1/artifacts/{slug}` — public + auth
- `GET /v1/me/entitlements` — auth required

**Code**: `app/api/v1/`

### 2. **Terminal CLI** (Complete)

Standalone Node.js CLI with commands:
- status, artifacts, artifact, entitlements, auth:login, auth:logout

**Code**: `cli/`  
**Tech**: Commander.js, TypeScript  
**Build**: Single binary (Windows/macOS/Linux)

### 3. **Database Schema** (Ready to Deploy)

Complete Supabase schema with:
- tables: artifacts, packs, pack_items, user_unlocks
- security functions: get_artifact_previews(), get_pack_with_previews()
- RLS policies: artifacts (locked), user_unlocks (own-only), packs (public)

**File**: `docs/schema.sql`

### 4. **Documentation**

- `README.md` — Project overview
- `PROJECT_STATUS.md` — Detailed status + next steps
- `docs/DEPLOYMENT.md` — Setup guide (GitHub, Supabase, Stripe, Coinbase)
- `docs/CLI_OUTPUTS.md` — Example CLI output
- `cli/README.md` — CLI user guide

### 5. **Git Repository**

Local repo at: `C:\Users\Claud\.openclaw\workspace\skynet`

4 commits ready to push to `skynet-registry` (GitHub private).

---

## What You Need to Do (Step 2)

### 1. Create GitHub Repo

```bash
# On GitHub:
1. Create private repo: skynet-registry
2. Copy HTTPS URL

# Then:
cd C:\Users\Claud\.openclaw\workspace\skynet
git remote add origin https://github.com/YOUR_ORG/skynet-registry.git
git branch -M main
git push -u origin main
```

### 2. Create Supabase Project

```bash
# Option A: New project
Visit supabase.com → create new project (free tier OK for now)
- Project URL: https://your-project.supabase.co
- Anon Key: eyJhbGc...
- Service Role Key: eyJhbGc...

# Option B: Shared instance
Use existing Supabase → note the credentials
```

### 3. Deploy Schema

```bash
# 1. Go to Supabase SQL Editor
# 2. Create new query
# 3. Copy + paste contents of docs/schema.sql
# 4. Run
```

### 4. Enable Auth

```bash
# Supabase Dashboard:
1. Settings > Authentication
2. Enable Email provider (magic link)
3. Verify email = off (for testing)
```

### 5. Fill .env.local

```bash
cd C:\Users\Claud\.openclaw\workspace\skynet
cp .env.example .env.local

# Then edit .env.local:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=(leave blank for now)
STRIPE_SECRET_KEY=(leave blank for now)
NEXT_PUBLIC_APP_URL=https://skynetx.io
```

### 6. Test Locally

```bash
# Web API
npm run dev
curl http://localhost:3000/api/v1/artifacts

# CLI
cd cli
npm install
npm run dev -- status
npm run dev -- artifacts
```

---

## Optional (Stripe + Crypto)

When ready for payments:

1. **Stripe**
   - Get `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (pk_test_...)
   - Get `STRIPE_SECRET_KEY` (sk_test_...)
   - Get `STRIPE_WEBHOOK_SECRET` (whsec_...)
   - Fill .env.local

2. **Coinbase Commerce** (if crypto needed)
   - Get `COINBASE_COMMERCE_API_KEY`
   - Get `COINBASE_COMMERCE_WEBHOOK_SECRET`
   - Fill .env.local

Then proceed to Step 3 (checkout routes + webhooks).

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `app/api/v1/artifacts/route.ts` | GET /v1/artifacts |
| `app/api/v1/artifacts/[slug]/route.ts` | GET /v1/artifacts/{slug} |
| `app/api/v1/me/entitlements/route.ts` | GET /v1/me/entitlements |
| `lib/entitlements.ts` | Ownership logic (reusable) |
| `lib/auth.ts` | Supabase helpers |
| `docs/schema.sql` | Database schema |
| `cli/src/api/client.ts` | API wrapper for CLI |
| `cli/src/commands/*.ts` | CLI command handlers |
| `.env.example` | Credential template |

---

## Directory Structure (Quick Reference)

```
skynet/
├── app/api/v1/              API routes
├── cli/                     Terminal interface
├── lib/                     Shared utilities
├── docs/                    Documentation + schema
├── .env.example             Credential template
├── package.json             Web dependencies
├── README.md                Project guide
├── PROJECT_STATUS.md        Detailed status
└── .git/                    Version control (ready to push)
```

---

## Next Steps After Step 2

Once Supabase is connected + auth works:

### Step 3: Payments
- [ ] Implement `/api/checkout/session` (Stripe)
- [ ] Implement `/api/stripe/webhook` (unlock on payment)
- [ ] Implement `/api/crypto/webhook` (Coinbase, if needed)
- [ ] Build checkout UI
- [ ] Test full unlock + individual artifact unlock

### Step 4: Deployment
- [ ] Push to GitHub
- [ ] Deploy to Vercel
- [ ] Configure custom domain (skynet.io)
- [ ] Test live endpoints
- [ ] Distribute CLI binary

---

## Support

**Local Dev Server**: `npm run dev` (port 3001)  
**CLI Dev**: `cd cli && npm run dev -- <command>`  
**Documentation**: See `docs/` and `cli/README.md`  
**Project Status**: See `PROJECT_STATUS.md`

---

## Design Philosophy (Reminders)

1. **API-first**: All business logic server-side. CLI is client.
2. **Minimal**: No premature abstractions. Only what's needed.
3. **Secure**: Supabase service key never exposed. RLS enforced.
4. **Permanent unlocks**: No expiration. One-time payment = forever access.
5. **CLI is system-like**: No colors, no decorations, machine-readable output.

---

## You're Ready

Everything is set up. Just need:
1. GitHub repo URL
2. Supabase credentials
3. Run through Step 2 checklist above

Then you can test `/v1/artifacts` and CLI commands locally.

**Proceed when ready.** 🚀
