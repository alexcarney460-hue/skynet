type Delta = {
  label: string;
  value: string;
  direction?: "up" | "down" | "flat";
};

export type MetricTileProps = {
  label: string;
  value: string;
  description?: string;
  accent?: string;
  delta?: Delta;
};

const deltaColors: Record<Required<Delta>["direction"], string> = {
  up: "text-emerald-300",
  down: "text-rose-300",
  flat: "text-slate-300",
};

const deltaIcons: Record<Required<Delta>["direction"], string> = {
  up: "▲",
  down: "▼",
  flat: "■",
};

export function MetricTile({
  label,
  value,
  description,
  accent = "from-fuchsia-500/20 via-transparent to-cyan-500/10",
  delta,
}: MetricTileProps) {
  const direction = delta?.direction ?? "flat";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_0_35px_rgba(255,255,255,0.07)] backdrop-blur-xl">
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent} opacity-90`}
      />
      <div className="relative space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
          {label}
        </p>
        <div className="flex items-end gap-4">
          <span className="text-3xl font-semibold text-white">{value}</span>
          {delta && (
            <span className={`text-xs font-semibold ${deltaColors[direction]}`}>
              {deltaIcons[direction]} {delta.value}
            </span>
          )}
        </div>
        {description && (
          <p className="text-sm text-slate-300/80">{description}</p>
        )}
        {delta?.label && (
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400/80">
            {delta.label}
          </p>
        )}
      </div>
    </div>
  );
}
