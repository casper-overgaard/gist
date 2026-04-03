# ENVIRONMENT.md

## Stack

- Package manager: pnpm 10
- Node: 20 (CI), latest active LTS locally
- Framework: Next.js 16.2.1 (App Router) + TypeScript
- Tests: Vitest + Playwright
- Validation: Zod
- Observability: Sentry (`@sentry/nextjs`)
- Deployment: Vercel (production at `https://gist-web-jet.vercel.app`)
- Persistence: Firebase Firestore + Firebase Storage

---

## Local setup

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp apps/web/.env.example apps/web/.env.local
# Fill in all NEXT_PUBLIC_FIREBASE_* and OPENROUTER_API_KEY

# 3. Run dev server
pnpm dev

# 4. Run unit tests
pnpm --filter web run test
pnpm --filter @signalboard/test-harness run test

# 5. Run E2E tests (against production by default)
cd apps/web && npx playwright test

# Run E2E against local dev server
PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test
```

---

## Environment variables

### App runtime (required in Vercel and `.env.local`)

| Variable | Scope | Description |
|---|---|---|
| `OPENROUTER_API_KEY` | Server only | LLM calls via OpenRouter |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Client + Server | Firebase config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Client + Server | Firebase config |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Client + Server | Firebase config |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Client + Server | Firebase config |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Client + Server | Firebase config |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Client + Server | Firebase config |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Client + Server | Firebase Analytics (optional) |

### Observability (optional — Sentry is no-op if absent)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN — create project at sentry.io then set this |
| `SENTRY_AUTH_TOKEN` | Enables source map uploads during Vercel build |
| `SENTRY_ORG` | Sentry organization slug |
| `SENTRY_PROJECT` | Sentry project slug |

### CI/CD (GitHub Actions secrets — already set)

| Variable | Description |
|---|---|
| `VERCEL_TOKEN` | Deploy token for `vercel --prod` |
| `VERCEL_ORG_ID` | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Vercel project ID (`prj_xglxNJAbfTJqIQUfR4YgmMa4gduM`) |

---

## Secret handling

- Never commit actual secrets.
- All production/preview secrets live in Vercel environment configuration.
- GitHub Actions secrets for CI/CD deployment.
- Local development: `apps/web/.env.local` (gitignored).

---

## Runtime environments

| Environment | URL | Trigger |
|---|---|---|
| local | `http://localhost:3000` | `pnpm dev` |
| production | `https://gist-web-jet.vercel.app` | push to `main` → CI deploy job |

Preview deploys are not currently configured (no PR-triggered preview env).

---

## Firebase project

- Project ID: `gist-6062f`
- Firestore: open rules in dev mode (`allow read, write: if true`)
- Auth: not yet implemented (planned Wave 5)
- Storage: used for image asset uploads

## Firestore data structure

```
/sessions/{sessionId}
  ├─ id, title, createdAt, updatedAt, status, selectedOutputType, latestOutputId
  ├─ /assets/{assetId}
  ├─ /synthesis/latest
  ├─ /questions/{questionId}
  ├─ /answers/{answerId}
  └─ /outputs/{outputId}
```
