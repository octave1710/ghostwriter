import { NextRequest, NextResponse } from 'next/server';

const NIMBLE_BASE = 'https://sdk.nimbleway.com/v1';

// Multi-signal verification for a published citeable.
// Returns 4 independent checks so the user sees BOTH the always-green
// "article is live" signals AND the honest "SERP crawl pending" signal.

type SignalStatus = 'ok' | 'pending' | 'fail';

type VerifyResponse = {
  query: string;
  expectedUrl: string;
  brand?: string;
  signals: {
    articleLive: SignalStatus;       // HEAD request returns 2xx
    articleHasBrand: SignalStatus;   // The markdown body actually mentions the brand
    brandInSerp: SignalStatus;       // Nimble SERP for the query mentions the brand
    citeableIndexed: SignalStatus;   // The exact cited.md URL appears in the SERP
  };
  positions: {
    direct: number | null;
    citedMd: number | null;
    brand: number | null;
  };
  totalResults: number;
  checkedAt: string;
};

export async function POST(req: NextRequest) {
  const { query, expectedUrl, brand } = (await req.json()) as {
    query: string;
    expectedUrl: string;
    brand?: string;
  };

  if (!query || !expectedUrl) {
    return NextResponse.json({ error: 'query and expectedUrl required' }, { status: 400 });
  }

  // Run all checks in parallel.
  const [liveResult, serpResult] = await Promise.all([
    checkArticleLive(expectedUrl, brand),
    checkSerp(query, expectedUrl, brand),
  ]);

  const response: VerifyResponse = {
    query,
    expectedUrl,
    brand,
    signals: {
      articleLive: liveResult.live,
      articleHasBrand: liveResult.hasBrand,
      brandInSerp: serpResult.brandInSerp,
      citeableIndexed: serpResult.urlIndexed,
    },
    positions: serpResult.positions,
    totalResults: serpResult.totalResults,
    checkedAt: new Date().toISOString(),
  };

  return NextResponse.json(response);
}

async function checkArticleLive(url: string, brand?: string): Promise<{ live: SignalStatus; hasBrand: SignalStatus }> {
  try {
    // Follow redirects to get the canonical page.
    const res = await fetch(url, { method: 'GET', redirect: 'follow' });
    if (!res.ok) {
      return { live: 'fail', hasBrand: 'pending' };
    }
    const body = await res.text();
    const hasBrand = brand && body.toLowerCase().includes(brand.toLowerCase()) ? 'ok' : 'pending';
    return { live: 'ok', hasBrand };
  } catch {
    return { live: 'fail', hasBrand: 'pending' };
  }
}

async function checkSerp(
  query: string,
  expectedUrl: string,
  brand?: string,
): Promise<{
  brandInSerp: SignalStatus;
  urlIndexed: SignalStatus;
  positions: { direct: number | null; citedMd: number | null; brand: number | null };
  totalResults: number;
}> {
  if (!process.env.NIMBLE_API_KEY) {
    return { brandInSerp: 'pending', urlIndexed: 'pending', positions: { direct: null, citedMd: null, brand: null }, totalResults: 0 };
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
      return { brandInSerp: 'pending', urlIndexed: 'pending', positions: { direct: null, citedMd: null, brand: null }, totalResults: 0 };
    }
    const data = (await res.json()) as { results: Array<{ url: string; title: string; snippet?: string; description?: string }> };
    const results = data.results ?? [];

    const directIdx = results.findIndex(r => r.url?.includes(expectedUrl) || expectedUrl.includes(r.url ?? ''));
    const citedMdIdx = results.findIndex(r => r.url?.includes('cited.md'));
    const brandIdx = brand
      ? results.findIndex(r => {
          const blob = `${r.title ?? ''} ${r.snippet ?? ''} ${r.description ?? ''}`.toLowerCase();
          return blob.includes(brand.toLowerCase());
        })
      : -1;

    return {
      brandInSerp: brandIdx >= 0 ? 'ok' : 'pending',
      urlIndexed: directIdx >= 0 ? 'ok' : citedMdIdx >= 0 ? 'ok' : 'pending',
      positions: {
        direct: directIdx >= 0 ? directIdx + 1 : null,
        citedMd: citedMdIdx >= 0 ? citedMdIdx + 1 : null,
        brand: brandIdx >= 0 ? brandIdx + 1 : null,
      },
      totalResults: results.length,
    };
  } catch {
    return { brandInSerp: 'pending', urlIndexed: 'pending', positions: { direct: null, citedMd: null, brand: null }, totalResults: 0 };
  }
}
