# Documentation & Storybook Rules

## Rule 1: Storybook + CSF3 Is the Standard for Component Documentation (Project Detection Applies)
- **Existing project**: check `package.json` for `storybook`/`@storybook/*` packages and follow the existing story format/organization. Don't introduce a competing documentation tool.
- **New project / no precedent**: default to Storybook using Component Story Format 3 (CSF3) — object-based story exports with `Meta`/`StoryObj` types, which is the current stable format (Storybook continues supporting CSF1/2/3; newer experimental formats exist but CSF3 remains the practical default).
- Every component built per the `component-architecture` skill's rules gets a corresponding `.stories.tsx` file — documentation is not an afterthought added once a component is "done," it's part of building the component.

## Rule 2: `autodocs` Generates the Baseline, TypeScript/JSDoc Feeds It
- Every component's story file uses `tags: ['autodocs']` to auto-generate a documentation page with an interactive prop table — this table is only useful if props are properly typed (per the `component-architecture` skill's strict-typing rule) and annotated with JSDoc comments explaining non-obvious props.
- A prop typed only as `string` with no description tells a consumer nothing about valid values or intent — JSDoc comments on props are treated as part of the component's deliverable, not optional polish.

## Rule 3: One Story Per Meaningful State/Variant
- A component's stories cover its realistic states: default, loading, error/empty (per the `component-architecture` skill's Rule 11), each visual variant (`variant="primary"`/`"secondary"`), and edge cases worth documenting (long text overflow, disabled state) — not just one default story that shows nothing about the component's range.
- Stories double as the manual visual-testing surface referenced in the `figma-pixel-perfect` skill's screenshot-diffing rule — a component without stories for its states can't be diffed against Figma for those states.

## Rule 4: Figma Embedded Alongside Stories (Cross-References `figma-pixel-perfect`)
- Where feasible, the source Figma frame is embedded directly in the Storybook docs page (via a Figma-embed addon) so the design reference and the implementation sit side by side — this closes the loop on the `figma-pixel-perfect` skill's pixel-accuracy verification, making the comparison a permanent, browsable artifact rather than a one-time check during development.

## Rule 5: Play Functions Document Interaction, Not Just Appearance
- For interactive components (forms, menus, dialogs), a story's `play` function demonstrates the interaction sequence (e.g. opening a menu, typing in a field) — this makes the story simultaneously documentation of *how* to interact with the component and a lightweight interaction test.
- Storybook's own `composeStories`/portable-stories API lets these play-function stories be imported and re-run directly inside the Vitest/RTL suite `testing-frontend` owns — so writing the story isn't throwaway documentation effort, it feeds testing too. This is Storybook's built-in capability, not something `testing-frontend` itself defines; that skill only consumes it.

