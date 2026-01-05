# 🤖 Générateur llms.txt

Un générateur automatique de fichiers `llms.txt` pour vos sites web. Crawle votre site et génère un fichier structuré optimisé pour les LLMs.

## 🚀 Fonctionnalités

- **Crawler intelligent** : Analyse automatiquement votre site web
- **Interface simple** : Interface web intuitive et moderne
- **Extraction automatique** : Récupère titres, descriptions et métadonnées
- **Format standard** : Génère des fichiers au format llms.txt officiel
- **Personnalisable** : Contrôle de la profondeur et du nombre de pages

## 📦 Installation

```bash
npm install
```

## 🎯 Utilisation

### Démarrer le serveur

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:3000`

### Utiliser l'interface

1. Ouvrez votre navigateur sur `http://localhost:3000`
2. Entrez l'URL de votre site web
3. (Optionnel) Personnalisez les paramètres :
   - Titre du site
   - Description
   - Nombre maximum de pages
   - Profondeur de crawl
4. Cliquez sur "Générer llms.txt"
5. Téléchargez ou copiez le résultat

## 🛠️ Configuration

### Paramètres de crawl

- **maxPages** : Nombre maximum de pages à crawler (défaut: 50)
- **maxDepth** : Profondeur maximale de navigation (défaut: 3)
- **followExternal** : Suivre les liens externes (défaut: false)

### Exclusions automatiques

Le crawler exclut automatiquement :
- Fichiers statiques (images, CSS, JS, PDF, etc.)
- Pages d'authentification (login, signup, etc.)
- Pages admin et API

## 📄 Format llms.txt

Le fichier généré suit le format standard :

```
# Titre du site

> Description du site

Informations importantes

## Section 1

- [Page 1](url): Description
- [Page 2](url): Description

## Section 2

- [Page 3](url): Description
```

## 🔧 Développement

### Structure du projet

```
llms-txt/
├── src/
│   ├── types.ts       # Types TypeScript
│   ├── crawler.ts     # Crawler web
│   ├── generator.ts   # Générateur llms.txt
│   └── server.ts      # Serveur Express
├── public/
│   ├── index.html     # Interface web
│   ├── style.css      # Styles
│   └── script.js      # JavaScript client
└── package.json
```

### Scripts disponibles

- `npm run dev` : Mode développement avec hot-reload
- `npm run build` : Compilation TypeScript
- `npm start` : Démarrage en production

## 📚 En savoir plus

- [Documentation llms.txt](https://llmstxt.org)
- [Format standard](https://llmstxt.org/intro.html)

## 📝 Licence

MIT
