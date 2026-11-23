import React, { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ShoppingCart, Send, ArrowLeftRight, CheckCircle, AlertTriangle, XCircle, Lightbulb, ArrowRight, ArrowLeft } from 'lucide-react'
import { MOCK_PRICES, fmtEur, fmtCrypto, calcSecurityScore, simulateFees, simulateGas, simulateSlippage, validateAddress, DEFAULT_BALANCE_EUR } from '@/lib/utils'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import SecurityScoreBadge from '@/components/transactions/SecurityScoreBadge'
import AIPanel from '@/components/ai/AIPanel'
import type { TxType } from '@/types'
import toast from 'react-hot-toast'
import './Transactions.css' 

const TABS: { type: TxType; label: string; icon: React.ElementType }[] = [
  { type: 'buy',  label: 'Achat',  icon: ShoppingCart },
  { type: 'send', label: 'Envoi',  icon: Send },
  { type: 'swap', label: 'Swap',   icon: ArrowLeftRight },
]

const PORTFOLIO_VALUE = 248
type SummaryRow = [string, string]

export default function Transactions() {
  const { profile, patchProfile } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const [tab, setTab] = useState<TxType>((params.get('type') as TxType) ?? 'buy')
  const [selectedId, setSelectedId] = useState(params.get('crypto') ?? 'bitcoin')
  const [swapToId, setSwapToId] = useState('ethereum')
  const [amount, setAmount] = useState('')
  const [address, setAddress] = useState('')
  const [step, setStep] = useState<'form'|'summary'|'done'>('form')
  const [confirming, setConfirming] = useState(false)

  const coin = MOCK_PRICES.find(c => c.id === selectedId) ?? MOCK_PRICES[0]
  const swapTo = MOCK_PRICES.find(c => c.id === swapToId) ?? MOCK_PRICES[1]
  const qty = amount && coin ? parseFloat(amount) / coin.current_price : 0
  const fees = amount ? simulateFees(parseFloat(amount)) : 0
  const gas = simulateGas()
  const slippage = amount ? simulateSlippage(parseFloat(amount)) : 0

  const score = (amount && coin) ? calcSecurityScore(
    tab, 
    parseFloat(amount),
    profile?.simulated_balance_eur ?? DEFAULT_BALANCE_EUR,
    PORTFOLIO_VALUE,
    Math.abs(coin.price_change_percentage_24h),
    tab === 'swap' ? slippage : 0,
    tab === 'send' ? validateAddress(address) : true,
  ) : null;

  const proceed = () => {
    if (!amount || parseFloat(amount) <= 0) { toast.error('Saisis un montant valide.'); return }
    if (parseFloat(amount) + (tab === 'buy' ? fees : 0) > (profile?.simulated_balance_eur ?? DEFAULT_BALANCE_EUR)) { toast.error('Solde insuffisant (frais inclus).'); return }
    if (tab === 'send' && !validateAddress(address)) { toast.error('Adresse wallet invalide.'); return }
    setStep('summary')
  }

  const confirm = async () => {
    setConfirming(true)

    try {
      await new Promise(r => setTimeout(r, 800))

      const cost = parseFloat(amount) + (tab === 'buy' ? fees : 0)

      if (profile && profile.id !== 'demo' && supabase) {
        const aiComment =
          score?.label === 'safe'
            ? 'Transaction bien paramétrée avec un niveau de risque faible.'
            : score?.label === 'warning'
              ? 'Transaction correcte, mais certains paramètres méritent vérification.'
              : 'Transaction enregistrée avec un niveau de risque élevé.'

        // Une seule transaction SQL : historique + portfolio + solde/points (tout ou rien)
        const { data, error } = await supabase.rpc('record_simulated_transaction', {
          p_type: tab,
          p_crypto_id: coin.id,
          p_crypto_name: coin.name,
          p_crypto_symbol: coin.symbol,
          p_crypto_image: coin.image,
          p_price_eur: coin.current_price,
          p_amount_eur: parseFloat(amount),
          p_quantity: qty,
          p_fees_eur: tab === 'buy' ? fees : null,
          p_to_address: tab === 'send' ? address : null,
          p_gas_fee_eur: tab === 'send' ? gas : null,
          p_from_crypto_symbol: tab === 'swap' ? coin.symbol : null,
          p_to_crypto_symbol: tab === 'swap' ? swapTo.symbol : null,
          p_slippage_percentage: tab === 'swap' ? slippage : null,
          p_security_score: score?.score ?? 0,
          p_security_score_label: score?.label ?? 'warning',
          p_ai_comment: aiComment,
        })

        if (error) throw error
        const row = (Array.isArray(data) ? data[0] : data) as { new_balance: number; new_points: number } | null
        if (row) {
          patchProfile({ simulated_balance_eur: Number(row.new_balance), total_points: row.new_points })
        }
      } else {
        // Mode démo : rien n'est enregistré, mise à jour locale uniquement
        patchProfile({
          total_points: (profile?.total_points ?? 0) + 10,
          simulated_balance_eur: (profile?.simulated_balance_eur ?? DEFAULT_BALANCE_EUR) - cost,
        })
      }

      setStep('done')
      toast.success('Transaction simulée ! +10 pts')
    } catch (error) {
      console.error(error)
      const message = (error as { message?: string })?.message ?? ''
      toast.error(message.includes('Solde insuffisant') ? 'Solde insuffisant.' : "Impossible d'enregistrer la transaction.")
    } finally {
      setConfirming(false)
    }
  }

  const reset = () => { setStep('form'); setAmount(''); setAddress('') }

  if (step === 'done') return (
    <div className="fade-up tx-done-wrapper">
      <div className="glass-card-base tx-done-card">
        <CheckCircle size={52} className="tx-done-icon" />
        <h2 className="tx-done-title">Transaction confirmée !</h2>
        <p className="tx-done-text">
          Simulation de {tab === 'buy' ? 'l\'achat' : tab === 'send' ? 'l\'envoi' : 'l\'échange'} de {fmtEur(parseFloat(amount))} enregistrée. +10 pts !
        </p>
        <div className="tx-ai-feedback-box">
          <p className="tx-ai-feedback-title ico-inline"><Lightbulb size={14} />Conseil SafeStart</p>
          <p className="tx-ai-feedback-body">
            {score?.label === 'safe' && "Excellent choix ! Ton score de sécurité est vert — tu as bien géré le risque. Continue comme ça !"}
            {score?.label === 'warning' && "Transaction enregistrée ! Note que ton score était modéré. La prochaine fois, essaie de réduire le montant pour améliorer ton score."}
            {score?.label === 'danger' && "Transaction enregistrée, mais attention — le score était rouge. Évite d'utiliser une trop grande part de ton solde en une seule opération."}
          </p>
        </div>
        <div className="tx-summary-actions">
          <button className="btn-glass tx-btn-flex" onClick={reset}>Nouvelle simulation</button>
          <button className="btn-pri tx-btn-flex" onClick={() => navigate('/history')}>Voir l'historique</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="fade-up tx-container">
      <h1 className="tx-title-main">Simuler une transaction</h1>

      {/* Tabs */}
      <div className="tx-tabs-wrapper">
        {TABS.map(({ type, label, icon: Icon }) => (
          <button 
            key={type} 
            onClick={() => { setTab(type); setStep('form')}}
            className={`tx-tab-btn ${tab === type ? 'active' : ''}`}
          >
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      <div className="tx-grid-layout">
        <div className="tx-form-column">

          {/* FORM */}
          {step === 'form' && (
            <div className="glass-card-base">
              {/* Crypto selector */}
              <div className="tx-form-group">
                <label className="tx-label">
                  {tab === 'swap' ? 'Crypto à échanger' : 'Cryptomonnaie'}
                </label>
                <select className="glass-input" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
                  {MOCK_PRICES.map(c => (
                    <option key={c.id} value={c.id} className="tx-select-option">
                      {c.name} ({c.symbol}) — {fmtEur(c.current_price, c.current_price < 1 ? 4 : 2)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Swap target */}
              {tab === 'swap' && (
                <div className="tx-form-group">
                  <label className="tx-label">Crypto de destination</label>
                  <select className="glass-input" value={swapToId} onChange={e => setSwapToId(e.target.value)}>
                    {MOCK_PRICES.filter(c => c.id !== selectedId).map(c => (
                      <option key={c.id} value={c.id} className="tx-select-option">{c.name} ({c.symbol})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Address (send) */}
              {tab === 'send' && (
                <div className="tx-form-group">
                  <label className="tx-label">Adresse wallet de destination</label>
                  <input className="glass-input tx-input-monospace" placeholder="0x... ou adresse Bitcoin" value={address} onChange={e => setAddress(e.target.value)} />
                  {address && (
                    <p className={`tx-address-status ${validateAddress(address) ? 'tx-address-valid' : 'tx-address-invalid'}`}>
                      <span className="ico-inline">{validateAddress(address) ? <><CheckCircle size={13} />Format valide</> : <><XCircle size={13} />Format invalide — vérifie chaque caractère</>}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Amount */}
              <div className="tx-form-group">
                <label className="tx-label">Montant (€)</label>
                <div className="tx-amount-wrapper">
                  <span className="tx-amount-currency">€</span>
                  <input className="glass-input tx-amount-input" type="number" min="1" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
                </div>
                {amount && coin && parseFloat(amount) > 0 && (
                  <p className="tx-amount-hint">≈ {fmtCrypto(qty, coin.symbol)} au prix de {fmtEur(coin.current_price, coin.current_price < 1 ? 4 : 2)}</p>
                )}
              </div>

              {/* Live score */}
              {score && amount && (
                <div className="tx-score-box">
                  <label className="tx-label">Score de sécurité</label>
                  <SecurityScoreBadge score={score} />
                  {score.label !== 'safe' && (
                    <div className="tx-score-warning">
                      <AlertTriangle size={14} className="tx-warning-icon" />
                      Vérifie bien les paramètres avant de confirmer.
                    </div>
                  )}
                </div>
              )}

              <button className="btn-pri tx-btn-full" onClick={proceed}><span className="ico-inline">Voir le récapitulatif <ArrowRight size={15} /></span></button>
            </div>
          )}

          {/* SUMMARY */}
          {step === 'summary' && score && (
            <div className="glass-card-base">
              <h2 className="tx-summary-title">Récapitulatif</h2>
              <div className="tx-summary-list">
                {[
                  ['Type', tab === 'buy' ? 'Achat simulé' : tab === 'send' ? 'Envoi simulé' : 'Swap simulé'],
                  ['Crypto', `${coin?.name} (${coin?.symbol})`],
                  ['Montant', fmtEur(parseFloat(amount))],
                  ['Quantité estimée', fmtCrypto(qty, coin?.symbol ?? '')],
                  tab === 'buy'  ? ['Frais simulés', fmtEur(fees)] : null,
                  tab === 'send' ? ['Gas fees simulés', fmtEur(gas)] : null,
                  tab === 'swap' ? ['Slippage estimé', `${slippage.toFixed(2)}%`] : null,
                  tab === 'swap' ? ['Reçu estimé', fmtCrypto(parseFloat(amount) / (swapTo?.current_price ?? 1), swapTo?.symbol ?? '')] : null,
                ].filter((row): row is SummaryRow => row !== null).map(([k, v]) => (
                  <div key={k} className="tx-summary-row">
                    <span className="tx-summary-key">{k}</span>
                    <span className="tx-summary-val">{v}</span>
                  </div>
                ))}
              </div>
              <div className="tx-divider" />
              <SecurityScoreBadge score={score} />
              <div className="tx-summary-actions">
                <button className="btn-glass tx-btn-flex" onClick={() => setStep('form')}><span className="ico-inline"><ArrowLeft size={15} />Modifier</span></button>
                <button className="btn-pri tx-btn-flex" onClick={confirm} disabled={confirming}>
                  <div className="tx-btn-confirm-content">
                    {confirming ? <span className="tx-spinner spin" /> : <span className="ico-inline"><CheckCircle size={15} />Confirmer</span>}
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        <AIPanel initialMessage={`Avant de confirmer, vérifie le montant, les frais et le score de sécurité de ton opération sur ${coin?.name ?? 'cette crypto'}.`} />
      </div>
    </div>
  )
}