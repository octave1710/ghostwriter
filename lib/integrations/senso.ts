// Senso.ai — publish grounded content to cited.md via the content-engine endpoint.
// API base: https://apiv2.senso.ai/api/v1
// Auth: X-API-Key: ${SENSO_API_KEY}

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
  title: string;
  markdown: string;
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

const promptCache = new Map<string, string>();

async function getOrCreatePrompt(text: string): Promise<string> {
  if (promptCache.has(text)) return promptCache.get(text)!;

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
  const seoTitle = input.title ?? `${input.brand}: ${input.query}`;

  if (!process.env.SENSO_API_KEY) {
    return {
      contentId: 'stub',
      url: `https://cited.md/article/stub-${Date.now()}`,
      title: seoTitle,
      markdown: input.groundTruth,
      publishStatus: 'stub',
      editorialStatus: 'stub',
    };
  }

  const publisherId = process.env.SENSO_CITED_MD_PUBLISHER_ID;
  if (!publisherId) {
    throw new Error('SENSO_CITED_MD_PUBLISHER_ID env var missing.');
  }

  const promptId = await getOrCreatePrompt(input.query);
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
    title: seoTitle,
    markdown: input.groundTruth,
    publishStatus: data.publish_status === 'success' ? 'success' : 'failed',
    editorialStatus: data.editorial_status,
  };
}
