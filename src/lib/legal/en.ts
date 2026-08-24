import { HOST, PROCESSORS, PUBLISHER, type LegalDoc } from "./types";

const processors = PROCESSORS.map((p) => `${p.name} — ${p.role} — ${p.region}`);

export const mentions: LegalDoc = {
  slug: "mentions",
  title: "Legal notice",
  intro:
    "Information about the publisher and host of voisini.com, as required by French law no. 2004-575 of 21 June 2004 (LCEN).",
  sections: [
    {
      h: "Publisher",
      p: [
        `voisini.com is published by ${PUBLISHER.name}, an individual acting in a non-professional capacity, resident in ${PUBLISHER.country}.`,
        `Contact: ${PUBLISHER.email}`,
        "Under article 6 III-2 of the LCEN, a non-professional publisher may withhold their postal address, which is held on file by the host and available to the authorities.",
      ],
    },
    { h: "Publication director", p: [PUBLISHER.name] },
    { h: "Host", p: [`${HOST.name}, ${HOST.address} — ${HOST.site}`] },
    {
      h: "Nature of the service",
      p: [
        "Voisini connects neighbours who want to sell, give away, lend, rent out or swap objects. Voisini is not a seller, buyer or lessor: the site only introduces people, who then make their own arrangements directly.",
        "The service is currently free. No commission is taken and no payment is processed by the site at this time.",
      ],
    },
    {
      h: "Intellectual property",
      p: [
        "The Voisini name, logo, texts and interface belong to the publisher and may not be reproduced without permission.",
        "Listing photographs and descriptions remain the property of their authors, who grant Voisini a display licence limited to the time the listing is published.",
      ],
    },
    {
      h: "Reporting content",
      p: [
        `Unlawful content can be reported using the "Report" button on each listing, or by email to ${PUBLISHER.email}. Reports are reviewed as quickly as possible.`,
      ],
    },
  ],
};

export const terms: LegalDoc = {
  slug: "terms",
  title: "Terms of use",
  intro: "These terms govern the use of voisini.com. By creating an account you accept them.",
  sections: [
    {
      h: "1. Purpose",
      p: [
        "Voisini connects people living near each other who want to sell, give away, lend, rent out or swap objects.",
        "Voisini is not a party to the agreements made between members. The site does not guarantee the existence, quality or accuracy of the objects offered, nor that an exchange will be completed.",
      ],
    },
    {
      h: "2. Registration",
      p: [
        "Registration is free and open to people aged 18 or over.",
        "You agree to provide accurate information and keep your password confidential. An account is personal; you are responsible for everything that happens on it.",
      ],
    },
    {
      h: "3. Listing content",
      p: [
        "You warrant that you are entitled to offer the objects you publish and that circulating them is lawful.",
        "The following are prohibited: weapons, narcotics, medicines, live animals, counterfeits, stolen goods, sexual content, third parties' personal data, and any regulated item you are not authorised to sell.",
        "Voisini may remove without notice any listing that breaches these rules or the law.",
      ],
    },
    {
      h: "4. Conduct between members",
      p: [
        "Exchanges must remain courteous. Harassment, hateful, discriminatory or threatening language leads to immediate suspension.",
        "Using the messaging system for advertising, or to request payment outside the platform, is prohibited.",
      ],
    },
    {
      h: "5. Meeting and safety",
      p: [
        "Meeting in person is entirely at your own risk. We recommend busy public places, and never sharing your exact address before you are confident.",
        "The site never displays a member's exact address; only an approximate distance is shown.",
      ],
    },
    {
      h: "6. Transactions",
      p: [
        "Price, handover and payment are agreed freely between members. No payment is processed by the site at this time.",
        "For loans and rentals, the agreed return date is binding on the borrower. In case of a dispute, members may report the transaction; Voisini may moderate but does not arbitrate and accepts no financial liability.",
      ],
    },
    {
      h: "7. Ratings",
      p: [
        "A rating may only be left after a transaction confirmed by both parties. Ratings must reflect a real experience; fake reviews lead to account deletion.",
      ],
    },
    {
      h: "8. Suspension and termination",
      p: [
        "You may delete your account at any time from your profile.",
        "Voisini may suspend or delete an account for breach of these terms, dangerous behaviour or fraudulent activity.",
      ],
    },
    {
      h: "9. Liability",
      p: [
        "The service is provided as is; uninterrupted availability cannot be guaranteed.",
        "The publisher is not liable for damage arising from agreements between members, the condition of exchanged objects, or the behaviour of users.",
      ],
    },
    {
      h: "10. Changes to these terms",
      p: [
        "These terms may change. Members are informed of substantial changes by email or on their next sign-in.",
      ],
    },
    {
      h: "11. Governing law",
      p: [
        "These terms are governed by French law. In case of dispute, an amicable solution will be sought first; failing that, the French courts have jurisdiction.",
        "Under article L.612-1 of the French consumer code, you may use a consumer mediator free of charge.",
      ],
    },
  ],
};

