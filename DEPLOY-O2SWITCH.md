# Cotram - Déploiement sur O2switch

## Prérequis

1. **Compte O2switch** avec accès à :
   - cPanel
   - Node.js (via Phusion Passenger)
   - PostgreSQL

2. **Node.js 18+** installé en local pour le build

3. **PostgreSQL** configuré sur O2switch

## Structure de déploiement

```
/home/cotram/domains/cotram.mg/
├── server.js          ← Point d'entrée Node.js
├── package.json
├── node_modules/
├── prisma/
├── dist/              ← Backend compilé
└── public/            ← Frontend statique
    ├── index.html
    ├── assets/
    └── ...
```

## Installation

### 1. Build local

```bash
# Build le frontend
cd frontend
npm run build

# Build le backend
cd ../backend
npm run build
```

### 2. Upload vers O2switch

Via FTP/SFTP ou File Manager de cPanel :
1. Uploadez le dossier `backend/dist/`
2. Uploadez le dossier `backend/prisma/`
3. Uploadez `backend/package.json`
4. Uploadez le contenu de `frontend/dist/` dans `public/`
5. Uploadez `server.js` à la racine

### 3. Configuration cPanel

1. **Node.js App** (cPanel > Logiciels > Setup Node.js App) :
   - Version : Node.js 18+
   - Mode : Production
   - Application root : `/public_html` (ou le dossier du domaine)
   - Application startup file : `server.js`
   - Application URL : `https://cotram.mg`

2. **PostgreSQL** (cPanel > Bases de données) :
   - Créez une base de données `cotram`
   - Créez un utilisateur avec un mot de passe fort
   - Ajoutez l'utilisateur à la base avec tous les privilèges

3. **Variables d'environnement** (via cPanel ou fichier .env) :
   ```
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=postgresql://user:password@localhost:5432/cotram
   JWT_SECRET=your-secret-key
   FRONTEND_URL=https://cotram.mg
   CRON_SECRET=your-cron-secret
   ```

### 4. Base de données

```bash
# Depuis le serveur ou en SSH
npx prisma generate
npx prisma migrate deploy
```

### 5. Configuration DNS

Dans votre registraire de domaine, configurez :

```
Type    Nom     Valeur
A       @       IP_O2SWITCH
A       www     IP_O2SWITCH
```

## Fichiers de configuration inclus

- `backend/.htaccess` - Redirections Apache pour O2switch
- `frontend/dist/.htaccess` - Routes SPA pour le frontend
- `backend/.env.o2switch` - Template de variables d'environnement
- `deploy.sh` - Script de déploiement automatisé

## Commandes utiles

```bash
# Deploy (depuis le serveur)
npx prisma migrate deploy

# Voir les logs
tail -f logs/production.log

# Redémarrer l'app Node.js
# Via cPanel > Setup Node.js App > Restart
```

## Dépannage

**Erreur 500 :**
- Vérifiez les logs dans cPanel > Gestionnaire d'erreurs
- Vérifiez que `NODE_ENV=production` est défini
- Vérifiez les permissions des fichiers (755 pour les dossiers, 644 pour les fichiers)

**Erreur de connexion à la base :**
- Vérifiez `DATABASE_URL` dans .env
- Vérifiez que l'utilisateur PostgreSQL a les droits

**Frontend blanc :**
- Vérifiez que le build du frontend est dans `public/`
- Vérifiez le chemin dans `server.ts`

**API 404 :**
- Vérifiez que les routes `/api/*` sont bien montées dans Express
- Vérifiez la configuration Passenger dans cPanel
