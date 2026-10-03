Geprüft: 31e, Commit 3f04c4c, 11 Dateien im Commit.

1. [mittel] Korrigierter Abgleichtext ist noch nicht aktiv  
Fundstelle: `docs/ABGLEICH-VORHABEN.md:3`  
Was passiert: Der eingerichtete Cowork Auftrag verwendet weiterhin den alten Text. Der Ausschluss der Einwurfadresse, die eigene Suche für XCeed Berichte und `hh_vorhaben_quelle` sind nur dokumentiert. Das bestätigen auch `docs/TECHNIKSTAND.md:702` und `FRAGEN_FUER_MORGEN.md:7`.  
Warum falsch: Die Antworten auf Runde 1, Befunde 2, 3 und 5, sind damit am laufenden Auftrag noch nicht wirksam. Abschnitt 31e verlangt einen Abgleich mit nachgewiesener Wirkung; der belegte Lauf um 20:18 Uhr prüft ausdrücklich nur den früheren Text.  
Vorschlag: Den eingerichteten Auftrag ersetzen und danach einen Lauf mit Einwurfmail, XCeed Bericht und Quellenmarke prüfen. Bis dahin die Korrekturen als offen führen. Die Antwort aus Runde 2 kennzeichnet diese Grenze zutreffend.

2. [mittel] Weitergeleitete Einwurfmail kann vor der Prüfung im Verlauf landen  
Fundstelle: `docs/ABGLEICH-VORHABEN.md:34`  
Was passiert: Quelle B liest alle gesendeten Mails von Alex. Eine Weiterleitung an `alex+einwurf@wildemoehre.org` liegt auch im Ordner „Gesendet“ und kann dort einen bestätigten Verlaufseintrag erzeugen. Quelle D legt dieselbe Weiterleitung als zu prüfenden Einwurf ab. Für Lea gilt dieselbe Lücke durch `docs/ABGLEICH-VORHABEN.md:54`.  
Warum falsch: Der Ausschluss in Quelle C behebt nur den Eingang. Ein Einwurf kann weiterhin vor seiner Freigabe als bestätigt erscheinen. Die unterschiedlichen `source_ref` verhindern das nicht.  
Vorschlag: Einwurfadressen auch in Quelle B für beide Personen ausschließen und den Fall mit einer tatsächlich weitergeleiteten Mail prüfen.

3. [mittel] Standformular verwirft weitere Änderungen ohne Hinweis  
Fundstelle: `site/vorhaben.html:409`  
Was passiert: Beim Übernehmen eines Standvorschlags bleiben Titel, Wer und Frist bearbeitbar. Der Speicherzweig in `site/vorhaben.html:426` sendet aber ausschließlich den Stand und meldet anschließend „Stand übernommen“. Änderungen an den anderen sichtbaren Feldern gehen verloren.  
Warum falsch: Die Oberfläche vermittelt, dass das ganze Punktformular gespeichert wird. Gerade bei der Prüfung eines Abgleichvorschlags können Alex oder Lea zugleich die Zuständigkeit oder Frist berichtigen. Die Bedienprobe in `pruefung/bedienung.mjs:279` prüft diesen Fall nicht.  
Vorschlag: Im Vorschlagsmodus nur den Stand bearbeitbar zeigen oder die übrigen Änderungen mit gesehenen Ausgangswerten in derselben Transaktion speichern.

4. [leicht] README beschreibt das Passwort am falschen Ort  
Fundstelle: `README.md:19`  
Was passiert: Dort steht, die Edge Function enthalte das Zugangspasswort. Im Code wird es aus `GFWEEKLY_PASSWORD` in der Umgebung gelesen (`supabase/functions/gfweekly/index.ts:3`).  
Warum falsch: Die Aussage widerspricht dem Quelltext und kann bei der Wartung zu einem falschen Umgang mit dem Geheimnis führen.  
Vorschlag: Dokumentieren, dass die Function das Passwort aus einem Secret liest.

## Empfehlungen

1. Vorschläge des Abgleichs künftig mit Punkt ID und vorgeschlagenem Wert als getrennte Felder speichern. Das würde die Auswertung des Freitexts in `site/vorhaben.html:400` entbehrlich machen.
2. Für `hh_vorhaben_quelle` zwei gleichzeitige Schreibaufrufe gegen das echte Backend prüfen. Die Zeilensperre ist im Code vorhanden, ihre Wirkung bei parallelen Läufen wurde laut Antwort aus Runde 2 nicht live geprüft.
3. In Quelle C2 Absender und Berichtsart prüfen, bevor Zahlen als bestätigter XCeed Verlauf übernommen werden. Die Suche nach der Empfängeradresse allein belegt die Herkunft nicht.
4. Die Wirkungsprobe um einen positiven Standvorschlag samt erneutem Aufruf ergänzen. Der vorhandene automatische Test prüft dafür nur einen bereits entschiedenen Eintrag; die Antwort aus Runde 2 nennt eine getrennte Live Prüfung.

Die Datenbank, den Cowork Zeitplan, die XCeed Quellen und die Darstellung bei 1440 und 390 Pixeln konnte ich hier nicht selbst prüfen. Die dokumentierten Live Ergebnisse sind daher Belege aus den Antworten, keine von mir wiederholten Prüfungen. Ich habe nur gelesen und nichts geändert.