// Senso.ai — publish grounded content as a citeable on cited.md.
// API base: https://apiv2.senso.ai/api/v1
// Auth: X-API-Key: ${SENSO_API_KEY}
// NOTE: exact publish endpoint is TBD — discover during Hello-World run + DevTools network tab.

const SENSO_BASE = 'https://apiv2.senso.ai/api/v1';

export type PublishInput = {
  brand: string;
  query: string;
  groundTruth: string;
  title?: string;
};

export type PublishResult = {
  url: string;
  slug: string;
};

export async function publish(input: PublishInput): Promise<PublishResult> {
  // Phase 1 stub — real impl in Phase 2 after Senso Hello-World reveals exact endpoint.
  if (!process.env.SENSO_API_KEY) {
    return {
      url: `https://cited.md/ghostwriter/${input.brand.toLowerCase()}-${Date.now()}`,
      slug: 'stub',
    };
  }

  // TODO Phase 2: replace with real endpoint after CLI discovery.
  // Likely shape: POST /content with X-API-Key header.
  throw new Error('senso.publish not yet wired — run Senso CLI Hello-World to discover endpoint');
}
