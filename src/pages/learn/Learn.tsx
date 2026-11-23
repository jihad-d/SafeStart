import React from 'react'
import { Clock } from 'lucide-react'
import '@/styles/pages.css'

const MODULES = [
  { id: 'wallet', title: "C'est quoi un wallet ?", cat: 'Les bases', level: 'Débutant', lvlColor: '#10b981', dur: 4, desc: "Comprends ce qu'est un portefeuille crypto et comment il fonctionne." },
  { id: 'fees',   title: 'Comprendre les frais de réseau', cat: 'Transactions', level: 'Débutant', lvlColor: '#10b981', dur: 5, desc: 'Découvre les gas fees et pourquoi ils varient.' },
  { id: 'chain',  title: 'La blockchain en 5 minutes', cat: 'Les bases', level: 'Novice', lvlColor: '#7c5cfc', dur: 5, desc: 'Comprends le fonctionnement décentralisé.' },
  { id: 'defi',   title: 'Introduction à la DeFi', cat: 'Avancé', level: 'Intermédiaire', lvlColor: '#f59e0b', dur: 8, desc: 'Swaps, liquidité, yield farming expliqués simplement.' },
]

export default function Learn() {
  return (
    <div className="fade-up flex-container">
      <div>
        <h1 className="text-title">Modules d'apprentissage</h1>
        <p className="text-subtitle">Des cours courts en français, adaptés à ton niveau. Ils sont en cours de préparation.</p>
      </div>
      <div className="grid-two-columns">
        {MODULES.map(m => (
          <div key={m.id} className="dashboard-card">
            <div className="learn-header">
              <span 
                className="learn-badge"
                style={{ background: `${m.lvlColor}22`, color: m.lvlColor }}
              >
                {m.level}
              </span>
              <span className="learn-duration ico-inline"><Clock size={12} />{m.dur} min</span>
            </div>
            <div className="learn-body">
              <div className="learn-title">{m.title}</div>
              <div className="learn-desc">{m.desc}</div>
            </div>
            <div className="learn-footer">
              <span className="learn-soon">Bientôt disponible</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
