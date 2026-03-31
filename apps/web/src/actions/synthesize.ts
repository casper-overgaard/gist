"use server";

import { synthesizeSession } from "@signalboard/llm";
import { AssetAnalysis } from "@signalboard/domain";

export async function synthesizeSessionAction(
  sessionId: string,
  analyses: AssetAnalysis[]
) {
  try {
    const synthesis = await synthesizeSession(sessionId, analyses);
    return { success: true, data: synthesis };
  } catch (error: any) {
    console.error("Synthesis Error:", error);
    return { success: false, error: error.message || "Failed to synthesize session" };
  }
}
