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

## Meta-Planung Stufe 2 (V10, 13.09.2026)
Startseite liest Zyklus, Rituale und Meilensteine aus Supabase (`gfweekly_cycle_phases`, `gfweekly_cycle_transitions`, `gfweekly_rituals`, `gfweekly_ritual_checks`, `gfweekly_strands`, `gfweekly_milestones`). Rituale sind je Jahr abhakbar, Meilensteine in der Seite pflegbar und auf der Jahresleiste sichtbar (Jahr umschaltbar). Edge-Function-Actions: `cycle_get`, `ritual_toggle`, `ritual_save`, `ritual_delete`, `milestones_list`, `milestone_save`, `milestone_delete`.

## V11 (13.09.2026): Board, Bildwelt, Lebendigkeit
`site/board.html` = Themen als Board oder Kacheln, Spalten nach Ablauf (Zu besprechen · In Klärung · Entschieden · Erledigt), Prio, Zeitraum oder Person; Verschieben per Drag & Drop ändert das jeweils passende Feld (`board_lane`+`status`, `priority`, `next_suggested`, `owner`), 5 s Rückgängig; Detail-Panel rechts. `cockpit.html` bleibt die Liste (Unternavigation Board · Kacheln · Liste). Die Inbox ist kein Zwischenschritt mehr: `capture`/`capture_many` legen direkt Themen in „Zu besprechen" an, alte Inbox-Einträge wurden migriert, `inbox.html` ist nur noch Archiv ohne Navigationseintrag. Sechs Low-Poly-Grafiken in `site/assets/img/` (WebP, ≤ 120 kB): Tor (Login), Ankunft (Start), Kiste im Regen (Eingabe), Lager (Check-in), Bühne im Herbst (Wichtige Seiten), Lagerfeuer (Themen). Lange Texte klappen ab ~220 Zeichen ein (`gfClamp`). Bewegung nach Design System (ht-rise, 120/200/400 ms, prefers-reduced-motion).

## V12 (14.09.2026): Kopfzeile, Bilder, Wichtige Seiten
Kopfzeile in zwei festen Zeilen (Marke + Dunkel/Hell + Person „Alex | Lea“; darunter Navigation als Tab-Leiste, rechts die Unternavigation der Themen). Grafiken stehen frei im Bild (2,4:1 bzw. 3:1), ohne Scrim und ohne Text darauf; Titelzeile darunter. Login-Tor: Bild links, Karte rechts. Wichtige Seiten mit Vorschaubildern (`site/assets/previews/*.webp`, Pfad in `gfweekly_sites.preview`) und drei Ansichten: Kacheln, Liste, Schnellstart. Assets werden versioniert geladen (`?v=13`), HTML/CSS/JS mit `must-revalidate`; bei jeder Änderung an core.js/styles.css die Nummer in allen HTML-Köpfen hochzählen.

## V13 (14.09.2026): Besprechungsmodus, Entscheidungslog, Wochenmail
Im Board „Besprechung starten“: Sitzung mit Timer und Teilnehmenden, Agenda aus „Zu besprechen“ und „In Klärung“ (hoch zuerst), je Thema Entscheidung, nächster Schritt und Verantwortung erfassen und mit einem Klick als Entschieden, In Klärung, Erledigt, Vertagt oder nur besprochen ablegen. Jede Entscheidung landet im Log (`gfweekly_decisions`), die Sitzung mit Protokolltext in `gfweekly_sessions`. „Beenden · Protokoll“ zeigt das Protokoll zum Kopieren oder als Mail-Entwurf. Neue Seite `site/entscheidungen.html` (Unternavigation der Themen): Entscheidungslog nach Monaten, nachtragbar und editierbar; Protokolle der Besprechungen; „Wochenmail erzeugen“ baut einen Entwurf aus Entscheidungen der Woche, offenen Prioritäten, Meilensteinen und nächstem Übergang. Karten haben einen ⇄-Knopf zum Verschieben per Menü (Touch, Tastatur). Edge-Function-Actions: `session_start`, `session_end`, `sessions_list`, `session_delete`, `decision_add`, `decision_update`, `decisions_list`, `decision_delete`.

## V14 (14.09.2026): Easter Eggs
`site/assets/eggs.js` (auf allen Seiten geladen, ohne Ton, respektiert prefers-reduced-motion): fünfmal schnell auf die Fahne klicken → Konfetti in Habitate-Farben, der Besprechungs-Timer zeigt kurz „Pause?“; leere Agenda in einer Besprechung → ein Bus fährt unten über die Seite („tuut“); zwischen 23 und 5 Uhr funkeln Sterne über dem Login-Tor, Untertitel „eigentlich Feierabend“; irgendwo „möhre“ tippen → die Fahne wird kurz zur Möhre, Kennzahlen zählen runter und wieder hoch; alle Rituale der aktuellen Phase abgehakt → Abzeichen „Phase gemeistert“ mit flackerndem Feuer bei Hover; 20. bis 23. August → Wimpelkette an der Fahne, Begrüßung „Heute ist Möhre.“ Zum Testen: `?egg=fest|nacht|bus|konfetti|moehre`.

## V15 (14.09.2026): Verlässlich speichern, Bereinigen, Check-in als Vorbereitung
Detail-Panel im Board: Felder speichern sich selbst (1,5 s nach dem Tippen, beim Verlassen eines Feldes, beim Schließen des Panels, beim Wechsel des Tabs), Status „Gespeichert 13:05“ im Fuß. Spaltenknöpfe und „heute besprochen“ nehmen getippte Texte mit, statt das Panel neu zu zeichnen (das war die Ursache für „Speichern gedrückt, trotzdem weg“). Panel-Höhe iPhone-sicher (`100dvh`, Safe Area). „Bereinigen“ im Panel und „Aufräumen“ in der Board-Leiste: `gfTidyTopic` (core.js) erkennt Marker im Titel und Kontext („Titel:“, „Worum geht es:“, „Warum ins Weekly:“, „Stand:“, „Vorschlag:“, „Nächster Schritt:“, „Verantwortlich:“, „Entscheidung:“, „Quelle:“ …) und schlägt eine Aufteilung in Titel, Ein Satz, Kontext, Nächster Schritt, Verantwortung, Entscheidung und Notizen vor; Vorher/Nachher je Feld, rechts editierbar, „Übernehmen“ speichert. „KI-Vorschlag“ lässt Claude den Text aufteilen (Action `tidy_suggest`, Secret `ANTHROPIC_API_KEY`, Modell über `GFWEEKLY_TIDY_MODEL`, Standard `claude-sonnet-5`). Die Edge Function (v20) zerlegt neue Eingaben aus dem ChatGPT-Kanal (`capture`, `capture_many`) sofort mit derselben Logik; der Rohtext bleibt in den Notizen. `checkin.html` ist jetzt die Vorbereitung auf das Weekly: Agenda in der Reihenfolge des Besprechungsmodus, Neu seit der letzten Besprechung, Termine der Woche und Überfälliges, länger als vier Wochen Offenes, Entschiedenes mit laufendem nächstem Schritt, letzte Besprechung, „Besprechung starten“, „Agenda kopieren“. Die alten Felder Relevanz und Empfehlung spielen dort keine Rolle mehr.

## Backend
Tabellen `gfweekly_topics`, `gfweekly_inbox`, `gfweekly_people`, `gfweekly_links`, `gfweekly_protocol_requests`, `gfweekly_assets`, `gfweekly_sites`, `gfweekly_site_categories`, `gfweekly_sessions`, `gfweekly_decisions`, dazu die Meta-Planungs-Tabellen aus V10.
