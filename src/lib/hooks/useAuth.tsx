import React, { createContext, useContext, useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
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

  const fetchProfile = async (id: string) => {
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

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false)
      return
    }

    const client = supabase
    const loadingTimeout = window.setTimeout(() => {
      setLoading(false)
    }, 4000)

    const init = async () => {
      try {
        const { data: { session } } = await client.auth.getSession()
        if (session?.user) {
          const loadedProfile = await fetchProfile(session.user.id)
          if (!loadedProfile) {
            await client.auth.signOut()
            setProfile(null)
          }
        }
      } catch (error) {
        console.error('auth init error:', error)
      } finally {
        window.clearTimeout(loadingTimeout)
        setLoading(false)
      }
    }

    init()

    const { data: listener } = client.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setProfile(null)
        return
      }

      const loadedProfile = await fetchProfile(session.user.id)
      if (!loadedProfile) {
        await client.auth.signOut()
        setProfile(null)
      }
    })

    return () => {
      window.clearTimeout(loadingTimeout)
      listener.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: 'Configuration Supabase manquante.' }
    }

    try {
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        8000,
        'La connexion a expire. Reessaie dans un instant.',
      )
      if (error) return { error: error.message }

      if (!data.user) {
        return { error: 'Utilisateur introuvable apres connexion.' }
      }

      const loadedProfile = await fetchProfile(data.user.id)
      if (loadedProfile) return { error: null }

      const fallbackProfile = buildDefaultProfile(data.user.id, data.user.email ?? email)
      const { error: upsertError } = await supabase.from('profiles').upsert(fallbackProfile)
      if (upsertError) return { error: 'Erreur creation profil: ' + upsertError.message }

      setProfile(fallbackProfile)
      return { error: null }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Erreur de connexion inconnue.' }
    }
  }

  const signUp = async (email: string, password: string) => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: 'Supabase n est pas configure. Ajoute .env.local pour activer l inscription.' }
    }

    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: error.message }

    if (data.user) {
      const newProfile = buildDefaultProfile(data.user.id, email)
      const { error: profileError } = await supabase.from('profiles').upsert(newProfile)
      if (profileError) return { error: profileError.message }
      setProfile(newProfile)
      if (!data.session) return { error: null, needsEmailConfirmation: true }
    }

    return { error: null, needsEmailConfirmation: false }
  }

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut()
    setProfile(null)
  }

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
