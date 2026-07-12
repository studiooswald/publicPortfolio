#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const contentDir = path.join(process.cwd(), 'content')
const imgDbDir = path.join(contentDir, 'Image Database')

// Build image index recursively (handles subdirectories like 2026/A sense of finding home/)
const imageIndex = new Map()

function indexImages(dir, urlBase) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      const subSlug = entry.name.toLowerCase().replace(/\s+/g, '-')
      indexImages(full, `${urlBase}/${subSlug}`)
    } else if (/\.(jpe?g|png|gif|webp)$/i.test(entry.name)) {
      const slug = entry.name.toLowerCase().replace(/\s+/g, '-')
      imageIndex.set(entry.name.normalize('NFC'), `${urlBase}/${slug}`)
    }
  }
}

if (fs.existsSync(imgDbDir)) {
  for (const year of fs.readdirSync(imgDbDir)) {
    const yearDir = path.join(imgDbDir, year)
    if (!fs.statSync(yearDir).isDirectory()) continue
    indexImages(yearDir, `/image-database/${year}`)
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

// Extract materials from body ### Material: section (legacy fallback)
function extractMaterialsFromBody(body) {
  const m = body.match(/^### Material:\s*\r?\n(#[A-Za-z][a-zA-Z-]+(?:\s+#[A-Za-z][a-zA-Z-]+)*)/m)
  if (!m) return []
  return m[1].trim().split(/\s+/)
    .map(t => t.replace(/^#/, '').toLowerCase())
    .filter(Boolean)
}

// Parse YAML array/string value like ["a", "b"] or a, b
function parseYamlList(val) {
  if (!val) return []
  return val.replace(/^\[|\]$/g, '').split(',')
    .map(t => t.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean)
}

function extractCover(body) {
  const m = body.match(/!\[\[([^\]|]+?)(?:\|[^\]])?\]\]/)
  if (!m) return null
  const basename = path.basename(m[1].trim()).normalize('NFC')
  return imageIndex.get(basename) ?? null
}

// Extract exhibition names from ### Shown in: wikilinks like [[24 - Kabuff Graz, X]]
// Also finds orphaned wikilinks in body (from previous cleanup runs)
function extractShownIn(body) {
  // Try the section first
  const sectionRe = /^### Shown in:\s*\r?\n([\s\S]*?)(?=\n###|\n---)/m
  const section = body.match(sectionRe)?.[1] ?? ''
  // Fall back: find ALL wikilinks that look like exhibition references (start with digits like [[24 - ]])
  const searchArea = section || body
  const exhibitions = [...searchArea.matchAll(/\[\[(\d{2}\s*[-–][^\]]+)\]\]/g)]
    .map(x => x[1].replace(/^\d{2}\s*[-–]\s*/, '').trim())
    .filter(Boolean)
  return [...new Set(exhibitions)].join(' · ')
}

function cleanBody(body) {
  return body
    .replace(/^### (Material|Frame|Reference|Shown in|Publication Text):.*$/gm, '§SECTION§')
    .replace(/§SECTION§\n([\s\S]*?)(?=§SECTION§|$)/g, (_, content) => {
      const trimmed = content.trim()
      return trimmed ? trimmed + '\n\n' : ''
    })
    // Remove exhibition wikilink lines like "- [[24 - J. Hornig]]" left over from Shown in section
    .replace(/^-?\s*\[\[\d{2}\s*[-–][^\]]+\]\]\s*$/gm, '')
    .replace(/^#[A-Za-z][a-zA-Z-]+(\s+#[A-Za-z][a-zA-Z-]+)*\s*$/gm, '')
    .replace(/^#BodyOfWork\s*$/gm, '')
    .replace(/^Instagram(-Text)?:.*$/gm, '')
    .replace(/^---\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function buildFrontmatter(fm, materials, cover, shownIn) {
  // Read existing Material property (from vault YAML) or legacy tags
  const existingMaterial = parseYamlList(fm.Material)
  const existingTags = parseYamlList(fm.tags)

  // Merge: Material property wins, fall back to legacy tags, then body extraction
  const allMaterials = existingMaterial.length > 0
    ? existingMaterial
    : existingTags.length > 0
      ? existingTags
      : materials

  const lines = ['---']
  const skip = new Set(['tags', 'Material', 'ShownIn', 'cover'])
  for (const [k, v] of Object.entries(fm)) {
    if (skip.has(k)) continue
    lines.push(`${k}: ${v}`)
  }

  const resolvedCover = cover || fm.cover
  if (resolvedCover) lines.push(`cover: "${resolvedCover}"`)
  if (allMaterials.length) {
    lines.push(`Material: [${allMaterials.map(t => `"${t}"`).join(', ')}]`)
    // Also keep tags: for Quartz tag-page browsing
    lines.push(`tags: [${allMaterials.map(t => `"${t}"`).join(', ')}]`)
  }

  // Strip all surrounding/inner quote layers from existing ShownIn (avoid double-escaping on repeat runs)
  const existingShownIn = (fm.ShownIn || '').replace(/^["']+|["']+$/g, '').replace(/\\"/g, '"').replace(/^["']+|["']+$/g, '')
  const resolvedShownIn = shownIn || existingShownIn
  if (resolvedShownIn) lines.push(`ShownIn: "${resolvedShownIn.replace(/"/g, "'")}"`)


  lines.push('---')
  return lines.join('\n') + '\n'
}

let cleaned = 0
for (const file of walk(contentDir)) {
  if (file.includes('Image Database')) continue
  const original = fs.readFileSync(file, 'utf8')
  const { fm, body } = parseFrontmatter(original)

  const materials = extractMaterialsFromBody(body)
  const cover = extractCover(body)
  const shownIn = extractShownIn(body)
  const cleanedBody = cleanBody(body)

  const newFm = buildFrontmatter(fm, materials, cover, shownIn)
  const result = newFm + '\n' + cleanedBody + '\n'

  if (result !== original) {
    fs.writeFileSync(file, result)
    cleaned++
  }
}

console.log(`Cleaned ${cleaned} file(s).`)
