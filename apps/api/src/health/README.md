# `health` — liveness, readiness, and the checks that matter here

Two standard endpoints, plus one that is specific to this architecture.

## The standard two

- **Liveness** — is the process up? No dependency checks. A failing liveness probe means *restart
  me*, so it must not fail because Postgres is briefly unreachable.
- **Readiness** — can this instance serve traffic? Checks the database connection and Redis. A
  failing readiness probe means *stop routing to me*, not *restart me*.

Conflating the two turns a transient database blip into a restart loop.

## The one that is specific to this project

**Outbox age.** `/CLAUDE.md` names silent outbox death as the most common way this pattern fails:
a worker that stops draining raises no errors, and absence of errors looks exactly like health.

So the check is not "is the worker process alive" — it is **"what is the age of the oldest pending
outbox row?"** Past a threshold, that is a real alert regardless of what any process reports about
itself.

The same applies to rows stuck in `provisioning`: a worker that died mid-flight leaves them there,
and nothing else notices.

## Not a substitute for the stall queue

`stalled` rows are a **product surface** with a screen, an owner and a retry action — not a
monitoring concern. Health checks tell operators the machinery is running; the stall queue tells a
coordinator that a specific student's class was never created.
