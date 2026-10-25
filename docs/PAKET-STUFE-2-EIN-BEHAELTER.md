# Paket · Stufe 2 · Ein Behälter, der Lauf erledigt selbst · Entwurf 25.10.2026

Auftraggeber: Alex. Anlass (25.10.2026, nach Stufe 1): „Ich frage mich, warum es Lea und mich brauchen soll. Die Vorschläge müssen besser
werden, und das Erledigte sollte sich aus dem Kontext oder den Mails ergeben.“ Dieses Paket nimmt Stufe 2 aus dem Zielbild (ein Behälter)
auf und ergänzt sie um das, was Stufe 1 offen gelassen hat: Fristen und Dringlichkeit, Mehrfachaktionen, die Übergabe, und vor allem die
Läufe, die heute vorschlagen statt zu erledigen. Es läuft wie Stufe 1 in der Terminal-Sitzung ohne Rückfragen durch, mit eigener Prüfung,
Codex-Gegenprüfung und Korrekturrunden bis zum Push; Cowork spielt danach die Lauf-Aufträge ein.

Repo: ~/gfweekly (der Klon unter ~/Documents/GitHub/gfweekly existiert nicht mehr) · Live: https://kompass.wildehabitate.de/ ·
Supabase: bnfmupnmqyrcltrphfak · Edge Function: gfweekly (Stand 25.10.2026: main `4bced15`, Function `48090da`, Version 41).
Maßgeblich: `organisationsstandards/` (ORG-001 bis ORG-004) und `WEBAPP-PILOT-0.2`; gemeinsamer Regelkern KERN.md 1.0.2.

## 0 · Vorhabenvermerk (ORG-001, ORG-002)

**Ablauf heute, gemessen am 25.10.2026.**

- Die täglichen Läufe haben seit dem 14.09. **375 Kandidaten** erzeugt; **18** wurden übernommen (5 Prozent), 29 verworfen, 293 archiviert
  (davon 290 am 22.10. in einem Aufräumen). Aus Mails: 186 erzeugt, 4 übernommen (2 Prozent). Seit dem 21.09. wurde in vier Wochen **kein
  einziger** Kandidat mehr übernommen. Der Sichtungskorb ist tot, der Lauf füllt ihn weiter.
- Der Vorhaben-Abgleich hat **54 Vorschläge** im Verlauf (Punkt erledigt, Stand geändert); **einer** wurde bestätigt. Der Lauf erkennt also,
  liest in:sent und die eingegangenen Mails (Quellen B, C, F im Abgleichtext), aber das Modell „Lauf schlägt vor, Person bestätigt“ wird
  nicht bedient. Erledigtes bleibt offen, weil niemand den Haken setzt.
- **53 offene Themen**, 37 davon seit über drei Wochen unbewegt; 19 tragen Priorität „hoch“, vergeben vom Lauf beim Anlegen nach dem Ton der
  Quelle. 13 von 23 Themen im Ausgang „warten“ tragen eine Frist aus dem Aufräumen („alle Vorschläge übernehmen“). Tatsächlich überfällig ist
  **ein** Thema. Die Oberfläche zeigt jede dieser Daten als Frist und jede Einschätzung als Priorität; das Bild ist drastischer als die Lage.
- Die **Übergabe** zu Leas Urlaub (14. bis 25.10.) hält 59 Einträge, 33 davon unbestätigt, 18 im Feld „vorher“. Die Einordnung macht der
  Korbaufbau automatisch; ein „Erledigt“ gibt es dort nicht. Nach dem Urlaub ist der Korb gegenstandslos, aber sichtbar.
- Der Einwurf (Knopf, Sprache, WhatsApp, Mail) wurde **einmal** genutzt. Punkte entstehen fast nur aus WhatsApp-Notizen, die Alex selbst
  einwirft.

