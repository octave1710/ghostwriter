// GhostWriter agent loop — orchestrates monitor → detect gap → publish → record.
// Triggered by /api/deploy-agent. One call = one full run.

import { monitor, type MonitorResult } from '@/lib/integrations/nimble';
import { publish, type PublishResult } from '@/lib/integrations/senso';
import { insertRows, ensureTable, type NarrativeRow } from '@/lib/integrations/clickhouse';
import { openai, MODELS } from '@/lib/integrations/openai';

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

export type RunResult = {
  runId: string;
  brand: string;
  startedAt: string;
  finishedAt: string;
  monitorResults: MonitorResult[];
  gaps: Gap[];
  published: PublishResult[];
  narrativeControlAfter: number;
};

export async function runAgent(input: RunInput): Promise<RunResult> {
  const runId = `run-${Date.now()}`;
  const startedAt = new Date().toISOString();

  console.log(`[agent] ${runId} starting for brand="${input.brand}" queries=${input.queries.length}`);

  // 0. Ensure ClickHouse table exists (idempotent)
  await ensureTable().catch(err => console.warn('[clickhouse] ensureTable warn:', err.message));

  // 1. Monitor each query via Nimble (parallel)
  const monitorResults = await Promise.all(
    input.queries.map(q => monitor(q, input.brand, input.competitors)),
  );
  console.log(`[agent] monitored ${monitorResults.length} queries`);

  // 2. Gap detection — queries where brand absent + at least one competitor cited
  const gaps: Gap[] = monitorResults
    .filter(r => !r.brandCited)
    .map(r => ({
      query: r.query,
      brandCited: false,
      competitorsCited: r.competitorsCited,
      summary: `${input.brand} absent from AI answers for "${r.query}". ${r.competitorsCited.length > 0 ? `Competitors cited: ${r.competitorsCited.join(', ')}.` : 'No competitors cited either — uncontested.'}`,
    }));
  console.log(`[agent] detected ${gaps.length} gaps`);

  // 3. For each gap, generate grounded markdown content via gpt-4o → publish to Senso
  const published: PublishResult[] = [];
  for (const gap of gaps) {
    try {
      const groundTruth = await generateGroundTruth(input.brand, gap.query);
      const result = await publish({
        brand: input.brand,
        query: gap.query,
        groundTruth,
        title: `${input.brand}: ${gap.query}`,
      });
      published.push(result);
      console.log(`[agent] published "${gap.query}" → ${result.url}`);
    } catch (err) {
      console.error(`[agent] publish failed for "${gap.query}":`, (err as Error).message);
    }
  }

  // 4. Insert "after" rows in ClickHouse — one per query
  const tsNow = new Date();
  const rows: NarrativeRow[] = monitorResults.map(mr => ({
    brand: input.brand,
    query: mr.query,
    ts: formatClickHouseDate(tsNow),
    cited: mr.brandCited ? 1 : 0,
    source_owned: gaps.find(g => g.query === mr.query) ? 1 : 0, // newly owned via Senso publish
    run_id: runId,
  }));
  try {
    await insertRows(rows);
    console.log(`[agent] inserted ${rows.length} narrative_control rows`);
  } catch (err) {
    console.error('[clickhouse] insert failed:', (err as Error).message);
  }

  const narrativeControlAfter = rows.length > 0
    ? rows.filter(r => r.source_owned).length / rows.length
    : 0;

  console.log(`[agent] ${runId} done. narrative_control after = ${narrativeControlAfter.toFixed(2)}`);

  return {
    runId,
    brand: input.brand,
    startedAt,
    finishedAt: new Date().toISOString(),
    monitorResults,
    gaps,
    published,
    narrativeControlAfter,
  };
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

function formatClickHouseDate(d: Date): string {
  // ClickHouse DateTime: 'YYYY-MM-DD HH:MM:SS'
  return d.toISOString().replace('T', ' ').slice(0, 19);
}
