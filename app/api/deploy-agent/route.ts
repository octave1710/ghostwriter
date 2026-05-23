import { NextRequest, NextResponse } from 'next/server';
import { runAgent, type RunInput } from '@/lib/agent/loop';

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<RunInput>;

  if (!body.brand || !body.queries?.length) {
    return NextResponse.json(
      { error: 'brand and queries are required' },
      { status: 400 },
    );
  }

  const input: RunInput = {
    brand: body.brand,
    queries: body.queries,
    competitors: body.competitors ?? [],
  };

  try {
    const result = await runAgent(input);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
