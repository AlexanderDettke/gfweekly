# Gemeinsamer Webapp Standard: vollständiges Pilotdokument

Version 0.2 vom 20.10.2026. Dokumentkennung `WEBAPP-PILOT-0.2`. Status: zur Erprobung vorgeschlagen. Dieses Dokument ist der vollständige Arbeitsauftrag für die Anpassung einer ausgewählten Seite samt ihrem wesentlichen Bedienablauf, sobald der zugehörige Umsetzungsprompt im Zielprojekt erteilt wird.

## 0. So wird das Dokument verwendet

Dieses Dokument enthält alle Regeln, die Projekterhebung, die Umsetzungsfolge, Testfälle, Abnahmekriterien und Vorlagen für den Abschluss. Die früheren Möhrcato Berichte sind für die Umsetzung nicht erforderlich. Der Zugang zu Möhrcato ist ebenfalls nicht erforderlich. Beispiele beschreiben beobachtete Muster; es werden keine Möhrcato Daten übernommen.

Der Auftrag umfasst einen begrenzten Pilot. Eine komplette Anwendung wird nur dann umfasst, wenn die auftraggebende Person dies ausdrücklich festlegt. Als Standardumfang gilt die ausgewählte Seite mit ihren unmittelbar erforderlichen Details, Formularen, Dialogen und Rückwegen.

Das Zielprojekt wird aus dem ausdrücklichen Auftrag und dem tatsächlich geöffneten Projekt eindeutig bestimmt. Sind mehrere Seiten oder Projekte gleich plausibel, ist genau diese fehlende Zuordnung zu klären. Unabhängige Bestandsaufnahme kann fortgesetzt werden.

Ein verbindliches Regelwerk entsteht erst nach erfolgreichem Pilot und einer ausdrücklich dokumentierten Entscheidung Alexanders. Ein bestandener Build, ein Prüfbericht oder eine optisch fertige Seite bewirken diese Übernahme nicht automatisch.

## 1. Ziel und gemeinsamer Kern

Menschen sollen in verschiedenen Apps vertraute Begriffe, Elemente und Handlungen wiederfinden. Übersicht, Details und nächste Handlung müssen ohne neue Erklärung verständlich werden. Gestaltung, Bedienung und Datenlogik bilden dafür einen gemeinsamen Kern.

**Leitsatz:** Gleiche Bedeutung erhält gleiche Darstellung und gleiches Verhalten. Die Ansicht folgt der Arbeitsaufgabe.

Vorhandene fachliche Funktionen, Inhalte, Rechte, Kennungen, gespeicherte Werte und Integrationen werden erhalten. Eine bewährte Fähigkeit wird nicht entfernt, nur weil ihre Umsetzung im Standard aufwendiger ist. Ein dokumentierter Ersatz muss mindestens dieselbe fachliche Aufgabe erfüllen.

MUSS bezeichnet eine erforderliche Regel innerhalb des beauftragten Piloten, soweit sie anwendbar ist. SOLL bezeichnet den Normalfall; Abweichungen werden mit Grund und Auswirkung dokumentiert. KANN bezeichnet eine optionale Erweiterung. Keine dieser Formulierungen erteilt zusätzliche Freigaben für Produktion, Kosten, neue Dienste, Nachrichten oder andere Projekte. Bereits ausdrücklich erteilte projektspezifische Freigaben werden genutzt und nicht erneut abgefragt.

## 2. Anwendung auf beliebige Projekte

Ein gemeinsamer Standard bedeutet keine Übernahme aller Funktionen von Möhrcato.

| Seitenart | Normalerweise anwendbar | Nur bei tatsächlichem Bedarf |
| --- | --- | --- |
| Informationsseite | Schrift, Farben, Navigation, Lesbarkeit, Rückwege, mobile Darstellung | Anmeldung, Kalender, Sammelaktionen |
| Liste und Detailansicht | Suche, Filter, Zustand, progressive Details, Auswahl und Datenherkunft | Planung, Versand, mehrere Ansichten |
| Formular oder Fachvorgang | Felder, Validierung, Speicherwirkung, Rechte und Rückweg | Mehrfachauswahl, Export |
| Planung | Zeit, Kapazität, Zuordnung, Konflikte, Alternativen zum Ziehen | Öffentliches Infosheet, Vertragsstatus |
| Auswertung | Kennzahlen, Einheiten, Bezugsmenge, Quelle, Aktualität und geeignete Diagramme | Bearbeitung, Planung, Versand |

Jede Regel erhält vor der Umsetzung „anwendbar“, „bedingt anwendbar“ oder „nicht zutreffend“ mit Begründung. Eine vorhandene Funktion darf nicht durch „nicht zutreffend“ aus der Prüfung verschwinden. Nicht im Projekt vorhandene Funktionen werden nicht allein wegen dieses Dokuments neu gebaut.

Die 24 Kernregeln G-01 bis Q-04 werden durch zehn Pilotregeln P-01 bis P-10 ergänzt. Die Ergänzungen konkretisieren die Umsetzung. Projektspezifische Widersprüche werden mit Quelle sichtbar dokumentiert. Konkrete Nutzeranweisungen und tatsächlich geltende Regeln des Zielprojekts bleiben maßgeblich.

Alle Gestaltungswerte sind Entwurfswerte. „Möhrcato Beleg“ kennzeichnet den beobachteten Ausgangspunkt. Neue Anforderungen und Erweiterungen werden ausdrücklich getrennt. Die Appprüfung selbst erfolgt erst im Zielprojekt.


## A. Gestaltung

### G-01 Schriftrollen

Die App MUSS gemeinsame Schriftrollen verwenden. Frei gewählte Einzelgrößen für dieselbe Aufgabe sind zu vermeiden.

| Rolle | Größe / Zeilenhöhe | Gewicht | Verwendung |
| --- | --- | --- | --- |
| Seitentitel | 24 / 32 px | 600 | Einmaliger Titel, wenn zur Orientierung nötig |
| Abschnittstitel | 20 / 28 px | 600 | Größere Inhaltsgruppen |
| Lesetext | 16 / 24 px | 400 | Längere Texte und Erläuterungen |
| Listentitel | 16 / 24 px | 500 | Name des Objekts |
| Navigation | 15 / 22 px | 500 | Hauptnavigation |
| Kompakter Text | 14 / 20 px | 500 | Planung, Feldbezeichnung, Zusatzzeile |
| Kleine Zusatzangabe | 12 / 16 px | 500 | Nur ergänzende, nicht allein entscheidende Information |
| Hervorhebung | Größe der jeweiligen Rolle | 600 | Zustand, wichtige Zahl, Zwischenüberschrift |

Zielschrift ist Proxima Nova. Ihre Nutzung setzt belegte Rechte und verfügbare Schriftschnitte voraus. Work Sans ist die benannte Ersatzschrift, ebenfalls mit vor Einbindung geprüften Nutzungsbedingungen. Bis zur Klärung wird einheitlich die Systemschrift verwendet; ein Prototyp mit Systemschrift gilt nicht als endgültiger Schriftnachweis.

Schriftgrößen MÜSSEN mit der Texteinstellung skalieren. Abschneiden benötigt einen erreichbaren Zugang zum vollständigen Inhalt. Zahlen in Vergleichsspalten SOLLEN rechtsbündig und mit gleich breiten Ziffern erscheinen. Wichtige Feldnamen und Fehlermeldungen dürfen nicht in die kleinste Rolle wandern.

**Möhrcato Beleg:** Proxima Nova, Listentitel 16 px, Navigation 15 px und kompakte Angaben 12 bis 14 px. Größere Zeilenhöhen und die Rollen für lange Texte sind bewusste Vorschläge.

### G-02 Farbrollen und Kontrast

Farbwerte MÜSSEN über benannte Rollen gepflegt werden. Der folgende Satz ist die vorgeschlagene Ausgangsfassung:

| Rolle | Vordergrund | Hintergrund |
| --- | --- | --- |
| Haupttext / Arbeitsfläche | `#15181D` | `#F7F7F7` |
| Zusatztext / Arbeitsfläche | `#5F6268` | `#F7F7F7` |
| Navigation | `#C5C7CC` | `#31333A` |
| Hauptaktion | `#FFFFFF` | `#245680` |
| Information | `#245680` | `#EAF1F8` |
| Erfolg | `#17613A` | `#E6F3EB` |
| Warnung | `#8A4B12` | `#FFF3DC` |
| Fehler | `#A12E32` | `#FBECEE` |
| Fachlicher Sonderzustand | `#60419B` | `#F1EBFA` |

Normale Inhaltsflächen verwenden `#FFFFFF`, neutrale Aktionen `#ECEEF1` mit Haupttext. Funktional notwendige Feldränder verwenden zunächst `#7D838D`. Rein dekorative Trennlinien dürfen heller sein. Auswahl erhält eine helle Fläche und ein zusätzliches Auswahlzeichen. Fokus erhält eine deutlich sichtbare Umrandung, auf dunklen Flächen mit heller Absetzung.

Alle Textpaare der Tabelle wurden rechnerisch geprüft; das schwächste erreicht rund 5,71:1. Der vorgeschlagene Feldrand auf der Arbeitsfläche erreicht rund 3,56:1. Dies gilt nur für diese Farbpaarungen und ist kein Nachweis einer fertig gebauten Oberfläche.

