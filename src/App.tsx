import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { supabase, OPENED_FROM_RECOVERY_LINK, AUTH_LINK_ERROR } from '@/lib/supabase'
import toast, { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from '@/lib/hooks/useAuth'
import { ThemeProvider } from '@/lib/hooks/useTheme'

import Home          from '@/pages/home/Home'
import Login         from '@/pages/login/Login'
import Register      from '@/pages/register/Register'
import ResetPassword from '@/pages/login/ResetPassword'
import Onboarding    from '@/pages/onboarding/Onboarding'
import AppLayout     from '@/components/layout/AppLayout'
import Dashboard     from '@/pages/dashboard/Dashboard'
import Wallet        from '@/pages/wallet/Wallet'
import Market        from '@/pages/market/Market'
import Transactions  from '@/pages/transactions/Transactions'
import History       from '@/pages/history/History'
import Learn         from '@/pages/learn/Learn'
import Challenges    from '@/pages/challenges/Challenges'
import Progress      from '@/pages/progress/Progress'
import Settings      from '@/pages/settings/Settings'
import Help          from '@/pages/help/Help'
import { MentionsLegales, Cgu, Confidentialite } from '@/pages/legal/Legal'

const PageLoader = () => (
  <div className="page-loader" role="status" aria-label="Chargement">
    <div className="page-loader-spinner spin" />
  </div>
)

// Pages réservées aux utilisateurs connectés.
// Tant que l'évaluation de niveau n'est pas faite, on y renvoie (sauf sur la page d'évaluation elle-même).
function Guard({ children, onboarding = false }: { children: React.ReactNode; onboarding?: boolean }) {
  const { profile, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!profile) return <Navigate to="/login" replace />
  if (!onboarding && !profile.onboarding_completed) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

// Lien « mot de passe oublié » : on force l'affichage du formulaire de nouveau mot de passe,
// même si Supabase a redirigé vers la page d'accueil (adresse de retour non autorisée).
let recoveryRedirectPending = OPENED_FROM_RECOVERY_LINK

function AppRoutes() {
  const { profile, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(event => {
      if (event === 'PASSWORD_RECOVERY') navigate('/reset-password', { replace: true })
    })
    return () => data.subscription.unsubscribe()
  }, [navigate])

  // Lien d'email expiré ou déjà utilisé : on l'explique au lieu d'afficher la connexion sans rien dire
  useEffect(() => {
    if (!AUTH_LINK_ERROR) return
    toast.error(
      AUTH_LINK_ERROR === 'otp_expired'
        ? 'Ce lien a expiré ou a déjà été utilisé. Refais une demande depuis la page de connexion.'
        : 'Ce lien est invalide. Refais une demande depuis la page de connexion.',
      { duration: 8000 },
    )
    window.history.replaceState(null, '', window.location.pathname)
  }, [])

  if (recoveryRedirectPending) {
    recoveryRedirectPending = false
    if (location.pathname !== '/reset-password') return <Navigate to="/reset-password" replace />
  }

  return (
    <Routes>
      <Route path="/login"      element={!loading && profile ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register"   element={!loading && profile ? <Navigate to="/dashboard" /> : <Register />} />
      <Route path="/onboarding" element={<Guard onboarding><Onboarding /></Guard>} />
      <Route path="/reset-password"   element={<ResetPassword />} />
      <Route path="/mentions-legales" element={<MentionsLegales />} />
      <Route path="/cgu"              element={<Cgu />} />
      <Route path="/confidentialite"  element={<Confidentialite />} />
      {/* Accueil public ; un utilisateur connecté va directement à son tableau de bord */}
      <Route path="/" element={
        loading ? <PageLoader /> : profile ? <Navigate to="/dashboard" replace /> : <Home />
      } />
      <Route element={<Guard><AppLayout /></Guard>}>
        <Route path="dashboard"    element={<Dashboard />} />
        <Route path="wallet"       element={<Wallet />} />
        <Route path="market"       element={<Market />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="history"      element={<History />} />
        <Route path="learn"        element={<Learn />} />
        <Route path="challenges"   element={<Challenges />} />
        <Route path="progress"     element={<Progress />} />
        <Route path="settings"     element={<Settings />} />
        <Route path="help"         element={<Help />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <AppRoutes />
      <Toaster position="top-right" toastOptions={{
        style: {
          background: 'var(--bg2)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--border)',
          color: 'var(--tx)',
          borderRadius: 12,
          fontSize: 14,
        },
      }} />
    </AuthProvider>
    </ThemeProvider>
  )
}
