import React, { useEffect, useState } from 'react'
import { Clock, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { fmtEur } from '@/lib/utils'
import type { Transaction } from '@/types'
import toast from 'react-hot-toast'
import '@/styles/pages.css'

// ─── UTILS HISTORY 
const txColor = (t: string) => t === 'buy' ? '#10b981' : t === 'send' ? '#ef4444' : '#6366f1'
const txLabel = (t: string) => t === 'buy' ? 'Achat' : t === 'send' ? 'Envoi' : 'Swap'
const scoreClass = (l: string) => l === 'safe' ? 'score-safe' : l === 'warning' ? 'score-warning' : 'score-danger'

type DetailRow = [string, string]
type HistoryTx = Transaction & {
  name: string
  sym: string
  amount: number | null
  qty: number | null
  score: number
  label: string
  date: string
  ai: string
}

export default function History() {
  const { profile } = useAuth()
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [txs, setTxs] = useState<HistoryTx[]>([])

  useEffect(() => {
    const loadTransactions = async () => {
      if (!profile?.id || profile.id === 'demo' || !supabase) {
        setTxs([])
        return
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error(error)
        toast.error('Impossible de charger l historique.')
        return
      }

      setTxs(((data ?? []) as Transaction[]).map((tx) => ({
        ...tx,
        name: tx.crypto_name,
        sym: tx.crypto_symbol,
        amount: tx.amount_eur ?? null,
        qty: tx.quantity ?? null,
        score: tx.security_score,
        label: tx.security_score_label,
        date: new Date(tx.created_at).toLocaleString('fr-FR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        ai: tx.ai_comment,
      })))
    }

    loadTransactions()
  }, [profile?.id])

  const filtered = filter === 'all' ? txs : txs.filter(t => t.type === filter)

  return (
    <div className="fade-up flex-container">
      <div>
        <h1 className="text-title">Historique</h1>
        <p className="text-subtitle">{txs.length} transactions simulées</p>
      </div>

      <div className="flex-row-center">
        <span className="text-muted-sm">Filtrer :</span>
        {['all', 'buy', 'send', 'swap'].map(f => (
          <button 
            key={f} 
            onClick={() => setFilter(f)}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
          >
            {f === 'all' ? 'Toutes' : txLabel(f)}
          </button>
        ))}
      </div>

      <div className="dashboard-card no-padding">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <Clock size={40} className="empty-icon" />
            <p>Aucune transaction</p>
          </div>
        ) : filtered.map((tx, i) => (
          <div key={tx.id} className={i < filtered.length - 1 ? 'faq-row' : 'faq-row no-border'}>
            <button 
              onClick={() => setExpanded(expanded === tx.id ? null : tx.id)}
              className="tx-row"
            >
              <div 
                className="tx-icon-wrapper"
                style={{ background: `${txColor(tx.type)}22`, color: txColor(tx.type) }}
              >
                {txLabel(tx.type)[0]}
              </div>
              <div className="tx-details">
                <div className="tx-name">{txLabel(tx.type)} {tx.name}</div>
                <div className="tx-date">{tx.date}</div>
              </div>
              <div className="tx-right-side">
                <div className="tx-amount">{tx.amount ? fmtEur(tx.amount) : `${tx.qty} ${tx.sym}`}</div>
                <span className={`tx-score-badge ${scoreClass(tx.label)}`}>{tx.score}/100</span>
              </div>
              {expanded === tx.id ? <ChevronUp size={16} color="var(--tx3)" /> : <ChevronDown size={16} color="var(--tx3)" />}
            </button>

            {expanded === tx.id && (
              <div className="tx-expanded-panel fade-up" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="tx-grid-details">
                  {[
                    ['Type', txLabel(tx.type)],
                    tx.amount ? ['Montant', fmtEur(tx.amount)] : null,
                    tx.qty ? ['Quantité', `${tx.qty} ${tx.sym}`] : null,
                    tx.fees_eur ? ['Frais', fmtEur(tx.fees_eur)] : null,
                    tx.gas_fee_eur ? ['Gas fees', fmtEur(tx.gas_fee_eur)] : null,
                    tx.slippage_percentage ? ['Slippage', `${tx.slippage_percentage}%`] : null,
                    tx.type === 'swap' && tx.to_crypto_symbol ? ['Vers', tx.to_crypto_symbol] : null,
                    tx.to_address ? ['Adresse', `${tx.to_address.slice(0, 6)}…${tx.to_address.slice(-4)}`] : null,
                    ['Score', `${tx.score}/100`],
                  ].filter((row): row is DetailRow => row !== null).map(([k, v]) => (
                    <div key={k as string}>
                      <div className="tx-grid-label">{k}</div>
                      <div className="tx-grid-value">{v}</div>
                    </div>
                  ))}
                </div>
                <div className="safebot-comment-box">
                  <p className="safebot-comment-title ico-inline"><Lightbulb size={14} />Analyse de la transaction</p>
                  <p className="safebot-comment-text">{tx.ai}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
