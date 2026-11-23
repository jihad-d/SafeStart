import React from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, Target, ArrowRight } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useTransactions } from '@/lib/hooks/useTransactions'
import { usePortfolio } from '@/lib/hooks/usePortfolio'
import { evaluateChallenges, LEVEL_COLORS } from '@/lib/challenges'
import '@/styles/pages.css'

export default function Challenges() {
  const { profile } = useAuth()
  const { transactions, loading } = useTransactions()
  const { positions } = usePortfolio([])
  const challenges = evaluateChallenges({ transactions, holdings: positions.length })
  const completed = challenges.filter(c => c.done).length

  return (
    <div className="fade-up flex-container">
      <div>
        <h1 className="text-title">Challenges</h1>
        <p className="text-subtitle">Des missions pour t'entraîner. Ta progression se met à jour automatiquement à chaque simulation.</p>
      </div>
      <div className="grid-three-columns">
        {[
          [`${completed}/${challenges.length}`, 'Complétés'],
          [String(challenges.length - completed), 'À relever'],
          [String(profile?.total_points ?? 0), 'Points totaux'],
        ].map(([v, l]) => (
          <div key={l} className="dashboard-card challenge-stat-card">
            <div className="challenge-stat-val">{loading ? '…' : v}</div>
            <div className="challenge-stat-label">{l}</div>
          </div>
        ))}
      </div>
      <div className="grid-two-columns">
        {challenges.map(c => {
          const color = LEVEL_COLORS[c.level]
          return (
            <div key={c.title} className={`dashboard-card ${c.done ? 'challenge-done' : ''}`}>
              <div className="challenge-header">
                <div className="challenge-badge-group">
                  <span className="challenge-icon"><c.icon size={22} /></span>
                  <span className="challenge-lvl-badge" style={{ background: `${color}22`, color }}>{c.level}</span>
                </div>
                {c.done && <span className="challenge-status ico-inline"><CheckCircle size={14} />Réalisé</span>}
              </div>
              <div className="challenge-title">{c.title}</div>
              <div className="challenge-desc">{c.desc}</div>
              <div className="challenge-obj ico-inline"><Target size={13} />Progression : {c.current}/{c.target}</div>
              <div
                className="skill-bar-bg"
                role="progressbar"
                aria-label={`Progression du challenge ${c.title}`}
                aria-valuemin={0}
                aria-valuemax={c.target}
                aria-valuenow={c.current}
              >
                <div className="skill-bar-fill" style={{ width: `${(c.current / c.target) * 100}%` }} />
              </div>
              {!c.done && (
                <div className="challenge-footer">
                  <Link to="/transactions" className="btn-glass challenge-btn">
                    S'entraîner <ArrowRight size={13} />
                  </Link>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
