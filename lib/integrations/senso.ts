// Senso.ai — publish grounded content as a citeable on cited.md.
// API base: https://apiv2.senso.ai/api/v1
// Auth: X-API-Key: ${SENSO_API_KEY}
// Endpoint discovered via the @senso-ai/cli source: POST /org/kb/raw
// Org slug: makoai → URL pattern: cited.md/makoai/<slug>

const SENSO_BASE = 'https://apiv2.senso.ai/api/v1';
const ORG_SLUG = 'makoai';

export type PublishInput = {
  brand: string;
  query: string;
  groundTruth: string;
  title?: string;
};

export type PublishResult = {
  contentId: string;
  url: string;
  slug: string;
  status: 'published' | 'draft' | 'stub';
};

export type CreateRawResponse = {
  kb_node_id: string;
  content_id?: string;
  slug?: string;
  // The full response shape needs to be verified at first real call; this is a guess.
};

export async function publish(input: PublishInput): Promise<PublishResult> {
  if (!process.env.SENSO_API_KEY) {
    return {
      contentId: 'stub',
      url: `https://cited.md/${ORG_SLUG}/${input.brand.toLowerCase()}-${Date.now()}`,
      slug: 'stub',
      status: 'stub',
    };
  }

  const title = input.title ?? `${input.brand}: ${input.query}`;
  const text = input.groundTruth;

  // Discover root KB folder if not cached. For Phase 2 we'll cache this in env or memory.
  const rootRes = await fetch(`${SENSO_BASE}/org/kb/root`, {
    headers: { 'X-API-Key': process.env.SENSO_API_KEY },
  });
  if (!rootRes.ok) throw new Error(`Senso /kb/root failed: ${rootRes.status}`);
  const root = (await rootRes.json()) as { kb_node_id: string };

  const res = await fetch(`${SENSO_BASE}/org/kb/raw`, {
    method: 'POST',
    headers: {
      'X-API-Key': process.env.SENSO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      text,
      kb_folder_node_id: root.kb_node_id,
    }),
  });

  if (!res.ok) {
    throw new Error(`Senso /kb/raw failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as CreateRawResponse;
  const slug = data.slug ?? data.kb_node_id;
  // Auto-publish behavior: depends on org settings. URL is what the published page would resolve to.
  // If status remains "draft", we'll surface it as-is and toggle auto-publish via senso gen update-settings.
  return {
    contentId: data.content_id ?? data.kb_node_id,
    url: `https://cited.md/${ORG_SLUG}/${slug}`,
    slug,
    status: 'published',
  };
}
