import Link from "next/link";

const features = [
  {
    title: "Drift Detection",
    text: "Composite drift scoring from memory pressure, token burn rate, and context divergence. Flags OPTIMAL through CRITICAL in real time.",
  },
  {
    title: "Context Pressure",
    text: "Measures memory saturation, context window usage, and token budget depletion to surface actionable compression signals.",
  },
  {
    title: "Verbosity Control",
    text: "Tracks output length drift against baselines and suppresses token inflation before it compounds across agent turns.",
  },
  {
    title: "Session Half-Life",
    text: "Estimates remaining useful session time from decay rates, burn velocity, and error frequency. STABLE, DECAYING, or FRAGILE.",
  },
];

const steps = [
  {
    title: "Get API Key",
    text: "Register your agent and receive a key scoped to your telemetry namespace.",
  },
  {
    title: "Instrument Your Agent",
    text: "POST session metrics to /api/v1/drift, /pressure, /verbosity, or /half-life. Each returns deterministic stability signals.",
  },
  {
    title: "View Dashboard",
    text: "Open the console to see real-time metric tiles, drift radar, and telemetry feed for all instrumented agents.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 dark:from-cyan-400 dark:to-fuchsia-500" />
          <span className="text-sm font-semibold tracking-[0.3em] text-slate-700 dark:text-slate-300">
            SKYNETX
          </span>
        </div>
        <nav className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
          <a href="#features" className="hover:text-slate-900 dark:hover:text-white">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-slate-900 dark:hover:text-white">
            How it works
          </a>
          <Link
            href="/console"
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-slate-900"
          >
            Open Console
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900" />
        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500 dark:text-slate-400">
            Cognitive Telemetry Platform
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            SkynetX &mdash; Cognitive Telemetry for AI Agents
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
            Deterministic stability signals for agents operating under resource
            constraints.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/console"
              className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white dark:bg-white dark:text-slate-900"
            >
              Open Console
            </Link>
            <a
              href="#features"
              className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300"
            >
              Learn More
            </a>
          </div>
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-500">
            Four deterministic APIs. Zero guesswork. Built for agentic systems
            that need reliable telemetry and cost control.
          </p>
        </div>
      </section>

      {/* Feature Cards */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-3xl font-semibold">Core Metrics</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-3 h-8 w-8 rounded-full bg-slate-900 dark:bg-gradient-to-br dark:from-cyan-400 dark:to-fuchsia-500" />
              <h3 className="text-base font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="bg-slate-50 dark:bg-slate-900/50"
      >
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-3xl font-semibold">How it works</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                  Step {index + 1}
                </p>
                <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-16 text-center">
        <h2 className="text-3xl font-semibold">
          Ready to instrument your agents?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm text-slate-600 dark:text-slate-400">
          Open the console to test metric APIs interactively, view telemetry
          feeds, and monitor drift in real time.
        </p>
        <Link
          href="/console"
          className="mt-6 inline-block rounded-full bg-slate-900 px-8 py-3 text-sm font-semibold text-white dark:bg-white dark:text-slate-900"
        >
          Open Console
        </Link>
      </section>

      <footer className="border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 text-xs text-slate-500">
          <span>SkynetX</span>
          <Link href="/console" className="font-semibold text-slate-700 dark:text-slate-300">
            Open Console
          </Link>
        </div>
      </footer>
    </div>
  );
}
