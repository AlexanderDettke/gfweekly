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
| Umgesetzt | Ja, auf Branch `paket/webstandard-pilot` (siehe ARBEITSSTAND.md) |
| Technisch geprüft | Ja, an der Oberfläche mit abgefangener Edge Function; Werte und Grenzen in PRUEFMATRIX.md |
| Unabhängig geprüft | Gegenprüfung durch Codex läuft in Runden; Stand, geprüfter Commit und Ergebnis in ARBEITSSTAND.md, Abschnitt Review. Erst ein dort dokumentierter Lauf ohne offene Befunde zählt als unabhängig geprüft |
| Veröffentlicht | Nein. Kein Push nach `main`, kein Deploy |
| Fachlich angenommen | Nein. Steht aus (Testaufgaben in ARBEITSSTAND.md) |
