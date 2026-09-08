# `config` — validated environment, once, at startup

Every environment variable is parsed and validated **once at boot** with a zod schema. If anything
is missing or malformed, the process **exits immediately** with a message naming the variable.

## Why fail fast matters more here than usual

The default failure mode is silent. `process.env.APP_TIMEZONE` returns `undefined`, `dayjs.tz()`
falls back to the host zone, and a cancellation cutoff is quietly off by hours — correct on a laptop
in India, wrong in a UTC container, with no error anywhere.

That is the same class of failure the whole project is built to avoid. A boot-time crash naming the
variable is strictly better than a subtly wrong entitlement decision.

## Rules

- **Nothing outside this directory reads `process.env`.** Import the validated config object.
  A `process.env.X` elsewhere is an unvalidated read that bypasses the schema.
- **Parse, don't validate** — the schema produces typed values (numbers as numbers, the timezone as
  a checked IANA name), not strings someone coerces at the call site.
- **No defaults for anything that must be deliberate.** A default database URL or timezone hides a
  misconfiguration instead of surfacing it. `PORT` may default; `APP_TIMEZONE` and `DATABASE_URL`
  may not.
- **Secrets are read here and nowhere else**, so there is one place to audit what the process needs.

`.env.example` is the contract. A new variable is added there in the same change that adds it to the
schema, or the next person's boot fails with no explanation of what to set.

**`APP_TIMEZONE` is currently a flagged placeholder** — the baseline implies India throughout but
never declares a timezone policy (`docs/open-decisions.md` item F).
