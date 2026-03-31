import { describe, it, expect } from 'vitest';
import { analyzeAsset } from '@signalboard/llm';

// Since OPENROUTER_API_KEY is required for live tests, we skip this on CI if missing.
// Locally, you can run `pnpm test` with your API key set.
describe('LLM Analysis Contract', () => {
  it('should parse a text note into the AssetAnalysis schema', async () => {
    // Only run if key is present
    if (!process.env.OPENROUTER_API_KEY) {
      console.warn('Skipping test: OPENROUTER_API_KEY missing.');
      return;
    }

    const payload = { text: "We need high-contrast brutalist UI with neon typography." };
    const result = await analyzeAsset(payload);

    expect(result).toBeDefined();
    expect(result.tags.length).toBeGreaterThan(0);
    expect(result.descriptiveSignals.length).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
    expect(result.modelVersion).toBe('google/gemini-2.5-flash');
  });
});
