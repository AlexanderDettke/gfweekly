# Bekannte Mängel · Stand 22.09.2026, Commit ad5719e

Unabhängige Prüfung durch Codex (read-only) über den vollständigen Umfang `5db861d..ad5719e`, also V23 und
V24a bis V24d, geprüft gegen die Paketdatei `docs/PAKETE-V23-V24.md`. Der Bericht steht unten unverändert.

**Entscheidung vom 22.09.2026 (Alex):** Diese Befunde werden vorerst **nicht behoben**. Das Haus bleibt in
Betrieb, die Mängel stehen hier, damit niemand sich auf etwas verlässt, das nicht trägt.

Vier Befunde habe ich selbst nachgerechnet, alle vier stimmen genau:

- **26** Die Aufnahmen für 390 Pixel sind 428 Pixel breit (`vertretung--390--dark.png`: 428×2934). Die
  Vertretungstabelle läuft auf dem Handy über, und `pruefung/schirme.mjs` prüft Breite gar nicht.
- **27** `--text-3` auf `--surface-2` ergibt im dunklen Thema **4,191:1**, verlangt sind 4,5. Genau dieses Paar
  fehlt in der Liste von `pruefung/kontrast.py`, deshalb meldet die Abnahme null Verstöße.
- **21** Drei Migrationen tragen `20260921`, drei tragen `20260922`. Als geordnete Kette ist das nicht
  reproduzierbar; angewendet wurden sie einzeln von Hand.
- **1** Die Auswahl der Vertretung filtert mit `n !== ABSENCE.person`. Die Abwesenheit führt „Lea“, die
  Personenliste „Lea Luce“: sie bleibt damit als ihre eigene Vertretung wählbar.

**Der wichtigste Befund ist Nummer 29 und betrifft die Prüfung selbst.** `pruefung/bedienung.mjs` fängt alle
Aufrufe der Edge Function ab und prüft gegen selbst gebaute Objekte. Die 35 grünen Bedienproben belegen die
Oberfläche, nicht die Wirkung in der Datenbank. Wo in README, Technikstand oder Arbeitsstand „geprüft“ steht,
ist damit in der Regel die Oberfläche gemeint, nicht der Durchstich.

Gegenprobe zu den übrigen Befunden steht aus. Sie sind hier als Behauptung des Prüfers festgehalten, nicht als
bestätigte Tatsache.

---

Geprüft: vollständiger Quelldiff `5db861d..ad5719e`, Paketdatei, Migrationen, Dokumentation und sämtliche Prüfskripte. HEAD und `origin/main` stehen auf `ad5719e`. Die live bereitgestellte Edge Function ist bytegleich mit der Repositorydatei. Datenbankprüfungen erfolgten ausschließlich lesend. Keine Dateien verändert, keinen weiteren Reviewer gestartet.

Die vorhandenen Matrixproben sowie Tokenvergleich, Farbscan und Kontrastskript bestehen. Das belegt die nachstehenden Abläufe nicht. Neue Browserdurchläufe wurden nicht ausgeführt; vorhandene Bildbelege wurden stichprobenartig angesehen und sämtliche 64 Bildabmessungen geprüft.

Im Folgenden bezeichnet **P** die maßgebliche [Paketdatei](/Users/alexanderdettke/Documents/GitHub/gfweekly/docs/PAKETE-V23-V24.md), **EF** die `supabase/functions/gfweekly/index.ts`.

1. **Hoch: Personenidentitäten sind zwischen Oberfläche, Startseite und Export inkonsistent.**  
   Stellen: [vertretung.html:130](/Users/alexanderdettke/Documents/GitHub/gfweekly/site/vertretung.html:130), `uebergabe.html:323`, `index.html:167`, EF:1737. Vorgabe: spätere ausdrückliche Beschränkung auf Alex und Lea; P:55, 69, 77, 83.  
   Live stehen „Alexander Dettke“, „Lea Luce“ und Jessica als zuweisbare Personen in der Personenliste. Die Oberfläche schließt dagegen nur die Zeichenketten „Alex“ beziehungsweise „Lea“ aus. Damit bleiben Selbstvertretung und Jessica auswählbar. Nach Auswahl von „Alexander Dettke“ verschwindet die Aufgabe aus Alexanders Vertretungsblock, weil dieser ausschließlich `vertretung === "Alex"` akzeptiert. Auch die Vollmachtssuche unterscheidet beide Schreibweisen.  
   **Vorschlag:** Durchgehend stabile Personenkennungen verwenden und für diesen Auftrag ausschließlich die jeweils andere GF zulassen. `TECHNIKSTAND.md:159`, „Niemand steht als eigene Vertretung zur Wahl“, ist falsch.

