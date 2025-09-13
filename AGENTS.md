# Repository Guidelines

## Project Structure & Modules
- Monorepo managed by `pnpm` + Turborepo.
- Apps live in `apps/*` (e.g., `apps/web-business`, `apps/web-landing`, `apps/mobile-consumer`).
- Shared packages in `packages/*` (e.g., `@repo/api`, `@repo/ui`, `@repo/utils`, `@repo/eslint-config`).
- Docs and misc in `docs/` and `QOL/`.
- Typical sources: `src/`; tests alongside sources or in `tests/`.

## Build, Test, and Dev
- Install: `pnpm i` (run at repo root).
- Dev all: `pnpm dev` (runs `turbo run dev`).
- Build all: `pnpm build` (Turborepo graph-aware build).
- Lint all: `pnpm lint` (shared ESLint configs).
- Type check: `pnpm check-types`.
- Format: `pnpm format` (Prettier on `ts/tsx/md`).
- Filtered runs (examples):
  - `pnpm -w --filter @repo/web-business dev`
  - `pnpm -w --filter @repo/api dev` (Convex dev server)
  - `pnpm -w --filter @repo/web-landing deploy` (Cloudflare via Wrangler)

## Coding Style & Naming
- Language: TypeScript across apps and packages.
- Lint: `@repo/eslint-config` (ESLint flat config), Prettier 3.
- Indentation: 2 spaces; max 100–120 cols; semicolons on.
- Names: `camelCase` functions/vars, `PascalCase` React components, `kebab-case` files/dirs, `SCREAMING_SNAKE_CASE` constants.
- React: no `React` import for JSX; prefer functional components and hooks.

## Testing Guidelines
- Unit: Vitest in `packages/@repo/api` (`pnpm -w --filter @repo/api test`, `test:coverage`).
- E2E/UI: Playwright in `apps/web-business` (`test`, `test:ui`, `test:report`).
- File names: `*.test.ts` or `*.spec.ts(x)` near code.
- Aim for meaningful coverage on core logic; add tests for bug fixes.

## Commits & Pull Requests
- Commits: concise, imperative summary (e.g., "Fix booking dialog state"). Reference issues (`#123`) when applicable.
- PRs: clear description, scope limited, link issues, include screenshots for UI changes, and note env/ops impacts. Ensure `lint`, type-checks, and tests pass.

## Security & Config
- Node >= 18 (see root `package.json`), package manager: `pnpm@9`.
- Env: use per-app `.env.local`/`.env` (never commit secrets). Turborepo caches consider `.env*`.
- Deploy: Cloudflare Workers via `wrangler` in web apps; Convex via `convex` in `@repo/api`.

## Architecture Notes
- `apps/*` are deployable frontends/clients. `packages/*` are shared libraries and backend API definitions.
- Prefer importing internal modules via workspace aliases (e.g., `@repo/utils`, `@repo/ui`).

## API Package Patterns (packages/api)
- Tech: Convex backend with TypeScript. Keep Convex layer thin; push logic to services/rules.
- Structure:
  - `convex/`: `schema.ts`, `queries/*`, `mutations/*`, `actions/*`, `http.ts`, `triggers/`, `utils.ts`, `_generated/*`.
  - `services/*`: Domain logic (accept `{ ctx, args, user }`), enforce auth/tenancy, throw `ConvexError` with `ERROR_CODES`.
  - `operations/*`: Orchestration across entities/services. Never passed ctx and/or do database operations.
  - `rules/*`: Pure business rules (booking limits, cancellation, etc.). Never passed ctx and/or do database operations.
  - `validations/*`: Input validation helpers; return typed `ValidationResult`.
  - `types/*`: Domain types consumed by apps.
  - `utils/*`, `emails/*`, `integrationTests/*`. Never passed ctx and/or do database operations.
- New feature flow:
  1) Model: add/adjust domain `types/*` and Convex `schema.ts` (collections, fields, indexes). Prefer compound indexes and use `withIndex` over `.filter`.
  2) Rules/validation: encode constraints in `rules/*` and `validations/*` (pure, testable).
  3) Services: implement business operations; keep side effects here (writes, external calls). Log via `utils/logger` and use `ERROR_CODES`.
  4) Convex glue: add `queries/* | mutations/* | actions/*` with `v.object(...)` args; get user via `getAuthenticatedUserOrThrow`; delegate to services/operations; use `mutationWithTriggers` when needed.
  5) Tests: unit-test rules/utils; add service/operation tests and `integrationTests/*` (see `convex/test.setup.ts`).
  6) Expose: export reusable `operations/*` and `types/*` in `package.json` `exports` if apps import them.
- Naming: `camelCase` functions, `kebab-case` files; export `Args` via `Infer<typeof args>` (see bookings example). Use `deleted` soft-delete flags consistently.
- Security & tenancy: always scope by `businessId`/`user._id`; never leak across tenants; validate ownership on read/update.

## Agent-Specific Instructions

Role: Senior fullstack product engineer for a multi-tenant SaaS booking platform. Own features end-to-end with strong product sense and domain rule design.

Core Competencies
- Frontend: React 19, TanStack Router, Zustand, RHF+Zod, Tailwind/shadcn, accessibility, responsive UI.
- Backend: Convex (queries/mutations/actions), real-time patterns, TypeScript-first APIs, Cloudflare Workers.
- Domain: Scheduling, pricing, credits, bookings, RBAC, waitlists, audit trails, timezone-aware recurrence.
- Architecture: DDD, vertical slices, event-driven workflows, CQRS.
- Quality & Ops: Vitest, Playwright, observability, CI/CD, caching.

How You Work
- Clarify goals and constraints; align with business impact.
- Design end-to-end flows (UI, API, schema, rules).
- Implement strongly typed, testable TypeScript; design Convex schemas/indexes.
- Build accessible components; encode rules as composable domain services.
- Handle edge cases (concurrency, retries, timezones, conflicts); document and ship.
- Iterate quickly with feedback.

Philosophy: Production-grade, maintainable, and business-aligned; separate UI/business/persistence; prioritize performance, security, and UX; favor type safety and meaningful tests.
