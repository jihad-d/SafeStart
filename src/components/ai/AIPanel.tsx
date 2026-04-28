import React, { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'

const RESPONSES = [
  "Un wallet crypto c'est comme un compte bancaire numérique, mais sans banque ! Tu es le seul à contrôler tes fonds grâce à ta clé privée secrète. 🔑",
  "Les gas fees rémunèrent les validateurs du réseau. Sur Ethereum ils varient selon la congestion — sur Solana ils sont quasi nuls !",
  "La volatilité mesure les variations de prix. Bitcoin peut gagner ou perdre 10% en une journée — c'est normal mais il faut s'y préparer !",
  "Un swap te permet d'échanger directement une crypto contre une autre sans passer par des euros. Le slippage est la différence entre le prix affiché et le prix réel d'exécution.",
  "Le score de sécurité analyse : ton montant vs ton solde, la volatilité de la crypto et la validité de l'adresse pour les envois. Vert = tranquille, rouge = attention ! 🔴",
  "Pour diversifier, évite de mettre plus de 30% dans une seule crypto. Bitcoin et Ethereum sont généralement les plus stables pour débuter !",
  "La blockchain est un registre numérique partagé entre des milliers d'ordinateurs. Chaque transaction est inscrite définitivement — vérifie toujours avant d'envoyer !",
]

interface Message { role: 'user' | 'bot'; content: string }

export default function AIPanel({ initialMessage, className = '' }: { initialMessage?: string; className?: string }) {
  const { profile } = useAuth()
  const [messages, setMessages] = useState<Message[]>(
    initialMessage ? [{ role:'bot', content:initialMessage }] : []
  )
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [idx, setIdx] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages, typing])

  const send = () => {
    if (!input.trim() || typing) return
    const q = input.trim(); setInput('')
    setMessages(p => [...p, { role:'user', content:q }])
    setTyping(true)
    setTimeout(() => {
      setMessages(p => [...p, { role:'bot', content:RESPONSES[idx % RESPONSES.length] }])
      setIdx(i => i+1); setTyping(false)
    }, 1200)
  }

  const limitReached = (profile?.ai_messages_today ?? 0) >= (profile?.ai_messages_limit ?? 20)

  return (
    <div className={className} style={{
      background:'rgba(18,15,36,0.6)',
      backdropFilter:'blur(24px)',
      border:'1px solid rgba(124,92,252,0.2)',
      borderRadius:24,
      overflow:'hidden', display:'flex', flexDirection:'column',
      boxShadow:'0 8px 32px rgba(0,0,0,0.4)',
    }}>
      {/* Header */}
      <div style={{
        padding:'14px 18px',
        borderBottom:'1px solid rgba(124,92,252,0.12)',
        display:'flex', alignItems:'center', gap:10,
        background:'linear-gradient(135deg,rgba(124,92,252,0.12),rgba(79,53,210,0.06))',
      }}>
        <div style={{
          width:36, height:36, borderRadius:12,
          background:'linear-gradient(135deg,#7c5cfc,#4f35d2)',
          display:'flex', alignItems:'center', justifyContent:'center',
          color:'#fff', fontWeight:800, fontSize:16,
          boxShadow:'0 4px 14px rgba(124,92,252,0.4)',
          flexShrink:0,
        }}>S</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:800, color:'var(--tx)' }}>SafeBot</div>
          <div style={{ fontSize:10, color:'var(--tx3)' }}>Agent IA pédagogique</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:'#10b981' }} className="pulse" />
          <span style={{ fontSize:10, color:'#10b981', fontWeight:600 }}>En ligne</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', padding:14, display:'flex', flexDirection:'column', gap:10, maxHeight:260, minHeight:160 }}>
        {messages.length === 0 && (
          <div style={{ textAlign:'center', padding:'24px 0', color:'var(--tx3)', fontSize:13 }}>
            <div style={{ fontSize:28, marginBottom:8 }}>🤖</div>
            Pose-moi n'importe quelle question sur la crypto !
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth:'88%', padding:'10px 14px', borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            fontSize:13, lineHeight:1.55, whiteSpace:'pre-wrap',
            ...(m.role === 'user'
              ? { background:'linear-gradient(135deg,rgba(124,92,252,0.35),rgba(79,53,210,0.25))', color:'var(--tx)', border:'1px solid rgba(124,92,252,0.3)' }
              : { background:'rgba(255,255,255,0.05)', color:'var(--tx2)', border:'1px solid rgba(255,255,255,0.07)' })
          }}>{m.content}</div>
        ))}
        {typing && (
          <div style={{ alignSelf:'flex-start', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'16px 16px 16px 4px', padding:'12px 16px', display:'flex', gap:5 }}>
            {[0,1,2].map(i => <span key={i} style={{ width:7, height:7, borderRadius:'50%', background:'var(--pri2)', display:'inline-block' }} className={['dot1','dot2','dot3'][i]} />)}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {limitReached ? (
        <div style={{ padding:'12px 16px', borderTop:'1px solid rgba(124,92,252,0.1)', textAlign:'center' }}>
          <p style={{ fontSize:11, color:'var(--tx3)', marginBottom:8 }}>Limite journalière atteinte</p>
          <button className="btn-pri" style={{ fontSize:12, padding:'7px 18px' }}>Passer à Premium</button>
        </div>
      ) : (
        <div style={{ padding:'12px 14px', borderTop:'1px solid rgba(124,92,252,0.1)', display:'flex', gap:8, alignItems:'center' }}>
          <input
            className="glass-input"
            style={{ fontSize:13, padding:'10px 14px', flex:1, borderRadius:12 }}
            placeholder="Pose une question..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
          />
          <button className="btn-pri" style={{ flexShrink:0, width:38, height:38, padding:0, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:12 }} onClick={send}>
            <Send size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
