import React from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw, ArrowRightLeft, TrendingUp, TrendingDown } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { fmtEur, fmtCrypto } from '@/lib/utils'
import AIPanel from '@/components/ai/AIPanel'
import toast from 'react-hot-toast'
import './Wallet.css'

const ASSETS = [
  { name: 'Bitcoin',   sym: 'BTC', qty: 0.003821, avg: 58000, price: 65240, color: '#f59e0b', icon: '₿' },
  { name: 'Ethereum',  sym: 'ETH', qty: 0.042,    avg: 3100,   price: 3185,  color: '#6366f1', icon: 'Ξ' },
  { name: 'Solana',    sym: 'SOL', qty: 0.52,     avg: 130,    price: 142.5, color: '#10b981', icon: '◎' },
]

export default function Wallet() {
  const { profile } = useAuth()
  const totalPortfolio = ASSETS.reduce((s, a) => s + a.qty * a.price, 0)
  const totalPnl = ASSETS.reduce((s, a) => s + (a.qty * a.price - a.qty * a.avg), 0)

  return (
    <div className="fade-up wallet-container">
      <div className="wallet-header">
        <h1 className="wallet-title">Mon Wallet</h1>
        <button className="btn-glass wallet-btn-content" onClick={() => toast.success('Prix actualisés !')}>
          <RefreshCw size={15} />Actualiser
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: '💶 Solde dispo', value: fmtEur(profile?.simulated_balance_eur ?? 750), color: '' },
          { label: '💎 Valeur crypto', value: fmtEur(totalPortfolio), color: '' },
          { label: '📊 P&L total', value: (totalPnl >= 0 ? '+' : '') + fmtEur(totalPnl), color: totalPnl >= 0 ? '#10b981' : '#ef4444' },
        ].map(s => (
          <div key={s.label} className="wallet-card">
            <div className="stat-label">{s.label}</div>
            <div 
              className={`stat-value ${!s.color ? 'wallet-value-gradient' : ''}`} 
              style={s.color ? { color: s.color } : {}}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="wallet-main-layout">
        {/* Assets */}
        <div className="wallet-card">
          <div className="assets-header">
            <span className="assets-title">Actifs ({ASSETS.length})</span>
            <Link to="/transactions" className="btn-glass assets-link-btn">
              <ArrowRightLeft size={13} />Nouvelle transaction
            </Link>
          </div>
          <div className="assets-list">
            {ASSETS.map(a => {
              const val = a.qty * a.price
              const pnl = a.qty * a.price - a.qty * a.avg
              const pnlPct = (pnl / (a.qty * a.avg)) * 100
              const isPnlPositive = pnlPct >= 0

              return (
                <div key={a.sym} className="asset-item">
                  <div 
                    className="asset-icon-wrapper" 
                    style={{ background: `${a.color}22`, color: a.color }}
                  >
                    {a.icon}
                  </div>
                  <div className="asset-info">
                    <div className="asset-name">
                      {a.name} <span className="asset-symbol">{a.sym}</span>
                    </div>
                    <div className="asset-qty">{fmtCrypto(a.qty, a.sym)}</div>
                  </div>
                  <div className="asset-values">
                    <div className="asset-fiat-val">{fmtEur(val)}</div>
                    <div className="asset-pnl-wrapper">
                      {isPnlPositive ? <TrendingUp size={12} color="#10b981" /> : <TrendingDown size={12} color="#ef4444" />}
                      <span 
                        className="asset-pnl-percentage" 
                        style={{ color: isPnlPositive ? '#10b981' : '#ef4444' }}
                      >
                        {isPnlPositive ? '+' : ''}{pnlPct.toFixed(2)}%
                      </span>
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