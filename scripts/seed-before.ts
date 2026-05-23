// Seed the "before" snapshot in ClickHouse for the Resend demo brand.
// This creates the historical baseline so the chart shows a real before→after lift.
// Usage: pnpm tsx --env-file=.env scripts/seed-before.ts

import { ensureTable, insertRows, type NarrativeRow } from '../lib/integrations/clickhouse';

const BRAND = 'Resend';
const QUERIES = [
  'best transactional email API for developers',
  'send emails from a Next.js app',
  'Resend vs SendGrid comparison',
  'transactional email API with React templates',
  'email API with the best developer experience',
];

(async () => {
  console.log('[seed] ensuring narrative_control table…');
  await ensureTable();

  // Generate 6 historical runs over the last 30 days. Each run = 5 query rows.
  // Cited count drifts upward slightly (1/5 → 2/5) but source_owned stays at 0 — that's the gap GhostWriter closes.
  const now = Date.now();
  const rows: NarrativeRow[] = [];

  for (let runIdx = 0; runIdx < 6; runIdx++) {
    const daysAgo = 30 - runIdx * 5;
    const runTs = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
    const runId = `before-${runIdx}`;

    QUERIES.forEach((q, qIdx) => {
      // 1 query cited in early runs, drifting to 2 by recent runs. None source-owned (pre-GhostWriter).
      const cited = runIdx + qIdx < 1 || (runIdx >= 4 && qIdx < 2) ? 1 : 0;
      rows.push({
        brand: BRAND,
        query: q,
        ts: formatClickHouseDate(runTs),
        cited: cited as 0 | 1,
        source_owned: 0,
        run_id: runId,
      });
    });
  }

  console.log(`[seed] inserting ${rows.length} 'before' rows (6 runs × 5 queries)…`);
  await insertRows(rows);
  console.log('[seed] done.');
})().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});

function formatClickHouseDate(d: Date): string {
  return d.toISOString().replace('T', ' ').slice(0, 19);
}
