import { NextRequest, NextResponse } from 'next/server';
import { getNarrativeControl } from '@/lib/integrations/clickhouse';

export async function GET(req: NextRequest) {
  const brand = req.nextUrl.searchParams.get('brand') ?? 'Resend';

  try {
    const series = await getNarrativeControl(brand);
    return NextResponse.json({ brand, series });
  } catch (err) {
    return NextResponse.json(
      { brand, series: [], error: (err as Error).message },
      { status: 500 },
    );
  }
}
