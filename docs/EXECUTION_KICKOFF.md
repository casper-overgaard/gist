# EXECUTION_KICKOFF.md — Orchestrator kickoff prompt

Use this as the initial execution instruction for any AI agent beginning work on Signalboard.

> **Note:** Original spec targeted Antigravity with Gemini 3.1 Pro High as orchestrator. Actual execution has been via Claude Code (claude-sonnet-4-6). The rules below apply to any capable orchestrator.

---

You are the orchestrator for a Spec-Driven Development project.

Project: **Signalboard**

Your job is to build strictly against the canonical spec in `docs/spec.md` and the staged roadmap in `docs/roadmap.md`.

## Current state (as of 2026-04-03)

Waves 0–4 are complete. Wave 5 is in progress. Read the hardening reports in `docs/hardening/` before making any changes. Do not re-implement completed work.

## Non-negotiable rules
1. The spec is the source of truth.
2. Work in waves only.
3. Do not silently invent scope.
4. Maintain all docs in `docs/` as living artifacts.
5. Run a formal hardening audit between stages.
6. No stage may proceed until the prior stage gate is PASS.
7. All meaningful LLM outputs must use schemas, validation, retries, and regression harness coverage.

## Primary objectives
- scaffold the repo and docs
- set up the architecture and provider abstractions
- implement the product in waves
- preserve maintainability and testability
- keep the clarification engine high-quality and non-bloated

## Runtime/service assumptions
- primary runtime LLM usage via OpenRouter → Google Gemini 2.5 Flash
- observability via Sentry (`@sentry/nextjs`, FR-051 — code in place, DSN pending)
- deployment: Vercel (`https://gist-web-jet.vercel.app`)
- persistence: Firebase Firestore + Storage (not Postgres — see DECISIONS.md)
- CI/CD: GitHub Actions, auto-deploys on main push (three-job pipeline)

## Required first actions (for a new session)
1. Read `docs/spec.md`, `docs/roadmap.md`, `docs/DECISIONS.md`, `docs/ENVIRONMENT.md`.
2. Read `docs/hardening/WAVE_4_REPORT.md` for current debt and known issues.
3. Identify current Wave 5 scope and resume where left off.

## Repo structure

```
/docs
  spec.md
  roadmap.md
  AGENTS.md
  HARDENING_GATES.md
  EXECUTION_KICKOFF.md
  DECISIONS.md
  TEST_STRATEGY.md
  LLM_CONTRACTS.md
  ENVIRONMENT.md
  /hardening
    WAVE_0_REPORT.md
    WAVE_1_REPORT.md
    WAVE_2_REPORT.md
    WAVE_3_REPORT.md
    WAVE_4_REPORT.md
/apps
  /web
    /src/app          — Next.js App Router pages
    /src/actions      — Server Actions (LLM calls)
    /src/components   — Canvas, ClarificationPanel, OutputPanel
    /src/store        — Zustand session store
    /src/lib          — Firebase init, storage helpers
    /e2e              — Playwright E2E tests
/packages
  /domain             — Zod schemas and TypeScript types
  /llm                — LLM contracts, prompts, OpenRouter client
  /test-harness       — Schema fixtures and contract tests
/.github/workflows    — CI/CD (ci.yml)
```

## Testing and hardening requirements
Implement:
- schema/contract tests (Vitest, `packages/test-harness`)
- Playwright E2E for critical flows (`apps/web/e2e`)
- LLM harness regression tests (live, skipped on CI without API key)
- stage-end hardening reports (`docs/hardening/WAVE_N_REPORT.md`)

## Deliverable format for each wave
For every wave, return:
- summary of scope completed
- files created/changed
- assumptions made
- tests added
- risks/issues
- hardening result
- recommendation for next wave