2. **Hoch: „Beenden“ gibt Themen nicht zurück.**  
   Stellen: [EF:1407](/Users/alexanderdettke/Documents/GitHub/gfweekly/supabase/functions/gfweekly/index.ts:1407), EF:1638, `vertretung.html:208`. Bezug: P:37, 59, 75.  
   Beide Abschlusswege löschen lediglich `owner_backup`. Ein zuvor auf `alex` oder `warten` gesetztes `gate` bleibt bestehen, ebenso `handover_id` und gegebenenfalls die künstliche Rückkehrfrist. Trotzdem verspricht der Dialog „Die Themen gehen zurück an die Person“ und das Protokoll meldet „Themen wieder bei …“. Grüne und gelbe Zeilen erscheinen außerdem nicht unter „wartet auf dich“, sodass die Einzelrücknahme diesen Fehler nicht zuverlässig auffängt.  
   **Vorschlag:** Den Abschluss als vollständige, überprüfbare Rückgabe implementieren und sämtliche betroffenen Zuordnungen behandeln.

3. **Hoch: Mehrere Abwesenheiten können gegenseitig ihre Zuständigkeiten überschreiben.**  
   Stellen: [20260922_hh_handover_set_ruhe.sql:53](/Users/alexanderdettke/Documents/GitHub/gfweekly/supabase/migrations/20260922_hh_handover_set_ruhe.sql:53), EF:1415, 1517, 1642. Bezug: P:37, 59.  
   Ein Thema kann in mehreren Körben vorkommen. Änderungen und Rücknahmen prüfen nicht, ob dessen aktuelle `handover_id` tatsächlich zur bearbeiteten Abwesenheit gehört. Das Beenden einer alten Abwesenheit löscht dadurch auch eine inzwischen anderweitig eingerichtete Vertretung. Die Sperren auf Korbzeile und Abwesenheit verhindern diesen fachlichen Konflikt nicht.  
   **Vorschlag:** Änderungen an die aktuelle Übergabezuordnung binden und konkurrierende Abwesenheiten ausdrücklich behandeln.

4. **Mittel: Die Einzelrücknahme ist weiterhin nicht atomar.**  
   Stelle: [EF:1503](/Users/alexanderdettke/Documents/GitHub/gfweekly/supabase/functions/gfweekly/index.ts:1503). Vorgabe: P:75.  
   `handover_zurueck` ändert zuerst Thema beziehungsweise Kandidat, danach die Korbzeile und zuletzt das Protokoll. Scheitert Schritt zwei, widersprechen sich Quelle und Korb. Scheitert das Protokoll, wird trotzdem Erfolg geliefert. Parallel kann `handover_set` erneut eine Vertretung eintragen.  
   **Vorschlag:** Auch diese Aktion über eine Datenbanktransaktion mit denselben Zuständigkeitsprüfungen abwickeln. Die Begründung in `TECHNIKSTAND.md:307`, supabase-js könne keine solche Transaktion, trägt nicht: Die bereits eingeführte RPC löst genau dieses Problem.

5. **Hoch: Entscheidungen aus dem normalen Arbeitsablauf fehlen im Vertretungsprotokoll.**  
   Stellen: [EF:1169](/Users/alexanderdettke/Documents/GitHub/gfweekly/supabase/functions/gfweekly/index.ts:1169), EF:1613, `rueckkehr.html:80,94`. Vorgabe: P:59, 75, 85.  
   `decision_add` schreibt nur nach `gfweekly_decisions`. Es gibt keine Verbindung zum Vertretungsprotokoll und live auch keinen entsprechenden Datenbanktrigger. Rückkehrseite und Briefing zählen jedoch ausschließlich `gfweekly_handover_log.art = entscheidung`. Tatsächlich getroffene Entscheidungen können deshalb als null Entscheidungen erscheinen.  
   **Vorschlag:** Entscheidungen während einer Vertretung automatisch und eindeutig dem passenden Protokoll zuordnen.

