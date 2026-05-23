'use client';

import { useState, useTransition } from 'react';
import { NarrativeChart, type SeriesPoint } from './NarrativeChart';
import { TracePanel } from './TracePanel';
import { AIResponsePanel } from './AIResponsePanel';
import { PublishedArticles } from './PublishedArticles';
import { X402Panel } from './X402Panel';
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
  monitoring: 'Monitoring web + AI engines via Nimble…',
  detecting: 'Detecting citation gaps with gpt-4o…',
  publishing: 'Publishing grounded citeables to cited.md…',
  measuring: 'Recording narrative-control metrics in ClickHouse…',
  done: 'Run complete',
  error: 'Run failed',
};

const PHASE_ORDER: Phase[] = ['monitoring', 'detecting', 'publishing', 'measuring'];

export function Dashboard({ defaultBrand, defaultQueries, defaultCompetitors, initialSeries }: Props) {
  const [brand, setBrand] = useState(defaultBrand);
  const [queriesText, setQueriesText] = useState(defaultQueries.join('\n'));
  const [competitorsText, setCompetitorsText] = useState(defaultCompetitors.join(', '));
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<RunResult | null>(null);
  const [series, setSeries] = useState<SeriesPoint[]>(initialSeries);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

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

    // Timed visual progression matching actual ~8-12s run duration.
    const t0 = Date.now();
    const advance = (next: Phase, ms: number) =>
      setTimeout(() => {
        const stillRunning = Date.now() - t0 < 30000;
        if (stillRunning) setPhase(p => (p === 'done' || p === 'error') ? p : next);
      }, ms);
    advance('detecting', 1500);
    advance('publishing', 2800);
    advance('measuring', 7500);

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
  const hasRun = phase === 'done' || phase === 'error';

  // For the progress bars: a bar is filled if we've reached its phase OR we're already done.
  const isBarFilled = (p: Phase) => {
    if (phase === 'done') return true;
    if (phase === 'idle' || phase === 'error') return false;
    return PHASE_ORDER.indexOf(phase) >= PHASE_ORDER.indexOf(p);
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">
        {/* Header */}
        <header className="space-y-3">
          <div className="flex items-baseline gap-3">
            <h1 className="text-5xl font-semibold tracking-tight">GhostWriter</h1>
            <span className="text-xs font-mono text-emerald-400/70">v0.1 · hackathon</span>
          </div>
          <p className="text-zinc-400 text-lg max-w-3xl">
            Autonomous GEO agent. <span className="text-zinc-200">Monitor</span> how AI engines describe your brand → <span className="text-zinc-200">detect</span> where you&apos;re absent → <span className="text-zinc-200">publish</span> grounded citeables that AI engines cite → <span className="text-zinc-200">measure</span> the lift. One trigger, full loop.
          </p>
        </header>

        {/* Form */}
        <section className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/40 space-y-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm uppercase tracking-wide text-zinc-400">Configure run</h2>
            <span className="text-[11px] font-mono text-zinc-500">
              pre-loaded with Resend · edit any field to test your own brand
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-end">
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
          </div>
        </section>

        {/* Status + Progress (visible during run AND after done) */}
        {(running || hasRun) && (
          <section className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/40 space-y-3">
            <div className="flex items-center gap-3">
              <span className={`size-2 rounded-full ${running ? 'bg-emerald-400 animate-pulse' : phase === 'error' ? 'bg-red-500' : 'bg-emerald-400'}`} />
              <span className="font-mono text-sm">{PHASE_LABEL[phase]}</span>
              {result && phase === 'done' && (
                <span className="text-xs font-mono text-zinc-500 ml-auto">
                  finished in {(result.durationMs / 1000).toFixed(1)}s · {result.trace.length} spans
                </span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {PHASE_ORDER.map((p) => (
                <div
                  key={p}
                  className={`h-1 rounded-full transition-colors ${isBarFilled(p) ? 'bg-emerald-500' : 'bg-zinc-800'}`}
                />
              ))}
            </div>
            <div className="grid grid-cols-4 gap-1.5 text-[10px] uppercase tracking-wider font-mono text-zinc-600">
              <span className={isBarFilled('monitoring') ? 'text-emerald-400/70' : ''}>monitor</span>
              <span className={isBarFilled('detecting') ? 'text-emerald-400/70' : ''}>detect</span>
              <span className={isBarFilled('publishing') ? 'text-emerald-400/70' : ''}>publish</span>
              <span className={isBarFilled('measuring') ? 'text-emerald-400/70' : ''}>measure</span>
            </div>
            {error && <p className="text-sm text-red-400 font-mono pt-2">{error}</p>}
          </section>
        )}

        {/* Big-picture result + Chart */}
        <section className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6">
          <div className="space-y-4">
            <ResultCard
              label="Narrative control · this run"
              value={result ? `${pct(result.narrativeControlAfter)}` : '—'}
              valueSuffix={result ? null : null}
              detail={
                result
                  ? `${result.gaps.length} of ${result.monitorResults.length} queries are now source-owned via cited.md (was ${pct(result.narrativeControlBefore)} cited from any source, 0% source-owned).`
                  : 'Share of AI answers about your brand that come from YOUR own grounded sources, vs third-party blogs / competitor docs.'
              }
              accent="cyan"
              large
            />
            <ResultCard
              label="Gaps detected"
              value={result ? result.gaps.length.toString() : '—'}
              detail={
                result
                  ? result.gaps.length > 0
                    ? result.gaps.map(g => <div key={g.query}>·  {g.query}</div>)
                    : <span>No gaps — your brand is already cited everywhere.</span>
                  : 'Queries where your brand is absent from AI answers'
              }
              accent="amber"
            />
          </div>

          <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/40 min-h-[360px] flex flex-col">
            <div className="flex items-baseline justify-between mb-2">
              <h2 className="text-sm uppercase tracking-wide text-zinc-300">Narrative control · over time</h2>
              <span className="text-xs text-zinc-600 font-mono">brand={brand}</span>
            </div>
            <p className="text-xs text-zinc-500 mb-4">
              % of monitored queries where your brand is sourced from your own grounded citeable. 0% = AI engines cite competitors and blogs; 100% = AI engines cite your own ground truth.
            </p>
            <div className="flex-1 min-h-[260px]">
              <NarrativeChart series={series} />
            </div>
          </div>
        </section>

        {/* AI engine impact preview — the wow moment */}
        <section>
          <AIResponsePanel sim={result?.aiResponseSimulation ?? null} />
        </section>

        {/* Published citeables */}
        {result && result.published.length > 0 && (
          <section>
            <PublishedArticles articles={result.published} />
          </section>
        )}

        {/* x402 agent payment rail */}
        {result && result.published.length > 0 && (
          <section>
            <X402Panel articles={result.published} />
          </section>
        )}

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
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <span>Sponsors wired:</span>
            <span className="text-zinc-400">Nimble</span>·<span className="text-zinc-400">Senso</span>·<span className="text-zinc-400">ClickHouse</span>·<span className="text-zinc-400">Datadog</span>·<span className="text-zinc-400">OpenAI</span>·<span className="text-zinc-400">x402</span>
          </div>
          <div>
            <a href="/api/health" className="hover:text-zinc-400">/api/health</a> ·{' '}
            <a href={`/api/narrative-control?brand=${brand}`} className="hover:text-zinc-400">/api/narrative-control</a> ·{' '}
            <a href="https://github.com/octave1710/ghostwriter" target="_blank" rel="noreferrer" className="hover:text-zinc-400">source ↗</a>
          </div>
        </footer>
      </div>
    </main>
  );
}

function pct(v: number) {
  return `${Math.round(v * 100)}%`;
}

function ResultCard({
  label,
  value,
  valueSuffix,
  detail,
  accent,
  large = false,
}: {
  label: string;
  value: string;
  valueSuffix?: React.ReactNode;
  detail: React.ReactNode;
  accent: 'amber' | 'emerald' | 'cyan';
  large?: boolean;
}) {
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
      <div className={`${large ? 'text-6xl' : 'text-4xl'} font-mono font-light tabular-nums ${valueClass} flex items-baseline gap-2`}>
        {value}{valueSuffix}
      </div>
      <div className="text-xs text-zinc-400 mt-2 space-y-0.5 font-mono leading-relaxed">{detail}</div>
    </div>
  );
}
