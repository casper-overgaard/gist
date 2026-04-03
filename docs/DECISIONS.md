# DECISIONS.md

Use this file as an append-only log for notable architectural, product-scope, and tooling decisions.

Template:
- Date:
- Decision:
- Context:
- Alternatives considered:
- Why chosen:
- Spec impact:
- Follow-up required:

- Date: 2026-03-31
- Decision: Migrate from Postgres to Firestore/Firebase for application data persistence.
- Context: The original spec dictated Postgres. During Wave 1 planning, a document-store NoSQL configuration was deemed more fitting for a highly-mutative React Flow open canvas. User requested Firebase integration directly.
- Alternatives considered: Postgres via Neon/Supabase; local IndexedDB MVP.
- Why chosen: React Flow canvas and live-multiplayer asset structures map natively to Firestore document collections without brittle relational joins.
- Spec impact: Substantial delta. We abandon relational tables for sessions and assets, adopting document structures. `DATABASE_URL` is replaced with Firebase initialization configurations.
- Follow-up required: Ensure `packages/domain` contains shared Firebase initialization logic. Validate client-side DB interactions.

- Date: 2026-03-31
- Decision: Utilize Firebase App Hosting over Vercel or `here.now` static exports.
- Context: The application matured into needing live edge-routes and server capabilities (Next.js dynamic routing on `/session/[id]`) that broke pure static deployments. The user required a Google-ecosystem compatible Vercel alternative.
- Alternatives considered: Vercel standard, Next.js static `output: export` deep-linking.
- Why chosen: App adheres purely to the Firebase Firestore client; keeping the deployment unified within Firebase App Framework Hosting provides zero-configuration deployments mirroring Vercel's simplicity. 
- Spec impact: Discarded Next.js static output targets. Initiated `firebase.json` local configuration targeting Next.js detection (`source: "apps/web"`).
- Follow-up required: Require user to execute `firebase login` to authenticate the CLI locally before initiating deployment pipelines.

- Date: 2026-03-31
- Decision: Add `apphosting.yaml` and `output: 'standalone'` for Firebase App Hosting / Cloud Run.
- Context: First App Hosting deployment failed with "container failed to start and listen on PORT=8080". Root cause: pnpm workspace symlinks for `@signalboard/llm` and `@signalboard/domain` do not survive in the Cloud Run image without standalone bundling. Additionally, Firebase App Hosting requires `apphosting.yaml` at the repo root for build/runtime configuration.
- Alternatives considered: Dockerfile with explicit pnpm install steps; moving workspace packages into apps/web.
- Why chosen: `output: 'standalone'` is the canonical Next.js solution for container deployments — it bundles all required files into `.next/standalone/` so `node server.js` works without workspace resolution. `apphosting.yaml` is required by the platform regardless.
- Spec impact: None. Deployment plumbing only.
- Follow-up required: Provision `OPENROUTER_API_KEY` in GCP Secret Manager (project gist-6062f) and re-add to `apphosting.yaml` env block. `NEXT_PUBLIC_FIREBASE_*` variables must be set in Firebase App Hosting environment config (not in apphosting.yaml, as they are baked at build time).

- Date: 2026-04-03
- Decision: Switch deployment from Firebase App Hosting to Vercel.
- Context: Firebase App Hosting uses Google Cloud Buildpacks which scan the repo root for framework detection. The buildpack cannot find `next.config.ts` inside `apps/web` in a pnpm monorepo. As a result, the `google.nodejs.firebasebundle` buildpack never triggered `next build`, and the container deployed with source files but no `.next` output — crashing immediately on PORT=8080.
- Alternatives considered: Custom Dockerfile with explicit monorepo build steps; moving workspace packages into apps/web.
- Why chosen: Vercel has first-class pnpm monorepo support, auto-detects Next.js in subdirectories, and correctly runs `pnpm run build` in `apps/web`. Zero-config.
- Spec impact: Spec §21.1 recommends Vercel as default — this is now the active deployment. Firebase App Hosting backend still exists in GCP but is unused. Firebase is used only for Firestore/Storage SDK calls, not hosting.
- Follow-up required: Connect Vercel GitHub integration for auto-deploy on push (currently requires manual `vercel --prod`).

- Date: 2026-04-03
- Decision: GitHub Actions CI/CD — auto-deploy to Vercel on main push, E2E runs post-deploy.
- Context: Vercel deployment was previously manual (`vercel --prod`). The follow-up item from the Vercel decision required automating this.
- Alternatives considered: Vercel GitHub App (dashboard-based integration).
- Why chosen: GitHub Actions approach keeps all CI/CD in code, uses `VERCEL_TOKEN`/`VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` GitHub secrets, and allows the E2E job to depend on the deploy job completing before running tests against production.
- Spec impact: Fulfills spec §21.5 CI/CD requirements. Pipeline: `build_and_test` → `deploy` → `e2e` on main push.
- Follow-up required: None.

- Date: 2026-04-03
- Decision: Integrate Sentry via `@sentry/nextjs` (FR-051).
- Context: FR-051 required error capture via Sentry. The integration was deferred to Wave 4/5 scope.
- Alternatives considered: None — Sentry was the specified target.
- Why chosen: `@sentry/nextjs` provides auto-instrumentation of server functions via `withSentryConfig` in `next.config.ts`. `global-error.tsx` handles app-router error boundaries.
- Spec impact: FR-051 is now implemented. All five server actions (`analyze`, `synthesize`, `clarification`, `output`, `fetchUrl`) call `Sentry.captureException` in catch blocks. Client/server/edge configs present.
- Follow-up required: Provision `NEXT_PUBLIC_SENTRY_DSN` in Vercel. Create Sentry project at sentry.io. Without DSN the integration no-ops silently.

- Date: 2026-04-03
- Decision: Firestore security rules remain open (`allow read, write: if true`) for development.
- Context: All session and subcollection data is currently unprotected. This was intentional during development to avoid auth friction.
- Alternatives considered: Auth from Wave 1 onward.
- Why chosen: V1 scope defers auth. The comment in `firestore.rules` marks Wave 5 as the auth gating point.
- Spec impact: NFR-024 (server-only keys not exposed to client) is satisfied for API keys. Session data isolation is not enforced. Acceptable for dev/internal V1.
- Follow-up required: Wave 5 must restrict rules to `request.auth != null` and implement Firebase Auth.

- Date: 2026-03-31
- Decision: Revert Next.js `output: 'export'` in favor of Server Actions for `OPENROUTER_API_KEY` protection.
- Context: Initiating Wave 2 LLM inferences required API interactions with OpenRouter. Executing LLM fetching explicitly requires backend capabilities to hide operational secrets.
- Alternatives considered: Firebase Cloud Functions (`packages/functions`), pure static GUI prompting user for their API Key natively. 
- Why chosen: Utilizing Next.js Server Actions maintains extreme simplicity aligned with Turborepo standards without fragmenting the codebase, and `firebase.json`'s App framework deployment handles Native endpoints securely behind the scenes if deployed from GitHub App Hosting instead of local CLI static-renders. 
- Spec impact: Discarded local `firebase deploy` static preview targets, restricting LLM functionality previews exclusively to `pnpm dev` or remote instances provisioned with Next Server dependencies.
- Follow-up required: Instantiate OpenRouter SDK wrapper pointing internal functions via secure Action boundaries.
