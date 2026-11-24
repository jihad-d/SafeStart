import { Trophy, ShieldCheck, Send, Globe, Repeat, Rocket } from 'lucide-react'
import type { ElementType } from 'react'
import type { Transaction } from '@/types'

export interface ChallengeContext {
  transactions: Transaction[]
  /** Nombre de cryptos différentes actuellement détenues */
  holdings: number
}

export interface Challenge {
  title: string
  desc: string
  level: 'Débutant' | 'Intermédiaire' | 'Avancé'
  icon: ElementType
  target: number
  /** Badge débloqué (code en base) et points crédités côté serveur */
  badge: string
  reward: number
  /** Progression actuelle (plafonnée à `target` à l'affichage) */
  progress: (ctx: ChallengeContext) => number
}

const ofType = (txs: Transaction[], type: Transaction['type']) => txs.filter(t => t.type === type)

/** Challenges calculés à partir des vraies transactions de l'utilisateur. */
export const CHALLENGES: Challenge[] = [
  {
    title: 'Premier achat', level: 'Débutant', icon: Trophy, target: 1, badge: 'first_buy', reward: 50,
    desc: 'Simule ton premier achat de cryptomonnaie.',
    progress: ({ transactions }) => ofType(transactions, 'buy').length,
  },
  {
    title: 'Acheteur prudent', level: 'Débutant', icon: ShieldCheck, target: 1, badge: 'careful_btc_buyer', reward: 100,
    desc: "Achète du BTC avec un score de sécurité d'au moins 70/100.",
    progress: ({ transactions }) =>
      ofType(transactions, 'buy').filter(t => t.crypto_symbol === 'BTC' && t.security_score >= 70).length,
  },
  {
    title: 'Envoi sécurisé', level: 'Débutant', icon: Send, target: 1, badge: 'secure_send', reward: 100,
    desc: "Réalise un envoi avec un score de sécurité d'au moins 70/100.",
    progress: ({ transactions }) => ofType(transactions, 'send').filter(t => t.security_score >= 70).length,
  },
  {
    title: 'Portefeuille diversifié', level: 'Intermédiaire', icon: Globe, target: 3, badge: 'diversified', reward: 150,
    desc: 'Détiens au moins 3 cryptos différentes en même temps.',
    progress: ({ holdings }) => holdings,
  },
  {
    title: 'Swap intelligent', level: 'Intermédiaire', icon: Repeat, target: 1, badge: 'smart_swap', reward: 150,
    desc: 'Réalise un swap avec un slippage inférieur à 1 %.',
    progress: ({ transactions }) =>
      ofType(transactions, 'swap').filter(t => (t.slippage_percentage ?? 100) < 1).length,
  },
  {
    title: 'Explorateur DeFi', level: 'Avancé', icon: Rocket, target: 5, badge: 'defi_explorer', reward: 250,
    desc: 'Réalise 5 swaps entre des paires de cryptos différentes.',
    progress: ({ transactions }) =>
      new Set(ofType(transactions, 'swap').map(t => `${t.from_crypto_symbol}>${t.to_crypto_symbol}`)).size,
  },
]

export const LEVEL_COLORS: Record<Challenge['level'], string> = {
  'Débutant': '#10b981',
  'Intermédiaire': '#7c5cfc',
  'Avancé': '#f59e0b',
}

export function evaluateChallenges(ctx: ChallengeContext) {
  return CHALLENGES.map(c => {
    const current = Math.min(c.progress(ctx), c.target)
    return { ...c, current, done: current >= c.target }
  })
}
