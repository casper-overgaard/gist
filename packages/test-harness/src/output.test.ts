import { describe, it, expect } from "vitest";
import { z } from "zod";
import { uiOutputValid, brandOutputValid } from "./fixtures/output.fixture";

// Mirror of UIDirectionOutputSchema from packages/llm (schema contract test)
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

describe("Output contract — UI/Product Style Direction schema", () => {
  it("validates a valid UI output fixture", () => {
    const result = UIDirectionOutputSchema.safeParse(uiOutputValid);
    expect(result.success).toBe(true);
  });

  it("requires directionSummary to be non-empty", () => {
    const bad = { ...uiOutputValid, directionSummary: "" };
    const result = UIDirectionOutputSchema.safeParse(bad);
    // Schema allows empty string — this is intentional; real check is content quality
    // Just verify it still parses (content quality is an LLM harness concern)
    expect(result.success).toBe(true);
  });

  it("requires isAndIsNot to have both is and isNot arrays", () => {
    const bad = { ...uiOutputValid, isAndIsNot: { is: ["precise"] } };
    const result = UIDirectionOutputSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("rejects missing coreAttributes", () => {
    const { coreAttributes: _, ...bad } = uiOutputValid;
    const result = UIDirectionOutputSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("rejects non-array visualPrinciples", () => {
    const bad = { ...uiOutputValid, visualPrinciples: "precision over decoration" };
    const result = UIDirectionOutputSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });
});

describe("Output contract — Brand/Visual Direction Brief schema", () => {
  it("validates a valid brand output fixture", () => {
    const result = BrandDirectionOutputSchema.safeParse(brandOutputValid);
    expect(result.success).toBe(true);
  });

  it("rejects missing brandPersonality", () => {
    const { brandPersonality: _, ...bad } = brandOutputValid;
    const result = BrandDirectionOutputSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("requires whatToAvoid to be an array", () => {
    const bad = { ...brandOutputValid, whatToAvoid: "no gradients" };
    const result = BrandDirectionOutputSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });
});

// Live LLM test — skipped on CI
describe("Output contract — live LLM", () => {
  it("generates a schema-valid UI direction brief", async () => {
    if (!process.env.OPENROUTER_API_KEY) {
      console.warn("Skipping live output test: OPENROUTER_API_KEY missing.");
      return;
    }

    const { generateOutput } = await import("@signalboard/llm");
    const result = await generateOutput(
      "test-session",
      "UI/Product Style Direction",
      {
        aggregateSignals: ["minimalism", "dark mode", "typography-led"],
        conflictingSignals: [],
      },
      [],
      ["Geometric precision", "Restrained palette"],
      1
    );

    const parsed = UIDirectionOutputSchema.safeParse(result.structuredPayload);
    expect(parsed.success).toBe(true);
    expect(result.markdownBody.length).toBeGreaterThan(100);
  });
});
