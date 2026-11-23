import React, { useState } from 'react'
import { assetColor } from '@/lib/utils'

/** Logo d'une crypto, avec repli sur sa première lettre si l'image ne charge pas. */
export default function AssetIcon({ symbol, image, className = '', size = 36 }: {
  symbol: string
  image?: string | null
  className?: string
  size?: number
}) {
  const [failed, setFailed] = useState(false)
  const color = assetColor(symbol)

  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        width: size, height: size, borderRadius: 12, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `${color}22`, color, border: `1px solid ${color}33`, fontWeight: 800,
      }}
    >
      {image && !failed
        ? <img src={image} alt="" width={size * 0.6} height={size * 0.6} onError={() => setFailed(true)} />
        : symbol.charAt(0)}
    </div>
  )
}
