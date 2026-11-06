---
name: ai-engineering
description: Router for LLM and agent engineering work. Use when writing or debugging a system prompt, a tool description or tool result, tool choice or tool order in an agent loop, a prompt for a reasoning (thinking) model, a brief for a long-running agent or subagent, or when the model picks the wrong tool, skips a tool, or narrates instead of acting. Names the one source to read for each case.
---

# AI engineering

This skill holds no technique of its own. Find the row that matches the problem, read that
source, and only that source. Read a second one only when the first does not answer.

Paths are relative to this file. A name in backticks with no path is an installed skill:
call it with the Skill tool. If it is not installed, say so and continue with the next best row.

## Where to go

| The problem                                                                           | Read                                                                                                                    |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| The model picks the wrong tool, or calls it with bad inputs                           | `vendor/tool-design/SKILL.md`                                                                                           |
| Writing a tool description, a schema, a tool result or an error message               | `vendor/tool-design/SKILL.md`, then `vendor/tool-design/references/best_practices.md`                                   |
| Too many tools, overlapping tools, merge or split a tool                              | `vendor/tool-design/SKILL.md`, section "The Consolidation Principle"                                                    |
| The model calls the right tools in the wrong order, or skips a read before it answers | See [Tool order](#tool-order) below                                                                                     |
| Writing or rewriting one instruction of a system prompt                               | See [Write the instruction](#write-the-instruction) below                                                               |
| A block grew by patches and no one can say in one sentence what it asks               | See [Rewrite a patched block](#rewrite-a-patched-block) below                                                           |
| The model misreads, confuses or ignores data it was given                             | See [Data before words](#data-before-words) below                                                                       |
| The model has the data and still breaks a rule it can follow                          | See [Smallest prompt fix](#smallest-prompt-fix) below                                                                   |
| The model has a per-user fact (history, profile) but uses it only when asked          | See [Facts to use unasked](#facts-to-use-unasked) below                                                                 |
| Testing a prompt change against real cases                                            | See [Measure a prompt change](#measure-a-prompt-change) below                                                           |
| Prompt for a reasoning model (thinking on, effort dial)                               | See [Reasoning models](#reasoning-models) below                                                                         |
| The output is weak and you do not know which line of the prompt or data caused it     | See [Read the thinking trace](#read-the-thinking-trace) below                                                           |
| Prompt for Claude Haiku 5.5: effort level, thinking, JSON output, refusals            | [Prompting Claude Haiku 5.5][haiku-5-5]                                                                                 |
| Brief for a long autonomous run, a subagent, or an orchestrator                       | `vendor/long-horizon-prompting/SKILL.md`, template in `vendor/long-horizon-prompting/references/task-brief-template.md` |
| The agent stops early, returns a partial answer, or claims work it did not do         | `vendor/long-horizon-prompting/SKILL.md`, sections "Non-counting outcomes" and "Stop Conditions"                        |
| Few-shot examples, output format, prompt templates, a single-call prompt              | `prompt-engineering-patterns`                                                                                           |
| Claude API facts: model ids, thinking parameters, tool use, caching, pricing          | `claude-api`                                                                                                            |
| Prompt for an OpenAI model                                                            | `references/openai-prompting.md`                                                                                        |
| Vercel AI SDK: `streamText`, tool calling, `stopWhen`, provider options               | `vercel:ai-sdk`                                                                                                         |
| Writing a skill, an `AGENTS.md` or a `CLAUDE.md`                                      | `mattpocock-skills:writing-for-agents`                                                                                  |

## Tool order

No source covers this case well. Use these in order:

1. `vendor/tool-design/SKILL.md`. Its answer is structural: if the order matters, merge the
   calls into one tool, or make the second tool refuse without the output of the first. A
   rule in prose is the weakest fix.
2. The "Tool use" part of the vendor doc for the model in use. For Claude:
   https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
3. If the order must stay in the prompt, state the reason for the order, not only the order.
   Then measure.

## Reasoning models

No skill covers this. Use the vendor doc for the model in use:

- Claude: the "Thinking" and "Model-specific guidance" parts of the page above.
- Claude Haiku 5.5: its own page, [Prompting Claude Haiku 5.5][haiku-5-5]. Effort replaces the
  thinking budget, thinking counts toward `max_tokens`, and a prompt line asking for a direct
  answer does not stop the thinking: lower the effort instead.
- OpenAI: `references/openai-prompting.md`, section "First, which kind of model".

Both vendors agree on these points: give the outcome, the constraints and the completion
bar, and leave the path to the model. Step-by-step scripts and stacked MUST/NEVER rules make
current models worse. Do not ask a reasoning model to "think step by step".

## Read the thinking trace

On a reasoning model, read its thinking before you change a word of the prompt. The trace
names the rules it applied, the data it trusted, and the trade-offs it made. The output
alone hides all three.

1. Get the trace. In the Vercel AI SDK, `generateText` returns it as `reasoningText` (and the
   `reasoning` parts). Claude models return a summary of the thinking, not the raw tokens,
   which is enough for this. Save one trace per case, beside the exact prompt sent.
2. Read several cases before you conclude. A pattern seen in most traces is a prompt
   problem; a pattern seen once is noise.
3. Look for a rule applied to the wrong subject. An instruction written for one speaker
   (the assistant's tone, "address the customer as tu") is applied to text written in
   another speaker's voice. Say who speaks in each part of the output.
4. Look for a number the model works toward. A stated limit ("at most 80 characters") is a
   target, not a ceiling: the model fills it, and trims only when it passes it. Put the
   prompt limit at the limit the code enforces, never above it.
5. Look for data the model distrusts. It says when the input contradicts itself (a
   description that belongs to another item) and what it did instead. That is a data bug
   to fix upstream, not a prompt fix.
6. Look for the rule it quotes most. If it plans around a rule you meant as a fallback,
   that rule reads as the main one: narrow its condition.
7. Look for a copied example. An example given beside a rule becomes the default answer for
   that rule: the same opening words or the same topic come back on most cases. Give the
   role without a sample phrasing, or several samples that differ in shape.
8. Check a length it claims to check. "Checking each stays under 80 characters" does not mean
   it counted: models do not count characters. State the limit in words, which it can hold,
   and let the code enforce the character ceiling.
9. Look for a gap it notices and crosses anyway ("even though X is not stated"). The rule it
   broke reads as optional: say what to do instead (drop the topic), not only what is true.
10. No trace comes back (a structured-output route, a provider that drops the reasoning
    parts): send the same system prompt and the same input once more without the output
    schema, and ask in prose, per item, whether it qualifies and which sentence of the
    instructions it applied. One such answer names the close call. A tie the model keeps in
    prose, it drops in JSON mode: decide the tie in the prompt ("the fault needs both
    halves"), never leave it to the model.
11. Check that the route lets the model think. A JSON output served through a forced tool
    runs some models without thinking, and the rules then slip; native structured output
    with an effort level keeps it. Fix the route before any word of the prompt.

## Write the instruction

An instruction describes a behavior the model can carry out on every input, in words a
reader gets on the first pass.

1. Short words, one idea per sentence. When a long instruction fails, rewrite it from
   scratch rather than patch it: five short sentences beat one dense paragraph.
2. Describe the behavior, not the mechanism. The model does not need the name of the
   field, the ref or the block that carries the data. Say what it does with it: read both,
   answer first, name each one, show both.
3. Never describe the test case. An instruction that lists the scenario it was written
   for ("two versions with a different cut", "if one is in the cart, ask who it is for")
   passes that case by construction and proves nothing elsewhere. Same for an example
   lifted from the case: it becomes the default answer (see
   [Read the thinking trace](#read-the-thinking-trace), item 7). Write the rule for every
   input, with no example from the case.

   Before you save the edit, compare its words with the case: the shop, the product names,
   the colours, the sizes, the language pair, the user's message, the wrong answer you saw.
   If one of them is in the prompt, remove it. An example with a product from the test
   ("'Stone jersey cardigan' becomes 'le cardigan Stone', never 'pierre'", written while
   testing on that shop) passes the test because the test is in the prompt. If the rule needs
   an example, invent one from another domain, or give none.

4. A sentence about the state carries implications. "They see this product on screen" lets
   the model say they already see every variant. Say what is true and only that: "in one
   variant only".
5. A style rule holds for the whole output, not for the part you were fixing. Check the
   opening sentence and the closing one against it, not only the middle.

## Rewrite a patched block

Each failure adds one sentence where it happened. After a few, the block is a chain of
conditions ("when X, do Y; only when none is, Z: another A can still..."). A person cannot
say what it asks, and the model follows the one plain order in it and skips the data
beside it. Another sentence makes it worse.

1. Dump the block as the model reads it, in one file: one real rendered example, then each
   fixed sentence with when it is sent and the case it was added for (the code comment
   above it). The source code is the wrong view: the sentences sit in separate functions
   and the order is in another file.
2. Read the dump as a newcomer. If you cannot say what the block asks in one sentence, it
   needs a rewrite, not a patch.
3. Let a person rewrite it by hand, from zero: the main path first, one idea per sentence,
   no nested "only when". Keep the old reasons as test cases, not as words in the prompt.
4. Look for data that no sentence explains. A block of related items with no sentence that
   says what it is for loses to the one sentence that names an action ("search"), even
   when the answer is in that block.
5. Rerun every case the old sentences were added for, beside the new one.

What a hand rewrite usually removes first, each measured as safe on a rewrite that also fixed its target case:

- **Behaviour headers inside a tool result** ("speak from it, never cite it", "your own advice"). A tool result carries data under tags that name it. The model did not cite the source once they were gone.
- **A rule written for one tenant's case, sent with every item.** It fires on every read and shapes answers it was never meant for. Keep the case as a test, not as a sentence.
- **A sentence that explains what the data already shows** ("each value is on at least one row below"). The rows say it.
- **Two versions of one rule for two readers.** One wording, one code path.
- **A limit said in several places.** Say it once where the model uses it (the parameter), enforce it in code.

What it adds instead: **a fact the code computes, written into the data** ("Brown (sold out)" on the option list). A rule asking the model to cross-check scattered rows failed where that one marker held. Then name each tag after what it holds, and indent the block so a person can read it.

## Data before words

Before you write a sentence about the data, look at the data.

1. Show the data in its own shape instead of explaining it. A block that carries the
   field under the name the source gives it replaces the sentence that describes the link.
   The name says the link, and the explanation goes.
2. Read the real tool result before you describe it. A description written from the code
   is wrong as soon as the data has one more shape than the code suggested (a second
   field with the same type, a title shared by two items).
3. A prose defect can come from the data. When the model writes "item 1 / item 2", the two
   items had the same title and it had only an id to tell them apart. The fix is the shape
   of the data, then one instruction; never a filter in code on the output.
4. The snapshot must show what the model reads. A fixture with no data in the field under
   test yields a snapshot that shows neither the data nor the instruction, and the test
   proves nothing. Put the data in the fixture, then read the diff.
5. Code that drops part of the model's output after the fact (a duplicate card, an item
   already on screen) leaves the model believing it showed it. Either tell the model, or
   do not drop.

## Smallest prompt fix

Before you add words, look for the reason the model ignores the words already there.

1. Prove the test sends the prompt you edited. Search the request trace for the new
   sentence. A run on an old bundle measures only noise.
2. Check the model sees the data. Read the tool results it got, not the code.
3. Read the per-tenant layer before you touch the fixed prompt. A tenant's own
   instructions ("no negative phrasing", "say it when the information is missing", a tone
   setting) explain a missing "no" or a disclaimer the fixed prompt never asked for.
4. Compare with another tenant on the same code. If one answers well and the other does
   not, the defect is in the configuration, not in the code or the fixed prompt.
5. Look for a contradiction. Search the full prompt for the words of the failure. A general
   rule far from the brief often forbids what the brief asks, and the model obeys the
   general rule. Adding more rules to the brief changes nothing while that rule stands. A
   disclaimer at the end of a good answer comes from a sentence that asks for it: narrow
   that sentence, do not stack a counter-rule.
6. Fix the conflict first: add an exception to the general rule. Then add one short
   sentence where the rule applies. Remove each extra word that did not change the result.
   If the exception does not hold, see [Facts to use unasked](#facts-to-use-unasked).
7. Do not move to a new tool or more reasoning effort while a contradiction stays in the
   prompt.
8. The fixed prompt serves every tenant. A rewrite of a shared rule for one tenant's case
   puts every other tenant at risk: keep it out of the fix, and open it on its own.

## Facts to use unasked

A fact about the user that they never said in the conversation (their history, their
profile, their settings) loses to general rules such as "base it on what they said" or "do
not assume". The model uses it when asked about it, and drops it everywhere else.

1. Frame the data as known, in the block that carries it: "count it as something they told
   you". A framing sentence does more than a list of uses, and a list of uses grows each
   time a case fails.
2. Keep the rule next to the data. An exception written into the general rules of a long
   fixed prompt is read as background and holds less than the same words next to the data.
3. Put the fact where the decision is made, computed by code: in the tool result the model
   reads just before it decides. Code matches the record by id and writes one line ("the
   user already has this item, in this variant"). The model no longer has to link a list far
   above to the item in front of it.
4. Write a tool result line as a fact, not an order. Models treat instructions inside tool
   outputs as information.
5. Keep in the block only the uses that no tool call comes before. A decision taken before
   any read (a vague first request) can only use the block.

Sources: Anthropic, Effective context engineering for AI agents (hybrid strategy, just in
time context): https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents ·
OpenAI, Function calling guide ("offload the burden from the model and use code where
possible"): https://developers.openai.com/api/docs/guides/function-calling · OpenAI Model
Spec (instructions in tool outputs are information): https://model-spec.openai.com/2025-12-18.html ·
OpenAI, GPT-5 prompting guide (contradictory rules hurt this model family):
https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide · Chroma, Context
Rot (a fact that shares few words with the question is missed):
https://www.trychroma.com/research/context-rot · Zhao et al., PrefEval, ICLR 2025 (user facts
used unasked; a reminder next to the question beats a fact far back):
https://arxiv.org/abs/2502.09597 · Anthropic, A statistical approach to model evaluations:
https://www.anthropic.com/research/statistical-approach-to-model-evals

## Measure a prompt change

A prompt change is a behavior change. Measure before and after on real cases.

1. The runner sends what the client sends. The same text with another source tag, without
   the page context or without the history is another prompt, and the run tests that one.
   Copy the client's request shape into the runner before the first run.
2. Prove which code answered. Search the deployed bundle for the new sentence, wait for
   fresh workers, and throw away a run that overlaps a rebuild.
3. Play live when the model asks questions. A fixed script answers "other colors?" to a
   question about size, and the rest of the run measures nothing. Read each answer and
   reply as the user would.
4. One run first, then three to five. On a reasoning model the same case flips between
   runs, so never compare two wordings on one run per case. A defect seen once in nine runs
   is not proven fixed by zero in three. Call a version better only if no case drops and it
   gains clearly (about 4 runs in 15), not 1 or 2.
5. When you shorten a prompt, cut one sentence at a time and rerun the cases it served. A
   sentence that looked redundant is often the only one that carried a case.
6. Hand over the transcripts, not only a count. The person who judges reads the answers
   as the user saw them.

## Rules

- A fix that holds on one model can fail on another. Name the model in every result.
- The vendored files are third-party and dated. See `vendor/UPSTREAM.md`. When they
  contradict the vendor doc of the model in use, the vendor doc wins.

[haiku-5-5]: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-haiku-5-5