Normaler Text MUSS mindestens 4,5:1 Kontrast erreichen. Für größere Schrift übernehmen wir freiwillig ebenfalls 4,5:1 als einfache gemeinsame Vorgabe. WCAG erlaubt bei großer Schrift teilweise 3:1. Relevante Zustände MÜSSEN zusätzlich durch Text oder Symbol verständlich sein. [W3C: Textkontrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)

Markenfarben und Farben zur Wiedererkennung von Personen, Bereichen oder Projekten sind eigene Rollen. Eine rote Identitätsfarbe ist keine Fehlermeldung. Andere Markenprofile dürfen diese Grundpalette nur über ein dokumentiertes Profil ersetzen; Bedeutung und Kontrastanforderungen bleiben gleich.

**Möhrcato Beleg:** Neutrale Arbeitsfläche und dunkle Navigation. Artistfarben können aus Bildern entstehen. Die bisherigen kleinen grauen Texte sind teilweise kontrastärmer; die neue Tabelle korrigiert das gezielt.

### G-03 Maße, Dichte und Flächen

| Eigenschaft | Gemeinsamer Sollwert |
| --- | --- |
| Abstandsraster | 4, 8, 12, 16, 24, 32 px |
| Hauptnavigation am großen Bildschirm | 220 px breit |
| Kopfleiste | mindestens 56 px hoch |
| Normale Listenzeile | mindestens 72 px hoch |
| Kompakte Listenzeile | mindestens 56 px hoch |
| Bild in normaler / kompakter Zeile | 48 / 32 px |
| Eingaben und eigenständige Knöpfe | mindestens 44 px hoch |
| Eigenständige Aktionsziele | mindestens 44 × 44 px Trefferfläche |
| Rundung Eingabe / Knopf | 6 px |
| Rundung Detailfläche / Dialog | 8 px |
| Abstand zwischen Inhaltsgruppen | 24 px |
| Abstand innerhalb einer Feldgruppe | 8 oder 16 px |

Die Mindesthöhen MÜSSEN bei Textumbruch wachsen. Ein kleines Symbol darf eine größere Trefferfläche besitzen. Zusammenhängende Links im Fließtext bleiben im Textfluss und brauchen keinen künstlichen Knopfrahmen.

Komfortable und kompakte Dichte SOLLEN für lange Arbeitslisten verfügbar sein; Inhalt und Bedeutung bleiben gleich. Die gewählte Dichte ist eine persönliche Ansichtseinstellung. Schmale Ansichten verwenden ausreichend große Ziele. Schatten SOLLEN nur schwebende Ebenen wie Menüs und Dialoge erklären; normale Arbeitsflächen benötigen keinen dekorativen Kartenschatten.

**Möhrcato Beleg:** 220 px Navigation, 68 px normale und 53 px kompakte Zeile. Die vorgeschlagenen 72 und 56 px vereinheitlichen das Raster und schaffen Platz für größere Aktionsziele.

### G-04 Bilder, Symbole und Beschriftung

Personen und Projekte SOLLEN durch ein Bild oder einen konsistenten Platzhalter wiedererkennbar sein. Bilder dürfen nie der einzige Identifikator sein. Gleiche Aktionen MÜSSEN dieselben Symbole und Begriffe verwenden.

„Schließen“, „Zuordnung entfernen“ und „Datensatz löschen“ sind unterschiedliche Aktionen. Ein Kreuz allein DARF NICHT für eine irreversible Löschung verwendet werden. Symbole ohne sichtbaren Text benötigen einen verständlichen zugänglichen Namen und eine Erklärung bei Fokus oder Berührung, wo erforderlich. Ein Tooltip ersetzt keine wichtige Feldbezeichnung.

**Möhrcato Beleg:** Bilder und Initialen in Listen; Entfernen einer Person über das Schichtmenü. Standardbeschriftung dafür: „Person aus dieser Schicht entfernen“.

### G-05 Schmale Ansichten und Vergrößerung

Die App MUSS bei 320, 390 und 1440 CSS Pixeln Breite sowie mit vergrößertem Text bedienbar bleiben. Unter 1024 px wechselt die Hauptnavigation in ein erreichbares Menü. Inhaltliche Bereiche werden untereinander oder als einzelne Arbeitsansicht dargestellt. Diese Schwelle ist eine Entwurfsentscheidung, keine universelle Gerätegrenze.

Es DARF KEINE starre Mindestbreite für die gesamte App geben. Zweidimensionale Kalender und Tabellen dürfen innerhalb ihrer Fläche scrollen, wenn dies fachlich erforderlich ist. Für wesentliche Aufgaben MUSS eine geeignete Listen oder Einzelansicht verfügbar sein. Mobile Planung darf mit „Person auswählen → Schicht auswählen → zuordnen“ arbeiten. [W3C: Umbruch und zweidimensionale Inhalte](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)

**Möhrcato Beleg:** Der untersuchte Bestand besitzt 1024 px Mindestbreite. Die mobile Alternative ist eine neue Anforderung.

### G-06 Bewegung und Rückmeldung

Kurze Rückmeldungen SOLLEN etwa 100 ms, Aufklappen und Menüs etwa 200 ms und größere Wechsel höchstens etwa 300 ms dauern. Diese Werte sind Richtwerte, keine Wartepflicht.

Bewegung MUSS Orientierung unterstützen. Bei gewünschter reduzierter Bewegung werden räumliche Animationen und Schimmern entfernt. Ladezustände halten den Platz des Inhalts möglichst stabil. Nur betroffene Aktionen werden während einer Verarbeitung gesperrt. Dauerhafte Hinweise dürfen nicht ausschließlich als kurz verschwindende Meldung erscheinen.

**Möhrcato Beleg:** Kurze Übergänge und Ladeflächen; Kalenderinteraktionen werden während bestimmter Ladevorgänge gesperrt.

## B. Bedienung

### B-01 Orientierung und Rückwege

Anwendung, Arbeitsbereich, Veranstaltung oder Zeitraum und aktive Ansicht MÜSSEN erkennbar sein. Suche, Filter, Auswahl und Hauptaktionen SOLLEN an wiederkehrenden Stellen liegen.

Ein Wechsel zu einem verknüpften Objekt MUSS den passenden Kontext öffnen. Der Rückweg SOLL Filter, Datum, Auswahl und Listenposition erhalten. Ungespeicherte Eingaben MÜSSEN erhalten bleiben oder vor Verlust geschützt werden.

Die vorhandene fachliche Hierarchie des Zielprojekts bleibt erhalten. Nur wenn dort ausdrücklich das Habitat Modell gilt, bleiben Habitat → Bereiche → Fachbereiche → Aufgaben die vier Flughöhen. Ansichtstypen und Quellen werden nicht als zusätzliche Organisationsebene eingeführt. Fachanwendungen behalten passende Begriffe wie Bühne, Schicht oder Bewerbung.

**Möhrcato Beleg:** „In Schichtplanung öffnen“ führt aus dem Check-In zum richtigen Tag und Bereich.

### B-02 Öffnen, Auswählen und Kontextaktionen

| Handlung | Gemeinsame Bedeutung |
| --- | --- |
| Klick auf Titel oder erkennbare Detailfläche | Objekt öffnen |
| Checkbox | Für Sammelaktionen auswählen |
| Sichtbares Aktionsmenü | Aktionen für genau dieses Objekt |
| Rechtsklick | Zusätzlicher Zugang zu denselben Objektaktionen |
| Ziehen | Zuordnen oder Verschieben, mit eindeutiger Rückmeldung |
| Klick auf Statusaktion | Den benannten fachlichen Übergang auslösen |
| Escape | Vorübergehende Ebene schließen, ohne Datenverlust |

Ein Klick auf Checkbox oder Aktionsmenü DARF NICHT zugleich den Eintrag öffnen oder einen Status ändern. Wichtige Aktionen MÜSSEN ohne Rechtsklick und ohne Ziehen erreichbar sein. Doppelklick darf einen zusätzlichen schnellen Weg bieten, aber keinen einzigen notwendigen Zugang.

**Möhrcato Beleg:** Details in der Liste, Kontextmenüs und separate Mehrfachauswahl. Sichtbare Alternativen werden als gemeinsamer Standard ergänzt.

### B-03 Formulare und Sprache

Felder MÜSSEN eine bleibende Bezeichnung, nötige Einheiten und verständliche Pflichtangaben besitzen. Platzhalter ersetzen keine Bezeichnung. Fehlermeldungen stehen beim Feld und erklären die Korrektur. Eingegebene Werte bleiben bei Fehlern erhalten.

Die Standardsprache ist Deutsch, mit „du“ und „ihr“. Personenbezeichnungen verwenden bevorzugt passende neutrale Begriffe wie „Helfende“, sonst die vereinbarte Form mit Doppelpunkt. Buttons benennen Handlung und Gegenstand: „Schicht erstellen“, „Änderungen speichern“, „An 12 Personen senden“. „OK“ genügt nicht für folgenreiche Aktionen.

Formulare mit zusammengehörigen Änderungen MÜSSEN „Speichern“ und „Abbrechen“ anbieten. „Abbrechen“ verwirft nur die noch nicht gespeicherten Eingaben dieses Vorgangs. Vorgaben dürfen nicht unbemerkt Zustimmung oder Anwesenheit setzen.

