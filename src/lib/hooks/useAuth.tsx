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

const DEMO_PROFILE: UserProfile = {
  id: 'demo',
  email: 'demo@safestart.fr',
  username: 'Jihad D.',
  level: 'absolute_beginner',
  onboarding_completed: false,
  simulated_balance_eur: 1000,
  total_points: 0,
  is_premium: false,
  ai_messages_today: 0,
  ai_messages_limit: 20,
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false)
      return
    }

    const client = supabase
    const loadingTimeout = window.setTimeout(() => {
      setLoading(false)
    }, 4000)

    // Check real Supabase session
    const init = async () => {
      try {
        const { data: { session } } = await client.auth.getSession()
        if (session?.user) {
          const profileData = await fetchProfile(session.user.id)
          if (!profileData) {
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

    const { data: listener } = client.auth.onAuthStateChange(async (_e, session) => {
      if (session?.user) {
        const profileData = await fetchProfile(session.user.id)
        if (!profileData) {
          await client.auth.signOut()
          setProfile(null)
        }
      } else {
        setProfile(null)
      }
    })

    return () => {
      window.clearTimeout(loadingTimeout)
      listener.subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async (id: string) => {
    if (!supabase) return null
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()
    if (error) {
      console.error('fetchProfile error:', error)
      return null
    }
    if (data) {
      setProfile(data as UserProfile)
      return data as UserProfile
    }
    return null
  }

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: 'Supabase n’est pas configuré. Utilise demo@safestart.fr ou ajoute .env.local.' }
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }

    if (data.user) {
      const profileData = await fetchProfile(data.user.id)
      if (!profileData) {
        return { error: 'Connexion reussie, mais impossible de charger le profil utilisateur.' }
      }
    }

    return { error: null }
  }

  const signUp = async (email: string, password: string) => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: 'Supabase n’est pas configuré. Ajoute .env.local pour activer l’inscription.' }
    }
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: error.message }
    if (data.user) {
      const newProfile: UserProfile = {
        id: data.user.id,
        email,
        username: null,
        simulated_balance_eur: 1000,
        level: 'absolute_beginner',
        onboarding_completed: false,
        total_points: 0,
        is_premium: false,
        ai_messages_today: 0,
        ai_messages_limit: 20,
      }
      const { error: profileError } = await supabase.from('profiles').upsert(newProfile)
      if (profileError) return { error: profileError.message }
      setProfile(newProfile)
      if (!data.session) return { error: null, needsEmailConfirmation: true }
    }
    return { error: null, needsEmailConfirmation: false }
  }

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }
    setProfile(null)
  }

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!profile) return
    const updated = { ...profile, ...data }
    setProfile(updated)
    if (profile.id !== 'demo' && supabase) {
      await supabase.from('profiles').update(data).eq('id', profile.id)
    }
  }

  return (
    <Ctx.Provider value={{ profile, loading, signIn, signUp, signOut, updateProfile }}>
      {children}
    </Ctx.Provider>
  )
}
