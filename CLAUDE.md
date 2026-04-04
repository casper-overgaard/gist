# Gist / Signalboard — Claude Code Instructions

## Agent skills — automatic invocation

The following skills from `addy-agent-skills` are active in this project. I invoke them myself at the right moments — you don't need to call them manually.

### When I invoke each skill

| Trigger | Skill | When |
|---------|-------|------|
| Before starting a new Wave or non-trivial feature | `/plan` | After the user approves a plan, before writing any code |
| Before writing any new package/API boundary | `/spec` | When designing a new module (e.g. `packages/llm/src/merge.ts`), server action, or Firestore schema |
| After completing a Wave phase | `/review` | Before committing — catches drift, security issues, over-engineering |
| When adding a new component or node type | `/build` | During implementation to stay on incremental path |
| Before pushing to main | `/ship` | Verifies git state, checks for debug code, confirms nothing is broken |
| When a bug is reported | `/debug` (debugging-and-error-recovery) | At the start of diagnosis, before guessing |
| When a function exceeds ~60 lines or a file exceeds ~200 lines | `/code-simplify` | Proactively, not only when asked |

### Rules

- I never skip `/review` before a push when non-trivial code was written.
- I invoke skills silently — I don't announce "I am now invoking /review". I just do the work the skill prescribes.
- For new LLM functions (analysis, synthesis, output, merge), I run the `api-and-interface-design` skill before writing the signature.
- For Firestore schema changes, I check the `spec-driven-development` skill to ensure the schema is documented before code.

## Stack

- Next.js App Router (see `apps/web/AGENTS.md` — not standard Next.js)
- Tailwind v4 with `@theme inline` CSS tokens (`sb-*` prefix)
- Firebase Firestore — realtime listeners via Zustand (`useSessionStore`)
- `@xyflow/react` v12 — controlled mode, all NodeChanges must be applied
- Vercel AI SDK `generateObject()` with `mode: 'json'` — Gemini 2.5 Flash via OpenRouter
- Turborepo monorepo: `apps/web`, `packages/domain`, `packages/llm`

## Commit discipline

- Push only from `main`.
- Never `--no-verify`.
- Wave phases each get their own commit with a descriptive message.
- Before pushing, confirm TypeScript passes: `npx tsc --noEmit -p apps/web/tsconfig.json`.
