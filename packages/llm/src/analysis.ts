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
      content: `You are an expert creative director analyzing raw inspiration. 
Your job is to interpret the user's uploaded asset (image or text note) and extract meaningful semantic, thematic, or typographic signals useful for brand and UI design.
Be decisive. Avoid generic filler words.

Return a JSON object conforming strictly to the requested schema:
- tags: short, punchy category keywords (e.g., 'brutalism', 'sans-serif', 'high-contrast').
- descriptiveSignals: specific, insightful phrases capturing the visual/tonal essence (e.g., 'Employs stark neon against deep blacks to create a cybernetic aesthetic').
- confidence: a float between 0.0 and 1.0 representing how clearly you can read the stylistic intent.

If the image is completely ambiguous or low-quality, return a lower confidence score.`
    }
  ];

  const contentArray: any[] = [{ type: 'text', text: 'Please analyze this asset:' }];

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
    messages
  });

  return {
    ...result.object,
    modelVersion: 'google/gemini-2.5-flash'
  };
}
