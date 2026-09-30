---
name: widget-render-preview
description: "Montre le rendu réel du widget Ralph dans le navigateur pour une conversation (conversationId staging ou prod) ou une maquette décrite : génère un script de console qui injecte les lignes dans le widget et le met dans le presse-papier. Déclencheurs : 'voir le rendu', 'montre-moi dans le navigateur', 'preview widget', 'à quoi ça ressemble', ou après un rejeu où l'ordre texte/cartes, un doublon ou un carrousel compte."
---

# widget-render-preview

Le widget restaure son historique depuis `sessionStorage['just-ai-agent-state']` au chargement, sans rien rejouer. Tu remplaces `messages` dans cet état, tu mets `open: true`, et la page recharge : Ethan **voit** le rendu, ordre des blocs compris.

**Sortie** : un script de console dans le scratchpad de la session, copié dans le presse-papier.

```
widget-render-preview/
  preview.mjs          le générateur (Node, zéro dépendance)
  preview.test.mjs     ses tests : node --test preview.test.mjs
  examples/maquette.json   une maquette à copier
```

## 1. Construire l'entrée

Deux sources, un fichier JSON chacune.

**Une conversation.** Lis-la avec `conversation-get` du MCP `ralph-staging` ou `ralph-prod`. Donne au générateur la sortie brute, telle quelle : un fichier par page. Un résultat MCP trop gros est déjà sauvé dans un fichier par Claude Code : passe ce chemin. Le générateur lit les events `user_message` et `assistant_message`, V2 (`data.message.parts`) comme V0 (`data.text`).

Une page avec des fragments (`of`, `offset`, `text`) ne se lit pas. Dans ce cas, écris à la main un tableau de lignes : pour chaque réponse, `{"role":"assistant","parts":[...]}` avec seulement les parts `text`, `tool-showProducts` et `tool-showLinks`.

**Une maquette.** Un tableau de lignes, comme `examples/maquette.json` :

- `{"role":"user","text":"…"}`
- `{"role":"assistant","text":"…"}` : une bulle de texte seule.
- `{"role":"assistant","blocks":[…]}` : les blocs dans l'ordre d'affichage. `{"kind":"prose","text"}`, `{"kind":"cards","recommendations":[…]}`, `{"kind":"links","links":[{"label","url"}]}`. Les `key` sont ajoutées.

Une carte suit `ZProductRecommendation` (`packages/api-schema/src/widget/chat-stream.ts`) : `handle`, `title`, `price` requis (le prix est une chaîne affichée, `"28,00 €"`). Optionnels : `imageUrl`, `reason`, `variantId`, `variantTitle`, `variantImageUrl`, `compareAtPrice`. Une carte sans `handle`, `title` ou `price` n'est pas affichée.

Pour une maquette que tu veux crédible, prends les vrais produits de la boutique (`https://<domaine>/products/<handle>.js` : titre, prix, image).

## 2. Générer

```bash
P=~/.claude/skills/widget-render-preview/preview.mjs
node $P <entrée.json> [page2.json …] --out <scratchpad>/widget-preview-<id>.js
```

La sortie dit le nombre de lignes et la suite des blocs de chaque réponse (`prose+cards+prose`). Vérifie que cette suite est celle que tu veux montrer. Puis `node --check` sur le fichier.

Le script est aussi dans le presse-papier (`pbcopy`). `--no-copy` l'en empêche.

## 3. Dire à Ethan

Une ligne, avec les deux étapes :

> Script dans ton presse-papier (`<chemin>`) : ouvre le widget une fois sur la page de la boutique, puis colle dans la console du même onglet.

Pour revenir à l'état normal : `sessionStorage.removeItem('just-ai-agent-state'); location.reload()`. Le script l'affiche aussi dans la console.

## Ce que la projection reprend du widget

Les parts V2 deviennent des blocs comme dans `toRows` (`frontend/widget-ui/src/agent/lib/rows.ts`) :

- part `text` : bloc prose, texte trimé, vide ignoré ;
- `tool-showProducts` en `output-available` : bloc cards avec `output.products`, une carte déjà montrée dans la même réponse (même `handle` et `variantId`) retirée ;
- `tool-showLinks` : bloc links ;
- réponse en ajout automatique (`metadata.autoAddToCart`) avec un `tool-addToCart` : aucune carte, comme le widget.

Pas repris : les chips de `proposeReplies` et leur carte de sélection, le bouton d'ajout au panier, le récap d'achat (`purchaseToolCallId`), la carte de confirmation du panier. Pour juger un de ces rendus, regarde le vrai widget.

## Pièges

- `sessionStorage` vit par onglet. Ouvrir le widget et coller le script dans le **même** onglet.
- Sans session valide (widget jamais ouvert, session expirée), le script ne touche à rien et le dit par un `console.warn`. Au rechargement, le widget jette un état sans `session.expiresAt`, sans `session.streaming.url` ou expiré.
- Le serveur garde la vraie conversation de la session. Ne pas envoyer de message après l'injection : la réponse partirait d'un autre historique. Revenir à l'état normal d'abord.
- Le script écrit seulement `messages` et `open`. Il ne lit ni n'affiche `session`, qui porte le JWT.

## Données

Le script généré contient les messages de la conversation. Il reste dans le scratchpad et le presse-papier : ne le colle pas dans un ticket, une PR ou ce repo. Tout exemple ajouté à ce skill est une maquette inventée : pas de texte d'acheteuse, pas de token, pas d'URL de boutique réelle.
