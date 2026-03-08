# SkynetX Rebuild Handoff

## What Was Done
1. All dead code deleted: cli/, python-sdk/, logs/, scripts/, junk/, control-store, entitlements, telemetry (both), dashboard-data, auth, artifacts API, control API, ControlPanel/GlobalMap/TopCommandBar components
2. Created `lib/metrics.ts` — all 4 calculation engines (drift, pressure, verbosity, half-life)
3. Created `lib/supabase.ts` — Supabase service client factory
4. Created `lib/api-auth.ts` — API key authentication middleware
5. Created `lib/route-factory.ts` — DRY route builder for metric endpoints
6. Landing page `app/page.tsx` was rewritten by frontend agent (check if it saved)

## What Still Needs To Be Done

### API Routes (rewrite using route-factory)
Each should be ~25 lines using `createMetricRoute()`:
- `app/api/v1/drift/route.ts`
- `app/api/v1/pressure/route.ts`
- `app/api/v1/verbosity/route.ts`
- `app/api/v1/half-life/route.ts`

### Health Route
- Simplify `app/api/health/route.ts` to just return `{ status: 'ok', timestamp }`

### Telemetry Feed Endpoint
- Create `app/api/telemetry/route.ts` — authenticated, queries telemetry_events for user

### Frontend Components
- Create `app/components/MetricForm.tsx` — client component, tabs for each metric, calls API
- Create `app/components/TelemetryFeed.tsx` — client component, fetches /api/telemetry, table view

### Console Page
- Rewrite `app/console/page.tsx` — remove dead component imports, add MetricForm + TelemetryFeed, keep MetricTile + ThreatRadar

### Layout
- Update `app/layout.tsx` metadata title/description

### CORS Middleware
- Rewrite `app/api/middleware.ts` — add CORS headers, handle OPTIONS preflight

### Supabase Schema
- Run new schema against Supabase (profiles, api_keys, telemetry_events tables with RLS)
- Schema SQL is in the plan agent output, needs to be created as `docs/schema.sql`

### Package.json
- Remove `stripe` dependency

### Config
- Update `tsconfig.json` — remove cli from exclude
- Create `.env.example` with just Supabase vars

## Key Files Reference
- Project: `C:/Users/Claud/.openclaw/workspace/skynet/`
- New libs: `lib/metrics.ts`, `lib/supabase.ts`, `lib/api-auth.ts`, `lib/route-factory.ts`
- Kept: `lib/env.ts`, `app/components/MetricTile.tsx`, `app/components/ThreatRadar.tsx`
- Supabase instance: `tqlrrglvpeejfhmvptuq.supabase.co`

## Telegram Polling
- Cron job ID `6542674d` polls every minute for Telegram messages
- Last handled update_id: 272601205
- Bot: @ClawdCarneybot, chat_id: 6315250293
- Figma token saved to `C:\Users\Claud\Desktop\keys\figma-token.txt`

## Permissions
- `allowedTools: ["*"]` in settings.json
- All hooks removed from settings.json
- User wants ZERO permission prompts — just do everything

## Queued Tasks
- High authority backlinks for: Viking Labs, Blue Label Wholesale, Value Suppliers, Fresno Pool Care
