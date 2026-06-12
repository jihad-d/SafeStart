import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import './Onboarding.css'

const QUESTIONS = [
  { q: "Qu'est-ce qu'un wallet crypto ?", opts: ["Un compte bancaire classique", "Un portefeuille numérique pour stocker et envoyer des cryptos", "Un site d'achat en ligne", "Une monnaie physique"], correct: 1, exp: "Un wallet est une application qui te permet de stocker, envoyer et recevoir des cryptomonnaies. Tu en es le seul propriétaire." },
  { q: 'Que signifie "BTC" ?', opts: ['Bitcoin', 'Blockchain Token Coin', 'British Tech Company', 'Binary Transaction Code'], correct: 0, exp: "BTC est le symbole officiel du Bitcoin, la première et la plus connue des cryptomonnaies." },
  { q: "Qu'est-ce que la blockchain ?", opts: ["Une banque en ligne", "Un registre numérique décentralisé qui enregistre les transactions", "Un type de monnaie physique", "Un réseau social pour traders"], correct: 1, exp: "La blockchain est comme un grand cahier de comptes public et décentralisé, où chaque transaction est enregistrée et ne peut pas être modifiée." },
  { q: 'Que sont les "gas fees" ?', opts: ["Des taxes gouvernementales", "Des frais payés aux mineurs pour valider une transaction", "Le prix du carburant pour les serveurs", "Des frais de change"], correct: 1, exp: "Les gas fees rémunèrent les validateurs du réseau. C'est comme payer un service de livraison pour envoyer un colis." },
  { q: "Qu'est-ce que la volatilité en crypto ?", opts: ["La popularité d'une crypto", "La vitesse des transactions", "L'amplitude des variations de prix, qui peuvent être très importantes", "Le nombre d'utilisateurs"], correct: 2, exp: "La volatilité mesure les variations de prix. Une crypto volatile peut gagner ou perdre 20% en une seule journée." },
]

const LEVELS = [
  { id: 'absolute_beginner', label: 'Débutant absolu', emoji: '🌱', desc: "Tu pars de zéro, et c'est parfait ! SafeStart va t'accompagner pas à pas." },
  { id: 'curious_novice',    label: 'Novice curieux',  emoji: '🔍', desc: "Tu as des bases solides. On va approfondir ensemble tes connaissances." },
  { id: 'intermediate',      label: 'Intermédiaire',   emoji: '⚡', desc: "Tu maîtrises les fondamentaux. Prêt pour des opérations plus avancées ?" },
]

