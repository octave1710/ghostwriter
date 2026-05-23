'use client';

import type { TraceStep } from '@/lib/agent/loop';

const KIND_COLOR: Record<TraceStep['kind'], string> = {
  workflow: 'bg-cyan-400',
  tool: 'bg-emerald-400',
  llm: 'bg-amber-400',
};

const KIND_LABEL: Record<TraceStep['kind'], string> = {
  workflow: 'WORKFLOW',
  tool: 'TOOL',
  llm: 'LLM',
};

export function TracePanel({
  steps,
  runId,
  durationMs,
  ddSite,
  mlApp,
}: {
  steps: TraceStep[];
  runId?: string;
  durationMs?: number;
  ddSite: string;
  mlApp: string;
}) {
  if (!steps.length) {
    return (
      <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/40">
        <h2 className="text-sm uppercase tracking-wide text-zinc-500 mb-2">Datadog LLM Observability trace</h2>
        <p className="text-zinc-600 font-mono text-sm">Trace populates after the agent runs.</p>
      </div>
    );
  }

  const totalMs = steps.reduce((s, x) => s + x.durationMs, 0);
  const ddUrl = `https://app.${ddSite}/llm/traces?query=ml_app%3A${encodeURIComponent(mlApp)}`;

  return (
    <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/40 space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm uppercase tracking-wide text-zinc-500">Datadog LLM Observability trace</h2>
        <a
          href={ddUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-mono text-cyan-400 hover:text-cyan-300 underline decoration-cyan-500/30"
        >
          open in Datadog ↗
        </a>
      </div>

      <div className="flex items-baseline gap-4 text-xs font-mono">
        {runId && <span className="text-zinc-500">run={<span className="text-zinc-300">{runId}</span>}</span>}
        <span className="text-zinc-500">{steps.length} spans</span>
        {durationMs !== undefined && <span className="text-zinc-500">{durationMs.toLocaleString()}ms total</span>}
      </div>

      <div className="space-y-1.5">
        {steps.map((s, i) => {
          const pct = totalMs > 0 ? Math.max(2, Math.round((s.durationMs / totalMs) * 100)) : 0;
          const failed = s.status === 'fail';
          return (
            <div key={i} className="grid grid-cols-[80px_120px_1fr_60px] gap-3 items-center text-xs font-mono">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium text-zinc-950 ${KIND_COLOR[s.kind]}`}>
                {KIND_LABEL[s.kind]}
              </span>
              <span className={`truncate ${failed ? 'text-red-400' : 'text-zinc-300'}`}>{s.name}</span>
              <div className="relative h-2 bg-zinc-900 rounded overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 ${failed ? 'bg-red-500/60' : KIND_COLOR[s.kind] + '/40'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-right text-zinc-500 tabular-nums">{s.durationMs}ms</span>
            </div>
          );
        })}
      </div>

      {/* Meta inspector — collapsed list of key/val per step that has meta */}
      <details className="text-xs font-mono text-zinc-500">
        <summary className="cursor-pointer hover:text-zinc-400">step metadata</summary>
        <pre className="mt-2 p-3 bg-zinc-950/60 rounded overflow-auto text-[10px] leading-relaxed">
          {JSON.stringify(steps.filter(s => s.meta).map(s => ({ name: s.name, ...s.meta })), null, 2)}
        </pre>
      </details>
    </div>
  );
}
