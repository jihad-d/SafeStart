import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getMarketPrices, MOCK_PRICES } from '@/lib/utils'
import { useAuth } from '@/lib/hooks/useAuth'
import type { CryptoAsset, PortfolioAsset } from '@/types'

/** Prix du marché en direct, avec repli sur des prix de secours si CoinGecko est indisponible. */
export function useMarketPrices() {
  const [prices, setPrices] = useState<CryptoAsset[]>(MOCK_PRICES)
  const [loading, setLoading] = useState(true)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

  const refresh = useCallback(async (force = false) => {
    setLoading(true)
    const data = await getMarketPrices(force)
    setPrices(data)
    setUpdatedAt(new Date())
    setLoading(false)
    return data
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return { prices, loading, updatedAt, refresh }
}

export interface PortfolioPosition extends PortfolioAsset {
  /** Prix du marché actuel (direct), ou dernier prix connu */
  livePrice: number
  value: number
  pnl: number
  pnlPct: number
}

/** Portfolio simulé de l'utilisateur, valorisé aux prix du marché. */
export function usePortfolio(prices: CryptoAsset[]) {
  const { profile } = useAuth()
  const [rows, setRows] = useState<PortfolioAsset[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!profile?.id || profile.id === 'demo' || !supabase) {
      setRows([]); setLoading(false); return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('portfolio_assets')
      .select('*')
      .eq('user_id', profile.id)
      .gt('quantity', 0)
    if (error) console.error(error)
    setRows((data ?? []) as PortfolioAsset[])
    setLoading(false)
  }, [profile?.id])

  useEffect(() => { reload() }, [reload])

  const positions: PortfolioPosition[] = rows
    .map(asset => {
      const livePrice = prices.find(p => p.id === asset.crypto_id)?.current_price ?? asset.current_price ?? asset.avg_buy_price
      const value = asset.quantity * livePrice
      const cost = asset.quantity * asset.avg_buy_price
      const pnl = value - cost
      return { ...asset, livePrice, value, pnl, pnlPct: cost > 0 ? (pnl / cost) * 100 : 0 }
    })
    .sort((a, b) => b.value - a.value)

  const totalValue = positions.reduce((s, p) => s + p.value, 0)
  const totalPnl = positions.reduce((s, p) => s + p.pnl, 0)

  return { positions, totalValue, totalPnl, loading, reload }
}
