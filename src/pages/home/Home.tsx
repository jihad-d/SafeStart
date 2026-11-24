import React from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck, LineChart, Trophy, Wallet, ArrowLeftRight, GraduationCap, ArrowRight, Sun, Moon,
} from 'lucide-react'
import { useTheme } from '@/lib/hooks/useTheme'
import { LegalLinks } from '@/pages/legal/Legal'
import './Home.css'

const FEATURES = [
  {
    icon: Wallet,
    title: '1 000 € fictifs pour t\'entraîner',
    desc: 'Achète, envoie et échange des cryptos sans jamais risquer un centime réel.',
  },
  {
    icon: LineChart,
    title: 'Les vrais prix du marché',
    desc: 'Tes simulations utilisent les cours actuels du Bitcoin, de l\'Ethereum et d\'autres cryptos.',
  },
  {
    icon: ShieldCheck,
    title: 'Un score de sécurité',
    desc: 'Avant chaque opération, un score de 0 à 100 t\'explique les risques : montant, volatilité, frais, adresse.',
  },
  {
    icon: Trophy,
    title: 'Des challenges pour progresser',
    desc: 'Des missions concrètes et une page Progression pour suivre tes réflexes de sécurité.',
  },
]

const STEPS = [
  { icon: GraduationCap, title: 'Évalue ton niveau', desc: '5 questions pour adapter SafeStart à toi.' },
  { icon: ArrowLeftRight, title: 'Simule tes opérations', desc: 'Achats, envois et swaps avec un solde fictif.' },
  { icon: ShieldCheck, title: 'Apprends des risques', desc: 'Chaque opération est notée et expliquée.' },
]

export default function Home() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="home">
      <header className="home-nav">
        <Link to="/" className="home-brand" aria-label="SafeStart, accueil">
          <span className="home-logo" aria-hidden="true">S</span>
          <span className="home-brand-name">SafeStart</span>
          <span className="home-beta">Bêta</span>
        </Link>
        <nav className="home-nav-actions" aria-label="Compte">
          <button
            type="button"
            className="btn-glass home-theme-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <Link to="/login" className="btn-glass home-nav-link">Se connecter</Link>
        </nav>
      </header>

      <main>
        <section className="home-hero fade-up">
          <p className="home-eyebrow">Simulateur pédagogique de cryptomonnaies</p>
          <h1 className="home-title">
            Apprends la crypto <span className="grad-text">sans risquer un centime</span>
          </h1>
          <p className="home-lead">
            SafeStart te permet de pratiquer l'achat, l'envoi et l'échange de cryptomonnaies avec
            un solde fictif et les vrais prix du marché, pour comprendre les frais et les risques
            avant de te lancer pour de vrai.
          </p>
          <div className="home-cta">
            <Link to="/register" className="btn-pri home-cta-main">
              Créer mon compte gratuit <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="btn-glass home-cta-secondary">J'ai déjà un compte</Link>
          </div>
          <p className="home-note">Aucune carte bancaire. Aucun argent réel. Aucun conseil d'investissement.</p>
        </section>

        <section className="home-section" aria-labelledby="home-features-title">
          <h2 id="home-features-title" className="home-section-title">Ce que tu peux faire</h2>
          <div className="home-features">
            {FEATURES.map(f => (
              <article key={f.title} className="home-card">
                <span className="home-card-icon" aria-hidden="true"><f.icon size={20} /></span>
                <h3 className="home-card-title">{f.title}</h3>
                <p className="home-card-desc">{f.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="home-section" aria-labelledby="home-steps-title">
          <h2 id="home-steps-title" className="home-section-title">Comment ça marche</h2>
          <ol className="home-steps">
            {STEPS.map((s, i) => (
              <li key={s.title} className="home-step">
                <span className="home-step-num" aria-hidden="true">{i + 1}</span>
                <div>
                  <h3 className="home-card-title">{s.title}</h3>
                  <p className="home-card-desc">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="home-final">
          <h2 className="home-final-title">Prêt à faire tes premiers pas ?</h2>
          <Link to="/register" className="btn-pri home-cta-main">
            Commencer gratuitement <ArrowRight size={16} />
          </Link>
        </section>
      </main>

      <footer className="home-footer">
        <LegalLinks />
        <p className="home-footer-note">SafeStart est un outil éducatif. Les cryptomonnaies réelles comportent un risque de perte en capital.</p>
      </footer>
    </div>
  )
}
