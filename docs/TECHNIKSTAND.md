# gfweekly · Technikstand, Ergänzungen aus V23/V24

Dieses Blatt sammelt die Abschnitte, die in das Projektdokument „gfweekly_Technikstand“ gehören.
Es liegt im Repo, weil der Technikstand selbst außerhalb liegt; nach jedem Paket kommt hier ein Abschnitt dazu.

## V23 (21.09.2026) · Palette ohne Türkis

Quelle: `wilde-habitate-farbpatch` (PATCH.md, `neu/tokens/colors.css`, `pruefung/farbscan.py`) vom 20.09.2026.
Der ältere Gedanke „V23 Papier/Nachtblau“ im Technikstand ist damit **gestrichen**.

**Token-Zone** (`site/assets/styles.css`, Blöcke `:root` und `[data-theme="light"]`) übernimmt alle Farbrollen aus `tokens/colors.css`.
Haus-eigene Tokens bleiben: Radien, `--rahmen`, Schatten, Foto- und Bewegungs-Tokens, `--ht-schau-zahl`, Schriftstufen,
dazu die Brückennamen der GF-Weekly-Zeit (`--ink`, `--line`, `--brand` …).

| Rolle | Token | dunkel | hell |
| --- | --- | --- | --- |
| Hauptaktion | `--action` / `--on-action` | `#e4b85c` / `#171d18` | `#e4b85c` / `#171d18` |
| Hauptaktion Hover | `--action-hover` | `#efc873` | `#d4a63f` |
| Rand der Hauptaktion | `--action-border` | nicht gesetzt | `#c79a3a` |
| Auswahl, Fortschritt, Link, Fokus | `--accent`, `--link`, `--focus` | `#b9cc8a` | `#5b7036` |
| Auswahl kräftig, Fläche | `--accent-strong`, `--accent-soft` | `#cddba6`, `rgba(185,204,138,0.16)` | `#465828`, `rgba(91,112,54,0.14)` |
| Deaktiviert | `--disabled`, `--disabled-fg` | `#3f4a3a`, `#a3a996` | `#cfcdbd`, `#5e6255` |
| Flächen | `--bg`, `--surface`, `--surface-2`, `--panel`, `--header-bg` | `#171d18`, `#242d23`, `#333d2d`, `#1d251d`, `#10150f` | Creme, unverändert |
| Text | `--text`, `--text-2`, `--text-3` | `#f4eedc` und Abstufungen | unverändert |
| Warnung | `--warn`, `--warn-bg` | `#f0a777` | `#9c5122` |
| Diagramm | `--chart-gruen` (vorher `--chart-teal`) | `#a3b876` | `#5e7438` |
| Abdunkelung, Foto, Bandschrift | `--backdrop`, `--photo-bg`, `--on-band` | `rgba(23,29,24,0.6)`, `#171d18`, `#171d18` | `rgba(23,29,24,0.45)`, `#171d18`, `#ffffff` |

**Vollständig übernommen**, auch die Tokens, die das Hohe Haus heute nirgends benutzt: Chronik-Papier (`--ht-papier`,
`--ht-papier-2`, `--ht-tinte`, `--ht-tinte-2`, `--ht-linie`, `--ht-ocker`, `--chronik-papier-bild`) und die Rang-Rahmen
(`--rang-gold/-silber/-bronze`). `pruefung/tokens.py` vergleicht die Token-Zone Zeile für Zeile mit `tokens/colors.css`:
57 Tokens dunkel, 46 hell, keine fehlt, keiner weicht ab. Die Landschaftstokens `--spiel-*` stehen nicht in `colors.css`
und gehören zur Welt des Spiels, nicht zur Bedienoberfläche.

**Vier Abweichungen vom Patch, alle aus der Kontrastrechnung:**
1. `--brand-ink` (neu, zeigt auf `--accent-strong`) trägt jeden Text, der über die Brücke `--brand` lief.
   Honiggold als Schrift auf Creme käme nur auf 1,8:1. Honiggold bleibt Fläche (Knöpfe, Chips, aktive Segmente).
2. „Kritisch“ auf kritischer Fläche nimmt `--crit-text` statt `--crit` (dunkel 4,28:1, jetzt 5,89:1).
3. Die goldene Kennzahlenkarte (`.stat.accent`) färbt Zahl, Beschriftung und Zusatz auf `--on-action`;
   die alte helle Schrift `--on-photo-2` kam auf Honiggold nur auf 1,37:1.
4. Die dritte Textstufe sollte nicht mehr auf der zweiten Fläche stehen (dort 4,19:1 im Dunkeln): Ticker-Zeit und -Strang,
   Korb-Meta, Filterspalte, Themenlage-Zeilen, Laufband-Person, Personenname im Ticker und der Plattform-Hinweis
   tragen `--text-2`. Ebenso die Einheit in der KPI-Kachel (`.kk-v small`), die auf `--surface-2` sitzt.
5. „Löschen“ trägt `--crit-text` statt `--crit` (Board-Panel, Meilensteine, Wichtige Seiten): im Hover liegt der Knopf
   auf `--surface-2`, dort kam `--crit` nur auf 4,28:1.
6. Der Hinweis eines geschlossenen Klappabschnitts hatte zusätzlich `opacity:.7` auf ohnehin transparenter Schrift
   (3,12:1 dunkel, 2,87:1 hell) und trägt jetzt `--text-2` ohne zusätzliche Deckkraft.
7. Die dritte Textstufe steht auch auf keiner Hoverfläche mehr (`--fill` und `--fill-soft` über `--surface` drücken sie
   auf 4,19 bzw. 4,43:1): Laufband-Zeit, Hinweis offener Klappabschnitte und die ganze Teamzeile tragen `--text-2`.

**Zustände.** Deaktivierte Knöpfe, Chips, Kacheln und Stepper-Grenzen tragen `--disabled`/`--disabled-fg` statt Deckkraft.
Fokusring `--focus`, Hover der Hauptaktion `--action-hover`, im Hellen 1-px-Rand `--action-border` am Primärknopf.

**Veredelung.** `ht-rise` 200 ms für Klappabschnitte (`details[open] > :not(summary)`) und Modals, 240 ms für das Board-Panel;
nur `transform` und `opacity`, aus bei `prefers-reduced-motion`. Trendpfeile der KPI-Kacheln 16 px in `--text-2`.
Kein Ghost-Knopf in einer Reihe mit einem Primärknopf, auch nicht „Abbrechen“, „Löschen“ oder „Schließen“ am rechten Rand:
die zweite Aktion ist `btn-brand` (Board-Leiste, Board-Panel, Aufräum-Modal, Check-in, Jahr, Wichtige Seiten, Neuigkeiten, Textfenster in core.js).
`.btn-sm` ist von 36 px auf `--ziel-min` (44 px) gegangen: Knöpfe in einer Reihe sind gleich hoch und gross genug zum Tippen,
die kleinere Schriftstufe bleibt. Der Stepper zeigt den Fokusring über `:focus-within`, das Eingabefeld hatte ihn unterdrückt.
Die Trendpfeile der KPI-Kacheln tragen nur noch `--text-2`; die Richtung steht im Pfeil und im `aria-label`, nicht in der Farbe.
Deaktivierte Kacheln bleiben auch im Hover deaktiviert (`.kk.link:hover` hätte sonst gewonnen).
Keine Gedankenstriche mehr in Oberflächentexten (Komma, Punkt, „bis“, Platzhalter „keine“, „offen“, „unbekannt“).

**Prüfwerkzeuge im Repo** (`pruefung/`, nicht Teil der veröffentlichten Seite):
- `abnahme.sh [zielordner]` fährt alle vier Prüfungen nacheinander und bricht beim ersten Fehler ab
  (ohne Pipeline über dem Kontrastlauf, sonst verschluckt `tail` dessen Fehlerstatus).
- `tokens.py [pfad/zu/colors.css]` vergleicht die Token-Zone mit der Quelle des Design-Systems. Abnahme V23: null Abweichungen.
- `farbscan.py <ordner>` meldet jede Farbe mit Farbton 150 bis 215 Grad. Abnahme V23: null Funde in `site/assets`.
  Die Datei ist bytegleich zur Patch-Quelle und endet auch bei Funden mit Status 0; `abnahme.sh` wertet deshalb die Ausgabe aus.
- `kontrast.py` rechnet die WCAG-Kontraste beider Themen aus der Token-Zone. Abnahme V23: null Paare unter der Schwelle.
  Ausnahme mit Begründung: deaktivierte Bedienelemente (3,9:1), von WCAG 1.4.3 ausdrücklich ausgenommen.
- `schirme.mjs` (Playwright) fährt alle 13 Seiten bei 1440 und 390 in Dunkel und Hell ab, fängt die Edge Function ab
  und beantwortet sie mit Testdaten, unterdrückt die Check-in-Karte über `gf_ci_<Person>_<Datum>` und meldet
  Konsolenfehler, Skriptfehler und fehlende Dateien. Dazu prüft der Lauf je Seite, dass das Tor offen, der Seiteninhalt
  sichtbar, die Navigation vollständig und der Kerninhalt der Seite gefüllt ist und kein „lädt …“ stehen blieb.
  Geprüft werden neun Haupt- und vier Untereinträge der Navigation, und eine sichtbare Fehlermeldung im Seitentext
  („Fehler beim Laden“, „nicht erreichbar“ …) lässt den Lauf durchfallen. Eine Aktion, für die keine Testdaten hinterlegt
  sind, ist ein Testfehler und kein stiller Erfolg (nur schreibende Aktionen dürfen mit einem leeren Erfolg antworten).
  Der Tagesschlüssel der Check-in-Karte entsteht im Browser aus dem lokalen Kalendertag, wie in `game.js`. Playwright liegt bewusst nicht im Repo:
  `PLAYWRIGHT_MODUL=<pfad>/node_modules/playwright/index.mjs node pruefung/schirme.mjs <zielordner>`.
  Die Testdaten ersetzen den Login: ohne das Passwort der Edge Function ist kein Lauf gegen echte Daten möglich.

**Assets** `?v=23` in allen 13 Seiten, `theme-color` und `manifest.webmanifest` auf `#171d18`,
Vorschaubild `site/assets/previews/gfweekly.webp` neu aus der Startseite (800 × 500, mit Testdaten aufgenommen).

**Offen.** Die Kopfbilder (`site/assets/img/*.webp`, `site/assets/game/*.webp`) sind Illustrationen und blieben unberührt;
einzelne zeigen türkise Fahrzeuge und Zelte. Der Farbscan nimmt Bilder aus. Umfärben wäre ein eigener Schritt
(`pruefung/icons-umfaerben.py` aus dem Patch-Ordner).

## V24a (21.09.2026) · Vertretung: Daten, Matrix, Automatik

Migration `supabase/migrations/20260921_hh_vertretung.sql` (angewendet am 21.09.2026), Edge Function v29.

**Tabellen.** `gfweekly_absences` (Person, von, bis, Schätzung, art geplant/sofort, kontakt keiner/wochenbrief/gespraech,
Kanal, Gesprächszeit, Standardvertretung, stufe kurz/mittel/lang, status geplant/aktiv/rueckkehr/beendet, test, note,
note_rueckkehr) · `gfweekly_deputies` (Vertretungslinie je Person und Bereich, Bereich ist ein Strang-Schlüssel, `gf` oder `*`,
mit Vollmacht als Freitext, UNIQUE person+bereich, vier Seed-Zeilen) · `gfweekly_handover` (Übergabekorb, UNIQUE
absence_id+kind+ref_id) · `gfweekly_handover_log` (Protokoll). Dazu `gfweekly_topics.owner_backup` und `.handover_id`.
RLS ist überall an, ohne Policies: nur die Edge Function mit dem service_role-Schlüssel kommt heran.

**Matrix.** `score(item, absence)` in der Edge Function, reine Funktion, keine KI. Vier Achsen 0 bis 3:
Z Zeitdruck aus der Frist, F Folgen bei Stillstand (Geld ab 5.000 €, Pförtner-Stichworte der gf-Klasse, Relevanz),
U Übertragbarkeit (hoch heißt schwer), G Entscheidungsgewicht aus gate und Priorität.
`dringend = Z ≥ 2`, `wichtig = F + G ≥ 3`, daraus die vier Quadranten sofort, planen, delegieren, warten.
Cluster in dieser Reihenfolge: A vor Abreise, E zu der anderen GF, C übergeben mit Rückfrage, D ruht, sonst B.
Ampel: A vorher (bei art sofort rot), B grün, C gelb, E rot, D ruht. Bei Stufe kurz ruht alles außer Notfall (F = 3).
Jede Zeile bekommt einen Begründungssatz, der die Achsen nennt. `luecke = U ≥ 2`.

Festlegungen, die die Paketdatei offenließ:
- Ohne `bis` und ohne Schätzung rechnet das **Fenster** mit 14 Tagen, damit Z eine Kante hat. Die **Stufe** richtet
  sich dagegen allein nach `bis`: ohne festes Ende ist sie kurz, und der Tick stuft bei `art = sofort` hoch.
- F = 1 „Teamname im who-Feld“ meint einen Namen, der weder Alex noch Lea ist.
- Stichworte treffen nur am Wortanfang: „Ankündigungen“ ist keine „Kündigung“, „Datenbank“ keine „Bank“.
  (`\b` hilft bei Umlauten nicht, deshalb die ausdrückliche Grenze `(?<![a-zäöüß])`.)
- U bewertet Kandidaten an ihrem Text (unter 80 Zeichen ist eine Lücke), weil sie weder Stand noch nächsten
  Schritt als Feld haben. Sonst wäre jeder Kandidat eine Lücke.
- `score(item, absence, heute)` nimmt den Stichtag als Argument und ist damit eine reine Funktion.
- Gesammelt wird genau das Fenster `von` bis `bis`; überfällige Fristen zählen mit, weil sie liegen bleiben.
  Die vierzehn Tage danach gehören zur Bewertung (Z = 1), nicht zur Sammelmenge.
- `gfweekly_topics` hat keine Strang-Spalte. Themen tragen deshalb keinen Strang, und die bereichsgenaue
  Vertretung greift bei ihnen über `gf` und `*`. Partnerzeilen tragen `wwp`.

**Aktionen v29.** `absence_set` (berechnet stufe und status, baut den Korb sofort), `absence_list`, `absence_end`,
`deputies_set`, `deputies_list`, `handover_build`, `handover_list` (Zeilen plus Zähler je Quadrant, Cluster, Ampel,
Lücken und Übernahmefähigkeit), `handover_set`, `handover_set_many`, `handover_dossier`, `handover_log_add`,
`handover_log`, `uebernahme_stat`, `absence_tick`. Bestätigte Korbzeilen überschreibt der Lauf nicht (Bedingung `status = 'vorschlag'` in `index.ts`), er ergänzt nur
frist, dossier und luecke. `handover_set` setzt bei einer Vertretung zusätzlich `gfweekly_topics.owner_backup`,
`gate` und `gate_note` („in Vertretung für <person>“), bei ruht `gate = warten` mit Frist einen Tag nach der Rückkehr.

**Automatik.** `pg_net` ist aktiviert, `public.hh_absence_tick()` ruft die Edge Function mit `absence_tick` auf und holt
das Passwort aus dem Vault-Secret `gfweekly_password`; fehlt das Secret, tut die Funktion nichts und sagt es im
Protokoll. Cron-Job `hh_absence_tick`, täglich 04:40 UTC. Fallback bleibt Abschnitt H6 des täglichen Auftrags.

**Prüfung ohne Deploy.** `pruefung/matrix-probe.mjs` holt die reinen Funktionen aus der Edge Function und stellt sie
node zur Verfügung; `pruefung/matrix-test.mjs` rechnet dagegen (Stufe, Geldbeträge, alle vier Achsen, Cluster, Ampel,
Wache, Regeltext, Vertretungslinie, Wortgrenzen, Kandidatenzweig, Reinheit der Funktion). `pruefung/korb-probe.mjs`
rechnet die Matrix über echte Zeilen: die Sammelabfrage steht als `pruefung/korb-abfrage.sql` im Repo, ihr Ergebnis
läuft über den Supabase-MCP und geht als JSON in das Skript. Das Ergebnis enthält Betriebsdaten und bleibt draußen.
Trockenlauf Lea 05.10. bis 25.10.: 87 Zeilen (21 Themen, 59 Kandidaten, 7 Partner), Quadranten planen 44, warten 36,
delegieren 4, sofort 3; Cluster E 39, D 36, A 7, B 5; Lücken 13 von 87, Übernahmefähigkeit 85 Prozent.
Aufruf: `TS_BASIS=file://<ordner mit typescript>/x.mjs node pruefung/matrix-test.mjs`.
Was der Weg nicht belegt: geschriebene Datenbankzeilen, den Bestätigungsschutz im Wettlauf, den Cron-Lauf,
die Idempotenz des Ticks und alles an Asana. Das braucht den Deploy.

## V24b (21.09.2026) · Bereich Vertretung in der Plattform

Drei Seiten, eine Navigationsgruppe, alle Bausteine aus V21 und V24b (`gfChips`, `gfStepper`, `gfKachel`,
`gfZustand`, `gfAmpel`, `gfQuadrant`, `gfFrist`). Kopfbilder: Abwesenheiten = tor-menschen, Übergabe = kiste-regen,
Rückkehr = ankunft. Stile im Block „V24b“ in `styles.css`.

**Ampel und Quadrant tragen nie die Farbe allein.** `GF_AMPEL` in `core.js` legt Symbol und Wort fest:
● vor Abreise · ○ grün, mit Vollmacht · ▲ gelb, mit Rückfrage · ✕ rot, zur GF · ▬ ruht bis zur Rückkehr.
`GF_QUADRANT` ebenso: ✕ Sofort, ● Planen, ▲ Delegieren, ○ Warten. `gfFrist` schreibt das Datum plus ein Wort
(„24.09. · diese Woche“, „überfällig“, „ohne Frist“).

**vertretung.html** Ein Primärknopf, ein Modal mit genau fünf Eingaben. „unklar“ schaltet das Enddatum auf eine
Schätzung in Tagen (Stepper) um; „Gespräch“ blendet das Zeitfeld ein. Speichern ruft `absence_set` und geht sofort
zur Übergabe. Die Vertretungslinie speichert je Feld (Chips sofort, Vollmacht nach 1,5 Sekunden Tippruhe).
**Falsch, siehe `docs/BEKANNTE-MAENGEL.md` Befund 1:** Der Filter vergleicht den genauen Namen
(`n !== ABSENCE.person`). Die Abwesenheit führt „Lea“, die Personenliste „Lea Luce“, also bleibt sie als ihre
eigene Vertretung wählbar. Ebenso stehen Personen außerhalb der Vertretungslinie zur Wahl.

**uebergabe.html** Ohne `?id=` die nächste aktive, sonst die nächste geplante Abwesenheit. „Alle Vorschläge
übernehmen“ wirkt genau auf die aktuelle Ansicht (Filter plus „nur Vorschläge“). Der Vertretungsbrief ist ein
Textfenster zum Kopieren, verschickt wird nichts. Wache: `art = sofort` und `stufe = kurz`; dann sind alle Chips
gesperrt außer bei F = 3, es werden nur Fristen bis drei Tage nach dem geschätzten Ende gezeigt, und
„Alle Vorschläge übernehmen“ ist aus.

**rueckkehr.html** Zeigt das Briefing aus `absences.note_rueckkehr`, die Protokolleinträge mit dem Vermerk
„in Vertretung für dich“ (nur ansehen) und die Zeilen mit Ampel rot oder ruht. „Übernehmen“ setzt die Korbzeile auf
erledigt, leert die Vertretung und gibt dem Thema den Ausgang der zurückgekehrten Person zurück.

