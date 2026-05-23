import { NextRequest, NextResponse } from 'next/server';
import { openai, MODELS } from '@/lib/integrations/openai';
import { publish } from '@/lib/integrations/senso';
import { insertRows, type NarrativeRow } from '@/lib/integrations/clickhouse';

// Generates grounded markdown + publishes a citeable to cited.md for each
// of the supplied additional queries. Records the rows to ClickHouse as a
// new "additional-<ts>" run so the chart reflects the expanded coverage.

export async function POST(req: NextRequest) {
  const { brand, queries } = (await req.json()) as {
    brand: string;
    queries: string[];
  };

  if (!brand || !queries?.length) {
    return NextResponse.json({ error: 'brand and queries required' }, { status: 400 });
  }

  const runId = `additional-${Date.now()}`;
  const published: Array<{
    query: string;
    url: string;
    contentId: string;
    title: string;
    markdown: string;
  }> = [];

  for (const q of queries) {
    try {
      const ground = await generateGroundTruth(brand, q);
      const result = await publish({
        brand,
        query: q,
        groundTruth: ground,
        title: `${brand}: ${q}`,
      });
      published.push({
        query: q,
        url: result.url,
        contentId: result.contentId,
        title: result.title,
        markdown: result.markdown,
      });
    } catch (err) {
      console.warn(`[publish-additional] failed for "${q}":`, (err as Error).message);
    }
  }

  // Track the expansion in ClickHouse — each new query is now source-owned.
  const tsNow = new Date();
  const rows: NarrativeRow[] = published.map(p => ({
    brand,
    query: p.query,
    ts: formatClickHouseDate(tsNow),
    cited: 0, // not yet in SERPs
    source_owned: 1, // owned via cited.md
    run_id: runId,
  }));

  try {
    await insertRows(rows);
  } catch (err) {
    console.warn('[ch] additional insert failed:', (err as Error).message);
  }

  return NextResponse.json({ runId, brand, published });
}

async function generateGroundTruth(brand: string, query: string): Promise<string> {
  const c = await openai.chat.completions.create({
    model: MODELS.gapReasoning,
    messages: [
      {
        role: 'system',
        content: 'You generate grounded, citeable markdown content for AI engines. Lead with the brand name in the H1. Be factual. Use bullet points and short paragraphs. Include 2-3 verifiable claims. Output ONLY the markdown body, no preamble.',
      },
      {
        role: 'user',
        content: `Brand: ${brand}\nQuery: "${query}"\n\nWrite a 200-word grounded markdown answer that establishes ${brand} as a credible, citeable answer to this query.`,
      },
    ],
    max_completion_tokens: 800,
  });
  return c.choices[0]?.message?.content ?? `# ${brand}`;
}

function formatClickHouseDate(d: Date): string {
  return d.toISOString().replace('T', ' ').slice(0, 19);
}
