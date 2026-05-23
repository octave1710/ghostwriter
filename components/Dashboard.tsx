'use client';

import { useState, useTransition } from 'react';
import { NarrativeChart, type SeriesPoint } from './NarrativeChart';
import { TracePanel } from './TracePanel';
import type { RunResult } from '@/lib/agent/loop';

const DD_SITE = process.env.NEXT_PUBLIC_DD_SITE ?? 'datadoghq.com';
const DD_ML_APP = process.env.NEXT_PUBLIC_DD_LLMOBS_ML_APP ?? 'makoai';

type Props = {
  defaultBrand: string;
  defaultQueries: string[];
  defaultCompetitors: string[];
  initialSeries: SeriesPoint[];
};

type Phase = 'idle' | 'monitoring' | 'detecting' | 'publishing' | 'measuring' | 'done' | 'error';

const PHASE_LABEL: Record<Phase, string> = {
  idle: 'Ready',
  monitoring: 'Monitoring AI engines via Nimble…',
  detecting: 'Detecting citation gaps…',
  publishing: 'Publishing grounded citeables to cited.md…',
  measuring: 'Recording narrative-control metrics in ClickHouse…',
  done: 'Run complete',
  error: 'Run failed',
};

export function Dashboard({ defaultBrand, defaultQueries, defaultCompetitors, initialSeries }: Props) {
  const [brand, setBrand] = useState(defaultBrand);
  const [queriesText, setQueriesText] = useState(defaultQueries.join('\n'));
  const [competitorsText, setCompetitorsText] = useState(defaultCompetitors.join(', '));
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<RunResult | null>(null);
  const [series, setSeries] = useState<SeriesPoint[]>(initialSeries);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function refreshSeries(brandName: string) {
    try {
      const r = await fetch(`/api/narrative-control?brand=${encodeURIComponent(brandName)}`);
      const data = await r.json();
      if (Array.isArray(data.series)) setSeries(data.series);
    } catch { /* swallow */ }
  }

  async function deploy() {
    setError(null);
    setResult(null);
    setPhase('monitoring');

    // Visual progression while the API runs (timed, not real-progress).
    const advance = (next: Phase, delay: number) => setTimeout(() => setPhase(p => (p === 'idle' || p === 'done' || p === 'error') ? p : next), delay);
    advance('detecting', 5000);
    advance('publishing', 10000);
    advance('measuring', 20000);

    try {
      const res = await fetch('/api/deploy-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand,
          queries: queriesText.split('\n').map(q => q.trim()).filter(Boolean),
          competitors: competitorsText.split(',').map(c => c.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setResult(data as RunResult);
      setPhase('done');
      startTransition(() => refreshSeries(brand));
    } catch (err) {
      setError((err as Error).message);
      setPhase('error');
    }
  }

  const running = phase !== 'idle' && phase !== 'done' && phase !== 'error';

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">
        {/* Header */}
        <header className="space-y-3">
          <div className="flex items-baseline gap-3">
            <h1 className="text-5xl font-semibold tracking-tight">GhostWriter</h1>
            <span className="text-xs font-mono text-emerald-400/70">v0.1 · hackathon</span>
          </div>
          <p className="text-zinc-400 text-lg max-w-2xl">
            Autonomous GEO agent. Monitor → detect citation gap → publish grounded content → measure narrative-control lift. One trigger, full loop.
          </p>
        </header>

        {/* Form */}
        <section className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-end border border-zinc-800 rounded-xl p-6 bg-zinc-900/40">
          <div className="space-y-4 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block space-y-1">
                <span className="text-xs uppercase tracking-wide text-zinc-500">Brand</span>
                <input
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  disabled={running}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-sm focus:outline-none focus:border-emerald-500/50"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs uppercase tracking-wide text-zinc-500">Competitors (comma-separated)</span>
                <input
                  value={competitorsText}
                  onChange={e => setCompetitorsText(e.target.value)}
                  disabled={running}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-sm focus:outline-none focus:border-emerald-500/50"
                />
              </label>
            </div>
            <label className="block space-y-1">
              <span className="text-xs uppercase tracking-wide text-zinc-500">Queries (one per line)</span>
              <textarea
                value={queriesText}
                onChange={e => setQueriesText(e.target.value)}
                disabled={running}
                rows={5}
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-sm focus:outline-none focus:border-emerald-500/50 resize-none"
              />
            </label>
          </div>
          <button
            onClick={deploy}
            disabled={running}
            className="px-6 py-4 rounded-md bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed shrink-0 transition-colors"
          >
            {running ? 'Running…' : 'Deploy Agent'}
          </button>
        </section>

        {/* Status / Progress */}
        {(running || phase === 'done' || phase === 'error') && (
          <section className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/40 space-y-3">
            <div className="flex items-center gap-3">
              <span className={`size-2 rounded-full ${running ? 'bg-emerald-400 animate-pulse' : phase === 'error' ? 'bg-red-500' : 'bg-zinc-600'}`} />
              <span className="font-mono text-sm">{PHASE_LABEL[phase]}</span>
            </div>
            {error && <p className="text-sm text-red-400 font-mono">{error}</p>}
          </section>
        )}

        {/* Result + Chart */}
        <section className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6">
          {/* Gap + Published cards */}
          <div className="space-y-4">
            <ResultCard
              label="Gaps detected"
              value={result ? result.gaps.length.toString() : '—'}
              detail={result?.gaps.map(g => g.query).join(' · ') ?? 'Click Deploy Agent to run'}
              accent="amber"
            />
            <ResultCard
              label="Citeables published"
              value={result ? result.published.length.toString() : '—'}
              detail={
                result?.published.length
                  ? result.published.map((p, i) => (
                      <a key={i} href={p.url} target="_blank" rel="noreferrer" className="block underline decoration-emerald-500/40 hover:decoration-emerald-300 truncate">{p.url}</a>
                    ))
                  : 'Live cited.md URLs will appear here'
              }
              accent="emerald"
            />
            <ResultCard
              label="Narrative control (this run)"
              value={result ? `${Math.round(result.narrativeControlAfter * 100)}%` : '—'}
              detail={result ? `${result.gaps.length} of ${result.monitorResults.length} queries now source-owned via cited.md` : 'Share of AI answers sourced from your own ground truth'}
              accent="cyan"
            />
          </div>

          {/* Chart */}
          <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/40 min-h-[360px] flex flex-col">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-sm uppercase tracking-wide text-zinc-500">Narrative control · over time</h2>
              <span className="text-xs text-zinc-600 font-mono">brand={brand}</span>
            </div>
            <div className="flex-1 min-h-[280px]">
              <NarrativeChart series={series} />
            </div>
          </div>
        </section>

        {/* Datadog trace panel */}
        <section>
          <TracePanel
            steps={result?.trace ?? []}
            runId={result?.runId}
            durationMs={result?.durationMs}
            ddSite={DD_SITE}
            mlApp={DD_ML_APP}
          />
        </section>

        {/* Footer */}
        <footer className="text-xs text-zinc-600 font-mono space-y-1 pt-8 border-t border-zinc-900">
          <div>5 sponsor tools wired: Nimble · Senso · ClickHouse · Datadog · OpenAI · (x402 phase 4)</div>
          <div>
            <a href="/api/health" className="hover:text-zinc-400">/api/health</a> ·{' '}
            <a href={`/api/narrative-control?brand=${brand}`} className="hover:text-zinc-400">/api/narrative-control</a>
          </div>
        </footer>
      </div>
    </main>
  );
}

function ResultCard({ label, value, detail, accent }: { label: string; value: string; detail: React.ReactNode; accent: 'amber' | 'emerald' | 'cyan' }) {
  const accentClass = {
    amber: 'border-amber-500/30 bg-amber-500/[0.04]',
    emerald: 'border-emerald-500/30 bg-emerald-500/[0.04]',
    cyan: 'border-cyan-500/30 bg-cyan-500/[0.04]',
  }[accent];
  const valueClass = {
    amber: 'text-amber-300',
    emerald: 'text-emerald-300',
    cyan: 'text-cyan-300',
  }[accent];

  return (
    <div className={`border rounded-xl p-5 ${accentClass}`}>
      <div className="text-xs uppercase tracking-wide text-zinc-500 mb-1">{label}</div>
      <div className={`text-4xl font-mono font-light tabular-nums ${valueClass}`}>{value}</div>
      <div className="text-xs text-zinc-400 mt-2 space-y-0.5 font-mono">{detail}</div>
    </div>
  );
}
