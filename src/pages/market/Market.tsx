import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, Search, ShoppingCart, TrendingUp, TrendingDown } from 'lucide-react'
import { getMarketPrices, MOCK_PRICES, fmtEur, fmtPct } from '@/lib/utils'
import type { CryptoAsset } from '@/types'
import toast from 'react-hot-toast'
import './Market.css'

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

  useEffect(() => {
    fetch().then(() => console.log('Prix chargés:', coins[0]?.current_price))
  }, [])

  const filtered = coins.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.symbol.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fade-up market-container">
      <div className="market-header">
        <div>
          <h1 className="market-title">Marché crypto</h1>
          <p className="market-subtitle">
            Mis à jour à {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <button className="btn-glass market-refresh-btn" onClick={fetch}>
          <RefreshCw size={15} className={loading ? 'spin' : ''} />Actualiser
        </button>
      </div>

      {/* Search */}
      <div className="market-search-wrapper">
        <Search size={15} className="market-search-icon" />
        <input className="glass-input market-search-input" placeholder="Rechercher Bitcoin, ETH..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="market-table-container">
        {/* Header */}
        <div className="market-table-header">
          {['Actif', 'Prix', '24h', 'Action'].map((h, i) => (
            <div key={h} className={`market-table-header-cell ${i > 0 ? 'text-right' : 'text-left'}`}>{h}</div>
          ))}
        </div>

        {loading && coins.length === 0 ? (
          <div className="market-skeleton-container">
            {[1,2,3,4].map(i => <div key={i} className="market-skeleton-row" />)}
          </div>
        ) : (
          filtered.map((coin, i) => (
            <div key={coin.id} className={`market-table-row ${i < filtered.length - 1 ? 'border-bottom' : 'border-none'}`}>

              <div className="market-coin-info">
                {coin.image
                  ? <img src={coin.image} alt={coin.name} className="market-coin-image" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  : <div className="market-coin-placeholder">{coin.symbol[0]}</div>
                }
                <div>
                  <div className="market-coin-name">{coin.name}</div>
                  <div className="market-coin-symbol">{coin.symbol}</div>
                </div>
              </div>

              <div className="market-coin-price">
                {fmtEur(coin.current_price, coin.current_price < 1 ? 4 : 2)}
              </div>

              <div className="market-coin-trend">
                {coin.price_change_percentage_24h >= 0 ? <TrendingUp size={13} color="#10b981" /> : <TrendingDown size={13} color="#ef4444" />}
                <span className={coin.price_change_percentage_24h >= 0 ? 'trend-positive' : 'trend-negative'}>
                  {fmtPct(coin.price_change_percentage_24h)}
                </span>
              </div>

              <div className="market-action-cell">
                <button className="btn-glass market-action-btn" onClick={() => navigate(`/transactions?crypto=${coin.id}`)}>
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