# Example: Environment Variable Validation

## Bad — raw `process.env` access, scattered, unchecked

```ts
// db.ts
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// if DATABASE_URL is unset, this is `undefined` — pg throws a cryptic
// driver-level error, not "DATABASE_URL is missing"

// auth.ts
const secret = process.env.JWT_SECRET; // typed as `string | undefined`
jwt.verify(token, secret!); // `!` lies to TypeScript; crashes at runtime
                             // the first time a token is actually verified
```

Failures surface late, deep in unrelated code, with misleading error
messages — often only in production where the env var was actually
missing.

## Good — one schema, validated once, at startup

```ts
// env.ts
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]),
  JWT_SECRET: z.string().min(32),
});

export const env = envSchema.parse(process.env);
// throws immediately at boot with a clear message if anything is
// missing or malformed — the process never starts in a broken config
```

```ts
// db.ts
import { env } from "./env";
const pool = new Pool({ connectionString: env.DATABASE_URL }); // typed string, guaranteed present

// auth.ts
import { env } from "./env";
jwt.verify(token, env.JWT_SECRET); // no `!`, no possibility of undefined
```

Every module imports the validated `env` object — never `process.env`
directly outside of `env.ts`.