**Startseite** Ein Block, drei Fälle, in dieser Reihenfolge: Ich komme zurück (drei Zahlen, Weg zur Rückkehr);
ich vertrete jemanden (bis zu fünf Zeilen mit Frist in sieben Tagen, sortiert nach Quadrant dann Frist);
jemand ist in den nächsten vierzehn Tagen weg (eine Zeile mit Zählern). Testabwesenheiten erscheinen dort nicht.

**Prüfung.** `pruefung/testdaten.mjs` hält die Antworten der Edge Function für beide Prüfläufe: drei Abwesenheiten
(Lea geplant und lang, Alex sofort und kurz mit `test = true`, Alex in Rückkehr), elf Korbzeilen über alle Quadranten,
Cluster und Ampeln, dazu Protokoll und Vertretungslinie. `pruefung/schirme.mjs` fährt 16 Seiten ab,
`pruefung/bedienung.mjs` klickt 32 Bedienproben durch: filtern, „Alle Vorschläge übernehmen“, Dossier, Ampelklick,
Vertretungsbrief, Wache, Anlegen mit allen fünf Eingaben, Rückkehr samt Rückübergabe, Startseitenblock und die
Marke in der Besprechung.

## V24c (21.09.2026) · Asana, Kalender, Mail

Migration `supabase/migrations/20260921_hh_asana.sql` (angewendet): `gfweekly_people.asana_gid`,
`gfweekly_absences.asana_project_gid` und `.asana_synced_at`.

**Asana aus der Edge Function.** Secrets: `ASANA_TOKEN` (Personal Access Token), `ASANA_WORKSPACE`
(Standard 57435200923138), `ASANA_TEAM` (nur nötig, wenn der Arbeitsbereich ein Team verlangt).
Ohne Token tut `asana_export` nichts und antwortet mit `{ error: 'ASANA_TOKEN fehlt' }` samt Hinweis;
Bei zwei gleichzeitigen Aufrufen oder einem Abbruch zwischen dem Anlegen in Asana und dem Merken der Kennung
können dagegen sehr wohl halbe oder doppelte Projekte entstehen (`docs/BEKANNTE-MAENGEL.md`, Befund 14).

- `asana_export {absence_id}` legt das Projekt „Vertretung <Name> · <von> bis <bis>“ an oder frischt das
  bestehende auf (`asana_project_gid`), dazu die Abschnitte Sofort, Grün, Gelb, Rot bei der GF, Ruht bis Rückkehr.
  Exportiert werden Korbzeilen mit `status = bestaetigt` und Ampel ungleich `vorher`. Je Zeile eine Aufgabe
  „[Vertretung] <Titel>“ mit Stand, nächstem Schritt, der Ampelregel als Satz, der Notfalldefinition, der Vollmacht
  der Vertretung, der Frist und dem Link ins Haus; `due_on` = Frist, `assignee` aus `gfweekly_people.asana_gid`,
  Folgende sind Alex und Lea. `asana_gid` und `asana_section` stehen danach an der Korbzeile, ein zweiter Export
  aktualisiert statt zu verdoppeln.
- `asana_sync {absence_id}` liest `completed` und die neuen Kommentare seit `asana_synced_at`, setzt erledigte
  Zeilen auf `erledigt` und schreibt Kommentare als Protokolleinträge der Art `asana`. Der tägliche Tick ruft das
  für jede Abwesenheit mit Projekt selbst auf; bei Rückkehr wandert das Projekt ins Archiv.
- Oberfläche: „Nach Asana“ steht im Kopf der Übergabe, sobald es bestätigte Zeilen gibt, als `btn-brand` und
  damit als zweite Aktion, nicht als Primärknopf wie in der Paketdatei verlangt (bewusste Abweichung, siehe unten);
  die Rückkehr zeigt die Kachel „Asana offen“ mit der Zahl der erledigten Aufgaben.

### Abschnitt H für den täglichen Auftrag „GF Weekly · Neuigkeiten täglich“

Textbaustein zum Eintragen in den Auftrag (trig_01A6gnSNUDbvF4bhW3wzhGL2). Er ergänzt die Abschnitte A bis G.

> **H · Vertretung**
>
> **H1 Abwesenheiten erkennen.** Sieh in den Kalendern alex@ und lea@ die nächsten 60 Tage nach ganztägigen
> Terminen durch, deren Titel „Abwesend“, „Urlaub“ oder „Krank“ enthält. Übernimm keinen Grund, nur den Zeitraum.
> Gibt es in `absence_list` keine Abwesenheit derselben Person mit überlappendem Zeitraum, lege sie mit
> `absence_set` an: `art` ist `geplant`, bei Beginn heute oder gestern `sofort`; `kontakt` ist `keiner`;
> `note` ist „aus Kalender“. Schreibe einen Ticker: „<Name> abwesend <von> bis <bis>, Übergabe angelegt“.
>
> **H2 Termine im Fenster.** Für jede Abwesenheit mit Status geplant oder aktiv: alle Termine der Person im
> Zeitraum, die weitere Teilnehmende haben, als Korbzeilen `kind = termin`, `ref_id = cal:<eventId>`,
> Frist = Beginn. Ins Dossier kommen die Vornamen der Teilnehmenden und die Beschreibung ohne Zugangsdaten.
> Ampel bei Stufe kurz `ruht`, sonst `gelb` mit `regel_note` „vertreten, absagen oder verschieben“.
>
> **H3 Vertretungsbrief.** Am Tag `von` (bei `art = sofort` sofort) einen Gmail-Entwurf an die Vertretungen und
> die andere GF anlegen (`create_draft`, nicht senden) mit dem Brieftext aus der Übergabeseite: Zeitraum,
> Kontaktregel, Notfalldefinition, Vertretungen je Bereich mit Vollmacht, die Listen rot, gelb, grün mit Frist.
> Ticker: „Vertretungsbrief für <Name> liegt als Entwurf bereit“.
>
> **H4 Wochenbrief.** Freitags, wenn `kontakt = wochenbrief`: Gmail-Entwurf an die abwesende Person mit dem
> Protokoll der Woche (Entscheidungen in Vertretung, Weitergaben, offene rote Punkte) und dem Satz
> „Lesen genügt, Antworten sind freiwillig und lösen nichts aus.“
>
> **H5 Rückkehr.** Am Tag nach `bis`: Kalenderblock „Rückkehr: Vormittag frei“ von 9 bis 12 Uhr im Kalender der
> Person, dazu ein Gmail-Entwurf mit dem Rückkehr-Briefing aus `absences.note_rueckkehr`.
>
> **H6 Tick.** Rufe `absence_tick` immer auf. Der Aufruf ist idempotent, und er ersetzt den Cron-Job, solange das
> Vault-Secret fehlt. Steht in der Antwort ein Schritt „Korb: 0 neu, 0 ergänzt“ für eine aktive Abwesenheit mit
> Einträgen, melde das im Ticker: dann sammelt der Lauf nichts mehr.
>
> **H8 Asana ohne Token.** Fehlt `ASANA_TOKEN`, antwortet `asana_export` mit einem Fehler. Lege dann **keine**
> Aufgaben von Hand an: das Haus könnte sie später weder auffrischen noch zurücksynchronisieren, und der Export mit
> Token würde sie verdoppeln. Schicke stattdessen den Vertretungsbrief aus H3 und setze einen Ticker
> „Asana-Export wartet auf das Token“. Sobald das Secret steht, macht ein einziger Aufruf von `asana_export` die
> ganze Arbeit.
>
> **H7 Neues an Abwesende.** Entsteht im Lauf ein Kandidat mit `who` = abwesende Person, setze `gate` auf die
> Vertretung (`gate_note` „in Vertretung für <Name>“) und schreibe einen Protokolleintrag der Art `weitergabe`.

**Bewusste Abweichungen in V24c:** Das Asana-Team kommt aus der Nutzlast oder aus `ASANA_TEAM`; ist beides leer,
liest der Export als letzten Ausweg das Team eines bestehenden, nicht archivierten Projekts des Arbeitsbereichs.
Die Vollmacht im Aufgabentext folgt derselben Bereichsregel wie die Vertretung (Strang, dann `gf`, dann `*`).
Fehlt zu einer Person die `asana_gid`, geht die Aufgabe seit V24d an Alex, und die Antwort nennt die Namen;
hat auch Alex keine Kennung, bleibt die Aufgabe unzugewiesen, und die Antwort sagt genau das.

**Nachgetragen am 22.09.2026:** `ASANA_TOKEN` steht als Secret, aus 4c ist ein Durchgang gelaufen (siehe unten);
die volle Abnahme nach Paketdatei steht aus (`docs/BEKANNTE-MAENGEL.md`, Befund 33).
Offen bleibt der Eintrag von Abschnitt H in den täglichen Auftrag; der Text oben ist dafür fertig.


## Nachtrag 21.09.2026 · was die zweite Review an V24 geändert hat

Die unabhängige Prüfung (Codex, Stand 39886dc) hat 27 Punkte gemeldet. Behoben wurden unter anderem:

- **Rücknahme bei der Rückkehr** lief über `update` mit Feldern, die `TOPIC_FIELDS` gar nicht kennt, und verpuffte.
  Jetzt gibt es die Aktion `handover_zurueck`: sie setzt die Korbzeile auf erledigt, leert die Vertretung und gibt
  dem Thema den Ausgang der zurückgekehrten Person, alles in einem Zug und mit Fehlermeldung, wenn etwas scheitert.
- **Geleerte Vertretung** wurde durch den alten Wert ersetzt (`patch.vertretung ?? alt.vertretung`). Jetzt zählt der
  gespeicherte Stand, und bei `ruht` wird `owner_backup` geleert.
- **Die drei Rückkehrtage** wurden aus `updated_at` gerechnet und konnten sofort ablaufen. Dafür gibt es jetzt
  `gfweekly_absences.rueckkehr_at`.
- **Archivierung in Asana** greift jetzt beim Wechsel auf `rueckkehr` und bei `absence_end`.
- **`gfAddDays`** verlor in Berlin einen Tag (lokale Mitternacht, UTC-Ausgabe); es rechnet jetzt durchgehend in UTC.
- **Asana-Zuordnung** lief über `whoNorm`, das alle außer Alex und Lea zu „Team“ macht; jetzt über den Namen selbst,
  fehlende Kennungen werden gemeldet statt still zugewiesen.
- **Ein Asana-Fehler** beim Auffrischen legte ein zweites Projekt an; nur noch 403 und 404 gelten als „Projekt weg“.
- **Der Rücksync** schob den Zeitstempel auch nach Fehlern weiter und verlor damit Kommentare; jetzt nur nach einem
  sauberen Lauf und nur bis zum Laufbeginn.
- **Ein erneuter Export** öffnete in Asana erledigte Aufgaben wieder, weil er `completed:false` mitschickte.
- **`handoverBuild`** schützt bestätigte Zeilen jetzt über die Bedingung `status = vorschlag` in der Anweisung selbst
  und zählt Fehler, statt sie zu schlucken.
- **Der gemeinsame Chip-Handler** in `core.js` las ungeprüft ein verstecktes Feld und warf bei den Filterreihen der
  Übergabe einen Konsolenfehler.
- **Die Vertretungslinie** legte bei einem Bereichswechsel eine zweite Zeile an; `deputies_set` ändert jetzt über die id.
- **Die Startseite** zählte Vorschläge als „in Vertretung bearbeitet“.

Aus der zweiten Runde kamen dazu: Abschalten einer Vertretungszeile schickt jetzt ihre id (sonst antwortete das
Backend mit 409), eine neu gespeicherte Zeile wird neu gezeichnet und behält damit ihre Kennung, die Vollmacht folgt
erst der zuständigen Bereichsregel und nimmt dann deren Wert (eine leere Vollmacht bleibt leer), der Rücksync prüft
seine Datenbankfehler, begrenzt das Fenster nach oben auf den Laufbeginn und merkt sich jeden Kommentar mit seiner
Asana-Kennung, nur noch 404 gilt als verschwundenes Projekt, eine entfernte Vertretung wird in Asana ausdrücklich
gelöscht, gespeicherte Kennungen werden auf Fehler geprüft, `ruht` räumt auch die Vertretung der Korbzeile ab, eine
geleerte Vertretung gibt den Ausgang an die abwesende Person zurück, `handover_zurueck` ändert erst den Vorgang und
dann die Korbzeile (scheitert das erste, bleibt nichts fälschlich erledigt) und behandelt auch Kandidaten, die
Sammelabfragen brechen bei Lesefehlern ab und entdoppeln nach Vorgang, Kalendergrenzen liegen auf Berliner
Kalendertagen, der Tick nennt Fehler im Bericht, das Asana-Team wird aus einem bestehenden Projekt des
Arbeitsbereichs ermittelt, wenn `ASANA_TEAM` fehlt, und der Weg „lückenhafte Themen“ führt über `board.html?person=`
zu einer Ansicht, die wirklich filtert.

Bewusst nicht geändert, mit Begründung:
- Die **Quadrantenkacheln** der Übergabe bleiben eigene Knöpfe: sie tragen Zähler, Symbol, Wort und einen gedrückten
  Zustand, was `gfKachel` nicht kann. Dasselbe gilt für die **Chip-Reihen** für Cluster, Ampel und Vertretung:
  `gfChips` führt genau einen Wert in einem versteckten Feld, hier braucht es je Zeile mehrere Reihen mit
  Sperrzustand und sofortigem Speichern. Sie sehen aus wie `gfChips` (dieselben Klassen) und verhalten sich gleich.
- Die **Teamliste** der Vertretung kommt aus `gfweekly_people` statt zusätzlich aus der TPA-Analyse: dieselben
  Menschen, eine Quelle weniger.
- **„Nach Asana“ ist die zweite Aktion** im Kopf, nicht die erste. Eine Ansicht hat genau eine Hauptaktion, und das
  ist „Alle Vorschläge übernehmen“. Die Paketdatei nennt beide Primary, das widerspricht sich.
- **`score` behält `heuteBerlin()` als Standardwert.** Mit übergebenem Stichtag ist die Funktion rein; der Standard
  ist die Bequemlichkeit für den Aufruf aus dem Lauf.
- **Keine Datenbanktransaktion** für `handover_zurueck`. Die ursprüngliche Begründung, supabase-js könne keine
  Transaktion über mehrere Tabellen, trägt seit V24d nicht mehr: `hh_handover_set` löst genau das über eine
  Datenbankfunktion. Für `handover_zurueck` fehlt sie weiterhin (`docs/BEKANNTE-MAENGEL.md`, Befund 4).
  Stattdessen die sichere Reihenfolge (erst der Vorgang, dann die Korbzeile) und eine Fehlermeldung, die sagt,
  was nicht ging.
## V24d (22.09.2026) · Nacharbeit aus der Review, Edge Function v30

Grundlage: `ANTWORTEN_ZU_FRAGEN.md` vom 22.09.2026. Vier Punkte, die die Review offen gelassen hatte.

**7.1 Eine Übergabe ist ein Vorgang.** Migration `20260922_hh_handover_set.sql` legt
`public.hh_handover_set(p_id, p_by, p_patch)` an: sperrt Korbzeile und Abwesenheit, ändert die Zeile, zieht das
Thema nach (Ausgang, `owner_backup`, Notiz, bei `ruht` zusätzlich `gate_frist`) und schreibt den Protokolleintrag,
alles in einer Transaktion. Die Edge Function ruft nur noch diese Funktion; `handover_set_many` ruft sie je Zeile,
und misslungene Zeilen stehen namentlich in der Antwort (`misslungen`). `SECURITY DEFINER`, fester `search_path`,
Ausführungsrecht nur für `service_role`. Damit kann es keine bestätigte Korbzeile ohne Wirkung mehr geben.

**7.2 Der Korb sagt, wenn er unvollständig ist.** Die Obergrenze bleibt bei 2000 Zeilen je Quelle. Erkannt wird
eine Abschneidung über die genaue Zeilenzahl der Quelle (`count: exact`), nicht über die Länge der Antwort: ein
niedrigeres Limit der Plattform bliebe sonst unbemerkt. Auch Schreibfehler beim Korb zählen als unvollständig.
Das Ergebnis steht in `gfweekly_absences.korb_truncated` und `.korb_abgeschnitten` (mit Quelle und Zahlen), die
Übergabeseite blendet dann einen Hinweis über dem Korb ein. `false` heißt: bei diesem Bau wurde keine Abschneidung
erkannt und keine Zeile blieb ungeschrieben. Es heißt nicht, dass ein früherer Bau vollständig war; bestehende
Abwesenheiten stehen bis zum nächsten Bau auf dem Vorgabewert `false`.

**7.3 Asana-Kennungen über die E-Mail.** `asana_export` liest `GET /users?workspace=…` über **alle** Seiten
(`next_page`, höchstens zwanzig), ordnet fehlende Kennungen über die E-Mail zu und schreibt sie nach
`gfweekly_people.asana_gid`. Fünf Startwerte stehen als Seed in der Migration (Alex, Lea, Amelie, Antonia, Helge).
Die Zuordnung läuft über die E-Mail und ist damit je Person eindeutig. Zugewiesen wird der Name, der in der
Korbzeile als Vertretung steht; die Vertretungslinie schlägt ihn vor, aber der Export prüft nicht nach, ob ein
von Hand eingetragener Name darin vorkommt. Die Linie führt „Alex“ und „Lea“, die Personenliste „Alexander
Dettke“ und „Lea Luce“: diese beiden werden über ihre feste E-Mail aufgelöst, bei allen anderen zählt der genaue
Name. Wer kein Asana-Konto hat, erscheint in der Antwort unter `ohne_zuweisung`, und die Aufgabe geht **an Alex**
statt ins Leere; fehlt auch Alex die Kennung, bleibt sie unzugewiesen, und die Antwort sagt das. Ein Fehler beim
Lesen der Nutzerliste steht als `nutzerliste` in der Antwort und im Protokoll, statt still zu verschwinden.

**7.4 Lückenfilter im Board.** `board.html?owner=<Name>&luecke=1` filtert nach **derselben Regel wie
`uebernahme_stat`**: Verantwortung der Person (normalisiert wie `whoNorm`) oder ihr Ausgang beim Pförtner.
`luecke` zeigt davon nur Themen ohne Stand oder ohne nächsten Schritt. Der Weg aus der Kachel schaltet
wiederkehrende und erledigte Themen ein, weil die Kachel sie mitzählt; so zeigt das Board genau die Menge, die
die Kachel genannt hat. Beide Schalter stehen als Haken in der Board-Leiste. `?person=` bleibt als alter Name
erhalten. Die beiden Zahlen der Kachel (ohne Stand, ohne nächsten Schritt) dürfen nicht addiert werden:
ein Thema kann beides fehlen lassen.

**Prüfung.** `pruefung/testdaten.mjs` merkt sich jetzt, was geschrieben wurde: eine bestätigte Zeile kommt beim
nächsten Lesen als bestätigt zurück, eine neu angelegte Abwesenheit taucht in der Liste auf. `zuruecksetzen()`
stellt vor jedem Fall den Saatstand her. Dadurch prüft die Bedienprüfung nicht mehr nur die abgeschickte Nutzlast,
sondern auch die Wirkung: die bestätigte Zeile verlässt die Ansicht, das Anlegen leitet zur neuen Übergabe weiter,
die Rücknahme räumt die Zeile aus „wartet auf dich“. Dazu zwei neue Fälle für den Lückenfilter und den Hinweis auf
einen unvollständigen Korb.

