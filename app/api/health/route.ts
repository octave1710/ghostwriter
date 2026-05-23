import { NextResponse } from 'next/server';
import { llmobs } from '@/lib/integrations/datadog';

export async function GET() {
  // Hello-world Datadog span — proves the SDK is wired.
  const trace = llmobs
    ? llmobs.wrap({ kind: 'workflow', name: 'health-check' }, async () => {
        return { ok: true, ts: new Date().toISOString() };
      })
    : async () => ({ ok: true, ts: new Date().toISOString() });

  const result = await trace();
  return NextResponse.json({
    status: 'ok',
    datadog: !!llmobs,
    ...result,
  });
}
