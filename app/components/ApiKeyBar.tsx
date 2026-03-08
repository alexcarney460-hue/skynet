'use client';

import { useState } from 'react';
import { useApiKey } from './ApiKeyProvider';

type Mode = 'idle' | 'signup' | 'login';

export function ApiKeyBar() {
  const { apiKey, setApiKey } = useApiKey();
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('idle');
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

  async function handleSignup() {
    if (!email || !password) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.error) {
        setMessage(data.error);
      } else if (data.api_key) {
        setApiKey(data.api_key);
        setMessage(`Account created! Key saved to console.`);
        setMode('idle');
      }
    } catch (err) {
      setMessage(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(regenerate: boolean) {
    if (!email || !password) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, regenerate_key: regenerate }),
      });
      const data = await res.json();
      if (data.error) {
        setMessage(data.error);
      } else if (data.api_key) {
        // Got a new key from regeneration
        setApiKey(data.api_key);
        setMessage('New key generated and saved! Previous keys revoked.');
        setMode('idle');
      } else {
        // Logged in but no raw key available
        setMessage(data.message || 'Logged in. Click "Generate New Key" if you lost yours.');
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
      {/* Paste existing key */}
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
      </div>

      {/* Mode selector */}
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => setMode(mode === 'signup' ? 'idle' : 'signup')}
          className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
            mode === 'signup'
              ? 'border-cyan-400/40 bg-cyan-500/10 text-cyan-200'
              : 'border-white/15 text-slate-400 hover:text-white'
          }`}
        >
          New Account
        </button>
        <button
          onClick={() => setMode(mode === 'login' ? 'idle' : 'login')}
          className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
            mode === 'login'
              ? 'border-cyan-400/40 bg-cyan-500/10 text-cyan-200'
              : 'border-white/15 text-slate-400 hover:text-white'
          }`}
        >
          Lost Key? Login
        </button>
      </div>

      {/* Signup form */}
      {mode === 'signup' && (
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
            onKeyDown={(e) => e.key === 'Enter' && handleSignup()}
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
          />
          <button
            onClick={handleSignup}
            disabled={loading}
            className="rounded-full bg-emerald-500/20 border border-emerald-400/40 px-4 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/30 disabled:opacity-50"
          >
            {loading ? '...' : 'Create'}
          </button>
        </div>
      )}

      {/* Login + regenerate form */}
      {mode === 'login' && (
        <div className="mt-4 space-y-3">
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
            />
            <input
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin(true)}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleLogin(true)}
              disabled={loading}
              className="rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-5 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              {loading ? '...' : 'Generate New Key'}
            </button>
            <p className="flex items-center text-[0.65rem] text-slate-500">
              This will revoke your old key and create a new one.
            </p>
          </div>
        </div>
      )}

      {message && (
        <p className={`mt-3 text-xs ${message.includes('error') || message.includes('Error') || message.includes('Invalid') ? 'text-rose-400' : 'text-emerald-400'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
