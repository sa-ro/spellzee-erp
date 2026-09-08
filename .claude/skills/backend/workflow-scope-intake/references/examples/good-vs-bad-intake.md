# Example: Handling a Raw Pain Point

Founder's ask: *"Teachers are complaining that grading takes forever,
can we do something about that?"*

## Bad — jumps straight to a solution

> Sure — I'll add a bulk-grading endpoint that lets a teacher submit
> scores for a whole class in one request, with CSV import support.
>
> [proceeds to implement]

**What's wrong** (maps to `anti-patterns.md`):

- No clarifying questions (#1) — "grading takes forever" could mean the
  UI is slow, the workflow has too many clicks, there's no bulk action,
  or the export/import step is manual. Each has a different fix.
- CSV import was invented, not requested — an assumption presented as
  the plan (#2).
- No success criteria — how would anyone know if this actually helped?
- No scope boundary — is this for one course type, all of them, one
  school, the whole platform?

## Good — gathers first, flags assumptions, plans, then confirms

> Before I design this — a few questions:
>
> 1. What does "takes forever" look like concretely — grading one
>    assignment takes how long today, and what are the repeated steps?
> 2. How would we know this is fixed — a specific time target, or a
>    support-ticket category dropping?
> 3. Is this for all courses/schools, or a specific one that's raised it?
> 4. Any existing gradebook/LMS this needs to stay compatible with?
>
> [reads the existing codebase for the current grading flow rather than
> asking implementation questions the founder can't answer]
>
> Given what you've told me: assuming ~50 students per class and no CSV
> requirement mentioned, I'd propose a bulk-grade-entry endpoint that lets
> a teacher score a whole class in one screen instead of one-by-one —
> **flagging that "no CSV" is my assumption since you didn't mention an
> import need; let me know if that's wrong.** Plan: [outline]. Confirm
> before I build?

**What's right**: pain point made concrete, success criteria requested,
scope boundary checked, codebase checked directly instead of quizzing the
founder on implementation, assumption stated explicitly rather than
silently acted on, plan confirmed before implementation starts.
