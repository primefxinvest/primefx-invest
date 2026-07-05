/** Remove locale keys that no longer exist in en.json */
const fs = require('fs')
const path = require('path')

const locales = ['fr', 'es', 'de', 'ar']
const messagesDir = path.join(process.cwd(), 'messages')

const ORPHAN_PATHS = [
  'wallet.deposit.trustNowPayments',
  'wallet.deposit.trustInstantInvoice',
  'wallet.withdraw.nowPaymentsNotConfigured',
  'wallet.withdraw.nowPaymentsProcessing',
]

function deleteNested(obj, keyPath) {
  const parts = keyPath.split('.')
  let current = obj
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) return
    current = current[parts[i]]
  }
  delete current[parts[parts.length - 1]]
}

for (const locale of locales) {
  const filePath = path.join(messagesDir, `${locale}.json`)
  const target = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  for (const keyPath of ORPHAN_PATHS) {
    deleteNested(target, keyPath)
  }
  fs.writeFileSync(filePath, `${JSON.stringify(target, null, 2)}\n`)
  console.log(`Cleaned orphans from ${locale}.json`)
}

console.log('Orphan key cleanup complete.')
