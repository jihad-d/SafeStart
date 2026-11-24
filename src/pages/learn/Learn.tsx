import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, CheckCircle, ArrowRight } from 'lucide-react'
import { MODULES } from '@/lib/modules'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import '@/styles/pages.css'

export default function Learn() {
  const { profile } = useAuth()
  const [completed, setCompleted] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!profile?.id || profile.id === 'demo') return
    supabase
      .from('module_completions')
      .select('module_id')
      .eq('user_id', profile.id)
      .then(({ data, error }) => {
        if (error) { console.error(error); return }
        setCompleted(new Set((data ?? []).map(r => r.module_id as string)))
      })
  }, [profile?.id])

  return (
    <div className="fade-up flex-container">
      <div>
        <h1 className="text-title">Modules d'apprentissage</h1>
        <p className="text-subtitle">
          Des leçons courtes suivies d'un quiz de 3 questions. Valide-les ({completed.size}/{MODULES.length}) pour gagner des points et des badges.
        </p>
      </div>
      <div className="grid-two-columns">
        {MODULES.map(m => {
          const done = completed.has(m.id)
          return (
            <div key={m.id} className={`dashboard-card ${done ? 'challenge-done' : ''}`}>
              <div className="learn-header">
                <span className="learn-badge" style={{ background: `${m.color}22`, color: m.color }}>{m.level}</span>
                <span className="learn-duration ico-inline"><Clock size={12} />{m.minutes} min</span>
              </div>
              <div className="learn-body">
                <div className="learn-title">{m.title}</div>
                <div className="learn-desc">{m.description}</div>
              </div>
              <div className="learn-footer">
                {done
                  ? <span className="challenge-status ico-inline"><CheckCircle size={14} />Validé</span>
                  : <span className="learn-pts">+{m.points} pts</span>}
                <Link to={`/learn/${m.id}`} className={`${done ? 'btn-glass' : 'btn-pri'} learn-btn learn-btn-start`}>
                  {done ? 'Revoir' : 'Commencer'} <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
