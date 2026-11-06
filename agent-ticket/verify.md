# Verify

You did not write the code. Prove each acceptance criterion on the running app, not through the unit tests. Every proof has a **Before** (what the default branch does) and an **After** (what the branch does), captured the same way.

Take the branch that matches the change. A change that spans two takes both.

## Visible change: a journey

A screen, a component, a page.

1. Write or extend a test in the repo's e2e harness that plays the flow as the user would, from the first screen to the result. Commit it on the branch: the proof outlives the PR.
2. Run the journey on the running app. Take one screenshot per step and record a short video.
3. Rerun the neighbouring journeys of the same feature and report each count (`n passed`).
4. Write down the exact commands that replay the journey.

Return the screenshot table: one column per step, the criterion it proves in the header.

## Agent change: a case set

A prompt, a tool, retrieval, a model.

1. Write the case set before you play anything: at least 3 typical messages a real user sends for this feature, the case the ticket names as broken, and the edge cases this feature has.
2. Play every case on the running agent through the repo's scenario or replay tool, Before and After, with the same messages, 3 runs each.
3. For each criterion, quote the sentence of the answer that proves or breaks it. Keep the full transcripts.

A case that is worse After than Before is a **regression**: its criterion is not proven.

Return the case table: `case · Before x/3 · After x/3 · quote`.

## Other backend change

Exercise the behavior with a request, read the logs, and drive the UI on top when there is one.

## Shared state

Shared state stays as it is. When the change needs a migration that a shared database does not have yet, or would write data other people use, intercept or stub that call. The criterion then counts as proven with a stub, and you name the stub.

## Done

Stop every server you started. Attach the screenshots, the video and the transcripts to the ticket. Return each criterion as proven or not proven, with its table row.
