const fs = require('fs')
const path = require('path')

const messagesDir = path.join(process.cwd(), 'messages')

const landingEn = {
  home: 'Home',
  aboutUs: 'About Us',
  invest: 'Invest',
  academy: 'Academy',
  marketInsights: 'Market Insights',
  community: 'Community',
  support: 'Support',
  openMenu: 'Open menu',
  closeMenu: 'Close menu',
  hero: {
    badge: 'AI-POWERED INVESTMENT ECOSYSTEM',
    titleLine1: 'Invest Smarter.',
    titleHighlight: 'Grow Wealth.',
    titleLine2: 'Secure Your Future.',
    subtitle:
      'PrimeFx Invest combines AI technology, global markets, and expert strategies to help you grow your wealth consistently and securely.',
    featureSecure: 'Secure & Regulated',
    featureAi: 'AI-Powered Strategies',
    featureReturns: 'High Returns Potential',
    featureGlobal: 'Global Opportunities',
    ctaStart: 'Start Investing Now',
    ctaDashboard: 'Go to Dashboard',
    ctaWatch: 'Watch How It Works',
    trustedBy: 'Trusted by {count} investors worldwide',
    reviews: '({count} Reviews)',
    statInvestors: 'Active Investors',
    statAum: 'Assets Under Management',
    statReturns: 'Average Annual Returns',
    statCountries: 'Countries Served',
    statSecure: 'Secure & Protected',
  },
  whyChoose: {
    eyebrow: 'WHY CHOOSE PRIMEAI INVEST?',
    title: 'Why Thousands Choose Us',
    subtitle:
      'We combine cutting-edge technology with proven investment strategies to deliver consistent, secure returns for investors at every level.',
    features: [
      {
        title: 'AI-Powered Edge',
        description:
          'Our proprietary AI analyzes global markets 24/7 to identify high-probability investment opportunities before they peak.',
      },
      {
        title: 'Diverse Opportunities',
        description:
          'Access forex, commodities, indices, and digital assets across 150+ countries — all from one unified platform.',
      },
      {
        title: 'Bank-Level Security',
        description:
          '256-bit SSL encryption, cold storage, and multi-factor authentication keep your funds and data fully protected.',
      },
      {
        title: 'Expert Management',
        description:
          'A team of seasoned financial analysts and portfolio managers work alongside AI to maximize your returns.',
      },
      {
        title: 'Transparent & Fair',
        description:
          'No hidden fees, no surprises. Real-time portfolio tracking and detailed reports so you always know where you stand.',
      },
      {
        title: '24/7 Human Support',
        description:
          'Our dedicated support team is available around the clock via live chat, email, and phone whenever you need help.',
      },
    ],
  },
  journey: {
    eyebrow: 'HOW IT WORKS',
    title: 'Your Journey To Financial Freedom',
    cta: 'Get Started Now',
    steps: [
      {
        title: 'Create Account',
        description: 'Sign up in under 2 minutes with just your email and basic info.',
      },
      {
        title: 'Choose Your Plan',
        description: 'Pick from Starter, Growth, Prime, or Elite based on your goals.',
      },
      {
        title: 'Fund Your Account',
        description: 'Deposit via bank transfer, card, or crypto — funds credited instantly.',
      },
      {
        title: 'We Invest For You',
        description: 'Our AI and expert team manage your portfolio around the clock.',
      },
      {
        title: 'Grow & Withdraw',
        description: 'Watch your wealth grow and withdraw profits anytime, hassle-free.',
      },
    ],
  },
  plans: {
    eyebrow: 'INVESTMENT PLANS',
    title: 'Plans Built For Every Investor',
    subtitle:
      'Whether you are just starting out or managing a large portfolio, we have a plan tailored to your risk appetite and financial goals.',
    compare: 'Compare All Plans',
    empty: 'Investment plans will appear here once they are configured in your account.',
    mostPopular: 'Most Popular',
    minInvestment: 'Min. Investment',
    duration: 'Duration',
    capitalProtection: 'Capital Protection',
    capitalProtectionYes: 'Yes',
    flexible: 'Flexible',
    choosePlan: 'Choose Plan',
  },
  performance: {
    eyebrow: 'MARKET PERFORMANCE',
    title: 'Consistent Returns. Proven Performance.',
    subtitle:
      'Our AI-driven strategies have consistently outperformed traditional market benchmarks year over year.',
    viewReport: 'View Full Performance Report',
    comparison: 'Performance Comparison',
    primeaiReturn: "PrimeAI's Average Return",
    sp500: 'S&P 500 Average',
    liveMarkets: 'Live Market Opportunities',
    liveMarketsSubtitle: 'Real-time price movements',
    viewOpportunities: 'View All Opportunities',
    statReturn: 'Average Annual Return',
    statWinRate: 'Win Rate',
    statAum: 'Total Assets Managed',
    statInvestors: 'Active Investors',
    timeframes: ['1M', '6M', '1Y', '2Y', 'All Time'],
  },
  security: {
    eyebrow: 'YOUR SECURITY IS OUR PRIORITY',
    title: 'Bank-Level Security You Can Trust',
    subtitle:
      'We employ the same security standards used by leading global financial institutions to protect your investments and personal data at every step.',
    learnMore: 'Learn More About Security',
    cardTitle: 'Your Funds, Fully Protected',
    cardBody:
      'Every transaction is encrypted, verified, and monitored in real time. We never compromise on the safety of your hard-earned money.',
    features: [
      '256-bit SSL Encryption',
      'Two-Factor Authentication',
      'Cold Storage Wallets',
      'Regulatory Compliance',
      'Real-Time Monitoring',
    ],
  },
  testimonials: {
    eyebrow: 'TESTIMONIALS',
    title: 'What Our Investors Say',
    viewAll: 'View All Reviews',
    items: [
      {
        quote:
          "PrimeFx Invest completely changed how I approach investing. The AI recommendations are spot-on, and I've seen consistent returns month after month.",
        name: 'Sarah Mitchell',
        role: 'Growth Plan Investor',
      },
      {
        quote:
          "I was skeptical at first, but the transparency and 24/7 support won me over. My portfolio has grown 34% in just 8 months. Highly recommended!",
        name: 'James Okafor',
        role: 'Prime Plan Investor',
      },
      {
        quote:
          "As a busy professional, I don't have time to manage investments. PrimeFx does it all for me — secure, profitable, and completely hands-off.",
        name: 'Elena Rodriguez',
        role: 'Elite Plan Investor',
      },
    ],
  },
  globalImpact: {
    eyebrow: 'GLOBAL IMPACT',
    stats: [
      { label: 'Happy Investors' },
      { label: 'Assets Under Management' },
      { label: 'Countries Worldwide' },
      { label: 'Average Rating' },
      { label: 'Uptime & Reliability' },
    ],
  },
  faq: {
    eyebrow: 'FAQ',
    title: 'Frequently Asked Questions',
    subtitle: 'Everything you need to know before getting started.',
    items: [
      {
        question: 'Is PrimeAI Invest safe and secure?',
        answer:
          'Yes. We use 256-bit SSL encryption, cold storage wallets, two-factor authentication, and are fully compliant with global financial regulations.',
      },
      {
        question: 'What is the minimum investment amount?',
        answer:
          'You can start with as little as $50 on our Starter Plan. Higher-tier plans have higher minimums but offer greater return potential.',
      },
      {
        question: 'How often can I withdraw my profits?',
        answer:
          'Withdrawals are processed every 7 days on all plans. You can also access your capital anytime with no lock-in periods.',
      },
      {
        question: 'How does the AI investment system work?',
        answer:
          'Our proprietary AI analyzes thousands of market signals in real time and executes trades through our expert management team to optimize your portfolio.',
      },
      {
        question: 'What returns can I realistically expect?',
        answer:
          'Returns vary by plan and market conditions. Our Starter Plan targets 8–15% monthly ROI, while Elite plans can reach 40–60%. Past performance does not guarantee future results.',
      },
      {
        question: 'Do I need investment experience to get started?',
        answer:
          'Not at all. PrimeFx Invest is designed for everyone — from complete beginners to seasoned investors. Our platform handles everything for you.',
      },
      {
        question: 'What payment methods do you accept?',
        answer:
          'We accept bank transfers, credit/debit cards, and major cryptocurrencies including Bitcoin and Ethereum.',
      },
      {
        question: 'Is there a mobile app available?',
        answer:
          'Yes! Our mobile app is available on both iOS and Android, giving you full access to your portfolio, deposits, withdrawals, and support on the go.',
      },
    ],
  },
  appCta: {
    mobileEyebrow: 'MOBILE APP',
    mobileTitle: 'Take Your Investments Anywhere You Go',
    mobileSubtitle:
      'Manage your portfolio, track performance, and invest on the go with our mobile app.',
    appStoreAria: 'Download on the App Store',
    googlePlayAria: 'Get it on Google Play',
    ctaTitle: 'Ready to Start Your Investment Journey?',
    ctaSubtitle: 'Join 120,000+ investors who trust PrimeFx Invest to grow their wealth.',
    ctaButton: 'Start Investing Now',
  },
  footer: {
    tagline: 'AI-powered investment platform for smarter, safer wealth growth.',
    product: 'Product',
    company: 'Company',
    legal: 'Legal',
    features: 'Features',
    pricing: 'Pricing',
    security: 'Security',
    about: 'About',
    contact: 'Contact',
    privacy: 'Privacy',
    terms: 'Terms',
    legalCenter: 'Legal Center',
    rights: 'All rights reserved.',
  },
}

