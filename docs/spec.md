# spec.md — Inspiration-to-Direction Generator

Version: 1.0  
Status: Canonical build spec  
Mode: Spec-Driven Development (SDD)  
Primary execution environment: Antigravity with Gemini 3.1 Pro High as orchestrator  
Primary model provider for product runtime: OpenRouter  
Error/observability target: Sentry  
Project codename: **Signalboard**

---

## 1. Purpose

Build a multimodal web application that converts messy inspiration input on an open canvas into a concise, structured creative direction output.

Users should be able to drop images, screenshots, text fragments, links, notes, and partial thoughts into an open workspace. The system should:

1. interpret the material,
2. detect patterns and ambiguity,
3. ask only the highest-value clarification questions,
4. synthesise the input into a product-ready directional output.

This is **not** primarily an image generator. It is an **inspiration interpreter and direction synthesiser**.

The first release should optimise for converting ambiguous inspiration into a usable directional brief for digital products and brands.

---

## 2. SDD operating model

This project must be executed using strict Spec-Driven Development.

### 2.1 Canonical rule
The spec is the source of truth. Agents must not introduce meaningful product, architecture, or workflow scope that is not grounded in the spec or in an approved spec delta.

### 2.2 Execution rule
Implementation proceeds in waves. Each wave must:
- define exact deliverables,
- define acceptance criteria,
- define test scope,
- define hardening scope,
- end with a gate decision: PASS / HOLD / FAIL.

### 2.3 Change control
Any meaningful change to product scope, contracts, architecture, or critical UX flows must be written as a spec delta before implementation.

### 2.4 Documentation rule
Agents must maintain the following artifacts throughout execution:
- `docs/spec.md` — canonical product and system spec
- `docs/roadmap.md` — staged build roadmap
- `docs/AGENTS.md` — orchestration model, responsibilities, and rules
- `docs/HARDENING_GATES.md` — hardening standards and release gates
- `docs/EXECUTION_KICKOFF.md` — execution instructions for Antigravity orchestrator
- `docs/DECISIONS.md` — architecture and scope decisions log
- `docs/TEST_STRATEGY.md` — testing matrix and coverage expectations
- `docs/LLM_CONTRACTS.md` — prompt contracts, JSON schemas, model requirements, failure handling
- `docs/ENVIRONMENT.md` — local/dev/prod environment conventions

### 2.5 No silent invention rule
If a detail is missing, the orchestrator may propose a bounded assumption, but it must be marked as:
- `ASSUMPTION (safe default)`
- `ASSUMPTION (needs confirmation before merge)`

No unmarked invention is allowed in implementation or docs.

---

## 3. Product thesis

People often collect visual references and fragments before they can articulate what they want. They know what they are drawn to, but not yet why. Existing tools either:
- stop at moodboarding,
- jump directly to generation,
- or require users to already know how to brief clearly.

This product bridges that gap.

### 3.1 Core thesis
The core value is the combination of:
- pattern recognition across multimodal inspiration,
- ambiguity detection,
- selective clarification,
- structured directional synthesis.

### 3.2 Core promise
From messy inspiration to usable direction.

### 3.3 Initial positioning
A creative direction engine for digital products and brands.

---

## 4. Users

### 4.1 Primary users
- designers shaping early visual direction
- founders defining product/brand direction
- product people exploring style and positioning
- creative leads translating inspiration into a brief
- individual professionals shaping a portfolio or personal site direction

### 4.2 Secondary users
- marketing/brand collaborators
- agencies structuring moodboard input
- small teams aligning on aesthetic direction before design execution

### 4.3 Non-goals for V1
- full design tool replacement
- pixel-perfect UI generation
- production-ready brand system generation
- Figma replacement
- deep collaborative multiplayer workflows
- advanced asset management / DAM

---

## 5. Jobs to be done

### 5.1 Functional JTBD
When I have a lot of visual and textual inspiration but cannot yet articulate what I want, help me extract the real signal and convert it into a clear, usable direction.

### 5.2 Emotional JTBD
Help me feel that my taste is being understood rather than flattened into generic output.

### 5.3 Collaboration JTBD
Give me an output I can share with collaborators so the direction becomes discussable and actionable.

---

## 6. Product goals

### 6.1 V1 goals
- ingest multimodal inspiration on an open canvas
- cluster and interpret input at a useful semantic level
- identify ambiguity with confidence-aware logic
- ask minimal but high-value clarification questions
- produce one of two structured outputs:
  - UI/Product Style Direction
  - Brand/Visual Direction Brief
- allow users to revise and regenerate output after clarification

