export type Language = "en" | "it" | "fr" | "sw";

export const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "sw", label: "Kiswahili", flag: "🇰🇪" },
];


type Dict = Record<string, string>;

const en: Dict = {
  "nav.language": "Language",

  "home.title": "Tuendelee Foundation Fundometer",
  "home.heading": "Empowering Bright Minds Through Education",
  "home.subheading":
    "Support deserving students with scholarships. Every contribution transforms lives and builds a brighter future for Kenya.",
  "home.ctaCardTitle": "Ready to Make a Difference?",
  "home.ctaButton": "Sign Up to Pledge & Track Progress",
  "home.finalCtaText": "It takes just moments to make a lasting impact",
  "home.finalCtaButton": "Start Making a Difference",
  "home.finalCtaNote":
    "Together, we empower deserving students to achieve their educational dreams",

  "impact.sectionTitle": "Impact Stories",
  "impact.sectionSubtitle":
    "See and hear the difference your support makes in the lives of our students.",
  "impact.listen": "Listen to this story",
  "impact.loading": "Loading impact stories...",

  "security.title": "Your Security is Our Priority",
  "security.subtitle":
    "We understand the importance of protecting your personal and financial information. Your trust matters to us.",
  "security.encryptionTitle": "Encrypted Data Transfer",
  "security.encryptionBody":
    "Your personal information is protected using SSL/TLS encryption during transmission, the same technology used by secure websites worldwide",
  "security.paymentTitle": "Secure Payment Processing",
  "security.paymentBody":
    "We never store your credit card details. All payments are processed through trusted providers like M-Pesa, PayPal, and secure bank transfers",
  "security.storageTitle": "Protected Data Storage",
  "security.storageBody":
    "Your information is stored in secure, encrypted databases with restricted access and regular security audits",
  "security.privacyTitle": "Privacy Guaranteed",
  "security.privacyBody":
    "We will never share, sell, or distribute your personal information to third parties. Your data is used solely for event participation and donation processing",
  "security.trustedTitle": "Verified & Trusted",
  "security.trustedBody":
    "Our platform is built with security best practices and regularly audited to ensure the highest standards of data protection and reliability",
  "security.trackingTitle": "Transparent Tracking",
  "security.trackingBody":
    "See real-time updates of contributions with full transparency. Track how your donation helps us reach our scholarship goals",

  "how.title": "How It Works",
  "how.step1Title": "Join Instantly",
  "how.step1Body":
    "Click the sign up button and you're in. Simple as that. No complicated forms or long sign-ups.",
  "how.step2Title": "Make Your Contribution",
  "how.step2Body":
    "Choose to pay now for immediate impact or pledge to pay later. Pick your preferred payment method - it's flexible and secure.",

  "help.button": "Need Help? Click Here!",

  "pledge.name": "Your Name",
  "pledge.email": "Email Address",
  "pledge.amount": "Amount",
  "pledge.currency": "Input Currency",
  "pledge.paymentMethod": "Payment Method",
  "pledge.duration": "Payment Duration (For Pledges)",
  "pledge.message": "Message (Optional)",
  "pledge.messagePlaceholder": "Your message of support...",
};

const it: Dict = {
  "nav.language": "Lingua",

  "home.title": "Fundometer della Fondazione Tuendelee",
  "home.heading": "Valorizzare le Menti Brillanti Attraverso l'Istruzione",
  "home.subheading":
    "Sostieni studenti meritevoli con borse di studio. Ogni contributo trasforma vite e costruisce un futuro migliore per il Kenya.",
  "home.ctaCardTitle": "Pronto a Fare la Differenza?",
  "home.ctaButton": "Registrati per Donare e Seguire i Progressi",
  "home.finalCtaText": "Bastano pochi istanti per lasciare un impatto duraturo",
  "home.finalCtaButton": "Inizia a Fare la Differenza",
  "home.finalCtaNote":
    "Insieme aiutiamo studenti meritevoli a realizzare i loro sogni di studio",

  "impact.sectionTitle": "Storie di Impatto",
  "impact.sectionSubtitle":
    "Guarda e ascolta la differenza che il tuo sostegno fa nella vita dei nostri studenti.",
  "impact.listen": "Ascolta questa storia",
  "impact.loading": "Caricamento delle storie di impatto...",

  "security.title": "La Tua Sicurezza è la Nostra Priorità",
  "security.subtitle":
    "Comprendiamo l'importanza di proteggere le tue informazioni personali e finanziarie. La tua fiducia conta per noi.",
  "security.encryptionTitle": "Trasferimento Dati Criptato",
  "security.encryptionBody":
    "Le tue informazioni personali sono protette con crittografia SSL/TLS durante la trasmissione, la stessa tecnologia usata dai siti sicuri di tutto il mondo",
  "security.paymentTitle": "Pagamenti Sicuri",
  "security.paymentBody":
    "Non memorizziamo mai i dati della tua carta di credito. Tutti i pagamenti sono elaborati da fornitori affidabili come M-Pesa, PayPal e bonifici bancari sicuri",
  "security.storageTitle": "Archiviazione Protetta dei Dati",
  "security.storageBody":
    "Le tue informazioni sono conservate in database sicuri e criptati, con accesso limitato e controlli di sicurezza regolari",
  "security.privacyTitle": "Privacy Garantita",
  "security.privacyBody":
    "Non condivideremo, venderemo o distribuiremo mai i tuoi dati personali a terzi. I tuoi dati sono usati solo per la partecipazione all'evento e per le donazioni",
  "security.trustedTitle": "Verificato e Affidabile",
  "security.trustedBody":
    "La nostra piattaforma è costruita secondo le migliori pratiche di sicurezza e verificata regolarmente per garantire i massimi standard di protezione dei dati e affidabilità",
  "security.trackingTitle": "Monitoraggio Trasparente",
  "security.trackingBody":
    "Vedi gli aggiornamenti dei contributi in tempo reale con totale trasparenza. Segui come la tua donazione ci avvicina agli obiettivi",

  "how.title": "Come Funziona",
  "how.step1Title": "Partecipa Subito",
  "how.step1Body":
    "Clicca il pulsante di registrazione e sei dentro. Semplice così: nessun modulo complicato o registrazione lunga.",
  "how.step2Title": "Fai il Tuo Contributo",
  "how.step2Body":
    "Scegli di pagare subito per un impatto immediato o prometti di pagare più tardi. Scegli il metodo di pagamento che preferisci: è flessibile e sicuro.",

  "help.button": "Hai bisogno di aiuto? Clicca qui!",

  "pledge.name": "Il Tuo Nome",
  "pledge.email": "Indirizzo Email",
  "pledge.amount": "Importo",
  "pledge.currency": "Valuta",
  "pledge.paymentMethod": "Metodo di Pagamento",
  "pledge.duration": "Durata del Pagamento (Per le Promesse)",
  "pledge.message": "Messaggio (Facoltativo)",
  "pledge.messagePlaceholder": "Il tuo messaggio di sostegno...",
};

