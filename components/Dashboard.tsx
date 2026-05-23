'use client';

import { useState, useTransition, useEffect } from 'react';
import { NarrativeChart, type SeriesPoint } from './NarrativeChart';
import { TracePanel } from './TracePanel';
import { AIResponsePanel } from './AIResponsePanel';
import { PublishedArticles } from './PublishedArticles';
import { X402Panel } from './X402Panel';
import { MonitoringPanel } from './MonitoringPanel';
import { CompetitiveLeaderboard } from './CompetitiveLeaderboard';
import { OptimizationsPanel } from './OptimizationsPanel';
import { VerificationPanel } from './VerificationPanel';
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

  const competitors = competitorsText.split(',').map(c => c.trim()).filter(Boolean);

  async function refreshSeries(brandName: string) {
    try {
      const r = await fetch(`/api/narrative-control?brand=${encodeURIComponent(brandName)}`);
      const data = await r.json();
      if (Array.isArray(data.series)) setSeries(data.series);
    } catch { /* swallow */ }
  }

  // Hydrate the chart from ClickHouse on first mount (kept off SSR for snappy first paint).
  useEffect(() => {
    if (series.length === 0) refreshSeries(defaultBrand);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function deploy() {
    setError(null);
    setResult(null);
    setPhase('monitoring');

    const t0 = Date.now();
    const advance = (next: Phase, ms: number) =>
      setTimeout(() => {
        if (Date.now() - t0 < 30000) {
          setPhase(p => (p === 'done' || p === 'error') ? p : next);
        }
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
          competitors,
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

  const isBarFilled = (p: Phase) => {
    if (phase === 'done') return true;
    if (phase === 'idle' || phase === 'error') return false;
    return PHASE_ORDER.indexOf(phase) >= PHASE_ORDER.indexOf(p);
  };

  const queriesArr = queriesText.split('\n').map(q => q.trim()).filter(Boolean);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">

        {/* ─── Header ─── */}
        <header className="space-y-2">
          <div className="flex items-baseline gap-3">
            <h1 className="text-4xl font-semibold tracking-tight">GhostWriter</h1>
            <span className="text-xs font-mono text-emerald-400/70">v0.1 · hackathon</span>
          </div>
          <p className="text-zinc-400 text-base max-w-3xl">
            Autonomous GEO agent. One trigger: monitor AI search → detect citation gaps → publish grounded citeables → measure the lift → monetize via agent payments.
          </p>
        </header>

        {/* ─── Form ─── */}
        <section className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/30 space-y-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-xs uppercase tracking-wider text-zinc-400 font-mono">Configure run</h2>
            <span className="text-[11px] font-mono text-zinc-500">
              pre-loaded with Resend — edit any field for your own brand
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-end">
            <div className="space-y-3 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">Brand</span>
                  <input
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                    disabled={running}
                    className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-sm focus:outline-none focus:border-emerald-500/50"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">Competitors</span>
                  <input
                    value={competitorsText}
                    onChange={e => setCompetitorsText(e.target.value)}
                    disabled={running}
                    placeholder="comma, separated"
                    className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-sm focus:outline-none focus:border-emerald-500/50"
                  />
                </label>
              </div>
              <label className="block space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">Queries (one per line)</span>
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
              className="px-6 py-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shrink-0 transition-colors text-sm whitespace-nowrap"
            >
              {running ? 'Running…' : '▶ Deploy Agent'}
            </button>
          </div>
        </section>

        {/* ─── Run status ─── */}
        {(running || hasRun) && (
          <section className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/40 space-y-3">
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
                <div key={p} className={`h-1 rounded-full transition-colors ${isBarFilled(p) ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
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

        {/* ─── HERO impact ─── */}
        {result && (
          <HeroImpact result={result} brand={brand} />
        )}

        {/* ─── BEFORE: what AI engines were saying ─── */}
        {result && (
          <SectionHeader
            n="01"
            title="What AI engines were saying"
            description="Live snapshot of citations across your monitored queries — before the agent acted."
          />
        )}
        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5">
            <MonitoringPanel brand={brand} competitors={competitors} results={result.monitorResults} />
            <CompetitiveLeaderboard
              brand={brand}
              competitors={competitors}
              results={result.monitorResults}
              publishedCount={result.published.length}
            />
          </div>
        )}

        {/* ─── ACTION + IMPACT ─── */}
        {result && (
          <SectionHeader
            n="02"
            title="What the agent did about it"
            description={`${result.gaps.length} citation gap${result.gaps.length === 1 ? '' : 's'} detected → ${result.published.length} grounded citeable${result.published.length === 1 ? '' : 's'} published to cited.md.`}
          />
        )}

        {result && result.published.length > 0 && (
          <PublishedArticles articles={result.published} />
        )}

        {result && (
          <div className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/40">
            <div className="flex items-baseline justify-between mb-2">
              <h3 className="text-xs uppercase tracking-wider font-mono text-zinc-400">Narrative control · trend</h3>
              <span className="text-[11px] text-zinc-600 font-mono">brand={brand}</span>
            </div>
            <p className="text-xs text-zinc-500 mb-3">
              % of monitored queries source-owned via cited.md, across all runs. Flat at 0% before the agent shipped; vertical spike after.
            </p>
            <div className="h-[260px]">
              <NarrativeChart series={series} />
            </div>
          </div>
        )}

        {result && (
          <SectionHeader
            n="03"
            title="How AI engines now answer"
            description="Coverage: ChatGPT, Perplexity, Gemini, Google AI Overview, Claude.ai. Same query, before vs after your citeable hits the web."
          />
        )}

        {result && (
          <AIResponsePanel sim={result.aiResponseSimulation} />
        )}

        {result && result.published.length > 0 && (
          <VerificationPanel
            articles={result.published}
            brand={brand}
            queries={result.gaps.map(g => g.query)}
          />
        )}

        {/* ─── REVENUE ─── */}
        {result && result.published.length > 0 && (
          <>
            <SectionHeader
              n="04"
              title="Monetize the source"
              description="Other AI agents pay USDC to read your verified citeables. Real x402 protocol, on-chain settlement."
            />
            <X402Panel articles={result.published} />
          </>
        )}

        {/* ─── NEXT STEPS ─── */}
        {result && (
          <>
            <SectionHeader
              n="05"
              title="Next moves"
              description="Beyond publishing — what else compounds AI search visibility."
            />
            <OptimizationsPanel result={result} brand={brand} competitors={competitors} />
          </>
        )}

        {/* ─── Trace ─── */}
        {result && (
          <details className="group">
            <summary className="cursor-pointer text-xs uppercase tracking-wider font-mono text-zinc-500 hover:text-zinc-300 select-none flex items-center gap-2 py-3">
              <span className="text-zinc-700 group-open:rotate-90 transition-transform inline-block">▶</span>
              Datadog LLM Observability trace · {result.trace.length} spans · {(result.durationMs / 1000).toFixed(1)}s
            </summary>
            <div className="mt-3">
              <TracePanel
                steps={result.trace}
                runId={result.runId}
                durationMs={result.durationMs}
                ddSite={DD_SITE}
                mlApp={DD_ML_APP}
              />
            </div>
          </details>
        )}

        {/* ─── Footer ─── */}
        <footer className="text-xs text-zinc-600 font-mono space-y-1 pt-6 border-t border-zinc-900">
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <span>6 sponsors wired:</span>
            <span className="text-zinc-400">Nimble</span>·<span className="text-zinc-400">Senso</span>·<span className="text-zinc-400">ClickHouse</span>·<span className="text-zinc-400">Datadog</span>·<span className="text-zinc-400">OpenAI</span>·<span className="text-zinc-400">x402</span>
          </div>
          <div>
            <a href="/api/health" className="hover:text-zinc-400">/api/health</a> ·{' '}
            <a href={`/api/narrative-control?brand=${brand}`} className="hover:text-zinc-400">/api/narrative-control</a> ·{' '}
            <a href={`/api/query-content?id=${result?.published[0]?.contentId ?? 'x'}`} className="hover:text-zinc-400">/api/query-content (x402)</a> ·{' '}
            <a href="https://github.com/octave1710/ghostwriter" target="_blank" rel="noreferrer" className="hover:text-zinc-400">source ↗</a>
          </div>
        </footer>
      </div>
    </main>
  );
}

function SectionHeader({ n, title, description }: { n: string; title: string; description: string }) {
  return (
    <div className="flex items-baseline gap-4 pt-4">
      <span className="text-[10px] font-mono text-blue-400/70 tracking-widest font-semibold">{n}</span>
      <div className="flex-1 border-t border-blue-500/15 pt-3 -mt-3">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-50">{title}</h2>
        <p className="text-sm text-zinc-400 mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function HeroImpact({ result, brand }: { result: RunResult; brand: string }) {
  const total = result.monitorResults.length;
  const citedBefore = result.monitorResults.filter(m => m.brandCited).length;
  const ownedAfter = result.gaps.length;
  const projectedAfter = Math.min(total, citedBefore + ownedAfter);

  return (
    <section className="border border-emerald-500/20 rounded-xl p-6 bg-gradient-to-br from-emerald-500/[0.06] via-zinc-900/40 to-zinc-900/40 overflow-hidden relative">
      <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-emerald-500/[0.04] to-transparent pointer-events-none" />
      <div className="relative grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">{brand} · before</div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-mono font-light text-zinc-400 tabular-nums">{citedBefore}</span>
            <span className="text-2xl font-mono text-zinc-600">/ {total}</span>
            <span className="text-xs text-zinc-500 ml-2">queries cited</span>
          </div>
          <div className="text-xs font-mono text-red-400/80 mt-1">0 source-owned</div>
        </div>

        <div className="text-3xl text-emerald-400/70 font-mono px-4 hidden md:block">→</div>

        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400/70 mb-1">{brand} · after</div>
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-mono font-light text-emerald-300 tabular-nums">{projectedAfter}</span>
            <span className="text-2xl font-mono text-emerald-400/40">/ {total}</span>
            <span className="text-xs text-emerald-400/70 ml-2">queries cited (projected)</span>
          </div>
          <div className="text-xs font-mono text-emerald-300 mt-1">
            {ownedAfter} now source-owned via cited.md
          </div>
        </div>
      </div>
    </section>
  );
}
