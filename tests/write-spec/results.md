# Essais de write-spec — 1er octobre 2026

Deux sous-agents indépendants, sans historique de la conversation principale, ont reçu le même skill et chacun une fin de brainstorming fictive. Ils ont produit les documents ci-dessous dans des dossiers temporaires isolés. Les résultats sont conservés tels que générés, sans retouche éditoriale.

## Résultats observés

| Cas | Entrée | Document produit | Relecture du résultat |
| --- | --- | --- | --- |
| Décisions complètes, dont une correction tardive | [Conversation](complete-input.md) | [Vues privées](complete-spec.md) | Conforme : la confirmation remplace la suppression immédiate ; les filtres vides remplacent les valeurs courantes ; isolation des comptes, plafond de 10 en concurrence, conservation de saisie et essais manuels sont repris. Le contexte est déclaré fictif, sans noms de fichiers ni routes inventés. |
| Décision produit non tranchée | [Conversation](ambiguous-input.md) | [Notes internes](ambiguous-spec.md) | Conforme : le document conserve les décisions acquises, affiche son statut de brouillon et laisse les deux options ouvertes. Le sous-agent demande directement si les notes doivent être immuables ou modifiables pendant 15 minutes. |

Le premier sous-agent a livré la spec comme « prêt pour revue », sans la déclarer approuvée. Le second a posé la question non résolue. Aucun des deux n'a écrit de code applicatif ou de plan d'implémentation.

Le validateur `quick_validate.py` du skill-creator Codex a également terminé avec le résultat `Skill is valid!` (code de sortie 0).

Ces deux essais vérifient des comportements sur des exemples fictifs ; ils ne prouvent pas la qualité de toutes les futures specs ni l'exploration d'un dépôt réel.

## Rejouer

Donner à un nouveau sous-agent le fichier `write-spec/SKILL.md` et l'une des conversations ci-dessus, dans un dossier temporaire vide. Lui demander d'exécuter la demande, sans lui fournir les résultats précédents ni ce compte rendu. Relire son document contre les décisions de la conversation : couverture, contradictions, ajouts non décidés, statut annoncé et question restante.
