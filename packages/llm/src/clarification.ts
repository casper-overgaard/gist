import { generateObject } from "ai";
import { z } from "zod";
import { defaultModel } from "./openrouter";

const MAX_QUESTIONS = 5;

const ClarificationQuestionOutputSchema = z.object({
  questions: z.array(
    z.object({
      prompt: z.string(),
      questionType: z.enum(["single_select", "multi_select", "free_text"]),
      options: z.array(z.string()).optional(),
      rationale: z.string(),
      priority: z.number().min(1).max(5),
    })
  ).max(MAX_QUESTIONS),
});

export async function planClarificationQuestions(
  sessionId: string,
  recommendedQuestions: string[],
  aggregateSignals: string[],
  conflictingSignals: string[]
): Promise<Array<{
  id: string;
  sessionId: string;
  questionType: "single_select" | "multi_select" | "free_text";
  prompt: string;
  options?: string[];
  priority: number;
  status: "pending";
  rationale: string;
}>> {
  if (recommendedQuestions.length === 0) return [];

  const result = await generateObject({
    model: defaultModel,
    schema: ClarificationQuestionOutputSchema,
    messages: [
      {
        role: "system",
        content: `You are a creative strategist. Convert the following clarification topics into precise, answerable questions for a design brief.
For each question: choose the most appropriate type (single_select if 2-4 mutually exclusive options exist, multi_select if multiple can apply, free_text for open-ended nuance).
Provide 2-4 options for select questions. Keep options distinct and actionable.
Prioritize by impact on resolving ambiguity (1 = highest).`
      },
      {
        role: "user",
        content: `Aggregate signals: ${aggregateSignals.join(", ")}\nConflicts: ${conflictingSignals.join(", ")}\n\nTopics to clarify:\n${recommendedQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
      }
    ]
  });

  return result.object.questions.slice(0, MAX_QUESTIONS).map((q, i) => ({
    id: crypto.randomUUID(),
    sessionId,
    questionType: q.questionType,
    prompt: q.prompt,
    options: q.options,
    priority: q.priority ?? i + 1,
    status: "pending" as const,
    rationale: q.rationale,
  }));
}
