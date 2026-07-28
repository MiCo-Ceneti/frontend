# MiCo — Frontend (Next.js)

Frontend de la Plateforme de Gestion des Missions et des Conges du CENETI.
Design epure noir/blanc casse, deux themes (clair/sombre), deploiement Vercel.

## Stack

- Next.js 16 (App Router, TypeScript, Tailwind CSS v4)
- Composants shadcn/ui (ecrits a la main, Radix UI + class-variance-authority)
- next-themes (theme clair/sombre)
- Polices Geist Sans / Geist Mono (auto-hebergees, package `geist`)

## Demarrage

```bash
npm install
cp .env.example .env.local
# renseigner BACKEND_URL avec l'URL de l'API Django

npm run dev
```

L'app tourne sur `http://localhost:3000`.

## Variable d'environnement

Une seule variable est necessaire, **cote serveur uniquement** (jamais exposee au navigateur) :

```
BACKEND_URL=https://votre-backend.example.com
```

Elle est utilisee par les routes API internes (`src/app/api/**`) qui font office de proxy
authentifie vers le backend Django. Le navigateur n'appelle jamais directement le backend :
il passe toujours par `/api/backend/...`.

## Architecture d'authentification

- `POST /api/auth/login` — transmet les identifiants au backend, recupere les tokens JWT et les
  stocke dans des cookies **httpOnly** (`mico_access`, `mico_refresh`).
- `POST /api/auth/refresh` — renouvelle le token d'acces via le refresh token (appele automatiquement
  par le client en cas de reponse 401).
- `POST /api/auth/logout` — blackliste le refresh token cote backend et nettoie les cookies.
- `GET /api/auth/me` — retourne le profil de l'utilisateur connecte (utilise par le layout du dashboard).
- `/api/backend/[...path]` — proxy generique : relaie toute requete vers `${BACKEND_URL}/api/...` en
  ajoutant l'en-tete `Authorization: Bearer <access>` a partir du cookie.

Le fichier `src/proxy.ts` (convention Next.js 16, ex-`middleware.ts`) protege toutes les routes
du dashboard : redirection vers `/login` en l'absence de session.

## Structure

```
src/
  app/
    login/                  page de connexion
    (dashboard)/            zone authentifiee (layout avec sidebar + topbar)
      page.tsx               tableau de bord
      missions/               liste, creation, detail
      conges/                 liste (mes demandes / file de validation), creation, detail
      notifications/          centre de notifications
      admin/                  utilisateurs, organisation, parametres (reserve administrateur)
      profil/                 informations + changement de mot de passe
    api/
      auth/                   routes d'authentification (voir plus haut)
      backend/[...path]/      proxy generique vers le backend
  components/
    ui/                      composants shadcn/ui (button, card, table, dialog, etc.)
    layout/                  sidebar, topbar, nav mobile, cloche de notifications, menu utilisateur
    shared/                  page-header, badges de statut, empty-state, confirm-dialog, stat-card
    brand/                   logo MiCo
    providers/               ThemeProvider, AuthProvider
  lib/
    api.ts                   client fetch cote navigateur (avec refresh automatique sur 401)
    auth-server.ts            helpers cookies (server-only)
    types.ts                  types miroir du backend
    constants.ts               libelles et variantes de badges par statut
```

## Design system

- Palette neutre "papier" : fond clair `#f1f0ed`, fond sombre `#121212` — jamais de blanc/noir pur.
- Aucun degrade. Couleurs de statut (succes/attention/danger/info) desaturees, utilisees avec parcimonie.
- Police unique Geist (Sans pour le texte, Mono pour les donnees chiffrees : matricules, soldes, dates).
- Tous les tokens de couleur sont des variables CSS dans `src/app/globals.css`, modifiables en un seul
  endroit pour ajuster le theme.

## Deploiement (Vercel)

1. Pousser le projet sur un repo Git connecte a Vercel.
2. Renseigner la variable d'environnement `BACKEND_URL` dans les settings du projet Vercel
   (Production + Preview).
3. Vercel detecte automatiquement Next.js — aucune configuration de build supplementaire requise.

## Limite connue

Les champs necessitant un fichier (signature d'ordre de mission, piece justificative de conge,
document ministeriel) attendent une **URL** (Cloudinary) plutot qu'un vrai widget d'upload dans
cette premiere version. Pour brancher un upload direct depuis le navigateur, ajouter les variables
`NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` et `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` (upload non signe) et
remplacer les champs `Input` concernes par un vrai composant d'upload.
