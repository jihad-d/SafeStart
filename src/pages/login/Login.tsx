import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import toast from 'react-hot-toast'

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
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        position: 'relative',
        zIndex: 1,
      }}
    >
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36, textDecoration: 'none' }}>
        <div style={{ width: 48, height: 48, borderRadius: 16, background: 'linear-gradient(135deg,#7c5cfc,#4f35d2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 22, boxShadow: '0 8px 24px rgba(124,92,252,0.4)' }}>S</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--tx)', letterSpacing: '-.01em' }}>SafeStart</div>
          <div style={{ fontSize: 10, color: 'var(--tx3)', fontWeight: 600, letterSpacing: '.05em' }}>BETA · Apprends la crypto sans risque</div>
        </div>
      </Link>

      <div className="glass-card-rich fade-up" style={{ width: '100%', maxWidth: 420 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--tx)', marginBottom: 4, letterSpacing: '-.02em' }}>Bon retour</h1>
        <p style={{ fontSize: 13, color: 'var(--tx3)', marginBottom: 28, lineHeight: 1.5 }}>Connecte-toi pour reprendre ta progression</p>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', borderRadius: 14, marginBottom: 18, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', fontSize: 13 }}>
            <AlertCircle size={16} />{error}
          </div>
        )}

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="label-sm" style={{ display: 'block', marginBottom: 8 }}>Email</label>
            <input className="glass-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="toi@example.com" required />
          </div>
          <div>
            <label className="label-sm" style={{ display: 'block', marginBottom: 8 }}>Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <input className="glass-input" type={show ? 'text' : 'password'} value={pwd} onChange={e => setPwd(e.target.value)} placeholder="••••••••" required style={{ paddingRight: 46 }} />
              <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx3)' }}>
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            <div style={{ textAlign: 'right', marginTop: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--pri2)', cursor: 'pointer', fontWeight: 600 }}>Mot de passe oublié ?</span>
            </div>
          </div>
          <button className="btn-pri" type="submit" disabled={loading} style={{ width: '100%', padding: 14, marginTop: 4, fontSize: 15 }}>
            {loading
              ? <span style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%' }} className="spin" />
              : 'Se connecter'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--tx3)', marginTop: 22 }}>
          Pas encore de compte ?{' '}
          <Link to="/register" style={{ color: 'var(--pri2)', fontWeight: 700 }}>Créer un compte</Link>
        </p>
      </div>
    </div>
  )
}
