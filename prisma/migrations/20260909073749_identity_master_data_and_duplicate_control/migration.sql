-- CreateTable
CREATE TABLE "staff_users" (
    "id" UUID NOT NULL,
    "staff_code" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "reason" TEXT,
    "request_id" TEXT,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_requests" (
    "id" UUID NOT NULL,
    "action_type" TEXT NOT NULL,
    "subject_type" TEXT NOT NULL,
    "subject_id" UUID NOT NULL,
    "target_id" UUID,
    "payload" JSONB,
    "reason" TEXT NOT NULL,
    "requested_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_decisions" (
    "id" UUID NOT NULL,
    "approval_request_id" UUID NOT NULL,
    "decision" TEXT NOT NULL,
    "decided_by" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_versions" (
    "id" UUID NOT NULL,
    "policy_key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "effective_from" TIMESTAMPTZ(6) NOT NULL,
    "effective_to" TIMESTAMPTZ(6),
    "created_by" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "policy_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity_sequences" (
    "prefix" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "next_value" BIGINT NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "identity_sequences_pkey" PRIMARY KEY ("prefix","year")
);

-- CreateTable
CREATE TABLE "persons" (
    "id" UUID NOT NULL,
    "spellzee_id" TEXT NOT NULL DEFAULT '',
    "person_type" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retired_at" TIMESTAMPTZ(6),
    "merged_into_person_id" UUID,
    "merged_by" UUID,
    "merge_reason" TEXT,
    "merge_approval_request_id" UUID,

    CONSTRAINT "persons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "person_id" UUID NOT NULL,
    "person_type" TEXT NOT NULL DEFAULT 'student',
    "date_of_birth" DATE,
    "gender" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "students_pkey" PRIMARY KEY ("person_id")
);

-- CreateTable
CREATE TABLE "parents" (
    "person_id" UUID NOT NULL,
    "person_type" TEXT NOT NULL DEFAULT 'parent',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parents_pkey" PRIMARY KEY ("person_id")
);

-- CreateTable
CREATE TABLE "student_guardians" (
    "id" UUID NOT NULL,
    "student_person_id" UUID NOT NULL,
    "parent_person_id" UUID NOT NULL,
    "relationship" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ(6),
    "recorded_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_guardians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_points" (
    "id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "contact_type" TEXT NOT NULL,
    "raw_value" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "valid_from" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_to" TIMESTAMPTZ(6),
    "source" TEXT,
    "recorded_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_points_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_users_staff_code_key" ON "staff_users"("staff_code");

-- CreateIndex
CREATE UNIQUE INDEX "staff_users_email_key" ON "staff_users"("email");

-- CreateIndex
CREATE INDEX "audit_log_entity_idx" ON "audit_log"("entity_type", "entity_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "approval_requests_subject_idx" ON "approval_requests"("action_type", "subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "approval_decisions_approval_request_id_key" ON "approval_decisions"("approval_request_id");

-- CreateIndex
CREATE INDEX "policy_versions_key_idx" ON "policy_versions"("policy_key", "effective_from");

-- CreateIndex
CREATE UNIQUE INDEX "persons_spellzee_id_key" ON "persons"("spellzee_id");

-- CreateIndex
CREATE UNIQUE INDEX "persons_merge_approval_request_id_key" ON "persons"("merge_approval_request_id");

-- CreateIndex
CREATE INDEX "persons_merged_into_idx" ON "persons"("merged_into_person_id");

-- CreateIndex
CREATE UNIQUE INDEX "persons_id_type_key" ON "persons"("id", "person_type");

-- CreateIndex
CREATE UNIQUE INDEX "students_person_id_type_key" ON "students"("person_id", "person_type");

-- CreateIndex
CREATE UNIQUE INDEX "parents_person_id_type_key" ON "parents"("person_id", "person_type");

-- CreateIndex
CREATE INDEX "student_guardians_parent_idx" ON "student_guardians"("parent_person_id");

-- CreateIndex
CREATE INDEX "contact_points_person_idx" ON "contact_points"("person_id");

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_decisions" ADD CONSTRAINT "approval_decisions_approval_request_id_fkey" FOREIGN KEY ("approval_request_id") REFERENCES "approval_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_decisions" ADD CONSTRAINT "approval_decisions_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_versions" ADD CONSTRAINT "policy_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persons" ADD CONSTRAINT "persons_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persons" ADD CONSTRAINT "persons_merged_by_fkey" FOREIGN KEY ("merged_by") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persons" ADD CONSTRAINT "persons_merged_into_person_id_fkey" FOREIGN KEY ("merged_into_person_id") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persons" ADD CONSTRAINT "persons_merge_approval_request_id_fkey" FOREIGN KEY ("merge_approval_request_id") REFERENCES "approval_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_person_id_person_type_fkey" FOREIGN KEY ("person_id", "person_type") REFERENCES "persons"("id", "person_type") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parents" ADD CONSTRAINT "parents_person_id_person_type_fkey" FOREIGN KEY ("person_id", "person_type") REFERENCES "persons"("id", "person_type") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_student_person_id_fkey" FOREIGN KEY ("student_person_id") REFERENCES "students"("person_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_parent_person_id_fkey" FOREIGN KEY ("parent_person_id") REFERENCES "parents"("person_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_points" ADD CONSTRAINT "contact_points_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_points" ADD CONSTRAINT "contact_points_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ===========================================================================
-- HAND-WRITTEN INVARIANTS  (everything above this line was generated by
-- `prisma migrate dev --create-only`; everything below was written by hand)
--
-- Prisma's schema language cannot express any of the following, which is
-- exactly why the file is edited rather than applied straight through:
--   CHECK constraints, partial unique indexes, expression indexes,
--   EXCLUDE USING gist, and triggers.
--
-- Registry of every constraint added here:
--   .claude/skills/backend/spellzee-invariants/references/patterns.md
-- ===========================================================================

CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------------------------------------------------------------------------
-- 0. Normalization functions
--
-- These are the DB layer of duplicate detection. They are deliberately
-- CONSERVATIVE and EXACT: they collapse only representational noise
-- (punctuation, case, country-code prefixes). Fuzzy scoring -- nicknames,
-- transliteration variants, weighted multi-field confidence -- is a SERVICE
-- concern, un-enforceable by a constraint and correctly left there.
--
-- They are IMMUTABLE because indexes are built on them. CHANGING THE BODY OF
-- ANY normalize_* FUNCTION SILENTLY CORRUPTS EVERY INDEX BUILT ON IT -- such a
-- change must REINDEX the dependent indexes in the same migration.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION normalize_person_name(p_value TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE AS $fn$
  -- Unicode-aware on purpose: [:alnum:] keeps Tamil/Devanagari letters, which
  -- a naive [^a-z0-9] would erase entirely for a name written in script.
  SELECT btrim(regexp_replace(lower(p_value), '[^[:alnum:]]+', ' ', 'g'));
$fn$;

CREATE OR REPLACE FUNCTION normalize_phone(p_value TEXT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE STRICT PARALLEL SAFE AS $fn$
DECLARE d TEXT;
BEGIN
  d := regexp_replace(p_value, '[^0-9]', '', 'g');
  -- JUDGMENT CALL, India-shaped: +91 98765 43210, 09876543210 and 9876543210
  -- are one number and must collide. Only these exact shapes are stripped;
  -- anything else is left alone rather than mangled.
  -- Reversal trigger: the first genuinely non-Indian parent phone number.
  IF    length(d) = 12 AND left(d, 2) = '91'  THEN d := right(d, 10);
  ELSIF length(d) = 13 AND left(d, 3) = '091' THEN d := right(d, 10);
  ELSIF length(d) = 11 AND left(d, 1) = '0'   THEN d := right(d, 10);
  END IF;
  RETURN d;
END;
$fn$;

CREATE OR REPLACE FUNCTION normalize_email(p_value TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE AS $fn$
  -- Case and surrounding whitespace only. Gmail dot/plus-tag folding is
  -- provider-specific guessing and belongs in the service scorer, not in a
  -- key that decides whether a child gets a second identity.
  SELECT lower(btrim(p_value));
$fn$;

CREATE OR REPLACE FUNCTION normalize_contact_value(p_type TEXT, p_value TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE AS $fn$
  SELECT CASE p_type
           WHEN 'phone' THEN public.normalize_phone(p_value)
           WHEN 'email' THEN public.normalize_email(p_value)
         END;
$fn$;

-- ---------------------------------------------------------------------------
-- 1. staff_users -- the actor anchor
-- ---------------------------------------------------------------------------

ALTER TABLE "staff_users"
  ADD CONSTRAINT "staff_users_role_known" CHECK (
    "role" IN ('staff_coordinator', 'team_lead_manager', 'finance', 'restricted_admin')),
  ADD CONSTRAINT "staff_users_full_name_present" CHECK (btrim("full_name") <> ''),
  ADD CONSTRAINT "staff_users_email_normalized" CHECK (
    "email" = public.normalize_email("email")
    AND "email" ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]{2,}$');

-- ---------------------------------------------------------------------------
-- 2. Append-only tables
--
-- RULE: an audit trail that can be edited proves nothing, because the edit
-- leaves no trace of itself. UPDATE and DELETE are refused by the database,
-- not by convention. FOR EACH STATEMENT so that even a zero-row UPDATE -- the
-- intent -- is refused.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION assert_append_only() RETURNS TRIGGER
LANGUAGE plpgsql AS $fn$
BEGIN
  RAISE EXCEPTION
    'append_only_violation: %.% is append-only; record a correction as a new row, never an edit',
    TG_TABLE_SCHEMA, TG_TABLE_NAME
    USING ERRCODE = 'restrict_violation';
END;
$fn$;

CREATE TRIGGER "audit_log_append_only"
  BEFORE UPDATE OR DELETE ON "audit_log"
  FOR EACH STATEMENT EXECUTE FUNCTION assert_append_only();

CREATE TRIGGER "approval_requests_append_only"
  BEFORE UPDATE OR DELETE ON "approval_requests"
  FOR EACH STATEMENT EXECUTE FUNCTION assert_append_only();

CREATE TRIGGER "approval_decisions_append_only"
  BEFORE UPDATE OR DELETE ON "approval_decisions"
  FOR EACH STATEMENT EXECUTE FUNCTION assert_append_only();

ALTER TABLE "audit_log"
  ADD CONSTRAINT "audit_log_action_present" CHECK (btrim("action") <> ''),
  ADD CONSTRAINT "audit_log_entity_type_present" CHECK (btrim("entity_type") <> '');

-- ---------------------------------------------------------------------------
-- 3. Maker-checker
--
-- A request is immutable; the decision is a separate immutable row; status is
-- derived from their existence. That is what makes "append-only approvals"
-- and "a request goes from pending to approved" both true at once.
-- ---------------------------------------------------------------------------

ALTER TABLE "approval_requests"
  ADD CONSTRAINT "approval_requests_action_type_known" CHECK ("action_type" IN ('person_merge')),
  ADD CONSTRAINT "approval_requests_subject_type_known" CHECK ("subject_type" IN ('person')),
  ADD CONSTRAINT "approval_requests_reason_present" CHECK (btrim("reason") <> ''),
  ADD CONSTRAINT "approval_requests_target_is_not_subject" CHECK (
    "target_id" IS NULL OR "target_id" <> "subject_id"),
  ADD CONSTRAINT "person_merge_request_needs_target" CHECK (
    "action_type" <> 'person_merge' OR "target_id" IS NOT NULL);

ALTER TABLE "approval_decisions"
  ADD CONSTRAINT "approval_decisions_decision_known" CHECK ("decision" IN ('approved', 'rejected')),
  ADD CONSTRAINT "approval_decisions_reason_present" CHECK (btrim("reason") <> '');

-- approval_decisions.approval_request_id is already UNIQUE (Prisma), which IS
-- the "approval is single-level" invariant: one decision per request is final.

CREATE OR REPLACE FUNCTION assert_approver_is_not_requester() RETURNS TRIGGER
LANGUAGE plpgsql AS $fn$
DECLARE v_requested_by UUID;
BEGIN
  SELECT "requested_by" INTO v_requested_by
    FROM "approval_requests" WHERE "id" = NEW."approval_request_id";
  IF v_requested_by = NEW."decided_by" THEN
    RAISE EXCEPTION
      'maker_checker_violation: staff member % may not approve their own request %',
      NEW."decided_by", NEW."approval_request_id"
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$fn$;

CREATE TRIGGER "approval_decisions_maker_checker"
  BEFORE INSERT ON "approval_decisions"
  FOR EACH ROW EXECUTE FUNCTION assert_approver_is_not_requester();

-- ---------------------------------------------------------------------------
-- 4. policy_versions
-- ---------------------------------------------------------------------------

ALTER TABLE "policy_versions"
  ADD CONSTRAINT "policy_versions_period_valid" CHECK (
    "effective_to" IS NULL OR "effective_to" > "effective_from"),
  ADD CONSTRAINT "policy_versions_key_present" CHECK (btrim("policy_key") <> ''),
  ADD CONSTRAINT "policy_versions_reason_present" CHECK (btrim("reason") <> ''),
  ADD CONSTRAINT "policy_no_overlap" EXCLUDE USING gist (
    "policy_key" WITH =,
    tstzrange("effective_from", "effective_to", '[)') WITH &&);

-- The one permitted UPDATE: closing an open version. Everything else, and every
-- DELETE, is refused -- so "append-only" and "supersede by closing the current
-- row" are reconciled explicitly rather than left as a contradiction.
CREATE OR REPLACE FUNCTION assert_policy_supersede_only() RETURNS TRIGGER
LANGUAGE plpgsql AS $fn$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION
      'policy_versions_append_only: a policy version is never deleted; supersede it with a new row'
      USING ERRCODE = 'restrict_violation';
  END IF;
  IF OLD."effective_to" IS NOT NULL OR NEW."effective_to" IS NULL THEN
    RAISE EXCEPTION
      'policy_versions_supersede_only: the only permitted update is closing an open version by setting effective_to'
      USING ERRCODE = 'restrict_violation';
  END IF;
  IF NEW."id" <> OLD."id"
     OR NEW."policy_key" <> OLD."policy_key"
     OR NEW."value"::text <> OLD."value"::text
     OR NEW."effective_from" <> OLD."effective_from"
     OR NEW."created_by" <> OLD."created_by"
     OR NEW."reason" <> OLD."reason"
     OR NEW."created_at" <> OLD."created_at" THEN
    RAISE EXCEPTION
      'policy_versions_supersede_only: only effective_to may change on an existing policy version'
      USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN NEW;
END;
$fn$;

CREATE TRIGGER "policy_versions_supersede_only"
  BEFORE UPDATE OR DELETE ON "policy_versions"
  FOR EACH ROW EXECUTE FUNCTION assert_policy_supersede_only();

-- ---------------------------------------------------------------------------
-- 5. The permanent Spellzee ID
--
-- Baseline 6.1: "A student receives a permanent Spellzee Student ID ... The ID
-- never changes." That is two invariants, not one:
--   (a) the database assigns it -- application code cannot mint one;
--   (b) once assigned it is immutable.
-- ---------------------------------------------------------------------------

ALTER TABLE "identity_sequences"
  ADD CONSTRAINT "identity_sequences_prefix_known" CHECK ("prefix" IN ('STU', 'PAR')),
  ADD CONSTRAINT "identity_sequences_year_sane" CHECK ("year" BETWEEN 2000 AND 2999),
  ADD CONSTRAINT "identity_sequences_next_value_positive" CHECK ("next_value" >= 1);

-- Gapless counter, not a Postgres SEQUENCE: a sequence leaks numbers on
-- rollback, and STU-2026-000184 is read aloud to parents. The cost is that
-- concurrent creations of the same prefix+year serialize on this row -- at
-- thousands of students a year, that is free.
CREATE OR REPLACE FUNCTION next_spellzee_id(p_prefix TEXT)
RETURNS TEXT LANGUAGE plpgsql AS $fn$
DECLARE
  v_year INT;
  v_seq  BIGINT;
BEGIN
  -- PLACEHOLDER TIMEZONE -- mirrors APP_TIMEZONE in .env, which is itself a
  -- flagged placeholder (docs/open-decisions.md item F: the baseline implies
  -- India but never declares a civil zone). This decides only which year
  -- appears in an ID minted just after midnight.
  v_year := EXTRACT(YEAR FROM (now() AT TIME ZONE 'Asia/Kolkata'))::INT;

  INSERT INTO "identity_sequences" ("prefix", "year", "next_value", "updated_at")
  VALUES (p_prefix, v_year, 2, now())
  ON CONFLICT ("prefix", "year")
  DO UPDATE SET "next_value" = "identity_sequences"."next_value" + 1, "updated_at" = now()
  RETURNING "next_value" - 1 INTO v_seq;

  IF v_seq > 999999 THEN
    RAISE EXCEPTION
      'spellzee_id_sequence_exhausted: % % passed 999999; widen the format before minting more',
      p_prefix, v_year
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN format('%s-%s-%s', p_prefix, v_year::TEXT, lpad(v_seq::TEXT, 6, '0'));
END;
$fn$;

CREATE OR REPLACE FUNCTION assign_spellzee_id() RETURNS TRIGGER
LANGUAGE plpgsql AS $fn$
DECLARE v_prefix TEXT;
BEGIN
  IF NEW."spellzee_id" IS NOT NULL AND NEW."spellzee_id" <> '' THEN
    RAISE EXCEPTION
      'spellzee_id_not_assignable: the database assigns Spellzee IDs; application code must not supply one (got %)',
      NEW."spellzee_id"
      USING ERRCODE = 'check_violation';
  END IF;
  v_prefix := CASE NEW."person_type" WHEN 'student' THEN 'STU' WHEN 'parent' THEN 'PAR' END;
  IF v_prefix IS NULL THEN
    RAISE EXCEPTION 'unknown_person_type: %', NEW."person_type" USING ERRCODE = 'check_violation';
  END IF;
  NEW."spellzee_id" := public.next_spellzee_id(v_prefix);
  RETURN NEW;
END;
$fn$;

CREATE TRIGGER "persons_assign_spellzee_id"
  BEFORE INSERT ON "persons"
  FOR EACH ROW EXECUTE FUNCTION assign_spellzee_id();

CREATE OR REPLACE FUNCTION assert_person_identity_immutable() RETURNS TRIGGER
LANGUAGE plpgsql AS $fn$
BEGIN
  IF NEW."id" <> OLD."id" THEN
    RAISE EXCEPTION 'person_identity_immutable: a person primary key never changes'
      USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."spellzee_id" <> OLD."spellzee_id" THEN
    RAISE EXCEPTION
      'person_identity_immutable: Spellzee ID % never changes (baseline 6.1); it was not reassigned to %',
      OLD."spellzee_id", NEW."spellzee_id"
      USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."person_type" <> OLD."person_type" THEN
    RAISE EXCEPTION 'person_identity_immutable: a % does not become a %',
      OLD."person_type", NEW."person_type"
      USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."created_at" <> OLD."created_at" THEN
    RAISE EXCEPTION 'person_identity_immutable: created_at is part of the identity record and never changes'
      USING ERRCODE = 'check_violation';
  END IF;
  IF OLD."retired_at" IS NOT NULL
     AND (NEW."retired_at" IS NULL OR NEW."retired_at" <> OLD."retired_at") THEN
    RAISE EXCEPTION
      'person_merge_irreversible: % is retired; a merge is undone by a new decision, not by editing the row',
      OLD."spellzee_id"
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$fn$;

CREATE TRIGGER "persons_identity_immutable"
  BEFORE UPDATE ON "persons"
  FOR EACH ROW EXECUTE FUNCTION assert_person_identity_immutable();

ALTER TABLE "persons"
  ADD CONSTRAINT "persons_person_type_known" CHECK ("person_type" IN ('student', 'parent')),
  ADD CONSTRAINT "persons_full_name_present" CHECK (btrim("full_name") <> ''),
  ADD CONSTRAINT "persons_spellzee_id_format" CHECK ("spellzee_id" ~ '^(STU|PAR)-[0-9]{4}-[0-9]{6}$'),
  ADD CONSTRAINT "persons_spellzee_id_prefix_matches_type" CHECK (
    ("person_type" = 'student' AND "spellzee_id" LIKE 'STU-%')
    OR ("person_type" = 'parent' AND "spellzee_id" LIKE 'PAR-%')),
  ADD CONSTRAINT "persons_merge_fields_all_or_none" CHECK (
    num_nonnulls("retired_at", "merged_into_person_id", "merged_by", "merge_reason",
                 "merge_approval_request_id") IN (0, 5)),
  ADD CONSTRAINT "persons_merge_not_self" CHECK ("merged_into_person_id" IS DISTINCT FROM "id"),
  ADD CONSTRAINT "persons_merge_reason_present" CHECK (
    "merge_reason" IS NULL OR btrim("merge_reason") <> '');

-- ---------------------------------------------------------------------------
-- 6. Subtype integrity
--
-- students/parents carry a constant person_type purely so the composite FK
-- (person_id, person_type) -> persons(id, person_type) can pin the subtype.
-- Without it an enrollment could point at a parent and nothing would object.
-- ---------------------------------------------------------------------------

ALTER TABLE "students"
  ADD CONSTRAINT "students_person_type_fixed" CHECK ("person_type" = 'student'),
  ADD CONSTRAINT "students_gender_known" CHECK (
    "gender" IS NULL OR "gender" IN ('male', 'female', 'other', 'undisclosed')),
  ADD CONSTRAINT "students_date_of_birth_sane" CHECK (
    "date_of_birth" IS NULL
    OR ("date_of_birth" > DATE '1900-01-01' AND "date_of_birth" < DATE '2100-01-01'));

ALTER TABLE "parents"
  ADD CONSTRAINT "parents_person_type_fixed" CHECK ("person_type" = 'parent');

-- ---------------------------------------------------------------------------
-- 7. Writing to a retired identity
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION raise_if_person_retired(p_id UUID) RETURNS VOID
LANGUAGE plpgsql AS $fn$
DECLARE v_sid TEXT;
BEGIN
  SELECT "spellzee_id" INTO v_sid
    FROM "persons" WHERE "id" = p_id AND "retired_at" IS NOT NULL;
  IF FOUND THEN
    RAISE EXCEPTION
      'person_retired: % is a retired identity; write against the surviving identity it redirects to',
      v_sid
      USING ERRCODE = 'check_violation';
  END IF;
END;
$fn$;

-- ---------------------------------------------------------------------------
-- 8. Merge -- the older Spellzee ID always survives
--
-- Decided 2026-09-09 (docs/open-decisions.md #3): created-first wins,
-- deterministically. The retired row and its ID are kept forever so historical
-- references still resolve; it redirects to the survivor.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION assert_person_merge_valid() RETURNS TRIGGER
LANGUAGE plpgsql AS $fn$
DECLARE
  v_target   "persons"%ROWTYPE;
  v_req      "approval_requests"%ROWTYPE;
  v_decision TEXT;
BEGIN
  IF NEW."merged_into_person_id" IS NULL THEN
    RETURN NEW;
  END IF;

  -- A BEFORE trigger runs ahead of CHECK constraints, so persons_merge_not_self
  -- would never be reached from here. Raise the same rule with a greppable
  -- token; the CHECK remains as the declarative backstop.
  IF NEW."merged_into_person_id" = NEW."id" THEN
    RAISE EXCEPTION 'merge_not_self: an identity cannot be merged into itself'
      USING ERRCODE = 'check_violation';
  END IF;

  -- Lock the survivor. Two coordinators merging into the same identity, or
  -- merging A -> B while B -> C, then serialize instead of interleaving.
  SELECT * INTO v_target FROM "persons"
    WHERE "id" = NEW."merged_into_person_id" FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'merge_target_missing: no person %', NEW."merged_into_person_id"
      USING ERRCODE = 'check_violation';
  END IF;

  IF v_target."person_type" <> NEW."person_type" THEN
    RAISE EXCEPTION 'merge_type_mismatch: a % cannot be merged into a %',
      NEW."person_type", v_target."person_type"
      USING ERRCODE = 'check_violation';
  END IF;

  IF v_target."retired_at" IS NOT NULL THEN
    RAISE EXCEPTION 'merge_target_not_live: % is itself retired and cannot be a survivor',
      v_target."spellzee_id"
      USING ERRCODE = 'check_violation';
  END IF;

  -- REPOINTING an existing redirect is a different operation from merging, and
  -- the rules above are the wrong ones for it. It happens when a survivor is
  -- itself merged away and its inbound redirects must follow, so that resolving
  -- a retired ID is always one hop.
  --
  -- This is a NARROWING, not a loosening: a repoint may only follow the chain.
  -- The new target must be exactly the identity the old target now redirects
  -- to, and the original approval must stay attached. Anything else is still a
  -- merge and still needs its own approved request.
  IF TG_OP = 'UPDATE' THEN
    IF OLD."merged_into_person_id" IS NOT NULL
       AND OLD."merged_into_person_id" <> NEW."merged_into_person_id" THEN
      IF NEW."merge_approval_request_id" IS DISTINCT FROM OLD."merge_approval_request_id" THEN
        RAISE EXCEPTION
          'merge_repoint_only_follows_chain: repointing % must keep its original approval',
          NEW."spellzee_id"
          USING ERRCODE = 'check_violation';
      END IF;
      IF NEW."merged_into_person_id" IS DISTINCT FROM (
           SELECT "merged_into_person_id" FROM "persons" WHERE "id" = OLD."merged_into_person_id") THEN
        RAISE EXCEPTION
          'merge_repoint_only_follows_chain: % may only be repointed to the identity its previous survivor redirects to',
          NEW."spellzee_id"
          USING ERRCODE = 'check_violation';
      END IF;
      RETURN NEW;
    END IF;
  END IF;

  -- Spellzee IDs are minted in order within a prefix, so lexicographic order IS
  -- creation order -- a total, deterministic ordering with no judgment call.
  IF v_target."spellzee_id" > NEW."spellzee_id" THEN
    RAISE EXCEPTION
      'merge_older_id_must_survive: % is older than % and must be the survivor, not the retired identity',
      NEW."spellzee_id", v_target."spellzee_id"
      USING ERRCODE = 'check_violation';
  END IF;

  -- Maker-checker: merging two existing identities requires an approved
  -- request naming exactly this pair.
  SELECT * INTO v_req FROM "approval_requests"
    WHERE "id" = NEW."merge_approval_request_id";
  IF NOT FOUND OR v_req."action_type" <> 'person_merge' THEN
    RAISE EXCEPTION 'merge_requires_approved_request: no person_merge request %',
      NEW."merge_approval_request_id"
      USING ERRCODE = 'check_violation';
  END IF;
  IF v_req."subject_id" <> NEW."id" OR v_req."target_id" <> NEW."merged_into_person_id" THEN
    RAISE EXCEPTION
      'merge_approval_subject_mismatch: request % approves a different pair than % -> %',
      v_req."id", NEW."spellzee_id", v_target."spellzee_id"
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT "decision" INTO v_decision FROM "approval_decisions"
    WHERE "approval_request_id" = v_req."id";
  IF v_decision IS DISTINCT FROM 'approved' THEN
    RAISE EXCEPTION 'merge_requires_approved_request: request % is %',
      v_req."id", COALESCE(v_decision, 'undecided')
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$fn$;

CREATE TRIGGER "persons_merge_valid"
  BEFORE INSERT OR UPDATE ON "persons"
  FOR EACH ROW EXECUTE FUNCTION assert_person_merge_valid();

-- A redirect must always point at a LIVE identity, so resolving a retired ID is
-- always exactly one hop. When a survivor is itself later merged away, the
-- inbound redirects must be repointed in the SAME transaction -- which is why
-- this is a DEFERRED constraint trigger and not a BEFORE trigger.
--
-- It re-reads the row rather than trusting the queued NEW tuple: after two
-- updates to the same row in one transaction, the first queued NEW is stale.
CREATE OR REPLACE FUNCTION assert_merge_redirects_live() RETURNS TRIGGER
LANGUAGE plpgsql AS $fn$
DECLARE v "persons"%ROWTYPE;
BEGIN
  SELECT * INTO v FROM "persons" WHERE "id" = NEW."id";
  IF NOT FOUND THEN RETURN NULL; END IF;

  IF v."merged_into_person_id" IS NOT NULL
     AND EXISTS (SELECT 1 FROM "persons"
                  WHERE "id" = v."merged_into_person_id" AND "retired_at" IS NOT NULL) THEN
    RAISE EXCEPTION
      'merge_redirect_chain: % redirects to a retired identity; repoint it to the survivor in the same transaction',
      v."spellzee_id"
      USING ERRCODE = 'check_violation';
  END IF;

  IF v."retired_at" IS NOT NULL
     AND EXISTS (SELECT 1 FROM "persons" WHERE "merged_into_person_id" = v."id") THEN
    RAISE EXCEPTION
      'merge_redirect_chain: identities still redirect to %, which has now been retired itself',
      v."spellzee_id"
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NULL;
END;
$fn$;

CREATE CONSTRAINT TRIGGER "persons_merge_redirects_live"
  AFTER INSERT OR UPDATE ON "persons"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION assert_merge_redirects_live();

-- ---------------------------------------------------------------------------
-- 9. student_guardians
-- ---------------------------------------------------------------------------

ALTER TABLE "student_guardians"
  ADD CONSTRAINT "student_guardians_relationship_known" CHECK (
    "relationship" IN ('mother', 'father', 'guardian', 'other')),
  ADD CONSTRAINT "student_guardians_period_valid" CHECK (
    "ended_at" IS NULL OR "ended_at" > "started_at");

CREATE UNIQUE INDEX "one_active_link_per_student_guardian_pair"
  ON "student_guardians" ("student_person_id", "parent_person_id")
  WHERE "ended_at" IS NULL;

CREATE UNIQUE INDEX "one_primary_guardian_per_student"
  ON "student_guardians" ("student_person_id")
  WHERE "is_primary" AND "ended_at" IS NULL;

CREATE OR REPLACE FUNCTION assert_guardian_persons_live() RETURNS TRIGGER
LANGUAGE plpgsql AS $fn$
BEGIN
  PERFORM public.raise_if_person_retired(NEW."student_person_id");
  PERFORM public.raise_if_person_retired(NEW."parent_person_id");
  RETURN NEW;
END;
$fn$;

CREATE TRIGGER "student_guardians_persons_live"
  BEFORE INSERT ON "student_guardians"
  FOR EACH ROW EXECUTE FUNCTION assert_guardian_persons_live();

-- ---------------------------------------------------------------------------
-- 10. contact_points -- historical contact detail
--
-- Baseline 6.4: "Store historical contact details rather than creating
-- identities for every new contact detail." A retired number is closed
-- (valid_to), never deleted and never overwritten; an alternate number is
-- simply another row.
-- ---------------------------------------------------------------------------

ALTER TABLE "contact_points"
  ADD CONSTRAINT "contact_points_type_known" CHECK ("contact_type" IN ('phone', 'email')),
  ADD CONSTRAINT "contact_points_raw_value_present" CHECK (btrim("raw_value") <> ''),
  ADD CONSTRAINT "contact_points_period_valid" CHECK (
    "valid_to" IS NULL OR "valid_to" > "valid_from"),
  ADD CONSTRAINT "contact_points_value_normalizes" CHECK (
    CASE "contact_type"
      WHEN 'phone' THEN public.normalize_phone("raw_value") ~ '^[0-9]{8,15}$'
      WHEN 'email' THEN public.normalize_email("raw_value") ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]{2,}$'
      ELSE false
    END);

CREATE UNIQUE INDEX "one_primary_contact_per_person_per_type"
  ON "contact_points" ("person_id", "contact_type")
  WHERE "is_primary" AND "valid_to" IS NULL;

CREATE UNIQUE INDEX "no_duplicate_active_contact_value"
  ON "contact_points" ("person_id", "contact_type",
                       public.normalize_contact_value("contact_type", "raw_value"))
  WHERE "valid_to" IS NULL;

-- The search-before-create index. Exact on the normalized value; the service
-- scorer joins from here.
CREATE INDEX "contact_points_match_idx"
  ON "contact_points" ("contact_type", public.normalize_contact_value("contact_type", "raw_value"))
  WHERE "valid_to" IS NULL;

CREATE OR REPLACE FUNCTION assert_contact_person_live() RETURNS TRIGGER
LANGUAGE plpgsql AS $fn$
BEGIN
  PERFORM public.raise_if_person_retired(NEW."person_id");
  RETURN NEW;
END;
$fn$;

CREATE TRIGGER "contact_points_person_live"
  BEFORE INSERT ON "contact_points"
  FOR EACH ROW EXECUTE FUNCTION assert_contact_person_live();

-- ---------------------------------------------------------------------------
-- 11. Duplicate matching indexes on persons
--
-- Exact index for the certain case, trigram index for the fuzzy one. The
-- trigram index makes similarity() search cheap; it does NOT decide anything.
-- The confidence THRESHOLD is a policy row
-- (duplicate.match_confidence_threshold), never a number in an index or a
-- constraint.
-- ---------------------------------------------------------------------------

CREATE INDEX "persons_normalized_name_idx"
  ON "persons" ("person_type", public.normalize_person_name("full_name"))
  WHERE "retired_at" IS NULL;

CREATE INDEX "persons_name_trgm_idx"
  ON "persons" USING gin (public.normalize_person_name("full_name") gin_trgm_ops)
  WHERE "retired_at" IS NULL;

-- ---------------------------------------------------------------------------
-- 12. Blocking a high-confidence duplicate at creation time
--
-- Decided 2026-09-09 (docs/open-decisions.md #3): a high-confidence duplicate
-- is BLOCKED OUTRIGHT -- no record, no pending state, no approval request.
--
-- Scored, fuzzy confidence is a service concern and cannot be a constraint.
-- What IS a constraint is the case that is a duplicate at any threshold:
-- two LIVE persons OF THE SAME TYPE with the SAME normalized name sharing the
-- SAME normalized live phone or email. Same-type only, deliberately: a parent
-- and a child legitimately share a phone, and a father and son legitimately
-- share a name.
--
-- CONCURRENCY. This trigger reads other rows to decide, so it is racy on its
-- own: two transactions can each see a pre-write state and both commit. There
-- is no parent row to SELECT ... FOR UPDATE -- the row we must not race against
-- does not exist yet -- so the writer takes a transaction-scoped advisory lock
-- keyed on (person_type, normalized name). That serializes exactly the
-- contended bucket and nothing else. Proven by a two-connection test, not by
-- inspection.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION assert_not_duplicate_person(
  p_person_id        UUID,
  p_person_type      TEXT,
  p_normalized_name  TEXT,
  p_contact_type     TEXT,
  p_normalized_value TEXT
) RETURNS VOID LANGUAGE plpgsql AS $fn$
DECLARE v_other TEXT;
BEGIN
  IF p_normalized_name IS NULL OR p_normalized_name = ''
     OR p_normalized_value IS NULL OR p_normalized_value = '' THEN
    RETURN;
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtext('spellzee.person_match:' || p_person_type || '|' || p_normalized_name));

  SELECT p."spellzee_id" INTO v_other
  FROM "contact_points" c
  JOIN "persons" p ON p."id" = c."person_id"
  WHERE c."valid_to" IS NULL
    AND c."contact_type" = p_contact_type
    AND public.normalize_contact_value(c."contact_type", c."raw_value") = p_normalized_value
    AND p."id" <> p_person_id
    AND p."retired_at" IS NULL
    AND p."person_type" = p_person_type
    AND public.normalize_person_name(p."full_name") = p_normalized_name
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION
      'duplicate_person_blocked: % already exists with the same name and the same %; merge the identities instead of creating a second one',
      v_other, p_contact_type
      USING ERRCODE = 'unique_violation';
  END IF;
END;
$fn$;

CREATE OR REPLACE FUNCTION assert_contact_not_duplicate() RETURNS TRIGGER
LANGUAGE plpgsql AS $fn$
DECLARE v_type TEXT; v_name TEXT;
BEGIN
  IF NEW."valid_to" IS NOT NULL THEN RETURN NEW; END IF;
  SELECT "person_type", public.normalize_person_name("full_name") INTO v_type, v_name
    FROM "persons" WHERE "id" = NEW."person_id" AND "retired_at" IS NULL;
  IF NOT FOUND THEN RETURN NEW; END IF;
  PERFORM public.assert_not_duplicate_person(
    NEW."person_id", v_type, v_name, NEW."contact_type",
    public.normalize_contact_value(NEW."contact_type", NEW."raw_value"));
  RETURN NEW;
END;
$fn$;

CREATE TRIGGER "contact_points_block_duplicate"
  BEFORE INSERT OR UPDATE OF "person_id", "contact_type", "raw_value", "valid_to"
  ON "contact_points"
  FOR EACH ROW EXECUTE FUNCTION assert_contact_not_duplicate();

-- A rename can create the duplicate just as an insert can.
CREATE OR REPLACE FUNCTION assert_rename_not_duplicate() RETURNS TRIGGER
LANGUAGE plpgsql AS $fn$
DECLARE r RECORD; v_name TEXT;
BEGIN
  IF NEW."retired_at" IS NOT NULL THEN RETURN NEW; END IF;
  v_name := public.normalize_person_name(NEW."full_name");
  IF v_name = public.normalize_person_name(OLD."full_name") THEN RETURN NEW; END IF;
  FOR r IN
    SELECT "contact_type",
           public.normalize_contact_value("contact_type", "raw_value") AS nv
    FROM "contact_points"
    WHERE "person_id" = NEW."id" AND "valid_to" IS NULL
  LOOP
    PERFORM public.assert_not_duplicate_person(NEW."id", NEW."person_type", v_name, r."contact_type", r.nv);
  END LOOP;
  RETURN NEW;
END;
$fn$;

CREATE TRIGGER "persons_rename_not_duplicate"
  BEFORE UPDATE OF "full_name" ON "persons"
  FOR EACH ROW EXECUTE FUNCTION assert_rename_not_duplicate();