### 6.2 Success criteria for V1
- users can reach a useful output in one session without prompt engineering expertise
- clarification questions reduce ambiguity rather than expand the brief
- outputs are concise, directional, and not bloated
- test harness validates structured LLM output quality against fixtures and edge cases

### 6.3 Non-goals for V1
- generating full websites
- generating complete design systems
- training custom user style profiles across accounts
- real-time collaborative editing
- whiteboard-grade freeform diagramming parity with established tools

---

## 7. Core experience

### 7.1 Input stage
User enters an open canvas and can add:
- uploaded images
- screenshots
- pasted images
- URLs
- text notes
- labels/tags
- loose keywords
- typed intent statement (optional)

### 7.2 Interpretation stage
System analyses the combined input and identifies probable signals such as:
- visual tone
- brand personality
- composition tendencies
- typography characteristics
- palette characteristics
- texture/material cues
- interaction style cues
- level of restraint vs expressiveness
- perceived premium/playful/utilitarian posture
- editorial vs product-led direction

### 7.3 Ambiguity detection stage
System identifies ambiguity where:
- references point in multiple plausible directions,
- user intent is broad or underspecified,
- feature importance is unclear,
- confidence scores fall below threshold.

### 7.4 Clarification stage
System asks targeted follow-up questions. Questions must:
- reduce ambiguity,
- avoid bloat,
- be ranked by expected information gain,
- be limited by configurable max question count.

### 7.5 Synthesis stage
System produces structured output matching a selected or inferred output category.

### 7.6 Review and revision stage
User can:
- accept output,
- refine answers,
- remove noisy inputs,
- rerun synthesis,
- export output.

---

## 8. V1 feature scope

### 8.1 Must-have features
1. Canvas workspace
2. Multimodal asset intake
3. Asset metadata extraction
4. Analysis pipeline
5. Ambiguity detection engine
6. Clarification question flow
7. Structured synthesis output
8. Output editing / regeneration loop
9. Session persistence
10. Basic export
11. Observability and error capture
12. Test harness for LLM contracts

### 8.2 Nice-to-have only if low-risk
- drag-and-drop grouping
- user-defined pinning of “important references”
- confidence/uncertainty view
- side-by-side compare between two generated directions

### 8.3 Explicitly out of scope for V1
- multiplayer collaboration
- billing/payments
- custom fine-tuning
- native mobile app
- browser extension
- direct Figma plugin

---

## 9. Output categories

V1 supports two explicit output types.

### 9.1 UI/Product Style Direction
Target use case: digital product direction.

Required sections:
- Direction summary
- Core attributes
- Visual principles
- Color direction
- Typography direction
- Layout/composition direction
- Interaction/motion cues
- What this direction is / is not
- Implementation guardrails
- Suggested next steps

### 9.2 Brand/Visual Direction Brief
Target use case: brand / identity exploration.

Required sections:
- Direction summary
- Brand personality
- Visual territory
- Color direction
- Typography direction
- Composition/art direction
- Tone descriptors
- What to avoid
- Reference rationale
- Suggested next steps

### 9.3 Output rules
Outputs must be:
- concise,
- structured,
- non-generic,
- grounded in actual input signals,
- explicit about uncertainty where ambiguity remains.

---

## 10. UX principles

1. **Open first** — let users dump inspiration before forcing structure.
2. **Interpret, then ask** — system should do meaningful work before asking questions.
3. **Minimal questioning** — only ask questions that materially reduce uncertainty.
4. **No prompt burden** — users should not need advanced prompt-writing skills.
5. **Direction over verbosity** — outputs must be decisive, not bloated.
6. **Visible grounding** — output should reflect source inspiration clearly enough to feel earned.
7. **Graceful uncertainty** — where confidence is low, surface it explicitly.

---

## 11. Functional requirements

## 11.1 Workspace
- FR-001: system shall provide a canvas-like workspace for dropped/pasted/added content.
- FR-002: system shall support adding at minimum images, URLs, and text notes.
- FR-003: system shall preserve basic spatial placement metadata for assets.
- FR-004: system shall allow asset deletion and replacement.
- FR-005: system shall persist sessions.

## 11.2 Asset ingestion
- FR-010: system shall upload image assets securely.
- FR-011: system shall fetch and parse metadata for supported URLs where feasible.
- FR-012: system shall normalize text notes into analysable input records.
- FR-013: system shall create a unified internal asset schema.

## 11.3 Analysis
- FR-020: system shall generate per-asset analysis records.
- FR-021: system shall generate cross-asset synthesis signals.
- FR-022: system shall classify likely patterns across visual and textual input.
- FR-023: system shall assign confidence levels to interpretations.
- FR-024: system shall identify conflicting or divergent stylistic signals.

