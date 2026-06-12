import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import toast from 'react-hot-toast'
import './Register.css' // Importation des styles extraits

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
      setError('Tu dois accepter les conditions generales.')
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
          <div className="register-error-banner">
            <AlertCircle size={16} />{error}
          </div>
        )}

        <form onSubmit={submit} className="register-form">
          <div>
            <label className="register-label">Email</label>
            <input className="glass-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="toi@example.com" required />
          </div>
          <div>
            <label className="register-label">Mot de passe</label>
            <div className="password-input-wrapper">
              <input className="glass-input password-input-padding" type={show ? 'text' : 'password'} value={pwd} onChange={e => setPwd(e.target.value)} placeholder="8 caracteres minimum" required />
              <button type="button" onClick={() => setShow(!show)} className="password-toggle-btn">
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
                <span className="strength-label" style={{ color: strColors[strength] }}>{strLabels[strength]}</span>
              </div>
            )}
          </div>
          <div>
            <label className="register-label">Confirmer</label>
            <input className="glass-input" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="........" required />
          </div>

          <label className="cgu-label-wrapper">
            <div 
              onClick={() => setCgu(!cgu)} 
              className="cgu-checkbox"
              style={{ background: cgu ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'var(--glass)' }}
            >
              {cgu && <CheckCircle size={14} color="#fff" />}
            </div>
            <span className="cgu-text">J'accepte les <span style={{ color: 'var(--pri)' }}>conditions generales</span> et la politique de confidentialite (RGPD)</span>
          </label>

          <button className="btn-pri register-btn-submit" type="submit" disabled={loading || !cgu}>
            {loading ? <span className="loading-spinner spin" /> : 'Creer mon compte'}
          </button>
        </form>

        <p className="register-footer-text">
          Deja un compte ?{' '}
          <Link to="/login" style={{ color: 'var(--pri)', fontWeight: 600 }}>Se connecter</Link>
        </p>
      </div>
    </div>
  )
}