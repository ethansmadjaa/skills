---
name: start-ticket
description: "Use when the user starts work on a ticket from the issue tracker — '/start-ticket ABC-123', 'start ticket', 'begin development branch', 'on attaque ABC-123'. Reads the ticket, collects supporting data through MCPs or read-only CLIs, checks it against the code, grills when the ticket has no design, then leaves an up-to-date ticket ready to build on. Only on explicit invocation."
---

# Start ticket

Mirror of `ship`, at the other end of the task. **No git writes.** The worktree and branch already exist when the skill runs. Ticket reads and writes go through the ticket management MCP only, never a CLI or the web UI.

## Workflow

1. **Read the ticket.** Resolve the id from the argument, else from the branch name (`git rev-parse --abbrev-ref HEAD`), else ask. Read the issue with its parent, its relations, its comments and its attachments through the MCP, and its `<ID> État & décisions` document when one exists (`list_documents`, query = the id). Decisions marked `ne pas rouvrir` are settled: never grill them again.

2. **Classify the ticket.** It _has context_ when the description states a design: what changes, where, and why. A title plus a symptom, a wish, or a pasted conversation is _no context_.

3. **Collect the evidence.** Turn the ticket's factual claims and unknowns into concrete questions, then answer the ones that affect the design. Use connected MCPs for external or production facts; use read-only CLIs for local code, git history and logs. Prefer an MCP when both expose the same source. Never ask the user for data an available tool can retrieve, mutate external state, or copy secrets into the ticket. Record the environment, observation time and source command/tool so another agent can reproduce the finding. Stop when the evidence confirms or refutes the ticket's premise; do not collect unrelated data. Carry the useful conclusions and source links into the ticket or state document.

4. **With context — check it against the code.** Dispatch an Explore agent on every file, function, flag, table or prompt section the ticket names. Three verdicts:
   - **Stale** (a name moved, the behaviour described no longer exists, part of the solution already shipped): rewrite the description to match the code through the MCP. Keep the original intent, mark what changed in one line at the top (`Updated <date> against the code: …`). Then continue.
   - **Already done** (the code does what the ticket asks): say so with the commit or PR that did it, and stop.
   - **Current**: continue.

   Then ask, with `AskUserQuestion`, one question, three options: **Build the proposed solution** (recommended when the design is precise), **Grill it first** (when a decision is still open), **Something else**. On _Build_: hand back with the plan in three lines, do not start coding inside the skill.

5. **No context — grill with docs.** Invoke `mattpocock-skills:grilling`. Facts are yours to find, never the user's: use the evidence already collected, then fill only gaps that block a decision. A round of more than four questions goes through `grill-form`. Grill until the frontier is empty, then:
   1. **Update the ticket**: write the settled design as the description through the MCP. Short: problem, decision, what changes and where, what is out of scope. No transcript of the grill.
   2. **Write the ADR**: one file in the scratchpad, format below. Skip it, and say so, when the decision is easy to reverse or has no real alternative.
   3. **Upload the ADR to the ticket** as an attachment through the MCP (request an upload URL, PUT the file with the signed headers verbatim, then attach). Never commit it; the ticket is its home.

6. **Create or update the state document.** One Linear document attached to the issue (`save_document` with `issue`), titled `<ID> État & décisions`, three sections: **État** (delivered, in progress, by whom; rewritten on each handover), **Décisions** (one dated line per decision: who decided, the choice, why, `ne pas rouvrir` when settled; append-only), **Ouvert** (what is still to decide, where the evidence is). Seed Décisions from the evidence, grill and ADR. Update an existing one with `patch`, never a full rewrite.

7. **Report and stop.** Ticket id, what the ticket now says, evidence collected, ADR link if any, state document link. Building is the next turn.

## ADR format

```md
# <Short title of the decision>

<1-3 sentences: context, decision, why.>

## Rejected

- <alternative>: <why not, one line> (only when the rejection is non-obvious)
```

## Guardrails

- The ticket is the source of truth after this skill runs; anything settled in chat that is not on the ticket is lost.
- Updating the issue rewrites the description in place: read it in full first, keep links, attachments and acceptance criteria the rewrite does not contradict.
- Never invent a ticket, a branch name or a design the user did not settle.
- Numbers marked as product contract (caps, thresholds, delays) are questions for the user, never defaults you pick.
