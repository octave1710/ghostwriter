'use client';

import type { MonitorResult } from '@/lib/integrations/nimble';

export function MonitoringPanel({
  brand,
  competitors,
  results,
}: {
  brand: string;
  competitors: string[];
  results: MonitorResult[];
}) {
  if (!results.length) return null;

  const allBrands = [brand, ...competitors];

  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/40">
      <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/60 flex items-baseline justify-between">
        <div>
          <h2 className="text-sm uppercase tracking-wide text-zinc-300">AI search visibility</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Who AI engines cite for each of your queries · live from Nimble</p>
        </div>
        <span className="text-[11px] font-mono text-zinc-500">{results.length} queries</span>
      </div>

      <div className="divide-y divide-zinc-800/60">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_auto] gap-4 px-6 py-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
          <span>query</span>
          <div className="flex gap-1">
            {allBrands.map((b, i) => (
              <span key={b} className={`w-16 text-center ${i === 0 ? 'text-emerald-400/70' : ''}`}>
                {b}
              </span>
            ))}
          </div>
        </div>

        {results.map((r) => (
          <div key={r.query} className="grid grid-cols-[1fr_auto] gap-4 px-6 py-2.5 items-center hover:bg-zinc-900/50">
            <div className="min-w-0">
              <div className="text-sm text-zinc-200 truncate">{r.query}</div>
              {r.topCitedSource && (
                <div className="text-[10px] font-mono text-zinc-500 mt-0.5">top source: {r.topCitedSource}</div>
              )}
            </div>
            <div className="flex gap-1">
              {allBrands.map((b, i) => {
                const isBrand = i === 0;
                const cited = isBrand ? r.brandCited : r.competitorsCited.includes(b);
                return <CitationCell key={b} cited={cited} isBrand={isBrand} />;
              })}
            </div>
          </div>
        ))}

        {/* Totals row */}
        <div className="grid grid-cols-[1fr_auto] gap-4 px-6 py-2.5 items-center bg-zinc-950/40 font-mono text-[11px]">
          <span className="text-zinc-500 uppercase tracking-wider text-[10px]">total citations</span>
          <div className="flex gap-1">
            {allBrands.map((b, i) => {
              const isBrand = i === 0;
              const count = isBrand
                ? results.filter(r => r.brandCited).length
                : results.filter(r => r.competitorsCited.includes(b)).length;
              return (
                <div
                  key={b}
                  className={`w-16 text-center ${isBrand ? 'text-emerald-300 font-semibold' : 'text-zinc-400'}`}
                >
                  {count}/{results.length}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function CitationCell({ cited, isBrand }: { cited: boolean; isBrand: boolean }) {
  if (cited) {
    return (
      <div
        className={`w-16 h-7 rounded flex items-center justify-center ${
          isBrand ? 'bg-emerald-500/20 border border-emerald-500/50' : 'bg-amber-500/15 border border-amber-500/40'
        }`}
        title={isBrand ? 'Your brand cited' : 'Competitor cited'}
      >
        <span className={`text-[11px] font-mono font-semibold ${isBrand ? 'text-emerald-300' : 'text-amber-300'}`}>
          {isBrand ? 'cited' : 'cited'}
        </span>
      </div>
    );
  }
  return (
    <div
      className={`w-16 h-7 rounded flex items-center justify-center border border-zinc-800/80 bg-zinc-900/40 ${
        isBrand ? 'border-red-500/20 bg-red-500/[0.03]' : ''
      }`}
      title="Not cited"
    >
      <span className={`text-[11px] font-mono ${isBrand ? 'text-red-400/60' : 'text-zinc-600'}`}>—</span>
    </div>
  );
}
