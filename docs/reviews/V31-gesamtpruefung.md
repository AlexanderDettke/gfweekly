Geprüft: Gesamtprüfung V31, Commit 3f04c4c, 83 Dateien

1. [schwer] „Sofort“ kann den ungeprüften Rohtext veröffentlichen  
Fundstelle: `supabase/migrations/20261003174603_hh_vorhaben_v31a_runde3.sql`:175  
Was passiert: Wird der Verlauf im Einwurf abgewählt, aber „sofort“ gewählt, entsteht trotzdem ein Ticker. Dessen Titel und Inhalt stammen dann aus dem Rohtext des Einwurfs.  
Warum falsch: Die abgewählte Information gelangt so doch in `gfweekly_news`. Das widerspricht der Auswahl einzelner Änderungen und der Vertraulichkeitsregel aus 31a und 31c. Der Wortfilter erkennt zudem nicht jeden privaten Inhalt.  
Vorschlag: Einen sofortigen Ticker nur aus einem ausdrücklich geprüften und übernommenen Verlaufstext erzeugen. Ohne ausgewählten Verlauf „sofort“ sperren oder einen gesonderten, sichtbaren Nachrichtentext bestätigen lassen.

2. [mittel] Der Schichtwechsel kann fremde Bälle weitergeben  
Fundstelle: `supabase/functions/gfweekly/index.ts`:3036  
Was passiert: `schicht_uebergabe` prüft `by === von` und den gesehenen Ball, aber nicht, ob der Ball des Vorhabens bei `von` liegt. Ein Aufruf kann deshalb etwa Leas Ball als „Schichtwechsel Alex“ bewegen.  
Warum falsch: 31a beschreibt die Übergabe der abgebenden Person. Ein korrektes `expect_ball` verhindert einen Konflikt, begrenzt aber nicht, wessen Vorhaben übergeben werden darf.  
Vorschlag: Unter derselben Zeilensperre wie beim Ballwechsel prüfen, dass der bisherige Ball zur abgebenden Person gehört. Gemeinsame Bälle nur nach einer ausdrücklich definierten Regel zulassen.

3. [mittel] Die neue Vorhabenübergabe verlangt kein verlässliches `by`  
Fundstelle: `supabase/functions/gfweekly/index.ts`:1995  
Was passiert: `handover_set` und `handover_set_many` übernehmen bei fehlendem `by` den globalen Wert `WHO` und akzeptieren sonst beliebigen Text. Die Datenbank schreibt diesen Wert in Vorhabenverlauf und Übergabeprotokoll.  
Warum falsch: 31a verlangt bei schreibenden Aktionen ein verpflichtendes, auf Alex oder Lea normiertes `by`. Die Oberfläche sendet einen Wert, der Endpunkt erzwingt ihn jedoch nicht.  
Vorschlag: Für diese Aktionen `vhBy(t)` verwenden und fehlende oder fremde Werte mit 400 ablehnen.

4. [mittel] „Im Morgenbericht“ erreicht den Morgenbericht nicht  
Fundstelle: `FRAGEN_FUER_MORGEN.md`:14  
Was passiert: Die Auswahl „im Morgenbericht“ erzeugt keinen Eintrag für den täglichen Bericht. Laut dokumentiertem Stand liest dessen Cowork Auftrag den Vorhabenverlauf noch nicht.  
Warum falsch: 31c stellt die Wahl als Zeitpunkt dar, zu dem die andere Person davon erfährt. Tatsächlich muss sie „Seit du zuletzt da warst“ selbst öffnen. Das ist für Leas Übergabe am 13.10. relevant.  
Vorschlag: Den täglichen Auftrag vor der Übergabe um bestätigte Vorhabenbewegungen ergänzen oder die Auswahl bis dahin wahrheitsgemäß als „In Für dich sichtbar“ beschriften.

5. [mittel] Der überarbeitete Abgleichauftrag ist noch nicht aktiv  
Fundstelle: `docs/ABGLEICH-VORHABEN.md`:3  
Was passiert: Die Korrekturen für die Einwurf Adresse, XCeed Berichte und `hh_vorhaben_quelle` stehen nur im Dokument. Der eingerichtete Cowork Auftrag verwendet laut Dokumentation weiter den alten Text; Leas Lauf muss ebenfalls noch eingerichtet werden.  
Warum falsch: Der belegte Lauf vom 03.10. bestätigt damit nicht die Wirkung der aktuellen Abgleichregeln aus 31e. Doppelte Mailerfassung und fehlende Berichte bleiben möglich.  
Vorschlag: Beide Aufträge vor dem 13.10. auf den dokumentierten Text bringen und je einen Lauf samt `source_ref` und Quellenstand prüfen. Bis dahin den Abgleich als teilweise eingerichtet ausweisen.