**Eingabe von Alex (Mail an Lea zur Rückkehr, 25.10.2026).** Alex ordnet die letzten zehn Tage in die drei Phasen ein: **Systembau**
(Standards, Regeln, Organisationsseite, Flughöhen), **Launch** (Draußenbande gestartet; Testwebseiten und Entwürfe für die anderen
Festivals, Entscheidung je Variante offen; XCeed-Einrichtung vorbereitet, Freischaltung steht aus; Bildplattform und Werkstätten für
Content) und **Formatpartner** (Helges Plattform und Amelies Tabelle im Hub zusammengeführt, Bewerbungen laufen ein, Automatisierung von
Carotta, Rollen offen). Seine Diagnose deckt sich mit den Zahlen: „Durch die Arbeit mit KI kommen sehr viele Themen gleichzeitig hoch; alles
wird offengelegt, jedoch nicht hinreichend korrekt priorisiert.“ Er schlüsselt deshalb nach Menschen auf. Vier Fragen stellt er zur
gemeinsamen Entscheidung: (1) Was folgt aus Leas XCeed-Analyse? (2) Welche Strategie und Darstellung für die offenen Formatpartner-Kandidaten?
(3) Wer übernimmt welche Aufgaben rund um Launch und Formatpartner? (4) Welche Werkzeuge entwickeln wir gezielt weiter, welche lassen wir
laufen? Dazu der Grundsatz: Mehrere Werkzeuge parallel sind in Ordnung, solange klar ist, wer was macht und wo die aktuellen Informationen
liegen (das ist ORG-002, Datenführung). Daraus folgen für dieses Paket drei Verfeinerungen: die drei Phasen werden das Ordnungsprinzip
(Teil 3), die Rückkehr wird ein Lagebild nach Phasen und Menschen statt eines Korbs (Teil 5), und die vier Fragen kommen als Entscheidungen
der GF in die Liste (Teil 1).

**Befund.** Es fehlt nicht am Modell, sondern an drei Stellen im Ablauf: (1) Der Lauf darf nichts erledigen, nur vorschlagen; (2) der Lauf
hat keine Schwelle, jeder Treffer wird Kandidat; (3) die Oberfläche behandelt Vorschläge (Frist, Priorität, Zuordnung) wie Entscheidungen.
Ein stärkeres Modell macht bessere Zuordnungen und Formulierungen, ändert aber nichts an (1) bis (3). Deshalb zuerst der Ablauf, dann das
Modell (Teil 6).

**Ergebnis Stufe 2.** Ein Behälter: das Vorhaben mit Punkten, Verlauf und Entscheidungen. Der Lauf erledigt Punkte, deren Erledigung Mails
oder Verlauf belegen, selbst, mit Beleg und Rückgängig; er ordnet zu, wenn der Bezug eindeutig ist; er legt nur noch an, was über einer
Schwelle liegt, und höchstens so viel, dass Alex und Lea es in fünf Minuten am Tag sichten. Themen, Kandidaten, Board, Kacheln, Liste und
Aufräumen verschwinden aus der Navigation (Dateien bleiben). Fristen und Prioritäten zählen nur noch, wenn eine Person oder ein Punkt sie
gesetzt hat. Die Entscheidungsliste lässt sich in Mehrfachaktionen aufräumen und zeigt zuerst, was zum Fokus gehört (Aufbau der
Organisation, Start der Launches).

**Vorhandene Lösung zuerst (ORG-001 Schritt 3).** Alles baut auf Stufe 1 auf: `hh_entscheidungen`, `hh_entscheidungen_sammeln`, der Korb,
die Abgleich-Aufträge in Cowork, `hh_themen_sammeln` (Archiv mit Grund), `hh_verlauf_status`. Neu sind Regeln und Schwellen, kein zweites
System.

**Datenführung.**

| Informationsart | Führender Ort | Pflege | Konfliktregel |
|---|---|---|---|
| Vorhaben, Punkte, Verlauf | `hh_vorhaben`, `hh_vorhaben_punkte`, `hh_vorhaben_verlauf` | Lauf und Personen | Person vor Lauf; der Lauf schreibt nur mit `created_by 'lauf'`, Beleg (`source_ref`, `source_url`) und `sicherheit` |
| Entscheidungen | `hh_entscheidungen` | Lauf legt an und formuliert; Personen entscheiden | wie Stufe 1 |
| Phase eines Vorhabens (Systembau, Launch, Formatpartner, sonstiges) und Fokus | `hh_vorhaben.phase text`, `hh_vorhaben.fokus boolean` | Startbelegung durch das Paket, danach Alex und Lea (Chips in der Akte) | nur Personen; der Lauf schlägt eine Phase für neue Vorhaben vor, setzt sie nicht |
| Frist einer Entscheidung | `hh_entscheidungen.frist` mit `frist_quelle` | Punkt oder Person; Lauf nur als Vorschlag (`frist_vorschlag`) | Vorschlag zählt nie als Frist |
| Priorität | entfällt als Feld der Oberfläche; `relevance` des Laufs bleibt Datenmaterial | Lauf | zeigt die Oberfläche als „Einschätzung des Laufs“, sortiert nie danach |
| Erledigt-Erkennung | Verlaufseintrag `art system`, `status bestaetigt`, `created_by 'lauf'`, `sicherheit 'sicher'`, dazu Punkt `erledigt_by 'lauf'` | Lauf | Rückgängig 7 Tage über `hh_punkt_toggle`; danach bleibt es |
| Themen (Altbestand) | `gfweekly_topics` bis zur Auflösung, danach Archiv (`archiv_grund 'stufe2:<punkt|verlauf|vorhaben>'`) | einmalig Lauf, Person bestätigt nur Unsicheres | nichts löschen |
| Kandidaten | `gfweekly_news kind kandidat` nur noch als Vorschlag an ein Vorhaben (`vorhaben_vorschlag`), mit Schwelle und Tagesdeckel | Lauf | wird nach 14 Tagen ohne Reaktion `verfallen` |

