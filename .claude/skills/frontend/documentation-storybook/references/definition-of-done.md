# Definition of Done — Documentation & Storybook

A component/feature cannot be marked "done" until every item below is checked.

## 1. Component Stories
- [ ] Every component has a `.stories.tsx` file with `tags: ['autodocs']`
- [ ] Props fully typed and JSDoc-annotated for a meaningful auto-generated prop table
- [ ] Stories cover default, loading, error/empty, all visual variants, and notable edge cases
- [ ] Figma frame embedded in the docs page where feasible

## 2. Interaction & Testing Integration
- [ ] Interactive components have a `play` function documenting the interaction sequence
- [ ] Story set feeds visual regression tooling (Chromatic/Playwright screenshots)
- [ ] Storybook accessibility addon enabled and checked per story

## 3. Non-Visual Code
- [ ] Custom hooks, utilities, and API/state modules have TSDoc/JSDoc on exported functions
- [ ] Non-trivial components/hooks include a narrative usage example beyond the prop table

## 4. Project-Level Documentation
- [ ] README covers local setup, chosen conventions across the skill set, and pointers to deeper docs
- [ ] Significant/hard-to-reverse decisions recorded as short ADRs
- [ ] Central pointer to the current API contract (OpenAPI/Postman location) documented
- [ ] Onboarding doc walks a new developer through setup and conventions at a glance

## 5. Discoverability & Lifecycle
- [ ] Stories organized in a clear, consistent category hierarchy
- [ ] Storybook deployed and linkable from the README, not local-only
- [ ] Changelog maintained for shared component/library changes
- [ ] Deprecation notices visible in the docs UI, not only as JSDoc tags
- [ ] Known limitations/edge cases explicitly documented

## 6. Sync Discipline
- [ ] Documentation/stories updated in the same PR as the behavior/prop change they describe
- [ ] Documentation periodically checked for staleness against current code

## Sign-off
Only mark "documentation-storybook: done" once all sections are checked.
