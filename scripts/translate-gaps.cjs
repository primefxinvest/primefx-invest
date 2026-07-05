/**
 * Fills untranslated locale strings (values identical to English) via MyMemory API.
 * Preserves ICU placeholders like {name}. Skips brand tokens and very short strings.
 *
 * Usage: node scripts/translate-gaps.cjs [locale...]
 * Example: node scripts/translate-gaps.cjs ar
 */
const fs = require('fs')
const path = require('path')

const messagesDir = path.join(process.cwd(), 'messages')
const targetLocales = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['fr', 'es', 'de', 'ar']

const LANGPAIR = { fr: 'en|fr', es: 'en|es', de: 'en|de', ar: 'en|ar' }

const SKIP_EXACT = new Set([
  'PrimeFx',
  'PrimeFx Invest',
  'PrimeAI',
  'ROI',
  'KYC',
  '2FA',
  'API',
  'FAQ',
  'USD',
  'USDT',
  'BTC',
  'ETH',
])

function flattenKeys(obj, prefix = '') {
  const entries = []
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      entries.push(...flattenKeys(value, full))
    } else {
      entries.push([full, value])
    }
  }
  return entries
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

function shouldSkip(value) {
  if (typeof value !== 'string') return true
  if (value.length <= 2) return true
  if (SKIP_EXACT.has(value)) return true
  if (/^[\d./\s%-]+$/.test(value)) return true
  if (/^https?:\/\//.test(value)) return true
  return false
}

/** Protect ICU placeholders before translation. */
function shieldPlaceholders(text) {
  const tokens = []
  const shielded = text.replace(/\{[^}]+\}/g, (match) => {
    const token = `__PH${tokens.length}__`
    tokens.push(match)
    return token
  })
  return { shielded, tokens }
}

function unshieldPlaceholders(text, tokens) {
  let result = text
  tokens.forEach((original, index) => {
    result = result.replace(`__PH${index}__`, original)
    result = result.replace(`__ PH ${index} __`, original)
    result = result.replace(new RegExp(`__PH${index}__`, 'gi'), original)
  })
  return result
}

async function translateText(text, langpair) {
  const { shielded, tokens } = shieldPlaceholders(text)
  const url = new URL('https://api.mymemory.translated.net/get')
  url.searchParams.set('q', shielded)
  url.searchParams.set('langpair', langpair)

  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  if (data.responseStatus !== 200) {
    throw new Error(data.responseDetails || 'Translation failed')
  }
  return unshieldPlaceholders(data.responseData.translatedText, tokens)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  const en = JSON.parse(fs.readFileSync(path.join(messagesDir, 'en.json'), 'utf8'))
  const enFlat = Object.fromEntries(flattenKeys(en))

  for (const locale of targetLocales) {
    const filePath = path.join(messagesDir, `${locale}.json`)
    const target = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    const targetFlat = Object.fromEntries(flattenKeys(target))

    const gaps = Object.keys(enFlat).filter((key) => {
      const enVal = enFlat[key]
      const locVal = targetFlat[key]
      return locVal === enVal && !shouldSkip(enVal)
    })

    console.log(`\n[${locale}] Translating ${gaps.length} gaps...`)
    let done = 0
    let failed = 0

    for (const key of gaps) {
      const source = enFlat[key]
      try {
        const translated = await translateText(source, LANGPAIR[locale])
        if (translated && translated !== source) {
          setNested(target, key, translated)
          done++
        }
        if (done % 25 === 0 && done > 0) {
          fs.writeFileSync(filePath, `${JSON.stringify(target, null, 2)}\n`)
          console.log(`  [${locale}] checkpoint: ${done}/${gaps.length}`)
        }
        await sleep(350)
      } catch (err) {
        failed++
        console.warn(`  [${locale}] skip ${key}: ${err.message}`)
        await sleep(800)
      }
    }

    fs.writeFileSync(filePath, `${JSON.stringify(target, null, 2)}\n`)
    console.log(`[${locale}] Done: ${done} translated, ${failed} failed, ${gaps.length} total gaps`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