**Möhrcato Beleg:** Schichterstellung mit Zeitraum, Slots, optionalem Namen und ausdrücklichem Abschluss.

### B-04 Speichern und fachlich bestätigen

Jede verändernde Aktion MUSS einer sichtbaren Abschlussart folgen:

1. **Sofort speichern:** Für kleine, fachlich reversible Änderungen. Rückmeldung „Wird gespeichert“, „Gespeichert“ oder „Speichern fehlgeschlagen“. Ein passender Korrekturweg bleibt erreichbar.
2. **Formular abschließen:** Zusammengehörige Eingaben werden erst durch den benannten Speicherknopf übernommen.
3. **Fachlich bestätigen:** Ein eigener Übergang mit klarer Bedeutung und Berechtigung. Speichern eines Entwurfs ist keine Bestätigung.
4. **Nach außen wirken:** Versand oder Veröffentlichung zeigen zuvor Ziel, Umfang und Ergebnisvorschau.

Eine vorläufige Anzeige DARF NICHT als erfolgreiche Speicherung ausgegeben werden. Bei einem unklaren Ergebnis MUSS die App zuerst den tatsächlichen Stand prüfen, bevor eine möglicherweise doppelte Aktion erneut ausgeführt wird.

**Möhrcato Beleg:** Artist ablegen speichert einen Entwurf; Bestätigen sperrt den Termin. Dies wurde im ausgelieferten Clientcode nachgewiesen, nicht durch Änderung eines echten Termins.

### B-05 Planung, Zuordnung und Konflikte

Ein zuordenbares Objekt, ein gültiges Ziel und die Wirkung des Ablegens MÜSSEN erkennbar sein. Ohne Ziehen führt ein Dialog oder eine gleichwertige Auswahl zur selben Zuordnung. [W3C: Alternative zu Ziehbewegungen](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)

Vor der wirksamen Zuordnung MÜSSEN Kapazität, relevante Verfügbarkeit, Rechte und fachlich definierte Zeitkonflikte gegen den maßgeblichen Datenstand geprüft werden. Der sichtbare Kalenderausschnitt allein genügt nicht. Konfliktmeldungen nennen Ursache und betroffenen Zeitraum. Überschreiben ist nur bei fachlich erlaubter Ausnahme und entsprechender Berechtigung möglich.

Zeitgrenzen MÜSSEN fachlich definiert werden. Vorschlag: Ende um 12:00 und Beginn um 12:00 gelten ohne gesonderte Pufferregel nicht als Überschneidung. Verfügbarkeit gilt für den gesamten zugeordneten Zeitraum. Erforderliche Pausen oder Umbauzeiten werden ausdrücklich modelliert.

Eine Verschiebesperre, freie Kapazität und Zuordnungsrechte MÜSSEN getrennt behandelt und benannt werden.

**Möhrcato Beleg:** Artists werden in den Kalender, Helfende auf bestehende Schichten mit freien Slots gezogen. Eine gesperrte Schicht kann freie Slots haben. Die gelesene Konfliktprüfung ist begrenzter als die hier vorgeschlagene Anforderung.

### B-06 Sammelaktionen, Versand und Löschung

Mehrfachauswahl MUSS Anzahl und Umfang zeigen. „Alle auswählen“ wird präzisiert, etwa als „Alle 27 gefilterten Treffer auswählen“. Eine nur seitenweise Auswahl wird ausdrücklich benannt. Bei geändertem Filter dürfen unsichtbar ausgewählte Datensätze nicht verschwiegen werden.

Eine Sammelaktion MUSS ihr Gesamtergebnis einschließlich übersprungener und fehlgeschlagener Einträge zeigen. Vor Versand, Veröffentlichung und nicht einfach rücknehmbarer Löschung erscheinen Ziel, Anzahl und Folgen. Routinemäßige reversible Aktionen benötigen keinen zusätzlichen Bestätigungsdialog.

Nachrichten SOLLEN personalisierte Vorschauen, einen Test an die eigene Person und nachvollziehbare Regeln gegen Doppelversand bieten. Eine Löschung ist von der Entfernung einer Zuordnung getrennt.

**Möhrcato Beleg:** Eigener Auswahlbereich, personalisierte Vorschau und Optionen gegen Mehrfachversand.

### B-07 Leere, Fehler, Unterbrechung und Gleichzeitigkeit

Die App MUSS unterscheiden: noch keine Daten, kein Filtertreffer, kein Bereich gewählt, keine Berechtigung, keine Verbindung und Ladefehler.

Meldungen nennen Zustand und nächsten möglichen Schritt. Beispiele: „Keine Treffer. Filter zurücksetzen.“ und „Speichern fehlgeschlagen. Deine Eingaben sind erhalten.“ Nach Unterbrechungen MUSS der Bearbeitungsstand nachvollziehbar sein.

Parallele Änderungen DÜRFEN NICHT unbemerkt fremde Arbeit überschreiben. Die App zeigt einen Konflikt oder führt Änderungen nach einer dokumentierten fachlichen Regel zusammen. Bei offenen Änderungen ist ein bloßes Neuladen keine ausreichende Lösung.

**Möhrcato Beleg:** Ein leerer Kalender durch fehlende Bereichsauswahl und eine leere Kandidatenliste durch Zeitraumfilter wurden als unterschiedliche Fälle beobachtet. Fehler und Gleichzeitigkeit sind neue Prüfanforderungen.

### B-08 Tastatur, Fokus und Dialoge

Alle wesentlichen Aufgaben MÜSSEN ohne Maus ausführbar sein. Die Reihenfolge der Tastaturbedienung folgt der sichtbaren Arbeitsfolge. Fokus ist immer erkennbar und darf nicht durch überlagerte Flächen verschwinden. [W3C: Sichtbarer Fokus](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html)

Ein Dialog erhält einen Titel und passenden Anfangsfokus. Beim Schließen kehrt der Fokus zum auslösenden Element oder einer sinnvollen Nachfolgeposition zurück. Modal geöffnete Dialoge dürfen den Fokus nicht in verdeckte Hintergrundaktionen verlieren. Fehlermeldungen und Speicherergebnisse müssen auch für assistive Bedienung verständlich sein.

**Möhrcato Beleg:** Kontextmenüs und Dialoge sind zentrale Arbeitsformen. Vollständige Tastaturbedienung wurde nicht geprüft; der Standard ergänzt diese Anforderung.

## C. Datendarstellung

### D-01 Ein Objekt und ein führender Pflegeort

Jede Datenart MUSS eine eindeutige Kennung, eine verständliche Bezeichnung und einen führenden Pflegeort haben. Liste, Kalender, Infosheet und Export beziehen sich auf dieselben Datensätze. Kopien und Abzüge werden mit ihrem Stand gekennzeichnet.

Person, Bewerbung, Projekt, Auftritt, Schicht und Zuordnung bleiben unterscheidbar. Ein Mensch kann an mehreren Projekten oder Schichten beteiligt sein. Name allein ist keine sichere Kennung.

**Möhrcato Beleg:** Ein Projekt kann mehrere Auftritte haben, eine Person mehrere Schichten. Das beschreibt den beobachteten fachlichen Zusammenhang, keine vollständige Datenbankanalyse.

### D-02 Zustände getrennt führen

| Dimension | Beispielwerte | Darf nicht damit gleichgesetzt werden |
| --- | --- | --- |
| Bearbeitungsmerkmal | gelesen, favorisiert | fachliche Zusage |
| Vereinbarung | in Verhandlung, Konditionen bestätigt | Vertrag unterzeichnet |
| Vertrag | gesendet, unterzeichnet | Auftritt geplant |
| Termin | Entwurf, bestätigt | Veröffentlichung |
| Kommunikation | vorbereitet, gesendet | tatsächlich gelesen |
| Kapazität | 2 von 3 besetzt | Anwesenheit |
| Person anwesend | ja, nein, noch ungeklärt | Schicht begonnen |
| Schichtleistung | offen, begonnen, abgeschlossen, nicht erschienen | allgemeine Anwesenheit |

Für jede Dimension MÜSSEN Bedeutung, erlaubte Übergänge, berechtigte Rolle und Korrekturweg beschrieben sein. „Nicht erschienen“ ist eine bewusste Feststellung und kein automatisches Synonym für „noch nicht eingecheckt“. Eine Sperre benennt die geschützte Handlung.

**Möhrcato Beleg:** Allgemeine Anwesenheit, Check-In und Check-Out sind getrennte Vorgänge.

### D-03 Werte, Mengen und Zeit

1. Datum: TT.MM.JJJJ; Uhrzeit: 24 Stunden. Vorgabe für den deutschsprachigen Pilot: Europe/Berlin. Eine im Zielprojekt maßgebliche andere Zeitzone wird ausdrücklich im Projektprofil festgelegt und dort angezeigt, wo sie die Interpretation beeinflusst.
2. Über Mitternacht: beide Tage zeigen, etwa „21.08., 22:00 bis 22.08., 02:00“. Bei Zeitumstellungen müssen tatsächliche Dauer und angezeigte Uhrzeit eindeutig bleiben.
3. Zahlen: deutsche Darstellung, etwa „1.250,50 €“. Einheiten stehen am Wert oder eindeutig am Spaltenkopf.
4. Mengen: „2 von 3 besetzt · 1 frei“. Der Nenner und die Bedeutung der Menge bleiben sichtbar.
5. Fehlende Werte: „Nicht erfasst“, „Unbekannt“ oder „Nicht zutreffend“. Der Wert 0 darf nicht als leer erscheinen.
6. Planung und Wirklichkeit: „Geplant 10:00“ und „Begonnen 10:15“ getrennt anzeigen. Eine Korrektur erhält Herkunft und Zeitpunkt.
7. Summen nennen Bezugsmenge, Filter und gegebenenfalls Rundung. Prozentwerte nennen ihren Nenner.

