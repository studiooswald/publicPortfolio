#!/usr/bin/env node
// Strip Obsidian-specific sections, extract materials as tags, extract cover image.
import fs from 'node:fs'
import path from 'node:path'

const contentDir = path.join(process.cwd(), 'content')
const imgDbDir = path.join(contentDir, 'Image Database')

// Build a flat index: basename (lowercase) → relative URL from site root
const imageIndex = new Map()
if (fs.existsSync(imgDbDir)) {
  for (const year of fs.readdirSync(imgDbDir)) {
    const yearDir = path.join(imgDbDir, year)
    if (!fs.statSync(yearDir).isDirectory()) continue
    for (const file of fs.readdirSync(yearDir)) {
      if (!/\.(jpe?g|png|gif|webp)$/i.test(file)) continue
      const slug = file.toLowerCase().replace(/\s+/g, '-')
      // Store as absolute site path
      imageIndex.set(file.normalize('NFC'), `/image-database/${year}/${slug}`)
    }
  }
}

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) return walk(full)
    return e.name.endsWith('.md') ? [full] : []
  })

function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!m) return { fm: {}, fmRaw: '', body: text }
  const fm = {}
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_-]+):\s*(.*)$/)
    if (kv) fm[kv[1]] = kv[2].trim()
  }
  return { fm, fmRaw: m[0], body: text.slice(m[0].length) }
}

function extractMaterials(body) {
  const m = body.match(/^### Material:\s*\n(#[A-Za-z][a-zA-Z-]+(?:\s+#[A-Za-z][a-zA-Z-]+)*)/m)
  if (!m) return []
  return m[1].trim().split(/\s+/)
    .map(t => t.replace(/^#/, '').toLowerCase())
    .filter(Boolean)
}

function extractCover(body) {
  const m = body.match(/!\[\[([^\]|]+?)(?:\|[^\]])?\]\]/)
  if (!m) return null
  const basename = path.basename(m[1].trim()).normalize('NFC')
  return imageIndex.get(basename) ?? null
}

function cleanBody(body) {
  return body
    .replace(/^### (Material|Frame|Reference|Shown in|Publication Text):.*$/gm, '§SECTION§')
    .replace(/§SECTION§\n([\s\S]*?)(?=§SECTION§|$)/g, (_, content) => {
      const trimmed = content.trim()
      return trimmed ? trimmed + '\n\n' : ''
    })
    .replace(/^#[A-Za-z][a-zA-Z-]+(\s+#[A-Za-z][a-zA-Z-]+)*\s*$/gm, '')
    .replace(/^#BodyOfWork\s*$/gm, '')
    .replace(/^Instagram(-Text)?:.*$/gm, '')
    .replace(/^---\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function buildFrontmatter(fm, materials, cover) {
  const existingTags = fm.tags
    ? fm.tags.replace(/^\[|\]$/g, '').split(',').map(t => t.trim().replace(/^["']|["']$/g, '')).filter(Boolean)
    : []
  const allTags = [...new Set([...existingTags, ...materials])]

  const lines = ['---']
  // Preserve original fields (except tags which we rebuild)
  const skip = new Set(['tags'])
  for (const [k, v] of Object.entries(fm)) {
    if (skip.has(k)) continue
    lines.push(`${k}: ${v}`)
  }
  if (cover && !fm.cover) lines.push(`cover: "${cover}"`)
  if (allTags.length) lines.push(`tags: [${allTags.map(t => `"${t}"`).join(', ')}]`)
  lines.push('---')
  return lines.join('\n') + '\n'
}

let cleaned = 0
for (const file of walk(contentDir)) {
  const original = fs.readFileSync(file, 'utf8')
  const { fm, body } = parseFrontmatter(original)

  const materials = extractMaterials(body)
  const cover = extractCover(body)
  const cleanedBody = cleanBody(body)

  const newFm = buildFrontmatter(fm, materials, cover)
  const result = newFm + '\n' + cleanedBody + '\n'

  if (result !== original) {
    fs.writeFileSync(file, result)
    cleaned++
  }
}

console.log(`Cleaned ${cleaned} file(s).`)
