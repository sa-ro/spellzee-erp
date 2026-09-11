#!/usr/bin/env bash
#
# Spellzee ERP — full-stack verification.
#
# Two modes:
#   verify.sh          default. A step whose prerequisites are absent reports SKIPPED and
#                      does not fail the run. This is what the Stop hook uses, so that a
#                      docs-only turn is not blocked by an unreachable database.
#   verify.sh --full   a SKIP becomes a FAIL. Use before a commit, and in CI.
#
# Exits non-zero on the first category of failure and names every failing step in the summary.
#
# Every command below maps to something that actually exists. Deliberately:
#   - typecheck is `tsc -b`, NOT `tsc --noEmit` — tsconfig.json is solution-style with
#     "files": [], so --noEmit at root checks zero files.
#   - there is no `e2e` script in any package.json, so that step is a declared placeholder
#     that reports SKIPPED. It is not invented.
# Nothing here hardcodes a host, port or database name; the DB steps read DATABASE_URL /
# TEST_DATABASE_URL from the environment or .env.

set -uo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 2
ROOT="$(pwd)"

FULL=0
for arg in "$@"; do
  case "$arg" in
    --full) FULL=1 ;;
    -h|--help) sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "verify.sh: unknown argument '$arg'" >&2; exit 2 ;;
  esac
done

TOTAL=7
STEP=0
FAILED=()
SKIPPED=()

if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
  C_OK=$'\033[32m'; C_FAIL=$'\033[31m'; C_SKIP=$'\033[33m'; C_DIM=$'\033[2m'; C_OFF=$'\033[0m'
else
  C_OK=''; C_FAIL=''; C_SKIP=''; C_DIM=''; C_OFF=''
fi

log_dir="${TMPDIR:-/tmp}/spellzee-verify.$$"
mkdir -p "$log_dir"
trap 'rm -rf "$log_dir"' EXIT

# ok NAME
ok()   { printf '  [%d/%d] %-18s %sOK%s\n'      "$STEP" "$TOTAL" "$1" "$C_OK"   "$C_OFF"; }
# fail NAME LOGFILE
fail() {
  printf '  [%d/%d] %-18s %sFAIL%s\n'  "$STEP" "$TOTAL" "$1" "$C_FAIL" "$C_OFF"
  FAILED+=("$1")
  if [ -s "$2" ]; then
    sed 's/^/        /' "$2" | tail -n 25
  fi
}
# skip NAME REASON
skip() {
  if [ "$FULL" -eq 1 ]; then
    printf '  [%d/%d] %-18s %sFAIL%s  %s (--full)\n' "$STEP" "$TOTAL" "$1" "$C_FAIL" "$C_OFF" "$2"
    FAILED+=("$1")
  else
    printf '  [%d/%d] %-18s %sSKIPPED%s  %s\n' "$STEP" "$TOTAL" "$1" "$C_SKIP" "$C_OFF" "$2"
    SKIPPED+=("$1: $2")
  fi
}

# run NAME COMMAND...  — runs the command, capturing output for the failure path only.
run() {
  local name="$1"; shift
  local logf="$log_dir/$name.log"
  if "$@" >"$logf" 2>&1; then ok "$name"; else fail "$name" "$logf"; fi
}

# Is a node module actually installed? (declared-but-UNMET is the normal state here.)
has_module() { [ -d "$ROOT/node_modules/$1" ]; }

