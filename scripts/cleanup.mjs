#!/usr/bin/env node
// Strip Obsidian-specific sections from Body of Work notes after rsync.
import fs from 'node:fs'
import path from 'node:path'

const contentDir = path.join(process.cwd(), 'content')

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) return walk(full)
    return e.name.endsWith('.md') ? [full] : []
  })

function clean(text) {
  // Preserve frontmatter (between first pair of ---)
  let fm = ''
  let body = text
  const fmMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (fmMatch) {
    fm = fmMatch[0]
    body = text.slice(fmMatch[0].length)
  }

  // Mark section headings then strip each section block
  body = body
    .replace(/^### (Material|Frame|Reference|Shown in|Publication Text):.*$/gm, '§SECTION§')
    .replace(/§SECTION§\n([\s\S]*?)(?=§SECTION§|$)/g, (_, content) => {
      const trimmed = content.trim()
      return trimmed ? trimmed + '\n\n' : ''
    })
    // Strip standalone hashtag lines
    .replace(/^#[A-Za-z][a-zA-Z-]+(\s+#[A-Za-z][a-zA-Z-]+)*\s*$/gm, '')
    // Strip #BodyOfWork
    .replace(/^#BodyOfWork\s*$/gm, '')
    // Strip Instagram lines
    .replace(/^Instagram(-Text)?:.*$/gm, '')
    // Strip lone horizontal rules (not frontmatter)
    .replace(/^---\s*$/gm, '')
    // Collapse excess blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return fm + body + '\n'
}

let cleaned = 0
for (const file of walk(contentDir)) {
  const original = fs.readFileSync(file, 'utf8')
  const result = clean(original)
  if (result !== original) {
    fs.writeFileSync(file, result)
    cleaned++
  }
}

console.log(`Cleaned ${cleaned} file(s).`)
