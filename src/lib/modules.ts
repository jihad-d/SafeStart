// Contenu des modules d'apprentissage.
// Les points sont crédités côté serveur (fonction SQL complete_module) : garder les mêmes valeurs.

export interface LessonSection {
  title: string
  paragraphs: string[]
  /** Liste à puces facultative */
  points?: string[]
}

export interface QuizQuestion {
  q: string
  options: string[]
  correct: number
  explanation: string
}

export interface LearningModule {
  id: 'wallet' | 'fees' | 'chain' | 'defi'
  title: string
  level: 'Débutant' | 'Novice' | 'Intermédiaire'
  color: string
  minutes: number
  points: number
  description: string
  sections: LessonSection[]
  takeaways: string[]
  quiz: QuizQuestion[]
}

/** Nombre de bonnes réponses requis pour valider un module. */
export const PASS_SCORE = 2

export const MODULES: LearningModule[] = [
  {
    id: 'wallet',
    title: "C'est quoi un wallet ?",
    level: 'Débutant',
    color: '#10b981',
    minutes: 4,
    points: 50,
    description: "Comprends ce qu'est un portefeuille crypto, ce qu'il contient vraiment et comment le protéger.",
    sections: [
      {
        title: 'Un wallet ne contient pas tes cryptos',
        paragraphs: [
          "Tes cryptomonnaies ne sont pas stockées dans ton téléphone ni dans une application : elles sont inscrites sur la blockchain, un registre public partagé.",
          "Ton wallet (portefeuille) garde surtout des clés : ce sont elles qui prouvent que tu as le droit de dépenser ces cryptos.",
        ],
      },
      {
        title: 'Adresse publique et clé privée',
        paragraphs: [
          "L'adresse publique ressemble à un IBAN : tu peux la donner pour recevoir des cryptos, sans danger.",
          'La clé privée ressemble au code secret de ta carte : elle permet de signer les envois. Quiconque la possède peut vider ton wallet.',
        ],
      },
      {
        title: 'La phrase de récupération',
        paragraphs: [
          "Quand tu crées un wallet, il te donne une suite de 12 ou 24 mots. Elle permet de le restaurer sur un autre appareil, et donc de contrôler tous les fonds.",
        ],
        points: [
          "Écris-la sur papier et range-la dans un endroit sûr.",
          'Ne la prends jamais en photo et ne la stocke pas dans le cloud ou dans un email.',
          "Aucun service légitime ne te la demandera jamais : quelqu'un qui la réclame est un escroc.",
        ],
      },
      {
        title: 'Deux grandes familles de wallets',
        paragraphs: [
          "Wallet « custodial » : une plateforme (exchange) garde les clés pour toi. C'est simple, mais tu dépends d'elle.",
          "Wallet « non-custodial » : tu gardes toi-même tes clés. Tu es libre, mais seul responsable de leur sécurité. D'où l'adage « not your keys, not your coins ».",
        ],
      },
    ],
    takeaways: [
      "Les cryptos sont sur la blockchain, le wallet garde les clés.",
      "L'adresse se partage, la clé privée et la phrase de récupération jamais.",
      "Personne de légitime ne demande ta phrase de récupération.",
    ],
    quiz: [
      {
        q: 'Que peux-tu partager sans risque ?',
        options: ['Ta phrase de récupération', 'Ton adresse publique', 'Ta clé privée', 'Une photo de tes 24 mots'],
        correct: 1,
        explanation: "L'adresse publique sert à recevoir des cryptos, comme un IBAN. Le reste donne le contrôle de tes fonds.",
      },
      {
        q: 'Un « support technique » te demande ta phrase de récupération pour débloquer ton compte. Que fais-tu ?',
        options: [
          'Je la donne, il veut m’aider',
          "C'est une arnaque : aucun service légitime ne la demande",
          "J'en donne seulement la moitié",
          "Je l'envoie par email pour garder une trace",
        ],
        correct: 1,
        explanation: "Avec ta phrase de récupération, n'importe qui peut vider ton wallet. Aucun support sérieux ne la demande, jamais.",
      },
      {
        q: 'Où se trouvent réellement tes cryptomonnaies ?',
        options: ['Dans ton téléphone', 'Sur la blockchain ; le wallet garde les clés', 'Sur un compte bancaire', 'Dans le cloud de l’application'],
        correct: 1,
        explanation: 'Les cryptos sont inscrites sur la blockchain. Le wallet contient les clés qui permettent de les utiliser.',
      },
    ],
  },
  {
    id: 'fees',
    title: 'Comprendre les frais de réseau',
    level: 'Débutant',
    color: '#10b981',
    minutes: 5,
    points: 60,
    description: 'Découvre à quoi servent les frais de réseau (gas fees) et pourquoi leur montant varie.',
    sections: [
      {
        title: 'Pourquoi payer des frais ?',
        paragraphs: [
          "Chaque transaction doit être vérifiée puis ajoutée à un bloc par les participants du réseau (mineurs ou validateurs). Les frais les rémunèrent.",
          'La place dans chaque bloc est limitée : quand beaucoup de monde veut passer en même temps, ceux qui paient plus sont traités en priorité.',
        ],
      },
      {
        title: 'Le « gas » sur Ethereum',
        paragraphs: [
          "Sur Ethereum, chaque opération consomme du « gas », une unité de travail. Les frais sont égaux au gas utilisé multiplié par le prix du gas au moment de l'envoi.",
          "Un simple envoi d'ETH consomme peu de gas ; une interaction avec une application DeFi en consomme beaucoup plus.",
        ],
      },
      {
        title: 'Pourquoi le montant varie',
        paragraphs: ['Le prix du gas suit la demande, un peu comme le prix d’une course de taxi aux heures de pointe.'],
        points: [
          'Réseau saturé : frais élevés.',
          'Réseau calme : frais plus bas.',
          'Les réseaux dits « de couche 2 » permettent souvent de payer beaucoup moins.',
        ],
      },
      {
        title: 'Frais de réseau et frais de plateforme',
        paragraphs: [
          "Les frais de réseau vont aux validateurs. Une plateforme d'achat peut ajouter sa propre commission et un écart de prix (spread).",
          'Dans SafeStart, un achat simule 0,5 % de frais de plateforme et un envoi simule des frais de gas.',
        ],
      },
      {
        title: 'Un piège à connaître',
        paragraphs: [
          "Sur Ethereum, une transaction qui échoue consomme quand même du gas : les frais ne sont pas remboursés.",
        ],
      },
    ],
    takeaways: [
      'Les frais rémunèrent ceux qui valident les transactions.',
      'Ils montent quand le réseau est encombré.',
      'Vérifie toujours le coût total (montant + frais) avant de confirmer.',
    ],
    quiz: [
      {
        q: 'À quoi servent les frais de réseau ?',
        options: ["À payer l'État", 'À rémunérer ceux qui valident les transactions', 'À rembourser les erreurs', 'À rien, ils sont optionnels'],
        correct: 1,
        explanation: 'Les mineurs ou validateurs sont payés grâce à ces frais pour inclure les transactions dans les blocs.',
      },
      {
        q: 'Pourquoi les frais de gas augmentent-ils parfois fortement ?',
        options: ['Parce que le réseau est très demandé', 'Parce que la crypto baisse', 'À cause de la météo', 'Parce que ton wallet est vieux'],
        correct: 0,
        explanation: 'Quand beaucoup de transactions veulent passer en même temps, les frais montent : la place dans les blocs est limitée.',
      },
      {
        q: 'Sur Ethereum, que se passe-t-il si ta transaction échoue ?',
        options: [
          'Tout est remboursé automatiquement',
          'Le gas consommé est quand même payé',
          'La transaction est réessayée gratuitement',
          'Les fonds sont bloqués 30 jours',
        ],
        correct: 1,
        explanation: 'Le travail de calcul a été effectué : le gas consommé reste dû, même en cas d’échec.',
      },
    ],
  },
  {
    id: 'chain',
    title: 'La blockchain en 5 minutes',
    level: 'Novice',
    color: '#7c5cfc',
    minutes: 5,
    points: 70,
    description: 'Comprends comment fonctionne ce registre partagé et pourquoi une transaction est irréversible.',
    sections: [
      {
        title: 'Un registre partagé',
        paragraphs: [
          'Une blockchain est une liste de transactions regroupées en blocs. Elle est copiée sur des milliers d’ordinateurs (les « nœuds ») dans le monde.',
          "Personne ne la contrôle seul : pour tricher, il faudrait modifier la majorité des copies en même temps.",
        ],
      },
      {
        title: 'Des blocs chaînés',
        paragraphs: [
          "Chaque bloc contient une empreinte numérique (un « hash ») du bloc précédent. Modifier un ancien bloc change son empreinte et casse toute la chaîne qui suit : la fraude se voit immédiatement.",
        ],
      },
      {
        title: 'Qui ajoute les blocs ?',
        points: [
          'Preuve de travail (Bitcoin) : des mineurs résolvent un calcul coûteux en énergie.',
          'Preuve d’enjeu (Ethereum depuis 2022) : des validateurs immobilisent des ETH en garantie et peuvent les perdre s’ils trichent.',
        ],
        paragraphs: ['Ce mécanisme, appelé consensus, permet au réseau de se mettre d’accord sans autorité centrale.'],
      },
      {
        title: 'Irréversible et transparent',
        paragraphs: [
          "Une transaction confirmée ne peut pas être annulée : il n'y a pas de banque pour faire opposition. C'est pour cela que SafeStart vérifie le format de l'adresse avant un envoi.",
          "Tout le monde peut consulter les transactions avec un explorateur de blocs. Les adresses ne portent pas de nom, mais elles restent traçables.",
        ],
      },
    ],
    takeaways: [
      'Une blockchain est un registre copié partout et très difficile à falsifier.',
      'Une transaction confirmée est définitive.',
      'Les transactions sont publiques : pseudonymes, mais traçables.',
    ],
    quiz: [
      {
        q: "Pourquoi est-il si difficile de modifier une ancienne transaction ?",
        options: [
          'Parce qu’elle est protégée par un mot de passe',
          'Parce que chaque bloc contient l’empreinte du précédent et que le registre est copié partout',
          'Parce que les banques la surveillent',
          'C’est facile, il suffit de contacter le support',
        ],
        correct: 1,
        explanation: 'Modifier un bloc casserait la chaîne d’empreintes et il faudrait réécrire la majorité des copies du registre.',
      },
      {
        q: 'Quel mécanisme Ethereum utilise-t-il aujourd’hui ?',
        options: ['La preuve de travail', 'La preuve d’enjeu', 'Un serveur central', 'Un vote des banques'],
        correct: 1,
        explanation: 'Depuis 2022, Ethereum utilise la preuve d’enjeu : les validateurs immobilisent des ETH en garantie.',
      },
      {
        q: 'Tu as envoyé des cryptos à une mauvaise adresse. En général…',
        options: [
          'Tu peux annuler sous 24 h',
          'La blockchain te rembourse',
          "La transaction est définitive : il est le plus souvent impossible de récupérer les fonds",
          'Ton wallet corrige automatiquement',
        ],
        correct: 2,
        explanation: 'Une transaction confirmée est irréversible. Vérifier l’adresse avant d’envoyer est essentiel.',
      },
    ],
  },
  {
    id: 'defi',
    title: 'Introduction à la DeFi',
    level: 'Intermédiaire',
    color: '#f59e0b',
    minutes: 8,
    points: 100,
    description: 'Swaps, pools de liquidité, slippage et risques : les bases de la finance décentralisée.',
    sections: [
      {
        title: 'La finance sans intermédiaire',
        paragraphs: [
          'La DeFi (finance décentralisée) regroupe des services financiers, comme échanger ou prêter des cryptos, qui fonctionnent sans banque ni plateforme centrale.',
          'Ils reposent sur des « smart contracts » : des programmes enregistrés sur la blockchain qui s’exécutent automatiquement selon des règles fixées à l’avance.',
        ],
      },
      {
        title: 'Échanger sur un DEX',
        paragraphs: [
          "Sur un exchange décentralisé (DEX), tu n'échanges pas avec une autre personne mais avec une réserve commune de deux cryptos : une pool de liquidité.",
          'Le prix dépend de la proportion de chaque crypto dans la pool. Ton échange modifie cette proportion, donc le prix.',
        ],
      },
      {
        title: 'Le slippage',
        paragraphs: [
          "Le slippage est l'écart entre le prix affiché et le prix réellement obtenu. Il augmente quand ton montant est grand par rapport à la taille de la pool, ou quand le marché bouge vite.",
          "Les DEX proposent une « tolérance de slippage » : au-delà, la transaction est annulée. Dans SafeStart, un slippage élevé fait baisser ton score de sécurité.",
        ],
      },
      {
        title: 'Les risques à connaître',
        points: [
          'Bug ou piratage d’un smart contract : les fonds peuvent être perdus.',
          'Arnaques (« rug pull ») : les créateurs d’un projet partent avec la liquidité.',
          'Autorisations illimitées : un contrat malveillant peut dépenser tes tokens si tu l’as autorisé.',
          'Rendements promis très élevés : signal d’alerte, pas une opportunité.',
        ],
        paragraphs: ['La DeFi est puissante, mais sans service client ni garantie : tu es seul responsable.'],
      },
    ],
    takeaways: [
      'Les smart contracts remplacent les intermédiaires.',
      'Le slippage grandit avec la taille de l’échange par rapport à la liquidité.',
      'Un rendement « trop beau » cache presque toujours un risque important.',
    ],
    quiz: [
      {
        q: "Qu'est-ce qu'un smart contract ?",
        options: [
          'Un contrat papier signé chez un notaire',
          'Un programme sur la blockchain qui s’exécute automatiquement',
          'Une offre d’abonnement',
          'Une application de messagerie',
        ],
        correct: 1,
        explanation: 'Un smart contract est un programme enregistré sur la blockchain qui applique ses règles sans intermédiaire.',
      },
      {
        q: 'Quand le slippage est-il le plus élevé ?',
        options: [
          'Quand le montant échangé est grand par rapport à la liquidité de la pool',
          'Quand tu échanges un petit montant',
          'Le week-end uniquement',
          'Il est toujours nul',
        ],
        correct: 0,
        explanation: 'Un gros échange déséquilibre davantage la pool, ce qui dégrade le prix obtenu.',
      },
      {
        q: 'Un projet promet 1 000 % de rendement par an. Que faut-il en penser ?',
        options: [
          "C'est une excellente affaire",
          "C'est garanti par la blockchain",
          "C'est un signal d'alerte : risque très élevé, voire arnaque",
          "C'est normal en DeFi",
        ],
        correct: 2,
        explanation: 'Des rendements extrêmes cachent souvent un risque majeur ou une arnaque. Prudence.',
      },
    ],
  },
]

export const findModule = (id?: string) => MODULES.find(m => m.id === id)
