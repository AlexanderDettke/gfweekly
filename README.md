# GF Weekly

Internes Cockpit der Geschäftsleitung Wilde Möhre (Alex, Lea). Live: https://gfweekly.netlify.app

## Aufbau
- `site/` – statische Seite, wird von Netlify veröffentlicht (Projekt „gfweekly", Site-ID e5a94704-6693-4558-abca-5be5f7e3ab22). Kein Build, Vanilla JS.
  - `index.html` Start (Jahreszyklus, wichtigste Themen, Rituale, Schnellzugriff)
  - `seiten.html` Wichtige Seiten (Seitenverzeichnis mit Zugangsdaten)
  - `cockpit.html` Themen-Cockpit · `checkin.html` · `capture.html` · `inbox.html` · `bearbeiten.html`
  - `assets/core.js` gemeinsamer Kern (API, Login-Gate, Navigation, Theme) · `assets/styles.css` Design
  - `_headers` Sicherheits-Header
- `supabase/functions/gfweekly/index.ts` – Edge Function (Supabase-Projekt bnfmupnmqyrcltrphfak). Enthält das Zugangspasswort, gehört deshalb nie in `site/`.
- `netlify.toml` – veröffentlicht nur `site/`.

## Design
Seit V9 (12.09.2026) nach dem Design System „Wilde Habitate" (Claude Design d8550ead-911c-4134-8036-38fc87ae4b99; Quelle: `festivalplanung-2027/docs/spiel/design-export/tokens`). Tokens stehen am Anfang von `site/assets/styles.css`; die bisherigen GF-Weekly-Namen (`--ink`, `--brand`, `--line` …) sind darauf gebrückt. Dunkel ist Standard, Hell über `[data-theme="light"]`. Regeln: Archivo, fünf Schriftstufen, Abstände 4/8/12/16/24/32/48, Schatten nur bei angehobenen Karten, keine Pillen, keine Farb-Emoji.

V9.1 (13.09.2026) legt die Optik des Design Systems „Modernist" (Claude Design 9f0f400a-5e4c-4bd9-9fad-875538d709d2) darüber — als reine Token-Änderung, keine Komponentenregel wurde angefasst:

- Radien **0** statt 4/6/8 (`--radius-s/m/l`). Kreise bleiben rund: Fortschrittsring und LED-Punkte sind Kreise, keine gerundeten Ecken.
- Abschnittslinien **2 px** statt 1 px (`--rahmen`) — greift auf Topbar, Protokollleiste und Abschnittsköpfe.
- Bauteilrahmen in `--border-strong` statt `--border` (`--line`), damit die Struktur sichtbar wird, ohne jedes Bauteil auf 2 px aufzublasen.
- Beschriftungen bündig links, auch im Login-Gate.

Farbrollen, Dunkelmodus und Statusfarben bleiben unverändert Habitate. Modernists roter Akzent (#ec3013) wurde **bewusst nicht** übernommen: er kollidiert mit `--crit` („ausgefallen"), das im Cockpit dieselbe Farbe als Signal trägt. Die vier Diagrammfarben `--chart-teal/-peach/-coral/-grid` sind aus der Habitate-Quelle nachgezogen und stehen für spätere Kennzahl-Visualisierungen bereit.

## Deploy
Repo: <https://github.com/AlexanderDettke/gfweekly> (privat — `supabase/functions/gfweekly/index.ts` enthält das Zugangspasswort und gehört nie in `site/`).

**Continuous Deployment ist eingerichtet** (13.09.2026). Netlify baut aus dem Git-Repo: Branch `main`, Build command leer, Publish directory `site` (aus `netlify.toml`). Jeder Push auf `main` deployt automatisch; ein Lauf dauert rund eine Minute. Kontrolle im Deploy-Datensatz über `commit_ref` und `branch` — Git-Deploys tragen den Commit-Hash, manuelle Uploads nicht.

Manuell deployen (Notfall, oder wenn CD einmal klemmt): Der Netlify-MCP-Connector (`deploy-site`) deployt nicht selbst, sondern liefert einen fertigen `npx @netlify/mcp`-Befehl mit eingebettetem Auth-Token. Der läuft **nicht-interaktiv** — anders als `netlify login` und `netlify init`, die auf Browser-Klicks warten. Voraussetzung ist Node, das auf dem Arbeitsrechner fehlt; ein Tarball von nodejs.org nach `~/` oder in ein temporäres Verzeichnis genügt (kein `sudo`). Ohne jedes Werkzeug geht auch ein Netlify-Drop des Ordners `site/`.

Die Seite wird **ohne Zugangskontrolle ausgeliefert** (`requiresPassword: false`): HTML, CSS und `core.js` kann jeder abrufen, der die URL kennt — `noindex` hält nur Suchmaschinen fern. Die Daten liegen dagegen vollständig hinter dem Passwort der Edge Function. Wer auch das Frontend verbergen will, kann auf dem Pro-Plan Netlifys Passwortschutz auf Seitenebene aktivieren (Project configuration → Visitor access); dann sind es zwei Passwörter hintereinander.

## Backend
Tabellen `gfweekly_topics`, `gfweekly_inbox`, `gfweekly_people`, `gfweekly_links`, `gfweekly_protocol_requests`, `gfweekly_assets`, `gfweekly_sites`, `gfweekly_site_categories`. Zugriff ausschließlich über die Edge Function (Passwort-Gate, service_role).
