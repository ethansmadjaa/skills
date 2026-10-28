---
name: agent-ticket
description: "Take a ticket from start to a review-ready PR on its own: subagents plan, self-grill, implement, then prove it on the running app with screenshots and a video, /ship publishes it, then the user gets pinged. Never merges."
disable-model-invocation: true
---

# Agent ticket

You are the **orchestrator**. Subagents read, decide, write code and verify; you brief them, check what they return against the completion criterion of each step, and own git and the PR through `/ship`. Every file change in the repo, including a fix a review asks for, goes through a subagent.

The run is autonomous: from the invocation to the ping, the user is away. Go on without asking unless a **hard stop** below is true.

## Hard stops

Ping whoever launched the run (the user, or the session that dispatched you) with the decision named and wait, only when:

- a `/ship` stop condition is true;
- an action is destructive, reaches production or a shared environment, or needs a secret;
- a question only the user can answer blocks the plan and no reversible default exists (a product number, a contract, a change of scope);
- a step fails its completion criterion twice.

## The ticket is the knowledge base

Another agent or a person must be able to resume the run from the ticket alone, so you write to it as you go, through the issue tracker's MCP:

- After step 2: the spec goes into the description (problem, design, steps, acceptance criteria, out of scope). Read the description in full first and keep what the plan does not contradict. Each decision goes on the ticket as a dated line with its reason: the grill's answers and every assumption. Use the ticket's state document when the tracker or the instruction files keep one, else a comment.
- After each later step: one comment with its outcome and its evidence (commits, criteria proven, PR link, what blocked). You write these comments; a subagent attaches its files and returns, and leaves the comment to you.
- A hard stop goes on the ticket before the ping.

## Briefs

A subagent starts with nothing but its brief. Step 2 writes the plan to one file outside the repo; every later brief points to that file rather than retyping it. Each brief holds: the ticket id and text, the plan file when one exists, the branch, the exact scope, the return format, and this line: _read the repo's agent instruction files (`AGENTS.md`, `CLAUDE.md`, the rule and convention docs they point to for the files you touch) and the user's global instructions before you act; they win over your defaults_.

## Steps

1. **Branch.** Resolve the ticket from the argument, else from the branch name. On the default branch, create one named after the ticket. Done when `HEAD` is a feature branch.

2. **Plan (one subagent, read-only).** It reads the ticket with its parent, relations and comments through the issue tracker's MCP, the code the ticket touches, and the conventions that apply. Then it grills the plan alone with the `grilling` skill: it asks each question and answers it from the code, the docs and the ticket. A question the evidence cannot settle gets the most reversible default, recorded as an **assumption**. It returns: goal, design, files to touch, the conventions that bind them, assumptions, and acceptance criteria written as checks a test can prove. Done when every acceptance criterion is checkable and every open question is either answered or an assumption. A blocking question with no reversible default is a hard stop.

3. **Implement (one subagent).** It works the way the `implement` skill describes, with the plan as its spec: `tdd` at the agreed seams, typecheck and single test files as it goes, the full suite once at the end, `code-review` on its diff, then commits on the branch, one commit per package or slice so a stopped run resumes from the last one. It returns the commits, each acceptance criterion with the test that proves it, and the exit code of each gate. Done when every criterion has a passing test and every gate exits 0. Otherwise brief a new subagent with the gaps.

4. **Verify (one fresh subagent).** It did not write the code, and it proves each acceptance criterion on the running app, not through the tests. A UI change: it drives the UI in a browser, takes one screenshot per criterion and records a short video of the flow. A backend change: it starts an environment the instruction files let agents start, checks first that no other process serves it, exercises the behavior (a request, the UI on top of it, the logs) and records it. It stops every server it started, attaches the screenshots and the video to the ticket, and returns each criterion as proven or not proven with its evidence. Done when every criterion is proven. A criterion not proven goes back to step 3 with its evidence. Shared state stays as it is: when the change needs a migration that a shared database does not have yet, or would write data other people use, the subagent intercepts or stubs that call in the browser, and the criterion counts as proven with a stub, named as such.

5. **Ship.** Invoke `/ship`. Every code change it calls for (a review finding, a red check, a PR comment) goes to a fix subagent with the finding and its evidence; you commit and push what it returns under `/ship`'s rules. A fix that changes behavior runs step 4 again. Run `/ship` to its report: PR open, required checks green, feedback addressed. The PR body lists the assumptions and links the step 4 evidence. Merging stays with the user: stop at the report, and leave any merge or deploy follow-up to them.

6. **Report and ping.** Write the final state on the ticket: PR link, assumptions, the step 4 evidence, what is left to the user. Send the user a notification (the harness's push notification tool; else a desktop notification) carrying the PR link, or the hard stop and the decision it needs. Then report: PR link and head SHA, checks, the review verdicts, assumptions, the video path, what is left to the user.
