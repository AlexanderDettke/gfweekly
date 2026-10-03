Geprüft: 31c, Commit 833bbad, 8 Dateien

1. [mittel] Alter Benachrichtigungswunsch bleibt nach gescheitertem Zielwechsel erhalten  
Fundstelle: `site/assets/core.js:848`  
Was passiert: Schlägt `einwurf_vorschlag` nach einem Zielwechsel fehl, bleibt `S.ben` aus dem vorherigen Vorschlag erhalten. Stand dort „sofort“, sendet „Übernehmen“ diesen Wert auch für das neue Vorhaben. Das Backend behandelt ihn als ausdrücklich gewählt und erzeugt einen Ticker.  
Warum falsch: Abschnitt 31c verlangt eine prüfbare Wahl für den übernommenen Einwurf. Der alte Vorschlag gilt für ein anderes Ziel; die Benachrichtigung kann dadurch ohne erneute Wahl sofort erfolgen.  
Vorschlag: Beim Zielwechsel `S.ben` auf „morgen“ zurücksetzen und nach einem erfolgreichen neuen Vorschlag dessen Wert setzen. Den Fehlerfall mit ursprünglich „sofort“ in der Bedienprobe prüfen.

2. [mittel] Manuelle Zuordnung nach KI Ausfall startet erneut die KI  
Fundstelle: `site/assets/core.js:849`  
Was passiert: Hat `einwurf_add` keinen Vorschlag geliefert, ist `S.ki_fehler` gesetzt. Die Wahl eines Vorhabens ruft deshalb erneut `einwurf_vorschlag` auf. Bei einem weiteren Timeout wartet die Person nochmals bis zu 20 Sekunden.  
Warum falsch: Abschnitt 31c sieht für diesen Fall die Zuordnung von Hand mit anschließendem Verlaufseintrag vor. Dieser Weg sollte auch bei anhaltendem KI Ausfall unmittelbar nutzbar sein.  
Vorschlag: Ohne vorhandenen Vorschlag die manuelle Zielwahl sofort anzeigen und eine erneute KI Prüfung nur über einen eigenen Knopf anbieten.

3. [mittel] Die Bedienproben decken zentrale Fehlerwege des Einwurfs nicht ab  
Fundstelle: `pruefung/bedienung.mjs:342`  
Was passiert: Die 14 Proben verwenden einen erfolgreichen KI Vorschlag und eine erfolgreiche Übernahme. Sie prüfen weder den manuellen Weg ohne Vorschlag noch einen fehlgeschlagenen Zielwechsel, eine veraltete Revision oder den Dialog bei 390 px mit Tastaturbedienung.  
Warum falsch: Gerade der in Abschnitt 31c ausdrücklich geforderte Ausfallweg und die Bedienbarkeit des mobilen Dialogs bleiben durch diese Proben unbelegt.  
Vorschlag: Gezielte abgefangene Antworten für KI Ausfall, Zielwechsel Fehler und 409 ergänzen. Den geöffneten Dialog bei 390 px sowie Fokus und Beschriftungen prüfen. Diese Läufe als Oberflächentests ausweisen.

4. [mittel] Der Abnahmebeleg gehört nicht zum geprüften Commit  
Fundstelle: `pruefung/letzte-abnahme.json:2`  
Was passiert: Der Beleg nennt `db7bde5`. Danach wurden unter anderem `gfModalAuf`, `core.js` und `pruefung/bedienung.mjs` bis `833bbad` geändert. Der dokumentierte Lauf belegt diese Fassung daher nicht.  
Warum falsch: `docs/TECHNIKSTAND.md:683` nennt die Proben als geprüft, ohne die spätere Änderung am Dialog einzugrenzen.  
Vorschlag: Die Oberflächenprüfungen auf `833bbad` erneut ausführen und den Beleg aktualisieren oder den dokumentierten Prüfstand ausdrücklich auf `db7bde5` begrenzen.

## Empfehlungen

1. Im zweiten Schritt „Vorhaben“, „Verlauf“, „Punkte“ und „Benachrichtigung“ in dieser Reihenfolge zeigen. So ist die Wirkung vor „Übernehmen“ schneller erfassbar.
2. Bei einem 409 den Einwurf frisch laden und die erneute Prüfung klar benennen, statt nur die Fehlermeldung im Dialog stehen zu lassen.
3. In der Warteschlange nach jeder Entscheidung den Zähler im Kopf und die Vorhabenseite aktualisieren.
4. Den manuellen Verlaufstext als Pflichtfeld kenntlich machen, sobald kein passender Vorschlag vorliegt.

Browser, Darstellung bei 1440 und 390 px, Datenbankwirkung und Aufräumen der Testdaten konnte ich hier nicht selbst prüfen. Der Code zeigt Passwortprüfung vor den Aktionen, eingeschränkte Tabellenrechte und eine transaktionale Anwendung im Backend; das ist kein Nachweis ihres Liveverhaltens. Die für 31d vorgesehenen Blöcke auf „Für dich“ habe ich nicht als fehlendes 31c Ergebnis gewertet.