const landingEs = {
  ...landingEn,
  home: 'Inicio',
  aboutUs: 'Sobre nosotros',
  invest: 'Invertir',
  academy: 'Academia',
  marketInsights: 'Perspectivas del mercado',
  community: 'Comunidad',
  support: 'Soporte',
  openMenu: 'Abrir menú',
  closeMenu: 'Cerrar menú',
  hero: {
    ...landingEn.hero,
    badge: 'ECOSISTEMA DE INVERSIÓN CON IA',
    titleLine1: 'Invierte más inteligente.',
    titleHighlight: 'Haz crecer tu patrimonio.',
    titleLine2: 'Asegura tu futuro.',
    subtitle:
      'PrimeFx Invest combina tecnología de IA, mercados globales y estrategias expertas para ayudarte a hacer crecer tu patrimonio de forma constante y segura.',
    featureSecure: 'Seguro y regulado',
    featureAi: 'Estrategias con IA',
    featureReturns: 'Alto potencial de rendimiento',
    featureGlobal: 'Oportunidades globales',
    ctaStart: 'Empezar a invertir',
    ctaDashboard: 'Ir al panel',
    ctaWatch: 'Ver cómo funciona',
    trustedBy: 'Con la confianza de {count} inversores en todo el mundo',
    reviews: '({count} reseñas)',
    statInvestors: 'Inversores activos',
    statAum: 'Activos bajo gestión',
    statReturns: 'Rendimiento anual promedio',
    statCountries: 'Países atendidos',
    statSecure: 'Seguro y protegido',
  },
  whyChoose: {
    eyebrow: '¿POR QUÉ ELEGIR PRIMEAI INVEST?',
    title: 'Por qué miles nos eligen',
    subtitle:
      'Combinamos tecnología de vanguardia con estrategias de inversión probadas para ofrecer rendimientos consistentes y seguros a inversores de todos los niveles.',
    features: landingEn.whyChoose.features.map((item, i) =>
      [
        {
          title: 'Ventaja impulsada por IA',
          description:
            'Nuestra IA propietaria analiza los mercados globales 24/7 para identificar oportunidades de alta probabilidad antes de que alcancen su pico.',
        },
        {
          title: 'Oportunidades diversas',
          description:
            'Accede a forex, materias primas, índices y activos digitales en más de 150 países, todo desde una plataforma unificada.',
        },
        {
          title: 'Seguridad de nivel bancario',
          description:
            'Cifrado SSL de 256 bits, almacenamiento en frío y autenticación multifactor protegen tus fondos y datos.',
        },
        {
          title: 'Gestión experta',
          description:
            'Un equipo de analistas y gestores de cartera trabaja junto a la IA para maximizar tus rendimientos.',
        },
        {
          title: 'Transparente y justo',
          description:
            'Sin comisiones ocultas ni sorpresas. Seguimiento en tiempo real e informes detallados.',
        },
        {
          title: 'Soporte humano 24/7',
          description:
            'Nuestro equipo de soporte está disponible las 24 horas por chat, correo y teléfono.',
        },
      ][i]
    ),
  },
  journey: {
    eyebrow: 'CÓMO FUNCIONA',
    title: 'Tu camino hacia la libertad financiera',
    cta: 'Comenzar ahora',
    steps: [
      { title: 'Crear cuenta', description: 'Regístrate en menos de 2 minutos con tu correo e información básica.' },
      { title: 'Elige tu plan', description: 'Selecciona Starter, Growth, Prime o Elite según tus objetivos.' },
      { title: 'Fondea tu cuenta', description: 'Deposita por transferencia, tarjeta o cripto — fondos acreditados al instante.' },
      { title: 'Invertimos por ti', description: 'Nuestra IA y equipo experto gestionan tu cartera las 24 horas.' },
      { title: 'Crece y retira', description: 'Observa crecer tu patrimonio y retira ganancias cuando quieras.' },
    ],
  },
  plans: {
    eyebrow: 'PLANES DE INVERSIÓN',
    title: 'Planes para cada inversor',
    subtitle:
      'Ya sea que estés comenzando o gestionando una cartera grande, tenemos un plan adaptado a tu perfil de riesgo y objetivos.',
    compare: 'Comparar todos los planes',
    empty: 'Los planes de inversión aparecerán aquí cuando estén configurados en tu cuenta.',
    mostPopular: 'Más popular',
    minInvestment: 'Inversión mín.',
    duration: 'Duración',
    capitalProtection: 'Protección de capital',
    capitalProtectionYes: 'Sí',
    flexible: 'Flexible',
    choosePlan: 'Elegir plan',
  },
  performance: {
    ...landingEn.performance,
    eyebrow: 'RENDIMIENTO DEL MERCADO',
    title: 'Rendimientos consistentes. Rendimiento comprobado.',
    subtitle:
      'Nuestras estrategias impulsadas por IA han superado constantemente los referentes tradicionales año tras año.',
    viewReport: 'Ver informe completo de rendimiento',
    comparison: 'Comparación de rendimiento',
    primeaiReturn: 'Rendimiento promedio PrimeAI',
    sp500: 'Promedio S&P 500',
    liveMarkets: 'Oportunidades de mercado en vivo',
    liveMarketsSubtitle: 'Movimientos de precios en tiempo real',
    viewOpportunities: 'Ver todas las oportunidades',
    statReturn: 'Rendimiento anual promedio',
    statWinRate: 'Tasa de acierto',
    statAum: 'Activos totales gestionados',
    statInvestors: 'Inversores activos',
  },
  security: {
    eyebrow: 'TU SEGURIDAD ES NUESTRA PRIORIDAD',
    title: 'Seguridad de nivel bancario en la que puedes confiar',
    subtitle:
      'Aplicamos los mismos estándares de seguridad que las principales instituciones financieras globales.',
    learnMore: 'Más sobre seguridad',
    cardTitle: 'Tus fondos, totalmente protegidos',
    cardBody:
      'Cada transacción está cifrada, verificada y monitoreada en tiempo real. Nunca comprometemos la seguridad de tu dinero.',
    features: [
      'Cifrado SSL de 256 bits',
      'Autenticación en dos pasos',
      'Billeteras de almacenamiento en frío',
      'Cumplimiento regulatorio',
      'Monitoreo en tiempo real',
    ],
  },
  testimonials: {
    eyebrow: 'TESTIMONIOS',
    title: 'Lo que dicen nuestros inversores',
    viewAll: 'Ver todas las reseñas',
    items: landingEn.testimonials.items.map((item, i) => ({
      ...item,
      quote: [
        'PrimeFx Invest cambió por completo mi forma de invertir. Las recomendaciones de IA son acertadas y he visto rendimientos constantes mes a mes.',
        'Al principio era escéptico, pero la transparencia y el soporte 24/7 me convencieron. Mi cartera creció un 34% en solo 8 meses.',
        'Como profesional ocupado, no tengo tiempo para gestionar inversiones. PrimeFx lo hace todo por mí: seguro, rentable y sin complicaciones.',
      ][i],
      role: ['Inversora del plan Growth', 'Inversor del plan Prime', 'Inversora del plan Elite'][i],
    })),
  },
  globalImpact: {
    eyebrow: 'IMPACTO GLOBAL',
    stats: [
      { label: 'Inversores satisfechos' },
      { label: 'Activos bajo gestión' },
      { label: 'Países en todo el mundo' },
      { label: 'Calificación promedio' },
      { label: 'Tiempo activo y fiabilidad' },
    ],
  },
  faq: {
    eyebrow: 'PREGUNTAS FRECUENTES',
    title: 'Preguntas frecuentes',
    subtitle: 'Todo lo que necesitas saber antes de comenzar.',
    items: landingEn.faq.items.map((item, i) => ({
      question: [
        '¿Es seguro PrimeAI Invest?',
        '¿Cuál es la inversión mínima?',
        '¿Con qué frecuencia puedo retirar ganancias?',
        '¿Cómo funciona el sistema de inversión con IA?',
        '¿Qué rendimientos puedo esperar?',
        '¿Necesito experiencia en inversiones?',
        '¿Qué métodos de pago aceptan?',
        '¿Hay una aplicación móvil?',
      ][i],
      answer: [
        'Sí. Usamos cifrado SSL de 256 bits, billeteras en frío, autenticación en dos pasos y cumplimos con las regulaciones financieras globales.',
        'Puedes empezar con solo $50 en nuestro plan Starter. Los planes superiores tienen mínimos más altos pero mayor potencial de rendimiento.',
        'Los retiros se procesan cada 7 días en todos los planes. También puedes acceder a tu capital en cualquier momento sin períodos de bloqueo.',
        'Nuestra IA analiza miles de señales de mercado en tiempo real y ejecuta operaciones a través de nuestro equipo experto.',
        'Los rendimientos varían según el plan y las condiciones del mercado. El plan Starter apunta a un ROI mensual del 8–15%. El rendimiento pasado no garantiza resultados futuros.',
        'Para nada. PrimeFx Invest está diseñado para todos, desde principiantes hasta inversores experimentados.',
        'Aceptamos transferencias bancarias, tarjetas de crédito/débito y criptomonedas principales como Bitcoin y Ethereum.',
        '¡Sí! Nuestra app está disponible en iOS y Android con acceso completo a tu cartera, depósitos, retiros y soporte.',
      ][i],
    })),
  },
  appCta: {
    mobileEyebrow: 'APP MÓVIL',
    mobileTitle: 'Lleva tus inversiones a donde vayas',
    mobileSubtitle:
      'Gestiona tu cartera, sigue el rendimiento e invierte en movimiento con nuestra app móvil.',
    appStoreAria: 'Descargar en App Store',
    googlePlayAria: 'Disponible en Google Play',
    ctaTitle: '¿Listo para comenzar tu viaje de inversión?',
    ctaSubtitle: 'Únete a más de 120,000 inversores que confían en PrimeFx Invest.',
    ctaButton: 'Empezar a invertir',
  },
  footer: {
    tagline: 'Plataforma de inversión con IA para un crecimiento patrimonial más inteligente y seguro.',
    product: 'Producto',
    company: 'Empresa',
    legal: 'Legal',
    features: 'Funciones',
    pricing: 'Precios',
    security: 'Seguridad',
    about: 'Acerca de',
    contact: 'Contacto',
    privacy: 'Privacidad',
    terms: 'Términos',
    legalCenter: 'Centro legal',
    rights: 'Todos los derechos reservados.',
  },
}

