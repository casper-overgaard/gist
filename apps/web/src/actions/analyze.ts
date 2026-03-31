"use server";

import { analyzeAsset as llmAnalyze } from "@signalboard/llm";

export async function analyzeAssetAction(payload: { imageUrl?: string; text?: string }) {
  try {
    const analysis = await llmAnalyze(payload);
    return { success: true, data: analysis };
  } catch (error: any) {
    console.error("LLM Analysis Error:", error);
    return { success: false, error: error.message || "Failed to analyze asset" };
  }
}
