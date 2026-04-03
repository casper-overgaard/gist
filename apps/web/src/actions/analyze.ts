"use server";
import * as Sentry from "@sentry/nextjs";

import { analyzeAsset as llmAnalyze } from "@signalboard/llm";

export async function analyzeAssetAction(payload: { imageUrl?: string; text?: string }) {
  try {
    const analysis = await llmAnalyze(payload);
    return { success: true, data: analysis };
  } catch (error: unknown) {
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)));
    console.error("LLM Analysis Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to analyze asset" };
  }
}
