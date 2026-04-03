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

**Model:** google/gemini-2.5-flash via OpenRouter (multimodal required for image assets)

**Input:**
- `imageUrl: string` — for image assets (passed as image content block)
- `rawText: string` — for text assets

**Output schema:** `AssetAnalysisSchema` (packages/domain) — minus `id`, `assetId`, `createdAt`, `modelVersion` (generated)
```
tags: string[]
descriptiveSignals: string[]
confidence: number (0–1)
```

**Retry/repair:** Vercel AI SDK `generateObject` handles schema repair. Max 2 retries.

**Fallback:** On failure, `analyzeAssetAction` returns `{ success: false, error }`. Asset is marked `loadingStatus: 'error'` and excluded from synthesis.

**Sentry:** `captureException` called in catch block of `analyzeAssetAction`.

**Fixture coverage:** `packages/test-harness/src/analysis.test.ts` — 1 live test, skipped on CI

**Known failure modes:** Low-signal images (solid colors, blank screenshots) produce generic tags.

---

## session-synthesis.v1

**Purpose:** Cross-asset aggregation. Identifies shared aesthetic themes, genuine conflicts, rates overall direction ambiguity, and recommends clarification topics.

**Model:** google/gemini-2.5-flash via OpenRouter

**Input:**
- `sessionId: string`
- `analyses: AssetAnalysis[]` — all per-asset analyses for the session

**Output schema:** `SessionSynthesisSchema` minus `id`/`sessionId`/`createdAt` (generated)
```
aggregateSignals: string[]
conflictingSignals: string[]
ambiguityScore: number (0–1)
recommendedQuestions: string[]
```

**Prompt version:** synthesis.v1 — instructs model to be decisive, avoid generic questions, root conflicts in actual signal tensions.

**Retry/repair:** Vercel AI SDK `generateObject`. Max 2 retries.

**Fallback:** On failure, `synthesizeSessionAction` returns `{ success: false, error }`. `ClarificationPanel` logs error.

**Sentry:** `captureException` called in catch block of `synthesizeSessionAction`.

**Fixture coverage:** `packages/test-harness/src/synthesis.test.ts` — 8 schema validation tests (static fixtures) + 1 live LLM test (skipped on CI). **All passing.**

**Known failure modes:** With fewer than 3 assets, `ambiguityScore` tends to be artificially low.

---

## clarification-questions.v1

**Purpose:** Converts synthesis-recommended topics into precise, typed, prioritised clarification questions.

**Model:** google/gemini-2.5-flash via OpenRouter

**Input:**
- `sessionId: string`
- `recommendedQuestions: string[]` — topic labels from synthesis
- `aggregateSignals: string[]`
- `conflictingSignals: string[]`

**Output schema:** Inline Zod schema in `packages/llm/src/clarification.ts`
```
questions[]:
  prompt: string
  questionType: single_select | multi_select | free_text
  options: string[] (optional, for select types)
  rationale: string
  priority: number (1–5)
```

**Question cap:** `MAX_QUESTIONS = 5`. Spec §16.2 specifies 3. **ASSUMPTION (safe default):** kept at 5 pending Wave 5 validation.

**Retry/repair:** Vercel AI SDK `generateObject`. Max 2 retries.

**Fallback:** On failure, `planClarificationQuestionsAction` returns `{ success: false }`. `ClarificationPanel` logs error; synthesis results still available.

**Sentry:** `captureException` called in catch block of `planClarificationQuestionsAction`.

**Fixture coverage:** No static fixtures yet. Scheduled for Wave 5.

**Known failure modes:** Occasionally generates overlapping questions when conflicts are subtle.

---

## output-ui-direction.v1

**Purpose:** Generates a structured UI/Product Style Direction brief grounded in asset signals and clarification answers.

**Model:** google/gemini-2.5-flash via OpenRouter

**Mode:** `generateObject` with `mode: 'json'` — required for Gemini via OpenRouter to return raw JSON rather than prose.

**Input:**
- `outputType: 'UI/Product Style Direction'`
- `synthesis: { aggregateSignals: string[], conflictingSignals: string[] }`
- `answeredPairs: Array<{ question: string, answer: string }>`
- `allSignals: string[]` — flat list of all asset descriptive signals
- `version: number`

**Output schema:** `UIDirectionOutputSchema` (packages/llm/src/output.ts)
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

**Retry/repair:** Vercel AI SDK `generateObject`. Max 2 retries.

**Fallback:** `generateOutputAction` returns `{ success: false }`. `OutputPanel` surfaces error state.

**Sentry:** `captureException` called in catch block of `generateOutputAction`.

**Fixture coverage:** `packages/test-harness/src/output.test.ts` — 8 schema validation tests (static fixture) + 1 live LLM test (skipped on CI). **All passing.**

**Known failure modes:** Generic output when signal set is sparse. `confidenceNotes` should flag this.

---

## output-brand-direction.v1

**Purpose:** Generates a structured Brand/Visual Direction Brief grounded in asset signals and clarification answers.

**Model:** google/gemini-2.5-flash via OpenRouter

**Mode:** `generateObject` with `mode: 'json'` — same requirement as output-ui-direction.v1.

**Input:** Same as output-ui-direction.v1 except `outputType: 'Brand/Visual Direction Brief'`.

**Output schema:** `BrandDirectionOutputSchema` (packages/llm/src/output.ts)
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

**Retry/repair:** Vercel AI SDK `generateObject`. Max 2 retries.

**Fallback:** `generateOutputAction` returns `{ success: false }`. `OutputPanel` surfaces error state.

**Sentry:** `captureException` called in catch block of `generateOutputAction`.

**Fixture coverage:** `packages/test-harness/src/output.test.ts` — 3 schema validation tests (static fixture). **All passing.**

**Known failure modes:** Brand direction can conflate product and identity concerns when input is mixed.