6. **Hoch: Die Wache lässt sich durch das Notizfeld aushebeln.**  
   Stellen: [uebergabe.html:155](/Users/alexanderdettke/Documents/GitHub/gfweekly/site/uebergabe.html:155), Zeilen 232–235; `20260922_hh_handover_set_ruhe.sql:30–57`. Vorgabe: P:53, 73.  
   Im Wachemodus sind Chips und Frist gesperrt, das Notizfeld bleibt editierbar. Seine Änderung ruft `handover_set` auf. Dadurch wird ein gewöhnlicher ruhender Vorschlag bestätigt und das Thema auf `gate = warten` mit neuer Frist umgehängt. Das widerspricht unmittelbar „nichts wird umgehängt“. Im Backend fehlt ebenfalls eine Prüfung von Stufe und Notfall.  
   **Vorschlag:** Notizen getrennt speichern und die Wachenregel serverseitig durchsetzen.

7. **Mittel: Die ausdrücklich genannte Notfalldefinition wird nicht vollständig erkannt.**  
   Stellen: [EF:327](/Users/alexanderdettke/Documents/GitHub/gfweekly/supabase/functions/gfweekly/index.ts:327), EF:453. Bezug: P:53, 93.  
   „Sicherheit“ gehört laut Vorgabe zur Notfalldefinition, wird aber nicht als solche erkannt. Eine isolierte Ausführung der tatsächlichen Matrix mit „Sicherheit am Eingang“, „Zaun defekt“, nächstem Schritt und morgiger Frist ergibt `F=0`, `ampel=ruht`. Die Oberfläche sperrt diesen Vorgang anschließend.  
   **Vorschlag:** Die Notfallkriterien ausdrücklich modellieren und den Widerspruch zwischen Stichwortliste und abschließender Notfalldefinition auflösen.

8. **Hoch: Offene Abwesenheiten verlieren nach Ablauf der Schätzung ihre Zukunft.**  
   Stellen: [EF:341](/Users/alexanderdettke/Documents/GitHub/gfweekly/supabase/functions/gfweekly/index.ts:341), EF:564, 575, 596, 606. Bezug: P:59, tägliche Aktualisierung.  
   Das Sammelfenster endet dauerhaft bei `bis_geschaetzt` oder `von + 13`. Der Tick stuft zwar hoch, erweitert dieses Fenster aber nicht. Eine weiterhin aktive Abwesenheit ab 01.09. ohne Ende sammelt am 22.09. weiterhin nur bis 14.09. Spätere Termine und Meilensteine fehlen.  
   **Vorschlag:** Bei überschrittener Schätzung ein fortlaufendes Zukunftsfenster verwenden und die überholte Schätzung sichtbar kennzeichnen.

9. **Mittel: Manuell gesetzte Übergabefristen werden beim nächsten Bau überschrieben.**  
   Stellen: [EF:644](/Users/alexanderdettke/Documents/GitHub/gfweekly/supabase/functions/gfweekly/index.ts:644), `20260922_hh_handover_set_ruhe.sql:43,56,66`. Bezug: P:33, 59, 71.  
   Das Fristfeld der Oberfläche verändert nur die Korbzeile. Beim nächsten Bau wird wieder die Quellenfrist eingetragen, auch `null`. Bei ruhenden Themen wird zusätzlich die ursprüngliche Quellenfrist durch die Rückkehrfrist ersetzt; beim Aufheben der Ruhe wird sie gelöscht. Eine ursprüngliche Frist wird nirgends gesichert.  
   **Vorschlag:** Quellenfrist, manuelle Übergabefrist und Wiedervorlage unterscheiden. Explizite Änderungen dürfen nicht kommentarlos verschwinden.

10. **Mittel: Der Korb wird ergänzt, aber fachlich nicht bereinigt.**  
    Stellen: [EF:639](/Users/alexanderdettke/Documents/GitHub/gfweekly/supabase/functions/gfweekly/index.ts:639), EF:1541–1543. Bezug: P:59, 71.  
    Einträge, die nicht mehr gesammelt werden, bleiben unverändert bestehen. Das betrifft beispielsweise verworfene Kandidaten oder archivierte Themen. Umgekehrt kann ein bestätigtes Thema durch die eigene Übergabe aus der Sammelmenge fallen: vorher `gate=lea`, anderer Owner, keine Frist; anschließend `gate=alex`. „Dossier neu“ antwortet dann mit „Vorgang nicht mehr im Fenster“.  
    **Vorschlag:** Bestehende Korbreferenzen unabhängig vom ursprünglichen Auswahlfilter aktualisieren und weggefallene Vorgänge nachvollziehbar markieren.