**Möhrcato Beleg:** Slots sowie geplante und angepasste Schichtzeiten stehen nebeneinander.

### D-04 Geeignete Ansichten

| Arbeitsfrage | Standardansicht | Beispiel |
| --- | --- | --- |
| Was muss ich bearbeiten? | Liste mit Details | Bewerbungen |
| Welche Werte unterscheiden sich? | Tabelle | Konditionen oder Aufwand |
| Wann und wo passiert etwas? | Kalender / Zeitstrahl | Performances, Schichten |
| Wo fehlt Kapazität? | Belegung mit Soll und Ist | Freie Schichtslots |
| Was muss eine Person wissen? | Individuelle Ausgabe | Infosheet |
| Wie entstand der aktuelle Stand? | Protokoll | Änderungsverlauf |

Neue Ansichten MÜSSEN eine konkrete Frage besser beantworten, auf dieselben Daten zurückführen und Auswahl sowie Filter nachvollziehbar machen. Eine Grafik darf wichtige genaue Werte nicht ausschließlich über Farbe oder Fläche ausdrücken.

Drei Varianten desselben fiktiven Falls: Artist Care am 21.08.2026 von 10:00 bis 16:00, drei Plätze, Ana und Bo eingeteilt, ein Platz frei, beide Schichten noch offen.

1. Liste: Zeitraum, „2 von 3 besetzt“, „1 frei“, Zustand. Öffnen zeigt Ana und Bo.
2. Kalender: Zeitblock mit denselben Personen, freiem Platz und Zustand.
3. Matrix: Bereich als Zeile, Zeitraum als Spalte, Zelle „2 / 3, 1 frei“. Öffnen zeigt dieselben Details.

Liste und Kalender sind durch Möhrcato gestützt. Die Matrix ist eine optionale Erweiterung. Auch Konfliktübersichten, gespeicherte Arbeitsansichten und verknüpfte Markierungen KÖNNEN erprobt werden. Eine Suche in Alltagssprache muss die angewendeten Filter zeigen. Sie darf ohne eindeutigen Änderungsauftrag keine Daten verändern.

### D-05 Suche, Filter und Sortierung

Suche MUSS ihren Bereich erkennen lassen. Aktive Filter bleiben sichtbar, einzeln entfernbar und gemeinsam zurücksetzbar. Verknüpfungen mit UND beziehungsweise ODER werden ausdrücklich erklärt. Sortierung und Ergebniszahl sind erkennbar.

Gespeicherte Ansichten SOLLEN wiederkehrende Aufgaben unterstützen. Persönliche Ansichten dürfen nicht unbemerkt die Ansicht anderer Personen verändern. Ein Zähler unterscheidet Treffer, Auswahl, Gesamtbestand und freien Bedarf.

**Möhrcato Beleg:** Suche, ausklappbare Filter, Statusansichten und Filter für Artists ohne Event. Filter der Kandidatenliste und Belegung des Kalenders haben unterschiedliche Geltung.

### D-06 Exporte und externe Ausgaben

Ein Export MUSS Zweck, Bezugsmenge, Felder, Format, Datenstand und Umgang mit Mehrfachbezügen erklären. Rechte gelten auch beim Export. Die Vorschau nennt Anzahl und ein datensparsames Beispiel.

CSV Ausgaben MÜSSEN ihre Zeichenkodierung, Trennzeichen, Spaltenköpfe, Datumsformate und Behandlung mehrzeiliger Felder dokumentieren. Für Datenübertragung werden stabile Kennungen und eindeutig interpretierbare Zeitangaben angeboten, sofern deren Weitergabe zulässig ist. Tabellenprogramme dürfen Textwerte nicht unbeabsichtigt als ausführbare Formeln behandeln.

Duplikate werden anhand fachlicher Kennungen behandelt: Ein Export von Kontakten kann eine Person einmal enthalten, ein Export von Zuordnungen dieselbe Person mehrfach mit verschiedenen Schichten. Der Export muss diesen Unterschied nennen.

Ein persönliches Infosheet MUSS nur die für diesen Empfänger erlaubten und erforderlichen Angaben enthalten. Interne Notizen gehören nicht automatisch in externe Ausgaben.

**Möhrcato Beleg:** Kontakt CSV mit Feldauswahl und Duplikatoption; Timetable mit Filtern und Gruppierung; ZIP für Presseunterlagen; personalisierte Infosheets. Ergebnisdateien wurden in der Untersuchung nicht erzeugt.

## D. Pflege und Prüfung

### Q-01 Rechte und gemeinsame Technik

Anzeige und Aktionen MÜSSEN die tatsächlichen Rechte abbilden. Die Oberfläche allein ist keine Zugriffssicherung. Firmen und Projekte erhalten durch gemeinsame Gestaltung keine gemeinsamen Datenrechte.

Die tatsächlich geltenden Regeln des Zielprojekts für Anmeldung, Schutz, Betrieb, Rückwege und Register bleiben erhalten. Rechte müssen am geschützten Zugriff durchgesetzt werden; Geheimnisse gehören weder in Browsercode noch in Berichte. Interne und externe Ansichten erhalten jeweils nur die erforderlichen Daten. Dieser Pilot führt keinen neuen Dienst und kein gemeinsames Personensystem ein.

### Q-02 Gemeinsame Komponenten

Zum ersten Baukasten gehören Listenzeile, Detailbereich, Statusanzeige, Zähler, Bildplatzhalter, Suchfeld, Filter, Aktionsmenü, Formularfeld, Dialog, seitlicher Bereich, Kalenderblock, Mehrfachauswahl, Protokoll, Vorschau und Exportkonfiguration.

| Kernbaustein | Vorgegebener Aufbau |
| --- | --- |
| Arbeitsleiste | Suche links, Filter daneben, Hauptaktion am rechten Ende; darunter aktive Filter und Ergebniszahl. Schmaler Bildschirm: Umbruch in lesbarer Reihenfolge. |
| Listenzeile | Optionale Checkbox, Bild oder Initialen, Titel mit Zusatzzeile, relevante Zustände, Aktionsmenü am Ende. Details öffnen unter der Zeile. |
| Detailbereich | Identität und Zustand zuerst; danach fachliche Gruppen wie Kontakt, Planung und Vereinbarung; seltene Zusatzangaben einklappbar. Keine leeren Pflichtgruppen. |
| Formularfeld | Bezeichnung über dem Feld; Hinweis und Einheit am Feld; Fehlermeldung darunter. Zusammengehörige Felder bleiben gemeinsam. |
| Statusanzeige | Begriff mit Symbol, optional farbige Fläche. Eine verändernde Statusaktion ist als bedienbares Element erkennbar. |
| Dialog | Konkreter Titel, erforderliche Angaben, Folgenhinweis, benannte Hauptaktion und Abbrechen. Keine verschachtelte Folge mehrerer modaler Dialoge. |
| Seitlicher Bereich | Titel und Schließen, ergänzender Inhalt; der Ausgangsdatensatz bleibt am großen Bildschirm sichtbar. Schmal: eigene Ansicht mit Rückweg. |
| Kalenderblock | Titel, Beginn und Ende, fachlicher Zustand; bei Schichten zusätzlich Besetzung und freie Plätze. Fehlender Platz führt zu erreichbaren Details. |

Jede Komponente MUSS Zweck, Aufbau, Maße, Zustände, Aktionen, Speicherwirkung, Tastatur und Touch, Fehlermeldung sowie ein fachliches Beispiel dokumentieren. Relevante Zustände sind Laden, leer, ausgewählt, fokussiert, gesperrt, fehlgeschlagen und ohne Berechtigung. Nicht passende Zustände werden begründet ausgelassen.

Eine App SOLL vorhandene Komponenten nutzen. Neue fachliche Varianten erweitern den Katalog erst nach Prüfung. Kopien dürfen nicht unbemerkt unterschiedliche Bedeutungen entwickeln.

### Q-03 Prüfung am Arbeitsvorgang

Vor einer Übernahme MÜSSEN die folgenden Fälle an freigegebenen Testdaten geprüft werden, soweit die betreffende Funktion im Pilot vorhanden ist. Fachlich unpassende Fälle werden anhand des Funktionsinventars begründet ausgelassen oder durch einen gleichwertigen vorhandenen Fachvorgang ersetzt:

1. Objekt finden, öffnen und mit erhaltenem Kontext zurückkehren.
2. Zuordnung mit und ohne Ziehen, einschließlich fehlender Kapazität und Zeitkonflikt.
3. Entwurf speichern, fachlich bestätigen und berechtigt korrigieren.
4. Anwesenheit, Schichtbeginn und Schichtende getrennt bearbeiten.
5. Auswahl filtern und einen passenden Export erzeugen sowie zurücklesen.
6. Fehlgeschlagenes Speichern, Unterbrechung und parallele Änderung behandeln.
7. Hauptweg mit Tastatur, schmaler Ansicht und Textvergrößerung durchlaufen.
8. Eine erlaubte und eine verweigerte Aktion mit verschiedenen Testrollen prüfen.

