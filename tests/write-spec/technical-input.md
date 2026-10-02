# Essai fictif — carte technique d'une pièce jointe PDF

Utilise le skill write-spec pour rédiger une spec française concise dans ce dossier. Je veux voir comment ce sera fait techniquement, pas seulement les comportements. Ne code pas le produit. Aucun dépôt applicatif n'est fourni ; les chemins et dépendances ci-dessous constituent un contexte fictif, pas des constatations sur un vrai repo.

Fin de brainstorming : dans le dashboard, un commercial ouvre un dossier client et peut lui ajouter des PDF, voir leurs noms, puis les télécharger. Maximum 10 Mio par fichier, PDF uniquement, nom affiché conservé. Plusieurs pièces jointes par dossier, pas de limite de nombre en V1. Accès réservé aux membres connectés de l'organisation propriétaire du dossier. Pas de suppression, prévisualisation, partage public, OCR, recherche plein texte ou traitement IA dans cette version. Une erreur garde le dossier utilisable et propose un essai manuel. Les uploads incomplets ne doivent pas apparaître dans la liste. Le choix produit est validé ; à toi de recommander la structure technique minimale et son mécanisme de validation.

Contexte technique fictif :
- Dashboard Next.js / React ; écran existant `/dashboard/clients/[clientId]`, fichier `frontend/dashboard/src/app/dashboard/clients/[clientId]/page.tsx`.
- API Node distincte sous `backend/api/src/routes/`, session existante portant `userId` et `organizationId`, accès au dossier déjà contrôlé par `requireClientAccess(clientId, session)`.
- PostgreSQL : table `clients(id uuid primary key, organization_id uuid not null)` ; accès SQL existant via `db` depuis `backend/api/src/db.ts`.
- AWS S3 disponible pour l'infrastructure, provisionnée dans `backend/api/infra/storage.ts` ; aucun bucket de pièces jointes n'existe encore.
- `@aws-sdk/client-s3` et `@aws-sdk/s3-request-presigner` sont déjà installés dans l'API. Le dashboard possède un helper `apiFetch` pour appeler l'API avec la session. Aucun composant d'upload ni dépendance d'upload dédiée.
- L'API existante accepte les corps binaires jusqu'à 12 Mio et possède un mécanisme de limite de taille en streaming. Aucun besoin d'upload multipart/reprise pour cette V1.

Choisis une approche, montre l'écran → les routes → la table et le bucket, avec chemins proposés, champs principaux et types, format des clés S3 et libs réutilisées. Je veux pouvoir comprendre la structure en un coup d'œil, sans implémentation complète ni longue dissertation.
