#!/usr/bin/env node
// Restructures all vault artwork files:
// - Removes Instagram, Instagram-Text, Web-Image properties
// - Reorders properties canonically
// - Converts ShownIn plain string → wikilink list ["[[Name]]", ...]
import fs from 'node:fs'
import path from 'node:path'

const VAULT = path.join(
  process.env.HOME,
  'Library/Mobile Documents/iCloud~md~obsidian/Documents/studio oswald/Body of Work'
)

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) return e.name === 'Series' ? [] : walk(full)
    return e.name.endsWith('.md') && e.name !== 'Body of Work.md' ? [full] : []
  })

const PROP_ORDER = ['Year', 'Series', 'Dimensions', 'Material', 'ShownIn', 'Sold', 'Price', 'Owner', 'Location', 'Credit']
const REMOVE = new Set(['Instagram', 'Instagram-Text', 'Web-Image'])

function parseFm(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!m) return null
  const props = {}
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z][A-Za-z-]*):\s*(.*)$/)
    if (kv) props[kv[1]] = kv[2].trim()
  }
  return { props, body: text.slice(m[0].length) }
}

function toWikilinks(val) {
  if (!val) return null
  const stripped = val.replace(/^["']+|["']+$/g, '').replace(/\\"/g, '"')
  if (!stripped) return null
  // Already wikilinks
  if (stripped.includes('[[')) return `[${stripped}]`
  // Plain text like "J. Hornig · Narrenkastl"
  const names = stripped.split(/\s*·\s*/).map(n => n.trim()).filter(Boolean)
  return `["${names.map(n => `[[${n}]]`).join('", "')}"]`
}

function buildFm(props) {
  const lines = ['---']
  for (const key of PROP_ORDER) {
    if (!(key in props)) continue
    if (key === 'ShownIn') {
      const wl = toWikilinks(props[key])
      if (wl) lines.push(`ShownIn: ${wl}`)
      continue
    }
    lines.push(`${key}: ${props[key]}`)
  }
  // Remaining keys not in order, not removed
  for (const [k, v] of Object.entries(props)) {
    if (PROP_ORDER.includes(k) || REMOVE.has(k)) continue
    lines.push(`${k}: ${v}`)
  }
  lines.push('---')
  return lines.join('\n') + '\n'
}

let changed = 0
for (const file of walk(VAULT)) {
  const original = fs.readFileSync(file, 'utf8')
  const parsed = parseFm(original)
  if (!parsed) continue

  const newFm = buildFm(parsed.props)
  const body = parsed.body.trim()
  const result = newFm + (body ? '\n' + body + '\n' : '\n')

  if (result !== original) {
    fs.writeFileSync(file, result)
    changed++
    console.log(path.relative(VAULT, file))
  }
}
console.log(`\nRestructured ${changed} vault files.`)
