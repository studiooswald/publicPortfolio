# Plan: Public portfolio site from the Studio Oswald Obsidian vault

**Goal:** A public portfolio at a subdomain of `studiooswald.com`, built from
Markdown notes that originate in the Obsidian vault
(`iCloud … /Documents/studio oswald`), hosted for free on GitHub Pages, and
editable in the browser via [Pages CMS](https://pagescms.org).

---

## 1. Recommended architecture

```
Obsidian vault (Mac, iCloud)          GitHub repo (this one)                Web
┌──────────────────────────┐   push   ┌───────────────────────┐   deploy   ┌──────────────────────────────┐
│ "Public" folder of notes │ ───────► │ src/content/*.md      │ ─────────► │ portfolio.studiooswald.com   │
│ (or one-time export)     │          │ + Astro site          │  (GitHub   │ (GitHub Pages, free, HTTPS)  │
└──────────────────────────┘          │ + .pages.yml          │  Actions)  └──────────────────────────────┘
                                      └───────────▲───────────┘
                                                  │ edit in browser
                                            Pages CMS (app.pagescms.org)
```

- **Static site generator: [Astro](https://astro.build).**
  It consumes plain Markdown with frontmatter (exactly what Obsidian
  produces), has first-class image optimization for a design-heavy
  portfolio, ships zero JS by default (fast), and is one of the frameworks
  Pages CMS documents explicitly. Alternative considered: **Quartz 4**,
  which publishes an Obsidian vault verbatim (wikilinks, graph view,
  backlinks) — great for a "digital garden", but it looks like a wiki, not
  a studio portfolio. Recommendation: **Astro** with a curated, designed
  portfolio layout; Quartz only if you want the whole vault published as-is.

- **CMS: Pages CMS.** No server, no database — it's a free hosted UI
  (app.pagescms.org) that you log into with GitHub. It reads a `.pages.yml`
  config from this repo and gives you a friendly editor for the Markdown
  files and media. Every save is a git commit, which triggers a redeploy.
  You can edit from any device, including your phone.

- **Hosting: GitHub Pages** via a GitHub Actions workflow. Free, HTTPS,
  custom-domain support, no extra accounts. (Cloudflare Pages / Netlify
  would also work, but GitHub Pages keeps everything in one place, which
  is what you asked for.)

## 2. Domain: subdomain, not subpath

GitHub Pages can serve a **subdomain** (e.g. `portfolio.studiooswald.com`)
with one DNS record. A true sub**path** (`studiooswald.com/portfolio`) is
only possible if whatever hosts the main studiooswald.com site can proxy
that path — GitHub Pages can't be mounted into another host's path by DNS
alone.

**Recommendation:** `portfolio.studiooswald.com` (or `work.` / `notes.` —
your call). Setup:

1. Site repo contains a `CNAME`/custom-domain setting for the subdomain.
2. In your DNS provider, add: `CNAME  portfolio  studiooswald.github.io`
3. Enable "Enforce HTTPS" in the repo's Pages settings (automatic cert).

## 3. Content model

```
src/content/
  projects/            ← one .md per portfolio project
    project-name.md      frontmatter: title, description, date, cover,
                         tags, gallery, draft
  pages/               ← about.md, contact.md, colophon.md …
public/media/          ← images & files (managed by Pages CMS)
```

Site structure:

- **Home** — intro + grid of featured projects (cover images)
- **/work/** — all projects, filterable by tag
- **/work/[slug]/** — project detail page (images, text, metadata)
- **/about/**, **/contact/** — simple pages
- RSS feed, sitemap, OpenGraph images for sharing

## 4. Getting the Obsidian vault content in

This session runs in the cloud, so it can't read the vault on your Mac.
Two options, and they're not mutually exclusive:

- **Option A — one-time import, then Pages CMS is the editor (simplest).**
  Copy the notes you want public into the repo once (drag-and-drop on
  github.com, or `git clone` + copy on your Mac). From then on you edit
  through Pages CMS (or git). The vault stays your private workspace.

- **Option B — keep Obsidian as the editor (automated).**
  Install the free **obsidian-git** plugin in Obsidian and point it at this
  repo, syncing only a designated `Public/` folder of the vault into
  `src/content/`. A small build-time script converts Obsidian syntax.

**Obsidian → web conversion** (needed in both options, handled by a script
+ remark plugins in the build):

- `[[wikilinks]]` → real links (or plain text if the target isn't public)
- `![[image.png]]` embeds → standard Markdown images; attachments copied
  to `public/media/`
- Frontmatter defaults filled in (title from filename, date from file)
- Only files with `publish: true` (or inside the public folder) ever build
  — nothing private can leak by accident.

## 5. Build phases

1. **Scaffold** — Astro project, base layout, typography, responsive
   project grid + detail template, dark/light support, placeholder content.
2. **Pages CMS** — `.pages.yml` describing the `projects` and `pages`
   collections and the media folder; verify editing at app.pagescms.org.
3. **Deploy** — GitHub Actions workflow → GitHub Pages; custom domain +
   DNS instructions; enforce HTTPS.
4. **Content import** — you provide the public notes (Option A or B);
   wikilink/embed conversion script; migrate images.
5. **Polish** — SEO meta, OG images, RSS, sitemap, 404, favicon,
   performance pass.

Phases 1–3 need nothing from you and produce a live placeholder site.
Phase 4 is where your actual vault content lands.

## 6. What I need from you (decisions)

1. **Subdomain name** — `portfolio.studiooswald.com`? (`work.`, `notes.`,
   something else?) And where is studiooswald.com's DNS managed, so I can
   give exact record instructions?
2. **Curated portfolio (Astro, recommended) or publish-the-vault digital
   garden (Quartz)?**
3. **Which part of the vault is public** — a folder name, a tag, or a list
   of notes? (Also: is English the site language?)
4. **Repo visibility** — GitHub Pages on a free plan requires the repo to
   be **public**. If the repo must stay private, hosting moves to
   Cloudflare Pages/Netlify (still free, still works with Pages CMS).

## 7. Costs & accounts

- GitHub Pages: free (public repo)
- Pages CMS: free, sign in with GitHub, one-click repo access
- Domain: you already own studiooswald.com — one CNAME record
- No servers, no databases, nothing to maintain
