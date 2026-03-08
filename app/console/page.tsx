'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ThreatRadar } from '../components/ThreatRadar';
import { MetricForm } from '../components/MetricForm';
import { TelemetryFeed } from '../components/TelemetryFeed';
import { CompressForm } from '../components/CompressForm';
import { MemoryPanel } from '../components/MemoryPanel';
import { CircuitBreakerPanel } from '../components/CircuitBreakerPanel';
import { CreditBadge } from '../components/CreditBadge';
import { LiveMetricTiles } from '../components/LiveMetricTiles';
import { ApiKeyProvider } from '../components/ApiKeyProvider';
import { ApiKeyBar } from '../components/ApiKeyBar';

const threats = [
  { id: 'DV-1', label: 'Memory Saturation', vector: 35, intensity: 0.62, quadrant: 'Q1', status: 'Active', impact: 'Token budget under pressure' },
  { id: 'DV-2', label: 'Context Window Drift', vector: 145, intensity: 0.41, quadrant: 'Q2', status: 'Monitoring', impact: 'Output coherence declining' },
  { id: 'DV-3', label: 'Verbosity Inflation', vector: 230, intensity: 0.28, quadrant: 'Q3', status: 'Contained', impact: 'Minor token waste' },
  { id: 'DV-4', label: 'Session Decay', vector: 310, intensity: 0.55, quadrant: 'Q4', status: 'Active', impact: 'Half-life approaching threshold' },
];

type ConsoleTab = 'overview' | 'compress' | 'memory' | 'circuit-breaker' | 'telemetry';

const TABS: { id: ConsoleTab; label: string; color: string }[] = [
  { id: 'overview', label: 'Metrics', color: 'text-fuchsia-300' },
  { id: 'compress', label: 'Compress', color: 'text-cyan-300' },
  { id: 'memory', label: 'Memory', color: 'text-emerald-300' },
  { id: 'circuit-breaker', label: 'Circuit Breaker', color: 'text-amber-300' },
  { id: 'telemetry', label: 'Telemetry', color: 'text-fuchsia-300' },
];

function ConsoleContent() {
  const [tab, setTab] = useState<ConsoleTab>('overview');

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030011] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,0,153,0.3),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(0,214,255,0.35),transparent_45%),linear-gradient(120deg,rgba(7,4,54,0.9),rgba(1,1,20,0.95))]" />
      <div className="pointer-events-none absolute inset-0 opacity-40 mix-blend-screen">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <main className="relative z-10 mx-auto flex max-w-[1400px] flex-col gap-6 px-6 py-10 lg:px-10">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-200/80">SkynetX Console</p>
            <h1 className="text-2xl font-semibold text-white">Cognitive Telemetry Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <CreditBadge />
            <Link href="/console/billing" className="text-xs text-slate-500 hover:text-white transition">Billing</Link>
            <Link href="/" className="text-xs text-slate-500 hover:text-white transition">Home</Link>
          </div>
        </header>

        {/* API Key */}
        <ApiKeyBar />

        {/* Tab Navigation */}
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

        {/* Tab Content */}
        {tab === 'overview' && (
          <>
            {/* Live metric tiles — auto-update from telemetry */}
            <LiveMetricTiles />

            {/* Radar + Metric Form */}
            <section className="grid gap-6 lg:grid-cols-2">
              <ThreatRadar threats={threats} />
              <MetricForm />
            </section>
          </>
        )}

        {tab === 'compress' && (
          <CompressForm />
        )}

        {tab === 'memory' && (
          <MemoryPanel />
        )}

        {tab === 'circuit-breaker' && (
          <CircuitBreakerPanel />
        )}

        {tab === 'telemetry' && (
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
