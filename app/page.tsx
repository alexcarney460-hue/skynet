import Link from "next/link";

const metricCards = [
  {
    title: "Drift Detection",
    desc: "Composite scoring from memory pressure, token burn rate, and context divergence. Know when your agent is going off-rails before it wastes tokens.",
    endpoint: "POST /api/v1/drift",
    accent: "from-rose-500 to-orange-500",
    glow: "rgba(255,80,120,0.4)",
    status: "OPTIMAL",
    statusColor: "text-emerald-400",
  },
  {
    title: "Context Pressure",
    desc: "Memory saturation and token budget depletion signals. Get warned before your context window overflows and responses degrade.",
    endpoint: "POST /api/v1/pressure",
    accent: "from-cyan-400 to-blue-500",
    glow: "rgba(0,214,255,0.4)",
    status: "LOW",
    statusColor: "text-cyan-400",
  },
  {
    title: "Verbosity Control",
    desc: "Tracks output length drift against your baselines. Catches token inflation before it eats your budget — agents get wordier over time.",
    endpoint: "POST /api/v1/verbosity",
    accent: "from-violet-500 to-fuchsia-500",
    glow: "rgba(168,85,247,0.4)",
    status: "OPTIMAL",
    statusColor: "text-emerald-400",
  },
  {
    title: "Session Half-Life",
    desc: "Estimates remaining useful session time from decay rates, burn velocity, and error frequency. Know when to checkpoint or restart.",
    endpoint: "POST /api/v1/half-life",
    accent: "from-amber-400 to-red-500",
    glow: "rgba(251,191,36,0.4)",
    status: "STABLE",
    statusColor: "text-amber-400",
  },
];

const tokenSavingFeatures = [
  {
    title: "Context Compression",
    desc: "Send your conversation history, get back a compressed version with filler phrases stripped, duplicates removed, and early messages condensed. Typically saves 30-50% of tokens.",
    endpoint: "POST /api/v1/compress",
    cost: "1 credit",
    icon: "compress",
  },
  {
    title: "Smart Truncation",
    desc: "Importance-scored message pruning. Keeps system prompts, code blocks, decisions, and recent messages — drops the fluff. Set a target token count and get exactly what fits.",
    endpoint: "POST /api/v1/compress?mode=truncate",
    cost: "1 credit",
    icon: "truncate",
  },
  {
    title: "Session Memory",
    desc: "Store agent state between calls instead of re-prompting with full context every time. Dump state after each turn, retrieve on the next. 7-day TTL, 500KB per session.",
    endpoint: "POST /api/v1/memory/store",
    cost: "1 credit",
    icon: "memory",
  },
  {
    title: "Circuit Breaker",
    desc: "Feed your live metrics in, get a halt/continue decision out. Prevents runaway agent loops that burn hundreds of API calls. Configurable thresholds per metric.",
    endpoint: "POST /api/v1/circuit-breaker",
    cost: "Free",
    icon: "breaker",
  },
];

const driftSnippet = `// Check if your agent is drifting
const res = await fetch("https://skynetx.io/api/v1/drift", {
  method: "POST",
  headers: {
    "Authorization": "Bearer sk_live_your_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    memoryUsedPercent: 72,
    tokenBurnRate: 45,
    contextDriftPercent: 31,
    sessionAgeMinutes: 48
  })
});`;

const driftResponse = `{
  "score": 0.581,
  "status": "AT_RISK",
  "recommendations": [
    "High drift detected; monitor closely",
    "Consider reducing output verbosity"
  ],
  "_credits": 942
}`;

const compressSnippet = `// Compress your agent's context to save tokens
const res = await fetch("https://skynetx.io/api/v1/compress", {
  method: "POST",
  headers: {
    "Authorization": "Bearer sk_live_your_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    messages: conversationHistory,
    mode: "compress"  // or "truncate"
  })
});`;

