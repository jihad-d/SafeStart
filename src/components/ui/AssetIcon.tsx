import React from 'react'
import { assetColor } from '@/lib/utils'

/**
 * Pastille d'une crypto (initiale sur sa couleur).
 * Volontairement sans logo distant : charger les images depuis CoinGecko
 * transmettrait l'adresse IP des visiteurs à un tiers (RGPD).
 */
export default function AssetIcon({ symbol, className = '', size = 36 }: {
  symbol: string
  /** Conservé pour compatibilité, non utilisé (pas de chargement d'image externe) */
  image?: string | null
  className?: string
  size?: number
}) {
  const color = assetColor(symbol)

  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        width: size, height: size, borderRadius: 12, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `${color}22`, color, border: `1px solid ${color}33`,
        fontWeight: 800, fontSize: size * 0.42,
      }}
    >
      {symbol.charAt(0)}
    </div>
  )
}
