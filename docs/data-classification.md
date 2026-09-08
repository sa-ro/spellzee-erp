# Data classification

Which fields are sensitive, and what that changes. Decided 2026-09-09, before the schema exists, so
that logging, error handling and export are built against it rather than retrofitted.

**This is the technical classification, not a legal position.** India's DPDP Act applies and the
baseline lists data privacy, retention and access policy as an **open decision** (§30.18). Nothing
here settles that — it settles what the code does in the meantime, which needs an answer today.

---

## Four tiers

| Tier | Examples | Logs | Error reports | Export |
|---|---|---|---|---|
| **Restricted** | Auth secrets, session tokens, Merithub credentials, payment instrument data | **Never** | **Never** | **Never** |
| **Sensitive** | Student name, DOB, address, parent phone/email, alternate numbers, recordings, payment amounts | ID only | ID only | Approval + audited |
| **Internal** | Session status, attendance, ledger entries, capacity, SLA state, ticket category | ID only | Yes | Role-gated |
| **Public** | Course names, subject list, policy key names | Yes | Yes | Yes |

**Most of this product is Sensitive.** The subjects are children, the buyers are their parents, and
a student record is a full identity plus a behavioural history. Treat Sensitive as the default and
justify anything you place lower.

---

## The rule that does the work

**Log identifiers, never values.**

```
✗  logger.info({ student: { name, phone, email } }, 'student updated')
✓  logger.info({ studentId: 'STU-2026-000184', fields: ['phone'] }, 'student updated')
```

An ID is enough to investigate anything: the person holding the log can look the record up *if they
are authorised to*. A name in a log has escaped every permission check the system has, and it
escaped to a third-party service you do not control.

The same applies to error reports. A stack trace with a request body attached carries the whole
payload to whatever observability vendor is chosen — that is a real export of student data, made by
accident.

---

## The audit trail is the deliberate exception

§22.5 requires overrides record **"old value, new value"**. That means the audit table legitimately
holds Sensitive values — a phone number before and after a correction.

That is correct and must not be "fixed". What follows from it:

- **The audit table is Sensitive**, and reading it is a permissioned action, not an ambient
  developer convenience.
- **Audit rows never reach application logs.** Writing an audit record and logging what you wrote
  are different acts; the second undoes the first's containment.
- **Audit export is approval-gated and itself audited** — exporting the record of who saw what is
  the most sensitive read in the product.

---

## Practical rules

1. **`config/` is the only place secrets are read.** One place to audit what the process needs.
2. **Never log a request body.** Log the route, the actor, the entity ID, the outcome.
3. **Error responses carry a code and a message, never the offending value.** `"phone number is
   invalid"`, not `"9876543210 is invalid"` — validation errors are a common accidental leak.
4. **The outbox payload is Sensitive.** It holds what is about to be sent to Merithub, which
   includes student identity. It lives in the database, not in a log line, and the stall-queue
   screen shows a *summary*, not the raw payload.
5. **Redact at the logger**, not at every call site. A `pino` redaction path list catches the field
   someone forgets; relying on discipline at 200 call sites does not.
6. **Recordings and worksheets go to object storage** with signed, expiring URLs. Never a public
   bucket, never a URL that works forever, never the database.
7. **Support tooling is not an exemption.** A support screen that shows a parent's phone is a
   permissioned read like any other, and it is audited.

---

## What is still open

These are business or legal decisions, not technical ones. They are recorded here so the shape of
the answer is not guessed:

- **Retention** — how long records live. §22.6 says critical records are never silently deleted;
  §3.2 permits deletion "with exceptional authorization". A DPDP erasure obligation lands directly
  on both, and whether the answer is soft-delete, crypto-shredding or a documented exception is a
  **schema** decision. See `docs/open-decisions.md`.
- **Who may export what**, and whether exports are approval-gated per tier.
- **Recording consent and lifetime** — recordings are Sensitive and involve minors.
- **Whether parents may see their own audit trail.**

Until these are answered, the code follows the rules above and nothing is deleted.