## Rule 6: Visual Regression Runs on the Story Set (Cross-References `testing-frontend` Rule 16)
- The story set (Rule 3's full range of states) is the input to visual regression tooling (Chromatic or Playwright screenshot comparison) — comprehensive stories directly translate into comprehensive visual regression coverage, so under-documenting states also under-protects them.

## Rule 7: Storybook's Accessibility Addon Surfaces A11y Issues at the Documentation Layer (Cross-References `accessibility`)
- The Storybook accessibility addon (built on axe-core, same engine as the `accessibility` skill's automated-testing rule) runs against every story, giving a per-component, per-state accessibility check visible right where the component is documented — not just in a separate CI report disconnected from the component's own page.

## Rule 8: Non-Visual Code Gets Its Own Documentation Layer
- Storybook documents components; it does not meaningfully document custom hooks, utility functions, Redux/Zustand slices, or API client modules. These get documentation via TSDoc/JSDoc comments on exported functions (consumed by editor tooltips and optionally compiled into a reference site via TypeDoc) — a hook is not "undocumented is fine" just because it doesn't render anything Storybook can show.

## Rule 9: README Covers What Storybook Can't — Setup, Architecture, Conventions
- The project README documents: how to run the project locally, the chosen conventions from each skill in this set (which state-management library, REST/axios-only, styling approach), and pointers to where deeper documentation lives (Storybook URL, ADRs) — a new developer's first hour should be answerable from the README, not from asking a teammate.
- The README is kept short and pointer-heavy rather than attempting to duplicate the full depth of every skill's rules inline.

## Rule 10: Architecture Decision Records (ADRs) for Significant Choices
- A significant, hard-to-reverse decision (choosing Zustand vs Redux Toolkit for a project per the `state-management` skill, adopting REST-only with axios per the `api-integration` skill, a major library swap) is recorded as a short ADR: what was decided, what alternatives were considered, and why — not left as tribal knowledge that only the original decider remembers.
- ADRs are short (a page or less) and dated — they document a decision at a point in time, not a living document that needs constant updating.

## Rule 11: Comments Document Why, Docs Document What and How (Cross-References `code-review-checklist` Rule 17)
- Inline code comments explain non-obvious *why* (per the `code-review-checklist` skill); Storybook/README/ADR documentation explains *what* a component or system does and *how* to use it — these serve different readers (someone editing this exact code vs. someone consuming/integrating it) and aren't a substitute for each other.

## Rule 12: Documentation Updates Ship With the Code Change (Cross-References `code-review-checklist` Rule 24)
- When a component's props, behavior, or a documented convention changes, the corresponding story/README/ADR updates in the same PR — this is the same discipline the `code-review-checklist` skill enforces at review time, stated here as the authoring-side rule it depends on.

## Rule 13: Document the i18n Mechanism Itself, Not Just Use It
- Per the no-hardcoded-strings rules established across the `component-architecture` and `form-handling-validation` skills, and owned in full by the `i18n-l10n` skill: the i18n mechanism itself (where translation keys live, how to add a new language, how Tamil/regional-script content is structured per the `performance-optimization` skill's font-subsetting rule) is documented once, centrally — so the convention is discoverable rather than requiring every developer to reverse-engineer it from existing code.

## Rule 14: Onboarding Documentation for New Developers (EdTech Team Context)
- A dedicated onboarding doc (or README section) walks a new developer through: local setup, the project's chosen conventions across all ten skills in this set at a glance, and where to find each skill's detailed rules — reducing ramp-up time and ensuring conventions are followed from day one rather than learned by trial and error/code review correction.

## Rule 15: Documentation Has an Owner and a Staleness Check
- Significant documentation (README, ADRs, onboarding doc) is periodically reviewed for staleness (e.g. revisited whenever a related major dependency or convention changes) rather than written once and never revisited — stale documentation that contradicts current code is worse than no documentation, because it actively misleads.

## Rule 16: Storybook Deployed and Linkable, Not Only Local
- The Storybook instance is deployed somewhere reachable by the whole team (Chromatic's hosting, or a static deploy) and its URL is referenced from the README — a documentation system only the original author can run locally isn't functioning as shared documentation.

## Rule 17: Controls Addon Enables Interactive Prop Exploration
- Storybook's Controls addon is enabled so consumers (designers, other developers, QA) can interactively adjust a component's props/args in the browser and see the result live — this turns the documentation page into a lightweight design/QA tool, not just a static reference.

## Rule 18: Document Known Limitations and Edge Cases Explicitly
- Where a component has a known limitation (doesn't support a certain prop combination, has a specific browser quirk, intentionally doesn't handle a case), this is documented on the component's docs page or in a comment — explicit documentation of a limitation prevents someone else rediscovering it the hard way or "fixing" an intentional constraint.

## Rule 19: Changelog for Shared Component/Library Changes
- A shared component library maintains a changelog (even a simple `CHANGELOG.md`) noting breaking changes, new components, and deprecations per release/version — this is distinct from an ADR (which documents a decision's reasoning) and from a PR description (which documents one change) — a changelog is the single place a consumer checks "what changed since I last used this."

## Rule 20: Deprecation Notices Are Visible in the Docs UI, Not Just JSDoc
- When a prop or component is deprecated (per the `component-architecture` skill's deprecation-path rule), the Storybook docs page shows a visible deprecation notice — a `@deprecated` JSDoc tag alone only surfaces as an editor tooltip, which a consumer browsing Storybook (rather than writing code with autocomplete active) would never see.

## Rule 21: Stories Organized in a Clear, Discoverable Hierarchy
- Story titles follow a consistent category hierarchy (e.g. `UI/Button`, `Forms/Input`, `Layout/Card`) matching the project's actual component organization — a flat, unsorted list of stories becomes unusable as the component count grows, defeating the purpose of having documentation at all.

## Rule 22: Central Pointer to the Current API Contract
- The README or a dedicated docs page points to where the current REST API contract lives (OpenAPI spec location, Postman collection, or equivalent, per the `api-integration` skill's codegen rule) — a frontend developer starting new work should have one obvious place to check what endpoints exist and their shapes, not need to ask the backend team or dig through existing code for an example call.

## Rule 23: Narrative Usage Examples Beyond Auto-Generated Prop Tables
- For non-trivial components or custom hooks, documentation includes a short narrative example (a code snippet showing realistic usage in context) in addition to the auto-generated prop table — a prop table shows *what* props exist, but a usage example shows *how* they're meant to be combined, which is often the harder thing for a new consumer to figure out from types alone.
