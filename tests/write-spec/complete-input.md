# Test fictif — fin de brainstorming avec décisions arrêtées

On a fini le brainstorming. Utilise le skill write-spec pour en faire la spec, en français, dans ce dossier de test. Je veux uniquement le document de conception.

Contexte fictif fourni intégralement ici : une appli interne de suivi de demandes possède déjà une page Liste, une API de recherche et une base SQL. Aucun vrai dépôt applicatif n'est fourni.

Utilisateur : les agents support perdent du temps à retaper les mêmes filtres. Ils doivent pouvoir enregistrer une vue privée et la rouvrir.
Assistant : favoris locaux dans le navigateur, vues en base, ou liens partageables ?
Utilisateur : en base, pour retrouver mes vues sur un autre ordinateur. Pas de partage. On réutilise la session existante.
Assistant : quels filtres et quelles limites ?
Utilisateur : statut et responsable uniquement. Maximum 10 vues par utilisateur. Nom obligatoire après suppression des espaces au début et à la fin, 40 caractères maximum, doublons de nom autorisés. L'enregistrement ne change pas les filtres actuellement appliqués.
Assistant : comment s'applique une vue ?
Utilisateur : cliquer remplace entièrement les deux filtres courants, y compris par leur valeur vide, puis lance la recherche existante. Les options et valeurs autorisées restent celles de cette recherche. Une vue contient le nom et ces deux filtres. La suppression est immédiate.
Utilisateur : correction, pour la suppression on demande une confirmation. Si la requête échoue, la vue reste visible, avec une erreur et un bouton pour réessayer. Pour une création échouée, garder le nom saisi et les filtres; on réessaie manuellement, pas de retry automatique.
Assistant : et la séparation entre comptes ?
Utilisateur : le serveur tire le propriétaire de la session, vérifie la propriété en lecture/suppression, refuse une session absente et les filtres invalides. La limite de 10 doit tenir même avec deux créations concurrentes. Aucun endpoint de modification pour cette V1 : supprimer puis recréer suffit.
Utilisateur : à l'ouverture, chargement des vues personnelles. En cas d'échec, on affiche une erreur avec Réessayer mais la liste de demandes et ses filtres continuent de fonctionner. Une liste de vues vide a un message qui invite à enregistrer les filtres courants.
Utilisateur : le résultat attendu : j'enregistre « Mes demandes ouvertes », je la retrouve après reconnexion ailleurs, je l'applique, aucun autre utilisateur ne peut la lire ni la supprimer. Pas d'analytics, d'export, de partage, ni de changement du moteur de recherche. Tout ça est validé, rédige la spec.
