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

echo "→ Syncing images (new only)..."
rsync -a \
  "$VAULT/Image Database/" \
  "$QUARTZ/content/Image Database/"

# Restore already-committed images to their compressed git versions
# (prevents iCloud stubs or uncompressed originals from overwriting what's in git)
git -C "$QUARTZ" restore "content/Image Database/" 2>/dev/null || true

echo "→ Compressing images..."
node "$QUARTZ/scripts/compress.mjs"

echo "→ Cleaning up Obsidian-specific sections..."
node "$QUARTZ/scripts/cleanup.mjs"

echo "→ Committing..."
git -C "$QUARTZ" add -A
git -C "$QUARTZ" diff --cached --quiet && echo "Nothing changed." && exit 0
git -C "$QUARTZ" commit -m "sync $(date '+%Y-%m-%d %H:%M')"
git -C "$QUARTZ" push origin main

echo "✓ Done — GitHub Actions builds the site in ~2 min."