## 11.4 Clarification
- FR-030: system shall decide whether clarification is required.
- FR-031: system shall rank candidate clarification questions by expected ambiguity reduction.
- FR-032: system shall enforce configurable question cap.
- FR-033: system shall support single-select, multi-select, and short free-text clarification responses.
- FR-034: system shall re-run synthesis after clarification.

## 11.5 Output
- FR-040: system shall support at minimum two output categories.
- FR-041: system shall generate structured output using a strict schema.
- FR-042: system shall allow output regeneration after edits or clarification.
- FR-043: system shall support export to Markdown.
- FR-044: system shall store prior output versions within a session.

## 11.6 Reliability and observability
- FR-050: system shall log structured events for key user and system actions.
- FR-051: system shall capture errors via Sentry.
- FR-052: system shall support request tracing for LLM pipeline calls.
- FR-053: system shall degrade gracefully on model/provider failure.

---

## 12. Non-functional requirements

### 12.1 Performance
- NFR-001: time to interactive on desktop broadband should be within acceptable modern SPA range.
- NFR-002: V1 synthesis latency target should feel conversationally acceptable; streaming preferred where useful.
- NFR-003: analysis/synthesis tasks must be asynchronous and stateful.

### 12.2 Stability
- NFR-010: failed LLM steps must not corrupt session state.
- NFR-011: retries must be bounded and idempotent where possible.
- NFR-012: persistence layer must preserve user canvas/session state across transient failures.

### 12.3 Security
- NFR-020: secrets must never be committed to source control.
- NFR-021: runtime secrets must be loaded from environment or deployment secret store.
- NFR-022: uploads must be validated by type and size.
- NFR-023: unsafe fetched URL content must be sanitised or rejected.
- NFR-024: server-only keys must never be exposed to the client.

### 12.4 Testability
- NFR-030: all core business logic shall be independently unit-testable.
- NFR-031: LLM outputs must be validated via schemas and harness tests.
- NFR-032: prompt contracts must be versioned.
- NFR-033: critical flows must have E2E coverage.

### 12.5 Maintainability
- NFR-040: architecture must separate UI, orchestration, domain logic, provider clients, and persistence.
- NFR-041: model/provider dependencies must be abstracted behind interfaces.
- NFR-042: all key contracts must be documented and fixture-backed.

---

## 13. Suggested architecture

Antigravity/Gemini may adapt exact implementation details, but must preserve the architectural separation below unless a spec delta is approved.

### 13.1 Recommended stack
- Frontend: Next.js (App Router) + TypeScript
- UI: React + Tailwind + shadcn/ui or equivalent lightweight component layer
- Canvas interaction: React Flow / custom board layer / Konva-style abstraction as appropriate
- Backend: Next.js server routes and/or dedicated service layer
- Persistence: Postgres via Google AI Studio-compatible data service only if it cleanly supports app persistence; otherwise use a conventional managed Postgres provider
- Auth: defer unless needed for deployment; V1 can begin without auth if single-user/dev-first
- Storage: object storage for uploaded assets
- LLM provider abstraction: OpenRouter client wrapper
- Observability: Sentry
- Testing: Vitest, Playwright, schema-contract tests, LLM harness fixtures
- Validation: Zod

### 13.2 Important note on Google AI Studio
Google AI Studio is not a primary recommendation for general app database/storage unless the actual connected service is appropriate for production-grade persistence. Use it only where it genuinely fits. Preferred default remains:
- app data: Postgres
- asset storage: object store
- model experimentation/evals: optional Google AI tooling if useful

Antigravity may connect to Google AI Studio for model experimentation or adjunct workflows, but must not force an unsuitable persistence design just because it is available.

### 13.3 Logical modules
- `apps/web` — user-facing app
- `packages/domain` — canonical domain logic and schemas
- `packages/llm` — provider abstraction, prompts, contracts, parsers
- `packages/test-harness` — evals, fixture tests, regression harness
- `packages/config` — shared lint/test/build config

### 13.4 Domain services
- AssetIngestionService
- AssetAnalysisService
- AmbiguityDetectionService
- ClarificationPlannerService
- SynthesisService
- SessionService
- ExportService

### 13.5 Core pipelines
1. intake pipeline
2. analysis pipeline
3. ambiguity pipeline
4. clarification pipeline
5. synthesis pipeline
6. revision/regeneration pipeline

---

## 14. Domain model (minimum)

### 14.1 Session
Represents one workspace session.

