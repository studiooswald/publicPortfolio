#!/usr/bin/env node
/**
 * One-time import of Obsidian notes into the site.
 *
 * Usage:
 *   node scripts/obsidian-import.mjs <folder-of-notes> [--attachments <folder>]
 *
 * For every .md file in <folder-of-notes> (recursively) this script:
 *   - converts [[wikilinks]]        -> plain text (or "[text]" for aliased links)
 *   - converts ![[image.ext]]       -> ![](/media/image.ext) and copies the file
 *                                      from the notes folder or --attachments
 *   - ensures frontmatter exists with title (from filename), date (file mtime),
 *     and draft: true  — so nothing goes live until you review it
 *   - writes the result to src/content/projects/<slugified-name>.md
 *
 * Imported notes are drafts by default: flip `draft: false` (in Pages CMS or
 * the file) to publish each one.
 */

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const source = args[0];
const attachmentsFlag = args.indexOf('--attachments');
const attachmentsDir = attachmentsFlag !== -1 ? args[attachmentsFlag + 1] : null;

if (!source || !fs.existsSync(source)) {
  console.error('Usage: node scripts/obsidian-import.mjs <folder-of-notes> [--attachments <folder>]');
  process.exit(1);
}

const outDir = path.join(process.cwd(), 'src/content/projects');
const mediaDir = path.join(process.cwd(), 'public/media');
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(mediaDir, { recursive: true });

const slugify = (name) =>
  name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name.startsWith('.') ? [] : walk(full);
    return [full];
  });

const files = walk(source);
const notes = files.filter((f) => f.endsWith('.md'));

// Index every non-markdown file by basename so ![[image.png]] can be resolved
const assetIndex = new Map();
for (const f of files.filter((f) => !f.endsWith('.md'))) {
  assetIndex.set(path.basename(f).normalize('NFC'), f);
}
if (attachmentsDir && fs.existsSync(attachmentsDir)) {
  for (const f of walk(attachmentsDir)) {
    assetIndex.set(path.basename(f).normalize('NFC'), f);
  }
}

let imported = 0;
for (const file of notes) {
  const raw = fs.readFileSync(file, 'utf8');
  const name = path.basename(file, '.md');
  const slug = slugify(name);

  // Split off existing frontmatter, if any
  let frontmatter = {};
  let body = raw;
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (fmMatch) {
    body = raw.slice(fmMatch[0].length);
    for (const line of fmMatch[1].split(/\r?\n/)) {
      const kv = line.match(/^([A-Za-z_-]+):\s*(.*)$/);
      if (kv) frontmatter[kv[1]] = kv[2];
    }
  }

  // ![[image.png]] and ![[image.png|400]] -> ![](/media/image.png), copy asset
  body = body.replace(/!\[\[([^\]|]+?)(?:\|[^\]]*)?\]\]/g, (match, target) => {
    const base = path.basename(target.trim()).normalize('NFC');
    const src = assetIndex.get(base);
    if (src) {
      fs.copyFileSync(src, path.join(mediaDir, base));
      return `![](/media/${encodeURI(base)})`;
    }
    console.warn(`  ! asset not found, left as text: ${match} (in ${name})`);
    return `*(missing image: ${base})*`;
  });

  // [[Note|alias]] -> alias, [[Note]] -> Note (plain text; internal targets
  // aren't guaranteed to be public, so no links are generated)
  body = body.replace(/\[\[([^\]|]+?)(?:\|([^\]]*))?\]\]/g, (_, target, alias) =>
    (alias ?? target).trim()
  );

  // Strip Obsidian comments and block IDs
  body = body.replace(/%%[\s\S]*?%%/g, '').replace(/ \^[a-zA-Z0-9-]+$/gm, '');

  const title = frontmatter.title?.replace(/^["']|["']$/g, '') || name;
  const date =
    frontmatter.date || fs.statSync(file).mtime.toISOString().slice(0, 10);
  const description = frontmatter.description?.replace(/^["']|["']$/g, '') || '';

  const out = [
    '---',
    `title: ${JSON.stringify(title)}`,
    description ? `description: ${JSON.stringify(description)}` : null,
    `date: ${date}`,
    frontmatter.cover ? `cover: ${frontmatter.cover}` : null,
    'tags: []',
    'featured: false',
    'draft: true',
    '---',
    '',
    body.trim(),
    '',
  ]
    .filter((line) => line !== null)
    .join('\n');

  fs.writeFileSync(path.join(outDir, `${slug}.md`), out);
  console.log(`  ✓ ${name} -> src/content/projects/${slug}.md`);
  imported++;
}

console.log(`\nImported ${imported} note(s) as drafts.`);
console.log('Review each file, set draft: false to publish, then commit.');
