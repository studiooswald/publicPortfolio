#!/usr/bin/env node
import sharp from '../node_modules/sharp/lib/index.js'
import fs from 'fs'
import path from 'path'

const imgDir = path.join(process.cwd(), 'content/Image Database')
const MAX = 2000

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
  const full = path.join(dir, e.name)
  return e.isDirectory() ? walk(full) : [full]
})

let count = 0
let skipped = 0
for (const fp of walk(imgDir).filter(f => /\.(jpe?g|png)$/i.test(f))) {
  const stat = fs.statSync(fp)
  if (stat.size < 300_000) { skipped++; continue }
  try {
    const buf = await sharp(fp).rotate()
      .resize(MAX, MAX, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer()
    if (buf && buf.length < stat.size) {
      fs.writeFileSync(fp, buf)
      count++
    }
  } catch (e) {
    console.error(`  SKIP ${path.basename(fp)}: ${e.message}`)
  }
}
console.log(`  Compressed ${count} image(s), skipped ${skipped} small.`)
