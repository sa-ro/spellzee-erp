# Definition of Done — EdTech Domain

Work is not done until every applicable item below is true.

- [ ] Any query touching org-scoped data (courses, enrollments,
      assessments, attempts, progress) is filtered by `org_id`/tenant at
      the data-access layer, not left to the caller to remember.
- [ ] A cross-tenant access attempt (org A user requesting org B's
      resource by ID) was tested and correctly rejected.
- [ ] If the feature touches accounts that may belong to a minor: an age/
      consent check gates full activation, and the consent state is
      recorded with who/when.
- [ ] Erasure/deletion of a student's data cascades through all related
      tables (progress, attempts, analytics) — not just the account row.
- [ ] Authorization for parent/guardian access is checked through the
      `guardian_links` relationship, not a flat role check that would let
      any "parent" see any student.
- [ ] Submitted assessment attempts are append-only / immutable once
      submitted — no path silently overwrites a scored attempt.
- [ ] Any video/media content includes (or has a stated plan for)
      captions/transcripts, not left as a later accessibility retrofit.
- [ ] If this integrates with an LMS: LTI launch signatures are
      validated, and any grade/progress sync back to the LMS is
      idempotent.
- [ ] No proctoring/behavioral/biometric data is collected without an
      explicit, minimal, stated justification.
