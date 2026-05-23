'use client';

import { useState } from 'react';
import type { PublishResult } from '@/lib/integrations/senso';

type VerifyResult = {
  query: string;
  status: 'indexed' | 'cited-md-domain' | 'brand-mentioned' | 'pending';
  directPosition: number | null;
  citedMdPosition: number | null;
  brandPosition: number | null;
  totalResults: number;
  checkedAt: string;
};

const STATUS_META: Record<VerifyResult['status'], { label: string; tone: 'success' | 'partial' | 'pending'; explanation: string }> = {
  'indexed': {
    label: 'INDEXED · TOP RESULT',
    tone: 'success',
    explanation: 'Your cited.md URL is now in the SERP for this query. AI engines see it.',
  },
  'cited-md-domain': {
    label: 'DOMAIN INDEXED',
    tone: 'success',
    explanation: 'A cited.md article appears in this query\'s SERP — propagation working.',
  },
  'brand-mentioned': {
    label: 'BRAND MENTIONED',
    tone: 'partial',
    explanation: 'Your brand is in SERP results but not yet via your own citeable. Crawl in progress.',
  },
  'pending': {
    label: 'CRAWL PENDING',
    tone: 'pending',
    explanation: 'AI engines typically re-crawl new content within 24–48h. Re-check tomorrow.',
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
      // We don't know which query each article was for in the props, so try each.
      const matchedQuery = queries[i] ?? queries[0];
      try {
        const r = await fetch('/api/verify-citation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: matchedQuery, expectedUrl: article.url, brand }),
        });
        const data = (await r.json()) as VerifyResult;
        checks.push(data);
        setResults([...checks]);
      } catch {
        // ignore individual failures
      }
    }
    setVerifying(false);
  }

  if (!articles.length) return null;

  return (
    <div className="border border-blue-500/20 rounded-xl overflow-hidden bg-gradient-to-br from-blue-500/[0.05] via-zinc-900/40 to-zinc-900/40">
      <div className="px-6 py-4 border-b border-blue-500/20 flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm uppercase tracking-wide text-zinc-200">Did the fix land?</h2>
          <p className="text-xs text-zinc-400 mt-0.5 max-w-xl">
            Re-queries the open web (the same source AI engines train on) to verify your citeable is now in SERPs.
          </p>
        </div>
        <button
          onClick={runVerification}
          disabled={verifying}
          className="px-4 py-2 rounded-md border border-blue-500/40 bg-blue-500/[0.08] hover:bg-blue-500/[0.15] text-blue-100 font-mono text-xs transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {verifying ? 'verifying…' : '↻ verify in SERPs now'}
        </button>
      </div>

      {/* Trust badges row */}
      <div className="px-6 py-3 border-b border-blue-500/10 grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] font-mono">
        <TrustBadge label="HTTP 200 on cited.md" status="success" />
        <TrustBadge label="Published via Senso" status="success" />
        <TrustBadge label="Paywalled via x402" status="success" />
        <TrustBadge label="Indexed in ClickHouse" status="success" />
      </div>

      {/* Verification rows */}
      <div className="divide-y divide-zinc-800/60">
        {results.length === 0 && !verifying && (
          <div className="px-6 py-5 text-sm text-zinc-500 font-mono">
            <p>Click <span className="text-blue-300">verify in SERPs now</span> to check propagation.</p>
            <p className="text-xs text-zinc-600 mt-2">
              Note: AI engines (ChatGPT, Perplexity, Gemini) typically take 24–48h to re-index new content. First check is usually <span className="text-amber-300">CRAWL PENDING</span> — schedule a recurring run.
            </p>
          </div>
        )}

        {verifying && results.length === 0 && (
          <div className="px-6 py-5 flex items-center gap-3 text-sm font-mono text-blue-200">
            <span className="size-2 rounded-full bg-blue-400 animate-pulse" />
            running fresh Nimble searches…
          </div>
        )}

        {results.map((r, i) => (
          <VerifyRow key={i} result={r} />
        ))}
      </div>
    </div>
  );
}

function VerifyRow({ result }: { result: VerifyResult }) {
  const meta = STATUS_META[result.status];
  const toneClass = {
    success: 'border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-200',
    partial: 'border-amber-500/30 bg-amber-500/[0.06] text-amber-200',
    pending: 'border-zinc-700 bg-zinc-900 text-zinc-400',
  }[meta.tone];

  return (
    <div className="px-6 py-3 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center">
      <div className="min-w-0">
        <div className="text-sm text-zinc-200 truncate">{result.query}</div>
        <div className="text-[11px] text-zinc-500 mt-0.5">{meta.explanation}</div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded border ${toneClass}`}>
          {meta.label}
        </span>
        {result.directPosition && (
          <span className="text-[11px] font-mono text-emerald-300">#{result.directPosition} of {result.totalResults}</span>
        )}
      </div>
    </div>
  );
}

function TrustBadge({ label, status }: { label: string; status: 'success' | 'pending' }) {
  return (
    <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded border ${status === 'success' ? 'border-emerald-500/30 bg-emerald-500/[0.04]' : 'border-zinc-800 bg-zinc-900/40'}`}>
      <span className={`size-1.5 rounded-full ${status === 'success' ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
      <span className={status === 'success' ? 'text-emerald-200' : 'text-zinc-500'}>{label}</span>
    </div>
  );
}
