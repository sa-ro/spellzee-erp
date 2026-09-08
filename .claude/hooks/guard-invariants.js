#!/usr/bin/env node
/**
 * Spellzee architecture guard (PreToolUse).
 *
 * Enforces, mechanically, the rules that /CLAUDE.md and /tradeoff-library.md
 * state — because a rule that lives only in a skill file is followed only if
 * the skill was read. This hook does not read anything.
 *
 * Reads the PreToolUse payload on stdin, emits a permissionDecision.
 *
 *   deny  — prisma migrate dev/deploy without --create-only on a schema change
 *   ask   — a stored balance column, a dropped constraint, a ledger UPDATE/DELETE
 *   allow — (silent) everything else
 *
 * Fails open: any internal error exits 0 with no output, so a broken guard
 * never blocks legitimate work.
 */

let raw = "";
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  try {
    main(JSON.parse(raw || "{}"));
  } catch {
    process.exit(0); // fail open
  }
});

function deny(reason) {
  out("deny", reason);
}
function ask(reason) {
  out("ask", reason);
}
function out(permissionDecision, permissionDecisionReason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision,
        permissionDecisionReason,
      },
    })
  );
  process.exit(0);
}

function main(input) {
  const tool = input.tool_name || "";
  const ti = input.tool_input || {};

  if (tool === "Bash" || tool === "PowerShell") return checkCommand(ti.command || "");
  if (tool === "Write" || tool === "Edit") {
    const path = ti.file_path || "";
    const body = [ti.content, ti.new_string].filter(Boolean).join("\n");
    return checkFile(path, body);
  }
  process.exit(0);
}

/* ---------------------------------------------------------------- commands */

function checkCommand(cmd) {
  if (!cmd) process.exit(0);

  // `prisma migrate dev` generates AND applies in one step, so the constraint
  // never gets hand-written. --create-only is what makes the SQL editable.
  const isMigrateDev = /prisma\s+migrate\s+dev\b/.test(cmd);
  if (isMigrateDev && !/--create-only\b/.test(cmd)) {
    // Applying an already-written migration is the legitimate second step.
    const applyingExisting = /--skip-generate\b/.test(cmd) && !/--name\b/.test(cmd);
    if (!applyingExisting) {
      deny(
        "Spellzee invariant rule: `prisma migrate dev` must use `--create-only` so the " +
          "migration SQL can be hand-written before it runs.\n\n" +
          "Prisma's schema language cannot express exclusion constraints, partial unique " +
          "indexes or triggers — the mechanisms this project's invariants depend on. " +
          "Generating and applying in one step is how a cross-row rule silently ends up in " +
          "service code instead of the database.\n\n" +
          "Use:  npx prisma migrate dev --create-only --name <name>\n" +
          "then edit the generated SQL, then apply.\n\n" +
          "See .claude/skills/backend/spellzee-invariants."
      );
    }
  }

  if (/prisma\s+migrate\s+reset\b/.test(cmd)) {
    ask(
      "`prisma migrate reset` drops the database and every hand-written constraint with it. " +
        "Confirm this is a local development database, not shared or production."
    );
  }

  if (/prisma\s+db\s+push\b/.test(cmd)) {
    ask(
      "`prisma db push` applies the schema with no migration file — the hand-written " +
        "invariant SQL would be skipped entirely, and there is no reviewable diff. " +
        "Use `prisma migrate dev --create-only` instead unless this is a throwaway database."
    );
  }
  process.exit(0);
}

/* ------------------------------------------------------------------- files */

