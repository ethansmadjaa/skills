---
name: dual-review
description: "Review the current diff with two independent reviewers in parallel — /code-review and Codex (codex:review) — then merge, verify, and filter their findings to the genuinely-valid ones, fix those in the working tree, and gate by exit code. Reports fixed-vs-rejected with reasoning; stops before committing (caller commits). Use when the user says 'dual-review', 'run both reviews', 'code-review and codex', 'cross-review this', '/dual-review', or wants a diff reviewed by both reviewers and the real findings fixed."
---

# Dual review

Two reviewers, one filtered fix pass. Spawn `/code-review` and Codex **in parallel**, merge their findings, keep only what's genuinely real (verify each against the code), fix those, and prove it with exit codes. Do **not** commit or push — that's the caller's call.

## Workflow

1. **Pick the diff.** Auto-detect, no prompt:

   - Uncommitted changes present (`git status --porcelain` non-empty) → review the working tree (`git diff HEAD` + untracked).
   - Otherwise → review the branch vs main: `git diff $(git merge-base origin/main HEAD)...HEAD`.
   - An explicit arg (PR number, branch, or paths) overrides. List the changed files so both reviewers share one scope.

2. **Fan out — both reviewers in ONE message (two `Agent` calls, parallel):**

   - **Agent A — `subagent_type: general-purpose`:** "Invoke the `code-review` skill at high effort on this diff; if unavailable, review directly." Read-only.
   - **Agent B — `subagent_type: codex:codex-rescue`:** hand Codex the same diff for an independent review. **Best-effort** — if Codex is unavailable/errors, note it and continue with A alone.
   - Give both the same scope, the feature's intent, and any **explicitly-accepted trade-offs** (so they don't re-flag them). Both are read-only — they report, they don't edit.

3. **Merge + filter (the core step).** For every finding from either reviewer:

   - **Verify against the code** — open the cited `file:line` before trusting it. Subagent/bot findings are often wrong or describe impossible states.
   - **De-dupe** findings the two reviewers share.
   - **Keep** only the genuinely-valid ones. **Reject** the rest with a one-line technical reason — do not change code to appease a reviewer (see `receiving-code-review`). If a reviewer misread because a comment/name was misleading, fix _that_.
   - Respect the accepted trade-offs from step 2 — rejecting them is expected.

4. **Fix the kept findings** in the working tree. Minimal diffs, match surrounding style, preserve existing comments.

5. **Gate by EXIT CODE** on every affected package — never grep/head-filtered output: typecheck, lint, tests. Capture the verbatim exit codes. If a fix breaks the gate, resolve it before reporting.

6. **Report and stop:**
   - **Fixed:** `file:line — what changed` per finding.
   - **Rejected:** `finding — one-line reason`.
   - **Gate:** verbatim exit codes per package.
   - **Codex status** if it was unavailable.
   - Do **not** commit or push. Tell the caller it's ready to commit.

## Principles

- Parallel, not sequential — both reviewers in a single message.
- Verify before fixing; a finding is a hypothesis until you've read the code.
- Two reviewers means overlap — merge, don't double-fix.
- Honest filtering beats a clean-looking diff: reject with reasoning, leave the trade-offs.
- The gate is non-negotiable and proven by exit code, never filtered output.

## Notes

- Codex review runs through the `codex:codex-rescue` subagent (Codex plugin must be set up — see `codex:setup`); degrade gracefully if absent.
- For handling **PR review threads** (reply + resolve, commit + push), reach for `addressing-pr-review-comments` instead — this skill reviews a diff, it doesn't touch the PR.
