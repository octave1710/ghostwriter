// Datadog LLM Observability — initialized once at server startup via instrumentation.ts.
// Must be imported BEFORE any LLM SDK (openai) so dd-trace can auto-instrument it.

import tracer from 'dd-trace';

const enabled = process.env.DD_LLMOBS_ENABLED === '1' && !!process.env.DD_API_KEY;

if (enabled) {
  tracer.init({
    llmobs: {
      mlApp: process.env.DD_LLMOBS_ML_APP || 'ghostwriter',
      agentlessEnabled: process.env.DD_LLMOBS_AGENTLESS_ENABLED === '1',
    },
    env: process.env.DD_ENV || 'hackathon',
    service: process.env.DD_SERVICE || 'ghostwriter',
  });

  console.log('[datadog] LLM Obs initialized');
} else {
  console.log('[datadog] disabled (DD_LLMOBS_ENABLED or DD_API_KEY missing)');
}

export const llmobs = enabled ? tracer.llmobs : null;
export { tracer };
