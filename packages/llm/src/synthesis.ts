import { generateObject } from "ai";
import { defaultModel } from "./openrouter";
import { SessionSynthesisSchema, AssetAnalysis } from "@signalboard/domain";

const SynthesisResultSchema = SessionSynthesisSchema.omit({
  id: true,
  sessionId: true,
  createdAt: true,
});

export async function synthesizeSession(
  sessionId: string,
  analyses: AssetAnalysis[]
): Promise<{ aggregateSignals: string[]; conflictingSignals: string[]; ambiguityScore: number; recommendedQuestions: string[] }> {
  const signalLines = analyses.flatMap((a) => [
    ...a.tags.map((t) => `- tag: ${t}`),
    ...a.descriptiveSignals.map((s) => `- signal: ${s}`),
  ]);

  const result = await generateObject({
    model: defaultModel,
    schema: SynthesisResultSchema,
    messages: [
      {
        role: "system",
        content: `You are a senior creative strategist synthesizing inspiration signals from a moodboard.
The user has assembled a collection of images and text notes. Each has been analyzed into design tags and descriptive signals.
Your job:
1. Extract the strongest shared aesthetic themes (aggregateSignals).
2. Identify genuine conflicts or tensions in direction (conflictingSignals). Only include real conflicts, not superficial variety.
3. Rate overall ambiguity from 0.0 (crystal-clear direction) to 1.0 (totally contradictory or empty).
4. Produce up to 5 targeted clarification questions that would most help resolve the ambiguity.

Be decisive. Do not produce generic questions like "what's the mood?". Root every question in specific tensions found in the signals.`
      },
      {
        role: "user",
        content: `Here are all the signals extracted from the session's assets:\n\n${signalLines.join("\n")}\n\nPlease synthesize and return your analysis.`
      }
    ]
  });

  return result.object;
}
