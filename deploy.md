Déploiement O2Switch via Git

1. Côté O2Switch — Préparer l'environnement
   Dans cPanel :
1. Base de données PostgreSQL : Créer une base cotram dans "PostgreSQL Databases", noter l'utilisateur/mot de passe
1. Node.js App : Aller dans "Setup Node.js App" → Créer une application :

- Node.js version : 20.x (ou la plus récente)
- Application mode : Production
- Application root : cotram (ou le dossier que tu veux)
- Application URL : cotram.mg
- Startup file : app.js

3. Git : Dans cPanel → "Git Version Control" → Cloner le dépôt :

- Repository URL : https://github.com/ton-user/cotram.git
- Branch : main
- Deployment root : le même dossier que l'app Node

2. Créer .env sur le serveur
   Dans le dossier racine de l'app, créer le fichier .env :
   PORT=3000
   NODE_ENV=production
   DATABASE_URL=postgresql://user_cotram:motdepasse@localhost:5432/cotram_bdd
   JWT_SECRET=un_secret_tres_long_ici
   JWT_EXPIRE=7d
   JWT_COOKIE_EXPIRE=7
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   GOOGLE_CALLBACK_URL=https://cotram.mg/api/auth/google/callback
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=...
   EMAIL_PASSWORD=...
   EMAIL_FROM=noreply@cotram.mg
   SESSION_SECRET=un_autre_secret_ici
   FRONTEND_URL=https://cotram.mg
   CRON_SECRET=un_secret_cron_ici
3. Build & lancer via SSH

# Se connecter en SSH

ssh user@cotram.mg

# Aller dans le dossier de l'app

cd cotram

# Installer les dépendances backend

cd backend
npm install

# Générer le client Prisma

npx prisma generate

# Appliquer les migrations

npx prisma migrate deploy

# Compiler TypeScript

npm run build

# Retourner à la racine

cd ..

# Installer les dépendances frontend

cd frontend
npm install

# Builder le frontend

npm run build

# Retourner au backend

cd ../backend

# Démarrer l'app (test)

node app.js 4. Configurer Passenger
Créer un fichier tmp/restart.txt pour redémarrer Passenger :
mkdir -p tmp
touch tmp/restart.txt
Ou dans cPanel → "Setup Node.js App" → cliquer Restart. 5. Fichier .htaccess (optionnel, pour rewrite)
Créer à la racine du domaine (dossier public_html ou là où pointe le domaine) :
PassengerAppRoot /home/user/cotram/backend
PassengerAppType node
PassengerStartupFile app.js
PassengerNodejs /home/user/nodejs/20/bin/node

# Rediriger tout vers Node.js

<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^(.*)$ - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
</IfModule>
6. Structure finale sur le serveur
cotram/
├── backend/
│   ├── app.js              ← Entry point Passenger
│   ├── package.json
│   ├── dist/               ← Build TypeScript
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── node_modules/
│   └── .env
├── frontend/
│   ├── dist/               ← Build Vite (servi par le backend)
│   └── node_modules/
└── tmp/
    └── restart.txt
Points importants
- Le backend sert le frontend en production (server.ts sert frontend/dist/)
- L'API et le site sont sur le même domaine (cotram.mg)
- Le frontend appelle /api en relatif (pas besoin de CORS frontalier)
- Après chaque git pull, il faut refaire npm install + npm run build dans les deux dossiers
- npx prisma migrate deploy applique les nouvelles migrations sans interaction
