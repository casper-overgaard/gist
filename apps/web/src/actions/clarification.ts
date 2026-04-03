"use server";
import * as Sentry from "@sentry/nextjs";

import { planClarificationQuestions } from "@signalboard/llm";

export async function planClarificationQuestionsAction(
  sessionId: string,
  recommendedQuestions: string[],
  aggregateSignals: string[],
  conflictingSignals: string[]
) {
  try {
    const questions = await planClarificationQuestions(
      sessionId,
      recommendedQuestions,
      aggregateSignals,
      conflictingSignals
    );
    return { success: true, data: questions };
  } catch (error: unknown) {
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)));
    console.error("Clarification planning error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to plan clarification questions" };
  }
}
