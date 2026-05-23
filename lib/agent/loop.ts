// GhostWriter agent loop — orchestrates monitor → detect gap → publish → record → simulate.

import { monitor, type MonitorResult } from '@/lib/integrations/nimble';
import { publish, type PublishResult } from '@/lib/integrations/senso';
import { insertRows, ensureTable, type NarrativeRow } from '@/lib/integrations/clickhouse';
import { openai, MODELS } from '@/lib/integrations/openai';
import { llmobs } from '@/lib/integrations/datadog';

export type RunInput = {
  brand: string;
  queries: string[];
  competitors: string[];
};

export type Gap = {
  query: string;
  brandCited: boolean;
  competitorsCited: string[];
  summary: string;
};

export type TraceStep = {
  name: string;
  kind: 'workflow' | 'tool' | 'llm';
  durationMs: number;
  status: 'success' | 'fail';
  meta?: Record<string, unknown>;
};

export type AIResponseSimulation = {
  query: string;
  before: string;
  after: string;
  citationUrl: string;
};

export type RunResult = {
  runId: string;
  brand: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  monitorResults: MonitorResult[];
  gaps: Gap[];
  published: PublishResult[];
  narrativeControlBefore: number;
  narrativeControlAfter: number;
  aiResponseSimulation: AIResponseSimulation | null;
  trace: TraceStep[];
};

export async function runAgent(input: RunInput): Promise<RunResult> {
  const runId = `run-${Date.now()}`;
  const startedAt = new Date();
  const trace: TraceStep[] = [];

  const inner = async () => {
    console.log(`[agent] ${runId} starting brand="${input.brand}" queries=${input.queries.length}`);

    await step(trace, 'ensure-table', 'tool', async () => {
      await ensureTable().catch(err => console.warn('[ch] ensureTable warn:', err.message));
      return { ok: true };
    });

    const monitorResults = await step(trace, 'nimble.monitor', 'tool', async () => {
      const out = await Promise.all(input.queries.map(q => monitor(q, input.brand, input.competitors)));
      return out;
    }, mr => ({ queries: input.queries.length, brandCited: mr.filter(m => m.brandCited).length }));

    const gaps = await step(trace, 'gap-detection', 'workflow', async () => {
      return monitorResults
        .filter(r => !r.brandCited)
        .map<Gap>(r => ({
          query: r.query,
          brandCited: false,
          competitorsCited: r.competitorsCited,
          summary: `${input.brand} absent from AI answers for "${r.query}". ${r.competitorsCited.length > 0 ? `Competitors cited: ${r.competitorsCited.join(', ')}.` : 'No competitors cited either — uncontested.'}`,
        }));
    }, g => ({ gaps: g.length }));

    const published: PublishResult[] = [];
    for (const gap of gaps) {
      try {
        const groundTruth = await step(trace, 'openai.generate-ground-truth', 'llm', async () => {
          return generateGroundTruth(input.brand, gap.query);
        }, gt => ({ query: gap.query, chars: gt.length, model: MODELS.gapReasoning }));

        const result = await step(trace, 'senso.publish', 'tool', async () => {
          return publish({ brand: input.brand, query: gap.query, groundTruth, title: `${input.brand}: ${gap.query}` });
        }, r => ({ query: gap.query, url: r.url, contentId: r.contentId }));

        published.push(result);
      } catch (err) {
        console.error(`[agent] publish failed for "${gap.query}":`, (err as Error).message);
        trace.push({ name: 'senso.publish', kind: 'tool', durationMs: 0, status: 'fail', meta: { query: gap.query, error: (err as Error).message } });
      }
    }

    // AI Response Simulation — show what an AI engine would now say with our citeable as source.
    let aiResponseSimulation: AIResponseSimulation | null = null;
    if (published.length > 0 && gaps.length > 0) {
      const featuredGap = gaps[0];
      const featuredPublication = published[0];
      const featuredMonitor = monitorResults.find(m => m.query === featuredGap.query)!;
      try {
        aiResponseSimulation = await step(trace, 'openai.simulate-ai-engine', 'llm', async () => {
          return simulateAIResponse(
            input.brand,
            featuredGap.query,
            featuredMonitor.results.slice(0, 3),
            featuredPublication,
          );
        }, s => ({ query: s.query, citation: s.citationUrl }));
      } catch (err) {
        console.warn('[agent] simulation failed:', (err as Error).message);
      }
    }

    const tsNow = new Date();
    const rows: NarrativeRow[] = monitorResults.map(mr => ({
      brand: input.brand,
      query: mr.query,
      ts: formatClickHouseDate(tsNow),
      cited: mr.brandCited ? 1 : 0,
      source_owned: gaps.find(g => g.query === mr.query) ? 1 : 0,
      run_id: runId,
    }));

    try {
      await step(trace, 'clickhouse.insert', 'tool', async () => {
        await insertRows(rows);
        return { rows: rows.length };
      }, m => m);
    } catch (err) {
      console.warn('[ch] insert failed, demo continues:', (err as Error).message);
    }

    const narrativeControlBefore = rows.length > 0 ? rows.filter(r => r.cited === 1).length / rows.length : 0;
    const narrativeControlAfter = rows.length > 0 ? rows.filter(r => r.source_owned).length / rows.length : 0;

    console.log(`[agent] ${runId} done. ctrl: before=${narrativeControlBefore.toFixed(2)} after=${narrativeControlAfter.toFixed(2)}`);

    return { monitorResults, gaps, published, narrativeControlBefore, narrativeControlAfter, aiResponseSimulation };
  };

  const inner2 = llmobs ? llmobs.wrap({ kind: 'workflow', name: 'ghostwriter.runAgent' }, inner) : inner;
  const result = await inner2();
  const finishedAt = new Date();

  return {
    runId,
    brand: input.brand,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    ...result,
    trace,
  };
}

