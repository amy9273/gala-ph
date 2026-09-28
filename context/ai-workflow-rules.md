# AI Workflow Rules — GalaPH

These rules govern how AI coding agents must operate while building and modifying GalaPH. They are imperative rules, not suggestions.

---

## 1. Spec-Driven Discipline

- **Never code without a spec**: Before writing or modifying any implementation code, read the active unit spec in `context/specs/NN-[feature-name].md`.
- **Stay in scope**: Implement only what the spec demands. Do not add speculative "nice-to-have" features or install unapproved packages.
- **Consult invariants**: Check every change against `context/architecture.md` invariants before concluding a unit.

---

## 2. UI Consistency Enforcement (Anti-Slop Guardrail)

- **Zero Arbitrary Values**: Never write inline styles (`style={{ ... }}`), raw hex codes (`bg-[#123456]`), or ad-hoc colors. All colors, margins, and typography must use tokens from `context/ui-context.md`.
- **Mandatory 4-State UI**: Any view fetching or mutating data must explicitly build all four states:
  1. Content-shaped Skeleton loading state (never an unstyled solitary spinner).
  2. Meaningful Empty state with an actionable button.
  3. User-friendly Error state with a "Retry" button.
  4. Populated data view.
- **Cross-Platform Semantic Match**: Transit indicators (Autosweep gold, Easytrip ocean, Commute emerald) must match identically in meaning across Web and Mobile.

---

## 3. Scoping & Execution Discipline

- **Always Sync Upstream First (Mandatory Baseline)**: Before starting any new unit or creating a feature branch, ALWAYS switch to `main`, run `git fetch origin main && git pull origin main`, and verify local `main` matches `origin/main`. Always branch directly from updated `main` (`git checkout -b feat/unit-NN-... origin/main`). NEVER branch off an unmerged or pre-squash feature branch.
- **One Unit at a Time**: Work on a single, isolated unit per prompt cycle. Complete and verify it before moving to the next.
- **Explicit Consent Before Proceeding**: Never automatically proceed to the next unit without explicit user consent. Always complete, test, and present the current unit's deliverables, and wait for the user to instruct or approve moving to the next unit.
- **Build Artifact Hygiene & Pre-Push Upstream Sync**:
  - Never commit temporary compiler cache files (`*.tsbuildinfo`), build outputs (`.next/`, `dist/`), or local runtime files. Always keep `.gitignore` updated.
  - **Before pushing ANY feature branch**, ALWAYS run `git fetch origin main`. If `origin/main` has advanced, rebase onto `origin/main`.
  - Verify `git diff --stat origin/main` contains exclusively the changes for the current unit with 0 merge conflicts.
- **Never commit to `main` or `master`**: AI agents must **NEVER** commit or push directly to `main` or `master`. Always verify that work is isolated to a feature branch (`feat/unit-NN-description`).
- **Never bypass errors**: If a TypeScript or compilation error occurs, fix the root cause. Never cast to `any` or suppress linter errors with `@ts-ignore`.
- **Keep Documentation in Sync**:
  - Update `context/progress-tracker.md` when starting and finishing a unit.
  - If a design or technical decision evolves during implementation, update `architecture.md` or `project-overview.md` immediately.

---

## 4. Proactive IDE & Type Error Prevention Protocol

AI agents must proactively follow these architectural rules to prevent IDE language server and TypeScript resolution errors:

1. **Zero Circular Dependencies**:
   - Never create circular imports between `workers/`, `services/`, and `controllers/`.
   - Place shared queues, instances, and configurations in dedicated leaf modules in `src/lib/` (e.g. `src/lib/queue.ts`, `src/lib/prisma.ts`, `src/lib/redis.ts`).
2. **Prisma Type Isolation & Clean JSON Handling**:
   - Never rely on unstable internal Prisma namespace types.
   - Use clean, standard TypeScript types (`Record<string, unknown>`, `unknown`, or concrete DTO interfaces) for JSON columns.
   - Explicitly type transaction parameters: `(tx: Prisma.TransactionClient) => ...`.