const landingDe = {
  ...landingEn,
  home: 'Startseite',
  aboutUs: 'Über uns',
  invest: 'Investieren',
  academy: 'Akademie',
  marketInsights: 'Markteinblicke',
  community: 'Community',
  support: 'Support',
  openMenu: 'Menü öffnen',
  closeMenu: 'Menü schließen',
  hero: {
    ...landingEn.hero,
    badge: 'KI-GESTÜTZTES INVESTITIONSÖKOSYSTEM',
    titleLine1: 'Klüger investieren.',
    titleHighlight: 'Vermögen aufbauen.',
    titleLine2: 'Zukunft sichern.',
    subtitle:
      'PrimeFx Invest verbindet KI-Technologie, globale Märkte und Expertenstrategien, um Ihr Vermögen konstant und sicher zu steigern.',
    featureSecure: 'Sicher & reguliert',
    featureAi: 'KI-gestützte Strategien',
    featureReturns: 'Hohes Renditepotenzial',
    featureGlobal: 'Globale Chancen',
    ctaStart: 'Jetzt investieren',
    ctaDashboard: 'Zum Dashboard',
    ctaWatch: 'So funktioniert es',
    trustedBy: 'Vertraut von {count} Investoren weltweit',
    reviews: '({count} Bewertungen)',
    statInvestors: 'Aktive Investoren',
    statAum: 'Verwaltetes Vermögen',
    statReturns: 'Durchschnittliche Jahresrendite',
    statCountries: 'Bediente Länder',
    statSecure: 'Sicher & geschützt',
  },
  whyChoose: {
    eyebrow: 'WARUM PRIMEAI INVEST?',
    title: 'Warum Tausende uns wählen',
    subtitle:
      'Wir verbinden modernste Technologie mit bewährten Anlagestrategien für konstante, sichere Renditen auf jedem Niveau.',
    features: landingEn.whyChoose.features.map((_, i) =>
      [
        {
          title: 'KI-Vorsprung',
          description:
            'Unsere proprietäre KI analysiert globale Märkte rund um die Uhr, um Chancen mit hoher Wahrscheinlichkeit früh zu erkennen.',
        },
        {
          title: 'Vielfältige Chancen',
          description:
            'Zugang zu Forex, Rohstoffen, Indizes und digitalen Assets in über 150 Ländern — alles auf einer Plattform.',
        },
        {
          title: 'Bank-Level-Sicherheit',
          description:
            '256-Bit-SSL, Cold Storage und Multi-Faktor-Authentifizierung schützen Ihre Mittel und Daten.',
        },
        {
          title: 'Expertenmanagement',
          description:
            'Ein Team erfahrener Analysten und Portfoliomanager arbeitet mit der KI zusammen, um Ihre Renditen zu maximieren.',
        },
        {
          title: 'Transparent & fair',
          description:
            'Keine versteckten Gebühren. Echtzeit-Tracking und detaillierte Berichte.',
        },
        {
          title: 'Menschlicher Support 24/7',
          description:
            'Unser Support-Team ist rund um die Uhr per Chat, E-Mail und Telefon erreichbar.',
        },
      ][i]
    ),
  },
  journey: {
    eyebrow: 'SO FUNKTIONIERT ES',
    title: 'Ihr Weg zur finanziellen Freiheit',
    cta: 'Jetzt starten',
    steps: [
      { title: 'Konto erstellen', description: 'Registrieren Sie sich in unter 2 Minuten mit E-Mail und Basisdaten.' },
      { title: 'Plan wählen', description: 'Wählen Sie Starter, Growth, Prime oder Elite nach Ihren Zielen.' },
      { title: 'Konto aufladen', description: 'Einzahlung per Überweisung, Karte oder Krypto — sofort gutgeschrieben.' },
      { title: 'Wir investieren für Sie', description: 'KI und Expertenteam verwalten Ihr Portfolio rund um die Uhr.' },
      { title: 'Wachsen & abheben', description: 'Beobachten Sie Ihr Wachstum und heben Sie Gewinne jederzeit ab.' },
    ],
  },
  plans: {
    eyebrow: 'INVESTITIONSPLÄNE',
    title: 'Pläne für jeden Investor',
    subtitle:
      'Ob Einsteiger oder großes Portfolio — wir haben einen Plan für Ihr Risikoprofil und Ihre Ziele.',
    compare: 'Alle Pläne vergleichen',
    empty: 'Investitionspläne erscheinen hier, sobald sie in Ihrem Konto konfiguriert sind.',
    mostPopular: 'Am beliebtesten',
    minInvestment: 'Mindestinvestition',
    duration: 'Laufzeit',
    capitalProtection: 'Kapitalschutz',
    capitalProtectionYes: 'Ja',
    flexible: 'Flexibel',
    choosePlan: 'Plan wählen',
  },
  performance: {
    ...landingEn.performance,
    eyebrow: 'MARKTPERFORMANCE',
    title: 'Konstante Renditen. Bewährte Performance.',
    subtitle:
      'Unsere KI-Strategien haben traditionelle Benchmarks Jahr für Jahr übertroffen.',
    viewReport: 'Vollständigen Performance-Bericht ansehen',
    comparison: 'Performance-Vergleich',
    primeaiReturn: 'PrimeAI-Durchschnittsrendite',
    sp500: 'S&P 500 Durchschnitt',
    liveMarkets: 'Live-Marktchancen',
    liveMarketsSubtitle: 'Echtzeit-Kursbewegungen',
    viewOpportunities: 'Alle Chancen ansehen',
    statReturn: 'Durchschnittliche Jahresrendite',
    statWinRate: 'Gewinnrate',
    statAum: 'Verwaltetes Gesamtvermögen',
    statInvestors: 'Aktive Investoren',
  },
  security: {
    eyebrow: 'IHRE SICHERHEIT IST UNSERE PRIORITÄT',
    title: 'Bank-Level-Sicherheit, der Sie vertrauen können',
    subtitle:
      'Wir nutzen dieselben Sicherheitsstandards wie führende globale Finanzinstitute.',
    learnMore: 'Mehr über Sicherheit',
    cardTitle: 'Ihre Mittel, vollständig geschützt',
    cardBody:
      'Jede Transaktion wird verschlüsselt, verifiziert und in Echtzeit überwacht.',
    features: [
      '256-Bit-SSL-Verschlüsselung',
      'Zwei-Faktor-Authentifizierung',
      'Cold-Storage-Wallets',
      'Regulatorische Compliance',
      'Echtzeit-Überwachung',
    ],
  },
  testimonials: {
    eyebrow: 'ERFAHRUNGSBERICHTE',
    title: 'Was unsere Investoren sagen',
    viewAll: 'Alle Bewertungen ansehen',
    items: landingEn.testimonials.items,
  },
  globalImpact: {
    eyebrow: 'GLOBALE WIRKUNG',
    stats: [
      { label: 'Zufriedene Investoren' },
      { label: 'Verwaltetes Vermögen' },
      { label: 'Länder weltweit' },
      { label: 'Durchschnittsbewertung' },
      { label: 'Verfügbarkeit & Zuverlässigkeit' },
    ],
  },
  faq: {
    eyebrow: 'FAQ',
    title: 'Häufig gestellte Fragen',
    subtitle: 'Alles, was Sie vor dem Start wissen müssen.',
    items: landingEn.faq.items,
  },
  appCta: {
    mobileEyebrow: 'MOBILE APP',
    mobileTitle: 'Nehmen Sie Ihre Investments überall hin mit',
    mobileSubtitle:
      'Verwalten Sie Ihr Portfolio, verfolgen Sie die Performance und investieren Sie mobil.',
    appStoreAria: 'Im App Store laden',
    googlePlayAria: 'Bei Google Play holen',
    ctaTitle: 'Bereit für Ihre Investment-Reise?',
    ctaSubtitle: 'Schließen Sie sich über 120.000 Investoren an, die PrimeFx Invest vertrauen.',
    ctaButton: 'Jetzt investieren',
  },
  footer: {
    tagline: 'KI-gestützte Investmentplattform für smarteres, sichereres Vermögenswachstum.',
    product: 'Produkt',
    company: 'Unternehmen',
    legal: 'Rechtliches',
    features: 'Funktionen',
    pricing: 'Preise',
    security: 'Sicherheit',
    about: 'Über uns',
    contact: 'Kontakt',
    privacy: 'Datenschutz',
    terms: 'AGB',
    legalCenter: 'Rechtliches Zentrum',
    rights: 'Alle Rechte vorbehalten.',
  },
}

