---
name: grill-form
description: Use when the user wants to answer a round of grilling/interview/design-review questions through an HTML form instead of chat — "un html avec des inputs pour chaque question", "answer these questions in a form", "copy my answers as a prompt", or when they want to answer a question round asynchronously and hand the answers to another agent session.
---

# Grill Form

## Overview

Turn the current question round (grilling skill, design review, any Q1..Qn with recommendations) into a self-contained HTML Artifact: one radio group + note per question, localStorage persistence (answers survive reloads), and a button that copies answers + notes as a minimal markdown prompt so another agent session can resume the work.

**Never write the HTML yourself.** You only write a small JSON config; `generate.py` merges it into the bundled `template.html`. The template never enters context.

## Workflow

1. **Write the config** — a JSON file in the scratchpad (shape below): title, header strings, `storeKey`, prompt header, and the round's questions. Tag the recommended option of each question `"reco": true`. The "Autre/Other" radio and free-text note are added by the template automatically.
2. **Generate**:
   ```bash
   python3 <skill dir>/generate.py <config.json> <output.html>
   ```
   The script validates the config (required keys, exactly one reco per question) and fails loudly.
3. **Publish** with the Artifact tool (load `artifact-design` first — the tool requires it): stable favicon, one-line description, `label` naming the round (e.g. `round-1`).
4. **Tell the user**: the link, that answers persist in their browser (localStorage), and that the copy button produces a paste-ready agent prompt.

## Config shape

```json
{
  "title": "T9 — Allowlist data model · Grill round 1",
  "eyebrow": "Map ABC-100 · Ticket T9 (ABC-123) · Grill round 1",
  "heading": "Data model of the allowlist",
  "lede": "7 decisions on the frontier. Tick one option (or Other)… the button assembles a markdown prompt for the agent that resumes.",
  "storeKey": "abc123-grill-r1",
  "promptTitle": "# Answers — Grill round 1 · T9 (ABC-123)",
  "promptContext": "Context: map ABC-100 (…). Resume the session with these answers: recompute the frontier, pose round 2 if decisions remain, otherwise write the ticket resolution.",
  "questions": [
    {
      "id": "Q1",
      "title": "Short decision title",
      "body": "Full question as asked in the round",
      "reco": "Agent's recommendation with its one-line rationale",
      "multi": true,
      "options": [
        { "v": "a", "label": "(a) …", "reco": true },
        { "v": "b", "label": "(b) …" }
      ]
    }
  ]
}
```

`"multi": true` is optional: checkboxes instead of radios, several options answerable at once, all of them copied on the question's line. Still exactly one `"reco": true`.

`storeKey` must be unique per ticket+round (it namespaces localStorage). Body/reco/labels take mini-markdown, never HTML: `\n` = line break (blank line = paragraph), lines starting `- ` render as bullets, `` `code` `` and `**bold**` render inline. Keep bodies short and airy — a one-line intro plus 3-5 bullets beats a paragraph (dense single-paragraph bodies are unreadable).

## Prompt-output contract

The copied markdown is **answers + notes only, minimal tokens** — the questions and recommendations are NOT repeated (the receiving agent already holds them, or finds them on the ticket):

1. **`promptTitle`**: whose answers, round number, ticket/decision title + reference.
2. **`promptContext`**: map/session references (wayfinder, ticket IDs) + explicit instruction: recompute the frontier with these answers, pose the next round if decisions remain, otherwise write the ticket resolution. Because the copied prompt carries no question bodies, this context line is what a fresh session resumes from — keep the references precise.
3. **Per question** (template does this): one line — `- Qn (title): selected option` ("(la reco)" appended when it is the reco, "Autre (voir note)" for Other, options comma-separated on a `multi`), plus the note on its own line if any. With a note but no option checked, the note takes the answer's place on the line.

## Multi-round sessions: same URL

Round 2..n: write a new config (new `storeKey`, e.g. `…-r2`), regenerate **to the same output path**, republish — same file path updates the same URL. Pass a new `label` (`round-2`). Never mint a new artifact for a later round of the same session.

If the current conversation is not the one that published round 1, the same file path is NOT enough — pass the existing artifact's URL as the Artifact tool's `url` parameter (find it with `action: "list"` if needed), otherwise a new URL is minted.

## Language

UI chrome of the template is French (the author works in French); question content and prompt strings follow the user's language via the config.

## Common mistakes

| Mistake                                  | Fix                                                                             |
| ---------------------------------------- | ------------------------------------------------------------------------------- |
| Writing or editing the HTML directly     | Write the JSON config, run `generate.py`                                        |
| Reusing a `storeKey` across rounds       | Unique per ticket+round, or round 2 shows round 1's stale answers               |
| New artifact per round                   | Same output path + new `label` → same URL                                       |
| Prompt header without resume instruction | `promptContext` must tell the next agent to recompute the frontier and continue |
| Skipping `artifact-design`               | The Artifact tool requires loading it before publishing                         |
