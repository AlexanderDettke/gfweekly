# Reifegrad interner Anwendungen

Öffentliche Lesefassung 1.0 vom 17.10.2026. Grundlage: reifegrad-standard.md, Stand 12.10.2026. Art: ergänzender Anwendungsstandard. Die Quelle nennt Alexander als Verantwortlichen und den Habitat Hub als Vorbild. Eine ausdrückliche Annahme für jedes genannte Werkzeug ist darin nicht gesondert belegt.

## Zweck und Geltung

Menschen sollen erkennen, was sie im Alltag verwenden können und wo noch Lücken bestehen. Die Stufe wird an genau einer Stelle gepflegt und überall gleich angezeigt. Die Quelle richtet sich an interne Anwendungen mit mehreren Seiten oder Modulen. Eine Übernahme in ein anderes Werkzeug benötigt dessen passende Entscheidung; Firmen und Datenbestände bleiben getrennt.

## Warum dieser Standard sinnvoll ist

Eine sichtbare, belegte Reife verhindert, dass eine erreichbare Seite bereits als fertig gilt. Ein gemeinsamer Pflegeort vermeidet widersprüchliche Zeichen in Navigation und Übersicht. Ob die Kennzeichnung im Alltag hilft, bleibt am jeweiligen Werkzeug zu prüfen.

## Vier Stufen und eine Ausnahme

1. **Stabil.** Grüner Haken. Fertig für den Alltag, läuft verlässlich und hat keine bekannten Blocker.
2. **Beta.** Stift in der Akzentfarbe. Nutzbar, während Feinschliff und unkritische Ergänzungen laufen.
3. **Vorschau.** Bernsteinfarbenes Warndreieck. Der Kern funktioniert; wichtige Teile fehlen oder sind ungeprüft.
4. **Experiment.** Rote Glühbirne. Im Bau und nicht für den Betrieb vorgesehen.
5. **Ausgenommen.** Probe, Muster, Test und Weiterleitungsseiten ohne Kennzeichen. Diese Ausnahme wird ausdrücklich erfasst.

Ohne Eintrag gilt eine Seite nach der Quelle als Experiment. Viele Warnzeichen sollen ein Anlass sein, den tatsächlichen Bestand zu verbessern; sie rechtfertigen keinen unbelegten Aufstieg.

## Anzeige und Bedienung

Ein Symbol steht neben dem Seitennamen in der Navigation. Ein Glossar erklärt oben alle vier Zeichen mit ihren Namen und verlinkt auf die Übersicht Stand der Werkzeuge. Mobil stehen Glossar und Zeichen im passenden Menü und in der unteren Navigation. Auf den einzelnen Seiten sieht die Quelle keine zusätzlichen Banner oder Bestätigungsdialoge vor.

Die Übersicht gruppiert Seiten nach Stufe und zeigt Titel als Link, Hinweis, Verantwortung und Datum. In den letzten sieben Tagen stabil gewordene Seiten tragen Neu freigegeben. Die Quelle bezeichnet die Übersicht selbst als Stabil; bei einer Übernahme ist auch diese Einstufung fachlich zu prüfen.

Farbe allein reicht nicht: unterschiedliche Symbole, sichtbare Begriffe im Glossar und verständliche Namen für Vorlesesoftware ergänzen sich. Das jeweilige Designsystem bleibt maßgeblich. Helle und dunkle Darstellung sowie 390 und 1440 Pixel sind zu prüfen.

## Eine führende Übersicht

Eine Datei oder Tabelle führt alle Einträge. Navigation, Glossar und Übersicht lesen denselben Stand. Eine Datei im Repository genügt, wenn eine Änderung mit der nächsten Veröffentlichung wirksam werden darf. Eine Tabelle ist erst nötig, wenn Stufen unabhängig davon geändert werden sollen.

Je Seite enthält der Eintrag pfad, titel, stufe, seit, verantwortlich und eine ganze version ab 1. Bei Beta, Vorschau und Experiment kommt ein konkreter hinweis hinzu. freigegeben_am hält den Übergang zu Stabil fest. Pfade stimmen mit den tatsächlichen Routen überein. Änderungen an Stufe oder Hinweis erhöhen die Version; das Stufendatum beschreibt die letzte Stufenänderung.

Ein Hinweis erklärt kurz: Was geht? Was fehlt? Was passiert mit eingegebenen Daten? Beispiel: Kontakte anlegen und suchen funktioniert. Der Export fehlt noch. Deine Eingaben werden gespeichert. Probleme bitte an die verantwortliche Person.

## Aufstieg und Entscheidung

Die entwickelnde Person schlägt den Aufstieg mit Belegen vor; nach der Quelle entscheidet Alexander. Bei einer Übertragung ist die zuständige Rolle ausdrücklich zu bestätigen.

1. **Experiment zu Vorschau.** Die Kernfunktion funktioniert durchgehend, bekannte Lücken sind beschrieben.
2. **Vorschau zu Beta.** Alltagskritische Lücken sind beseitigt; mindestens eine zweite Person hat die Seite benutzt. Die Quelle verlangt zusätzlich Kein Datenverlust möglich. Diese absolute Formulierung bleibt fachlich klärungsbedürftig: Tests können konkrete Verlustfälle prüfen, aber keine unbegrenzte Garantie geben.
3. **Beta zu Stabil.** Nach der Quelle zwei Wochen ohne gemeldete Blocker und bestandene Abnahme nach project-release-handover, falls dieser Skill verfügbar ist. Hinweis entfernen und Freigabedatum setzen. Zwei Wochen ohne Meldung allein beweisen weder Nutzung noch Zuverlässigkeit.

Bei Fehlern ist ein Abstieg mit aktualisiertem Hinweis und höherer Version möglich. Technische Prüfung, fachliche Freigabe und beobachtete Nutzung bleiben getrennt.

## Einführung und laufende Prüfung

Die Quelle sieht drei Schritte mit gesonderter Freigabe vor: erst Inventur mit Vorschlägen und konkreten Hinweisen, dann Mechanik mit Beispielseiten und Bildschirmnachweisen, zuletzt vollständige Einträge, strenge Prüfung und Veröffentlichung. Die Aufnahme dieses Texts startet keine Einführung in bestehenden Anwendungen.

Die automatische Prüfung gleicht Routen und Einträge ab. Sie beanstandet fehlende oder doppelte Pfade, unbekannte Stufen, fehlende Pflichtfelder und fehlende Hinweise. Einträge ohne erreichbare Route werden kenntlich gemacht. Eine Stufenänderung muss nach Veröffentlichung in Navigation, Glossar und Übersicht zusammenpassen. Neue Seiten starten als Experiment; entfallene Seiten werden im führenden Bestand nachvollziehbar entfernt.

## Herkunft und Grenzen

Der Originaltext enthält zusätzlich eine konkrete Agentenanweisung und einen internen Prüfskriptverweis. Sie werden nicht automatisch in fremde Projekte oder deren Anweisungen übernommen. Diese öffentlich aufbereitete Lesefassung erhält das Modell und kennzeichnet offene Aussagen. Die Originaldatei bleibt unverändert. [Herkunft der Bibliothek](QUELLEN.md).
