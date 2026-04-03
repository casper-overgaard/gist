# Wave 4 Hardening Report

Wave: 4 — Structured output generation + pipeline hardening
Date: 2026-04-03
Gate decision: **PASS**

---

## Deliverables completed

### Output generation
- `packages/llm/src/output.ts` — `generateOutput()` with `UIDirectionOutputSchema` and `BrandDirectionOutputSchema`. Fixed `mode: 'json'` required for Gemini via OpenRouter to return raw JSON (was returning prose).
- `apps/web/src/actions/output.ts` — `generateOutputAction` Server Action
- `apps/web/src/components/output/OutputPanel.tsx` — output type selector, Generate button, formatted brief rendering, Export .md button, version tracking

### Product features
- Asset deletion — hover-reveal × button on TextNode, ImageNode, UrlNode. `removeAsset()` in store.
- URL asset ingestion — `fetchUrlMetadataAction` fetches OG/Twitter meta tags with 8s timeout. `UrlNode` displays title, description, domain badge, OG image. URL cards go through full analysis pipeline.
- ClarificationPanel empty-state copy fix — now shows "Signals ready. Run synthesis to generate targeted questions." when assets are analyzed but not yet synthesized.

### Test harness
- `packages/test-harness/src/fixtures/synthesis.fixture.ts` — 3 fixtures: `synthesisClearMinimal` (ambiguity 0.1), `synthesisAmbiguousConflict` (0.75), `synthesisLowSignal` (0.9)
- `packages/test-harness/src/fixtures/output.fixture.ts` — `uiOutputValid`, `brandOutputValid`
- `packages/test-harness/src/synthesis.test.ts` — 9 tests (8 schema + 1 live)
- `packages/test-harness/src/output.test.ts` — 9 tests (8 schema + 1 live)
- **All 19 harness tests passing**

### Playwright E2E
- `apps/web/playwright.config.ts` — Chromium, production URL default, 60s timeout
- `apps/web/e2e/happy-path.spec.ts` — 5 tests covering full pipeline
- **All 5 tests passing against production URL**

### CI/CD
- `.github/workflows/ci.yml` — three-job pipeline: `build_and_test` → `deploy` → `e2e`
- GitHub secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- `pnpm --filter` workspace-scoped script delegation
- Vitest configured to exclude `e2e/` directory

### Sentry integration (FR-051)
- `@sentry/nextjs` installed
- `sentry.{client,server,edge}.config.ts` — init from `NEXT_PUBLIC_SENTRY_DSN`, production-only, 10% trace sampling
- `next.config.ts` wrapped with `withSentryConfig` — autoInstrumentServerFunctions enabled
- `src/app/global-error.tsx` — app-router error boundary with `captureException`
- All 5 server actions call `Sentry.captureException` in catch blocks

---

## Hardening findings

### Output generation: JSON mode fix
Gemini 2.5 Flash via OpenRouter returned prose instead of raw JSON for complex schemas with nested objects (`isAndIsNot`). Required `mode: 'json'` and explicit JSON-only system prompt instruction. This was a runtime bug caught during E2E testing.

### ESLint / TypeScript hygiene
CI introduced strict enforcement. Fixed: 11 `no-explicit-any` errors across server actions, Canvas component, OutputPanel, store. All `catch (error: any)` replaced with `catch (error: unknown)` + type narrowing.

### Vitest/Playwright conflict
`pnpm --filter web run test` picked up `e2e/happy-path.spec.ts` because Playwright `describe`/`test` are globally available. Fixed by adding `exclude: ['e2e/**']` to `vitest.config.ts`.

### test-harness missing `zod` dependency
`output.test.ts` imports `zod` directly. `zod` was only transitively available through `@signalboard/domain`. Added as explicit dependency in `packages/test-harness/package.json`.

### Server/client boundary
All LLM calls go through `"use server"` actions. `OPENROUTER_API_KEY` is server-only. Pattern consistent across all waves. No API keys exposed to client bundle.

### Firestore rules
Still open (`allow read, write: if true`). Wildcard subcollection rule covers all nested collections. Auth deferred to Wave 5 per DECISIONS.md.

---

## Debt carried forward

| Item | Owner wave |
|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` not yet provisioned in Vercel | Wave 5 |
| Firestore rules open — no auth | Wave 5 |
| Question cap: spec says 3, implementation uses 5 | Wave 5 |
| No E2E coverage for URL assets, clarification answer submission, session reload | Wave 5 |
| No static fixtures for clarification questions contract | Wave 5 |
| `packages/config` in spec/repo structure but not created | Wave 5 / low priority |

---

## CI status at gate

All jobs green:
- `build_and_test`: lint ✓, typecheck ✓, unit tests (web) ✓, unit tests (test-harness, 19/19) ✓, build ✓
- `deploy`: Vercel production deploy ✓
- `e2e`: 5/5 Playwright tests ✓

---

## Gate decision: PASS

All Wave 4 deliverables complete. Output generation validated end-to-end. Test coverage materially expanded. CI/CD fully automated. Sentry integrated (pending DSN). Known debt is bounded and scheduled for Wave 5.
