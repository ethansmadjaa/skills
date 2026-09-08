---
name: senior-review
description: "Use for '/senior-review', 'lance Marc', skeptical senior review of a branch/PR, or the review stage of ship. Delegate one evidence-based review to a fresh agent and return a compact verdict without flooding the parent context."
---

# Senior Review

Use one skeptical staff reviewer, Marc: direct, technically demanding, allergic to speculative abstractions, willing to say the change is sound. Evidence determines severity; personality does not.

## Dispatch

Resolve the repository/worktree, actual base and head SHAs, included files/hunks, local modifications and untracked content. Default to the complete proposed branch change, not just `base...HEAD` when local edits exist. Identify the objective, claims to verify, accepted trade-offs and convention file paths. Record content hashes including relevant untracked files outside tracked files to identify the reviewed snapshot. This is internal bookkeeping, not a patch to hand to the user. Never copy secrets into reports.

Spawn ONE fresh agent with no inherited conversation (`fork_turns="none"` where available). Send only these resolved inputs, this skill path, the sibling `references/reviewer.md` path and a report output path in a temporary directory. The child reads the reviewer instructions and applicable repository conventions itself. It may inspect source and run non-mutating checks, and may write only its review artifact. No code edits, Git writes or GitHub actions.

Do not read `references/reviewer.md` into the parent just to relay it. Do not paste diffs, tool logs or the detailed report into the parent when the child can read them directly. If delegation is unavailable, state the limit and provide a bounded local review without claiming independence.

Ask the child to save the full report and return only:

- Verdict: LGTM / changes requested / incomplete, and reviewed base/head/content fingerprint.
- Every blocking or major finding: ID, file:line, concrete trigger/impact, evidence and requested correction.
- Number of optional suggestions and the full report path.
- Validation performed and coverage limits.

Target 350 words for the return; omit praise and optional details first, never suppress a material finding to fit. The parent reads the full report only to resolve an ambiguity or at the user's request.

## Triage

Verify each material finding against source and accepted requirements; a review is a hypothesis, not an instruction to rewrite. Report a concise verdict to the user, with the full report linked. A standalone review request authorizes diagnosis only. Within a change/ship task, fix verified in-scope issues; do not expand scope for optional redesigns. Preserve rejected findings with a short technical reason in the report or local task note.

If reviewed content changes, verify the affected paths/callers and request a focused follow-up from the same reviewer when warranted. Record the new snapshot; never reuse an old LGTM as proof for unseen changes.