Fields:
- id
- createdAt
- updatedAt
- title
- userIntent (optional)
- selectedOutputType
- status
- latestOutputId (nullable)

### 14.2 Asset
Fields:
- id
- sessionId
- type (`image` | `url` | `text`)
- source
- contentRef
- rawText (nullable)
- metadata
- canvasPosition
- createdAt

### 14.3 AssetAnalysis
Fields:
- id
- assetId
- tags
- descriptiveSignals
- confidence
- modelVersion
- createdAt

### 14.4 SessionSynthesis
Fields:
- id
- sessionId
- aggregateSignals
- conflictingSignals
- ambiguityScore
- recommendedQuestions
- createdAt

### 14.5 ClarificationQuestion
Fields:
- id
- sessionId
- questionType
- prompt
- options
- priority
- status
- rationale

### 14.6 ClarificationAnswer
Fields:
- id
- questionId
- sessionId
- answerValue
- createdAt

### 14.7 OutputDocument
Fields:
- id
- sessionId
- outputType
- version
- structuredPayload
- markdownBody
- confidenceNotes
- createdAt

---

## 15. LLM design requirements

### 15.1 General LLM rules
- LLM output must never be trusted without schema validation.
- Prompts must be versioned.
- Parsing failures must be captured and retried with bounded repair strategies.
- All high-value LLM steps must support fixture-backed regression testing.

### 15.2 Required LLM tasks
1. per-asset interpretation
2. cross-asset synthesis
3. ambiguity detection support
4. clarification question proposal
5. structured output generation

### 15.3 Contract requirements
Each LLM step must define:
- purpose
- inputs
- JSON output schema
- validation rules
- retry policy
- fallback behavior
- regression fixtures
- refusal/error handling

### 15.4 Model/provider abstraction
OpenRouter must be abstracted so models can be swapped without breaking the app. Gemini may propose model routing by task, but the interface must remain provider-agnostic.

### 15.5 Harness requirement
A dedicated LLM harness must exist to test:
- output schema compliance
- determinism tolerance bands
- prompt regressions
- edge-case robustness
- ambiguity handling quality
- hallucination/genericness risk

---

## 16. Clarification engine requirements

This is a core differentiator.

### 16.1 Question strategy
The system must not ask broad, chatty, low-value questions. It must prioritise questions that disambiguate what the user is actually reacting to.

Examples of valid question intents:
- feature salience (“is it the palette or the typography?”)
- posture alignment (“more premium or more experimental?”)
- output targeting (“brand direction or UI direction?”)
- realism threshold (“aspirational or implementation-ready?”)

### 16.2 Question cap
Initial default: max 3 questions per synthesis cycle unless a spec delta changes this.

### 16.3 Avoided behavior
- no open-ended interviewing loops
- no repeated paraphrase questions
- no unnecessary confirmation questions

### 16.4 Acceptance threshold
The clarification stage is successful if it measurably improves synthesis specificity without materially increasing completion time or user fatigue.

---

## 17. UX and UI scope

### 17.1 Main screens for V1
- Workspace / Canvas
- Analysis / Clarification panel
- Output view
- Export / History view

### 17.2 Workspace expectations
- drag/drop support
- paste support where practical
- basic panning/zooming optional if cheap enough
- clear affordance for adding notes and URLs
- visible selected output type

### 17.3 Output experience
Output should feel like a crisp, structured brief, not a chat transcript.

### 17.4 Tone
System tone should be concise, perceptive, and non-hype.

---

## 18. API and internal contracts

Antigravity may implement server actions, REST endpoints, or internal service actions. Regardless, define contracts for:
- create session
- add asset
- analyse asset(s)
- generate session synthesis
- generate clarification plan
- submit clarification answer(s)
- generate output
- export markdown

Each contract must include:
- input schema
- output schema
- error schema
- idempotency notes
- auth assumptions

---

## 19. Testing strategy requirements

### 19.1 Minimum test layers
1. unit tests
2. integration tests
3. schema/contract tests
4. LLM harness regression tests
5. E2E tests
6. performance/smoke tests

### 19.2 Critical coverage areas
- asset ingestion normalization
- session persistence
- ambiguity scoring
- question ranking
- output schema validity
- failure/retry logic
- export correctness
- client/server boundary protection

### 19.3 Edge cases
Must explicitly test:
- empty canvas
- only text input
- only one image
- highly conflicting inspiration
- broken URL
- unsupported file type
- oversized upload
- model timeout
- malformed LLM JSON
- partial synthesis failure
- user answers that conflict with detected signals
- repeated regenerate cycles

