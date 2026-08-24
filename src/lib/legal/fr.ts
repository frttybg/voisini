import { HOST, PROCESSORS, PUBLISHER, type LegalDoc } from "./types";

const processors = PROCESSORS.map((p) => `${p.name} — ${p.role} — ${p.region}`);

export const mentions: LegalDoc = {
  slug: "mentions",
  title: "Mentions légales",
  intro:
    "Informations relatives à l'éditeur et à l'hébergeur du site voisini.com, conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN).",
  sections: [
    {
      h: "Éditeur du site",
      p: [
        `Le site voisini.com est édité par ${PUBLISHER.name}, personne physique agissant à titre non professionnel, résidant en ${PUBLISHER.country}.`,
        `Contact : ${PUBLISHER.email}`,
        "Conformément à l'article 6 III-2 de la LCEN, l'éditeur non professionnel qui souhaite préserver son anonymat peut ne pas publier son adresse postale, celle-ci étant tenue à la disposition des autorités auprès de l'hébergeur.",
      ],
    },
    {
      h: "Directeur de la publication",
      p: [PUBLISHER.name],
    },
    {
      h: "Hébergeur",
      p: [`${HOST.name}, ${HOST.address} — ${HOST.site}`],
    },
    {
      h: "Nature du service",
      p: [
        "Voisini est une plateforme de mise en relation entre voisins permettant de vendre, donner, prêter, louer ou échanger des objets. Voisini n'est ni vendeur, ni acheteur, ni loueur : le site ne fait que mettre en relation des personnes qui concluent leurs accords directement entre elles.",
        "Le service est actuellement fourni à titre gratuit. Aucune commission n'est prélevée et aucun paiement n'est traité par le site à ce jour.",
      ],
    },
    {
      h: "Propriété intellectuelle",
      p: [
        "Le nom Voisini, le logo, les textes et l'interface du site sont la propriété de l'éditeur. Toute reproduction sans autorisation est interdite.",
        "Les photographies et descriptions des annonces restent la propriété de leurs auteurs, qui accordent à Voisini une licence d'affichage limitée à la durée de publication de l'annonce.",
      ],
    },
    {
      h: "Signalement de contenu",
      p: [
        `Tout contenu illicite peut être signalé depuis le bouton « Signaler » présent sur chaque annonce, ou par e-mail à ${PUBLISHER.email}. Les signalements sont examinés dans les meilleurs délais.`,
      ],
    },
  ],
};

