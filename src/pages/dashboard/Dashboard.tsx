import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Zap, TrendingUp, TrendingDown } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { fmtEur } from '@/lib/utils'
import AIPanel from '@/components/ai/AIPanel.tsx'
import type { PortfolioAsset } from '@/types'
import './Dashboard.css'

const LEVEL_EMOJI: Record<string,string> = { absolute_beginner:'🌱', curious_novice:'🔍', intermediate:'⚡', advanced:'🚀' }
const LEVEL_LABEL: Record<string,string> = { absolute_beginner:'Débutant absolu', curious_novice:'Novice curieux', intermediate:'Intermédiaire', advanced:'Avancé' }

const RECENT_TXS = [
  { type:'buy',  name:'Bitcoin',  sym:'BTC', amount:100, score:82, label:'safe',    date:'10 avr', color:'#10b981' },
  { type:'send', name:'Ethereum', sym:'ETH', amount:50,  score:61, label:'warning', date:'09 avr', color:'#ef4444' },
  { type:'swap', name:'Solana',   sym:'SOL', amount:68,  score:45, label:'warning', date:'08 avr', color:'#7c5cfc' },
]
const txLabel = (t:string) => t==='buy'?'Achat':t==='send'?'Envoi':'Swap'
const scoreClass = (l:string) => l==='safe'?'score-safe':l==='warning'?'score-warning':'score-danger'
const ASSET_COLORS: Record<string, string> = { BTC:'#f59e0b', ETH:'#7c5cfc', SOL:'#10b981' }
const ASSET_ICONS:  Record<string, string> = { BTC:'₿',       ETH:'Ξ',       SOL:'◎'       }

type DashboardAsset = PortfolioAsset & {
  name: string; sym: string; qty: number
  avg: number;  price: number; color: string; icon: string
}

const Sparkline = ({ color, up }: { color: string; up: boolean }) => {
  const pts = up
    ? '0,40 16,35 32,28 48,32 64,20 80,15 96,8'
    : '0,10 16,18 32,14 48,25 64,22 80,30 96,35'
  return (
    <svg viewBox="0 0 96 48" style={{ width:'100%', height:40, display:'block' }}>
      <defs>
        <linearGradient id={`g${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,48 ${pts} 96,48`} fill={`url(#g${color.replace('#','')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Dashboard() {
  const { profile } = useAuth()
  const [assets, setAssets] = useState<DashboardAsset[]>([])

  useEffect(() => {
    const loadAssets = async () => {
      if (!profile?.id || profile.id === 'demo' || !supabase) {
        setAssets([]); return
      }
      const { data, error } = await supabase.from('portfolio_assets').select('*').eq('user_id', profile.id)
      if (error) { console.error(error); return }
      setAssets(((data ?? []) as PortfolioAsset[]).map(asset => ({
        ...asset,
        name: asset.crypto_name, sym: asset.crypto_symbol,
        qty: asset.quantity,     avg: asset.avg_buy_price,
        price: asset.current_price ?? 0,
        color: ASSET_COLORS[asset.crypto_symbol] ?? '#6366f1',
        icon:  ASSET_ICONS[asset.crypto_symbol]  ?? asset.crypto_symbol[0] ?? 'C',
      })))
    }
    loadAssets()
  }, [profile?.id])

  const totalPortfolio = assets.reduce((s,a) => s + a.qty * a.price, 0)
  const totalPnl       = assets.reduce((s,a) => s + (a.qty*a.price - a.qty*a.avg), 0)
  const balance        = profile?.simulated_balance_eur ?? 750

  return (
    <div className="fade-up dashboard">

      {/* Header */}
      <div className="dashboard-header">
        <div>
          <div className="dashboard-greeting">Bon retour 👋</div>
          <h1 className="dashboard-title">
            {profile?.username ?? profile?.email?.split('@')[0]},<br/>
            <span className="dashboard-title-gradient">
              {LEVEL_LABEL[profile?.level ?? 'absolute_beginner']} {LEVEL_EMOJI[profile?.level ?? 'absolute_beginner']}
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
          <div className="stat-card-sparkline"><Sparkline color="rgba(255,255,255,0.6)" up={true} /></div>
        </div>

        <div className="stat-card">
          <div className="label-sm" style={{ marginBottom:12 }}>Valeur portfolio</div>
          <div className="stat-number grad-text">{fmtEur(totalPortfolio)}</div>
          <div className="stat-pnl">
            {totalPnl >= 0 ? <TrendingUp size={13} color="#10b981" /> : <TrendingDown size={13} color="#ef4444" />}
            <span className={`stat-pnl-value ${totalPnl >= 0 ? 'positive' : 'negative'}`}>
              {totalPnl >= 0 ? '+' : ''}{fmtEur(totalPnl)} P&L
            </span>
          </div>
          <div style={{ marginTop:12 }}><Sparkline color="#10b981" up={true} /></div>
        </div>

        <div className="stat-card">
          <div className="label-sm" style={{ marginBottom:12 }}>Points & progression</div>
          <div className="stat-number grad-text">{profile?.total_points ?? 0}</div>
          <div className="stat-tx-count">{RECENT_TXS.length} transactions simulées</div>
          <div style={{ marginTop:12 }}><Sparkline color="#7c5cfc" up={true} /></div>
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
            {assets.map(a => {
              const val = a.qty * a.price
              const pct = (a.price - a.avg) / a.avg * 100
              return (
                <div key={a.sym} className="portfolio-asset">
                  <div className="portfolio-asset-icon" style={{ background:`${a.color}20`, color:a.color, border:`1px solid ${a.color}30` }}>
                    {a.icon}
                  </div>
                  <div style={{ flex:1 }}>
                    <div className="portfolio-asset-name">{a.name}</div>
                    <div className="portfolio-asset-qty">{a.qty.toFixed(6)} {a.sym}</div>
                  </div>
                  <div className="portfolio-asset-value">
                    <div className="portfolio-asset-eur">{fmtEur(val)}</div>
                    <div className={`portfolio-asset-pct ${pct >= 0 ? 'positive' : 'negative'}`}>
                      {pct >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {Math.abs(pct).toFixed(2)}%
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <AIPanel initialMessage={`Bonjour ! Je suis SafeBot 🤖\n\nTu as ${fmtEur(balance)} de solde fictif disponible. Pose-moi n'importe quelle question sur la crypto !`} />
      </div>

      {/* Transactions récentes */}
      <div className="glass-card-rich">
        <div className="recent-header">
          <span className="heading-md">Transactions récentes</span>
          <Link to="/history" className="recent-link">Voir tout <ArrowRight size={13} /></Link>
        </div>
        <div>
          {RECENT_TXS.map((tx, i) => (
            <div key={i} className="recent-tx" style={{ borderBottom: i < RECENT_TXS.length-1 ? '1px solid var(--border2)' : 'none' }}>
              <div className="recent-tx-icon" style={{ background:`${tx.color}20`, color:tx.color, border:`1px solid ${tx.color}25` }}>
                {txLabel(tx.type)[0]}
              </div>
              <div style={{ flex:1 }}>
                <div className="recent-tx-label">{txLabel(tx.type)} {tx.name}</div>
                <div className="recent-tx-date">{tx.date} 2026</div>
              </div>
              <div>
                <div className="recent-tx-amount">{fmtEur(tx.amount)}</div>
                <span className={`${scoreClass(tx.label)} recent-tx-score`}>{tx.score}/100</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}