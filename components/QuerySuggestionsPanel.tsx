'use client';

import { useState } from 'react';
import type { PublishResult } from '@/lib/integrations/senso';

type Suggestion = { query: string; rationale: string };

export function QuerySuggestionsPanel({
  brand,
  existingQueries,
  competitors,
  onPublished,
}: {
  brand: string;
  existingQueries: string[];
  competitors: string[];
  onPublished: (newArticles: PublishResult[]) => void;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedUrls, setPublishedUrls] = useState<string[]>([]);

  async function loadSuggestions() {
    setLoading(true);
    setSuggestions([]);
    setSelected(new Set());
    try {
      const r = await fetch('/api/suggest-queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand, existingQueries, competitors }),
      });
      const data = await r.json();
      if (Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions);
        // Pre-select all 5 by default — easy "publish all"
        setSelected(new Set(data.suggestions.map((s: Suggestion) => s.query)));
      }
    } finally {
      setLoading(false);
    }
  }

  function toggle(q: string) {
    const next = new Set(selected);
    if (next.has(q)) next.delete(q); else next.add(q);
    setSelected(next);
  }

  async function publishSelected() {
    if (selected.size === 0) return;
    setPublishing(true);
    try {
      const r = await fetch('/api/publish-additional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand, queries: Array.from(selected) }),
      });
      const data = await r.json();
      if (Array.isArray(data.published)) {
        const articles = data.published as Array<{
          query: string; url: string; contentId: string; title: string; markdown: string;
        }>;
        setPublishedUrls(articles.map(a => a.url));
        // Convert to PublishResult shape for the parent
        onPublished(articles.map(a => ({
          contentId: a.contentId,
          url: a.url,
          title: a.title,
          markdown: a.markdown,
          publishStatus: 'success' as const,
          editorialStatus: 'published',
        })));
      }
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="border border-violet-500/25 rounded-xl overflow-hidden bg-gradient-to-br from-violet-500/[0.05] via-zinc-900/40 to-zinc-900/40">
      <div className="px-6 py-4 border-b border-violet-500/20 flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm uppercase tracking-wide text-zinc-100">Expand coverage — strategic queries</h2>
          <p className="text-xs text-zinc-300 mt-0.5 max-w-2xl">
            GhostWriter proposes 5 high-value queries you should ALSO rank for. Select &amp; publish citeables in one click. Each new citeable is a new shot at narrative control on a query you weren&apos;t even monitoring.
          </p>
        </div>
        {suggestions.length === 0 && (
          <button
            onClick={loadSuggestions}
            disabled={loading}
            className="px-4 py-2 rounded-md border border-violet-500/40 bg-violet-500/[0.1] hover:bg-violet-500/[0.2] text-violet-100 font-mono text-xs transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? 'generating…' : '✦ suggest 5 queries'}
          </button>
        )}
      </div>

      {suggestions.length > 0 && (
        <>
          <div className="divide-y divide-zinc-800/60">
            {suggestions.map((s) => {
              const checked = selected.has(s.query);
              const wasPublished = publishedUrls.length > 0;
              return (
                <label
                  key={s.query}
                  className={`px-6 py-3 flex items-center gap-4 cursor-pointer hover:bg-zinc-900/60 transition-colors ${checked ? 'bg-violet-500/[0.04]' : ''} ${wasPublished ? 'opacity-60 cursor-default' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => !wasPublished && toggle(s.query)}
                    disabled={wasPublished || publishing}
                    className="size-4 rounded border-zinc-600 bg-zinc-900 text-violet-500 focus:ring-violet-500/50 focus:ring-offset-zinc-950 accent-violet-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-zinc-100">{s.query}</div>
                    {s.rationale && (
                      <div className="text-[11px] text-violet-300/80 mt-0.5 font-mono italic">{s.rationale}</div>
                    )}
                  </div>
                </label>
              );
            })}
          </div>

          {publishedUrls.length === 0 ? (
            <div className="px-6 py-4 bg-zinc-950/40 border-t border-zinc-800 flex items-center justify-between gap-3">
              <span className="text-xs font-mono text-zinc-300">
                {selected.size} of {suggestions.length} selected
              </span>
              <button
                onClick={publishSelected}
                disabled={selected.size === 0 || publishing}
                className="px-4 py-2 rounded-md bg-violet-500 hover:bg-violet-400 text-zinc-950 font-semibold text-xs transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {publishing ? `publishing ${selected.size}…` : `✦ publish ${selected.size} citeable${selected.size === 1 ? '' : 's'}`}
              </button>
            </div>
          ) : (
            <div className="px-6 py-4 bg-emerald-500/[0.06] border-t border-emerald-500/30">
              <div className="text-xs font-mono text-emerald-200 mb-2">
                ✓ {publishedUrls.length} new citeable{publishedUrls.length === 1 ? '' : 's'} published
              </div>
              <div className="space-y-1">
                {publishedUrls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-[11px] font-mono text-emerald-300 hover:text-emerald-100 truncate"
                  >
                    {url.replace('https://', '')} ↗
                  </a>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {suggestions.length === 0 && !loading && (
        <div className="px-6 py-5 text-xs text-zinc-400 font-mono space-y-1">
          <p>Click <span className="text-violet-300">suggest 5 queries</span> to let the agent identify high-value queries you should own — comparison, buyer-intent, integration, industry-defining.</p>
        </div>
      )}
    </div>
  );
}
