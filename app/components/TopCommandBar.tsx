type Command = {
  id: string;
  label: string;
  status: "armed" | "queued" | "executing";
  eta: string;
  channel: string;
};

export type TopCommandBarProps = {
  missionTitle: string;
  missionSubtitle: string;
  missionTime: string;
  missionDate: string;
  operatorsOnline: number;
  signalStrength: number; // 0-1 scale
  commandQueue: Command[];
};

const statusColors: Record<Command["status"], string> = {
  armed: "text-emerald-300",
  executing: "text-amber-300",
  queued: "text-fuchsia-200",
};

export function TopCommandBar({
  missionTitle,
  missionSubtitle,
  missionTime,
  missionDate,
  operatorsOnline,
  signalStrength,
  commandQueue,
}: TopCommandBarProps) {
  const signalPercent = Math.round(signalStrength * 100);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1d0135]/80 via-[#050018]/95 to-[#011d3b]/90 p-6 shadow-[0_0_65px_rgba(255,0,170,0.25)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(255,53,214,0.4),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(0,224,255,0.4),transparent_40%)]" />
      <div className="relative space-y-6">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex-1 min-w-[240px]">
            <p className="text-xs uppercase tracking-[0.35em] text-fuchsia-200/80">
              Skynet Runtime Link
            </p>
            <div className="mt-2 space-y-1">
              <h1 className="text-3xl font-semibold text-white">{missionTitle}</h1>
              <p className="text-sm text-slate-200/80">{missionSubtitle}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-200/80">
            <div>
              <p className="text-[0.65rem] uppercase tracking-[0.4em] text-slate-400">
                Session Half-Life
              </p>
              <p className="text-xl font-semibold text-white">{missionTime}</p>
              <p className="text-xs text-slate-300/80">{missionDate}</p>
            </div>
            <div>
              <p className="text-[0.65rem] uppercase tracking-[0.4em] text-slate-400">
                Active Agent Instances
              </p>
              <p className="text-xl font-semibold text-white">{operatorsOnline}</p>
            </div>
            <div className="w-32">
              <p className="text-[0.65rem] uppercase tracking-[0.4em] text-slate-400">
                Context Coherence
              </p>
              <div className="mt-1 h-2 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 via-sky-400 to-cyan-300"
                  style={{ width: `${signalPercent}%` }}
                />
              </div>
              <p className="text-xs text-slate-300/80">{signalPercent}% stable</p>
            </div>
            <button className="ml-auto rounded-full border border-white/30 bg-white/10 px-5 py-2 text-sm font-semibold text-white shadow-[0_0_25px_rgba(0,255,247,0.35)] transition hover:border-cyan-200 hover:bg-white/20">
              Prime Runtime Checkpoint
            </button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {commandQueue.map((command) => (
            <div
              key={command.id}
              className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
                <span>{command.id}</span>
                <span className={statusColors[command.status]}>{command.status}</span>
              </div>
              <p className="mt-2 text-base font-semibold text-white">
                {command.label}
              </p>
              <div className="mt-3 flex items-center justify-between text-sm text-slate-300/90">
                <span>{command.channel}</span>
                <span className="text-cyan-200">T-{command.eta}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
