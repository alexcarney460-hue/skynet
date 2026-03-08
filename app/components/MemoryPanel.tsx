'use client';

import { useState } from 'react';
import { useApiKey } from './ApiKeyProvider';

export function MemoryPanel() {
  const { apiKey } = useApiKey();
  const [agentId, setAgentId] = useState('my-agent');
  const [sessionId, setSessionId] = useState('session-1');
  const [storeData, setStoreData] = useState('{"task": "research", "findings": ["result-1", "result-2"]}');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  async function store() {
    if (!apiKey) { setResult({ error: 'Set your API key first' }); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/v1/memory/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ agent_id: agentId, session_id: sessionId, data: JSON.parse(storeData) }),
      });
      setResult(await res.json());
    } catch (err) {
      setResult({ error: String(err) });
    } finally {
      setLoading(false);
    }
  }

  async function retrieve() {
    if (!apiKey) { setResult({ error: 'Set your API key first' }); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/memory/retrieve?agent_id=${agentId}&session_id=${sessionId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      setResult(await res.json());
    } catch (err) {
      setResult({ error: String(err) });
    } finally {
      setLoading(false);
    }
  }

  async function clear() {
    if (!apiKey) { setResult({ error: 'Set your API key first' }); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/memory/clear?agent_id=${agentId}&session_id=${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      setResult(await res.json());
    } catch (err) {
      setResult({ error: String(err) });
    } finally {
      setLoading(false);
    }
  }

  async function listSessions() {
    if (!apiKey) { setResult({ error: 'Set your API key first' }); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/memory/retrieve?agent_id=${agentId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      setResult(await res.json());
    } catch (err) {
      setResult({ error: String(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-[#050017]/80 p-6 backdrop-blur-xl">
      <p className="text-xs uppercase tracking-[0.35em] text-emerald-200/80">Session Memory</p>
      <p className="mt-1 text-xs text-slate-500">Store and retrieve agent state between calls. 7-day TTL.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-slate-400">
          <span className="mb-1 block">Agent ID</span>
          <input
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
          />
        </label>
        <label className="block text-xs text-slate-400">
          <span className="mb-1 block">Session ID</span>
          <input
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
          />
        </label>
      </div>

      <label className="mt-3 block text-xs text-slate-400">
        <span className="mb-1 block">Data (JSON)</span>
        <textarea
          value={storeData}
          onChange={(e) => setStoreData(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-mono text-slate-300 outline-none focus:border-cyan-400/50"
        />
      </label>

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={store} disabled={loading}
          className="rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-2 text-xs font-semibold text-white disabled:opacity-50">
          {loading ? '...' : 'Store'}
        </button>
        <button onClick={retrieve} disabled={loading}
          className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-5 py-2 text-xs font-semibold text-cyan-200 disabled:opacity-50">
          Retrieve
        </button>
        <button onClick={listSessions} disabled={loading}
          className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-xs font-semibold text-slate-300 disabled:opacity-50">
          List Sessions
        </button>
        <button onClick={clear} disabled={loading}
          className="rounded-full border border-rose-400/40 bg-rose-500/10 px-5 py-2 text-xs font-semibold text-rose-200 disabled:opacity-50">
          Clear
        </button>
      </div>

      {result && (
        <pre className="mt-4 max-h-64 overflow-auto rounded-xl border border-white/10 bg-black/40 p-4 text-xs text-slate-300">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
