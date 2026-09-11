# Upgrade plan — Claude Code setup

_Derived from [AUDIT.md](AUDIT.md). Ordered cheapest-highest-impact first: the verification
layer and the CLAUDE.md prune land before any skill work, because they are what is actually
missing._

Legend: **C** create · **E** edit · **D** delete

| # | File | C/E/D | Justification | Risk if it goes wrong |
|---|---|---|---|---|
| 1 | `scripts/verify.sh` | **C** | Nothing verifies a change after it is written (AUDIT §4). This is the single check script. | A skip-aware script can mask a real failure if `--full` is forgotten. Mitigated: SKIPPED lines state their reason and are counted in the summary. |
| 2 | `package.json` | **E** | Add `typecheck` (absent — AUDIT §4) and `verify`. Two additions, no renames. | Low. `tsc -b` writes `.tsbuildinfo`/`dist/`, both gitignored (`.gitignore:10`). |
| 3 | `.claude/settings.json` | **E** | Wire the `Stop` hook; add the `permissions.allow` block that is entirely absent. | **Highest risk in the plan.** A Stop hook exiting non-zero blocks the turn. Mitigated by the tiered design + testing the script directly in both modes before trusting the hook. |
| 4 | `CLAUDE.md` | **E** | 439 always-in-context lines, no `@` imports. Cut what duplicates an authoritative file; fix the stale "17 skills" at `:87`. | Cutting something load-bearing. Mitigated: only cut where content demonstrably lives in a named file, and leave a pointer to it. |
| 5 | `.claude/skills/backend/type-safety-contract/` | **C** | The one genuine MISSING target. `packages/contracts` is owned by no skill (AUDIT §5.6). | A new skill competing with `backend-api-design`. Mitigated by a "Distinct from" clause naming both neighbours. |
| 6 | `.claude/skills/backend/project-conventions/SKILL.md` | **E** | Body says "template, not yet populated" while its own references file holds 198 lines of fact — and `CLAUDE.md:98` says this skill *wins* once populated (AUDIT §5.1). | Low; strictly corrective. |
| 7 | `.claude/skills/backend/infra-cost-ai-backend/SKILL.md` | **E** | Sole deploy/CI claimant, framed AWS/K8s/Docker on a machine with no Docker (AUDIT §5.8). | Low; scoping only. |
| 8 | `.claude/skills/backend/spellzee-outbox-merithub/SKILL.md` | **E** | Owns queues; add the scheduled/recurring-job gap (one `cron` mention library-wide, AUDIT §5.7). | Low; additive. |
| 9 | `.claude/skills/frontend/api-integration/` | **E** | Self-contradiction on codegen vs shared types (AUDIT §5.2); also scope explicitly to the client so it stops competing with `backend-api-design`. | Low; removes a contradiction. |
| 10 | 6 × `SKILL.md` frontmatter | **E** | Resolve the two literal trigger collisions and the `"dashboard"` false positive (AUDIT §5.3–5.5): `backend-api-design`, `workflow-new-endpoint`, `testing-debugging-review`, `frontend/code-review-checklist`, `reliability-observability`, `frontend/data-viz-dashboards`. | Shifting skill selection unpredictably. Mitigated: every phrase stays claimed by exactly one skill — see the note below. |
| 11 | `.claude/agents/diff-vs-plan-reviewer.md` | **C** | Plan-conformance review is unowned: `erosion-auditor.md:73-74` fixes its rubric to the trade-off library and `:115` forbids reasoning about intent. | A third reviewer competing with the other two. Mitigated by explicit deferral clauses in all directions. |
| 12 | `.claude/agents/README.md` | **E** | Register the new agent in the Tier 1 table. | None. |

### Correction to row 10, after implementation

The row originally promised clauses would only be **added**, never removed. That turned out to
be the wrong mitigation, and three edits removed a phrase:

| Skill | Removed | Now claimed by |
|---|---|---|
| `backend-api-design` | `"add an endpoint"` | `workflow-new-endpoint` (the procedure) |
| `testing-debugging-review` | `"production issue"`, `"incident"` | `workflow-incident-response` |
| `reliability-observability` | bare `"dashboard"` | split: `"ops dashboard"` here, product dashboards to `frontend/data-viz-dashboards` |

A *literal collision* cannot be resolved by addition — if two descriptions both quote
`"add an endpoint"`, adding prose to each leaves both still matching it. One of them has to
stop claiming the phrase. The invariant that actually matters is **no phrase is orphaned**:
each removed phrase is still claimed by exactly one skill, and each removal is paired with a
clause naming where it went. The one with real behavioural change is
`reliability-observability`, which no longer matches a bare `"dashboard"` — that was the false
positive being fixed.

## Not doing, and why

- **No CONVERT-TO-HOOK changes.** Every mechanically-checkable rule is already a guard rule
  (`guard-invariants.js:68-224`). What remains is semantic — a regex cannot decide whether a
  threshold is hard-coded or an audit write is missing, and false positives would train you to
  ignore the hook. `CLAUDE.md:146-149` already routes these to `erosion-auditor`.
- **No `caching-revalidation` skill.** Building it as specified would reverse rule 4;
  `distributed-systems-caching/SKILL.md:46-53` already covers the posture by rejecting it.
- **No tRPC skill.** Zero hits library-wide; the stack is NestJS REST (`CLAUDE.md:17`).
- **No skill deletions.** Nothing in the library is dead weight that the audit could prove.

## Verification (Phase 6)

1. `bash scripts/verify.sh` on the clean tree → passes, with DB-dependent steps SKIPPED and
   the reason stated.
2. Introduce a type error → typecheck step catches it → revert → clean.
3. Edit `prisma/schema.prisma` with no migration → `migrate diff --exit-code` catches it →
   revert.
4. Run `diff-vs-plan-reviewer` on a real diff → paste output.

### Outcome (updated after implementation)

All four verification steps ran live. `npm install` was approved and run, and a `.env` was
created from `.env.example` (it is gitignored, so the tree is unaffected); PostgreSQL was
already up on 5433, and the migration was applied to `spellzee_test`, which had never received
it. `scripts/verify.sh` now runs **six of seven steps for real** — only `e2e` skips, because no
such script exists in this repo.

Two deviations from the plan, both recorded rather than hidden:

- **The `/context` before/after still needs the interactive command.** Measured instead:
  CLAUDE.md went 439 → 408 lines. Run `/context` yourself either side for the token figure.
- **CLAUDE.md did not reach the ~240–260 line target**, landing at 408. Going through the
  remaining sections, the bulk is domain rules — identity model, Merithub constraints,
  governance, session policy, capacity — that are not derivable from code which does not exist
  yet. Cutting to hit a number would have removed exactly the lines that fail the stated test
  ("would this cause a real mistake if removed"). The shortfall is reported rather than padded.
