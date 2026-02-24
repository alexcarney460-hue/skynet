export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700" />
          <span className="text-sm font-semibold tracking-[0.3em] text-slate-700">
            SKYNETX
          </span>
        </div>
        <nav className="flex items-center gap-6 text-sm text-slate-600">
          <a href="#what-it-does" className="hover:text-slate-900">What it does</a>
          <a href="#why-skynet" className="hover:text-slate-900">Why Skynet</a>
          <a href="#how-it-works" className="hover:text-slate-900">How it works</a>
          <a href="#who-its-for" className="hover:text-slate-900">Who it’s for</a>
          <a
            href="/console"
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Open Console
          </a>
        </nav>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-slate-50" />
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 pb-20 pt-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative z-10 space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
              AI Workflow Infrastructure
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              SkynetX — Orchestrate AI Agents &amp; Swarms
            </h1>
            <p className="text-lg text-slate-600">
              Design multi-step AI workflows and reduce token waste using Skynet’s
              stability and efficiency telemetry.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="/console"
                className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white"
              >
                Open Console
              </a>
              <a
                href="#why-skynet"
                className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700"
              >
                Read Overview
              </a>
            </div>
            <p className="text-xs text-slate-500">
              Built for agentic systems that need reliable orchestration, telemetry, and cost control.
            </p>
          </div>

          <div className="relative z-10">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Workflow Canvas</span>
                <span className="rounded-full bg-slate-100 px-3 py-1">Live Preview</span>
              </div>
              <div className="grid gap-4">
                {['Research', 'Generate', 'Review', 'Compliance', 'Publish'].map((label, index) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700" />
                    <div className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                      {label}
                    </div>
                    {index < 4 && <div className="h-px w-6 bg-slate-300" />}
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-indigo-200 via-blue-200 to-transparent blur-3xl" />
          </div>
        </div>
      </section>

      <section id="what-it-does" className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: 'Workflow Orchestration',
              text: 'Compose n8n-style workflows using AI agents and tools.',
            },
            {
              title: 'Agent Swarms',
              text: 'Run agents in parallel across complex, multi-step tasks.',
            },
            {
              title: 'Token Efficiency',
              text: 'Suppress verbosity drift and reduce token waste.',
            },
            {
              title: 'Stability Telemetry',
              text: 'Monitor context pressure, coherence, and session half-life.',
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 h-8 w-8 rounded-full bg-slate-900" />
              <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="why-skynet" className="bg-slate-50">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">Why Skynet</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-900">
              Built-In Cognitive Stability &amp; Token Control
            </h2>
            <ul className="mt-6 space-y-3 text-sm text-slate-700">
              <li>Detect context pressure before failures emerge.</li>
              <li>Suppress verbosity inflation across agent runs.</li>
              <li>Estimate session half-life and degradation risk.</li>
              <li>Reduce tokens consumed by long-running swarms.</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Token Usage
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm text-slate-500">Baseline</p>
                <div className="mt-2 h-3 w-full rounded-full bg-slate-200">
                  <div className="h-3 w-[78%] rounded-full bg-slate-400" />
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500">Optimized with Skynet</p>
                <div className="mt-2 h-3 w-full rounded-full bg-slate-200">
                  <div className="h-3 w-[46%] rounded-full bg-slate-900" />
                </div>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Example reduction from telemetry-driven stability control.
            </p>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl font-semibold text-slate-900">How it works</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            { title: 'Build Workflows', text: 'Create multi-step pipelines with agents and tools.' },
            { title: 'Launch Runs & Swarms', text: 'Execute workflows in parallel for speed and scale.' },
            { title: 'Observe & Optimize', text: 'Use Skynet metrics to tune stability and token usage.' },
          ].map((step, index) => (
            <div key={step.title} className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Step {index + 1}</p>
              <h3 className="mt-3 text-lg font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="who-its-for" className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-3xl font-semibold text-slate-900">Who it’s for</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              {
                title: 'Developers',
                text: 'Ship reliable agent workflows with telemetry-backed controls.',
              },
              {
                title: 'Growth & Automation Teams',
                text: 'Scale content, outreach, and ops with measurable stability.',
              },
              {
                title: 'AI-Native Startups',
                text: 'Run agent swarms with predictable cost and performance.',
              },
            ].map((persona) => (
              <div key={persona.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h3 className="text-lg font-semibold text-slate-900">{persona.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{persona.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 text-xs text-slate-500">
          <span>SkynetX</span>
          <a href="/console" className="font-semibold text-slate-700">Open Console</a>
        </div>
      </footer>
    </div>
  );
}
