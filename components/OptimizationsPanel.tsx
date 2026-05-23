'use client';

import type { RunResult } from '@/lib/agent/loop';

type Suggestion = {
  icon: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'auto' | 'low' | 'medium';
};

export function OptimizationsPanel({ result, brand, competitors }: { result: RunResult | null; brand: string; competitors: string[] }) {
  if (!result) return null;

  const suggestions = buildSuggestions(result, brand, competitors);

  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/40">
      <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
        <h2 className="text-sm uppercase tracking-wide text-zinc-300">Next optimizations</h2>
        <p className="text-xs text-zinc-500 mt-0.5">Beyond publishing — what else moves the needle on AI search visibility</p>
      </div>
      <div className="divide-y divide-zinc-800/60">
        {suggestions.map((s, i) => (
          <SuggestionRow key={i} {...s} />
        ))}
      </div>
    </div>
  );
}

function buildSuggestions(result: RunResult, brand: string, competitors: string[]): Suggestion[] {
  const list: Suggestion[] = [];

  const ownedAfter = result.narrativeControlAfter;
  const competitorsBeating = competitors.filter(c =>
    result.monitorResults.some(r => !r.brandCited && r.competitorsCited.includes(c)),
  );

  list.push({
    icon: '↻',
    title: 'Schedule weekly recurring runs',
    description: 'AI engines re-crawl on a rolling basis. Re-run GhostWriter every 7 days to catch new gaps and re-publish stale citeables.',
    impact: 'high',
    effort: 'auto',
  });

  if (competitorsBeating.length > 0) {
    list.push({
      icon: '⚔',
      title: `Target "vs ${competitorsBeating[0]}" comparison queries`,
      description: `${competitorsBeating.join(', ')} are still winning in some queries. Add 3 comparison queries (e.g. "${brand} vs ${competitorsBeating[0]} pricing", "is ${brand} better than ${competitorsBeating[0]}") and re-run.`,
      impact: 'high',
      effort: 'low',
    });
  }

  list.push({
    icon: '⊞',
    title: 'Add structured FAQ data on your own site',
    description: `AI engines weight schema.org FAQ markup heavily. Publish JSON-LD FAQ entries on ${brand.toLowerCase()}.com answering each gap query — compounds with the cited.md citeable.`,
    impact: 'high',
    effort: 'medium',
  });

  if (ownedAfter < 0.8) {
    list.push({
      icon: '+',
      title: 'Expand query coverage',
      description: `You're monitoring ${result.monitorResults.length} queries. Add another 5-10 long-tail queries (intent: comparison, evaluation, integration). Each new query is a new shot at narrative control.`,
      impact: 'medium',
      effort: 'low',
    });
  }

  list.push({
    icon: '⊕',
    title: 'Open the agent payment rail to partners',
    description: 'Your cited.md citeables are paywalled via x402. Share the endpoint with partner agents — every query that pays you 0.01 USDC is both revenue AND a credibility signal back to AI engines.',
    impact: 'medium',
    effort: 'auto',
  });

  list.push({
    icon: '⌖',
    title: 'Track sentiment, not just citations',
    description: 'A citation isn\'t always positive. Hook a sentiment analysis step into the Nimble monitor span so you can detect negative coverage early and counter-publish.',
    impact: 'medium',
    effort: 'medium',
  });

  return list;
}

function SuggestionRow({ icon, title, description, impact, effort }: Suggestion) {
  const impactColor = { high: 'text-emerald-300', medium: 'text-cyan-300', low: 'text-zinc-400' }[impact];
  const impactBg = { high: 'bg-emerald-500/15 border-emerald-500/30', medium: 'bg-cyan-500/15 border-cyan-500/30', low: 'bg-zinc-800 border-zinc-700' }[impact];
  const effortLabel = { auto: 'automated', low: '< 30 min', medium: '< 1 day' }[effort];

  return (
    <div className="px-6 py-4 flex items-start gap-4 hover:bg-zinc-900/50">
      <div className="size-9 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center shrink-0 text-zinc-300 font-mono text-base">
        {icon}
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-zinc-100">{title}</span>
          <span className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border ${impactBg} ${impactColor}`}>
            {impact} impact
          </span>
          <span className="text-[10px] font-mono text-zinc-500">· {effortLabel}</span>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
