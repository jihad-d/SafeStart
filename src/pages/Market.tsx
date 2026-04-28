import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, Search, ShoppingCart, TrendingUp, TrendingDown } from 'lucide-react'
import { getMarketPrices, MOCK_PRICES, fmtEur, fmtPct } from '@/lib/utils'
import type { CryptoAsset } from '@/types'
import toast from 'react-hot-toast'

export default function Market() {
  const navigate = useNavigate()
  const [coins, setCoins] = useState<CryptoAsset[]>(MOCK_PRICES)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [lastUpdate, setLastUpdate] = useState(new Date())

  const fetch = async () => {
    setLoading(true)
    const data = await getMarketPrices()
    setCoins(data)
    setLastUpdate(new Date())
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  const filtered = coins.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.symbol.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--tx)' }}>Marché crypto</h1>
          <p style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 4 }}>
            Mis à jour à {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <button className="btn-glass" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={fetch}>
          <RefreshCw size={15} className={loading ? 'spin' : ''} />Actualiser
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 320 }}>
        <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--tx3)' }} />
        <input className="glass-input" style={{ paddingLeft: 40 }} placeholder="Rechercher Bitcoin, ETH..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div style={{ background: 'var(--glass)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
          {['Actif', 'Prix', '24h', 'Action'].map((h, i) => (
            <div key={h} style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--tx3)', textAlign: i > 0 ? 'right' : 'left' }}>{h}</div>
          ))}
        </div>

        {loading && coins.length === 0 ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3,4].map(i => <div key={i} style={{ height: 52, borderRadius: 12, background: 'var(--glass2)', animation: 'pulse 1.5s infinite' }} />)}
          </div>
        ) : (
          filtered.map((coin, i) => (
            <div key={coin.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12, padding: '14px 20px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center', cursor: 'pointer', transition: 'background .15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--glass2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {coin.image
                  ? <img src={coin.image} alt={coin.name} style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  : <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{coin.symbol[0]}</div>
                }
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)' }}>{coin.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--tx3)' }}>{coin.symbol}</div>
                </div>
              </div>

              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {fmtEur(coin.current_price, coin.current_price < 1 ? 4 : 2)}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                {coin.price_change_percentage_24h >= 0 ? <TrendingUp size={13} color="#10b981" /> : <TrendingDown size={13} color="#ef4444" />}
                <span style={{ fontSize: 13, fontWeight: 600, color: coin.price_change_percentage_24h >= 0 ? '#10b981' : '#ef4444' }}>
                  {fmtPct(coin.price_change_percentage_24h)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn-glass" style={{ fontSize: 12, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 5 }}
                  onClick={() => navigate(`/transactions?crypto=${coin.id}`)}>
                  <ShoppingCart size={13} />Simuler
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
