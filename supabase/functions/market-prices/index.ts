// Fonction Supabase (Edge Function) : cours des cryptos via CoinGecko.
// - la clé CoinGecko reste côté serveur (secret COINGECKO_API_KEY, facultatif)
// - un seul appel CoinGecko par minute, quel que soit le nombre de visiteurs
// - aucune adresse IP de visiteur n'est transmise à CoinGecko

const IDS = ['bitcoin', 'ethereum', 'solana', 'binancecoin', 'ripple', 'cardano', 'avalanche-2', 'chainlink']
const CACHE_MS = 60_000

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Coin = {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  price_change_percentage_24h: number
}

let cache: Coin[] = []
let cacheTs = 0

async function fetchPrices(): Promise<Coin[]> {
  const apiKey = Deno.env.get('COINGECKO_API_KEY')
  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=eur&ids=${IDS.join(',')}&order=market_cap_desc&per_page=20&sparkline=false`,
    { headers: apiKey ? { 'x-cg-demo-api-key': apiKey } : {}, signal: AbortSignal.timeout(5000) },
  )
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`)
  const data = await res.json()
  return data.map((c: Record<string, unknown>) => ({
    id: c.id,
    symbol: String(c.symbol).toUpperCase(),
    name: c.name,
    image: '',
    current_price: c.current_price,
    price_change_percentage_24h: c.price_change_percentage_24h,
  }))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    if (!cache.length || Date.now() - cacheTs > CACHE_MS) {
      cache = await fetchPrices()
      cacheTs = Date.now()
    }
  } catch (error) {
    console.error(error)
    if (!cache.length) {
      return new Response(JSON.stringify({ error: 'Prix indisponibles' }), {
        status: 502, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }
    // sinon : on renvoie le dernier cache connu
  }

  return new Response(JSON.stringify(cache), {
    headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
  })
})
