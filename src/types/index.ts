export type UserLevel = 'absolute_beginner' | 'curious_novice' | 'intermediate' | 'advanced'

export interface UserProfile {
  id: string
  email: string
  username: string | null
  level: UserLevel
  onboarding_completed: boolean
  onboarding_score?: number
  simulated_balance_eur: number
  total_points: number
  is_premium: boolean
  ai_messages_today: number
  ai_messages_limit: number
}

export interface CryptoAsset {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  price_change_percentage_24h: number
}

export interface PortfolioAsset {
  id: string
  crypto_id: string
  crypto_symbol: string
  crypto_name: string
  crypto_image: string
  quantity: number
  avg_buy_price: number
  current_price?: number
  total_value?: number
  pnl?: number
  pnl_percentage?: number
}

export type TxType = 'buy' | 'send' | 'swap'
export type ScoreLabel = 'safe' | 'warning' | 'danger'

export interface Transaction {
  id: string
  user_id: string
  type: TxType
  crypto_name: string
  crypto_symbol: string
  amount_eur?: number
  quantity?: number
  fees_eur?: number
  to_address?: string
  gas_fee_eur?: number
  from_crypto_symbol?: string
  to_crypto_symbol?: string
  slippage_percentage?: number
  security_score: number
  security_score_label: ScoreLabel
  ai_comment: string
  created_at: string
}

export interface SecurityScore {
  score: number
  label: ScoreLabel
  details: { label: string; description: string; impact: 'positive' | 'negative' | 'neutral' }[]
}
