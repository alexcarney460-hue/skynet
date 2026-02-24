'use client';

import { useMemo, useState, useTransition } from 'react';
import type { ControlState } from '@/lib/control-types';

const statusColors: Record<string, string> = {
  running: 'text-emerald-300',
  queued: 'text-sky-300',
  paused: 'text-amber-300',
  completed: 'text-slate-300',
};

const agentColors: Record<string, string> = {
  idle: 'bg-emerald-400/10 border-emerald-400/40',
  busy: 'bg-fuchsia-400/10 border-fuchsia-400/40',
};

type Props = {
  initialState: ControlState;
};

export function ControlPanel({ initialState }: Props) {
  const [state, setState] = useState<ControlState>(initialState);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState(initialState.templates[0]?.id ?? '');
  const [label, setLabel] = useState('New Campaign Launch');
  const [owner, setOwner] = useState('Alex');

  const activeRuns = useMemo(() => state.runs.filter((run) => run.status !== 'completed'), [state.runs]);

  async function mutate(action: string, payload?: Record<string, unknown>) {
    startTransition(async () => {
      try {
        const res = await fetch('/api/control', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, payload }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.message || 'Control API failed');
        }
        const data = (await res.json()) as ControlState;
        setState(data);
        setMessage('Updated');
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Action failed');
      }
    });
  }

  const templates = state.templates;

  const currentStepLabel = (runId: string) => {
    const run = state.runs.find((r) => r.id === runId);
    if (!run) return '—';
    const template = state.templates.find((t) => t.id === run.templateId);
    if (!template) return '—';
    const step = template.steps[Math.max(run.currentStepIndex, 0)];
    return step ? step.label : '—';
  };

  const currentAgentName = (runId: string) => {
    const run = state.runs.find((r) => r.id === runId);
    if (!run) return '—';
    const template = state.templates.find((t) => t.id === run.templateId);
    if (!template) return '—';
    const step = template.steps[Math.max(run.currentStepIndex, 0)];
    const agent = state.agents.find((a) => a.id === step?.agentId);
    return agent?.name ?? '—';
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-[#04030e]/90 p-6 text-sm text-slate-200 shadow-[0_0_45px_rgba(0,214,255,0.18)] backdrop-blur-2xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/80">Workflow Orchestrator</p>
          <h2 className="text-2xl font-semibold text-white">Marketing Agent Control</h2>
        </div>
        <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-cyan-100">
          {activeRuns.length} Active
        </span>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">Workflow Runs</h3>
              {message && <span className="text-xs text-slate-300">{isPending ? 'Updating…' : message}</span>}
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                  <tr>
                    <th className="py-2 pr-3">Label</th>
                    <th className="py-2 pr-3">Step</th>
                    <th className="py-2 pr-3">Agent</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {state.runs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-400">
                        No workflow runs yet. Launch one from the form on the right.
                      </td>
                    </tr>
                  )}
                  {state.runs.map((run) => (
                    <tr key={run.id} className="border-t border-white/5">
                      <td className="py-3 pr-3 text-white">{run.label}</td>
                      <td className="py-3 pr-3">{currentStepLabel(run.id)}</td>
                      <td className="py-3 pr-3">{currentAgentName(run.id)}</td>
                      <td className={`py-3 pr-3 font-semibold ${statusColors[run.status] ?? 'text-slate-200'}`}>
                        {run.status}
                      </td>
                      <td className="py-3 pr-3 space-x-2">
                        {run.status === 'running' && (
                          <button
                            onClick={() => mutate('advance_workflow', { runId: run.id })}
                            className="rounded-full border border-cyan-300/50 px-3 py-1 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/10"
                            disabled={isPending}
                          >
                            Advance Step
                          </button>
                        )}
                        {run.status !== 'completed' && (
                          <button
                            onClick={() => mutate('cancel_workflow', { runId: run.id })}
                            className="rounded-full border border-rose-300/40 px-3 py-1 text-xs font-semibold text-rose-200 hover:bg-rose-500/10"
                            disabled={isPending}
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-base font-semibold text-white">Launch Workflow</h3>
            <div className="mt-3 space-y-3">
              <label className="block text-xs uppercase tracking-[0.3em] text-slate-400">Template</label>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              >
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>

              <label className="block text-xs uppercase tracking-[0.3em] text-slate-400">Label</label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                placeholder="Launch title"
              />

              <label className="block text-xs uppercase tracking-[0.3em] text-slate-400">Owner</label>
              <input
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                placeholder="Owner"
              />

              <button
                onClick={() => mutate('start_workflow', { templateId, label, owner })}
                disabled={isPending || !templateId}
                className="mt-2 w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 py-2 text-sm font-semibold text-white shadow-[0_0_25px_rgba(0,214,255,0.35)]"
              >
                {isPending ? 'Launching…' : 'Prime Workflow'}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-base font-semibold text-white">Templates</h3>
            <ul className="mt-3 space-y-2 text-xs text-slate-300">
              {templates.map((template) => (
                <li key={template.id} className="rounded-xl border border-white/5 bg-black/20 p-3">
                  <p className="text-white">{template.name}</p>
                  <p className="text-slate-400">{template.steps.length} steps · {template.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-base font-semibold text-white">Agent Status</h3>
        <div className="mt-3 grid gap-4 lg:grid-cols-4 md:grid-cols-2">
          {state.agents.map((agent) => (
            <div
              key={agent.id}
              className={`rounded-2xl border p-4 ${agentColors[agent.status]} backdrop-blur-xl`}
            >
              <p className="text-xs uppercase tracking-[0.35em] text-slate-300">{agent.role}</p>
              <h4 className="text-lg font-semibold text-white">{agent.name}</h4>
              <p className="text-xs text-slate-300/80">{agent.description}</p>
              <p className="mt-2 text-sm">
                Status: <span className="font-semibold">{agent.status}</span>
              </p>
              {agent.currentWorkflowId && (
                <p className="text-xs text-slate-300">WF: {agent.currentWorkflowId.slice(0, 6)}…</p>
              )}
              <div className="mt-3 flex gap-2">
                {agent.mode === 'active' ? (
                  <button
                    onClick={() => mutate('pause_agent', { agentId: agent.id })}
                    className="flex-1 rounded-full border border-amber-300/50 px-3 py-1 text-xs font-semibold text-amber-200 hover:bg-amber-500/10"
                    disabled={isPending}
                  >
                    Pause
                  </button>
                ) : (
                  <button
                    onClick={() => mutate('resume_agent', { agentId: agent.id })}
                    className="flex-1 rounded-full border border-emerald-300/50 px-3 py-1 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/10"
                    disabled={isPending}
                  >
                    Resume
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
