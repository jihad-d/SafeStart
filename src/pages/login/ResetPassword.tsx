import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import './Login.css'

/**
 * Page atteinte depuis le lien de l'email « Mot de passe oublié ».
 * Supabase ouvre une session de récupération à partir du lien ; on permet alors
 * de choisir un nouveau mot de passe.
 */
export default function ResetPassword() {
  const navigate = useNavigate()
  // null = vérification en cours, false = lien invalide, true = formulaire disponible
  const [ready, setReady] = useState<boolean | null>(null)
  const [pwd, setPwd] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)))
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setReady(true)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (pwd.length < 8) { setError('Le mot de passe doit faire au moins 8 caractères.'); return }
    if (pwd !== confirm) { setError('Les mots de passe ne correspondent pas.'); return }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password: pwd })
    setLoading(false)
    if (updateError) {
      const m = updateError.message.toLowerCase()
      setError(
        m.includes('different from the old')
          ? "Le nouveau mot de passe doit être différent de l'ancien."
          : m.includes('session') || m.includes('jwt')
            ? 'Ton lien a expiré. Refais une demande depuis la page de connexion.'
            : 'Impossible de modifier le mot de passe. Réessaie dans un instant.',
      )
      console.error('updateUser:', updateError)
      return
    }

    toast.success('Mot de passe modifié !')
    navigate('/dashboard')
  }

  return (
    <div className="login-container">
      <div className="glass-card-rich fade-up login-card">
        <h1 className="login-title">Nouveau mot de passe</h1>

        {ready === null ? (
          <p className="login-subtitle">Vérification du lien…</p>
        ) : !ready ? (
          <p className="login-subtitle">
            Ce lien est invalide ou a expiré. Refais une demande depuis la page de connexion.
          </p>
        ) : (
          <>
            <p className="login-subtitle">Choisis un nouveau mot de passe pour ton compte.</p>
            {error && <div className="login-error-box" role="alert"><AlertCircle size={16} />{error}</div>}
            <form onSubmit={submit} className="login-form">
              <div>
                <label htmlFor="reset-pwd" className="label-sm login-label">Nouveau mot de passe</label>
                <input id="reset-pwd" className="glass-input" type="password" autoComplete="new-password"
                  value={pwd} onChange={e => setPwd(e.target.value)} placeholder="8 caractères minimum" required />
              </div>
              <div>
                <label htmlFor="reset-confirm" className="label-sm login-label">Confirmer</label>
                <input id="reset-confirm" className="glass-input" type="password" autoComplete="new-password"
                  value={confirm} onChange={e => setConfirm(e.target.value)} required />
              </div>
              <button className="btn-pri login-submit-btn" type="submit" disabled={loading}>
                {loading ? <span className="login-spinner spin" /> : 'Enregistrer'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
