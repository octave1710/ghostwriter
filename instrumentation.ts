// Next.js instrumentation hook: runs ONCE at server startup, before any route handler.
// This is where dd-trace must be initialized to auto-instrument OpenAI / fetch / etc.

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./lib/integrations/datadog');
  }
}
