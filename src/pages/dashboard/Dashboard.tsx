import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Zap, TrendingUp, TrendingDown } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { fmtEur, fmtCrypto, DEFAULT_BALANCE_EUR } from '@/lib/utils'
import { useMarketPrices, usePortfolio } from '@/lib/hooks/usePortfolio'
import AssetIcon from '@/components/ui/AssetIcon'
import LevelIcon from '@/components/ui/LevelIcon'
import AIPanel from '@/components/ai/AIPanel.tsx'
import type { Transaction } from '@/types'
import './Dashboard.css'

const LEVEL_LABEL: Record<string,string> = { absolute_beginner:'Débutant absolu', curious_novice:'Novice curieux', intermediate:'Intermédiaire', advanced:'Avancé' }

const txLabel = (t:string) => t==='buy'?'Achat':t==='send'?'Envoi':'Swap'
const txColor = (t:string) => t==='buy'?'#10b981':t==='send'?'#ef4444':'#7c5cfc'
const scoreClass = (l:string) => l==='safe'?'score-safe':l==='warning'?'score-warning':'score-danger'

export default function Dashboard() {
  const { profile } = useAuth()
  const { prices } = useMarketPrices()
  const { positions, totalValue, totalPnl } = usePortfolio(prices)
  const [recentTxs, setRecentTxs] = useState<Transaction[]>([])
  const [txCount, setTxCount] = useState(0)

  useEffect(() => {
    const loadTransactions = async () => {
      if (!profile?.id || profile.id === 'demo' || !supabase) return
      const { data, count, error } = await supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(3)
      if (error) { console.error(error); return }
      setRecentTxs((data ?? []) as Transaction[])
      setTxCount(count ?? 0)
    }
    loadTransactions()
  }, [profile?.id])

  const balance = profile?.simulated_balance_eur ?? DEFAULT_BALANCE_EUR

  return (
    <div className="fade-up dashboard">

      {/* Header */}
      <div className="dashboard-header">
        <div>
          <div className="dashboard-greeting">Bon retour</div>
          <h1 className="dashboard-title">
            {profile?.username ?? profile?.email?.split('@')[0]},<br/>
            <span className="dashboard-title-gradient">
              <span className="ico-inline">{LEVEL_LABEL[profile?.level ?? 'absolute_beginner']} <LevelIcon level={profile?.level} size={22} color="var(--pri2)" aria-hidden="true" /></span>
            </span>
          </h1>
        </div>
        <Link to="/transactions" className="btn-pri dashboard-simulate-btn">
          <Zap size={15} />Simuler
        </Link>
      </div>

      {/* Stat cards */}
      <div className="dashboard-stats">
        <div className="grad-card">
          <div className="stat-card-label">Solde disponible</div>
          <div className="stat-card-value">{fmtEur(balance)}</div>
          <div className="stat-card-sub">Solde fictif · SafeStart</div>
        </div>

        <div className="stat-card">
          <div className="label-sm" style={{ marginBottom:12 }}>Valeur portfolio</div>
          <div className="stat-number grad-text">{fmtEur(totalValue)}</div>
          <div className="stat-pnl">
            {totalPnl >= 0 ? <TrendingUp size={13} color="#10b981" /> : <TrendingDown size={13} color="#ef4444" />}
            <span className={`stat-pnl-value ${totalPnl >= 0 ? 'positive' : 'negative'}`}>
              {totalPnl >= 0 ? '+' : ''}{fmtEur(totalPnl)} P&L
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="label-sm" style={{ marginBottom:12 }}>Points & progression</div>
          <div className="stat-number grad-text">{profile?.total_points ?? 0}</div>
          <div className="stat-tx-count">{txCount} transaction{txCount > 1 ? 's' : ''} simulée{txCount > 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* Main grid */}
      <div className="dashboard-main">

        {/* Portfolio */}
        <div className="glass-card-rich">
          <div className="portfolio-header">
            <span className="heading-md">Mon portfolio</span>
            <Link to="/wallet" className="portfolio-link">Voir tout <ArrowRight size={13} /></Link>
          </div>
          <div className="portfolio-list">
            {positions.length === 0 && (
              <p className="dashboard-empty">Aucune crypto pour l'instant. <Link to="/transactions">Simule ton premier achat</Link>.</p>
            )}
            {positions.slice(0, 4).map(a => (
              <div key={a.crypto_id} className="portfolio-asset">
                <AssetIcon symbol={a.crypto_symbol} image={a.crypto_image} className="portfolio-asset-icon" />
                <div style={{ flex:1 }}>
                  <div className="portfolio-asset-name">{a.crypto_name}</div>
                  <div className="portfolio-asset-qty">{fmtCrypto(a.quantity, a.crypto_symbol)}</div>
                </div>
                <div className="portfolio-asset-value">
                  <div className="portfolio-asset-eur">{fmtEur(a.value)}</div>
                  <div className={`portfolio-asset-pct ${a.pnlPct >= 0 ? 'positive' : 'negative'}`}>
                    {a.pnlPct >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {Math.abs(a.pnlPct).toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <AIPanel initialMessage={`Tu as ${fmtEur(balance)} de solde fictif disponible. Commence par une petite simulation pour te familiariser avec les frais et le score de sécurité.`} />
      </div>

      {/* Transactions récentes */}
      <div className="glass-card-rich">
        <div className="recent-header">
          <span className="heading-md">Transactions récentes</span>
          <Link to="/history" className="recent-link">Voir tout <ArrowRight size={13} /></Link>
        </div>
        <div>
          {recentTxs.length === 0 && (
            <p className="dashboard-empty">Aucune transaction pour l'instant.</p>
          )}
          {recentTxs.map((tx, i) => (
            <div key={tx.id} className="recent-tx" style={{ borderBottom: i < recentTxs.length-1 ? '1px solid var(--border2)' : 'none' }}>
              <div className="recent-tx-icon" style={{ background:`${txColor(tx.type)}20`, color:txColor(tx.type), border:`1px solid ${txColor(tx.type)}25` }}>
                {txLabel(tx.type)[0]}
              </div>
              <div style={{ flex:1 }}>
                <div className="recent-tx-label">{txLabel(tx.type)} {tx.crypto_name}</div>
                <div className="recent-tx-date">{new Date(tx.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
              </div>
              <div>
                <div className="recent-tx-amount">{fmtEur(tx.amount_eur ?? 0)}</div>
                <span className={`${scoreClass(tx.security_score_label)} recent-tx-score`}>{tx.security_score}/100</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}