**Aus der Prüfung von a9f1a9e nachgezogen** (Migration `20260922_hh_handover_set_namen.sql`, angewendet):
`hh_handover_set` traf den Ausgang nur bei den Zeichenketten `alex` und `lea` und hätte „Alexander Dettke“ nach
`team` geschickt; die neue Funktion `hh_person_gate` bildet dieselbe Regel wie `whoNorm`. Ein gespeicherter
Leerstring gilt nicht mehr als frühere Vertretung. Dazu: die abgeschnittenen Quellen sind kein globaler Zustand
mehr (zwei gleichzeitige Bauten überschrieben sich), misslungene Zeilen einer Sammelübernahme stehen mit Titel in
der Antwort und erscheinen in der Oberfläche, und der Fehler des abschließenden Updates wird gemeldet.

**Offen bleibt** (aus derselben Review, nicht Teil dieser Runde): echte Pagination statt Obergrenzen. Der
Nachweis, dass Tick, Cron, Vault und Asana live tun, was sie sollen, steht im nächsten Abschnitt.


## Live-Abnahme 22.09.2026 · Edge Function v30, Stand e984f50

Der Deploy lief aus der Supabase-CLI aus `supabase/functions/gfweekly/index.ts`; der Live-Stand wurde vorher gegen
die Repo-Datei geprüft und danach über die Prüfsumme der Quelle bestätigt. `action: ping` meldet `version: 30`.

**Paket 2 live.** Zwei Testabwesenheiten (`test = true`) angelegt, Korb gebaut, Matrix gerechnet, `absence_tick`
zweimal hintereinander gelaufen: der zweite Lauf ändert nichts, was der erste schon getan hat. Bestätigt wurden nur
Kandidaten- und Partnerzeilen; die zwei echten Themen, die der Lauf berührt hat, stehen wieder exakt auf ihrem
Ausgangswert. Danach sind die Testdaten restlos gelöscht.

**Vault und Cron.** `gfweekly_password` liegt im Vault, `public.hh_absence_tick()` liest es und ruft die Edge
Function auf. Beim ersten Versuch stand dort ein falsches Passwort, der Aufruf kam mit 401 zurück; nach
`vault.update_secret` antwortet er mit 200. Der Cron-Job `hh_absence_tick` läuft täglich um 04:40 UTC. Wird das
Passwort der Edge Function geändert, müssen **beide** Stellen nachgezogen werden: das Supabase-Secret
`GFWEEKLY_PASSWORD` und das Vault-Secret `gfweekly_password`.

**Aus Paket 4c ein Durchgang live**, nicht die volle Abnahme. Mit einer Testabwesenheit für Lea: `asana_export` legte das Projekt an, eine Aufgabe wurde in
Asana erledigt, `asana_sync` holte sie zurück, danach wurde das Projekt archiviert und die Testabwesenheit
gelöscht. Zwei Befunde daraus sind behoben: `gidVon('Alex')` fand „Alexander Dettke“ nur über den Notnagel, jetzt
greift dieselbe Normalisierung wie sonst im Haus; und der von Asana automatisch angelegte „Unbenannte Abschnitt“
wird nach dem Aufbau entfernt, damit das Projekt nur die fünf gewollten Abschnitte zeigt.

**Vertretungslinie.** Sie führt genau vier aktive Zeilen: `Alex|gf|Lea`, `Alex|*|Lea`, `Lea|gf|Alex`, `Lea|*|Alex`.
Weitere Personen stehen nicht darin; die frühere Sonderbehandlung für ein drittes Konto ist aus der Edge Function
entfernt.

**Vorschaubild.** `site/assets/previews/gfweekly.webp` zeigt seit dem 22.09.2026 die Startseite mit echten Daten,
aufgenommen im Prüfbrowser mit dem Passwort aus der Umgebung. Das Passwort steht in keiner Datei und in keinem
Commit; die Check-in-Karte war über `localStorage` unterdrückt.


## Zweite Prüfrunde 22.09.2026 · zehn Befunde, Edge Function v31

Unabhängige Review (Codex, read-only) über den vollständigen Umfang `e8854bb..81a0941`. Alle zehn Befunde sind
behoben, Migration `20260922_hh_handover_set_ruhe.sql` ist angewendet.

**Hoch.** `gidVon` nahm bei „Alex“ und „Lea“ die erste Person, deren Name die Zeichenkette enthält; „Alexandra“
hätte Alexanders Aufgaben bekommen. Aufgelöst wird jetzt über die feste E-Mail der beiden (`MAIL_ALEX`,
`MAIL_LEA`); trifft sie nicht, gilt ein Namenstreffer nur, wenn er der einzige ist. Derselbe Fehler steckte in der
Wahl des Ersatzempfängers. Zweitens verschluckte der Export den Lesefehler der Personen- und Vertretungsliste:
mit leerer Liste hätte er bestehende Zuweisungen in Asana gelöscht und trotzdem „deshalb an Alex“ gemeldet. Jetzt
bricht er vor dem ersten Schreibzugriff mit 502 ab, und „an Alex“ steht nur in der Antwort, wenn Alex wirklich
eine Kennung hat.

**Mittel.** Eine aufgehobene Ruhe ließ am Thema stehen, was die Ruhe gesetzt hatte (Ausgang `warten`,
Rückkehrfrist, Notiz); `hh_handover_set` merkt den Wechsel jetzt und räumt auf. `handover_list` vergleicht die
gelieferten Zeilen mit der genauen Gesamtzahl und meldet `gekuerzt`, damit ein Ausschnitt nicht als vollständiger
Korb erscheint; die Übergabeseite zeigt dafür einen eigenen Hinweis. Der Tick sagt, wenn sich der Hinweis auf
einen unvollständigen Korb nicht speichern ließ. Die Nutzerliste aus Asana meldet, wenn sie nach zwanzig Seiten
nicht zu Ende war, statt die fehlenden Personen als „kein Konto“ zu behandeln. Im Rücksync steht der
Erledigungsvermerk jetzt vor dem Status, sonst hätte ein misslungenes Protokoll die Zeile dauerhaft übersprungen;
Kommentare werden seitenweise gelesen, und eine unvollständig gelesene Liste hält das Zeitfenster an.

**Niedrig.** Die Übergabeseite sagt „ohne eigenes Konto, deshalb an Alex“ statt „ohne Zuweisung“, wenn der Ersatz
gegriffen hat, und zeigt eine Störung der Nutzerliste an. Überholte Sätze in `ARBEITSSTAND.md`,
`FRAGEN_FUER_MORGEN.md` und in diesem Dokument sind richtiggestellt.

**Dritte Runde, letzte nach der Regel (Edge Function v32).** Sie hat vier weitere Punkte gefunden, alle behoben. Der Rückfall auf
einen einzigen unscharfen Namenstreffer war noch da und hätte „Alexandra“ genommen, wenn Alexanders Zeile fehlt;
jetzt entscheidet allein die feste E-Mail, sonst gibt es keine Kennung. Die neue Liste der Erledigungsvermerke
hätte an der Obergrenze abgeschnitten sein und denselben Vermerk in jedem Lauf erneut schreiben können; gefragt
wird jetzt je Zeile. Die Seitengrenze der Kommentare liegt bei zweihundert statt zwanzig, und wird sie doch
erreicht, steht der Fall im Protokoll, statt den Rücksync still stehen zu lassen. Und `gfToast` setzt
`textContent`: die zusätzliche Maskierung im Meldungstext ist raus, sie wäre als Zeichenfolge sichtbar gewesen.

## V25 (24.09.2026) · Saison: Jahresrad der Festivalsaison, aus Cowork
- Neue Seite `site/saison.html` (Menü „Arbeiten“ → Saison, Symbol `rad`, Kopfbild `karten`). Jahresrad ab 1. Oktober und Zeitleiste, drei Ebenen ein- und ausblendbar (Kreislauf und Metaphasen, Departments, Festivals und Stränge), Filter „nur offene“, Zähler abgestimmt/strittig. Bearbeiten im Seitenpanel mit Autosave (700 ms), Status Vorschlag/abgestimmt/strittig, Anmerkung Alex und Anmerkung Lea, Zeilen anlegen und bearbeiten (VVK-Start, Festivaltermin, Ziel).
- Eigene Edge Function `supabase/functions/saison/index.ts` (v1, verify_jwt aus, Passwort wie gfweekly aus dem Secret `GFWEEKLY_PASSWORD`). Aktionen: ping, get, item_save, item_delete, row_save, row_delete, log. Bewusst getrennt von `gfweekly` (140 KB, aus Cowork nicht mehr deploybar). `row_save` verschiebt relative Elemente (Anker vvk, festival, festival_ende mit off_start/off_end in Tagen) mit, wenn sich VVK-Start oder Festivaltermin der Zeile ändern.
- Migration `20260923224413_hh_saison.sql` (angewendet): `gfweekly_saison_rows` (12 Zeilen), `gfweekly_saison_items` (51 Elemente, Stand aus dem Gespräch vom 23.09.), `gfweekly_saison_log`. RLS an ohne Policies, Zugriff nur über die Edge Function. Festivals verweisen mit `event_ref` auf `vvp_events`; dort wird nichts geschrieben. Die VVK-Starts in `vvp_events.sales_start_on` sind noch die alten Werte und werden erst mit der Freigabe der Saison korrigiert.
- Kreislauf-Logik der Anzeige: Termine werden nach Monat und Tag auf den Kreis ab 1. Oktober gelegt, nicht nach Jahr; ein Vorlauf im September der Vorsaison liegt also am Ende des Kreises. Länge über 365 Tage wird gekappt.
- Geprüft (Playwright im Cowork-Container gegen die echten 51 Elemente, Edge Function abgefangen, Bilder nicht geladen): 1440 dunkel, 1440 hell, 390 dunkel, Zeitleiste, Panel; keine Skriptfehler. Wirkung in der Datenbank geprüft über pg_net: row_save mit geändertem VVK-Start verschob den Vorlauf um 14 Tage (Testzeile danach gelöscht).
- Offen: Freigabe-Knopf „fürs Team“ (Übergabe an den Habitat Hub und Korrektur von `vvp_events.sales_start_on`), Saisonblock auf der Startseite, Ablösung der alten Phasenleiste auf jahr.html nach der Abstimmung.

## V26 (30.09.2026) · Saison: fünf Metaphasen als Steckbriefe, aus Cowork

Anlass: Alex fand Jahresrad und farbige Zeitleiste auf Anhieb unverständlich und wollte jede Metaphase im Detail sehen, mit seinen Namen (Abbau und Analyse · Systembau, Launch und Formatpartner · Kernteam-Planung · Onboarding · Aufbau und Produktion). Analyse und Vorschläge im Claude Doc „Saisonplanung im Hohen Haus: Analyse und Vorschläge“.

- `site/saison.html` neu: Wortkette der fünf Phasen, Block „Die nächsten Termine“, je Phase ein aufklappbarer Steckbrief (Worum es geht, So arbeitet das Team, Fertig wenn, Was bis wann mit Wer, Übergang). Die Phase Systembau, Launch und Formatpartner hat drei aufklappbare Teile mit Launch-Tabelle je Festival. Keine Farbcodes; Status steht als Wort, „Vorschlag“ und „offen“ als Marke.
- Die Inhalte stehen im HTML (Stand 30.09.2026). Das Skript rechnet aus dem heutigen Datum: laufende und nächste Phase (Marke, Hervorhebung, welche Steckbriefe offen sind), die nächsten fünf Termine mit Abstand in Worten, den Launch-Stand je Festival, das Ausblenden des Oktober-Hinweises nach dem 01.11.
- Die Seite ruft keine Edge Function außer dem Gate. Die Tabellen `gfweekly_saison_*` und die Edge Function `saison` bleiben unverändert; das frühere Jahresrad liegt als `site/saison-rad.html` ohne Navigation.
- `core.js`: nur der Hinweistext des Navigationseintrags Saison. Assets auf `?v=25` in allen Seiten.
- `pruefung/schirme.mjs`: `saison.html` mit `#spDates` in die Schirmliste aufgenommen.
- Offen: Inhalte aus Daten statt aus dem HTML (Launch-Cockpit in Wilde Habitate, Termine aus `vvp_events`), Zuordnung der Launch-Aufgaben an Personen, Abnahme-Lauf (`pruefung/abnahme.sh`) für diesen Stand.

## V27 Phase A (30.09.2026) · Launch-Zuordnung: Datenmodell in Supabase, aus Cowork

Grundlage: Systemauftrag „Saisonplanung und Department-Logik überarbeiten“ v1.0. Ziel: die Zuordnung Kategorie → Bereich → Person je Festival dauerhaft in den Daten hinterlegen und mit dem Launch-Cockpit (`vvp_launch_*`) verbinden. Noch keine Seite; die folgt als Phase B (`launch.html`).

- Migration `launch_besetzung_personenpool_richtwerte` (Projekt `bnfmupnmqyrcltrphfak`).
- `gfweekly_people` erweitert: `typ` (gf, team, extern, minijob, agentur, partner), `felder` (Bereiche mit Standardzuständigkeit, leer = nur per Hand), `generator`, `launch_std_woche` (von der GF einzutragen, null = nicht eingetragen), `verfuegbar_ab`, `briefing_std`, `stundensatz`, `pool_notiz`. 12 Personen ergänzt (Annie Oelmann, Slawik Snitkowski, Jane, Nina, Juliette, Nelly, Mitch, Manja, Markus (Design), Robin Benad, Subardo, Novo-Kollektiv). Asana-gids nachgetragen, wo ein Konto besteht. Pool: 32 aktive, zuweisbare Personen.
- Neu `gfweekly_launch_bereiche` (8: fv, gf, komm, content, ticket, partner, sys, recht, mit Coda-Department), `gfweekly_launch_richtwerte` (27 Meilenstein-Titel: Bereich, Aufwand lo/hi, Dauer, Generator-Anteil, Abstand zum VVK, Vorgänger; Richtwerte Claude, Kalibrierung über Ist-Stunden), `gfweekly_launch_besetzung` (Event × Bereich → Person, Status vorschlag/bestaetigt/offen, Quelle, Notiz). RLS wie `gfweekly_people`: kein Zugriff für Festivalhaus, Gast und Zielgruppen, Zugriff nur über die Edge Function (`supabase/functions/gfweekly/index.ts`).
- `vvp_launch_milestones` erweitert: `bereich`, `person_id`, `hilfe_person_id`, `zuordnung_status` (offen, vorschlag, bestaetigt, gesendet), `aufwand_lo/hi`, `dauer_tage`, `generator_anteil`, `due_on_vorher`, `asana_task_gid`, `ist_stunden`. Meilenstein „Ads-Kampagne vorbereitet“ in allen fünf Plänen und in der Vorlage „Standard-Meilensteine“ ergänzt (jetzt 123 Meilensteine). Termine an `vvp_events.sales_start_on` gekoppelt (alter Termin in `due_on_vorher`), Fluidity ausgenommen (Kampagnen-Boost ohne festen Termin). `responsible` (Text) bleibt leer, bis eine Zuordnung bestätigt ist.
- Besetzung: 40 Zeilen, 39 mit Person als Vorschlag, Draußenbande-Festivalverantwortung offen. Quelle je Zeile (TPA, Plattform, gfweekly_people, WWP, Vorsortierung Alex).
- Offen: Stand je Meilenstein ist überall `not_started`, auch für Vergangenes; `launch_std_woche` überall leer; Draußenbande-VVK (01.10., 11.10. oder 01.12.) und by nature 2027 ungeklärt; Asana-Konten fehlen für Nina, Juliette, Nelly, Mitch, Manja, Markus (Design), Subardo, Novo-Kollektiv.

## V27 Phase B (30.09.2026) · launch.html: Launch verteilen, Edge Function v33

Grundlage: Auftrag „Phase B der Saisonplanung“ vom 30.09.2026 auf dem Datenmodell aus Phase A. Neue Seite `site/launch.html` (Menü „Arbeiten“ → Launch, Symbol `fahne`), nur für die GF hinter `gfGate`. Assets auf `?v=26` in allen Seiten. Deploy aus der Supabase-CLI (`npx supabase functions deploy gfweekly --project-ref bnfmupnmqyrcltrphfak --no-verify-jwt`), `action: ping` meldet `version: 33`.

**Implementiert.**
- Edge Function `supabase/functions/gfweekly/index.ts`, vier Aktionen: `launch_list` (fünf Festivals nach VVK-Start, 123 Meilensteine mit Festivalkennung, 40 Besetzungen, Pool ohne E-Mail und ohne Asana-Kennung, nur `hat_asana`, Richtwerte, Bereiche, Stundensummen je Person), `launch_set` (je Meilenstein Zuständigkeit, Hilfe, Stand; je Person `launch_std_woche` und `verfuegbar_ab`; Besetzung je Bereich mit Nachziehen der noch nicht bestätigten Meilensteine; VVK-Start in `vvp_events.sales_start_on` mit Neuberechnung der offenen `due_on` aus den Richtwerten, alter Wert nach `due_on_vorher`, Eintrag in `vvp_launch_plan_changes`), `launch_confirm` (nur Alex oder Lea, eine reicht; setzt `zuordnung_status = bestaetigt`, `responsible` = Name, Besetzung `bestaetigt` mit `bestaetigt_von`), `launch_send` (Asana-Projekt „Launch <Festival> 2027“ mit Abschnitten je Bereich, Kennung aus dem letzten Protokolleintrag, sonst Suche nach dem Namen, sonst neu; je bestätigtem Meilenstein eine Aufgabe beim Zuständigen mit `due_on`, Aufwand als Spanne, Dauer, Vorgängern, Generator-Anteil und Link; Generator-Anteil als Unteraufgabe beim Helfer; bestehende Aufgaben werden über `asana_task_gid` aktualisiert, nicht verdoppelt). Externe (Typ extern, agentur, partner) bekommen keine Aufgabe; beim Übergebenden (Festivalverantwortung, wenn intern mit Konto, sonst Alex) entsteht „Angebot einholen und beauftragen: <Titel>“. Interne ohne Konto bleiben als Notiz in Antwort und Seite, ihr Stand bleibt `bestaetigt`. Protokoll aller vier Aktionen in `gfweekly_saison_log` (`what = launch_set|launch_confirm|launch_send`).
- Rechenlogik als reine Funktionen in `site/assets/launch-logik.js` (Browser und node): Kette mit fertig-am (Beginn heute oder Tag nach dem letzten Vorgänger, Verfügbarkeit der Person schiebt, Erledigtes liegt fest, Laufendes wartet nicht), frühester machbarer VVK-Start als Launchtag der Kette (die Abstände der Richtwerte sind Zieltermine, keine Mindestvorläufe), Last je Person über alle Launches (Fenster bis zum letzten eigenen Termin, Wort nach der Mitte der Spanne: passt bis 85 Prozent, knapp bis 110 Prozent, sonst zu viel; ohne Eintrag „keine Zeit eingetragen“, keine Überlast), Hilfe mit Briefing (Entlastung am unteren Rand mindestens 2 Stunden, Kosten nur mit Stundensatz), Kandidaten (Feld, Generator-Arbeit an alle mit Zeit, GF per Schalter, Reihenfolge Team, Hilfe, GF), VVK verschieben mit Abständen zu den anderen Launches. Test `pruefung/launch-test.mjs` mit festem Stichtag 01.10.2026: 62 Proben (Kette Lusatia mit 21.10. als Launchtag, Last über zwei Festivals, Hilfe mit Briefing, VVK verschieben, Reihenfolge, Wörter, Reinheit).
- Seite: Festivalwahl, Lage in einem Satz mit vier Kacheln, Hinweiszeilen (drei VVK-Termine der Draußenbande, by nature offen, unhaltbarer VVK, unbesetzte Bereiche, fehlende Stundeneinträge), vier Wege (Vorschlag übernehmen, Umverteilen oder selbst übernehmen, VVK-Start verschieben, Hilfe dazuholen), Aufgaben je Bereich mit Aufwand, Dauer, fertig-am gegen Ziel, Stand als Chip, Zuständigkeit und Generator-Anteil als Auswahl aus dem ganzen Pool (Team, Hilfe, GF), Zeit je Person mit Balken, Wort und direkt editierbaren Feldern, Bestätigen als Alex oder Lea mit Vorschau des Asana-Projekts und Senden. Status und Last stehen als Wort, Farbe trägt keine Bedeutung.
- Prüfung: `pruefung/schirme.mjs` mit `launch.html` (`#lnAufgaben`) und 14 Haupteinträgen der Navigation (der Zähler stand seit V25 auf 12), Testdaten `launch_list`, `launch_confirm`, `launch_send` in `pruefung/testdaten.mjs`, `launch_set` als schreibende Aktion. In `site/saison.html` fünf Beschriftungen von `--text-3` auf `--text-2`, weil die Schirmprüfung dort 4,19:1 und 4,34:1 gemessen hatte.
- Live geprüft am 30.09.2026 über pg_net mit dem Vault-Secret: `ping` (Version 33), `launch_list` (5 Festivals, 123 Meilensteine, 40 Besetzungen, 27 Richtwerte, 8 Bereiche), `launch_set` Stand eines Meilensteins auf läuft und zurück auf offen, `launch_std_woche` auf 10 und zurück auf leer, leerer Aufruf mit 400, `launch_confirm` mit fremdem Namen mit 403. Die vier Protokollzeilen dieses Tests stehen in `gfweekly_saison_log`. Nicht live gelaufen: `launch_confirm` und `launch_send` mit echten Daten, weil beides eine Entscheidung der GF ist und in Asana Projekte anlegt.

