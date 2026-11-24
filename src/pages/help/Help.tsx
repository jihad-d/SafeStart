import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Search, MessageSquare, CheckCircle } from 'lucide-react'
import { CONTACT_EMAIL } from '@/lib/config'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import toast from 'react-hot-toast'
import '@/styles/pages.css'

const FAQ_ITEMS = [
  { q: "Qu'est-ce que SafeStart ?", a: "SafeStart est une application d'apprentissage de la crypto. Tu simules de vraies transactions avec les prix réels du marché, mais sans jamais utiliser d'argent réel. Chaque opération est accompagnée d'explications et d'un score de sécurité." },
  { q: "Mon argent est-il en danger ?", a: "Non, absolument pas ! SafeStart est un simulateur à 100%. Tu démarres avec 1 000 € fictifs. Il est impossible de perdre de l'argent réel sur SafeStart." },
  { q: "Comment fonctionnent les prix affichés ?", a: "Les prix sont des données réelles récupérées depuis l'API CoinGecko et mis à jour toutes les minutes. Tu pratiques avec les vrais prix du marché, dans un environnement sécurisé." },
  { q: "Qu'est-ce que le score de sécurité ?", a: "Le score (vert/orange/rouge) évalue le risque d'une transaction avant que tu la confirmes. Il prend en compte le montant vs ton solde, la volatilité de la crypto, le slippage pour les swaps, et la validité de l'adresse pour les envois." },
  { q: "Qu'est-ce qu'un gas fee ?", a: "Les gas fees sont des frais payés au réseau blockchain pour valider ta transaction. Sur SafeStart, ces frais sont simulés pour t'habituer à les prendre en compte." },
  { q: "Comment puis-je améliorer mon niveau ?", a: "Ton niveau est défini par l'évaluation de départ. Pour progresser, multiplie les simulations avec un bon score de sécurité et relève les challenges : ta page Progression suit tes résultats." },
  { q: "Comment réinitialiser mon portfolio ?", a: "Dans Paramètres, section Zone de danger, tu peux réinitialiser ton portfolio fictif. Ton solde repart à 1 000 € simulés, ta progression est conservée." },
]

export default function Help() {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState<number | null>(null)
  const [feedback, setFeedback] = useState(false)
  const [msg, setMsg] = useState('')
  const [topic, setTopic] = useState('Question générale')

  const { profile } = useAuth()
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  // Le message est enregistré dans Supabase (table support_messages)
  const sendMessage = async () => {
    if (!msg.trim()) { toast.error('Écris ton message avant de l’envoyer.'); return }
    setSending(true)
    const { error } = await supabase.from('support_messages').insert({
      topic,
      message: msg.trim().slice(0, 2000),
      email: profile?.email ?? null,
    })
    setSending(false)
    if (error) {
      console.error(error)
      toast.error(`L'envoi a échoué. Tu peux nous écrire à ${CONTACT_EMAIL}.`)
      return
    }
    setSent(true)
    setFeedback(false)
    setMsg('')
  }

  const filtered = FAQ_ITEMS.filter(f =>
    !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fade-up flex-container help-container">
      <div>
        <h1 className="text-title">Aide & FAQ</h1>
        <p className="text-subtitle">Trouve rapidement une réponse à ta question</p>
      </div>

      <div className="search-wrapper">
        <Search size={15} className="search-icon" />
        <input type="search" aria-label="Rechercher dans la FAQ" className="glass-input search-input-padding" placeholder="Recherche (gas fees, score, wallet...)" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="dashboard-card faq-card-padding">
        {filtered.length === 0 ? (
          <div className="faq-no-results">Aucun résultat pour "{search}"</div>
        ) : filtered.map((f, i) => (
          <div key={i} className={i < filtered.length - 1 ? 'faq-row' : 'faq-row no-border'}>
            <button onClick={() => setOpen(open === i ? null : i)} className="faq-trigger" aria-expanded={open === i}>
              <span className="faq-question">{f.q}</span>
              {open === i ? <ChevronUp size={16} color="var(--tx3)" /> : <ChevronDown size={16} color="var(--tx3)" />}
            </button>
            {open === i && (
              <div className="faq-answer fade-up">{f.a}</div>
            )}
          </div>
        ))}
      </div>

      <div className="dashboard-card">
        <div className="support-title"><MessageSquare size={17} />Tu n'as pas trouvé ta réponse ?</div>
        <p className="support-desc">
          Envoie-nous un message avec le formulaire ci-dessous, ou écris-nous à <span className="support-email">{CONTACT_EMAIL}</span>.
        </p>
        {sent && !feedback && (
          <p className="support-sent ico-inline" role="status"><CheckCircle size={15} />Message bien reçu, merci ! Nous te répondrons par email.</p>
        )}
        {!feedback ? (
          <button className="btn-pri support-btn-toggle" onClick={() => { setFeedback(true); setSent(false) }}><MessageSquare size={15} />Contacter le support</button>
        ) : (
          <div className="support-form">
            <label htmlFor="support-topic" className="sr-only">Sujet</label>
            <select id="support-topic" className="glass-input support-select" value={topic} onChange={e => setTopic(e.target.value)}>
              <option>Question générale</option>
              <option>Signaler un bug</option>
              <option>Suggestion</option>
              <option>Autre</option>
            </select>
            <label htmlFor="support-message" className="sr-only">Message</label>
            <textarea id="support-message" maxLength={2000} className="glass-input support-textarea" rows={4} placeholder="Décris ton problème..." value={msg} onChange={e => setMsg(e.target.value)} />
            <div className="support-form-actions">
              <button className="btn-glass support-btn-action" onClick={() => setFeedback(false)}>Annuler</button>
              <button className="btn-pri support-btn-action" onClick={sendMessage} disabled={sending}>{sending ? 'Envoi…' : 'Envoyer'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
