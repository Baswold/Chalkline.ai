# Chalkline.AI — Quick Start

A PNPM monorepo with a React/Vite Studio frontend and an Express/TypeScript LLM Gateway.

- Studio (frontend): http://localhost:5173
- Gateway (API): http://localhost:3001

## Prerequisites
- Node.js 20+
- PNPM 8+

You currently have:
- Node: v24.2.0
- PNPM: 10.14.0

## Install

```bash
# From repo root
pnpm install
```

Note: If you see a warning about ignored build scripts (e.g., canvas), run:
```bash
pnpm approve-builds
```
…then choose which dependencies may run post-install scripts.

## Develop

Start both Studio and Gateway together:
```bash
pnpm dev
```
This runs:
- Studio: pnpm --filter studio dev (Vite)
- Gateway: pnpm --filter gateway dev (tsx watch)

Open the app:
- Studio: http://localhost:5173
- Gateway health: http://localhost:3001/health

Run individually:
```bash
# Studio only
pnpm --filter studio dev

# Gateway only
pnpm --filter gateway dev
```

## Build, Lint, Test
```bash
pnpm build       # Build all workspaces
pnpm lint        # Lint all workspaces
pnpm test        # Test all workspaces
pnpm typecheck   # TS typecheck across workspaces
```

## Workspace Layout
- apps/
  - gateway: Express API (TypeScript)
  - studio: React + Vite frontend
  - grader: (scaffold present)
- packages/
  - policy: AI policy/guardrails shared package
  - ui: Shared UI components
- fixtures/
  - tenant.json: Sample tenant configs used by Gateway

## Configuration
The development setup works with defaults, but these env vars are recognized by Gateway:

- PORT: API port (default 3001)
- NODE_ENV: affects CORS origin
  - development: allows http://localhost:5173
  - production: allows https://studio.chalkline.ai

Gateway also loads fixtures from fixtures/tenant.json at startup.

## API (Gateway)
Base URL: http://localhost:3001

- GET /health
  - Returns { status, timestamp, version }

- GET /v1/tenant/:tenantId
  - Returns tenant metadata and budget usage

- POST /v1/tenant/:tenantId/reset-budget
  - Resets usage for the tenant (dev/testing)

- POST /v1/llm
  - Body (Zod schema):
    ```json
    {
      "tenantId": "string",
      "prompt": "string",
      "model": "string (optional)",
      "maxTokens": 123 (optional, <= 4000),
      "temperature": 0..2 (optional),
      "context": {
        "assignmentId": "string (optional)",
        "submissionId": "string (optional)",
        "sessionId": "string (optional)"
      }
    }
    ```
  - Response includes { content, model, tokensUsed, policyInfo }
  - Requests are subject to policy checks and per-IP rate limiting (100 req/min)

## Troubleshooting
- Ports already in use
  - Studio uses 5173, Gateway uses 3001. Change with Vite/PORT or stop conflicting processes.

- CORS issues
  - Ensure Studio runs on http://localhost:5173 in dev; Gateway allows this origin when NODE_ENV != 'production'.

- Ignored build scripts (e.g., canvas)
  - Run pnpm approve-builds to allow post-install scripts.

- Tenant data not loading
  - Gateway reads fixtures/tenant.json at startup. Ensure the file exists and is valid JSON.

- SIGINT / stopping dev servers
  - pnpm dev uses concurrently. Ctrl+C stops both; if one hangs, it will be force-killed automatically.

## Production Notes
- Build Gateway: pnpm --filter gateway build then node apps/gateway/dist/index.js
- Build Studio: pnpm --filter studio build (artifacts in apps/studio/dist)
- Configure CORS properly for production domains.

## Scripts Reference
- Root package.json
  - dev: concurrently "pnpm --filter studio dev" "pnpm --filter gateway dev"
  - build: pnpm -r build
  - test: pnpm -r test
  - lint: pnpm -r lint
  - typecheck: pnpm -r typecheck
  - clean: pnpm -r clean && rm -rf node_modules

- apps/gateway
  - dev: tsx watch src/index.ts
  - build: tsc
  - start: node dist/index.js

- apps/studio
  - dev: vite
  - build: tsc -b && vite build
  - preview: vite preview

