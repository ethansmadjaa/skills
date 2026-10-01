---
name: write-spec
description: Write or revise a concise technical design spec from settled brainstorming decisions. Use when a discussion is ready to become an architecture and data-flow document, in Markdown or HTML.
---

# Write Spec

Make the design reviewable at a glance: a technical map, concrete contracts, and the few rules that govern them. The reader should understand what will be built without reading the conversation.

## 1. Establish the evidence

Recover the goal, constraints, decisions, and exclusions from the conversation or supplied notes. Later explicit corrections supersede earlier decisions. In an existing project, inspect the relevant code and conventions to identify the flow, dependencies, and file locations to reuse.

Distinguish **existing**, **modified**, and **proposed** elements. Verify claims about existing code; label fictional or notes-only context as such. Recommend concrete technical choices even when no implementation exists yet, identifying them as proposals rather than approved decisions. Preserve product requirements: a new limit or acceptance rule is a product proposal, not an engineering default.

This step is complete when each material choice is either grounded in evidence, explicitly proposed, or identified as an unresolved product decision. For unresolved decisions, write the settled parts as a draft and ask the smallest question needed; keep that question visible in the document.

## 2. Draw the technical map

Write in the user's language. Start with the problem and recommended solution in two or three sentences. Follow with a small Mermaid diagram or arrow chain connecting the actual entry point, frontend, backend, storage, and relevant services. Show return paths or asynchronous work when they matter.

Choose the smallest visual that answers the design question: a flow/sequence diagram for interactions, a shallow component or file tree for ownership, a short before/after diff for a localized change, or pseudocode for a branching rule. Keep relevant labels, state, and boundaries; place each visual beside its explanation. Use only the views the reader needs.

Then use compact tables to describe the affected layers. Omit layers the change does not touch:

| Layer | Detail the reader needs |
| --- | --- |
| Screen and files | User-facing URL, component, and relevant paths; mark new paths as proposed. |
| API | Method and route, purpose, essential request/response fields and types, handler location, and authorization boundary. |
| Data | New table/collection or changed fields; principal fields with types, required/nullable status, keys, and relationships. Include indexes or migrations only when they shape the solution. |
| Infrastructure | Resource kind and logical name, access model, object-key/file-path pattern, and what lives there versus in the database. |
| Libraries and services | Existing dependency reused and its role; justify any proposed addition against existing capabilities. |

The diagram explains connections; the tables explain contracts. Put each detail in one place. Choose names and interfaces concrete enough to review instead of deferring the entire architecture to planning. Existing physical resource names come from evidence; new resources get proposed logical names.

This step is complete when the reader can follow one action from the screen to its persisted data and identify the components, routes, types, files, and dependencies involved, where applicable.

## 3. State the governing rules

Add concise bullets for relevant validation, access control, state changes, failure/recovery behavior, and exclusions. Describe observable acceptance checks for the main journey and consequential failures. Explain alternatives only when the tradeoff helps assess the recommendation.

For a single feature, aim for roughly 400–700 words including tables. Expand only for decisions that cannot be understood safely at that length. Keep the detail at architecture and contract level; implementation bodies, exhaustive schemas, task sequences, and operational runbooks belong to later work.

Keep one spec focused enough for one coherent implementation plan. If the discussion spans independent subsystems, expose their boundaries and dependencies and identify which agreed subsystem this spec covers.

## 4. Check and deliver

Use Markdown by default. For an HTML request, follow [references/html.md](references/html.md); both formats express the same design. Save to the user's requested location, otherwise the project's spec convention, otherwise `docs/specs/YYYY-MM-DD-<topic>-design.md` (or `.html`) using the current date. If file writing is unavailable, provide the document source in chat.

Read the saved document against the source decisions. It is ready for review when:

- Every settled requirement is represented and later corrections are reflected.
- The map, contracts, and acceptance checks describe the same behavior.
- Proposals and unverified context are distinguishable from established facts.
- No contradictory or unresolved behavior is presented as decided.
- Repeated prose and details that do not help assess the structure have been removed.

Fix issues inline. A remaining product decision means **draft**, with the concrete question; otherwise use **ready for review**. Return the file link and a brief description. Incorporate subsequent feedback in the same document. User approval is distinct from review readiness.

Independent review is optional: when requested, give a fresh reviewer the spec and source decisions and ask for issues that could cause an incorrect plan. Resolve findings against the evidence.

The deliverable is the spec. Commit, publish, or proceed to implementation planning only when the user's instructions include that work.

## Attribution

Design coverage and review criteria adapted from [obra/superpowers brainstorming](https://github.com/obra/superpowers/blob/8ca22dba9a94f28898bbce59f2537ff4d87c747d/skills/brainstorming/SKILL.md) and its [reviewer prompt](https://github.com/obra/superpowers/blob/8ca22dba9a94f28898bbce59f2537ff4d87c747d/skills/brainstorming/spec-document-reviewer-prompt.md). Original work © 2025 Jesse Vincent, MIT; see [LICENSE](LICENSE). This standalone extraction uses the project's output convention and excludes the automatic commit and Superpowers planning handoff.

Instruction structure informed by [writing-for-agents](https://github.com/mattpocock/skills/blob/main/skills/productivity/writing-for-agents/SKILL.md); visual selection informed by [show-me](https://github.com/humanlayer/skills/blob/main/plugins/show-me/skills/show-me/SKILL.md).
