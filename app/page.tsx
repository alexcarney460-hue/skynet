import { GlobalMap } from './components/GlobalMap';
import { MetricTile } from './components/MetricTile';
import { ThreatRadar } from './components/ThreatRadar';
import { TopCommandBar } from './components/TopCommandBar';
import { ControlPanel } from './components/ControlPanel';
import { getDashboardData } from '@/lib/dashboard-data';
import { readControlState } from '@/lib/control-store';

export default async function Home() {
  const [data, controlState] = await Promise.all([
    getDashboardData(),
    readControlState(),
  ]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030011] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,0,153,0.3),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(0,214,255,0.35),transparent_45%),linear-gradient(120deg,rgba(7,4,54,0.9),rgba(1,1,20,0.95))]" />
      <div className="pointer-events-none absolute inset-0 opacity-40 mix-blend-screen">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <main className="relative z-10 mx-auto flex max-w-[1400px] flex-col gap-8 px-6 py-10 lg:px-10">
        <TopCommandBar
          missionTitle={data.mission.title}
          missionSubtitle={data.mission.subtitle}
          missionTime={data.mission.time}
          missionDate={data.mission.date}
          operatorsOnline={data.mission.operatorsOnline}
          signalStrength={data.mission.signalStrength}
          commandQueue={data.commandQueue}
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {data.metrics.map((metric) => (
            <MetricTile key={metric.label} {...metric} />
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <ThreatRadar threats={data.threats} />
          </div>
          <div className="lg:col-span-2">
            <GlobalMap nodes={data.nodes} />
          </div>
        </section>

        <ControlPanel initialState={controlState} />

        <section className="mb-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300/90">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
            Live Telemetry Snapshot
          </p>
          <p className="mt-2 text-base text-white">
            Dashboard data is now sourced directly from Skynet APIs and Supabase
            records. This snapshot was generated at{' '}
            {new Intl.DateTimeFormat('en-US', {
              timeZone: 'America/Los_Angeles',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }).format(new Date(data.generatedAt))}
            .
          </p>
        </section>
      </main>
    </div>
  );
}
