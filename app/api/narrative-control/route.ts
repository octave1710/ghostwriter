import { NextRequest, NextResponse } from 'next/server';
import { getNarrativeControl } from '@/lib/integrations/clickhouse';

export async function GET(req: NextRequest) {
  const brand = req.nextUrl.searchParams.get('brand') ?? 'Resend';

  try {
    const full = await getNarrativeControl(brand);

    // Keep all "before-*" runs + only the latest "run-*" (avoid NOW-spam noise on the chart).
    const beforeRuns = full.filter(p => p.run_id.startsWith('before-'));
    const liveRuns = full.filter(p => !p.run_id.startsWith('before-'));
    const latestLive = liveRuns.length > 0 ? [liveRuns[liveRuns.length - 1]] : [];

    return NextResponse.json({ brand, series: [...beforeRuns, ...latestLive] });
  } catch (err) {
    return NextResponse.json(
      { brand, series: [], error: (err as Error).message },
      { status: 500 },
    );
  }
}
