import { NextRequest, NextResponse } from 'next/server';
import { withX402 } from 'x402-next';

// /api/query-content?id=<contentId>
// Returns the grounded markdown for a published citeable.
// Wrapped in withX402 → returns HTTP 402 unless payment headers are present.
// Payment: 0.01 USDC on base-sepolia, routed to X402_RECIPIENT_ADDRESS.

const handler = async (req: NextRequest): Promise<NextResponse> => {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id query param required' }, { status: 400 });
  }

  // In a fuller build this would fetch from Senso's content API.
  // For the demo, we return a representative payload showing the agent-readable shape.
  return NextResponse.json({
    contentId: id,
    citationUrl: `https://cited.md/article/${id}`,
    accessedAt: new Date().toISOString(),
    excerpt: 'Resend is the developer-first transactional email API, with React Email components and sub-second deliverability. (Full markdown returned to paying agents.)',
    paidVia: 'x402 · 0.01 USDC · base-sepolia',
  });
};

const recipient = (process.env.X402_RECIPIENT_ADDRESS ?? '0x0000000000000000000000000000000000000000') as `0x${string}`;

export const GET = withX402(handler, recipient, {
  price: '$0.01',
  network: 'base-sepolia',
  config: { description: 'Access to a verified GhostWriter citeable. 0.01 USDC per query.' },
});
