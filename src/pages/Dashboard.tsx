import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Zap, TrendingUp, TrendingDown } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { fmtEur } from '@/lib/utils'
import AIPanel from '@/components/ai/AIPanel'
import type { PortfolioAsset } from '@/types'

const LEVEL_EMOJI: Record<string,string> = { absolute_beginner:'🌱', curious_novice:'🔍', intermediate:'⚡', advanced:'🚀' }
const LEVEL_LABEL: Record<string,string> = { absolute_beginner:'Débutant absolu', curious_novice:'Novice curieux', intermediate:'Intermédiaire', advanced:'Avancé' }

const ASSETS = [
  { name:'Bitcoin',  sym:'BTC', qty:0.003821, avg:58000, price:65240, color:'#f59e0b', icon:'₿' },
  { name:'Ethereum', sym:'ETH', qty:0.042,    avg:3100,  price:3185,  color:'#7c5cfc', icon:'Ξ' },
  { name:'Solana',   sym:'SOL', qty:0.52,     avg:130,   price:142.5, color:'#10b981', icon:'◎' },
]
const RECENT_TXS = [
  { type:'buy',  name:'Bitcoin',  sym:'BTC', amount:100, score:82, label:'safe',    date:'10 avr', color:'#10b981' },
  { type:'send', name:'Ethereum', sym:'ETH', amount:50,  score:61, label:'warning', date:'09 avr', color:'#ef4444' },
  { type:'swap', name:'Solana',   sym:'SOL', amount:68,  score:45, label:'warning', date:'08 avr', color:'#7c5cfc' },
]
const txLabel = (t:string) => t==='buy'?'Achat':t==='send'?'Envoi':'Swap'
const scoreClass = (l:string) => l==='safe'?'score-safe':l==='warning'?'score-warning':'score-danger'
const ASSET_COLORS: Record<string, string> = { BTC:'#f59e0b', ETH:'#7c5cfc', SOL:'#10b981' }
const ASSET_ICONS: Record<string, string> = { BTC:'₿', ETH:'Ξ', SOL:'◎' }

type DashboardAsset = PortfolioAsset & {
  name: string
  sym: string
  qty: number
  avg: number
  price: number
  color: string
  icon: string
}

