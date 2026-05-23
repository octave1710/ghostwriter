import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const MODELS = {
  planner: 'gpt-4o-mini',
  gapReasoning: 'gpt-4o',
} as const;