**Erfolgskriterium (ORG-003), vier Wochen ab Live-Gang.** (a) Trefferquote des Laufs: von dem, was der Lauf neu anlegt (Punkte, Vorschläge
an Vorhaben), werden mindestens 50 Prozent übernommen oder bleiben unbeanstandet (heute 5 Prozent bei Kandidaten). (b) Erledigt-Erkennung:
mindestens 70 Prozent der vom Lauf erledigten Punkte bleiben erledigt (kein Rückgängig). (c) Entscheidungsliste unter 15 offenen Einträgen.
(d) Alex und Lea verbringen am Tag höchstens fünf Minuten mit Sichtung; gemessen als Zahl der Einträge, die der Lauf zur Sichtung vorlegt
(Deckel 5 am Tag, Teil 6). Abbruch, wenn (b) nach zwei Wochen unter 50 Prozent liegt: dann wird die Erledigt-Erkennung wieder auf
„Vorschlag“ gestellt und die Ursache geklärt.

## 1 · Sofort, am ersten Tag der Sitzung (Daten, kein Seitenbau)

1. **Leas Eingang statt Korb.** Der Übergabekorb war die Liste *vor* der Abreise (was vorher erledigt sein muss, wer vertritt). Mit dem Ende
   der Abwesenheit wird er nicht gelöscht, sondern abgeschlossen (`absence_end`, Rückkehr-Seite): offene Korbzeilen gehen als „in Leas
   Abwesenheit liegen geblieben“ in den Verlauf der jeweiligen Vorhaben, bestätigte Übergaben enden, die Marke „Vertretung“ verschwindet.
   Was Lea an ihrem ersten Tag braucht, liefert die Rückkehr-Seite nach Teil 5: ein Lagebild der zehn Tage nach den drei Phasen und nach
   Menschen, mit dem, was auf sie wartet.
2. **Die vier Fragen aus Alex' Mail** werden Punkte mit `wer 'GF gemeinsam'` an den passenden Vorhaben und erscheinen damit sofort in der
   Entscheidungsliste und in der Besprechung: (1) „Was folgt aus Leas XCeed-Analyse?“ am Vorhaben XCeed; (2) „Welche Strategie und
   Darstellung für die offenen Formatpartner-Kandidaten?“ am Vorhaben Partnersuche Phase 2; (3) „Wer übernimmt welche Aufgaben rund um
   Launch und Formatpartner?“ am Vorhaben Rolle Helge ab 2027 (oder einem neuen Vorhaben „Aufgabenverteilung Launch und Formatpartner“, wenn
   die Sitzung das passender findet); (4) „Welche Werkzeuge entwickeln wir weiter, welche lassen wir laufen?“ am Vorhaben Habitat Hub und
   Aufgabenbereiche. Dazu aus derselben Mail: (5) je Festival mit Testwebseite ein Punkt „Variante der Webseite festlegen“ mit `wer 'GF
   gemeinsam'` an den Launch-Vorhaben (Fluidity, Wilde Möhre, Lusatia, by nature; Draußenbande ist gestartet), damit die Entscheidung je
   Variante in der Liste steht; (6) am Vorhaben XCeed ein Punkt „Freischaltung für die Einrichtung“ mit `wer 'Alex'` und Frist 26.10.
   Quelle je Punkt: `Mail Alex an Lea 25.10.2026`. Dazu je Punkt der Vorschlag aus der Mail als `stand`.
3. Die 54 offenen Vorschläge im Vorhaben-Verlauf werden nicht von Hand abgearbeitet; Teil 6 lässt den Lauf sie mit den neuen Regeln neu
   bewerten (sicher → erledigt, sonst verfallen).
4. Die Zeitplan-Migration aus dem Board-Paket (`20261023231949`) anwenden, falls noch nicht geschehen.

## 2 · Fristen und Dringlichkeit (Migration `<zeitstempel>_stufe2_fristen.sql`, Edge Function, Oberfläche)

1. `hh_entscheidungen`: neue Spalte `frist_vorschlag date null`. `hh_entscheidungen_sammeln` schreibt eine Frist nur noch aus Punkten
   (`frist_quelle punkt`) oder von Hand; eine `gate_frist` von Themen und Kandidaten landet in `frist_vorschlag`, nie in `frist`. Bestehende
   Zeilen mit `frist_quelle` in (thema, kandidat) werden in der Migration umgezogen (`frist_vorschlag = frist`, `frist = null`).
