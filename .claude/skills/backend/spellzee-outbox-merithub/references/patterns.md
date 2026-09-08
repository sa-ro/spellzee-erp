# Outbox / inbox — concrete shapes

## Outbox table

```sql
CREATE TABLE outbox (
  id             BIGSERIAL PRIMARY KEY,
  aggregate_type TEXT        NOT NULL,   -- 'class_schedule', 'session'
  aggregate_id   UUID        NOT NULL,
  event_type     TEXT        NOT NULL,   -- 'merithub.class.create'
  payload        JSONB       NOT NULL,
  status         TEXT        NOT NULL DEFAULT 'pending',
  attempts       INT         NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_error     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at   TIMESTAMPTZ,
  CONSTRAINT outbox_status_valid
    CHECK (status IN ('pending','in_progress','done','stalled'))
);

-- the alert surface: pending rows older than a threshold
CREATE INDEX outbox_pending_age
  ON outbox (next_attempt_at)
  WHERE status IN ('pending','in_progress');
```

`payload` is `jsonb` legitimately — it is an integration snapshot, exactly
the open-ended case `jsonb` is for.

## Writing to it — one transaction, always

```ts
await prisma.$transaction(async (tx) => {
  await assertAuthorized(actor, 'allocation.create');

  const schedule = await tx.classSchedule.create({
    data: { ...input, provisioningState: 'pending' },
  });

  await tx.auditLog.create({
    data: { actorId: actor.id, action: 'allocation.create',
            entityId: schedule.id, before: null, after: schedule },
  });

  await tx.outbox.create({
    data: {
      aggregateType: 'class_schedule',
      aggregateId: schedule.id,
      eventType: 'merithub.class.create',
      payload: toMerithubClassPayload(schedule),
    },
  });
});

// only AFTER commit — a lost enqueue is recoverable, a lost row is not
await outboxQueue.add('drain', {});
```

If the enqueue fails, nothing is lost: the sweeper below picks the row up.

## Worker loop

```ts
const rows = await prisma.$queryRaw`
  SELECT * FROM outbox
   WHERE status = 'pending' AND next_attempt_at <= now()
   ORDER BY id
   FOR UPDATE SKIP LOCKED
   LIMIT 20`;
```

`FOR UPDATE SKIP LOCKED` is what makes multiple workers safe — each claims a
disjoint batch instead of colliding.

For each row: mark `in_progress`, call upstream, then either mark `done` or
compute the backoff and increment `attempts`. Past the attempt cap, set
`stalled` — never retry forever.

```ts
const backoffMs = Math.min(2 ** attempts * 1000, 60 * 60 * 1000);
const jittered  = backoffMs * (0.5 + Math.random() * 0.5);
```

Because Merithub has no idempotency keys, a retry must first ask **does this
object already exist upstream?** (by our stored external id, or by a lookup
on our own reference) before creating it again.

## A periodic sweeper is mandatory

The queue is a trigger, not the record. A cron/repeatable job must scan for
`pending` rows whose `next_attempt_at` has passed and re-enqueue them —
this is what recovers from a Redis flush, a lost job, or a worker crash
between claim and completion.

## Inbox table

```sql
CREATE TABLE inbox (
  id            BIGSERIAL PRIMARY KEY,
  provider      TEXT        NOT NULL,      -- 'merithub'
  dedupe_key    TEXT        NOT NULL,
  event_type    TEXT        NOT NULL,
  payload       JSONB       NOT NULL,
  received_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at  TIMESTAMPTZ,
  CONSTRAINT inbox_dedupe UNIQUE (provider, dedupe_key)
);
```

`dedupe_key`: the provider's event id when one exists; otherwise a
deterministic hash of `event_type + external_id + occurred_at`. The unique
constraint makes a duplicate delivery a cheap no-op insert conflict rather
than a double-processed event.

Webhook handler: **insert into the inbox and return 200 immediately.**
Process asynchronously. A slow handler causes upstream retries and
duplicate deliveries — the opposite of what you want from a provider with
no delivery guarantees.

```ts
await prisma.inbox.createMany({ data: [row], skipDuplicates: true });
return res.status(200).send();
```

## Provisioning state machine

```
pending ──▶ provisioning ──▶ provisioned
   ▲             │
   └── retry ────┴──▶ stalled  (attempt cap reached; needs a human)
```

`stalled` needs a screen listing: what failed, since when, the last error,
and a retry action. Also alert on `provisioning` rows that have been stuck
longer than a threshold — that indicates a worker died mid-flight, which no
error count will reveal.

## Reconciliation poll

Low frequency (hourly is a reasonable start). Fetch upstream state for a
recent window, compare against ours, and record any divergence. Its purpose
is **detecting silently dropped webhooks**, not freshness.

When it finds a divergence: log it, surface it, and correct our record only
where our record is genuinely derived from theirs (attendance, recording
availability). Never let it overwrite a Spellzee-owned field.