const landingFr = {
  ...landingEn,
  home: 'Accueil',
  aboutUs: 'À propos',
  invest: 'Investir',
  academy: 'Académie',
  marketInsights: 'Analyses de marché',
  community: 'Communauté',
  support: 'Support',
  openMenu: 'Ouvrir le menu',
  closeMenu: 'Fermer le menu',
  hero: {
    ...landingEn.hero,
    badge: 'ÉCOSYSTÈME D\'INVESTISSEMENT IA',
    titleLine1: 'Investissez plus intelligemment.',
    titleHighlight: 'Faites fructifier votre patrimoine.',
    titleLine2: 'Sécurisez votre avenir.',
    subtitle:
      'PrimeFx Invest combine l\'IA, les marchés mondiaux et des stratégies d\'experts pour faire croître votre patrimoine de façon constante et sécurisée.',
    featureSecure: 'Sécurisé et réglementé',
    featureAi: 'Stratégies IA',
    featureReturns: 'Fort potentiel de rendement',
    featureGlobal: 'Opportunités mondiales',
    ctaStart: 'Commencer à investir',
    ctaDashboard: 'Aller au tableau de bord',
    ctaWatch: 'Voir comment ça marche',
    trustedBy: 'Approuvé par {count} investisseurs dans le monde',
    reviews: '({count} avis)',
    statInvestors: 'Investisseurs actifs',
    statAum: 'Actifs sous gestion',
    statReturns: 'Rendement annuel moyen',
    statCountries: 'Pays desservis',
    statSecure: 'Sécurisé et protégé',
  },
  whyChoose: {
    eyebrow: 'POURQUOI CHOISIR PRIMEAI INVEST ?',
    title: 'Pourquoi des milliers nous choisissent',
    subtitle:
      'Nous combinons technologie de pointe et stratégies d\'investissement éprouvées pour des rendements constants et sécurisés.',
    features: landingEn.whyChoose.features.map((_, i) =>
      [
        {
          title: 'Avantage IA',
          description:
            'Notre IA propriétaire analyse les marchés mondiaux 24h/24 pour identifier les opportunités à forte probabilité.',
        },
        {
          title: 'Opportunités diversifiées',
          description:
            'Accédez au forex, matières premières, indices et actifs numériques dans plus de 150 pays.',
        },
        {
          title: 'Sécurité bancaire',
          description:
            'Chiffrement SSL 256 bits, stockage à froid et authentification multifacteur.',
        },
        {
          title: 'Gestion experte',
          description:
            'Une équipe d\'analystes et de gestionnaires travaille avec l\'IA pour maximiser vos rendements.',
        },
        {
          title: 'Transparent et équitable',
          description:
            'Pas de frais cachés. Suivi en temps réel et rapports détaillés.',
        },
        {
          title: 'Support humain 24h/24',
          description:
            'Notre équipe support est disponible en permanence par chat, e-mail et téléphone.',
        },
      ][i]
    ),
  },
  journey: {
    eyebrow: 'COMMENT ÇA MARCHE',
    title: 'Votre chemin vers la liberté financière',
    cta: 'Commencer maintenant',
    steps: [
      { title: 'Créer un compte', description: 'Inscrivez-vous en moins de 2 minutes avec votre e-mail.' },
      { title: 'Choisir votre plan', description: 'Starter, Growth, Prime ou Elite selon vos objectifs.' },
      { title: 'Alimenter le compte', description: 'Dépôt par virement, carte ou crypto — crédité instantanément.' },
      { title: 'Nous investissons pour vous', description: 'Notre IA et nos experts gèrent votre portefeuille 24h/24.' },
      { title: 'Croître et retirer', description: 'Suivez votre croissance et retirez vos gains à tout moment.' },
    ],
  },
  plans: {
    eyebrow: 'PLANS D\'INVESTISSEMENT',
    title: 'Des plans pour chaque investisseur',
    subtitle:
      'Débutant ou grand portefeuille — nous avons un plan adapté à votre profil de risque.',
    compare: 'Comparer tous les plans',
    empty: 'Les plans d\'investissement apparaîtront ici une fois configurés.',
    mostPopular: 'Le plus populaire',
    minInvestment: 'Investissement min.',
    duration: 'Durée',
    capitalProtection: 'Protection du capital',
    capitalProtectionYes: 'Oui',
    flexible: 'Flexible',
    choosePlan: 'Choisir le plan',
  },
  performance: {
    ...landingEn.performance,
    eyebrow: 'PERFORMANCE DU MARCHÉ',
    title: 'Rendements constants. Performance prouvée.',
    subtitle:
      'Nos stratégies IA ont constamment surpassé les indices traditionnels année après année.',
    viewReport: 'Voir le rapport complet',
    comparison: 'Comparaison de performance',
    primeaiReturn: 'Rendement moyen PrimeAI',
    sp500: 'Moyenne S&P 500',
    liveMarkets: 'Opportunités de marché en direct',
    liveMarketsSubtitle: 'Mouvements de prix en temps réel',
    viewOpportunities: 'Voir toutes les opportunités',
    statReturn: 'Rendement annuel moyen',
    statWinRate: 'Taux de réussite',
    statAum: 'Actifs totaux gérés',
    statInvestors: 'Investisseurs actifs',
  },
  security: {
    eyebrow: 'VOTRE SÉCURITÉ EST NOTRE PRIORITÉ',
    title: 'Une sécurité de niveau bancaire',
    subtitle:
      'Nous appliquons les mêmes normes de sécurité que les grandes institutions financières.',
    learnMore: 'En savoir plus sur la sécurité',
    cardTitle: 'Vos fonds, entièrement protégés',
    cardBody:
      'Chaque transaction est chiffrée, vérifiée et surveillée en temps réel.',
    features: [
      'Chiffrement SSL 256 bits',
      'Authentification à deux facteurs',
      'Portefeuilles cold storage',
      'Conformité réglementaire',
      'Surveillance en temps réel',
    ],
  },
  testimonials: {
    eyebrow: 'TÉMOIGNAGES',
    title: 'Ce que disent nos investisseurs',
    viewAll: 'Voir tous les avis',
    items: landingEn.testimonials.items,
  },
  globalImpact: {
    eyebrow: 'IMPACT MONDIAL',
    stats: [
      { label: 'Investisseurs satisfaits' },
      { label: 'Actifs sous gestion' },
      { label: 'Pays dans le monde' },
      { label: 'Note moyenne' },
      { label: 'Disponibilité et fiabilité' },
    ],
  },
  faq: {
    eyebrow: 'FAQ',
    title: 'Questions fréquentes',
    subtitle: 'Tout ce qu\'il faut savoir avant de commencer.',
    items: landingEn.faq.items,
  },
  appCta: {
    mobileEyebrow: 'APPLICATION MOBILE',
    mobileTitle: 'Emportez vos investissements partout',
    mobileSubtitle:
      'Gérez votre portefeuille, suivez la performance et investissez en déplacement.',
    appStoreAria: 'Télécharger sur l\'App Store',
    googlePlayAria: 'Disponible sur Google Play',
    ctaTitle: 'Prêt à commencer votre parcours d\'investissement ?',
    ctaSubtitle: 'Rejoignez plus de 120 000 investisseurs qui font confiance à PrimeFx Invest.',
    ctaButton: 'Commencer à investir',
  },
  footer: {
    tagline: 'Plateforme d\'investissement IA pour une croissance patrimoniale plus intelligente et plus sûre.',
    product: 'Produit',
    company: 'Entreprise',
    legal: 'Juridique',
    features: 'Fonctionnalités',
    pricing: 'Tarifs',
    security: 'Sécurité',
    about: 'À propos',
    contact: 'Contact',
    privacy: 'Confidentialité',
    terms: 'Conditions',
    legalCenter: 'Centre juridique',
    rights: 'Tous droits réservés.',
  },
}

const locales = { en: landingEn, es: landingEs, de: landingDe, fr: landingFr }

for (const [locale, landing] of Object.entries(locales)) {
  const file = path.join(messagesDir, `${locale}.json`)
  const messages = JSON.parse(fs.readFileSync(file, 'utf8'))
  messages.landing = landing
  fs.writeFileSync(file, `${JSON.stringify(messages, null, 2)}\n`)
}

console.log('Expanded landing messages for en, es, de, fr')
