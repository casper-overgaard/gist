import { generateObject } from 'ai';
import { defaultModel } from './openrouter';
import { AssetAnalysisSchema } from '@signalboard/domain';

// We omit the database IDs because the frontend/backend will generate the UUID bounds.
const AnalysisResultSchema = AssetAnalysisSchema.omit({
  id: true,
  assetId: true,
  createdAt: true,
  modelVersion: true
});

export async function analyzeAsset(payload: { imageUrl?: string; text?: string }) {
  const messages: any[] = [
    {
      role: 'system',
      content: `You are an expert creative director analyzing raw inspiration for a design project.
Your job is to extract precise, actionable design signals from the asset.

Return a JSON object with these fields:

tags: 3–6 short category keywords for fast classification (e.g. "brutalism", "editorial", "dark-mode").

perceptualSignals: 3–5 observations about emotional quality, directional tension, or aesthetic feel.
These are high-level — what does this evoke, what tension does it hold?
Examples: "confident restraint under pressure", "industrial warmth", "precision that invites rather than intimidates".
Not generic descriptors like "clean" or "modern". Name the specific quality.

craftSignals: 5–8 specific, implementable observations. Name the actual thing.
Not "clean layout" — name the grid gap. Not "nice typography" — name the weight, size, tracking.
Not "good color" — name the specific hue, saturation level, or usage pattern.
Examples:
- "borderless ghost buttons with 1px stroke, no fill"
- "consistent 8px grid gap between all elements"
- "monospace body text at 13px, 1.65 line height"
- "amber at ~12% opacity for hover state backgrounds"
- "full-bleed images with no card padding, content overlaid"
- "uppercase tracking-[0.14em] labels at 9–10px for all section headers"
- "navigation uses text-only links, no icons, no active indicator except opacity shift"

confidence: float 0.0–1.0 — how clearly you can read the stylistic intent.`
    }
  ];

  const contentArray: any[] = [{ type: 'text', text: 'Analyze this asset:' }];

  if (payload.imageUrl) {
    contentArray.push({ type: 'image', image: payload.imageUrl });
  } else if (payload.text) {
    contentArray.push({ type: 'text', text: payload.text });
  }

  messages.push({
    role: 'user',
    content: contentArray
  });

  const result = await generateObject({
    model: defaultModel,
    schema: AnalysisResultSchema,
    messages,
    mode: 'json'
  });

  return {
    ...result.object,
    modelVersion: 'google/gemini-2.5-flash'
  };
}
