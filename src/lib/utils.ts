import type { CryptoAsset, SecurityScore, TxType } from '@/types'

// ─── Mock fallback data (toujours dispo) ──────────────────────
export const MOCK_PRICES: CryptoAsset[] = [
  { id: 'bitcoin',     symbol: 'BTC',  name: 'Bitcoin',   image: 'https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png',   current_price: 65240, price_change_percentage_24h:  2.14 },
  { id: 'ethereum',    symbol: 'ETH',  name: 'Ethereum',  image: 'https://assets.coingecko.com/coins/images/279/thumb/ethereum.png', current_price:  3185, price_change_percentage_24h: -0.87 },
  { id: 'solana',      symbol: 'SOL',  name: 'Solana',    image: 'https://assets.coingecko.com/coins/images/4128/thumb/solana.png',  current_price:   143, price_change_percentage_24h:  5.21 },
  { id: 'binancecoin', symbol: 'BNB',  name: 'BNB',       image: 'https://assets.coingecko.com/coins/images/825/thumb/bnb-icon2_2x.png', current_price: 578, price_change_percentage_24h: 0.43 },
  { id: 'ripple',      symbol: 'XRP',  name: 'XRP',       image: 'https://assets.coingecko.com/coins/images/44/thumb/xrp-symbol-white-128.png', current_price: 0.582, price_change_percentage_24h: -1.24 },
  { id: 'cardano',     symbol: 'ADA',  name: 'Cardano',   image: 'https://assets.coingecko.com/coins/images/975/thumb/cardano.png', current_price: 0.421, price_change_percentage_24h: 1.05 },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', image: 'https://assets.coingecko.com/coins/images/12559/thumb/Avalanche_Circle_RedWhite_Trans.png', current_price: 28.4, price_change_percentage_24h: -2.1 },
  { id: 'chainlink',   symbol: 'LINK', name: 'Chainlink', image: 'https://assets.coingecko.com/coins/images/877/thumb/chainlink-new-logo.png', current_price: 14.2, price_change_percentage_24h: 3.2 },
]

// ─── CoinGecko fetch (best effort) ────────────────────────────
let cachedPrices: CryptoAsset[] = []
let cacheTs = 0

export async function getMarketPrices(): Promise<CryptoAsset[]> {
  if (cachedPrices.length && Date.now() - cacheTs < 60_000) return cachedPrices
  try {
    const ids = MOCK_PRICES.map(c => c.id).join(',')
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=eur&ids=${ids}&order=market_cap_desc&per_page=20&sparkline=false`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (!res.ok) throw new Error()
    const data = await res.json()
    cachedPrices = data.map((c: Record<string, unknown>) => ({
      id: c.id,
      symbol: (c.symbol as string).toUpperCase(),
      name: c.name,
      image: c.image,
      current_price: c.current_price,
      price_change_percentage_24h: c.price_change_percentage_24h,
    }))
    cacheTs = Date.now()
    return cachedPrices
  } catch {
    return MOCK_PRICES // fallback silencieux
  }
}

// ─── Formatters ────────────────────────────────────────────────
export const fmtEur = (n: number, d = 2) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: d, maximumFractionDigits: d }).format(n)

export const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`

export const fmtCrypto = (qty: number, sym: string) =>
  `${qty < 0.01 ? qty.toFixed(8) : qty < 1 ? qty.toFixed(4) : qty.toFixed(6)} ${sym}`

// ─── Security score ────────────────────────────────────────────
export function calcSecurityScore(
  type: TxType,
  amountEur: number,
  balanceEur: number,
  portfolioEur: number,
  volatility = 0,
  slippage = 0,
  addressValid = true,
): SecurityScore {
  let penalty = 0
  const details: SecurityScore['details'] = []

  // 1. % du solde utilisé
  const pctBalance = balanceEur > 0 ? (amountEur / balanceEur) * 100 : 0
  if (pctBalance >= 90) { penalty += 30; details.push({ label: 'Solde utilisé', description: `Tu utilises ${pctBalance.toFixed(0)}% de ton solde — garde une réserve !`, impact: 'negative' }) }
  else if (pctBalance >= 50) { penalty += 12; details.push({ label: 'Solde utilisé', description: `${pctBalance.toFixed(0)}% du solde — utilisation modérée.`, impact: 'negative' }) }
  else details.push({ label: 'Solde utilisé', description: `Seulement ${pctBalance.toFixed(0)}% du solde — bien géré.`, impact: 'positive' })

  // 2. Volatilité
  const vol = Math.abs(volatility)
  if (vol >= 10) { penalty += 20; details.push({ label: 'Volatilité', description: `La crypto a varié de ${vol.toFixed(1)}% sur 24h — très volatile.`, impact: 'negative' }) }
  else if (vol >= 5) { penalty += 8; details.push({ label: 'Volatilité', description: `Variation de ${vol.toFixed(1)}% — volatilité modérée.`, impact: 'negative' }) }
  else details.push({ label: 'Volatilité', description: `Variation de ${vol.toFixed(1)}% — marché relativement stable.`, impact: 'positive' })

  // 3. Slippage (swap)
  if (type === 'swap') {
    if (slippage >= 5) { penalty += 25; details.push({ label: 'Slippage', description: `${slippage.toFixed(2)}% de slippage — tu pourrais recevoir bien moins que prévu.`, impact: 'negative' }) }
    else if (slippage >= 2) { penalty += 10; details.push({ label: 'Slippage', description: `${slippage.toFixed(2)}% de slippage — modéré.`, impact: 'negative' }) }
    else details.push({ label: 'Slippage', description: `${slippage.toFixed(2)}% de slippage — excellent !`, impact: 'positive' })
  }

  // 4. Adresse (send)
  if (type === 'send') {
    if (!addressValid) { penalty += 25; details.push({ label: 'Adresse', description: 'Format invalide — vérifie chaque caractère !', impact: 'negative' }) }
    else details.push({ label: 'Adresse', description: 'Format d\'adresse valide détecté.', impact: 'positive' })
  }

  const score = Math.max(0, Math.round(100 - penalty))
  const label: SecurityScore['label'] = score >= 70 ? 'safe' : score >= 40 ? 'warning' : 'danger'
  return { score, label, details }
}

export const validateAddress = (addr: string) =>
  /^0x[a-fA-F0-9]{40}$/.test(addr) ||
  /^[13][a-zA-Z0-9]{24,33}$/.test(addr) ||
  /^bc1[a-zA-Z0-9]{39,59}$/.test(addr)

export const simulateFees = (amount: number) => parseFloat((amount * 0.005).toFixed(2))
export const simulateGas  = () => parseFloat((0.5 + Math.random() * 2).toFixed(2))
export const simulateSlippage = (amount: number) => parseFloat((0.3 + (amount / 1000) * 1.5 + Math.random()).toFixed(2))
