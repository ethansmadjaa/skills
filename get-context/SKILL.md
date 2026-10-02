---
name: get-context
description: "Load a ticket's state and decisions from Linear before working on it. Use on '/get-context ABC-123', 'get context', 'récupère le contexte du ticket'."
---

1. Resolve the ticket id from the argument, else from the branch name (`git rev-parse --abbrev-ref HEAD`), else ask.
2. Through the Linear MCP, read the issue (`get_issue`) and its `<ID> État & décisions` document (`list_documents`, query = the id, then `get_document`).
3. Report in a few lines: État, Décisions marked `ne pas rouvrir`, Ouvert, and the linked PRs. If no document exists, say so.
4. Treat marked decisions as settled for the rest of the session: never reopen them, flag it if the code contradicts one.