11. **Mittel: Bei Kandidaten protokolliert die Bestätigung eine Weitergabe ohne entsprechende Quellenänderung.**  
    Stelle: [20260922_hh_handover_set_ruhe.sql:53](/Users/alexanderdettke/Documents/GitHub/gfweekly/supabase/migrations/20260922_hh_handover_set_ruhe.sql:53), Zeilen 94–102. Bezug: P:59, 71, 85.  
    Nur `kind=thema` verändert den ursprünglichen Vorgang. Ein Kandidat kann trotzdem mit Vertretung bestätigt werden und erhält den Protokolltext „geht an Alex“, während sein `gfweekly_news.gate` bei Lea bleibt. Die verschiedenen Ansichten zeigen dadurch unterschiedliche Zuständigkeiten.  
    **Vorschlag:** Kandidaten tatsächlich weitergeben oder den Vorgang ausdrücklich als reine Korbzuordnung kennzeichnen.

12. **Mittel: Ungültige und doppelte Abwesenheiten werden nicht zuverlässig verhindert.**  
    Stellen: [EF:1363](/Users/alexanderdettke/Documents/GitHub/gfweekly/supabase/functions/gfweekly/index.ts:1363), `20260921_hh_vertretung.sql:8`, `vertretung.html:188`. Bezug: P:29, 59, 69.  
    Es fehlen Prüfungen für `bis >= von`, eine gültige Person und widersprüchliche Schätzungen. Die live vorhandenen Constraints decken diese Fälle ebenfalls nicht ab. Der Speichernknopf bleibt während des Aufrufs aktiv. Scheitert der Korbbau nach erfolgreichem Insert, erhält die Oberfläche einen Fehler ohne die bereits angelegte Abwesenheit; Wiederholen legt eine zweite an.  
    **Vorschlag:** Eingaben serverseitig validieren, Anlegen wiederholbar gestalten und einen fehlgeschlagenen Korbbau getrennt vom erfolgreichen Anlegen melden.

13. **Hoch: Der Tick kann Erfolg melden, obwohl Statuswechsel oder Abschluss gescheitert sind.**  
    Stellen: [EF:1607](/Users/alexanderdettke/Documents/GitHub/gfweekly/supabase/functions/gfweekly/index.ts:1607), EF:1624, 1639–1643, 1666. Bezug: P:59, 63.  
    Mehrere Updates werden ohne Fehlerprüfung ausgeführt. Anschließend verändert der Code den lokalen Status trotzdem und antwortet mit `ok:true`. Beim automatischen Abschluss kann die Abwesenheit bereits beendet sein, obwohl Vertretungen nicht geleert wurden; spätere Ticks nehmen sie dann nicht mehr auf. Gleichzeitig gestartete Ticks besitzen keine gemeinsame Ausführungssperre und können Statusprotokolle doppelt schreiben.  
    **Vorschlag:** Statuswechsel transaktional ausführen, Fehler vollständig auswerten und je Abwesenheit nur einen Tick gleichzeitig zulassen.

14. **Hoch: Asana Export ist bei parallelen Aufrufen und unterbrochenen Schreibvorgängen nicht duplikatsicher.**  
    Stellen: [EF:1748](/Users/alexanderdettke/Documents/GitHub/gfweekly/supabase/functions/gfweekly/index.ts:1748), EF:1771–1775, 1814–1818. Vorgabe: P:83.  
    Zwei Aufrufe können gleichzeitig eine leere Projektkennung lesen und jeweils ein Projekt anlegen. Dasselbe gilt für Aufgaben. Zwischen erfolgreichem Asana POST und Speicherung der Kennung besteht außerdem eine ungesicherte Lücke. Der Code beschreibt selbst, dass der nächste Export dann ein zweites Projekt erzeugt.  
    **Vorschlag:** Export je Abwesenheit serialisieren und externe Objekte über eine dauerhaft gespeicherte Zuordnung wiederfinden. `TECHNIKSTAND.md:190`, „es entstehen nie halbe Projekte“, ist nicht haltbar.

15. **Mittel: Der Wiederaufbau eines verschwundenen Asana Projekts übernimmt alte Aufgabenkennungen.**  
    Stellen: [EF:1755](/Users/alexanderdettke/Documents/GitHub/gfweekly/supabase/functions/gfweekly/index.ts:1755), EF:1806–1818. Bezug: P:83.  
    Bei Projektstatus 404 entsteht ein neues Projekt. Vorhandene `row.asana_gid` werden unverändert weiterverwendet. Sind die Aufgaben ebenfalls gelöscht, scheitert der Export an ihrem PUT mit 404 und kommt bei Wiederholung nicht weiter.  
    **Vorschlag:** Projektwechsel und verschwundene Aufgaben gemeinsam behandeln, einschließlich neuer Mitgliedschaften und reparierbarer Kennungen.

