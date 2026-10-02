# HTML spec

Produce one self-contained `.html` file that opens locally, offline. Preserve the source spec's decisions, status, and section order; conversion changes presentation only.

## Design the document

Use Claude's `artifact-design` guidance when available. Its design approach is summarized here so this skill also works without Claude's publishing tools. A publicly mirrored version is linked under Sources; it is not an official distribution.

Before coding, choose a compact design direction: named palette tokens, complementary display/body/code typography, and the layout that makes this particular architecture legible. Honor the project's visual system when one exists. Give the document the craft of a finished technical brief, with the architecture as its focal point and restrained treatment elsewhere.

Use actual routes, types, paths, and relationships as visual material. Separate frontend, backend, data, and storage where the architecture does. Let typography and spacing establish hierarchy; reserve a distinct surface for elements whose role warrants it. Keep repeated rows aligned and all reading content visible at rest. Navigation is useful only when it helps scanning the document.

## Render the content

Keep each visual near its explanation, following `show-me`: choose a flow for interactions, a shallow tree for ownership, or a small diff for a localized change. Use an accessible inline SVG or connected HTML blocks for the architecture; simple trees and pseudocode can stay preformatted. The map must render without a Mermaid runtime.

Use semantic HTML with the document language, UTF-8, viewport, a subject-specific title, one main heading, section headings, and real tables with column headers. Escape inserted text, including code and type brackets.

Use system font stacks with distinct roles, embedded CSS, and no external assets or build step. Static content needs no JavaScript. Let text wrap; contain horizontal scrolling within wide tables, code, or diagrams. Keep at least 16px outer gutters at phone widths and visible keyboard focus. Add print CSS.

Use a complete palette in `:root`. Support system dark mode with `:root:not([data-theme="light"])` inside `prefers-color-scheme: dark`, plus an explicit `:root[data-theme="dark"]` override. Components, diagrams, and the body background consume those same tokens. Print uses a legible light palette. An intentionally single-theme treatment should be explicit.

## Deliver

Confirm that the content matches the source and the file is standalone. If a browser preview is available, inspect the rendered page once and correct visible issues. Otherwise report that visual verification was unavailable. Return the local HTML link alongside Markdown when both were requested. Hosting or publishing is a separate user instruction.

## Sources

- [Claude artifact-design — public mirror](https://github.com/asgeirtj/system_prompts_leaks/blob/main/Anthropic/claude-code/skills/artifact-design/SKILL.md): treatment, typography, theme tokens, composition, and a single visual review. Adapted here for a local offline document, rather than a hosted Claude Artifact.
- [humanlayer/show-me](https://github.com/humanlayer/skills/blob/main/plugins/show-me/skills/show-me/SKILL.md): visual form chosen for the question and placed beside its explanation.
