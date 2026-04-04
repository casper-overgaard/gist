import { z } from 'zod';

export const AssetTypeSchema = z.enum(['image', 'url', 'text']);

export const AssetSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  type: AssetTypeSchema,
  source: z.string().optional(),
  contentRef: z.string().optional(),
  rawText: z.string().nullable(),
  metadata: z.record(z.string(), z.any()).optional(),
  canvasPosition: z.object({
    x: z.number(),
    y: z.number()
  }).optional(),
  createdAt: z.string().datetime()
});

export const AssetAnalysisSchema = z.object({
  id: z.string().uuid(),
  assetId: z.string().uuid(),
  tags: z.array(z.string()),
  perceptualSignals: z.array(z.string()),
  craftSignals: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  modelVersion: z.string(),
  createdAt: z.string().datetime()
});

export const SessionSynthesisSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  aggregateSignals: z.array(z.string()),
  conflictingSignals: z.array(z.string()),
  ambiguityScore: z.number().min(0).max(1),
  recommendedQuestions: z.array(z.string()),
  createdAt: z.string().datetime()
});

export const ClarificationQuestionSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  questionType: z.enum(['single_select', 'multi_select', 'free_text']),
  prompt: z.string(),
  options: z.array(z.string()).optional(),
  priority: z.number(),
  status: z.enum(['pending', 'answered', 'dismissed']),
  rationale: z.string(),
  sourceSignals: z.array(z.string()).optional()
});

export const ClarificationAnswerSchema = z.object({
  id: z.string().uuid(),
  questionId: z.string().uuid(),
  sessionId: z.string().uuid(),
  answerValue: z.union([z.string(), z.array(z.string())]),
  createdAt: z.string().datetime()
});

export const OutputDocumentSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  outputType: z.enum(['UI/Product Style Direction', 'Brand/Visual Direction Brief', 'Design Spec']),
  version: z.number(),
  structuredPayload: z.record(z.string(), z.any()), // Can be refined further based on output type
  markdownBody: z.string(),
  confidenceNotes: z.string(),
  createdAt: z.string().datetime()
});

export const SessionSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  title: z.string(),
  userIntent: z.string().optional(),
  selectedOutputType: z.enum(['UI/Product Style Direction', 'Brand/Visual Direction Brief', 'Design Spec']),
  status: z.enum(['active', 'completed', 'archived']),
  latestOutputId: z.string().uuid().nullable()
});

// Infer types
export type Asset = z.infer<typeof AssetSchema>;
export type AssetAnalysis = z.infer<typeof AssetAnalysisSchema>;
export type SessionSynthesis = z.infer<typeof SessionSynthesisSchema>;
export type ClarificationQuestion = z.infer<typeof ClarificationQuestionSchema>;
export type ClarificationAnswer = z.infer<typeof ClarificationAnswerSchema>;
export type OutputDocument = z.infer<typeof OutputDocumentSchema>;
export type Session = z.infer<typeof SessionSchema>;