3. **Explicit Callback & Lambda Parameter Typing (Eliminate TS7006)**:
   - NEVER rely on TypeScript contextual inference for array callbacks (`.find()`, `.filter()`, `.map()`, `.reduce()`).
   - When querying nested Prisma relations (`include` or `select`), ALWAYS define explicit payload types using `Prisma.<Model>GetPayload<{ include: { ... } }>` and type the callback parameter explicitly:
     ```ts
     type TripWithMembers = Prisma.TripGetPayload<{
       include: { members: { include: { user: true } } };
     }>;
     type MemberWithUser = TripWithMembers["members"][number];

     const lead = trip.members.find(
       (m: MemberWithUser) => m.role === "TRIP_LEAD",
     );
     ```
   - This ensures zero `Parameter '...' implicitly has an 'any' type` errors regardless of IDE language server state.
4. **Mandatory Non-Null Guards on Nullable Results (Eliminate TS18047 / TS18048)**:
   - Database lookups (`findUnique`, `findFirst`) return `T | null`. Array `.find()` returns `T | undefined`.
   - In environments with `noUncheckedIndexedAccess: true` and `strictNullChecks: true`, NEVER access properties directly on the result without an explicit non-null guard.
   - ALWAYS place an explicit guard immediately after fetching:
     ```ts
     const trip = await prisma.trip.findUnique({ where: { inviteCode } });
     assert.ok(trip, "Trip must exist");
     if (!trip) throw new Error("Trip not found");
     // Now trip is 100% narrowed to NonNullable<Trip> across all TS tooling
     ```
   - In test files, ALWAYS use `import assert from "node:assert/strict"` instead of `node:assert`, because `node:assert/strict` provides TypeScript assertion function signatures (`asserts value`).
5. **Root TSConfig Project Resolution**:
   - Maintain `tsconfig.json` at the monorepo root extending `tsconfig.base.json` so IDE language servers (VS Code, Cursor, Zed) always parse workspace files with unified project context instead of falling back to isolated single-file inference.
6. **Mandatory Automated Code Quality & Style Verification Loop**:
   - **Formatting (Prettier)**: Run `npm run format` / `prettier --check` on every iteration. Zero style warnings permitted.
   - **Strict Typecheck**: Run `npm run typecheck --workspaces` (`tsc --noEmit`). Zero compiler errors permitted.
   - **Linting**: Run `npm run lint --workspaces` (`eslint .`). Zero linter warnings/errors permitted.
   - **Test Suites**: Run relevant unit/integration tests to ensure regressions are caught early.
7. **Redis Namespace Discipline (Shared Instance)**:
   - Always prefix all Redis keys, BullMQ queues, and locks with `galaph:` (`galaph:cache:*`, `galaph:idempotency:*`, `galaph:bullmq:*`) to prevent collision with other applications sharing the existing Redis instance.
   - Always import the Redis client from `src/lib/redis.ts` and ensure connections are quit cleanly in tests and shutdown handlers to avoid open socket leaks.

---

## 5. Background Task & Process Lifecycle Management

- **No Orphaned Background Tasks**: When executing tests, dev servers, or long-running scripts, actively track all background task IDs.
- **Mandatory Kill on Completion/Teardown**: If a task finishes its job, times out, hangs, or is superseded, immediately terminate it via `manage_task(Action='kill')` to prevent memory leaks, open database socket leaks, or orphaned Node processes.
- **Active Verification**: Before ending any turn or concluding a unit, inspect running background tasks (`manage_task(Action='list')`) and kill any non-daemon processes that should not be lingering.

---

## 6. Quality Gate & CI/CD Verification Before Closing

Before marking any unit complete in `context/progress-tracker.md`, run and verify:

- [ ] Working on a feature branch (`feat/unit-NN-...`), NEVER directly on `main` or `master`.
- [ ] Prettier formatting check passes (`npm run format:check`).
- [ ] TypeScript compilation passes with zero errors (`npm run typecheck`).
- [ ] Linter passes with zero warnings (`npm run lint`).
- [ ] Unit/Integration tests pass cleanly with all handles and background tasks terminated.
- [ ] Component meets the 4-state UI rule and uses tokens from `ui-context.md`.
- [ ] Clean diff verified (`git diff` has no leftover `console.log`, debugger, or commented-out code).
- [ ] Clean upstream sync: branch rebased cleanly onto `origin/main` with 0 merge conflicts.
- [ ] No hardcoded secrets, API keys, or localhost URLs committed.
- [ ] Zero lingering background tasks (`manage_task(Action='list')` is clean).
