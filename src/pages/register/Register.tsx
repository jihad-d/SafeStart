import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { LegalLinks } from '@/pages/legal/Legal'
import { useAuth } from '@/lib/hooks/useAuth'
import toast from 'react-hot-toast'
import './Register.css' 

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [pwd, setPwd] = useState('')
  const [confirm, setConfirm] = useState('')
  const [cgu, setCgu] = useState(false)
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const strength = (() => {
    let s = 0
    if (pwd.length >= 8) s++
    if (/[A-Z]/.test(pwd)) s++
    if (/[0-9]/.test(pwd)) s++
    if (/[^A-Za-z0-9]/.test(pwd)) s++
    return s
  })()
  const strColors = ['', '#ef4444', '#f59e0b', '#6366f1', '#10b981']
  const strLabels = ['', 'Faible', 'Moyen', 'Bon', 'Excellent']

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!cgu) {
      setError("Tu dois accepter les conditions générales d'utilisation.")
      return
    }
    if (pwd !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (strength < 2) {
      setError('Mot de passe trop faible.')
      return
    }

    setLoading(true)
    const { error, needsEmailConfirmation } = await signUp(email, pwd)

    if (error) {
      setError(error.includes('already') ? 'Email deja utilise.' : error)
      setLoading(false)
      return
    }

    if (needsEmailConfirmation) {
      toast.success('Compte cree ! Verifie ton email pour confirmer ton inscription.')
      navigate('/login')
      return
    }

    toast.success('Compte cree !')
    navigate('/onboarding')
  }

  return (
    <div className="register-page">
      <Link to="/" className="register-logo">
        <div className="register-logo-badge">S</div>
        <span className="register-brand">SafeStart</span>
      </Link>

      <div className="glass-card fade-up register-card-width">
        <h1 className="register-title">Creer un compte</h1>
        <p className="register-subtitle">Commence a apprendre la crypto gratuitement</p>

        {error && (
          <div className="register-error-banner" role="alert">
            <AlertCircle size={16} />{error}
          </div>
        )}

        <form onSubmit={submit} className="register-form">
          <div>
            <label htmlFor="register-email" className="register-label">Email</label>
            <input id="register-email" autoComplete="email" className="glass-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="toi@example.com" required />
          </div>
          <div>
            <label htmlFor="register-password" className="register-label">Mot de passe</label>
            <div className="password-input-wrapper">
              <input id="register-password" autoComplete="new-password" aria-describedby="register-password-hint" className="glass-input password-input-padding" type={show ? 'text' : 'password'} value={pwd} onChange={e => setPwd(e.target.value)} placeholder="8 caractères minimum" required />
              <button type="button" onClick={() => setShow(!show)} className="password-toggle-btn" aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} aria-pressed={show}>
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {pwd && (
              <div className="strength-indicator-row">
                <div className="strength-bar-container">
                  {[1, 2, 3, 4].map(i => (
                    <div 
                      key={i} 
                      className="strength-bar"
                      style={{ background: i <= strength ? strColors[strength] : 'rgba(255,255,255,.1)' }} 
                    />
                  ))}
                </div>
                <span id="register-password-hint" className="strength-label" style={{ color: strColors[strength] }}>{strLabels[strength]}</span>
              </div>
            )}
          </div>
          <div>
            <label htmlFor="register-confirm" className="register-label">Confirmer le mot de passe</label>
            <input id="register-confirm" autoComplete="new-password" className="glass-input" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="........" required />
          </div>

          <div className="cgu-label-wrapper">
            <input
              id="register-cgu"
              type="checkbox"
              className="cgu-checkbox"
              checked={cgu}
              onChange={e => setCgu(e.target.checked)}
            />
            <label htmlFor="register-cgu" className="cgu-text">
              J'accepte les <Link to="/cgu" target="_blank" rel="noopener">conditions générales d'utilisation</Link> et
              j'ai lu la <Link to="/confidentialite" target="_blank" rel="noopener">politique de confidentialité</Link>.
            </label>
          </div>

          <button className="btn-pri register-btn-submit" type="submit" disabled={loading || !cgu}>
            {loading ? <span className="loading-spinner spin" /> : 'Creer mon compte'}
          </button>
        </form>

        <p className="register-footer-text">
          Deja un compte ?{' '}
          <Link to="/login" style={{ color: 'var(--pri)', fontWeight: 600 }}>Se connecter</Link>
        </p>
      </div>
      <LegalLinks className="auth-legal-links" />
    </div>
  )
}