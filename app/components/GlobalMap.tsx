type Node = {
  id: string;
  label: string;
  region: string;
  status: "stable" | "elevated" | "critical";
  latency: number; // ms
  load: number; // %
  coord: [number, number]; // [x%, y%]
};

export type GlobalMapProps = {
  nodes: Node[];
};

const statusColors: Record<Node["status"], string> = {
  stable: "text-emerald-300",
  elevated: "text-amber-300",
  critical: "text-rose-300",
};

const statusBadges: Record<Node["status"], string> = {
  stable: "bg-emerald-400/15 border-emerald-400/40",
  elevated: "bg-amber-400/15 border-amber-400/40",
  critical: "bg-rose-500/20 border-rose-400/40",
};

export function GlobalMap({ nodes }: GlobalMapProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#030b20]/90 p-6 shadow-[0_0_45px_rgba(0,214,255,0.18)] backdrop-blur-2xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/80">
            Runtime Coverage
          </p>
          <h2 className="text-2xl font-semibold text-white">Agent Runtime Map</h2>
        </div>
        <div className="text-right text-xs uppercase tracking-[0.35em] text-slate-400">
          <p>Nodes</p>
          <p className="text-lg text-white">{nodes.length}</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/5 bg-gradient-to-br from-[#061735] via-[#050017] to-[#0a2445] p-4">
        <div className="relative h-64 overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_center,rgba(61,217,255,0.35),transparent_60%)]">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:28px_28px] opacity-30" />
          {nodes.map((node) => (
            <div
              key={node.id}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center"
              style={{ left: `${node.coord[0]}%`, top: `${node.coord[1]}%` }}
            >
              <span className="text-[0.6rem] uppercase tracking-[0.35em] text-slate-200">
                {node.id}
              </span>
              <span className="mt-1 h-3 w-3 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_15px_rgba(0,255,240,0.9)]" />
            </div>
          ))}
          <div className="pointer-events-none absolute inset-x-10 bottom-6 rounded-2xl border border-white/10 bg-black/40 p-3 text-center text-xs text-slate-300/80">
            Placeholder runtime projection — plug telemetry renderer here.
          </div>
        </div>
      </div>

      <ul className="mt-6 space-y-3 text-sm">
        {nodes.map((node) => (
          <li
            key={`node-${node.id}`}
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 text-slate-200/90"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
                {node.id} · {node.region}
              </p>
              <p className="text-base font-semibold text-white">{node.label}</p>
              <p className="text-xs text-slate-400">
                {node.latency}ms latency · {node.load}% load
              </p>
            </div>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.4em] ${statusBadges[node.status]} ${statusColors[node.status]}`}
            >
              {node.status}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
