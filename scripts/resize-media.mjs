#!/usr/bin/env node
// Resize images in public/media/ to max 2000px, quality 82 — run once before commit.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const mediaDir = path.join(process.cwd(), 'public/media');
const MAX = 2000;
const QUALITY = 82;

const files = fs.readdirSync(mediaDir).filter(f =>
  /\.(jpe?g|png)$/i.test(f)
);

let processed = 0;
for (const file of files) {
  const fp = path.join(mediaDir, file);
  const original = fs.statSync(fp).size;
  const ext = path.extname(file).toLowerCase();

  const img = sharp(fp).resize(MAX, MAX, { fit: 'inside', withoutEnlargement: true });
  const buf = ext === '.png'
    ? await img.png({ quality: QUALITY, compressionLevel: 9 }).toBuffer()
    : await img.jpeg({ quality: QUALITY, mozjpeg: true }).toBuffer();

  fs.writeFileSync(fp, buf);
  const saved = Math.round((1 - buf.length / original) * 100);
  console.log(`  ${file.slice(0, 60)}… ${(original/1e6).toFixed(1)}MB → ${(buf.length/1e6).toFixed(1)}MB (${saved}% kleiner)`);
  processed++;
}

console.log(`\n${processed} Bilder komprimiert.`);
