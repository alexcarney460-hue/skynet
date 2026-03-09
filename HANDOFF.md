# SkynetX Handoff — 2026-03-08

## Project
Cognitive telemetry & token-optimization API for AI agents. Next.js 16 + Supabase.

## Supabase
- Project: `tqlrrglvpeejfhmvptuq` (account 3 — alexcarney460)
- Credentials: see `.env.local` (NEVER commit secrets to this file)
- Tables: profiles, api_keys, telemetry_events, plans, rate_limits, payments, session_memory, usage_counts

## Current State — What Works
- **Drift endpoint** (`/api/v1/drift`) — fully working, 8 evaluations recorded
- **Auth system** — signup, login, key regeneration all functional
- **Credit system** — user has 92 credits remaining (100 free - 8 drift evals)
- **Homepage** — full redesign complete with features, pricing, API docs
- **Console** — 5-tab dashboard (Metrics, Compress, Memory, Circuit Breaker, Telemetry)
- **Wallet integration** — RainbowKit + wagmi, 5 EVM chains (ETH, Base, Polygon, Arbitrum, BSC)
- **On-chain tx verification** — validates payments via public RPCs
- **Compression engine** — algorithmic, no LLM cost
- **Session memory** — store/retrieve/clear with 7-day TTL
- **Circuit breaker** — halt/continue decisions (free endpoint)
- **Security audit** — all critical issues fixed (race conditions, CORS, auth)

## Open Bug — Metric Tiles Not Updating
**Symptom:** Pressure, verbosity, and half-life endpoints "did nothing" when evaluated from console. Only drift works. No telemetry events exist for the other 3 metric types.

**Last investigation:**
- All 4 route files exist and export GET/POST correctly
- All share identical code path via `lib/route-factory.ts`
- DB tables all exist with correct schema
- **SkynetX dev server was NOT running** during my final test — ports 3000/3001/3002 are ValueSuppliers/VikingLabs/MotionVentures
- Need to start `npm run dev` from the skynet directory and test all 4 endpoints

**Recent fix applied (untested):**
- `LiveMetricTiles.tsx` — added error logging, visible error banner, `skynetx:evaluation` custom event listener for immediate refresh after evaluation
- `MetricForm.tsx` — dispatches `skynetx:evaluation` event after successful eval
- `telemetry/route.ts` — added detailed error logging

**Next step:** Start the dev server, test `/api/v1/pressure`, `/api/v1/verbosity`, `/api/v1/half-life` directly with curl, check server console for errors.

## Deferred Work
- Solana token creation (after launch)
- WalletConnect project ID (using fallback 'skynetx-dev')
- 4 audit warnings unfixed: W2 input coercion, W6 login service role, W10 delete select, W11 next.config
- 8 audit info items unfixed

## Key Files
- `app/page.tsx` — landing page
- `app/console/page.tsx` — dashboard
- `lib/metrics.ts` — all 4 metric engines
- `lib/route-factory.ts` — DRY route handler (auth + credits + telemetry)
- `lib/usage.ts` — credit deduction with race-condition guard
- `lib/compress.ts` — compression engine
- `lib/verify-tx.ts` — on-chain payment verification
- `lib/chains.ts` — EVM chain + token addresses
- `docs/schema.sql` — DB schema (missing plans/rate_limits table definitions)
- `.env.local` — Supabase credentials

## Receiving Wallet
`0x34278CCD5a1E781E586f9b49D92D3D893860Dd09` (all chains)
