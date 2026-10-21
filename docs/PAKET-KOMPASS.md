# Paket Kompass · Umbenennung „Das Hohe Haus“ → „Kompass“ (21.10.2026)

Auftrag Alex (20.10.2026): Das Hohe Haus heißt jetzt Kompass, Adresse https://kompass.wildehabitate.de/. Name, Favicon und alles Offene anpassen.
Branch `paket/kompass` (von `origin/main` 8586fd4), vorbereitet in Cowork im Zweitklon `~/gfweekly` (dort kein Push-Zugang; die Terminal-Sitzung holt den Branch lokal). Technische Schlüssel bleiben gfweekly (Repo, Netlify-Site e5a94704-…, Tabellen gfweekly_*, Edge Functions).

## Stand, getrennt

Umgesetzt und live (ohne Deploy, 21.10.):
- Werkzeugregister Hub (`hub.werkzeuge` b6de8edc-…): Name und Kurzname „Kompass“, url https://kompass.wildehabitate.de, bild_url auf die neue Domain, Zweck mit „vormals Das Hohe Haus“.
- Wichtige Seiten (`gfweekly_sites` 45511288-…): Name „Kompass“, url https://kompass.wildehabitate.de/.
- Cowork-Aufträge umbenannt: „Kompass · Neuigkeiten täglich“ (trig_01A6gnSNUDbvF4bhW3wzhGL2), „Kompass · Vorhaben-Abgleich (Alex)“ (trig_017sWYismXdBdhUoyb1jwxLM). Prompts unverändert.
- Domain, HTTPS, Netlify-Hauptdomain und Rücksprungziel für die Anmeldung: Codex, 18.10.2026 (Arbeitsradar habitat-subdomains-20261018-01a14ba4).

Vorbereitet auf dem Branch (nicht deployt):
- Neue Bildmarke Kompass (Low-Poly-Kompassrose, Gold, Rot, Creme): `site/assets/img/kompass.svg` (groß) und `kompass-klein.svg` (für 16 und 32 px vereinfacht), daraus favicon-32.png, favicon-512.png, favicon.ico (16/32), icon-192.png, icon-180.png (deckend auf --bg), img/kompass-144.png und kompass-288.png. og-image.png neu (zeigte noch „GF Weekly“). Die Strohburg (burg-*.png) bleibt als Datei liegen.
- Name in allen 25 Seiten: `<title>Kompass · …`, og:title, Login-Karte, `GF_APP_NAME="Kompass"` (Seitenleiste und Kopfzeile), Manifest (name, short_name „Kompass“), Fußzeilen von Agenda, Protokoll und Wochenmail mit kompass.wildehabitate.de.
- Marke in Seitenleiste und Login: kompass-144/288.png statt burg-*.png.
- Texte: „im Hohen Haus“ → „im Kompass“, „ins Hohe Haus“ → „in den Kompass“, „im Haus“ (gemeint: das Werkzeug) → „im Kompass“; „Eure eigenen Rollen im Haus“ (Organisation, gemeint ist das Unternehmen) bleibt.
- Edge Functions gfweekly, besetzung (HH_BASIS = https://kompass.wildehabitate.de, Asana-Notizen, Fehlermeldungen), arbeiten, saison, organisation (nur Kopfkommentare). komm-logik.js und komm-regelwerk.json in beiden Kopien byte-gleich geändert (docs/referenz/postingplan mitgezogen).
- Assets `?v=35` auf allen Seiten (vorher 34).
- Prüfungen nachgezogen: launch-test.mjs (Satz „als Notiz im Kompass“), testdaten.mjs (Eintrag Kompass).

Geprüft in Cowork (21.10.): launch-test 154 in Ordnung, komm-test 70 ok, Wächter nur mit dem erwarteten Frischebefund (Beleg gehört zum alten Stand). matrix-test lief lokal nicht (typescript fehlt in der Umgebung, unabhängig von diesem Paket). Schirme und Bedienung nicht gelaufen (kein Playwright auf dem Rechner-Klon).

## Für die Terminal-Sitzung

```
cd ~/Documents/GitHub/gfweekly && git fetch ~/gfweekly paket/kompass:paket/kompass && claude "Lies docs/PAKET-KOMPASS.md auf dem Branch paket/kompass und führe den Abschnitt Für die Terminal-Sitzung aus"
```

1. `git fetch origin && git status && git log --oneline -5 origin/main`. Branch `paket/kompass` auf den aktuellen main rebasen. Läuft parallel das Paket „Vorhaben abschließen“ (vorhaben.html, gfweekly/index.ts): Konflikte so lösen, dass beide Änderungen bleiben; Asset-Version auf die höhere Zahl plus eins setzen, einheitlich auf allen Seiten.
2. `./pruefung/abnahme.sh` vollständig laufen lassen, `pruefung/letzte-abnahme.json` erneuern (Wächter-Frische), dann `node pruefung/waechter.mjs` ohne Befund.
3. Edge Functions deployen, vorher Live-Stand gegen das Repo vergleichen (falls dazwischen jemand deployt hat): `npx supabase@latest functions deploy gfweekly besetzung arbeiten saison organisation --project-ref bnfmupnmqyrcltrphfak --no-verify-jwt`. Danach `ping` von gfweekly.
4. Nach main mergen und pushen. Live prüfen auf https://kompass.wildehabitate.de/: Tab-Titel „Kompass · Für dich“, Favicon Kompass (Hard-Reload), Seitenleiste mit Kompass-Marke, Login-Karte, Manifest.
5. Technikstand und README um diesen Abschnitt ergänzen.

## Offen außerhalb dieses Repos

- Habitat Hub (Repo habitat-hub, Datenbankfunktionen im Schema hub): `suchindex_stoff` (Suchtreffer-Bezeichnung „Das Hohe Haus“), `ticker_saetze` („Das Protokoll liegt im Hohen Haus.“), `altbestand_uebernehmen` (Texte). Im Hub-Repo als Migration ändern, nicht live per SQL, damit das Repo führend bleibt.
- V35 Anmeldung (Branch `paket/v35-anmeldung`, nur lokal): Redirect-URL `https://kompass.wildehabitate.de/**` in Supabase Auth gehört dazu; Texte dort ebenfalls auf Kompass ziehen.
- Wochenauftrag Team- und Partneranalyse und Vorhaben-Abgleich sprechen im Prompt noch vom „Hohen Haus“ (Adresse im TPA-Auftrag ist schon kompass.wildehabitate.de). Funktional ohne Wirkung; bei der nächsten Prompt-Änderung mitziehen.
- Vorschaubild unter Wichtige Seiten (`previews/gfweekly.webp`) ist alt.
