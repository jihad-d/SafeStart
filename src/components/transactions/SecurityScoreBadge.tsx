import React, { useState } from 'react'
import { X, Info } from 'lucide-react'
import type { SecurityScore } from '@/types'

const LABELS = { safe: 'Faible risque', warning: 'Risque modéré', danger: 'Risque élevé' }
const COLORS = { safe: 'var(--safe)', warning: 'var(--warn)', danger: 'var(--danger)' }

export default function SecurityScoreBadge({ score }: { score: SecurityScore }) {
  const [open, setOpen] = useState(false)
  const r = 22, circ = 2 * Math.PI * r, dash = (score.score / 100) * circ
  const col = COLORS[score.label]
  const cls = score.label === 'safe' ? 'score-safe' : score.label === 'warning' ? 'score-warning' : 'score-danger'

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <svg width={56} height={56} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
          <circle cx={28} cy={28} r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth={3.5} />
          <circle cx={28} cy={28} r={r} fill="none" stroke={col} strokeWidth={3.5} strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`} style={{ transition: 'stroke-dasharray .7s ease' }} />
        </svg>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: col }}>{score.score}</span>
            <span style={{ fontSize: 11, color: 'var(--tx3)' }}>/100</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className={cls}>{LABELS[score.label]}</span>
            <button onClick={() => setOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx3)', padding: 0, display: 'flex' }}>
              <Info size={14} />
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)' }} onClick={() => setOpen(false)} />
          <div className="glass-card fade-up" style={{ position: 'relative', zIndex: 1, maxWidth: 420, width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontWeight: 700, fontSize: 16, color: 'var(--tx)' }}>Détail du score : {score.score}/100</h3>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx3)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {score.details.map((d, i) => (
                <div key={i} style={{ background: 'var(--glass2)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 12 }}>{d.impact === 'positive' ? '✅' : d.impact === 'negative' ? '❌' : '⚠️'}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: d.impact === 'positive' ? 'var(--safe)' : d.impact === 'negative' ? 'var(--danger)' : 'var(--warn)' }}>{d.label}</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--tx2)', lineHeight: 1.5 }}>{d.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
