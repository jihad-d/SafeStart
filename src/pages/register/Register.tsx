import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import toast from 'react-hot-toast'

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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', zIndex: 1 }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, textDecoration: 'none' }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 20 }}>S</div>
        <span style={{ fontWeight: 700, fontSize: 22, color: 'var(--tx)' }}>SafeStart</span>
      </Link>

      <div className="glass-card fade-up" style={{ width: '100%', maxWidth: 420 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, color: 'var(--tx)' }}>Creer un compte</h1>
        <p style={{ fontSize: 13, color: 'var(--tx3)', marginBottom: 24 }}>Commence a apprendre la crypto gratuitement</p>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, marginBottom: 16, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', color: 'var(--danger)', fontSize: 13 }}>
            <AlertCircle size={16} />{error}
          </div>
        )}

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--tx3)', marginBottom: 6 }}>Email</label>
            <input className="glass-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="toi@example.com" required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--tx3)', marginBottom: 6 }}>Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <input className="glass-input" type={show ? 'text' : 'password'} value={pwd} onChange={e => setPwd(e.target.value)} placeholder="8 caracteres minimum" required style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx3)' }}>
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {pwd && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                  {[1, 2, 3, 4].map(i => <div key={i} style={{ height: 4, borderRadius: 2, flex: 1, background: i <= strength ? strColors[strength] : 'rgba(255,255,255,.1)', transition: 'all .3s' }} />)}
                </div>
                <span style={{ fontSize: 11, color: strColors[strength] }}>{strLabels[strength]}</span>
              </div>
            )}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--tx3)', marginBottom: 6 }}>Confirmer</label>
            <input className="glass-input" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="........" required />
          </div>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
            <div onClick={() => setCgu(!cgu)} style={{ marginTop: 2, width: 20, height: 20, borderRadius: 6, flexShrink: 0, border: '1px solid var(--border)', background: cgu ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'var(--glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              {cgu && <CheckCircle size={14} color="#fff" />}
            </div>
            <span style={{ fontSize: 13, color: 'var(--tx2)' }}>J'accepte les <span style={{ color: 'var(--pri)' }}>conditions generales</span> et la politique de confidentialite (RGPD)</span>
          </label>

          <button className="btn-pri" type="submit" disabled={loading || !cgu} style={{ width: '100%', padding: 13 }}>
            {loading ? <span style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%' }} className="spin" /> : 'Creer mon compte'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--tx3)', marginTop: 20 }}>
          Deja un compte ?{' '}
          <Link to="/login" style={{ color: 'var(--pri)', fontWeight: 600 }}>Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