**Befüllte Daten.** Keine neuen Zeilen außer Protokoll. Die Testschreibungen sind zurückgenommen; `vvp_events.sales_start_on`, `due_on_vorher`, Besetzung und `responsible` sind unverändert gegenüber Phase A.

**Verbleibende Entscheidungen.**
- `launch_std_woche` ist bei allen 32 Personen leer; die Seite zeigt deshalb überall „keine Zeit eingetragen“ und zählt niemanden als überlastet. Erst mit Einträgen wird die Kennzahl „Personen über ihrer Zeit“ aussagekräftig.
- Versandregel für Externe, geändert in v34 (30.09., aus Cowork): Externe mit Asana-Konto (Christian Linck, Annie Oelmann, Slawik Snitkowski, Kevin Twarz, Robin Benad) bekommen ihre Aufgaben direkt wie das Team. Nur Externe ohne Konto (Manja, Markus (Design), Mitch, Subardo, Novo-Kollektiv) lösen die Angebotsaufgabe beim Übergebenden aus (`launchIstExtern` prüft Typ und fehlendes Konto). Grund: Entscheidung Alex, keine Einschränkungen ohne Auftrag. `ping` meldet `version: 34`; Deploy durch Alex.
- Draußenbande: die Termine rechnen mit dem 01.10. aus der Plattform; 11.10. und 01.12. stehen als Hinweis. by nature 2027 bleibt als Vorhaben offen.
- Der Stand aller 122 offenen Meilensteine ist `not_started`, auch für Vergangenes (Fluidity, Wilde Möhre); Erledigtes muss von Hand auf „erledigt“ gesetzt werden, sonst zählt es in die Last.
- Der Übergebende für Angebotsaufgaben ist die Festivalverantwortung des Festivals, sonst Alex. Bei Fluidity (Festivalverantwortung extern) und der Draußenbande (offen) landet die Aufgabe bei Alex.
- Das Asana-Projekt merkt sich die Kennung nur im Protokoll (`gfweekly_saison_log`), weil `vvp_launch_plans` dafür keine Spalte hat; ein gelöschtes Protokoll führt zur Suche nach dem Projektnamen.

**Review-Runde 1 (30.09.2026, Codex read-only, Stand 23da347, Edge Function v35).** Fünf Befunde. Zwei verworfen: die Spalten `vvp_launch_plans.launch_date`/`.notes`, `vvp_events.starts_on`/`.ends_on` und `updated_at` an Meilensteinen, Besetzung und Events existieren im Schema, der Live-Lauf von `launch_list` und `launch_set` hat sie benutzt. Drei behoben: `launch_send` liest vor dem Anlegen die Aufgaben des Projekts nach Namen und verwendet eine vorhandene Aufgabe weiter, wenn dem Meilenstein die Kennung fehlt (kein zweiter Bestand nach einem misslungenen Speichern); `launch_confirm` und `launch_send` melden ein misslungenes Protokoll als Fehler in der Antwort (`protokoll: false`), und ein Projekt ohne Protokolleintrag bricht vor der ersten Aufgabe ab; `pool_notiz` wird nicht mehr ausgeliefert und nicht mehr angezeigt, weil das Feld Vertragsdetails tragen kann. Dazu die Versandregel aus v34 in `launch-logik.js` und der Vorschau nachgezogen (`istExtern` gilt nur ohne Konto), Test auf 63 Proben.

## V27 Phase C (30.09.2026) · Abschluss der Saisonplanung, aus Cowork

Abschluss laut Systemauftrag v1.0: Zuordnungstabelle „bestehende Logik → beibehalten, erweitern, ersetzen → Begründung → Wirkung auf Daten“ sowie die Trennung implementiert, befüllt, offen liegen im Projektdokument `claude/Saisonplanung_Abschluss_PhaseC_2026-09-30.md` (Projekt Geschäftsführung). Kurzfassung: Launch-Cockpit, vvp_events, Coda, TPA und Vertretungsmuster beibehalten und verknüpft; Saisondarstellung ersetzt (Daten unverändert); Pool und Kapazität minimal neu in gfweekly_people; vvp_launch_tasks und die leeren Personentabellen unverändert. Keine Zugriffshinderung. Offen bleiben die GF-Entscheidungen (Ergebnisverantwortung je Festival, Draußenbande-Termin, by nature 2027, Stunden je Person) und zwei Folgeaufträge: Saisonseite auf Daten statt HTML, Abgleich gfweekly_cycle_phases und gfweekly_milestones.

## V28 (30.09.2026) · saison.html: vier Fragen

Grundlage: Auftrag „Saisonseite neu: vier Antworten in fester Reihenfolge, aus echten Daten“ vom 30.09.2026, auf dem Datenmodell aus V27. Die Steckbrief-Fassung (V26) liegt als `site/saison-steckbriefe.html` ohne Menüeintrag weiter. Assets auf `?v=27` in allen Seiten. `action: ping` meldet `version: 36`.

**Implementiert.**
- `site/saison.html` neu, vier Abschnitte mit der Frage als Überschrift, oben der Hinweis „Alle Zahlen aus dem System, Stand jetzt; Aufwand als Richtwert, Kalibrierung über Ist-Stunden.“ Daten aus `launch_list`, Rechenlogik aus `site/assets/launch-logik.js`, Schreiben über `launch_set` (Besetzung je Feld, Stunden je Woche) und `launch_confirm` (Knopf „Besetzung bestätigen als Alex/Lea“ je Festival, mit Rückfrage). Status und Last stehen als Wort, Hervorhebung durch Rahmen, Farbe trägt keine Bedeutung.
  1. Phase und Herausforderung: schmale Phasenleiste mit Marker heute (Breite nach Tagen, laufende Phase mit Rahmen), fünf Phasen als Konstante `SA_PHASEN` (Ziel, So arbeitet das Team jetzt, Herausforderung, Fertig wenn; Texte aus V26 übernommen und ergänzt), Lage in zwei Sätzen (`saisonLageSatz`), vier Kacheln (Launches bis in sechs Wochen, offene Launch-Aufgaben bis Jahresende, Festivals ohne Festivalverantwortung, Personen mit eingetragener Zeit von allen im Pool), „Diese Woche entscheiden“ aus offenen Besetzungen (fehlende Zeile zählt wie leere), unhaltbaren VVK-Starts binnen 21 Tagen und den Datenhinweisen der Edge Function, aufklappbar „Die Phase im Detail“.
  2. Wen haben wir: Besetzungstafel Bereiche × fünf Festivals (Reihenfolge Festivalverantwortung, Kommunikation, Content, Ticketing, Partner, Systeme, Recht, GF-Entscheidungen; Spalten nach VVK-Start mit Termin oder „läuft seit“), jedes Feld eine Auswahl aus dem ganzen Pool mit Typ als Wort, leer heißt „offen“, Status als Wort, Quelle und Notiz als Hinweistext am Feld und als erste Zeile der Auswahl; am Handy je Bereich untereinander mit Festivalname am Feld. Aufklappbar „Wer trägt wie viel“: Personen mit offenen Aufgaben aller Launches, die laufen oder bis in 60 Tagen starten (`imFenster` nach VVK-Start, nicht nach Fälligkeit), Anzahl, Stunden als Mitte, Festivals, Balken relativ zur größten Last, Wort nur mit eingetragener Zeit, sonst „Zeit nicht eingetragen“ mit Stepper in der Zeile.
  3. Geändert und geeignet: Bisher (neue Tabelle `gfweekly_launch_besetzung_vorher`) gegen Jetzt (Besetzung über alle Festivals zusammengefasst, Status als Wort), Änderung als Wort „geändert“, „neu“, „unverändert“ oder „offen“ mit Rahmen; Eignung nur als „Begründung“ aus Quelle und Notiz der Besetzung, keine Eignungstabelle. Aufklappbar „Änderungen seit dem Sommer“ aus `gfweekly_saison_log` (launch_set, launch_confirm, launch_send) und dem Pool (created_at ab 30.09.2026 „neu im Pool“, `verfuegbar_ab` als „ab Datum“), neueste zuerst, höchstens 30.
  4. Wann kann was wie passieren: je Festival ein Block nach VVK-Start. Fluidity und Wilde Möhre (VVK zurück) kurz mit den nächsten drei fälligen Meilensteinen; die anderen mit kritischer Kette (Content produziert, Hauptfilm freigegeben, Launch-Checkliste, Launch) und fertig-am, Launchziel im Rahmen, Satz „rechnerisch haltbar“ mit Puffer und Vorbehalt (Festivalverantwortung nicht besetzt, Aufgaben ohne Person) oder nicht haltbar mit frühestem Termin (bei unbesetzten Aufgaben „rechnerisch, unter Besetzungsvorbehalt“) und Ursache (längste Kette, Festivalverantwortung, Aufgaben ohne Person, Überfälliges), Hebel als Knöpfe Parallel (Weg 2), Verschieben (Weg 3), Hilfe (Weg 4), bei by nature Entscheiden (Weg 1), jeder öffnet `launch.html?festival=<short_name>&weg=<1..4>`; Datenwidersprüche als Hinweiszeile. Aufklappbar „Wochenplan bis Jahresende“ mit Wochen, Festivals, Anzahl, Stunden, Summe, Wort „drei Launches“ ab drei Festivals.
- `site/assets/launch-logik.js` erweitert um reine Funktionen: `phaseHeute`, `launchesBis`, `besetzungVon`, `saisonLage`, `saisonLageSatz`, `entscheidungen`, `kritischeKette`, `laengsteKette`, `haltbar`, `haltbarSatz`, `hebel`, `naechsteFaellig`, `bisherJetzt`, `aenderungen`, `imFenster`, `montag`, `wochenplan`, dazu `listeWorte`, `tageWort`, `anzahlWort`. Kette, fertig-am, frühester VVK und Last bleiben die Funktionen aus V27, nichts doppelt. Test `pruefung/launch-test.mjs` von 63 auf 123 Proben (Stichtag 01.10.2026): drei Launches in sechs Wochen, Draußenbande 01.10. nicht haltbar (frühestens 21.10., 20 Tage, vier Ursachen), Lusatia mit VVK 15.11. haltbar mit 25 Tagen Puffer, Phase am 30.09., 01.10. und im Februar, Entscheidungen, Hebel, Bisher/Jetzt, Änderungen, Wochenplan.
- `site/launch.html` liest `?festival=` (auch `?event=` aus V27) und `?weg=1..4`, wählt das Festival vor, klappt den Weg auf und die anderen zu.
- Edge Function v36 (`supabase/functions/gfweekly/index.ts`): `launch_list` liefert zusätzlich `vorher` (8 Zeilen) und `log` (letzte 60 Zeilen `launch_*`), Pool mit `created_at`, weiter ohne E-Mail, ohne Asana-Kennung der Person und ohne `pool_notiz`; `stundensatz` (für die Kostenschätzung in launch.html, nur als Summe angezeigt) und `asana_task_gid` je Meilenstein (für „in Asana“) bleiben wie in V27. `launch_set` für die Besetzung: optional `status: 'bestaetigt'` (nur Alex oder Lea, setzt Zeile und Meilensteine des Bereichs fest), ohne `person_id` bleibt die Person; Quelle und Notiz bleiben stehen, solange die Person dieselbe ist; der Vorzustand steht im Protokoll (`detail.vorher`). Deploy aus der Supabase-CLI.
- Migration `supabase/migrations/20260930190000_hh_launch_besetzung_vorher.sql` (angewendet): `gfweekly_launch_besetzung_vorher` (bereich, text, quelle, sort_order), RLS an ohne Policies.
- Prüfung: `pruefung/schirme.mjs` prüft `saison.html` über `#saLage`; Testdaten `launch_list` um `vorher`, `log`, `created_at` ergänzt. Abnahme (`pruefung/abnahme.sh`) am 30.09.2026: Tokens 0 Abweichungen, Farbscan 0, Kontrast 0, Matrix in Ordnung, Schirme 72 Bilder 0 Meldungen (137 bekannte Treffer übergangen), Bedienung in Ordnung, Wächter keine Befunde. Ein neuer Befund im ersten Lauf (Wort „Hinweis:“ in Warnfarbe auf Warnhintergrund, 4,20:1) behoben durch Textfarbe.
- Live geprüft am 30.09.2026 über pg_net mit dem Vault-Secret: `ping` (Version 36), `launch_list` (5 Festivals, 123 Meilensteine, 40 Besetzungen, 34 Pool-Zeilen mit `created_at`, 8 „bisher“, 4 Protokollzeilen, keine `pool_notiz`), `launch_set` Besetzung Lusatia Content mit derselben Person (Quelle bleibt, eine Protokollzeile mit Vorzustand).

**Befüllte Daten.** `gfweekly_launch_besetzung_vorher` mit den acht Bereichen (Quelle „Rollen in Pool, TPA und Coda, Stand Sommer 2026“). Sonst nur Protokoll; Besetzung, Meilensteine, `vvp_events` unverändert gegenüber V27.

**Offen.**
- `launch_confirm` und `launch_set` mit `status: 'bestaetigt'` nicht live gelaufen, weil beides eine Entscheidung der GF ist; auf der Seite steht der Knopf mit Rückfrage bereit.
- Die Änderung „geändert/neu/unverändert“ vergleicht Vornamen mit dem Bisher-Text; „Legal“ gilt per Alias als Lea, „GF“ als Typ gf. Steht eine andere Person hinter einem Bisher-Wort, muss der Alias in `SA_ALIAS` nachgetragen werden.
- Die Phasenleiste legt die Segmente nach Tagen absolut, Analyse und Systembau überlappen sichtbar (Segmente wechselnd oben und unten).
- `launch_confirm` und `launch_set` mit `status: 'bestaetigt'` prüfen „nur Alex oder Lea“ am Feld `by` aus der Sitzung (`gfWho`), wie alle Aktionen des Hauses hinter dem gemeinsamen Passwort seit V27 (Review-Runde 1, Befund 1). Eine serverseitige Identität gäbe es erst mit eigenen Zugängen je Person; das ist eine Entscheidung der GF, kein Fehler dieses Pakets.
- `stundensatz` geht mit `launch_list` an den Browser (seit V27, für Kosten als Summe in launch.html). Wer das als Vertragsdetail einstuft, braucht eine serverseitige Kostenschätzung; Entscheidung der GF.
- Alle 32 zuweisbaren Personen ohne `launch_std_woche`; „Wer trägt wie viel“ zeigt deshalb überall „Zeit nicht eingetragen“, bis die GF Stunden einträgt.
- Draußenbande-Termin (01.10., 11.10. oder 01.12.) und by nature 2027 bleiben Entscheidungen der GF; die Seite rechnet mit dem Wert der Plattform und zeigt die Widersprüche als Hinweis.

**Review-Runde 1 (30.09.2026, Codex read-only, Basis f4e413e mit ungecommittetem Arbeitsbaum, Modell gpt-6-sol).** Sieben Befunde. Fünf behoben: Festivalnamen in „Wer trägt wie viel“ ohne `gfEsc` (Escaping ergänzt); „ab“-Daten vor dem Stichtag in „Änderungen seit dem Sommer“ (Filter `verfuegbar_ab >= seit`); Lastfenster nach Fälligkeit statt nach Launches (`imFenster` jetzt nach VVK-Start der Festivals, Überfälliges zählt, spätere Termine desselben Launches bleiben); „haltbar“ ohne Vorbehalt bei unbesetzter Verantwortung (Feld `vorbehalte`, Satz „rechnerisch haltbar … aber …“); Phasenleiste ohne Überlappung (Segmente absolut nach Tagen). Zwei begründet nicht geändert: die Prüfung „nur Alex oder Lea“ am Feld `by` ist die Architektur des Hauses seit V27 (gemeinsames Passwort, siehe Offen); `stundensatz` und `asana_task_gid` werden seit V27 bewusst geliefert (Kosten als Summe, „in Asana“), der Auftrag nennt `pool_notiz`. Test auf 120 Proben.

**Review-Runde 2 (30.09.2026, Codex read-only, Modell gpt-6-sol).** Befunde 3, 5, 6, 7 aus Runde 1 bestätigt behoben. Zwei neue Befunde behoben: eine fehlende Besetzungszeile zählt in „Diese Woche entscheiden“ als offen (`entscheidungen` prüft die acht Bereiche über `besetzungVon`); der „früheste machbare Termin“ trägt bei unbesetzten Aufgaben den Zusatz „rechnerisch, unter Besetzungsvorbehalt“, im Satz und im Hebel „Verschieben“. Nicht geändert, mit Begründung: die Reihenfolge der „nächsten drei fälligen“ Meilensteine (kommende zuerst, Überfälliges im Zähler und je Zeile markiert); die Prüfung am Feld `by` (Architektur, siehe Offen); `stundensatz` in `launch_list` (seit V27 für die Kostenschätzung in launch.html im Browser; eine serverseitige Kostenrechnung wäre ein eigenes Paket, siehe Offen). Test auf 123 Proben.

**Review-Runde 3 (30.09.2026, Codex read-only, Modell gpt-6-sol, letzte Runde).** Korrekturen aus Runde 2 bestätigt. Zwei neue Befunde: der Fuß der Besetzungstafel zählte nur vorhandene Zeilen (behoben, zählt jetzt über die acht Bereiche wie „Diese Woche entscheiden“); die Auswahl und die Kachel „von allen im Pool“ nutzen `zuweisbar` (aktiv und zuweisbar) statt aller Pool-Zeilen (nicht geändert: so arbeitet launch.html seit V27, der Pool hat 32 zuweisbare Personen, Einträge wie „Verteiler: alle“ oder inaktive Personen gehören in kein Besetzungsfeld). Nach der dritten Runde keine weitere Review; Abnahme danach erneut ohne Meldungen.

## V29 (02.10.2026) · Verteilen und starten, Rückweg aus Asana

Grundlage: Auftrag „Erweitere die Saisonseite um Verteilen und starten (V29)“ vom 02.10.2026, auf V27 und V28. Assets auf `?v=28` in allen Seiten. `action: ping` meldet `version: 37`. Deploy aus der Supabase-CLI.