2. `enRechne`: Zustand, Zähler, „überfällig“ und Sortierung nur aus `frist`. `frist_vorschlag` erscheint als „Vorschlag: bis TT.MM.“ in der
   Herkunftszeile; ein Klick übernimmt es als Frist (`entscheidung_set frist`).
3. Priorität der Themen (`priority`, `relevance`) verschwindet aus Liste, Für dich und Besprechung; wo sie noch steht (Board, Liste, bis zur
   Auflösung in Teil 4), heißt sie „Einschätzung des Laufs“ und sortiert nicht.
4. Für dich: der Block „Deine Entscheidung“ zeigt zuerst Entscheidungen zu Fokus-Vorhaben (Teil 3), dann die übrigen; ohne Frist kein
   Warnton.

## 3 · Fokus und Mehrfachaktionen (Oberfläche, Edge Function)

1. `hh_vorhaben.phase text` mit CHECK (systembau, launch, formatpartner, sonstiges) und `fokus boolean default false`. Das bestehende Feld
   `metaphase` trägt heute bei allen Vorhaben denselben Text („Systembau, Launch und Formatpartner“) und bleibt als Beschriftung der
   Metaphase. Startbelegung in der Migration: Gruppe `launch` → launch; `partner` und `kollektive` → formatpartner; `system` und
   `habitat-hub`, `kompass`, `organisation` → systembau; `team` (Rolle Helge, Backoffice, Booking) → sonstiges, außer Rolle Helge
   (formatpartner, weil Frage 3 dort hängt); `geld` (Liquidität, Infield, GLS) → sonstiges. `fokus = true` für launch und formatpartner
   sowie Habitat Hub. In der Akte zwei Chips: Phase (vier Werte) und Fokus; nur Alex und Lea. Für dich, Entscheidungsliste, Besprechung und
   Rückkehr ordnen nach Phase in der Reihenfolge Launch, Formatpartner, Systembau, sonstiges; innerhalb der Phase nach Frist.
2. Entscheidungsliste: Abschnitt „Fokus“ zuerst (Entscheidungen mit Vorhaben im Fokus), dann die Abschnitte nach Fristzustand für den Rest,
   zuletzt „Noch keine Frage“. Zähler-Kachel „im Fokus“ ersetzt „mit Vorschlag“.
3. Mehrfachauswahl in der Entscheidungsliste wie im Board (Muster `hh_themen_sammeln`): Auswählen, dann **Nicht jetzt** (vertagen bis Datum,
   Standard erster Montag nach vier Wochen), **Abgeben** (Alex, Lea, Team), **Hinfällig** (Quelle schließen: Punkt erledigt mit Grund
   „hinfällig“, Thema archiviert, Kandidat verworfen). Je Zeile eigener Rückweg, Rückgängig 10 Sekunden gesammelt, Konflikt je Zeile.
   Neue Funktion `hh_entscheidungen_sammelaktion(p_items, p_aktion, p_wert, p_by)`, eine Unter-Transaktion je Zeile.
4. Besprechung: Agenda = Fokus zuerst; „Überspringen“ bleibt; neu „Nicht jetzt“ als vierter Knopf (vertagen auf den Standardtermin ohne
   Datumswahl).

## 4 · Ein Behälter: Themen und Kandidaten auflösen (Migration `<zeitstempel>_stufe2_ein_behaelter.sql`, Lauf, Oberfläche)

1. Einmalige Auflösung der 53 offenen Themen durch den Lauf (Cowork, Abschnitt 7, Auftrag „Stufe 2 · Themen auflösen“), nicht von Hand:
   - Thema mit `vorhaben_id` und einem Satz, der eine Handlung nennt → **Punkt** am Vorhaben (`titel` aus dem Thema, `quelle 'thema:<id>'`,
     `wer` aus `gate`/`owner`, `frist` aus `gate_frist` nur, wenn `gate_by` eine Person ist).
   - Thema mit `vorhaben_id` ohne Handlung (Information, Hintergrund) → **Verlaufseintrag** (`art notiz`, `text` aus Titel und Kontext,
     `source_ref 'thema:<id>'`).
   - Thema ohne `vorhaben_id`: Lauf schlägt Vorhaben vor (`vorhaben_vorschlag`); bei `sicherheit 'sicher'` ordnet er zu und verfährt wie oben;
     sonst **Korb** (bestehend) mit dem Vorschlag; was nach 14 Tagen niemand zuordnet, geht ins Archiv (`archiv_grund 'stufe2:unzugeordnet'`).
   - Jedes aufgelöste Thema: `archived = true`, `archiv_grund 'stufe2:<punkt|verlauf|vorhaben>'`, und die Entscheidung dazu (falls offen)
     wechselt auf die neue Quelle (`quelle_art punkt`, `quelle_id` neuer Punkt) statt hinfällig zu werden. Dafür `hh_entscheidung_umhaengen(p_id, p_art, p_quelle_id)`.
   - Wiederkehrende Themen (`kind recurring`): Verlaufseintrag und Archiv; Rituale bleiben in `jahr.html`.
