import React, { useState } from 'react'
import { User, Save, SunMoon, Moon, Sun, AlertTriangle, Download, Shield, RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { LegalLinks } from '@/pages/legal/Legal'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase'
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
  const { profile, updateProfile, patchProfile, signOut } = useAuth()
  const [username, setUsername] = useState(profile?.username ?? '')
  const { theme, setTheme } = useTheme()

  const navigate = useNavigate()
  const [resetting, setResetting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Droit à la portabilité : export de toutes les données du compte en JSON
  const exportData = async () => {
    if (!profile) return
    setExporting(true)
    try {
      const [transactions, portfolio, badges] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', profile.id),
        supabase.from('portfolio_assets').select('*').eq('user_id', profile.id),
        supabase.from('user_badges').select('*').eq('user_id', profile.id),
      ])
      const payload = {
        exported_at: new Date().toISOString(),
        profile,
        portfolio: portfolio.data ?? [],
        transactions: transactions.data ?? [],
        badges: badges.data ?? [],
      }
      const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `safestart-mes-donnees-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      URL.revokeObjectURL(url)
      toast.success('Tes données ont été téléchargées.')
    } catch (error) {
      console.error(error)
      toast.error("L'export a échoué. Réessaie dans un instant.")
    } finally {
      setExporting(false)
    }
  }

  // Droit à l'effacement : suppression immédiate et définitive du compte
  const deleteAccount = async () => {
    const answer = window.prompt(
      'Cette action supprime définitivement ton compte et toutes tes données. Elle est irréversible.\n\nTape SUPPRIMER pour confirmer :'
    )
    if (answer?.trim().toUpperCase() !== 'SUPPRIMER') return
    setDeleting(true)
    const { error } = await supabase.rpc('delete_my_account')
    if (error) {
      console.error(error)
      setDeleting(false)
      toast.error('La suppression a échoué. Réessaie ou contacte le support.')
      return
    }
    await signOut()
    toast.success('Ton compte a été supprimé.')
    navigate('/login')
  }

  const resetSimulation = async () => {
    if (!window.confirm('Réinitialiser ton portfolio ? Ton solde repassera à 1 000 € et tes cryptos simulées seront supprimées. Ton historique et tes points sont conservés.')) return
    setResetting(true)
    const { data, error } = await supabase.rpc('reset_simulation')
    setResetting(false)
    if (error) {
      console.error(error)
      toast.error('La réinitialisation a échoué. Réessaie dans un instant.')
      return
    }
    patchProfile({ simulated_balance_eur: Number(data) })
    toast.success('Portfolio réinitialisé !')
  }

  const save = async () => {
    await updateProfile({ username })
    toast.success('Profil mis à jour !')
  }

  return (
    <div className="fade-up flex-container settings-container">
      <h1 className="text-title">Paramètres</h1>

      {/* Profile */}
      <div className="dashboard-card">
        <div className="settings-section-title ico-inline"><User size={16} />Mon profil</div>
        <div className="settings-form-group">
          <label htmlFor="settings-email" className="settings-label">Email</label>
          <input id="settings-email" className="glass-input settings-input-disabled" value={profile?.email ?? ''} disabled />
        </div>
        <div className="settings-form-group">
          <label htmlFor="settings-username" className="settings-label">Pseudo</label>
          <input id="settings-username" maxLength={30} className="glass-input" value={username} onChange={e => setUsername(e.target.value)} placeholder="Mon pseudo SafeStart" />
        </div>
        <div className="settings-form-group">
          <label htmlFor="settings-level" className="settings-label">Niveau actuel</label>
          <div className="settings-level-row">
            <input id="settings-level" className="glass-input settings-input-disabled" value={LEVEL_LABEL[profile?.level ?? 'absolute_beginner']} disabled />
            <button type="button" className="btn-glass settings-level-btn" onClick={() => navigate('/onboarding')}>
              <span className="ico-inline"><RotateCcw size={14} />Refaire l'évaluation</span>
            </button>
          </div>
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

      {/* Données personnelles */}
      <div className="dashboard-card">
        <div className="settings-section-title ico-inline"><Shield size={16} />Mes données</div>
        <div className="danger-row">
          <div>
            <div className="danger-label">Télécharger mes données</div>
            <div className="danger-sub">Profil, portfolio, historique et badges au format JSON.</div>
          </div>
          <button className="btn-glass danger-btn-reset" onClick={exportData} disabled={exporting}>
            <span className="ico-inline"><Download size={15} />{exporting ? 'Export…' : 'Télécharger'}</span>
          </button>
        </div>
        <LegalLinks className="settings-legal-links" />
      </div>

      {/* Danger zone */}
      <div className="dashboard-card danger-card">
        <div className="danger-title ico-inline"><AlertTriangle size={16} />Zone de danger</div>
        <div className="danger-row border-bottom">
          <div>
            <div className="danger-label">Réinitialiser le portfolio</div>
            <div className="danger-sub">Solde remis à 1 000 € et cryptos simulées supprimées. Historique, points et badges conservés.</div>
          </div>
          <button className="btn-glass danger-btn-reset" onClick={resetSimulation} disabled={resetting}>{resetting ? 'En cours…' : 'Réinitialiser'}</button>
        </div>
        <div className="danger-row">
          <div>
            <div className="danger-label critical">Supprimer mon compte</div>
            <div className="danger-sub">Suppression immédiate et définitive du compte et de toutes ses données.</div>
          </div>
          <button className="danger-btn-delete" onClick={deleteAccount} disabled={deleting}>{deleting ? 'Suppression…' : 'Supprimer'}</button>
        </div>
      </div>
    </div>
  )
}
