import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { DEFAULT_BALANCE_EUR } from '@/lib/utils'
import type { UserProfile } from '@/types'
import toast from 'react-hot-toast'

interface AuthCtx {
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsEmailConfirmation?: boolean }>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<UserProfile>) => Promise<void>
  /** Met à jour le profil en mémoire uniquement (valeurs déjà écrites côté serveur). */
  patchProfile: (data: Partial<UserProfile>) => void
}

const Ctx = createContext<AuthCtx>(null!)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Utilitaire timeout
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

  // Profil par défaut 
  const buildDefaultProfile = (id: string, email: string): UserProfile => ({
    id,
    email,
    username: null,
    level: 'absolute_beginner',
    onboarding_completed: false,
    simulated_balance_eur: DEFAULT_BALANCE_EUR,
    total_points: 0,
    is_premium: false,
    ai_messages_today: 0,
    ai_messages_limit: 20,
  })

  // Fetch profil : distingue « profil absent » (data null) et « échec réseau » (failed)
  const fetchProfile = async (id: string): Promise<{ data: UserProfile | null; failed: boolean }> => {
    if (!supabase) return { data: null, failed: true }

    try {
      const { data, error } = await withTimeout(
        Promise.resolve(supabase.from('profiles').select('*').eq('id', id).maybeSingle()),
        8000,
        'Le chargement du profil a expiré.',
      )
      if (error) {
        console.error('fetchProfile error:', error)
        return { data: null, failed: true }
      }
      if (!data) return { data: null, failed: false }

      const nextProfile = data as UserProfile
      setProfile(nextProfile)
      return { data: nextProfile, failed: false }
    } catch (error) {
      console.error('fetchProfile error:', error)
      return { data: null, failed: true }
    }
  }

  // Fetch profil avec retry (le profil d'un nouveau compte peut arriver avec un léger délai)
  const fetchProfileWithRetry = async (id: string, retries = 5, delayMs = 800) => {
    let last = { data: null as UserProfile | null, failed: false }
    for (let i = 0; i < retries; i++) {
      last = await fetchProfile(id)
      if (last.data) return last
      if (i < retries - 1) await new Promise(resolve => setTimeout(resolve, delayMs))
    }
    return last
  }

  // Charge le profil, ou le crée s'il n'existe vraiment pas.
  // Ne remplace JAMAIS un profil existant : en cas d'erreur réseau, on renvoie null.
  const loadOrCreateProfile = async (id: string, email: string): Promise<UserProfile | null> => {
    if (!supabase) return null

    const existing = await fetchProfileWithRetry(id)
    if (existing.data) return existing.data
    if (existing.failed) return null

    const { error } = await supabase
      .from('profiles')
      .upsert(buildDefaultProfile(id, email), { onConflict: 'id', ignoreDuplicates: true })
    if (error) {
      console.error('createProfile error:', error)
      return null
    }

    return (await fetchProfile(id)).data
  }

  const PROFILE_ERROR = 'Impossible de charger ton profil. Vérifie ta connexion et réessaie.'

  // Init session
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
          const loaded = await loadOrCreateProfile(session.user.id, session.user.email ?? '')
          if (!loaded) toast.error(PROFILE_ERROR)
        }
      } catch (error) {
        console.error('auth init error:', error)
      } finally {
        setLoading(false)
      }
    }

    init()

    const { data: listener } = client.auth.onAuthStateChange(async (event, session) => {
      // INITIAL_SESSION est géré dans init() ci-dessus
      if (event === 'INITIAL_SESSION') return

      if (!session?.user) {
        setProfile(null)
        setLoading(false)
        return
      }

      if (event === 'SIGNED_IN' || (event as string) === 'USER_UPDATED') {
        await loadOrCreateProfile(session.user.id, session.user.email ?? '')
      }
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  // Sign In 
  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: 'Configuration Supabase manquante.' }

    try {
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        8000,
        'La connexion a expiré. Réessaie dans un instant.',
      )
      if (error) return { error: error.message }
      if (!data.user) return { error: 'Utilisateur introuvable après connexion.' }

      const loaded = await loadOrCreateProfile(data.user.id, data.user.email ?? email)
      if (!loaded) {
        await supabase.auth.signOut()
        return { error: PROFILE_ERROR }
      }
      return { error: null }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Erreur de connexion inconnue.' }
    }
  }

  // Sign Up 
  const signUp = async (email: string, password: string) => {
    if (!supabase) {
      return { error: 'Supabase n\'est pas configuré. Ajoute .env.local pour activer l\'inscription.' }
    }

    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) return { error: error.message }

      if (!data.user) return { error: 'Erreur inattendue : utilisateur non créé.' }

      if (!data.session) {
        return { error: null, needsEmailConfirmation: true }
      }

      const loaded = await loadOrCreateProfile(data.user.id, email)
      if (!loaded) return { error: PROFILE_ERROR }

      return { error: null, needsEmailConfirmation: false }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Erreur d\'inscription inconnue.' }
    }
  }

  // Sign Out 
  const signOut = async () => {
    if (supabase) await supabase.auth.signOut()
    setProfile(null)
  }

  // Update profil 
  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!profile) return
    const updated = { ...profile, ...data }
    setProfile(updated)
    if (supabase) {
      await supabase.from('profiles').update(data).eq('id', profile.id)
    }
  }

  const patchProfile = (data: Partial<UserProfile>) => {
    setProfile(prev => (prev ? { ...prev, ...data } : prev))
  }

  return (
    <Ctx.Provider value={{ profile, loading, signIn, signUp, signOut, updateProfile, patchProfile }}>
      {children}
    </Ctx.Provider>
  )
}