'use client';

import { useState } from 'react';
import { useApiKey } from './ApiKeyProvider';

const SAMPLE_MESSAGES = `[
  {"role": "system", "content": "You are a helpful assistant."},
  {"role": "user", "content": "Can you help me write a function?"},
  {"role": "assistant", "content": "Certainly! I'd be happy to help. As you know, writing functions is important. In this case, I'd be glad to assist you with that. Please note that there are many ways to approach this. Let me help you create a function that does exactly what you need."},
  {"role": "user", "content": "Can you help me write a function?"},
  {"role": "assistant", "content": "Of course! As I mentioned earlier, I'd be happy to help. In this situation, let me create a simple function for you. It is important to note that we should keep it clean and efficient."},
  {"role": "user", "content": "Make it return the sum of two numbers"},
  {"role": "assistant", "content": "Absolutely! As you can see, here is a simple function:\\n\\nfunction add(a, b) {\\n  return a + b;\\n}\\n\\nAs I mentioned before, this is a clean approach. Please keep in mind that you can extend this later."}
]`;

export function CompressForm() {
  const { apiKey } = useApiKey();
  const [input, setInput] = useState(SAMPLE_MESSAGES);
  const [mode, setMode] = useState<'compress' | 'truncate'>('compress');
  const [targetTokens, setTargetTokens] = useState('');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!apiKey) {
      setResult({ error: 'Set your API key above first' });
      return;
    }
    setLoading(true);
    try {
      const messages = JSON.parse(input);
      const body: Record<string, unknown> = { messages, mode };
      if (mode === 'truncate' && targetTokens) {
        body.target_tokens = Number(targetTokens);
      }
      const res = await fetch('/api/v1/compress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
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
      <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/80">Context Compression</p>
      <p className="mt-1 text-xs text-slate-500">Paste a messages array to compress. Saves 30-50% of tokens.</p>

      <div className="mt-4 flex gap-2">
        {(['compress', 'truncate'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
              mode === m ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {mode === 'truncate' && (
        <label className="mt-3 block text-xs text-slate-400">
          <span className="mb-1 block">Target tokens (optional)</span>
          <input
            value={targetTokens}
            onChange={(e) => setTargetTokens(e.target.value)}
            placeholder="e.g. 2000"
            className="w-48 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
          />
        </label>
      )}

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={6}
        className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-mono text-slate-300 outline-none focus:border-cyan-400/50"
      />

      <button
        onClick={submit}
        disabled={loading}
        className="mt-4 rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-6 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? 'Compressing...' : 'Compress'}
      </button>

      {result && (
        <div className="mt-4">
          {(result as Record<string, unknown>).savings_percent !== undefined && (
            <div className="mb-3 flex gap-4 text-sm">
              <span className="text-slate-400">
                {String((result as Record<string, unknown>).original_tokens)} → {String((result as Record<string, unknown>).compressed_tokens)} tokens
              </span>
              <span className="font-bold text-emerald-400">
                -{String((result as Record<string, unknown>).savings_percent)}% saved
              </span>
            </div>
          )}
          <pre className="max-h-64 overflow-auto rounded-xl border border-white/10 bg-black/40 p-4 text-xs text-slate-300">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
