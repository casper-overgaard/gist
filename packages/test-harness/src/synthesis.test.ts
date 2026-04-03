import { describe, it, expect } from "vitest";
import { SessionSynthesisSchema } from "@signalboard/domain";
import {
  synthesisClearMinimal,
  synthesisAmbiguousConflict,
  synthesisLowSignal,
} from "./fixtures/synthesis.fixture";

const SynthesisOutputSchema = SessionSynthesisSchema.omit({
  id: true,
  sessionId: true,
  createdAt: true,
});

describe("Synthesis contract — schema validation", () => {
  it("validates a clear minimal fixture", () => {
    const result = SynthesisOutputSchema.safeParse(synthesisClearMinimal);
    expect(result.success).toBe(true);
  });

  it("validates an ambiguous conflict fixture", () => {
    const result = SynthesisOutputSchema.safeParse(synthesisAmbiguousConflict);
    expect(result.success).toBe(true);
  });

  it("validates a low-signal fixture", () => {
    const result = SynthesisOutputSchema.safeParse(synthesisLowSignal);
    expect(result.success).toBe(true);
  });

  it("rejects synthesis missing aggregateSignals", () => {
    const bad = { ...synthesisClearMinimal, aggregateSignals: undefined };
    const result = SynthesisOutputSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("rejects ambiguityScore outside 0–1", () => {
    const bad = { ...synthesisClearMinimal, ambiguityScore: 1.5 };
    const result = SynthesisOutputSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("ambiguityScore is 0–1 in all fixtures", () => {
    for (const fixture of [synthesisClearMinimal, synthesisAmbiguousConflict, synthesisLowSignal]) {
      expect(fixture.ambiguityScore).toBeGreaterThanOrEqual(0);
      expect(fixture.ambiguityScore).toBeLessThanOrEqual(1);
    }
  });

  it("high ambiguity fixture has recommended questions", () => {
    expect(synthesisAmbiguousConflict.ambiguityScore).toBeGreaterThan(0.5);
    expect(synthesisAmbiguousConflict.recommendedQuestions.length).toBeGreaterThan(0);
  });

  it("clear fixture has no conflicting signals", () => {
    expect(synthesisClearMinimal.conflictingSignals).toHaveLength(0);
  });
});

// Live LLM test — skipped on CI unless API key is present
describe("Synthesis contract — live LLM", () => {
  it("produces schema-valid output for a real text asset", async () => {
    if (!process.env.OPENROUTER_API_KEY) {
      console.warn("Skipping live synthesis test: OPENROUTER_API_KEY missing.");
      return;
    }

    const { synthesizeSession } = await import("@signalboard/llm");
    const result = await synthesizeSession("test-session-id", [
      {
        id: "a1",
        assetId: "a1",
        tags: ["minimalism", "swiss design"],
        descriptiveSignals: ["Geometric precision with restrained palette"],
        confidence: 0.9,
        modelVersion: "google/gemini-2.5-flash",
        createdAt: new Date().toISOString(),
      },
    ]);

    const parsed = SynthesisOutputSchema.safeParse(result);
    expect(parsed.success).toBe(true);
  });
});