Eine erfahrene und eine neue Person SOLLEN vergleichbare Aufgaben bearbeiten. Erfasst werden selbstständiger Abschluss, notwendige Hilfe, Fehlaktionen und Verständnis der Zustände. Lernwirkung wird erst nach diesem Vergleich behauptet.

Der vollständige Prüfkatalog in Abschnitt F trennt technische Prüfung, fachliche Annahme und beobachtete Wirkung. Die Erstellung dieses Dokuments erfüllt diese zukünftigen Anwendungstests noch nicht.

### Q-04 Verantwortung, Versionen und Ausnahmen

Vor Annahme werden fachliche Verantwortung und Pflege des Baukastens benannt. Alexander entscheidet über die Übernahme in den vorgesehenen Geltungsbereich; daraus folgt keine automatische Geltung bei anderen Firmen.

Jede App dokumentiert verwendete Standardfassung, erfüllte Regeln, offene Punkte und Ausnahmen. Eine Ausnahme nennt Regelkennung, Grund, betroffene Ansicht, Auswirkung, verantwortliche Entscheidung und Ablaufdatum oder Prüftermin. Sie bleibt am Werkzeug auffindbar.

Bestehende Oberflächen werden schrittweise übernommen. Der Pilot an der ausgewählten Seite prüft deren tatsächlichen Hauptweg. Bei einer passenden Fachanwendung umfasst dieser etwa Liste, Details, Zuordnung und Bestätigung. Neue Funktionen oder Varianten werden nicht allein wegen ihrer Neuheit Pflicht.

Wo der bestehende Reifegradstandard übernommen ist, bleiben Stabil, Beta, Vorschau und Experiment erhalten. „Technisch geprüft“ ist keine eigenständige fachliche Freigabe und kein Beweis beobachteter Wirkung.


## E. Projektspezifische Umsetzung

### P-01 Projektprofil und eindeutiger Umfang

Vor Änderungen wird `PILOT-PROJEKTPROFIL.md` am vorhandenen Dokumentationsort des Zielprojekts angelegt. Fehlt ein solcher Ort, ist `docs/webapp-pilot/` die Vorgabe. Vorhandene Dateien werden erhalten; bei Kollision wird eine eindeutig benannte neue Fassung angelegt.

| Angabe | Was konkret einzutragen ist |
| --- | --- |
| Ziel | Projekt, lokale Arbeitskopie oder Repository, Seite oder Route und Organisation |
| Ausgangsstand | Version oder Commit, Datum, vorhandene eigene und fremde Änderungen |
| Hauptaufgabe | Wer möchte auf dieser Seite welches konkrete Ergebnis erreichen? |
| Pilotumfang | Einbezogene Seite, Dialoge und Rückwege; ausgeschlossene Bereiche |
| Zielgruppe | Regelmäßig Nutzende, neue Nutzende, benötigte Rollen und Geräte |
| Datenführung | Führender Pflegeort, Objektkennungen, relevante Beziehungen und Schnittstellen |
| Zustände | Fachliche Bedeutung, erlaubte Übergänge, Rechte und Korrekturwege |
| Umgebung | Lokal oder isolierte Testumgebung, Startweg, Browser, Testrollen |
| Testdaten | Synthetisch oder ausdrücklich freigegeben; keine ungeprüfte Kopie von Personendaten |
| Gestaltung | Vorhandene Gestaltung, angenommene Markenregeln, Schriftdateien und belegte Nutzungsrechte |
| Freigaben | Was darf bereits umgesetzt, getestet oder veröffentlicht werden? |
| Wiederherstellung | Isolierter Ausgangsstand, betroffene Dateien, konkret getesteter Rückweg |
| Erfolg | Aufgaben, erwartetes Ergebnis, kritische Fehler und Vorhervergleich |
| Verantwortung | Technische Umsetzung, fachliche Prüfung durch Alexander, offene Zuständigkeiten |

Fehlende Angaben werden zunächst aus Projekt, Anweisungen, tatsächlichen Dateien und vorhandenen Zugängen ermittelt. Nur eine wesentliche, nicht ermittelbare Entscheidung wird erfragt. Unbekannt bleibt als unbekannt bezeichnet.

Das Pilotdokument überträgt keine Organisationsdaten, Firmenzuordnungen oder besonderen Regeln aus seinem Herkunftsprojekt in das Zielprojekt. Dort werden ausschließlich die tatsächlich geltenden Vorgaben gelesen.

### P-02 Bestand sichern und Fähigkeiten erhalten

Vor dem Umbau wird der aktuelle Nutzerweg tatsächlich durchlaufen, soweit dies ohne unzulässige Datenänderung möglich ist. Mindestens Einstieg, Normalansicht, Details, relevante Menüs, Formulare, Filter, Fehlerhinweise und schmale Darstellung werden erfasst.

Für jede vorhandene Fähigkeit wird eine Zeile in `PILOT-BERICHT.md` geführt:

| Kennung | Bisherige Fähigkeit und Auslöser | Verborgener Zugang | Neue Umsetzung | Regel | Nachweis |
| --- | --- | --- | --- | --- | --- |
| F-001 | Tatsächliche Aufgabe eintragen | Etwa Rechtsklick, Hover, Untermenü, Direktlink | Erhalten oder gleichwertig ersetzt | Passende Regelkennung | Vorher / nachher und Test |

Die Bestandsaufnahme berücksichtigt insbesondere Rechte, Kopieraktionen, Tastaturwege, Direktlinks, Exporte, Dateien, Personalisierung, Sonderzustände, Mehrfachbezüge und Speicherauslöser. Reine Bildschirmfotos belegen keine unverändert funktionierende Fachlogik.

Bestehende Prüfungen werden gelesen und passende Prüfungen vor dem Umbau ausgeführt. Bereits bestehende Fehler werden getrennt von neu verursachten Fehlern dokumentiert.

Inhalt, Datenquelle, Navigation und zentrale Markenmerkmale werden nicht stillschweigend ersetzt. Benötigt die Pilotgestaltung eine sachliche Abweichung von einer bereits angenommenen Gestaltung, wird der Konflikt vor der abhängigen Änderung geklärt. Andere Arbeiten gehen weiter.

### P-03 Gestaltungswerte und Komponenten technisch zusammenführen

Vorhandene Komponenten, Stilvariablen und Bibliotheken werden wiederverwendet. Ein neues Framework oder eine zusätzliche Abhängigkeit ist für diesen Pilot nicht die Voreinstellung. Zentrale gemeinsame Komponenten dürfen nur so geändert werden, dass Auswirkungen auf andere Seiten geprüft werden können; sonst werden Änderungen zunächst auf den Pilotbereich begrenzt.

Die Werte aus G-01 bis G-06 werden an einem gemeinsamen Ort im bestehenden technischen System definiert. Mindestens folgende Rollen müssen zuordenbar sein: Schriftfamilie, Schriftrollen, Text, Zusatztext, Fläche, Navigation, Aktion, Auswahl, Fokus, Erfolg, Warnung, Fehler, Abstände, Rundungen, Größen, Dichte und Bewegungsdauer.

Die in Pixeln genannten Schriftwerte sind Entwurfsmaße bei üblicher Grundeinstellung. Sie werden relativ zur Texteinstellung umgesetzt. Eine globale Verkleinerung der Grundeinstellung darf die Skalierbarkeit nicht umgehen.

Für den Pilot gilt ein eindeutiger Schriftweg: vorhandene und berechtigt nutzbare Proxima Nova verwenden; andernfalls bereits verfügbare und berechtigt nutzbare Work Sans; andernfalls Systemschrift. Keine fremden Möhrcato Schriftdateien kopieren und keinen Kauf auslösen. Der verwendete Ersatz wird im Bericht genannt. Eine Systemschrift ist eine zulässige Pilotabweichung und kein Beleg endgültiger Schrifttreue.

Vorhandene helle und dunkle Modi bleiben funktionsfähig. Das helle Profil dieses Dokuments ist kein vollständiges dunkles Farbprofil. Ein vorhandener dunkler Modus wird mit separat geprüften Rollen erhalten. Ein neuer dunkler Modus wird nicht allein durch diesen Pilot beauftragt.

### P-04 Vollständiger Vertrag für Komponenten und Zustände

Die folgende Ergänzung gilt für tatsächlich verwendete Komponenten:

