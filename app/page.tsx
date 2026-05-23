import { Dashboard } from '@/components/Dashboard';

const DEFAULT_BRAND = 'Resend';
const DEFAULT_QUERIES = [
  'best transactional email API for developers',
  'send emails from a Next.js app',
  'Resend vs SendGrid comparison',
  'transactional email API with React templates',
  'email API with the best developer experience',
];
const DEFAULT_COMPETITORS = ['SendGrid', 'Postmark'];

// Static shell — the chart hydrates client-side from /api/narrative-control to keep
// first paint <500ms even when ClickHouse cold-starts.
export default function Home() {
  return (
    <Dashboard
      defaultBrand={DEFAULT_BRAND}
      defaultQueries={DEFAULT_QUERIES}
      defaultCompetitors={DEFAULT_COMPETITORS}
      initialSeries={[]}
    />
  );
}
