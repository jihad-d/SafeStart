import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import './Legal.css'

// ⚠️ Base rédigée pour un projet pédagogique : à compléter et faire relire
// avant une mise en ligne publique. Les champs <Todo> sont à remplir.

const LAST_UPDATE = '24 novembre 2026'

/** Champ à compléter par l'éditeur du site (visible tant qu'il n'est pas rempli). */
const Todo = ({ children }: { children: React.ReactNode }) => (
  <mark className="legal-todo">[À compléter : {children}]</mark>
)

function LegalLayout({ title, children }: { title: string; children: React.ReactNode }) {
  const navigate = useNavigate()
  return (
    <div className="legal-page">
      <div className="legal-container">
        <button className="btn-glass legal-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={15} />Retour
        </button>
        <article className="glass-card legal-card">
          <h1 className="legal-title">{title}</h1>
          <p className="legal-updated">Dernière mise à jour : {LAST_UPDATE}</p>
          {children}
        </article>
        <LegalLinks />
      </div>
    </div>
  )
}

/** Liens vers les trois pages légales, réutilisés en pied de page. */
export function LegalLinks({ className = '' }: { className?: string }) {
  return (
    <nav className={`legal-links ${className}`} aria-label="Informations légales">
      <Link to="/mentions-legales">Mentions légales</Link>
      <Link to="/cgu">CGU</Link>
      <Link to="/confidentialite">Confidentialité</Link>
    </nav>
  )
}

// ─── MENTIONS LÉGALES ─────────────────────────────────────────
export function MentionsLegales() {
  return (
    <LegalLayout title="Mentions légales">
      <h2>Éditeur du site</h2>
      <p>
        SafeStart est édité par <Todo>nom et prénom, ou raison sociale</Todo>,{' '}
        <Todo>statut : particulier, auto-entrepreneur, association…</Todo>.<br />
        Adresse : <Todo>adresse postale</Todo><br />
        Contact : <Todo>adresse email de contact</Todo><br />
        <Todo>numéro SIREN/SIRET, si applicable</Todo>
      </p>
      <p>Directeur de la publication : <Todo>nom et prénom</Todo>.</p>

      <h2>Hébergement</h2>
      <p>
        Site hébergé par <strong>Vercel Inc.</strong>, 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis — vercel.com.
      </p>
      <p>
        Base de données et authentification fournies par <strong>Supabase, Inc.</strong> — supabase.com.
        Région d'hébergement des données : <Todo>région de ton projet Supabase, ex. Europe (Francfort)</Todo>.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        Les contenus de SafeStart (textes, interface, logo) sont la propriété de l'éditeur, sauf mention contraire.
        Les noms et symboles des cryptomonnaies appartiennent à leurs détenteurs respectifs.
      </p>

      <h2>Nature du service</h2>
      <p>
        SafeStart est un <strong>simulateur pédagogique</strong>. Aucune transaction réelle n'est effectuée,
        aucun argent réel n'est manipulé et rien sur ce site ne constitue un conseil en investissement.
      </p>
    </LegalLayout>
  )
}

