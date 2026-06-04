import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { UserProfile } from '@/types'

interface AuthCtx {
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsEmailConfirmation?: boolean }>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<UserProfile>) => Promise<void>
}

const Ctx = createContext<AuthCtx>(null!)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // ─── Utilitaire timeout ───────────────────────────────────────────────────
  const withTimeout = async <T,>(promise: Promise<T>, ms: number, message: string): Promise<T> => {
    let timeoutId: number | undefined
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(() => reject(new Error(message)), ms)
    })
    try {
      return await Promise.race([promise, timeoutPromise])
    } finally {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
    }
  }

  // ─── Profil par défaut ────────────────────────────────────────────────────
  const buildDefaultProfile = (id: string, email: string): UserProfile => ({
    id,
    email,
    username: null,
    level: 'absolute_beginner',
    onboarding_completed: false,
    simulated_balance_eur: 1000,
    total_points: 0,
    is_premium: false,
    ai_messages_today: 0,
    ai_messages_limit: 20,
  })

  // ─── Fetch profil ─────────────────────────────────────────────────────────
  const fetchProfile = async (id: string): Promise<UserProfile | null> => {
    if (!supabase) return null

    const { data, error } = await withTimeout(
      Promise.resolve(supabase.from('profiles').select('*').eq('id', id).maybeSingle() as any),
      8000,
      'Le chargement du profil a expire.',
    )

    if (error) {
      console.error('fetchProfile error:', error)
      return null
    }

    if (!data) return null

    const nextProfile = data as UserProfile
    setProfile(nextProfile)
    return nextProfile
  }

  // ─── Fetch profil avec retry ──────────────────────────────────────────────
  const fetchProfileWithRetry = async (id: string, retries = 5, delayMs = 600): Promise<UserProfile | null> => {
    for (let i = 0; i < retries; i++) {
      const result = await fetchProfile(id)
      if (result) return result
      if (i < retries - 1) await new Promise(resolve => setTimeout(resolve, delayMs))
    }
    return null
  }

  // ─── Init session ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    const client = supabase

    const init = async () => {
      try {
        const { data: { session } } = await client.auth.getSession()
        if (session?.user) {
          const loadedProfile = await fetchProfile(session.user.id)
          if (!loadedProfile) setProfile(null)
        }
      } catch (error) {
        console.error('auth init error:', error)
      } finally {
        setLoading(false)
      }
    }

    init()

    const { data: listener } = client.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') return

      if (!session?.user) {
        setProfile(null)
        return
      }

      const loadedProfile = await fetchProfile(session.user.id)
      if (!loadedProfile) setProfile(null)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  // ─── Sign In ──────────────────────────────────────────────────────────────
  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: 'Configuration Supabase manquante.' }

    try {
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        8000,
        'La connexion a expire. Reessaie dans un instant.',
      )
      if (error) return { error: error.message }
      if (!data.user) return { error: 'Utilisateur introuvable apres connexion.' }

      const loadedProfile = await fetchProfile(data.user.id)
      if (loadedProfile) return { error: null }

      // Fallback : le profil n'existe pas encore, on le crée
      const fallbackProfile = buildDefaultProfile(data.user.id, data.user.email ?? email)
      const { error: upsertError } = await supabase.from('profiles').upsert(fallbackProfile)
      if (upsertError) return { error: 'Erreur creation profil: ' + upsertError.message }

      setProfile(fallbackProfile)
      return { error: null }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Erreur de connexion inconnue.' }
    }
  }

  // ─── Sign Up ──────────────────────────────────────────────────────────────
  const signUp = async (email: string, password: string) => {
    if (!supabase) {
      return { error: 'Supabase n est pas configure. Ajoute .env.local pour activer l inscription.' }
    }

    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) return { error: error.message }

      if (!data.user) return { error: 'Erreur inattendue : utilisateur non créé.' }

      if (!data.session) {
        return { error: null, needsEmailConfirmation: true }
      }

      const loadedProfile = await fetchProfileWithRetry(data.user.id)

      if (!loadedProfile) {
        const fallbackProfile = buildDefaultProfile(data.user.id, email)
        const { error: upsertError } = await supabase.from('profiles').upsert(fallbackProfile)
        if (upsertError) return { error: upsertError.message }
        setProfile(fallbackProfile)
      }

      return { error: null, needsEmailConfirmation: false }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Erreur d\'inscription inconnue.' }
    }
  }

  // ─── Sign Out ─────────────────────────────────────────────────────────────
  const signOut = async () => {
    if (supabase) await supabase.auth.signOut()
    setProfile(null)
  }

  // ─── Update profil ────────────────────────────────────────────────────────
  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!profile) return
    const updated = { ...profile, ...data }
    setProfile(updated)
    if (supabase) {
      await supabase.from('profiles').update(data).eq('id', profile.id)
    }
  }

  return (
    <Ctx.Provider value={{ profile, loading, signIn, signUp, signOut, updateProfile }}>
      {children}
    </Ctx.Provider>
  )
}