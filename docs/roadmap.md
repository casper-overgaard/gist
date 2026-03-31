# roadmap.md — Signalboard roadmap

Version: 1.0  
Status: Execution roadmap aligned to `docs/spec.md`

---

## Roadmap intent

This roadmap converts the canonical spec into staged implementation waves with explicit gates. It is designed for SDD and multi-agent execution in Antigravity.

---

## Stage 0 — Canon, repo, and environment bootstrap

### Goal
Establish the execution foundation and prevent drift before feature work begins.

### Deliverables
- mono-repo or equivalent repo structure
- `docs/` artifact set created and linked
- TypeScript baseline
- app shell created
- provider abstraction skeleton
- CI baseline in GitHub Actions
- environment variable conventions
- local setup instructions

### Exit criteria
- repo installs and boots
- lint/typecheck/build/test baseline pass
- docs are internally consistent
- orchestrator agent assigns wave owners and gate owner

### Hardening focus
- repo determinism
- CI stability
- config correctness
- dependency sanity

---

## Stage 1 — Workspace and session backbone

### Goal
Make the product real at the interaction level: a usable workspace with persistent sessions.

### Deliverables
- create/open session
- add/remove assets
- place assets on canvas
- create text notes
- basic URL card ingestion
- session persistence
- loading/error states

### Exit criteria
- user can create a session and populate a workspace
- session state restores after reload
- invalid/unsupported inputs fail gracefully

### Hardening focus
- state integrity
- session persistence reliability
- client/server boundary coverage
- unit and integration tests for session mutations

---

## Stage 2 — Multimodal ingestion and analysis layer

### Goal
Turn raw assets into machine-usable signals.

### Deliverables
- unified asset schema
- upload handling
- URL extraction/parsing where supported
- per-asset analysis pipeline
- aggregate synthesis draft
- first fixture set for LLM harness

### Exit criteria
- system can produce asset-level and session-level signals
- malformed provider output is handled safely
- harness can run repeatable regression checks

### Hardening focus
- schema validation
- JSON repair/fallback logic
- fixture stability
- integration reliability under partial failures

---

## Stage 3 — Ambiguity detection and clarification planner

### Goal
Implement the differentiator: ask fewer, better questions.

### Deliverables
- ambiguity score model
- question ranking logic
- clarification UI flow
- answer submission and state update
- bounded question count enforcement

### Exit criteria
- system asks targeted questions only when required
- question set is materially useful on ambiguous fixtures
- clarification improves output specificity in harness tests

### Hardening focus
- ambiguity thresholds
- question ranking correctness
- low-signal and conflicting-input edge cases
- regression suite for repetitive or low-value questioning

---

## Stage 4 — Structured output generation

### Goal
Produce clean, useful direction artifacts.

### Deliverables
- UI/Product Style Direction output
- Brand/Visual Direction Brief output
- markdown export
- output history/versioning
- revision/regeneration loop

### Exit criteria
- outputs validate against schema
- outputs remain grounded in input and answers
- exports are usable and readable

### Hardening focus
- output contract robustness
- genericness detection in harness
- repeated regenerate stability
- markdown export correctness

---

## Stage 5 — Release hardening

### Goal
Make the application stable enough for serious use.

### Deliverables
- expanded E2E coverage
- performance profiling and optimisation pass
- observability completion
- dependency review
- failure mode review
- release checklist

### Exit criteria
- hardening gate PASS
- preview deployment stable
- known issues triaged and documented

### Hardening focus
- resilience
- performance
- provider failure handling
- monitoring completeness
- release readiness

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

