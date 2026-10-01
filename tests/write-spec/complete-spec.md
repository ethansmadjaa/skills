# Vues privées de la liste des demandes — conception V1

Statut : prêt pour revue. Les décisions produit ci-dessous ont été validées ; ce document les formalise.

Ce document repose exclusivement sur le contexte fictif fourni. Aucun dépôt applicatif n’a été inspecté. Les responsabilités décrites ne présument ni noms de composants existants ni routes d’API concrètes.

## Objectif et périmètre

Les agents support doivent pouvoir enregistrer leurs filtres récurrents dans une vue privée, puis retrouver cette vue après reconnexion sur un autre ordinateur. Les vues sont conservées en base SQL et rattachées au compte identifié par la session existante.

Une vue contient un nom et les deux filtres de la page Liste : statut et responsable. La V1 permet de charger ses vues, d’en créer une, de l’appliquer et de la supprimer après confirmation. Chaque utilisateur peut posséder au maximum 10 vues.

Le partage, l’export, les analytics, la modification des vues et les changements du moteur de recherche sont exclus. Pour changer une vue enregistrée, l’utilisateur la supprime puis la recrée.

## Approche retenue

Le stockage en base permet de retrouver les vues sur plusieurs ordinateurs. Les favoris locaux au navigateur ne répondent pas à ce besoin. Les liens partageables sont écartés puisque les vues restent privées.

La page Liste conserve son fonctionnement et sa recherche existante. Les vues enregistrées constituent une manière de restaurer les deux filtres ; elles ne définissent ni de nouvelles options ni de nouvelles valeurs autorisées.

## Responsabilités et contrats

### Page Liste

À l’ouverture, la page charge les vues personnelles. Elle présente leur nom et permet leur application ou leur suppression. Une collection vide affiche un message invitant à enregistrer les filtres courants.

L’action d’enregistrement transmet le nom saisi et les valeurs courantes des filtres statut et responsable, y compris leurs valeurs vides. Elle ne modifie pas les filtres appliqués à la liste des demandes.

Cliquer sur une vue remplace entièrement les deux filtres courants par ceux de la vue, puis déclenche la recherche existante. Une valeur vide enregistrée efface donc le filtre courant correspondant : l’application n’est pas une fusion avec les filtres déjà présents.

### Serveur et session

Le serveur expose uniquement les opérations nécessaires à la V1 :

| Opération | Entrée | Résultat et contrôles |
| --- | --- | --- |
| Charger les vues | Session existante | Retourne uniquement les vues dont le propriétaire est l’utilisateur de la session. Toute lecture doit respecter cette propriété. |
| Créer une vue | Session, nom, statut, responsable | Valide les données, tire le propriétaire de la session et conserve la vue si le quota le permet. |
| Supprimer une vue | Session, identifiant de vue | Vérifie la propriété avant toute suppression. Une vue d’un autre compte ne peut pas être supprimée. |

Toute opération refuse une session absente. Le client ne décide jamais du propriétaire. Aucun endpoint de modification n’est prévu.

### Persistance SQL

Chaque enregistrement associe un identifiant de vue, un propriétaire, un nom et les valeurs de statut et de responsable. Les représentations des filtres, notamment des valeurs vides, restent compatibles avec la recherche existante.

Le contrôle du quota et l’insertion doivent former une opération atomique pour un même propriétaire. La base et le serveur doivent empêcher deux créations concurrentes de dépasser 10 vues ; un simple comptage suivi d’une insertion sans protection de concurrence ne satisfait pas le contrat. Le mécanisme SQL précis sera choisi lors de la planification selon la base disponible.

## Validation et parcours

### Enregistrer

Le serveur retire les espaces au début et à la fin du nom. Le nom obtenu doit être non vide et comporter au maximum 40 caractères. Les doublons de nom sont autorisés. Statut et responsable doivent respecter les options et valeurs autorisées par la recherche existante ; les filtres invalides sont refusés sans création.

Si l’utilisateur possède déjà 10 vues, la création est refusée sans modifier les vues existantes. Une création réussie rend la nouvelle vue disponible dans la collection personnelle, persistée pour les prochaines sessions. Les filtres appliqués aux demandes restent inchangés.