6. [mittel] Das geforderte Live Durchspiel an XCeed ist nicht abgeschlossen  
Fundstelle: `FRAGEN_FUER_MORGEN.md`:9  
Was passiert: Der Einwurf „Telefonat mit Victor: Auszahlung ab Monat 1 schriftlich bis Montag“ wurde erkannt, aber am Testvorhaben übernommen. In der XCeed Akte wurde er nicht eingetragen.  
Warum falsch: Die Abnahme V31, Punkt 3, fordert dieses Durchspiel am Live Stand. Der Test belegt den technischen Weg, aber nicht dessen Ergebnis in der vorgesehenen Akte. Die Zurückhaltung bei einer unbestätigten Zusage ist sachgerecht; die Abnahme muss deshalb offen bleiben.  
Vorschlag: Die Aussage fachlich von Alex bestätigen lassen, dann den Einwurf an XCeed durchführen und Verlauf sowie Punktwirkung prüfen. Falls die Aussage nicht stimmt, den Abnahmeschritt ausdrücklich als geändert dokumentieren.

7. [mittel] Die Wirkungsprobe hinterlässt Testbestand  
Fundstelle: `pruefung/vorhaben-probe.mjs`:242  
Was passiert: Am Ende werden zwei Testvorhaben archiviert; beendete Testabwesenheiten bleiben bis zum nächsten Lauf bestehen.  
Warum falsch: „Abnahme V31“, Punkt 2, verlangt, dass die Probe aufräumt. Die Dokumentation nennt die Reste offen, sie erfüllt damit aber die formulierte Bedingung nicht vollständig.  
Vorschlag: Am Ende gezielt alle mit der Laufkennung erzeugten Datensätze löschen und danach prüfen, dass keine Testvorhaben, Einwürfe, Ticker oder Testabwesenheiten dieses Laufs übrig sind.

## Empfehlungen

1. Für `handover_set_many` eine gemeinsame Datenbanktransaktion vorsehen. Derzeit können einzelne Zeilen gespeichert werden, bevor eine spätere scheitert; die Oberfläche erklärt den Teilstand, aber die Übergabe bleibt währenddessen uneinheitlich.
2. Die Abnahmeübersicht um eine kurze Tabelle „Code geprüft, live geprüft, offen“ je Hauptweg ergänzen. Das würde den historischen Live Beleg vom aktuellen Stand klar trennen.
3. Bei der Übergabe eine Abschlussansicht mit allen noch offenen Korbzeilen zeigen, einschließlich Themen und Kandidaten. Der jetzige Dialog verweist für den Rest auf eine andere Seite.
4. Die KI Eingabe auf für die Zuordnung nötige Felder begrenzen. Insbesondere `wer` an jedem offenen Punkt sollte nur mitgesendet werden, wenn die Zuordnung diesen Wert braucht.

## Gestaltung und Bedienung

1. In der Wochenkarte den nächsten Schritt vor dem Stand zeigen und den Stand auf eine kurze, aufklappbare Zeile begrenzen.
2. Im Kopf jedes Vorhabens eine feste Kurzzeile „Ball bei … · nächster Schritt … · bis …“ anzeigen, in Woche, Board und Akte gleich.
3. Für Leas Übergabe einen Filter „Vor dem 14.10. entscheiden“ anbieten, der offene Korbzeilen und Vorhaben mit Frist während des Urlaubs zusammenführt.
4. In „Seit du zuletzt da warst“ Ballwechsel zuerst zeigen; andere Bewegungen je Vorhaben zusammenfassen.

Grenze der Prüfung: Ich konnte weder Browser noch Datenbank erreichen. Darstellung bei 1440 und 390 px, tatsächliche Datenbankwirkung, Deployment und die dokumentierten Live Durchspiele sind daher nicht unabhängig verifiziert. Die gespeicherte Prüfsumme in `pruefung/letzte-abnahme.json` stimmt mit dem aktuellen Inhalt der geprüften Dateien überein; das belegt die Zuordnung des vorhandenen Oberflächentests zum Dateistand, keine Live Abnahme.