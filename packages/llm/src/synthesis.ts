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
  analyses: AssetAnalysis[],
  pinnedSignals: string[] = []
): Promise<{ aggregateSignals: string[]; conflictingSignals: string[]; ambiguityScore: number; recommendedQuestions: string[] }> {
  const signalLines = analyses.flatMap((a) => [
    ...a.tags.map((t) => `- tag: ${t}`),
    ...(a.perceptualSignals ?? []).map((s) => `- perceptual: ${s}`),
    ...(a.craftSignals ?? []).map((s) => `- craft: ${s}`),
  ]);

  const pinnedSection = pinnedSignals.length > 0
    ? `\nThe user has pinned these signals as particularly relevant — weight them heavily:\n${pinnedSignals.map((s) => `- ${s}`).join("\n")}\n`
    : "";

  const result = await generateObject({
    model: defaultModel,
    schema: SynthesisResultSchema,
    messages: [
      {
        role: "system",
        content: `You are a senior creative strategist synthesizing inspiration signals from a moodboard.
The user has assembled a collection of images and text notes. Each has been analyzed into tags, perceptual signals (emotional/directional feel), and craft signals (specific implementable observations).
Your job:
1. Extract the strongest shared aesthetic themes (aggregateSignals) — both perceptual and craft level.
2. Identify genuine conflicts or tensions in direction (conflictingSignals). Only include real conflicts, not superficial variety.
3. Rate overall ambiguity from 0.0 (crystal-clear direction) to 1.0 (totally contradictory or empty).
4. Produce up to 3 targeted clarification questions that would most help resolve the ambiguity.

Be decisive. Do not produce generic questions like "what's the mood?". Root every question in specific tensions found in the signals.${pinnedSection}`
      },
      {
        role: "user",
        content: `Here are all the signals extracted from the session's assets:\n\n${signalLines.join("\n")}\n\nPlease synthesize and return your analysis.`
      }
    ]
  });

  return result.object;
}