function checkFile(path, body) {
  if (!body) process.exit(0);
  const p = path.replace(/\\/g, "/").toLowerCase();
  const isSql = /\.sql$/.test(p);
  const isMigration = /\/(migrations?)\//.test(p) || isSql;
  const isPrismaSchema = /schema\.prisma$/.test(p);
  const isSkillOrDoc = /\/(\.claude|docs)\//.test(p) || /\.md$/.test(p);
  const isTest = /\.(spec|test|e2e-spec)\.[tj]s$/.test(p) || /\/(tests?|__tests__|fixtures?|mocks?)\//.test(p);

  // Documentation and the skills themselves quote these patterns deliberately.
  if (isSkillOrDoc) process.exit(0);

  // 4. Merithub DELETE — decision 7. Their delete is irreversible and destroys
  //    attendance records and recordings. A test asserting we never call it is
  //    legitimate, so tests are exempt.
  if (!isTest) {
    const upstreamDelete =
      /\bmerithub[A-Za-z]*\s*\.\s*(delete|destroy|remove)\b|\bdelete\s*\(\s*['"`][^'"`]*merithub/i.exec(
        body
      );
    if (upstreamDelete) {
      deny(
        "Spellzee integration rule: never call Merithub DELETE.\n\n" +
          "Their delete is irreversible and destroys attendance records and recordings. Local " +
          "cancellation does not mirror upstream as a delete — orphaned upstream objects " +
          "accumulating is the accepted cost.\n\n" +
          "This is decision 7 in /tradeoff-library.md; its reversal trigger is the provider " +
          "adding a soft-delete or archive operation. If that has actually happened, say so " +
          "explicitly and record it — do not reverse it silently.\n\n" +
          "See .claude/skills/backend/spellzee-outbox-merithub."
      );
    }

    // 5. A third-party call on the request path — decision 4 / sync-vs-async.
    //    Workers, adapters and jobs are where these calls belong, so exempt them.
    const isWorkerPath = /(worker|processor|consumer|\.job\.|adapters?\/|infrastructure\/|clients?\/)/.test(p);
    const isRequestPath = /(controller|resolver|\.service\.|handler|route)/.test(p);
    if (!isWorkerPath && isRequestPath) {
      const directCall = /\bawait\s+[^;\n]*\b(merithub|freejump|whatsapp)[A-Za-z]*\s*\./i.exec(body);
      if (directCall) {
        ask(
          "This awaits a third-party call on the request path.\n\n" +
            "Your availability is the product of everything in your critical path — a third " +
            "party in the request path donates its outage to you. The write path is: write the " +
            "domain change, the audit record and an outbox row in one transaction; a worker " +
            "drains it afterwards.\n\n" +
            "If this file is genuinely a worker or adapter, the check misread the path — approve " +
            "and carry on.\n\n" +
            "See .claude/skills/backend/spellzee-outbox-merithub."
        );
      }
    }
  }

  // 1. A stored balance column — decision 3, whose reversal trigger is "never".
  if (isPrismaSchema || isMigration) {
    const balance =
      /\b(sessions_remaining|sessionsRemaining|credits_left|creditsLeft|remaining_sessions|remainingSessions|session_balance|sessionBalance)\b/i.exec(
        body
      );
    if (balance) {
      ask(
        `Spellzee ledger rule: this adds \`${balance[0]}\` — a stored balance column.\n\n` +
          "Entitlement is an append-only ledger; every count (purchased, consumed, protected, " +
          "compensated, remaining) is derived from ledger rows. A stored balance buys a cheaper " +
          "read in exchange for lost updates under concurrency, silent drift, and no way to " +
          "answer *why* a student has 7 sessions left rather than 8.\n\n" +
          "This is decision 3 in /tradeoff-library.md — the one whose stated reversal trigger is " +
          '"never, realistically."\n\n' +
          "See .claude/skills/backend/spellzee-entitlement-ledger."
      );
    }
  }

  // 2. Dropping or weakening a constraint — decision 2.
  if (isMigration) {
    const drop = /\bDROP\s+(CONSTRAINT|INDEX|TRIGGER)\b/i.exec(body);
    if (drop) {
      ask(
        `This migration contains \`${drop[0].replace(/\s+/g, " ")}\`.\n\n` +
          "On this project invariants live in the database, so dropping a constraint is an " +
          "architecture change, not a cleanup. If it is being removed to make a test or a seed " +
          "pass, that is decision 2 in /tradeoff-library.md being reversed silently.\n\n" +
          "Legitimate cases exist — narrowing a constraint to the real rule, or replacing it with " +
          "a stricter one in the same migration. Confirm which this is."
      );
    }

    // 3. Mutating the ledger — corrections are new rows, never edits.
    const ledgerMutation =
      /\b(UPDATE|DELETE\s+FROM)\s+["`']?(session_ledger|ledger_entries|entitlement_ledger)\b/i.exec(
        body
      );
    if (ledgerMutation) {
      ask(
        "This modifies ledger rows directly.\n\n" +
          "The session ledger is append-only: a correction is a new compensating row with a " +
          "`reason`, an `actor_id` and `reverses_id` — never an UPDATE or DELETE. Editing history " +
          "in place is exactly what the ledger exists to prevent.\n\n" +
          "See .claude/skills/backend/spellzee-entitlement-ledger."
      );
    }
  }
  process.exit(0);
}
