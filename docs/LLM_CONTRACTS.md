# LLM_CONTRACTS.md

All LLM interactions must be contract-based.

For each LLM operation, document:
- contract name
- prompt version
- purpose
- model routing recommendation
- input schema
- output schema
- retry/repair policy
- fallback behavior
- fixture coverage
- known failure modes

---

## asset-analysis.v1

**Purpose:** Per-asset multimodal interpretation. Extracts visual and semantic tags, descriptive signals, and a confidence score from an image or text asset.

**Model:** google/gemini-2.5-flash via OpenRouter (multimodal required)

**Input:**
- imageUrl: string (for image assets)
- rawText: string (for text assets)

**Output schema:** `AssetAnalysisSchema` (packages/domain)
```
tags: string[]
descriptiveSignals: string[]
confidence: number (0–1)
modelVersion: string
```

**Retry/repair:** Vercel AI SDK generateObject handles schema repair. Max 2 retries.

**Fallback:** On failure, asset is marked `loadingStatus: 'error'` and excluded from synthesis.

**Fixture coverage:** `packages/test-harness/src/analysis.test.ts` — determinism bounds

**Known failure modes:** Low-signal images (solid colors, blank screenshots) produce generic tags.

---

## session-synthesis.v1

**Purpose:** Cross-asset aggregation. Identifies shared aesthetic themes, genuine conflicts, rates overall direction ambiguity, and recommends clarification topics.

**Model:** google/gemini-2.5-flash via OpenRouter

**Input:**
- sessionId: string
- analyses: AssetAnalysis[] — all per-asset analyses for the session

**Output schema:** `SessionSynthesisSchema` minus id/sessionId/createdAt (generated)
```
aggregateSignals: string[]
conflictingSignals: string[]
ambiguityScore: number (0–1)
recommendedQuestions: string[]
```

**Prompt version:** synthesis.v1 — instructs model to be decisive, avoid generic questions, root conflicts in actual signal tensions.

**Retry/repair:** Vercel AI SDK generateObject. Max 2 retries.

**Fallback:** On failure, synthesizeSessionAction returns `{ success: false, error }`. UI surfaces error to user.

**Fixture coverage:** Not yet created. Scheduled for Wave 5.

**Known failure modes:** With fewer than 3 assets, ambiguityScore tends to be artificially low.

---

## clarification-questions.v1

**Purpose:** Converts synthesis-recommended topics into precise, typed, prioritised clarification questions.

**Model:** google/gemini-2.5-flash via OpenRouter

**Input:**
- sessionId: string
- recommendedQuestions: string[] — topic labels from synthesis
- aggregateSignals: string[]
- conflictingSignals: string[]

**Output schema:** Inline Zod schema in `packages/llm/src/clarification.ts`
```
questions[]:
  prompt: string
  questionType: single_select | multi_select | free_text
  options: string[] (optional, for select types)
  rationale: string
  priority: number (1–5)
```

**Question cap:** 5 max (spec §16.2 specifies 3; currently 5 — ASSUMPTION safe default pending validation)

**Retry/repair:** Vercel AI SDK generateObject. Max 2 retries.

**Fallback:** On failure, planClarificationQuestionsAction returns `{ success: false }`. ClarificationPanel surfaces error.

**Fixture coverage:** Not yet created. Scheduled for Wave 5.

**Known failure modes:** Occasionally generates overlapping questions when conflicts are subtle.

---

## output-ui-direction.v1

**Purpose:** Generates a structured UI/Product Style Direction brief grounded in asset signals and clarification answers.

**Model:** google/gemini-2.5-flash via OpenRouter

**Input:**
- outputType: 'UI/Product Style Direction'
- aggregateSignals: string[]
- conflictingSignals: string[]
- answeredPairs: Array<{ question: string, answer: string }>
- allSignals: string[] — flat list of all asset descriptive signals

**Output schema:** UIDirectionOutputSchema (packages/llm/src/output.ts)
```
directionSummary: string
coreAttributes: string[]
visualPrinciples: string[]
colorDirection: string
typographyDirection: string
layoutCompositionDirection: string
interactionMotionCues: string
isAndIsNot: { is: string[], isNot: string[] }
implementationGuardrails: string[]
suggestedNextSteps: string[]
confidenceNotes: string
```

**Retry/repair:** Vercel AI SDK generateObject. Max 2 retries.

**Fallback:** generateOutputAction returns `{ success: false }`. OutputPanel surfaces error.

**Fixture coverage:** Not yet created. Scheduled for Wave 5.

**Known failure modes:** Generic output when signal set is sparse. confidenceNotes should flag this.

---

## output-brand-direction.v1

**Purpose:** Generates a structured Brand/Visual Direction Brief grounded in asset signals and clarification answers.

**Model:** google/gemini-2.5-flash via OpenRouter

**Input:**
- outputType: 'Brand/Visual Direction Brief'
- aggregateSignals: string[]
- conflictingSignals: string[]
- answeredPairs: Array<{ question: string, answer: string }>
- allSignals: string[]

**Output schema:** BrandDirectionOutputSchema (packages/llm/src/output.ts)
```
directionSummary: string
brandPersonality: string[]
visualTerritory: string
colorDirection: string
typographyDirection: string
compositionArtDirection: string
toneDescriptors: string[]
whatToAvoid: string[]
referenceRationale: string
suggestedNextSteps: string[]
confidenceNotes: string
```

**Retry/repair:** Vercel AI SDK generateObject. Max 2 retries.

**Fallback:** generateOutputAction returns `{ success: false }`. OutputPanel surfaces error.

**Fixture coverage:** Not yet created. Scheduled for Wave 5.

**Known failure modes:** Brand direction can conflate product and identity concerns when input is mixed.
