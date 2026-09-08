# EdTech Domain — Reference

## Data model sketch (tenancy + roles + content)

```
organizations (schools/districts)
  id, name, type (school/district), ...

users
  id, org_id (nullable for individual/consumer signups),
  role (student/teacher/parent/admin/platform_admin),
  date_of_birth or age_bracket,   -- drives consent flow
  consent_status, consent_obtained_at, consent_obtained_by  -- for minors

guardian_links
  guardian_user_id, student_user_id, relationship, verified_at
  -- authorization checks join through this, not a flat role check

courses
  id, org_id, ...
enrollments
  id, course_id, student_id, ...

assessments
  id, course_id, ...
attempts
  id, assessment_id, student_id, started_at, submitted_at,
  score, response_data  -- append-only; never overwrite a submitted attempt

progress
  id, student_id, lesson_id, status, completed_at
  -- append/upsert per (student, lesson), not a single mutable blob losing history
```

Every query against `courses`, `enrollments`, `assessments`, `attempts`,
`progress` must be scoped by `org_id` (directly or via a join) — enforce
this at the data-access layer (a query helper/repository that always
injects the tenant filter) so a missing `WHERE org_id = ?` can't happen by
omission in a handler.

## Consent flow outline (COPPA / GDPR-K style)

1. At signup/enrollment, capture date of birth (or age bracket if DOB is
   deliberately not collected to minimize data).
2. If under the applicable threshold (13 in the US under COPPA; 13–16 in
   the EU depending on member state): block full account activation until
   verifiable parental consent is captured — a distinct
   `consent_status: pending` state, not a silently active account.
3. Consent capture links a guardian account/email to the student record
   (`guardian_links`) — store who consented and when, for audit.
4. Until consent is verified: minimize data collected/retained for that
   student, and disable any optional data collection (analytics,
   marketing, third-party sharing) by default.
5. Erasure request (from guardian or per institutional policy) must
   cascade: account, progress, attempts, any analytics keyed to the
   student — not just delete the `users` row and leave orphaned records
   elsewhere.

## LTI / SSO integration checklist

- [ ] LTI launches validate the signed launch request (don't trust
      unsigned parameters for identity/role).
- [ ] Role claims from the LMS map to this system's role model
      explicitly — don't assume the LMS's role string matches ours
      1:1.
- [ ] SSO (SAML/OAuth via school IdP) is preferred over a
      password-based account for institution-managed users — reduces
      credential-management burden and matches how schools actually
      provision access (deprovisioning on the school's side should
      revoke access here too, ideally via SCIM or a webhook).
- [ ] Grade/progress sync back to the LMS (if required) is idempotent —
      a retried sync must not double-count a score.

## Cross-tenant leak — the failure mode to specifically test for

Write at least one test that, as a user in org A, attempts to read/modify
a resource belonging to org B by ID (not by navigating the UI) — this is
the single most damaging class of bug in a multi-tenant EdTech backend
and is easy to introduce with a single missing `org_id` filter.
