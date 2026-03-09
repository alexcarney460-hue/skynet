'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CreditBadge } from '../components/CreditBadge';
import { ApiKeyProvider } from '../components/ApiKeyProvider';
import { ApiKeyBar } from '../components/ApiKeyBar';
import { DashboardOverview } from '../components/DashboardOverview';
import { AlertFeed } from '../components/AlertFeed';
import { ActivityChart } from '../components/ActivityChart';
import { ApiPlayground } from '../components/ApiPlayground';
import { TelemetryFeed } from '../components/TelemetryFeed';

type ConsoleTab = 'dashboard' | 'playground' | 'logs';

const TABS: { id: ConsoleTab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'playground', label: 'API Playground' },
  { id: 'logs', label: 'Event Log' },
];

function ConsoleContent() {
  const [tab, setTab] = useState<ConsoleTab>('dashboard');

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030011] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,0,153,0.3),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(0,214,255,0.35),transparent_45%),linear-gradient(120deg,rgba(7,4,54,0.9),rgba(1,1,20,0.95))]" />
      <div className="pointer-events-none absolute inset-0 opacity-40 mix-blend-screen">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <main className="relative z-10 mx-auto flex max-w-[1400px] flex-col gap-6 px-6 py-10 lg:px-10">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-200/80">SkynetX Console</p>
            <h1 className="text-2xl font-semibold text-white">Agent Telemetry</h1>
          </div>
          <div className="flex items-center gap-4">
            <CreditBadge />
            <Link href="/console/billing" className="text-xs text-slate-500 hover:text-white transition">Billing</Link>
            <Link href="/" className="text-xs text-slate-500 hover:text-white transition">Home</Link>
          </div>
        </header>

        <ApiKeyBar />

        <nav className="flex flex-wrap gap-1 rounded-2xl border border-white/10 bg-white/[0.02] p-1.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                tab === t.id
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {tab === 'dashboard' && (
          <>
            <DashboardOverview />
            <div className="grid gap-6 lg:grid-cols-2">
              <ActivityChart />
              <AlertFeed />
            </div>
          </>
        )}

        {tab === 'playground' && (
          <ApiPlayground />
        )}

        {tab === 'logs' && (
          <TelemetryFeed />
        )}
      </main>
    </div>
  );
}

export default function ConsolePage() {
  return (
    <ApiKeyProvider>
      <ConsoleContent />
    </ApiKeyProvider>
  );
}
