'use client';

import { useState } from 'react';
import { useApiKey } from './ApiKeyProvider';

export function ApiKeyBar() {
  const { apiKey, setApiKey } = useApiKey();
  const [input, setInput] = useState('');
  const [showSignup, setShowSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function applyKey() {
    if (input.startsWith('sk_')) {
      setApiKey(input);
      setInput('');
      setMessage(null);
    }
  }

  function disconnect() {
    setApiKey('');
    setMessage(null);
  }

  async function handleAuth(mode: 'signup' | 'login') {
    if (!email || !password) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.error) {
        setMessage(data.error);
      } else if (data.api_key) {
        setApiKey(data.api_key);
        setMessage(`Key created: ${data.api_key.slice(0, 20)}... — saved to console.`);
        setShowSignup(false);
      } else {
        setMessage('Logged in. Enter your API key to continue.');
        setShowSignup(false);
      }
    } catch (err) {
      setMessage(String(err));
    } finally {
      setLoading(false);
    }
  }

  if (apiKey) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3">
        <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
        <span className="text-xs text-slate-400">
          Connected: <code className="text-cyan-300">{apiKey.slice(0, 16)}...</code>
        </span>
        <button
          onClick={disconnect}
          className="ml-auto text-xs text-slate-500 hover:text-rose-400"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="sk_live_... (paste your API key)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyKey()}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
        />
        <button
          onClick={applyKey}
          className="rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-5 py-2 text-xs font-semibold text-white"
        >
          Connect
        </button>
        <button
          onClick={() => setShowSignup(!showSignup)}
          className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
        >
          {showSignup ? 'Cancel' : 'Sign Up'}
        </button>
      </div>

      {showSignup && (
        <div className="mt-4 flex gap-2">
          <input
            type="email"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
          />
          <input
            type="password"
            placeholder="password (6+ chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
          />
          <button
            onClick={() => handleAuth('signup')}
            disabled={loading}
            className="rounded-full bg-emerald-500/20 border border-emerald-400/40 px-4 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/30 disabled:opacity-50"
          >
            {loading ? '...' : 'Create Account'}
          </button>
        </div>
      )}

      {message && (
        <p className={`mt-3 text-xs ${message.includes('error') || message.includes('Error') ? 'text-rose-400' : 'text-emerald-400'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
