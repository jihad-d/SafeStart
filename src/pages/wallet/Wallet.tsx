import React from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw, ArrowRightLeft, TrendingUp, TrendingDown } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { fmtEur, fmtCrypto } from '@/lib/utils'
import AIPanel from '@/components/ai/AIPanel'
import toast from 'react-hot-toast'

const ASSETS = [
  { name: 'Bitcoin',   sym: 'BTC', qty: 0.003821, avg: 58000, price: 65240, color: '#f59e0b', icon: '₿' },
  { name: 'Ethereum',  sym: 'ETH', qty: 0.042,    avg: 3100,  price: 3185,  color: '#6366f1', icon: 'Ξ' },
  { name: 'Solana',    sym: 'SOL', qty: 0.52,     avg: 130,   price: 142.5, color: '#10b981', icon: '◎' },
]

const card: React.CSSProperties = { background: 'var(--glass)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }

export default function Wallet() {
  const { profile } = useAuth()
  const totalPortfolio = ASSETS.reduce((s, a) => s + a.qty * a.price, 0)
  const totalPnl = ASSETS.reduce((s, a) => s + (a.qty * a.price - a.qty * a.avg), 0)

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--tx)' }}>Mon Wallet</h1>
        <button className="btn-glass" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => toast.success('Prix actualisés !')}>
          <RefreshCw size={15} />Actualiser
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
        {[
          { label: '💶 Solde dispo', value: fmtEur(profile?.simulated_balance_eur ?? 750), color: '' },
          { label: '💎 Valeur crypto', value: fmtEur(totalPortfolio), color: '' },
          { label: '📊 P&L total', value: (totalPnl >= 0 ? '+' : '') + fmtEur(totalPnl), color: totalPnl >= 0 ? '#10b981' : '#ef4444' },
        ].map(s => (
          <div key={s.label} style={card}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--tx3)', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, ...(s.color ? { color: s.color } : { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }) }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        {/* Assets */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx)' }}>Actifs ({ASSETS.length})</span>
            <Link to="/transactions" className="btn-glass" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '7px 14px', textDecoration: 'none' }}>
              <ArrowRightLeft size={13} />Nouvelle transaction
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ASSETS.map(a => {
              const val = a.qty * a.price
              const pnl = a.qty * a.price - a.qty * a.avg
              const pnlPct = (pnl / (a.qty * a.avg)) * 100
              return (
                <div key={a.sym} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 14, background: 'var(--glass2)', border: '1px solid var(--border)', transition: 'all .2s' }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: `${a.color}22`, color: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, flexShrink: 0 }}>{a.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)' }}>{a.name} <span style={{ fontSize: 11, color: 'var(--tx3)', fontWeight: 400 }}>{a.sym}</span></div>
                    <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 2 }}>{fmtCrypto(a.qty, a.sym)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)' }}>{fmtEur(val)}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 2 }}>
                      {pnlPct >= 0 ? <TrendingUp size={12} color="#10b981" /> : <TrendingDown size={12} color="#ef4444" />}
                      <span style={{ fontSize: 12, fontWeight: 600, color: pnlPct >= 0 ? '#10b981' : '#ef4444' }}>{pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <AIPanel initialMessage="Voici ton wallet simulé ! Demande-moi comment diversifier ton portfolio ou ce que signifie le P&L 📊" />
      </div>
    </div>
  )
}
