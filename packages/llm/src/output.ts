import { generateObject } from "ai";
import { z } from "zod";
import { defaultModel } from "./openrouter";
import { OutputDocument } from "@signalboard/domain";

const UIDirectionOutputSchema = z.object({
  directionSummary: z.string(),
  coreAttributes: z.array(z.string()),
  visualPrinciples: z.array(z.string()),
  colorDirection: z.string(),
  typographyDirection: z.string(),
  layoutCompositionDirection: z.string(),
  interactionMotionCues: z.string(),
  isAndIsNot: z.object({
    is: z.array(z.string()),
    isNot: z.array(z.string()),
  }),
  implementationGuardrails: z.array(z.string()),
  suggestedNextSteps: z.array(z.string()),
  confidenceNotes: z.string(),
});

const BrandDirectionOutputSchema = z.object({
  directionSummary: z.string(),
  brandPersonality: z.array(z.string()),
  visualTerritory: z.string(),
  colorDirection: z.string(),
  typographyDirection: z.string(),
  compositionArtDirection: z.string(),
  toneDescriptors: z.array(z.string()),
  whatToAvoid: z.array(z.string()),
  referenceRationale: z.string(),
  suggestedNextSteps: z.array(z.string()),
  confidenceNotes: z.string(),
});

type AnsweredPair = { question: string; answer: string };

const SYSTEM_PROMPT = `You are a creative director producing a structured direction brief.
Your output must be grounded in the specific signals provided — not generic design advice.
Be decisive. Where signals conflict and were not resolved by clarification answers, name the tension explicitly in confidenceNotes.
Avoid filler phrases like "clean and modern" unless the signals specifically support them.
Every section should feel earned by the input.
Respond with a valid JSON object only — no markdown, no prose outside the JSON.`;

function buildUserMessage(
  aggregateSignals: string[],
  conflictingSignals: string[],
  answeredPairs: AnsweredPair[],
  allSignals: string[]
): string {
  const lines: string[] = [];
  lines.push(`Aggregate signals: ${aggregateSignals.join(", ")}`);
  if (conflictingSignals.length > 0) {
    lines.push(`Conflicting signals: ${conflictingSignals.join(", ")}`);
  }
  if (allSignals.length > 0) {
    lines.push(`All asset signals: ${allSignals.slice(0, 30).join(", ")}`);
  }
  if (answeredPairs.length > 0) {
    lines.push("\nClarification answers:");
    answeredPairs.forEach(({ question, answer }) => {
      lines.push(`  Q: ${question}\n  A: ${answer}`);
    });
  }
  return lines.join("\n");
}

function uiDirectionToMarkdown(
  payload: z.infer<typeof UIDirectionOutputSchema>
): string {
  return [
    `# UI/Product Style Direction`,
    ``,
    `## Direction Summary`,
    payload.directionSummary,
    ``,
    `## Core Attributes`,
    payload.coreAttributes.map((a) => `- ${a}`).join("\n"),
    ``,
    `## Visual Principles`,
    payload.visualPrinciples.map((p) => `- ${p}`).join("\n"),
    ``,
    `## Color Direction`,
    payload.colorDirection,
    ``,
    `## Typography Direction`,
    payload.typographyDirection,
    ``,
    `## Layout & Composition`,
    payload.layoutCompositionDirection,
    ``,
    `## Interaction & Motion Cues`,
    payload.interactionMotionCues,
    ``,
    `## This Direction Is / Is Not`,
    `**Is:** ${payload.isAndIsNot.is.join(", ")}`,
    `**Is not:** ${payload.isAndIsNot.isNot.join(", ")}`,
    ``,
    `## Implementation Guardrails`,
    payload.implementationGuardrails.map((g) => `- ${g}`).join("\n"),
    ``,
    `## Suggested Next Steps`,
    payload.suggestedNextSteps.map((s) => `- ${s}`).join("\n"),
  ].join("\n");
}

function brandDirectionToMarkdown(
  payload: z.infer<typeof BrandDirectionOutputSchema>
): string {
  return [
    `# Brand/Visual Direction Brief`,
    ``,
    `## Direction Summary`,
    payload.directionSummary,
    ``,
    `## Brand Personality`,
    payload.brandPersonality.map((p) => `- ${p}`).join("\n"),
    ``,
    `## Visual Territory`,
    payload.visualTerritory,
    ``,
    `## Color Direction`,
    payload.colorDirection,
    ``,
    `## Typography Direction`,
    payload.typographyDirection,
    ``,
    `## Composition & Art Direction`,
    payload.compositionArtDirection,
    ``,
    `## Tone Descriptors`,
    payload.toneDescriptors.map((t) => `- ${t}`).join("\n"),
    ``,
    `## What to Avoid`,
    payload.whatToAvoid.map((w) => `- ${w}`).join("\n"),
    ``,
    `## Reference Rationale`,
    payload.referenceRationale,
    ``,
    `## Suggested Next Steps`,
    payload.suggestedNextSteps.map((s) => `- ${s}`).join("\n"),
  ].join("\n");
}

export async function generateOutput(
  sessionId: string,
  outputType: "UI/Product Style Direction" | "Brand/Visual Direction Brief",
  synthesis: {
    aggregateSignals: string[];
    conflictingSignals: string[];
  },
  answeredPairs: AnsweredPair[],
  allSignals: string[],
  version: number
): Promise<OutputDocument> {
  const userContent = buildUserMessage(
    synthesis.aggregateSignals,
    synthesis.conflictingSignals,
    answeredPairs,
    allSignals
  );

  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    { role: "user" as const, content: userContent },
  ];

  if (outputType === "UI/Product Style Direction") {
    const result = await generateObject({
      model: defaultModel,
      schema: UIDirectionOutputSchema,
      messages,
      mode: "json",
    });
    const payload = result.object;
    return {
      id: crypto.randomUUID(),
      sessionId,
      outputType,
      version,
      structuredPayload: payload as Record<string, unknown>,
      markdownBody: uiDirectionToMarkdown(payload),
      confidenceNotes: payload.confidenceNotes,
      createdAt: new Date().toISOString(),
    };
  } else {
    const result = await generateObject({
      model: defaultModel,
      schema: BrandDirectionOutputSchema,
      messages,
      mode: "json",
    });
    const payload = result.object;
    return {
      id: crypto.randomUUID(),
      sessionId,
      outputType,
      version,
      structuredPayload: payload as Record<string, unknown>,
      markdownBody: brandDirectionToMarkdown(payload),
      confidenceNotes: payload.confidenceNotes,
      createdAt: new Date().toISOString(),
    };
  }
}