export const privacy: LegalDoc = {
  slug: "privacy",
  title: "Privacy policy",
  intro:
    "This policy explains what personal data Voisini collects, why, how long it is kept and how to exercise your rights under the General Data Protection Regulation (GDPR).",
  sections: [
    {
      h: "Data controller",
      p: [
        `${PUBLISHER.name} — ${PUBLISHER.email}`,
        "Write to this address with any question about your data. You will receive a reply within one month at most.",
      ],
    },
    {
      h: "Data collected",
      p: [
        "Account: email address, display name, password (stored hashed, never in plain text), profile photo if you add one.",
        "Location: the town and approximate position you enter yourself. Your exact position is never requested or displayed: coordinates are deliberately offset before storage, and other members only ever see approximate distances.",
        "Listings: the title, description, photos, price, category and condition of what you publish.",
        "Messages: the content of conversations you exchange with other members.",
        "Technical: IP address and sign-in times, kept for security and abuse prevention.",
      ],
    },
    {
      h: "Purposes and legal bases",
      p: [
        "Providing the service (account, listings, messaging, transactions) — performance of our contract.",
        "Security, fraud prevention and content moderation — legitimate interest.",
        "Sending emails about your activity (new message, request accepted, return reminder) — performance of our contract; these can be turned off in your profile.",
        "Meeting legal obligations, in particular the retention of connection data.",
      ],
    },
    {
      h: "Retention",
      p: [
        "Account and listings: while the account is active, then 30 days after deletion.",
        "Messages: while the conversation exists; deleted with the account.",
        "Connection data: 12 months, as required under French law.",
        "Reports and moderation decisions: 3 years, as evidence.",
      ],
    },
    {
      h: "Recipients",
      p: [
        "Your data is never sold, rented or shared for advertising.",
        "It is processed by the following technical providers acting on our instructions:",
        ...processors,
        "Some of these providers are established in the United States; any transfers are covered by the European Commission's standard contractual clauses.",
      ],
    },
    {
      h: "What other members see",
      p: [
        "Your display name, profile photo, listings, average rating and an approximate distance.",
        "Never visible: your email address, postal address, exact position or phone number.",
      ],
    },
    {
      h: "Your rights",
      p: [
        "You have the right to access, rectify, erase, restrict, object to and port your data.",
        `Exercise these from your profile or by email to ${PUBLISHER.email}.`,
        "If you believe your rights are not respected, you may lodge a complaint with the CNIL (cnil.fr), the French data protection authority.",
      ],
    },
    {
      h: "Security",
      p: [
        "All traffic to the site is encrypted (HTTPS). Passwords are hashed. Database-level access rules mean a member can only read records that concern them.",
        "In the event of a breach likely to create a risk to your rights, you will be informed in accordance with article 34 of the GDPR.",
      ],
    },
    {
      h: "Minors",
      p: [
        "The service is for adults only. Accounts identified as belonging to a minor are deleted.",
      ],
    },
  ],
};

export const cookies: LegalDoc = {
  slug: "cookies",
  title: "Cookies",
  intro:
    "Voisini uses no advertising cookies and no personally identifying analytics trackers. No consent banner is therefore required.",
  sections: [
    {
      h: "What is stored on your device",
      p: [
        "Session cookies (vsi-at, vsi-rt): required to keep you signed in. They are inaccessible to page scripts, sent only over HTTPS, and cleared on sign-out or session expiry.",
        "Local storage (vsi-theme): remembers your light or dark display preference. It stays in your browser and is never sent to us.",
      ],
    },
    {
      h: "Why there is no banner",
      p: [
        "European rules only require consent for trackers that are not strictly necessary. The items above are essential to the service you requested and are therefore exempt.",
        "If an analytics tool is added in future, it will be one that uses no cookies and no personal identifiers, or a consent banner will be put in place.",
      ],
    },
    {
      h: "Deletion",
      p: [
        "You can clear these at any time from your browser settings. Signing out removes the session cookies immediately.",
      ],
    },
  ],
};

export const legalEn = { mentions, terms, privacy, cookies };
