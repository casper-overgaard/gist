# roadmap.md — Signalboard roadmap

Version: 1.1
Status: Execution roadmap aligned to `docs/spec.md` — Waves 0–4 complete, Wave 5 in progress

---

## Roadmap intent

This roadmap converts the canonical spec into staged implementation waves with explicit gates. It is designed for SDD execution.

---

## Stage 0 — Canon, repo, and environment bootstrap ✓ COMPLETE

### Goal
Establish the execution foundation and prevent drift before feature work begins.

### Deliverables
- mono-repo (pnpm workspace: `apps/web`, `packages/domain`, `packages/llm`, `packages/test-harness`)
- `docs/` artifact set created and linked
- TypeScript baseline
- Next.js app shell
- CI baseline in GitHub Actions
- environment variable conventions
- Zod domain schemas skeleton

### Exit criteria — met
- repo installs and boots ✓
- lint/typecheck/build/test baseline pass ✓
- docs present ✓

### Gate: PASS — `docs/hardening/WAVE_0_REPORT.md`

---

## Stage 1 — Workspace and session backbone ✓ COMPLETE

### Goal
Make the product real at the interaction level: a usable workspace with persistent sessions.

### Deliverables
- create/open session (Firestore-backed)
- add/remove assets
- place assets on React Flow canvas
- create text notes
- image upload via drag-and-drop
- session persistence (Firestore onSnapshot real-time subscriptions)
- Zustand store (`useSessionStore`)

### Exit criteria — met
- user can create a session and populate a workspace ✓
- session state restores after reload ✓

### Gate: PASS — `docs/hardening/WAVE_1_REPORT.md`

---

## Stage 2 — Multimodal ingestion and analysis layer ✓ COMPLETE

### Goal
Turn raw assets into machine-usable signals.

### Deliverables
- unified asset schema (`packages/domain`)
- image upload to Firebase Storage
- per-asset analysis via `analyzeAsset()` (Gemini 2.5 Flash via OpenRouter)
- tags, descriptiveSignals, confidence per asset
- loadingStatus states on asset cards (fetching → analyzing → done/error)
- `analyzeAssetAction` Next.js Server Action
- first harness test (`analysis.test.ts`)

### Exit criteria — met
- system produces asset-level signals ✓
- malformed provider output handled safely ✓
- harness can run regression checks (skips without API key) ✓

### Gate: PASS — `docs/hardening/WAVE_2_REPORT.md`

---

## Stage 3 — Ambiguity detection and clarification planner ✓ COMPLETE

### Goal
Implement the differentiator: ask fewer, better questions.

### Deliverables
- `synthesizeSession()` — aggregates signals, ambiguity score, recommended topics
- `planClarificationQuestions()` — converts topics to typed, prioritised questions (≤5)
- `ClarificationPanel` with Synthesize Signals trigger and question list
- `QuestionCard` supporting single_select, multi_select, free_text
- answer submission and Firestore persistence
- synthesis re-run / re-entry after answers

### Exit criteria — met
- system asks targeted questions when ambiguity > 0.3 ✓
- clarification flow persists answers ✓

### Note
Question cap is currently 5 (`MAX_QUESTIONS = 5`). Spec §16.2 specifies max 3. Tracked for Wave 5.

### Gate: PASS — `docs/hardening/WAVE_3_REPORT.md`

---

## Stage 4 — Structured output generation ✓ COMPLETE

### Goal
Produce clean, useful direction artifacts and harden the full pipeline.

### Deliverables
- `generateOutput()` — two output schemas: UIDirectionOutput, BrandDirectionOutput
- `OutputPanel` with output type selector, Generate button, formatted brief
- Markdown export (Export .md button)
- Output versioning (`version` field on OutputDocument)
- Asset deletion (hover-reveal × button on all asset cards)
- URL asset ingestion (`fetchUrlMetadataAction` + OG tag parsing + UrlNode)
- ClarificationPanel copy fix ("Signals ready…" when analysis done)
- `packages/test-harness` schema fixtures: `synthesis.fixture.ts`, `output.fixture.ts`
- `synthesis.test.ts` (9 tests), `output.test.ts` (9 tests) — all passing on CI
- Playwright E2E suite (`apps/web/e2e/happy-path.spec.ts` — 5 tests, all passing)
- Vercel auto-deploy via GitHub Actions (`deploy` job on main push)
- E2E job runs post-deploy in CI
- Sentry `@sentry/nextjs` integration — `global-error.tsx`, captureException in all server actions

### Exit criteria — met
- outputs validate against schema ✓
- export works ✓
- E2E: creates session → adds note → analyzes → synthesizes → generates → exports ✓
- CI: lint + typecheck + unit tests + build + deploy + E2E all green ✓

### Gate: PASS — `docs/hardening/WAVE_4_REPORT.md`

---

## Stage 5 — Release hardening ⟳ IN PROGRESS

### Goal
Make the application stable enough for serious use.

### Remaining deliverables
- provision `NEXT_PUBLIC_SENTRY_DSN` in Vercel (Sentry code in place; DSN pending)
- add auth / session isolation (Firestore rules currently open — `allow read, write: if true`)
- reduce question cap to 3 or make configurable (currently 5)
- E2E expansion: edge cases (broken URL, empty canvas, re-synthesis)
- performance profiling
- dependency audit
- known issues triage and documentation

### Exit criteria
- hardening gate PASS
- Firestore rules restricted to authenticated users
- Sentry actively capturing errors in production
- known issues documented

### Gate: pending

---

## Stage 6 — Post-V1 candidates (not in current build scope)

Potential next steps after V1 validation:
- compare multiple generated directions
- pin/highlight important references
- collaborative sessions
- richer URL visual capture
- auth/workspaces/sharing
- Figma or export integrations
- token starter packs for downstream design systems

These are not approved for current execution unless a spec delta is added.