16. **Hoch: Das Asana Team wird nicht aus einem bestehenden GF Projekt bestimmt.**  
    Stelle: [EF:1764](/Users/alexanderdettke/Documents/GitHub/gfweekly/supabase/functions/gfweekly/index.ts:1764). Vorgabe: P:83.  
    Ohne explizites Team nimmt der Export das erste nicht archivierte Projekt mit Team aus höchstens zwanzig Workspaceprojekten. Es gibt keine Prüfung, ob es ein GF Projekt ist. Damit können vertrauliche Übergaben im falschen organisatorischen Bereich entstehen.  
    **Vorschlag:** Ein ausdrücklich bestimmtes GF Referenzprojekt verwenden und dessen Team prüfen. Die Dokumentation nennt die Abweichung, ersetzt damit aber keine Freigabe.

17. **Mittel: Der gelbe Aufgabentext erweitert die Entscheidungsvollmacht.**  
    Stelle: [EF:748](/Users/alexanderdettke/Documents/GitHub/gfweekly/supabase/functions/gfweekly/index.ts:748). Vorgabe: P:53, 93.  
    Der Standardtext lautet: „Kommt keine Antwort, gilt dein Vorschlag.“ Das gilt im Code auch bei mittlerer Abwesenheit und enthält keine Wartefrist. Die Vorgabe erlaubt Entscheidungen ohne Einspruchsfrist erst ab Tag 15 bei langer Abwesenheit.  
    **Vorschlag:** Die Kontaktregel und die ausdrücklich freigegebene Ausnahme zeitlich sauber auseinanderhalten.

18. **Mittel: Die Rückkehrseite meldet offene Asana Aufgaben als erledigt.**  
    Stellen: [rueckkehr.html:83](/Users/alexanderdettke/Documents/GitHub/gfweekly/site/rueckkehr.html:83), EF:1531, 791–803. Vorgabe: P:75, 83.  
    „Übernehmen“ setzt den lokalen Korbstatus auf `erledigt`, verändert die Asana Aufgabe aber nicht. Die Asana Kachel zählt anschließend genau diesen lokalen Status als Asana Erledigung. Ein Rücksync einer weiterhin offenen Aufgabe korrigiert das nicht.  
    **Vorschlag:** Rückübernahme und tatsächliche Asana Erledigung in getrennten Zuständen speichern.

19. **Mittel: Archivierung und letzter Rücksync besitzen keinen verlässlichen Wiederholungsweg.**  
    Stellen: [EF:844](/Users/alexanderdettke/Documents/GitHub/gfweekly/supabase/functions/gfweekly/index.ts:844), EF:1409–1421, 1576, 1658–1663. Bezug: P:59, 83.  
    `absence_end` beendet vor der Archivierung und führt keinen abschließenden Sync aus. Archivierungsfehler werden zu `false`; die Oberfläche ignoriert das Ergebnis. Beendete Abwesenheiten werden künftig nicht mehr synchronisiert. Auch ein Fehler beim letzten automatischen Sync kann damit dauerhaft offen bleiben.  
    **Vorschlag:** Externe Abschlussarbeiten als ausstehend speichern und bis zum bestätigten Erfolg erneut bearbeiten.

20. **Mittel: Weitere Mengenbegrenzungen bleiben unsichtbar.**  
    Stellen: [EF:1479](/Users/alexanderdettke/Documents/GitHub/gfweekly/supabase/functions/gfweekly/index.ts:1479), EF:1402, 774, 1675. Vorgabe: P:59, 71, 83.  
    `handover_set_many` verarbeitet still nur die ersten 500 Einträge und kann trotzdem `ok:true` liefern. Andere Sammelabfragen für Abwesenheitszähler, Export und Sync besitzen weder Pagination noch Vollständigkeitsprüfung. Die ausdrücklich dokumentierte Grenze beim Korbbau schützt diese Wege nicht.  
    **Vorschlag:** Überlange Stapel ablehnen oder vollständig abarbeiten; auch Export, Sync und Zähler auf abgeschnittene Ergebnisse prüfen.

