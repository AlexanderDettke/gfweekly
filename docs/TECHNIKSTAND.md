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
4. Die dritte Textstufe steht nicht mehr auf der zweiten Fläche (dort 4,19:1 im Dunkeln): Ticker-Zeit und -Strang,
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
`handover_log`, `uebernahme_stat`, `absence_tick`. Bestätigte Korbzeilen überschreibt der Lauf nie, er ergänzt nur
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
Niemand steht als eigene Vertretung zur Wahl.

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
es entstehen nie halbe Projekte.

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
- Oberfläche: „Nach Asana“ steht als Primärknopf im Kopf der Übergabe, sobald es bestätigte Zeilen gibt;
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

**Bewusste Abweichungen in V24c:** Das Asana-Team wird nicht aus bestehenden GF-Projekten ermittelt, sondern kommt
aus `ASANA_TEAM` oder aus der Nutzlast; ohne Token lässt sich kein Projekt lesen, aus dem es abzuleiten wäre.
Die Vollmacht im Aufgabentext folgt derselben Bereichsregel wie die Vertretung (Strang, dann `gf`, dann `*`).
Fehlt zu einer Person die `asana_gid`, bleibt die Aufgabe ohne Zuweisung, und die Antwort nennt die Namen.

**Offen bis zur Freigabe:** `ASANA_TOKEN` fehlt, deshalb ist die Abnahme aus 4c (Testprojekt anlegen, eine Aufgabe
in Asana erledigen, Rücksync prüfen, Projekt löschen) noch nicht gelaufen. Ebenso steht der Eintrag von Abschnitt H
in den täglichen Auftrag aus; der Text oben ist dafür fertig.


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
- **Keine Datenbanktransaktion** für `handover_zurueck`: supabase-js kann keine Transaktion über mehrere Tabellen.
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

**7.2 Der Korb sagt, wenn er unvollständig ist.** Die Obergrenze bleibt bei 2000 Zeilen je Quelle. `handoverBuild`
merkt sich, welche Quelle an die Grenze gestoßen ist, und schreibt das nach `gfweekly_absences.korb_truncated`
und `.korb_abgeschnitten`. Die Übergabeseite blendet dann einen Hinweis über dem Korb ein. Solange die Spalte
`false` ist, ist der Korb vollständig.

**7.3 Asana-Kennungen über die E-Mail.** `asana_export` holt einmal je Lauf `GET /users?workspace=…&opt_fields=email,name`,
ordnet fehlende Kennungen über die E-Mail zu und schreibt sie nach `gfweekly_people.asana_gid`. Fünf Startwerte
stehen als Seed in der Migration (Alex, Lea, Amelie, Antonia, Helge); Jessica bleibt offen, weil im Workspace zwei
Konten stehen und die Zuordnung eine Entscheidung ist. Wer kein Asana-Konto hat, erscheint in der Antwort unter
`ohne_zuweisung`, und die Aufgabe geht ohne Zuweisung ins Projekt.

**7.4 Lückenfilter im Board.** `board.html?owner=<Name>&luecke=1` filtert wirklich: `owner` trifft die Verantwortung,
den Ausgang der Person oder ihre Vertretung, `luecke` zeigt nur Themen ohne Stand oder ohne nächsten Schritt.
Beide Schalter stehen als Haken in der Board-Leiste und lassen sich einzeln abschalten. Die Kachel
„Übernahmefähigkeit“ auf der Vertretungsseite verlinkt genau dorthin und nennt die Zahlen, die sie zählt.

**Prüfung.** `pruefung/testdaten.mjs` merkt sich jetzt, was geschrieben wurde: eine bestätigte Zeile kommt beim
nächsten Lesen als bestätigt zurück, eine neu angelegte Abwesenheit taucht in der Liste auf. `zuruecksetzen()`
stellt vor jedem Fall den Saatstand her. Dadurch prüft die Bedienprüfung nicht mehr nur die abgeschickte Nutzlast,
sondern auch die Wirkung: die bestätigte Zeile verlässt die Ansicht, das Anlegen leitet zur neuen Übergabe weiter,
die Rücknahme räumt die Zeile aus „wartet auf dich“. Dazu zwei neue Fälle für den Lückenfilter und den Hinweis auf
einen unvollständigen Korb.

**Offen bleibt** (aus derselben Review, nicht Teil dieser Runde): echte Pagination statt Obergrenzen, und der
Nachweis, dass Tick, Cron, Vault und Asana live tun, was sie sollen. Das ist die Live-Abnahme nach dem Deploy.