### Appliquer

La page affecte les deux valeurs enregistrées aux deux filtres courants, puis lance une seule recherche avec cet état complet. La recherche conserve ses règles de validation et de traitement existantes. Aucune recherche intermédiaire avec seulement l’un des deux filtres remplacé n’est attendue.

### Supprimer

L’action de suppression ouvre une confirmation. Une annulation conserve la vue et ne déclenche pas sa suppression. Après confirmation, la requête est envoyée au serveur. La vue est retirée de la collection affichée lorsque la suppression a réussi.

## Échecs et récupération

| Situation | Comportement attendu |
| --- | --- |
| Échec du chargement des vues | Afficher une erreur et une action « Réessayer ». La liste des demandes, ses filtres et la recherche restent utilisables. Ne pas présenter cet échec comme une collection vide. |
| Échec de création, notamment données invalides ou quota atteint | Signaler l’échec et conserver le nom saisi ainsi que les filtres pour permettre une nouvelle tentative manuelle. Aucune nouvelle tentative automatique. |
| Échec de suppression | Garder la vue visible, afficher une erreur et un bouton « Réessayer ». L’utilisateur peut relancer manuellement la suppression confirmée. |
| Session absente | Refuser l’opération côté serveur ; aucune vue n’est lue, créée ou supprimée. |
| Lecture ou suppression visant la vue d’un autre utilisateur | Refuser l’accès sans retourner la vue ni la supprimer. |

Les échecs des opérations de gestion des vues ne doivent pas altérer les filtres actuellement appliqués aux demandes. Les conventions techniques d’erreur et de session restent celles de l’application existante ; ce contexte fictif ne fournit pas leur format.

## Vérification et critères d’acceptation

Les vérifications suivantes établissent le comportement attendu, sans imposer de framework de test :

- **Persistance personnelle :** enregistrer « Mes demandes ouvertes », terminer la session puis se reconnecter avec le même compte sur un autre ordinateur. La vue et ses deux filtres sont retrouvés.
- **Application complète :** partir de deux filtres différents, appliquer une vue et vérifier que les deux sont remplacés avant le déclenchement de la recherche. Répéter avec une valeur vide puis deux valeurs vides pour vérifier l’effacement des filtres courants.
- **Enregistrement sans effet sur la recherche :** créer une vue et vérifier que les filtres actuellement appliqués n’ont pas changé.
- **Validation :** accepter un nom de 40 caractères après retrait des espaces périphériques et deux vues portant le même nom ; refuser un nom vide, uniquement composé d’espaces ou dépassant 40 caractères après normalisation. Refuser chaque filtre invalide côté serveur sans insertion.
- **Quota atomique :** avec 9 vues, envoyer deux créations concurrentes pour le même utilisateur. Une seule réussit et le total reste 10. Avec 10 vues, toute création supplémentaire échoue. Le quota d’un utilisateur ne consomme pas celui d’un autre.
- **Isolation :** avec deux comptes, vérifier que chacun ne reçoit que ses vues. Une tentative de lecture ou de suppression de l’identifiant d’une vue de l’autre compte échoue et laisse cette vue intacte. Vérifier également le refus de toutes les opérations sans session et l’impossibilité de choisir un autre propriétaire depuis le client.
- **Confirmation de suppression :** annuler laisse la vue intacte ; confirmer puis réussir la requête retire la vue et la rend absente au prochain chargement.
- **Échecs de création et suppression :** provoquer une erreur de création et vérifier la conservation du nom et des filtres, sans requête automatique supplémentaire. Provoquer une erreur de suppression et vérifier que la vue reste visible avec une erreur et « Réessayer ». Une nouvelle tentative manuelle peut aboutir dans les deux parcours.
- **Chargement dégradé :** provoquer une erreur de chargement, vérifier l’erreur et « Réessayer », puis utiliser les filtres et la recherche de demandes. Après récupération, la nouvelle tentative charge les vues.
- **État vide :** un chargement réussi sans vues affiche l’invitation à enregistrer les filtres courants.

La conception ne présente aucune décision produit bloquante restante. Les noms de composants, routes et mécanismes SQL concrets relèvent de la planification dans le futur dépôt applicatif.