**Implementiert.**
- Starten von der Saisonseite (`site/saison.html`): in jedem Festival-Block von „Wann kann was wie passieren?“ und im Fuß der Besetzungstafel je Festival der Knopf „Launch starten: Aufgaben nach Asana“ (nach dem ersten Start „Erneut senden: n neue, m aktualisieren“). Er öffnet eine Vorschau in Worten (`versandVorschau`, `versandVorschauSaetze` in `launch-logik.js`): wie viele Aufgaben an welche Personen mit Anzahl und Stunden als Mitte, Aufgaben ohne Person (werden nicht gesendet), Personen ohne Asana-Konto (bleiben als Notiz), Externe ohne Konto mit Angebotsaufgabe beim Übergebenden, ob die Besetzung bestätigt ist, neu gegen aktualisiert, Generator-Unteraufgaben nach denselben Versandregeln (Hilfe mit Konto: Unteraufgabe; externe Hilfe ohne Konto: Angebot beim Zuständigen; sonst Notiz). Start als Alex oder Lea (Chips wie in V28) mit Rückfrage; dann in einem Zug `launch_confirm` (alle Meilensteine mit Person: Besetzung und Zuordnung bestätigt, responsible = Name) und `launch_send`; meldet `launch_confirm` Fehler oder ein misslungenes Protokoll, wird nicht gesendet und der Fehler steht im Block. Danach zeigt der Block den Stand aus Asana statt der Hebel: „In Asana seit <Datum>, Projekt <Link>, n Aufgaben an m Personen, k Aufgaben ohne Person, j Hinweise“ (n alle gesendeten Aufgaben, m die Vereinigung der tatsächlichen Asana-Empfänger aus `detail.empfaenger` aller Versandprotokolle; ohne diesen Eintrag aus den Versandregeln gerechnet), Hinweise aufklappbar (Angebot, ohne Konto, Fehler aus dem letzten Versandprotokoll), dazu erledigt und offen in Asana; die Hebel bleiben über launch.html erreichbar. Der Knopf im Tafel-Fuß öffnet dieselbe Vorschau im Festival-Block. Ein zweiter Start sendet nur Meilensteine ohne `asana_task_gid` neu und aktualisiert vorhandene; das tut `launch_send` seit v35 (Kennung, sonst Name im Projekt), geprüft am Code.
- Rückweg aus Asana: neue Aktion `launch_sync` in `supabase/functions/gfweekly/index.ts` nach dem Muster `asanaSync` der Vertretung, für alle Meilensteine mit `asana_task_gid`: completed setzt `status = complete` (der Cockpit-Wert für erledigt; „done“ gibt es im Schema nicht) und `completed_on`; eine geänderte oder in Asana entfernte Fälligkeit setzt `due_on` (auch auf leer) und sichert den alten Wert in `due_on_vorher`; Protokoll vor der Änderung wie in `asanaSync`, ein misslungenes Protokoll lässt die Änderung aus und der nächste Lauf erkennt sie wieder; der erste Lauf eines Plans liest alle Kommentare (Entdopplung über die Kennung der Story); neue Kommentare (story vom Typ comment) stehen als Zeile `what = launch_sync` in `gfweekly_saison_log` mit `[asana:<gid>]` im Text und `detail.asana_gid` zur Entdopplung. Keine Löschungen. Zeitstempel je Plan in der neuen Tabelle `gfweekly_launch_sync` (plan_id, synced_at, ergebnis), er wandert nur bei fehlerfreiem Lauf. `launch_list` ruft `launch_sync` automatisch auf, wenn der älteste Lauf eines Plans älter als 60 Minuten ist oder ein Plan noch keinen hat; die Versandzeilen (`launch_send`) werden getrennt geladen, damit viele Sync-Zeilen den Projektlink nicht verdrängen; ein Fehler darin bricht die Liste nicht ab, die Antwort trägt `sync`. Knopf „Stand aus Asana holen“ in Abschnitt 4 der Saisonseite und in der Lage von launch.html, mit Satz zum letzten Lauf. Erledigtes fällt damit aus der Last; „Wer trägt wie viel“ und die Ketten rechnen mit dem echten Stand. „Änderungen seit dem Sommer“ zeigt die Sync-Zeilen als Sätze.
- Ist-Stunden: `launch_set` nimmt je Meilenstein `ist_stunden` (0 bis 1000 oder leer); auf launch.html steht das Feld in der Aufgabenzeile, sobald der Stand erledigt ist. Abschnitt 1 der Saisonseite hat eine fünfte Kachel „Richtwerte kalibriert: n von 123 Aufgaben mit Ist-Stunden“. `kalibrierung(meilensteine)` in `launch-logik.js` rechnet je Richtwert-Titel Ist-Schnitt, Mitte, Abweichung und Prozent; `kalibrierungSatz` zeigt in launch.html bei der Aufgabe „bisher im Schnitt x Std. (n Ist-Werte, y Std. über/unter dem Richtwert)“. Noch keine automatische Anpassung der Richtwerte.
- Sichtbarkeit in Asana: jede Aufgabe und jede Generator-Unteraufgabe trägt in der Notiz den Link ins Haus (jetzt `launch.html?festival=`) und den Satz „Stand und Fälligkeit werden stündlich ins Hohe Haus übernommen; erledigt in Asana heißt erledigt im Haus.“ Das Projekt bekommt beim Anlegen und bei jedem Versand eine Beschreibung mit VVK-Start, Festivalverantwortung und Links auf saison.html und launch.html; scheitert das Nachziehen, steht es in `fehler` der Antwort.
- Prüfung: `pruefung/launch-test.mjs` von 123 auf 152 Proben (Vorschau: je Person, ohne Person, ohne Konto, Externe, Übergebender, neu/aktualisiert, Besetzung; Kalibrierung; Sync-Zeilen als Sätze). Testdaten: `launch_sync`, `sync` in `launch_list`, Ist-Stunden an erledigten Meilensteinen, eine Sync-Protokollzeile. Schirme 1440 und 390, dunkel und hell, für alle Seiten; ein neuer Befund (Platzhalter „Std.“ 3,09:1) behoben durch Wegfall des Platzhalters.
- Live geprüft am 02.10.2026 über pg_net mit dem Vault-Secret: `ping` (Version 37), `launch_sync` ohne gesendete Aufgaben (5 Läufe, 0 geprüft, 0 Fehler, fünf Zeilen in `gfweekly_launch_sync`), `launch_list` mit `sync`. `launch_confirm` und `launch_send` nicht live mit echten Daten ausgeführt.

**Befüllte Daten.** `gfweekly_launch_sync` mit fünf Zeilen aus dem Live-Lauf. Sonst nur Protokoll; Meilensteine, Besetzung, `vvp_events` unverändert.

**Offen.**
- Noch kein Launch gestartet: `asana_task_gid` ist überall leer, der Rückweg läuft leer durch. Erst nach dem ersten Start füllen sich Stand aus Asana und Kommentare.
- `ist_stunden` ist überall leer; die Kachel zeigt „0 von 123“. Die Richtwerte werden nicht automatisch angepasst, die Abweichung wird nur gezeigt.
- Erledigt in V29b (unten): der Rückweg läuft zusätzlich stündlich über pg_cron, unabhängig von Seitenaufrufen.
- Wer in Asana eine Aufgabe löscht, löscht nichts im Haus; der Sync meldet die Aufgabe als Fehler (404) und lässt den Zeitstempel des Plans stehen.

**Review-Runde 1 (02.10.2026, Codex read-only, Basis 9e0c85e mit ungecommittetem Arbeitsbaum, Modell gpt-6-sol).** Acht Befunde, alle behoben: Auto-Sync prüfte den neuesten statt den ältesten Zeitstempel; der Start sendete auch nach Fehlern in `launch_confirm`; die Vorschau kannte keine Generator-Unteraufgaben; der Sync ignorierte eine in Asana entfernte Fälligkeit; Protokoll nach statt vor der Änderung; „an m Personen“ zählte Zuständige statt Empfänger; Versandzeilen konnten aus den 120 Protokollzeilen fallen; ein Fehler der Projektbeschreibung wurde verschluckt. Test auf 149 Proben.

**Review-Runde 2 (02.10.2026, Codex read-only, Modell gpt-6-sol).** Befunde 1, 2, 4, 7, 8 aus Runde 1 bestätigt behoben. Fünf Punkte behoben: bei externer Generator-Hilfe suchte `launch_send` die Unteraufgabe unter einem anderen Namen als dem geschriebenen (seit V27; bei jedem erneuten Versand wäre eine weitere Angebots-Unteraufgabe entstanden, jetzt Suche mit dem wirklichen Namen); der Versand protokolliert die tatsächlichen Empfänger (`detail.empfaenger`), die Saisonseite zählt daraus; die Vorschau zählt die Angebots-Unteraufgabe beim Zuständigen und nennt je Angebot den Empfänger; der erste Sync eines Plans war auf sieben Tage begrenzt; die Testantwort für `ping` meldete Version 28. Nicht geändert, mit Begründung: „Protokoll vor der Änderung“ kann ein Protokoll ohne Änderung hinterlassen, wenn das Update scheitert; das ist das Muster aus `asanaSync`, der Fehler wird gezählt, der Zeitstempel bleibt stehen, der nächste Lauf erkennt die Änderung aus Asana erneut (doppelte Protokollzeile als bewusster Preis). Test auf 152 Proben.

**Review-Runde 3 (02.10.2026, Codex read-only, Modell gpt-6-sol, letzte Runde).** Korrekturen aus Runde 2 bestätigt. Zwei Punkte behoben: der Stand nach einem erneuten Versand zählte Aufgaben nur aus dem letzten Protokoll (jetzt alle gesendeten Aufgaben, Empfänger über alle Versände vereinigt); die Vorschau zählte Personen mit nur einer Unteraufgabe bei „an m Personen“ (jetzt getrennt genannt). Dokumentierte Grenze: die Entdopplung der Kommentare liest die letzten 2000 Sync-Protokollzeilen; bleiben nach einem Fehler in einem Zeitfenster mehr als 2000 Kommentare liegen, können ältere doppelt protokolliert werden. Nach der dritten Runde keine weitere Review; Abnahme danach erneut ohne Meldungen. Test auf 152 Proben.

## V30 (02.10.2026) · Jahresrad liest Termine über event_ref aus vvp_events

Grundlage: Paket `habitat-hub/docs/berichte/register/gfweekly-paket-jahresrad.md` (Hub-Sitzung, 30.09.2026), Entscheidung Alex vom 30.09.: Jahresrad und Hub lesen Termine über event_ref aus der Prognose. Weitergereicht von der Prognose-Sitzung (festivalplanung-2027) am 02.10.2026. Weg: das Jahresrad (`site/saison-rad.html`) ist seit V28 ohne Menüeintrag, aber erreichbar und liest über die Edge Function `saison`; deshalb liest `saison` die Termine jetzt live, statt nur die Kopien als abgelöst zu kennzeichnen.

**Implementiert.**
- Edge Function `supabase/functions/saison/index.ts` v2 (`ping` meldet `version: 2`; die Supabase-Deployversion vorher war 11, Rückweg `habitat-hub/docs/berichte/verbindungen/rueckweg/saison.v11.ts`, inhaltsgleich mit dem Repo-Stand vor V30). `get` setzt für Zeilen mit event_ref `festival_start`, `festival_end`, `vvk_start` und neu `vvk_end` aus `public.vvp_events` (`starts_on`, `ends_on`, `sales_start_on`, `sales_end_on`) und markiert sie mit `termin_quelle: 'plattform'`; Zeilen ohne event_ref (mit Freude eG) tragen `termin_quelle: 'zeile'` und ihre eigenen Werte. Relative Elemente (Anker vvk, festival, festival_ende) solcher Zeilen werden beim Lesen vom Live-Anker plus Abstand gerechnet, nicht geschrieben. `row_save` lehnt an Zeilen mit event_ref jeden abweichenden Termin mit 409 ab (voller Wert geprüft, nicht gekürzt) („Der Termin kommt aus der Prognoseplattform“, mit Link auf Wilde Habitate); gleiche Werte sind kein Änderungsversuch; die drei Terminspalten werden dort nicht mehr geschrieben, Name, Ebene, Art, Ziel und Notiz bleiben schreibbar. `item_save` rechnet Abstände gegen die Live-Termine.
- `event_ref` lässt sich über `row_save` nicht setzen (400); ein Lesefehler der Zeile bricht ab, statt sie für neu zu halten.
- `site/saison-rad.html`: Datumsfelder einer Zeile mit event_ref sind nur lesbar und werden beim Speichern nicht mitgeschickt, damit eine Notiz auch nach einer Terminänderung in der Plattform speicherbar bleibt; mit Satz und Link „Der Termin kommt aus der Prognoseplattform … Ändern in Wilde Habitate“.
- Live geprüft am 02.10.2026 über pg_net mit dem Vault-Secret: `ping` (Version 2); `get` mit absichtlich verstellter Kopie (Lusatia `festival_start` 01.07.2027) liefert 23.07.2027 aus vvp_events, die Zeile mit Freude eG ihre eigenen Werte, Kontrolle FAMRD27 30.07. bis 01.08.2027 und WMRD27 20. bis 23.08.2027; `row_save` mit abweichendem Termin an der Draußenbande-Zeile antwortet 409, schreibt nichts und protokolliert nichts. Die Kopie der Lusatia-Zeile ist danach wieder auf 23.07.2027 gesetzt. Nach den Korrekturen: gekürzter Wert `2027-07-30X` 409, `event_ref` in der Nutzlast 400, Speichern der Draußenbande-Zeile ohne Termine 200 mit unveränderter Notiz, Ziel und Terminspalten (Protokollzeile row_update von Claude).

**Befüllte Daten.** Keine. Die Kopien in `gfweekly_saison_rows` stehen unverändert und stimmen am 02.10.2026 mit vvp_events überein.

**Offen.**
- Termine kommen für Zeilen mit event_ref nur noch aus `vvp_events`; die Spalten `festival_start`, `festival_end`, `vvk_start` dieser fünf Zeilen sind abgelöst. Sie werden laut Paket erst gelöscht oder per Migration als abgelöst gekennzeichnet, wenn das Jahresrad zwei Wochen live aus vvp_events gelesen hat (frühestens 16.10.2026).
- `gfweekly_saison_items` speichern weiter absolute Daten (Stand der letzten Speicherung); die Anzeige rechnet sie vom Live-Anker. Wer ein Element speichert, schreibt die Live-Lage fest.

**Review (02.10.2026, Codex read-only, Basis 69facb7 mit Arbeitsbaum, Modell gpt-6-sol).** Vier Befunde, alle behoben: das Formular schickte nur lesbare Termine mit (eine Terminänderung in der Plattform hätte reine Notizänderungen mit 409 blockiert); ein Lesefehler in `getRow` hätte eine verknüpfte Zeile als neu behandelt und Termine geschrieben; `event_ref` in der Nutzlast wurde stillschweigend ignoriert; die Ablehnungsprüfung kürzte Datumswerte auf zehn Zeichen.

**Review-Runde 2 (02.10.2026).** Die vier Korrekturen bestätigt. Zwei neue Punkte behoben: `row_save` fügt neue Zeilen nur ein und aktualisiert bestehende bedingt (ohne event_ref, oder mit demselben event_ref), sodass eine zwischenzeitlich verknüpfte Zeile keine Terminkopie bekommt (409 mit Bitte um Neuladen); die Antwort nach dem Speichern braucht keine zweite Abfrage mehr, ein Lesefehler danach kann ein gelungenes Speichern nicht mehr als 500 melden.

## Besetzung B1 (02.10.2026) · Aufgaben aus der Besetzungswerkstatt des Habitat Hubs

Grundlage: Auftrag „Aufgabenverteilung im Hohen Haus aus Partnern, Angeboten und Festivalzuordnungen des Habitat Hubs“ vom 02.10.2026. Bewusst ohne V-Nummer, weil V29/V30 parallel liefen; Assets bleiben `?v=28` (core.js wird ohnehin mit must-revalidate ausgeliefert). Kein zweites Partnerregister.

**Geprüfter Bestand.** Hub und Haus liegen im selben Supabase-Projekt (`bnfmupnmqyrcltrphfak`), Hub im Schema `hub`. Live am 02.10.: 207 Partner, 233 Angebote, 238 Quellen, 8 Formate (aus `vvp_festivals`), 8 Zuordnungen (alle Saison 2027), 0 Notizen, 91 Partner mit `firma_id`. Aufgabenmodell des Hauses vorher: Themen (`gfweekly_topics`, owner als Text), Vertretungskorb (`gfweekly_handover`), Launch-Meilensteine (`vvp_launch_milestones.person_id` → `gfweekly_people`, Asana über `asana_gid`). Eine allgemeine Aufgabentabelle mit Bezug auf Partnergespräche gab es nicht. Übernommen wurde das Launch-Muster: eindeutige Person aus `gfweekly_people` (aktiv und zuweisbar, 32 Personen), Asana über deren `asana_gid`, Rückweg wie `launch_sync`.

**Führende Quelle je Datentyp.**
- Habitat Hub: Partner, Angebote, Formate, Zuordnung (Festival, Saison, Bereich), Gesprächsstand, Gesprächszuständigkeit (Text `verantwortlich`), nächster Schritt, Gesprächsnotizen, Quellen. Das Haus liest nur, schreibt nie in `hub.*` (Lesefunktionen `hh_besetzung_lage`, `hh_besetzung_zuordnung` in `supabase/migrations/20261002120000_hh_besetzung_aufgaben.sql`).
- Hohes Haus: Aufgaben (`gfweekly_besetzung_aufgaben`): Titel, Person, Aufgabenstand `offen | in_arbeit | erledigt | verworfen`, Termin, Notiz.
- Asana: erst nach ausdrücklichem Senden einer einzelnen Aufgabe; danach führt Asana für „erledigt“ und den Termin. Im Haus sind Person und Termin dann gesperrt (409 mit Satz), Aufgabenstand bleibt änderbar; der Rückweg öffnet nie wieder und löscht nichts (`supabase/functions/besetzung/index.ts`).

**Datenebene** (Migration `supabase/migrations/20261002120000_hh_besetzung_aufgaben.sql`, per Supabase-MCP angewendet; Tabellen per `apply_migration`, Trigger und Funktionen einzeln per `execute_sql`).
- `gfweekly_besetzung_aufgaben`: Bezug auf den Hub über stabile Kennungen (`zuordnung_id`, `angebot_id`, `partner_id`, `format_slug`, `jahr`, `bereich`), keine Kopie von Partnerprofil, Kontakt oder Quelle. Bewusst ohne Fremdschlüssel in das Schema `hub`, damit das Haus keine Hub-Operation blockiert; die Edge Function prüft die Zuordnung beim Anlegen. `person_id` → `gfweekly_people` (leer = noch unbesetzt). `titel_schluessel` (generiert: getrimmt, Leerräume zusammengefasst, klein) mit `unique (zuordnung_id, titel_schluessel)`: wiederholtes Übernehmen derselben Aufgabe am selben Gespräch erzeugt keine Dublette, unterschiedliche Aufgaben je Gespräch sind erlaubt. `aus_schritt` und `aus_schritt_version` halten fest, aus welchem nächsten Schritt (Hub-Version) die Aufgabe entstand. `version` für Versionsprüfung. `asana_task_gid` unique, `asana_gesendet_at/_von` als Sendesperre, `asana_sync_at`.
- `gfweekly_besetzung_aufgaben_log` per Trigger `hh_besetzung_aufgaben_protokoll` (angelegt/geändert mit alt/neu; reine Abgleich-Zeitstempel werden nicht protokolliert).
- Lesefunktionen (security definer, nur `service_role`): `hh_besetzung_lage(p_jahr)` liefert Formate, Zuordnungen der Saison mit Partnername, Art, Sperrhinweis als Ja/Nein (nicht sein Text), Angebotstitel, Gesprächsstand, Gesprächszuständigkeit, nächstem Schritt, Termin, Version, Name der letzten Änderung (`hub.profile.anzeigename`) und Zahl der Gesprächsnotizen; keine E-Mail, Website, Notiz, Notiztexte oder Quellen. `hh_besetzung_zuordnung(p_id)` prüft eine Zuordnung beim Übernehmen.
- RLS an, keine Policies, `anon`/`authenticated` ohne Rechte (geprüft mit `has_table_privilege`/`has_function_privilege`).

