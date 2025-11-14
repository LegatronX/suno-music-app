'''
# 🎵 Suno Music App

Cette application vous permet de générer de la musique facilement et rapidement grâce à l'intelligence artificielle de Suno.

## 🚀 Accès à l'application

**Lien vers l'application :** [https://suno-music-app.pages.dev](https://suno-music-app.pages.dev) (Ce lien sera actif après le déploiement final).

---

## 🔑 Comment ajouter votre clé API Suno

Pour que l'application puisse générer de la musique, vous devez ajouter votre propre clé API Suno. C'est la seule action manuelle requise.

Voici comment faire, étape par étape :

1.  **Connectez-vous à votre compte Cloudflare.**

2.  **Accédez à votre projet Pages :**
    *   Dans le menu de gauche, cliquez sur **Workers & Pages**.
    *   Sélectionnez votre projet, qui devrait s'appeler **suno-music-app**.

3.  **Allez dans les paramètres du projet :**
    *   Cliquez sur l'onglet **Settings**.

4.  **Trouvez la section des variables d'environnement :**
    *   Dans le menu de gauche des paramètres, cliquez sur **Environment variables**.

5.  **Ajoutez la variable d'environnement :**
    *   Dans la section "Production", cliquez sur le bouton **Add variable**.
    *   Remplissez les champs comme suit :
        *   **Variable name** : `SUNO_API_KEY`
        *   **Variable value** : Collez votre clé API Suno ici.
    *   Cochez la case **Encrypt** pour sécuriser votre clé.

    ![Ajout de la variable d'environnement](https://i.imgur.com/placeholder.png "Étape 5 : Ajout de la clé API")

6.  **Sauvegardez et redéployez :**
    *   Cliquez sur **Save**.
    *   Cloudflare va automatiquement déclencher un nouveau déploiement pour appliquer la modification. Vous pouvez suivre sa progression dans l'onglet **Deployments**.

Une fois le nouveau déploiement terminé, votre application est prête à générer de la musique !
'''
