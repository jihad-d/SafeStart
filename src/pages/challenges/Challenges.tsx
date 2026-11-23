import React from 'react'
import { Lock, Zap, Trophy, ShieldCheck, Coins, Globe, Repeat, Rocket, Target } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import toast from 'react-hot-toast'
import '@/styles/pages.css'

const CHALLENGES = [
  { title: 'Premier achat',          desc: 'Simule ton premier achat de cryptomonnaie.',     obj: '1 achat simulé',           level: 'Débutant',      lvlColor: '#10b981', pts: 100, icon: Trophy, premium: false },
  { title: 'Acheteur prudent',       desc: 'Achète du BTC avec un score de sécurité vert.',  obj: 'Score ≥ 70/100',           level: 'Débutant',      lvlColor: '#10b981', pts: 150, icon: ShieldCheck, premium: false },
  { title: 'Maître des frais',       desc: 'Effectue un achat avec moins de 0.5% de frais.', obj: 'Frais < 0.5%',             level: 'Débutant',      lvlColor: '#10b981', pts: 120, icon: Coins, premium: false },
  { title: 'Portefeuille diversifié',desc: 'Détenir au moins 3 cryptos différentes.',         obj: '3 cryptos dans le portfolio',level:'Intermédiaire', lvlColor: '#6366f1', pts: 200, icon: Globe, premium: false },
  { title: 'Swap intelligent',       desc: 'Réalise un swap avec un slippage < 1%.',          obj: 'Slippage < 1%',            level: 'Intermédiaire', lvlColor: '#6366f1', pts: 250, icon: Repeat, premium: false },
  { title: 'Explorateur DeFi',       desc: 'Réalise 5 swaps variés.',                         obj: '5 swaps différents',        level: 'Avancé',        lvlColor: '#f59e0b', pts: 400, icon: Rocket, premium: true  },
]

export default function Challenges() {
  const { profile } = useAuth()
  return (
    <div className="fade-up flex-container">
      <div>
        <h1 className="text-title">Challenges</h1>
        <p className="text-subtitle">Complète des missions pour gagner des points et débloquer des badges</p>
      </div>
      <div className="grid-three-columns">
        {[
          ['0', 'Complétés'],
          [String(profile?.total_points ?? 0), 'Points totaux'],
          ['1', 'Badges']
        ].map(([v, l]) => (
          <div key={l} className="dashboard-card challenge-stat-card">
            <div className="challenge-stat-val">{v}</div>
            <div className="challenge-stat-label">{l}</div>
          </div>
        ))}
      </div>
      <div className="grid-two-columns">
        {CHALLENGES.map(c => (
          <div 
            key={c.title} 
            className="dashboard-card"
            style={{ opacity: c.premium && !profile?.is_premium ? .85 : 1 }}
          >
            <div className="challenge-header">
              <div className="challenge-badge-group">
                <span className="challenge-icon"><c.icon size={22} /></span>
                <span 
                  className="challenge-lvl-badge"
                  style={{ background: `${c.lvlColor}22`, color: c.lvlColor }}
                >
                  {c.level}
                </span>
              </div>
              <span className="challenge-pts">+{c.pts} pts</span>
            </div>
            <div className="challenge-title">{c.title}</div>
            <div className="challenge-desc">{c.desc}</div>
            <div className="challenge-obj ico-inline"><Target size={13} />{c.obj}</div>
            <div className="challenge-footer">
              {c.premium && !profile?.is_premium
                ? <button className="btn-glass challenge-btn"><Lock size={12} />Déverrouiller (Premium)</button>
                : <button className="btn-pri challenge-btn challenge-btn-start" onClick={() => toast.success('Challenge démarré !')}><Zap size={13} />Commencer</button>
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
