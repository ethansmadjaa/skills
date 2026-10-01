# Révision write-spec — Markdown et HTML

## Instructions

La révision applique les principes de [writing-for-agents](https://github.com/mattpocock/skills/blob/main/skills/productivity/writing-for-agents/SKILL.md) : étapes avec conditions de fin observables, consignes regroupées et branche HTML chargée uniquement à la demande. Les principes de [show-me](https://github.com/humanlayer/skills/blob/main/plugins/show-me/skills/show-me/SKILL.md) orientent le choix du visuel selon la question, sa proximité avec le texte et le minimum de détails utiles.

Le format approuvé reste la cible : aperçu du problème, carte technique, fichiers et ressources, routes, champs typés, bibliothèques, règles structurantes. Une proposition technique reste distincte d'une décision produit.

## Essais indépendants

Trois sous-agents sans historique de la conversation principale ont utilisé le skill révisé. Résultats conservés sans retouche.

| Essai | Entrée | Résultat | Observation |
| --- | --- | --- | --- |
| Conception technique fictive | [Demande](technical-input.md) | [Spec](technical-spec.md) | Carte de flux, chemins proposés, routes, types, table SQL, clé S3 et dépendances présents. Statut prêt pour revue. 770 mots : un peu au-dessus de la cible indicative 400–700. |
| Décision non tranchée | [Demande](ambiguous-input.md) | [Brouillon révisé](refined-ambiguous-spec.md) | Les choix techniques sont proposés ; la décision immutable/modifiable 15 minutes reste ouverte, avec une question au demandeur et statut brouillon. |
| Conversion de l'aperçu approuvé | [Source Markdown](html-source.md) | [HTML](technical-preview.html) | Le contenu est préservé ; les cinq connexions de la carte sont rendues en HTML, sans moteur Mermaid. |

## Contrôles

- `quick_validate.py` : `Skill is valid!`, code de sortie 0.
- Comparaison du texte HTML avec les fragments du Markdown, hors source Mermaid et balisage : contenu préservé.
- Aucun script ni ressource externe ; langue française, styles pour petit écran et impression présents.
- Vérification visuelle navigateur non effectuée : le connecteur Chrome est bloqué par un profil déjà utilisé et aucun navigateur CUA n'est disponible. Les contrôles HTML ci-dessus sont statiques.

Les anciens résultats `complete-spec.md` et `ambiguous-spec.md` concernent la première version du skill. Ces essais fictifs ne constituent pas une validation d'intégration avec un dépôt applicatif réel.

Pour rejouer, donner à un sous-agent neuf le skill et une seule entrée dans un dossier temporaire vide, sans les résultats précédents. Comparer sa sortie aux décisions sources et vérifier la carte technique, les statuts et les propositions. Pour la conversion HTML, comparer le contenu à `html-source.md`.

## Présentation retenue après retour utilisateur

La branche HTML applique ensuite les principes d'artifact-design. L'[aperçu final](artifact-design-preview.html) a été approuvé par l'utilisateur. Les cinq sections de contenu sont identiques à la version précédente ; le schéma est remplacé par un SVG, avec sommaire et thèmes clair/sombre. Vérifications statiques : contenu conservé, aucune dépendance externe et ancres locales présentes. Cette révision visuelle a été réalisée après les essais des sous-agents ; aucun contrôle navigateur n'a été effectué.
