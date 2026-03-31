# WAVE 2 HARDENING REPORT

**Goal**: Multimodal Ingestion & Analysis Layer
**State**: PASS

## Audit Summary
- **LLM Boundary Protection**: Validated. Next.js Server Actions (`"use server"`) act as a strictly enforced, impenetrable proxy between the open browser network layer and the `OPENROUTER_API_KEY`. The raw keys never reach the client bundle (resolving NFR-024).
- **Static Export Concession**: Reverted Next.js App Router `output: export` to permit edge rendering dependencies for Server Actions. Firebase App Hosting (`firebase.json` app frameworks parameter) will compile Server elements adequately via GitHub sync.
- **Contract Enforcement**: Vercel AI SDK implements strict validation leveraging Zod `AssetAnalysisSchema` exported uniformly from `@signalboard/domain`.
- **Eager Upload Performance**: The `Canvas` components drop logic initiates parallel optimism streams writing placeholders immediately, executing background Firebase Storage uploads efficiently before piping the signed reference into OpenRouter's vision context arrays.

## Test Artifacts Created
- `packages/test-harness/src/analysis.test.ts` covers determinism bounds when analyzing textual design briefs. Evaluates boundary precision (`google/gemini-2.5-flash`).

## Known Technical Debt
- Image drops in ReactFlow natively spawn in arbitrary upper coordinates mapped identically to viewport dimensions; they should be translated to viewport project coordinates using the `useReactFlow().screenToFlowPosition()` API in Wave 3 for perfectly accurate drops.

## Recommendation for Next Wave
**Proceed to Wave 3: Ambiguity Synthesis & Output Formatting.** The `AssetAnalysis` records successfully embed their Zod signals into the `<ImageNode>` & `<TextNode>` state. Wave 3 will focus on reading all embedded nodes, routing them to the overarching Session Synthesis context prompt, and rendering the selected "Brand/Visual Direction Brief" artifact.
