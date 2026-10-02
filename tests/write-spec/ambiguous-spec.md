# Notes internes sur les tickets

Statut : **brouillon — décision requise sur la modification après envoi**.

Cette spécification décrit un produit fictif à partir des seules décisions fournies. Aucun dépôt applicatif n’a été inspecté ; les responsabilités ci-dessous ne désignent pas des composants existants vérifiés.

## Objectif et périmètre

Permettre aux agents support d’ajouter et de consulter des notes internes sur les tickets de leur organisation, dans l’outil qui leur permet déjà de lire ces tickets.

Une note contient du texte brut, son auteur issu de la session et une date attribuée par le serveur. Elle ne déclenche aucun e-mail ni aucune notification. La suppression est exclue de la V1.

## Comportement acquis

Les agents d’une même organisation peuvent lire les notes des tickets de cette organisation. La création est réservée aux agents connectés appartenant à l’organisation du ticket. Un agent d’une autre organisation ne peut ni lire ni créer ces notes.

Le texte est obligatoire après suppression des espaces en début et en fin de saisie (`trim`) et limité à 2 000 caractères. Il reste du texte brut à l’affichage : son contenu n’est pas interprété comme du HTML.

Les notes sont présentées par date croissante. L’auteur est déterminé à partir de la session et la date par le serveur ; ces valeurs ne sont pas choisies par l’agent dans le formulaire.

## Responsabilités et parcours

L’interface du ticket affiche les notes accessibles et propose la saisie d’une note. Elle envoie le ticket concerné et le texte au serveur, puis affiche la note lorsque sa création est confirmée.

Le serveur vérifie la session, l’appartenance à l’organisation du ticket et la validité du texte avant de créer la note. Le stockage associe la note au ticket, à son auteur et à sa date serveur. La lecture applique la même frontière d’organisation et restitue les notes par date croissante. Le mécanisme de stockage et les interfaces techniques restent à déterminer lors de la planification, selon l’application réelle.

En cas d’erreur de création, l’interface conserve le texte saisi et propose un nouvel essai manuel. La présence d’un brouillon dans le formulaire ne vaut pas confirmation de création. Une saisie vide après `trim`, trop longue, ou provenant d’un agent non autorisé ne doit pas produire de note.

## Décision ouverte : modification après envoi

Deux possibilités ont été évoquées, sans choix :

- La note devient immuable dès l’envoi.
- Son auteur peut la modifier pendant 15 minutes.

Aucune des deux n’est retenue dans ce brouillon. Cette décision bloque la finalisation du comportement après création et des critères de vérification correspondants. Si la modification est retenue, ses modalités devront être précisées avant de planifier ce parcours ; le présent document ne les invente pas.

**Question à trancher : les notes doivent-elles être immuables dès l’envoi, ou modifiables par leur auteur pendant 15 minutes ?**

## Vérification des décisions acquises

Les vérifications doivent établir les résultats observables suivants :

- Un agent connecté peut créer une note sur un ticket de son organisation ; les autres agents de cette organisation peuvent la lire.
- Une session absente empêche la création. Un agent d’une autre organisation ne peut ni consulter les notes ni en créer, y compris en sollicitant directement le serveur.
- Un texte vide ou composé uniquement d’espaces est refusé. Un texte de 2 000 caractères est accepté et un texte de 2 001 caractères est refusé, avec des exemples sans espaces périphériques.
- Le texte contenant des balises est affiché comme texte brut. L’auteur et la date de la note enregistrée proviennent respectivement de la session et du serveur, même si une requête tente de fournir d’autres valeurs.
- Plusieurs notes sont affichées de la plus ancienne à la plus récente.
- Une erreur de création conserve la saisie et rend possible un nouvel essai manuel.
- La création n’émet aucun e-mail ni notification ; la V1 ne permet pas la suppression.

Les vérifications de modification ou d’immutabilité seront ajoutées après la décision explicite sur ce point.
