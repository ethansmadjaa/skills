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
| The model has the data and still breaks a rule it can follow                          | See [Smallest prompt fix](#smallest-prompt-fix) below                                                                   |
| The model has a per-user fact (history, profile) but uses it only when asked          | See [Facts to use unasked](#facts-to-use-unasked) below                                                                 |
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

## Smallest prompt fix

Before you add words, look for the reason the model ignores the words already there.

1. Prove the test sends the prompt you edited. Search the request trace for the new
   sentence. A run on an old bundle measures only noise.
2. Check the model sees the data. Read the tool results it got, not the code.
3. Look for a contradiction. Search the full prompt for the words of the failure. A general
   rule far from the brief often forbids what the brief asks, and the model obeys the
   general rule. Adding more rules to the brief changes nothing while that rule stands.
4. Fix the conflict first: add an exception to the general rule. Then add one short
   sentence where the rule applies. Remove each extra word that did not change the result.
   If the exception does not hold, see [Facts to use unasked](#facts-to-use-unasked).
5. Do not move to a new tool or more reasoning effort while a contradiction stays in the
   prompt.

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
6. Never compare two wordings on one run per case. On a reasoning model the same case flips
   between runs. Run each fragile case three times; call a version better only if no case
   drops and it gains clearly (about 4 runs in 15), not 1 or 2.
7. When you shorten a prompt, cut one sentence at a time and rerun the cases it served. A
   sentence that looked redundant is often the only one that carried a case.

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

## Rules

- A prompt change is a behavior change. Measure before and after on real cases. Do one run
  first, then scale.
- A fix that holds on one model can fail on another. Name the model in every result.
- The vendored files are third-party and dated. See `vendor/UPSTREAM.md`. When they
  contradict the vendor doc of the model in use, the vendor doc wins.

[haiku-5-5]: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-haiku-5-5
