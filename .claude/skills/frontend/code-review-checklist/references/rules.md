# Code Review Checklist Rules

## Rule 1: Google's Eng-Practices Review Dimensions Are the Framework
- Every review considers, roughly in priority order: **design** (does this fit the system architecture), **functionality** (does it do what it's supposed to, including edge cases), **complexity** (is it more complex than it needs to be), **tests**, **naming**, **comments**, **style**, and **documentation**.
- This is the reference standard (Google's `eng-practices` guide — publicly archived as a static reference but still the widely-adopted industry baseline) — design and functionality issues matter more than style nitpicks, and review time is spent accordingly.

## Rule 2: "Better Code," Not "Perfect Code"
- A reviewer's goal is continuous improvement of the codebase, not requiring every PR to be flawless before approval — if a change makes the codebase measurably better and doesn't introduce new problems, it can be approved with minor follow-up suggestions rather than blocked on polish.
- Reviewers distinguish must-fix issues (bugs, security, broken tests, design problems) from optional suggestions (style preference, minor naming nitpicks) — and label which is which explicitly, so authors aren't left guessing whether a comment blocks merge.

## Rule 3: Small, Focused PRs
- A PR does one coherent thing — a single feature, fix, or refactor — not a bundle of unrelated changes. Large, multi-purpose PRs are harder to review carefully and more likely to hide real issues in the noise.
- If a change naturally splits into independent pieces (a refactor plus a new feature built on it), it's submitted as separate PRs in sequence, not one large PR.

## Rule 4: Tests Ship With the Code, Same PR
- Per the `testing-frontend` skill: tests for new/changed behavior are included in the same PR as the production code change, not deferred to a "will add tests later" follow-up — except for genuine emergency hotfixes, where a tracked follow-up is required immediately after.

## Rule 5: Self-Review Before Requesting Review
- The author reviews their own diff before requesting review — catching typos, leftover `console.log`/debug code, commented-out code, and obvious issues before a human reviewer's time is spent on them.
- The PR description explains the *why* (what problem this solves, what approach was chosen and why, any tradeoffs) — not just a restatement of *what* changed, which the diff already shows.

## Rule 6: Constructive, Specific, Fact-Based Feedback
- Comments cite a specific principle or concern ("this will re-render on every keystroke because X" per the `component-architecture` skill's memoization rules) rather than unexplained opinion ("I don't like this").
- Phrasing avoids language that implies the author should have obviously known better ("obviously," "just," "simply") — the same idea stated factually lands as feedback, not as a judgment of the author.

## Rule 7: Consistency With the Codebase Over Personal Preference
- When multiple approaches are equally valid by engineering principles, the reviewer defers to the author's choice or to existing codebase convention — a review is not the place to relitigate settled project-wide decisions (e.g. the styling approach chosen per the `component-architecture` skill, or the state-management library chosen per that skill) on a single PR.
- If a genuinely new pattern is being introduced (not just one developer's local preference), that's a discussion for the team/CLAUDE.md-level convention, not an ad hoc PR-review decision.

## Rule 8: Watch for Over-Engineering
- Reviewers push back on code made more generic or configurable than the current requirement needs — solve the problem that exists now; a speculative future requirement is addressed when it actually arrives with its real shape known, not guessed at in advance.
- This is the same discipline as the `component-architecture` skill's composition-over-configuration and prop-count rules, applied at review time to catch premature abstraction.

## Rule 9: Review Turnaround Time Is Bounded
- Reviews are completed within one business day where possible (Google's guideline) — a PR sitting unreviewed for days blocks the author's progress and encourages large, hard-to-review batches of unrelated follow-up work piling up while waiting.
- If a full review can't happen quickly, a fast acknowledgment ("looking at this by EOD") is better than silence.

## Rule 10: Security Checklist Items Are Explicit in Review (Cross-References `security-practices`)
- Every review of code touching auth, data access, user input, or third-party dependencies explicitly checks the relevant `security-practices` skill items: server-side access control (never frontend-only), no secrets in the diff, sanitization present for any HTML-rendering path, no new dependency added without vetting.

## Rule 11: Accessibility Checklist Items Are Explicit in Review (Cross-References `accessibility`)
- Any new UI in the diff is checked against the `accessibility` skill's core items: semantic HTML/ARIA correctness, keyboard operability, accessible names — a reviewer without deep a11y expertise can still check these because `jest-axe` (per the `testing-frontend` skill) should already be flagging violations in CI.

## Rule 12: Performance Checklist Items Are Explicit for Risk-Prone Changes (Cross-References `performance-optimization`)
- Changes touching lists, images, third-party scripts, or bundle-affecting new dependencies are checked against the relevant `performance-optimization` rules (virtualization, `next/image` usage, bundle-size impact) rather than assuming performance is someone else's concern.

## Rule 13: PR Templates Encode the Checklist, Reducing Reliance on Memory
- A PR template (in the repo, e.g. `.github/pull_request_template.md`) prompts the author to confirm the cross-cutting checklist items (tests included, a11y considered, no secrets, screenshots for UI changes) — this reduces the review from "does the reviewer remember to ask" to "did the author already confirm."

## Rule 14: Draft PRs for Early Feedback on Direction
- For a genuinely uncertain design/approach, a draft/WIP PR opened early gets feedback on direction before the full implementation is complete — catching a wrong approach after a few hours of work is far cheaper than after several days.

## Rule 15: UI Changes Include Visual Evidence
- PRs that change visual UI include a screenshot or short recording of the before/after — this connects to the `figma-pixel-perfect` skill's screenshot-diffing discipline, giving the reviewer the same visual comparison the author used during development instead of requiring them to check out the branch to see it.

## Rule 16: Review AI-Assisted/Generated Code With the Same Rigor, Not Less
- Code produced with AI assistance (Claude Code, Cursor, or similar) goes through the identical review checklist as hand-written code — AI-generated code is not exempt from design review, and is not assumed correct because it compiles or looks plausible; it is, if anything, checked more carefully for subtly incorrect logic, unnecessary complexity, or patterns inconsistent with the project's established skills/conventions.
- The author remains responsible for understanding and being able to explain every line submitted, regardless of how it was generated — "the AI wrote it" is never an acceptable answer to "why does this work this way" in review.

## Rule 17: Comments Explain Why, Not What
- Code comments (and review feedback about comments) focus on *why* a non-obvious decision was made — the code itself should already say *what* it does through clear naming (per the `component-architecture` skill's naming rules); a comment restating the code in English adds noise, not value.

## Rule 18: Naming Review Extends Existing Skills' Conventions
- Naming reviewed against the conventions already established: PascalCase components, `useXyz` hooks (`component-architecture`), and clear, intention-revealing names generally — a reviewer flags a name that doesn't communicate its purpose even if the code otherwise works correctly.

## Rule 19: Conflict Resolution Has an Explicit Path
- If author and reviewer disagree after discussion, the first step is trying to reach consensus based on documented principles (these skills' rules, or the language/framework's official guidance) rather than personal authority — if consensus isn't reached, escalate to a third team member or tech lead rather than the PR staying blocked indefinitely or the more senior person simply prevailing by default.

## Rule 20: Approval Is Not a Rubber Stamp
- An approval means the reviewer actually read and understood the change well enough to be accountable for having reviewed it — skimming a large diff and approving to unblock the author defeats the purpose of review (Rule 3's small-PR discipline exists partly to make genuine review actually feasible within reasonable time).

## Rule 21: Breaking Changes to Shared Components Are Called Out Explicitly
- Per the `component-architecture` skill's "props are a public contract" rule: a PR changing a shared/reusable component's public API flags this explicitly in the description, states the migration path (or confirms a deprecation window was used instead of a hard break), and the reviewer specifically checks for other call sites that would be affected.

## Rule 22: i18n Regression Check
- Per the `component-architecture` and `form-handling-validation` skills' no-hardcoded-strings rules: a reviewer checks new UI copy and validation messages for hardcoded strings that bypassed the i18n mechanism — this is easy to miss in a fast review and easy to catch with a quick scan for string literals in JSX.

## Rule 23: New Dependency License Compatibility
- Beyond the `security-practices` skill's vulnerability/maintenance vetting, a new dependency's license is checked for compatibility with the project's own licensing (e.g. a copyleft-licensed package in a proprietary codebase is a legal risk, not just a technical one) — this is a distinct check from security vetting and easy to overlook.

## Rule 24: Documentation/Stories Updated in the Same PR
- When a PR changes a component's behavior, props, or usage pattern, the corresponding documentation/Storybook story (per the `documentation-storybook` skill) is updated in the same PR — documentation drift starts the moment behavior changes and docs don't, and "update the docs later" follow-ups are reliably deprioritized once the PR is merged.

## Rule 25: Explicit Blast-Radius Check for High-Stakes EdTech Paths
- For changes touching live-class delivery, quiz/assessment submission, or grading, the reviewer explicitly asks "what happens if this breaks while a live class or timed assessment is in progress" — these paths have a materially higher cost of failure than a typical CRUD feature (a live session mid-flight, not just a page reload), and the review bar reflects that even for changes that look small.
