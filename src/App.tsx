import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from '@/lib/hooks/useAuth'
import { ThemeProvider } from '@/lib/hooks/useTheme'

import Login         from '@/pages/login/Login'
import Register      from '@/pages/register/Register'
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

function Guard({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth()
  if (loading) return (
    <div className="page-loader" role="status" aria-label="Chargement">
      <div className="page-loader-spinner spin" />
    </div>
  )
  if (!profile) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { profile, loading } = useAuth()

  return (
    <Routes>
      <Route path="/login"      element={!loading && profile ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register"   element={!loading && profile ? <Navigate to="/dashboard" /> : <Register />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/mentions-legales" element={<MentionsLegales />} />
      <Route path="/cgu"              element={<Cgu />} />
      <Route path="/confidentialite"  element={<Confidentialite />} />
      <Route path="/" element={<Guard><AppLayout /></Guard>}>
        <Route index element={<Navigate to="/dashboard" />} />
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
      <Route path="*" element={<Navigate to="/login" />} />
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
