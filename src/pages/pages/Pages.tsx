import React, { useEffect, useState } from 'react'
import { Clock, ChevronDown, ChevronUp, BookOpen, Trophy, Lock, ChevronRight, BarChart3, Shield, Zap, Star, Search, MessageSquare } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { fmtEur } from '@/lib/utils'
import type { Transaction } from '@/types'
import toast from 'react-hot-toast'

const card: React.CSSProperties = { background: 'var(--glass)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }

// ─── HISTORY 
const txColor = (t: string) => t === 'buy' ? '#10b981' : t === 'send' ? '#ef4444' : '#6366f1'
const txLabel = (t: string) => t === 'buy' ? 'Achat' : t === 'send' ? 'Envoi' : 'Swap'
const scoreClass = (l: string) => l === 'safe' ? 'score-safe' : l === 'warning' ? 'score-warning' : 'score-danger'

type DetailRow = [string, string]
type HistoryTx = Transaction & {
  name: string
  sym: string
  amount: number | null
  qty: number | null
  score: number
  label: string
  date: string
  ai: string
}
type BadgeRow = {
  name: string
  icon: string
  pts: number
  desc: string
  unlocked: boolean
}
type UserBadgeRecord = {
  unlocked?: boolean | null
  earned_at?: string | null
  badges?: {
    name?: string | null
    icon?: string | null
    pts?: number | null
    desc?: string | null
  } | null
}

export function History() {
  const { profile } = useAuth()
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [txs, setTxs] = useState<HistoryTx[]>([])

  useEffect(() => {
    const loadTransactions = async () => {
      if (!profile?.id || profile.id === 'demo' || !supabase) {
        setTxs([])
        return
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error(error)
        toast.error('Impossible de charger l historique.')
        return
      }

      setTxs(((data ?? []) as Transaction[]).map((tx) => ({
        ...tx,
        name: tx.crypto_name,
        sym: tx.crypto_symbol,
        amount: tx.amount_eur ?? null,
        qty: tx.quantity ?? null,
        score: tx.security_score,
        label: tx.security_score_label,
        date: new Date(tx.created_at).toLocaleString('fr-FR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        ai: tx.ai_comment,
      })))
    }

    loadTransactions()
  }, [profile?.id])

  const filtered = filter === 'all' ? txs : txs.filter(t => t.type === filter)

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--tx)' }}>Historique</h1>
        <p style={{ fontSize: 13, color: 'var(--tx3)', marginTop: 4 }}>{txs.length} transactions simulées</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--tx3)' }}>Filtrer :</span>
        {['all','buy','send','swap'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all .2s', ...(filter === f ? { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' } : { background: 'var(--glass)', border: '1px solid var(--border)', color: 'var(--tx2)' }) }}>
            {f === 'all' ? 'Toutes' : txLabel(f)}
          </button>
        ))}
      </div>

      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Clock size={40} style={{ color: 'var(--tx3)', margin: '0 auto 12px', opacity: .3 }} />
            <p style={{ color: 'var(--tx3)' }}>Aucune transaction</p>
          </div>
        ) : filtered.map((tx, i) => (
          <div key={tx.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <button onClick={() => setExpanded(expanded === tx.id ? null : tx.id)}
              style={{ width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${txColor(tx.type)}22`, color: txColor(tx.type), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{txLabel(tx.type)[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)' }}>{txLabel(tx.type)} {tx.name}</div>
                <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 2 }}>{tx.date}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)' }}>{tx.amount ? fmtEur(tx.amount) : `${tx.qty} ${tx.sym}`}</div>
                <span className={scoreClass(tx.label)} style={{ display: 'inline-block', marginTop: 3 }}>{tx.score}/100</span>
              </div>
              {expanded === tx.id ? <ChevronUp size={16} color="var(--tx3)" /> : <ChevronDown size={16} color="var(--tx3)" />}
            </button>

            {expanded === tx.id && (
              <div style={{ padding: '0 20px 16px', borderTop: '1px solid var(--border)' }} className="fade-up">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '14px 0', marginBottom: 10 }}>
                  {[
                    ['Type', txLabel(tx.type)],
                    tx.amount ? ['Montant', fmtEur(tx.amount)] : null,
                    tx.qty ? ['Quantité', `${tx.qty} ${tx.sym}`] : null,
                    (tx as any).fees ? ['Frais', fmtEur((tx as any).fees)] : null,
                    (tx as any).gas ? ['Gas fees', fmtEur((tx as any).gas)] : null,
                    (tx as any).slippage ? ['Slippage', `${(tx as any).slippage}%`] : null,
                    ['Score', `${tx.score}/100`],
                  ].filter((row): row is DetailRow => row !== null).map(([k, v]) => (
                    <div key={k as string}>
                      <div style={{ fontSize: 11, color: 'var(--tx3)' }}>{k}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)', marginTop: 2 }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.15)', borderRadius: 12, padding: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--pri)', marginBottom: 6 }}>💡 Commentaire SafeBot</p>
                  <p style={{ fontSize: 13, color: 'var(--tx2)', lineHeight: 1.6 }}>{tx.ai}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── LEARN ────────────────────────────────────────────────────
const MODULES = [
  { id: 'wallet', title: "C'est quoi un wallet ?", cat: 'Les bases', level: 'Débutant', lvlColor: '#10b981', dur: 4, pts: 50, premium: false, desc: "Comprends ce qu'est un portefeuille crypto et comment il fonctionne." },
  { id: 'fees',   title: 'Comprendre les frais de réseau', cat: 'Transactions', level: 'Débutant', lvlColor: '#10b981', dur: 5, pts: 60, premium: false, desc: 'Discover les gas fees et pourquoi ils varient.' },
  { id: 'chain',  title: 'La blockchain en 5 minutes', cat: 'Les bases', level: 'Novice', lvlColor: '#6366f1', dur: 5, pts: 70, premium: false, desc: 'Comprends le fonctionnement décentralisé.' },
  { id: 'defi',   title: 'Introduction à la DeFi', cat: 'Avancé', level: 'Intermédiaire', lvlColor: '#f59e0b', dur: 8, pts: 100, premium: true, desc: 'Swaps, liquidité, yield farming expliqués simplement.' },
]

export function Learn() {
  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--tx)' }}>Modules d'apprentissage</h1>
        <p style={{ fontSize: 13, color: 'var(--tx3)', marginTop: 4 }}>Cours courts en français, adaptés à ton niveau</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {MODULES.map(m => (
          <div key={m.id} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: `${m.lvlColor}22`, color: m.lvlColor }}>{m.level}</span>
              <span style={{ fontSize: 12, color: 'var(--tx3)' }}>⏱ {m.dur} min</span>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx)', marginBottom: 4 }}>{m.title}</div>
              <div style={{ fontSize: 13, color: 'var(--tx2)' }}>{m.desc}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>+{m.pts} pts</span>
              {m.premium
                ? <button className="btn-glass" style={{ fontSize: 12, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 5 }}><Lock size={12} />Premium</button>
                : <button className="btn-pri" style={{ fontSize: 12, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 5 }} onClick={() => toast.success('Module bientôt disponible !')}>Commencer <ChevronRight size={13} /></button>
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── CHALLENGES ───────────────────────────────────────────────
const CHALLENGES = [
  { title: 'Premier achat',          desc: 'Simule ton premier achat de cryptomonnaie.',     obj: '1 achat simulé',           level: 'Débutant',      lvlColor: '#10b981', pts: 100, icon: '🏆', premium: false },
  { title: 'Acheteur prudent',       desc: 'Achète du BTC avec un score de sécurité vert.',  obj: 'Score ≥ 70/100',           level: 'Débutant',      lvlColor: '#10b981', pts: 150, icon: '🛡️', premium: false },
  { title: 'Maître des frais',       desc: 'Effectue un achat avec moins de 0.5% de frais.', obj: 'Frais < 0.5%',             level: 'Débutant',      lvlColor: '#10b981', pts: 120, icon: '💰', premium: false },
  { title: 'Portefeuille diversifié',desc: 'Détenir au moins 3 cryptos différentes.',         obj: '3 cryptos dans le portfolio',level:'Intermédiaire', lvlColor: '#6366f1', pts: 200, icon: '🌍', premium: false },
  { title: 'Swap intelligent',       desc: 'Réalise un swap avec un slippage < 1%.',          obj: 'Slippage < 1%',            level: 'Intermédiaire', lvlColor: '#6366f1', pts: 250, icon: '🔄', premium: false },
  { title: 'Explorateur DeFi',       desc: 'Réalise 5 swaps variés.',                         obj: '5 swaps différents',       level: 'Avancé',        lvlColor: '#f59e0b', pts: 400, icon: '🚀', premium: true  },
]

export function Challenges() {
  const { profile } = useAuth()
  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--tx)' }}>Challenges</h1>
        <p style={{ fontSize: 13, color: 'var(--tx3)', marginTop: 4 }}>Complète des missions pour gagner des points et débloquer des badges</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
        {[['0','Complétés'],[String(profile?.total_points??0),'Points totaux'],['1','Badges']].map(([v,l]) => (
          <div key={l} style={{ ...card, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{v}</div>
            <div style={{ fontSize: 11, color: 'var(--tx3)', marginTop: 4 }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {CHALLENGES.map(c => (
          <div key={c.title} style={{ ...card, opacity: c.premium && !profile?.is_premium ? .85 : 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 22 }}>{c.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: `${c.lvlColor}22`, color: c.lvlColor }}>{c.level}</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>+{c.pts} pts</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)', marginBottom: 4 }}>{c.title}</div>
            <div style={{ fontSize: 12, color: 'var(--tx2)', marginBottom: 8 }}>{c.desc}</div>
            <div style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 14 }}>🎯 {c.obj}</div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              {c.premium && !profile?.is_premium
                ? <button className="btn-glass" style={{ width: '100%', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}><Lock size={12} />Déverrouiller (Premium)</button>
                : <button className="btn-pri" style={{ width: '100%', fontSize: 12, padding: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }} onClick={() => toast.success('Challenge démarré !')}><Zap size={13} />Commencer</button>
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── PROGRESS ─────────────────────────────────────────────────
const SKILLS = [
  { name: 'Achats',   score: 75 },
  { name: 'Sécurité', score: 60 },
  { name: 'Frais',    score: 45 },
  { name: 'Envois',   score: 55 },
  { name: 'Swaps',    score: 30 },
  { name: 'Modules',  score: 20 },
]
const BADGES = [
  { name: 'Première transaction', icon: '🏆', pts: 50,  unlocked: true,  desc: 'Tu as effectué ta première simulation !' },
  { name: 'Premier achat',        icon: '💰', pts: 50,  unlocked: false, desc: 'Premier achat simulé réussi.' },
  { name: 'Premier envoi',        icon: '📤', pts: 50,  unlocked: false, desc: 'Premier envoi simulé.' },
  { name: 'Trader prudent',       icon: '🛡️', pts: 100, unlocked: false, desc: '5 transactions avec score vert.' },
  { name: 'Régulier',             icon: '🔥', pts: 100, unlocked: false, desc: 'Connecté 7 jours de suite.' },
  { name: 'Studieux',             icon: '📚', pts: 75,  unlocked: false, desc: 'Un module complété.' },
  { name: 'Diversifié',           icon: '🌍', pts: 100, unlocked: false, desc: '3 cryptos dans le portfolio.' },
]

export function Progress() {
  const { profile } = useAuth()
  const [badges, setBadges] = useState<BadgeRow[]>([])

  useEffect(() => {
    const loadBadges = async () => {
      if (!profile?.id || profile.id === 'demo' || !supabase) {
        setBadges([])
        return
      }

      const { data, error } = await supabase
        .from('user_badges')
        .select('*, badges(*)')
        .eq('user_id', profile.id)

      if (error) {
        console.error(error)
        toast.error('Impossible de charger les badges.')
        return
      }

      setBadges(((data ?? []) as UserBadgeRecord[])
        .filter((row) => row.badges?.name)
        .map((row) => ({
          name: row.badges?.name ?? 'Badge',
          icon: row.badges?.icon ?? '🏅',
          pts: row.badges?.pts ?? 0,
          desc: row.badges?.desc ?? '',
          unlocked: row.unlocked ?? Boolean(row.earned_at),
        })))
    }

    loadBadges()
  }, [profile?.id])

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--tx)' }}>Ma Progression</h1>

      {/* Level card */}
      <div style={{ ...card, background: 'linear-gradient(135deg,rgba(99,102,241,.12),rgba(139,92,246,.12))', border: '1px solid rgba(99,102,241,.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ fontSize: 52 }}>🌱</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Ton niveau actuel</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--tx)' }}>Débutant absolu</div>
            <div style={{ fontSize: 13, color: 'var(--tx2)', marginTop: 4 }}>Tu pars de zéro, et c'est parfait ! SafeStart va t'accompagner pas à pas.</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 32, fontWeight: 700, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{profile?.total_points ?? 0}</div>
            <div style={{ fontSize: 11, color: 'var(--tx3)', marginTop: 2 }}>points</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
        {[['📊','Transactions','3'],['🛡️','Score moyen','78/100'],['🏅','Badges','1/7']].map(([ico,l,v]) => (
          <div key={l} style={{ ...card, textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{ico}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--tx)' }}>{v}</div>
            <div style={{ fontSize: 11, color: 'var(--tx3)', marginTop: 3 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Skills */}
      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx)', marginBottom: 16 }}>Compétences</div>
        {SKILLS.map(s => (
          <div key={s.name} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span style={{ color: 'var(--tx2)' }}>{s.name}</span>
              <span style={{ fontWeight: 600, color: 'var(--tx)' }}>{s.score}/100</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', width: `${s.score}%`, transition: 'width .8s' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx)', marginBottom: 16 }}>🏅 Badges ({badges.filter(b => b.unlocked).length} / {badges.length})</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {badges.map(b => (
            <div key={b.name} style={{ textAlign: 'center', padding: 12, borderRadius: 12, background: 'var(--glass2)', border: '1px solid var(--border)', opacity: b.unlocked ? 1 : .35, filter: b.unlocked ? 'none' : 'grayscale(1)' }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{b.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx)', marginBottom: 2 }}>{b.name}</div>
              <div style={{ fontSize: 10, color: 'var(--tx3)' }}>{b.desc}</div>
              <div style={{ fontSize: 10, fontWeight: 700, marginTop: 6, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>+{b.pts} pts</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── SETTINGS ─────────────────────────────────────────────────
export function Settings() {
  const { profile, updateProfile, signOut } = useAuth()
  const [username, setUsername] = useState(profile?.username ?? '')
  const [notifReminders, setNotifReminders] = useState(true)
  const [notifMarket, setNotifMarket] = useState(true)
  const [notifChallenges, setNotifChallenges] = useState(false)
  const [darkMode, setDarkMode] = useState(true)

  const save = async () => {
    await updateProfile({ username })
    toast.success('Profil mis à jour !')
  }

  const toggleTheme = () => {
    const next = darkMode ? 'light' : 'dark'
    document.documentElement.className = next
    setDarkMode(!darkMode)
  }

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <label className="toggle-wrap">
      <input type="checkbox" checked={value} onChange={onChange} />
      <span className="toggle-slider" />
    </label>
  )

  return (
    <div className="fade-up" style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--tx)' }}>Paramètres</h1>

      {/* Profile */}
      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx)', marginBottom: 16 }}>👤 Mon profil</div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--tx3)', marginBottom: 7 }}>Email</label>
          <input className="glass-input" value={profile?.email ?? ''} disabled style={{ opacity: .6, cursor: 'not-allowed' }} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--tx3)', marginBottom: 7 }}>Pseudo</label>
          <input className="glass-input" value={username} onChange={e => setUsername(e.target.value)} placeholder="Mon pseudo SafeStart" />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--tx3)', marginBottom: 7 }}>Niveau actuel</label>
          <input className="glass-input" value="🌱 Débutant absolu" disabled style={{ opacity: .6, cursor: 'not-allowed' }} />
        </div>
        <button className="btn-pri" style={{ padding: '10px 20px' }} onClick={save}>💾 Sauvegarder</button>
      </div>

      {/* Theme */}
      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx)', marginBottom: 14 }}>🌓 Apparence</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-glass" style={{ flex: 1 }} onClick={() => { document.documentElement.className = 'dark'; setDarkMode(true) }}>🌙 Sombre</button>
          <button className="btn-glass" style={{ flex: 1 }} onClick={() => { document.documentElement.className = 'light'; setDarkMode(false) }}>☀️ Clair</button>
        </div>
      </div>

      {/* Notifications */}
      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx)', marginBottom: 8 }}>🔔 Notifications</div>
        {[
          { label: "Rappels d'activité", sub: 'Relances si inactif depuis 3 jours', val: notifReminders, set: () => setNotifReminders(!notifReminders) },
          { label: 'Alertes marché (±10%)', sub: 'Variation importante dans ton portfolio', val: notifMarket, set: () => setNotifMarket(!notifMarket) },
          { label: 'Nouveaux challenges', sub: 'Challenges disponibles et badges', val: notifChallenges, set: () => setNotifChallenges(!notifChallenges) },
        ].map(n => (
          <label key={n.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--tx)' }}>{n.label}</div>
              <div style={{ fontSize: 11, color: 'var(--tx3)', marginTop: 2 }}>{n.sub}</div>
            </div>
            <Toggle value={n.val} onChange={n.set} />
          </label>
        ))}
      </div>

      {/* Danger zone */}
      <div style={{ ...card, border: '1px solid rgba(239,68,68,.2)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#ef4444', marginBottom: 14 }}>⚠️ Zone de danger</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)' }}>Réinitialiser le portfolio</div>
            <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 2 }}>Remet le solde fictif à 1 000 €. Badges conservés.</div>
          </div>
          <button className="btn-glass" style={{ fontSize: 12, color: '#f59e0b', borderColor: 'rgba(245,158,11,.3)' }} onClick={() => { updateProfile({ simulated_balance_eur: 1000 }); toast.success('Portfolio réinitialisé !') }}>Réinitialiser</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#ef4444' }}>Supprimer mon compte</div>
            <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 2 }}>Suppression sous 72h (RGPD).</div>
          </div>
          <button style={{ fontSize: 12, padding: '8px 14px', borderRadius: 10, background: 'rgba(239,68,68,.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,.3)', cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => toast('Fonctionnalité disponible en production.', { icon: '⚠️' })}>Supprimer</button>
        </div>
      </div>
    </div>
  )
}

// ─── HELP ─────────────────────────────────────────────────────
const FAQ_ITEMS = [
  { q: "Qu'est-ce que SafeStart ?", a: "SafeStart est une application d'apprentissage de la crypto. Tu simules de vraies transactions avec les prix réels du marché, mais sans jamais utiliser d'argent réel. Un agent IA t'accompagne et explique chaque étape en français simple." },
  { q: "Mon argent est-il en danger ?", a: "Non, absolument pas ! SafeStart est un simulateur à 100%. Tu démarres avec 1 000 € fictifs. Il est impossible de perdre de l'argent réel sur SafeStart." },
  { q: "Comment fonctionnent les prix affichés ?", a: "Les prix sont des données réelles récupérées depuis l'API CoinGecko et mis à jour toutes les minutes. Tu pratiques avec les vrais prix du marché, dans un environnement sécurisé." },
  { q: "Qu'est-ce que le score de sécurité ?", a: "Le score (vert/orange/rouge) évalue le risque d'une transaction avant que tu la confirmes. Il prend en compte le montant vs ton solde, la volatilité de la crypto, le slippage pour les swaps, et la validité de l'adresse pour les envois." },
  { q: "Qu'est-ce qu'un gas fee ?", a: "Les gas fees sont des frais payés au réseau blockchain pour valider ta transaction. Sur SafeStart, ces frais sont simulés pour t'habituer à les prendre en compte." },
  { q: "Comment puis-je améliorer mon niveau ?", a: "Ton niveau évolue automatiquement avec tes transactions simulées, les challenges complétés et les modules terminés. Plus tu pratiques, plus SafeBot adapte son niveau de langage." },
  { q: "Comment réinitialiser mon portfolio ?", a: "Dans Paramètres → Zone de danger, tu peux réinitialiser ton portfolio fictif. Ton solde repart à 1 000 € simulés, ta progression est conservée." },
]

export function Help() {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState<number | null>(null)
  const [feedback, setFeedback] = useState(false)
  const [msg, setMsg] = useState('')

  const filtered = FAQ_ITEMS.filter(f =>
    !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fade-up" style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--tx)' }}>Aide & FAQ</h1>
        <p style={{ fontSize: 13, color: 'var(--tx3)', marginTop: 4 }}>Trouve rapidement une réponse à ta question</p>
      </div>

      <div style={{ position: 'relative' }}>
        <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--tx3)' }} />
        <input className="glass-input" style={{ paddingLeft: 40 }} placeholder="Recherche (gas fees, score, wallet...)" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div style={{ ...card, padding: '0 20px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--tx3)' }}>Aucun résultat pour "{search}"</div>
        ) : filtered.map((f, i) => (
          <div key={i} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <button onClick={() => setOpen(open === i ? null : i)}
              style={{ width: '100%', textAlign: 'left', padding: '14px 0', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--tx)' }}>{f.q}</span>
              {open === i ? <ChevronUp size={16} color="var(--tx3)" /> : <ChevronDown size={16} color="var(--tx3)" />}
            </button>
            {open === i && (
              <div style={{ paddingBottom: 14, fontSize: 13, color: 'var(--tx2)', lineHeight: 1.7 }} className="fade-up">{f.a}</div>
            )}
          </div>
        ))}
      </div>

      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}><MessageSquare size={17} />Tu n'as pas trouvé ta réponse ?</div>
        <p style={{ fontSize: 13, color: 'var(--tx2)', marginBottom: 14 }}>Contacte-nous directement — nous répondons sous 48h.</p>
        {!feedback ? (
          <button className="btn-pri" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setFeedback(true)}><MessageSquare size={15} />Contacter le support</button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <select className="glass-input" style={{ fontSize: 13 }}>
              <option>Question générale</option>
              <option>Signaler un bug</option>
              <option>Suggestion</option>
              <option>Autre</option>
            </select>
            <textarea className="glass-input" rows={4} style={{ resize: 'none', fontSize: 13 }} placeholder="Décris ton problème..." value={msg} onChange={e => setMsg(e.target.value)} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-glass" style={{ flex: 1 }} onClick={() => setFeedback(false)}>Annuler</button>
              <button className="btn-pri" style={{ flex: 1 }} onClick={() => { toast.success('Message envoyé ! Réponse sous 48h.'); setFeedback(false); setMsg('') }}>Envoyer</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default History
