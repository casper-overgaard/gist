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
- Decision: Revert Next.js `output: 'export'` in favor of Server Actions for `OPENROUTER_API_KEY` protection.
- Context: Initiating Wave 2 LLM inferences required API interactions with OpenRouter. Executing LLM fetching explicitly requires backend capabilities to hide operational secrets.
- Alternatives considered: Firebase Cloud Functions (`packages/functions`), pure static GUI prompting user for their API Key natively. 
- Why chosen: Utilizing Next.js Server Actions maintains extreme simplicity aligned with Turborepo standards without fragmenting the codebase, and `firebase.json`'s App framework deployment handles Native endpoints securely behind the scenes if deployed from GitHub App Hosting instead of local CLI static-renders. 
- Spec impact: Discarded local `firebase deploy` static preview targets, restricting LLM functionality previews exclusively to `pnpm dev` or remote instances provisioned with Next Server dependencies.
- Follow-up required: Instantiate OpenRouter SDK wrapper pointing internal functions via secure Action boundaries.
