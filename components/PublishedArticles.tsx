'use client';

import { useState } from 'react';
import type { PublishResult } from '@/lib/integrations/senso';

export function PublishedArticles({ articles }: { articles: PublishResult[] }) {
  if (!articles.length) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm uppercase tracking-wide text-zinc-500">Published citeables · live on cited.md</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {articles.map((a, i) => (
          <Article key={i} article={a} />
        ))}
      </div>
    </div>
  );
}

function Article({ article }: { article: PublishResult }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-emerald-500/20 rounded-xl bg-emerald-500/[0.03] overflow-hidden">
      <div className="px-5 py-4 flex items-start justify-between gap-3 border-b border-emerald-500/10">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 px-1.5 py-0.5 rounded bg-emerald-500/20">
              live · {article.publishStatus}
            </span>
          </div>
          <a
            href={article.url}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-emerald-100 hover:text-emerald-50 truncate block"
          >
            {article.title}
          </a>
          <a
            href={article.url}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-mono text-emerald-400/70 hover:text-emerald-300 truncate block"
          >
            {article.url.replace('https://', '')} ↗
          </a>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-xs font-mono text-emerald-300 hover:text-emerald-200 px-2 py-1 rounded border border-emerald-500/20 hover:border-emerald-500/40 shrink-0"
        >
          {expanded ? 'collapse' : 'preview'}
        </button>
      </div>
      {expanded && (
        <div className="px-5 py-4 bg-zinc-950/40">
          <pre className="text-[11px] font-mono text-zinc-300 leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-auto">
            {article.markdown}
          </pre>
        </div>
      )}
    </div>
  );
}
