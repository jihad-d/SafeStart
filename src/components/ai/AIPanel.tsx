import React from 'react'
import { MessageCircle, PauseCircle } from 'lucide-react'

// SafeBot est suspendu : aucun appel à un service d'IA n'est effectué.
// Le panneau affiche uniquement le message d'accompagnement statique de la page.

export default function AIPanel({ initialMessage, className = '' }: { initialMessage?: string; className?: string }) {
  return (
    <div className={className} style={{
      background: 'var(--glass)',
      backdropFilter: 'blur(24px)',
      border: '1px solid var(--border)',
      borderRadius: 24,
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      boxShadow: 'var(--shadow)',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 12,
          background: 'var(--pri)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', flexShrink: 0,
        }}>
          <MessageCircle size={18} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--tx)' }}>SafeBot</div>
          <div style={{ fontSize: 10, color: 'var(--tx3)' }}>Assistant pédagogique</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--tx3)' }}>
          <PauseCircle size={14} />
          <span style={{ fontSize: 10, fontWeight: 600 }}>En pause</span>
        </div>
      </div>

      {/* Message */}
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {initialMessage && (
          <div style={{
            alignSelf: 'flex-start', maxWidth: '100%', padding: '10px 14px',
            borderRadius: '16px 16px 16px 4px',
            fontSize: 13, lineHeight: 1.55, whiteSpace: 'pre-wrap',
            background: 'var(--glass2)', color: 'var(--tx2)', border: '1px solid var(--border)',
          }}>{initialMessage}</div>
        )}
      </div>

      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'var(--tx3)' }}>
          Les échanges avec SafeBot sont temporairement suspendus.
        </p>
      </div>
    </div>
  )
}