export const terms: LegalDoc = {
  slug: "terms",
  title: "Conditions générales d'utilisation",
  intro:
    "Ces conditions régissent l'utilisation du site voisini.com. En créant un compte, vous les acceptez.",
  sections: [
    {
      h: "1. Objet",
      p: [
        "Voisini met en relation des personnes proches géographiquement souhaitant vendre, donner, prêter, louer ou échanger des objets.",
        "Voisini n'est pas partie aux accords conclus entre membres. Le site ne garantit ni l'existence, ni la qualité, ni la conformité des objets proposés, ni la bonne exécution des échanges.",
      ],
    },
    {
      h: "2. Inscription",
      p: [
        "L'inscription est gratuite et réservée aux personnes âgées d'au moins 18 ans.",
        "Vous vous engagez à fournir des informations exactes et à garder votre mot de passe confidentiel. Un compte est personnel ; vous êtes responsable de tout ce qui s'y produit.",
      ],
    },
    {
      h: "3. Contenu des annonces",
      p: [
        "Vous garantissez être en droit de proposer les objets que vous publiez et que leur mise en circulation est licite.",
        "Sont notamment interdits : les armes, les produits stupéfiants, les médicaments, les animaux vivants, les contrefaçons, les produits volés, les contenus à caractère sexuel, les données personnelles de tiers, ainsi que tout objet dont la vente est réglementée sans que vous disposiez des autorisations requises.",
        "Voisini peut retirer sans préavis toute annonce contraire à ces règles ou à la loi.",
      ],
    },
    {
      h: "4. Comportement entre membres",
      p: [
        "Les échanges doivent rester courtois. Le harcèlement, les propos haineux, discriminatoires ou menaçants entraînent la suspension immédiate du compte.",
        "Il est interdit d'utiliser la messagerie à des fins publicitaires ou pour solliciter des paiements en dehors de la plateforme.",
      ],
    },
    {
      h: "5. Rencontres et sécurité",
      p: [
        "Les rencontres physiques se font sous votre seule responsabilité. Nous recommandons les lieux publics et fréquentés, et de ne jamais communiquer votre adresse exacte avant d'être en confiance.",
        "Le site n'affiche jamais l'adresse exacte d'un membre : seule une distance approximative est indiquée.",
      ],
    },
    {
      h: "6. Transactions",
      p: [
        "Le prix, le mode de remise et le règlement sont convenus librement entre les membres. À ce jour, aucun paiement n'est traité par le site.",
        "Pour les prêts et locations, la date de restitution convenue engage l'emprunteur. En cas de litige, les membres peuvent signaler la transaction ; Voisini peut modérer mais n'arbitre pas les différends et n'assume aucune responsabilité financière.",
      ],
    },
    {
      h: "7. Évaluations",
      p: [
        "Une évaluation ne peut être laissée qu'après une transaction confirmée par les deux parties. Les évaluations doivent refléter une expérience réelle ; les faux avis entraînent la suppression du compte.",
      ],
    },
    {
      h: "8. Suspension et résiliation",
      p: [
        "Vous pouvez supprimer votre compte à tout moment depuis votre profil.",
        "Voisini peut suspendre ou supprimer un compte en cas de manquement à ces conditions, de comportement dangereux ou d'activité frauduleuse.",
      ],
    },
    {
      h: "9. Responsabilité",
      p: [
        "Voisini fournit le service « en l'état » et s'efforce d'en assurer la disponibilité, sans pouvoir la garantir de manière ininterrompue.",
        "La responsabilité de l'éditeur ne saurait être engagée pour les dommages résultant des accords conclus entre membres, de l'état des objets échangés ou du comportement des utilisateurs.",
      ],
    },
    {
      h: "10. Modification des conditions",
      p: [
        "Ces conditions peuvent évoluer. En cas de modification substantielle, les membres sont informés par e-mail ou lors de leur prochaine connexion.",
      ],
    },
    {
      h: "11. Droit applicable",
      p: [
        "Ces conditions sont soumises au droit français. En cas de litige, une solution amiable sera recherchée en priorité. À défaut, les tribunaux français sont compétents.",
        "Conformément à l'article L.612-1 du code de la consommation, vous pouvez recourir gratuitement à un médiateur de la consommation.",
      ],
    },
  ],
};

