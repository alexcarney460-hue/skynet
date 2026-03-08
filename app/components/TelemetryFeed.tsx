'use client';

import { useEffect, useState } from 'react';

interface TelemetryEvent {
  id: string;
  metric_type: string;
  agent_id: string | null;
  session_id: string | null;
  created_at: string;
  input: Record<string, unknown>;
  result: Record<string, unknown>;
}

export function TelemetryFeed() {
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [loaded, setLoaded] = useState(false);

  async function fetchEvents() {
    if (!apiKey) return;
    setError(null);
    try {
      const res = await fetch('/api/telemetry?limit=50', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setEvents(data.events ?? []);
        setLoaded(true);
      }
    } catch (err) {
      setError(String(err));
    }
  }

  useEffect(() => {
    if (!apiKey) return;
    fetchEvents();
    const interval = setInterval(fetchEvents, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  return (
    <div className="rounded-3xl border border-white/10 bg-[#050017]/80 p-6 backdrop-blur-xl">
      <p className="text-xs uppercase tracking-[0.35em] text-fuchsia-200/80">Telemetry Feed</p>

      <div className="mt-4 flex gap-2">
        <input
          type="text"
          placeholder="sk_... (API key)"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-fuchsia-400/50"
        />
        <button
          onClick={fetchEvents}
          className="rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-4 py-2 text-xs font-semibold text-fuchsia-100 hover:bg-fuchsia-500/20"
        >
          Refresh
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

      {loaded && events.length === 0 && (
        <p className="mt-4 text-sm text-slate-400">No telemetry events found.</p>
      )}

      {events.length > 0 && (
        <div className="mt-4 max-h-96 overflow-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="sticky top-0 bg-[#050017] text-[0.65rem] uppercase tracking-[0.3em] text-slate-500">
              <tr>
                <th className="py-2 pr-3">Time</th>
                <th className="py-2 pr-3">Metric</th>
                <th className="py-2 pr-3">Agent</th>
                <th className="py-2">Result</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="border-t border-white/5">
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {new Date(e.created_at).toLocaleTimeString()}
                  </td>
                  <td className="py-2 pr-3">
                    <span className="rounded-full bg-white/10 px-2 py-0.5">{e.metric_type}</span>
                  </td>
                  <td className="py-2 pr-3 text-slate-400">{e.agent_id ?? '—'}</td>
                  <td className="py-2 max-w-xs truncate text-slate-400">
                    {JSON.stringify(e.result).slice(0, 80)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
