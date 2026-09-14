import { appTranslations } from "./i18nApp";

export type Language = "en" | "it" | "fr" | "sw" | "es" | "de";

export const LANGUAGE_CODES: Language[] = ["en", "it", "fr", "sw", "es", "de"];

export const LANGUAGES: { code: Language; label: string; short: string }[] = [
  { code: "en", label: "English", short: "EN" },
  { code: "it", label: "Italiano", short: "IT" },
  { code: "fr", label: "Français", short: "FR" },
  { code: "sw", label: "Kiswahili", short: "SW" },
  { code: "es", label: "Español", short: "ES" },
  { code: "de", label: "Deutsch", short: "DE" },
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

const es: Dict = {
  "nav.language": "Idioma",

  "home.title": "Fundómetro de la Fundación Tuendelee",
  "home.heading": "Impulsando mentes brillantes a través de la educación",
  "home.subheading":
    "Apoya a estudiantes que lo merecen con becas. Cada aportación transforma vidas y construye un futuro mejor para Kenia.",
  "home.ctaCardTitle": "¿Listo para marcar la diferencia?",
  "home.ctaButton": "Regístrate para prometer y seguir el progreso",
  "home.finalCtaText": "Solo toma unos instantes generar un impacto duradero",
  "home.finalCtaButton": "Empieza a marcar la diferencia",
  "home.finalCtaNote":
    "Juntos ayudamos a estudiantes merecedores a cumplir sus sueños educativos",

  "impact.sectionTitle": "Historias de impacto",
  "impact.sectionSubtitle":
    "Ve y escucha la diferencia que tu apoyo genera en la vida de nuestros estudiantes.",
  "impact.listen": "Escucha esta historia",
  "impact.loading": "Cargando historias de impacto...",

  "security.title": "Tu seguridad es nuestra prioridad",
  "security.subtitle":
    "Sabemos lo importante que es proteger tu información personal y financiera. Tu confianza nos importa.",
  "security.encryptionTitle": "Transferencia de datos cifrada",
  "security.encryptionBody":
    "Tu información personal se protege con cifrado SSL/TLS durante la transmisión, la misma tecnología que usan los sitios seguros de todo el mundo",
  "security.paymentTitle": "Pagos procesados con seguridad",
  "security.paymentBody":
    "Nunca guardamos los datos de tu tarjeta. Todos los pagos se procesan mediante proveedores de confianza como M-Pesa, PayPal y transferencias bancarias seguras",
  "security.storageTitle": "Almacenamiento protegido",
  "security.storageBody":
    "Tu información se guarda en bases de datos cifradas y seguras, con acceso restringido y auditorías periódicas",
  "security.privacyTitle": "Privacidad garantizada",
  "security.privacyBody":
    "Nunca compartiremos, venderemos ni distribuiremos tus datos personales a terceros. Solo se usan para participar en el evento y procesar donaciones",
  "security.trustedTitle": "Verificado y confiable",
  "security.trustedBody":
    "Nuestra plataforma se construye con buenas prácticas de seguridad y se audita con regularidad para garantizar los máximos estándares de protección",
  "security.trackingTitle": "Seguimiento transparente",
  "security.trackingBody":
    "Consulta las aportaciones en tiempo real con total transparencia. Sigue cómo tu donación nos acerca a nuestras metas de becas",

  "how.title": "Cómo funciona",
  "how.step1Title": "Únete al instante",
  "how.step1Body":
    "Haz clic en el botón de registro y listo. Así de sencillo, sin formularios complicados.",
  "how.step2Title": "Haz tu aportación",
  "how.step2Body":
    "Elige pagar ahora para un impacto inmediato o prometer pagar más tarde. Elige tu método de pago preferido: flexible y seguro.",

  "help.button": "¿Necesitas ayuda? ¡Haz clic aquí!",

  "pledge.name": "Tu nombre",
  "pledge.email": "Correo electrónico",
  "pledge.amount": "Importe",
  "pledge.currency": "Moneda",
  "pledge.paymentMethod": "Método de pago",
  "pledge.duration": "Plazo de pago (para promesas)",
  "pledge.message": "Mensaje (opcional)",
  "pledge.messagePlaceholder": "Tu mensaje de apoyo...",
};

const de: Dict = {
  "nav.language": "Sprache",

  "home.title": "Tuendelee Foundation Fundometer",
  "home.heading": "Kluge Köpfe durch Bildung stärken",
  "home.subheading":
    "Unterstütze begabte Studierende mit Stipendien. Jeder Beitrag verändert Leben und baut eine bessere Zukunft für Kenia.",
  "home.ctaCardTitle": "Bereit, etwas zu bewegen?",
  "home.ctaButton": "Registrieren, zusagen und Fortschritt verfolgen",
  "home.finalCtaText": "Es dauert nur einen Moment, um dauerhaft zu helfen",
  "home.finalCtaButton": "Jetzt etwas bewegen",
  "home.finalCtaNote":
    "Gemeinsam helfen wir begabten Studierenden, ihre Bildungsträume zu erreichen",

  "impact.sectionTitle": "Wirkungsgeschichten",
  "impact.sectionSubtitle":
    "Sieh und höre, welchen Unterschied deine Unterstützung im Leben unserer Studierenden macht.",
  "impact.listen": "Diese Geschichte anhören",
  "impact.loading": "Wirkungsgeschichten werden geladen...",

  "security.title": "Deine Sicherheit hat Priorität",
  "security.subtitle":
    "Wir wissen, wie wichtig der Schutz deiner persönlichen und finanziellen Daten ist. Dein Vertrauen zählt.",
  "security.encryptionTitle": "Verschlüsselte Datenübertragung",
  "security.encryptionBody":
    "Deine Daten werden bei der Übertragung mit SSL/TLS verschlüsselt – dieselbe Technologie, die sichere Websites weltweit nutzen",
  "security.paymentTitle": "Sichere Zahlungsabwicklung",
  "security.paymentBody":
    "Wir speichern keine Kartendaten. Alle Zahlungen laufen über vertrauenswürdige Anbieter wie M-Pesa, PayPal und sichere Banküberweisungen",
  "security.storageTitle": "Geschützte Datenspeicherung",
  "security.storageBody":
    "Deine Daten liegen in sicheren, verschlüsselten Datenbanken mit eingeschränktem Zugriff und regelmäßigen Prüfungen",
  "security.privacyTitle": "Datenschutz garantiert",
  "security.privacyBody":
    "Wir geben deine persönlichen Daten niemals an Dritte weiter oder verkaufen sie. Sie dienen nur der Teilnahme am Event und der Spendenabwicklung",
  "security.trustedTitle": "Geprüft und vertrauenswürdig",
  "security.trustedBody":
    "Unsere Plattform folgt bewährten Sicherheitsstandards und wird regelmäßig überprüft, um höchsten Datenschutz zu gewährleisten",
  "security.trackingTitle": "Transparente Nachverfolgung",
  "security.trackingBody":
    "Sieh Beiträge in Echtzeit mit voller Transparenz. Verfolge, wie deine Spende uns dem Stipendienziel näherbringt",

  "how.title": "So funktioniert es",
  "how.step1Title": "Sofort beitreten",
  "how.step1Body":
    "Klicke auf die Anmeldeschaltfläche und du bist dabei. So einfach – ohne komplizierte Formulare.",
  "how.step2Title": "Deinen Beitrag leisten",
  "how.step2Body":
    "Zahle jetzt für sofortige Wirkung oder sage eine Zahlung für später zu. Wähle deine bevorzugte Zahlungsart – flexibel und sicher.",

  "help.button": "Brauchst du Hilfe? Hier klicken!",

  "pledge.name": "Dein Name",
  "pledge.email": "E-Mail-Adresse",
  "pledge.amount": "Betrag",
  "pledge.currency": "Währung",
  "pledge.paymentMethod": "Zahlungsart",
  "pledge.duration": "Zahlungsfrist (für Zusagen)",
  "pledge.message": "Nachricht (optional)",
  "pledge.messagePlaceholder": "Deine Unterstützungsnachricht...",
};

export const translations: Record<Language, Dict> = {
  en: { ...en, ...appTranslations.en },
  it: { ...it, ...appTranslations.it },
  fr: { ...fr, ...appTranslations.fr },
  sw: { ...sw, ...appTranslations.sw },
  es: { ...es, ...appTranslations.es },
  de: { ...de, ...appTranslations.de },
};


export function translate(lang: Language, key: string): string {
  return translations[lang]?.[key] ?? translations.en[key] ?? key;
}

