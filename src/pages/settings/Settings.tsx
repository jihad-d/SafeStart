import React, { useState } from 'react'
import { User, Save, SunMoon, Moon, Sun, Bell, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useTheme } from '@/lib/hooks/useTheme'
import toast from 'react-hot-toast'
import '@/styles/pages.css'

const LEVEL_LABEL: Record<string, string> = {
  absolute_beginner: 'Débutant absolu',
  curious_novice: 'Novice curieux',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
}

export default function Settings() {
  const { profile, updateProfile, signOut } = useAuth()
  const [username, setUsername] = useState(profile?.username ?? '')
  const [notifReminders, setNotifReminders] = useState(true)
  const [notifMarket, setNotifMarket] = useState(true)
  const [notifChallenges, setNotifChallenges] = useState(false)
  const { theme, setTheme } = useTheme()

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
        <div className="settings-section-title ico-inline"><User size={16} />Mon profil</div>
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
          <input className="glass-input settings-input-disabled" value={LEVEL_LABEL[profile?.level ?? 'absolute_beginner']} disabled />
        </div>
        <button className="btn-pri settings-btn-save" onClick={save}><span className="ico-inline"><Save size={15} />Sauvegarder</span></button>
      </div>

      {/* Theme */}
      <div className="dashboard-card">
        <div className="settings-section-title ico-inline"><SunMoon size={16} />Apparence</div>
        <div className="appearance-grid">
          <button className={`btn-glass appearance-btn ${theme === 'dark' ? 'active' : ''}`} aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}><span className="ico-inline"><Moon size={15} />Sombre</span></button>
          <button className={`btn-glass appearance-btn ${theme === 'light' ? 'active' : ''}`} aria-pressed={theme === 'light'} onClick={() => setTheme('light')}><span className="ico-inline"><Sun size={15} />Clair</span></button>
        </div>
      </div>

      {/* Notifications */}
      <div className="dashboard-card">
        <div className="notification-title-block ico-inline"><Bell size={16} />Notifications</div>
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
        <div className="danger-title ico-inline"><AlertTriangle size={16} />Zone de danger</div>
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
          <button className="danger-btn-delete" onClick={() => toast('Fonctionnalité disponible en production.', { icon: <AlertTriangle size={16} color="#f59e0b" /> })}>Supprimer</button>
        </div>
      </div>
    </div>
  )
}