const fr: Dict = {
  "nav.language": "Langue",

  "home.title": "Fundometer de la Fondation Tuendelee",
  "home.heading": "Valoriser les Esprits Brillants par l'Éducation",
  "home.subheading":
    "Soutenez des étudiants méritants grâce aux bourses. Chaque contribution transforme des vies et construit un avenir meilleur pour le Kenya.",
  "home.ctaCardTitle": "Prêt à Faire la Différence ?",
  "home.ctaButton": "Inscrivez-vous pour Donner et Suivre les Progrès",
  "home.finalCtaText": "Il suffit d'un instant pour avoir un impact durable",
  "home.finalCtaButton": "Commencez à Faire la Différence",
  "home.finalCtaNote":
    "Ensemble, nous aidons des étudiants méritants à réaliser leurs rêves scolaires",

  "impact.sectionTitle": "Histoires d'Impact",
  "impact.sectionSubtitle":
    "Voyez et écoutez la différence que votre soutien apporte à la vie de nos étudiants.",
  "impact.listen": "Écoutez cette histoire",
  "impact.loading": "Chargement des histoires d'impact...",

  "security.title": "Votre Sécurité est Notre Priorité",
  "security.subtitle":
    "Nous comprenons l'importance de protéger vos informations personnelles et financières. Votre confiance compte pour nous.",
  "security.encryptionTitle": "Transfert de Données Chiffré",
  "security.encryptionBody":
    "Vos informations personnelles sont protégées par un chiffrement SSL/TLS lors de la transmission, la même technologie que les sites sécurisés du monde entier",
  "security.paymentTitle": "Paiements Sécurisés",
  "security.paymentBody":
    "Nous ne conservons jamais vos données bancaires. Tous les paiements passent par des prestataires fiables comme M-Pesa, PayPal et les virements bancaires sécurisés",
  "security.storageTitle": "Stockage Protégé des Données",
  "security.storageBody":
    "Vos informations sont stockées dans des bases de données sécurisées et chiffrées, avec un accès restreint et des audits réguliers",
  "security.privacyTitle": "Confidentialité Garantie",
  "security.privacyBody":
    "Nous ne partagerons, vendrons ni ne distribuerons jamais vos données personnelles à des tiers. Elles servent uniquement à la participation à l'événement et au traitement des dons",
  "security.trustedTitle": "Vérifié et Fiable",
  "security.trustedBody":
    "Notre plateforme applique les meilleures pratiques de sécurité et est auditée régulièrement pour garantir les plus hauts standards de protection des données",
  "security.trackingTitle": "Suivi Transparent",
  "security.trackingBody":
    "Consultez les contributions en temps réel en toute transparence. Suivez comment votre don nous rapproche de nos objectifs",

  "how.title": "Comment Ça Marche",
  "how.step1Title": "Rejoignez Instantanément",
  "how.step1Body":
    "Cliquez sur le bouton d'inscription et c'est fait. Aussi simple que ça : pas de formulaires compliqués.",
  "how.step2Title": "Faites Votre Contribution",
  "how.step2Body":
    "Choisissez de payer maintenant pour un impact immédiat ou promettez de payer plus tard. Choisissez votre méthode de paiement : c'est flexible et sécurisé.",

  "help.button": "Besoin d'aide ? Cliquez ici !",

  "pledge.name": "Votre Nom",
  "pledge.email": "Adresse Email",
  "pledge.amount": "Montant",
  "pledge.currency": "Devise",
  "pledge.paymentMethod": "Méthode de Paiement",
  "pledge.duration": "Durée de Paiement (Pour les Promesses)",
  "pledge.message": "Message (Facultatif)",
  "pledge.messagePlaceholder": "Votre message de soutien...",
};

