'use client';

import { useEffect, useState } from 'react';
import type { PublishResult } from '@/lib/integrations/senso';

type SignalStatus = 'ok' | 'pending' | 'fail';

type VerifyResult = {
  query: string;
  expectedUrl: string;
  brand?: string;
  signals: {
    articleLive: SignalStatus;
    articleHasBrand: SignalStatus;
    brandInSerp: SignalStatus;
    citeableIndexed: SignalStatus;
  };
  positions: {
    direct: number | null;
    citedMd: number | null;
    brand: number | null;
  };
  totalResults: number;
  checkedAt: string;
};

const SIGNAL_LABELS: Record<keyof VerifyResult['signals'], { label: string; sub: string }> = {
  articleLive: {
    label: 'Article reachable on cited.md',
    sub: 'HTTP 200 OK · public URL',
  },
  articleHasBrand: {
    label: 'Brand present in the article',
    sub: 'fetched body contains your brand name',
  },
  brandInSerp: {
    label: 'Brand visible in fresh SERP',
    sub: 'Nimble search returns brand in results',
  },
  citeableIndexed: {
    label: 'cited.md URL indexed in SERP',
    sub: 'expected in 24–48h · re-crawl cycle',
  },
};

export function VerificationPanel({
  articles,
  brand,
  queries,
}: {
  articles: PublishResult[];
  brand: string;
  queries: string[];
}) {
  const [verifying, setVerifying] = useState(false);
  const [results, setResults] = useState<VerifyResult[]>([]);

  async function runVerification() {
    if (!articles.length) return;
    setVerifying(true);
    setResults([]);
    const checks: VerifyResult[] = [];
    for (let i = 0; i < Math.min(articles.length, queries.length); i++) {
      const article = articles[i];
      const q = queries[i] ?? queries[0];
      try {
        const r = await fetch('/api/verify-citation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q, expectedUrl: article.url, brand }),
        });
        const data = (await r.json()) as VerifyResult;
        checks.push(data);
        setResults([...checks]);
      } catch { /* ignore */ }
    }
    setVerifying(false);
  }

  // Auto-run once on mount so the panel shows verified state immediately.
  useEffect(() => {
    if (articles.length && results.length === 0 && !verifying) {
      runVerification();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articles.length]);

  if (!articles.length) return null;

  // Aggregate signals across all articles for the top-line trust badges.
  const aggregate = aggregateSignals(results);

  return (
    <div className="border border-blue-500/25 rounded-xl overflow-hidden bg-gradient-to-br from-blue-500/[0.06] via-zinc-900/40 to-zinc-900/40">
      <div className="px-6 py-4 border-b border-blue-500/20 flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm uppercase tracking-wide text-zinc-100">Did the fix actually land?</h2>
          <p className="text-xs text-zinc-300 mt-0.5 max-w-2xl leading-relaxed">
            Four parallel checks per citeable. Green = confirmed. Pending = expected for the SERP crawl signal (24–48h is normal; recurring runs catch it).
          </p>
        </div>
        <button
          onClick={runVerification}
          disabled={verifying}
          className="px-4 py-2 rounded-md border border-blue-500/40 bg-blue-500/[0.1] hover:bg-blue-500/[0.18] text-blue-100 font-mono text-xs transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {verifying ? 'verifying…' : '↻ re-check now'}
        </button>
      </div>

      {/* Aggregate trust badges row */}
      <div className="px-6 py-3 border-b border-blue-500/15 grid grid-cols-2 md:grid-cols-4 gap-3">
        <AggregateBadge name="Article live" status={aggregate.articleLive} />
        <AggregateBadge name="Brand in article" status={aggregate.articleHasBrand} />
        <AggregateBadge name="Brand in SERP" status={aggregate.brandInSerp} />
        <AggregateBadge name="URL indexed" status={aggregate.citeableIndexed} />
      </div>

      {/* Per-article breakdown */}
      <div className="divide-y divide-zinc-800/60">
        {verifying && results.length === 0 && (
          <div className="px-6 py-5 flex items-center gap-3 text-sm font-mono text-blue-200">
            <span className="size-2 rounded-full bg-blue-400 animate-pulse" />
            running 4 parallel checks per citeable…
          </div>
        )}

        {results.map((r, i) => (
          <article key={i} className="px-6 py-4 space-y-3">
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="text-sm text-zinc-100 truncate">{r.query}</div>
                <a
                  href={r.expectedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-mono text-blue-300/80 hover:text-blue-200 truncate block"
                >
                  {r.expectedUrl.replace('https://', '')} ↗
                </a>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <SignalRow status={r.signals.articleLive} {...SIGNAL_LABELS.articleLive} />
              <SignalRow status={r.signals.articleHasBrand} {...SIGNAL_LABELS.articleHasBrand} />
              <SignalRow
                status={r.signals.brandInSerp}
                label={SIGNAL_LABELS.brandInSerp.label}
                sub={r.positions.brand ? `position #${r.positions.brand} of ${r.totalResults}` : SIGNAL_LABELS.brandInSerp.sub}
              />
              <SignalRow
                status={r.signals.citeableIndexed}
                label={SIGNAL_LABELS.citeableIndexed.label}
                sub={r.positions.citedMd ? `cited.md at #${r.positions.citedMd}` : SIGNAL_LABELS.citeableIndexed.sub}
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function aggregateSignals(results: VerifyResult[]) {
  const init = { articleLive: 'pending', articleHasBrand: 'pending', brandInSerp: 'pending', citeableIndexed: 'pending' } as Record<keyof VerifyResult['signals'], SignalStatus>;
  if (results.length === 0) return init;
  // For each signal: ok if ANY article has it ok; fail if ALL fail; pending otherwise.
  const keys = Object.keys(init) as Array<keyof VerifyResult['signals']>;
  for (const key of keys) {
    const statuses = results.map(r => r.signals[key]);
    if (statuses.some(s => s === 'ok')) init[key] = 'ok';
    else if (statuses.every(s => s === 'fail')) init[key] = 'fail';
    else init[key] = 'pending';
  }
  return init;
}

function AggregateBadge({ name, status }: { name: string; status: SignalStatus }) {
  const cls = {
    ok: 'border-emerald-500/40 bg-emerald-500/[0.08] text-emerald-200',
    pending: 'border-amber-500/30 bg-amber-500/[0.06] text-amber-200',
    fail: 'border-red-500/40 bg-red-500/[0.08] text-red-200',
  }[status];
  const dot = {
    ok: 'bg-emerald-400',
    pending: 'bg-amber-400',
    fail: 'bg-red-400',
  }[status];
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[11px] font-mono ${cls}`}>
      <span className={`size-1.5 rounded-full ${dot}`} />
      <span>{name}</span>
    </div>
  );
}

function SignalRow({ status, label, sub }: { status: SignalStatus; label: string; sub: string }) {
  const cls = {
    ok: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/[0.04]', icon: '✓', iconCls: 'bg-emerald-500/30 text-emerald-200', text: 'text-emerald-100' },
    pending: { border: 'border-amber-500/20', bg: 'bg-amber-500/[0.03]', icon: '◌', iconCls: 'bg-amber-500/20 text-amber-300', text: 'text-amber-100' },
    fail: { border: 'border-red-500/30', bg: 'bg-red-500/[0.04]', icon: '✗', iconCls: 'bg-red-500/30 text-red-200', text: 'text-red-100' },
  }[status];
  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-md border ${cls.border} ${cls.bg}`}>
      <div className={`size-6 rounded flex items-center justify-center text-sm font-mono ${cls.iconCls} shrink-0`}>
        {cls.icon}
      </div>
      <div className="min-w-0">
        <div className={`text-xs font-medium ${cls.text} truncate`}>{label}</div>
        <div className="text-[10px] font-mono text-zinc-400 truncate">{sub}</div>
      </div>
    </div>
  );
}
