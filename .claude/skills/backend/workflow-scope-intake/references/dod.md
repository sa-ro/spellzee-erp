# Definition of Done — Scope Intake

Work is not done until every applicable item below is true.

- [ ] Clarifying questions were asked before any plan was proposed, OR an
      explicit, stated reason exists for why the ask was already
      well-specified enough to skip that step.
- [ ] Every assumption substituted for an unanswered question appears
      explicitly in the response to the requester — not silently baked
      into the implementation.
- [ ] A plan was stated back and confirmed before implementation began,
      for any change that would be costly to redo.
- [ ] Implementation stayed within the plan's stated scope, or any
      deviation was flagged, not silent.
- [ ] Tests from Step 4 were actually executed, with the run's outcome
      stated — not just written and assumed passing.
- [ ] `workflow-pre-merge-review` was run, and its DoD-gate output (per
      skill, with evidence) is present before the change is reported done.
- [ ] The final report to the requester covers all five required parts:
      what was built, decisions + why, what was/wasn't tested, known
      risks, and next steps needed from them.
- [ ] Nothing was reported as "done" while a relevant DoD item from any
      touched skill was still unverified.
