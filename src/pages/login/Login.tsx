import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import toast from 'react-hot-toast'
import './Login.css'

export default function Login() {
  const { signIn, profile } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [pwd, setPwd] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!profile) return
    navigate('/dashboard')
  }, [navigate, profile])


  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: authError } = await signIn(email, pwd)
    if (authError) {
      if (authError.toLowerCase().includes('email not confirmed')) {
        setError('Ton email n a pas encore ete confirme.')
      } else if (authError.toLowerCase().includes('invalid login credentials')) {
        setError('Identifiants incorrects.')
      } else {
        setError(authError)
      }
      setLoading(false)
      return
    }

    toast.success('Bienvenue sur SafeStart !')
    setLoading(false)
  }

  return (
    <div className="login-container">
      <Link to="/" className="login-logo-link">
        <div className="login-logo-icon">S</div>
        <div>
          <div className="login-logo-title">SafeStart</div>
          <div className="login-logo-subtitle">BETA · Apprends la crypto sans risque</div>
        </div>
      </Link>

      <div className="glass-card-rich fade-up login-card">
        <h1 className="login-title">Bon retour</h1>
        <p className="login-subtitle">Connecte-toi pour reprendre ta progression</p>

        {error && (
          <div className="login-error-box">
            <AlertCircle size={16} />{error}
          </div>
        )}

        <form onSubmit={submit} className="login-form">
          <div>
            <label className="label-sm login-label">Email</label>
            <input className="glass-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="toi@example.com" required />
          </div>
          <div>
            <label className="label-sm login-label">Mot de passe</label>
            <div className="login-password-wrapper">
              <input className="glass-input login-password-input" type={show ? 'text' : 'password'} value={pwd} onChange={e => setPwd(e.target.value)} placeholder="••••••••" required />
              <button type="button" onClick={() => setShow(!show)} className="login-toggle-password">
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            <div className="login-forgot-password-container">
              <span className="login-forgot-password">Mot de passe oublié ?</span>
            </div>
          </div>
          <button className="btn-pri login-submit-btn" type="submit" disabled={loading}>
            {loading
              ? <span className="login-spinner spin" />
              : 'Se connecter'}
          </button>
        </form>

        <p className="login-footer-text">
          Pas encore de compte ?{' '}
          <Link to="/register" className="login-register-link">Créer un compte</Link>
        </p>
      </div>
    </div>
  )
}