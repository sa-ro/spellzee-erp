# Definition of Done — Monorepo & Build Tooling

## 1. Justification & Setup
- [ ] A real multi-app/multi-package need exists — tooling wasn't adopted preemptively for a single app
- [ ] Existing workspace/orchestration tooling detected and followed, or pnpm workspaces + Turborepo used for a new precedent

## 2. Package Boundaries
- [ ] New/changed package boundary reflects a real ownership/change-rate distinction, not arbitrary splitting
- [ ] Package's `package.json` declares every dependency it actually imports — no reliance on hoisted/phantom access
- [ ] No circular dependency introduced between packages

## 3. Task Graph & Caching
- [ ] `turbo.json`'s `dependsOn`/`outputs` accurately reflect real build dependencies for any new/changed task
- [ ] Remote caching is configured and working in CI
- [ ] CI runs only affected packages for the PR's changes, not a full-repo rebuild

## 4. Package API
- [ ] Shared package's public exports are intentional (via `index.ts`/`exports` field) — no relied-upon deep imports into internals

## 5. Versioning & Config
- [ ] Internal-only packages remain unversioned/`workspace:*` unless there's a real external-publish reason
- [ ] Each app's environment/config is explicit, not implicitly inherited from a shared root file

## Sign-off
Only mark "monorepo-tooling: done" once all sections are checked.
