#!/usr/bin/env node
// One-time migration: moves ### Material: hashtags from body to YAML tags property
import fs from 'fs'
import path from 'path'

const VAULT = path.join(
  process.env.HOME,
  'Library/Mobile Documents/iCloud~md~obsidian/Documents/studio oswald/Body of Work'
)

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) return walk(full)
    return e.name.endsWith('.md') ? [full] : []
  })

function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!m) return { fm: {}, fmText: '', body: text }
  const fm = {}
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_-]+):\s*(.*)$/)
    if (kv) fm[kv[1]] = kv[2].trim()
  }
  return { fm, fmText: m[1], body: text.slice(m[0].length) }
}

function extractMaterials(body) {
  const m = body.match(/^### Material:\s*\r?\n((?:#[A-Za-z][a-zA-Z-]+\s*)+)/m)
  if (!m) return []
  return m[1].trim().split(/\s+/)
    .map(t => t.replace(/^#/, '').toLowerCase())
    .filter(Boolean)
}

function removeMaterialSection(body) {
  return body
    .replace(/^### Material:\s*\r?\n(?:#[A-Za-z][a-zA-Z-]+\s*)+\r?\n?/m, '')
    .replace(/\n{3,}/g, '\n\n')
}

let migrated = 0
for (const file of walk(VAULT)) {
  const original = fs.readFileSync(file, 'utf8')
  const { fm, fmText, body } = parseFrontmatter(original)

  const materials = extractMaterials(body)
  if (materials.length === 0) continue

  const existingTags = fm.tags
    ? fm.tags.replace(/^\[|\]$/g, '').split(',').map(t => t.trim().replace(/^["']|["']$/g, '')).filter(Boolean)
    : []
  const allTags = [...new Set([...existingTags, ...materials])]

  // Build new frontmatter with tags added
  const newFmLines = fmText.split(/\r?\n/).filter(l => !l.startsWith('tags:'))
  newFmLines.push(`tags: [${allTags.map(t => `"${t}"`).join(', ')}]`)

  const newBody = removeMaterialSection(body)
  const result = `---\n${newFmLines.join('\n')}\n---\n${newBody}`

  if (result !== original) {
    fs.writeFileSync(file, result)
    migrated++
    console.log(`  ${path.basename(file)}: [${allTags.join(', ')}]`)
  }
}

console.log(`\nMigrated ${migrated} file(s).`)
