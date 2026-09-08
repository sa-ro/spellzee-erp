# Definition of Done — Code Review

A PR cannot be merged until every item below is checked.

## 1. Author-Side Preparation
- [ ] Self-reviewed the diff before requesting review (no debug code, typos, leftover comments)
- [ ] PR description explains why, not just what; states approach and tradeoffs
- [ ] PR does one coherent thing — not a bundle of unrelated changes
- [ ] Tests included in the same PR as the code change

## 2. Review Dimensions (Priority Order)
- [ ] Design reviewed — fits the system architecture
- [ ] Functionality reviewed — correct behavior including edge cases
- [ ] Complexity reviewed — not more complex/generic than the current need requires (no over-engineering)
- [ ] Tests reviewed — meaningful, not just present
- [ ] Naming, comments, and style reviewed last, proportionate to their actual impact

## 3. Cross-Skill Checklist
- [ ] Security items checked for auth/data/input/dependency changes (`security-practices`)
- [ ] Accessibility items checked for new UI (`accessibility`)
- [ ] Performance items checked for lists/images/scripts/bundle-affecting changes (`performance-optimization`)
- [ ] No hardcoded UI/validation strings that bypass i18n

## 4. Contracts & Documentation
- [ ] Breaking changes to shared component APIs explicitly flagged with a migration path
- [ ] Documentation/Storybook stories updated in the same PR if behavior/props changed
- [ ] New dependency checked for both security (per `security-practices`) and license compatibility

## 5. Visual & Risk
- [ ] UI changes include a screenshot/recording
- [ ] High-stakes EdTech paths (live class, timed assessment, grading) received an explicit blast-radius review

## 6. Feedback Quality
- [ ] Comments are specific and fact-based, not personal-preference opinions stated as fact
- [ ] Must-fix issues distinguished from optional suggestions/nits
- [ ] Any disagreement resolved via consensus or escalation, not left unresolved

## 7. Process
- [ ] Review completed within a reasonable turnaround (same/next business day where possible)
- [ ] AI-assisted code reviewed with the same rigor as hand-written code; author can explain every line
- [ ] Approval reflects genuine understanding of the change, not a rubber-stamp skim

## Sign-off
Only merge once all sections are checked.
