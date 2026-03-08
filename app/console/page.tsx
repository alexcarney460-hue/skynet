import { MetricTile } from '../components/MetricTile';
import { ThreatRadar } from '../components/ThreatRadar';
import { MetricForm } from '../components/MetricForm';
import { TelemetryFeed } from '../components/TelemetryFeed';
import { ApiKeyProvider } from '../components/ApiKeyProvider';
import { ApiKeyBar } from '../components/ApiKeyBar';

const metrics = [
  { label: 'Drift Score', value: '0.32', description: 'Composite drift index', accent: 'from-fuchsia-500/20 via-transparent to-cyan-500/10', delta: { label: 'vs last', value: '+0.04', direction: 'up' as const } },
  { label: 'Pressure', value: 'LOW', description: 'Context pressure level', accent: 'from-emerald-500/20 via-transparent to-cyan-500/10', delta: { label: 'stable', value: '—', direction: 'flat' as const } },
  { label: 'Verbosity', value: 'OPTIMAL', description: 'Output drift suppressor', accent: 'from-blue-500/20 via-transparent to-indigo-500/10' },
  { label: 'Half-Life', value: '47m', description: 'Est. remaining session time', accent: 'from-amber-500/20 via-transparent to-orange-500/10', delta: { label: 'decaying', value: '-3m', direction: 'down' as const } },
];

const threats = [
  { id: 'DV-1', label: 'Memory Saturation', vector: 35, intensity: 0.62, quadrant: 'Q1', status: 'Active', impact: 'Token budget under pressure' },
  { id: 'DV-2', label: 'Context Window Drift', vector: 145, intensity: 0.41, quadrant: 'Q2', status: 'Monitoring', impact: 'Output coherence declining' },
  { id: 'DV-3', label: 'Verbosity Inflation', vector: 230, intensity: 0.28, quadrant: 'Q3', status: 'Contained', impact: 'Minor token waste' },
  { id: 'DV-4', label: 'Session Decay', vector: 310, intensity: 0.55, quadrant: 'Q4', status: 'Active', impact: 'Half-life approaching threshold' },
];

export default function ConsolePage() {
  return (
    <ApiKeyProvider>
      <div className="relative min-h-screen overflow-hidden bg-[#030011] text-slate-100">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,0,153,0.3),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(0,214,255,0.35),transparent_45%),linear-gradient(120deg,rgba(7,4,54,0.9),rgba(1,1,20,0.95))]" />
        <div className="pointer-events-none absolute inset-0 opacity-40 mix-blend-screen">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:64px_64px]" />
        </div>

        <main className="relative z-10 mx-auto flex max-w-[1400px] flex-col gap-6 px-6 py-10 lg:px-10">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-cyan-200/80">SkynetX Console</p>
              <h1 className="text-2xl font-semibold text-white">Cognitive Telemetry Dashboard</h1>
            </div>
            <a
              href="/"
              className="text-xs text-slate-500 hover:text-white transition"
            >
              Home
            </a>
          </header>

          <ApiKeyBar />

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <MetricTile key={metric.label} {...metric} />
            ))}
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <ThreatRadar threats={threats} />
            <MetricForm />
          </section>

          <TelemetryFeed />
        </main>
      </div>
    </ApiKeyProvider>
  );
}
