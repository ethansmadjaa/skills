---
name: grill-form
description: Use when the user wants to answer a round of grilling/interview/design-review questions through an HTML form instead of chat — "un html avec des inputs pour chaque question", "answer these questions in a form", "copy my answers as a prompt", or when they want to answer a question round asynchronously and hand the answers to another agent session.
---

# Grill Form

## Overview

Turn the current question round (grilling skill, design review, any Q1..Qn with recommendations) into a self-contained HTML page: one radio group and one note per question, and a button that copies the answers as a short block. The human pastes that block into the chat, and it drives the next round.

**Never write the HTML yourself.** You only write a small JSON config; `generate.py` merges it into the bundled `template.html`. The template never enters context.

## Screen the round first

Before you show the form, screen every question:

- A question whose answer changes nothing (a fact, a standard, an earlier decision) leaves the round. Report it as decided, with its reason, in your chat line.
- A recommendation that rests on a claim you have not read yourself: read the source first, then write the recommendation.

## Workflow

1. **Write the config**: a JSON file in the scratchpad (shape below). Tag the recommended option of each question `"reco": true`. The template adds the "Autre" radio and the note field itself.
2. **Generate**:
   ```bash
   python3 <skill dir>/generate.py <config.json> <output.html>
   ```
   It validates the config (required keys, exactly one reco per question) and exits non-zero without writing anything when the config is wrong.
3. **Show it**, by session type:
   - **Orca chat session** (`ORCA_CHAT_SCRATCH_DIR` is set): copy the output into `$ORCA_CHAT_SCRATCH_DIR` under a **new name every time** (letters, digits, `.`, `_`, `-` only, ends in `.html`, under 512 KB), e.g. `abc123-grill-r2.html`. Then put this line in the reply, alone on its line, **outside any code block**:

     ::orca-visual{file="abc123-grill-r2.html" title="T9 · Grill round 2"}

     `file` is the bare file name, never a path.

   - **Terminal session**, or a page that loads files beside it (the inline frame cannot load a sibling file): open a tab.
     ```bash
     orca tab create --url "file://<absolute path of output.html>" --json
     ```
4. **Say one line in chat**: what waits and where the form is. Do not write the round in chat. A reply typed in chat is accepted, never required.
   - Inline frame: tell the human only about the copy button. Nothing persists there.
   - Tab: tell them the answers persist in their browser.

The human ticks an answer per question, adds notes, presses the copy button and pastes the block into the chat. **Copy then paste is the only channel back.** No path goes from the inline frame to the chat: not the visual, not the plugin API, not the CLI.

## Config shape

```json
{
  "title": "T9 — Allowlist data model · Grill round 1",
  "eyebrow": "Map ABC-100 · Ticket T9 (ABC-123) · Grill round 1",
  "heading": "Data model of the allowlist",
  "lede": "7 decisions on the frontier. Tick one option (or Other), then copy the answers and paste them in the chat.",
  "storeKey": "abc123-grill-r1",
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

`"multi": true` is optional: checkboxes instead of radios, several options at once, all copied on the question's line. Still exactly one `"reco": true`.

`storeKey` is new for every ticket and every round (`…-r1`, `…-r2`): it namespaces localStorage, and a reused key shows the previous round's stale answers. Body, reco and labels take mini-markdown, never HTML: `\n` = line break (blank line = paragraph), lines starting `- ` render as bullets, `` `code` `` and `**bold**` render inline. Keep bodies short: a one-line intro plus 3-5 bullets beats a paragraph.

## The copied block

Answers and notes only, one line per question, no header, no question text: you already hold the questions.

```
- Q1 (Short title): (a) the label of the chosen option (recommended)
  Note: the human's note, if any
- Q2 (Short title): Other (see note)
  Note: …
- Q3 (Short title): - no option selected -
```

`(recommended)` follows an option that carried `reco: true`. `Other (see note)` is the "Autre" radio. Options of a `multi` question are comma-separated. A question with no choice still gets its line, and its note goes on the `Note:` line below.

## The inline frame is a sandbox

The Orca inline frame has an opaque origin. Reading or writing `localStorage` throws a `SecurityError`, and `navigator.clipboard.writeText` rejects with `NotAllowedError`. The template catches both: storage is skipped, and the copy falls back to a selected textarea plus `document.execCommand("copy")`. The page uses one script block, no module, no external resource, no network call, and nothing sized to the viewport (Orca fits the frame to the content).

After any change to `template.html` or `generate.py`, run `./check.sh`. It runs the page's script in a fake frame that denies storage and the clipboard and asserts the copy still produces the block, then asserts a config with no reco makes the generator fail without writing.

## Language

UI chrome of the template is French (the author works in French). Question content follows the user's language via the config. The copied block's fixed words (`recommended`, `Other (see note)`, `no option selected`) are English, for the receiving agent.

## Common mistakes

| Mistake                                     | Fix                                                               |
| ------------------------------------------- | ----------------------------------------------------------------- |
| Writing or editing the HTML directly        | Write the JSON config, run `generate.py`                          |
| Reusing a `storeKey` or an inline file name | New key and new file name for every round                         |
| A path in `file=` of `::orca-visual`        | Bare file name only                                               |
| The `::orca-visual` line in a code block    | Alone on its own line, outside any code block                     |
| Writing the round's questions in chat       | One line in chat; the questions live in the form                  |
| A question whose answer changes nothing     | Report it as decided, leave it out of the form                    |
| Telling the human answers persist inline    | Inline: only the copy button. Tab: answers persist in the browser |
