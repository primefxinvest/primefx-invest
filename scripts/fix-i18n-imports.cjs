const fs = require('fs')
const path = require('path')

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === 'admin' || ent.name === '.next') continue
      walk(p, acc)
    } else if (/\.(tsx|ts)$/.test(ent.name)) {
      acc.push(p)
    }
  }
  return acc
}

const root = process.cwd()
const files = walk(path.join(root, 'app', '[locale]'))
  .concat(walk(path.join(root, 'components')))
  .concat(walk(path.join(root, 'lib', 'hooks')))

let linkCount = 0
let routerCount = 0

for (const file of files) {
  if (file.includes(`${path.sep}admin${path.sep}`)) continue
  let content = fs.readFileSync(file, 'utf8')
  let changed = false

  if (content.includes("import Link from 'next/link'")) {
    content = content.replace(/import Link from 'next\/link'/g, "import { Link } from '@/i18n/navigation'")
    linkCount++
    changed = true
  }
  if (content.includes("import { useRouter } from 'next/navigation'")) {
    content = content.replace(
      /import \{ useRouter \} from 'next\/navigation'/g,
      "import { useRouter } from '@/i18n/navigation'"
    )
    routerCount++
    changed = true
  }
  if (changed) fs.writeFileSync(file, content)
}

console.log(`Updated links: ${linkCount}, routers: ${routerCount}`)