export const privacy: LegalDoc = {
  slug: "privacy",
  title: "Politique de confidentialité",
  intro:
    "Cette politique explique quelles données personnelles Voisini collecte, pourquoi, combien de temps elles sont conservées et comment exercer vos droits, conformément au Règlement général sur la protection des données (RGPD).",
  sections: [
    {
      h: "Responsable du traitement",
      p: [
        `${PUBLISHER.name} — ${PUBLISHER.email}`,
        "Pour toute question relative à vos données, écrivez à cette adresse. Une réponse vous sera apportée dans un délai maximal d'un mois.",
      ],
    },
    {
      h: "Données collectées",
      p: [
        "Compte : adresse e-mail, nom affiché, mot de passe (stocké sous forme chiffrée, jamais en clair), photo de profil si vous en ajoutez une.",
        "Localisation : la ville et une position approximative que vous saisissez vous-même. Votre position exacte n'est jamais demandée ni affichée : les coordonnées sont volontairement décalées avant enregistrement, et seules des distances approximatives sont montrées aux autres membres.",
        "Annonces : titre, description, photos, prix, catégorie et état des objets que vous publiez.",
        "Messages : le contenu des conversations que vous échangez avec d'autres membres.",
        "Technique : adresse IP et date des connexions, conservées pour la sécurité et la lutte contre les abus.",
      ],
    },
    {
      h: "Finalités et bases légales",
      p: [
        "Fournir le service (compte, annonces, messagerie, transactions) — exécution du contrat qui nous lie.",
        "Assurer la sécurité, prévenir la fraude et modérer les contenus — intérêt légitime.",
        "Vous envoyer les e-mails liés à votre activité (nouveau message, demande acceptée, rappel de restitution) — exécution du contrat ; ces envois peuvent être désactivés dans votre profil.",
        "Respecter nos obligations légales, notamment la conservation des données de connexion.",
      ],
    },
    {
      h: "Durées de conservation",
      p: [
        "Compte et annonces : tant que le compte est actif, puis 30 jours après sa suppression.",
        "Messages : conservés tant que la conversation existe ; supprimés avec le compte.",
        "Données de connexion : 12 mois, conformément à la réglementation française.",
        "Signalements et décisions de modération : 3 ans, à des fins de preuve.",
      ],
    },
    {
      h: "Destinataires",
      p: [
        "Vos données ne sont ni vendues, ni louées, ni transmises à des fins publicitaires.",
        "Elles sont traitées par les prestataires techniques suivants, agissant sur nos instructions :",
        ...processors,
        "Certains de ces prestataires sont établis aux États-Unis ; les transferts éventuels sont encadrés par les clauses contractuelles types de la Commission européenne.",
      ],
    },
    {
      h: "Ce que voient les autres membres",
      p: [
        "Votre nom affiché, votre photo de profil, vos annonces, votre note moyenne et une distance approximative.",
        "Ne sont jamais visibles : votre adresse e-mail, votre adresse postale, votre position exacte, votre numéro de téléphone.",
      ],
    },
    {
      h: "Vos droits",
      p: [
        "Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité de vos données.",
        `Ces droits s'exercent depuis votre profil ou par e-mail à ${PUBLISHER.email}.`,
        "Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir la CNIL (cnil.fr), autorité française de protection des données.",
      ],
    },
    {
      h: "Sécurité",
      p: [
        "Les échanges avec le site sont chiffrés (HTTPS). Les mots de passe sont hachés. L'accès aux données est restreint par des règles de sécurité au niveau de la base, de sorte qu'un membre ne peut lire que ce qui le concerne.",
        "En cas de violation de données susceptible d'engendrer un risque pour vos droits, vous serez informé conformément à l'article 34 du RGPD.",
      ],
    },
    {
      h: "Mineurs",
      p: [
        "Le service est réservé aux personnes majeures. Aucun compte n'est sciemment créé pour un mineur ; tout compte identifié comme tel est supprimé.",
      ],
    },
  ],
};

export const cookies: LegalDoc = {
  slug: "cookies",
  title: "Cookies",
  intro:
    "Voisini n'utilise aucun cookie publicitaire ni traceur de mesure d'audience nominatif. Aucune bannière de consentement n'est donc nécessaire.",
  sections: [
    {
      h: "Ce qui est déposé sur votre appareil",
      p: [
        "Cookies de session (vsi-at, vsi-rt) : indispensables pour vous garder connecté. Ils sont inaccessibles au code de la page, transmis uniquement en HTTPS, et expirent à la déconnexion ou après expiration de la session.",
        "Stockage local (vsi-theme) : mémorise votre préférence d'affichage clair ou sombre. Cette information reste dans votre navigateur et ne nous est jamais transmise.",
      ],
    },
    {
      h: "Pourquoi il n'y a pas de bandeau",
      p: [
        "La réglementation européenne n'exige le consentement que pour les traceurs non strictement nécessaires. Les éléments ci-dessus sont indispensables au fonctionnement du service demandé et en sont donc dispensés.",
        "Si un outil de mesure d'audience était ajouté à l'avenir, il serait choisi sans cookie et sans identifiant personnel, ou un bandeau de consentement serait mis en place.",
      ],
    },
    {
      h: "Suppression",
      p: [
        "Vous pouvez effacer ces éléments à tout moment depuis les réglages de votre navigateur. La déconnexion supprime immédiatement les cookies de session.",
      ],
    },
  ],
};

export const legalFr = { mentions, terms, privacy, cookies };
