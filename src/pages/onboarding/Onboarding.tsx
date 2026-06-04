import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'

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

  const wrap: React.CSSProperties = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', zIndex: 1 }

  if (phase === 'intro') return (
    <div style={wrap}>
      <div className="glass-card fade-up" style={{ maxWidth: 480, width: '100%', textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🎯</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--tx)', marginBottom: 12 }}>Évaluation de niveau</h1>
        <p style={{ fontSize: 14, color: 'var(--tx2)', lineHeight: 1.7, marginBottom: 24 }}>
          Réponds à <strong>{QUESTIONS.length} questions rapides</strong> sur la crypto.<br/>
          Pas de pression — c'est pour adapter SafeStart à toi. 😊
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--glass2)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', marginBottom: 24, textAlign: 'left' }}>
          <span style={{ fontSize: 24 }}>⏱️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)' }}>Environ 2 minutes</div>
            <div style={{ fontSize: 12, color: 'var(--tx3)' }}>Tu peux refaire l'évaluation depuis les paramètres</div>
          </div>
        </div>
        <button className="btn-pri" style={{ width: '100%', padding: 13 }} onClick={() => setPhase('quiz')}>
          Commencer l'évaluation <ChevronRight size={16} style={{ display: 'inline' }} />
        </button>
      </div>
    </div>
  )

  if (phase === 'result') return (
    <div style={wrap}>
      <div className="glass-card fade-up" style={{ maxWidth: 480, width: '100%', textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 60, marginBottom: 12 }}>{levelInfo.emoji}</div>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: 'var(--tx)', marginBottom: 6 }}>{levelInfo.label}</h2>
        <div style={{ fontSize: 13, color: 'var(--tx3)', marginBottom: 16 }}>{finalScore} / {QUESTIONS.length} bonnes réponses</div>
        <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,.08)', overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', width: `${(finalScore/QUESTIONS.length)*100}%`, transition: 'width 1s' }} />
        </div>
        <div style={{ background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.15)', borderRadius: 12, padding: 16, marginBottom: 24, textAlign: 'left' }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--pri)' }}>💡 SafeBot</div>
          <p style={{ fontSize: 13, color: 'var(--tx2)', lineHeight: 1.6 }}>
            Bienvenue sur SafeStart ! Ton profil <strong>"{levelInfo.label}"</strong> a été enregistré.
            {levelInfo.id === 'absolute_beginner' && " Je vais t'expliquer chaque concept avec des exemples simples du quotidien."}
            {levelInfo.id === 'curious_novice' && " Je vais approfondir tes connaissances progressivement."}
            {levelInfo.id === 'intermediate' && " On va directement aller dans les détails techniques qui t'intéressent !"}
            {" Commence par simuler ton premier achat crypto ! 🚀"}
          </p>
        </div>
        <button className="btn-pri" style={{ width: '100%', padding: 13 }} onClick={() => navigate('/dashboard')}>
          Accéder à mon tableau de bord
        </button>
      </div>
    </div>
  )

  return (
    <div style={wrap}>
      <div style={{ maxWidth: 520, width: '100%' }} className="fade-up">
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--tx3)', marginBottom: 8 }}>
            <span>Question {cur + 1} / {QUESTIONS.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', width: `${progress}%`, transition: 'width .5s' }} />
          </div>
        </div>

        <div className="glass-card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--tx)', marginBottom: 20 }}>{q.q}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.opts.map((opt, i) => {
              let bg = 'var(--glass)', border = 'var(--border)', color = 'var(--tx2)'
              if (selected !== null) {
                if (i === q.correct) { bg = 'rgba(16,185,129,.12)'; border = 'rgba(16,185,129,.4)'; color = '#10b981' }
                else if (i === selected) { bg = 'rgba(239,68,68,.12)'; border = 'rgba(239,68,68,.4)'; color = '#ef4444' }
              }
              return (
                <button key={i} onClick={() => pick(i)} disabled={selected !== null}
                  style={{ width: '100%', textAlign: 'left', padding: '12px 16px', borderRadius: 12, background: bg, border: `1px solid ${border}`, color, fontSize: 14, fontFamily: 'inherit', cursor: selected !== null ? 'default' : 'pointer', transition: 'all .2s', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{['A','B','C','D'][i]}</span>
                  <span>{opt}</span>
                  {selected !== null && i === q.correct && <CheckCircle size={16} style={{ marginLeft: 'auto', color: '#10b981', flexShrink: 0 }} />}
                  {selected !== null && i === selected && i !== q.correct && <XCircle size={16} style={{ marginLeft: 'auto', color: '#ef4444', flexShrink: 0 }} />}
                </button>
              )
            })}
          </div>

          {showExp && (
            <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.15)' }} className="fade-up">
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--pri)', marginBottom: 4 }}>
                {selected === q.correct ? '✅ Bonne réponse !' : '❌ Pas tout à fait...'}
              </p>
              <p style={{ fontSize: 13, color: 'var(--tx2)', lineHeight: 1.6 }}>{q.exp}</p>
            </div>
          )}

          {selected !== null && (
            <button className="btn-pri fade-up" style={{ width: '100%', padding: 13, marginTop: 16 }} onClick={next}>
              {cur < QUESTIONS.length - 1 ? 'Question suivante' : 'Voir mon résultat'} →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
