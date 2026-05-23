// Nimble — query open web + AI engines for brand citation data.
// API ref: https://docs.nimbleway.com/api-reference/introduction
// Auth: Authorization: Bearer ${NIMBLE_API_KEY}

const NIMBLE_BASE = 'https://sdk.nimbleway.com/v1';

export type NimbleSearchResult = {
  url: string;
  title: string;
  snippet: string;
  content?: string;
};

export type MonitorResult = {
  query: string;
  results: NimbleSearchResult[];
  brandCited: boolean;
  competitorsCited: string[];
};

export async function monitor(query: string, brand: string, competitors: string[]): Promise<MonitorResult> {
  // Phase 1 stub — real impl in Phase 2.
  if (!process.env.NIMBLE_API_KEY) {
    return {
      query,
      results: [],
      brandCited: false,
      competitorsCited: competitors,
    };
  }

  const res = await fetch(`${NIMBLE_BASE}/search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NIMBLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, limit: 10 }),
  });

  if (!res.ok) {
    throw new Error(`Nimble search failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json() as { results: NimbleSearchResult[] };
  const blob = JSON.stringify(data.results).toLowerCase();
  const brandCited = blob.includes(brand.toLowerCase());
  const competitorsCited = competitors.filter(c => blob.includes(c.toLowerCase()));

  return { query, results: data.results, brandCited, competitorsCited };
}
