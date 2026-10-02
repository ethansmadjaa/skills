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
| Prompt for a reasoning model (thinking on, effort dial)                               | See [Reasoning models](#reasoning-models) below                                                                         |
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
- OpenAI: `references/openai-prompting.md`, section "First, which kind of model".

Both vendors agree on these points: give the outcome, the constraints and the completion
bar, and leave the path to the model. Step-by-step scripts and stacked MUST/NEVER rules make
current models worse. Do not ask a reasoning model to "think step by step".

## Smallest prompt fix

Before you add words, look for the reason the model ignores the words already there.

1. Prove the test sends the prompt you edited. Search the request trace for the new
   sentence. A run on an old bundle measures only noise.
2. Check the model sees the data. Read the tool results it got, not the code.
3. Look for a contradiction. Search the full prompt for the words of the failure (here:
   total, budget, price). A general rule far from the brief often forbids what the brief
   asks, and the model obeys the general rule.
4. Fix the conflict first: add an exception to the general rule. Then add one short
   sentence where the rule applies. Remove each extra word that did not change the result.
5. Do not move to code, a new tool or more reasoning effort while a contradiction stays in
   the prompt.

Case: a shopping agent went over the shopper's budget. Three long budget rules in the brief
changed nothing. The system prompt said "Never compute a ... total". With an exception for
the budget sum, one short clause was enough. The first three runs were void: they ran on an
old bundle.

## Rules

- A prompt change is a behavior change. Measure before and after on real cases. Do one run
  first, then scale.
- A fix that holds on one model can fail on another. Name the model in every result.
- The vendored files are third-party and dated. See `vendor/UPSTREAM.md`. When they
  contradict the vendor doc of the model in use, the vendor doc wins.