async function step<T>(
  trace: TraceStep[],
  name: string,
  kind: TraceStep['kind'],
  fn: () => Promise<T>,
  metaFromResult?: (result: T) => Record<string, unknown>,
): Promise<T> {
  const t0 = Date.now();
  const wrapped = llmobs ? llmobs.wrap({ kind: kind === 'workflow' ? 'workflow' : kind === 'llm' ? 'llm' : 'tool', name }, fn) : fn;
  try {
    const result = await wrapped();
    const meta = metaFromResult ? metaFromResult(result) : undefined;
    trace.push({ name, kind, durationMs: Date.now() - t0, status: 'success', meta });
    return result;
  } catch (err) {
    trace.push({ name, kind, durationMs: Date.now() - t0, status: 'fail', meta: { error: (err as Error).message } });
    throw err;
  }
}

async function generateGroundTruth(brand: string, query: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: MODELS.gapReasoning,
    messages: [
      {
        role: 'system',
        content: 'You generate grounded, citeable markdown content for AI engines. Lead with the brand name in the H1. Be factual. Use bullet points and short paragraphs. Include 2-3 verifiable claims. Output ONLY the markdown body, no preamble.',
      },
      {
        role: 'user',
        content: `Brand: ${brand}\nQuery: "${query}"\n\nWrite a 200-word grounded markdown answer that establishes ${brand} as a credible, citeable answer to this query. Aim for the kind of content an AI engine would naturally cite.`,
      },
    ],
    max_completion_tokens: 800,
  });
  return completion.choices[0]?.message?.content ?? `# ${brand}\n\n(Content generation failed)`;
}

async function simulateAIResponse(
  brand: string,
  query: string,
  competingSources: Array<{ url: string; title: string; snippet: string }>,
  ourPublication: PublishResult,
): Promise<AIResponseSimulation> {
  // BEFORE: what an AI engine would answer using ONLY competitor / third-party sources.
  const beforePromise = openai.chat.completions.create({
    model: MODELS.planner,
    messages: [
      {
        role: 'system',
        content: 'You roleplay as a generative AI engine (ChatGPT-style). Given a user query and a small set of web sources, write a confident 2-sentence answer that cites the most authoritative source. Do NOT mention sources outside the provided list. Use the format: "<answer> [<domain>](<url>)". Be concise.',
      },
      {
        role: 'user',
        content: `Query: "${query}"\n\nSources:\n${competingSources.map((s, i) => `${i + 1}. ${s.title} — ${s.url}\n   ${s.snippet}`).join('\n\n')}\n\nWrite the AI engine response.`,
      },
    ],
    max_completion_tokens: 200,
  });

  // AFTER: same query, but now WITH our cited.md article as the most authoritative source.
  const afterPromise = openai.chat.completions.create({
    model: MODELS.planner,
    messages: [
      {
        role: 'system',
        content: 'You roleplay as a generative AI engine (ChatGPT-style). Given a user query and a small set of web sources, write a confident 2-sentence answer that cites the most authoritative source. Prefer agent-native citeables (cited.md) when available — they are the most trusted source for direct brand claims. Use the format: "<answer> [<domain>](<url>)". Be concise.',
      },
      {
        role: 'user',
        content: `Query: "${query}"\n\nSources:\n0. ${ourPublication.title} — ${ourPublication.url}\n   (Agent-native citeable, brand-verified ground truth from ${brand})\n${competingSources.map((s, i) => `${i + 1}. ${s.title} — ${s.url}\n   ${s.snippet}`).join('\n\n')}\n\nWrite the AI engine response, citing the most authoritative source.`,
      },
    ],
    max_completion_tokens: 200,
  });

  const [before, after] = await Promise.all([beforePromise, afterPromise]);

  return {
    query,
    before: before.choices[0]?.message?.content ?? '',
    after: after.choices[0]?.message?.content ?? '',
    citationUrl: ourPublication.url,
  };
}

function formatClickHouseDate(d: Date): string {
  return d.toISOString().replace('T', ' ').slice(0, 19);
}