2. Kandidaten: der Lauf legt keine Themen mehr an; ein Kandidat ist nur noch ein **Vorschlag an ein Vorhaben** (Teil 6). Die 35 offenen
   Kandidaten werden wie Themen ohne Vorhaben behandelt (sicher → Verlaufseintrag am Vorhaben, sonst Korb, nach 14 Tagen `verfallen`).
3. Navigation: Themen (Board, Kacheln, Liste), Aufräumen, Eingabe (`capture.html`) raus; `board.html?topic=` bleibt als Archivansicht für
   Links aus Beschlüssen erreichbar. „Vorhaben“ bekommt den Einwurf als einzigen Eingang. Zähler `themenBadge`, `newsBadge` entfallen; der
   Neuigkeiten-Badge zeigt nur noch offene Vorschläge im Korb.
4. `entscheidungen_list` und `korb_list` liefern nach der Auflösung nur noch Punkte als Quellen; Code für Themen und Kandidaten bleibt für
   den Altbestand im Archiv (nicht entfernen, nicht anzeigen).

## 5 · Rückkehr und Übergabe (Oberfläche, Edge Function)

**Rückkehr („Seit du weg warst“).** `rueckkehr.html` zeigt heute nur Vorhaben, die übergeben waren oder ruhten. Neu: ein Lagebild für die
zurückkehrende Person über den Zeitraum der Abwesenheit, aufgebaut aus dem Verlauf (`hh_vorhaben_verlauf`), den Entscheidungen
(`hh_entscheidungen`, entschieden, abgegeben, offen an diese Person) und den Punkten (`wer` diese Person oder GF), nicht aus dem Korb.
Aktion `rueckkehr_lage {absence_id}`:
1. Drei Blöcke nach Phase (Launch, Formatpartner, Systembau; sonstiges eingeklappt), je Block: *Entschieden* (Beschlüsse und erledigte
   Punkte mit Datum und wer), *Bewegt* (Vorhaben mit Verlauf, höchstens drei Zeilen je Vorhaben, Link zur Akte), *Wartet auf dich*
   (Entscheidungen, die an Lea abgegeben oder GF-gemeinsam offen sind; Punkte mit `wer` Lea; Korbzeilen, die liegen geblieben sind).
2. Darunter „Nach Menschen“: dieselben Punkte und Entscheidungen gruppiert nach `wer` (Lea, Alex, GF gemeinsam, Helge, Amelie, Carotta,
   Christian, …), damit die Aufgabenverteilung (Frage 3) am Bildschirm besprochen werden kann; „Abgeben“ und „Entschieden“ wie in der Liste.
3. Oben ein Absatz, den der Lauf schreibt (Aktion `rueckkehr_brief`, Cowork, Teil 7): fünf bis acht Sätze nach dem Muster von Alex' Mail
   (Phase, was geschah, was offen ist), mit Quellenangaben auf Akten; Alex kann ihn vor Leas erstem Tag im Kompass lesen und ändern
   (`entscheidung_set`-ähnlich: `rueckkehr_brief_set`). Ohne Lauf steht dort der Hinweis „noch kein Brief“, die Blöcke darunter tragen.
4. „Willkommen zurück“ schließt die Abwesenheit (`absence_end`), schreibt liegen gebliebene Korbzeilen als Verlaufseintrag an ihr Vorhaben
   und leert die Marken auf Für dich und Besprechung.

**Übergabe (vor einer Abwesenheit).**
1. Der Korb einer Abwesenheit enthält nur noch Vorhaben und ihre offenen Punkte (keine Themen, keine Kandidaten).
2. Je Zeile ein Knopf **Erledigt** (Punkt erledigt über `hh_punkt_toggle`, Vorhaben über die bestehende Abschlussfunktion) und **Ruht**;
   `handover_set` lernt `status 'erledigt'`.
3. Der Korbaufbau setzt „vorher“ nur, wenn die Frist des Punktes vor der Abreise liegt und von einer Person stammt; alles andere „ruht“
   oder „Vertretung“, ohne Ampel rot.
4. Nach dem Ende der Abwesenheit verschwinden Korb und Marken aus Für dich und Besprechung (heute bleibt die Marke „Vertretung“ stehen).

## 6 · Läufe: erledigen statt vorschlagen (Dateien im Repo, Einspielen durch Cowork)

