# Studio Oswald — portfolio

Public portfolio site for [studiooswald.com](https://studiooswald.com),
built with [Astro](https://astro.build), edited with
[Pages CMS](https://pagescms.org), hosted on GitHub Pages at
**https://archive.studiooswald.com**.

See [PLAN.md](PLAN.md) for the full architecture.

## One-time setup (do these once)

1. **Merge this branch to `main`** — deploys run from `main`.
2. **Enable GitHub Pages**: repo → Settings → Pages → *Build and
   deployment* → Source: **GitHub Actions**.
3. **Custom domain**: on the same Pages settings screen, set custom domain
   to `archive.studiooswald.com`, and at your DNS provider add:

   ```
   CNAME   archive   studiooswald.github.io
   ```

   Once the certificate is issued (usually minutes), tick **Enforce HTTPS**.
4. **Pages CMS**: go to [app.pagescms.org](https://app.pagescms.org), sign
   in with GitHub, grant it access to this repo — it picks up the
   `.pages.yml` config automatically. You can now add/edit projects from
   any browser; every save auto-deploys.

> Note: GitHub Pages on a free plan requires this repository to be
> **public**. If it must stay private, deploy to Cloudflare Pages or
> Netlify instead (Pages CMS keeps working either way).

## Importing notes from the Obsidian vault

On your Mac, from a clone of this repo:

```sh
npm install
node scripts/obsidian-import.mjs \
  "/Users/peteroswald/Library/Mobile Documents/iCloud~md~obsidian/Documents/studio oswald/<folder-with-public-notes>"
```

The script converts `[[wikilinks]]` and `![[image embeds]]`, copies images
into `public/media/`, and writes each note to `src/content/projects/` as a
**draft** — nothing is published until you set `draft: false` on a note
(in the file or in Pages CMS). Review, then commit and push.

Pass `--attachments <folder>` if your vault keeps images in a separate
attachments folder.

## Editing content

- **Pages CMS** (easiest): [app.pagescms.org](https://app.pagescms.org) —
  Projects and Pages collections, media library, works on your phone.
- **Directly**: Markdown files in `src/content/projects/` and
  `src/content/pages/`; images in `public/media/`.

Project frontmatter: `title`, `description`, `date`, `cover`, `tags`,
`featured` (shows on the home page), `draft` (hides from the site).

## Local development

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # production build to dist/
```
