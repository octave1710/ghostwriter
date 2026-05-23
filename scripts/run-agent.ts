// CLI runner for the agent loop — proves Phase 2 end-to-end.
// Usage: pnpm tsx --env-file=.env scripts/run-agent.ts

import { runAgent } from '../lib/agent/loop';

const RESEND_DEMO = {
  brand: 'Resend',
  queries: [
    'best transactional email API for developers',
    'send emails from a Next.js app',
    'Resend vs SendGrid comparison',
    'transactional email API with React templates',
    'email API with the best developer experience',
  ],
  competitors: ['SendGrid', 'Postmark'],
};

(async () => {
  const result = await runAgent(RESEND_DEMO);
  console.log('\n=== RESULT ===');
  console.log(JSON.stringify({
    runId: result.runId,
    brand: result.brand,
    monitorSummary: result.monitorResults.map(m => ({
      query: m.query,
      brandCited: m.brandCited,
      competitorsCited: m.competitorsCited,
      topSource: m.topCitedSource,
    })),
    gapCount: result.gaps.length,
    published: result.published.map(p => p.url),
    narrativeControlAfter: result.narrativeControlAfter,
  }, null, 2));
})().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