Als `docs/auftraege/STUFE2-LAEUFE.md` ablegen, Wortlaut für Alex' und Leas Tagesabgleich, den Auftrag „GF Weekly · Neuigkeiten täglich“ und
den einmaligen Auftrag „Stufe 2 · Themen auflösen“.

**Grundregel: drei Sicherheitsstufen, jede Zeile des Laufs trägt eine.**
- `sicher`: Beleg nennt den Punkt oder das Vorhaben eindeutig (Betreff oder Text enthält den Punkttitel oder den Partnernamen in seiner
  Rolle) **und** die Handlung ist in der Quelle abgeschlossen (gesendete Antwort, Zusage, Zahlung, Termin bestätigt). Der Lauf **führt aus**:
  Punkt erledigt (`erledigt_by 'lauf'`), Verlaufseintrag mit Beleg, Zuordnung zum Vorhaben, Frist aus einem Datum in der Quelle als
  `frist_vorschlag`. Rückgängig 7 Tage in der Akte (ein Knopf je Lauf-Eintrag).
- `wahrscheinlich`: Bezug eindeutig, Abschluss nicht belegt. Der Lauf schreibt einen **Verlaufseintrag mit status vorschlag**, der nach 14 Tagen
  ohne Reaktion `verfallen` wird; die Akte zeigt ihn unter „Vorschläge des Laufs“ mit einem Klick für Ja und einem für Nein.
- `unklar`: nichts schreiben. Stattdessen zählt der Lauf den Fall in seiner Zusammenfassung („7 Mails ohne eindeutigen Bezug“).

**Deckel.** Höchstens 5 neue Einträge am Tag zur Sichtung (Vorschläge `wahrscheinlich` plus Korb); was darüber liegt, bleibt `unklar`. Keine
neuen Punkte aus Mails ohne `sicher`. Keine Priorität, keine Frist ohne Datum in der Quelle.

**Erledigt-Erkennung (neu, ersetzt Regel F des Abgleichs).** Für jeden offenen Punkt eines aktiven Vorhabens prüft der Lauf täglich:
(1) gesendete Mails von Alex oder Lea (`in:sent newer_than:2d`), deren Betreff oder Text den Punkt beantwortet; (2) eingegangene Mails mit
Zusage oder Bestätigung; (3) Verlaufseinträge der letzten zwei Tage (Einwurf, WhatsApp) mit „erledigt“, „gemacht“, „ist raus“, „bezahlt“,
„unterschrieben“; (4) Plattform-Fakten (`hh_feed_*`). Trifft `sicher` zu: Punkt erledigt, Verlaufseintrag „Erledigt (Lauf): <Beleg in einem
Satz>“, `source_ref`, `source_url`. Die Entscheidung dazu wird hinfällig (bestehende Regel), mit Grund im Verlauf.

**Fragen formulieren (E1 aus Stufe 1) bleibt**, erweitert um: Vorschlag immer in einem Satz mit Betrag, Datum oder Name, wenn vorhanden.

**Modell.** Die Edge Function nutzt für Einwurf und Aufräumen `claude-sonnet-5` (`GFWEEKLY_EINWURF_MODEL`). Für die Erledigt-Erkennung und
die Zuordnung im Lauf ist das stärkste verfügbare Modell richtig (`claude-opus-5-5`), weil hier Fehlentscheidungen Arbeit kosten (falsch
erledigt) und die Menge klein ist (Punkte eines Tages). Für Cowork stellt Alex das Modell der Aufträge selbst ein; das Paket nennt die
Empfehlung, kann sie nicht setzen. Reihenfolge: zuerst Regeln und Schwellen (dieser Teil), danach Modell hoch; dann ist der Unterschied
messbar (Kriterium a und b).

**Messung im Kompass.** Neue Aktion `lauf_bilanz`: je Woche erzeugt, übernommen, zurückgenommen, verfallen je Lauf; Anzeige als Klappe
„Was der Lauf getan hat“ auf Für dich (Zahlen, keine Grafik). Grundlage: `created_by 'lauf'`, `erledigt_by 'lauf'`, Verlaufsstatus.

## 7 · Cowork nach dem Push

Einmalig: Auftrag „Stufe 2 · Themen auflösen“ aus `docs/auftraege/STUFE2-LAEUFE.md` ausführen (53 Themen, 35 Kandidaten, 54 alte
Vorschläge); Ergebnis als Zusammenfassung ins Arbeitsradar. Danach die Tagesaufträge (Alex, Lea, Neuigkeiten) auf den neuen Wortlaut
umstellen; Modell nach Teil 6.

## 8 · Prüfweg, automatisch, mit Stopp-Gründen (wie Stufe 1)

