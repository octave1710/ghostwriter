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
import { QuerySuggestionsPanel } from './QuerySuggestionsPanel';
import type { RunResult } from '@/lib/agent/loop';
import type { PublishResult } from '@/lib/integrations/senso';

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
  const [additional, setAdditional] = useState<PublishResult[]>([]);
  const [series, setSeries] = useState<SeriesPoint[]>(initialSeries);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const competitors = competitorsText.split(',').map(c => c.trim()).filter(Boolean);
  const queriesArr = queriesText.split('\n').map(q => q.trim()).filter(Boolean);

  async function refreshSeries(brandName: string) {
    try {
      const r = await fetch(`/api/narrative-control?brand=${encodeURIComponent(brandName)}`);
      const data = await r.json();
      if (Array.isArray(data.series)) setSeries(data.series);
    } catch { /* swallow */ }
  }

  useEffect(() => {
    if (series.length === 0) refreshSeries(defaultBrand);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function deploy() {
    setError(null);
    setResult(null);
    setAdditional([]);
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
        body: JSON.stringify({ brand, queries: queriesArr, competitors }),
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

  function onAdditionalPublished(newArticles: PublishResult[]) {
    setAdditional(prev => [...prev, ...newArticles]);
    startTransition(() => refreshSeries(brand));
  }

  const running = phase !== 'idle' && phase !== 'done' && phase !== 'error';
  const hasRun = phase === 'done' || phase === 'error';

  const isBarFilled = (p: Phase) => {
    if (phase === 'done') return true;
    if (phase === 'idle' || phase === 'error') return false;
    return PHASE_ORDER.indexOf(phase) >= PHASE_ORDER.indexOf(p);
  };

  const allPublished = result ? [...result.published, ...additional] : [];

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 relative">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-[480px] bg-gradient-to-b from-emerald-500/[0.04] via-zinc-950/0 to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8 relative">

        {/* ─── Header ─── */}
        <header className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-5xl md:text-6xl font-semibold tracking-tight gw-gradient-text">
              GhostWriter
            </h1>
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/[0.08]">
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex size-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full size-2 bg-emerald-400" />
              </span>
              <span className="text-[11px] font-mono text-emerald-200 tracking-wide">live · base-sepolia</span>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">v0.1 · NYC hackathon</span>
          </div>
          <p className="text-zinc-300 text-base md:text-lg max-w-3xl leading-relaxed">
            Autonomous GEO agent. <span className="text-emerald-300">Monitor</span> AI search · <span className="text-emerald-300">detect</span> citation gaps · <span className="text-emerald-300">publish</span> grounded citeables · <span className="text-emerald-300">measure</span> the lift · <span className="text-emerald-300">monetize</span> via agent payments. <span className="text-zinc-500">One trigger, full loop.</span>
          </p>
        </header>

        {/* ─── Form ─── */}
        <section className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/40 space-y-4 backdrop-blur-sm">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <h2 className="text-xs uppercase tracking-wider text-zinc-300 font-mono font-semibold">Configure run</h2>
            <span className="text-[11px] font-mono text-zinc-400">
              pre-loaded with Resend — edit any field for your own brand
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-end">
            <div className="space-y-3 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono">Brand</span>
                  <input
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                    disabled={running}
                    className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-sm focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono">Competitors</span>
                  <input
                    value={competitorsText}
                    onChange={e => setCompetitorsText(e.target.value)}
                    disabled={running}
                    placeholder="comma, separated"
                    className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-sm focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </label>
              </div>
              <label className="block space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono">Queries (one per line)</span>
                <textarea
                  value={queriesText}
                  onChange={e => setQueriesText(e.target.value)}
                  disabled={running}
                  rows={5}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-sm focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
                />
              </label>
            </div>
            <button
              onClick={deploy}
              disabled={running}
              className="px-6 py-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shrink-0 transition-all text-sm whitespace-nowrap shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.02]"
            >
              {running ? 'Running…' : '▶ Deploy Agent'}
            </button>
          </div>
        </section>

        {/* ─── Run status ─── */}
        {(running || hasRun) && (
          <section className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/40 space-y-3 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <span className={`size-2 rounded-full ${running ? 'bg-emerald-400 animate-pulse' : phase === 'error' ? 'bg-red-500' : 'bg-emerald-400'}`} />
              <span className="font-mono text-sm text-zinc-100">{PHASE_LABEL[phase]}</span>
              {result && phase === 'done' && (
                <span className="text-xs font-mono text-zinc-400 ml-auto">
                  finished in {(result.durationMs / 1000).toFixed(1)}s · {result.trace.length} spans
                </span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {PHASE_ORDER.map((p) => (
                <div key={p} className={`h-1 rounded-full transition-colors ${isBarFilled(p) ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
              ))}
            </div>
            <div className="grid grid-cols-4 gap-1.5 text-[10px] uppercase tracking-wider font-mono text-zinc-500">
              <span className={isBarFilled('monitoring') ? 'text-emerald-300' : ''}>monitor</span>
              <span className={isBarFilled('detecting') ? 'text-emerald-300' : ''}>detect</span>
              <span className={isBarFilled('publishing') ? 'text-emerald-300' : ''}>publish</span>
              <span className={isBarFilled('measuring') ? 'text-emerald-300' : ''}>measure</span>
            </div>
            {error && <p className="text-sm text-red-400 font-mono pt-2">{error}</p>}
          </section>
        )}

        {/* ─── HERO impact ─── */}
        {result && <HeroImpact result={result} brand={brand} additional={additional.length} />}

        {/* ─── 01 · MONITORING ─── */}
        {result && (
          <>
            <SectionHeader
              n="01"
              total="07"
              kicker="Monitor"
              title="What AI engines were saying"
              description="Live snapshot of citations across your monitored queries — before the agent acted. Nimble pulls the same SERP that ChatGPT, Perplexity, Gemini, Google AIO and Claude.ai train on."
              tone="blue"
            />
            <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5">
              <MonitoringPanel brand={brand} competitors={competitors} results={result.monitorResults} />
              <CompetitiveLeaderboard
                brand={brand}
                competitors={competitors}
                results={result.monitorResults}
                publishedCount={result.published.length + additional.length}
              />
            </div>
          </>
        )}

        {/* ─── 02 · ACTION ─── */}
        {result && (
          <SectionHeader
            n="02"
            total="07"
            kicker="Act"
            title="What the agent did about it"
            description={`${result.gaps.length} citation gap${result.gaps.length === 1 ? '' : 's'} detected → ${result.published.length} grounded citeable${result.published.length === 1 ? '' : 's'} auto-published to cited.md. Each one is a real URL AI engines can crawl.`}
            tone="emerald"
          />
        )}
        {result && allPublished.length > 0 && <PublishedArticles articles={allPublished} />}
        {result && (
          <div className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/40 backdrop-blur-sm">
            <div className="flex items-baseline justify-between mb-2">
              <h3 className="text-xs uppercase tracking-wider font-mono text-zinc-300 font-semibold">Narrative control · trend</h3>
              <span className="text-[11px] text-zinc-400 font-mono">brand={brand}</span>
            </div>
            <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
              % of monitored queries source-owned via cited.md, across all runs. Flat at 0% before the agent shipped · vertical spike after.
            </p>
            <div className="h-[260px]">
              <NarrativeChart series={series} />
            </div>
          </div>
        )}

        {/* ─── 03 · EXPAND coverage (NEW) ─── */}
        {result && (
          <>
            <SectionHeader
              n="03"
              total="07"
              kicker="Expand"
              title="Cover queries you weren't even thinking about"
              description="The agent identifies 5 high-value queries you should ALSO rank for — comparison, buyer-intent, integration, industry-defining. Select & publish citeables in one click. Each new citeable is a fresh shot at narrative control."
              tone="violet"
            />
            <QuerySuggestionsPanel
              brand={brand}
              existingQueries={queriesArr}
              competitors={competitors}
              onPublished={onAdditionalPublished}
            />
          </>
        )}

        {/* ─── 04 · AI ENGINE IMPACT ─── */}
        {result && (
          <>
            <SectionHeader
              n="04"
              total="07"
              kicker="Measure"
              title="How AI engines now answer"
              description="Same query, before vs after your citeable hits the web. The proof that GEO actually moves."
              tone="emerald"
            />
            <AIResponsePanel sim={result.aiResponseSimulation} />
          </>
        )}

        {/* ─── 05 · VERIFY ─── */}
        {result && allPublished.length > 0 && (
          <>
            <SectionHeader
              n="05"
              total="07"
              kicker="Verify"
              title="Did the fix actually land?"
              description="Re-queries the open web (the same source AI engines train on) to confirm your citeable is now in SERPs. Honest read — most first checks return CRAWL PENDING (24-48h propagation)."
              tone="blue"
            />
            <VerificationPanel
              articles={allPublished}
              brand={brand}
              queries={[...result.gaps.map(g => g.query), ...additional.map((_, i) => additional[i]?.title || '')].filter(Boolean)}
            />
          </>
        )}

        {/* ─── 06 · MONETIZE ─── */}
        {result && allPublished.length > 0 && (
          <>
            <SectionHeader
              n="06"
              total="07"
              kicker="Earn"
              title="Monetize the source · YOU earn"
              description={`Each citeable is paywalled via x402. Every read by another AI agent pays $0.01 USDC to YOUR wallet. New revenue stream + credibility signal back to AI engines.`}
              tone="cyan"
            />
            <X402Panel articles={allPublished} />
          </>
        )}

        {/* ─── 07 · NEXT MOVES ─── */}
        {result && (
          <>
            <SectionHeader
              n="07"
              total="07"
              kicker="Compound"
              title="Next moves beyond publishing"
              description="What else compounds AI search visibility — scheduling, FAQ schema, sentiment tracking, partner integrations."
              tone="zinc"
            />
            <OptimizationsPanel result={result} brand={brand} competitors={competitors} />
          </>
        )}

        {/* ─── Trace (collapsed) ─── */}
        {result && (
          <details className="group">
            <summary className="cursor-pointer text-xs uppercase tracking-wider font-mono text-zinc-400 hover:text-zinc-200 select-none flex items-center gap-2 py-3">
              <span className="text-zinc-600 group-open:rotate-90 transition-transform inline-block">▶</span>
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
        <footer className="text-xs font-mono space-y-1 pt-6 border-t border-zinc-800">
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-zinc-400">
            <span className="text-zinc-500">6 sponsors:</span>
            <span>Nimble</span>·<span>Senso</span>·<span>ClickHouse</span>·<span>Datadog</span>·<span>OpenAI</span>·<span>x402</span>
          </div>
          <div className="text-zinc-500">
            <a href="/api/health" className="hover:text-zinc-300">/api/health</a> ·{' '}
            <a href={`/api/narrative-control?brand=${brand}`} className="hover:text-zinc-300">/api/narrative-control</a> ·{' '}
            <a href={`/api/query-content?id=${result?.published[0]?.contentId ?? 'x'}`} className="hover:text-zinc-300">/api/query-content (x402)</a> ·{' '}
            <a href="https://github.com/octave1710/ghostwriter" target="_blank" rel="noreferrer" className="hover:text-zinc-300">source ↗</a>
          </div>
        </footer>
      </div>
    </main>
  );
}

function SectionHeader({
  n,
  total,
  kicker,
  title,
  description,
  tone,
}: {
  n: string;
  total: string;
  kicker: string;
  title: string;
  description: string;
  tone: 'emerald' | 'blue' | 'violet' | 'cyan' | 'zinc';
}) {
  const toneClasses = {
    emerald: { num: 'text-emerald-300', border: 'border-emerald-500/30', kicker: 'text-emerald-300', accent: 'bg-emerald-500' },
    blue: { num: 'text-blue-300', border: 'border-blue-500/30', kicker: 'text-blue-300', accent: 'bg-blue-500' },
    violet: { num: 'text-violet-300', border: 'border-violet-500/30', kicker: 'text-violet-300', accent: 'bg-violet-500' },
    cyan: { num: 'text-cyan-300', border: 'border-cyan-500/30', kicker: 'text-cyan-300', accent: 'bg-cyan-500' },
    zinc: { num: 'text-zinc-300', border: 'border-zinc-700', kicker: 'text-zinc-300', accent: 'bg-zinc-500' },
  }[tone];

  return (
    <div className="pt-6 pb-1">
      <div className="flex items-start gap-5">
        <div className={`flex flex-col items-center shrink-0`}>
          <div className={`text-3xl font-mono font-light tabular-nums ${toneClasses.num} leading-none`}>
            {n}
          </div>
          <div className="text-[9px] font-mono text-zinc-600 tabular-nums mt-1">/ {total}</div>
          <div className={`mt-2 w-px h-8 ${toneClasses.accent} opacity-60`} />
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <div className={`text-[10px] font-mono uppercase tracking-[0.2em] ${toneClasses.kicker} mb-1.5`}>{kicker}</div>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-zinc-50 mb-1">{title}</h2>
          <p className="text-sm text-zinc-300 max-w-3xl leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

function HeroImpact({ result, brand, additional }: { result: RunResult; brand: string; additional: number }) {
  const total = result.monitorResults.length;
  const citedBefore = result.monitorResults.filter(m => m.brandCited).length;
  const newCitations = result.gaps.length + additional;
  const projectedAfter = Math.min(total + additional, citedBefore + newCitations);
  const totalAfter = total + additional;

  return (
    <section className="border border-emerald-500/30 rounded-xl p-6 bg-gradient-to-br from-emerald-500/[0.1] via-zinc-900/40 to-zinc-900/40 overflow-hidden relative">
      <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-emerald-500/[0.06] to-transparent pointer-events-none" />
      <div className="absolute -top-20 -right-20 size-64 rounded-full bg-emerald-500/[0.08] blur-3xl pointer-events-none" />

      <div className="relative grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 mb-2">{brand} · before</div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl md:text-6xl font-mono font-light text-zinc-300 tabular-nums">{citedBefore}</span>
            <span className="text-2xl font-mono text-zinc-500">/ {total}</span>
            <span className="text-xs text-zinc-400 ml-2">queries cited</span>
          </div>
          <div className="text-xs font-mono text-red-400 mt-2 flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-red-400" />
            0 source-owned
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="text-4xl text-emerald-400 font-mono px-2">→</div>
        </div>

        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-300 mb-2">{brand} · after</div>
          <div className="flex items-baseline gap-2">
            <span className="text-6xl md:text-7xl font-mono font-light text-emerald-300 tabular-nums">{projectedAfter}</span>
            <span className="text-2xl font-mono text-emerald-400/60">/ {totalAfter}</span>
          </div>
          <div className="text-xs font-mono text-emerald-300 mt-2 flex items-center gap-2 flex-wrap">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {newCitations} now source-owned via cited.md
            {additional > 0 && <span className="text-violet-300">· +{additional} expanded coverage</span>}
          </div>
        </div>
      </div>
    </section>
  );
}
