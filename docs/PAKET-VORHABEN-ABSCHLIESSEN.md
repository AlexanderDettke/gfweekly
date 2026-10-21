# Paket · Vorhaben abschließen (Erledigt-Logik) · Stand 21.10.2026

Auftraggeber: Alex. Entschieden, direkt umsetzen, keine zusätzlichen Freigabeschleifen.
Repo: ~/Documents/GitHub/gfweekly · Live: https://kompass.wildehabitate.de/vorhaben.html
Supabase: bnfmupnmqyrcltrphfak · Edge Function: gfweekly

## Anlass

Vorhaben lassen sich in der Oberfläche nicht schließen. Beispiel XCeed Ticketing-Vertrag: Vertrag abgeschlossen, Vorhaben stand trotzdem als „überfällig“ (Frist 13.10.). Bis heute wurde kein einziges Vorhaben auf erledigt gesetzt, weil es keinen Knopf gibt. XCeed wurde am 21.10. per SQL von Cowork auf status=erledigt gesetzt, mit Verlaufseintrag (art entscheidung, created_by cowork). Es dient als Testfall für „Erledigte zeigen“ und „Wieder öffnen“.

## Was schon da ist (geprüft 21.10.)

hh_vorhaben.status kennt aktiv | pausiert | erledigt | archiviert (Check-Constraint). Edge-Aktion vorhaben_save nimmt status an (VH_STATUS, VH_FELDER), Schreiben nur mit by Alex oder Lea, optional expect/expect_ball. vorhaben_list liefert nur aktiv und pausiert, außer status:'alle'. vorhaben_get liest ohne Statusfilter. Sicht hh_vorhaben_lage setzt zustand 'ueberfaellig' nur bei status 'aktiv'. vorhaben.html (Inline-Skript, ca. 53 KB) zeigt eine Marke für pausiert, hat aber keinen Bedienweg für status. hh_vorhaben_verlauf.art erlaubt u. a. entscheidung und system. gfweekly_topics hat vorhaben_id und archived.

## Ziel

Alex oder Lea schließen ein Vorhaben mit zwei Fingertipps am Handy, sehen danach, was erledigt ist, und können es wieder öffnen. Nichts verschwindet spurlos.

## Bau

A · Backend
1. Datenbankfunktion hh_vorhaben_abschliessen(p_id uuid, p_by text, p_ergebnis text, p_punkte_mit boolean, p_themen_mit boolean, p_expect timestamptz default null) als eine Transaktion: status erledigt, updated_by, Verlaufseintrag (art entscheidung, status bestaetigt, text „Erledigt: <Ergebnis>“, wer p_by, created_by 'hohes-haus'), bei p_punkte_mit offene hh_vorhaben_punkte auf erledigt mit erledigt_at/erledigt_by, bei p_themen_mit verknüpfte gfweekly_topics archived=true. Rückgabe: Anzahl abgehakter Punkte und archivierter Themen, damit das Rückgängig exakt diese zurücksetzt.
2. Gegenstück hh_vorhaben_wiedereroeffnen(p_id, p_by, p_rueckgaengig jsonb default null): status aktiv, Verlaufseintrag „Wieder geöffnet“; mit p_rueckgaengig setzt es genau die beim Abschluss geänderten Punkte und Themen zurück.
3. Edge-Aktionen vorhaben_abschliessen und vorhaben_wiedereroeffnen in gfweekly, gleiche Rechteprüfung wie vorhaben_save (nur Alex, Lea). vorhaben_list zusätzlich mit status:'erledigt' (nur erledigte, letzte 90 Tage zuerst, sortiert nach updated_at absteigend).
4. Migration ins Repo mit Fernhistorie-Kennung wie bei V31, per MCP oder CLI anwenden.

B · Oberfläche vorhaben.html
1. Akte, Kopfzeile neben „Übergeben“: Knopf „✓ Erledigt“. Tippen öffnet ein kleines Blatt (am Handy von unten): Feld „Ergebnis in einem Satz“ (vorbelegt leer, Platzhalter „z. B. Vertrag unterschrieben am …“, optional), Haken „offene Punkte (n) mit abhaken“ (an, nur sichtbar wenn n>0), Haken „verknüpfte Themen im Board (n) archivieren“ (AUS, nur sichtbar wenn n>0; Grund: XCeed hat 11 verknüpfte Themen, die teils weiterlaufen), Knopf „Abschließen“.
2. Danach: Akte schließt, Karte verschwindet aus Woche/Board/Liste, Hinweis unten 10 s „XCeed Ticketing-Vertrag erledigt · Rückgängig“. Rückgängig ruft vorhaben_wiedereroeffnen mit den Rückgabewerten.
3. Menü „⋯“ in der Akte: Pausieren / Fortsetzen (setzt pausiert bzw. aktiv über vorhaben_save) und Archivieren (status archiviert, mit Rückfrage).
4. Filter um „Erledigt“ ergänzen (neben den bestehenden). Zeigt erledigte Vorhaben gedämpft mit Datum und Ergebnis-Satz. Akte eines erledigten Vorhabens: Kopf „Erledigt am …“, Felder nur lesend, Knopf „Wieder öffnen“.
5. Liste: am Zeilenanfang ein Kreis zum schnellen Abschließen, öffnet dasselbe Blatt.
6. Für dich / Startseite / Abzeichen: erledigte Vorhaben zählen nirgends mehr als offen oder überfällig. Prüfen, dass vorhaben_badge, vorhaben_seit und Abwesenheitslogik weiter nur aktiv/pausiert lesen (laut Code schon so).
7. Assets-Version hochzählen, Optik nach dem bestehenden Designsystem der Seite, keine neuen Farben.

C · Nicht anfassen
Abgleich-Aufträge (abgleich-alex, Leas Lauf) schreiben weiter nur Verlauf; erledigte Vorhaben fallen über vhKontext ohnehin heraus. Keine Änderung an Board-Themen außer über den Haken.

## Prüfen vor Push

Mit XCeed: im Filter „Erledigt“ sichtbar, Wieder öffnen → erscheint als aktiv und überfällig, erneut Abschließen ohne Themen-Haken → 11 Themen bleiben offen, Rückgängig stellt exakt her. Am Ende XCeed wieder auf erledigt lassen. Handybreite 390 px, keine Konsole-Fehler. Ein Testvorhaben anlegen und mit Punkten und Themen-Haken abschließen, Rückgängig prüfen, Testvorhaben danach löschen.

## Abschluss

Committen, pushen (Netlify baut kompass.wildehabitate.de). Technikstand im Repo nachtragen (docs). Meldung an Alex kurz: was er tun muss, was er wissen muss.
