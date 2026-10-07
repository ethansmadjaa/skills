---
name: get-context
description: "Load a ticket's state and decisions from Linear before working on it. Use on '/get-context ABC-123', 'get context', 'récupère le contexte du ticket'."
---

1. Resolve the ticket id from the argument, else from the branch name (`git rev-parse --abbrev-ref HEAD`), else ask.
2. Through the Linear MCP, read the issue in full (`get_issue`) with its comments, its parent and its related issues, then its `<ID> État & décisions` document (`list_documents`, query = the id, then `get_document`).
3. Report in a few lines: État, Décisions marked `ne pas rouvrir`, Ouvert, the linked PRs, and what the parent or related issues add. If no document exists, say so. End with a brief ready to paste for another agent: `Lis <ID> et son doc « État & décisions », puis le diff de la PR #<n>. Ne rouvre pas les décisions marquées. Tâche : <X>. À la fin, mets à jour le doc.`
4. Treat marked decisions as settled for the rest of the session: never reopen them, flag it if the code contradicts one.
