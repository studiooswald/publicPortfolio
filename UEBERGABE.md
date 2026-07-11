# Übergabe: Portfolio-Site fertigstellen (Claude Code auf dem Mac)

Kontext für die Weiterarbeit im Terminal. Die Site ist fertig gebaut und
liegt auf dem Branch `claude/obsidian-portfolio-site-plan-u4q2yn` — es
fehlen nur noch Setup-Schritte und der Import der Obsidian-Notizen.

## Was schon existiert

- **Astro 5 Static Site**: Startseite mit Projekt-Grid, `/work/`,
  Projekt-Detailseiten, About/Contact, 404, Sitemap, Dark/Light-Mode.
  Build lokal verifiziert (`npm run build`, 8 Seiten).
- **`.pages.yml`**: Pages-CMS-Konfiguration (Collections "Projects" und
  "Pages", Medien in `public/media/`). Editierbar unter app.pagescms.org.
- **`.github/workflows/deploy.yml`**: deployt bei jedem Push auf **`main`**
  zu GitHub Pages. Achtung: triggert NUR auf `main`.
- **`public/CNAME`**: `archive.studiooswald.com`.
- **`scripts/obsidian-import.mjs`**: Import-Skript für Obsidian-Notizen
  (getestet). Konvertiert `[[wikilinks]]` → Text, `![[bild.png|400]]` →
  Markdown-Bild + kopiert die Datei nach `public/media/`, entfernt
  `%% Kommentare %%` und Block-IDs. Alle importierten Notizen landen als
  **`draft: true`** in `src/content/projects/` — nichts geht ungewollt live.
- **PLAN.md** (Architektur) und **README.md** (Setup-Details).

## Offene Aufgaben (in dieser Reihenfolge)

1. **Branch → `main`**: Der Claude-Branch ist aktuell der Default-Branch
   des Repos. Auf GitHub den Branch in `main` umbenennen (Branches-Seite →
   Rename), oder lokal: `git push origin HEAD:main` und dann auf GitHub
   `main` als Default setzen. Erst danach läuft das Deploy-Workflow.
2. **GitHub Pages aktivieren**: Repo → Settings → Pages → Source:
   **GitHub Actions**. Custom Domain: `archive.studiooswald.com`.
   Das Repo muss dafür **public** sein.
3. **DNS**: Beim DNS-Anbieter von studiooswald.com einen Eintrag anlegen:
   `CNAME  archive  studiooswald.github.io` — danach in den
   Pages-Settings "Enforce HTTPS" aktivieren (Zertifikat dauert ein paar
   Minuten).
4. **Obsidian-Notizen importieren** (der eigentliche Grund für den Mac):

   ```sh
   npm install
   node scripts/obsidian-import.mjs \
     "/Users/peteroswald/Library/Mobile Documents/iCloud~md~obsidian/Documents/studio oswald/<ORDNER-MIT-ÖFFENTLICHEN-NOTIZEN>"
   ```

   Vorher mit Peter klären, WELCHER Vault-Ordner bzw. welche Notizen
   öffentlich werden sollen — niemals den ganzen Vault importieren.
   Optional `--attachments <ordner>`, falls Bilder in einem separaten
   Anhänge-Ordner liegen.
5. **Drafts reviewen**: Importierte Dateien in `src/content/projects/`
   prüfen, Frontmatter ergänzen (`description`, `cover`, `tags`,
   `featured`), pro Notiz `draft: false` setzen, wenn sie live gehen soll.
   Die drei `sample-project-*.md` Platzhalter löschen, sobald echte
   Projekte da sind. Texte in `src/content/pages/about.md` und
   `contact.md` ersetzen.
6. **Committen & pushen** → Deploy prüfen (Actions-Tab), Site unter
   https://archive.studiooswald.com testen.
7. Danach kann alles Weitere über **Pages CMS** (app.pagescms.org,
   GitHub-Login) im Browser gepflegt werden — jeder Save deployt neu.

## Nützliche Befehle

```sh
npm run dev       # lokale Vorschau: http://localhost:4321
npm run build     # Produktions-Build nach dist/
```
