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
Seit V9 (12.09.2026, V10 Meta-Planung Stufe 2 am 13.09.2026) nach dem Design System „Wilde Habitate" (Claude Design d8550ead-911c-4134-8036-38fc87ae4b99; Quelle: `festivalplanung-2027/docs/spiel/design-export/tokens`). Tokens stehen am Anfang von `site/assets/styles.css`; die bisherigen GF-Weekly-Namen (`--ink`, `--brand`, `--line` …) sind darauf gebrückt. Dunkel ist Standard, Hell über `[data-theme="light"]`. Regeln: Archivo, fünf Schriftstufen, Abstände 4/8/12/16/24/32/48, Radien 4/6/8, Rahmen 1 px, Schatten nur bei angehobenen Karten, keine Pillen, keine Farb-Emoji.

## Deploy
Netlify ist (noch) nicht mit diesem Repo verknüpft. Deploy aus dem Repo-Ordner über die Netlify-Anbindung in Claude oder per Netlify-Drop des Ordners `site/`. Sobald das Repo auf GitHub liegt: in Netlify unter Site configuration → Build & deploy → Link repository verknüpfen, dann deployt jeder Push auf `main`.

## Backend
Tabellen `gfweekly_topics`, `gfweekly_inbox`, `gfweekly_people`, `gfweekly_links`, `gfweekly_protocol_requests`, `gfweekly_assets`, `gfweekly_sites`, `gfweekly_site_categories`. Zugriff ausschließlich über die Edge Function (Passwort-Gate, service_role).
