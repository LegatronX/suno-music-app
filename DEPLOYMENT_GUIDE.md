# Guide de Déploiement - Suno Music App

Ce guide vous accompagne étape par étape pour déployer et configurer votre application de génération musicale sur Cloudflare Pages.

---

## Prérequis

Avant de commencer, assurez-vous d'avoir :

*   Un compte Cloudflare (gratuit)
*   Votre clé API Suno
*   Les ressources Cloudflare suivantes créées :
    *   Base de données D1 : `suno-music-db` (ID: `bd2f7ca1-8d1f-4235-9050-846b068a63cd`)
    *   KV Namespace : `AUTH_KV` (ID: `adb5bacf85f04e218bb0dc398cb168b1`)
    *   KV Namespace : `SESSION_KV` (ID: `f7ef226cbb7645dab6b563f84016dd2b`)
    *   KV Namespace : `JOBS_KV` (ID: `b1c4a379a765425d867e9d4cb724d548`)

---

## Étape 1 : Initialiser la Base de Données

La base de données D1 a été créée, mais elle est vide. Vous devez y charger le schéma SQL.

1.  Connectez-vous à votre tableau de bord Cloudflare.
2.  Allez dans **Workers & Pages** > **D1**.
3.  Cliquez sur votre base de données `suno-music-db`.
4.  Allez dans l'onglet **Console**.
5.  Copiez et collez le contenu du fichier `shared/schema.sql` (disponible dans le dépôt GitHub) dans la console.
6.  Cliquez sur **Execute**.

Vous devriez voir un message de succès confirmant que les tables ont été créées.

---

## Étape 2 : Déployer l'Application sur Cloudflare Pages

### 2.1 Créer le Projet Pages

1.  Dans votre tableau de bord Cloudflare, allez dans **Workers & Pages**.
2.  Cliquez sur **Create application** > **Pages** > **Connect to Git**.
3.  Autorisez Cloudflare à accéder à votre compte GitHub.
4.  Sélectionnez le dépôt `LegatronX/suno-music-app`.
5.  Cliquez sur **Begin setup**.

### 2.2 Configurer le Build

Sur la page de configuration, remplissez les champs comme suit :

*   **Project name** : `suno-music-app`
*   **Production branch** : `main`
*   **Framework preset** : `Next.js`
*   **Build command** : Laissez la valeur par défaut (généralement `pnpm install && pnpm build` ou similaire)
*   **Build output directory** : Laissez la valeur par défaut (`.vercel/output/static`)
*   **Root directory** : Laissez vide

Cliquez sur **Save and Deploy**.

Le premier déploiement va se lancer. Attendez qu'il se termine avec le statut **Success** (cela peut prendre quelques minutes).

---

## Étape 3 : Configurer les Bindings

Une fois le déploiement réussi, vous devez connecter les services Cloudflare (base de données et KV) à votre application.

1.  Sur la page de votre projet `suno-music-app`, cliquez sur l'onglet **Settings**.
2.  Dans le menu de gauche, cliquez sur **Functions**.
3.  Faites défiler jusqu'à la section **Bindings**.

### 3.1 Ajouter le Binding D1

1.  Dans la sous-section **D1 Database Bindings**, cliquez sur **Add binding**.
2.  Remplissez les champs :
    *   **Variable name** : `DB`
    *   **D1 Database** : Sélectionnez `suno-music-db` dans la liste déroulante.
3.  Cliquez sur **Save**.

### 3.2 Ajouter les Bindings KV

1.  Dans la sous-section **KV Namespace Bindings**, cliquez sur **Add binding** trois fois pour ajouter les trois namespaces.

**Premier binding :**
*   **Variable name** : `AUTH_KV`
*   **KV namespace** : Sélectionnez `AUTH_KV` dans la liste.

**Deuxième binding :**
*   **Variable name** : `SESSION_KV`
*   **KV namespace** : Sélectionnez `SESSION_KV` dans la liste.

**Troisième binding :**
*   **Variable name** : `JOBS_KV`
*   **KV namespace** : Sélectionnez `JOBS_KV` dans la liste.

2.  Cliquez sur **Save** en bas de la section.

---

## Étape 4 : Ajouter les Variables d'Environnement (Secrets)

Votre application a besoin de deux secrets pour fonctionner : votre clé API Suno et un secret pour sécuriser le cron job.

1.  Toujours dans l'onglet **Settings**, cliquez sur **Environment variables** dans le menu de gauche.
2.  Cliquez sur **Add variable**.

### 4.1 Ajouter la Clé API Suno

*   **Variable name** : `SUNO_API_KEY`
*   **Variable value** : Collez votre clé API Suno ici.
*   Cochez la case **Encrypt** pour sécuriser la clé.

### 4.2 Ajouter le Secret du Cron

Cliquez à nouveau sur **Add variable**.

*   **Variable name** : `CRON_SECRET`
*   **Variable value** : `a8b3f4c1-d5e6-4a7b-8f9c-0d1e2f3a4b5c`
*   Cochez la case **Encrypt**.

3.  Cliquez sur **Save**.

Cloudflare va automatiquement déclencher un nouveau déploiement pour appliquer ces variables. Attendez que ce déploiement se termine avec succès.

---

## Étape 5 : Configurer le Cron Trigger (Optionnel mais Recommandé)

Pour que les tâches de génération musicale soient traitées automatiquement en arrière-plan, vous devez configurer un cron trigger.

1.  Allez sur [Cloudflare Cron Triggers](https://dash.cloudflare.com/?to=/:account/workers/triggers/cron).
2.  Cliquez sur **Add Cron Trigger**.
3.  Remplissez les champs :
    *   **Cron Expression** : `* * * * *` (toutes les minutes)
    *   **Worker** : Sélectionnez votre projet `suno-music-app`.
    *   **Route** : `/api/cron`
4.  Cliquez sur **Save**.

---

## Étape 6 : Tester l'Application

Votre application est maintenant déployée et configurée. Vous pouvez y accéder à l'URL suivante :

**https://suno-music-app.pages.dev**

Pour tester :

1.  Ouvrez l'URL dans votre navigateur.
2.  Entrez votre adresse e-mail pour vous connecter.
3.  Vérifiez votre boîte mail et cliquez sur le lien de connexion magique.
4.  Créez un projet et générez votre premier morceau de musique !

---

## Dépannage

### Le build échoue

*   Vérifiez que vous avez bien sélectionné le preset **Next.js**.
*   Assurez-vous que le champ **Root directory** est vide.

### L'application ne se connecte pas à la base de données

*   Vérifiez que vous avez bien ajouté le binding `DB` dans **Settings** > **Functions** > **Bindings**.
*   Vérifiez que vous avez bien exécuté le schéma SQL dans la console D1.

### Les générations de musique ne se lancent pas

*   Vérifiez que vous avez bien ajouté la variable `SUNO_API_KEY` dans **Settings** > **Environment variables**.
*   Vérifiez que le cron trigger est bien configuré.

---

## Support

Pour toute question ou problème, veuillez consulter la documentation de Cloudflare ou ouvrir une issue sur le dépôt GitHub.

**Bon déploiement !**
