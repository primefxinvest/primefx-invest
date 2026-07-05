/**
 * Force-sync trust-oriented copy from en.json into all locale files.
 * Ensures identical meaning across locales (English fallback until translated).
 * Safe to re-run — only overwrites listed key paths.
 */
const fs = require('fs')
const path = require('path')

const locales = ['fr', 'es', 'de', 'ar']
const messagesDir = path.join(process.cwd(), 'messages')

/** Nested paths to overwrite from English source of truth */
const TRUST_PATHS = [
  'landing.hero',
  'landing.whyChoose',
  'landing.journey',
  'landing.performance',
  'landing.testimonials',
  'landing.appCta',
  'landing.footer',
  'landing.faq.items',
  'dashboard.riskLow',
  'dashboard.riskMedium',
  'dashboard.riskHigh',
  'dashboard.riskVeryHigh',
  'dashboard.primeAI',
  'dashboard.primeInsight',
  'invest.card',
  'invest.recommendation',
  'wallet.deposit.description',
  'wallet.deposit.promoEyebrow',
  'wallet.deposit.promoTitle',
  'wallet.deposit.promoSubtitle',
  'wallet.deposit.promoCryptoCount',
  'wallet.deposit.promoAutoConvert',
  'wallet.deposit.promoRates',
  'wallet.deposit.promoSecure',
  'wallet.deposit.trustSecureCrypto',
  'wallet.deposit.trustVerifiedInfra',
  'wallet.deposit.trustBankGrade',
  'wallet.deposit.trustFraudProtection',
  'wallet.deposit.trustAutoCredit',
  'wallet.deposit.trust247',
  'wallet.deposit.cardComingSoon',
  'wallet.deposit.poweredByNowPayments',
  'wallet.deposit.heroCryptoCount',
  'wallet.withdraw.summaryBlockchainNote',
  'auth.loginHeroSubtitle',
  'meta.marketingDescription',
]

function getNested(obj, keyPath) {
  return keyPath.split('.').reduce((acc, part) => acc?.[part], obj)
}

function setNested(obj, keyPath, value) {
  const parts = keyPath.split('.')
  let current = obj
  for (let i = 0; i < parts.length - 1; i++) {
    current[parts[i]] = current[parts[i]] ?? {}
    current = current[parts[i]]
  }
  current[parts[parts.length - 1]] = value
}

const en = JSON.parse(fs.readFileSync(path.join(messagesDir, 'en.json'), 'utf8'))

for (const locale of locales) {
  const filePath = path.join(messagesDir, `${locale}.json`)
  const target = JSON.parse(fs.readFileSync(filePath, 'utf8'))

  for (const keyPath of TRUST_PATHS) {
    const value = getNested(en, keyPath)
    if (value !== undefined) {
      setNested(target, keyPath, value)
    }
  }

  fs.writeFileSync(filePath, `${JSON.stringify(target, null, 2)}\n`)
  console.log(`Trust-synced ${locale}.json (${TRUST_PATHS.length} paths)`)
}

console.log('Trust locale sync complete.')
