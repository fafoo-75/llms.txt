# Déploiement sur Netlify

Ce projet est optimisé pour être déployé sur Netlify avec Netlify Functions.

## 🚀 Déploiement rapide

### Option 1 : Via l'interface Netlify

1. Connectez-vous sur [Netlify](https://app.netlify.com)
2. Cliquez sur "Add new site" > "Import an existing project"
3. Connectez votre repository GitHub : `https://github.com/fafoo-75/llms.txt`
4. Netlify détectera automatiquement la configuration via `netlify.toml`
5. Cliquez sur "Deploy site"

### Option 2 : Via Netlify CLI

```bash
# Installer Netlify CLI globalement
npm install -g netlify-cli

# Se connecter à Netlify
netlify login

# Déployer
netlify deploy --prod
```

## ⚙️ Configuration

Le fichier `netlify.toml` contient toute la configuration nécessaire :

- **Build command** : `npm run build`
- **Functions directory** : `netlify/functions`
- **Publish directory** : `public`
- **Node version** : 18

## 🔧 Architecture

### Frontend
- Fichiers statiques dans `/public`
- Interface web accessible directement

### Backend
- API transformée en Netlify Function
- Endpoint : `/.netlify/functions/generate`
- Redirection automatique de `/api/generate` vers la function

## 📝 Variables d'environnement

Aucune variable d'environnement requise pour le moment.

## 🧪 Test en local

Pour tester avec Netlify Dev en local :

```bash
npm run netlify
```

Cela démarre un serveur local qui simule l'environnement Netlify.

## 🔍 Vérifications post-déploiement

1. Vérifier que l'interface se charge : `https://votre-site.netlify.app`
2. Tester la génération avec une URL
3. Vérifier que le fichier llms.txt se télécharge correctement

## 📊 Limites Netlify

- **Timeout functions** : 10 secondes (gratuit) / 26 secondes (pro)
- **Taille réponse** : 6 MB max
- **Bande passante** : 100 GB/mois (gratuit)

Pour les sites très larges (>100 pages), le crawl peut prendre du temps. Ajustez `maxPages` et `maxDepth` en conséquence.

## 🐛 Troubleshooting

### Function timeout
Si le crawl prend trop de temps, réduisez :
- `maxPages` (défaut: 50)
- `maxDepth` (défaut: 3)

### Erreurs de build
Vérifiez que toutes les dépendances sont installées :
```bash
npm install
npm run build
```

## 📚 Documentation

- [Netlify Functions](https://docs.netlify.com/functions/overview/)
- [Netlify Build](https://docs.netlify.com/configure-builds/overview/)
