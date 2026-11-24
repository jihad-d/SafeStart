import React, { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle, XCircle, Clock, Lightbulb, RotateCcw, Award } from 'lucide-react'
import toast from 'react-hot-toast'
import { findModule, PASS_SCORE } from '@/lib/modules'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { awardBadges } from '@/lib/badges'
import '@/styles/pages.css'

type Phase = 'lesson' | 'quiz' | 'result'

export default function ModulePage() {
  const { moduleId } = useParams()
  const module = findModule(moduleId)
  const { profile, patchProfile } = useAuth()

  const [phase, setPhase] = useState<Phase>('lesson')
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [saving, setSaving] = useState(false)

  if (!module) return <Navigate to="/learn" replace />

  const question = module.quiz[current]
  const passed = score >= PASS_SCORE

  const pick = (index: number) => {
    if (selected !== null) return
    setSelected(index)
    if (index === question.correct) setScore(s => s + 1)
  }

  const finish = async (finalScore: number) => {
    setPhase('result')
    if (finalScore < PASS_SCORE || !profile || profile.id === 'demo') return
    setSaving(true)
    const { data, error } = await supabase.rpc('complete_module', { p_module_id: module.id, p_score: finalScore })
    setSaving(false)
    if (error) {
      console.error(error)
      toast.error("Ta réussite n'a pas pu être enregistrée. Réessaie dans un instant.")
      return
    }
    const row = (Array.isArray(data) ? data[0] : data) as { first_completion: boolean; points: number; new_total_points: number } | null
    if (row?.first_completion) {
      toast.success(`Module validé ! +${row.points} pts`)
      patchProfile({ total_points: row.new_total_points })
    }
    const { totalPoints } = await awardBadges()
    if (totalPoints !== null) patchProfile({ total_points: totalPoints })
  }

  const next = () => {
    if (current < module.quiz.length - 1) {
      setCurrent(c => c + 1)
      setSelected(null)
    } else {
      finish(score)
    }
  }

  const restartQuiz = () => {
    setPhase('quiz'); setCurrent(0); setSelected(null); setScore(0)
  }

  return (
    <div className="fade-up flex-container module-page">
      <Link to="/learn" className="module-back ico-inline"><ArrowLeft size={15} />Tous les modules</Link>

      <header className="module-head">
        <span className="learn-badge" style={{ background: `${module.color}22`, color: module.color }}>{module.level}</span>
        <h1 className="text-title">{module.title}</h1>
        <p className="text-subtitle ico-inline"><Clock size={13} />{module.minutes} min · +{module.points} pts à la clé</p>
      </header>

      {/* ── Leçon ── */}
      {phase === 'lesson' && (
        <>
          {module.sections.map(section => (
            <section key={section.title} className="dashboard-card module-section">
              <h2 className="module-section-title">{section.title}</h2>
              {section.paragraphs.map(p => <p key={p} className="module-text">{p}</p>)}
              {section.points && (
                <ul className="module-list">
                  {section.points.map(p => <li key={p}>{p}</li>)}
                </ul>
              )}
            </section>
          ))}

          <section className="dashboard-card module-takeaways">
            <h2 className="module-section-title ico-inline"><Lightbulb size={16} />À retenir</h2>
            <ul className="module-list">
              {module.takeaways.map(t => <li key={t}>{t}</li>)}
            </ul>
          </section>

          <button className="btn-pri module-cta" onClick={() => setPhase('quiz')}>
            <span className="ico-inline">Passer au quiz ({module.quiz.length} questions) <ArrowRight size={15} /></span>
          </button>
        </>
      )}

      {/* ── Quiz ── */}
      {phase === 'quiz' && (
        <section className="dashboard-card module-quiz" aria-labelledby="module-question">
          <p className="module-quiz-progress">Question {current + 1} / {module.quiz.length}</p>
          <h2 id="module-question" className="module-section-title">{question.q}</h2>
          <div className="module-options" role="group" aria-label="Réponses possibles">
            {question.options.map((option, index) => {
              const state = selected === null ? '' : index === question.correct ? 'correct' : index === selected ? 'wrong' : 'dim'
              return (
                <button
                  key={option}
                  type="button"
                  className={`module-option ${state}`}
                  onClick={() => pick(index)}
                  disabled={selected !== null}
                  aria-pressed={selected === index}
                >
                  {option}
                </button>
              )
            })}
          </div>
          {selected !== null && (
            <div className="module-feedback fade-up" role="status">
              <p className="module-feedback-title ico-inline">
                {selected === question.correct
                  ? <><CheckCircle size={15} />Bonne réponse !</>
                  : <><XCircle size={15} />Pas tout à fait…</>}
              </p>
              <p className="module-text">{question.explanation}</p>
              <button className="btn-pri module-cta" onClick={next}>
                <span className="ico-inline">
                  {current < module.quiz.length - 1 ? 'Question suivante' : 'Voir mon résultat'} <ArrowRight size={15} />
                </span>
              </button>
            </div>
          )}
        </section>
      )}

      {/* ── Résultat ── */}
      {phase === 'result' && (
        <section className="dashboard-card module-result">
          <span className={`module-result-icon ${passed ? 'ok' : 'ko'}`} aria-hidden="true">
            {passed ? <Award size={40} /> : <RotateCcw size={40} />}
          </span>
          <h2 className="module-section-title">{passed ? 'Module validé !' : 'Presque !'}</h2>
          <p className="module-text">
            {score} / {module.quiz.length} bonnes réponses.{' '}
            {passed
              ? 'Bravo, tu maîtrises les bases de ce module.'
              : `Il en faut au moins ${PASS_SCORE} pour valider. Relis la leçon et retente ta chance.`}
          </p>
          {saving && <p className="module-text">Enregistrement…</p>}
          <div className="module-result-actions">
            {passed
              ? <Link to="/learn" className="btn-pri module-cta">Retour aux modules</Link>
              : <button className="btn-pri module-cta" onClick={restartQuiz}>Refaire le quiz</button>}
            <button className="btn-glass module-cta" onClick={() => { setPhase('lesson'); window.scrollTo(0, 0) }}>Relire la leçon</button>
          </div>
        </section>
      )}
    </div>
  )
}
