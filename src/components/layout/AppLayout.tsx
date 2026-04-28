import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Wallet, TrendingUp, ArrowLeftRight,
  Clock, BookOpen, Trophy, BarChart3, HelpCircle,
  Settings, LogOut, Zap, Bell, Sun, Moon,
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { fmtEur } from '@/lib/utils'

const NAV = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/wallet',       icon: Wallet,          label: 'Mon Wallet' },
  { to: '/market',       icon: TrendingUp,      label: 'Marché' },
  { to: '/transactions', icon: ArrowLeftRight,  label: 'Transférer' },
  { to: '/history',      icon: Clock,           label: 'Historique' },
]
const LEARN_NAV = [
  { to: '/learn',      icon: BookOpen,  label: 'Modules' },
  { to: '/challenges', icon: Trophy,    label: 'Challenges' },
  { to: '/progress',   icon: BarChart3, label: 'Progression' },
]
const LEVEL_EMOJI: Record<string, string> = {
  absolute_beginner: '🌱', curious_novice: '🔍', intermediate: '⚡', advanced: '🚀',
}
const LEVEL_LABEL: Record<string, string> = {
  absolute_beginner: 'Débutant absolu', curious_novice: 'Novice curieux',
  intermediate: 'Intermédiaire', advanced: 'Avancé',
}

export default function AppLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [dark, setDark] = useState(true)

  const toggleTheme = () => {
    const next = dark ? 'light' : 'dark'
    document.documentElement.className = next
    setDark(!dark)
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', position:'relative', zIndex:1 }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: 252, height:'100vh', position:'fixed', left:0, top:0,
        display:'flex', flexDirection:'column', zIndex:40,
        background:'rgba(18,15,36,0.85)',
        backdropFilter:'blur(32px) saturate(180%)',
        borderRight:'1px solid rgba(124,92,252,0.12)',
      }}>

        {/* Logo */}
        <div style={{ padding:'22px 20px 18px', borderBottom:'1px solid rgba(124,92,252,0.1)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{
              width:40, height:40, borderRadius:14,
              background:'linear-gradient(135deg,#7c5cfc,#4f35d2)',
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'#fff', fontWeight:800, fontSize:20,
              boxShadow:'0 4px 16px rgba(124,92,252,0.4)',
            }}>S</div>
            <div>
              <div style={{ fontWeight:800, fontSize:17, color:'var(--tx)', letterSpacing:'-.01em' }}>SafeStart</div>
              <div style={{ fontSize:10, color:'var(--tx3)', fontWeight:600, letterSpacing:'.05em' }}>BETA</div>
            </div>
          </div>
        </div>

        {/* Profile mini */}
        {profile && (
          <div style={{ padding:'14px 14px 10px' }}>
            <div style={{
              background:'linear-gradient(135deg,rgba(124,92,252,0.15),rgba(79,53,210,0.08))',
              border:'1px solid rgba(124,92,252,0.2)',
              borderRadius:16, padding:'12px 14px',
              display:'flex', alignItems:'center', gap:10,
            }}>
              <div style={{
                width:38, height:38, borderRadius:12,
                background:'linear-gradient(135deg,rgba(124,92,252,0.3),rgba(167,139,250,0.2))',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:18, flexShrink:0,
                boxShadow:'0 2px 8px rgba(124,92,252,0.2)',
              }}>{LEVEL_EMOJI[profile.level]}</div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--tx)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  {profile.username ?? profile.email.split('@')[0]}
                </div>
                <div style={{ fontSize:10, color:'var(--tx3)', marginTop:1 }}>
                  {LEVEL_LABEL[profile.level]} · <span style={{ color:'var(--pri2)' }}>{profile.total_points} pts</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex:1, overflowY:'auto', padding:'6px 10px' }}>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              style={{ marginBottom:2 }}>
              <Icon size={16} />{label}
            </NavLink>
          ))}

          <div style={{ fontSize:9, fontWeight:800, textTransform:'uppercase', letterSpacing:'.12em', color:'var(--tx3)', padding:'16px 14px 6px' }}>
            Apprendre
          </div>

          {LEARN_NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              style={{ marginBottom:2 }}>
              <Icon size={16} />{label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding:'10px 10px 16px', borderTop:'1px solid rgba(124,92,252,0.1)' }}>
          {!profile?.is_premium && (
            <div style={{
              background:'linear-gradient(135deg,rgba(124,92,252,0.2),rgba(79,53,210,0.12))',
              border:'1px solid rgba(124,92,252,0.25)',
              borderRadius:16, padding:'12px 14px', marginBottom:8,
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700, color:'var(--pri2)', marginBottom:4 }}>
                <Zap size={11} />Version gratuite
              </div>
              <p style={{ fontSize:11, color:'var(--tx3)', marginBottom:8, lineHeight:1.4 }}>
                Débloque challenges avancés et IA illimitée
              </p>
              <button className="btn-pri" style={{ width:'100%', padding:'8px 0', fontSize:12, borderRadius:10 }}>
                Essayer 7 jours gratuits
              </button>
            </div>
          )}
          <NavLink to="/help"     className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ marginBottom:2 }}><HelpCircle size={15} />Aide & FAQ</NavLink>
          <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ marginBottom:2 }}><Settings size={15} />Paramètres</NavLink>
          <button className="nav-item" style={{ width:'100%', color:'#ef4444', border:'none', background:'transparent', cursor:'pointer' }}
            onClick={() => { signOut(); navigate('/login') }}>
            <LogOut size={15} />Déconnexion
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ marginLeft:252, flex:1, display:'flex', flexDirection:'column', minHeight:'100vh' }}>

        {/* Topbar */}
        <header style={{
          position:'sticky', top:0, zIndex:30,
          padding:'14px 28px',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          background:'rgba(13,11,26,0.75)',
          backdropFilter:'blur(24px)',
          borderBottom:'1px solid rgba(124,92,252,0.1)',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--tx3)' }}>Solde simulé</span>
            <span style={{ fontSize:16, fontWeight:800, background:'linear-gradient(135deg,#a78bfa,#7c5cfc)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              {fmtEur(profile?.simulated_balance_eur ?? 750)}
            </span>
            <span style={{ fontSize:10, padding:'2px 10px', borderRadius:99, background:'rgba(124,92,252,0.15)', color:'var(--pri2)', fontWeight:700, border:'1px solid rgba(124,92,252,0.2)' }}>fictif</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <button className="btn-glass" style={{ width:38, height:38, padding:0, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:12, position:'relative' }}>
              <Bell size={16} />
              <span style={{ position:'absolute', top:8, right:8, width:6, height:6, borderRadius:'50%', background:'var(--pri)', border:'1.5px solid var(--bg)' }} />
            </button>
            <button className="btn-glass" style={{ width:38, height:38, padding:0, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:12 }} onClick={toggleTheme}>
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        <main style={{ flex:1, padding:'28px', overflowY:'auto' }}>
          <div style={{ maxWidth:980, margin:'0 auto' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
