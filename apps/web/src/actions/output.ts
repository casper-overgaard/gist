"use server";

import { generateOutput } from "@signalboard/llm";
import { OutputDocument } from "@signalboard/domain";

interface GenerateOutputParams {
  sessionId: string;
  outputType: "UI/Product Style Direction" | "Brand/Visual Direction Brief";
  synthesis: {
    aggregateSignals: string[];
    conflictingSignals: string[];
  };
  answeredPairs: Array<{ question: string; answer: string }>;
  allSignals: string[];
  version: number;
}

export async function generateOutputAction(
  params: GenerateOutputParams
): Promise<{ success: true; data: OutputDocument } | { success: false; error: string }> {
  try {
    const output = await generateOutput(
      params.sessionId,
      params.outputType,
      params.synthesis,
      params.answeredPairs,
      params.allSignals,
      params.version
    );
    return { success: true, data: output };
  } catch (error: unknown) {
    console.error("Output generation error:", error?.message, error?.cause, error?.text);
    return { success: false, error: error instanceof Error ? error.message : "Failed to generate output" };
  }
}