21. **Hoch: Die Migrationen sind als geordnete Migrationenkette nicht reproduzierbar.**  
    Stellen: [20260921_hh_asana.sql:10](/Users/alexanderdettke/Documents/GitHub/gfweekly/supabase/migrations/20260921_hh_asana.sql:10), `20260921_hh_vertretung.sql:8`; sämtliche drei Dateien mit Präfix `20260922`.  
    Mehrere Migrationen teilen dieselbe Versionskennung. Zusätzlich steht `hh_asana` alphabetisch vor `hh_vertretung`, verändert aber bereits die erst dort angelegte Abwesenheitstabelle. Die manuelle Anwendung im bestehenden Projekt verdeckt dieses Problem. Supabase verlangt eindeutige Zeitstempel und korrekte Reihenfolge. [Supabase Dokumentation](https://supabase.com/docs/guides/deployment/branching/troubleshooting)  
    **Vorschlag:** Eindeutige aufsteigende Versionskennungen und einen geprüften Wiederaufbau ab dem erforderlichen Basisschema herstellen.

22. **Mittel: Eine abgeschaltete Vertretungslinie lässt sich über die Oberfläche nicht wiederherstellen.**  
    Stellen: [vertretung.html:213](/Users/alexanderdettke/Documents/GitHub/gfweekly/site/vertretung.html:213), Zeile 246; EF:1445. Vorgabe: P:69.  
    Abschalten setzt `active=false`; die Oberfläche blendet diese Zeile anschließend vollständig aus. Beim erneuten Anlegen desselben Bereichs findet das Backend die alte Zeile und antwortet mit 409. Ein Reaktivierungsweg fehlt.  
    **Vorschlag:** Inaktive Zeilen sichtbar reaktivierbar machen oder beim erneuten Anlegen ausdrücklich wieder einschalten.

23. **Mittel: Berliner Kalendertage werden in der Oberfläche weiterhin mit UTC verwechselt.**  
    Stellen: [vertretung.html:160](/Users/alexanderdettke/Documents/GitHub/gfweekly/site/vertretung.html:160), `uebergabe.html:72`, EF:1637. Vorgabe: P:69; Zeitzone Europe/Berlin.  
    `toISOString().slice(0,10)` liefert nachts in Berlin den Vortag. Das betrifft den Standardbeginn und die Anzeige des Abwesenheitstags. Beim Rückkehrzeitpunkt wird ebenfalls ein UTC Datum abgeschnitten und mit einem Berliner Datum verglichen.  
    **Vorschlag:** Kalendertage einheitlich in Europe/Berlin bestimmen; Zeitpunkte für Ablaufdauern nicht durch Abschneiden ihrer UTC Darstellung umdeuten.

24. **Mittel: Gespeicherte Dossierinformationen erreichen die Oberfläche nicht vollständig.**  
    Stellen: [uebergabe.html:166](/Users/alexanderdettke/Documents/GitHub/gfweekly/site/uebergabe.html:166), EF:478–502. Vorgabe: P:57, 71.  
    `d.notizen`, `d.quelle_url` und `d.zieldatum` werden aufgebaut, aber nicht angezeigt. Bei Kandidaten und Terminen fehlt damit insbesondere der gespeicherte Quellenlink. Die geladenen Nachrichtentexte werden ebenfalls nicht dargestellt. Das Dossier enthält mehr, als der Nutzer zur Übergabe tatsächlich lesen kann.  
    **Vorschlag:** Die verlangten Felder einschließlich Notizen und Quellen zugänglich rendern.

25. **Mittel: Der Hinweis auf kommende Abwesenheiten erscheint entgegen der Vorgabe nicht für alle.**  
    Stelle: [index.html:181](/Users/alexanderdettke/Documents/GitHub/gfweekly/site/index.html:181). Vorgabe: P:77.  
    Die eigene kommende Abwesenheit wird ausdrücklich ausgeschlossen. Außerdem verhindern die vorherigen `return` Anweisungen, dass der Hinweis neben einem bestehenden Vertretungsblock erscheint. Gezeigt wird höchstens eine kommende Abwesenheit.  
    **Vorschlag:** Den Vorbereitungshinweis unabhängig von den anderen Vertretungszuständen rendern und die eigene Abwesenheit einschließen.

26. **Mittel: Die mobile Vertretungstabelle läuft über die vorgesehene Breite hinaus.**  
    Stelle: [styles.css:1381](/Users/alexanderdettke/Documents/GitHub/gfweekly/site/assets/styles.css:1381). Vorgabe: P:5, 79.  
    Die vier Spalten bleiben auch mobil nebeneinander; allein das Vollmachtfeld verlangt mindestens 160 Pixel. Die mitgelieferten Aufnahmen `vertretung--390--dark.png` und `vertretung--390--light.png` sind tatsächlich **428 Pixel breit**. Der Prüflauf hat diesen Überlauf nicht beanstandet. Eine entsprechende mobile Tabellenregel fehlt weiterhin.  
    **Vorschlag:** Zeilen auf schmalen Geräten untereinander darstellen und horizontales Überlaufen ausdrücklich prüfen.

27. **Mittel: Die Kontrastabnahme übersieht eine tatsächlich verwendete Farbkombination.**  
    Stellen: [styles.css:1333](/Users/alexanderdettke/Documents/GitHub/gfweekly/site/assets/styles.css:1333), `styles.css:1420`, `uebergabe.html:183`, `pruefung/kontrast.py:65`. Vorgabe: P:21.  
    `.fd-muted` verwendet `--text-3` und erscheint innerhalb des Dossiers auf `--surface-2`. Der berechnete Kontrast beträgt **4,191:1**, verlangt sind mindestens 4,5. Genau dieses Paar wurde aus der Testliste ausgelassen, mit der Begründung, es werde dort nicht mehr verwendet. `TECHNIKSTAND.md:41` behauptet entsprechend fälschlich, die dritte Textstufe stehe nicht mehr auf der zweiten Fläche.  
    **Vorschlag:** Den tatsächlichen Einsatz korrigieren und die Kombination wieder testen.

28. **Mittel: Der vorgeschriebene Asana Fallback wurde durch eine gegenteilige Anweisung ersetzt.**  
    Stelle: [TECHNIKSTAND.md:238](/Users/alexanderdettke/Documents/GitHub/gfweekly/docs/TECHNIKSTAND.md:238), EF:1671. Vorgabe: P:83, 91.  
    Vorgesehen ist Export über Cowork, solange das Token fehlt. H8 untersagt stattdessen ausdrücklich das Anlegen von Aufgaben. Gleichzeitig verspricht die Fehlermeldung der Edge Function weiterhin, der tägliche Auftrag exportiere bis dahin. Das ist eine Änderung des beauftragten Leistungsumfangs und ein interner Widerspruch.  
    **Vorschlag:** Den autorisierten Fallback einschließlich Kennungsrückführung umsetzen oder diese Abweichung ausdrücklich entscheiden lassen.

29. **Hoch: Die Bedienprüfungen bestätigen simulierte Wirkungen statt der Backendwirkung.**  
    Stellen: [testdaten.mjs:187](/Users/alexanderdettke/Documents/GitHub/gfweekly/pruefung/testdaten.mjs:187), Zeilen 213–221 und 259–264; `bedienung.mjs:40–48`. Bezug: P:63, 79, 87.  
    Die Tests fangen sämtliche Backendaufrufe ab. `handover_set` und Rücknahme verändern selbst gebaute JavaScriptobjekte. `absence_end`, `absence_tick`, `deputies_set`, `handover_build` und Dossieraktionen dürfen pauschal erfolgreichen Leerinhalt zurückgeben. Die Personen heißen im Test „Alex“ und „Lea“, wodurch der reale Namensfehler unsichtbar bleibt. Erfolgreicher Asana Export wird überhaupt nicht simuliert, nur das fehlende Token.  
    **Vorschlag:** Diese Tests als Oberflächentests kennzeichnen und durch Integrationstests für tatsächliche RPC Wirkung, Fehlerfälle, Nebenläufigkeit, vollständige Namen und Asana Lebenszyklus ergänzen.

30. **Mittel: Auch die übrigen Prüfskripte reichen nicht für ihre Abnahmeaussage.**  
    Stellen: [schirme.mjs:78](/Users/alexanderdettke/Documents/GitHub/gfweekly/pruefung/schirme.mjs:78), `bedienung.mjs:28`, `matrix-test.mjs:24–38`, `korb-probe.mjs:21–37`.  
    Die Schirmprüfung kontrolliert Textlänge, Navigation und Fehlermeldungen, aber keine Überlagerung, abgeschnittene Bedienelemente oder Breitenüberschreitung. Bedienproben laufen ausschließlich bei 1440 Pixeln im dunklen Thema. Mehrere Matrixerwartungen verwenden feste Oktoberdaten ohne festen Bewertungsstichtag und werden später allein durch Zeitablauf falsch. Die Korbprobe druckt Ergebnisse derselben Matrix aus, prüft aber keine unabhängigen Sollwerte und nicht die tatsächliche Sammelfunktion.  
    **Vorschlag:** Stichtage fixieren, Sammlung und Persistenz separat prüfen und mobile Bedienwege sowie Layoutgrenzen als echte Assertions ergänzen.

31. **Mittel: Zwischenstopps und Versionsregel wurden nicht eingehalten.**  
    Stellen: [ARBEITSSTAND.md:3](/Users/alexanderdettke/Documents/GitHub/gfweekly/ARBEITSSTAND.md:3), `site/vertretung.html:13,63`; Änderungen an `core.js` in `6a2d26e` und `4af3c77`. Vorgabe: P:3, 5, 21, 63, 79, 87.  
    Der Arbeitsstand erklärt ausdrücklich, wegen Nichterreichbarkeit ohne Zwischenstopps weiterzuarbeiten. Die vorgelegte Anweisung erlaubt diese Ausnahme nicht. Außerdem blieb `?v=24` trotz späterer Änderungen an gemeinsamen Assets unverändert.  
    **Vorschlag:** Den Prozessverstoß dokumentieren und künftig die vereinbarten Stopps sowie Versionsänderungen tatsächlich ausführen. Ob vor jedem historischen Deploy ein Diff erfolgte, lässt sich aus dem Repository allein nicht beweisen.

32. **Niedrig: Weitere ausdrücklich verlangte Oberflächendetails wurden anders umgesetzt.**  
    Stellen: [uebergabe.html:87](/Users/alexanderdettke/Documents/GitHub/gfweekly/site/uebergabe.html:87), Zeilen 99–110; `vertretung.html:149`. Vorgabe: P:67, 69, 83.  
    „Nach Asana“ ist `btn-brand`, kein Primärknopf. Quadranten und Übernahmefähigkeit verwenden eigene Konstruktionen statt der verlangten gemeinsamen Kachelbausteine. Die behauptete allgemeine Regel „genau eine Hauptaktion“ in `TECHNIKSTAND.md:303` hebt die konkrete Paketvorgabe nicht auf.  
    **Vorschlag:** Die geforderten Komponenten und Aktionshierarchien umsetzen oder die Abweichungen ausdrücklich abnehmen lassen.

33. **Hoch: Die Dokumentation erklärt Paket 4c umfassender für abgenommen, als ihre eigenen Belege hergeben.**  
    Stellen: [README.md:120](/Users/alexanderdettke/Documents/GitHub/gfweekly/README.md:120), `ARBEITSSTAND.md:60–66`, `FRAGEN_FUER_MORGEN.md:40`, `TECHNIKSTAND.md:382–386`. Vorgabe: P:87.  
    Konkrete Aussagen sind „Paket 4 … fertig, Abnahme 4c gelaufen“ und „Abnahme 4c ist gelaufen“. Dokumentiert sind Projektanlage, Erledigung einer Aufgabe, Rücksync und Archivierung. Nicht belegt sind mindestens zehn Aufgaben, geprüfte Empfänger und Themenlinks sowie der vollständige manuelle Durchlauf von Abschnitt H mit Kalendertest. Das geforderte Löschen des Projekts ist laut `FRAGEN_FUER_MORGEN.md:12` sogar ausdrücklich noch offen.  
    **Vorschlag:** Abnahme in einzelne Kriterien zerlegen und unerfüllte beziehungsweise nicht belegte Punkte offenlassen. Archivierung erfüllt die verlangte Löschung nicht.

34. **Niedrig: Die vier Statusdokumente enthalten weiterhin widersprüchliche aktuelle Aussagen.**  
    Stellen: [ARBEITSSTAND.md:7](/Users/alexanderdettke/Documents/GitHub/gfweekly/ARBEITSSTAND.md:7), `FRAGEN_FUER_MORGEN.md:8,28`, `README.md:112`, `TECHNIKSTAND.md:202`.  
    „Offen ist nur noch der Push“ widerspricht bereits den eigenen offenen Punkten. „origin/main kennt ihn noch nicht“ ist beim geprüften Stand falsch; beide Referenzen stehen auf `ad5719e`. „ping meldet 30“ widerspricht dem bytegleich ausgelieferten Code mit Version 32. „Nach Asana … als Primärknopf“ widerspricht der tatsächlichen Klasse und der späteren Dokumentation der bewussten Abweichung.  
    **Vorschlag:** Einen eindeutigen aktuellen Status führen und historische Aussagen entsprechend kennzeichnen.

Die größten verbleibenden Risiken sind falsche oder verlorene Zuständigkeiten beim Übergang zwischen Abwesenheit und Rückkehr, unsichtbare Entscheidungen, unvollständige Körbe bei längerer Abwesenheit und doppelte beziehungsweise nicht sauber abgeschlossene Asana Vorgänge. Die vorhandenen Prüfungen sichern gerade diese Übergänge nicht ab; mehrere Dokumentationsaussagen vermitteln deshalb mehr Verlässlichkeit, als die Umsetzung bietet.

**Der geprüfte Stand ist nicht abnahmefähig.**