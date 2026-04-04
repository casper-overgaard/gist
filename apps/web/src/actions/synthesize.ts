"use server";
import * as Sentry from "@sentry/nextjs";

import { synthesizeSession } from "@signalboard/llm";
import { AssetAnalysis } from "@signalboard/domain";

export async function synthesizeSessionAction(
  sessionId: string,
  analyses: AssetAnalysis[],
  pinnedSignals: string[] = []
) {
  try {
    const synthesis = await synthesizeSession(sessionId, analyses, pinnedSignals);
    return { success: true, data: synthesis };
  } catch (error: unknown) {
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)));
    console.error("Synthesis Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to synthesize session" };
  }
}
