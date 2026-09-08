---
name: edtech-domain
description: Domain-specific concerns for education technology products — student/minor data privacy (COPPA/FERPA/GDPR-K), school/institution multi-tenancy, roles (student/teacher/parent/admin), course/assessment/progress data modeling, content delivery, LMS interoperability (LTI/SCORM/xAPI), and accessibility. Use for any feature touching student data, courses, assessments, grading, school accounts, or content delivery. Apply alongside the generic domain skills (security-engineering, database-engineering, etc.) — this skill adds what's specific to EdTech, not a replacement for them.
---

# EdTech Domain

This product is education technology — the user base includes minors, the
data includes educational records, and the buyers are often institutions
(schools/districts), not just individual end users. This changes defaults
that the generic skills leave open.

## Spellzee reality check (read first — much of the generic framing below does not apply)

Spellzee is **direct-to-parent online tutoring in India**, not a US K-12
institutional product. Concretely:

- **Single tenant.** There is no school/district tenancy, no `org_id`
  scoping, no cross-tenant leak risk. Do not build tenant scaffolding.
  Authorization is by role and by *relationship to the student* (coordinator-
  of, teacher-of, parent-of) — that part of the Roles section below holds.
- **The buyer is the parent**, who purchases a subscription entitlement
  directly. There is no institutional data-owner intermediary, so the FERPA
  "the school is the legal owner" framing does not apply.
- **COPPA/FERPA/GDPR-K are not the governing regimes.** India's DPDP Act is
  the relevant law, and the baseline lists data privacy, retention and access
  policy as an **open decision** (§30) — do not invent a compliance posture
  here; flag it as unresolved when it comes up.
- **No LTI/SCORM/xAPI, no school SSO.** Merithub is the LMS/classroom
  integration and it is the only one — see `spellzee-outbox-merithub`. Staff
  auth is bought (see `/CLAUDE.md`), parents get a separate credential path
  in phase 2.
- **Recordings and worksheets** are real, but delivered through the parent
  portal to the student's own parent — not published content needing CDN
  adaptive-bitrate work in phase 1.

What *does* carry over: student PII and performance data are sensitive by
default; minors' data deserves the stricter bar; **append-only progress and
attempt history** is right, and on this project it is stronger than a
guideline — see `spellzee-entitlement-ledger`. Bandwidth-constrained users
are a genuine consideration in this market.

## Data privacy — the biggest structural difference from a generic SaaS

- **COPPA** (US, children under 13): requires verifiable parental consent
  before collecting personal data from a child; minimize data collected
  from users known/likely to be under 13; no behavioral advertising to
  them.
- **FERPA** (US, educational records held by an institution): access
  control and audit logging on who viewed/modified a student's education
  record; disclosure to third parties needs consent or a defined
  exception; the school, not the vendor, is usually the legal data
  owner — the backend must support the school's obligations, not just
  the vendor's.
- **GDPR-K / GDPR (EU users)**: minors need parental consent below the
  member state's digital consent age (13–16 depending on country); data
  subject rights (access, erasure, portability) apply, and erasure for a
  minor must actually cascade through progress/assessment/analytics data,
  not just the account record.
- **Practical default**: age-gate at signup, route consent flows for
  under-13 (or the applicable threshold) accounts differently, and treat
  "student PII" and "student performance data" as sensitive by default —
  covered by `security-engineering`'s DoD, but the bar here is stricter
  than a typical consumer app.

## Multi-tenancy (school/district/institution)

Most EdTech backends aren't single-tenant-per-user — they're organization
scoped: a school or district is the tenant, with students/teachers/admins
underneath it. Design data access so a query can never leak across
tenants (row-level `org_id`/`school_id` scoping enforced at the query
layer, not just the application layer trusting the caller). Get this
wrong once and it's a cross-school data leak, not a minor bug.

## Roles

Student, teacher/instructor, parent/guardian, school admin, platform
admin — each with different visibility into the same underlying data
(a parent sees their child's records, not the whole class; a teacher sees
their class, not the whole school). Model authorization around
"relationship to the student" (parent-of, teacher-of, admin-of), not just
a flat role string.

## Core data model patterns

Courses → modules/lessons → content items; assessments/quizzes with
attempts and scored responses; progress/completion tracking per student
per lesson; gradebook. Design for append-only progress/attempt history
where it matters for academic integrity (don't let a student's quiz
attempt be silently overwritten).

## Content delivery

Video/media content usually needs a CDN with adaptive bitrate, and
captions/transcripts as first-class stored data (accessibility, not an
afterthought). Consider bandwidth-constrained users (school wifi,
developing markets) — don't assume high-bandwidth always available.

## LMS interoperability

If this integrates with school systems: **LTI** (Learning Tools
Interoperability) for launching from an LMS with identity passed through,
**SCORM/xAPI** for packaged content and progress reporting, and SSO via
the school's identity provider (Google Workspace for Education, Microsoft
Entra, SAML) rather than building a separate credential system schools
have to manage.

## Assessment integrity

Anti-cheating/proctoring data (if any) is especially sensitive — biometric
or behavioral monitoring data on minors carries its own legal exposure;
don't default to collecting it without a clear, minimal, justified scope.

## Accessibility

WCAG compliance has backend implications, not just frontend: captions/
transcripts must be stored and served, alt text must be a required field
for content authoring (not optional), and content APIs shouldn't assume a
single content format works for every learner.

## Reference

See `references/references.md` for a data-model sketch (tenancy, roles,
courses/assessments), a consent-flow outline, and an LTI/SSO integration
checklist.

## Definition of Done

Before calling any student-data-touching or institution-facing work using
this skill complete, run it against `references/dod.md`. Every applicable
item must pass, in addition to `security-engineering`'s DoD.