**Edge Function `besetzung` v1** (`supabase/functions/besetzung/index.ts`, eigene Funktion wie `saison`, damit `gfweekly` unberührt bleibt; deployt per Supabase-MCP, verify_jwt aus, Auth wie gfweekly über `GFWEEKLY_PASSWORD`; Repo-Datei = deployter Inhalt). Aktionen: `ping`, `lage {jahr?}` (ruft vorher den Asana-Rückweg für gesendete Aufgaben, deren letzter Abgleich älter als 60 Minuten ist), `uebernehmen {zuordnung_id, titel, person_id?, faellig?, beschreibung?, who}` (Antwort `neu: true|false`), `setzen {id, version, titel?, person_id?, status?, faellig?, beschreibung?, who}` (409 mit `aktuell` bei veralteter Version, 409 `doppelt` bei gleichem Titel), `asana_senden {id, who, bestaetigt: true}` (nur mit Person mit `asana_gid`; legt eine Aufgabe im Arbeitsbereich mit Zuweisung an, Notiz mit Festival, Bereich, Partnername, Gesprächsstand, Link zurück ins Haus und Hinweis, dass Gesprächsstand, Budget und Verträge unberührt bleiben; einmal je Aufgabe), `asana_sync`, `verlauf {id}`. `who` = Alex oder Lea aus der Kopfzeile (das Haus hat keine Einzelkonten).

**Seite `site/besetzung.html`** (Navigation „Arbeiten → Besetzung“, Icon `leute`, in `core.js` GF_NAV und GF_ICONS). Saisonwahl (wenn mehrere), Festivalwahl aus den Formaten des Hubs mit Zählern, Lage in Sätzen und fünf Kacheln (Gespräche laufen, Aufgaben offen, ohne Person, überfällig, Bereiche ohne Gespräch), Hinweise (abgesagtes oder zurückgestelltes Gespräch mit offenen Aufgaben; Asana-Abgleich mit Fehlern). Je Bereich die Gespräche mit Gesprächsstand, „Gespräch führt“ (Name im Hub, Text), nächstem Schritt, letzter Änderung im Hub und den daraus entstandenen Aufgaben; Bereiche ohne Gespräch sind benannt. „Als Aufgabe übernehmen“ öffnet ein Formular mit dem nächsten Schritt als Titelvorschlag, Personenwahl aus dem Pool mit Suche (oder „Noch offen“), freiwilligem Termin und Notiz. Je Aufgabe: Person ändern, Aufgabenstand als Chip-Reihe, Termin, zweistufiges „Nach Asana senden“, Herkunft (angelegt/geändert von). „Wer trägt was“ je Person. Deep-Link `besetzung.html?festival=<slug>&aufgabe=<id>`. Gewählter Festival in localStorage `gf_bz_fest`.

**Geprüft.** Backend live per pg_net mit dem Vault-Secret: ping, falsches Passwort 401, lage (8 Zuordnungen, 32 Personen, keine E-Mail-Adressen in der Antwort), uebernehmen (neu; gleiche Aufgabe in anderer Schreibweise und gleichzeitig abgeschickt → keine Dublette, `neu: false`; zweite andere Aufgabe am selben Gespräch angelegt; unbekanntes Gespräch 404; inaktive Person 400; ohne who 400), setzen (Person, Stand, Termin; veraltete Version 409 mit aktuellem Stand; Umbenennen auf vorhandenen Titel 409; unbekannter Stand 400), verlauf (Log aus Trigger), asana_senden ohne Bestätigung 400 und ohne Person 400, asana_sync ohne gesendete Aufgaben. Gesprächsstand der Hub-Zuordnung nach Aufgabe „erledigt“ unverändert (`in_verhandlung`, Version 1). Oberfläche: `pruefung/besetzung-probe.py` (Playwright gegen ein nachgebildetes Backend mit derselben Logik, 1440 dunkel und 390 hell): Festival per Link, Navigation, Übernehmen mit Vorschlag und Personenwahl, zweite Aufgabe ohne Person, Wiederholung ohne Dublette, Aufgabenstand ohne Einfluss auf den Gesprächsstand, Person per Suche, Versionskonflikt verständlich und ohne Überschreiben, Asana zweistufig, Wiederfinden nach Neuladen, Absage-Hinweis, überfälliger Termin, Deep-Link, keine waagerechte Scrollbreite, keine Konsolenfehler; 0 Befunde. Testaufgaben danach aus Tabelle und Log gelöscht.

**Nicht geprüft.** `asana_senden` mit echter Zuweisung (legt eine echte Aufgabe in Asana an; braucht die Entscheidung von Alex oder Lea im Haus). Die Seite selbst gegen das Live-Backend im Browser (erst nach dem Push).

**Offen.**
- Rückverweis im Hub: Die Besetzungswerkstatt zeigt die Aufgaben des Hauses noch nicht an. Vorschlag für ein Hub-Paket: Lesefunktion `hub.besetzung_aufgaben_stand()` (security definer, nur team/gf) mit Anzahl offen/erledigt je Zuordnung und Link `hohes-haus.netlify.app/besetzung.html?festival=…`, Anzeige in `apps/hub/src/module/besetzung`. Nicht gebaut, weil der Hub eigene Regeln (Dateibesitz, Kostenkontrolle, Runner) hat.
- „Gespräch führt“ bleibt Text aus dem Hub und wird nicht automatisch einer Person zugeordnet. Eine echte Kennung bräuchte im Hub eine Spalte mit `user_id` oder eine Zuordnung `hub.profile` ↔ `gfweekly_people` (heute nicht vorhanden).
- Autor im Haus = gewählte Person in der Kopfzeile (Alex/Lea), nicht kontobasiert, wie überall im Haus.
- Asana-Rückweg läuft nur beim Seitenaufruf (älter als 60 Minuten) oder per `asana_sync`; kein Zeitplan.
- Aufgaben erscheinen noch nicht auf „Für dich“ oder in der Vertretung.

## V29b (02.10.2026) · Rückweg aus Asana stündlich

**Implementiert.** Migration `supabase/migrations/20261002140000_hh_launch_sync_zeitplan.sql` (angewendet): SQL-Funktion `public.hh_launch_sync_tick()` nach dem Muster `hh_absence_tick` (security definer, Vault-Secret `gfweekly_password`, `net.http_post` auf `gfweekly` mit `action: launch_sync`, `by: Zeitplan`), Ausführungsrecht für public, anon und authenticated entzogen; pg_cron-Job `hh_launch_sync_stuendlich` um Minute 23 jeder Stunde eingerichtet; der erste geplante Lauf ist zur Zeit dieses Eintrags noch nicht beobachtet. Der Auto-Sync in `launch_list` bleibt als zweiter Weg.
- Nach der Review: Laufsperre in `launchSync` (Zeile mit fester Kennung `00000000-0000-0000-0000-000000000001` in `gfweekly_launch_sync`, bedingt beansprucht, nach fünf Minuten verfallen, am Ende freigegeben), sodass Zeitplan und Seitenaufruf nicht gleichzeitig arbeiten; Zeitbudget 90 Sekunden je Lauf, auch für einzelne Asana-Abrufe (Abbruch per Restfrist), älteste Pläne zuerst; ein unvollständiger Plan behält seinen Zeitstempel und speichert eine Fortschrittsmarke (letzte fertige Aufgabe, Zyklusbeginn), der nächste Lauf macht dahinter weiter, und erst der vollständige Durchgang setzt den Zeitstempel auf den Zyklusbeginn; eindeutiger Index `gfweekly_saison_log_launch_sync_kommentar` auf `detail->>'asana_gid'` für `launch_sync`, ein schon vorhandener Kommentar gilt als übernommen. saison.html und launch.html sagen „Achtung: der Rückweg aus Asana ist seit über zwei Stunden nicht gelaufen“, wenn Aufgaben in Asana stehen und der älteste gespeicherte Plan-Zeitstempel älter ist (nicht der Laufbeginn).

**Live geprüft am 02.10.2026.** Zwei gleichzeitige Handaufrufe nach dem Einbau der Sperre: einer prüfte 19 Aufgaben ohne Fehler, der andere antwortete „Ein anderer Lauf ist gerade dabei“, die Sperre war danach frei. Erster Handaufruf davor: Antwort 200, 5 Pläne, 19 Aufgaben geprüft, 0 Fehler, Zeitstempel in `gfweekly_launch_sync` weitergeschoben; `anon` hat kein Ausführungsrecht. Dabei kam der erste echte Rückweg: Alex hatte um 08:13 die Draußenbande gestartet (`launch_confirm` 25 Zuordnungen und 7 Besetzungen, `launch_send` 19 neue Aufgaben an 5 Personen: Christian Linck 9, Alexander Dettke 4, Lea Luce 3, Antonia Gericke 2, Niclaas Dettke 1); „Launch durchgeführt“ war in Asana erledigt und steht jetzt im Haus als erledigt am 02.10.2026, mit Protokollzeile von „Zeitplan“. Die sechs nicht gesendeten Meilensteine der Draußenbande waren schon erledigt und werden bewusst nicht gesendet.

**Befüllte Daten.** Keine außer Protokoll und Sync-Zeitstempel.

**Offen.** Die Festivalverantwortung der Draußenbande steht in der Besetzung weiter auf offen; die fv-Meilensteine tragen Personen je Aufgabe (Alex, Lea).

**Review V29b (02.10.2026, Codex read-only, Modell gpt-6-sol).** Drei Befunde, alle behoben: gleichzeitige Läufe ohne Sperre (Laufsperre und eindeutiger Kommentar-Index); keine Absicherung der Laufzeit gegen das Limit von 120 Sekunden (Budget 90 Sekunden, Rest im nächsten Lauf); „stündlich übernommen“ ohne Nachweis (Wortlaut „eingerichtet“, Hinweis auf beiden Seiten nach zwei Stunden ohne Lauf).

**Review V29b, Runde 2.** Sperre und Kommentar-Index bestätigt. Drei Restpunkte behoben: Asana-Abrufe brechen bei der Restfrist ab; Fortschrittsmarke je Plan statt Neubeginn; die Warnung liest nur gespeicherte Zeitstempel. Live danach: 200, 19 Aufgaben geprüft, 0 Fehler, keine offene Marke, Sperre frei. Der erste geplante Lauf ist für 10:23 Berliner Zeit angesetzt und war beim Schreiben noch nicht gelaufen.

**Review V29b, Runde 3 (letzte).** Die Korrekturen aus Runde 2 bestätigt. Ein Restpunkt: Kommentare wurden je Story einzeln eingefügt, ohne Frist. Behoben nach der dritten Runde (deshalb ohne erneute Review): neue Kommentare einer Aufgabe gehen in einem einzigen Insert in das Protokoll, nur bei einem Konflikt mit dem eindeutigen Index einzeln mit Fristprüfung. Live danach: 200, 19 Aufgaben geprüft, 0 Fehler, Sperre frei. Bekannte Grenze: eine einzelne Aufgabe mit mehr als 50 Kommentarseiten (5.000 Kommentare) zählt als Fehler und lässt den Zeitstempel ihres Plans stehen.

## V29c (02.10.2026) · Saisonseite nach der Teilung des Partnerbereichs

Grundlage: Übergabe `docs/hohes-haus_Launch_Partner_geteilt_2026-10-02.md` (Cowork, Commits f4832b2 und 96ed37d): Partner ist geteilt in Formatpartner (sort 6) und Kollektive (sort 7), der alte Bereich heißt „Partner (alt, entfällt)“ mit sort 99.

**Implementiert.** `site/saison.html` hatte die Bereiche als feste Liste mit `partner`; die Besetzungstafel, „Bisher und jetzt“ und „Diese Woche entscheiden“ hätten den abgelösten Bereich gezeigt und die beiden neuen nicht. Jetzt feste Reihenfolge Festivalverantwortung, Kommunikation, Content, Ticketing, Formatpartner, Kollektive, Systeme, Recht, GF-Entscheidungen, dazu jeder weitere Bereich aus den Daten; Bereiche ab sort 99 fallen weg. launch.html und die Edge Function lesen die Bereiche schon aus `gfweekly_launch_bereiche`. Testdaten nachgezogen: zehn Bereiche, Besetzung ohne den abgelösten, Pool-Felder ohne `partner`. Sie bilden die Teilung synthetisch ab (überall dieselbe Testperson, meist Vorschlag), nicht den konkreten Übergabefall mit bestätigter Besetzung und Helges Kollektiv-Meilenstein; der steht nur live. Vergleich bisher/jetzt prüft den Vornamen als ganzes Wort, nicht als Teil eines Bindestrich-Worts; Test auf 154 Proben.

**Review V29c (02.10.2026, Codex read-only).** Drei Befunde: Namensvergleich zu grob (behoben, „Kollektiv Ost“ galt gegenüber „Lea (Kollektiv-Thread)“ als unverändert); Testdaten bildeten die Übergabe nur teilweise ab (behoben); „bisher“ fehle für Formatpartner und Kollektive (verworfen: beide Zeilen stehen live in `gfweekly_launch_besetzung_vorher`, geprüft am 02.10.2026). Abnahme: 72 Bilder, 0 Meldungen.

**Offen.** Das Löschen des alten Bereichs `partner` steht weiter aus. Neben der Zeile in `gfweekly_launch_besetzung_vorher` hängt auch eine Zeile in `gfweekly_team_felder` (Fremdschlüssel `gfweekly_team_felder_launch_bereich_fkey`) daran; die beiden Befehle aus der Übergabe würden daran scheitern. Besetzung, Meilensteine, Richtwerte und Pool-Felder verwenden `partner` nicht mehr (0 Zeilen, geprüft am 02.10.2026).

## V31 (03.10.2026) · Vorhaben: Woche, Board, Liste, Akte, Einwurf, Übergabe

Auftrag: `docs/PAKET-V31-VORHABEN.md`, Prüfauftrag `docs/reviews/V31-pruefauftrag.md`, Branch `paket/v31-vorhaben`. Datenmodell und Erstbefüllung (16 Vorhaben, 65 Punkte, 45 Verlaufseinträge) aus Cowork, Migrationen `20261003162639` bis `20261003163436`.

### 31a · Backend, Edge Function v38

**Migration** `supabase/migrations/20261003165328_hh_vorhaben_v31a.sql`, angewendet am 03.10.2026 über `supabase db query --linked` (CLI 2.119.0) mit Eintrag in `supabase_migrations.schema_migrations` unter derselben Kennung:
- Sicht `hh_vorhaben_lage` neu (drop und create, `security_invoker`, nur `service_role`): jetzt mit `ball_vor_abwesenheit`, `absence_id`, dazu `punkt_frist` (nächste offene Punkt-Frist), `frist_massgeblich` (Frist, sonst Punkt-Frist) und `vorschlaege_offen`. Der Zustand `ueberfaellig` rechnet mit der maßgeblichen Frist, damit Woche und Zustand dieselbe Frist meinen.
- `hh_touch_updated_at()` mit Trigger `before update` auf `hh_vorhaben` und `hh_vorhaben_punkte`.
- `hh_vorhaben_verlauf.punkt_id` (Bezug zum Punkt; `punkt_delete` prüft daran und am `source_ref`).
- `hh_vorhaben_save(id, patch, by, notiz, anlass)`: Zeile, `ball_seit` und Verlauf in einer Transaktion. Ballwechsel schreibt `uebergabe` „Ball von <alt> an <neu>“ (plus Notiz), Änderungen an nächstem Schritt, Stand, Frist und Status je einen `system`-Eintrag. `expect_ball` schützt vor gleichzeitigem Weitergeben (Fehlercode `PT409`, HTTP 409; `40001` wiederholt PostgREST bis zum Timeout, so in der Wirkungsprobe am 03.10.2026 beobachtet). Ein Ballwechsel von Hand löst die Bindung an eine Abwesenheit (`absence_id`, `ball_vor_abwesenheit`).
- `hh_handover_set` kennt `kind = vorhaben`: Vertretung setzt `ball_vor_abwesenheit`, Ball und `absence_id` und schreibt „in Vertretung für <Person> bis <bis>“; Ampel ruht lässt den Ball liegen und schreibt „ruht bis <bis + 1 Tag>“; Vertretung entfernt oder Ruhe aufgehoben gibt den Ball zurück. Verlauf nur, wenn sich Status, Ampel oder Vertretung der Zeile geändert haben.
- `hh_vorhaben_zurueck(absence, by, vorhaben?)`: Bälle zurück, Verlauf mit `source_ref` `abwesenheit:<id>:zurueck:<vorhaben>` (doppelte Aufrufe schreiben nichts doppelt). Aufgerufen von `absence_end`, vom Tick beim Wechsel nach `rueckkehr` und von `handover_zurueck`.

