#!/usr/bin/env node
// One-time migration: remove ### section headers, #hashtags, --- dividers from vault bodies
import fs from 'fs'
import path from 'path'

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

function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!m) return { fmBlock: '', body: text }
  return { fmBlock: m[0], body: text.slice(m[0].length) }
}

function cleanBody(body) {
  return body
    // Remove ### Section: headers and all content until next section or end
    .replace(/^### (Material|Frame|Reference|Shown in|Publication Text):[\s\S]*?(?=^### |\Z)/gm, '')
    // Remove remaining ### Section: lines (catches any left over)
    .replace(/^###.+$/gm, '')
    // Remove #hashtag lines (like #BodyOfWork, #shadow-gap-frame, etc.)
    .replace(/^#[A-Za-z][A-Za-z0-9_-]*(\s+#[A-Za-z][A-Za-z0-9_-]*)*\s*$/gm, '')
    // Remove --- horizontal rules
    .replace(/^---\s*$/gm, '')
    // Remove exhibition wikilinks [[NN - ...]]
    .replace(/^-?\s*\[\[\d{2}\s*[-–][^\]]+\]\]\s*$/gm, '')
    // Collapse multiple blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

let changed = 0
for (const file of walk(VAULT)) {
  const original = fs.readFileSync(file, 'utf8')
  const { fmBlock, body } = parseFrontmatter(original)

  const cleaned = cleanBody(body)
  const result = fmBlock + (cleaned ? '\n' + cleaned + '\n' : '\n')

  if (result !== original) {
    fs.writeFileSync(file, result)
    changed++
    console.log(`  ${path.relative(VAULT, file)}`)
  }
}

console.log(`\nCleaned ${changed} vault file(s).`)
