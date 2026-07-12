#!/bin/zsh
# Sync Body of Work from Obsidian vault to Quartz content folder, then push.
set -e

VAULT="$HOME/Library/Mobile Documents/iCloud~md~obsidian/Documents/studio oswald"
QUARTZ="$(cd "$(dirname "$0")" && pwd)"

echo "→ Syncing notes..."
rsync -a --delete \
  --exclude=".obsidian" \
  --exclude="*.canvas" \
  --exclude="index.md" \
  "$VAULT/Body of Work/" \
  "$QUARTZ/content/"

echo "→ Syncing images..."
rsync -a --delete \
  "$VAULT/Image Database/" \
  "$QUARTZ/content/Image Database/"

echo "→ Compressing images..."
node --input-type=module << 'JSEOF'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const sharp = require('sharp')
import fs from 'fs'
import path from 'path'

const imgDir = path.join(process.cwd(), 'content/Image Database')
const MAX = 2000

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
  const full = path.join(dir, e.name)
  return e.isDirectory() ? walk(full) : [full]
})

let count = 0
for (const fp of walk(imgDir).filter(f => /\.(jpe?g|png)$/i.test(f))) {
  const stat = fs.statSync(fp)
  if (stat.size < 300_000) continue  // already small enough
  const buf = await sharp(fp).rotate()
    .resize(MAX, MAX, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer().catch(() => null)
  if (buf && buf.length < stat.size) { fs.writeFileSync(fp, buf); count++ }
}
console.log(`  Compressed ${count} image(s).`)
JSEOF

echo "→ Cleaning up Obsidian-specific sections..."
node "$QUARTZ/scripts/cleanup.mjs"

echo "→ Committing..."
git -C "$QUARTZ" add -A
git -C "$QUARTZ" diff --cached --quiet && echo "Nothing changed." && exit 0
git -C "$QUARTZ" commit -m "sync $(date '+%Y-%m-%d %H:%M')"
git -C "$QUARTZ" push origin main

echo "✓ Done — GitHub Actions builds the site in ~2 min."
