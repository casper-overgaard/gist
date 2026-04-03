# TEST_STRATEGY.md

## Test layers

| Layer | Tool | Location | Status |
|---|---|---|---|
| Schema/contract tests | Vitest | `packages/test-harness/src/` | ✓ 19 tests passing |
| Unit tests (web) | Vitest | `apps/web/src/` | minimal — no pure logic units exist yet |
| E2E — happy path | Playwright | `apps/web/e2e/happy-path.spec.ts` | ✓ 5 tests passing |
| Live LLM harness | Vitest (conditional) | `packages/test-harness/src/` | skips on CI (no API key); run locally |

---

## Current test coverage

### Schema/contract tests (`packages/test-harness`)

**synthesis.test.ts** (9 tests):
- validates 3 synthesis fixtures against `SessionSynthesisSchema`
- rejects missing `aggregateSignals`, out-of-range `ambiguityScore`
- fixture invariant checks (clear → no conflicts, ambiguous → has questions)
- 1 live LLM test (skipped on CI)

**output.test.ts** (9 tests):
- validates `uiOutputValid` and `brandOutputValid` fixtures against their Zod schemas
- rejects missing required fields, non-array fields, missing nested `isAndIsNot.isNot`
- 1 live LLM test (skipped on CI)

**analysis.test.ts** (1 test):
- 1 live LLM test (skipped on CI)
- validates `analyzeAsset()` against `AssetAnalysisSchema`

**Total: 19 tests, all passing on CI**

### E2E tests (`apps/web/e2e`)

**happy-path.spec.ts** (5 tests — Playwright Chromium against production URL):
1. Creates a session and navigates to workspace
2. Adds a text note and triggers analysis (waits for tags to appear)
3. Synthesizes signals and enables Generate button
4. Generates a direction brief (end-to-end, verifies "DIRECTION SUMMARY" and "Export .md")
5. Asset deletion removes card from canvas

**Total: 5 tests, all passing on CI (post-deploy)**

---

## CI test execution

```
build_and_test job (all branches):
  pnpm --filter web run test                      → Vitest (web unit tests)
  pnpm --filter @signalboard/test-harness run test → Vitest (schema/contract tests)

e2e job (main branch only, after deploy):
  npx playwright test                             → 5 E2E tests against production
```

---

## Critical flows — coverage status

| Flow | Unit | Schema | E2E |
|---|---|---|---|
| Create session | — | — | ✓ |
| Add text note | — | — | ✓ |
| Add image asset (drag-drop) | — | — | — |
| Add URL asset | — | — | — |
| Analyse asset | — | ✓ (live) | ✓ |
| Synthesize signals | — | ✓ | ✓ |
| Generate clarification questions | — | — | — |
| Submit clarification answers | — | — | — |
| Generate output | — | ✓ | ✓ |
| Export markdown | — | — | ✓ |
| Asset deletion | — | — | ✓ |
| Persist/reload session | — | — | — |
| Re-synthesize after answers | — | — | — |

---

## Edge cases — coverage status

| Edge case | Covered |
|---|---|
| Empty canvas | — |
| Only text input | ✓ (E2E test 2–4 use single text note) |
| Only one image | — |
| Highly conflicting inspiration | ✓ (synthesisAmbiguousConflict fixture) |
| Broken URL | — |
| Malformed LLM JSON | — (Vercel AI SDK repair handles silently) |
| Model timeout | — |
| Partial synthesis failure | — |
| Repeated regenerate cycles | — |

---

## Wave 5 test scope

Planned additions:
- Edge case E2E: broken URL input, empty canvas synthesize attempt
- Re-synthesis after clarification answers
- Session reload / persistence check
- Reduce/expand E2E to cover clarification answer submission
- Performance smoke: time-to-interactive measurement
