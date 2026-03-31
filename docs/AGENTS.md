# AGENTS.md — Multi-agent orchestration model

Version: 1.0

---

## Purpose

Define how Antigravity should orchestrate Gemini 3.1 Pro High and sub-agents under SDD.

---

## Governing principle

The orchestrator is accountable for spec fidelity and stage gating. Sub-agents are accountable for bounded execution within assigned scope.

No agent may silently expand scope.

---

## Recommended agent topology

### 1. Orchestrator / Program Lead
Owner:
- parse canon
- plan waves
- assign work
- manage dependencies
- review outputs for spec alignment
- control PASS / HOLD / FAIL recommendations

### 2. Product Spec Guardian
Owner:
- protect product intent
- validate UX flows against spec
- ensure output categories and question strategy are preserved

### 3. Architect Agent
Owner:
- propose repo shape
- define module boundaries
- preserve separation between UI, domain, provider, persistence, and test harness

### 4. Frontend Agent
Owner:
- implement workspace, canvas, panels, output views, client UX states

### 5. Backend/Domain Agent
Owner:
- implement services, schemas, persistence, orchestration flows, export logic

### 6. LLM Systems Agent
Owner:
- define prompt contracts
- implement provider abstraction
- implement parsers, repair/fallback logic, versioning

### 7. Test/Harness Agent
Owner:
- unit/integration/E2E coverage
- fixture creation
- LLM regression harness
- edge-case packs

### 8. Hardening/Audit Agent
Owner:
- stage-end audit
- stability/performance/security/config review
- release gating report

### 9. DevOps/CI Agent
Owner:
- GitHub Actions
- deployment baseline
- environment setup
- preview/prod workflows

---

## Execution rules

1. Orchestrator must issue wave-scoped tasks only.
2. Each sub-agent must return:
   - files changed
   - assumptions
   - tests added
   - risks introduced
3. Merge order must follow dependency order.
4. Hardening agent reviews before wave close.
5. If conflict exists between agents, spec wins unless a spec delta is approved.

---

## Required outputs per wave

For each wave, orchestrator must produce:
- implementation plan
- agent task split
- acceptance checklist
- hardening checklist
- gate decision memo

