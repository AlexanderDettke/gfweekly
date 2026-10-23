# Webapp Standard in dieser Webapp

**Status: Pilot zur Erprobung.** Angewendet wird der Webapp Standard `WEBAPP-PILOT-0.2` (34 Regeln, 22 Testfälle) aus der Organisationsstandards-Bibliothek 0.5.0. Er ist keine allgemein beschlossene Regel. Dieser Auftrag (21.10.2026, Alexander) erweitert seinen Anwendungsbereich ausdrücklich auf die gesamte Webapp; eine Übertragung auf andere Projekte oder eine Regelannahme folgt daraus nicht.

| Datei | Inhalt |
| --- | --- |
| [PROJEKTPROFIL.md](PROJEKTPROFIL.md) | Ziel, Ausgangsstand, Umfang, Rollen, Daten, Umgebung, Freigaben, Rückweg (P-01) |
| [FUNKTIONSINVENTAR.md](FUNKTIONSINVENTAR.md) | Alle 25 Seiten mit 430 Fähigkeiten, verborgenen Zugängen, Speicherwirkung, dazu die Änderungen dieses Piloten (P-02) |
| [REGELZUORDNUNG.md](REGELZUORDNUNG.md) | Bibliotheksstandards und alle 34 Regeln: anwendbar, bedingt, nicht zutreffend; Umsetzung, Abweichungen (G.1, G.3) |
| [PRUEFMATRIX.md](PRUEFMATRIX.md) | Alle 22 Testfälle mit Vorgehen, Ergebnis, Beleg und Grenze, Ausgangs- und Endmessung (G.2) |
| [ARBEITSSTAND.md](ARBEITSSTAND.md) | Fortschritt, offene Punkte, nächster Schritt, Testaufgaben und Rückmeldevorlage für Alexander (G.4) |
| `belege/` | Messergebnisse von `pruefung/webstandard-pruefung.mjs` vorher und nachher |
| `bilder/` | Vergleichsbilder vorher und nachher, synthetische Testdaten |

Die Bibliothek liegt geprüft unter `organisationsstandards/` (Fassung `0.5.0-55e526d2ad79`, Nachweis `organisationsstandards/AKTUELL.json`).

## Lokal ansehen und prüfen

```sh
# Sichtbare Vorschau in Chrome mit Testdaten, Speichern nur simuliert
PLAYWRIGHT_MODUL=<pfad>/node_modules/playwright/index.mjs node pruefung/vorschau.mjs
# Vorschau ohne Backend-Wirkung: dieselbe Testumgebung wie die Prüfungen (abgefangene Edge Function, synthetische Daten)
PLAYWRIGHT_MODUL=<pfad>/node_modules/playwright/index.mjs node pruefung/webstandard-pruefung.mjs /tmp/ws.json
# Gesamte Abnahme einschließlich Webstandard-Prüfung
PLAYWRIGHT_MODUL=… TS_BASIS=… ./pruefung/abnahme.sh /tmp/hh-schirme
```

Die Seite selbst ist statisch (`site/`, kein Build). Mit echtem Passwort zeigt jede lokale Auslieferung von `site/` die echten Daten; dafür ist dieser Pilot nicht freigegeben.

## Stand in fünf Kategorien

| Kategorie | Stand |
| --- | --- |
| Umgesetzt | Ja, auf `main` seit `9eab0ca` (vorher Branch `paket/webstandard-pilot`) |
| Technisch geprüft | Ja, an der Oberfläche mit abgefangener Edge Function; Werte und Grenzen in PRUEFMATRIX.md |
| Unabhängig geprüft | Teilweise. Drei Runden Codex-Gegenprüfung (`871965c`, `5c1bb06`, `596aed7`) mit 9, 8 und 5 Befunden, alle bestätigt und behoben. Die Korrekturen nach Runde 3 sind nicht mehr unabhängig gegengeprüft; keine unabhängige Abnahme (ARBEITSSTAND.md, Review) |
| Veröffentlicht | Ja. Nach Zusammenführung mit `main` `8d9e804` (Kompass, Vorstandsbüro, Neuigkeiten) und Asset-Version `?v=38` von Alexander als `9eab0ca` nach `main` gepusht; Netlify liefert aus. Live-Prüfung vom 23.10.2026 in ARBEITSSTAND.md |
| Fachlich angenommen | Nein. Steht aus (Testaufgaben in ARBEITSSTAND.md) |
