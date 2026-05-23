'use client';

import type { MonitorResult } from '@/lib/integrations/nimble';

export function CompetitiveLeaderboard({
  brand,
  competitors,
  results,
  publishedCount,
}: {
  brand: string;
  competitors: string[];
  results: MonitorResult[];
  publishedCount: number;
}) {
  if (!results.length) return null;

  const total = results.length;

  const rows = [
    {
      name: brand,
      count: results.filter(r => r.brandCited).length,
      isBrand: true,
    },
    ...competitors.map(c => ({
      name: c,
      count: results.filter(r => r.brandCited && r.competitorsCited.includes(c)).length + results.filter(r => !r.brandCited && r.competitorsCited.includes(c)).length,
      isBrand: false,
    })),
  ].sort((a, b) => b.count - a.count);

  // Projected "after" for the brand: existing citations + publishedCount (new ones via cited.md)
  const brandAfter = Math.min(total, results.filter(r => r.brandCited).length + publishedCount);

  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/40">
      <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
        <h2 className="text-sm uppercase tracking-wide text-zinc-300">Competitive standing</h2>
        <p className="text-xs text-zinc-500 mt-0.5">How AI engines rank you vs the competition · count of queries citing each</p>
      </div>

      <div className="p-6 space-y-3">
        {rows.map((row) => {
          const pct = total > 0 ? (row.count / total) * 100 : 0;
          const projectedPct = row.isBrand && publishedCount > 0 ? (brandAfter / total) * 100 : null;
          return (
            <div key={row.name} className="space-y-1">
              <div className="flex items-baseline justify-between text-sm">
                <span className={`font-mono ${row.isBrand ? 'text-emerald-300 font-semibold' : 'text-zinc-300'}`}>
                  {row.isBrand && <span className="text-emerald-400/70 mr-1">●</span>}
                  {row.name}
                </span>
                <span className={`font-mono text-xs ${row.isBrand ? 'text-emerald-300' : 'text-zinc-500'}`}>
                  {row.count}/{total} {projectedPct !== null && <span className="text-emerald-400 ml-2">→ {brandAfter}/{total} after publish</span>}
                </span>
              </div>
              <div className="relative h-3 rounded-full bg-zinc-900 overflow-hidden">
                {/* Projected (ghost) bar for the brand */}
                {projectedPct !== null && (
                  <div
                    className="absolute inset-y-0 left-0 bg-emerald-500/15 border-r border-emerald-500/40 transition-all"
                    style={{ width: `${projectedPct}%` }}
                  />
                )}
                {/* Actual bar */}
                <div
                  className={`absolute inset-y-0 left-0 rounded-full transition-all ${row.isBrand ? 'bg-emerald-500' : 'bg-amber-500/70'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
        {publishedCount > 0 && (
          <p className="text-[10px] font-mono text-zinc-600 pt-2 border-t border-zinc-800 mt-2">
            ghost bar = projected citations after AI engines re-crawl your {publishedCount} new cited.md citeable{publishedCount > 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  );
}
