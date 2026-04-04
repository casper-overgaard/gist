"use server";

import { generateMergeOutput, ConnectedAsset } from "@signalboard/llm";
import { MergeOutput } from "@signalboard/domain";

interface GenerateMergeOutputParams {
  assets: ConnectedAsset[];
  sessionContext?: string;
}

export async function generateMergeOutputAction(
  params: GenerateMergeOutputParams
): Promise<{ success: true; data: MergeOutput } | { success: false; error: string }> {
  try {
    const result = await generateMergeOutput(params.assets, params.sessionContext);
    return { success: true, data: result };
  } catch (err) {
    console.error("Merge output generation failed:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
