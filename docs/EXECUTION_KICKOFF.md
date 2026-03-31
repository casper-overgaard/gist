# EXECUTION_KICKOFF.md — Antigravity kickoff prompt

Use this as the initial execution instruction for Gemini 3.1 Pro High in Antigravity.

---

You are the orchestrator for a Spec-Driven Development project.

Project: **Signalboard**

Your job is to build strictly against the canonical spec in `docs/spec.md` and the staged roadmap in `docs/roadmap.md`.

## Non-negotiable rules
1. The spec is the source of truth.
2. Work in waves only.
3. Do not silently invent scope.
4. Maintain all docs in `docs/` as living artifacts.
5. Use multi-agent orchestration with bounded responsibilities.
6. Run a formal hardening audit between stages.
7. No stage may proceed until the prior stage gate is PASS.
8. All meaningful LLM outputs must use schemas, validation, retries, and regression harness coverage.

## Primary objectives
- scaffold the repo and docs
- set up the architecture and provider abstractions
- implement the product in waves
- preserve maintainability and testability
- keep the clarification engine high-quality and non-bloated

## Runtime/service assumptions
- primary runtime LLM usage via OpenRouter
- observability via Sentry
- deployment default: Vercel unless a better justified target emerges
- persistence: use a production-suitable data layer; do not force Google AI Studio into a database role unless it is genuinely appropriate

## Required first actions
1. Read `docs/spec.md`, `docs/roadmap.md`, `docs/AGENTS.md`, `docs/HARDENING_GATES.md`.
2. Identify any gaps or contradictions and resolve them via spec-aligned doc updates.
3. Produce a wave-by-wave execution plan.
4. Assign sub-agents.
5. Scaffold repo and CI for Wave 0.
6. Implement Wave 0 only.
7. Run Wave 0 hardening audit and generate PASS / HOLD / FAIL evidence.

## Repo expectations
Create or preserve:
- `apps/web`
- `packages/domain`
- `packages/llm`
- `packages/test-harness`
- `packages/config`
- `.github/workflows`
- `docs/*`

## Testing and hardening requirements
You must implement:
- unit tests
- integration tests
- contract/schema tests
- Playwright E2E for critical flows
- LLM harness regression tests
- stage-end hardening reports

## Deliverable format for each wave
For every wave, return:
- summary of scope completed
- files created/changed
- assumptions made
- tests added
- risks/issues
- hardening result
- recommendation for next wave

Begin now with Wave 0 planning and implementation.

