import React, { useEffect, useState } from 'react'
import { ShieldCheck, Award, BarChart3 } from 'lucide-react'
import LevelIcon from '@/components/ui/LevelIcon'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useTransactions } from '@/lib/hooks/useTransactions'
import { awardBadges, badgeIcon } from '@/lib/badges'
import toast from 'react-hot-toast'
import '@/styles/pages.css'

type BadgeRow = {
  id: string
  code: string | null
  name: string
  description: string
  points: number
  unlocked: boolean
}

const LEVELS: Record<string, { title: string; desc: string }> = {
  absolute_beginner: { title: 'Débutant absolu', desc: "Tu pars de zéro, et c'est parfait ! SafeStart va t'accompagner pas à pas." },
  curious_novice:    { title: 'Novice curieux',  desc: 'Tu as des bases solides. On approfondit ensemble tes connaissances.' },
  intermediate:      { title: 'Intermédiaire',   desc: 'Tu maîtrises les fondamentaux. Prêt pour des opérations plus avancées ?' },
  advanced:          { title: 'Avancé',          desc: 'Tu connais bien le sujet. Continue à affiner tes réflexes de sécurité.' },
}

const average = (values: number[]) =>
  values.length ? Math.round(values.reduce((s, v) => s + v, 0) / values.length) : null

export default function Progress() {
  const { profile, patchProfile } = useAuth()
  const [badges, setBadges] = useState<BadgeRow[]>([])
  const { transactions } = useTransactions()
  const level = LEVELS[profile?.level ?? 'absolute_beginner'] ?? LEVELS.absolute_beginner

  // Compétences = score de sécurité moyen par type d'opération (réel)
  const scoresOf = (type?: string) =>
    transactions.filter(t => !type || t.type === type).map(t => t.security_score)
  const avgScore = average(scoresOf())
  const skills = [
    { name: 'Achats', score: average(scoresOf('buy')) },
    { name: 'Envois', score: average(scoresOf('send')) },
    { name: 'Swaps',  score: average(scoresOf('swap')) },
  ]

  useEffect(() => {
    const loadBadges = async () => {
      if (!profile?.id || profile.id === 'demo' || !supabase) {
        setBadges([])
        return
      }

      // Vérifie d'abord les badges gagnés (attribution côté serveur), puis charge le catalogue
      const { totalPoints } = await awardBadges()
      if (totalPoints !== null) patchProfile({ total_points: totalPoints })

      const [catalog, earned] = await Promise.all([
        supabase.from('badges').select('id, code, name, description, points_reward'),
        supabase.from('user_badges').select('badge_id').eq('user_id', profile.id),
      ])
      if (catalog.error || earned.error) {
        console.error(catalog.error ?? earned.error)
        toast.error('Impossible de charger les badges.')
        return
      }

      const earnedIds = new Set((earned.data ?? []).map(r => r.badge_id as string))
      setBadges(((catalog.data ?? []) as { id: string; code: string | null; name: string; description: string | null; points_reward: number | null }[])
        .map(b => ({
          id: b.id,
          code: b.code,
          name: b.name,
          description: b.description ?? '',
          points: b.points_reward ?? 0,
          unlocked: earnedIds.has(b.id),
        }))
        .sort((x, y) => Number(y.unlocked) - Number(x.unlocked) || x.points - y.points))
    }

    loadBadges()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id])

  return (
    <div className="fade-up flex-container">
      <h1 className="text-title">Ma Progression</h1>

      {/* Level card */}
      <div className="dashboard-card lvl-card">
        <div className="lvl-container">
          <div className="lvl-emoji"><LevelIcon level={profile?.level} size={40} strokeWidth={1.6} /></div>
          <div className="lvl-body">
            <div className="lvl-tagline">Ton niveau actuel</div>
            <div className="lvl-title">{level.title}</div>
            <div className="lvl-desc">{level.desc}</div>
          </div>
          <div className="lvl-points-wrapper">
            <div className="lvl-points-val">{profile?.total_points ?? 0}</div>
            <div className="lvl-points-label">points</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-three-columns">
        {([
          [BarChart3, 'Transactions', String(transactions.length)],
          [ShieldCheck, 'Score moyen', avgScore === null ? '—' : `${avgScore}/100`],
          [Award, 'Badges', `${badges.filter(b => b.unlocked).length}/${badges.length}`]
        ] as const).map(([Ico, l, v]) => (
          <div key={l} className="dashboard-card progress-stat-card">
            <div className="progress-stat-ico"><Ico size={24} /></div>
            <div className="progress-stat-val">{v}</div>
            <div className="progress-stat-label">{l}</div>
          </div>
        ))}
      </div>

      {/* Skills */}
      <div className="dashboard-card">
        <div className="skill-section-title">Compétences</div>
        <p className="text-muted-sm" style={{ marginBottom: 12 }}>Score de sécurité moyen de tes simulations, par type d'opération.</p>
        {skills.map(s => (
          <div key={s.name} className="skill-row">
            <div className="skill-header">
              <span className="skill-name">{s.name}</span>
              <span className="skill-score">{s.score === null ? 'Pas encore pratiqué' : `${s.score}/100`}</span>
            </div>
            <div className="skill-bar-bg">
              <div className="skill-bar-fill" style={{ width: `${s.score ?? 0}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div className="dashboard-card">
        <div className="skill-section-title ico-inline"><Award size={16} />Badges ({badges.filter(b => b.unlocked).length} / {badges.length})</div>
        {badges.length === 0 && (
          <p className="text-muted-sm">Aucun badge disponible pour l'instant.</p>
        )}
        <div className="badge-grid">
          {badges.map(b => {
            const Icon = badgeIcon(b.code)
            return (
              <div
                key={b.id}
                className={`badge-item ${b.unlocked ? 'badge-unlocked' : 'badge-locked'}`}
                aria-label={`${b.name} : ${b.unlocked ? 'obtenu' : 'pas encore obtenu'}`}
              >
                <div className="badge-emoji"><Icon size={28} /></div>
                <div className="badge-name">{b.name}</div>
                <div className="badge-desc">{b.description}</div>
                <div className="badge-pts">{b.unlocked ? 'Obtenu' : `+${b.points} pts`}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