### 19.4 Regression fixtures
Create stable fixture sets representing:
- premium minimal product references
- expressive editorial references
- mixed ambiguous references
- sparse low-signal input
- misleading/noisy input

---

## 20. Hardening audit requirement

A formal hardening audit must run between stages. This is mandatory.

### 20.1 Hardening scope
- unit test completeness and mutation-sensitive robustness where practical
- integration reliability
- E2E full-flow stability
- regression coverage for fixtures and edge cases
- performance sanity checks
- error handling
- observability completeness
- security hygiene
- schema enforcement
- LLM harness robustness
- prompt/contract regression review
- dependency review
- code quality/refactor review

### 20.2 Gate outcome
Each stage ends with:
- PASS — proceed
- HOLD — fix required before proceed
- FAIL — stage invalid, rework required

### 20.3 No bypass rule
No new stage starts until prior stage hardening gate passes.

---

## 21. Deployment and environment guidance

### 21.1 Recommended deployment default
Deploy web app on Vercel unless Antigravity determines another deployment target has materially better fit.

### 21.2 Runtime environments
- local
- preview
- production

### 21.3 Environment variables (minimum placeholders)
- `OPENROUTER_API_KEY`
- `OPENROUTER_BASE_URL` (if used)
- `SENTRY_DSN`
- `DATABASE_URL`
- `STORAGE_*` variables as selected
- `APP_BASE_URL`
- any provider-specific server-side secrets

### 21.4 Secret handling
Do not commit secrets.
Do not generate production secrets into tracked files.
Gemini/Antigravity may generate local development placeholders or helper scripts, but production/runtime secrets must be injected through platform secret stores.

### 21.5 CI/CD
GitHub Actions must run at minimum:
- install
- lint
- typecheck
- unit/integration tests
- schema/contract tests
- Playwright E2E on suitable triggers
- build

Optional:
- preview deploy integration
- dependency audit
- bundle/perf smoke check

---

## 22. Repository structure target

```text
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
/apps
  /web
/packages
  /domain
  /llm
  /test-harness
  /config
/.github/workflows
```

Antigravity may adapt exact mono-repo shape, but must preserve the documentation and separation principles.

---

## 23. Wave plan (binding)

### Wave 0 — Foundation and canon setup
Deliver:
- repo scaffold
- docs scaffold
- mono-repo/package structure
- CI baseline
- environment baseline
- canonical schemas skeleton

Gate:
- repo boots cleanly
- CI runs
- docs present
- architecture skeleton consistent with spec

### Wave 1 — Canvas and session core
Deliver:
- session lifecycle
- workspace shell
- asset add/remove
- persistence skeleton

Gate:
- core workspace usable
- state persistence proven
- basic test coverage in place

### Wave 2 — Ingestion and analysis
Deliver:
- asset normalization
- per-asset analysis contracts
- synthesis aggregation
- first harness fixtures

Gate:
- analysis pipeline stable
- malformed data handled
- harness can evaluate core outputs

### Wave 3 — Ambiguity and clarification
Deliver:
- ambiguity scoring
- question ranking
- clarification UI
- answer capture and synthesis re-entry

Gate:
- questions are bounded and high-value
- edge-case ambiguity flows tested

### Wave 4 — Structured outputs
Deliver:
- two output categories
- output generation contracts
- markdown export
- output history

Gate:
- outputs validate against schema
- export and revisions work

### Wave 5 — Hardening and release candidate
Deliver:
- full regression sweep
- E2E hardening
- perf/security review
- observability completion
- release checklist

Gate:
- hardening PASS
- release candidate stable

---

## 24. Acceptance criteria summary

The product is acceptable for V1 if:
- a user can add multimodal inspiration to a workspace,
- the system interprets it into coherent signals,
- the system asks a small number of targeted questions where required,
- the system produces a concise structured direction output,
- the flow is reliable under tested edge cases,
- the codebase is maintainable under documented contracts and hardening gates.

---

## 25. Anti-patterns to avoid

- over-chatbotting the experience
- asking too many questions
- generic design-language output detached from input
- mixing persistence, domain logic, and LLM provider code chaotically
- unvalidated LLM JSON usage
- skipping harness/regression testing
- bypassing hardening between stages
- coupling implementation to a single model in a non-replaceable way

---

## 26. Immediate orchestrator instruction

The Antigravity orchestrator must begin by:
1. validating this spec for gaps,
2. creating any required spec-aligned sub-docs,
3. producing an execution plan by wave,
4. assigning agent responsibilities,
5. scaffolding the repository,
6. implementing Wave 0 only,
7. running the Wave 0 hardening gate before proceeding.

Do not jump to full build in one pass.

