# Unit 01: Monorepo Foundation, Environment Configuration & API Skeleton

---

## 1. Goal

Initialize the GalaPH monorepo root with npm workspaces (`apps/api`, `apps/web`, `packages/shared`), establish container orchestration (`docker-compose.yml`) for local/CI PostgreSQL 16 and Redis 7 services, set up strict environment variable validation via Zod, create the `@gala-ph/shared` base package, and build the initial Express + TypeScript backend skeleton in `apps/api` featuring isolated `/health/live` and `/health/ready` probe endpoints.

---

## 2. Design & Architecture

- **Monorepo Layout**: Root `package.json` managing `apps/api`, `apps/web`, and `packages/*`.
- **Config & Typing**: Root `tsconfig.base.json` shared by all TypeScript projects with `strict: true`.
- **Shared Package (`packages/shared`)**: Shared TypeScript interfaces, Philippine currency helpers, and Zod schemas.
- **Environment Schema**: `apps/api/src/config/env.ts` parsing environment variables through Zod at server boot.
- **Probe Separation**:
  - `GET /health/live`: Returns `200 OK` ($< 1\text{ms}$) verifying process responsiveness without touching external databases.
  - `GET /health/ready`: Pings PostgreSQL (`SELECT 1` via Prisma or raw pool) and Redis (`PING`). Returns `200 OK` with latency metrics if both are healthy, or `503 Service Unavailable` if either is down.

---

## 3. Implementation Details

### A. Root Monorepo

- `package.json`: Configure npm workspaces, dev dependencies, build and check scripts.
- `tsconfig.base.json`: Base compiler options (ES2022, NodeNext / Bundler module resolution, strict).
- `docker-compose.yml`: PostgreSQL 16 Alpine + Redis 7 Alpine with volume persistence and health checks.
- `.env.example`: Template for local and CI environments.

### B. Shared Package (`packages/shared`)

- `packages/shared/package.json`: `@gala-ph/shared` package definition.
- `packages/shared/tsconfig.json`: TypeScript configuration extending `tsconfig.base.json`.
- `packages/shared/src/index.ts`: Exporting Philippine travel types, currency centavo conversion functions, and shared constants.

### C. Backend Skeleton (`apps/api`)

- `apps/api/package.json`: `@gala-ph/api` with dependencies (`express`, `cors`, `helmet`, `dotenv`, `zod`, `pino`, `pino-pretty`, `ioredis`, `@prisma/client`, `supertest`).
- `apps/api/tsconfig.json`: Extending base tsconfig.
- `apps/api/src/config/env.ts`: Zod schema validating `PORT`, `NODE_ENV`, `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`.
- `apps/api/src/lib/redis.ts`: Singleton Redis client configured with reconnection logic.
- `apps/api/src/lib/logger.ts`: Pino structured logger with correlation ID support.
- `apps/api/src/routes/health.routes.ts`: Endpoints for `/health/live` and `/health/ready`.
- `apps/api/src/app.ts` & `src/index.ts`: Express application bootstrap and graceful shutdown handler.
- `apps/api/src/__tests__/health.test.ts`: Automated probe tests.

### D. Web Baseline (`apps/web`)

- `apps/web/package.json`: `@gala-ph/web` baseline Next.js setup.
- `apps/web/tsconfig.json`: Baseline Next.js TypeScript config.

---

## 4. Verification Checklist

- [ ] Monorepo `npm install` completes cleanly and generates root `package-lock.json`.
- [ ] `packages/shared` compiles cleanly (`npm run build:shared`).
- [ ] `apps/api/src/config/env.ts` successfully parses valid configuration.
- [ ] `GET /health/live` returns HTTP 200 with `{ status: "alive" }`.
- [ ] `GET /health/ready` returns HTTP 200 with `{ status: "ready", checks: { database: "healthy", redis: "healthy" } }`.
- [ ] TypeScript compilation (`npm run typecheck`) passes with 0 errors across all workspaces.
- [ ] Prettier formatting check passes (`npm run format:check`).
- [ ] Automated tests pass (`npm run test`).
- [ ] Git status confirms `.env` is ignored and working tree is ready.