export default function Onboarding() {
  const { updateProfile } = useAuth()
  const navigate = useNavigate()
  const [phase, setPhase] = useState<'intro'|'quiz'|'result'>('intro')
  const [cur, setCur] = useState(0)
  const [selected, setSelected] = useState<number|null>(null)
  const [correct, setCorrect] = useState(0)
  const [showExp, setShowExp] = useState(false)

  const q = QUESTIONS[cur]
  const progress = (cur / QUESTIONS.length) * 100

  const pick = (idx: number) => {
    if (selected !== null) return
    setSelected(idx)
    setShowExp(true)
    if (idx === q.correct) setCorrect(c => c + 1)
  }

  const next = async () => {
    if (cur < QUESTIONS.length - 1) {
      setCur(c => c + 1); setSelected(null); setShowExp(false)
    } else {
      setPhase('result')
      const score = correct + (selected === q.correct ? 1 : 0)
      const pct = score / QUESTIONS.length
      const lvl = pct >= 0.8 ? 'intermediate' : pct >= 0.5 ? 'curious_novice' : 'absolute_beginner'
      await updateProfile({ level: lvl as any, onboarding_completed: true, onboarding_score: Math.round(pct * 100) })
    }
  }

  const finalScore = correct + (selected === q.correct && phase === 'result' ? 1 : 0)
  const pct = finalScore / QUESTIONS.length
  const levelInfo = pct >= 0.8 ? LEVELS[2] : pct >= 0.5 ? LEVELS[1] : LEVELS[0]

  if (phase === 'intro') return (
    <div className="ob-wrap">
      <div className="glass-card fade-up ob-card-intro">
        <div className="ob-intro-emoji">🎯</div>
        <h1 className="ob-intro-title">Évaluation de niveau</h1>
        <p className="ob-intro-desc">
          Réponds à <strong>{QUESTIONS.length} questions rapides</strong> sur la crypto.<br/>
          Pas de pression — c'est pour adapter SafeStart à toi. 😊
        </p>
        <div className="ob-intro-info-box">
          <span className="ob-intro-info-emoji">⏱️</span>
          <div>
            <div className="ob-intro-info-title">Environ 2 minutes</div>
            <div className="ob-intro-info-subtitle">Tu peux refaire l'évaluation depuis les paramètres</div>
          </div>
        </div>
        <button className="btn-pri ob-full-btn" onClick={() => setPhase('quiz')}>
          Commencer l'évaluation <ChevronRight size={16} className="ob-inline-icon" />
        </button>
      </div>
    </div>
  )

  if (phase === 'result') return (
    <div className="ob-wrap">
      <div className="glass-card fade-up ob-card-result">
        <div className="ob-result-emoji">{levelInfo.emoji}</div>
        <h2 className="ob-result-title">{levelInfo.label}</h2>
        <div className="ob-result-score">{finalScore} / {QUESTIONS.length} bonnes réponses</div>
        <div className="ob-progress-container ob-mb-20">
          <div className="ob-progress-bar-fill-result" style={{ width: `${(finalScore/QUESTIONS.length)*100}%` }} />
        </div>
        <div className="ob-result-message-box">
          <div className="ob-safebot-title">💡 SafeBot</div>
          <p className="ob-safebot-text">
            Bienvenue sur SafeStart ! Ton profil <strong>"{levelInfo.label}"</strong> a été enregistré.
            {levelInfo.id === 'absolute_beginner' && " Je vais t'expliquer chaque concept avec des exemples simples du quotidien."}
            {levelInfo.id === 'curious_novice' && " Je vais approfondir tes connaissances progressivement."}
            {levelInfo.id === 'intermediate' && " On va directement aller dans les détails techniques qui t'intéressent !"}
            {" Commence par simuler ton premier achat crypto ! 🚀"}
          </p>
        </div>
        <button className="btn-pri ob-full-btn" onClick={() => navigate('/dashboard')}>
          Accéder à mon tableau de bord
        </button>
      </div>
    </div>
  )

  return (
    <div className="ob-wrap">
      <div className="fade-up ob-quiz-container">
        <div className="ob-quiz-header">
          <div className="ob-quiz-meta">
            <span>Question {cur + 1} / {QUESTIONS.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="ob-progress-container">
            <div className="ob-progress-bar-fill-quiz" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="glass-card ob-quiz-card">
          <h2 className="ob-quiz-question">{q.q}</h2>
          <div className="ob-quiz-options-list">
            {q.opts.map((opt, i) => {
              let state = 'default'
              if (selected !== null) {
                if (i === q.correct) state = 'correct'
                else if (i === selected) state = 'wrong'
              }
              return (
                <button key={i} onClick={() => pick(i)} disabled={selected !== null}
                  className="ob-quiz-option-btn" data-state={state}>
                  <span className="ob-option-letter">{['A','B','C','D'][i]}</span>
                  <span>{opt}</span>
                  {selected !== null && i === q.correct && <CheckCircle size={16} className="ob-option-status-icon icon-correct" />}
                  {selected !== null && i === selected && i !== q.correct && <XCircle size={16} className="ob-option-status-icon icon-wrong" />}
                </button>
              )
            })}
          </div>

          {showExp && (
            <div className="ob-explanation-box fade-up">
              <p className="ob-explanation-status">
                {selected === q.correct ? '✅ Bonne réponse !' : '❌ Pas tout à fait...'}
              </p>
              <p className="ob-explanation-text">{q.exp}</p>
            </div>
          )}

          {selected !== null && (
            <button className="btn-pri fade-up ob-next-btn" onClick={next}>
              {cur < QUESTIONS.length - 1 ? 'Question suivante' : 'Voir mon résultat'} →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}