const sw: Dict = {
  "nav.language": "Lugha",

  "home.title": "Fundometer ya Taasisi ya Tuendelee",
  "home.heading": "Kuwezesha Akili Bora Kupitia Elimu",
  "home.subheading":
    "Saidia wanafunzi wanaostahili kwa masomo ya bure. Kila mchango hubadilisha maisha na kujenga mustakabali bora kwa Kenya.",
  "home.ctaCardTitle": "Uko Tayari Kuleta Mabadiliko?",
  "home.ctaButton": "Jisajili Kuweka Ahadi na Kufuatilia Maendeleo",
  "home.finalCtaText": "Inachukua muda mfupi tu kuleta athari ya kudumu",
  "home.finalCtaButton": "Anza Kuleta Mabadiliko",
  "home.finalCtaNote":
    "Kwa pamoja, tunawezesha wanafunzi wanaostahili kufikia ndoto zao za elimu",

  "impact.sectionTitle": "Hadithi za Athari",
  "impact.sectionSubtitle":
    "Ona na sikia mabadiliko ambayo msaada wako unaleta katika maisha ya wanafunzi wetu.",
  "impact.listen": "Sikiliza hadithi hii",
  "impact.loading": "Inapakia hadithi za athari...",

  "security.title": "Usalama Wako ni Kipaumbele Chetu",
  "security.subtitle":
    "Tunaelewa umuhimu wa kulinda taarifa zako za kibinafsi na za kifedha. Imani yako ni muhimu kwetu.",
  "security.encryptionTitle": "Uhamishaji wa Data Uliosimbwa",
  "security.encryptionBody":
    "Taarifa zako za kibinafsi zinalindwa kwa usimbaji wa SSL/TLS wakati wa kutumwa, teknolojia ile ile inayotumiwa na tovuti salama duniani kote",
  "security.paymentTitle": "Malipo Salama",
  "security.paymentBody":
    "Hatuhifadhi kamwe taarifa za kadi yako ya benki. Malipo yote yanashughulikiwa kupitia watoa huduma wanaoaminika kama M-Pesa, PayPal na uhamisho salama wa benki",
  "security.storageTitle": "Uhifadhi Salama wa Data",
  "security.storageBody":
    "Taarifa zako zinahifadhiwa katika hifadhidata salama na zilizosimbwa, zenye ufikiaji uliodhibitiwa na ukaguzi wa usalama wa mara kwa mara",
  "security.privacyTitle": "Faragha Imehakikishwa",
  "security.privacyBody":
    "Hatutashiriki, kuuza au kusambaza taarifa zako za kibinafsi kwa wengine. Data yako inatumika tu kwa ushiriki katika hafla na kushughulikia michango",
  "security.trustedTitle": "Imethibitishwa na Inaaminika",
  "security.trustedBody":
    "Jukwaa letu limejengwa kwa mbinu bora za usalama na hukaguliwa mara kwa mara ili kuhakikisha viwango vya juu vya ulinzi wa data na uaminifu",
  "security.trackingTitle": "Ufuatiliaji wa Uwazi",
  "security.trackingBody":
    "Ona michango kwa wakati halisi kwa uwazi kamili. Fuatilia jinsi mchango wako unatusaidia kufikia malengo yetu",

  "how.title": "Jinsi Inavyofanya Kazi",
  "how.step1Title": "Jiunge Papo Hapo",
  "how.step1Body":
    "Bofya kitufe cha kujisajili na umeingia. Rahisi hivyo tu. Hakuna fomu ngumu au usajili mrefu.",
  "how.step2Title": "Toa Mchango Wako",
  "how.step2Body":
    "Chagua kulipa sasa kwa athari ya haraka au weka ahadi ya kulipa baadaye. Chagua njia ya malipo unayopendelea - ni rahisi na salama.",

  "help.button": "Unahitaji Msaada? Bofya Hapa!",

  "pledge.name": "Jina Lako",
  "pledge.email": "Barua Pepe",
  "pledge.amount": "Kiasi",
  "pledge.currency": "Sarafu",
  "pledge.paymentMethod": "Njia ya Malipo",
  "pledge.duration": "Muda wa Malipo (Kwa Ahadi)",
  "pledge.message": "Ujumbe (Si Lazima)",
  "pledge.messagePlaceholder": "Ujumbe wako wa kuunga mkono...",
};

export const translations: Record<Language, Dict> = { en, it, fr, sw };


export function translate(lang: Language, key: string): string {
  return translations[lang]?.[key] ?? translations.en[key] ?? key;
}