# Load .env if present, without clobbering anything already exported.
load_env() {
  [ -f "$ROOT/.env" ] || return 0
  local line key
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in ''|\#*) continue ;; esac
    key="${line%%=*}"
    key="$(printf '%s' "$key" | tr -d '[:space:]')"
    [ -n "$key" ] || continue
    if [ -z "$(eval "printf '%s' \"\${$key:-}\"")" ]; then
      export "$key=$(printf '%s' "${line#*=}" | sed -e 's/^["'"'"']//' -e 's/["'"'"']$//')"
    fi
  done < "$ROOT/.env"
}
load_env

echo ""
if [ "$FULL" -eq 1 ]; then
  echo "  Spellzee verify ${C_DIM}(--full: skips are failures)${C_OFF}"
else
  echo "  Spellzee verify ${C_DIM}(skip-aware; use --full to require every step)${C_OFF}"
fi
echo ""

# ---------------------------------------------------------------- 1. typecheck
STEP=1
if has_module typescript; then
  run typecheck npx --no-install tsc -b
else
  skip typecheck "typescript not installed (npm install)"
fi

# --------------------------------------------------------------------- 2. lint
STEP=2
if has_module eslint; then
  run lint npm run --silent lint
else
  skip lint "eslint not installed (npm install)"
fi

# ------------------------------------------------------------------- 3. format
STEP=3
if has_module @biomejs/biome; then
  run format npm run --silent format:check
else
  skip format "@biomejs/biome not installed (npm install)"
fi

# ----------------------------------------------------------- 4. prisma validate
# `prisma validate` resolves env("DATABASE_URL") from the datasource block before it will
# validate anything, so it cannot run at all without a value — even though the check itself
# is purely static. Gate on the variable rather than reporting a false failure.
STEP=4
if ! has_module prisma; then
  skip prisma-validate "prisma not installed (npm install)"
elif [ -z "${DATABASE_URL:-}" ]; then
  skip prisma-validate "DATABASE_URL unset (no .env) — prisma validate cannot resolve the datasource"
else
  run prisma-validate npx --no-install prisma validate
fi

# -------------------------------------------------- 5. migration drift (schema)
# Catches a schema.prisma edit with no corresponding migration. --exit-code makes
# "there is a difference" a non-zero exit.
STEP=5
if ! has_module prisma; then
  skip migrate-drift "prisma not installed (npm install)"
elif [ -z "${DATABASE_URL:-}" ]; then
  skip migrate-drift "DATABASE_URL unset (no .env)"
else
  logf="$log_dir/migrate-drift.log"
  if npx --no-install prisma migrate diff \
       --from-migrations ./prisma/migrations \
       --to-schema-datamodel ./prisma/schema.prisma \
       --shadow-database-url "$DATABASE_URL" \
       --exit-code >"$logf" 2>&1; then
    ok migrate-drift
  else
    case "$(tail -c 4000 "$logf")" in
      *"P1001"*|*"P1003"*|*"Can't reach database"*|*"database server"*)
        skip migrate-drift "shadow database unreachable" ;;
      *)
        fail migrate-drift "$logf"
        printf '        %sschema.prisma differs from prisma/migrations — generate a migration%s\n' "$C_DIM" "$C_OFF"
        ;;
    esac
  fi
fi

# -------------------------------------------------------------------- 6. tests
STEP=6
if ! has_module vitest; then
  skip tests "vitest not installed (npm install)"
elif [ -z "${TEST_DATABASE_URL:-}" ]; then
  skip tests "TEST_DATABASE_URL unset (no .env) — constraint tests need a real database"
else
  run tests npm run --silent test
fi

# ----------------------------------------------------------------- 7. e2e smoke
# No e2e script is defined in any package.json in this repo. This step is a named
# placeholder so the gap is visible, rather than an invented command that would fail.
STEP=7
if npm run --silent 2>/dev/null | grep -qE '^\s{2}e2e(:|$)'; then
  run e2e npm run --silent e2e
else
  skip e2e "no e2e script defined in package.json"
fi

# ------------------------------------------------------------------- summary
echo ""
if [ ${#FAILED[@]} -gt 0 ]; then
  printf '  %sFAILED%s: %s\n\n' "$C_FAIL" "$C_OFF" "$(IFS=', '; echo "${FAILED[*]}")"
  exit 1
fi

if [ ${#SKIPPED[@]} -gt 0 ]; then
  printf '  %sPASSED with %d skipped%s\n' "$C_OK" "${#SKIPPED[@]}" "$C_OFF"
  for s in "${SKIPPED[@]}"; do printf '    %s- %s%s\n' "$C_DIM" "$s" "$C_OFF"; done
  printf '    %srun scripts/verify.sh --full to require these%s\n\n' "$C_DIM" "$C_OFF"
else
  printf '  %sPASSED%s (all %d steps)\n\n' "$C_OK" "$C_OFF" "$TOTAL"
fi
exit 0
