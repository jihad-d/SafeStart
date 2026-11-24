# SafeStart 🛡️

> **Apprends la crypto sans risque** — Simulateur pédagogique de cryptomonnaies : achats, envois et swaps avec un solde fictif, les vrais prix du marché et un score de sécurité pour chaque opération.

**Version en ligne (bêta) : [safe-start-woad.vercel.app](https://safe-start-woad.vercel.app/)**

![Version](https://img.shields.io/badge/version-0.1.0--beta-7c5cfc?style=flat-square)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646cff?style=flat-square&logo=vite)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-2-3ecf8e?style=flat-square&logo=supabase)

---

## ✨ Fonctionnalités

| Fonctionnalité | Description |
|---|---|
| 🎓 **Simulation** | Achats, envois et swaps avec 1 000 € fictifs. Le portfolio, le solde et l'historique sont mis à jour en une seule transaction SQL |
| 📈 **Prix réels** | Cours CoinGecko (via une fonction Supabase), avec repli sur des prix de secours |
| 🔒 **Score de sécurité** | Note de 0 à 100 avant chaque opération : part du solde utilisée, volatilité, slippage, validité de l'adresse |
| 🏆 **Challenges et progression** | Missions calculées à partir des vraies transactions, statistiques et compétences réelles |
| 🧭 **Évaluation de niveau** | Quiz d'accueil obligatoire, que l'on peut refaire depuis les Paramètres |
| 🔐 **Compte** | Inscription, mot de passe oublié, export des données (JSON) et suppression du compte |
| 🌗 **Thèmes** | Sombre et clair, mémorisés dans le navigateur |
| ♿ **Accessibilité** | Contrastes WCAG AA, navigation clavier, lecteurs d'écran, réduction des animations |

**En cours :** modules d'apprentissage (marqués « Bientôt disponible »), badges, mentor IA SafeBot (suspendu).

---

## 🚀 Démarrage rapide

### Prérequis

- [Node.js](https://nodejs.org/) ≥ 18
- Un projet [Supabase](https://supabase.com/) (l'offre gratuite suffit)

### Installation

```bash
git clone https://github.com/jihad-d/SafeStart.git
cd SafeStart
npm install
cp .env.example .env.local   # puis renseigne les variables (voir plus bas)
npm run dev                  # http://localhost:3000
```

Avant le premier lancement, prépare la base de données (section suivante).

---

## 🗄️ Base de données Supabase

### Table `profiles`

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` | Clé vers `auth.users` |
| `email` | `text` | Email de l'utilisateur |
| `username` | `text` | Pseudo affiché |
| `level` | `text` | `absolute_beginner` · `curious_novice` · `intermediate` · `advanced` |
| `onboarding_completed` | `bool` | Évaluation de niveau terminée |
| `onboarding_score` | `int` | Score de l'évaluation (%) |
| `total_points` | `int` | Points accumulés |
| `simulated_balance_eur` | `numeric` | Solde fictif en euros |
| `is_premium` | `bool` | Réservé (non utilisé) |
| `ai_messages_today`, `ai_messages_limit` | `int` | Quota SafeBot (IA suspendue) |

Les tables `transactions` et `portfolio_assets` (contrainte unique `user_id, crypto_id`) et, si besoin, `badges` / `user_badges` complètent le schéma.

### Migrations à exécuter (dans *Supabase → SQL Editor*, dans cet ordre)

| Fichier | Rôle |
|---|---|
| `20261123_simulated_transactions.sql` | Première version de l'enregistrement atomique des transactions |
| `20261124_fix_points_and_reset.sql` | Points fixés côté serveur, réinitialisation du portfolio |
| `20261124_delete_account.sql` | Suppression de compte (RGPD) |
| `20261125_support_messages.sql` | Table des messages envoyés depuis la page Aide |
| `20261126_security_rls.sql` | Règles RLS, droits, protection des colonnes sensibles du profil |
| `20261126_cleanup_policies.sql` | Nettoyage des anciennes règles RLS |
| `20261127_send_swap_portfolio.sql` | Envois et swaps appliqués au portfolio (version actuelle de la fonction de transaction) |

Tous les fichiers sont dans [`supabase/migrations/`](supabase/migrations/). Les écritures du navigateur passent par des fonctions SQL : il ne peut pas modifier directement son solde, ses points ou son historique.

### Fonction de prix (Edge Function)

[`supabase/functions/market-prices`](supabase/functions/market-prices/index.ts) interroge CoinGecko une fois par minute pour tous les visiteurs. À créer dans *Supabase → Edge Functions* sous le nom exact `market-prices`, avec le secret facultatif `COINGECKO_API_KEY`. Tant qu'elle n'est pas déployée, le site appelle CoinGecko directement.

### Authentification

- *Authentication → URL Configuration* : **Site URL** = l'adresse du site, et dans **Redirect URLs** : `http://localhost:3000/reset-password` et `https://<ton-site>/reset-password`.
- *Authentication → Emails → SMTP Settings* : brancher un service d'envoi (par exemple Brevo). Le service d'email par défaut de Supabase n'écrit qu'aux membres de l'équipe et très peu de fois par heure.

---

## ⚙️ Variables d'environnement

| Variable | Où | Rôle |
|---|---|---|
| `VITE_SUPABASE_URL` | `.env.local` + Vercel | URL du projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | `.env.local` + Vercel | Clé publique (anon) Supabase |
| `VITE_COINGECKO_API_KEY` | facultatif | Clé CoinGecko utilisée seulement si la fonction `market-prices` est absente |
| `COINGECKO_API_KEY` | secret Supabase | Clé CoinGecko de la fonction `market-prices` |

> ⚠️ Tout ce qui commence par `VITE_` est inclus dans le JavaScript envoyé aux visiteurs. N'y mets **jamais** de clé secrète.

Au déploiement, Vercel fournit `VERCEL_PROJECT_PRODUCTION_URL`, utilisée pour l'adresse absolue de l'image de partage (`SITE_URL` peut la remplacer).

---

## 🗂️ Structure du projet

```
├── public/                     # favicon, icône Apple, image de partage
├── supabase/
│   ├── migrations/             # scripts SQL (voir l'ordre ci-dessus)
│   └── functions/market-prices # fonction Edge des prix
├── src/
│   ├── components/
│   │   ├── ai/AIPanel.tsx              # panneau SafeBot (en pause)
│   │   ├── layout/AppLayout.tsx        # barre latérale + barre du haut
│   │   ├── transactions/SecurityScoreBadge.tsx
│   │   └── ui/                         # AssetIcon, LevelIcon, GhostFibers (fond animé de l'accueil)
│   ├── lib/
│   │   ├── hooks/                      # useAuth, useTheme, usePortfolio, useTransactions
│   │   ├── challenges.ts               # définition et calcul des challenges
│   │   ├── config.ts                   # adresse de contact
│   │   ├── supabase.ts                 # client Supabase
│   │   └── utils.ts                    # prix, formats, score de sécurité
│   ├── pages/                          # un dossier par page (home, dashboard, wallet, market,
│   │                                   #   transactions, history, learn, challenges, progress,
│   │                                   #   settings, help, legal, login, register, onboarding)
│   ├── styles/                         # variables, base, cartes, boutons, formulaires, animations…
│   ├── App.tsx                         # routes et garde d'accès
│   └── main.tsx
├── vercel.json                         # réécritures SPA + en-têtes de sécurité (CSP…)
└── vite.config.ts
```

---

## 🎨 Design

Thème **violet « glass »**, sombre et clair. Les couleurs sont des variables CSS dans [`src/styles/variables.css`](src/styles/variables.css), redéfinies sous `.light` pour le thème clair (classe posée sur `<html>` par `useTheme`).

| Variable | Rôle |
|---|---|
| `--pri`, `--pri3` | Violet de marque et violet foncé |
| `--pri2` | Violet des textes d'accent (assombri en thème clair pour le contraste) |
| `--tx`, `--tx2`, `--tx3` | Texte principal, secondaire, discret (≥ 4,5:1) |
| `--grad-text`, `--grad-card` | Dégradés adaptés à chaque thème |
| `--safe`, `--warn`, `--danger` | Couleurs du score de sécurité |

---

## 📦 Scripts

```bash
npm run dev        # serveur de développement
npm run build      # build de production dans dist/
npm run preview    # prévisualisation du build
npm run typecheck  # vérification TypeScript
```

---

## 🧰 Stack technique

| Outil | Rôle |
|---|---|
| [React 18](https://react.dev) + [TypeScript](https://typescriptlang.org) | Interface |
| [Vite](https://vitejs.dev) | Build |
| [React Router 6](https://reactrouter.com) | Routage |
| [Supabase](https://supabase.com) | Authentification, base Postgres (RLS), fonctions SQL et Edge |
| [CoinGecko API](https://www.coingecko.com/en/api) | Cours des cryptomonnaies |
| [Lucide](https://lucide.dev) | Icônes |
| [React Hot Toast](https://react-hot-toast.com) | Notifications |
| [React Bits — GhostFibers](https://reactbits.dev) | Fond animé de la page d'accueil |
| [Vercel](https://vercel.com) | Hébergement |

Données de prix fournies par [CoinGecko](https://www.coingecko.com/).

---

## 📄 Licence

MIT © SafeStart
