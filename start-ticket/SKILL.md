---
name: start-ticket
description: "Use when the user starts work on a ticket from the issue tracker — '/start-ticket ABC-123', 'start ticket', 'begin development branch', 'on attaque ABC-123'. Reads the ticket, checks it against the code, grills when the ticket has no design, then leaves an up-to-date ticket ready to build on. Only on explicit invocation."
---

# Start ticket

Mirror of `ship`, at the other end of the task. **No git writes.** The worktree and branch already exist when the skill runs. Ticket reads and writes go through the ticket management MCP only, never a CLI or the web UI.

## Workflow

1. **Read the ticket.** Resolve the id from the argument, else from the branch name (`git rev-parse --abbrev-ref HEAD`), else ask. Read the issue with its relations, its comments and its attachments through the MCP.

2. **Classify the ticket.** It *has context* when the description states a design: what changes, where, and why. A title plus a symptom, a wish, or a pasted conversation is *no context*.

3. **With context — check it against the code.** Dispatch an Explore agent on every file, function, flag, table or prompt section the ticket names. Three verdicts:
   - **Stale** (a name moved, the behaviour described no longer exists, part of the solution already shipped): rewrite the description to match the code through the MCP. Keep the original intent, mark what changed in one line at the top (`Updated <date> against the code: …`). Then continue.
   - **Already done** (the code does what the ticket asks): say so with the commit or PR that did it, and stop.
   - **Current**: continue.

   Then ask, with `AskUserQuestion`, one question, three options: **Build the proposed solution** (recommended when the design is precise), **Grill it first** (when a decision is still open), **Something else**. On *Build*: hand back with the plan in three lines, do not start coding inside the skill.

4. **No context — grill with docs.** Invoke `mattpocock-skills:grilling`. Facts are yours to find, never the user's: repo code and its docs, `context7` for library behaviour, the data MCP servers for production facts. A round of more than four questions goes through `grill-form`. Grill until the frontier is empty, then:
   1. **Update the ticket**: write the settled design as the description through the MCP. Short: problem, decision, what changes and where, what is out of scope. No transcript of the grill.
   2. **Write the ADR**: one file in the scratchpad, format below. Skip it, and say so, when the decision is easy to reverse or has no real alternative.
   3. **Upload the ADR to the ticket** as an attachment through the MCP (request an upload URL, PUT the file with the signed headers verbatim, then attach). Never commit it; the ticket is its home.

5. **Report and stop.** Ticket id, what the ticket now says, ADR link if any. Building is the next turn.

## ADR format

```md
# <Short title of the decision>

<1-3 sentences: context, decision, why.>

## Rejected
- <alternative>: <why not, one line>   (only when the rejection is non-obvious)
```

## Guardrails

- The ticket is the source of truth after this skill runs; anything settled in chat that is not on the ticket is lost.
- Updating the issue rewrites the description in place: read it in full first, keep links, attachments and acceptance criteria the rewrite does not contradict.
- Never invent a ticket, a branch name or a design the user did not settle.
- Numbers marked as product contract (caps, thresholds, delays) are questions for the user, never defaults you pick.