| Element | Erwartetes Verhalten und schwierige Zustände |
| --- | --- |
| Hauptknopf | Eine dominante Abschlussaktion je Vorgang; eindeutiger Text; Verarbeitung sichtbar; Doppelauslösen verhindern |
| Nebenaktion | Abbrechen, Zurück oder alternative reversible Handlung; geringer hervorgehoben |
| Gefährliche Aktion | Wirkung und Ziel benennen; Löschung von Zuordnung trennen; keine Gefahr allein über Farbe vermitteln |
| Checkbox | Mehrfachauswahl oder benannte boolesche Formulareingabe; Gruppenzustand „teilweise ausgewählt“ erkennbar |
| Schalter | Direkte boolesche Einstellung; Wirkung und Sofortspeicherung erkennbar; nicht als unsichtbare Zusage verwenden |
| Auswahlfeld | Aktueller Wert, leerer Wert und nicht mehr verfügbare Werte unterscheidbar; Suche bei langen Mengen |
| Datum und Zeit | Lesbare Eingabe, Tastaturalternative, Zeitzone und unzulässige Bereiche; keine bloße Kalendermauspflicht |
| Dateifeld | Erlaubte Typen und Größe vorher nennen; Fortschritt, Fehler, Austausch und Entfernung erklären |
| Formular | Pflichtangaben, Validierung am Feld, Fehlerzusammenfassung bei mehreren Fehlern, Erhalt eingegebener Werte |
| Tabelle | Echte Spaltenüberschriften; Sortierrichtung; eindeutiger Zeilenbezug; lange Texte erreichbar; Spalten nicht still verbergen |
| Lange Liste | Umfang und Nachladen erkennbar; Auswahl und Fokus über Seitenwechsel erhalten oder Wirkung klar erklären |
| Reiter | Wechsel zwischen Ansichten; aktive Ansicht erkennbar; kein verdeckter Statuswechsel |
| Menü | Benannte Gruppen; Tastaturzugang; ausreichende Trefferflächen; Hauptaktion nicht nur im Menü verstecken |
| Hinweis | Information in Nähe des betroffenen Inhalts; keine dauernd wiederkehrende Bestätigung für reversible Routine |
| Kurzmeldung | Erfolg ergänzen; Fehler zusätzlich am betroffenen Vorgang dauerhaft erreichbar machen |
| Dialog | Titel, Fokus, Abbruch und Datenverlustschutz; nach Schließen sinnvoller Rückweg |
| Seitlicher Bereich | Ausgangskontext erhalten; schmal eigenständig öffnen; Rückweg und ungespeicherte Eingaben berücksichtigen |
| Diagramm | Fragestellung, Einheit, Skala, Bezugsmenge, Aktualität und genaue Werte erreichbar; zugängliche Alternative |
| Anmeldestatus | Falls vorhanden: Sitzung abgelaufen, erneute Anmeldung und Rückkehr ohne unbemerkten Verlust behandeln |

Jeder verwendete Baustein wird auf normal, Hover, Fokus, aktiv, ausgewählt, deaktiviert, Laden, leer, Fehler, Erfolg und eingeschränkte Berechtigung geprüft, soweit der Zustand sinnvoll ist. „Deaktiviert“ erklärt den Grund, soweit dadurch keine geschützten Informationen offengelegt werden. Ein fehlender Serverzugang darf nicht mit einer erfundenen Erfolgsmeldung verdeckt werden.

Beispieltexte:

1. „Keine Treffer. Entferne einen Filter oder setze alle Filter zurück.“
2. „Bitte wähle einen Bereich, um dessen Termine zu sehen.“
3. „Speichern fehlgeschlagen. Deine Eingaben sind erhalten.“
4. „Dieser Eintrag wurde inzwischen geändert. Vergleiche die beiden Fassungen.“
5. „2 von 12 Änderungen konnten nicht gespeichert werden. Betroffene Einträge anzeigen.“

### P-05 Komplexe Informationen sinnvoll verpacken

Die bestehende Arbeitsfrage führt die Wahl der Ansicht. Neue Darstellungen werden nicht allein wegen ihres Erscheinungsbildes eingebaut.

| Variante | Geeignet für | Wichtige Grenze |
| --- | --- | --- |
| Kompakte Liste mit Details | Wiederkehrende Vorgänge und schnelle Bearbeitung | Keine für die Entscheidung nötigen Angaben verstecken |
| Vergleichstabelle | Viele Objekte mit gleichen Merkmalen | Mobil Prioritätsspalten und Details statt unlesbarer Schrumpfung |
| Kalender oder Zeitstrahl | Zeit, Ort und Überschneidungen | Alternative ohne Ziehen und schmale Einzelansicht |
| Belegungsmatrix | Bedarf über Bereiche und Zeiträume | Zahlen zusätzlich zur Farbe; Detailzugang zur Besetzung |
| Nach Zustand gruppierte Liste oder Board | Vorgänge mit klaren Übergängen | Verschieben darf nicht unbemerkt fachlich bestätigen |
| Hierarchische Übersicht | Tatsächliche Eltern und Kind Beziehungen | Quelle und Ansicht nicht mit Organisationsebenen verwechseln |
| Liste plus Detailbereich | Wiederholtes Prüfen und Bearbeiten | Ausgangsauswahl und Rückweg erhalten |
| Konfliktübersicht | Fehlende Voraussetzungen und handlungsbedürftige Ausnahmen | Keine falsche Vollständigkeitsgarantie; Prüfbereich zeigen |
| Vergleich vorher / nachher | Änderungen, Revisionen und Freigaben | Tatsächliche Werte und Quelle sichtbar halten |
| Verknüpfte Ansichten | Auswahl in Liste und Kalender gleichzeitig verstehen | Ein Datensatz und ein Filterverständnis |
| Schrittweiser Vorgang | Mehrere abhängige Eingaben | Stand speichern, zurückgehen, Ende und Wirkung erkennen |
| Suche in Alltagssprache | Experiment für komplexe Abfragen | Angewendete Filter sichtbar; keine eigenmächtigen Änderungen |

Bei einer wesentlichen neuen Darstellungsentscheidung werden drei kurze Varianten mit identischen Beispieldaten beschrieben oder skizziert. Dafür sind keine drei vollständigen Implementierungen nötig. Die Variante, die die bestehende Aufgabe am besten erhält und verständlich macht, wird für den Pilot umgesetzt. Ist die passende Ansicht bereits eindeutig, genügt eine dokumentierte Begründung.

Kennzahlen und Diagramme dürfen nicht durch selektive Skalen oder fehlende Bezugsgrößen einen falschen Eindruck erzeugen. Zähler nennen den Filterbezug. Ein Diagramm benötigt keine Animation, wenn diese für das Verständnis nichts beiträgt.

### P-06 Sicherer Änderungsweg und tatsächlicher Rückweg

Der Ausgangsstand wird vor der Änderung gesichert. In einem Git Projekt werden vorhandene lokale Änderungen und parallele Arbeit geprüft. Eine geeignete isolierte Arbeitskopie oder ein begrenzter eigener Zweig wird verwendet, wenn sonst Arbeit anderer betroffen wäre. Ohne Git wird eine versionierte Kopie der tatsächlich betroffenen Dateien mit Prüfsummen erstellt.

Kein pauschales Zurücksetzen, keine Bereinigung fremder Dateien und kein Überschreiben nicht zugeordneter Änderungen. Ein Rückweg beschreibt die Wiederherstellung ausschließlich der eigenen Pilotänderungen. Er wird in einer isolierten Kopie ausprobiert; die produktive Umgebung wird dafür nicht zurückgesetzt.

Der Pilot verwendet lokale oder ausdrücklich zugelassene Testdaten. Fehlen Testsystem oder Testrollen, werden Oberfläche und nicht schreibende Wege weiter bearbeitet. Schreibende Prüfungen bleiben als offen markiert; ein vollständiger Test wird dann nicht behauptet. Simulierte Speicherung ist sichtbar als Simulation gekennzeichnet.

Oberflächenarbeit darf vorhandene Fachlogik nicht still ändern. Kann etwa eine vollständige Konfliktprüfung mit vorhandenen Schnittstellen nicht erfüllt werden, wird dies als funktionale Lücke dokumentiert. Ohne entsprechende Freigabe erfolgt kein Umbau produktiver Datenstrukturen. Die Einschränkung bleibt abnahmerelevant.

Keine Nachrichten an reale Empfänger, keine produktiven Buchungen, Zahlungen, Statusänderungen oder Löschungen allein zum Test. Bereits erteilte konkrete Freigaben für Testumgebung oder Veröffentlichung gelten weiter. Fehlt eine erforderliche Freigabe, wird erst nach Fertigstellung aller unabhängig möglichen Arbeiten genau die ausstehende Handlung benannt.

### P-07 Umsetzung in nachvollziehbaren Schritten

1. Dokument vollständig lesen und Version sowie Regelumfang zurückmelden.
2. Zielprojekt und lokale Anweisungen prüfen; Projektprofil und Funktionsinventar ausfüllen.
3. Anwendbarkeit aller 34 Regelkennungen festhalten. Fehlende Pflichtvoraussetzungen sichtbar machen.
4. Ausgangsansichten und Hauptablauf sichern; geeigneten isolierten Änderungsweg und Rückweg herstellen.
5. Schriftrollen, Farben, Abstände und wiederkehrende Bausteine zentral zuordnen.
6. Gewählte Seite samt direkt erforderlichen Details und Dialogen anpassen. Vorhandene Fachfunktionen erhalten.
7. Mobile Darstellung, Tastaturwege, Fokus, Fehlerzustände und Auswahlverhalten vervollständigen.
8. Datenformate, Zustandstrennung, Speicherwirkung, Rechteanzeigen und vorhandene Ausgaben prüfen.
9. Passende Projektprüfungen sowie die Testfälle aus Abschnitt F ausführen. Neu verursachte Fehler innerhalb des Auftrags beheben.
10. Rückweg prüfen, Ergebnisbericht und Vergleichsbilder erstellen, Pilot zum Test durch Alexander übergeben.

