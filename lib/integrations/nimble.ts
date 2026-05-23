// Nimble — query open web for brand citation signal.
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
  topCitedSource: string | null; // hostname of the top result, useful for the demo card
};

export async function monitor(
  query: string,
  brand: string,
  competitors: string[],
): Promise<MonitorResult> {
  if (!process.env.NIMBLE_API_KEY) {
    return { query, results: [], brandCited: false, competitorsCited: competitors, topCitedSource: null };
  }

  try {
    const res = await fetch(`${NIMBLE_BASE}/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NIMBLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, limit: 10 }),
    });

    if (!res.ok) {
      console.warn(`[nimble] search "${query}" failed: ${res.status}`);
      return { query, results: [], brandCited: false, competitorsCited: [], topCitedSource: null };
    }

    const data = (await res.json()) as { results: NimbleSearchResult[] };
    const top = (data.results ?? []).slice(0, 5);

    const brandRe = new RegExp(`\\b${escapeRegex(brand)}\\b`, 'i');
    const brandCited = top.some(r =>
      brandRe.test(r.url) || brandRe.test(r.title) || brandRe.test(r.snippet),
    );

    const competitorsCited = competitors.filter(c => {
      const re = new RegExp(`\\b${escapeRegex(c)}\\b`, 'i');
      return top.some(r => re.test(r.url) || re.test(r.title) || re.test(r.snippet));
    });

    const topCitedSource = top[0] ? safeHostname(top[0].url) : null;

    return { query, results: top, brandCited, competitorsCited, topCitedSource };
  } catch (err) {
    console.warn(`[nimble] monitor "${query}" exception:`, (err as Error).message);
    return { query, results: [], brandCited: false, competitorsCited: [], topCitedSource: null };
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function safeHostname(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return url.slice(0, 40); }
}