1. Branch `stufe-2/ein-behaelter` von `origin/main`, Eintrag in `docs/ARBEITSPAKETE.md`, Asset-Version plus eins einheitlich.
2. Eigene Prüfung: `pruefung/abnahme.sh` vollständig. Neue Probe `pruefung/stufe2-probe.mjs`: Fristregel (Vorschlag zählt nicht), Fokus-
   Sortierung, Sammelaktion mit Konflikt je Zeile und Rückgängig, Auflösung eines Testthemas in Punkt, Verlauf und Umhängen der Entscheidung,
   Korb nur Vorhaben, Übergabe „Erledigt“, `lauf_bilanz`. Wirkungsprobe gegen das echte Backend mit Testvorhaben, Testpunkt, Testthema,
   Testkandidat; Lauf-Schreibwege simuliert über die Edge Function (`created_by 'lauf'`), danach aufräumen. Schirme 1440 und 390, dunkel und
   hell, ohne Konsolenfehler.
3. Standards nachführen: `docs/webapp-standard/` (Funktionsinventar: entfallene Seiten als „nicht erreichbar, Datei bleibt“), Regelzuordnung,
   Prüfmatrix.
4. Codex-Gegenprüfung: `docs/reviews/STUFE2-pruefauftrag.md` nach dem Muster `STUFE1-pruefauftrag.md`, ergänzt um: Was der Lauf automatisch
   darf und was nicht; Rückgängig der Lauf-Erledigung; Auflösung ohne Datenverlust (jedes Thema hat einen Nachfolger oder einen Archivgrund);
   keine Frist ohne Person oder Punkt. Je Runde eigener Worktree am Commit, `codex exec -m gpt-6-sol --sandbox read-only`, Auftragstext
   wörtlich. Befunde: schwer und mittel korrigieren, leicht korrigieren oder mit Grund verwerfen; Antwort `STUFE2-antwort-N.md`. Höchstens
   drei Runden; Korrekturen nach Runde 3 werden als nicht erneut geprüft ausgewiesen (wie in Stufe 1).
5. Stopp-Gründe, kein Push, Zeile in `FRAGEN_FUER_MORGEN.md`: Migration lässt sich nicht anwenden; Live-Stand der Function weicht unerklärt
   vom Repo ab; `abnahme.sh` schlägt nach Korrekturen weiter fehl; die Auflösungsregel findet für ein Thema weder Punkt noch Verlauf noch
   Archivgrund; nach Runde 3 bleibt ein schwerer Befund **unbehoben**.
6. Deploy (Diff vorher, `--use-api`, `ping`), Push nach `main`, `git pull`/`fetch` und Datenänderungen an Produktionszeilen führt die
   Sitzung **selbst** aus (Entscheidung Alex, 25.10.2026: „ohne meine Freigaben, auch Push und Pull automatisch“). Voraussetzung sind die
   Freigaberegeln in `~/gfweekly/.claude/settings.local.json` (Abschnitt 12) oder der Start mit `--dangerously-skip-permissions`. Bleibt
   eine Aktion trotzdem gesperrt, schreibt die Sitzung den genauen `!`-Befehl in `FRAGEN_FUER_MORGEN.md` und arbeitet weiter. Live-Prüfung
   auf kompass.wildehabitate.de nach dem Push.
7. Stand in fünf Kategorien in README und `docs/TECHNIKSTAND.md`; `docs/STAND-STUFE-2.md` mit Zahlen nach der Auflösung (Themen → Punkte,
   Verlauf, Archiv; Kandidaten → Vorschläge, verfallen; Entscheidungen gesamt, Fokus, reif) in höchstens zehn Sätzen.

Commit-Nachrichten: „feat(stufe2): ein Behälter, Lauf erledigt, Fokus, Fristen, Übergabe“, danach „fix(stufe2): Runde N“.

## 9 · Abnahme mit echten Fällen und Testaufgabe

| Fall | Erwartung |
|---|---|
| Thema „Entscheidungsgrundlage: Xceed-Abschluss …“ (am Vorhaben XCeed, Handlung „lesen und entscheiden“) | wird Punkt am Vorhaben XCeed; die Entscheidung hängt um, bleibt offen |
| Thema „Merch, Merch Bundles“ (kein Vorhaben, kein Bezug) | Korb mit Vorschlag oder nach 14 Tagen Archiv `stufe2:unzugeordnet` |
| Punkt „Bürgschaftstext auf Deutsch“ mit gesendeter Mail „anbei der Bürgschaftstext“ | Lauf erledigt mit Beleg; Rückgängig 7 Tage in der Akte |
| 13 Warte-Themen mit Frist aus dem Aufräumen | keine Frist mehr, „Vorschlag: bis …“; Zähler überfällig sinkt auf 1 |
| Entscheidungsliste nach „Nicht jetzt“ für alles außerhalb des Fokus | unter 15 offene Einträge; Besprechung zeigt Fokus zuerst |
| Übergabe für eine künftige Abwesenheit | nur Vorhaben und Punkte, Knopf „Erledigt“ wirkt, keine rote Ampel ohne Personenfrist |
| Lauf-Bilanz nach einer Woche | erzeugt, übernommen, zurückgenommen, verfallen je Lauf sichtbar |
| Rückkehr Lea (Abwesenheit 14. bis 25.10.) | drei Phasenblöcke mit Entschieden (XCeed: 25 Verlaufseinträge, davon Beschlüsse), Bewegt (Liquidität, Kollektive, Fluidity, Habitat Hub), Wartet auf dich (Punkte wer Lea: 14 offen, abgegebene Entscheidungen); „Nach Menschen“ gruppiert; die vier Fragen aus Alex' Mail stehen als GF-Entscheidungen |

