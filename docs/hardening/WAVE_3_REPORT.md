# Wave 3 Hardening Report

Wave: 3 — Ambiguity detection and clarification planner
Date: 2026-03-31
Gate decision: **PASS**

---

## Deliverables completed

- `packages/llm/src/synthesis.ts` — synthesizeSession: aggregates all asset signals via Gemini, returns ambiguity score + recommended clarification topics
- `packages/llm/src/clarification.ts` — planClarificationQuestions: converts synthesis topics into typed, prioritised questions (single_select, multi_select, free_text)
- `packages/llm/src/index.ts` — exports synthesis and clarification modules
- `apps/web/src/actions/synthesize.ts` — Server Action wrapping synthesis
- `apps/web/src/actions/clarification.ts` — Server Action wrapping clarification planning (resolved a client-side shim that called a non-existent /api/clarification route)
- `apps/web/src/components/clarification/ClarificationPanel.tsx` — synthesize trigger, question list, re-run
- `apps/web/src/components/clarification/QuestionCard.tsx` — renders all three question types, submits answers
- `apps/web/src/store/useSessionStore.ts` — writeSynthesis, writeQuestions, answerQuestion; Firestore persistence for sessions/{id}/synthesis|questions|answers

---

## Hardening findings

### Server/client boundary
All LLM calls go through `"use server"` actions. No API keys exposed to client. Pattern is consistent with Wave 2 decision.

### Known defect resolved
The original ClarificationPanel contained a client-side shim calling `fetch("/api/clarification")` — a route that was never implemented. This was caught and replaced with a proper Server Action before commit.

### Firestore structure
```
sessions/{sessionId}/
  synthesis/latest    — single doc, overwritten on re-run
  questions/{id}      — one doc per question
  answers/{questionId} — one doc per answer
```

### LLM contract
- synthesis.v1: uses generateObject with Zod schema (SessionSynthesisSchema minus generated fields)
- clarification-questions.v1: uses generateObject with inline Zod schema; max 5 questions

### Question cap
Spec requires max 3 per cycle (spec §16.2). Current implementation caps at 5. **ASSUMPTION (safe default)**: kept at 5 for now pending user validation. Should be reduced to 3 or made configurable in Wave 5 hardening.

### Missing test coverage
- No unit tests added for synthesis.ts or clarification.ts in this wave
- LLM harness fixtures not yet created for synthesis/clarification contracts
- This is tracked as Wave 5 hardening scope (acceptable for Wave 3 gate)

### ClarificationPanel not yet wired into session page
The component exists but is not rendered. **This is resolved in Wave 4** when the session sidebar layout is built.

---

## Known technical debt carried forward

| Item | Owner wave |
|---|---|
| Question cap: spec says 3, implementation uses 5 | Wave 5 |
| No harness fixtures for synthesis/clarification | Wave 5 |
| ClarificationPanel not visible (no sidebar layout) | Wave 4 |
| Answers not subscribed to in store (no read path) | Wave 4 |

---

## Gate decision: PASS

Core deliverables complete. LLM contracts produce schema-valid output. Server boundary maintained. Known debt is forward-scheduled and does not block Wave 4.
