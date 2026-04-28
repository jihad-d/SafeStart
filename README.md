# SafeStart 🛡️

> **Apprends la crypto sans risque** — Plateforme pédagogique de simulation de transactions crypto avec scoring de sécurité en temps réel et agent IA intégré.

![Version](https://img.shields.io/badge/version-0.1.0--beta-7c5cfc?style=flat-square)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646cff?style=flat-square&logo=vite)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-2-3ecf8e?style=flat-square&logo=supabase)

---

## ✨ Fonctionnalités

| Feature | Description |
|---|---|
| 🎓 **Mode simulation** | Effectue des achats, envois et swaps de crypto avec un solde fictif |
| 🔒 **Score de sécurité** | Analyse chaque transaction (montant, volatilité, adresse) et attribue un score 0–100 |
| 🤖 **SafeBot IA** | Agent pédagogique qui répond aux questions crypto en langage simple |
| 📊 **Portfolio live** | Suivi de tes actifs simulés avec P&L et sparklines |
| 🏆 **Gamification** | Points, niveaux (Débutant → Avancé), challenges et modules d'apprentissage |
| 🌗 **Thème dark/light** | Basculement en un clic, persisté via classe CSS sur `<html>` |

---

## 🚀 Démarrage rapide

### Prérequis

- [Node.js](https://nodejs.org/) ≥ 18
- [npm](https://www.npmjs.com/) ≥ 9 (ou pnpm / yarn)
- Un projet [Supabase](https://supabase.com/) (gratuit)

### Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/ton-org/safestart.git
cd safestart

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# → Édite .env et renseigne VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY

# 4. Lancer le serveur de développement
npm run dev
```

L'app est disponible sur **http://localhost:5173**.

### Compte démo

| Champ | Valeur |
|---|---|
| Email | `demo@safestart.fr` |
| Mot de passe | `demo1234` |

---

## 🗂️ Structure du projet

```
safestart-vite/
├── public/                    # Fichiers statiques
├── src/
│   ├── components/
│   │   ├── ai/
│   │   │   └── AIPanel.tsx          # Chat SafeBot (réponses simulées)
│   │   ├── layout/
│   │   │   └── AppLayout.tsx        # Sidebar + topbar + Outlet
│   │   └── transactions/
│   │       └── SecurityScoreBadge.tsx
│   │
│   ├── lib/
│   │   ├── hooks/
│   │   │   └── useAuth.tsx          # Contexte auth + profil Supabase
│   │   ├── supabase.ts              # Client Supabase
│   │   └── utils.ts                 # fmtEur, calcSecurityScore, simulateFees…
│   │
│   ├── pages/
│   │   ├── Dashboard.tsx            # Vue principale (stats, portfolio, txs récentes)
│   │   ├── Wallet.tsx               # Portefeuille et actifs
│   │   ├── Market.tsx               # Cours du marché
│   │   ├── Transactions.tsx         # Formulaire buy / send / swap
│   │   ├── Login.tsx                # Connexion
│   │   ├── Register.tsx             # Inscription
│   │   ├── Onboarding.tsx           # Sélection du niveau à l'inscription
│   │   └── Pages.tsx                # History, Learn, Challenges, Progress, Settings, Help
│   │
│   ├── styles/                 # ← Modules CSS (voir section Design System)
│   │   ├── variables.css            # Design tokens (couleurs, ombres, glass)
│   │   ├── base.css                 # Reset, body, mesh background, scrollbar
│   │   ├── typography.css           # Headings, labels, grad-text
│   │   ├── cards.css                # glass-card, glass-card-rich, stat-card, grad-card
│   │   ├── buttons.css              # btn-pri, btn-glass, btn-pill
│   │   ├── forms.css                # glass-input, toggle switch
│   │   ├── navigation.css           # nav-item + états hover / active
│   │   ├── badges.css               # score-safe, score-warning, score-danger
│   │   └── animations.css           # Keyframes, fade-up, spin, skeleton, typing dots
│   │
│   ├── types/
│   │   └── index.ts                 # Types partagés (TxType, SecurityScore…)
│   │
│   ├── App.tsx                      # Routes + Guard + Toaster
│   ├── index.css                    # Point d'entrée CSS (imports Tailwind + modules)
│   └── main.tsx                     # Montage React + BrowserRouter
│
├── .env.example               # Variables d'environnement requises
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🎨 Design System

L'interface utilise une esthétique **dark violet glass** inspirée du style Aura.  
Tous les styles sont organisés en **9 modules CSS indépendants** dans `src/styles/` et importés dans `src/index.css`.

### Tokens principaux (`variables.css`)

```css
--pri:   #7c5cfc   /* Violet principal  */
--pri2:  #a78bfa   /* Violet clair      */
--pri3:  #4f35d2   /* Violet foncé      */
--safe:  #10b981   /* Vert sécurité     */
--warn:  #f59e0b   /* Orange warning    */
--danger:#ef4444   /* Rouge danger      */
--bg:    #0d0b1a   /* Fond principal    */
```

### Classes utilitaires clés

| Classe | Description |
|---|---|
| `.glass-card` | Carte glass standard avec hover lift |
| `.glass-card-rich` | Carte avec bordure en dégradé |
| `.stat-card` | Carte stat avec glow radial |
| `.grad-card` | Carte violet dégradé (hero) |
| `.btn-pri` | Bouton primary violet |
| `.btn-glass` | Bouton glass/secondaire |
| `.glass-input` | Input/select stylisté |
| `.score-safe/warning/danger` | Badge score coloré |
| `.fade-up` | Animation d'entrée (translateY + opacity) |
| `.skeleton` | Placeholder shimmer |

### Thème clair

Ajoute la classe `.light` sur `<html>` pour activer le thème clair (géré par `App.tsx`).

---

## ⚙️ Variables d'environnement

Copie `.env.example` → `.env` et renseigne :

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> ⚠️ Ces valeurs sont exposées côté client. Utilise les **Row Level Security** policies Supabase pour protéger tes données.

---

## 🗄️ Base de données Supabase

Le hook `useAuth` attend une table `profiles` avec les colonnes suivantes :

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` | Clé étrangère vers `auth.users` |
| `email` | `text` | Email de l'utilisateur |
| `username` | `text` | Pseudo affiché |
| `level` | `text` | `absolute_beginner` · `curious_novice` · `intermediate` · `advanced` |
| `total_points` | `int` | Points accumulés |
| `simulated_balance_eur` | `float` | Solde fictif en euros |
| `onboarding_completed` | `bool` | Onboarding terminé ? |
| `ai_messages_today` | `int` | Messages SafeBot du jour |
| `ai_messages_limit` | `int` | Limite journalière (défaut: 20) |

---

## 📦 Scripts disponibles

```bash
npm run dev       # Serveur de développement (HMR)
npm run build     # Build de production dans dist/
npm run preview   # Prévisualisation du build
```

---

## 🧰 Stack technique

| Outil | Version | Rôle |
|---|---|---|
| [React](https://react.dev) | 18 | UI |
| [Vite](https://vitejs.dev) | 5 | Bundler |
| [TypeScript](https://typescriptlang.org) | 5 | Typage statique |
| [React Router](https://reactrouter.com) | 6 | Routing SPA |
| [Supabase JS](https://supabase.com/docs/reference/javascript) | 2 | Auth + BDD |
| [Lucide React](https://lucide.dev) | 0.400 | Icônes |
| [Recharts](https://recharts.org) | 2 | Graphiques |
| [React Hot Toast](https://react-hot-toast.com) | 2 | Notifications |
| [Tailwind CSS](https://tailwindcss.com) | 3 | Utilitaires CSS |

---

## 🤝 Contribuer

1. Fork le projet
2. Crée ta branche : `git checkout -b feature/ma-fonctionnalite`
3. Commit : `git commit -m 'feat: ajoute X'`
4. Push : `git push origin feature/ma-fonctionnalite`
5. Ouvre une Pull Request

---

## 📄 Licence

MIT © SafeStart Team
