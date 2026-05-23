'use client';

import type { AIResponseSimulation } from '@/lib/agent/loop';

export function AIResponsePanel({ sim }: { sim: AIResponseSimulation | null }) {
  if (!sim) {
    return (
      <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/40">
        <div className="flex items-baseline gap-3 mb-2">
          <h2 className="text-sm uppercase tracking-wide text-zinc-500">AI engine impact preview</h2>
          <span className="text-xs font-mono text-zinc-700">awaiting run</span>
        </div>
        <p className="text-zinc-600 font-mono text-sm">
          After the loop runs, this panel shows the same query answered by an AI engine — before vs after GhostWriter publishes the citeable. The proof.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/40">
      <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
        <div className="flex items-baseline gap-3 mb-1">
          <h2 className="text-sm uppercase tracking-wide text-zinc-300">AI engine impact preview</h2>
          <span className="text-xs font-mono text-emerald-400/80">simulated · gpt-4o-mini</span>
        </div>
        <p className="text-sm text-zinc-400">
          Query: <span className="font-mono text-zinc-200">&ldquo;{sim.query}&rdquo;</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-800">
        <div className="p-6 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 px-1.5 py-0.5 rounded bg-zinc-800">before</span>
            <span className="text-xs text-zinc-500">AI cites third-party blogs &amp; competitors</span>
          </div>
          <p className="text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">{renderMarkdownLinks(sim.before)}</p>
        </div>

        <div className="p-6 space-y-3 bg-emerald-500/[0.025]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-200 px-1.5 py-0.5 rounded bg-emerald-500/30">after</span>
            <span className="text-xs text-emerald-400/80">AI cites your cited.md article</span>
          </div>
          <p className="text-sm leading-relaxed text-zinc-100 whitespace-pre-wrap">{renderMarkdownLinks(sim.after)}</p>
        </div>
      </div>

      <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-950/60 text-xs font-mono text-zinc-500">
        published citeable that flipped the answer →{' '}
        <a href={sim.citationUrl} target="_blank" rel="noreferrer" className="text-emerald-400 hover:text-emerald-300 underline decoration-emerald-500/30">
          {sim.citationUrl.replace('https://', '')}
        </a>
      </div>
    </div>
  );
}

// Minimal markdown link renderer: turns [label](url) into a real <a>.
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
