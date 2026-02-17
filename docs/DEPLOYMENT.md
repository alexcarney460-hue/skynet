# Deployment Guide

## GitHub Setup

### Create New Private Repo

```bash
# 1. Go to GitHub and create new private repo: skynet-registry

# 2. Add remote
git remote add origin https://github.com/YOUR_ORG/skynet-registry.git

# 3. Verify
git remote -v

# 4. Push
git branch -M main
git push -u origin main
```

## Supabase Setup

### 1. Create New Project (or use existing)

- Project URL: `https://your-project.supabase.co`
- Anon Key: `eyJhbGc...` (copy from Settings > API)
- Service Role Key: `eyJhbGc...` (copy from Settings > API)

### 2. Deploy Schema

1. Go to Supabase SQL Editor
2. Create new query
3. Copy + paste contents of `docs/schema.sql`
4. Run

### 3. Enable Auth

1. Settings > Authentication
2. Enable Email provider (magic link)
3. Verify email = off (for testing)

### 4. Fill .env.local

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

## Stripe Setup

### 1. Create Stripe Account

- Go to stripe.com
- Create account for Skynet

### 2. Get API Keys

- Publishable Key: `pk_test_...` or `pk_live_...`
- Secret Key: `sk_test_...` or `sk_live_...`

### 3. Create Webhook Endpoint

- Dashboard > Webhooks > Add endpoint
- URL: `https://skynetx.io/api/stripe/webhook` (after deployment)
- Events: `checkout.session.completed`
- Signing secret: `whsec_...`

### 4. Fill .env.local

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Coinbase Commerce Setup (Crypto)

### 1. Create Account

- Go to commerce.coinbase.com
- Create account

### 2. Get API Key

- Settings > API Keys
- API Key: `your_coinbase_api_key`

### 3. Create Webhook

- Settings > Webhooks
- URL: `https://skynetx.io/api/crypto/webhook`
- Events: `charge:confirmed`
- Signing secret: `your_coinbase_webhook_secret`

### 4. Fill .env.local

```bash
COINBASE_COMMERCE_API_KEY=your_coinbase_api_key
COINBASE_COMMERCE_WEBHOOK_SECRET=your_coinbase_webhook_secret
```

## Vercel Deployment

### 1. Connect GitHub

- Go to vercel.com
- Import project from GitHub (skynet-registry)
- Select branch: `main`

### 2. Configure Environment

- Copy all vars from `.env.local` to Vercel > Settings > Environment
- Add production-specific keys (stripe live keys, etc.)

### 3. Deploy

- Click Deploy
- Domain: `skynet.io` (add custom domain)

### 4. Post-Deployment

- Update Stripe webhook URL: `https://skynetx.io/api/stripe/webhook`
- Update Coinbase webhook URL: `https://skynetx.io/api/crypto/webhook`
- Test endpoints:
  - `https://skynetx.io/api/v1/artifacts`
  - `https://skynetx.io/api/v1/me/entitlements` (should 401 if not auth)

---

**Status**: Ready to deploy. Follow steps in order.
