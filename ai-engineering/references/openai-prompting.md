# Prompting OpenAI models

Merged from two sources. When they disagree, the official guide wins.

| Source                                                   | What it gives                                                        | Where                                                                        |
| -------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| OpenAI "Prompt engineering" guide, fetched 2026-09-28    | Roles, message structure, reasoning vs GPT models, agentic practices | https://developers.openai.com/api/docs/guides/prompt-engineering             |
| `codex:gpt-5-4-prompting` (Codex plugin for Claude Code) | Prompt contracts as XML blocks, anti-patterns, ready recipes         | Installed skill; its `references/prompt-blocks.md` holds the full block list |

For the latest model, the official page to read next is
https://developers.openai.com/api/docs/guides/latest-model. For reasoning models:
https://developers.openai.com/api/docs/guides/reasoning-best-practices.

## First, which kind of model

This choice changes everything below.

| Kind                                        | Treat it like      | Prompt it with                                                              |
| ------------------------------------------- | ------------------ | --------------------------------------------------------------------------- |
| Reasoning model (effort dial on)            | A senior co-worker | The goal, the constraints, the completion bar. Leave the path to the model. |
| GPT model (no reasoning, or effort minimal) | A junior co-worker | Precise instructions, the logic and the data needed, examples.              |

Do not raise reasoning effort first. Tighten the prompt and the verification rule, then
measure, then raise effort if the failure remains.

## Roles

- `developer` holds the rules and business logic. It wins over `user`.
- `user` holds the input those rules apply to.
- `instructions` applies to one request only. With `previous_response_id`, the
  instructions of earlier turns are not in context. Send them again.

## Shape of a developer message

In this order:

1. **Identity**: purpose, style, high-level goal.
2. **Instructions**: rules, what to do, what never to do, how to call tools.
3. **Examples**: inputs with the wanted output. Show a diverse range.
4. **Context**: data for this request. Put it last, because it changes per request.

Use Markdown headers for sections and XML tags for boundaries of content. Keep the same
tag names across the prompt.

Put the stable part first and the changing part last. Prompt caching matches on the prefix.

## Contracts, not nudges

State what done looks like. A prompt contract is a short named block. Add only the blocks
the task needs, then remove what repeats.

| Need                              | Block                             | Core sentence                                                                                                                                     |
| --------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Every prompt                      | `<task>`                          | The concrete job, the context, the expected end state.                                                                                            |
| The shape of the answer matters   | `<structured_output_contract>`    | Return exactly the requested shape and nothing else.                                                                                              |
| The model asks too many questions | `<default_follow_through_policy>` | Take the most reasonable low-risk reading and keep going. Stop only when a missing detail changes correctness, safety, or an irreversible action. |
| The model stops early             | `<completeness_contract>`         | Resolve the task fully. Do not stop at the first plausible answer.                                                                                |
| Correctness matters               | `<verification_loop>`             | Before finalizing, verify the result against the task and the tool outputs. If a check fails, revise.                                             |
| The model guesses                 | `<missing_context_gating>`        | Do not guess missing facts. Retrieve them with tools or state what remains unknown.                                                               |
| The model invents facts           | `<grounding_rules>`               | Ground every claim in the context or tool outputs. Label a hypothesis as one.                                                                     |
| The model stops reading too soon  | `<tool_persistence_rules>`        | Keep using tools until another targeted check would not change the answer.                                                                        |
| The model can write or act        | `<action_safety>`                 | Keep changes scoped to the task. Call out a risky or irreversible action first.                                                                   |

## Agents and tools

The official guide names three practices for agentic runs:

1. **Persistence**: tell the model to resolve the full request before it ends the turn.
2. **Preambles**: ask the model to say why it calls a tool, at notable steps only.
3. **Progress tracking**: a TODO tool or a rubric, so no step is missed.

It also says: give concrete examples of tool calls, and do not trust a tool that answers
"Done". Verify the effect.

Three traps when applying these:

- **Preambles become visible narration.** In a coding agent they help the operator. In a
  product where the end user reads the text, they leak the internal process. Do not add the
  preamble instruction there.
- **"Plan extensively" is for GPT models.** On a reasoning model it is an over-prescription
  and makes the output worse. Give the completion bar instead.
- **Persistence needs a verification gate.** "Do not stop until solved" with a loose
  success check produces confident wrong answers. See
  `../vendor/long-horizon-prompting/SKILL.md`.

## Anti-patterns

| Bad                                       | Better                                               |
| ----------------------------------------- | ---------------------------------------------------- |
| "Take a look and tell me what you think." | A `<task>` with the job and the end state.           |
| "Investigate and report back."            | An output contract: root cause, evidence, next step. |
| "Think harder."                           | A `<verification_loop>`.                             |
| Review, fix, document and plan in one run | One job per run.                                     |
| "Tell me exactly why it failed."          | `<grounding_rules>`; an inference is labeled.        |

## In production

- Pin a model snapshot. Two snapshots of one family can answer differently.
- Keep prompts in code, with typed inputs, review and tests. Reusable prompt objects
  (`v1/prompts`) shut down on 2026-11-30.
- Build an eval set before you change a production prompt.
- Do not read the text at `output[0].content[0].text`. The `output` array also holds tool
  calls and reasoning items. Use `output_text` or walk the array.
