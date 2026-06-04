import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ShoppingCart, Send, ArrowLeftRight, CheckCircle, AlertTriangle } from 'lucide-react'
import { MOCK_PRICES, fmtEur, fmtCrypto, calcSecurityScore, simulateFees, simulateGas, simulateSlippage, validateAddress } from '@/lib/utils'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import SecurityScoreBadge from '@/components/transactions/SecurityScoreBadge'
import AIPanel from '@/components/ai/AIPanel'
import type { PortfolioAsset, SecurityScore, TxType } from '@/types'
import toast from 'react-hot-toast'

const card: React.CSSProperties = { background: 'var(--glass)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }
const TABS: { type: TxType; label: string; icon: React.ElementType }[] = [
  { type: 'buy',  label: 'Achat',  icon: ShoppingCart },
  { type: 'send', label: 'Envoi',  icon: Send },
  { type: 'swap', label: 'Swap',   icon: ArrowLeftRight },
]

const PORTFOLIO_VALUE = 248
const DEMO_ASSETS = [
  { id: 'bitcoin',  sym: 'BTC', name: 'Bitcoin',  qty: 0.003821 },
  { id: 'ethereum', sym: 'ETH', name: 'Ethereum', qty: 0.042 },
  { id: 'solana',   sym: 'SOL', name: 'Solana',   qty: 0.52 },
]

type SummaryRow = [string, string]

export default function Transactions() {
  const { profile, updateProfile } = useAuth()
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

  // const computeScore = useCallback(() => {
  //   if (!amount || !coin) return
  //   const s = calcSecurityScore(
  //     tab, parseFloat(amount),
  //     profile?.simulated_balance_eur ?? 750,
  //     PORTFOLIO_VALUE,
  //     Math.abs(coin.price_change_percentage_24h),
  //     tab === 'swap' ? slippage : 0,
  //     tab === 'send' ? validateAddress(address) : true,
  //   )
  //   setScore(s)
  // }, [amount, coin, tab, slippage, address, profile])

  // useEffect(() => { computeScore() }, [computeScore])

  // On calcule le score directement pendant le rendu, pas besoin de useEffect
  const score = (amount && coin) ? calcSecurityScore(
    tab, 
    parseFloat(amount),
    profile?.simulated_balance_eur ?? 750,
    PORTFOLIO_VALUE,
    Math.abs(coin.price_change_percentage_24h),
    tab === 'swap' ? slippage : 0,
    tab === 'send' ? validateAddress(address) : true,
  ) : null;

  const proceed = () => {
    if (!amount || parseFloat(amount) <= 0) { toast.error('Saisis un montant valide.'); return }
    if (parseFloat(amount) > (profile?.simulated_balance_eur ?? 750)) { toast.error('Solde insuffisant.'); return }
    if (tab === 'send' && !validateAddress(address)) { toast.error('Adresse wallet invalide.'); return }
    setStep('summary')
  }

  const confirm = async () => {
    setConfirming(true)

    try {
      await new Promise(r => setTimeout(r, 800))

      if (profile && profile.id !== 'demo' && supabase) {
        const aiComment =
          score?.label === 'safe'
            ? 'Transaction bien parametree avec un niveau de risque faible.'
            : score?.label === 'warning'
              ? 'Transaction correcte, mais certains parametres meritent verification.'
              : 'Transaction enregistree avec un niveau de risque eleve.'

        const { error: transactionError } = await supabase.from('transactions').insert({
          user_id: profile.id,
          type: tab,
          crypto_name: coin.name,
          crypto_symbol: coin.symbol,
          amount_eur: parseFloat(amount),
          quantity: qty,
          fees_eur: tab === 'buy' ? fees : null,
          to_address: tab === 'send' ? address : null,
          gas_fee_eur: tab === 'send' ? gas : null,
          from_crypto_symbol: tab === 'swap' ? coin.symbol : null,
          to_crypto_symbol: tab === 'swap' ? swapTo.symbol : null,
          slippage_percentage: tab === 'swap' ? slippage : null,
          security_score: score?.score ?? 0,
          security_score_label: score?.label ?? 'warning',
          ai_comment: aiComment,
        })

        if (transactionError) throw transactionError

        if (tab === 'buy') {
          const { data: existingAsset, error: assetFetchError } = await supabase
            .from('portfolio_assets')
            .select('*')
            .eq('user_id', profile.id)
            .eq('crypto_id', coin.id)
            .single()

          if (assetFetchError && assetFetchError.code !== 'PGRST116') throw assetFetchError

          const asset = existingAsset as PortfolioAsset | null
          const existingQuantity = asset?.quantity ?? 0
          const existingAvgPrice = asset?.avg_buy_price ?? 0
          const nextQuantity = existingQuantity + qty
          const nextAvgPrice =
            nextQuantity > 0
              ? ((existingQuantity * existingAvgPrice) + (qty * coin.current_price)) / nextQuantity
              : coin.current_price

          const { error: portfolioError } = await supabase.from('portfolio_assets').upsert({
            user_id: profile.id,
            crypto_id: coin.id,
            crypto_symbol: coin.symbol,
            crypto_name: coin.name,
            crypto_image: coin.image,
            quantity: nextQuantity,
            avg_buy_price: nextAvgPrice,
            current_price: coin.current_price,
          }, { onConflict: 'user_id,crypto_id' })

          if (portfolioError) throw portfolioError
        }
      }

      await updateProfile({
        total_points: (profile?.total_points ?? 0) + 10,
        simulated_balance_eur: (profile?.simulated_balance_eur ?? 750) - parseFloat(amount) - fees,
      })
      setStep('done')
      toast.success('Transaction simulée ! +10 pts')
    } catch (error) {
      console.error(error)
      toast.error('Impossible d enregistrer la transaction.')
    } finally {
      setConfirming(false)
    }
  }

  const reset = () => { setStep('form'); setAmount(''); setAddress('') }

  if (step === 'done') return (
    <div className="fade-up" style={{ maxWidth: 480, margin: '0 auto' }}>
      <div style={{ ...card, textAlign: 'center', padding: 40 }}>
        <CheckCircle size={52} style={{ color: '#10b981', margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--tx)', marginBottom: 8 }}>Transaction confirmée !</h2>
        <p style={{ fontSize: 13, color: 'var(--tx3)', marginBottom: 20 }}>
          Simulation de {tab === 'buy' ? 'l\'achat' : tab === 'send' ? 'l\'envoi' : 'l\'échange'} de {fmtEur(parseFloat(amount))} enregistrée. +10 pts !
        </p>
        <div style={{ background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.15)', borderRadius: 12, padding: 14, marginBottom: 20, textAlign: 'left' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--pri)', marginBottom: 6 }}>💡 SafeBot</p>
          <p style={{ fontSize: 13, color: 'var(--tx2)', lineHeight: 1.6 }}>
            {score?.label === 'safe' && "Excellent choix ! Ton score de sécurité est vert — tu as bien géré le risque. Continue comme ça !"}
            {score?.label === 'warning' && "Transaction enregistrée ! Note que ton score était modéré. La prochaine fois, essaie de réduire le montant pour améliorer ton score."}
            {score?.label === 'danger' && "Transaction enregistrée, mais attention — le score était rouge. Évite d'utiliser une trop grande part de ton solde en une seule opération."}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-glass" style={{ flex: 1 }} onClick={reset}>Nouvelle simulation</button>
          <button className="btn-pri" style={{ flex: 1 }} onClick={() => navigate('/history')}>Voir l'historique</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--tx)' }}>Simuler une transaction</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: 14, padding: 5, width: 'fit-content' }}>
        {TABS.map(({ type, label, icon: Icon }) => (
          <button key={type} onClick={() => { setTab(type); setStep('form')}}
            style={{ padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, border: 'none', transition: 'all .2s', ...(tab === type ? { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' } : { background: 'transparent', color: 'var(--tx2)' }) }}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* FORM */}
          {step === 'form' && (
            <div style={card}>
              {/* Crypto selector */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--tx3)', marginBottom: 8 }}>
                  {tab === 'swap' ? 'Crypto à échanger' : 'Cryptomonnaie'}
                </label>
                <select className="glass-input" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
                  {MOCK_PRICES.map(c => <option key={c.id} value={c.id} style={{ background: 'var(--bg2)' }}>{c.name} ({c.symbol}) — {fmtEur(c.current_price, c.current_price < 1 ? 4 : 2)}</option>)}
                </select>
              </div>

              {/* Swap target */}
              {tab === 'swap' && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--tx3)', marginBottom: 8 }}>Crypto de destination</label>
                  <select className="glass-input" value={swapToId} onChange={e => setSwapToId(e.target.value)}>
                    {MOCK_PRICES.filter(c => c.id !== selectedId).map(c => <option key={c.id} value={c.id} style={{ background: 'var(--bg2)' }}>{c.name} ({c.symbol})</option>)}
                  </select>
                </div>
              )}

              {/* Address (send) */}
              {tab === 'send' && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--tx3)', marginBottom: 8 }}>Adresse wallet de destination</label>
                  <input className="glass-input" style={{ fontFamily: 'monospace', fontSize: 13 }} placeholder="0x... ou adresse Bitcoin" value={address} onChange={e => setAddress(e.target.value)} />
                  {address && (
                    <p style={{ fontSize: 12, marginTop: 6, color: validateAddress(address) ? '#10b981' : '#ef4444' }}>
                      {validateAddress(address) ? '✅ Format valide' : '❌ Format invalide — vérifie chaque caractère'}
                    </p>
                  )}
                </div>
              )}

              {/* Amount */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--tx3)', marginBottom: 8 }}>Montant (€)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontWeight: 600, color: 'var(--tx3)' }}>€</span>
                  <input className="glass-input" style={{ paddingLeft: 30 }} type="number" min="1" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
                </div>
                {amount && coin && parseFloat(amount) > 0 && (
                  <p style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 6 }}>≈ {fmtCrypto(qty, coin.symbol)} au prix de {fmtEur(coin.current_price, coin.current_price < 1 ? 4 : 2)}</p>
                )}
              </div>

              {/* Live score */}
              {score && amount && (
                <div style={{ marginBottom: 16, padding: 16, background: 'var(--glass2)', border: '1px solid var(--border)', borderRadius: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--tx3)', marginBottom: 12 }}>Score de sécurité</p>
                  <SecurityScoreBadge score={score} />
                  {score.label !== 'safe' && (
                    <div style={{ marginTop: 12, display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', borderRadius: 10, background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.2)', fontSize: 12, color: '#f59e0b' }}>
                      <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                      Vérifie bien les paramètres avant de confirmer.
                    </div>
                  )}
                </div>
              )}

              <button className="btn-pri" style={{ width: '100%', padding: 13 }} onClick={proceed}>Voir le récapitulatif →</button>
            </div>
          )}

          {/* SUMMARY */}
          {step === 'summary' && score && (
            <div style={card}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--tx)', marginBottom: 20 }}>Récapitulatif</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
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
                  <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--tx3)' }}>{k}</span>
                    <span style={{ fontWeight: 600, color: 'var(--tx)' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />
              <SecurityScoreBadge score={score} />
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button className="btn-glass" style={{ flex: 1 }} onClick={() => setStep('form')}>← Modifier</button>
                <button className="btn-pri" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={confirm} disabled={confirming}>
                  {confirming ? <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} className="spin" /> : '✅ Confirmer'}
                </button>
              </div>
            </div>
          )}
        </div>

        <AIPanel initialMessage={`Je suis là pour t'accompagner ! Pose-moi des questions sur ${coin?.name ?? 'la crypto'}, les frais ou les risques associés. 💡`} />
      </div>
    </div>
  )
}
