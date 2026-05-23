'use client';

import type { AIResponseSimulation } from '@/lib/agent/loop';
import { AI_ENGINES } from './AIEngineLogos';

export function AIResponsePanel({ sim }: { sim: AIResponseSimulation | null }) {
  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/40">
      {/* AI engines coverage strip with real logos */}
      <div className="px-6 py-4 border-b border-zinc-800 bg-blue-500/[0.05]">
        <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
          <span className="text-[10px] font-mono uppercase tracking-wider text-blue-200">Coverage · monitored AI engines</span>
          <span className="text-[10px] font-mono text-zinc-400">re-crawl every 24–48h</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {AI_ENGINES.map(e => (
            <div
              key={e.name}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs ${
                e.status === 'simulated'
                  ? 'border-amber-500/30 bg-amber-500/[0.06]'
                  : 'border-blue-500/30 bg-blue-500/[0.08]'
              }`}
              title={e.sub}
            >
              <e.Logo size={16} />
              <span className={e.status === 'simulated' ? 'text-amber-100' : 'text-blue-100'}>
                {e.name}
              </span>
              <span className="text-[9px] font-mono text-zinc-400">{e.status}</span>
            </div>
          ))}
        </div>
      </div>

      {!sim ? (
        <div className="px-6 py-6">
          <h2 className="text-sm uppercase tracking-wide text-zinc-200 mb-1">AI engine impact preview</h2>
          <p className="text-sm text-zinc-400">
            After the loop runs, this panel shows the same query answered by an AI engine — before vs after your citeable hits the web. Real proof.
          </p>
        </div>
      ) : (
        <>
          <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
            <div className="flex items-baseline gap-3 mb-1 flex-wrap">
              <h2 className="text-sm uppercase tracking-wide text-zinc-100">AI engine response · before vs after</h2>
              <span className="text-[10px] font-mono text-amber-300">simulated · gpt-4o-mini roleplay</span>
            </div>
            <p className="text-sm text-zinc-300">
              Query: <span className="font-mono text-zinc-100">&ldquo;{sim.query}&rdquo;</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-800">
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-300 px-1.5 py-0.5 rounded bg-zinc-800">before</span>
                <span className="text-xs text-zinc-400">AI cites third-party blogs &amp; competitors</span>
              </div>
              <p className="text-sm leading-relaxed text-zinc-200 whitespace-pre-wrap">{renderMarkdownLinks(sim.before)}</p>
            </div>

            <div className="p-6 space-y-3 bg-emerald-500/[0.04]">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-100 px-1.5 py-0.5 rounded bg-emerald-500/30">after</span>
                <span className="text-xs text-emerald-300">AI cites your cited.md article</span>
              </div>
              <p className="text-sm leading-relaxed text-zinc-50 whitespace-pre-wrap">{renderMarkdownLinks(sim.after)}</p>
            </div>
          </div>

          <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-950/60 text-xs font-mono text-zinc-300">
            published citeable that flipped the answer →{' '}
            <a href={sim.citationUrl} target="_blank" rel="noreferrer" className="text-emerald-300 hover:text-emerald-200 underline decoration-emerald-500/40">
              {sim.citationUrl.replace('https://', '')}
            </a>
          </div>
        </>
      )}
    </div>
  );
}

function renderMarkdownLinks(text: string) {
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIdx) parts.push(text.slice(lastIdx, m.index));
    parts.push(
      <a
        key={m.index}
        href={m[2]}
        target="_blank"
        rel="noreferrer"
        className="text-emerald-300 hover:text-emerald-200 underline decoration-emerald-500/40"
      >
        {m[1]}
      </a>,
    );
    lastIdx = re.lastIndex;
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx));
  return parts;
}
