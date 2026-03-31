# ENVIRONMENT.md

## Recommended defaults
- Package manager: pnpm
- Node: latest active LTS supported by chosen framework
- App: Next.js + TypeScript
- Tests: Vitest + Playwright
- Validation: Zod
- Observability: Sentry
- Deployment: Vercel

## Local setup target
- install dependencies
- configure `.env.local` from `.env.example`
- run dev server
- run tests
- run Playwright

## Environment variables (minimum)
- OPENROUTER_API_KEY
- SENTRY_DSN
- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NEXT_PUBLIC_FIREBASE_APP_ID
- APP_BASE_URL

## Secret handling
Use platform secret stores for preview and production.
Never commit actual secrets.

