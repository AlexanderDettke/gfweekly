Geprüft: 31c, Commit 3f04c4c, 11 Dateien

1. [schwer] Einwurf kann neuere Änderungen überschreiben  
Fundstelle: `supabase/migrations/20261003174603_hh_vorhaben_v31a_runde3.sql:118`  
Was passiert: Beim Übernehmen eines vorgeschlagenen Punktstands wird der aktuelle Stand unter einer Zeilensperre gelesen, aber nicht mit dem Stand verglichen, auf dessen Grundlage der Vorschlag entstand. Dasselbe gilt für den nächsten Schritt und die Frist in Zeile 159 bis 171. Ändert Lea eines dieser Felder, während Alex den Einwurf prüft, kann Alex mit dem älteren Vorschlag Leas Änderung überschreiben. Nur für den Ball gibt es eine solche Prüfung.  
Warum falsch: Abschnitt 31c lässt Änderungen erst nach Prüfung übernehmen. Die vorhandenen Speicherfunktionen unterstützen bereits den Vergleich gesehener Werte; der Einwurf nutzt ihn hier nicht. So kann ein bestätigter Einwurf einen inzwischen neueren Arbeitsstand beseitigen.  
Vorschlag: Die Ausgangswerte der vorgeschlagenen Felder speichern und beim Anwenden unter der bestehenden Sperre vergleichen. Bei Abweichung mit 409 abbrechen und den aktuellen Stand im Dialog zeigen. Eine Wirkungsprobe mit zwei aufeinanderfolgenden Änderungen ergänzen.

2. [mittel] „Im Morgenbericht“ verspricht eine nicht angeschlossene Benachrichtigung  
Fundstelle: `site/assets/core.js:812`  
Was passiert: Der Dialog sagt, die andere Person erfahre es „im Morgenbericht“. Bei dieser Wahl speichert `hh_einwurf_apply` lediglich den Einwurf und erzeugt keinen Ticker. `FRAGEN_FUER_MORGEN.md:14` hält ausdrücklich fest, dass der tägliche Cowork Auftrag den Vorhabenverlauf noch nicht liest.  
Warum falsch: Die in Abschnitt 31c verlangte Wahl beschreibt für Alex und Lea eine Wirkung, die derzeit nicht eintritt. Der Eintrag ist nur über „Seit du zuletzt da warst“ auffindbar.  
Vorschlag: Bis zur Anbindung „in Für dich sichtbar“ anzeigen. Für die Bezeichnung „im Morgenbericht“ den täglichen Auftrag tatsächlich an den Vorhabenverlauf anschließen und die Zustellung prüfen.

3. [mittel] Dialogstart hat keinen Ladezustand  
Fundstelle: `site/assets/core.js:755`  
Was passiert: `gfModalAuf` macht den Seiteninhalt sofort inaktiv. Danach wartet `gfEinwurf` in Zeile 758 auf `vorhaben_list`; erst `render()` in Zeile 821 öffnet und füllt den Dialog. Während die Anfrage läuft, gibt es weder sichtbaren Dialog noch Ladehinweis oder erreichbaren Abbruchknopf. `gfApi` setzt hierfür keine Zeitgrenze.  
Warum falsch: Abschnitt 31c verlangt einen benutzbaren Dialog; der Prüfauftrag nennt Ladezustände ausdrücklich. Bei einer langsamen oder hängenden Anfrage wirkt die Seite blockiert.  
Vorschlag: Den Dialog vor der Anfrage mit Ladehinweis und Schließen Knopf öffnen oder die Seite erst nach erfolgreichem Laden inaktiv setzen. Diesen Zwischenzustand in der Oberflächenprobe prüfen.

4. [leicht] Technikstand zählt eine Probe zu viel  
Fundstelle: `docs/TECHNIKSTAND.md:685`  
Was passiert: Für den Einwurf werden 23 Oberflächenproben genannt. Im Abschnitt `pruefung/bedienung.mjs:443` bis `523` stehen 22 Aufrufe von `pruefe`.  
Warum falsch: Die dokumentierte Prüfzahl stimmt nicht mit dem Code überein.  
Vorschlag: Zahl berichtigen oder die fehlende Probe konkret ergänzen.

Die Antworten aus Runde 1 und 2 zu Zielwechsel, bewusst geleertem Verlaufstext, Assetversion und gezielter Neuladung stimmen mit dem aktuellen Code überein. Die inhaltsgebundene Prüfsumme in `pruefung/letzte-abnahme.json` stimmt ebenfalls mit dem aktuell berechneten Wert überein. Das belegt keinen eigenen Prüflauf in dieser Runde.

## Empfehlungen

1. Auch Vorschläge aus dem Mail Abgleich mit einer Revision oder einer Prüfsumme des angezeigten Inhalts versehen. Die Datenbank prüft eine Revision derzeit nur, wenn der Vorschlag eine enthält.
2. Nach einem 409 die inzwischen geänderten Feldwerte neben dem Vorschlag zeigen. Dann ist vor der erneuten Übernahme erkennbar, welche Entscheidung noch offen ist.

Browserdarstellung bei 1440 und 390 px, Tastatur und Bildschirmleser sowie die tatsächliche Datenbankwirkung und das Aufräumen der Wirkungsprobe konnte ich hier nicht selbst prüfen.