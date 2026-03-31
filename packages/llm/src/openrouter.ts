import { createOpenAI } from '@ai-sdk/openai';

// OpenRouter implements the OpenAI API contract natively.
// We configure the Vercel AI SDK to point to OpenRouter.
export const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const defaultModel = openrouter('google/gemini-2.5-flash');
