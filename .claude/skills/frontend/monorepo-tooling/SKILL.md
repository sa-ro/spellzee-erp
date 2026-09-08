---
name: monorepo-tooling
description: Use this skill whenever the user is setting up or restructuring a monorepo — multiple apps/packages sharing code, Turborepo/Nx configuration, shared UI/config packages, build caching, or dependency boundaries between packages. Trigger for phrases like "set up a monorepo", "share this component across apps", "Turborepo", "Nx", "workspace package", "circular dependency between packages", "build caching", "why is CI rebuilding everything", or any request involving `pnpm workspace`, `turbo.json`, or splitting a codebase into packages. Also trigger for Definition of Done review when a change touches shared/workspace packages.
---

# Monorepo & Build Tooling Skill

Defines how a multi-app/multi-package repository is structured and built — package boundaries, shared UI/config packages, Turborepo task orchestration and caching — so shared code stays reusable without becoming a tangled dependency graph or a CI bottleneck.

## Step 0: Detect Project Context Before Applying Any Rule

**Existing project?**
- Check for `turbo.json`, `nx.json`, `pnpm-workspace.yaml`, or a root `package.json` with `workspaces`. Follow the established structure — don't restructure packages or introduce a second orchestration tool without discussing it.

**New project / no precedent (multi-app need confirmed)?**
- Default to **pnpm workspaces + Turborepo** — pnpm's strict node_modules linking catches accidental cross-package dependency leaks that npm/yarn allow silently; Turborepo gives task caching/orchestration without Nx's steeper configuration surface for a typical 2-5 app setup.
- **Don't set up a monorepo for a single app** — this tooling exists to solve multi-package/multi-app coordination problems; a single Next.js app gains nothing from it and pays real complexity cost.

## When to use this
- Setting up a new monorepo, or adding a new app/package to an existing one
- Extracting shared code (UI components, config, types) into a workspace package
- Diagnosing slow/uncached CI builds or unnecessary full-repo rebuilds
- Resolving a circular dependency between packages
- Reviewing a PR or running Definition of Done when a change touches a shared/workspace package

## Core principles (see `references/rules.md` for full detail with rationale)

1. **Monorepo tooling is justified only by an actual multi-app/multi-package need** — never adopted preemptively
2. **pnpm workspaces + Turborepo as the default**, project-detected otherwise
3. **Package boundaries follow ownership/change-rate, not just "shared vs. app"** — a package is worth its own boundary when it changes independently
4. **Every workspace package declares its own explicit dependencies** — no relying on hoisting/phantom access to a sibling package's transitive deps
5. **No circular dependencies between packages** — enforced by tooling, not just convention
6. **`turbo.json` task graph accurately reflects real dependencies** (`dependsOn`), so caching is correct, not just fast
7. **Remote caching is enabled for CI** — a cold CI cache defeats the entire point of the tool
8. **Shared UI/config packages version deliberately** — internal packages can stay unversioned/`workspace:*` until there's a reason to publish externally
9. **A shared package's public API is intentional** — not every internal file is exported
10. **CI only builds/tests what actually changed**, using the task graph's affected-package detection, not a full rebuild on every PR
11. **Environment/config differences between apps are explicit**, not implicitly assumed shared

## Workflow

1. **Step 0 first, always**: confirm there's a real multi-package need, and detect existing tooling.
2. Define package boundaries by ownership/change-rate before extracting shared code.
3. Configure `turbo.json`'s task graph (`dependsOn`, `outputs`) to match real build dependencies.
4. Enable remote caching for CI.
5. Before sign-off: run through `references/definition-of-done.md`.

## Notes
- This skill governs repository/package structure and build orchestration. For how a shared UI package's components are structured internally, see `component-architecture`. For documenting a shared package's API, see `documentation-storybook`.
- Grounded in official Turborepo, Nx, and pnpm workspace documentation — see `references/sources.md`.
