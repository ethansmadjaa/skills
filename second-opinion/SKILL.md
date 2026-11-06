---
name: second-opinion
description: "Ask every available model for an independent second opinion on one problem, in parallel, with the same unbiased brief, then compare their answers and surface where they disagree. Read-only. Use on '/second-opinion', 'demande l avis de chaque modèle', 'un subagent par modèle', 'second avis', 'je suis bloqué, demande aux autres modèles', or when Ethan is stuck and wants other eyes on a prompt, a design, a bug or a measurement."
---

# Second opinion

One problem, one brief, one subagent per model, all in parallel. Then a comparison that keeps the disagreements visible. Nobody edits a file.

## Models

Spawn one subagent for each of these, every time. Never just one, never "the best one".

| Reviewer | How                                                                 |
| -------- | ------------------------------------------------------------------- |
| Fable    | `Agent`, `subagent_type: general-purpose`, `model: fable`           |
| Opus     | `Agent`, `subagent_type: general-purpose`, `model: opus`            |
| Sonnet   | `Agent`, `subagent_type: general-purpose`, `model: sonnet`          |
| Haiku    | `Agent`, `subagent_type: general-purpose`, `model: haiku`           |
| Codex    | `Agent`, `subagent_type: codex:codex-rescue`, ask for analysis only |

All five calls go in ONE message. If a model is unavailable or errors, say so in the report and go on with the others. Do not retry it in a loop.

## The brief

Write the brief once. Send the exact same text to every reviewer. Only the description changes (`Second opinion (Sonnet)`).

The brief holds:

1. **The problem**, in plain words: what the system does, what is wrong or undecided.
2. **The requirements and the decisions already taken** (Linear "ne pas rouvrir", Ethan's explicit refusals). A reviewer does not reopen them.
3. **Where to look**: absolute file paths, conversation ids, report files, logs. The reviewer reads the material itself.
4. **The question**, and the answer shape: verdict first, then problems with counts and verbatim evidence (quote + file or trace), then causes, then concrete changes ranked by impact, each with its risk.
5. "Read only. Do not edit any file. Give your own judgment."

The brief never holds:

- your hypothesis, your preferred fix, or what the other reviewers said;
- the advisor's answer or an earlier review;
- a leading question ("isn't the problem X?").

A brief that names the expected cause gets that cause back five times. That is not five opinions.

## Two rounds: blind, then informed

Even an unbiased brief anchors a reviewer when it hands over the current solution: the reviewer patches the lines it sees instead of rethinking. So every run has two rounds.

**Round 1, blind.** The brief gives the goal, the requirements, the raw inputs and the raw outputs (for a prompt: product sheets and generated answers). It never gives the current solution (the prompt, the code, the design), the attempts already made, or their results. The question: what is wrong in these outputs, why, and how would you build it from scratch?

**Round 2, informed.** Resume each reviewer with `SendMessage` (same agent, its round-1 context kept). Give it the current solution and the list of attempts with their measured results. The question: where does this solution cause the problems you found, and what would you change? Does it change your round-1 answer?

Wait for every round-1 report before you start round 2. Codex keeps no context: send it its own round-1 answer with the round-2 brief.

## Comparison

When all reviewers are back from both rounds, read every report in full. Mark each idea as **blind** (it appeared in round 1) or **informed** (round 2 only). A blind idea was not anchored by the current solution. Then report to Ethan:

1. **Agreement**: the points that 3+ reviewers found on their own. Name which ones.
2. **Disagreement**: where reviewers contradict each other, side by side, with each one's evidence. Do not resolve it by majority. Say which evidence you find stronger and why.
3. **Seen by one only**: a single reviewer's point, if its evidence holds. Check the cited file or trace before you keep it.
4. **Your recommendation**: one or two sentences.
5. **Unavailable reviewers**, if any.

Verify every claim against the material before you repeat it. A reviewer's count or quote is a hypothesis until you see it.

Do not edit, commit or start a stage. Ethan decides what to apply.
