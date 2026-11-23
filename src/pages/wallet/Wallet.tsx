import React from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw, ArrowRightLeft, TrendingUp, TrendingDown, Euro, Coins, BarChart3 } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { fmtEur, fmtCrypto, DEFAULT_BALANCE_EUR } from '@/lib/utils'
import AIPanel from '@/components/ai/AIPanel'
import AssetIcon from '@/components/ui/AssetIcon'
import { useMarketPrices, usePortfolio } from '@/lib/hooks/usePortfolio'
import toast from 'react-hot-toast'
import './Wallet.css'

export default function Wallet() {
  const { profile } = useAuth()
  const { prices, loading: pricesLoading, refresh } = useMarketPrices()
  const { positions, totalValue, totalPnl, loading } = usePortfolio(prices)

  const refreshPrices = async () => {
    await refresh(true)
    toast.success('Prix actualisés !')
  }

  return (
    <div className="fade-up wallet-container">
      <div className="wallet-header">
        <h1 className="wallet-title">Mon Wallet</h1>
        <button className="btn-glass wallet-btn-content" onClick={refreshPrices} disabled={pricesLoading}>
          <RefreshCw size={15} className={pricesLoading ? 'spin' : ''} />Actualiser les prix
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { icon: Euro, label: 'Solde dispo', value: fmtEur(profile?.simulated_balance_eur ?? DEFAULT_BALANCE_EUR), color: '' },
          { icon: Coins, label: 'Valeur crypto', value: fmtEur(totalValue), color: '' },
          { icon: BarChart3, label: 'P&L total', value: (totalPnl >= 0 ? '+' : '') + fmtEur(totalPnl), color: totalPnl >= 0 ? '#10b981' : '#ef4444' },
        ].map(s => (
          <div key={s.label} className="wallet-card">
            <div className="stat-label ico-inline"><s.icon size={14} />{s.label}</div>
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
            <span className="assets-title">Actifs ({positions.length})</span>
            <Link to="/transactions" className="btn-glass assets-link-btn">
              <ArrowRightLeft size={13} />Nouvelle transaction
            </Link>
          </div>
          <div className="assets-list">
            {loading && <p className="wallet-empty">Chargement de ton portfolio…</p>}
            {!loading && positions.length === 0 && (
              <div className="wallet-empty">
                <p>Tu ne détiens encore aucune crypto simulée.</p>
                <Link to="/transactions" className="btn-pri">Simuler un premier achat</Link>
              </div>
            )}
            {positions.map(a => {
              const isPnlPositive = a.pnl >= 0
              return (
                <div key={a.crypto_id} className="asset-item">
                  <AssetIcon symbol={a.crypto_symbol} image={a.crypto_image} className="asset-icon-wrapper" />
                  <div className="asset-info">
                    <div className="asset-name">
                      {a.crypto_name} <span className="asset-symbol">{a.crypto_symbol}</span>
                    </div>
                    <div className="asset-qty">{fmtCrypto(a.quantity, a.crypto_symbol)} · achat moyen {fmtEur(a.avg_buy_price)}</div>
                  </div>
                  <div className="asset-values">
                    <div className="asset-fiat-val">{fmtEur(a.value)}</div>
                    <div className="asset-pnl-wrapper">
                      {isPnlPositive ? <TrendingUp size={12} color="#10b981" /> : <TrendingDown size={12} color="#ef4444" />}
                      <span className="asset-pnl-percentage" style={{ color: isPnlPositive ? '#10b981' : '#ef4444' }}>
                        {isPnlPositive ? '+' : ''}{a.pnlPct.toFixed(2)}% ({isPnlPositive ? '+' : ''}{fmtEur(a.pnl)})
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <AIPanel initialMessage="Voici ton wallet simulé. Le P&L indique ton gain ou ta perte latente : compare-le au prix d'achat moyen de chaque crypto." />
      </div>
    </div>
  )
}