Die Umsetzung endet nicht mit einer Planung oder einer bloß neu gestalteten Startansicht. Ein Bestandteil ist erst „technisch geprüft“, wenn seine tatsächliche Funktion nachgewiesen ist. Nicht vorhandene Testmöglichkeiten werden konkret benannt.

Das Paket darf nur an einer eindeutig ausgewählten Seite ausprobiert werden. Ein globales Stylesheet wird nicht unkontrolliert auf alle Projektseiten angewendet. Gemeinsam verwendete Komponenten benötigen passende Nachbarprüfungen.

### P-08 Technische Qualität und belastbare Rückmeldung

Das vorhandene technische System bleibt der Ausgangspunkt. Zu prüfen sind die im Projekt tatsächlich vorgesehenen Build, Format, Typ und Funktionstests, soweit sie zur Änderung passen. Neue Tests sind dort sinnvoll, wo verändertes Verhalten sonst ungesichert wäre. Prüfungen, die lediglich dieselbe Implementierung nachbauen, ersetzen keinen Nutzerweg.

Konsole und fehlgeschlagene Netzwerkanfragen werden im relevanten Ablauf auf neue Fehler geprüft. Keine Zugangsdaten oder personenbezogenen Inhalte in Prüfprotokolle schreiben.

Für lange Listen wird eine realistische, im Projektprofil benannte Datenmenge geprüft. Nachladen, Filter und Auswahl dürfen keine Einträge verlieren oder doppelte Änderungen auslösen. Rendering, Suche und Speichern werden mit derselben Testmenge vor und nach dem Umbau verglichen. Statt willkürlicher universeller Zeitgrenzen werden Ausgangswert und zulässige Abweichung vor der Umsetzung für den Pilot festgelegt.

Eine Anzeige für eine länger laufende Aktion muss unverzüglich erkennbar sein. Läuft eine Antwort weiter, darf erneutes Klicken keine doppelte fachliche Wirkung auslösen. Unklare Serverantworten verlangen einen Zustandsabgleich.

Die wichtigste Zielbrowserfamilie wird im Profil benannt. Bei unbekannter Nutzung wird mindestens ein tatsächlich verfügbarer Desktopbrowser und eine schmale Darstellung geprüft. Ein emulierter Bildschirm ist kein realer Touchgerätetest; diese Nachweise werden getrennt dokumentiert.

### P-09 Wann der Pilot bestanden ist

Es gibt vier getrennte Ergebnisse:

1. **Umgesetzt:** Die vereinbarten Änderungen liegen vor.
2. **Technisch prüfbereit für Alexander:** Alle anwendbaren verpflichtenden Testfälle sind bestanden oder eine Einschränkung ist ausdrücklich fachlich akzeptiert; nicht geprüfte Fälle sind sichtbar.
3. **Fachlich bestanden:** Alexander kann die vereinbarten Aufgaben ausführen und bewertet die Gestaltung und Bedienung als geeignet.
4. **Für das Regelwerk angenommen:** Alexander benennt ausdrücklich die übernommenen Regeln, Fassung, Geltung und Verantwortung.

Ein offener kritischer Fehler verhindert die Einstufung „technisch prüfbereit“. Kritisch sind insbesondere Datenverlust, falscher Empfänger, unberechtigter Zugriff, doppelte fachliche Wirkung, ein blockierter Hauptweg oder eine unbemerkt falsche Statusaussage. Wesentliche Fehler wie fehlende Tastaturalternative oder unbrauchbare schmale Darstellung im vereinbarten Nutzungsfall verhindern ebenfalls das Bestehen.

Kleine Gestaltungsabweichungen können mit Begründung, Auswirkung und Prüftermin dokumentiert werden. Ein nicht ausführbarer Test zählt nicht als bestanden. „Nicht zutreffend“ benötigt einen Bezug zum tatsächlich abgegrenzten Funktionsumfang.

Für den Lernversuch bearbeiten eine mit dem Werkzeug vertraute und eine neue Person möglichst vergleichbare Aufgaben. Hilfen, Fehlaktionen, Abschluss und Wiederaufnahme nach Unterbrechung werden erfasst. Vorhervergleich und Reihenfolge werden dokumentiert; Übungseffekte dürfen nicht als allgemeine Lernwirkung ausgegeben werden. Ist zunächst nur Alexanders Test möglich, gilt er als fachliche Pilotbewertung, nicht als Nachweis verringerter Lernzeit für alle.

### P-10 Ergebnislieferung, Ausnahmen und spätere Übernahme

Der umsetzende Agent liefert mindestens:

1. Erreichbare lokale Vorschau oder einen im Auftrag ausdrücklich erlaubten Testzugang.
2. Projektprofil, Funktionsinventar und Zuordnung aller anwendbaren Regeln.
3. Übersicht der tatsächlichen Änderungen mit Bezug zum Zweck.
4. Vergleichsbilder des Hauptwegs am großen und schmalen Bildschirm ohne vertrauliche Inhalte.
5. Prüfergebnisse mit Version, Datenkontext, Rolle, Handlung, Ergebnis und Grenze.
6. Beschreibung und Nachweis des ausprobierten Rückwegs.
7. Bekannte Lücken und Ausnahmen mit Auswirkungen.
8. Kurze konkrete Testaufgaben für Alexander und eine einfache Rückmeldevorlage.

Die Vorschau wird nur als veröffentlicht bezeichnet, wenn dies tatsächlich erfolgt und autorisiert ist. Ein nur lokal laufender Dienst wird mit seinem Startweg dokumentiert. Kein Versprechen einer dauerhaften Erreichbarkeit oder Hintergrundarbeit ohne vorhandenen Mechanismus.

Bei erfolgreichem Test wird ein Übernahmevorschlag vorbereitet: welche Regeln sich bewährt haben, welche geändert werden müssen, für welche Anwendungen sie gelten sollen und wer sie pflegt. Die automatische Änderung von AGENTS.md, Organisationsregeln, anderen Anwendungen oder fremden Projekten ist nicht Teil des Piloten.

## F. Vollständiger Prüfkatalog

Für jeden Test gelten die Statuswerte „bestanden“, „fehlgeschlagen“, „nicht ausgeführt“ und „nicht zutreffend mit Grund“. Ein Ergebnis nennt Testumgebung, geprüfte Appfassung und konkreten Nachweis. Die folgenden Tests sind Sollprüfungen für die Zielseite, keine hier bereits durchgeführten Anwendungstests.

| Test | Durchführung | Erfolgskriterium | Regeln |
| --- | --- | --- | --- |
| T-01 Bestand und Umfang | Ziel, Rolle und ursprünglichen Hauptweg mit Funktionsinventar abgleichen | Keine vorhandene Pflichtfunktion unbemerkt entfernt; jede Funktion zugeordnet | P-01, P-02 |
| T-02 Schrift und Layout | Normalansicht, lange Titel, lange deutsche Wörter, leere Werte und zentrale Stilwerte prüfen | Definierte Rollen und Mindestgrößen; kein verlorener Inhalt; Schriftweg belegt | G-01, G-03, P-03 |
| T-03 Kontrast und Zustände | Gerenderte Farbpaare für Text, Auswahl, Fokus, Warnung und Fehler messen | Text mindestens 4,5:1; wesentliche nichttextliche Erkennungsmerkmale mindestens 3:1 zur angrenzenden Farbe; Bedeutung zusätzlich lesbar | G-02, G-04 |
| T-04 Schmale Ansicht und Zoom | 320, 390 und 1440 CSS px, zusätzlich 200 Prozent Textvergrößerung prüfen | Hauptweg nutzbar; keine abgeschnittenen Aktionen; erforderliche zweidimensionale Flächen gezielt scrollbar | G-05 |
| T-05 Tastatur und Assistenz | Hauptweg nur mit Tastatur; Dialog öffnen, verlassen und schließen; Labels und Statusmeldungen prüfen | Sichtbarer Fokus, logische Folge, keine Falle; verständliche Namen, Rolle und Zustand | B-08 |
| T-06 Details und Rückwege | Eintrag öffnen, Kontext wechseln, zurückkehren | Datum, Filter und relevante Position erhalten; kein unbeabsichtigter Datenverlust | B-01, B-02 |
| T-07 Suche, Filter und Auswahl | Kriterien kombinieren, entfernen, sortieren; seitenübergreifend auswählen | Geltung und Zähler korrekt; keine unsichtbare unerklärte Auswahl | D-05, B-06 |
| T-08 Formular und Validierung | Pflichtfeld leer, ungültiger Wert, gültiger Wert, Abbruch und Korrektur; bei vorhandenen Dateifeldern ungültigen Typ und zu große Datei prüfen | Verständliche Fehler; Werte erhalten; Abbruch und Speichern wirken wie beschrieben; Komponentenvertrag erfüllt | B-03, P-04, Q-02 |
| T-09 Speichern und Wiederholung | Langsame Antwort, Fehler und unklare Antwort in Testumgebung auslösen | Vorläufiger Stand erkennbar; keine falsche Erfolgsmeldung oder doppelte Wirkung | B-04, B-07, P-08 |
| T-10 Fachliche Zustände | Erlaubten Übergang und Korrektur durchführen | Nur benannte Dimension geändert; Sperre und Bestätigung verständlich | D-02 |
| T-11 Zuordnung und Konflikt | Mit und ohne Ziehen zuordnen; fehlende Kapazität, Verfügbarkeit und Konflikt prüfen | Gleiche fachliche Wirkung; korrekte Ablehnung oder erlaubte Ausnahme; Prüfung über sichtbaren Ausschnitt hinaus | B-05 |
| T-12 Zeiten und Mengen | Mitternacht, Zeitumstellung falls relevant, 0, fehlend, Soll und Ist anzeigen | Zeit und Dauer eindeutig; Werte nicht verwechselt; Einheiten und Bezugsmenge sichtbar | D-03 |
| T-13 Gleiche Daten in Ansichten | Dasselbe Testobjekt in Liste, Detail und vorhandenen weiteren Ansichten vergleichen; Wahl der Darstellung begründen | Kennung, Zustand und Bezugszeit stimmen überein; Abzug erkennbar; Darstellung passt zur Frage | D-01, D-04, P-05 |
| T-14 Export und Rücklesen | Auswahl exportieren und in geeignetem Zielwerkzeug öffnen | Anzahl, Felder, Umlaute, Zeilenumbrüche, Zeitwerte und Duplikatregel korrekt | D-06 |
| T-15 Externe Wirkung | Mit Testempfängern oder kontrolliertem Testdienst Vorschau und Sammelergebnis prüfen | Richtiger Empfänger, korrekter Umfang, personalisierte Werte; Teilfehler sichtbar | B-06, D-06 |
| T-16 Rechte und Sitzung | Testrollen mit erlaubtem und verweigertem Zugriff; gegebenenfalls Sitzungsablauf | Keine unberechtigte Wirkung oder Datenanzeige; Wiederaufnahme erklärt | Q-01, P-04 |
| T-17 Gleichzeitige Bearbeitung | Zwei Testpersonen ändern denselben Vorgang | Keine stille Überschreibung; Konflikt oder dokumentierte Zusammenführung | B-07 |
| T-18 Lange Liste und Leistung | Vereinbarte Datenmenge mit Suche, Auswahl, Nachladen und Bearbeitung prüfen | Kein Verlust, keine Duplikate und keine unakzeptierte Verschlechterung zum Ausgangswert | P-08 |
| T-19 Bewegung und Leere | Reduzierte Bewegung, Laden und verschiedene leere Zustände prüfen | Keine notwendige Information nur in Animation; passende Ursache und nächste Handlung | G-06, B-07 |
| T-20 Rückweg und Nachbarseiten | Eigene Änderungen in isolierter Kopie zurücknehmen; betroffene gemeinsame Komponenten prüfen | Ausgangsfunktion wiederhergestellt; fremde Änderungen und Nachbarseiten erhalten | P-06, P-07 |
| T-21 Fachlicher Versuch | Vereinbarte Aufgaben durch Alexander; wenn möglich erfahrene und neue Person | Abschluss und Verständlichkeit belegt; notwendige Hilfen und Fehler dokumentiert | Q-03, P-09 |
| T-22 Lieferumfang und Status | Bericht, Vorschau, Ausnahmen und Regeln prüfen | Kein offener kritischer Fehler als fertig ausgegeben; Entscheidung zur Regelübernahme bleibt getrennt | Q-04, P-10 |

