import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { ShoppingCart, Send, ArrowLeftRight, CheckCircle, AlertTriangle, XCircle, Lightbulb, ArrowRight, ArrowLeft } from 'lucide-react'
import { fmtEur, fmtCrypto, calcSecurityScore, simulateFees, simulateGas, simulateSlippage, validateAddress, DEFAULT_BALANCE_EUR } from '@/lib/utils'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import SecurityScoreBadge from '@/components/transactions/SecurityScoreBadge'
import AIPanel from '@/components/ai/AIPanel'
import { useMarketPrices, usePortfolio } from '@/lib/hooks/usePortfolio'
import { awardBadges } from '@/lib/badges'
import type { TxType } from '@/types'
import toast from 'react-hot-toast'
import './Transactions.css' 

const TABS: { type: TxType; label: string; icon: React.ElementType }[] = [
  { type: 'buy',  label: 'Achat',  icon: ShoppingCart },
  { type: 'send', label: 'Envoi',  icon: Send },
  { type: 'swap', label: 'Swap',   icon: ArrowLeftRight },
]

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

  // Prix en direct (CoinGecko), avec repli sur des prix de secours si l'API est indisponible
  const { prices } = useMarketPrices()
  const { positions, totalValue: portfolioValue, loading: portfolioLoading, reload: reloadPortfolio } = usePortfolio(prices)
  const balance = profile?.simulated_balance_eur ?? DEFAULT_BALANCE_EUR

  // Envoi et swap : on ne peut utiliser que des cryptos détenues
  const needsHolding = tab !== 'buy'
  const heldIds = positions.map(p => p.crypto_id)
  const sourceCoins = needsHolding ? prices.filter(c => heldIds.includes(c.id)) : prices
  const coin = sourceCoins.find(c => c.id === selectedId) ?? sourceCoins[0] ?? prices[0]
  const swapTo = prices.find(c => c.id === swapToId && c.id !== coin?.id) ?? prices.find(c => c.id !== coin?.id) ?? prices[1]
  const held = positions.find(p => p.crypto_id === coin?.id)
  const heldQty = held?.quantity ?? 0
  const heldValue = coin ? heldQty * coin.current_price : 0

  // Garde une sélection cohérente quand on change d'onglet ou que le portfolio se charge
  useEffect(() => {
    if (coin && coin.id !== selectedId) setSelectedId(coin.id)
  }, [coin?.id, selectedId])
  useEffect(() => {
    if (swapTo && swapTo.id !== swapToId) setSwapToId(swapTo.id)
  }, [swapTo?.id, swapToId])

  const qty = amount && coin ? parseFloat(amount) / coin.current_price : 0
  const fees = amount ? simulateFees(parseFloat(amount)) : 0
  // Valeurs aléatoires figées tant que les paramètres ne changent pas
  // (sinon elles changeaient à chaque rendu, et le récapitulatif ≠ montant enregistré)
  const gas = useMemo(() => simulateGas(), [tab, selectedId])
  const slippage = useMemo(
    () => (amount ? simulateSlippage(parseFloat(amount)) : 0),
    [amount, selectedId, swapToId],
  )

  const receivedQty = tab === 'swap' && amount && swapTo
    ? (parseFloat(amount) * (1 - slippage / 100)) / swapTo.current_price
    : 0

  const score = (amount && coin) ? calcSecurityScore(
    tab,
    parseFloat(amount),
    // Part utilisée : du solde en euros (achat) ou de la crypto détenue (envoi, swap)
    needsHolding ? heldValue : balance,
    portfolioValue,
    Math.abs(coin.price_change_percentage_24h),
    tab === 'swap' ? slippage : 0,
    tab === 'send' ? validateAddress(address) : true,
  ) : null;

  const proceed = () => {
    if (!amount || parseFloat(amount) <= 0) { toast.error('Saisis un montant valide.'); return }
    if (tab === 'buy' && parseFloat(amount) + fees > balance) { toast.error('Solde insuffisant (frais inclus).'); return }
    if (needsHolding && qty > heldQty * 1.000001) { toast.error(`Tu ne détiens que ${fmtCrypto(heldQty, coin.symbol)}.`); return }
    if (tab === 'send' && gas > balance) { toast.error('Solde en euros insuffisant pour payer les frais de gas.'); return }
    if (tab === 'send' && !validateAddress(address)) { toast.error('Adresse wallet invalide.'); return }
    setStep('summary')
  }

  const confirm = async () => {
    setConfirming(true)

    try {
      await new Promise(r => setTimeout(r, 800))

      const cost = tab === 'buy' ? parseFloat(amount) + fees : tab === 'send' ? gas : 0

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
          p_to_crypto_id: tab === 'swap' ? swapTo.id : null,
          p_to_crypto_name: tab === 'swap' ? swapTo.name : null,
          p_to_crypto_image: tab === 'swap' ? swapTo.image : null,
          p_to_price_eur: tab === 'swap' ? swapTo.current_price : null,
        })

        if (error) throw error
        const row = (Array.isArray(data) ? data[0] : data) as { new_balance: number; new_points: number } | null
        if (row) {
          patchProfile({ simulated_balance_eur: Number(row.new_balance), total_points: row.new_points })
        }
        reloadPortfolio()
        // Badges éventuellement débloqués par cette opération
        const { totalPoints } = await awardBadges()
        if (totalPoints !== null) patchProfile({ total_points: totalPoints })
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
      toast.error(
        message.includes('Solde insuffisant') ? 'Solde insuffisant.'
          : message.includes('Quantité insuffisante') ? 'Tu ne détiens pas assez de cette crypto.'
          : "Impossible d'enregistrer la transaction.",
      )
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
          {tab === 'buy' && <>Achat de {fmtCrypto(qty, coin.symbol)} pour {fmtEur(parseFloat(amount))} enregistré. +10 pts !</>}
          {tab === 'send' && <>Envoi de {fmtCrypto(qty, coin.symbol)} ({fmtEur(parseFloat(amount))}) enregistré. +10 pts !</>}
          {tab === 'swap' && <>Échange de {fmtCrypto(qty, coin.symbol)} contre ≈ {fmtCrypto(receivedQty, swapTo.symbol)} enregistré. +10 pts !</>}
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

          {/* Envoi / swap impossible sans crypto détenue */}
          {step === 'form' && needsHolding && !portfolioLoading && sourceCoins.length === 0 && (
            <div className="glass-card-base tx-empty">
              <p>{tab === 'send' ? 'Pour envoyer' : 'Pour échanger'} une crypto, il faut d'abord en détenir.</p>
              <button className="btn-pri" onClick={() => setTab('buy')}>Simuler un achat</button>
              <Link to="/wallet" className="tx-empty-link">Voir mon wallet</Link>
            </div>
          )}

          {/* FORM */}
          {step === 'form' && (!needsHolding || sourceCoins.length > 0) && (
            <div className="glass-card-base">
              {/* Crypto selector */}
              <div className="tx-form-group">
                <label htmlFor="tx-crypto" className="tx-label">
                  {tab === 'swap' ? 'Crypto à échanger' : 'Cryptomonnaie'}
                </label>
                <select id="tx-crypto" className="glass-input" value={coin?.id ?? ''} onChange={e => setSelectedId(e.target.value)}>
                  {sourceCoins.map(c => (
                    <option key={c.id} value={c.id} className="tx-select-option">
                      {c.name} ({c.symbol}) — {fmtEur(c.current_price, c.current_price < 1 ? 4 : 2)}
                    </option>
                  ))}
                </select>
                {needsHolding && held && (
                  <p className="tx-amount-hint">Tu détiens {fmtCrypto(heldQty, coin.symbol)} (≈ {fmtEur(heldValue)})</p>
                )}
              </div>

              {/* Swap target */}
              {tab === 'swap' && (
                <div className="tx-form-group">
                  <label htmlFor="tx-swap-to" className="tx-label">Crypto de destination</label>
                  <select id="tx-swap-to" className="glass-input" value={swapTo?.id ?? ''} onChange={e => setSwapToId(e.target.value)}>
                    {prices.filter(c => c.id !== coin?.id).map(c => (
                      <option key={c.id} value={c.id} className="tx-select-option">{c.name} ({c.symbol})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Address (send) */}
              {tab === 'send' && (
                <div className="tx-form-group">
                  <label htmlFor="tx-address" className="tx-label">Adresse wallet de destination</label>
                  <input id="tx-address" autoComplete="off" spellCheck={false} className="glass-input tx-input-monospace" placeholder="0x... ou adresse Bitcoin" value={address} onChange={e => setAddress(e.target.value)} />
                  {address && (
                    <p className={`tx-address-status ${validateAddress(address) ? 'tx-address-valid' : 'tx-address-invalid'}`}>
                      <span className="ico-inline">{validateAddress(address) ? <><CheckCircle size={13} />Format valide</> : <><XCircle size={13} />Format invalide — vérifie chaque caractère</>}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Amount */}
              <div className="tx-form-group">
                <label htmlFor="tx-amount" className="tx-label">Montant (€)</label>
                <div className="tx-amount-wrapper">
                  <span className="tx-amount-currency">€</span>
                  <input id="tx-amount" inputMode="decimal" className="glass-input tx-amount-input" type="number" min="1" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
                  {needsHolding && heldValue > 0 && (
                    <button type="button" className="tx-max-btn" onClick={() => setAmount((Math.floor(heldValue * 100) / 100).toFixed(2))}>
                      Max
                    </button>
                  )}
                </div>
                {tab === 'buy' && <p className="tx-amount-hint">Solde disponible : {fmtEur(balance)}</p>}
                {amount && coin && parseFloat(amount) > 0 && (
                  <p className="tx-amount-hint">
                    ≈ {fmtCrypto(qty, coin.symbol)} au prix de {fmtEur(coin.current_price, coin.current_price < 1 ? 4 : 2)}
                    {tab === 'swap' && <> → tu recevras ≈ {fmtCrypto(receivedQty, swapTo.symbol)}</>}
                  </p>
                )}
              </div>

              {/* Live score */}
              {score && amount && (
                <div className="tx-score-box">
                  <div className="tx-label">Score de sécurité</div>
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
                  [tab === 'buy' ? 'Quantité achetée' : tab === 'send' ? 'Quantité envoyée' : 'Quantité échangée', fmtCrypto(qty, coin?.symbol ?? '')],
                  tab === 'buy'  ? ['Frais simulés', fmtEur(fees)] : null,
                  tab === 'send' ? ['Gas fees simulés', fmtEur(gas)] : null,
                  tab === 'swap' ? ['Slippage estimé', `${slippage.toFixed(2)}%`] : null,
                  tab === 'swap' ? ['Reçu estimé', fmtCrypto(receivedQty, swapTo?.symbol ?? '')] : null,
                  ['Coût en euros', fmtEur(tab === 'buy' ? parseFloat(amount) + fees : tab === 'send' ? gas : 0)],
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