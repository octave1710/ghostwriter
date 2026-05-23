import { Dashboard } from '@/components/Dashboard';
import { getNarrativeControl } from '@/lib/integrations/clickhouse';

export const dynamic = 'force-dynamic';

const DEFAULT_BRAND = 'Resend';
const DEFAULT_QUERIES = [
  'best transactional email API for developers',
  'send emails from a Next.js app',
  'Resend vs SendGrid comparison',
  'transactional email API with React templates',
  'email API with the best developer experience',
];
const DEFAULT_COMPETITORS = ['SendGrid', 'Postmark'];

export default async function Home() {
  let initialSeries: Array<{ run_id: string; owned_ratio: number; ts: string }> = [];
  try {
    initialSeries = await getNarrativeControl(DEFAULT_BRAND);
  } catch {
    // graceful fallback if ClickHouse is down
  }

  return (
    <Dashboard
      defaultBrand={DEFAULT_BRAND}
      defaultQueries={DEFAULT_QUERIES}
      defaultCompetitors={DEFAULT_COMPETITORS}
      initialSeries={initialSeries}
    />
  );
}
