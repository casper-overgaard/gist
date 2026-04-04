"use server";
import * as Sentry from "@sentry/nextjs";

import { generateOutput, AssetAnnotation } from "@signalboard/llm";
import { OutputDocument, MergeOutput } from "@signalboard/domain";

interface GenerateOutputParams {
  sessionId: string;
  synthesis: {
    aggregateSignals: string[];
    conflictingSignals: string[];
  };
  answeredPairs: Array<{ question: string; answer: string }>;
  allSignals: string[];
  pinnedSignals: string[];
  assetAnnotations: AssetAnnotation[];
  userIntent: string;
  version: number;
  mergeFragments?: MergeOutput[];
}

export async function generateOutputAction(
  params: GenerateOutputParams
): Promise<{ success: true; data: OutputDocument } | { success: false; error: string }> {
  try {
    const output = await generateOutput(
      params.sessionId,
      params.synthesis,
      params.answeredPairs,
      params.allSignals,
      params.pinnedSignals,
      params.assetAnnotations,
      params.userIntent,
      params.version,
      params.mergeFragments ?? []
    );
    return { success: true, data: output };
  } catch (error: unknown) {
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)));
    console.error("Output generation error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to generate output" };
  }
}
