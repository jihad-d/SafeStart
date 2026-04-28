import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from '@/lib/hooks/useAuth'

import Login         from '@/pages/Login'
import Register      from '@/pages/Register'
import Onboarding    from '@/pages/Onboarding'
import AppLayout     from '@/components/layout/AppLayout'
import Dashboard     from '@/pages/Dashboard'
import Wallet        from '@/pages/Wallet'
import Market        from '@/pages/Market'
import Transactions  from '@/pages/Transactions'
import { History, Learn, Challenges, Progress, Settings, Help } from '@/pages/Pages'

function Guard({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth()
  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, border: '3px solid rgba(99,102,241,.2)', borderTopColor: '#6366f1', borderRadius: '50%' }} className="spin" />
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
  const [theme, setTheme] = useState<'dark'|'light'>('dark')

  useEffect(() => {
    document.documentElement.className = theme
  }, [theme])

  return (
    <AuthProvider>
      <AppRoutes />
      <Toaster position="top-right" toastOptions={{
        style: {
          background: 'rgba(14,14,28,.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,.08)',
          color: '#f0f0ff',
          borderRadius: 12,
          fontSize: 14,
        },
      }} />
    </AuthProvider>
  )
}
