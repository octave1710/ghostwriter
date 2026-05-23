// Senso.ai — publish grounded content to cited.md via the content-engine endpoint.
// API base: https://apiv2.senso.ai/api/v1
// Auth: X-API-Key: ${SENSO_API_KEY}
//
// Flow:
//   1. Look up (or create) a prompt for the query — POST /org/prompts (idempotent on text).
//   2. Publish via /org/content-engine/publish with { geo_question_id, raw_markdown, seo_title, summary, publisher_ids }.
//   3. Response includes publish_destinations[].display_url — that's the live cited.md URL.

const SENSO_BASE = 'https://apiv2.senso.ai/api/v1';

export type PublishInput = {
  brand: string;
  query: string;
  groundTruth: string;
  title?: string;
  summary?: string;
};

export type PublishResult = {
  contentId: string;
  url: string;
  publishStatus: 'success' | 'failed' | 'stub';
  editorialStatus: string;
};

type PromptResponse = {
  prompts: Array<{ prompt_id: string; text: string }>;
  total: number;
};

type CreatePromptResponse = {
  prompt_id: string;
  text: string;
  type: string;
};

type PublishResponse = {
  content_id: string;
  publish_status: string;
  editorial_status: string;
  publish_destinations: Array<{
    publisher: string;
    display_url: string;
    status: string;
  }>;
};

// In-memory cache for query → prompt_id (process lifetime).
const promptCache = new Map<string, string>();

async function getOrCreatePrompt(text: string): Promise<string> {
  if (promptCache.has(text)) return promptCache.get(text)!;

  // Try to find an existing prompt by exact text match.
  const searchRes = await fetch(
    `${SENSO_BASE}/org/prompts?search=${encodeURIComponent(text)}&limit=20`,
    { headers: { 'X-API-Key': process.env.SENSO_API_KEY! } },
  );
  if (searchRes.ok) {
    const data = (await searchRes.json()) as PromptResponse;
    const exact = data.prompts.find(p => p.text === text);
    if (exact) {
      promptCache.set(text, exact.prompt_id);
      return exact.prompt_id;
    }
  }

  // Create a new prompt.
  const createRes = await fetch(`${SENSO_BASE}/org/prompts`, {
    method: 'POST',
    headers: {
      'X-API-Key': process.env.SENSO_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question_text: text, type: 'decision' }),
  });
  if (!createRes.ok) {
    throw new Error(`Senso /org/prompts create failed: ${createRes.status} ${await createRes.text()}`);
  }
  const created = (await createRes.json()) as CreatePromptResponse;
  promptCache.set(text, created.prompt_id);
  return created.prompt_id;
}

export async function publish(input: PublishInput): Promise<PublishResult> {
  if (!process.env.SENSO_API_KEY) {
    return {
      contentId: 'stub',
      url: `https://cited.md/article/stub-${Date.now()}`,
      publishStatus: 'stub',
      editorialStatus: 'stub',
    };
  }

  const publisherId = process.env.SENSO_CITED_MD_PUBLISHER_ID;
  if (!publisherId) {
    throw new Error('SENSO_CITED_MD_PUBLISHER_ID env var missing. Add via senso destinations add --domain cited.md.');
  }

  const promptId = await getOrCreatePrompt(input.query);
  const seoTitle = input.title ?? `${input.brand}: ${input.query}`;
  const summary = input.summary ?? `Grounded answer establishing ${input.brand} as a credible source for "${input.query}".`;

  const res = await fetch(`${SENSO_BASE}/org/content-engine/publish`, {
    method: 'POST',
    headers: {
      'X-API-Key': process.env.SENSO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      geo_question_id: promptId,
      raw_markdown: input.groundTruth,
      seo_title: seoTitle,
      summary,
      publisher_ids: [publisherId],
    }),
  });

  if (!res.ok) {
    throw new Error(`Senso /content-engine/publish failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as PublishResponse;
  const dest = data.publish_destinations?.[0];
  if (!dest) {
    throw new Error(`Senso publish returned no destinations: ${JSON.stringify(data)}`);
  }

  return {
    contentId: data.content_id,
    url: dest.display_url,
    publishStatus: data.publish_status === 'success' ? 'success' : 'failed',
    editorialStatus: data.editorial_status,
  };
}
