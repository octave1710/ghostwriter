// x402 (Coinbase) — HTTP 402 payment middleware for /api/query-content.
// Phase 4 wiring. For now: env var hooks only.

export const x402Config = {
  enabled: !!process.env.X402_WALLET_PRIVATE_KEY && !!process.env.X402_RECIPIENT_ADDRESS,
  network: process.env.X402_NETWORK || 'base-sepolia',
  facilitatorUrl: process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator',
  recipientAddress: process.env.X402_RECIPIENT_ADDRESS,
};
