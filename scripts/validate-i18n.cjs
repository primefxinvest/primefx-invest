const fs = require('fs')
const path = require('path')

function flattenKeys(obj, prefix = '') {
  const keys = []
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, full))
    } else {
      keys.push(full)
    }
  }
  return keys
}

const messagesDir = path.join(process.cwd(), 'messages')
const locales = ['en', 'fr', 'es', 'de', 'ar', 'pt', 'sw', 'rw']
const data = Object.fromEntries(
  locales.map((locale) => {
    const filePath = path.join(messagesDir, `${locale}.json`)
    return [locale, JSON.parse(fs.readFileSync(filePath, 'utf8'))]
  })
)

const enKeys = new Set(flattenKeys(data.en))
let hasErrors = false

for (const locale of locales) {
  if (locale === 'en') continue
  const keys = new Set(flattenKeys(data[locale]))
  const missing = [...enKeys].filter((key) => !keys.has(key))
  const extra = [...keys].filter((key) => !enKeys.has(key))
  if (missing.length || extra.length) {
    hasErrors = true
    console.log(`\n${locale.toUpperCase()}:`)
    if (missing.length) console.log(`  Missing (${missing.length}):`, missing.slice(0, 20).join(', '), missing.length > 20 ? '...' : '')
    if (extra.length) console.log(`  Extra (${extra.length}):`, extra.slice(0, 20).join(', '), extra.length > 20 ? '...' : '')
  }
}

if (!hasErrors) {
  console.log('All locale files have matching keys.')
} else {
  process.exit(1)
}