Testaufgabe Alex und Lea (fachliche Annahme, ORG-003): eine Woche lang am Morgen nur Für dich öffnen; am Ende zählen, wie oft ein Eintrag
des Laufs zurückgenommen werden musste und wie lange die tägliche Sichtung dauerte. Erst danach gilt Stufe 2 als fachlich angenommen; das
Tor zu Stufe 3 (weniger Seiten) ist eine Woche unter fünf Minuten Sichtung am Tag.

## 10 · Nicht anfassen

Verkauf 2027, Kommunikation, Launch, Saison, Besetzung, Organisation, Vorstandsbüro. Keine Löschung in Themen, Kandidaten oder
Spieltabellen; alles wandert mit Grund ins Archiv. Die Entscheidungsfunktionen aus Stufe 1 bleiben; `hh_entscheidung_umhaengen` kommt
dazu. Der Zeitplan `hh_themen_erledigt_archivieren` bleibt bis zur Auflösung und wird danach beendet (`cron.unschedule`).

## 11 · Grenzen und offene Fragen (keine Stopp-Gründe)

- Leas Gesendet-Ordner sieht nur Leas Lauf; die Erledigt-Erkennung ist für Leas Punkte nur so gut wie ihr Lauf. Beide Aufträge bekommen
  denselben Wortlaut.
- WhatsApp kommt nur über den Einwurf an; was dort nicht landet, kann der Lauf nicht als erledigt erkennen.
- Automatisches Erledigen schreibt in Produktionsdaten. Darum Rückgängig 7 Tage, Beleg je Eintrag, Bilanz sichtbar, und das Abbruchkriterium
  aus Abschnitt 0.

## 12 · Für die Terminal-Sitzung

```
cd ~/gfweekly && git fetch origin && git checkout -b stufe-2/ein-behaelter origin/main && cp "$HOME/Documents/Claude/02 Projects/Geschäftsführung Wilde Möhre/Claude outputs/PAKET-STUFE-2-EIN-BEHAELTER.md" docs/PAKET-STUFE-2-EIN-BEHAELTER.md && claude "Lies docs/PAKET-STUFE-2-EIN-BEHAELTER.md vollständig. Führe die Abschnitte 1 bis 8 in dieser Reihenfolge aus und arbeite ohne Rückfragen durch: triff Detailentscheidungen selbst und notiere sie im Technikstand. Stoppe nur bei einem Stopp-Grund aus Abschnitt 8.5 und schreibe dann die Zeile in FRAGEN_FUER_MORGEN.md. Am Ende docs/STAND-STUFE-2.md schreiben und mir die zehn Sätze daraus ausgeben."
```

Existiert der Branch schon: `git checkout stufe-2/ein-behaelter && git rebase origin/main` statt `checkout -b`.

**Freigaben für die Automatik.** Damit die Sitzung Push, Pull, Deploy und Datenbankänderungen ohne Rückfrage ausführt, stehen in
`~/gfweekly/.claude/settings.local.json` (nicht im Repo) diese Regeln; alternativ `claude --dangerously-skip-permissions "…"`:

```json
{ "permissions": { "allow": [
  "Bash(git -C ~/gfweekly push *)", "Bash(git push *)", "Bash(git -C ~/gfweekly pull *)", "Bash(git pull *)", "Bash(git fetch *)",
  "Bash(npx --yes supabase functions deploy *)", "Bash(npx --yes supabase functions download *)",
  "Bash(npx --yes supabase db query *)", "Bash(codex exec *)", "Bash(node pruefung/*)", "Bash(./pruefung/abnahme.sh *)"
] } }
```

Nach dem Push schreibt die Sitzung die Meldung für Cowork (Abschnitt 7) als letzte Zeile ihres Berichts; Alex gibt sie weiter oder
Cowork liest sie aus dem Arbeitsradar.
