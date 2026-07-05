const fs = require('fs')
const path = require('path')

const locales = ['en', 'fr', 'es', 'de', 'ar']
const messagesDir = path.join(process.cwd(), 'messages')

function setNested(obj, keyPath, value) {
  const parts = keyPath.split('.')
  let current = obj
  for (let i = 0; i < parts.length - 1; i++) {
    current[parts[i]] = current[parts[i]] ?? {}
    current = current[parts[i]]
  }
  current[parts[parts.length - 1]] = value
}

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

const en = JSON.parse(fs.readFileSync(path.join(messagesDir, 'en.json'), 'utf8'))
const enFlat = Object.fromEntries(flattenKeys(en))

for (const locale of locales) {
  if (locale === 'en') continue

  const filePath = path.join(messagesDir, `${locale}.json`)
  let target = {}

  if (fs.existsSync(filePath)) {
    target = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  }

  for (const [keyPath, value] of Object.entries(enFlat)) {
    const hasKey = keyPath.split('.').reduce((obj, part, index, parts) => {
      if (index === parts.length - 1) return obj && Object.prototype.hasOwnProperty.call(obj, part)
      return obj?.[part]
    }, target)

    if (!hasKey) {
      setNested(target, keyPath, value)
    }
  }

  fs.writeFileSync(filePath, `${JSON.stringify(target, null, 2)}\n`)
  console.log(`Synced ${locale}.json`)
}

console.log('All locale files synced with en.json keys')
