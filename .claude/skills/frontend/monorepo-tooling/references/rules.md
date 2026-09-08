# Monorepo & Build Tooling Rules

## Rule 1: Justified Only by a Real Multi-App/Multi-Package Need
- Monorepo tooling (workspaces, task orchestration, caching) solves coordination problems across multiple apps/packages — a single app gains nothing from it and pays real ongoing complexity cost (extra config, a steeper mental model for new contributors). Don't adopt it preemptively "in case we split things up later."

## Rule 2: pnpm Workspaces + Turborepo as the Default
- Check for existing tooling first and follow it. For a new setup: **pnpm workspaces** for package management (its strict, non-flat `node_modules` linking catches a package silently depending on another package's transitive dependency, which npm/yarn's hoisting allows to work by accident until it breaks) + **Turborepo** for task orchestration/caching (simpler configuration surface than Nx for a typical few-app setup; reach for Nx only if the project needs its more advanced generators/plugin ecosystem).

## Rule 3: Package Boundaries Follow Ownership/Change-Rate
- A piece of code becomes its own workspace package when it has a distinct reason to change independently or a distinct ownership boundary (a shared design-system package used by 3 apps, a shared types/API-client package) — not just because it's technically reusable. Splitting every reusable function into its own package creates excessive cross-package overhead for little benefit; under-splitting leaves genuinely independent concerns tangled together.

## Rule 4: Every Package Declares Its Own Explicit Dependencies
- Each workspace package's `package.json` lists every dependency it actually imports, even if that dependency happens to already be present in `node_modules` via hoisting from another package — relying on phantom/hoisted access breaks the moment the sibling package that happened to bring it in removes or changes that dependency. pnpm's strict linking helps enforce this; don't work around it by flattening the install.

## Rule 5: No Circular Dependencies Between Packages
- Package A depending on package B, which depends back on package A (directly or transitively), is not allowed — it breaks build ordering, task graph correctness, and usually signals a boundary was drawn in the wrong place. Enforce this with tooling (Turborepo/Nx will surface a cycle, or a dedicated lint rule) rather than relying on developers noticing manually.

## Rule 6: `turbo.json` Task Graph Reflects Real Dependencies
- Each task's `dependsOn` accurately lists the tasks it actually depends on (a `build` task depends on `^build` for its workspace dependencies; `test` typically depends on `build` if it needs compiled output) — an inaccurate task graph produces caching that's fast but wrong (a stale dependency's output gets reused) or correct but needlessly slow (unnecessary rebuilds). `outputs` is configured precisely so caching knows what to actually cache.

## Rule 7: Remote Caching Enabled for CI
- Turborepo's (or Nx's) remote cache is configured and connected in CI — a monorepo tool's local-only cache means every fresh CI runner starts cold and rebuilds everything, defeating a large part of the reason the tool was adopted. This is a one-time setup cost that pays for itself immediately on any repo with meaningful build time.

## Rule 8: Internal Packages Version Deliberately
- A shared package consumed only within the monorepo stays unversioned (`"version": "0.0.0"`, referenced via `workspace:*`) — there's no reason to manage semver for a package nothing outside the repo consumes. Only introduce real versioning/publishing when the package is actually published externally (an npm package, a public design system) or when a specific rollback/pinning need arises.

## Rule 9: A Shared Package's Public API Is Intentional
- A shared package exports only what's meant to be its public surface (via its `exports`/`main` entry and an explicit `index.ts` re-export list) — not every internal file reachable by deep-importing (`@myorg/ui/src/internal/Foo`). Deep imports into a package's internals couple consumers to implementation details that should be free to change.

## Rule 10: CI Builds/Tests Only What Changed
- CI uses the task graph's affected-package detection (Turborepo's `--filter`, or Nx's `affected` commands) based on the changed files in a PR, rather than running the full build/test suite for every package on every PR — a monorepo that rebuilds everything regardless of what changed loses most of the tool's value and makes CI slower as the repo grows, not faster.

## Rule 11: Environment/Config Differences Between Apps Are Explicit
- Each app in the monorepo has its own explicit environment configuration (env vars, build-time constants) — a shared root `.env` or config assumed identical across apps is a common source of one app silently picking up another app's configuration. Shared config values live in a shared config package that each app explicitly imports and can override, not an implicitly inherited root file.
