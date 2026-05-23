import { NextRequest, NextResponse } from 'next/server';

const NIMBLE_BASE = 'https://sdk.nimbleway.com/v1';

// Re-queries the open web for a specific citation URL pattern.
// Returns whether the freshly-published cited.md article has propagated into SERPs yet.
// This is the verification step: did AI engines pick up our content?

export async function POST(req: NextRequest) {
  const { query, expectedUrl, brand } = (await req.json()) as {
    query: string;
    expectedUrl: string;
    brand?: string;
  };

  if (!query || !expectedUrl) {
    return NextResponse.json({ error: 'query and expectedUrl required' }, { status: 400 });
  }

  if (!process.env.NIMBLE_API_KEY) {
    return NextResponse.json({ error: 'NIMBLE_API_KEY missing' }, { status: 500 });
  }

  try {
    const res = await fetch(`${NIMBLE_BASE}/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NIMBLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, limit: 20 }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Nimble ${res.status}` }, { status: 502 });
    }

    const data = (await res.json()) as { results: Array<{ url: string; title: string; snippet: string }> };
    const results = data.results ?? [];

    // 1. Direct URL match
    const directIdx = results.findIndex(r => r.url.includes(expectedUrl) || expectedUrl.includes(r.url));
    // 2. Domain match (any cited.md result is a win for the brand)
    const citedMdIdx = results.findIndex(r => r.url.includes('cited.md'));
    // 3. Brand-in-snippet match (if no direct URL yet, brand mention is partial)
    const brandIdx = brand
      ? results.findIndex(r => {
          const blob = `${r.title} ${r.snippet}`.toLowerCase();
          return blob.includes(brand.toLowerCase());
        })
      : -1;

    const status: 'indexed' | 'cited-md-domain' | 'brand-mentioned' | 'pending' =
      directIdx >= 0 ? 'indexed'
      : citedMdIdx >= 0 ? 'cited-md-domain'
      : brandIdx >= 0 ? 'brand-mentioned'
      : 'pending';

    return NextResponse.json({
      query,
      expectedUrl,
      brand,
      status,
      directPosition: directIdx >= 0 ? directIdx + 1 : null,
      citedMdPosition: citedMdIdx >= 0 ? citedMdIdx + 1 : null,
      brandPosition: brandIdx >= 0 ? brandIdx + 1 : null,
      totalResults: results.length,
      checkedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