**Aktionen** (alle hinter dem Passwort, schreibende mit `by` Alex oder Lea): `vorhaben_list`, `vorhaben_badge`, `vorhaben_get`, `vorhaben_save`, `punkt_save`, `punkt_toggle`, `punkt_delete`, `verlauf_add`, `verlauf_status`, `vorhaben_verknuepfen`, `einwurf_add`, `einwurf_apply`, `einwurf_verwerfen`, `einwurf_list`, `schicht_uebergabe`, `vorhaben_rueckkehr`; `ping` meldet 38.
- Einwurf: Modell aus `GFWEEKLY_EINWURF_MODEL`, sonst `GFWEEKLY_TIDY_MODEL`, sonst `claude-sonnet-5`; Abbruch nach 20 Sekunden, dann bleibt der Einwurf `neu`. Die KI bekommt Text, Datum, Person und die aktiven Vorhaben mit offenen Punkten (bei vorgegebenem Vorhaben nur dieses). Die Antwort wird Feld für Feld geprüft (`einwurfPruefen`): unbekannte Slugs, Punkte anderer Vorhaben, ungültige Daten und Ballwerte fallen heraus und stehen in `vorschlag.verworfen`. Dazu ein Wortfilter (`VH_VERTRAULICH`): Texte, die nach Zugangsdaten, Konto- oder Kartennummer oder Gesundheit aussehen, werden nicht übernommen und in `vorschlag.vertraulich` markiert. Das ist ein Wortfilter, er fängt offensichtliche Fälle, keine Umschreibungen.
- `einwurf_apply` ruft `hh_einwurf_apply` auf: Anspruch auf den Einwurf, Verlauf (`source_ref = einwurf:<id>`), Punkte, neue Punkte, Ball, nächster Schritt, Frist, Ticker bei „sofort“ und Statuswechsel in einer Transaktion. Gilt der Vorschlag für ein anderes Vorhaben als das gewählte, entsteht nur der Verlaufseintrag (ein Ticker nur bei ausdrücklich gewähltem „sofort“); `einwurf_vorschlag` holt dann einen gegen das neue Ziel geprüften Vorschlag. Vorschläge aus der Edge Function tragen eine `revision` und den gesehenen Ball (`ball_gesehen`); angewendet wird nur die gesehene Revision, und ein vorgeschlagener Ballwechsel nur, wenn der Ball noch dort liegt (sonst 409). Vorschläge des Mail-Abgleichs tragen nur `vorhaben_slug`, keine Revision; sie gelten als passend, wenn der slug stimmt, und der Dialog schickt den gesehenen Ball mit. `hh_einwurf_apply` prüft jedes anwendbare Feld (Migration `20261003174603`), auch bei Vorschlägen, die der Abgleich direkt schreibt; fremde Daten nur über `hh_datum`. Jeder Text, der in Verlauf, nächsten Schritt oder Ticker geht, läuft durch `hh_vertraulich` (Migration `20261003173522`, derselbe Wortfilter wie in der Edge Function); bei einem Treffer braucht es einen bearbeiteten Text.
- Weitere Transaktionen (Migration `20261003172105_hh_vorhaben_v31a_transaktionen.sql`): `hh_punkt_toggle`, `hh_punkt_save`, `hh_vorhaben_neu`, `hh_verlauf_status` (Übernehmen eines Abgleich-Vorschlags „Punkt erledigt“ hakt den Punkt aus dem `source_ref` im selben Zug ab). Fehlercodes `PT400`, `PT404`, `PT409` kommen als HTTP-Status an.
- `schicht_uebergabe` verlangt den gesehenen Ball (`expect_ball`) je Eintrag und meldet Konflikte; `by` muss `von` sein. `hh_handover_set` setzt bei erneuter Bestätigung oder beim Erledigen keinen Ball zurück, den jemand während der Vertretung von Hand bewegt hat; nur eine geänderte Ampel oder Vertretung gilt als neuer Wechsel. `hh_verlauf_status` entscheidet einen Vorschlag des Abgleichs einmal. Das Übergabeprotokoll bekommt nur bei einer Änderung einen Eintrag.
- `probe_aufraeumen`: nur für die Wirkungsprobe, fest auf Einwürfe mit `source_ref` `probe:v31:…` (nur dieses Muster nimmt `einwurf_add` an), Ticker aus Einwürfen an den Testvorhaben, die archivierten Testvorhaben `test-v31` und `test-v31-ziel` und beendete Testabwesenheiten mit Notiz „V31-Probe“.
- Übergabe: `handoverItems` nimmt Vorhaben mit Ball bei der abwesenden Person und Vorhaben mit Ball `gf` und Frist im Fenster auf (`kind vorhaben`, Frist = maßgebliche Frist, Ball `gf` zählt wie gate gf); Dossier mit Stand, nächstem Schritt, offenen Punkten, letzten fünf Verlaufseinträgen, Konflikt und slug.
- Nebenbei behoben: `absence_end` und das Ende im Tick leerten `owner_backup` an jedem Thema im Korb, auch an Themen, die über eine andere Abwesenheit vertreten werden. Jetzt nur an Themen, deren `handover_id` auf die Zeile dieser Abwesenheit zeigt. Ohne die Korrektur hätte das Ende einer Testabwesenheit nach dem 14.10. Leas echte Vertretung geleert.

**Geprüft.** `pruefung/vorhaben-probe.mjs` gegen das echte Backend am 03.10.2026 nach der Nacharbeit aus Runde 3: 82 von 82 Proben. Einmalig live, außerhalb der Probe: ein Vorschlag in der Form des Mail-Abgleichs (nur slug) mit vertraulichem Punktstand (400), falschem gesehenem Ball (409) und vollständiger Übernahme (Belege in `docs/reviews/V31a-antwort-3.md`). Darin: Einwurf mit KI (erkannt test-v31, Punkt Probe erledigt), Zielwechsel mit und ohne „sofort“, vertraulicher Text (bearbeitet, nächster Schritt, Zielwechsel), veraltete Revision, gleichzeitige Ballwechsel (einer 200, einer 409), Schichtwechsel mit Konflikt, zwei Testabwesenheiten mit Vertretung, erneuter Bestätigung und Rückgabe; jede echte Akte vorher und nachher gleich. Negativproben prüfen Status und Grund. Typprüfung `deno check`: dieselben 12 Altfehler im Launch-Code wie auf `e574583`, keine neuen.

**Offen und Grenzen.** Einen Fehler mitten in `einwurf_apply` simuliert die Probe nicht; die Unteilbarkeit folgt aus der Transaktion. Die Probe lässt den archivierten Bestand eines Laufs liegen (zwei Testvorhaben, zwei beendete Testabwesenheiten) und löscht ihn beim nächsten Lauf; Einwürfe und Ticker der Probe löscht sie sofort. Die einmalige Entscheidung über Abgleich-Vorschläge ist nicht in der Probe, weil nur der Abgleich Vorschläge schreibt. Läuft während der Probe der Abgleich aus Cowork, schlägt der Vergleich der echten Akten zu Recht an.

### 31b · Seite `site/vorhaben.html`

**Implementiert.** Navigation „Heute“, zweiter Eintrag „Vorhaben“ mit neuem Linien-Icon `wegweiser` und Zähler aus `vorhaben_badge` (offene Einwürfe plus Vorhaben mit Ball bei mir und Zustand überfällig). Gemeinsame Helfer in `core.js` (`gfVhBall`, `gfVhZustand`, `gfVhFrist`, `gfVhMir`, `gfVhSeen`, `GF_VH_*`). Assets `?v=29`.
- Kopf: Metaphase aus `gfweekly_saison_items` (Zeile `meta`, heute im Zeitraum), eine Lagezeile (Stand, Zahl, Bälle bei Alex und Lea, ohne Ball, Abwesenheiten aus den Daten), Knöpfe Übergeben und Einwurf, Hinweis „<n> Einwürfe warten“.
- Umschalter Woche, Board, Liste (`gf_vh_view`), Filter Alle, Bei mir, Bewegt, Konflikte (`gf_vh_filter`, `?filter=mir` gewinnt). „Bei mir“: Ball bei mir, bei der GF oder extern mit mir als Eigentümer. „Konflikte“: Konflikttext, überfällig oder Ball fehlt.
- Woche: Überfällig, die laufende Woche und acht weitere (Montag bis Sonntag, Berliner Kalendertag vom Server), Später, Ohne Datum. Maßgebliche Frist wie in der Sicht. Marken als Symbol plus Wort: ★ Launch (Gruppe launch und VVK-Start aus der Saison in dieser Woche), ⚠ überfällig, ⚠ Ball fehlt, ⚠ Konflikttext, ▬ pausiert. Bänder der Abwesenheiten (geplant und aktiv, ohne Testabwesenheiten) mit Vertretung aus `vertretung_standard`.
- Board: sechs Spalten nach Ball, Ziehen zwischen Spalten (Team und Extern verlangen einen Namen), Knopf „Ball weitergeben“ je Karte (mit Maus beim Zeigen oder Fokus, am Handy stehend sichtbar). Jeder Wechsel schickt `expect_ball`; ein 409 lädt neu. Spalte mit mehr als fünf: „⚠ <n> Vorhaben, <k> mit Frist in 14 Tagen“.
- Liste: Gruppen nach `gruppe`, Zeilen als Knöpfe in einem waagrecht scrollenden Kasten.
- Akte: ab 1024 px Spalte rechts (sticky), darunter Vollbild-Blatt mit Zurück; `?v=<slug|id>&tab=verlauf`. Kacheln Ball (seit), Frist, Punkte; Konflikt; nächster Schritt und Stand inline, gespeichert beim Verlassen des Feldes. Reiter Prozess (Checkliste mit Haken, Punkt anlegen und ändern, verknüpfte Themen und Kandidaten mit „Zuordnung lösen“ (Abschnitt Zuordnung des Pakets) und „Rückgängig“, Ball geben an, Abgleichstand aus `quellen`) und Verlauf (Filter Alles, Entscheidungen, seit dem letzten Besuch, ohne gemerkten Besuch die letzten 24 Stunden, der Zeitpunkt steht dabei; Vorschläge mit Übernehmen und Verwerfen; „Etwas eintragen …“). Stufen für Verträge sind weggelassen (Paket: „für V31 genügt: keine Stufen-Daten, Feld weglassen“).
- Handy: Umschalter und Filter als wischbare Zeilen, „Übergeben“ bleibt im Kopf, Einwurf als fester Knopf (56 px, Safe-Area), Akte als Vollbild. Nur die jüngste Aktenanfrage zeichnet die Akte (schnelles Wechseln zeigt keine alte Antwort). Gleichzeitiges Bearbeiten: Punktformular, Stand und nächster Schritt schicken nur geänderte Felder mit dem gesehenen Wert (`expect`), `hh_punkt_save` und `hh_vorhaben_save` antworten bei Abweichung 409 (Migration `20261003175631`). Dialoge sind modal über `gfModalAuf` (Hintergrund `inert`, Tab bleibt im Dialog, Fokus kehrt zurück). Nach Runde 3: der Ballwechsel prüft auch den Namen (`expect.ball_name`), „Zuordnung lösen“ und „Rückgängig“ prüfen den gesehenen Bezug (`expect_vorhaben_id`, sonst 409), nicht gespeicherter Text bleibt als Entwurf im Feld.

**Geprüft (Oberflächentest).** `pruefung/schirme.mjs` mit `vorhaben.html` (Kern `#vhMain`) und zwei Akten-Ansichten (`#vhAkte`, Board mit Prozess, Liste mit Verlauf): 84 Bilder, 0 Meldungen am 03.10.2026. `pruefung/bedienung.mjs`, Abschnitt Vorhaben: 29 Proben (Ansichten, Filter, Akte, Haken, nur geänderte Punktfelder, Name beim Wechsel der Ballart, Fokusfalle, Ball mit `expect_ball`, Vorschlag übernehmen, Escape, Dialog „Ball weitergeben“ mit Pflichtname und Notiz gegen eine schreibende Testantwort, Konflikt 409, Enter auf einer Karte). Der Beleg `pruefung/letzte-abnahme.json` hängt am Inhalt der geprüften Dateien (`stand`), sein Feld `commit` nennt den Commit, auf dem der Lauf startete. Beide fangen die Edge Function ab und belegen die Oberfläche, nicht die Wirkung in der Datenbank.

### 31c · Einwurf

**Implementiert.** `gfEinwurf({vorhaben_id?, einwurf?, onDone, kopf, weiter})` und `gfEinwurfWarteschlange({vorhaben_id?, onDone})` in `core.js`, erreichbar aus `vorhaben.html` (Kopf, fester Knopf am Handy, Akte über „Etwas eintragen …“ mit vorgewähltem Vorhaben, Hinweis „<n> Einwürfe warten“) und aus Für dich (Knopf im Kopf, fester Knopf am Handy).
- Schritt 1: „Was ist passiert?“ mit dem Hinweis auf das Mikrofon der Tastatur, Vorhaben optional als Chip-Reihe, „Weiter“ ruft `einwurf_add` (Kanal knopf).
- Schritt 2: Herkunft (Kanal, Person, Zeit), der Rohtext, „Erkannt: <Vorhaben>“ mit „ändern“ (holt über `einwurf_vorschlag` einen Vorschlag für das neue Ziel; ohne Vorschlag nur das Ziel), Marke „unsicher, bitte prüfen“ bei Sicherheit unter 0,5, der vorgeschlagene Verlaufseintrag, die Änderungen als Haken (Verlauf, je Punkt Stand oder erledigt, neue Punkte, Ball nicht vorausgewählt, nächster Schritt, Frist), was die Prüfung verworfen hat, „<andere Person> erfährt es: im Morgenbericht | sofort“, Knöpfe Verwerfen, Bearbeiten (Verlaufstext und nächster Schritt) und Übernehmen. Übernehmen schickt Auswahl, Bearbeitung, `revision` und den gesehenen Ball (`expect_ball`).
- Ohne Vorschlag (KI fällt aus, Zeitüberschreitung, Einwurf ohne Vorschlag): Hinweis, Vorhaben von Hand, nur der Verlaufseintrag. Passt der Vorschlag nicht zum gewählten Vorhaben: Hinweis „Übernommen wird nur der Verlaufseintrag“. Als vertraulich markierter Text: Hinweis und Textfeld zum Formulieren.
- Warteschlange: offene Einwürfe der Reihe nach, älteste zuerst, Kopf „1 von 3“, „Später“ springt weiter, Escape beendet. Nach jedem Übernehmen aktualisieren sich Seite und Zähler.
- Keine eigene Sprachaufnahme in V31 (Paket 31c).
- Nach Runde 3 und der Gesamtprüfung: der Dialog steht sofort mit Ladehinweis da; die Benachrichtigung heißt „in Für dich, beim nächsten Besuch“ oder „sofort im Laufband“ (der Morgenbericht ist nicht angebunden); „sofort“ entsteht nur aus dem übernommenen Verlaufstext; Übernehmen schickt die gesehenen Werte von nächstem Schritt und Frist mit, `hh_einwurf_apply` vergleicht sie und die Punktstände unter der Sperre (Migration `20261003191414`).
- Nach Runde 2: Zielwechsel verwirft auch bearbeiteten Text und Schritt; ein bewusst geleertes Pflichtfeld bleibt leer; nach einem Konflikt lädt der Dialog den Einwurf gezielt (`einwurf_list` mit `id`) und sperrt Übernehmen bis dahin. Assets `?v=30`.
- Nach Runde 1: Zielwechsel setzt die Benachrichtigung zurück; ohne Vorschlag gilt die Wahl von Hand sofort, „Vorschlag für dieses Vorhaben holen“ fragt die KI ausdrücklich; Verlaufstext ist dann Pflicht; bei Konflikt lädt der Einwurf neu; die Warteschlange aktualisiert die Seite nach jeder Entscheidung.

**Geprüft (Oberflächentest).** `pruefung/bedienung.mjs`, Abschnitt Einwurf: 2 Proben, darunter KI-Ausfall mit Wahl von Hand, gescheiterter Zielwechsel, Zielwechsel mit bearbeitetem Text, Konflikt beim Übernehmen, Dialog bei 390 px; dazu die ersten 14 Proben (Pflichttext, `einwurf_add`, Haken, Ball nicht vorausgewählt, Verworfenes sichtbar, Nutzlast von `einwurf_apply` mit Revision, gesehenem Ball und Benachrichtigung, Warteschlange mit Herkunft, Zielwechsel ruft `einwurf_vorschlag`, Später ohne Entscheidung, Einwurf aus Für dich). Die Wirkung im Backend belegt die Wirkungsprobe aus 31a.

### 31d · Für dich, Übergabe, Rückkehr

**Implementiert.**
- Für dich (`site/index.html`): erster Block „Deine Vorhaben“ (Ball bei mir oder GF, nach maßgeblicher Frist, höchstens fünf, Rest „und <n> weitere →“ auf `vorhaben.html?filter=mir`), zweiter Block „Seit du zuletzt da warst“ (neue Aktion `vorhaben_seit`: bestätigte Verlaufseinträge aktiver Vorhaben seit `gf_vh_seen_<Person>`, ohne Wert 24 Stunden, ohne die eigenen Einträge; je Vorhaben eine Zeile mit Zahl und jüngstem Eintrag, „wartet auf dich“, wenn im Fenster ein Ballwechsel steht und der Ball jetzt bei mir liegt; „Alles gesehen“ setzt den Zeitpunkt). Beim Personenwechsel lädt die Seite neu.
- Entscheidung zu Doppeltem: die bisherigen Blöcke (Deine Entscheidung, Vertretung, Seit gestern, Nächste Fristen) rücken nach unten, keiner entfällt. Sie zeigen Themen, Kandidaten, das Briefing des Laufs und Fristen außerhalb der Vorhaben; die Akte zählt verknüpfte Themen nur und ersetzt die Entscheidungsliste nicht. Offen als Frage in `FRAGEN_FUER_MORGEN.md`.
- Übergabe aus `vorhaben.html` („Übergeben“, auch am Handy im Kopf): Anlass Feierabend oder Schichtende (Bälle bei mir je Vorhaben „<andere> übernimmt“, „bleibt bei mir“ (Vorauswahl), „GF gemeinsam“, Notiz; `schicht_uebergabe` mit gesehenem Ball; Konflikte je Zeile), Urlaub oder Krank (nimmt die laufende Abwesenheit oder legt über `absence_set` eine an, auf Wunsch als Probe mit `test: true`; die Vorhaben-Zeilen des Korbs oben mit „<andere> übernimmt“, „Ruht bis <Rückkehr>“, „Team“ mit Pflichtname; `handover_set_many`; Link in die Übergabe für den Rest des Korbs).
- `uebergabe.html`: Vorhaben-Zeilen tragen das Wort „Vorhaben“, der Titel und „Akte öffnen“ führen in die Akte; das Dossier zeigt Ball, Konflikt, offene Punkte und die letzten Verlaufseinträge.
- Nach der Review 31d: der Urlaubsdialog fragt bei mehreren Abwesenheiten, welche gemeint ist; bestätigte Zeilen zeigen ihren Stand und gehen nur bei einer Änderung raus, jede gesendete Zeile mit `expect` (`hh_handover_set` antwortet bei Abweichung 409); eine Probe warnt, dass echte Bälle wandern, und lässt sich im Dialog beenden. `vorhaben_seit` filtert in der Datenbank, blättert bis 2.000 Einträge und blendet nur Einträge mit `created_by` genau der Person aus (Einträge des Abgleichs aus dem eigenen Konto bleiben).
- Nach Runde 3 und der Gesamtprüfung: `absence_end` läuft über `hh_absence_end` (Status, Themen, Vorhaben-Bälle, Protokoll in einer Transaktion); `schicht_uebergabe` gibt nur Bälle der abgebenden Person weiter; `handover_set` und `handover_set_many` verlangen `by`; Für dich verwirft verspätete Antworten und Antworten der anderen Person, zeigt Ballwechsel zu mir zuerst und bietet über 2.000 Einträgen kein „Alles gesehen“; die Rückkehr zeigt alle Einträge seit Beginn (Rest aufklappbar).
- Nach der Review 31d, Runde 2: keine Abwesenheit wird von selbst gewählt (Auswahl mit Zeitraum und Anlass), nach einem Teilfehler baut der Dialog alles aus dem frischen Korb neu auf, „Alles gesehen“ geht bei gekürzter Liste nur bis zum ältesten geladenen Eintrag, `vorhaben_rueckkehr` blättert bis 5.000 Einträge ab Mitternacht Berliner Zeit, und die Rückübergabe ist bis zum Laden der Vorhaben gesperrt.
- `rueckkehr.html`: Abschnitt „Deine Vorhaben zurück“ aus `vorhaben_rueckkehr` (Ball zurück, noch bei der Vertretung oder hat geruht, je Vorhaben die Einträge seit Beginn der Abwesenheit, höchstens fünf, Rest in der Akte); „Rückübergabe bestätigen“ schickt jetzt `by` mit. Ladezustand, Fehler mit „noch einmal laden“, Leerzustand und eine Kurzzeile zurückgegeben, noch in Vertretung, geruht.

**Geprüft (Oberflächentest).** `pruefung/bedienung.mjs`, Abschnitt 31d: 15 Proben (Reihenfolge und Inhalt der Blöcke auf Für dich, „wartet auf dich“, „Alles gesehen“, Vorhaben-Zeile in der Übergabe mit Link, Rückkehr, Übergabe-Dialog Feierabend mit Nutzlast, Urlaub mit laufender Abwesenheit, Pflichtname bei Team, Ruht). Schirme 84 Bilder, 0 Meldungen.

### 31e · Abgleich und Quellen