/* Mini sparkline SVG */
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
      if (!profile?.id || profile.id === 'demo' || !isSupabaseConfigured || !supabase) {
        setAssets([])
        return
      }

      const { data, error } = await supabase
        .from('portfolio_assets')
        .select('*')
        .eq('user_id', profile.id)

      if (error) {
        console.error(error)
        return
      }

      setAssets(((data ?? []) as PortfolioAsset[]).map((asset) => ({
        ...asset,
        name: asset.crypto_name,
        sym: asset.crypto_symbol,
        qty: asset.quantity,
        avg: asset.avg_buy_price,
        price: asset.current_price ?? 0,
        color: ASSET_COLORS[asset.crypto_symbol] ?? '#6366f1',
        icon: ASSET_ICONS[asset.crypto_symbol] ?? asset.crypto_symbol[0] ?? 'C',
      })))
    }

    loadAssets()
  }, [profile?.id])

  const totalPortfolio = assets.reduce((s,a) => s + a.qty * a.price, 0)
  const totalPnl = assets.reduce((s,a) => s + (a.qty*a.price - a.qty*a.avg), 0)
  const balance = profile?.simulated_balance_eur ?? 750

  return (
    <div className="fade-up" style={{ display:'flex', flexDirection:'column', gap:22 }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:13, color:'var(--tx3)', fontWeight:600, marginBottom:4 }}>Bon retour 👋</div>
          <h1 style={{ fontSize:32, fontWeight:800, color:'var(--tx)', letterSpacing:'-.02em', lineHeight:1.1 }}>
            {profile?.username ?? profile?.email?.split('@')[0]},<br/>
            <span style={{ background:'linear-gradient(135deg,#a78bfa,#7c5cfc)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              {LEVEL_LABEL[profile?.level ?? 'absolute_beginner']} {LEVEL_EMOJI[profile?.level ?? 'absolute_beginner']}
            </span>
          </h1>
        </div>
        <Link to="/transactions" className="btn-pri" style={{ display:'flex', alignItems:'center', gap:7, textDecoration:'none', marginTop:8 }}>
          <Zap size={15} />Simuler
        </Link>
      </div>

      {/* ── Stat cards row ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>

        {/* Balance card */}
        <div className="grad-card" style={{ gridColumn:'span 1' }}>
          <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', color:'rgba(255,255,255,0.6)', marginBottom:12 }}>Solde disponible</div>
          <div style={{ fontSize:30, fontWeight:800, color:'#fff', letterSpacing:'-.02em', marginBottom:6 }}>{fmtEur(balance)}</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>Solde fictif · SafeStart</div>
          <div style={{ marginTop:14 }}>
            <Sparkline color="rgba(255,255,255,0.6)" up={true} />
          </div>
        </div>

        {/* Portfolio value */}
        <div className="stat-card">
          <div className="label-sm" style={{ marginBottom:12 }}>Valeur portfolio</div>
          <div className="stat-number grad-text">{fmtEur(totalPortfolio)}</div>
          <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:6 }}>
            {totalPnl >= 0 ? <TrendingUp size={13} color="#10b981" /> : <TrendingDown size={13} color="#ef4444" />}
            <span style={{ fontSize:12, fontWeight:700, color: totalPnl >= 0 ? '#10b981' : '#ef4444' }}>
              {totalPnl >= 0 ? '+' : ''}{fmtEur(totalPnl)} P&L
            </span>
          </div>
          <div style={{ marginTop:12 }}>
            <Sparkline color="#10b981" up={true} />
          </div>
        </div>

        {/* Points */}
        <div className="stat-card">
          <div className="label-sm" style={{ marginBottom:12 }}>Points & progression</div>
          <div className="stat-number grad-text">{profile?.total_points ?? 0}</div>
          <div style={{ fontSize:11, color:'var(--tx3)', marginTop:6 }}>
            {RECENT_TXS.length} transactions simulées
          </div>
          <div style={{ marginTop:12 }}>
            <Sparkline color="#7c5cfc" up={true} />
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:18 }}>

        {/* Portfolio list */}
        <div className="glass-card-rich">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
            <span className="heading-md">Mon portfolio</span>
            <Link to="/wallet" style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, color:'var(--pri2)', textDecoration:'none' }}>
              Voir tout <ArrowRight size={13} />
            </Link>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {assets.map(a => {
              const val = a.qty * a.price
              const pct = (a.price - a.avg) / a.avg * 100
              return (
                <div key={a.sym} style={{
                  display:'flex', alignItems:'center', gap:14,
                  padding:'14px 16px', borderRadius:16,
                  background:'var(--glass)', border:'1px solid var(--border2)',
                  transition:'all .2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background='var(--glass2)')}
                onMouseLeave={e => (e.currentTarget.style.background='var(--glass)')}>
                  <div style={{ width:42, height:42, borderRadius:14, background:`${a.color}20`, color:a.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:800, flexShrink:0, border:`1px solid ${a.color}30` }}>
                    {a.icon}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'var(--tx)' }}>{a.name}</div>
                    <div style={{ fontSize:11, color:'var(--tx3)', marginTop:1 }}>{a.qty.toFixed(6)} {a.sym}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'var(--tx)' }}>{fmtEur(val)}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:3, justifyContent:'flex-end', marginTop:2 }}>
                      {pct >= 0 ? <TrendingUp size={11} color="#10b981" /> : <TrendingDown size={11} color="#ef4444" />}
                      <span style={{ fontSize:11, fontWeight:700, color: pct >= 0 ? '#10b981' : '#ef4444' }}>{Math.abs(pct).toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* AI Panel */}
        <AIPanel initialMessage={`Bonjour ! Je suis SafeBot 🤖\n\nTu as ${fmtEur(balance)} de solde fictif disponible. Pose-moi n'importe quelle question sur la crypto, les transactions ou comment améliorer ton score !`} />
      </div>

      {/* ── Recent transactions ── */}
      <div className="glass-card-rich">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <span className="heading-md">Transactions récentes</span>
          <Link to="/history" style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, color:'var(--pri2)', textDecoration:'none' }}>
            Voir tout <ArrowRight size={13} />
          </Link>
        </div>
        <div>
          {RECENT_TXS.map((tx, i) => (
            <div key={i} style={{
              display:'flex', alignItems:'center', gap:14,
              padding:'12px 0',
              borderBottom: i < RECENT_TXS.length - 1 ? '1px solid var(--border2)' : 'none',
            }}>
              <div style={{ width:40, height:40, borderRadius:12, background:`${tx.color}20`, color:tx.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, flexShrink:0, border:`1px solid ${tx.color}25` }}>
                {txLabel(tx.type)[0]}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--tx)' }}>{txLabel(tx.type)} {tx.name}</div>
                <div style={{ fontSize:11, color:'var(--tx3)', marginTop:1 }}>{tx.date} 2026</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--tx)' }}>{fmtEur(tx.amount)}</div>
                <span className={scoreClass(tx.label)} style={{ display:'inline-block', marginTop:2 }}>{tx.score}/100</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
