type Threat = {
  id: string;
  label: string;
  vector: number; // degrees
  intensity: number; // 0-1
  quadrant: string;
  status: string;
  impact: string;
};

export type ThreatRadarProps = {
  threats: Threat[];
};

const polarToPosition = (vector: number, intensity: number) => {
  const adjustedAngle = ((vector - 90) * Math.PI) / 180; // rotate so 0° faces up
  const radius = intensity * 38; // keep dots inside radar circle

  const x = 50 + Math.cos(adjustedAngle) * radius;
  const y = 50 + Math.sin(adjustedAngle) * radius;

  return { left: `${x}%`, top: `${y}%` };
};

export function ThreatRadar({ threats }: ThreatRadarProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#050112]/90 p-6 shadow-[0_0_50px_rgba(149,0,255,0.25)] backdrop-blur-2xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-fuchsia-200/80">
            Drift Vectors
          </p>
          <h2 className="text-2xl font-semibold text-white">Runtime Drift Sweep</h2>
        </div>
        <span className="rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-fuchsia-100">
          Runtime
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3 text-sm text-slate-300/90">
          <p>
            Monitoring context drift channels with deterministic heuristics. Radar
            plots show runtime drift vectors scaled by intensity. Values are
            synthetic for the shell and can be replaced with live telemetry.
          </p>
          <div className="grid grid-cols-2 gap-3 text-xs uppercase tracking-[0.35em] text-slate-400">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
              4.2s <span className="block text-[0.65rem] tracking-[0.5em]">Loop</span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
              92% <span className="block text-[0.65rem] tracking-[0.5em]">Confidence</span>
            </div>
          </div>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-xs">
          <div className="absolute inset-0 rounded-full border border-white/10" />
          <div className="absolute inset-4 rounded-full border border-white/10" />
          <div className="absolute inset-8 rounded-full border border-white/10" />
          <div className="absolute inset-12 rounded-full border border-white/10" />
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/10" />
          <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-white/10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15),transparent_60%)]" />
          {threats.map((threat) => (
            <div
              key={threat.id}
              className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/60 bg-gradient-to-br from-fuchsia-400 via-purple-500 to-cyan-300 shadow-[0_0_15px_rgba(46,246,255,0.9)]"
              style={polarToPosition(threat.vector, threat.intensity)}
            >
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[0.6rem] font-semibold uppercase tracking-[0.35em] text-cyan-100">
                {threat.id}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {threats.map((threat) => (
          <div
            key={`legend-${threat.id}`}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200/90"
          >
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-slate-400">
              <span>{threat.id}</span>
              <span className="text-cyan-200">{Math.round(threat.intensity * 100)}%</span>
            </div>
            <p className="mt-2 text-base font-semibold text-white">{threat.label}</p>
            <div className="mt-2 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
              <span>{threat.quadrant}</span>
              <span className="text-fuchsia-200">{threat.status}</span>
            </div>
            <p className="mt-1 text-slate-300/80">{threat.impact}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
