import Link from "next/link";

const features = [
  {
    title: "Drift Detection",
    desc: "Composite drift scoring from memory pressure, token burn, and context divergence.",
    endpoint: "/api/v1/drift",
    accent: "from-rose-500 to-orange-500",
    glow: "rgba(255,80,120,0.4)",
    status: "OPTIMAL",
    statusColor: "text-emerald-400",
  },
  {
    title: "Context Pressure",
    desc: "Memory saturation, context window usage, and token budget depletion signals.",
    endpoint: "/api/v1/pressure",
    accent: "from-cyan-400 to-blue-500",
    glow: "rgba(0,214,255,0.4)",
    status: "LOW",
    statusColor: "text-cyan-400",
  },
  {
    title: "Verbosity Control",
    desc: "Output length drift tracking against baselines. Suppresses token inflation.",
    endpoint: "/api/v1/verbosity",
    accent: "from-violet-500 to-fuchsia-500",
    glow: "rgba(168,85,247,0.4)",
    status: "OPTIMAL",
    statusColor: "text-emerald-400",
  },
  {
    title: "Session Half-Life",
    desc: "Remaining session time from decay rates, burn velocity, and error frequency.",
    endpoint: "/api/v1/half-life",
    accent: "from-amber-400 to-red-500",
    glow: "rgba(251,191,36,0.4)",
    status: "STABLE",
    statusColor: "text-amber-400",
  },
];

const codeSnippet = `curl -X POST https://skynetx.vercel.app/api/v1/drift \\
  -H "Authorization: Bearer sk_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "memoryUsedPercent": 72,
    "tokenBurnRate": 45,
    "contextDriftPercent": 31,
    "sessionAgeMinutes": 48
  }'`;

const responseSnippet = `{
  "timestamp": "2026-03-07T18:42:01.337Z",
  "score": 0.581,
  "status": "AT_RISK",
  "recommendations": [
    "High drift detected; monitor closely",
    "Consider reducing output verbosity"
  ]
}`;

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
          <span className="text-sm font-bold tracking-[0.35em] text-white">
            SKYNETX
          </span>
        </div>
        <nav className="flex items-center gap-6">
          <a href="#metrics" className="text-sm text-slate-400 transition hover:text-white">
            Metrics
          </a>
          <a href="#api" className="text-sm text-slate-400 transition hover:text-white">
            API
          </a>
          <Link
            href="/console"
            className="rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-5 py-2 text-sm font-semibold text-white transition hover:shadow-[0_0_25px_rgba(0,214,255,0.4)]"
          >
            Open Console
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-20 text-center">
        <div className="inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.5em] text-cyan-300/80 backdrop-blur-sm">
          Cognitive Telemetry Platform
        </div>

        <h1 className="mx-auto mt-8 max-w-4xl text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
          <span className="bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-transparent">
            Stability signals for
          </span>
          <br />
          <span className="bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-amber-300 bg-clip-text text-transparent">
            autonomous agents
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 leading-relaxed">
          Four deterministic APIs that tell your agents when they&apos;re drifting,
          burning tokens, or running out of session runway. No guesswork.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/console"
            className="group relative rounded-full px-8 py-3.5 text-sm font-semibold text-white transition"
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 opacity-0 blur-lg transition group-hover:opacity-60" />
            <span className="relative">Open Console</span>
          </Link>
          <a
            href="#api"
            className="rounded-full border border-white/15 bg-white/5 px-8 py-3.5 text-sm font-semibold text-slate-300 backdrop-blur-sm transition hover:border-white/30 hover:text-white"
          >
            View API
          </a>
        </div>

        {/* Live status bar */}
        <div className="mx-auto mt-16 flex max-w-xl items-center justify-center gap-8 rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              All systems online
            </span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <span className="text-xs text-slate-500">4 endpoints</span>
          <div className="h-4 w-px bg-white/10" />
          <span className="text-xs text-slate-500">&lt;50ms p95</span>
        </div>
      </section>

      {/* Metric Cards */}
      <section id="metrics" className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.5em] text-fuchsia-300/70">
            Core Metrics
          </p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            Four layers of cognitive telemetry
          </h2>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
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
                    <span className={`text-[0.6rem] font-bold uppercase tracking-[0.4em] ${f.statusColor}`}>
                      {f.status}
                    </span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {f.desc}
                </p>
                <code className="mt-4 block text-[0.65rem] text-slate-500 font-mono">
                  {f.endpoint}
                </code>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* API Preview */}
      <section id="api" className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
          <div className="grid lg:grid-cols-2">
            {/* Request */}
            <div className="border-b border-white/10 p-8 lg:border-b-0 lg:border-r">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                <span className="ml-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Request
                </span>
              </div>
              <pre className="overflow-x-auto text-[0.8rem] leading-relaxed">
                <code className="text-cyan-300/90">{codeSnippet}</code>
              </pre>
            </div>
            {/* Response */}
            <div className="p-8">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Response &middot; 200
                </span>
              </div>
              <pre className="overflow-x-auto text-[0.8rem] leading-relaxed">
                <code className="text-fuchsia-300/80">{responseSnippet}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.5em] text-cyan-300/70">
            Integration
          </p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            Three steps to cognitive telemetry
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "Get an API key",
              desc: "Register and receive a key scoped to your telemetry namespace. Keys are hashed and stored — never logged in plaintext.",
            },
            {
              step: "02",
              title: "Instrument your agent",
              desc: "POST session metrics to any of the four endpoints. Each returns deterministic stability signals your agent can act on.",
            },
            {
              step: "03",
              title: "Monitor in real time",
              desc: "Open the console to see metric tiles, drift radar, and a live telemetry feed across all instrumented agents.",
            },
          ].map((s) => (
            <div
              key={s.step}
              className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl"
            >
              <span className="text-5xl font-black text-white/[0.04]">{s.step}</span>
              <h3 className="mt-2 text-lg font-semibold text-white">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24 text-center">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] px-8 py-16 backdrop-blur-xl">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to instrument your agents?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-slate-400">
            Open the console to test metric APIs interactively, view telemetry
            feeds, and monitor drift in real time.
          </p>
          <Link
            href="/console"
            className="group relative mt-8 inline-block rounded-full px-10 py-4 text-sm font-semibold text-white"
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 opacity-0 blur-xl transition group-hover:opacity-50" />
            <span className="relative">Open Console</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-8">
          <span className="text-xs font-semibold tracking-[0.3em] text-slate-500">
            SKYNETX
          </span>
          <div className="flex items-center gap-6 text-xs text-slate-500">
            <Link href="/console" className="transition hover:text-white">
              Console
            </Link>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
