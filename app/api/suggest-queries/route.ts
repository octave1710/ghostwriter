import { NextRequest, NextResponse } from 'next/server';
import { openai, MODELS } from '@/lib/integrations/openai';

// Generates 5 strategic high-value queries the brand should target,
// distinct from the ones the user already supplied.

export async function POST(req: NextRequest) {
  const { brand, existingQueries, competitors } = (await req.json()) as {
    brand: string;
    existingQueries: string[];
    competitors: string[];
  };

  if (!brand) return NextResponse.json({ error: 'brand required' }, { status: 400 });

  try {
    const completion = await openai.chat.completions.create({
      model: MODELS.gapReasoning,
      messages: [
        {
          role: 'system',
          content: 'You are a GEO/AEO strategist. Given a brand and its competitors, propose 5 high-value search queries the brand should rank for in AI engines. Prioritize: (1) comparison queries (vs <competitor>), (2) buyer-intent queries ("how to choose...", "is X worth it"), (3) integration queries ("use X with Y"), (4) industry-defining queries. Avoid duplicating queries the user already monitors. Return ONLY a JSON array of 5 strings, no preamble.',
        },
        {
          role: 'user',
          content: `Brand: ${brand}\nCompetitors: ${competitors.join(', ') || 'none specified'}\n\nAlready monitored (do NOT repeat these):\n${existingQueries.map(q => `- ${q}`).join('\n')}\n\nReturn 5 new strategic queries as a JSON array.`,
        },
      ],
      response_format: { type: 'json_object' },
      max_completion_tokens: 600,
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    let suggestions: string[] = [];
    try {
      const parsed = JSON.parse(raw);
      // Accept either { queries: [...] } or { suggestions: [...] } or a top-level array
      if (Array.isArray(parsed)) suggestions = parsed;
      else suggestions = parsed.queries ?? parsed.suggestions ?? Object.values(parsed)[0] ?? [];
    } catch {
      suggestions = [];
    }
    suggestions = suggestions.filter(s => typeof s === 'string' && s.length > 5).slice(0, 5);

    // Brief rationale per query (one-liner). Best-effort; ignore failures.
    const rationale: Record<string, string> = {};
    try {
      const r = await openai.chat.completions.create({
        model: MODELS.planner,
        messages: [
          {
            role: 'system',
            content: 'For each query, give a 8-word rationale on WHY this matters for GEO. Return JSON: { "<query>": "<rationale>", ... }',
          },
          {
            role: 'user',
            content: `Brand: ${brand}\n\nQueries:\n${suggestions.map(q => `- ${q}`).join('\n')}`,
          },
        ],
        response_format: { type: 'json_object' },
        max_completion_tokens: 400,
      });
      const parsed = JSON.parse(r.choices[0]?.message?.content ?? '{}') as Record<string, string>;
      Object.assign(rationale, parsed);
    } catch { /* ignore */ }

    return NextResponse.json({
      brand,
      suggestions: suggestions.map(q => ({ query: q, rationale: rationale[q] ?? '' })),
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