const compressResponse = `{
  "original_tokens": 12840,
  "compressed_tokens": 5720,
  "savings_percent": 55.5,
  "compressed": [ /* your lean context */ ],
  "_note": "Saved ~7120 tokens (55.5%)"
}`;

const memorySnippet = `// Save agent state between calls
await fetch("https://skynetx.io/api/v1/memory/store", {
  method: "POST",
  headers: { "Authorization": "Bearer sk_live_your_key" },
  body: JSON.stringify({
    agent_id: "research-bot",
    session_id: "task-442",
    data: { findings: [...], next_steps: [...] }
  })
});

// Next call: retrieve instead of re-prompting
const memory = await fetch(
  "https://skynetx.io/api/v1/memory/retrieve?agent_id=research-bot&session_id=task-442",
  { headers: { "Authorization": "Bearer sk_live_your_key" } }
);`;

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#030011] text-slate-100 overflow-hidden">
      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,40,200,0.25),transparent),radial-gradient(ellipse_60%_40%_at_80%_60%,rgba(0,214,255,0.12),transparent)]" />
      <div className="pointer-events-none fixed inset-0 opacity-30 mix-blend-screen">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:80px_80px]" />
      </div>

      {/* Nav */}
      <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 blur-sm opacity-60" />
            <div className="relative h-full w-full rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500" />
          </div>
          <span className="text-sm font-bold tracking-[0.35em] text-white">SKYNETX</span>
        </div>
        <nav className="flex items-center gap-6">
          <a href="#problem" className="hidden sm:inline text-sm text-slate-400 transition hover:text-white">Why</a>
          <a href="#metrics" className="hidden sm:inline text-sm text-slate-400 transition hover:text-white">Metrics</a>
          <a href="#save-tokens" className="hidden sm:inline text-sm text-slate-400 transition hover:text-white">Save Tokens</a>
          <a href="#pricing" className="hidden sm:inline text-sm text-slate-400 transition hover:text-white">Pricing</a>
          <a href="#api" className="hidden sm:inline text-sm text-slate-400 transition hover:text-white">API</a>
          <Link href="/console" className="rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-5 py-2 text-sm font-semibold text-white transition hover:shadow-[0_0_25px_rgba(0,214,255,0.4)]">
            Open Console
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-20 text-center">
        <div className="inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.5em] text-cyan-300/80 backdrop-blur-sm">
          Cognitive Telemetry + Token Optimization
        </div>

        <h1 className="mx-auto mt-8 max-w-5xl text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
          <span className="bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-transparent">
            Stop your AI agents from
          </span>
          <br />
          <span className="bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-amber-300 bg-clip-text text-transparent">
            burning money
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 leading-relaxed">
          SkynetX gives your autonomous agents stability signals, context compression,
          session memory, and circuit breakers — so they use fewer tokens, make fewer
          mistakes, and know when to stop.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/console" className="group relative rounded-full px-8 py-3.5 text-sm font-semibold text-white transition">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 opacity-0 blur-lg transition group-hover:opacity-60" />
            <span className="relative">Start Free — 100 Credits</span>
          </Link>
          <a href="#api" className="rounded-full border border-white/15 bg-white/5 px-8 py-3.5 text-sm font-semibold text-slate-300 backdrop-blur-sm transition hover:border-white/30 hover:text-white">
            View API Docs
          </a>
        </div>

        {/* Stats bar */}
        <div className="mx-auto mt-16 flex max-w-2xl flex-wrap items-center justify-center gap-8 rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">All systems online</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <span className="text-xs text-slate-500">9 API endpoints</span>
          <div className="h-4 w-px bg-white/10" />
          <span className="text-xs text-slate-500">6 chains supported</span>
          <div className="h-4 w-px bg-white/10" />
          <span className="text-xs text-slate-500">&lt;50ms p95</span>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-10 sm:p-16">
          <p className="text-xs font-semibold uppercase tracking-[0.5em] text-rose-400/70">The Problem</p>
          <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
            AI agents waste 30-60% of their token budget
          </h2>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            <div>
              <p className="text-4xl font-black text-rose-400/80">$$$</p>
              <h3 className="mt-3 text-lg font-semibold text-white">Context bloat</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Agents carry full conversation history on every call. 80% of those tokens are filler, duplicates, or irrelevant context from 20 turns ago.
              </p>
            </div>
            <div>
              <p className="text-4xl font-black text-amber-400/80">???</p>
              <h3 className="mt-3 text-lg font-semibold text-white">No self-awareness</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Agents don&apos;t know when they&apos;re drifting off-task, getting more verbose, or running low on budget. They just keep going until they hit a wall.
              </p>
            </div>
            <div>
              <p className="text-4xl font-black text-fuchsia-400/80">∞</p>
              <h3 className="mt-3 text-lg font-semibold text-white">Runaway loops</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Without circuit breakers, a confused agent can burn hundreds of API calls retrying the same failed approach. There&apos;s no kill switch.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Metric Cards */}
      <section id="metrics" className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.5em] text-fuchsia-300/70">Diagnostics</p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Four stability signals for your agents</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-slate-400">
            Each endpoint takes your agent&apos;s current state and returns a deterministic assessment with actionable recommendations. 1 credit per call.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {metricCards.map((f) => (
            <div
              key={f.title}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl transition hover:border-white/20"
              style={{ boxShadow: `0 0 40px ${f.glow.replace("0.4", "0.08")}` }}
            >
              <div
                className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full opacity-20 blur-3xl transition group-hover:opacity-40"
                style={{ background: `radial-gradient(circle, ${f.glow}, transparent)` }}
              />
              <div className="relative">
                <div className={`mb-4 inline-block rounded-lg bg-gradient-to-r ${f.accent} p-0.5`}>
                  <div className="rounded-[5px] bg-[#0a0020] px-3 py-1">
                    <span className={`text-[0.6rem] font-bold uppercase tracking-[0.4em] ${f.statusColor}`}>{f.status}</span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.desc}</p>
                <code className="mt-4 block text-[0.65rem] text-slate-500 font-mono">{f.endpoint}</code>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Token-Saving Features */}
      <section id="save-tokens" className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.5em] text-cyan-300/70">Token Optimization</p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Save 30-60% on LLM costs</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-slate-400">
            These aren&apos;t just signals — they&apos;re tools your agents can use to actively reduce token consumption, avoid wasted calls, and persist state cheaply.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {tokenSavingFeatures.map((f) => (
            <div key={f.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl transition hover:border-white/20">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white">{f.title}</h3>
                  <code className="mt-1 block text-[0.65rem] text-slate-500 font-mono">{f.endpoint}</code>
                </div>
                <span className={`rounded-full px-3 py-1 text-[0.65rem] font-semibold ${
                  f.cost === 'Free' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-cyan-500/20 text-cyan-300'
                }`}>
                  {f.cost}
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Value proposition callout */}
        <div className="mt-10 rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-8 text-center">
          <p className="text-sm text-cyan-200">
            <span className="font-bold">The math:</span> A compression call costs you 1 credit ($0.001-0.005).
            It saves ~5,000 tokens per call. At GPT-4 pricing, that&apos;s <span className="font-bold text-white">$0.15 saved per credit spent</span>.
            That&apos;s a <span className="font-bold text-emerald-300">30-150x ROI</span> on every compression call.
          </p>
        </div>
      </section>

      {/* API Preview — Drift */}
      <section id="api" className="relative z-10 mx-auto max-w-7xl px-6 pb-16">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.5em] text-fuchsia-300/70">API</p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Simple REST APIs. Instant integration.</h2>
        </div>

        {/* Drift example */}
        <div className="mt-12 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
          <div className="border-b border-white/10 px-8 py-3">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Drift Detection</span>
          </div>
          <div className="grid lg:grid-cols-2">
            <div className="border-b border-white/10 p-8 lg:border-b-0 lg:border-r">
              <div className="mb-3 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                <span className="ml-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Request</span>
              </div>
              <pre className="overflow-x-auto text-[0.75rem] leading-relaxed">
                <code className="text-cyan-300/90">{driftSnippet}</code>
              </pre>
            </div>
            <div className="p-8">
              <div className="mb-3 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Response &middot; 200</span>
              </div>
              <pre className="overflow-x-auto text-[0.75rem] leading-relaxed">
                <code className="text-fuchsia-300/80">{driftResponse}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* API Preview — Compression */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-16">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
          <div className="border-b border-white/10 px-8 py-3">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Context Compression</span>
          </div>
          <div className="grid lg:grid-cols-2">
            <div className="border-b border-white/10 p-8 lg:border-b-0 lg:border-r">
              <div className="mb-3 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                <span className="ml-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Request</span>
              </div>
              <pre className="overflow-x-auto text-[0.75rem] leading-relaxed">
                <code className="text-cyan-300/90">{compressSnippet}</code>
              </pre>
            </div>
            <div className="p-8">
              <div className="mb-3 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Response &middot; 200</span>
              </div>
              <pre className="overflow-x-auto text-[0.75rem] leading-relaxed">
                <code className="text-fuchsia-300/80">{compressResponse}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* API Preview — Session Memory */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
          <div className="border-b border-white/10 px-8 py-3">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Session Memory</span>
          </div>
          <div className="p-8">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-rose-500/80" />
              <div className="h-3 w-3 rounded-full bg-amber-500/80" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
              <span className="ml-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Store &amp; Retrieve</span>
            </div>
            <pre className="overflow-x-auto text-[0.75rem] leading-relaxed">
              <code className="text-cyan-300/90">{memorySnippet}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.5em] text-cyan-300/70">Getting Started</p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Live in 5 minutes</h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-4">
          {[
            {
              step: "01",
              title: "Sign up",
              desc: "Create an account and get your API key instantly. 100 free credits included — no card required.",
            },
            {
              step: "02",
              title: "Instrument",
              desc: "Add a few API calls to your agent loop. Check drift, compress context, store memory — whatever you need.",
            },
            {
              step: "03",
              title: "Monitor",
              desc: "Open the console to see live metrics, telemetry feeds, and drift radar across all your agents.",
            },
            {
              step: "04",
              title: "Scale",
              desc: "Buy credit packs with a credit card or USDC/USDT from your wallet. Stripe, MetaMask, Phantom, or WalletConnect — pick a pack, one click.",
            },
          ].map((s) => (
            <div key={s.step} className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
              <span className="text-5xl font-black text-white/[0.04]">{s.step}</span>
              <h3 className="mt-2 text-lg font-semibold text-white">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.5em] text-amber-300/70">Pricing</p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Prepaid credits. No subscriptions.</h2>
          <p className="mx-auto mt-4 max-w-lg text-sm text-slate-400">
            Buy what you need, use it when you want. 1 API call = 1 credit. Pay with Visa/Mastercard or USDC/USDT on Ethereum, Base, Polygon, Arbitrum, BNB Chain, or Solana.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {[
            { name: "Starter", credits: "1,000", price: 5, per1k: "5.00", rate: "30/min", popular: false },
            { name: "Pro", credits: "10,000", price: 29, per1k: "2.90", rate: "100/min", popular: true },
            { name: "Scale", credits: "100,000", price: 99, per1k: "0.99", rate: "500/min", popular: false },
          ].map((p) => (
            <div key={p.name} className={`relative rounded-2xl border p-8 ${
              p.popular ? 'border-cyan-400/40 bg-cyan-500/5' : 'border-white/10 bg-white/[0.03]'
            }`}>
              {p.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-4 py-1 text-[0.6rem] font-bold uppercase tracking-[0.3em] text-white">
                  Most Popular
                </span>
              )}
              <p className="text-lg font-bold text-white">{p.name}</p>
              <div className="mt-4 flex items-end gap-1">
                <span className="text-4xl font-bold text-white">${p.price}</span>
              </div>
              <p className="mt-2 text-sm text-slate-400">{p.credits} credits</p>
              <div className="my-6 h-px bg-white/10" />
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">&#10003;</span> ${p.per1k} per 1,000 calls
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">&#10003;</span> {p.rate} rate limit
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">&#10003;</span> All 9 endpoints
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">&#10003;</span> Circuit breaker (free)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">&#10003;</span> Pay with card or crypto
                </li>
              </ul>
              <Link href="/console/billing" className={`mt-6 block w-full rounded-full py-3 text-center text-sm font-semibold transition ${
                p.popular
                  ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white hover:shadow-[0_0_20px_rgba(0,214,255,0.3)]'
                  : 'border border-white/15 bg-white/5 text-slate-300 hover:border-white/30 hover:text-white'
              }`}>
                Buy {p.name}
              </Link>
            </div>
          ))}
        </div>

        {/* Free tier note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            Every account starts with <span className="text-white font-semibold">100 free credits</span> — no payment required.
          </p>
        </div>
      </section>

      {/* Full API Reference */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.5em] text-slate-500">Reference</p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">All Endpoints</h2>
        </div>

        <div className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[0.65rem] uppercase tracking-[0.3em] text-slate-500">
                <th className="px-6 py-4">Endpoint</th>
                <th className="px-6 py-4">Purpose</th>
                <th className="px-6 py-4 text-right">Cost</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {[
                { ep: "POST /api/v1/drift", purpose: "Drift detection scoring", cost: "1" },
                { ep: "POST /api/v1/pressure", purpose: "Context pressure analysis", cost: "1" },
                { ep: "POST /api/v1/verbosity", purpose: "Output verbosity tracking", cost: "1" },
                { ep: "POST /api/v1/half-life", purpose: "Session lifetime estimation", cost: "1" },
                { ep: "POST /api/v1/compress", purpose: "Context compression / truncation", cost: "1" },
                { ep: "POST /api/v1/memory/store", purpose: "Save agent session state", cost: "1" },
                { ep: "GET /api/v1/memory/retrieve", purpose: "Retrieve saved state", cost: "1" },
                { ep: "DELETE /api/v1/memory/clear", purpose: "Clear session memory", cost: "0" },
                { ep: "POST /api/v1/circuit-breaker", purpose: "Halt/continue decision", cost: "0" },
              ].map((r) => (
                <tr key={r.ep} className="border-b border-white/5">
                  <td className="px-6 py-3 font-mono text-xs text-cyan-300/80">{r.ep}</td>
                  <td className="px-6 py-3 text-slate-400">{r.purpose}</td>
                  <td className="px-6 py-3 text-right">
                    <span className={`rounded-full px-2 py-0.5 text-[0.6rem] font-semibold ${
                      r.cost === "0" ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-slate-300'
                    }`}>
                      {r.cost === "0" ? "Free" : `${r.cost} credit`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24 text-center">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] px-8 py-16 backdrop-blur-xl">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Your agents are wasting tokens right now.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-slate-400">
            Start with 100 free credits. Add drift detection and context compression to your agent loop in under 5 minutes. See the savings immediately.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/console" className="group relative inline-block rounded-full px-10 py-4 text-sm font-semibold text-white">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 opacity-0 blur-xl transition group-hover:opacity-50" />
              <span className="relative">Get Started Free</span>
            </Link>
            <Link href="/console/billing" className="rounded-full border border-white/15 bg-white/5 px-10 py-4 text-sm font-semibold text-slate-300 transition hover:border-white/30 hover:text-white">
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-8">
          <span className="text-xs font-semibold tracking-[0.3em] text-slate-500">SKYNETX</span>
          <div className="flex items-center gap-6 text-xs text-slate-500">
            <Link href="/console" className="transition hover:text-white">Console</Link>
            <Link href="/console/billing" className="transition hover:text-white">Billing</Link>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