Die Anforderungen an vergrößerbaren Text, Tastaturbedienung und nichttextliche Kontraste stützen sich auf die W3C Erläuterungen zu [Textvergrößerung](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html), [Tastatur](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html) und [nichttextlichem Kontrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html). Diese Prüfauswahl ist kein vollständiges Zertifikat zur Barrierefreiheit.

### F.1 Synthetische Beispiele

**Planung:** Testartist Mira hat einen Entwurf für Freitag 16:00 bis 17:00. Eine Bestätigung sperrt den Termin gemäß der ausdrücklich definierten Fachregel. Im Pilot sind gespeicherter Entwurf und Bestätigung unterscheidbar. Ein gleichwertiger Weg ohne Ziehen wird geprüft.

**Schicht:** Artist Care am 21.08.2026, 10:00 bis 16:00, drei Plätze. Ana und Bo sind eingeteilt. Eine weitere Testperson belegt den freien Platz. Anwesenheit, Beginn und Ende werden separat erfasst. Geplante und tatsächliche Zeiten bleiben unterscheidbar.

**Übertragung:** Zwei Testprojekte gehören einer Testperson. Kontakt Export mit Duplikatvermeidung enthält sie einmal; Zuordnungsexport enthält beide Bezüge. Die Datei wird im tatsächlich vorgesehenen Zieltool zurückgelesen.

**Projekt ohne Planung:** Ein Materialantrag wird gefunden, geöffnet, geändert und bestätigt. Liste, Details und Entscheidung bilden den Hauptweg. Termin und Schichttests werden als nicht zutreffend begründet; dafür werden die vorhandenen fachlichen Übergänge geprüft.

Die Beispiele sind erfunden. Sie dürfen an die tatsächliche Fachaufgabe angepasst werden, ohne reale Personendaten aus Möhrcato zu kopieren.

### F.2 Rückmeldung durch Alexander

1. Welche Aufgabe hast du getestet?
2. Konntest du sie ohne zusätzliche Erklärung abschließen?
3. War jederzeit klar, was geöffnet, ausgewählt, gespeichert oder bestätigt war?
4. Wo hast du eine Funktion gesucht oder eine andere Wirkung erwartet?
5. Welche bewährte Fähigkeit fehlt oder wurde umständlicher?
6. Was soll vor der Übernahme geändert werden?
7. Ergebnis: geeignet, mit Änderungen geeignet oder nicht geeignet.
8. Gesonderte Entscheidung: Welche Regeln welcher Fassung sollen für welchen Geltungsbereich übernommen werden?

## G. Nachweisvorlagen

### G.1 Anwendbarkeit und Umsetzung

| Regelkennung | Anwendbarkeit mit Grund | Bestand | Gewählte Umsetzung | Nachweis oder Lücke |
| --- | --- | --- | --- | --- |
| Alle G-, B-, D-, Q- und P-Kennungen einzeln erfassen | Anwendbar / bedingt / nicht zutreffend | Tatsächlicher Ausgang | Konkreter Baustein oder Ablauf | Testkennung und Beleg |

### G.2 Testprotokoll

| Test | Appfassung / Rolle / Daten | Handlung | Erwartung | Beobachtung | Status | Beleg |
| --- | --- | --- | --- | --- | --- | --- |
| T-01 bis T-22 passend ausfüllen | Keine Geheimnisse aufnehmen | Tatsächlich durchgeführt | Vorher festgelegt | Keine bloße Behauptung | Passender Status | Bild, Datei oder präzise Beobachtung |

### G.3 Abweichung

Regelkennung; betroffene Ansicht; Grund; fachliche und gestalterische Auswirkung; Alternative; entscheidende Person oder offene Zuständigkeit; Geltung; Prüftermin oder Ablaufdatum.

Eine Ausnahme kann eine konkrete begründete Abweichung beschreiben. Sie darf einen unbekannten Zustand oder fehlenden Test nicht in einen bestandenen Nachweis verwandeln.

### G.4 Abschlussbericht

Ergebnis; erreichbare Vorschau und Startweg; Ausgangsstand; bearbeiteter Umfang; erhaltene Fähigkeiten; geänderte Dateien oder Bausteine; angewendete Regeln; tatsächliche Tests; bekannte Lücken; geprüfter Rückweg; Testaufgaben für Alexander; noch offene fachliche Annahme; keine automatische Regelübernahme.

## H. Herkunft und fachliche Grenzen

Grundlage ist die im Organisationsprojekt am 20.10.2026 untersuchte Anwendung [Möhrcato](https://v.wildemoehre.org/manage/app/). Die Untersuchung umfasste alle neun Hauptmodule mit repräsentativen Tiefenwegen. Schrift und Maße wurden an der Oberfläche und den ausgelieferten Gestaltungsdateien 3.71 und 1.9 geprüft; Speicherauslöser zusätzlich in der Clientlogik 5.342 gelesen.

Es wurden keine echten Zuteilungen, Statuswechsel oder Nachrichten zum Test ausgeführt. Vollständige Rechteprüfung, Serverfehler, parallele Bearbeitung, mobile Nutzung und tatsächliche Lernwirkung sind damit nicht bereits belegt. Neue Anforderungen dieses Piloten dürfen nicht als vorhandene Möhrcato Eigenschaften ausgegeben werden.

Version 0.2 übernimmt die 24 Kernregeln aus Entwurf 0.1, macht ihre Geltung für beliebige Zielprojekte eindeutig und ergänzt zehn Pilotregeln sowie 22 Testfälle. Die Herkunft aus Organisationsstandards begründet keine automatische Übertragung fremder Projektanweisungen.

Die Farbpaare und das Lesekonzept sind für die Erprobung konkret festgelegt. Noch projektspezifisch zu ermitteln sind Zielseite, Hauptaufgabe, vorhandene Funktionen, Rechte, Datenquellen, Schriftverfügbarkeit, Testumgebung, Testdaten und Startweg. Diese Erhebung ist Teil des Umsetzungsprompts. Ohne Zielprojekt gibt es keinen ehrlichen Nachweis, dass die Anwendung bereits alle Regeln erfüllt.

Das Dokument ist vollständig genug, um einen abgegrenzten Pilot zu beauftragen. Ob der Standard den Arbeitsalltag tatsächlich verbessert, entscheidet sich am dokumentierten Versuch und an Alexanders fachlicher Bewertung.