**Abgleich.** Läuft als geplanter Cowork-Auftrag (`docs/ABGLEICH-VORHABEN.md`), in der Edge Function ist dafür nichts gebaut. Geprüft am 03.10.2026: um 20:16 Uhr (Berliner Zeit) noch 0 Einträge, um 20:18 Uhr schrieb `abgleich-alex` fünf Verlaufseinträge mit `source_ref` `abgleich:alex:…` (drei Mails, zwei Vorschläge zum Stand von XCeed-Punkten) und setzte `quellen` „Gmail Alex“ an Draußenbande und XCeed; Ball, Stand, nächster Schritt, Frist, Status und `updated_by` blieben unverändert. Dieser Lauf belegt den Auftragstext vom 03.10.2026, nicht die späteren Korrekturen. Nachgezogen nach den Reviews, im Text vorbereitet und im eingerichteten Auftrag noch nicht aktiv: Quelle C ohne Einwurf- und XCeed-Adresse, Quelle C2 für XCeed-Berichte, Abgleichstand über `hh_vorhaben_quelle` (Migration `20261003182649`). Was die Oberfläche für den Abgleich bereithält: Vorschläge im Verlauf mit ihrer Wirkung im Knopf („Übernehmen und abhaken“, „Stand am Punkt übernehmen …“ öffnet den Punkt mit dem vorgeschlagenen Stand und übernimmt Stand und Vorschlag in einer Transaktion über `vorschlag_stand` und `hh_vorschlag_stand` (Migration `20261003185231`, nur wenn der Text einen Stand nach „jetzt so steht:“ trägt), sonst „In den Verlauf übernehmen“), Verwerfen, Einwürfe aus Mail in der Warteschlange (Vorschläge mit `vorhaben_slug` werden erkannt und vollständig geprüft angewendet, einmalig live geprüft, siehe `docs/reviews/V31a-antwort-3.md`), Abgleichstand aus `quellen` unten in der Akte.

**XCeed.** Ergebnis mit Quellen in `docs/XCEED-SCHNITTSTELLE.md`: Partner Tickets API mit API-Schlüssel (Events, Tickets, Buchungen), keine Webhooks in der Doku, keine geplanten Mailberichte dokumentiert. Falls XCeed Berichte per Mail schickt: an `alex+xceed@wildemoehre.org`, nicht an die Einwurf-Adresse.

### Abnahme V31 (Stand 03.10.2026)

1. `pruefung/abnahme.sh`: alle Prüfungen bestanden, `vorhaben.html` in den Schirmen (Woche, Board mit Akte, Liste mit Verlauf; 1440 und 390, dunkel und hell), 84 Bilder, 0 Meldungen.
2. `node pruefung/vorhaben-probe.mjs` gegen das echte Backend: 97 von 97; am Ende archiviert und dann gelöscht: kein Testvorhaben, keine Testabwesenheit, kein Probe-Einwurf, kein Probe-Ticker (Abfrage am 03.10.2026).
3. Live-Durchspiel über die Oberfläche (Seiten lokal ausgeliefert, Edge Function v38 und Datenbank echt, nichts abgefangen), als Alex und als Lea: Woche, Board, Liste umgeschaltet; XCeed-Akte geöffnet; Punkt „Bürgschaftstext auf Deutsch“ abgehakt und zurück (in der Datenbank geprüft); Ball von Lea an Alex und als Lea zurück; Einwurf „Telefonat mit Victor: Auszahlung ab Monat 1 schriftlich bis Montag“ erkannt als XCeed mit Punkt „Auszahlung ab Monat 1 schriftlich“ und übernommen am Testvorhaben (damit keine unbestätigte Zusage in die echte Akte geht); Feierabend-Übergabe von Lea an Alex für zwei Testvorhaben mit Notiz (echte Bälle bei Lea blieben 7); Testabwesenheit (`test: true`) über den Dialog angelegt, die Vorhaben-Zeile auf der Übergabeseite auf grün mit Vertretung Alexander Dettke gesetzt (Ball bei Alex, an die Abwesenheit gebunden), Rückübergabe auf der Rückkehrseite bestätigt, Ball zurück bei Lea. Danach in XCeed die acht Einträge des Hin und Zurück verworfen und `ball_seit` zurückgesetzt; Ball, Punkte und Stand wie vorher. Offen aus Punkt 3: der Einwurf in der echten XCeed-Akte (wartet auf Alex' Bestätigung der Zusage) und das Durchspiel am ausgelieferten Live-Stand und am Handy nach dem Push. Was offen bleibt, steht in `docs/BEKANNTE-MAENGEL.md`, Abschnitt V31.
4. Codex: 31a, 31b, 31c, 31d, 31e je drei Runden und die Gesamtprüfung in `docs/reviews/`, jeder Befund mit Antwort (`V31*-antwort-*.md`, zuletzt `V31-antwort-schluss.md`); Lernlog `docs/reviews/V31-lernlog.md`.
5. README, Technikstand, `ARBEITSSTAND.md`, Assets `?v=30`, Edge Function v38 deployt, `ping` meldet 38.

## V32 (05.10.2026) · Organisation: Entscheidungen, Teamaufbau, Tore

Auftrag aus Cowork (Alex, 05.10.2026): die Organisationsarchitektur der Wilden Habitate (Claude-Dokument „Wilde Habitate · Organisationsarchitektur“, Begriffe Formatpartner, Operations Partner, Hauspartner und der Weg Ursprung bis Verankerung) als Entscheidungsgrundlage für Alex und Lea und als Leas Fahrplan für den Teamaufbau. Variante gewählt nach drei Entwürfen im Claude-Design-Canvas „Hohes Haus · Organisation“. Branch `paket/v32-organisation`.

**Backend.** Migration `supabase/migrations/20261005053521_hh_organisation_v32.sql`, angewendet am 05.10.2026 über den Supabase-Connector (`apply_migration`, gleiche Kennung in `supabase_migrations.schema_migrations`):
- Tabellen `gfweekly_org_entscheidung` (acht Zeilen, Wahl, Freigabe und Zeitpunkt je Person, Begründung, `freigegeben_am`, `log_decision_id`, `rev`), `gfweekly_org_rolle` (Schritt 0 bis 6, Leitung, Stellvertretung, `rev`), `gfweekly_org_tor` (Schlüssel `<Stufe>-<Nr>`), `gfweekly_org_log`. RLS an, keine Policies, Rechte für anon und authenticated entzogen.
- `hh_org_wahl(id, wahl, by, expect_rev)`: setzt die Wahl und beide Freigaben zurück; nach einer vollständigen Freigabe nur, wenn erst eine Freigabe zurückgenommen wurde (PT409). `hh_org_freigabe(id, who, on, expect_wahl)`: Freigabe nur für die gesehene Wahl (sonst PT409), setzt `freigegeben_am`, wenn beide frei sind, und meldet `neu_freigegeben` genau einmal; Rücknahme löscht `freigegeben_am`. Beide schreiben ins Log.
- Edge Function `organisation` v1 (eigene kleine Funktion wie `saison`, Auth über `GFWEEKLY_PASSWORD`, `verify_jwt` aus): `ping`, `get`, `wahl`, `freigabe`, `begruendung`, `log_verknuepfen` (einmalig), `rolle` (Schritt über 0 nur, wenn alle Entscheidungen der Rolle freigegeben sind; `expect_rev`, sonst 409), `tor`. Schreibende Aktionen nur mit `who` Alex oder Lea. Die Abhängigkeiten der Rollen (`DEP`) sind aus der Seite gespiegelt.

**Seite `site/organisation.html`.** Navigation „Arbeiten“, Eintrag „Organisation“ mit neuem Linien-Icon `haus` und Zähler `orgBadge` (offene Züge der aktiven Person). Assets `?v=31`.
- Kopf mit Lagezeile, Bildleiste Lichtung, Lagerplatz, Dorf, Festival, Habitat (`assets/game/habitat-*.webp`): das Bild zeigt die erreichte Stufe (Tor 1 bis 4); die übrigen lassen sich ansehen. Die Bilder sind dieselben wie die Habitat-Stufen der Taler; hier stehen sie für die Tore.
- „Dein Zug“: je nach „als Alex/Lea“ die offenen Wahlen und fehlenden eigenen Freigaben, bei Lea dazu der nächste Schritt jeder startklaren Rolle, nach Frist. Knopf „Nächster Zug“ öffnet den dringendsten.
- Acht Entscheidungen als Kacheln mit Status und Freigabe-Avataren. Akte rechts (unter 1180 px oben): Möglichkeiten, Begründung (speichert beim Verlassen), Freigabe nur für die aktive Person. Geben beide frei, schreibt die Seite einen Eintrag ins Entscheidungslog (`decision_add`, Strang `habitate`, Taler wie jede Entscheidung) und vermerkt ihn über `log_verknuepfen`.
- Rollen (19, Haus, Operations, Formate) mit Leitung, Stellvertretung und sechs Schritten (Formatrollen nach dem Weg: Ideengeber, Phase und Nutzungslizenz, Formatpartner, Vertrag, Stellvertretung, Briefing). Ansicht „Stufen und Tore“ (Rollen je Aufbaustufe, Tore abhakbar) oder „Zeitachse“ (Q4 2026 bis Q4 2028, gestrichelt = wartet auf Entscheidung, gelber Rand = Pflichtrolle für Tor 1). Filter Alle, Pflichtrollen, Startklar, Wartet (`gf_og_view`, `gf_og_filter`), Akte im Link (`?d=4`, `?r=prod`).
- Termine „besetzt bis“ und die Zuordnung der Rollen zu Stufen sind Vorschläge aus Cowork, keine Beschlüsse.

**Geprüft.** Datenbankfunktionen am 05.10.2026 in einer Transaktion mit Rücksetzung: Wahl, Freigabe Lea, Freigabe Alex (`neu_freigegeben` true), Freigabe mit falscher Wahl (PT409), neue Wahl nach Freigabe (PT409), Rücknahme (`freigegeben_am` leer). Edge Function: falsches Passwort 401. `pruefung/schirme.mjs` mit `organisation.html` (Kern `#ogDecs`, Testdaten `get` in `testdaten.mjs`, Navigation jetzt 17 Einträge): 88 Bilder, 0 Meldungen. `bedienung.mjs`: alle Proben in Ordnung. Farbscan, Kontrast, Matrix: in Ordnung. Wächter ohne Frische: keine Befunde. Ablauf Wahl, Begründung, Freigabe beider, Logeintrag, Schritte und Namen zusätzlich mit abgefangener Edge Function durchgespielt.

**Nachschärfung (05.10.2026, zweiter Commit).** Wartende Rollen stehen als kompakte Zeilen („E 5, 8“ = wartet auf Entscheidung 5 und 8), volle Karten nur für startklare und laufende Rollen; Rollen je Stufe nach Ebene gruppiert. „Dein Zug“ zeigt drei Einträge und nennt den Rest. Neuer Abschnitt „Zuletzt im Haus“ (letzte zehn Einträge aus `gfweekly_org_log` als Sätze), dazu ein Kurzverlauf in jeder Akte; nach eigenen Schreibaktionen wird der Verlauf lokal nachgezogen, bis `get` neu lädt. Bildleiste mit Zahlen (Entscheidungen, Tore, Pflichtrollen). Tor 1 nennt die besetzten Pflichtrollen und den Satz, dass Tore nach Nachweisen gelten. Schritte nur noch der Reihe nach abhakbar. Schirme danach: 88 Bilder, 0 Meldungen; Bedienung, Farbscan, Kontrast, Wächter ohne Befund.

**Offen und Grenzen.** `tokens.py` lief nicht (die Quelle des Design-Systems liegt nur auf dem Mac); `styles.css` ist unverändert. Deshalb ist `pruefung/letzte-abnahme.json` nicht erneuert: die nächste Abnahme auf dem Mac (`pruefung/abnahme.sh`) schreibt den Beleg. Die Wirkung der Edge Function gegen das echte Backend mit Passwort ist nicht geprobt (kein Passwort in Cowork); eine Probe wie `vorhaben-probe.mjs` fehlt noch. Freigaben hängen am gemeinsamen Passwort und an „als Alex/Lea“, sie sind kein persönlicher Nachweis.

## V32 Kommunikation (07.10.2026) · Postingplan-Standard für alle fünf Festivals

Auftrag: `docs/PAKET-V32-KOMMUNIKATION.md` (Freigabe Alex 05.10.2026, Durchlauf 06.10.2026), Startprompt `docs/STARTPROMPT-V32.md`, Branch `paket/v32-kommunikation`. Nicht zu verwechseln mit „V32 Organisation“ vom 05.10.2026 (`organisation.html`, eigene Edge Function `organisation`), das parallel lief; dieses Paket heißt deshalb „V32 Kommunikation“, Assets gehen auf `?v=32`, `gfweekly` meldet `version: 39`.

### 32a · Datenbasis und Rechenlogik

**Rechenlogik** `site/assets/komm-logik.js` (Browser, node, Deno; Kopie `supabase/functions/gfweekly/komm-logik.js`, byte-gleich, Regelwerk-Kopie `supabase/functions/gfweekly/komm-regelwerk.json`): Port des Referenz-Rechners mit Ereignissen, Regeln mit Bedingungen, Zusammenführen L/V, Slots aus der Themenbibliothek, Prüfpunkten, begleitenden Website-Updates, Schritten rückwärts, Werktagsregel mit Feiertagen, Verbund-Stichtag mit Vorproduktionsfenster (Rundung wie Python, bei .5 zur geraden Zahl), Überfälligkeit, Wochenaufgaben und Wochenlast; dazu Asana-Rahmen (32c), Fixtermine (32d), Partner-Slots und Tick (32e). Termine kommen aus `vvp_events` über `launchFestivals()`, Merkmale aus dem Regelwerk (Zuordnung `LUSRD27 → lus`, `FAMRD27 → dbd`, `BYNRD27 → bn`, `WMRD27 → wm`, `FLRD27 → flu`). Annahmen wie im Referenz-Rechner: Anzeigenbudget freigegeben, Testkauf erfolgreich, kein Black-Friday-Angebot, Launch gleich Vorverkauf, keine Preiswechsel-, Buchungs- und Bewerbungsfristen.
- **Bewusste Abweichung:** Redaktionsslots werden ab V gezählt, nicht ab `max(heute, V)`. Sonst wanderten Kennung, Termin und Thema eines Slots täglich (Rechenregel 10 verlangt stabile Kennungen; ein Partner würde seinen Slot verlieren). Mit `{ referenz: true }` rechnet die Funktion exakt wie Python. Für Lusatia sind beide Wege gleich, weil V nach dem 05.10.2026 liegt.
- **Pflicht** heißt: jede Regel des Mindeststandards außer SLOT. **Partnerfähig:** Regel mit `partnerfaehig`, Slots nur mit Thema aus `partnerfaehig_themen`. **Vorläufig:** Veröffentlichungen mit Bezug F, Z, R oder P bei Festivals mit offenem Termin im Regelwerk (`pruefen`: Draußenbande, Wilde Möhre).
- Wochenaufgaben (Stories, Kommentare, Redaktionsrunde) stehen nicht in `komm_veroeffentlichungen`; sie gehen nur in die Wochenlast ein und werden dafür jeweils frisch gerechnet.

**Test** `pruefung/komm-test.mjs` (57 Proben): Lusatia mit Stichtag 05.10.2026 gegen `beispiel-lus-2027-aufgaben.csv` Zeile für Zeile, im Referenz- und im Betriebsmodus (105 Hauptaufgaben einschließlich 3 Wochenaufgaben, 776 Schritte, 14 überfällig, 0 Freigaben am Wochenende); Werktagsregel an Pfingstmontag, Tag der Deutschen Einheit, Karfreitag; Timetable Lusatia (09.07.2027) vorgezogen auf den 15.06.2027 mit E9; Slots partnerfähig nur mit Thema aus der Liste; stabile Kennungen zwischen zwei Rechentagen; Asana-Rahmen; Fixtermine; Partner-Slots und Tick; Byte-Gleichheit der Kopien. Außerhalb des Repos am 07.10.2026 zusätzlich alle fünf Festivals des Regelwerks gegen den Python-Rechner verglichen (je Festival eine CSV aus `referenz-rechner.py`): 0 Abweichungen.

**Erwartete Wirkung mit den Plattformterminen** (gerechnet am 07.10.2026, vor dem Einspielen):

| Festival | V laut Plattform | V laut Regelwerk | Veröffentlichungen | Referenz | Abweichung | Stunden | überfällige Schritte |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Lusatia | 15.10.2026 | 15.10.2026 | 102 | 102 | 0 % | 528 | 21 |
| Draußenbande | 01.10.2026 | 10.10.2026 | 94 | 102 | −8 % | 491 | 0 |
| by nature | 01.11.2026 | 01.11.2026 | 101 | 101 | 0 % | 525 | 2 |
| Wilde Möhre | 01.09.2026 | 01.09.2026 | 96 | 95 | +1 % | 504 | 6 |
| Fluidity | 25.10.2026 | 01.08.2026 | 105 | 96 | +9 % | 542 | 3 |

Keine Abweichung über 10 Prozent. Draußenbande: der Vorverkauf lief laut Plattform schon am 01.10., die V-Regeln liegen in der Vergangenheit und werden nicht nachgeholt. Fluidity: die Plattform nennt den 25.10.2026 statt des 01.08.2026 im Regelwerk, alle V-Regeln (Ankündigung, Shop, Erinnerung, Start, Newsletter) liegen deshalb in der Zukunft.

**Migration** `supabase/migrations/20261007052131_hh_komm_v32a.sql`: `komm_regelwerk` (eine aktive Zeile, eindeutiger Teilindex), `komm_veroeffentlichungen` (Felder laut Paket, dazu `nr`, `t_neu` für den neuen Termin einer schon gesendeten Veröffentlichung, `hinweis`, Prüfungen der Status- und Freigabewerte), `komm_schritte` (Schlüssel Veröffentlichung und Schritt, löscht mit), `komm_pruefpunkte` (Schlüssel Festival und Datum, Extras nur E01 bis E15), `komm_log` (`what`, `detail`, `"by"`, `at`). Feldhoheit im Kopf der Migration. RLS an, keine Policies, `anon` und `authenticated` ohne Rechte. `hh_komm_einspielen(festival, event_id, pubs, heute)` spielt eine Berechnung in einer Transaktion ein, je Festival per Advisory-Lock gesperrt: neu anlegen; gesendete oder von Partnern übernommene Veröffentlichungen nie still ändern, sondern bei verschobenem T `t_neu` und `zu_pruefen` setzen; sonst Plan, Briefing und Schritte ersetzen; was die Rechnung ab heute nicht mehr kennt, wird gelöscht (ungesendet) oder `zu_pruefen`. Partner- und Freigabefelder schreibt die Funktion nie. Eine leere Liste bricht ab.

**Edge Function** `gfweekly` v39, Aktionen im Modul `supabase/functions/gfweekly/komm.ts`: `komm_list`, `komm_berechnen {festival|alle}`, `komm_pruefpunkt_set`, dazu für 32c bis 32e `komm_send`, `komm_test_aufraeumen`, `komm_tabelle_sync`, `komm_slots_offen`, `komm_slot_details`, `komm_ueberlast`. Das Regelwerk wird beim ersten Lauf aus der Datei in `komm_regelwerk` eingespielt; eine neue Fassung in der Funktion wird beim nächsten Lauf aktiv. `deno check` (Deno 2.9.6 über npm): `komm.ts` ohne Fehler, `index.ts` mit denselben 12 Altfehlern im Launch-Code wie vor V32.

**Stand des Einspielens.** Migration, Deploy und Wirkungsprobe stehen aus: Das Einspielen in die Produktionsdatenbank wurde am 07.10.2026 in dieser Sitzung vom Berechtigungsmodus angehalten und braucht eine ausdrückliche Freigabe in der Sitzung.
