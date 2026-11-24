import { Award, Trophy, ShoppingCart, Send, ShieldCheck, CalendarCheck, Globe, Repeat, Rocket, BookOpen, GraduationCap, type LucideIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'

/** Icône affichée pour chaque badge (le catalogue en base contient des emojis, non utilisés). */
export const BADGE_ICONS: Record<string, LucideIcon> = {
  first_transaction: Trophy,
  first_buy: ShoppingCart,
  first_send: Send,
  careful_trader: ShieldCheck,
  regular: CalendarCheck,
  careful_btc_buyer: ShieldCheck,
  secure_send: Send,
  diversified: Globe,
  smart_swap: Repeat,
  defi_explorer: Rocket,
  first_module: BookOpen,
  scholar: GraduationCap,
}

export const badgeIcon = (code?: string | null): LucideIcon => (code && BADGE_ICONS[code]) || Award

type AwardRow = { badge_code: string | null; badge_name: string | null; points: number; new_total_points: number | null }

/**
 * Demande au serveur de vérifier les badges gagnés (fonction SQL award_badges).
 * Affiche une notification par nouveau badge et renvoie le total de points à jour.
 */
export async function awardBadges(): Promise<{ newBadges: number; totalPoints: number | null }> {
  const { data, error } = await supabase.rpc('award_badges')
  if (error) {
    console.error('award_badges:', error)
    return { newBadges: 0, totalPoints: null }
  }
  const rows = (data ?? []) as AwardRow[]
  const earned = rows.filter(r => r.badge_code)
  earned.forEach(r => toast.success(`Badge débloqué : ${r.badge_name} (+${r.points} pts)`, { duration: 5000 }))
  const summary = rows.find(r => !r.badge_code)
  return { newBadges: earned.length, totalPoints: summary?.new_total_points ?? null }
}
