import React, { useEffect, useState } from 'react'
import { Clock, ChevronDown, ChevronUp, Lock, ChevronRight, Zap, Search, MessageSquare } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { fmtEur } from '@/lib/utils'
import type { Transaction } from '@/types'
import toast from 'react-hot-toast'
import './styles.css' // Importation du fichier CSS propre

// ─── UTILS HISTORY 
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
    <div className="fade-up flex-container">
      <div>
        <h1 className="text-title">Historique</h1>
        <p className="text-subtitle">{txs.length} transactions simulées</p>
      </div>

      <div className="flex-row-center">
        <span className="text-muted-sm">Filtrer :</span>
        {['all', 'buy', 'send', 'swap'].map(f => (
          <button 
            key={f} 
            onClick={() => setFilter(f)}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
          >
            {f === 'all' ? 'Toutes' : txLabel(f)}
          </button>
        ))}
      </div>

      <div className="dashboard-card no-padding">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <Clock size={40} className="empty-icon" />
            <p>Aucune transaction</p>
          </div>
        ) : filtered.map((tx, i) => (
          <div key={tx.id} className={i < filtered.length - 1 ? 'faq-row' : 'faq-row no-border'}>
            <button 
              onClick={() => setExpanded(expanded === tx.id ? null : tx.id)}
              className="tx-row"
            >
              <div 
                className="tx-icon-wrapper"
                style={{ background: `${txColor(tx.type)}22`, color: txColor(tx.type) }}
              >
                {txLabel(tx.type)[0]}
              </div>
              <div className="tx-details">
                <div className="tx-name">{txLabel(tx.type)} {tx.name}</div>
                <div className="tx-date">{tx.date}</div>
              </div>
              <div className="tx-right-side">
                <div className="tx-amount">{tx.amount ? fmtEur(tx.amount) : `${tx.qty} ${tx.sym}`}</div>
                <span className={`tx-score-badge ${scoreClass(tx.label)}`}>{tx.score}/100</span>
              </div>
              {expanded === tx.id ? <ChevronUp size={16} color="var(--tx3)" /> : <ChevronDown size={16} color="var(--tx3)" />}
            </button>

            {expanded === tx.id && (
              <div className="tx-expanded-panel fade-up" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="tx-grid-details">
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
                      <div className="tx-grid-label">{k}</div>
                      <div className="tx-grid-value">{v}</div>
                    </div>
                  ))}
                </div>
                <div className="safebot-comment-box">
                  <p className="safebot-comment-title">💡 Commentaire SafeBot</p>
                  <p className="safebot-comment-text">{tx.ai}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── LEARN 
const MODULES = [
  { id: 'wallet', title: "C'est quoi un wallet ?", cat: 'Les bases', level: 'Débutant', lvlColor: '#10b981', dur: 4, pts: 50, premium: false, desc: "Comprends ce qu'est un portefeuille crypto et comment il fonctionne." },
  { id: 'fees',   title: 'Comprendre les frais de réseau', cat: 'Transactions', level: 'Débutant', lvlColor: '#10b981', dur: 5, pts: 60, premium: false, desc: 'Discover les gas fees et pourquoi ils varient.' },
  { id: 'chain',  title: 'La blockchain en 5 minutes', cat: 'Les bases', level: 'Novice', lvlColor: '#6366f1', dur: 5, pts: 70, premium: false, desc: 'Comprends le fonctionnement décentralisé.' },
  { id: 'defi',   title: 'Introduction à la DeFi', cat: 'Avancé', level: 'Intermédiaire', lvlColor: '#f59e0b', dur: 8, pts: 100, premium: true, desc: 'Swaps, liquidité, yield farming expliqués simplement.' },
]

export function Learn() {
  return (
    <div className="fade-up flex-container">
      <div>
        <h1 className="text-title">Modules d'apprentissage</h1>
        <p className="text-subtitle">Cours courts en français, adaptés à ton niveau</p>
      </div>
      <div className="grid-two-columns">
        {MODULES.map(m => (
          <div key={m.id} className="dashboard-card">
            <div className="learn-header">
              <span 
                className="learn-badge"
                style={{ background: `${m.lvlColor}22`, color: m.lvlColor }}
              >
                {m.level}
              </span>
              <span className="learn-duration">⏱ {m.dur} min</span>
            </div>
            <div className="learn-body">
              <div className="learn-title">{m.title}</div>
              <div className="learn-desc">{m.desc}</div>
            </div>
            <div className="learn-footer">
              <span className="learn-pts">+{m.pts} pts</span>
              {m.premium
                ? <button className="btn-glass learn-btn"><Lock size={12} />Premium</button>
                : <button className="btn-pri learn-btn learn-btn-start" onClick={() => toast.success('Module bientôt disponible !')}>Commencer <ChevronRight size={13} /></button>
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── CHALLENGES 
const CHALLENGES = [
  { title: 'Premier achat',          desc: 'Simule ton premier achat de cryptomonnaie.',     obj: '1 achat simulé',           level: 'Débutant',      lvlColor: '#10b981', pts: 100, icon: '🏆', premium: false },
  { title: 'Acheteur prudent',       desc: 'Achète du BTC avec un score de sécurité vert.',  obj: 'Score ≥ 70/100',           level: 'Débutant',      lvlColor: '#10b981', pts: 150, icon: '🛡️', premium: false },
  { title: 'Maître des frais',       desc: 'Effectue un achat avec moins de 0.5% de frais.', obj: 'Frais < 0.5%',             level: 'Débutant',      lvlColor: '#10b981', pts: 120, icon: '💰', premium: false },
  { title: 'Portefeuille diversifié',desc: 'Détenir au moins 3 cryptos différentes.',         obj: '3 cryptos dans le portfolio',level:'Intermédiaire', lvlColor: '#6366f1', pts: 200, icon: '🌍', premium: false },
  { title: 'Swap intelligent',       desc: 'Réalise un swap avec un slippage < 1%.',          obj: 'Slippage < 1%',            level: 'Intermédiaire', lvlColor: '#6366f1', pts: 250, icon: '🔄', premium: false },
  { title: 'Explorateur DeFi',       desc: 'Réalise 5 swaps variés.',                         obj: '5 swaps différents',        level: 'Avancé',        lvlColor: '#f59e0b', pts: 400, icon: '🚀', premium: true  },
]

export function Challenges() {
  const { profile } = useAuth()
  return (
    <div className="fade-up flex-container">
      <div>
        <h1 className="text-title">Challenges</h1>
        <p className="text-subtitle">Complète des missions pour gagner des points et débloquer des badges</p>
      </div>
      <div className="grid-three-columns">
        {[
          ['0', 'Complétés'],
          [String(profile?.total_points ?? 0), 'Points totaux'],
          ['1', 'Badges']
        ].map(([v, l]) => (
          <div key={l} className="dashboard-card challenge-stat-card">
            <div className="challenge-stat-val">{v}</div>
            <div className="challenge-stat-label">{l}</div>
          </div>
        ))}
      </div>
      <div className="grid-two-columns">
        {CHALLENGES.map(c => (
          <div 
            key={c.title} 
            className="dashboard-card"
            style={{ opacity: c.premium && !profile?.is_premium ? .85 : 1 }}
          >
            <div className="challenge-header">
              <div className="challenge-badge-group">
                <span className="challenge-icon">{c.icon}</span>
                <span 
                  className="challenge-lvl-badge"
                  style={{ background: `${c.lvlColor}22`, color: c.lvlColor }}
                >
                  {c.level}
                </span>
              </div>
              <span className="challenge-pts">+{c.pts} pts</span>
            </div>
            <div className="challenge-title">{c.title}</div>
            <div className="challenge-desc">{c.desc}</div>
            <div className="challenge-obj">🎯 {c.obj}</div>
            <div className="challenge-footer">
              {c.premium && !profile?.is_premium
                ? <button className="btn-glass challenge-btn"><Lock size={12} />Déverrouiller (Premium)</button>
                : <button className="btn-pri challenge-btn challenge-btn-start" onClick={() => toast.success('Challenge démarré !')}><Zap size={13} />Commencer</button>
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── PROGRESS 
const SKILLS = [
  { name: 'Achats',   score: 75 },
  { name: 'Sécurité', score: 60 },
  { name: 'Frais',    score: 45 },
  { name: 'Envois',   score: 55 },
  { name: 'Swaps',    score: 30 },
  { name: 'Modules',  score: 20 },
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
    <div className="fade-up flex-container">
      <h1 className="text-title">Ma Progression</h1>

      {/* Level card */}
      <div className="dashboard-card lvl-card">
        <div className="lvl-container">
          <div className="lvl-emoji">🌱</div>
          <div className="lvl-body">
            <div className="lvl-tagline">Ton niveau actuel</div>
            <div className="lvl-title">Débutant absolu</div>
            <div className="lvl-desc">Tu pars de zéro, et c'est parfait ! SafeStart va t'accompagner pas à pas.</div>
          </div>
          <div className="lvl-points-wrapper">
            <div className="lvl-points-val">{profile?.total_points ?? 0}</div>
            <div className="lvl-points-label">points</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-three-columns">
        {[
          ['📊', 'Transactions', '3'],
          ['🛡️', 'Score moyen', '78/100'],
          ['🏅', 'Badges', `${badges.filter(b => b.unlocked).length}/${badges.length || 7}`]
        ].map(([ico, l, v]) => (
          <div key={l} className="dashboard-card progress-stat-card">
            <div className="progress-stat-ico">{ico}</div>
            <div className="progress-stat-val">{v}</div>
            <div className="progress-stat-label">{l}</div>
          </div>
        ))}
      </div>

      {/* Skills */}
      <div className="dashboard-card">
        <div className="skill-section-title">Compétences</div>
        {SKILLS.map(s => (
          <div key={s.name} className="skill-row">
            <div className="skill-header">
              <span className="skill-name">{s.name}</span>
              <span className="skill-score">{s.score}/100</span>
            </div>
            <div className="skill-bar-bg">
              <div className="skill-bar-fill" style={{ width: `${s.score}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div className="dashboard-card">
        <div className="skill-section-title">🏅 Badges ({badges.filter(b => b.unlocked).length} / {badges.length})</div>
        <div className="badge-grid">
          {badges.map(b => (
            <div 
              key={b.name} 
              className="badge-item"
              style={{ 
                opacity: b.unlocked ? 1 : .35, 
                filter: b.unlocked ? 'none' : 'grayscale(1)' 
              }}
            >
              <div className="badge-emoji">{b.icon}</div>
              <div className="badge-name">{b.name}</div>
              <div className="badge-desc">{b.desc}</div>
              <div className="badge-pts">+{b.pts} pts</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── SETTINGS 
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

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <label className="toggle-wrap">
      <input type="checkbox" checked={value} onChange={onChange} />
      <span className="toggle-slider" />
    </label>
  )

  return (
    <div className="fade-up flex-container settings-container">
      <h1 className="text-title">Paramètres</h1>

      {/* Profile */}
      <div className="dashboard-card">
        <div className="settings-section-title">👤 Mon profil</div>
        <div className="settings-form-group">
          <label className="settings-label">Email</label>
          <input className="glass-input settings-input-disabled" value={profile?.email ?? ''} disabled />
        </div>
        <div className="settings-form-group">
          <label className="settings-label">Pseudo</label>
          <input className="glass-input" value={username} onChange={e => setUsername(e.target.value)} placeholder="Mon pseudo SafeStart" />
        </div>
        <div className="settings-form-group">
          <label className="settings-label">Niveau actuel</label>
          <input className="glass-input settings-input-disabled" value="🌱 Débutant absolu" disabled />
        </div>
        <button className="btn-pri settings-btn-save" onClick={save}>💾 Sauvegarder</button>
      </div>

      {/* Theme */}
      <div className="dashboard-card">
        <div className="settings-section-title">🌓 Apparence</div>
        <div className="appearance-grid">
          <button className="btn-glass appearance-btn" onClick={() => { document.documentElement.className = 'dark'; setDarkMode(true) }}>🌙 Sombre</button>
          <button className="btn-glass appearance-btn" onClick={() => { document.documentElement.className = 'light'; setDarkMode(false) }}>☀️ Clair</button>
        </div>
      </div>

      {/* Notifications */}
      <div className="dashboard-card">
        <div className="notification-title-block">🔔 Notifications</div>
        {[
          { label: "Rappels d'activité", sub: 'Relances si inactif depuis 3 jours', val: notifReminders, set: () => setNotifReminders(!notifReminders) },
          { label: 'Alertes marché (±10%)', sub: 'Variation importante dans ton portfolio', val: notifMarket, set: () => setNotifMarket(!notifMarket) },
          { label: 'Nouveaux challenges', sub: 'Challenges disponibles et badges', val: notifChallenges, set: () => setNotifChallenges(!notifChallenges) },
        ].map(n => (
          <label key={n.label} className="notification-row">
            <div>
              <div className="notification-label">{n.label}</div>
              <div className="notification-sub">{n.sub}</div>
            </div>
            <Toggle value={n.val} onChange={n.set} />
          </label>
        ))}
      </div>

      {/* Danger zone */}
      <div className="dashboard-card danger-card">
        <div className="danger-title">⚠️ Zone de danger</div>
        <div className="danger-row border-bottom">
          <div>
            <div className="danger-label">Réinitialiser le portfolio</div>
            <div className="danger-sub">Remet le solde fictif à 1 000 €. Badges conservés.</div>
          </div>
          <button className="btn-glass danger-btn-reset" onClick={() => { updateProfile({ simulated_balance_eur: 1000 }); toast.success('Portfolio réinitialisé !') }}>Réinitialiser</button>
        </div>
        <div className="danger-row">
          <div>
            <div className="danger-label critical">Supprimer mon compte</div>
            <div className="danger-sub">Suppression sous 72h (RGPD).</div>
          </div>
          <button className="danger-btn-delete" onClick={() => toast('Fonctionnalité disponible en production.', { icon: '⚠️' })}>Supprimer</button>
        </div>
      </div>
    </div>
  )
}

// ─── HELP 
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
    <div className="fade-up flex-container help-container">
      <div>
        <h1 className="text-title">Aide & FAQ</h1>
        <p className="text-subtitle">Trouve rapidement une réponse à ta question</p>
      </div>

      <div className="search-wrapper">
        <Search size={15} className="search-icon" />
        <input className="glass-input search-input-padding" placeholder="Recherche (gas fees, score, wallet...)" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="dashboard-card faq-card-padding">
        {filtered.length === 0 ? (
          <div className="faq-no-results">Aucun résultat pour "{search}"</div>
        ) : filtered.map((f, i) => (
          <div key={i} className={i < filtered.length - 1 ? 'faq-row' : 'faq-row no-border'}>
            <button onClick={() => setOpen(open === i ? null : i)} className="faq-trigger">
              <span className="faq-question">{f.q}</span>
              {open === i ? <ChevronUp size={16} color="var(--tx3)" /> : <ChevronDown size={16} color="var(--tx3)" />}
            </button>
            {open === i && (
              <div className="faq-answer fade-up">{f.a}</div>
            )}
          </div>
        ))}
      </div>

      <div className="dashboard-card">
        <div className="support-title"><MessageSquare size={17} />Tu n'as pas trouvé ta réponse ?</div>
        <p className="support-desc">Contacte-nous directement — nous répondons sous 48h.</p>
        {!feedback ? (
          <button className="btn-pri support-btn-toggle" onClick={() => setFeedback(true)}><MessageSquare size={15} />Contacter le support</button>
        ) : (
          <div className="support-form">
            <select className="glass-input support-select">
              <option>Question générale</option>
              <option>Signaler un bug</option>
              <option>Suggestion</option>
              <option>Autre</option>
            </select>
            <textarea className="glass-input support-textarea" rows={4} placeholder="Décris ton problème..." value={msg} onChange={e => setMsg(e.target.value)} />
            <div className="support-form-actions">
              <button className="btn-glass support-btn-action" onClick={() => setFeedback(false)}>Annuler</button>
              <button className="btn-pri support-btn-action" onClick={() => { toast.success('Message envoyé ! Réponse sous 48h.'); setFeedback(false) }}>Envoyer</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}