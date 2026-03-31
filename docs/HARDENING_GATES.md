# HARDENING_GATES.md — Stage hardening framework

Version: 1.0

---

## Rule

No stage may be considered complete until its hardening gate passes.

Gate values:
- PASS
- HOLD
- FAIL

---

## Required audit dimensions

### 1. Correctness
- feature works as specified
- acceptance criteria met
- negative cases covered

### 2. Test completeness
- unit tests
- integration tests
- contract/schema tests
- E2E tests
- regression fixtures

### 3. LLM robustness
- schema validity
- retries bounded
- malformed outputs handled
- generic outputs flagged
- ambiguity fixtures tested

### 4. Reliability
- state persistence stable
- partial failures handled
- no unbounded retry loops
- no data corruption under common failure modes

### 5. Performance
- no obvious UI thrash or blocking paths
- major payloads and requests profiled
- build/bundle sanity checked

### 6. Security hygiene
- secret leakage checks
- server/client boundary review
- upload validation
- external fetch sanitisation
- dependency review

### 7. Observability
- Sentry coverage on critical failures
- structured logs for core flows
- enough metadata to debug failures

### 8. Maintainability
- code matches module boundaries
- dead code removed
- contract files versioned
- docs updated

---

## Minimum evidence required to pass

- CI green
- target tests green
- hardening report written
- known issues list updated
- no unresolved critical defects in current wave

---

## Required hardening outputs

Per wave, produce:
- `docs/hardening/WAVE_N_REPORT.md`
- issue list by severity
- recommendation: PASS / HOLD / FAIL