// ─── CGU ──────────────────────────────────────────────────────
export function Cgu() {
  return (
    <LegalLayout title="Conditions générales d'utilisation">
      <h2>1. Objet</h2>
      <p>
        Les présentes conditions encadrent l'utilisation de SafeStart, une plateforme pédagogique qui permet
        d'apprendre le fonctionnement des cryptomonnaies à l'aide d'un solde <strong>entièrement fictif</strong>.
      </p>

      <h2>2. Aucun argent réel, aucun conseil financier</h2>
      <p>
        Toutes les opérations (achats, envois, échanges) sont simulées. Le solde, les cryptos détenues et les gains
        ou pertes affichés n'ont aucune valeur réelle et ne peuvent être ni retirés ni convertis.
        Les prix affichés proviennent de sources publiques et sont donnés à titre indicatif, sans garantie d'exactitude.
        Les contenus de SafeStart sont éducatifs et ne constituent en aucun cas un conseil en investissement.
      </p>

      <h2>3. Compte utilisateur</h2>
      <p>
        La création d'un compte nécessite une adresse email valide et un mot de passe. Tu es responsable de la
        confidentialité de tes identifiants. Tu peux supprimer ton compte à tout moment depuis la page Paramètres.
      </p>

      <h2>4. Bon usage</h2>
      <p>
        Tu t'engages à ne pas perturber le fonctionnement du service, à ne pas tenter d'accéder aux données
        d'autres utilisateurs et à ne pas utiliser SafeStart à des fins illégales.
        L'éditeur peut suspendre un compte en cas de manquement à ces règles.
      </p>

      <h2>5. Disponibilité et responsabilité</h2>
      <p>
        SafeStart est fourni « en l'état », en version bêta. L'éditeur s'efforce d'assurer son bon fonctionnement
        mais ne garantit pas une disponibilité continue. Il ne peut être tenu responsable des décisions
        d'investissement réelles prises par un utilisateur.
      </p>

      <h2>6. Données personnelles</h2>
      <p>
        Le traitement de tes données est décrit dans la <Link to="/confidentialite">politique de confidentialité</Link>.
      </p>

      <h2>7. Modification des conditions</h2>
      <p>
        Ces conditions peuvent évoluer. En cas de changement important, tu en seras informé lors de ta prochaine connexion.
      </p>

      <h2>8. Droit applicable</h2>
      <p>Les présentes conditions sont soumises au droit français.</p>
    </LegalLayout>
  )
}

// ─── CONFIDENTIALITÉ ──────────────────────────────────────────
export function Confidentialite() {
  return (
    <LegalLayout title="Politique de confidentialité">
      <h2>Responsable du traitement</h2>
      <p>
        <Todo>nom de l'éditeur</Todo>, joignable à <Todo>adresse email de contact</Todo>.
      </p>

      <h2>Données collectées</h2>
      <ul>
        <li><strong>Compte :</strong> adresse email et mot de passe (stocké chiffré par Supabase, jamais lisible par l'éditeur).</li>
        <li><strong>Profil :</strong> pseudo (facultatif), niveau, score d'évaluation, points et badges.</li>
        <li><strong>Simulation :</strong> solde fictif, cryptos simulées et historique des transactions simulées (y compris les adresses de wallet que tu saisis).</li>
      </ul>
      <p>Aucune donnée bancaire n'est demandée. Aucune donnée n'est vendue ni utilisée à des fins publicitaires.</p>

      <h2>Finalités et base légale</h2>
      <p>
        Ces données servent uniquement à faire fonctionner ton compte et la simulation (base légale : exécution
        du service auquel tu t'inscris en acceptant les CGU).
      </p>

      <h2>Durée de conservation</h2>
      <p>
        Tes données sont conservées tant que ton compte existe. Lorsque tu supprimes ton compte, elles sont
        effacées immédiatement et définitivement.
      </p>

      <h2>Sous-traitants et transferts</h2>
      <ul>
        <li><strong>Supabase</strong> — base de données et authentification.</li>
        <li><strong>Vercel</strong> — hébergement du site (États-Unis, encadré par les clauses contractuelles types de la Commission européenne).</li>
        <li><strong>CoinGecko</strong> — fournit les cours des cryptomonnaies ; aucune donnée personnelle ne lui est transmise par SafeStart.</li>
      </ul>

      <h2>Cookies et stockage local</h2>
      <p>
        SafeStart n'utilise ni cookie publicitaire ni outil de mesure d'audience. Seul le stockage local du
        navigateur est utilisé, pour garder ta session ouverte et mémoriser ton thème (clair ou sombre).
        Ces éléments sont strictement nécessaires et ne requièrent pas de consentement.
      </p>

      <h2>Tes droits</h2>
      <p>
        Tu disposes d'un droit d'accès, de rectification, d'effacement, de portabilité, de limitation et
        d'opposition sur tes données. Directement depuis <strong>Paramètres</strong>, tu peux :
      </p>
      <ul>
        <li>modifier ton pseudo ;</li>
        <li>télécharger toutes tes données (fichier JSON) ;</li>
        <li>supprimer définitivement ton compte.</li>
      </ul>
      <p>
        Pour toute autre demande : <Todo>adresse email de contact</Todo>. Si tu estimes que tes droits ne sont pas
        respectés, tu peux adresser une réclamation à la CNIL (cnil.fr).
      </p>
    </LegalLayout>
  )
}
