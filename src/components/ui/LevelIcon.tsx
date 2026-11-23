import React from 'react'
import { Sprout, Search, Zap, Rocket, type LucideProps } from 'lucide-react'

const ICONS: Record<string, React.ElementType> = {
  absolute_beginner: Sprout,
  curious_novice: Search,
  intermediate: Zap,
  advanced: Rocket,
}

export default function LevelIcon({ level, ...props }: { level?: string | null } & LucideProps) {
  const Icon = ICONS[level ?? 'absolute_beginner'] ?? Sprout
  return <Icon {...props} />
}
