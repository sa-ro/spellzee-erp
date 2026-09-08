# Anti-Patterns — Scope Intake

Process failure modes specific to handling a raw, unrefined ask. See
`examples/good-vs-bad-intake.md` for a worked comparison.

## 1. Jumping straight to code from a raw pain point

**Problem**: the requester describes a pain point ("reports are slow")
and implementation starts immediately.

**Why it fails**: a vague pain point maps to many different possible
designs. Building against a guess wastes implementation effort if the
guess is wrong, and produces something that solves the wrong problem
even if the code itself is correct.

**Fix**: run Step 1 (Gather) first, every time a raw ask arrives.

## 2. Treating an assumption as a confirmed fact

**Problem**: the requester doesn't know an answer (e.g. exact expected
traffic), so a number gets picked and used in the design without saying
so.

**Why it fails**: the requester now believes a decision was made on real
information, and can't correct it because they don't know it was a
guess. If the guess is wrong, the mistake surfaces late — after
implementation — instead of during Step 1 where it's cheap to fix.

**Fix**: state assumptions explicitly, both while planning and in the
final report.

## 3. Asking the requester implementation-level questions

**Problem**: asking a founder/stakeholder "should this use a composite
index or two separate indexes?"

**Why it fails**: they usually can't answer, and it burns their patience
on a question that has nothing to do with their actual decision-making
authority (business requirements, priorities, constraints).

**Fix**: check the codebase yourself for anything implementation-level;
reserve requester questions for things only they can answer (priorities,
success criteria, scope boundary, constraints).

## 4. Skipping plan confirmation on a costly change

**Problem**: going straight from Step 1 to Step 3 (Implement) for a
significant/expensive-to-redo change without stating the plan back first.

**Why it fails**: if the plan's direction is wrong, the cost of finding
out is now a full implementation redo instead of a five-minute
correction.

**Fix**: for anything non-trivial, state the plan and get confirmation
before writing code — this is what Step 2 exists for.

## 5. Reporting tests as passing without running them

**Problem**: test code is written, and the report says "tests pass"
without ever executing the test suite.

**Why it fails**: this is a direct violation of CLAUDE.md's communication
style rule ("never claim something was tested if it wasn't") — an
unexecuted test proves nothing, and reporting it as proof is dishonest by
omission.

**Fix**: always run the tests and report the actual outcome; if tests
can't be run in this environment, say so explicitly.

## 6. Reporting "done" with an unchecked DoD item

**Problem**: `workflow-pre-merge-review` is skipped, or run but a failing/
unverified DoD item isn't surfaced in the final report.

**Why it fails**: the requester now believes the change meets the bar
this whole skill system exists to enforce, when it may not.

**Fix**: Step 5 is mandatory before Step 6; any unverified item gets
named in the Step 6 report, not hidden.

## 7. Report size mismatched to change size

**Problem**: a five-line config change gets a full Understanding/
Assumptions/Architecture/Trade-offs writeup, or a significant
architectural change gets a two-line summary.

**Why it fails**: over-reporting wastes the requester's time and buries
the signal; under-reporting hides risk they needed to see.

**Fix**: match the report to CLAUDE.md's response framework — use only
the sections that apply to the actual size of the change.
