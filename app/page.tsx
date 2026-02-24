import { GlobalMap } from "./components/GlobalMap";
import type { GlobalMapProps } from "./components/GlobalMap";
import { MetricTile } from "./components/MetricTile";
import { ThreatRadar } from "./components/ThreatRadar";
import { TopCommandBar } from "./components/TopCommandBar";

const metrics = [
  {
    label: "Grid Throughput",
    value: "218.4 Tbps",
    description: "Crosslink bandwidth across the sentinel mesh.",
    delta: { label: "vs. last orbit", value: "+4.7%", direction: "up" as const },
    accent: "from-fuchsia-500/25 via-transparent to-sky-400/20",
  },
  {
    label: "Signal Purity",
    value: "99.2%",
    description: "Noise-filtered spectrum integrity snapshot.",
    delta: { label: "variance", value: "-0.3%", direction: "down" as const },
    accent: "from-sky-500/20 via-transparent to-cyan-300/10",
  },
  {
    label: "Autonomous Ops",
    value: "312 nodes",
    description: "Self-directed sentinels executing playbooks.",
    delta: { label: "handoff queue", value: "+18", direction: "up" as const },
    accent: "from-purple-500/25 via-transparent to-fuchsia-400/15",
  },
  {
    label: "Escalation Budget",
    value: "72.3%",
    description: "Bandwidth reserved for adaptive countermeasures.",
    delta: { label: "reserve", value: "Stable", direction: "flat" as const },
    accent: "from-cyan-400/20 via-transparent to-white/5",
  },
];

const commandQueue = [
  {
    id: "CMD-271A",
    label: "Hemisphere mesh recalibration",
    status: "executing" as const,
    eta: "00:32",
    channel: "Astra uplink",
  },
  {
    id: "CMD-273B",
    label: "Thermal bloom scrubbing",
    status: "queued" as const,
    eta: "05:10",
    channel: "Polar band",
  },
  {
    id: "CMD-274C",
    label: "Decoy swarm ignition",
    status: "armed" as const,
    eta: "12:44",
    channel: "Stratos relay",
  },
  {
    id: "CMD-276F",
    label: "Archive lattice snapshot",
    status: "armed" as const,
    eta: "18:05",
    channel: "Deep vault",
  },
];

const threatVectors = [
  {
    id: "VX-01",
    label: "Sable Comet",
    vector: 20,
    intensity: 0.82,
    quadrant: "Polar",
    status: "Tracking",
    impact: "Probable cascade into westward relay corridor.",
  },
  {
    id: "VX-04",
    label: "Glass Orchid",
    vector: 130,
    intensity: 0.61,
    quadrant: "Equatorial",
    status: "Contained",
    impact: "Signal obfuscation spike dampened by spectral gate.",
  },
  {
    id: "VX-12",
    label: "Obsidian Wake",
    vector: 220,
    intensity: 0.74,
    quadrant: "Austral",
    status: "Escalating",
    impact: "Thermal noise injection across three synapses.",
  },
  {
    id: "VX-18",
    label: "Lumen Choir",
    vector: 310,
    intensity: 0.45,
    quadrant: "Orbital",
    status: "Idle",
    impact: "Dormant resonance signature under observation.",
  },
];

const globalNodes: GlobalMapProps["nodes"] = [
  {
    id: "ARC-09",
    label: "Aegean Crown",
    region: "EMEA",
    status: "stable" as const,
    latency: 43,
    load: 58,
    coord: [35, 32],
  },
  {
    id: "HEL-22",
    label: "Helios Array",
    region: "LATAM",
    status: "elevated" as const,
    latency: 71,
    load: 76,
    coord: [25, 65],
  },
  {
    id: "ION-17",
    label: "Ion Warden",
    region: "APAC",
    status: "critical" as const,
    latency: 96,
    load: 91,
    coord: [78, 54],
  },
  {
    id: "POL-03",
    label: "Polar Lattice",
    region: "NA",
    status: "stable" as const,
    latency: 37,
    load: 44,
    coord: [50, 25],
  },
];

const formatTime = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    ...options,
  }).format(new Date());

export default function Home() {
  const missionTime = formatTime({ hour: "2-digit", minute: "2-digit", hour12: false });
  const missionDate = formatTime({ month: "short", day: "2-digit", year: "numeric" });

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030011] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,0,153,0.3),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(0,214,255,0.35),transparent_45%),linear-gradient(120deg,rgba(7,4,54,0.9),rgba(1,1,20,0.95))]" />
      <div className="pointer-events-none absolute inset-0 opacity-40 mix-blend-screen">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <main className="relative z-10 mx-auto flex max-w-[1400px] flex-col gap-8 px-6 py-10 lg:px-10">
        <TopCommandBar
          missionTitle="Orbital Defense Mesh"
          missionSubtitle="Neon Skynet Sentinel · Canonical registry uplink"
          missionTime={missionTime}
          missionDate={missionDate}
          operatorsOnline={42}
          signalStrength={0.91}
          commandQueue={commandQueue}
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricTile key={metric.label} {...metric} />
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <ThreatRadar threats={threatVectors} />
          </div>
          <div className="lg:col-span-2">
            <GlobalMap nodes={globalNodes} />
          </div>
        </section>

        <section className="mb-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300/90">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
            Telemetry Stubs
          </p>
          <p className="mt-2 text-base text-white">
            Dashboard shell wired to deterministic dummy data. Replace metric
            definitions, command queue, threat vectors, and node inventory with
            live services to activate the neon Skynet experience.
          </p>
        </section>
      </main>
    </div>
  );
}
