import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import type { Transaction } from '@/types'

/** Toutes les transactions simulées de l'utilisateur connecté. */
export function useTransactions() {
  const { profile } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!profile?.id || profile.id === 'demo' || !supabase) {
        setTransactions([]); setLoading(false); return
      }
      setLoading(true)
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
      if (error) console.error(error)
      setTransactions((data ?? []) as Transaction[])
      setLoading(false)
    }
    load()
  }, [profile?.id])

  return { transactions, loading }
}
