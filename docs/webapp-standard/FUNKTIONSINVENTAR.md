# Funktionsinventar · Webapp Standard (Pilot zur Erprobung)

Erhebung vom 21.10.2026 für den Webapp Standard `WEBAPP-PILOT-0.2` (P-02). Grundlage der Erhebung: Git-Stand `bbca119` (Paket Kompass, Ausgangsstand vor dem Pilot), gelesen am Quelltext mit Datei und Zeile; ergänzt um das danach auf `main` gelandete Paket „Vorhaben abschließen“ (`05af97b`, Abschnitt 3.2a). „Belegt“ heißt: im Code nachweisbar, nicht im Betrieb beobachtet. Zeilenangaben beziehen sich auf diesen Ausgangsstand und können sich durch den Pilot um einige Zeilen verschoben haben.

Abschnitt 0 nennt jede Fähigkeit, die der Pilot verändert hat, mit neuer Umsetzung, Regel und Nachweis. Alle übrigen Fähigkeiten der Abschnitte 1 bis 3 bleiben unverändert erhalten; Nachweis dafür sind die vor und nach dem Umbau grünen bestehenden Prüfungen (`pruefung/schirme.mjs`, `pruefung/bedienung.mjs`, `pruefung/organisation-entscheidungsfuehrung.mjs`, `pruefung/komm-bedienung.mjs`, `pruefung/launch-test.mjs`) und `PRUEFMATRIX.md`, T-01.

## 0. Vom Pilot veränderte Fähigkeiten

| Kennung | Bisherige Fähigkeit und Auslöser | Verborgener Zugang | Neue Umsetzung | Regel | Nachweis |
| --- | --- | --- | --- | --- | --- |
| W-01 | Anmeldung mit Passwort, danach Seitenaufbau (alle Seiten, `gfGate`) | Fehler beim Aufbau landeten in der verdeckten Torzeile und löschten das Passwort | Prüfung und Aufbau getrennt; Ladefehler sichtbar auf der Seite mit „Erneut laden“; nur 401 führt zurück zum Tor; sichtbare Bezeichnung „Passwort“, Meldung mit `role="alert"` | B-07, B-03 | Proben 8, 9 |
| W-02 | Ladefehler einzelner Bereiche (Board, Entscheidungen, Neuigkeiten, Check-in, Seiten, Jahr, Saison) | „lädt …“ blieb im Kopf oder Nachbarbereich stehen | `gfLadefehler` mit Ursache, Folgehinweis und „Erneut laden“, Nachbarbereiche „Nicht geladen“ | B-07 | Ladefehlerprobe 4 von 4 |
| W-03 | Letzte Besprechung (Besprechung) | Ladefehler wurde als „Noch keine Besprechung protokolliert“ gezeigt | Fehler und leer getrennt | B-07 | Codeprüfung |
| W-04 | Kurzmeldung `gfToast` (alle Seiten) | Fehler 2,6 s, nicht angesagt | Statusmeldung, Fehler hervorgehoben und 7 s | P-04, B-07 | Dialogprobe Toast |
| W-05 | Kopieren (Protokoll, Wochenmail, Delegation) | Meldete immer Erfolg | Erfolg nur nach tatsächlichem Kopieren, sonst Hinweis | B-04 | Dialogprobe Kopieren |
| W-06 | Text- und Neuigkeitsdialog (`gfTextModal`, `gfNewsModal`) | Escape fehlte teils, kein Anfangsfokus, Hintergrund bedienbar | Modal mit Anfangsfokus, Escape, Fokusrückgabe; Schließen benannt | B-08 | Dialogproben |
| W-07 | Abwesenheit anlegen (Vertretung) | Kein Escape, kein Fokus; „heute“ in UTC | Modal wie W-06; Kalendertag in Ortszeit; Felder bezeichnet | B-08, D-03 | Codeprüfung, Schirme |
| W-08 | Detailbereich Thema (Board) und Element (Saison-Rad) | Kein Name, kein Fokus beim Öffnen, keine Rückgabe | Name aus der Überschrift, Fokus beim Öffnen, Rückgabe zur Karte | B-08, P-04 | Probe 7 |
| W-09 | Verschieben auf dem Board (⇄ und Ziehen) | Reihenfolge nur per Ziehen; Enter auf ⇄ öffnete auch die Details; Menü ohne Escape | Menü mit Zielspalte, „Ganz nach oben“, „Eine Stelle nach oben/unten“ (sichtbare Karten), Fokus, Escape mit Rückgabe; Enter auf ⇄ öffnet nur das Menü | B-02, B-05, B-08 | Proben 4 bis 6 |
| W-10 | Liste: Aufklappen, Priorität reihum, „als nächstes“ (Liste) | Nur Zeiger, Priorität nur per Klick mit Hinweis im `title` | „Details“ als Knopf mit Zustand, Priorität und Karten per Tastatur mit sprechendem Namen | B-08, G-04 | Messung Zeigerziele 0 |
| W-11 | Aufklapper der Bearbeitungskarten (Bearbeiten) | Nur Zeiger | Tastatur mit Zustand | B-08 | Messung |
| W-12 | Thema löschen, Link entfernen (Bearbeiten), Punkt löschen (Vorhaben) | Rückfrage ohne Gegenstand; Link mit „✕“ ohne Rückfrage; Punkt ohne Rückfrage | Gegenstand und Folge benannt; Link „Entfernen“ mit Ziel im Namen (bewusst ohne Rückfrage, schnell wieder anlegbar); Punkt mit Rückfrage, die die Serverregel nennt | B-06, G-04 | Codeprüfung |
| W-13 | Eingabe (Eingabe) | Leeres Senden fokussierte nur; Doppelklick konnte zwei Themen anlegen; Fehler 2,6 s | Fehler am Feld, Sperre während des Sendens, Fehler bleibt am Knopf, Eingaben bleiben; Chips mit Zustand; „Mehr Details“ mit Zustand | B-03, B-04, P-04 | Proben 1 bis 3 |
| W-14 | Suchfelder (Board, Liste, Entscheidungen, Seiten), Felder ohne Bezeichnung (Inbox, Übergabe, Vertretung, Bearbeiten, Stepper überall) | Nur Platzhalter | Bezeichnungen, zentrale Label-Verknüpfung, Stepper-Feld benannt | B-03, D-05 | Messung 0 |
| W-15 | Kalendertag (Board, Entscheidungen, Check-in), „eilt“ (Organisation) | Vortag in Berlin; festes Datum 05.10.2026 | Ortszeit (`gfIsoTag`), „eilt“ ab heute | D-03 | Codeprüfung |
| W-16 | Saison-Rad: Segmente und Zeilen im SVG | Nur Maus | Tastatur, Fokus zeigt die Info wie das Darüberfahren | B-08 | Codeprüfung |
| W-17 | Asana senden (Launch) | Rückfrage ohne Anzahl | Rückfrage nennt Festival und Anzahl aus dem Knopf | B-06 | Codeprüfung |
| W-18 | Skript-Scrollen (Organisation, Besprechung, Neuigkeiten, Liste) | Weich trotz „Bewegung reduzieren“ | Springt sofort, wenn reduzierte Bewegung gewünscht ist | G-06 | Messung |
| W-19 | Darstellung aller Seiten | Schrift unter 12 px, Ziele unter 44 px, Überlauf bei 320 px und 200 %, gedämpfte erledigte Karten und Abzeichen | Rollen 12/14 px, 44-px-Ziele, Umbruch, Kontrast ohne Deckkraft | G-01 bis G-05 | Messung, Schirme |
| W-21 | Besprechung beenden (Besprechung, Board) | Bei Speicherfehler trotzdem beendet und „Gespeichert unter …“ angezeigt | Besprechung bleibt offen, Text zur Sicherung im Dialog, erneutes Beenden möglich (Server aktualisiert dieselbe Sitzung) | B-04, B-07 | Codeprüfung |
| W-22 | Saison-Rad: Bereich schließen mit ungespeicherten Änderungen | Schloss sofort, Fehler im geschlossenen Bereich, Eingaben weg | Erst speichern, bei Fehler bleibt der Bereich mit Eingaben offen | B-04 | Codeprüfung |
| W-23 | Liste: „heute besprochen“, Status, Priorität, Delegation | Erfolgsmeldung vor der Antwort; Fehler ohne Ursache | Erfolg erst nach Antwort, Fehler mit Ursache, Ansicht zeigt wieder den gespeicherten Stand | B-04 | Probe 11 |
| W-24 | Spielkarten (Abzeichen, Stufe) | Schlossen nach 7 bis 9 s selbst, auch bei reduzierter Bewegung; Escape-Listener blieb nach Klick; kein Fokus | Anfangsfokus auf „Weiter“; während des Tippens in einem Feld bleibt der Fokus dort und eine Statusmeldung kündigt die Karte an („Escape schließt sie“); kein Selbstschließen bei reduzierter Bewegung oder Fokus in der Karte, Listener entfernt, Fokus zurück | G-06, B-08 | Codeprüfung |
| W-25 | Board: anderes Thema öffnen, während das offene einen ungespeicherten Entwurf hat | Wechsel ohne Abwarten; bei Speicherfehler war der Entwurf weg | Wechsel erst nach bestätigtem Speichern, sonst bleibt der Entwurf offen | B-04 | Probe 14 |
| W-26 | Board: „Rückgängig“ nach dem Verschieben | Knopf in der Kurzmeldung mit der Maus nicht anklickbar (`pointer-events:none`); Fehler der Rücknahme wurde verschluckt | Anklickbar, 44 px; Rücknahme gilt erst nach Antwort, bei Fehler Serverstand und „Erneut versuchen“ | B-04, G-03 | Probe 13 |
| W-27 | Eingabe: „Noch einen Gedanken erfassen“ | Abgewählte Chips meldeten weiter „gedrückt“ | Zustand zurückgesetzt | B-08 | Codeprüfung |
| W-28 | Alle Schreibaktionen über `gfApi` | Antwort 200 ohne lesbaren Inhalt wurde als leerer Erfolg behandelt (Eingabe zeigte „Erfasst!“) | Gilt als unklar: Fehler mit Aufforderung, den Stand zu prüfen, Eingaben bleiben | B-04 | Probe 15 |
| W-29 | Saison-Rad: Autospeichern während weiterer Eingabe | Ältere Antwort setzte „gespeichert“, jüngere Eingabe ging beim Schließen verloren; Anfragen liefen parallel | Speichern nacheinander mit Änderungsrevision; „gespeichert“ nur für die jüngste Eingabe | B-04 | Probe 17 |
| W-30 | Kalendertag „heute“ | Gerätezeitzone | Europe/Berlin, auch bei anderer Gerätezeitzone | D-03 | Probe 16 |
| W-20 | Navigation | Kein Sprunglink, Dunkel/Hell und Person ohne Zustand für Vorlesesoftware | „Zum Inhalt springen“, `aria-pressed`, Fokus zurück zum Menüknopf beim Schließen der Schublade | B-01, B-08 | Messung Tastatur |
| S1-01 | Entscheidungslog, Besprechungen, Abzeichen, Wochenmail (`entscheidungen.html`, bisher unter Themen) | Abzeichen nur mit Spielschicht | Seite ist die Entscheidungsliste der GF (Gruppe Heute): Kacheln, Abschnitte nach Fristzustand, je Zeile Entschieden, Vertagen, Abgeben, Aufklappen mit Quelle und Stift, Rückgängig 10 s; Beschlüsse, Protokolle, Wochenmail als Klappe; Abzeichen entfallen (`GF_SPIEL=false`) | P-01, B-04, B-08, G-03 | Bedienproben „Stufe 1“ (entscheidungen.html), `pruefung/entscheidungen-probe.mjs` |
| S1-02 | Agenda der Besprechung aus `gate_list` mit Themen-Knöpfen (`besprechung.html`) | Besprechungszustand `gf_besprechung` der alten Form | Agenda aus `entscheidungen_list {status offen}`; Entschieden, Vertagen, Abgeben, Überspringen über die Entscheidungsfunktionen; Material-Klappe nur lesen; alter Zustand wird verworfen (`v:2`) | P-01, B-04 | Bedienproben „Stufe 1“ (besprechung.html) |
| S1-03 | „Deine Entscheidung“ auf Für dich aus `gate_list` (`index.html`) | | aus `entscheidungen_list`, höchstens fünf, „und n weitere“ auf die Liste | P-01 | Bedienprobe |
| S1-04 | Vorhaben: Einträge ohne Vorhaben nur über Akte oder Einwurf zuzuordnen (`vorhaben.html`) | | Abschnitt „Ohne Vorhaben“ (Korb): Zuordnen zum Vorschlag des Laufs oder per Chip, Neues Vorhaben, Verwerfen, Archivieren, „Alle Vorschläge übernehmen“ mit Zähler in der Rückfrage | B-06, B-08 | Bedienproben „Stufe 1“ (vorhaben.html) |
| S1-05 | Spielschicht auf allen Seiten (Taler, Lagerplatz, Flammen, Abzeichen, Habitat-Punkte, Überraschungen, Protokoll zählt) | `?game=`, `?egg=` | Aus über `GF_SPIEL=false` in `core.js`; Check-in bleibt als Gruß ohne Taler; eine Konstante schaltet zurück | P-01 | Bedienprobe (kein game.js, kein `#gameBar`), Schirme ohne Konsolenfehler |
| S1-06 | Schrift auf allen Seiten | | Fließtext 15 px, Titel 16 px, Nebentext 13 px, Kacheln und Seitentitel 22 px, Zeilenhöhe 1,4, Chips 32 px mit 44-px-Ziel, Lesebreite 880 px (Tokens) | G-01, G-03 | Messung `webstandard-pruefung.mjs` (keine Rolle unter 12 px, keine Ziele unter 44 px) |

Hinweis zum Umfang: Im Ordner `site/` liegen **25** HTML-Seiten, nicht 26. Alle 25 sind unten aufgenommen.

`site/assets/komm-logik.js` und `site/assets/launch-logik.js` sind reine Rechenlogik ohne Bedienfläche (kein DOM-, kein Netzzugriff); sie wurden in Kopf und Funktionsübersicht gelesen, aber nicht zeilenweise inventarisiert.

Zeilenangaben ohne Pfad beziehen sich auf `site/`; `core.js` meint `site/assets/core.js`, `EF` meint `supabase/functions/gfweekly/index.ts`.

---

## 1. Rollen und Zugang

### 1.1 Anmeldung (Passwort-Gate)

- Jede der 25 Seiten trägt ein eigenes Gate-Markup `<div id="gate">` mit Passwortfeld `#pw`, Knopf `#unlock` und Fehlerzeile `#gateErr` (z. B. `index.html:22–30`) und ruft `gfGate(onReady)` aus `core.js:121–131` auf.
- Ablauf: Das eingegebene Passwort wird **vor** der Prüfung in `sessionStorage.gf_pw` abgelegt (`core.js:124`), dann mit `gfApi("people_list")` gegen die Edge Function geprüft (`core.js:125`). Bei Erfolg wird das Gate ausgeblendet und `onReady()` baut die Seite. Bei Fehler: „Falsches Passwort.“ (HTTP 401) oder „Fehler: <Meldung>“, das Passwort wird wieder gelöscht (`core.js:126`).
- Enter im Passwortfeld löst den Knopf aus (`core.js:129`). Liegt schon ein Passwort in der Sitzung, wird automatisch erneut geprüft (`core.js:130`).
- Gültigkeit: `sessionStorage` gilt je Browser-Tab. Ein neuer Tab oder ein Neustart verlangt das Passwort erneut. Es gibt kein Abmelden-Element.
- Das Passwortfeld hat nur einen Platzhalter „Passwort“, kein `<label>` (`index.html:28`); `#gateErr` hat weder `role="alert"` noch `aria-live` (`index.html:30`).
- Übertragung: `gfApi` sendet `{action, password, payload}` als JSON per POST an die Edge Function `gfweekly`, bewusst ohne `apikey`/`Authorization`-Header (`core.js:6–8, 22–29`). Die Nebenfunktionen (`arbeiten`, `besetzung`, `organisation`, `saison`, dazu `tpa` für die Team-Analyse, `core.js:524–530`) prüfen dasselbe gemeinsame Passwort aus dem Secret (z. B. `supabase/functions/arbeiten/index.ts:59`, `organisation/index.ts:48`).
- Server: `if (!PASSWORD || given !== PASSWORD) return 401` (EF:1374–1375). Ein einziges gemeinsames Passwort für alle Nutzenden; es gibt keine Konten.
- Reaktion auf späteres 401: `gfApi` wirft `{auth:true}` (`core.js:26`). Ob eine Seite dann zum Gate zurückkehrt, ist seitenabhängig (z. B. `arbeiten.html:340` löscht das Passwort und lädt neu); siehe Seitentabellen.

### 1.2 Person (Alex/Lea)

- Die „Person“ ist **keine Anmeldung**, sondern eine Auswahl in der Seitenleiste: Gruppe „als Alex | Lea“ (`#whoSw`, `core.js:206`). Gespeichert in `sessionStorage.gf_who` (`core.js:18`). Standard ist „Alex“, wenn nichts gewählt wurde (`core.js:14`); jeder andere Wert wird beim Aufbau der Kopfzeile auf Alex zurückgesetzt (`core.js:215`).
- Ein Wechsel feuert das Ereignis `gf-who` (`core.js:217`); Seiten und `game.js:136` (neues Einchecken) reagieren darauf.
- `game.js:30–40` umwickelt `gfApi` global und hängt an **jeden** Aufruf `who` (aktuelle Person) und `local_day` an, sofern nicht gesetzt. Damit kennt der Server bei jedem Aufruf eine behauptete Person.
- URL-Parameter `?person=alex|lea`: nur auf `arbeiten.html` ausgewertet (`arbeiten.html:1064–1067`), setzt die Person wie die Kopfzeilenauswahl und öffnet den Wegweiser; der Code nennt das ausdrücklich „keine Sicherheitsfunktion“. `board.html:89` liest `?owner=` bzw. `?person=` als **Filter** nach Person, nicht als Identität.
- Normalisierung: Browser `gfWhoNorm` (`core.js:17`) und Server `whoNorm` (EF:177) bilden jeden Text mit „lea“ auf Lea, mit „alex“ auf Alex, sonst „Team“ ab.

### 1.3 Rechteunterschiede und wo sie geprüft werden

Es gibt technisch **eine** Rolle (wer das Passwort kennt). Unterschiede zwischen Alex, Lea und „anderen“ entstehen nur über die mitgeschickte, frei wählbare Person:

| Bereich | Regel | Prüfung Browser | Prüfung Server |
|---|---|---|---|
| Vorhaben, Punkte, Verlauf, Einwurf (gfweekly `vorhaben_*`, `punkt_*`, `verlauf_*`, `einwurf_*`) | Schreiben nur mit `by` = Alex oder Lea | Seiten schicken `by: gfWho()` | `vhBy()` wirft 400 „by muss Alex oder Lea sein“ (EF:1110–1116, 16 Aufrufe) |
| Launch bestätigen / senden (`launch_confirm`, `launch_set` mit Status bestätigt, `launch_send`) | „Bestätigen können nur Alex oder Lea“ | Bestätigungsdialog nennt die Person | 403 (EF:2503–2504, 2559–2560) |
| Organisation (`organisation`-Funktion) | Jede schreibende Aktion nur Alex oder Lea; Freigabe einer Entscheidung nur durch Alex, Lea gibt optional Rückmeldung | siehe `organisation.html` | 400 „Nur Alex oder Lea können hier schreiben“ (`organisation/index.ts:52–53`); Freigabelogik laut `docs/TECHNIKSTAND.md:23–27` |
| So arbeiten wir (`arbeiten`-Funktion) | Steckbrief sieht die andere Person erst nach Freigabe; Umfrageantworten der anderen erst, wenn beide abgegeben haben | Ansicht je Person | 400 ohne Person, 409 bei Abgabekonflikten (`arbeiten/index.ts:66, 207, 239, 250`) |
| Besetzung (`besetzung`-Funktion) | Übernehmen, Setzen, Asana-Senden nur mit Person | – | 400 „Bitte oben Alex oder Lea wählen.“ (`besetzung/index.ts:133, 159, 189`) |
| Saison (`saison`-Funktion) | Person wird nur protokolliert, unbekannt erlaubt | – | keine Personenprüfung (`saison/index.ts:35`) |
| Themen, Personen, Links, Seiten, Rituale, Meilensteine, Entscheidungen, Neuigkeiten (übrige gfweekly-Aktionen) | keine Personenregel | – | nur Passwort |

Folge: Die Personenregel schützt vor Versehen, nicht vor Missbrauch. Wer das Passwort kennt, kann sich in der Seitenleiste jede der beiden Personen geben; der Server kann das nicht unterscheiden (so auch `docs/TECHNIKSTAND.md:548`).

Zugangsdaten Dritter: `seiten.html` verwaltet Arbeitsseiten mit Feldern für Benutzername und Passwort (EF:45, `SITE_FIELDS`), die nach dem Gate im Klartext geladen und kopierbar sind (`seiten.html:214`). Es gibt dafür keine zusätzliche Stufe.

---

## 2. Navigation und globale Elemente

### 2.1 Seitenleiste (`core.js:164–233`)

Gebaut von `gfMountTopbar(active)` in jede Seite. Einträge mit Symbol, Beschriftung, `title=`-Kurztext und optionalem Zähler:

| Gruppe | Eintrag (Schlüssel → Datei) | Zähler |
|---|---|---|
| Heute | Für dich (`start` → index.html) · Vorhaben (`vorhaben` → vorhaben.html) · Neuigkeiten (`neuigkeiten` → neuigkeiten.html) · Besprechung (`besprechung` → besprechung.html) | Vorhaben: `vorhaben_badge` (offene Einwürfe plus überfällige Vorhaben bei mir, `core.js:712–718`); Neuigkeiten: Kandidaten mit Status neu (`core.js:229`) |
| Arbeiten | Themen (`themen` → board.html) mit Unternavigation Board (`board.html?view=board`), Kacheln (`board.html?view=kacheln`), Liste (cockpit.html), Entscheidungen (entscheidungen.html) · Jahr · Saison · Kommunikation · Launch · Organisation · Besetzung · So arbeiten wir (arbeiten.html) · Eingabe (capture.html) | Themen: Anzahl „zu besprechen“ (`core.js:232`); Organisation: `orgBadge`, nur befüllt, solange man auf `organisation.html` ist (`organisation.html:391`) |
| Vertretung | Abwesenheiten (vertretung.html) · Übergabe (uebergabe.html) · Rückkehr (rueckkehr.html) | Übergabe: `uebergabeBadge` wird angelegt, aber nirgends befüllt (kein Treffer außerhalb `core.js:167`), bleibt also immer verborgen |
| Verwalten | Wichtige Seiten (seiten.html) · Bearbeiten (bearbeiten.html) · Aufräumen (aufraeumen.html) | – |

19 Haupteinträge plus 4 Unterpunkte. Der aktive Eintrag bekommt `aria-current="page"` (`core.js:211`).

Nicht in der Navigation: `inbox.html` (meldet sich als „themen“ an, keine eingehenden Links gefunden), `checkin.html` (Schlüssel `checkin` existiert nicht in `GF_NAV`, kein Eintrag wird aktiv, keine eingehenden Links), `saison-rad.html` und `saison-steckbriefe.html` (nur im Fußtext von `saison.html:226` bzw. `saison-steckbriefe.html:309` erwähnt, kein `href` auf sie gefunden; sie aktivieren „Saison“). Diese vier Seiten sind nur per Direktadresse erreichbar; `saison-rad.html` schreibt trotzdem voll, einschließlich Löschen.

Fuß der Leiste: Habitat-Taler-Anzeige (von `game.js` eingehängt), Umschalter Dunkel/Hell, Personenwahl Alex/Lea (`core.js:203–209`).

Jede Seite löst beim Aufbau bis zu drei Hintergrundaufrufe für die Zähler aus (`news_list`, `vorhaben_badge`, `list`; `core.js:229–232`). Fehler werden still verschluckt (`.catch(()=>{})`), der Zähler bleibt dann einfach aus.

### 2.2 Layoutmodi und mobile Navigation

- Drei Modi (`core.js:171–175`): `drawer` unter 1024 px Breite (Schublade hinter einer Kopfzeile mit Menüknopf, Titel und Platz für die Steuerung), sonst `open` (ausgeklappt) oder `rail` (schmale Symbolleiste). Ohne gespeicherte Wahl: ab 1280 px `open`, darunter `rail`. Gespeichert in `localStorage.gf_nav`.
- Umschalter `#navToggle` (Chevron, `aria-label` und `title` wechseln „Menü ausklappen/einklappen“, `core.js:180, 219`).
- Schublade: Öffnen `#navOpen` (`aria-expanded`), Schließen über ✕, Klick auf den Hintergrund, Klick auf einen Link oder **Escape** (`core.js:220–224`). Beim Öffnen springt der Fokus auf den aktiven Link (`core.js:183`). Die geschlossene Leiste ist `aria-hidden="true"`; es gibt keine Fokusfalle in der offenen Schublade.
- Die Steuerung (Taler, Theme, Person) wandert im Schubladenmodus in die Kopfzeile (`core.js:179`); dazu ein zweiter Theme-Umschalter nur in der Schublade (`core.js:208`).

### 2.3 Theme

- Genau zwei Modi: **dunkel** (Standard) und **hell** (`core.js:114–118`). Ein früherer Wert `colorful` wird als hell gelesen. Speicherort `localStorage.gf_theme`; jede Seite setzt das Theme zusätzlich früh per Inline-Skript im `<head>` gegen Flackern (z. B. `index.html:18`).
- Es gibt keine Kopplung an `prefers-color-scheme`; ohne gespeicherten Wert ist es immer dunkel.
- Umschalter als Knopfgruppe „Designmodus“ mit Zustand per Klasse `on`, ohne `aria-pressed` (`core.js:187, 213–214`).

### 2.4 Tastaturkürzel

| Kürzel | Wo | Wirkung | Beleg |
|---|---|---|---|
| Enter | Gate-Passwortfeld | Entsperren | `core.js:129` |
| Escape | überall | Schublade schließen | `core.js:224` |
| Escape | Nachrichten-Detailfenster, Einwurf, Spielkarten | schließen | `core.js:478, 771`, `game.js:91` |
| `/` | entscheidungen, neuigkeiten, seiten | Fokus in die Suche | `entscheidungen.html:196`, `neuigkeiten.html:239`, `seiten.html:245` |
| Tippen von „möhre“/„moehre“ außerhalb von Feldern | überall | Easter Egg | `eggs.js:58–63` |
| Pfeiltasten | Tabs auf arbeiten, Zielpunkte auf kommunikation | Wechsel | `arbeiten.html:941`, `kommunikation.html:336` |
| Enter | Board-Karte, Eingabefelder in cockpit/jahr | öffnen bzw. anlegen | `board.html:196`, `cockpit.html:282`, `jahr.html:208` |

Kürzel werden nirgends in der Oberfläche erklärt (kein Hilfedialog gefunden).

### 2.5 Globale Elemente

- **Suche:** keine globale Suche. Seitensuchen gibt es auf einzelnen Seiten (siehe Tabellen).
- **Einwurf** (`gfEinwurf`, `core.js:757–908`): zweistufiger Dialog „Was ist passiert?“ → KI-Vorschlag mit Haken → Übernehmen. Kein globaler Knopf; aufgerufen aus `index.html:284` und `vorhaben.html:445`, Warteschlange aus `vorhaben.html:450–451`. Schritt 1 ruft `einwurf_add` (Text geht an die KI), Übernehmen ruft `einwurf_apply` mit `revision`, `expect` und `expect_ball` (Konfliktschutz, `core.js:884–885`), Verwerfen mit `confirm()` (`core.js:901`).
- **Toast** `gfToast` (`core.js:33–37`): ein Element `#toast`, 2,6 s sichtbar, überschreibt die vorige Meldung. In 24 Seiten als statisches `<div class="toast" id="toast">` ohne Rolle; nur `arbeiten.html:315` hat `role="status" aria-live="polite"`. Wird auch für Fehler genutzt.
- **Kopieren** `gfCopy` (`core.js:38`): meldet „In die Zwischenablage kopiert“, ohne auf das Ergebnis von `clipboard.writeText` zu warten.
- **Dialoge**, drei Bauarten im Kern: `gfTextModal` (Protokoll, Wochenmail, Vertretungsbrief; Kopieren, „Per Mail senden“ als `mailto:` an beide GF, Schließen; kein Escape, keine Fokusführung, `core.js:314–332`), `gfNewsModal` (Escape ja, keine Fokusführung, `core.js:461–480`), Einwurf mit `gfModalAuf` (Rest der Seite `inert`, Tab-Falle, Fokus kehrt zurück, `core.js:729–746`). Dazu Spielkarten (`game.js:85–94`, `role="dialog"`, Escape, Klick daneben) und native `confirm()`/`prompt()` an 32 Stellen in Seiten und `core.js`.
- **Laufband** (`gfMountBand`, `core.js:493–507`): Neuigkeiten als laufende Zeile, hält bei Zeiger oder Fokus, Pause-Knopf; bei „Bewegung reduzieren“ steht es still und ist seitlich scrollbar (`styles.css:1013`).
- **Lange Texte** (`gfClamp`, `core.js:255–266`): ab 220 Zeichen eingeklappt mit „mehr/weniger“, Zustand je Eintrag in `localStorage.gf_open_<key>`.
- **Habitat-Taler / Spiel** (`game.js`): Einchecken einmal je Person und Tag (`checkin`, Merker `localStorage.gf_ci_<Person>_<Tag>`), Taler und Serie in der Leiste (Link auf `index.html#habitat`), aufsteigende Marker bei Gewinnen, Karten für Tagesgruß, Abzeichen und Stufenaufstieg (Auto-Schließen nach 7–9 s, außer bei Zeiger darüber). Punkte vergibt der Server (`score_*`, `award`). Der Mail-Link im Protokollfenster löst `score_event` „protokoll“ aus (`core.js:330`). Testparameter `?game=karte|abzeichen|stufe|marker`.
- **Easter Eggs** (`eggs.js`): fünf Klicks auf die Marke → Konfetti (ein einzelner Klick navigiert erst nach 380 ms Verzögerung, `eggs.js:28–31`); Bus bei leerer Agenda (Ereignis `gf-egg-bus`); Nachtmodus 23–5 Uhr am Gate; „möhre“ tippen; Abzeichen „Phase gemeistert“ bei allen Ritualen; Festivaltage 20.–23.08. Testparameter `?egg=fest|nacht|bus|konfetti|moehre`.
- **Laufband, Team-Analyse und Plattformen** (`gfLoadBand`, `gfLoadTeam` `core.js:593–611`, `gfLoadPlatforms` `core.js:662–678`): trotz der Kommentare „Startseite“ werden sie heute nur auf `jahr.html:372` geladen; einklappbare Bereiche, nur lesend, Zustand offen/zu in `localStorage`.

---

## 3. Seiten im Einzelnen

Reihenfolge wie in der Seitenleiste, verwaiste Seiten an ihrem fachlichen Ort. Spalten: Fähigkeit/Auslöser mit Fundstelle · verborgener Zugang · Datenquelle (Funktion:`Aktion` oder lokaler Speicher) · Speicherwirkung (liest / sofort speichern / Formular speichern / fachlich bestätigen / nach außen wirkend) · im Code sichtbare Zustände. Zeilenangaben beziehen sich auf die jeweilige Seite, sofern keine Datei genannt ist.

### 3.1 index.html · Für dich (Startseite)
**Hauptaufgabe:** In unter einer Minute zeigen, was bei der angemeldeten Person liegt: eigene Vorhaben, Bewegung seit dem letzten Besuch, offene Entscheidungen, Vertretungslage, Briefing und nächste Fristen.
**Darstellungsformen:** Kopfbild mit Begrüßung, Zeilenlisten (Link-Zeilen), Zahlenblock, KPI-Kacheln, Fließtext-Briefing, schwebender Knopf (FAB), Dialog (Einwurf aus core.js).
**Navigation/Einstieg:** `gfMountTopbar("start")` (index.html:279). Liest keine URL-Parameter; verlinkt mit `vorhaben.html?v=`, `?v=…&tab=verlauf`, `?filter=mir`, `?filter=bewegt`, `board.html?topic=`, `uebergabe.html?id=`, `rueckkehr.html?id=`.

| ID | Fähigkeit / Auslöser | Verborgener Zugang | Datenquelle | Speicherwirkung | Zustände |
|---|---|---|---|---|---|
| F-index-01 | Laden in zwei Stufen, ältere Antworten oder Antworten für die andere Person werden verworfen (250-277) | – | gfweekly:`vorhaben_list`, `vorhaben_seit`, `gate_list`, `news_list` (lage, ticker), `platform_digest`, `milestones_list`, `cycle_get`, `absence_list`, je Abwesenheit `handover_list` | liest | Fehler von `gate_list` nur im Block „Deine Entscheidung“ (288); die übrigen Blöcke bleiben dann bei „lädt …“ (41, 51) |
| F-index-02 | Begrüßung mit Avatar und Datum (280-282) | – | lokal `gfWho()` | liest | – |
| F-index-03 | „Deine Vorhaben“: Ball bei mir oder GF, nach Frist, höchstens fünf, „und n weitere“ (102-115) | Link `vorhaben.html?filter=mir` (113) | `vorhaben_list` | liest | Fehler „ließen sich gerade nicht laden“ (103); leer „Kein Ball bei dir“ (107) |
| F-index-04 | „Seit du zuletzt da warst“: je Vorhaben eine Zeile, zu mir gewanderte Bälle zuerst (117-141) | Link `?v=…&tab=verlauf` (136), `?filter=bewegt` (139) | gfweekly:`vorhaben_seit` | liest | Fehler (119); leer (130); Hinweis bei über 2.000 Einträgen (127) |
| F-index-05 | „Alles gesehen“ setzt die Besuchsmarke (143-144) | – | localStorage `gf_vh_seen_<Person>` | sofort speichern (nur Browser) | ausgeblendet bei gekürzter Liste (129) |
| F-index-06 | „Deine Entscheidung“: Einträge mit Ausgang GF oder eigene Person, höchstens fünf (147-166) | „Zur Besprechung“ nur sichtbar, wenn GF-Einträge da sind (151) | `gate_list` | liest | leer „Nichts wartet auf dich“ mit zuletzt Bewegtem (152-154) |
| F-index-07 | Vertretung: drei Fälle (Rückkehr mit drei Zahlen; in Vertretung mit Quadrant, Ampel, Frist; bevorstehende Abwesenheit) (203-248) | ganzer Block nur sichtbar, wenn ein Fall greift (55, 247) | `absence_list`, `handover_list` | liest | Fehler je Korb werden still verschluckt (274) |
| F-index-08 | „Seit gestern“: Briefing je Strang, zwei Plattform-Kacheln (169-182) | – | `news_list` kind lage, `platform_digest` | liest | leer „Kein Briefing in den letzten sieben Tagen“ (175) |
| F-index-09 | „Nächste Fristen“: drei nächste Daten aus Fristen, Partner-Zieldaten, Meilensteinen, Terminen (185-197) | Partner-Link öffnet extern im neuen Tab (193) | `gate_list`, `platform_digest`, `milestones_list`, `news_list` | liest | leer „Keine Daten in Sicht“ (196) |
| F-index-10 | „+ Einwurf“ im Kopfbild und als FAB (282-285) | FAB nur schmal sichtbar (styles.css:1623, 1645) | core.js `gfEinwurf` | nach außen wirkend (KI/Anthropic) und fachlich bestätigen | danach Neuladen (284) |
| F-index-11 | Personenwechsel lädt alles neu und ändert die Begrüßung (287) | Ereignis `gf-who` | wie F-01 | liest | – |

---

### 3.2 vorhaben.html · Vorhaben
**Hauptaufgabe:** Die Vorhaben der Geschäftsführung nach Frist, Ball oder Gruppe zeigen, je Vorhaben die Akte (Stand, Checkliste, Verlauf, Ball) pflegen und Bälle per Einwurf oder Übergabe weitergeben.
**Darstellungsformen:** Wochenraster (Kalenderwochen-Zeilen mit Karten), Board (Spalten nach Ball), Liste (gruppierte Tabellenzeilen als Knöpfe), Karten, Seitenbereich „Akte“ (ab 1024 px rechts, sonst als Blatt), Tabs (Prozess/Verlauf), Checkliste, Inline-Formular, Dialoge (Ball weitergeben, Übergeben, Einwurf aus core.js), schwebender Knopf (FAB, nur schmal).
**Navigation/Einstieg:** `gfMountTopbar("vorhaben")` (vorhaben.html:611). URL-Parameter: `?view=woche|board|liste` (74), `?filter=mir` (73), `?tab=verlauf` (75), `?v=<slug oder id>` öffnet die Akte (613); die Akte schreibt `?v=` und `?tab=` per `history.replaceState` zurück (267, 282, 384).

| ID | Fähigkeit / Auslöser | Verborgener Zugang | Datenquelle | Speicherwirkung | Zustände |
|---|---|---|---|---|---|
| F-vorhaben-01 | Vorhaben laden, Kopfzeile, Steuerung und Hauptbereich zeichnen (vorhaben.html:605-609) | – | gfweekly:`vorhaben_list` | liest | laden „lädt …“ (53); Fehler mit „Noch einmal“ (607); 401 wird an das Gate weitergereicht (607) |
| F-vorhaben-02 | Lagezeile: Stand-Uhrzeit, Anzahl, Bälle bei Alex/Lea, ohne Ball, Abwesenheiten (97-107) | – | `vorhaben_list` (metaphase, abwesenheiten) | liest | `role="status"` (37) |
| F-vorhaben-03 | Ansicht wählen: Woche, Board, Liste (111-117) | URL `?view=` (74); gemerkt in localStorage `gf_vh_view` (70, 117) | lokal | liest | – |
| F-vorhaben-04 | Filter: Alle, Bei mir, Bewegt, Konflikte, mit Zählern (114-118) | URL `?filter=mir` (73); localStorage `gf_vh_filter` (71) | lokal | liest | leer je Filter mit „Alle zeigen“ (208, 213) |
| F-vorhaben-05 | Wochenansicht: Überfällig, neun Kalenderwochen, Später, Ohne Datum; Abwesenheitsbänder je Woche; Launch-Marke bei VVK-Start (153-173, 121-129) | Markentext über `title=` voll, sichtbar gekürzt auf 46 Zeichen (130) | `vorhaben_list` | liest | „nichts fällig“ je Woche (171) |
| F-vorhaben-06 | Board nach Ball (Alex, Lea, GF, Team, extern, Ball fehlt) mit Warnung ab sechs Karten (176-187) | – | `vorhaben_list` | liest | Spalte „leer“ (185) |
| F-vorhaben-07 | Liste nach Gruppe (Launch, Geld, Team, Partner, System, Sonstiges) mit Zustand, Ball, Schritt, Frist, Punkten (190-204) | Spaltenkopf `aria-hidden` (193) | `vorhaben_list` | liest | – |
| F-vorhaben-08 | Karte oder Listenzeile öffnet die Akte (136, 195, 215, 265-279) | Direktlink `?v=` (613) | gfweekly:`vorhaben_get` | liest | „lädt …“ (269); Fehler mit „Schließen“ (276); verspätete Antworten werden verworfen (273, 277) |
| F-vorhaben-09 | Ball weitergeben durch Ziehen einer Karte auf eine Board-Spalte (219-225); Team/extern öffnet den Dialog | Ziehen (draggable nur im Board, 135, 185) | gfweekly:`vorhaben_save` mit `expect_ball` | sofort speichern | Fehler/Konflikt als Toast, danach Neuladen (261) |
| F-vorhaben-10 | Knopf „Ball weitergeben“ auf der Board-Karte (142, 214) | mit Maus nur bei Hover oder Fokus der Karte sichtbar (styles.css:1655-1658) | – | – | – |
| F-vorhaben-11 | Dialog „Ball weitergeben“: Chip-Reihe Ball, Name Pflicht bei Team/extern, Notiz für den Verlauf (227-255) | Escape schließt (246); Klick auf Hintergrund schließt (245) | `vorhaben_save` mit `expect_ball`, `expect.ball_name`, `notiz` (258) | Formular speichern | Pflichtfeld mit `aria-invalid` und Fehlertext (250); Erfolg/Fehler als Toast (259, 261) |
| F-vorhaben-12 | Ball-Chips in der Akte („Ball geben an“) (325, 387) | – | `vorhaben_save` (über `ballSetzen`) | sofort speichern | Fehler als Toast (261) |
| F-vorhaben-13 | Akte schließen: „← Zurück“, ✕ (293, 295, 383) | Escape, wenn kein Dialog offen ist (602) | lokal, entfernt `?v=`/`?tab=` (282) | liest | – |
| F-vorhaben-14 | Kacheln der Akte: Ball seit, Frist (auch aus Punkt), Punkte offen/erledigt; Konfliktzeile (297-302) | – | `vorhaben_get` | liest | – |
| F-vorhaben-15 | Feld „Nächster Schritt“ speichert beim Verlassen (304, 368-375) | Speichern nur über `focusout`, kein Knopf | `vorhaben_save` mit `expect:{naechster_schritt}` | sofort speichern | Fehler-Toast, Text bleibt als Entwurf mit Hinweis „nicht gespeichert, gespeichert ist: …“ (304, 371); bei „inzwischen“ Akte neu laden (372) |
| F-vorhaben-16 | Feld „Stand“ speichert beim Verlassen (314, 368-375) | wie F-15 | `vorhaben_save` mit `expect:{stand}` | sofort speichern | wie F-15 |
| F-vorhaben-17 | Tabs Prozess/Verlauf (305-309, 384) | URL `?tab=verlauf` (75); keine Pfeiltasten-Steuerung der Tabliste | lokal | liest | wartet auf laufendes Speichern (384) |
| F-vorhaben-18 | Checklistenpunkt abhaken/öffnen (337, 376-381) | Checkbox mit Label | gfweekly:`punkt_toggle` (ohne expect) | sofort speichern | Checkbox gesperrt während Speichern; Fehler setzt zurück und toastet (380) |
| F-vorhaben-19 | „+ Punkt hinzufügen“: Inline-Formular Punkt, Wer, Frist (315, 402, 405-441) | – | gfweekly:`punkt_save` | Formular speichern | Pflichtfeld `required` (409); Fehler als Toast (439) |
| F-vorhaben-20 | Punkt „ändern“: Formular mit Stand, sendet nur geänderte Felder mit gesehenem Wert (339, 403, 426-436) | – | `punkt_save` mit `expect` je Feld | Formular speichern | 409 bei gleichzeitiger Änderung desselben Felds als Toast (427, 439) |
| F-vorhaben-21 | Punkt „Löschen“ im Änderungsformular (414, 420-421) | kein Bestätigungsdialog | gfweekly:`punkt_delete` | sofort speichern | Server lehnt mit 409 ab, wenn der Punkt Verlauf hat (index.ts:2889); Fehler als Toast |
| F-vorhaben-22 | Verknüpfte Themen und Kandidaten aufklappen und öffnen (320-331) | `<details>`; Ziel `board.html?topic=` bzw. `neuigkeiten.html` | `vorhaben_get` | liest | „keine Themen/Kandidaten“ (330) |
| F-vorhaben-23 | „Zuordnung lösen“ und „Rückgängig“ (331, 391-397, 319) | – | gfweekly:`vorhaben_verknuepfen` mit `expect_vorhaben_id` | sofort speichern | Konflikt („inzwischen“) lädt die Akte neu (394); Rückgängig-Hinweis `role="status"` (319) |
| F-vorhaben-24 | Verlauf filtern: Alles, Nur Entscheidungen, Seit meinem letzten Besuch (353-364, 385) | Besuchsmarke aus localStorage `gf_vh_seen_<Person>` (core.js:709-711) | `vorhaben_get` | liest | leer je Filter (364) |
| F-vorhaben-25 | Vorschlag im Verlauf übernehmen (je nach Art „abhaken“, „In den Verlauf“) oder verwerfen (345-352, 360, 388-390) | – | gfweekly:`verlauf_status` | fachlich bestätigen | Knopf gesperrt während Speichern; Fehler als Toast (390) |
| F-vorhaben-26 | „Stand am Punkt übernehmen …“: Formular mit vorbelegtem Stand aus dem Vorschlagstext, übrige Felder schreibgeschützt (349, 398-401, 410, 418, 428-431) | Stand wird per Regex aus „jetzt so steht:“ gelesen (400) | gfweekly:`vorschlag_stand` mit `expect_stand` | fachlich bestätigen | Fehler als Toast (430) |
| F-vorhaben-27 | „Etwas eintragen …“ im Verlauf, Kopfknopf „+ Einwurf“, FAB (365, 386, 444-449) | FAB nur bei schmaler Breite sichtbar (styles.css:1623, 1645) | core.js `gfEinwurf` → `einwurf_add`, `einwurf_vorschlag`, `einwurf_apply` | nach außen wirkend (KI/Anthropic beim Vorschlag) und fachlich bestätigen beim Übernehmen | Dialogzustände siehe core.js:760-907; danach Akte im Verlauf öffnen (445) |
| F-vorhaben-28 | Hinweis „n Einwürfe warten“ oben und in der Akte öffnet die Warteschlange (108-109, 303, 450-451) | – | core.js `gfEinwurfWarteschlange` → `einwurf_list` | fachlich bestätigen | „Keine Einwürfe warten“ als Toast (core.js:915) |
| F-vorhaben-29 | „Übergeben“: Anlass wählen Feierabend, Urlaub, Krank (40, 459-475) | Escape schließt, wenn nichts lädt (527) | – | – | – |
| F-vorhaben-30 | Feierabend/Schichtende: je Vorhaben mit Ball bei mir „andere übernimmt / bleibt / GF“ plus Notiz (476-485, 567-579) | Vorauswahl „bleibt bei mir“ | gfweekly:`schicht_uebergabe` mit `expect_ball` je Eintrag | Formular speichern | Teilfehler werden je Vorhaben mit Grund im Dialog gezeigt (`role="alert"`, 512, 576); leer „Gerade liegt kein Ball bei dir“ (484) |
| F-vorhaben-31 | Urlaub/Krank: laufende Abwesenheit wählen oder neue anlegen (Ab, Bis, Probe) (486-498, 554-566) | Haken „Probe“ (496) | gfweekly:`absence_set`, dann `handover_list` | Formular speichern | Prüfung Ab fehlt, Bis fehlt (Urlaub), Ende vor Anfang (556-558); Fehler im Dialog (564) |
| F-vorhaben-32 | Korb-Vorhaben „andere übernimmt / ruht / Team (Name Pflicht)“ senden (499-508, 580-598) | Link `uebergabe.html?id=` für den Rest des Korbs (506) | gfweekly:`handover_set_many` mit `expect{status,ampel,vertretung}` | fachlich bestätigen | Teilfehler: Zahl gespeichert/nicht, Korb neu geladen, Auswahl zurückgesetzt (593-595) |
| F-vorhaben-33 | „Probe beenden, Bälle zurück“ (501, 524-526) | – | gfweekly:`absence_end` | sofort speichern | Fehler im Dialog (526) |
| F-vorhaben-34 | Personenwechsel in der Seitenleiste zeichnet neu (603) | Ereignis `gf-who` | lokal | liest | – |
| F-vorhaben-35 | Quelle eines Verlaufseintrags öffnen (359) | neuer Tab | extern | liest | – |

---

### 3.2a vorhaben.html · Ergänzung „Vorhaben abschließen“ (seit `05af97b`)

Quelle: `docs/PAKET-VORHABEN-ABSCHLIESSEN.md` und `site/vorhaben.html` bei `05af97b`.

| ID | Fähigkeit / Auslöser | Verborgener Zugang | Datenquelle | Speicherwirkung | Zustände |
|---|---|---|---|---|---|
| F-vorhaben-36 | Akte: „✓ Erledigt“ öffnet ein Blatt mit Ergebnis, Punkte mit abhaken, verknüpfte Themen archivieren | Am Handy Blatt von unten | gfweekly:`vorhaben_abschliessen` | fachlich bestätigen (Transaktion) | Laden, Fehler im Blatt |
| F-vorhaben-37 | Hinweis „… erledigt · Rückgängig“ | 10 s sichtbar | gfweekly:`vorhaben_wiedereroeffnen` mit Rückgabewerten | sofort speichern | — |
| F-vorhaben-38 | Menü „⋯“ in der Akte: Pausieren, Fortsetzen, Archivieren | Untermenü | gfweekly:`vorhaben_save` (status) | sofort speichern, Archivieren mit Rückfrage | — |
| F-vorhaben-39 | Filter „Erledigt“ mit gedämpfter Liste, Akte nur lesend, „Wieder öffnen“ | — | gfweekly:`vorhaben_list` status erledigt | liest, Wieder öffnen sofort | leer |
| F-vorhaben-40 | Liste: Kreis am Zeilenanfang zum schnellen Abschließen | — | wie F-vorhaben-36 | wie F-vorhaben-36 | — |

### 3.3 neuigkeiten.html · Neuigkeiten
**Hauptaufgabe:** Ereignisse (Ticker), Kandidaten für die GF-Runde (Sichtungskorb) und die Themenlage je Strang lesen, filtern und Kandidaten zu Themen machen oder verwerfen.
**Darstellungsformen:** Laufband, KPI-Zeile, ausklappbares Filterpanel, aufklappbare Abschnitte (`<details>`), Tagesgruppen, aufklappbare Zeilen, Auswahlliste (`<select>`), Detaildialog (core.js `gfNewsModal`).
**Navigation/Einstieg:** `gfMountTopbar("neuigkeiten")` (neuigkeiten.html:249). Hash `#ticker`, `#korb`, `#lage` öffnet den Abschnitt und scrollt dorthin (254).

| ID | Fähigkeit / Auslöser | Verborgener Zugang | Datenquelle | Speicherwirkung | Zustände |
|---|---|---|---|---|---|
| F-neuigkeiten-01 | Laden aller Neuigkeiten, Themen und Stränge (99-105) | – | gfweekly:`news_list` (limit 2000), `list`, `cycle_get` | liest | „lädt …“ (59, 64); Fehler nur im Ticker (104) |
| F-neuigkeiten-02 | KPI-Zeile: neu für Person, hoch im Korb, Termine 7 Tage (117-128) | zwei Kacheln sind Sprunglinks `#korb`, `#ticker` (126-127) | `news_list` | liest | – |
| F-neuigkeiten-03 | Laufband mit Neuem; Klick öffnet Detail (130, core.js:493-507) | hält bei Hover/Fokus (styles.css:1002); Pausenknopf (core.js:505); bei reduzierter Bewegung seitlich scrollbar (styles.css:1013) | `news_list` | liest | ausgeblendet ohne Einträge (core.js:495) |
| F-neuigkeiten-04 | Detaildialog mit „Als Thema erfassen“ (131-132) | Escape schließt (core.js:478) | gfweekly:`news_accept` | fachlich bestätigen (mit `confirm()`) | Fehler als Toast (132) |
| F-neuigkeiten-05 | Person: Beide, Alex, Lea (42-43, 240) | Gruppe nur mit `title=` beschriftet (42) | lokal | liest | – |
| F-neuigkeiten-06 | Filterpanel öffnen/schließen mit Zähler aktiver Filter (45, 114-115, 235-236) | Zustand in sessionStorage `gf_nw_filter` (235, 252) | lokal | liest | – |
| F-neuigkeiten-07 | Zeitraum 7/14/30 Tage/Alle (50, 241) | `title=` (50) | lokal | liest | – |
| F-neuigkeiten-08 | Quellen an/aus (Notizen, Mails, Asana, Kalender, Entscheidungen, Plattform) (51, 243) | Chips ohne `aria-pressed` | lokal | liest | – |
| F-neuigkeiten-09 | Korb nach Relevanz, „Erledigte zeigen“ (52, 242, 244) | – | lokal | liest | – |
| F-neuigkeiten-10 | Suche über Titel, Text, Zitat, Person, Quelle, Strang (53, 90, 238) | Tastenkürzel „/“ öffnet Filter und fokussiert die Suche (239); Feld nur mit Platzhalter | lokal | liest | „Nichts gefunden.“ (159, 198, 225) |
| F-neuigkeiten-11 | Filter zurücksetzen (237) | – | lokal | liest | – |
| F-neuigkeiten-12 | „Alles gesehen“ (46, 245) | `title=` (46) | localStorage `gf_news_seen_<Person>` (core.js:440-442) | sofort speichern (nur Browser) | Toast (245) |
| F-neuigkeiten-13 | Ticker nach Tagen, heute/gestern offen, „Demnächst“ für künftige Termine (145-164) | Zeile per Klick aufklappen (167); `title=` mit Quelle/Strang (139) | `news_list` | liest | leer mit Hinweis auf den täglichen Lauf (159) |
| F-neuigkeiten-14 | „Als Thema erfassen“ in der Tickerzeile (137, 168) | erst nach Aufklappen sichtbar | `news_accept` | fachlich bestätigen (mit `confirm()`) | Fehler als Toast (132) |
| F-neuigkeiten-15 | Sichtungskorb in drei Relevanzgruppen, Kandidat aufklappen (173-201, 205) | Gruppenzustand in localStorage `gf_nw_korb-<rel>` (93-96, 199); `title=` mit Quelle/Relevanz (178) | `news_list` kind kandidat | liest | leer mit Hinweis (198) |
| F-neuigkeiten-16 | Kandidat „Als Thema übernehmen“ / „Als neues Thema“ (187, 208) | – | `news_accept` | fachlich bestätigen | Fehler als Toast (213) |
| F-neuigkeiten-17 | Kandidat „An Thema anhängen“ (187, 209) | nur bei vorhandenem Themenbezug | `news_accept` mit `topic_id` | fachlich bestätigen | Fehler als Toast (213) |
| F-neuigkeiten-18 | „Mit Thema verknüpfen …“ Auswahlliste (188, 215) | `title=` (188); `confirm()` | `news_accept` mit `topic_id` | fachlich bestätigen | Abbruch setzt Auswahl zurück (215) |
| F-neuigkeiten-19 | Kandidat „Verwerfen“ (189, 210) | kein Bestätigungsdialog | gfweekly:`news_update` status verworfen | sofort speichern | Fehler als Toast (213) |
| F-neuigkeiten-20 | „Zurück in den Korb“ für Erledigte (185, 211) | nur mit „Erledigte zeigen“ | `news_update` status neu | sofort speichern | Fehler als Toast |
| F-neuigkeiten-21 | Themenlage je Strang aufklappen; Zähler offener Kandidaten springt zum Korb (220-232) | Link `#korb` liegt im Zeilenknopf (227), `title=` (227) | `news_list` kind lage | liest | leer mit Hinweis (225) |
| F-neuigkeiten-22 | Abschnitte Ticker/Korb/Themenlage auf/zu, gemerkt (57-70, 93-97) | localStorage `gf_nw_<abschnitt>` | lokal | liest | – |
| F-neuigkeiten-23 | Personenwechsel zeichnet neu (246) | Ereignis `gf-who` | lokal | liest | – |

---

### 3.4 besprechung.html · Besprechung
**Stand 25.10.2026 (Stufe 1, S1-02):** Agenda = Entscheidungsliste; je Punkt Entschieden, Vertagen, Abgeben, Überspringen. Die Zeilen unten beschreiben den Stand vor Stufe 1.
**Hauptaufgabe:** Agenda aller der GF gemeinsam gehörenden Punkte vorbereiten, in einer Besprechung Punkt für Punkt abarbeiten (entscheiden, weitergeben, übernehmen, verwerfen) und das Protokoll erzeugen.
**Darstellungsformen:** Kopfzeile mit Zählung, nummerierte Agenda-Liste (Frage/Stand/Vorschlag/Frist als Definitionsliste), Besprechungsbereich mit Timer und Formular, Liste der Beschlüsse der letzten Besprechung, Dialog (Protokoll).
**Navigation/Einstieg:** `gfMountTopbar("besprechung")` (besprechung.html:248). Keine URL-Parameter; Zustand einer laufenden Besprechung in localStorage `gf_besprechung` (besprechung.html:66-67).

| ID | Fähigkeit / Auslöser | Verborgener Zugang | Datenquelle | Speicherwirkung | Zustände |
|---|---|---|---|---|---|
| F-besprechung-01 | Laden der Agenda (gate = gf), Themen, Personen, letzte Besprechung (besprechung.html:247-256) | – | gfweekly:`gate_list` {gate:"gf"}, `list`, `people_list`, `sessions_list`, `decisions_list` | liest | laden „lädt …“ (besprechung.html:40); Fehler: „Konnte nicht laden: …“ in der Agenda (besprechung.html:255); leer: „Leere Agenda.“ (besprechung.html:108) |
| F-besprechung-02 | Kennzeichen „Vertretung für …“ an Punkten aus rotem Übergabekorb (besprechung.html:236-245, 95) | – | gfweekly:`absence_list`, `handover_list` je Abwesenheit | liest | Fehler still (leere Markierung) |
| F-besprechung-03 | Vorbereitungszeile „x Punkte, y mit Frist, z ohne Vorschlag“ (besprechung.html:83-88) | – | lokal | liest | Satz für leere Agenda |
| F-besprechung-04 | Agenda-Zeile mit Stand, Vorschlag, Frist, „fehlt“-Markierung (besprechung.html:89-105) | – | lokal | liest | „fehlt“ als Wort statt leerer Zelle |
| F-besprechung-05 | Besprechung starten (besprechung.html:39, 126-133, 246) | Teilnehmende über `prompt()` (besprechung.html:127) | gfweekly:`session_start`; localStorage `gf_besprechung` | sofort speichern | Fehler-Toast „Start fehlgeschlagen“ |
| F-besprechung-06 | Laufende Besprechung: Timer, „x von y behandelt“, ▶ nächster Punkt (besprechung.html:136-187) | ▶ nur Symbol mit title= (besprechung.html:145); Knopf „Besprechung läuft …“ scrollt zum Bereich (besprechung.html:246) | lokal | liest | 1-s-Timer; „Alle Punkte behandelt.“ plus Osterei-Ereignis `gf-egg-bus` (besprechung.html:149) |
| F-besprechung-07 | Punkt in der Agenda „Aufrufen“ (besprechung.html:103, 109) | nur während laufender Besprechung | lokal | liest | – |
| F-besprechung-08 | Thema: „Entschieden“ mit Entscheidungstext, Schritt, Verantwortung (besprechung.html:160-166, 205-212) | – | gfweekly:`update`, `decision_add` (mit session_id) | fachlich bestätigen | Pflicht Entscheidungstext per Toast (besprechung.html:192); Fehler-Toast |
| F-besprechung-09 | Thema: In Klärung / Erledigt / Vertagen 1 Woche / 1 Monat / Besprochen, weiter (besprechung.html:167-177, 204-210) | – | gfweekly:`update` | sofort speichern | Toast je Ergebnis; Fehler-Toast |
| F-besprechung-10 | An Lea / An Alex / Ins Team geben / Kann warten (besprechung.html:173-176, 195-197) | title= erklärt Wirkung (besprechung.html:173-174) | gfweekly:`gate_set`, ggf. `update` | sofort speichern | Fehler-Toast; keine Rechteprüfung, wer weitergibt |
| F-besprechung-11 | Kandidat als Thema übernehmen (bleibt bei der GF) (besprechung.html:171, 198-201) | title= | gfweekly:`news_accept`, dann `gate_set` | fachlich bestätigen | Fehler-Toast |
| F-besprechung-12 | Kandidat verwerfen (besprechung.html:172, 202-203) | ohne Rückfrage | gfweekly:`news_update` {status:"verworfen"} | sofort speichern | Fehler-Toast |
| F-besprechung-13 | Überspringen (besprechung.html:178, 189) | – | lokal | – | Toast „Kein weiterer offener Punkt“ |
| F-besprechung-14 | Link „Details“ zum Thema im Board (besprechung.html:154) | Direktlink `board.html?topic=` | – | – | – |
| F-besprechung-15 | Beenden · Protokoll: speichert Protokoll, zeigt Textdialog mit Kopieren und „Per Mail senden“ (besprechung.html:219-228) | – | gfweekly:`session_end` (vergibt Taler, Abzeichen „agenda_leer“); core.js `gfTextModal`; `score_event` beim Mail-Klick | nach außen wirkend (Clipboard, Mail-Link); Protokoll sofort gespeichert | Ausgang: Fehler-Toast, Dialog erscheint trotzdem (besprechung.html:225). **Seit dem Pilot (W-21):** bei Speicherfehler bleibt die Besprechung offen, der Dialog „Protokoll nicht gespeichert“ zeigt den Text zur Sicherung, erneutes Beenden möglich |
| F-besprechung-16 | Beschlüsse der letzten Besprechung mit Stand des nächsten Schritts, Zeile verlinkt ins Board oder Log (besprechung.html:111-123) | ganze Zeile ist Link | `sessions_list`, `decisions_list` {session_id} | liest | „Noch keine Besprechung protokolliert.“; Ladefehler wird als „keine Besprechung“ angezeigt (besprechung.html:231-233). **Seit dem Pilot (W-03):** ein Ladefehler erscheint als „Letzte Besprechung nicht geladen“ mit „Erneut laden“, nicht mehr als „keine Besprechung“ |
| F-besprechung-17 | Links „Aufräumen“ und „Entscheidungslog →“ (besprechung.html:39, 44) | – | – | – | – |

---

### 3.5 board.html · Themen · Board / Kacheln
**Hauptaufgabe:** Alle GF-Themen als verschiebbares Spalten-Board oder als Kachelraster zeigen, filtern, verschieben und im Seitenpanel bearbeiten.
**Darstellungsformen:** Board (Spalten), Karte (Themenkarte), Kachelraster, Seitenbereich (Detailpanel rechts), Dialog (Bereinigen, Aufräumen), Popover (Verschieben-Menü), Formular (im Panel), Besprechungsbereich (nur bei altem laufendem Besprechungsstand).
**Navigation/Einstieg:** `gfMountTopbar("themen")`, `gfMountSubnav(VIEW)` mit `board`/`kacheln` (board.html:473). URL-Parameter: `?view=kacheln` (board.html:82), `?q=` Volltextvorbelegung (board.html:88), `?owner=` bzw. altes `?person=` Personenfilter (board.html:89), `?luecke=1` (board.html:90), `?topic=<id>` öffnet das Panel (board.html:476), `?meeting=1` leitet nach besprechung.html um (board.html:476).

| ID | Fähigkeit / Auslöser | Verborgener Zugang | Datenquelle | Speicherwirkung | Zustände |
|---|---|---|---|---|---|
| F-board-01 | Laden aller Themen und Personen beim Entsperren (board.html:472-478) | – | gfweekly:`list`, `people_list` (gfLoadPeople) | liest | laden: Skelett-Spalten (board.html:475); Fehler: „Fehler beim Laden: …“ ersetzt Ansicht (board.html:477); leer Board: „hierher ziehen“ je Spalte (board.html:148); leer Kacheln: „Nichts zu zeigen“ (board.html:154) |
| F-board-02 | Ansicht Board/Kacheln wechseln (Seitenleiste Unterpunkte) | URL `?view=kacheln` (board.html:82) | – | liest | nicht sichtbar |
| F-board-03 | Suche über Titel, Satz, Kontext, Verantwortung, Schritt, Entscheidung (board.html:37, 119, 334) | Taste `/` fokussiert Suche (board.html:282); URL `?q=` | lokal gefiltert | liest | leer siehe F-board-01 |
| F-board-04 | Spalten bilden nach Ablauf/Prio/Zeitraum/Person (board.html:38-43, 331) | title= an der Gruppe (board.html:38) | lokal; localStorage `gf_board_group` | liest (Ansichtszustand lokal) | nicht sichtbar |
| F-board-05 | Haken „nur Lücken“ (ohne Satz oder nächsten Schritt) (board.html:45, 343-344) | URL `?luecke=1` | lokal | liest | nicht sichtbar |
| F-board-06 | Haken „wiederkehrende zeigen“, „erledigte zeigen“ (board.html:46-47, 332-333) | – | localStorage `gf_board_rec`, `gf_board_done` | liest | nicht sichtbar |
| F-board-07 | Personenfilter „nur <Name>“ aus Übergabe-Kachel (board.html:44, 336-342) | nur über URL `?owner=`/`?person=` sichtbar; schaltet beide Haken zwangsweise ein (board.html:340) | lokal, Regel wie `uebernahme_stat` | liest | nicht sichtbar |
| F-board-08 | Karte ziehen und in andere Spalte/Position ablegen (board.html:193-203, 169-183) | Ziehen (draggable, HTML5 drag/drop); Reihenfolge innerhalb einer Spalte nur per Ziehen | gfweekly:`update` (board_lane/status, priority, next_suggested oder owner je Gruppierung; lane_order, ggf. Neu-Nummerierung aller Karten der Spalte board.html:177) | sofort speichern | Fehler: Rücksetzen plus Toast „Verschieben fehlgeschlagen: …“ (board.html:182); optimistisch gerendert |
| F-board-09 | Rückgängig nach Verschieben (5 s) (board.html:184-189) | Knopf nur im Toast, 5 s sichtbar | gfweekly:`update` mit Vorwerten | sofort speichern | Fehler beim Rückgängig still verschluckt (board.html:187) |
| F-board-10 | Verschieben-Menü über Knopf ⇄ an der Karte (board.html:133, 348-361) | Knopf halbtransparent (opacity .55), voll erst bei Hover/Fokus in Karte (styles.css:679-681); title= „Verschieben nach …“; Menü ohne Escape, schließt per Klick außerhalb (board.html:359-361) | gfweekly:`update` wie F-board-08 | sofort speichern | wie F-board-08 |
| F-board-11 | Karte öffnen (Detailpanel) (board.html:195-196, 238-274) | Klick auf ganze Karte (article tabindex=0), Tastatur Enter (board.html:196); Direktlink `?topic=` | lokal aus `list` | liest | nicht sichtbar |
| F-board-12 | Text einer Karte aufklappen „mehr/weniger“ (gfClamp, board.html:130-132) | – | localStorage `gf_open_<key>` | liest | – |
| F-board-13 | Panel: Felder Titel, Priorität (Chips), Termin, Verantwortung (Datalist), Art, Ein Satz, Nächster Schritt, Entscheidung, Kontext, Notizen bearbeiten (board.html:243-257) | Autosave 1,5 s nach Tippen und bei change (board.html:213, 265-266); Speichern beim Verlassen/Tab-Wechsel (board.html:279-280); erste Entscheidung setzt Spalte automatisch auf „Entschieden“ (board.html:225) | gfweekly:`update` | sofort speichern (Autosave) | Statuszeile „Ungespeichert … / Speichert … / Gespeichert HH:MM / Nicht gespeichert: …“ (board.html:212-235) plus Fehler-Toast; keine Konfliktprüfung (letzter Schreiber gewinnt) |
| F-board-14 | Panel: Spalte per Knopfreihe wechseln (board.html:244, 267) | – | gfweekly:`update` (board_lane, status) | sofort speichern | Toast „Verschoben nach …“ |
| F-board-15 | Panel: „Speichern & schließen“ (board.html:259, 268) | – | gfweekly:`update` | Formular speichern | Fehler: Statuszeile + Toast |
| F-board-16 | Panel: „heute besprochen“ (board.html:261, 270) | title= „Setzt zuletzt besprochen auf heute“ | gfweekly:`update` (last_discussed) | sofort speichern | Toast |
| F-board-17 | Panel: Thema löschen (board.html:262, 271) | Bestätigung per `confirm()` | gfweekly:`delete` | sofort speichern (endgültig) | Fehler-Toast „Fehler: …“ |
| F-board-18 | Panel schließen (board.html:275-281) | Escape (board.html:282), Klick auf Hintergrund; bei Speicherfehler `confirm()` „Trotzdem schließen?“ (board.html:276) | – | – | – |
| F-board-19 | Bereinigen: Marker im Text („Titel:“, „Vorschlag:“ …) in Felder aufteilen, Vorher/Nachher-Vergleich, editierbar (board.html:287-310) | Knopf im Panel mit Hinweis-Markierung und title= mit gefundenen Markern (board.html:273) | lokal `gfTidyTopic` (core.js), dann gfweekly:`update` | Formular speichern | „Nichts aufzuteilen“; Übernehmen deaktiviert mit title= (board.html:300); Fehler-Toast |
| F-board-20 | KI-Vorschlag im Bereinigen-Dialog (board.html:311-315) | title= „Claude teilt den Text …“ | gfweekly:`tidy_suggest` (Anthropic) | nach außen wirkend (KI/Anthropic), Übernahme erst per Formular | „Claude liest …“; Fehler im Dialog, eigener Text bei fehlendem API-Schlüssel (board.html:314) |
| F-board-21 | „Aufräumen“: Liste aller Themen mit Markern, Zähler-Badge (board.html:49, 285-286, 317-328) | title= am Knopf; Zähler nur wenn >0 | lokal `gfTidyTopic` | liest (öffnet F-board-19) | leer: „Alles aufgeräumt.“ |
| F-board-22 | Neues Thema anlegen (board.html:48, 345) | Titel über `prompt()` | gfweekly:`add` (created_by = gfWho, Spalte zu_besprechen) | sofort speichern | Fehler-Toast |
| F-board-23 | Knopf „Besprechung“ (Link zu besprechung.html) (board.html:50) | title= | – | – | – |
| F-board-24 | Fortsetzen einer alten, lokal gespeicherten Besprechung (Timer, ◀ ▶, Ergebnis-Knöpfe, Protokoll) (board.html:364-469) | nur sichtbar, wenn localStorage `gf_meeting` noch einen Stand hat; Start selbst nicht mehr erreichbar (board.html:470, `startMeet` ohne Auslöser) | gfweekly:`update`, `decision_add`, `session_end`; localStorage `gf_meeting` | fachlich bestätigen (Entscheidung ins Log) | Pflichtprüfung Entscheidung per Toast (board.html:444); Fehler-Toast; 1-s-Timer (board.html:427) |
| F-board-25 | Protokoll nach Besprechungsende im Textdialog: Kopieren, „Per Mail senden“ (mailto), Link Entscheidungslog (board.html:468) | – | core.js `gfTextModal`, `score_event` beim Mail-Klick (core.js:330) | nach außen wirkend (Clipboard, Mail-Link) | Ausgang: Speicherfehler des Protokolls als Toast (board.html:466), Dialog erscheint trotzdem. **Seit dem Pilot (W-21):** wie F-besprechung-15 |

---

### 3.6 cockpit.html · Themen · Liste
**Hauptaufgabe:** Alle Themen ausführlich als gefilterte Liste mit aufklappbaren Details, Delegation, Status und einem Tagesprotokoll.
**Darstellungsformen:** Kennzahlenkacheln mit Fortschrittsring, Karten (wiederkehrende Themen, „Was als Nächstes“), Liste gruppiert nach Status, aufklappbare Details, Dropdown (Delegation), Formularzeile, Dialog (Protokoll), feste Fußleiste.
**Navigation/Einstieg:** `gfMountTopbar("themen")`, `gfMountSubnav("liste")` (cockpit.html:94). Keine URL-Parameter.

| ID | Fähigkeit / Auslöser | Verborgener Zugang | Datenquelle | Speicherwirkung | Zustände |
|---|---|---|---|---|---|
| F-cockpit-01 | Laden von Personen, Themen, Links (cockpit.html:92-109) | – | gfweekly:`people_list`, `list`, `links_all` | liest | laden: „lädt …“ (cockpit.html:72); Fehler beim Laden nicht abgefangen, Liste bleibt auf „lädt …“ (cockpit.html:98, 105-106); leer: „Noch keine Themen“ (cockpit.html:241) |
| F-cockpit-02 | Kennzahlen Fortschritt/Offen/In Klärung/Wiederkehrend (cockpit.html:112-123) | – | lokal aus `list` | liest | – |
| F-cockpit-03 | Wiederkehrende Check-in-Themen als Karten, aufklappbar (cockpit.html:174-194) | Klick auf Titelbereich (div `.rec-main.js-toggle`, nicht fokussierbar, cockpit.html:180, 257) | lokal | liest | Bereich verborgen, wenn leer (cockpit.html:176) |
| F-cockpit-04 | „✓ heute besprochen“ an wiederkehrenden Themen (cockpit.html:187, 261) | – | gfweekly:`update` (last_discussed) | sofort speichern | Toast; Fehler-Toast „Speichern fehlgeschlagen“ ohne Grund (cockpit.html:276) |
| F-cockpit-05 | „Was als Nächstes“: drei offene Themen höchster Priorität, Klick springt zur Karte und klappt sie auf (cockpit.html:197-203) | Klick auf div `.next` ohne button/tabindex (cockpit.html:200-202); Hover-Anhebung (styles.css:196) | lokal | liest | Bereich verborgen, wenn leer |
| F-cockpit-06 | Suche (cockpit.html:54, 285) | – | lokal | liest | „Keine Treffer“ mit „Filter zurücksetzen“ (cockpit.html:242-243) |
| F-cockpit-07 | Statusfilter Alle/Offen/In Klärung/Erledigt (cockpit.html:55-60, 283) | – | lokal | liest | – |
| F-cockpit-08 | Personenfilter als Chip-Reihe inkl. „Von Claude“ (cockpit.html:100-104) | – | lokal (`gfAssignable`) | liest | – |
| F-cockpit-09 | Prioritätsfilter als Chip-Reihe (cockpit.html:62, 284) | – | lokal | liest | – |
| F-cockpit-10 | Aktualisieren ↻ (cockpit.html:63, 286) | nur Symbol, title= „Aktualisieren“ | gfweekly:`list`, `links_all` | liest | Toast „Aktualisiert“ / „Fehler“ |
| F-cockpit-11 | Neues Thema mit Priorität hinzufügen (cockpit.html:65-71, 280-282) | Tastatur Enter im Titelfeld (cockpit.html:282); Feld nur mit Platzhalter, ohne Label (cockpit.html:67) | gfweekly:`add` | sofort speichern | Toast „Thema hinzugefügt“ / „Konnte nicht hinzufügen“ |
| F-cockpit-12 | Karte auf-/zuklappen (cockpit.html:221-233, 257) | Klick auf Titel-div, Unterzeile, span „▸ Details“, div `.chev` (alle nicht fokussierbar) | lokal | liest | – |
| F-cockpit-13 | Erledigt-Haken an der Karte (cockpit.html:219, 258) | title= „Als erledigt markieren“ | gfweekly:`update` (status) | sofort speichern | „✓ gespeichert“ blendet kurz ein (cockpit.html:167, 275); Fehler-Toast |
| F-cockpit-14 | Priorität per Klick auf Prioritäts-Pill reihum wechseln (hoch→mittel→niedrig) (cockpit.html:224, 260) | verborgen: span mit Klick-Handler, nur title= „Priorität ändern“ | gfweekly:`update` (priority) | sofort speichern | wie F-cockpit-13 |
| F-cockpit-15 | Status in den Details per Chip-Reihe (cockpit.html:166, 259) | – | gfweekly:`update` (status) | sofort speichern | wie F-cockpit-13 |
| F-cockpit-16 | Delegation: Dropdown mit Personen-Haken (cockpit.html:130-146, 263-266, 271) | Untermenü (dd-pop), schließt bei Klick irgendwo; kein Escape | gfweekly:`update` (delegate_to) | sofort speichern je Haken | wie F-cockpit-13; „Keine Personen im Verzeichnis“ |
| F-cockpit-17 | Delegations-Nachricht kopieren (cockpit.html:143, 267) | – | core.js `gfDelegationMsg`, `gfCopy` | nach außen wirkend (Clipboard) | Toast „In die Zwischenablage kopiert“ (auch bei verweigertem Zugriff, da nicht abgewartet) |
| F-cockpit-18 | Asana-Text (fällig morgen) kopieren (cockpit.html:144, 268) | – | core.js `gfAsanaText`, `gfCopy` | nach außen wirkend (Clipboard, keine Asana-API) | wie F-cockpit-17 |
| F-cockpit-19 | Verknüpfte Dokumente je Thema anzeigen (cockpit.html:158-160) | externe Links target=_blank | `links_all` | liest | leer: Hinweis auf „Bearbeiten“ |
| F-cockpit-20 | Link „alle Felder bearbeiten ›“ zu bearbeiten.html (cockpit.html:168) | – | – | – | – |
| F-cockpit-21 | „Protokoll von heute“ (feste Fußleiste) aus heute als besprochen markierten Themen; Textdialog mit Kopieren und „Per Mail senden“ (cockpit.html:76-78, 287-292) | Teilnehmende fest „Alex, Lea“ (cockpit.html:292); ohne Treffer Dialog mit Link `board.html?meeting=1` (cockpit.html:289) | lokal, core.js `gfProtocolText`, `gfTextModal`; `score_event` beim Mail-Klick | nach außen wirkend (Clipboard, Mail-Link) | leer: eigener Hinweistext im Dialog |

---

### 3.7 entscheidungen.html · Heute · Entscheidungen
**Stand 25.10.2026 (Stufe 1, S1-01):** Entscheidungsliste der GF (Kacheln, Abschnitte, drei Knöpfe je Zeile, Rückgängig, Bearbeiten); Beschlüsse, Protokolle und Wochenmail als Klappe; Abzeichen entfallen. Die Zeilen unten beschreiben den Stand vor Stufe 1.
**Hauptaufgabe (bis 25.10.2026):** Entscheidungslog nach Monaten, Besprechungsprotokolle und Abzeichen zeigen, Entscheidungen nachtragen/bearbeiten und eine Wochenmail erzeugen.
**Darstellungsformen:** Kennzahlenleiste, Liste gruppiert nach Monat (Zeilen), Inline-Formular, Liste der Besprechungen, Abzeichenleiste (Bildraster), Dialog (Protokoll, Wochenmail).
**Navigation/Einstieg:** `gfMountTopbar("themen")`, `gfMountSubnav("entscheidungen")` (entscheidungen.html:201). Sprungmarke `#abzeichen` (entscheidungen.html:54; verlinkt aus jahr.html:340). Keine URL-Parameter.

| ID | Fähigkeit / Auslöser | Verborgener Zugang | Datenquelle | Speicherwirkung | Zustände |
|---|---|---|---|---|---|
| F-entscheidungen-01 | Laden von Entscheidungen, Besprechungen, Themen (entscheidungen.html:72-78) | – | gfweekly:`decisions_list` (limit 1000), `sessions_list` (60), `list` | liest | laden: „lädt …“ (entscheidungen.html:49, 52); Fehler: nur Log zeigt „Fehler beim Laden“, Besprechungsbereich bleibt auf „lädt …“ (entscheidungen.html:77); leer: Bildfläche „Noch keine Entscheidungen im Zeitraum“ (entscheidungen.html:102) |
| F-entscheidungen-02 | Kennzahlen Entscheidungen/letzte 7 Tage/Besprechungen/zu besprechen (entscheidungen.html:97-101) | – | lokal | liest | – |
| F-entscheidungen-03 | Suche (entscheidungen.html:39, 195) | Taste `/` (entscheidungen.html:196) | lokal | liest | „Nichts gefunden.“ |
| F-entscheidungen-04 | Zeitraum 30 Tage/Quartal/Jahr/Alle (entscheidungen.html:40-45, 197) | – | lokal | liest | – |
| F-entscheidungen-05 | Link vom Eintrag zum Thema im Board (entscheidungen.html:117) | Direktlink `board.html?topic=` | – | – | – |
| F-entscheidungen-06 | Entscheidung nachtragen (Inline-Formular Datum, Thema, Entscheidung, Schritt, Verantwortung) (entscheidungen.html:46, 124-135, 143-150, 198) | title= „Entscheidung ohne Board-Thema nachtragen“ | gfweekly:`decision_add` (decided_by = gfWho; vergibt Taler) | fachlich bestätigen (Eintrag ins Entscheidungslog) | Pflichtfelder per HTML `required`; Toast „Gespeichert“/„Fehler: …“ |
| F-entscheidungen-07 | Entscheidung bearbeiten (✎) (entscheidungen.html:121, 139, 146) | Symbolknopf nur mit title= „Bearbeiten“ | gfweekly:`decision_update` | Formular speichern | Fehler-Toast; keine Konfliktprüfung |
| F-entscheidungen-08 | Entscheidung löschen (✕) (entscheidungen.html:121, 141) | Symbolknopf nur mit title=; `confirm()` | gfweekly:`decision_delete` | sofort speichern (endgültig) | Fehler-Toast |
| F-entscheidungen-09 | Text aufklappen „mehr“ (gfClamp) (entscheidungen.html:118) | – | localStorage `gf_open_d<id>` | liest | – |
| F-entscheidungen-10 | Besprechungen: Protokoll öffnen im Textdialog, kopieren, per Mail (entscheidungen.html:157-162) | – | `sessions_list`; core.js `gfTextModal`; `score_event` beim Mail-Klick | nach außen wirkend (Clipboard, Mail-Link) | leer: „Noch keine abgeschlossene Besprechung“ (entscheidungen.html:155); fehlender Text: „(kein Protokolltext gespeichert)“ |
| F-entscheidungen-11 | Besprechung samt Protokoll löschen (entscheidungen.html:160, 163) | Symbolknopf ✕ nur title=; `confirm()` | gfweekly:`session_delete` | sofort speichern (endgültig) | Fehler-Toast |
| F-entscheidungen-12 | Wochenmail-Entwurf erzeugen (Entscheidungen 7 Tage, hohe Prio, Zähler, Meilensteine 30 Tage, nächster Übergang, Habitat-Punkte) (entscheidungen.html:167-193, 202-203) | Knopf im Kopfbild | gfweekly:`milestones_list`, `cycle_get`, lokal; `score_event` {kind:"wochenmail"} schon beim Erzeugen (entscheidungen.html:191) | nach außen wirkend (Clipboard, Mail-Link); Taler-Ereignis sofort gespeichert | Fehler bei Meilensteinen still übergangen (entscheidungen.html:171) |
| F-entscheidungen-13 | Link „Besprechung starten“ (`board.html?meeting=1`, leitet weiter) (entscheidungen.html:202) | – | – | – | – |
| F-entscheidungen-14 | Abzeichenleiste: 19 Abzeichen, erreichte farbig, Datum/Person (entscheidungen.html:81-86) | Details (Datum, Person) teils nur im title= (entscheidungen.html:84) | Ereignis `gf-game` aus game.js | liest | gesperrte Abzeichen „offen“ |

---

### 3.8 inbox.html · Inbox (Archiv)
**Hauptaufgabe:** Alte Eingänge aus der früheren Inbox ansehen und ins Board übernehmen oder verwerfen (seit 13.09.2026 nur noch Altbestand, Hinweis 32).
**Darstellungsformen:** Liste von Eingangskarten mit KI-Vorschlag, Titel- und Prioritätsauswahl.
**Navigation/Einstieg:** nicht in der Seitenleiste; `gfMountTopbar("themen")` (inbox.html:46) markiert „Themen“. Erreichbar über Link `/inbox` aus capture.html:59. Kein Hero.

| ID | Fähigkeit / Auslöser | Verborgener Zugang | Datenquelle | Speicherwirkung | Zustände |
|---|---|---|---|---|---|
| F-inbox-01 | Laden der Eingänge (47) | – | gfweekly:`inbox_list` | liest | „lädt …“ (37); leer „Inbox leer“ (54); Ladefehler beim Start nicht abgefangen |
| F-inbox-02 | „↻ Aktualisieren“ (34, 48) | – | gfweekly:`inbox_list` | liest | Toast „Aktualisiert“ / „Fehler“ |
| F-inbox-03 | KI-Vorschlag je Eingang anzeigen (58–62) | „prüfen“-Kennzeichen | aus `inbox_list` (KI-Klassifikation läuft serverseitig „alle 30 Min“, Text 62) | liest | ausstehend: „Wird automatisch vorsortiert …“ (62) |
| F-inbox-04 | Titel bearbeiten und Priorität wählen (68–69) | Titelfeld nur mit Platzhalter; natives `<select>` ohne Label | – | – | – |
| F-inbox-05 | „✓ Ins Cockpit übernehmen“ (70, 74) | – | gfweekly:`inbox_promote` (legt Thema an) | fachlich bestätigen | Toast „Ins Cockpit übernommen ✓“ / „Übernehmen fehlgeschlagen“ |
| F-inbox-06 | „Verwerfen“ (70, 75) | `confirm()` | gfweekly:`inbox_reject` | fachlich bestätigen | Toast „Verworfen“ / „Fehler“ |

---

### 3.9 jahr.html · Jahr
**Hauptaufgabe:** Jahresüberblick mit Begrüßung, Laufband, Team- und Plattformlage, Habitat-Punkten, Jahreszyklus, Kennzahlen, Meilensteinen, wichtigsten Themen, Ritualen und Schnellzugriff.
**Darstellungsformen:** Kopfbild, Laufband, aufklappbare Abschnitte (details) mit Zeilen und Mini-Balkendiagrammen (Team), Plattformkarten mit KPI-Kacheln, Punktekarten mit Fortschrittsbalken, Zeitleiste/Jahresband (Kalenderstreifen mit Markern), Kennzahlenkacheln, Karten (Meilensteine, Themen, Schnellzugriff), Checkliste (Rituale) mit Phasen-Tabs, Inline-Formular.
**Navigation/Einstieg:** `gfMountTopbar("jahr")` (jahr.html:360). Keine URL-Parameter; verlinkt auf `entscheidungen.html#abzeichen` (jahr.html:340).

| ID | Fähigkeit / Auslöser | Verborgener Zugang | Datenquelle | Speicherwirkung | Zustände |
|---|---|---|---|---|---|
| F-jahr-01 | Begrüßung „Guten Tag, <Person>“ mit Datum und Phase, Kopfbild nach Habitat-Stufe (jahr.html:361-370, 315) | Personenwechsel in der Seitenleiste ändert Gruß (Ereignis `gf-who`, jahr.html:365) | localStorage `gf_level`, gfWho | liest | – |
| F-jahr-02 | Laufband Neuigkeiten (jahr.html:39, 372-373) | hält bei Berührung, Pause-Knopf, Klick öffnet Detaildialog (core.js `gfMountBand`) | gfweekly:`news_list` {kinds:["ticker"]} | liest | verborgen bei leer oder Fehler (core.js:512) |
| F-jahr-03 | Team, letzte 3 Monate: Kreise Team/GF/Partner/Support, Zeile aufklappen, Link zur Analyse (jahr.html:42, 372) | Details in title= der Balken (core.js:550, 555); Abschnitt auf-/zuklappbar, Zustand gemerkt | externe Funktion `tpa`:`overview`; localStorage `gf_team_circle`, `gf_nw_team` | liest | „lädt …“; Fehlertext oder Hinweis bei fremdem Passwort (core.js:608) |
| F-jahr-04 | Plattformen, letzte 7 Tage: zwei Karten mit Kacheln, Briefing, Ereigniszeilen aufklappbar (jahr.html:43, 372) | Ereignisart nur in title= der Zeile (core.js:627) | gfweekly:`platform_digest`, `news_list` {kinds:["lage"]}; localStorage `gf_nw_platforms` | liest | Skelett; Fehlertext; „Noch kein Briefing-Absatz“ |
| F-jahr-05 | Habitat-Punkte: Jahrestopf, Stufe, Tag/Serie, Woche/Rang, Abzeichen (jahr.html:313-347) | Abzeichen-Namen nur in title=/alt (jahr.html:343); Karte „Abzeichen“ verlinkt `entscheidungen.html#abzeichen` | Ereignis `gf-game` (game.js) | liest | ohne Daten nicht gerendert |
| F-jahr-06 | Zyklus: aktuelle Phase mit Woche, nächster Übergang, Legende, Jahresband mit heute-Marke, Übergangs- und Meilensteinmarken (jahr.html:129-170) | Übergangsbeschreibung und Meilensteintitel nur per title=/Hover (jahr.html:137, 140; Hinweis „Titel beim Zeigen“ jahr.html:163); unter 600 px Beschriftungen ausgeblendet (styles.css:489, 548) | gfweekly:`cycle_get`, `milestones_list` | liest | laden „lädt …“; Fehler „Zyklus konnte nicht geladen werden“ (jahr.html:371) |
| F-jahr-07 | Jahr vor/zurück, „zurück zu <Jahr>“ (jahr.html:159-162, 171-173) | Pfeilknöpfe ← → nur mit title= „Vorjahr/Folgejahr“ | lokal | liest | – |
| F-jahr-08 | Kennzahlen Priorität hoch, Offene Themen, Nächster Meilenstein, Zu besprechen (Link Board) mit Hochzählen (jahr.html:299-304) | – | gfweekly:`list` | liest | Hochzählen ohne Bewegung bei reduzierter Bewegung (core.js:274) |
| F-jahr-09 | Meilensteine anzeigen, „alle“ / „nur offene“ (jahr.html:58, 211-214, 275) | title= „Auch erreichte und abgesagte anzeigen“ | gfweekly:`milestones_list` {all} | liest | Fehler „Fehler beim Laden“ (jahr.html:213); leer mit Bildfläche (jahr.html:257); bei Zyklusfehler bleibt Bereich auf „lädt …“ (jahr.html:63, 367-371) |
| F-jahr-10 | Meilenstein-Link öffnen (jahr.html:219) | externer Link | – | – | – |
| F-jahr-11 | Bearbeitungsmodus ein/aus (Meilensteine und Rituale) (jahr.html:59, 274) | title= | lokal | – | – |
| F-jahr-12 | Meilenstein anlegen/bearbeiten: Titel, Strang, Status, Datum von/bis, Zeitraum-Text, Verantwortung, Beschreibung, Link, Reihenfolge (jahr.html:60, 228-249, 265-269, 276) | ✎ nur im Bearbeitungsmodus, nur title= | gfweekly:`milestone_save` (updated_by = gfWho) | Formular speichern | `required` Titel; Fehler-Toast |
| F-jahr-13 | Meilenstein löschen (jahr.html:246, 271) | `confirm()` | gfweekly:`milestone_delete` | sofort speichern (endgültig) | Fehler-Toast |
| F-jahr-14 | Wichtigste Themen (Priorität hoch), Karte verlinkt ins Board (jahr.html:279-307) | Direktlink `board.html?topic=` | gfweekly:`list` | liest | leer „Keine Themen mit Priorität hoch offen.“; Fehler (jahr.html:307) |
| F-jahr-15 | Rituale: Phase wählen (Tabs) (jahr.html:180-181) | – | `cycle_get` | liest | leer „Noch keine Rituale für diese Phase.“ |
| F-jahr-16 | Ritual abhaken/Haken entfernen (jahr.html:188-202) | ganze Zeile ist Label; Stempelbild nur mit title= | gfweekly:`ritual_toggle` (done_by = gfWho) | sofort speichern | Toast; Fehler setzt Haken zurück (jahr.html:201) |
| F-jahr-17 | Ritual anlegen (nur im Bearbeitungsmodus) (jahr.html:76-79, 207-208) | Tastatur Enter; Feld nur mit Platzhalter (jahr.html:77) | gfweekly:`ritual_save` | sofort speichern | Fehler-Toast |
| F-jahr-18 | Ritual entfernen (für alle Jahre) (jahr.html:192, 203) | ✕ nur im Bearbeitungsmodus, title=; `confirm()` | gfweekly:`ritual_delete` | sofort speichern (endgültig) | Fehler-Toast |
| F-jahr-19 | Schnellzugriff: bis zu sechs aktive Seiten aus Bereich „Steuerung“ (jahr.html:350-356) | – | gfweekly:`sites_list` | liest | Fehler leert Bereich still (jahr.html:355); leer-Hinweis |
| F-jahr-20 | Kopfbild-Knöpfe „Thema erfassen“, „Board öffnen“ (jahr.html:364) | – | – | – | – |

---

### 3.10 saison.html · Saison 2026/27 (vier Fragen)
**Hauptaufgabe:** Die Saison in vier festen Fragen zeigen (Phase und Herausforderung, wen wir haben, was sich geändert hat, wann was passieren kann) und daraus Besetzung je Bereich/Festival pflegen, bestätigen und den Launch je Festival nach Asana starten.
**Darstellungsformen:** Bild-Kopf, Phasenleiste (Zeitbalken mit Heute-Marke, role=img), Phasenliste, KPI-Kacheln, Liste „Diese Woche entscheiden“, aufklappbare Blöcke (`details`), Besetzungstafel als Raster mit `select` je Feld, Lastliste mit Balken und Stepper, Tabelle „Bisher und jetzt“, Änderungsliste, je Festival ein Block mit kritischer Kette, Hebel-Kacheln, Vorschau-Block „Launch starten“, Wochenplan-Liste.
**Navigation/Einstieg:** nav-Schlüssel `saison` (505). Liest keine URL-Parameter. Verlinkt auf `launch.html?festival=…&weg=1..4` (434) und `launch.html?festival=…` (339, 428). Hinweise auf saison-steckbriefe.html und saison-rad.html nur als Text (226).

| ID | Fähigkeit / Auslöser | Verborgener Zugang | Datenquelle | Speicherwirkung | Zustände |
|---|---|---|---|---|---|
| F-saison-01 | Saisondaten laden und alles rechnen (Launch-Pläne, Meilensteine, Pool, Besetzung, Richtwerte, Protokoll) (483–494) | – | gfweekly:`launch_list`; Rechenlogik `LaunchLogik` (launch-logik.js) | liest | laden: „lädt …“ (177); leer: „Im Cockpit liegen keine Launch-Pläne für 2027.“ (487); Fehler: „Fehler beim Laden: …“ (493) |
| F-saison-02 | Frage 1: Phasenleiste mit Heute-Marke, fünf Phasen mit Stand, Lagesatz, fünf KPI-Kacheln (350–370) | Phasenname/Zeitraum je Segment nur im title= (357); KPI-Details (welche Festivals) nur im title= der Kacheln (365–369) | abgeleitet | liest | – |
| F-saison-03 | „Diese Woche entscheiden“: offene Besetzung, unhaltbare VVK-Starts, Datenwidersprüche (371–373) | – | abgeleitet | liest | leer: „nichts …“ (373) |
| F-saison-04 | Aufklappblock „Die Phase im Detail“ (Ziel, Herausforderung, Teamweise, Fertig-wenn, andere Phasen) (183–186, 374–380) | `details`/`summary` | statische Konstante SA_PHASEN (245–271) | liest | – |
| F-saison-05 | Frage 2: Besetzungstafel – je Bereich und Festival Person wählen (`select` mit Gruppen Team / Hilfe / GF, „offen“) (384–392, 492) | Quelle und Notiz nur im title= des Feldes (389) und als deaktivierte erste Option (345) | gfweekly:`launch_set` (event_id, bereich, person_id) | sofort speichern (setzt Status „Vorschlag“) | Toast mit Ergebnis; Fehler: Toast „Fehler: …“ und Neuladen (454–455); kein Versionsschutz (letzter Schreiber gewinnt) |
| F-saison-06 | „Besetzung bestätigen als <Person>“ je Festival (391, 483–487) | Anzahl der Vorschläge nur im title= (391); deaktiviert ohne Vorschläge | gfweekly:`launch_confirm` | fachlich bestätigen | `confirm()`-Abfrage (485); Server 403 außer Alex/Lea; Toast mit Zahlen und Fehlerzahl |
| F-saison-07 | Aufklappblock „Wer trägt wie viel“: Last je Person mit Balken und Wort (passt/knapp/zu viel) (193–199, 394–404) | – | abgeleitet | liest | leer: „Niemand hat Aufgaben bis in 60 Tagen.“ (403) |
| F-saison-08 | Stunden je Woche je Person (Stepper −/+ und Eingabe, 0–80) (402, 493–494) | Grenzen nur im title= des deaktivierten Knopfs (core.js:59) | gfweekly:`launch_set` (person_id, launch_std_woche) | sofort speichern (Autosave nach 700 ms) | Toast „Stunden je Woche gespeichert“; Fehler Toast |
| F-saison-09 | Frage 3: Tabelle „Bisher und jetzt“ je Bereich mit Markierung geändert/neu/offen und Begründung (407–415) | Quelle/Notiz je Festival nur im title= (412) | abgeleitet aus `launch_list` (vorher, besetzung) | liest | – |
| F-saison-10 | Aufklappblock „Änderungen seit dem Sommer“ (Protokoll seit 30.09.2026, max. 30) (206–209, 416–417) | – | `launch_list` (log) | liest | leer: „Noch keine Änderungen …“ (417) |
| F-saison-11 | Frage 4: je Festival kritische Kette, Haltbarkeitssatz, nächste fällige Aufgaben (laufende Festivals) (421–440) | – | abgeleitet | liest | Hinweise je Festival als Warnblock (423) |
| F-saison-12 | Hebel-Kacheln Parallel / Verschieben / Hilfe / Entscheiden öffnen launch.html mit passendem Weg (433–434, 438) | Direktlink `launch.html?festival=…&weg=n` | – | liest | nur sichtbar, solange das Festival noch nicht in Asana ist (438) |
| F-saison-13 | „Launch starten: Aufgaben nach Asana“ / „Erneut senden …“ öffnet Vorschau-Block (327–332, 459) | Grund für deaktivierten Knopf nur im title= (331) | `LaunchLogik.versandVorschau` | – | deaktiviert ohne Aufgabe mit Person und Asana-Konto |
| F-saison-14 | Vorschau: „Wer bestätigt und startet“ (Chips Alex/Lea, unabhängig von der aktiven Person) und „Jetzt starten als …“ / „Abbrechen“ (317–326, 465–482, 490) | Bestätigende Person frei wählbar in der Vorschau (325) | gfweekly:`launch_confirm`, dann `launch_send` | nach außen wirkend (Asana-Aufgaben anlegen/aktualisieren) plus fachlich bestätigen | `confirm()` (468); Knopf „startet …“; bestätigen mit Fehlern → nicht gesendet, Warnblock (472–475, 329); fehlendes Asana-Token: Hinweis (324) |
| F-saison-15 | Ergebnis aus Asana je Festival: seit wann, Anzahl, Personen, Hinweise, Link „in Asana öffnen“ (301–316, 333–340) | Hinweise aus dem Versand in `details` | `launch_list` (Meilensteine, log) | liest | Abbruchhinweis bei Bestätigungsfehlern (336) |
| F-saison-16 | „Stand aus Asana holen“ (201, 461–464) | – | gfweekly:`launch_sync` | nach außen wirkend (liest Asana, schreibt Stand ins Haus) | Knopf „holt …“; Statuszeile mit letztem Abgleich, Warnung wenn Rückweg >2 h alt (441–445); Fehler Toast |
| F-saison-17 | Aufklappblock „Wochenplan bis Jahresende“, Wochen mit drei Launches gerahmt (203–223, 446–447) | – | abgeleitet | liest | leer: „Bis Jahresende ist kein offener Meilenstein fällig.“ |

---

---

### 3.11 saison-rad.html · Saison (Jahresrad, ohne Menüeintrag)
**Hauptaufgabe:** Jahresrad bzw. Zeitleiste der Festivalsaison ab 1. Oktober, in dem Alex und Lea Elemente und Zeilen anlegen, bearbeiten und abstimmen (Vorschlag / abgestimmt / strittig).
**Darstellungsformen:** Bild-Kopf, Umschalter Jahresrad (SVG-Kreisdiagramm) / Zeitleiste (SVG-Balken), Ebenen-Checkboxen, Statuszeile, Infozeile, Legende, Zeilen-Chips, Liste „Zur Abstimmung“, Verlaufsliste, seitliches Bearbeitungspanel (Formular) mit Hintergrund.
**Navigation/Einstieg:** kein eigener Navigationseintrag; `gfMountTopbar("saison")` markiert „Saison“ (322). Nur per Direkt-URL erreichbar (Textverweise saison.html:226, saison-steckbriefe.html:309). Keine URL-Parameter.

| ID | Fähigkeit / Auslöser | Verborgener Zugang | Datenquelle | Speicherwirkung | Zustände |
|---|---|---|---|---|---|
| F-saison-rad-01 | Zeilen, Elemente und Verlauf laden (313–326) | – | saison:`get`, saison:`log` | liest | laden: Skelett (324); Fehler: „Die Saison ließ sich nicht laden: …“ (325); Verlaufsfehler still → leer (313) |
| F-saison-rad-02 | Ansicht Jahresrad / Zeitleiste (62, 305) | gemerkt in localStorage `gf_sz_view` (120) | lokal | liest | – |
| F-saison-rad-03 | Ebenen 1–3 ein-/ausblenden, „nur offene“ (abgestimmte abdunkeln) (63–66, 306–307) | – | lokal | liest | keine Ebene: „Keine Ebene gewählt“ im SVG (154) |
| F-saison-rad-04 | Element im SVG anklicken öffnet Bearbeitungspanel (143) | SVG-`path`/`rect`/`circle` mit click, nicht fokussierbar, keine Tastaturbedienung | lokal | – | – |
| F-saison-rad-05 | Element im SVG überfahren zeigt Details in der Infozeile (143, 188–192) | nur Hover (`mouseenter`), kein Fokus-Äquivalent; Hover-Hervorhebung (styles inline 24) | lokal | liest | Infozeile behält letzten Inhalt |
| F-saison-rad-06 | Zeilenname in der Zeitleiste anklicken öffnet Zeilenpanel (177) | SVG-`text` mit click, nicht fokussierbar | lokal | – | – |
| F-saison-rad-07 | Statuszeile „n von m abgestimmt · strittig“ (193–196) | – | abgeleitet | liest | Symbol plus Wort |
| F-saison-rad-08 | Zeilen-Chips „Zeilen bearbeiten“ öffnen Zeilenpanel (200, 309) | – | lokal | – | – |
| F-saison-rad-09 | Liste „Zur Abstimmung“ (nicht abgestimmte Elemente je Zeile, Notizen Alex/Lea) öffnet Element (202–215, 308) | – | lokal | – | leer: „Alles abgestimmt …“ (205) |
| F-saison-rad-10 | „Neues Element“ → Panel mit Titel, Status, von/bis, Zeile, Kategorie, Darstellung, Anker, Beschreibung, Anmerkungen Alex/Lea → „Anlegen“ (231–263, 310) | Fokus ins Titelfeld nur beim Neuanlegen (260) | saison:`item_save` | Formular speichern | Ende vor Anfang: Toast (266); Fehler Toast; nach Anlegen öffnet sich das Element zum Weiterbearbeiten (275) |
| F-saison-rad-11 | Bestehendes Element bearbeiten: Autosave 700 ms nach jeder Eingabe; Speichern auch beim Schließen (227, 242–243) | kein Speichern-Knopf; Zustand nur als Text „Ungespeichert … / Gespeichert / Fehler“ im Fuß (252, 256, 272) | saison:`item_save` | sofort speichern | kein Versionsschutz (Server prüft nur Datumsreihenfolge, saison/index.ts:105–136); kein role=status an der Zustandszeile |
| F-saison-rad-12 | Element entfernen (252, 258) | – | saison:`item_delete` | sofort speichern (Löschen) | `confirm("Dieses Element entfernen?")`; Toast „Entfernt“ |
| F-saison-rad-13 | „Neue Zeile“ / Zeile bearbeiten: Name, Ebene, Art, VVK-Start, Verkaufsziel, Festivaltermine, Notiz → „Speichern/Anlegen“ (266–302, 311) | Termine verknüpfter Zeilen nur lesbar, Grund im title= (285) | saison:`row_save` | Formular speichern | Toast „Gespeichert, n Termine mitverschoben“ (299); Plattform-Termine: Server 409 mit Hinweis (saison/index.ts:157, 180) |
| F-saison-rad-14 | „Element in dieser Zeile“ (297, 300) | – | – | – | – |
| F-saison-rad-15 | Zeile entfernen inkl. aller Elemente (297, 301) | – | saison:`row_delete` | sofort speichern (Löschen) | `confirm()`; Toast „Zeile entfernt“ |
| F-saison-rad-16 | Panel schließen: ✕, Klick auf Hintergrund, Escape (213–215) | Tastatur Escape | – | löst ggf. Autosave aus (213) | kein Fokus ins Panel beim Bearbeiten, keine Fokusfalle, kein Fokusrückweg |
| F-saison-rad-17 | Verlauf „Zuletzt geändert“ (12 Einträge) (217–221) | – | saison:`log` | liest | leer: „Noch keine Änderungen.“ |

---

---

### 3.12 saison-steckbriefe.html · Saison, Steckbriefe (V26, ohne Menüeintrag)
**Hauptaufgabe:** Nachschlageseite mit den fünf Saisonphasen als Steckbriefe in Worten; Phase-Stand, nächste Termine und Launch-Stand werden aus dem heutigen Datum gerechnet.
**Darstellungsformen:** Bild-Kopf, Phasen-Wortkette (Ankerlinks), Terminliste, Warnhinweis, aufklappbare Steckbriefe (`details`, verschachtelt), Schrittlisten, zwei statische Tabellen.
**Navigation/Einstieg:** kein Navigationseintrag; `gfMountTopbar("saison")` (382). Nur per Direkt-URL (Textverweis saison.html:226). Anker `#p1` bis `#p5` (131–135); die Seite wertet `location.hash` beim Laden nicht aus, nur der Klick in der Wortkette öffnet den Steckbrief (379).

| ID | Fähigkeit / Auslöser | Verborgener Zugang | Datenquelle | Speicherwirkung | Zustände |
|---|---|---|---|---|---|
| F-saison-steckbriefe-01 | Seite nach Passwort zeigen und Datumslogik rechnen (367–385) | Passwort-Gate, obwohl die Seite selbst keine Daten lädt (nur `people_list` zur Prüfung, core.js:125) | statisch im HTML und SP_TERMINE (319–335) | liest | – |
| F-saison-steckbriefe-02 | Phasen-Wortkette: Klick springt zum Steckbrief und öffnet ihn (130–136, 379) | Ankerlinks `#p1`–`#p5`; Direktaufruf mit Hash öffnet `details` nicht per Skript | lokal | liest | Markierung „läuft / als Nächstes“ als Text (360) |
| F-saison-steckbriefe-03 | Phasen-Stand je Steckbrief (läuft / beginnt in … / vorbei / später); laufende und nächste Phase automatisch geöffnet (344–362) | – | Datum im Browser (lokale Zeit) | liest | – |
| F-saison-steckbriefe-04 | „Die nächsten Termine“: fünf kommende Termine mit relativer Angabe (364–366) | – | statisch | liest | leer: „Die Saison 2026/27 ist abgeschlossen.“ |
| F-saison-steckbriefe-05 | Engpass-Hinweis Oktober, bis 01.11.2026 sichtbar (142, 366) | – | statisch | liest | – |
| F-saison-steckbriefe-06 | Launch-Tabelle: Stand je Festival aus VVK-Datum gerechnet (199–209, 368–376) | – | statisch | liest | – |
| F-saison-steckbriefe-07 | Aufklappbare Steckbriefe und Unterteile Systembau/Launch/Formatpartner (147–305) | `details`/`summary` | statisch | liest | – |

---

---

### 3.13 kommunikation.html · Kommunikation 2027

**Hauptaufgabe:** Postingplan-Standard für die fünf Festivals aus Sicht der GF zeigen (wer verantwortet die Kommunikation, wo wird es eng, was muss die GF entscheiden) und den Rahmen je Festival nach Asana senden sowie Prüfpunkte (Stufe, Extras, Notiz) entscheiden.
**Darstellungsformen:** Liste (Festivalzeilen `#kmFest`, Entscheidungsliste, Verlauf), Diagramm (gestapeltes SVG-Flächendiagramm Wochenlast mit Stellenlinien und Tooltip), Tabelle (Wochen als Liste, Pflichtveröffentlichungen je Festival, am Handy gestapelt), Karten/Blöcke (`.km-block` je Festival), Zeitleiste (Jahresband mit Phasen und Markern), aufklappbare Bereiche (`details.km-auf`), Inline-Formular (Prüfpunkt), Inline-Vorschaubereich (Versand), Statuszeile/Hinweisband (`#kmMeldung`, `#kmVeraltet`). Kein Dialog.
**Navigation/Einstieg:** `gfMountTopbar("kommunikation")` (kommunikation.html:495); Hero `buehne` (496). Liest keine URL-Parameter oder Hash. Ausgehende Links: `saison.html#saF2` (234, 348), Asana-Projekt (224, 252).

| ID | Fähigkeit / Auslöser | Verborgener Zugang | Datenquelle | Speicherwirkung | Zustände |
|---|---|---|---|---|---|
| F-kommunikation-01 | Seite laden nach Passwort-Gate, alle Bereiche rendern (kommunikation.html:488-498) | – | gfweekly:`komm_list` (489); Rechenlogik `KommLogik` (komm-logik.js) | liest | laden: „lädt …“ in Listen (155, 161, 172); Fehler: `zeigeLadefehler` mit role=alert und „Noch einmal laden“, Satz „Was hier fehlt, ist nicht leer, sondern unbekannt“ (469-477); leer: „Noch nichts berechnet. Die Berechnung läuft täglich …“ (492) |
| F-kommunikation-02 | Kopfzeile „Stand <Datum> · Regelwerk <Version>“ (214) | – | `komm_list.heute`, `regelwerk` | liest | – |
| F-kommunikation-03 | Festivalzeile: Verantwortliche Person mit Status (bestätigt/Vorschlag, „ohne Asana-Konto“), Rahmen-Status in Asana (gesendet/begonnen/unvollständig/abgebrochen), „zu prüfen“-Zähler, nächster Prüfpunkt, Überfälliges, Stunden (212-245) | Unbesetztes Festival nur durch stärkeren Rahmen (`li.offen`, 35) plus Text „Kommunikation nicht besetzt“ | `komm_list.festivals` | liest | leer: „Keine Festivals 2027 gefunden.“ (215); Fußzeile Anzahl ohne Person (246-247) |
| F-kommunikation-04 | Aufklappbare Fehlerliste des letzten Versands je Festival (223) | `details` aufklappen | `festivals[].rahmen.fehler_liste` | liest | nur sichtbar bei Fehlern |
| F-kommunikation-05 | Link „Besetzung ändern in Saison“ (234) | Direktlink mit Hash `saison.html#saF2` | – | liest (Navigation) | – |
| F-kommunikation-06 | Knopf „Rahmen an Asana“ / „Rahmen erneut senden“ öffnet Vorschau inline (239, 388-393, 431); zweiter Klick schließt | Toggle über denselben Knopf, `aria-expanded` | gfweekly:`komm_send` mit `vorschau:true` (390) | liest (Vorschau rechnet nur) | laden: „Vorschau wird gerechnet …“ role=status (250); Fehler: role=alert mit Schließen (251); gesperrt bei veraltetem Stand (431, 465) |
| F-kommunikation-07 | „Senden als <Alex/Lea>“ in der Vorschau: Rahmen in bis zu 8 Runden an Asana (255, 394-410) | Bestätigung über natives `confirm()` (395) | gfweekly:`komm_send` mit `bestaetigt:true` (400) | nach außen wirkend (Asana) | laufend: „Wird gesendet (Teil n) …“ role=status (253); Ergebnis mit Zahlen und Fehlerliste (252); unvollständig/Fehler: Meldung mit Fokus (406-407); Server: 403 nur Alex/Lea (komm.ts:389), 409 Sperre „läuft gerade ein Versand“ (komm.ts:404), 409 „Sperre verloren“ (komm.ts:471) – erscheinen nur als Fehlertext |
| F-kommunikation-08 | Vorschau/Ergebnis schließen („Abbrechen“/„Schließen“) mit Fokus zurück auf Auslöser (432) | – | lokal `OFFEN.vorschau` | liest | – |
| F-kommunikation-09 | Knopf „Stufe zum Prüfpunkt <Datum>“ öffnet Inline-Formular; erneuter Klick schließt (240, 434-440) | Fokus springt auf gewählten Chip (440) | lokal `OFFEN.pp` mit Ausgangsstand `basis` (438) | liest | gesperrt bei veraltetem Stand (434) |
| F-kommunikation-10 | Prüfpunkt-Formular: Stufe als Chip-Reihe (grün/gelb/rot/knapp/offen), Extras als Checkboxen, Notiz-Textarea, Entwurf bleibt bei Neurender erhalten (257-272, 453-456) | – | `D.extras`, `festivals[].pruefpunkte` | liest (Entwurf nur im Speicher) | – |
| F-kommunikation-11 | „Speichern als <Alex/Lea>“ (Submit des Prüfpunkt-Formulars) (270, 411-427, 457) | Enter/Submit im Formular | gfweekly:`komm_pruefpunkt_set` mit `expect_stufe`, `expect_extras`, `expect_notiz`, `expect_am` (418) | Formular speichern (bei Rot/Budget-Extras fachlich bestätigen) | Konflikt: Text enthält „geändert“ → Entwurf verworfen, Neuladen, Meldung mit Fokus (420-421); sonst Meldung „Nicht gespeichert: …“ (422); Server: 403 Rot/Budget nur Alex/Lea (komm.ts:296), 409 Sperre (komm.ts:303), 409 „Inzwischen geändert“ (komm.ts:313-314, 320 PT409) |
| F-kommunikation-12 | Prüfpunkt-Formular „Abbrechen“ mit Fokus zurück auf Auslöser (270, 441, 467) | – | lokal | liest | – |
| F-kommunikation-13 | Abschnitt „Wo wird es eng?“: Satz zur Spitzenwoche, Stellenbedarf (35 Std. je Stelle) (275-281) | – | `komm_list.wochenlast` | liest | leer: „Noch nichts berechnet.“ (278) |
| F-kommunikation-14 | Wochenlast-Diagramm (SVG, gestapelte Flächen je Festival, Bänder Vorproduktion/Festivalsaison, Linie „heute“, Monatsachse); Breite neu bei Größenänderung > 40 px (283-320, 459) | – | `wochenlast`, `verbund`, `festivals` | liest | – |
| F-kommunikation-15 | Wochen-Tooltip: zeigt Stunden je Festival für eine Woche (325-339) | Hover (`mouseenter`, 333), Fokus, Klick; Tastatur: Pfeil links/rechts, Pos1/Ende, Escape (336-338); Roving tabindex, nur Woche „heute“ in Tab-Reihenfolge (312) | `wochenlast` | liest | Tooltip `role=status` (318) |
| F-kommunikation-16 | Legende Farben je Festival plus Muster (319) | – | `festivals` | liest | – |
| F-kommunikation-17 | „Wochen als Liste“ aufklappen: Tabelle Woche, Stunden, Stellen, je Festival (164-167, 320) | `details` aufklappen; Textalternative zum Diagramm | `wochenlast` | liest | – |
| F-kommunikation-18 | „Was muss die GF entscheiden?“: Liste mit Art (Besetzung, Prüfpunkt, Extras mit Budget, Überlast) (342-353) | – | `komm_list.entscheiden` (komm.ts:242-246) | liest | leer: „Gerade nichts: …“ (344) |
| F-kommunikation-19 | Entscheidung Besetzung: Link „Kommunikation besetzen in Saison“ (348) | Direktlink `saison.html#saF2` | – | liest (Navigation) | – |
| F-kommunikation-20 | Entscheidung Prüfpunkt / Extras „Ändern“: öffnet das Prüfpunkt-Formular in der Festivalzeile und scrollt dorthin (349-350, 434-440) | Sprung per `scrollIntoView` in anderen Abschnitt | lokal | liest | – |
| F-kommunikation-21 | „Extras freigeben als <Alex/Lea>“ (350, 444-451) | Bestätigung über `confirm()` (446) | gfweekly:`komm_pruefpunkt_set` mit unveränderter Stufe/Extras und `expect_*` (448) | fachlich bestätigen | Fehler/Konflikt: Neuladen und Meldung mit Fokus (449); gesperrt bei veraltetem Stand (447) |
| F-kommunikation-22 | „Was steht an?“: je Festival Tabelle der Pflichtveröffentlichungen der nächsten 30 Tage (Datum, Titel, Kanal, Stand, „nicht in Asana“, „vorläufig“) (356-362) | am Handy Tabellenzeilen gestapelt (84-94) | `festivals[].pflicht30` | liest | leer je Festival: „Keine Pflichtveröffentlichung in den nächsten 30 Tagen.“ (360) |
| F-kommunikation-23 | Jahresband aufklappen: Phasen, Programmwellen P1–P3, Lineup L, Videos V, Prüfpunkte ◇, Monate, „heute“ (181-184, 365-380) | `details` aufklappen; Einzelwerte nur per `title=` an `span.ph`/`span.mk` (Hover, 373, 375); vollständige Textfassung im `aria-label` der Spur (377) | `festivals[].jahresband` | liest | – |
| F-kommunikation-24 | Verlauf aufklappen: Protokoll (Berechnet, An Asana gesendet, Testversand, Prüfpunkt, Redaktionstabelle, Testprojekt gelöscht) mit Person und Datum (186-189, 381-384) | `details` aufklappen | `komm_list.log` (komm.ts:263) | liest | leer: „Noch keine Einträge.“ (383) |
| F-kommunikation-25 | Statusmeldung `#kmMeldung` mit „Ausblenden“, zusätzlich Ansage für Bildschirmleser (148, 443, 462-463) | – | lokal | liest | aria-live polite (147); Fokus bei Konflikt (463) |
| F-kommunikation-26 | Hinweis „Stand veraltet“ mit „Neu laden“; sperrt alle Entscheidungen, bis neu geladen (149, 442, 464-465, 480-487) | – | gfweekly:`komm_list` | liest | Fehler beim Neuladen nach Schreiben: veraltet-Band plus Meldung (483-484) |
| F-kommunikation-27 | Personenwechsel Alex/Lea in der Seitenleiste rendert Knopfbeschriftungen „als <Person>“ neu (458) | Ereignis `gf-who` | sessionStorage `gf_who` | liest | – |

---

### 3.14 launch.html · Launch verteilen

**Hauptaufgabe:** Je Festival die offenen Launch-Aufgaben verteilen (Vorschlag übernehmen, umverteilen, VVK-Start verschieben, Hilfe dazuholen), Zeitlast je Person prüfen, Zuordnungen bestätigen und den bestätigten Plan nach Asana senden sowie den Stand aus Asana zurückholen.
**Darstellungsformen:** Umschalter/Tabs als Knopfreihe (Festivalwahl `#lnFest`), KPI-Kacheln (`gfKachel`), Hinweisboxen, vier aufklappbare Bereiche („Wege“, `details`), Listen, Personen-Auswahlknöpfe, Aufgabenraster je Bereich mit Inline-Auswahlfeldern (`select`, Chip-Reihen, Ist-Stunden), Balken (Auslastung je Person), Stepper und Datumsfelder, Vorschau des Asana-Projekts, Ergebnisbox. Kein Dialog außer `confirm()`.
**Navigation/Einstieg:** `gfMountTopbar("launch")` (launch.html:484); Hero `karten` (485). URL-Parameter: `?festival=<short_name>` bzw. Altform `?event=` wählen das Festival, `?weg=1..4` klappt den Weg auf und scrollt hin (475-481); Festivalwahl schreibt `?festival=` per `history.replaceState` (241).

| ID | Fähigkeit / Auslöser | Verborgener Zugang | Datenquelle | Speicherwirkung | Zustände |
|---|---|---|---|---|---|
| F-launch-01 | Seite laden nach Passwort-Gate (469-487) | – | gfweekly:`launch_list` (470); serverseitig startet `launch_list` automatisch den Asana-Rückweg, wenn der letzte älter als 60 Minuten ist (index.ts:2375-2386) | liest (Server schreibt dabei ggf. Asana-Stand in die Datenbank) | laden: „lädt …“ (151, 180); Fehler: „Fehler beim Laden: …“ nur im Lagesatz (486); leer: „Im Cockpit liegen keine Launch-Pläne für 2027.“ (472) |
| F-launch-02 | Festival wählen (Knopfreihe mit VVK-Datum, „Kampagnen-Boost“) (238-241) | Direktlink `?festival=`/`?event=`; Auswahl schreibt URL (241); Vorauswahl: nächstes Festival mit VVK ab heute (477) | `launch_list.festivals` | liest | `aria-pressed` am gewählten Knopf (239) |
| F-launch-03 | Lage: Datum, Lagesatz, vier Kacheln (offene Aufgaben, Stunden als Spanne, frühester machbarer VVK-Start, Personen über ihrer Zeit) (244-253) | Namen der überlasteten Personen und geplanter VVK-Termin nur per `title=` an der Kachel (251-252, Hover) | `launch_list` + `LaunchLogik.lage` | liest | – |
| F-launch-04 | Hinweise: VVK nicht haltbar, Personen ohne Wochenstunden, unbesetzte Bereiche (254-258) | – | berechnet | liest | – |
| F-launch-05 | Rückweg-Status: „Zuletzt aus Asana geholt …“ bzw. Warnung, wenn Rückweg seit über zwei Stunden nicht lief (259-263) | – | `launch_list.sync`, `asanaConfigured` | liest | Warnzeile bei veraltetem Rückweg (263) |
| F-launch-06 | „Stand aus Asana holen“ (148, 414-417) | – | gfweekly:`launch_sync` | nach außen wirkend (liest Asana, schreibt Erledigt/Fälligkeit/Kommentare in den Kompass) | laufend: Knopf „holt …“ deaktiviert (414); Ergebnis/Fehler als Toast (415-416) |
| F-launch-07 | Weg A „So zuweisen wie vorgeschlagen“: Liste je Bereich mit Person, Status, Aufgaben, Stunden, Quelle, Notiz (266-281) | `details`, standardmäßig offen (158); `?weg=1` | berechnet aus `meilensteine`, `besetzung` | liest | Knopf deaktiviert ohne Vorschläge (280) |
| F-launch-08 | „Vorschlag übernehmen und bestätigen als <Person>“ (Weg A) bzw. „n Zuordnungen bestätigen“ (Abschnitt Bestätigen) (280, 384, 408-413) | Bestätigende Person im Abschnitt Bestätigen per Chip Alex/Lea frei wählbar, unabhängig von der angemeldeten Person (384, 409) | gfweekly:`launch_confirm` mit `by` (410) | fachlich bestätigen | Ergebnis/Fehler als Toast (410-411); Server: 403 „Bestätigen können nur Alex oder Lea“ (index.ts:2560) |
| F-launch-09 | Weg B „Umverteilen oder selbst übernehmen“: Bereich per Chip-Reihe wählen, Filter „Generator-Arbeit an alle mit Zeit“, „Alex und Lea anzeigen“ (284-297, 448-450) | `details` geschlossen; `?weg=2` | `LaunchLogik.kandidaten` | liest | leer: „Niemand im Pool trägt dieses Feld …“ (295) |
| F-launch-10 | Weg B: Person aus Kandidaten wählen → Bereich an Person (295, 435-436) | Klick auf Personenknopf speichert sofort (keine Bestätigung) | gfweekly:`launch_set` mit `event_id`, `bereich`, `person_id` | sofort speichern | Toast Erfolg/Fehler, danach Neuladen (401-403) |
| F-launch-11 | Weg B: „Selbst übernehmen (<Person>)“ (296, 433-434) | – | gfweekly:`launch_set` | sofort speichern | Toast „Deine Person steht nicht im Pool.“ (433) |
| F-launch-12 | Weg B: „Bereich freigeben“ (Person entfernen) (296, 435-436) | – | gfweekly:`launch_set` mit `person_id:null` | sofort speichern | Toast |
| F-launch-13 | Weg C „VVK-Start verschieben“: Datumsfeld, Abstände zu anderen Festivals, Anzahl geänderter Zieltermine (300-312, 451) | `details`; `?weg=3` | `LaunchLogik.vvkVerschieben`, `abstaende` | liest (Vorschau) | Knopf deaktiviert bei unverändertem Datum (311) |
| F-launch-14 | Weg C: „auf den machbaren Termin (<Datum>)“ setzt Datumsfeld (308, 437) | – | berechnet | liest | – |
| F-launch-15 | Weg C: „VVK-Start auf <Datum> setzen“ (311, 438-440) | Bestätigung über `confirm()` (439) | gfweekly:`launch_set` mit `sales_start_on`; schreibt auch in Plattform-Tabellen (index.ts:2551 `vvp_launch_plan_changes`) | fachlich bestätigen (wirkt in die Plattform) | Toast mit Anzahl verschobener Termine (440) |
| F-launch-16 | Weg D „Hilfe dazuholen“: Helfer wählen (Toggle), passende Aufgabe per `select`, Umfang per Chip (Generator-Anteil/ganze Aufgabe), Bewertung mit Kostenspanne (315-332, 441, 452-453) | `details`; `?weg=4` | `LaunchLogik.hilfeBewerten` | liest | Hinweis „Keine offene Aufgabe passt …“ (329); Knopf deaktiviert, wenn nicht sinnvoll (331) |
| F-launch-17 | Weg D: „<Name> für den Generator-Anteil eintragen“ / „als zuständig eintragen“ (331, 442-444) | – | gfweekly:`launch_set` mit `milestone_id` + `hilfe_person_id` bzw. `person_id` | sofort speichern | Toast |
| F-launch-18 | Aufgaben je Bereich: Raster je Meilenstein mit Aufwand (Spanne), Dauer, Generator-Anteil, Kalibrierungssatz, Fertig-am/Ziel, Zuordnungsstatus (335-353) | – | `launch_list.meilensteine`, `LaunchLogik.kette`, `kalibrierung` | liest | leer: „Für dieses Festival liegen keine Meilensteine im Cockpit.“ (337) |
| F-launch-19 | Aufgabe: Stand per Chip-Reihe offen/läuft/erledigt (348, 457) | Wechsel speichert sofort über `change`-Ereignis | gfweekly:`launch_set` mit `status` | sofort speichern | Toast „Stand gespeichert“/Fehler (402-403); Cockpit-Status blockiert/in Prüfung/entfällt nur als Text (348) |
| F-launch-20 | Aufgabe: Zuständig per `select` (Team/Hilfe/GF, „ohne Asana“) (349, 458) | Auswahl speichert sofort | gfweekly:`launch_set` mit `person_id` | sofort speichern | Toast |
| F-launch-21 | Aufgabe: Generator-Anteil an Person per `select` (350, 459) | Auswahl speichert sofort | gfweekly:`launch_set` mit `hilfe_person_id` | sofort speichern | Toast |
| F-launch-22 | Erledigte Aufgabe: Ist-Stunden eintragen (346, 460) | Speichern beim `change` (Feld verlassen) | gfweekly:`launch_set` mit `ist_stunden` | sofort speichern | Toast „Ist-Stunden: bitte eine Zahl“ (460); Server 400 bei Wert außerhalb 0–1000 (index.ts:2465) |
| F-launch-23 | Zeit je Person: Auslastungsbalken mit Wort (passt/knapp/zu viel) und Prozent, Filter „nur Personen mit Aufgaben“ (356-367) | – | `LaunchLogik.last` | liest | leer: „Niemand hat Aufgaben.“ (365) |
| F-launch-24 | Zeit je Person: Stunden je Woche per Stepper (363, 463-466) | Autosave nach 700 ms Verzögerung | gfweekly:`launch_set` mit `person_id`, `launch_std_woche` | sofort speichern | Toast; Server 400 außerhalb 0–80 (index.ts:2479) |
| F-launch-25 | Zeit je Person: „Verfügbar ab“ Datumsfeld (364, 463-466) | Speichern beim `change` | gfweekly:`launch_set` mit `verfuegbar_ab` | sofort speichern | Toast |
| F-launch-26 | Bestätigen und senden: Zähler (offen/Vorschlag, bestätigt, gesendet, ohne Person) und Vorschau des Asana-Projekts je Bereich mit Versandweg (Aufgabe, Angebot einholen, Notiz ohne Konto) (370-391) | – | berechnet, `LaunchLogik.versandWeg` | liest | leer: „Noch nichts bestätigt, darum noch nichts zu senden.“ (388) |
| F-launch-27 | „n Aufgaben nach Asana senden“ (389, 419-431) | Bestätigung über `confirm()` (420) | gfweekly:`launch_send` | nach außen wirkend (Asana) | Knopf deaktiviert ohne Bestätigtes oder ohne Asana-Token, mit Hinweistext (389); laufend „sendet …“ (421); Ergebnisbox mit Link (428); Fehler als Toast (430); Server 400 ohne Token (index.ts:2592) |
| F-launch-28 | Personenwechsel Alex/Lea (Seitenleiste) | Wirkt erst beim nächsten Rendern; kein `gf-who`-Listener auf der Seite | sessionStorage `gf_who` | liest | Knopftexte „als <Person>“ können veraltet sein |

---

### 3.15 organisation.html · Organisation („Das Haus wächst“)
**Hauptaufgabe:** Acht Organisationsentscheidungen vor Stufe 1 treffen (Alex wählt, Lea gibt optional Rückmeldung), daraus den Teamaufbau je Rolle in sechs Schritten mit Leitung/Stellvertretung führen und die Tore der vier Aufbaustufen abhaken.
**Darstellungsformen:** Fortschrittsleiste mit fünf Bildstufen (Knopfgruppe), Bild-Kopf, „Dein Zug“-Karte, Kartenraster der acht Entscheidungen, Umschalter Ansicht (Stufen und Tore = vier Spalten mit Rollenkarten / Zeitachse = Gantt-artiges Raster Q4 26 bis ab Q4 28), Filterleiste, Verlaufsliste, klebender Seitenbereich „Akte“ (Detail mit Radiogruppe, Formularfeldern, Schrittliste, Definitionsliste), Bild-Meldung unten (eigener Toast).
**Navigation/Einstieg:** nav-Schlüssel `organisation` (organisation.html:642), Badge `orgBadge` wird von der Seite selbst gesetzt (391). URL-Parameter `?d=<1..8>` öffnet Entscheidung, `?r=<rollen-id>` öffnet Rolle (324); wird bei jeder Auswahl per `history.replaceState` fortgeschrieben (611). Externer Link „Architektur lesen“ (214, neuer Tab).

| ID | Fähigkeit / Auslöser | Verborgener Zugang | Datenquelle | Speicherwirkung | Zustände |
|---|---|---|---|---|---|
| F-organisation-01 | Stand laden: Entscheidungen, Rollen, Tore, Verlauf (499–506, 641–645) | – | organisation:`get` | liest | laden: „lädt …“ in Kopfzeile (211, role=status) und Hauptbereich (234); Fehler: „Nicht geladen: …“ im Hauptbereich (644); 401: Meldung „Passwort abgelaufen …“ (258) |
| F-organisation-02 | Lagezeile „n von 8 Entscheidungen · nächste Frist · Pflichtrollen“ (373–375) | – | abgeleitet aus `get` | liest | role=status (211) |
| F-organisation-03 | Fortschrittsleiste: Klick auf Stufe zeigt Bild und Ziel dieser Stufe als Vorschau („peek“), erneuter Klick zurück (379–386, 621) | title= mit Untertitel der Stufe (385); aria-pressed | lokal | liest | Fortschrittsbalken nur als Breite plus Zahl im Text |
| F-organisation-04 | „Dein Zug“: je Person bis zu drei offene Sachen (Alex: offene Entscheidungen; Lea: nächster Teamaufbau-Schritt) mit Öffnen- oder Erledigt-Knopf (351–362, 388–390, 628–631) | Inhalt hängt von der aktiven Person (gfWho) ab; Wechsel der Person rendert neu (638) | abgeleitet | Erledigt-Knopf: sofort speichern (organisation:`rolle`) | leer: „Nichts bei dir, …“ (389) |
| F-organisation-05 | „noch n weitere …“ scrollt zu Entscheidungen oder Rollen (390, 619) | – | – | liest | scrollt mit `behavior:"smooth"` unabhängig von reduzierter Bewegung (619) |
| F-organisation-06 | Knopf „Nächster Zug“ öffnet die erste offene Sache (639) | – | abgeleitet | liest | leer: Toast „Nichts offen bei dir.“ (639) |
| F-organisation-07 | Entscheidungskarte anklicken öffnet die Akte der Entscheidung (394–397, 620) | Direktlink `?d=` (324) | lokal | liest | Zustand als Wort (offen / Alex entscheidet / entschieden) plus Avatar ausgegraut (396) |
| F-organisation-08 | Ansicht umschalten Stufen und Tore / Zeitachse (399, 622) | gemerkt in localStorage `gf_og_view` (320) | lokal | liest | – |
| F-organisation-09 | Filter Alle / Pflichtrollen / Startklar / Wartet mit Zählern (400, 623) | gemerkt in localStorage `gf_og_filter` (321) | lokal | liest | leer je Stufe: „Keine Rolle in diesem Filter.“ (416) |
| F-organisation-10 | Rollenkarte (Stufenansicht) bzw. Rollenname/Balken (Zeitachse) öffnet Rollen-Akte (405–412, 446–462) | gesperrte Rollen zeigen Grund nur im title= (407); Balken der Zeitachse mit Zustand und Notiz nur im title= (458); Direktlink `?r=` | lokal | liest | gesperrt: gestrichelt mit „E n“ (407, 457) |
| F-organisation-11 | Entscheidung wählen (Radiogruppe der Möglichkeiten in der Akte) – gilt sofort; vorher wird eine geänderte Begründung gespeichert; danach automatisch Eintrag ins Entscheidungslog (477, 517–541) | nur als Alex wirksam; als Lea Toast „Alexander entscheidet …“ (519) | organisation:`wahl` mit `expect_rev`; danach gfweekly:`decision_add` (vergibt Habitat-Taler) und organisation:`log_verknuepfen` | fachlich bestätigen | optimistisch gerendert, bei Fehler zurückgesetzt (527–530); Sperre je Entscheidung gegen Doppelklick, Toast „Die letzte Wahl wird noch gespeichert.“ (521); Konflikt 409 → Toast „… · neu geladen“ und Neuladen (507–511); Erfolg: Bild-Meldung (537) |
| F-organisation-12 | Begründung fürs Entscheidungslog (Textfeld in der Akte) speichert bei Verlassen des Feldes (478, 635) | Speichern erst bei `change` (Fokusverlust), kein Speichern-Knopf | organisation:`begruendung` | sofort speichern | Fehler: Toast „Nicht gespeichert: …“ und Neuladen (509); kein Versionsschutz (Server: organisation/index.ts:86–93) |
| F-organisation-13 | Optionale Rückmeldung Lea „Ich stimme zu“ / zurücknehmen (465–474, 550–560) | nur als Lea wirksam (553); Klick auf Alex-Feld ohne Wirkung (Element ist kein Knopf, 468) | organisation:`freigabe` mit `expect_wahl` | sofort speichern | vor Wahl: Toast „Erst wählt Alexander …“ (554); Konflikt „Die Wahl hat sich geändert“ (Server PT409) → Neuladen |
| F-organisation-14 | „Ins Entscheidungslog nachtragen“, wenn eine geltende Entscheidung keinen Logeintrag hat (480, 543–548) | nur als Alex sichtbar (480) | gfweekly:`decision_add`, organisation:`log_verknuepfen`; lokaler Zwischenspeicher localStorage `gf_og_log_offen` (563–565) | fachlich bestätigen | Fehler: Toast „Entschieden, aber nicht ins Entscheidungslog geschrieben …“ (582); nicht verknüpft: Toast und Neuladen (581) |
| F-organisation-15 | „Schaltet frei“-Chips in der Entscheidungs-Akte und „wartet/entschieden“-Chips in der Rollen-Akte springen zwischen Entscheidung und Rolle (482, 491) | – | lokal | liest | – |
| F-organisation-16 | Teamaufbau-Schritt abhaken / zurücknehmen (Schrittliste in der Rollen-Akte; Klick auf aktuellen Schritt nimmt zurück) (489, 595–602) | Rücknahme nur durch erneuten Klick auf den letzten erledigten Schritt, nicht beschriftet (600) | organisation:`rolle` (patch.schritt, `expect_rev`) | sofort speichern | gesperrt: Toast „Wartet noch auf Entscheidung …“ (597), „Erst Schritt n abhaken.“ (599); Server prüft Abhängigkeit (409 „Wartet auf Entscheidung“, organisation/index.ts:123); Konflikt → Neuladen; Abschluss: Bild-Meldung (601) |
| F-organisation-17 | Leitung und Stellvertretung eintragen (zwei Textfelder in der Rollen-Akte) (488, 636) | Speichern bei Fokusverlust (`change`) | organisation:`rolle` (patch.leitung/stellvertretung, `expect_rev`) | sofort speichern | Konflikt 409 „Inzwischen geändert“ → Toast und Neuladen |
| F-organisation-18 | Tor-Nachweis abhaken / zurücknehmen (Kästchen-Knöpfe je Stufe) (419, 603–608) | aria-pressed statt Checkbox | organisation:`tor` | sofort speichern | kein Versionsschutz (Upsert, organisation/index.ts:139–147); Fehler → Rücksetzen und Neuladen; Erfolg „Tor n erreicht“: Bild-Meldung (606) |
| F-organisation-19 | Verlauf „Zuletzt im Kompass“ (10 Einträge) und Mini-Verlauf in jeder Akte (4 Einträge) (422–445) | – | aus `get` (log, max. 40) | liest | leer: „Noch nichts eingetragen …“ (444) |
| F-organisation-20 | Bild-Meldung unten mittig (eigener Toast, 3,8 s) (240, 495–496) | – | lokal | liest | role=status (240); Animation nur bei `no-preference` (179–182) |
| F-organisation-21 | Akte am schmalen Schirm: Auswahl scrollt zur Akte (612) | nur ≤1180 px | – | liest | scrollt `smooth` ohne Prüfung reduzierter Bewegung |

---

---

### 3.16 besetzung.html · Besetzung verteilen
**Hauptaufgabe:** Aus den Gesprächen der Besetzungswerkstatt im Habitat Hub (nur lesend) je Festival und Bereich Aufgaben mit einer verantwortlichen Person machen, ihren Stand und Termin pflegen und sie einzeln nach Asana senden.
**Darstellungsformen:** Bild-Kopf, Saison-Chips, Festival-Kachelleiste (Knopfliste), Lageabschnitt mit Satz und KPI-Kacheln, Hinweisblöcke, Bereiche mit Gesprächskarten, Aufgabenliste je Gespräch (Raster), aufklappbares Inline-Formular, Personenwahl als Knopfraster mit Suchfeld, Inline-Bestätigungsblock für Asana, Liste „Wer trägt was“.
**Navigation/Einstieg:** nav-Schlüssel `besetzung` (384). URL-Parameter `?festival=<slug>` wählt Festival (377), `?aufgabe=<id>` wählt das Festival der Aufgabe, hebt sie hervor und scrollt hin (376, 381); Festivalwahl schreibt `?festival=` per `history.replaceState` (323). Festival gemerkt in localStorage `gf_bz_fest` (190). Diese Direktlinks stehen auch in den Asana-Notizen (besetzung/index.ts:211).

| ID | Fähigkeit / Auslöser | Verborgener Zugang | Datenquelle | Speicherwirkung | Zustände |
|---|---|---|---|---|---|
| F-besetzung-01 | Lage laden (Formate, Zuordnungen aus dem Hub, Aufgaben, Personen-Pool) (372–382) | Laden stößt serverseitig einen Asana-Rückabgleich an für Aufgaben, deren Abgleich älter als 1 h ist (besetzung/index.ts:112–116) | besetzung:`lage` (Hub-Lesefunktionen, Asana-Rückweg) | liest (mit serverseitigem Nebeneffekt: Asana-Stand wird übernommen) | laden: „lädt …“ (134); Fehler: „Fehler beim Laden: …“ (386); leer: „Im Hub sind noch keine Formate hinterlegt.“ (379); 401: Toast, Passwort gelöscht, Seite lädt nach 1,2 s neu (311) |
| F-besetzung-02 | Knopf „Neu laden“ (125, 330) | – | besetzung:`lage` | liest | Toast „Neu geladen“ |
| F-besetzung-03 | Saison wählen (Chip-Reihe, nur bei mehreren Jahren) (192–195, 354) | – | besetzung:`lage` mit `jahr` | liest | nur ein Jahr: Text „Saison JJJJ“ |
| F-besetzung-04 | Festival wählen (Kachelknöpfe mit Zählern Gespräche/Aufgaben) (196–203, 323) | merkt sich Wahl in localStorage und URL | lokal | liest | Untertitel „noch kein Gespräch“ / „Konzept noch offen“ (200) |
| F-besetzung-05 | Lage je Festival: Satz, fünf KPI-Kacheln, Hinweise (Absage mit offenen Aufgaben, Asana-Abgleichsfehler) (207–230) | – | abgeleitet | liest | Warnhinweis bei Sync-Fehlern (228) |
| F-besetzung-06 | Bereiche mit Gesprächskarten: Partner, Gesprächsstand, wer führt, nächster Schritt aus dem Hub (275–299) | – | Hub über besetzung:`lage` | liest | leer je Bereich: „Im Hub ist … noch kein Partner zugeordnet …“ (297); Gesprächsstand als Symbol plus Wort |
| F-besetzung-07 | Link „Gespräch im Hub ↗“ / „Besetzungswerkstatt im Hub ↗“ (124, 285) | neuer Tab | – | liest | – |
| F-besetzung-08 | „Als Aufgabe übernehmen“ öffnet Inline-Formular (Titel vorbelegt mit nächstem Schritt, Person, Termin, Notiz) (240–250, 317) | Fokus springt ins Titelfeld (317) | – | – | „Abbrechen“ schließt (318) |
| F-besetzung-09 | Aufgabe anlegen (Formular absenden) (358–369) | Enter im Termin-/Suchfeld sendet das Formular nicht ausdrücklich ab; Absenden per Knopf | besetzung:`uebernehmen` | Formular speichern | leerer Titel: Toast (361); Knopf „Wird angelegt …“ deaktiviert (362); gleicher Titel am selben Gespräch: keine Dublette, Toast „Diese Aufgabe gab es schon …“ (366); ohne Alex/Lea: Server 400 „Bitte oben Alex oder Lea wählen.“ |
| F-besetzung-10 | Personenwahl mit Suchfeld (Knopfraster „Noch offen“ plus Pool mit Typ und „Asana/ohne Asana“) (232–238, 324–328, 348–351) | Suche filtert live, Fokus und Cursor werden nach jedem Neuzeichnen wiederhergestellt (350) | lokal; bei bestehender Aufgabe besetzung:`setzen` | im Formular: Formular speichern; bei bestehender Aufgabe: sofort speichern | Platzhalter „Person suchen“ plus aria-label (236) |
| F-besetzung-11 | „Person wählen/ändern“ an einer Aufgabe öffnet die Personenwahl, „Fertig“ schließt (267, 270, 333–334) | nicht angeboten, wenn Aufgabe schon in Asana (267) | besetzung:`setzen` (person_id, `version`) | sofort speichern | Toast „Verantwortlich: …“ / „Person entfernt …“; Konflikt 409 mit aktuellem Stand → Zeile ersetzt, Toast mit Servertext (311–313) |
| F-besetzung-12 | Aufgabenstand ändern (Chip-Reihe offen / in Arbeit / erledigt / verworfen) (268, 355) | – | besetzung:`setzen` (status, `version`) | sofort speichern | Toast „Aufgabenstand: …“; Konflikt wie F-11 |
| F-besetzung-13 | Termin der Aufgabe setzen/entfernen (Datumsfeld) (263, 356) | nur ohne Asana-Bezug; danach „Termin pflegt Asana“ (263) | besetzung:`setzen` (faellig, `version`) | sofort speichern | Server 409, wenn schon in Asana (besetzung/index.ts:175–176) |
| F-besetzung-14 | „Nach Asana senden“ → Inline-Bestätigung → „Jetzt nach Asana senden“ (248, 243, 335–342) | Link-Knopf klein (`.bz-link`); nur sichtbar mit Person, Asana-Konto, eingerichtetem Asana und offener Aufgabe (244–248) | besetzung:`asana_senden` (`bestaetigt:true`) | nach außen wirkend (Asana-Aufgabe mit Notiz und Rücklink) | Knopf „Wird gesendet …“ deaktiviert (338); schon gesendet: Toast „War schon in Asana“; Doppelsende-Sperre Server 409 (besetzung/index.ts:202); Asana lehnt ab: 502 (219); Hinweise ohne Konto/ohne Person/Asana fehlt (244–246) |
| F-besetzung-15 | Link „öffnen ↗“ zur Asana-Aufgabe (256) | neuer Tab | – | liest | – |
| F-besetzung-16 | „Wer trägt was“: offene Aufgaben je Person (301–306) | Titel über 70 Zeichen gekürzt | abgeleitet | liest | leer: „Noch keine offene Aufgabe …“ (305) |
| F-besetzung-17 | Personenwechsel in der Seitenleiste meldet „Änderungen laufen jetzt als …“ (370) | – | lokal | liest | – |

---

---

### 3.17 arbeiten.html · So arbeiten wir
**Hauptaufgabe:** Ist-Aufnahme der Abläufe je Person (Steckbriefe), getrennte Umfrage für Alex und Lea mit gemeinsamer Auswertung nach Abgabe beider, Einordnung der eigenen Systeme und der Werkzeuge aus dem Hub-Register, geführt über einen Wegweiser in Etappen.
**Darstellungsformen:** Startkarte (Personenwahl), Wegweiser als Pfad aus drei Karten mit Etappen-Kacheln und Einzelbildschirmen (eine Frage / ein Ablauf / ein System je Schirm, Fortschrittsbalken), Gesamtansicht mit Tabs (Start, Ist-Aufnahme, Umfrage, Systeme), Karten-Formulare, Fortschrittsbalken, Auswertungstabelle (ARIA-role="table" aus divs), aufklappbare Zeilen (details) für Hub-Werkzeuge, Filter-Chips mit Suche, Statuszeile.
**Navigation/Einstieg:** `gfMountTopbar("arbeiten")` (arbeiten.html:1069), Hero „lagerfeuer“ slim (1070). URL `?person=alex|lea` setzt die aktive Person und öffnet den Wegweiser (1067–1068, 1073), `?start=1` öffnet den Wegweiser (1073), Hash `#start|#ist|#umfrage|#systeme` öffnet die Gesamtansicht mit Tab (1071–1073); Tabwechsel schreibt den Hash per `history.replaceState` (344), Personenwahl schreibt `?person=…&start=1` (739). Eigene Edge Function `arbeiten` über `saApi` (322–329), sendet immer `who` = `gfWho()`.

| ID | Fähigkeit / Auslöser | Verborgener Zugang | Datenquelle | Speicherwirkung | Zustände |
|---|---|---|---|---|---|
| F-arbeiten-01 | Laden der Gesamtlage (Steckbriefe, Umfrage, Systeme, Werkzeuge) nach Entsperren (arbeiten.html:794–816, 1074) | – | arbeiten:`lage` | liest | Laden: „○ Wird geladen …“ in allen Bereichen und Statuszeile role=status (220, 797–798); Fehler: „✕ Laden fehlgeschlagen. Bitte „Neu laden“ versuchen.“ je Bereich plus Toast (812–814); 401 löscht Passwort und lädt Seite neu (340) |
| F-arbeiten-02 | Startkarte „Ich bin Alex / Ich bin Lea“ (225, 822–826) setzt Person, schreibt URL, öffnet Wegweiser | URL `?person=` gleichwertig | lokal: sessionStorage `gf_who` | liest (lädt neu bei Personenwechsel) | aktive Person farbig hervorgehoben (736); keine Sicherheitsfunktion (Kommentar 1065) |
| F-arbeiten-03 | Wegweiser-Pfad mit drei Schritten, Stand beider Personen (542–611) | Stand der anderen Person nur als Etappennummer (519) | arbeiten:`lage` (umfrage.andere_beantwortet) | liest | leer: „○ Gerade läuft keine Umfrage.“ (554); Fehlerkasten role=alert `#swFehler` (598, 612) |
| F-arbeiten-04 | Etappe starten/fortsetzen, Frage-Schirm mit Antwortknöpfen Skala 1–5 / „passt nicht zu mir“ / Wahl (615–634, 831–840) | automatischer Weitersprung 200 ms nach Tippen (839); Fokus springt auf erstes Element (608–610) | arbeiten:`antwort_set` | sofort speichern (Warteschlange, optimistisch 653–663) | Fehler: Feld aria-invalid, Statuszeile „✕ n Änderungen nicht gespeichert“, Toast (765, 785); 409 nach Abgabe kommt als Text |
| F-arbeiten-05 | Zahlfrage mit Stepper und „Weiter“ / „Passt nicht zu mir“ (627–628, 841–845) | Grenzen des Steppers nur im `title` des deaktivierten Knopfs (core.js:59) | arbeiten:`antwort_set` | sofort speichern | Validierung 0–999 per Toast und aria-invalid (843) |
| F-arbeiten-06 | Textfrage mit „Weiter“ / „Überspringen“ (nur Fragen 22–24) (630–631, 846–855) | – | arbeiten:`antwort_set` | sofort speichern | Pflichtfrage leer: Toast „Bitte kurz in Stichworten beantworten.“ (851); offene Frage: Toast „○ Eine Frage ist noch offen.“ (650) |
| F-arbeiten-07 | Zurück-Pfeil im Frage-/Ablauf-/System-Schirm (617, 668, 708, 833, 857, 873) | Knopf nur mit Symbol „←“, Name über aria-label | lokal: localStorage `sa_weg_<Person>` | liest | – |
| F-arbeiten-08 | Zwischenschirm „Etappe geschafft“, „Später“ (635–640, 832) | – | lokal: `sa_weg_<Person>` | liest | – |
| F-arbeiten-09 | Antworten abgeben (Wegweiser und Umfrage-Tab) (555, 639, 893–896, 989–992) | Bestätigung durch zweiten Klick binnen 5 s, Knopftext wechselt zu „Wirklich abgeben?“ (`saConfirm` 952–956) | arbeiten:`abgeben` | fachlich bestätigen | lädt danach neu; Status „✓ Abgegeben“ (895) |
| F-arbeiten-10 | Abgabe zurücknehmen (564, 897, 417, 993) | – | arbeiten:`abgabe_zurueck` | fachlich bestätigen (Rücknahme) | 409 serverseitig, wenn die andere Person schon abgegeben hat (arbeiten/index.ts, Meldung als Text) |
| F-arbeiten-11 | Vergleich ansehen → springt in Umfrage-Tab zu „Die drei wichtigsten Punkte“ (562, 830) | – | arbeiten:`lage` | liest | nur sichtbar, wenn beide abgegeben haben |
| F-arbeiten-12 | Ablauf beschreiben in fünf Schirmen (Name mit Vorschlags-Chips, Start/Häufigkeit, Werkzeuge Mehrfachwahl, Beteiligte/berührt andere, hakt/läuft gut) (666–689, 856, 858–868) | Chips speichern beim Tippen, Felder beim Verlassen (`change`, 914–933, 1013) | arbeiten:`ist_save` | sofort speichern (Autosave) plus „Weiter“ schreibt Schirm vollständig (691–702) | Pflichtname: aria-invalid und Fehler „Der Ablauf braucht einen Namen.“ (693) |
| F-arbeiten-13 | Ablauf freigeben oder „Erst mal für mich behalten“ (686–687, 899–904) | – | arbeiten:`ist_freigeben` | fachlich bestätigen (Sichtbarkeit für andere Person) | Status „✓ Freigegeben für …“ (901) |
| F-arbeiten-14 | Systeme durchgehen: „Stimmt“ / „Korrigieren“ / „Kenne ich nicht“ (705–717, 874–879) | Bestätigung wird nur auf diesem Gerät gemerkt (localStorage `sa_sys_<Person>`, 877) | lokal; bei Korrektur arbeiten:`system_save` (905–911) | „Stimmt“: nur lokal; Korrigieren: Formular speichern | leer: „○ Noch keine Systeme eingetragen.“ (707) |
| F-arbeiten-15 | Hub-Werkzeuge je Etappe (10 je Etappe) einordnen: behalten/anpassen/umbauen/weglassen/„Kenne ich nicht“ (718–726, 880–888) | auto-weiter nach 200 ms; „Kenne ich nicht“ nur lokal (`sa_hub_<Person>`, 884) | arbeiten:`hub_stand_set` | sofort speichern | Toast „✓ Etappe eingeordnet“ (887) |
| F-arbeiten-16 | „Alles ansehen“ / „← Zum Wegweiser“ (605, 232, 827–828) | – | – | liest | – |
| F-arbeiten-17 | Tabs Start / Ist-Aufnahme / Umfrage / Systeme (236–241, 341–345, 958) | Pfeiltasten links/rechts, Home, End (941–951); Hash `#tab` | – | liest | – |
| F-arbeiten-18 | „Neu laden“ (242, 971) | – | arbeiten:`lage` | liest | wartet erst auf offene Speichervorgänge (`settled`, 790–793), sonst Fehler „Änderungen sind noch nicht gespeichert …“ |
| F-arbeiten-19 | „Speichern erneut versuchen“ (220, 961–965) | nur sichtbar bei fehlgeschlagenen Speicherungen (762) | wiederholt die fehlgeschlagenen Aufrufe | sofort speichern | – |
| F-arbeiten-20 | Stand-Übersicht beider Personen im Start-Tab (348–357) | – | arbeiten:`lage` | liest | – |
| F-arbeiten-21 | Link „Konzeptdokument ↗“ (260) | öffnet externes Dokument in neuem Tab | extern | liest | – |
| F-arbeiten-22 | Steckbrief anlegen „+ Ablauf“ (267, 975–978) | Fokus und Markierung im neuen Namensfeld (977) | arbeiten:`ist_save` | sofort speichern | leer: „Noch kein Steckbrief …“ (383) |
| F-arbeiten-23 | Steckbrief-Felder bearbeiten (Ablauf, Wie oft, Berührt-Chips, sieben Textfelder, Einordnungs-Chips) (366–379, 1017–1023) | Speichern beim Verlassen des Feldes (`change`), Chips sofort | arbeiten:`ist_save` | sofort speichern (Autosave) | Zeilenstatus „· ✓ gespeichert“ (1021); Fehler aria-invalid + Statuszeile |
| F-arbeiten-24 | Steckbrief löschen (377, 979–983) | Bestätigung per zweitem Klick binnen 5 s (`saConfirm`) | arbeiten:`ist_delete` | sofort speichern (Löschen) | serverseitig 404 „gehört nicht dir“ als Text |
| F-arbeiten-25 | Steckbrief freigeben / Freigabe zurücknehmen (378, 984–988) | – | arbeiten:`ist_freigeben` | fachlich bestätigen | Status in Statuszeile |
| F-arbeiten-26 | Freigegebene Steckbriefe der anderen Person lesen (361–365, 384–386) | Sichtbarkeit serverseitig gefiltert (arbeiten/index.ts lage) | arbeiten:`lage` | liest | leer: „Noch nichts freigegeben.“ (386) |
| F-arbeiten-27 | „Zur Erinnerung: typische Abläufe“ aufklappen (269–271) | details/summary | – | liest | – |
| F-arbeiten-28 | Umfrage im Tab: Skala-/Wahl-Chips, Zahlfeld, Text-/Beispielfelder (390–406, 1024–1041) | Beispielfeld in details „Beispiel dazu (optional) ▾“ (404); Abgeben-Knopf-Hinweis nur im `title` (416) | arbeiten:`antwort_set` | Chips sofort speichern, Text/Zahl beim Verlassen | gesperrt nach eigener Abgabe (420–423); leer „○ Keine laufende Runde“ (422) |
| F-arbeiten-29 | Neue Umfrage-Runde starten (418, 994–997) | Bestätigung per zweitem Klick | arbeiten:`runde_neu` | fachlich bestätigen | 409, wenn laufende Runde nicht von beiden abgegeben |
| F-arbeiten-30 | Auswertung nach Abgabe beider: drei wichtigste Punkte, „hakt bei beiden“, „größte Unterschiede“, alle Skalenantworten, offene Antworten, Beispiele (426–453) | – | arbeiten:`lage` (Antworten der anderen erst nach beiden Abgaben) | liest | leere Zustände je Block (447–449) |
| F-arbeiten-31 | Systeme-Liste bearbeiten (Name, Stand/Quelle, Wofür, Beobachtung, Reifegrad-, Einordnungs-Chips) (455–464, 1042–1045) | Speichern beim Verlassen; Felder nur mit Platzhalter, Label über aria-label | arbeiten:`system_save` | sofort speichern (Autosave, gemeinsame Liste) | leer „Noch kein Eintrag.“ (464) |
| F-arbeiten-32 | System anlegen „+ System“ (296, 999–1002) | – | arbeiten:`system_save` | sofort speichern | – |
| F-arbeiten-33 | System löschen (460, 1003–1007) | Bestätigung per zweitem Klick | arbeiten:`system_delete` | sofort speichern (Löschen) | – |
| F-arbeiten-34 | Hub-Werkzeuge: Suche, Filter-Chips (aktiv, im Aufbau, noch offen, nur GF, alle), Zähler (303–307, 482–489, 1014, 1052) | – | arbeiten:`lage` (Hub-Register nur lesend) | liest | Zähler role=status aria-live (306); leer-Texte (488) |
| F-arbeiten-35 | Werkzeug aufklappen und einordnen (Notiz, Reifegrad, Einordnung) (470–481, 1046–1050) | nur ein details gleichzeitig offen (936–940) | arbeiten:`hub_stand_set` | sofort speichern | Statuszeile in summary aktualisiert (1049) |
| F-arbeiten-36 | Personenwechsel in der Kopfzeile während der Arbeit (1053–1063) | – | arbeiten:`lage` | liest | blockiert, solange Änderungen nicht gespeichert sind (Toast „Person bleibt unverändert …“, 1056–1059); Personknöpfe während BUSY deaktiviert (753) |

---

### 3.18 capture.html · Eingabe
**Hauptaufgabe:** Einen Gedanken schnell als Thema erfassen; er landet im Board unter „Zu besprechen“.
**Darstellungsformen:** Formularkarte mit Chip-Gruppen, aufklappbarer Detailbereich, Bestätigungskarte.
**Navigation/Einstieg:** `gfMountTopbar("capture")` (capture.html:68), Hero „kiste“ compact. Keine URL-Parameter. Fußzeile verlinkt `/inbox` und `/` als „Cockpit“ (59).

| ID | Fähigkeit / Auslöser | Verborgener Zugang | Datenquelle | Speicherwirkung | Zustände |
|---|---|---|---|---|---|
| F-capture-01 | Freitext „Worum geht's?“ (35–36) | Diktat über Tastaturmikrofon (Hinweis 37); Label ohne `for` | – | – | – |
| F-capture-02 | „Von wem?“ Alex/Lea-Chips (39, 69–70) | Wahl setzt zugleich die globale Person (`gfSetWho`, 70); erneuter Klick hebt Wahl auf | lokal: sessionStorage `gf_who` | liest | Zustand nur Klasse `on`, kein aria-pressed |
| F-capture-03 | Dringlichkeit- und Art-Chips (40–46) | erneuter Klick hebt Wahl auf (70) | – | – | ohne aria-pressed |
| F-capture-04 | „+ Mehr Details (optional)“ ein-/ausblenden (47, 72) | – | – | – | kein aria-expanded |
| F-capture-05 | Detailfelder Projekt/Bereich, Stakeholder, Verantwortlich, Fällig bis (49–50) | Labels ohne `for` | – | – | – |
| F-capture-06 | „Ins Board schicken →“ (52, 73–76) | leerer Text setzt nur den Fokus | gfweekly:`capture` (legt Thema an, vergibt Taler) | Formular speichern | Erfolg: Bestätigungskarte „Erfasst!“ (55–58, 75); Fehler Toast „Konnte nicht senden …“ (76); kein Ladezustand, Knopf bleibt aktiv |
| F-capture-07 | „Board öffnen“ / „Noch einen Gedanken erfassen“ (56–57, 77) | – | – | liest | setzt Formular zurück, Fokus auf Textfeld |

---

### 3.19 vertretung.html · Abwesenheiten
**Hauptaufgabe:** Abwesenheiten anlegen, ansehen und beenden, die Vertretungslinie je Bereich mit Vollmacht pflegen und die Übernahmefähigkeit je Person zeigen.
**Darstellungsformen:** Kartenliste in aufklappbaren Gruppen, Tabelle (Vertretungslinie, unter 560 px gestapelt), Balkendiagramm (Übernahmefähigkeit), Seitenspalte, Dialog „Abwesenheit anlegen“.
**Navigation/Einstieg:** `gfMountTopbar("vertretung")` (vertretung.html:252). Liest keine URL-Parameter; verlinkt `uebergabe.html?id=`, `rueckkehr.html?id=`, `board.html?owner=…&luecke=1`.

| ID | Fähigkeit / Auslöser | Verborgener Zugang | Datenquelle | Speicherwirkung | Zustände |
|---|---|---|---|---|---|
| F-vertretung-01 | Laden von Abwesenheiten, Vertretungslinie, Strängen, Übernahmefähigkeit (241-250, 254) | Testabwesenheiten eingeschlossen (243) | gfweekly:`absence_list`, `deputies_list`, `cycle_get`, `uebernahme_stat`, `people_list` | liest | „lädt …“ (43); Fehler von `absence_list`/`deputies_list` nicht abgefangen |
| F-vertretung-02 | Abwesenheitskarten nach Aktiv/Geplant/Rückkehr/Beendet mit Zählern (78-118) | Gruppe Beendet zugeklappt (117) | `absence_list` (zaehler) | liest | leer mit Hinweis (111) |
| F-vertretung-03 | „Übergabe öffnen“, „Rückkehr“ (101-102) | `?id=` | – | liest | – |
| F-vertretung-04 | „Beenden“ (103, 207-211) | `confirm()` | gfweekly:`absence_end` (ohne `by`) | fachlich bestätigen | Fehler als Toast (211) |
| F-vertretung-05 | Dialog „Abwesenheit anlegen“: wer, ab, bis oder „unklar“ mit geschätzten Tagen, planbar/sofort, Kontakt mit Gesprächszeit, Notfallkanal (161-204) | Stepper-Grenzen nur im `title=` (core.js:59, 64); Platzhalter statt Label für Gesprächszeit und Kanal (177-178); kein Escape, keine Fokusführung | gfweekly:`absence_set` | Formular speichern, danach Sprung `uebergabe.html?id=` (201) | Fehler als Toast (202); keine Prüfung Ende vor Anfang im Browser |
| F-vertretung-06 | Vertretungslinie: Bereich und Vertretung je Zeile als Chips (120-131, 229-234) | speichert erst, wenn beide gesetzt sind (220) | gfweekly:`deputies_set` | sofort speichern | 409 „schon eine Zeile“ als Toast (226) |
| F-vertretung-07 | Vollmacht als Freitext, speichert 1,5 s nach dem Tippen (128, 235-239) | nur Platzhalter; Speichern zeitgesteuert | `deputies_set` | sofort speichern | Toast „Gespeichert“ (225) |
| F-vertretung-08 | „+ Zeile“ (142, 213) | Zeile nur lokal bis zur ersten Speicherung | lokal | – | – |
| F-vertretung-09 | Zeile abschalten ✕ (129, 214-217) | Zweck nur im `title=`; kein Bestätigungsdialog | `deputies_set` active false | sofort speichern | Fehler als Toast (217) |
| F-vertretung-10 | Übernahmefähigkeit je Person als Prozentbalken, Link zu Lücken (146-158) | Link `board.html?owner=<Person>&luecke=1` (155) | gfweekly:`uebernahme_stat` | liest | „keine Themen“ (152); Fehler still (246) |

---

### 3.20 uebergabe.html · Übergabe
**Hauptaufgabe:** Den Korb einer Abwesenheit sichten und je Zeile Cluster, Ampel, Vertretung, Frist und Regel festlegen, Vorschläge bestätigen, Vertretungsbrief erzeugen und bestätigte Punkte nach Asana senden.
**Darstellungsformen:** Kopf mit Aktionen, Hinweisbänder, Quadranten-Kacheln als Filter, Filterleiste mit Chips und Haken, Zeilenkarten mit Chip-Reihen, aufklappbares Dossier (Definitionsliste), Protokoll (`<details>`), Textdialog (core.js `gfTextModal`).
**Navigation/Einstieg:** `gfMountTopbar("uebergabe")` (uebergabe.html:335). URL `?id=<Abwesenheit>` (314); ohne `?id=` die nächste aktive, sonst geplante, sonst Rückkehr (321-322).

| ID | Fähigkeit / Auslöser | Verborgener Zugang | Datenquelle | Speicherwirkung | Zustände |
|---|---|---|---|---|---|
| F-uebergabe-01 | Abwesenheit und Korb laden, Personen für die Vertretung (313-333, 337) | URL `?id=` (314) | gfweekly:`handover_list`, `absence_list` (include_test), `people_list` | liest | „lädt …“ (38); leer „Keine Abwesenheit“ mit Link zum Anlegen (327-329); Ladefehler nicht abgefangen |
| F-uebergabe-02 | Kopf: Zeitraum, Tag x von y, Stufe, Art, Kontakt; Hinweise Wache, Unvollständig, Ausschnitt (72-100) | – | `handover_list` | liest | – |
| F-uebergabe-03 | Quadranten Sofort/Planen/Delegieren/Warten als Filter (101-108, 245-248) | Bedeutung zusätzlich im `title=` (105) | lokal | liest | – |
| F-uebergabe-04 | Filter Cluster A-E und Ampel (109-115, 249-254) | Clusterbedeutung im `title=` (111) | lokal | liest | – |
| F-uebergabe-05 | Haken „nur Vorschläge“ (Standard an), „nur Lücken“ (116-122) | – | lokal | liest | leer mit Hinweis (165) |
| F-uebergabe-06 | „Alle Vorschläge übernehmen“ für die aktuelle Ansicht (120, 214-227) | in der Wache gesperrt, Grund im `title=` (120); `confirm()` | gfweekly:`handover_set_many` (ohne expect) | fachlich bestätigen | Teilfehler im Toast, höchstens drei Titel, Rest nur in der Konsole (221-224) |
| F-uebergabe-07 | Zeile: Cluster-Chip setzen (136, 236-238) | Bedeutung im `title=` (136) | gfweekly:`handover_set` (ohne expect) | sofort speichern | in der Wache gesperrt (134); Toast „Gespeichert“/Fehler (206-207); bei „nur Vorschläge“ blendet die Zeile nach 400 ms aus (204) |
| F-uebergabe-08 | Zeile: Ampel-Chip setzen (135) | – | `handover_set` | sofort speichern | wie F-07 |
| F-uebergabe-09 | Zeile: Vertretung wählen, erneuter Klick entfernt sie (137, 238) | Abwahl durch zweiten Klick | `handover_set` | sofort speichern | wie F-07 |
| F-uebergabe-10 | Zeile: Frist ändern (156, 240-244) | – | `handover_set` | sofort speichern | in der Wache gesperrt |
| F-uebergabe-11 | Zeile: Regel oder Notiz für die Vertretung (157, 240-244) | nur Platzhalter, kein Label; speichert bei `change` | `handover_set` | sofort speichern | in der Wache nicht gesperrt (siehe BEKANNTE-MAENGEL Befund 6) |
| F-uebergabe-12 | Achsen Z/F/U/G der Matrix (146) | Begründung und Achsennamen nur im `title=` | `handover_list` | liest | – |
| F-uebergabe-13 | Dossier auf-/zuklappen (147, 231-232) | Knopf nur mit Chevron und `aria-label`, ohne `aria-expanded` | lokal | liest | „Das Haus weiß … nichts außer dem Titel“ (190) |
| F-uebergabe-14 | „Dossier neu“ (192, 233-235) | nur im aufgeklappten Dossier | gfweekly:`handover_dossier` | sofort speichern | Toast Erfolg/Fehler (234-235) |
| F-uebergabe-15 | Weiter zu Thema („Stand ergänzen“), Sichtungskorb oder Akte (141, 193-195) | `board.html?topic=`, `vorhaben.html?v=` | – | liest | – |
| F-uebergabe-16 | „Vertretungsbrief“: Text mit Kontakt, Notfall, Vertretung je Bereich, Listen nach Ampel (90, 257-276) | Dialog: Kopieren, „Per Mail senden“ (core.js:314-332) | gfweekly:`deputies_list`; Clipboard; `mailto:` | nach außen wirkend (Clipboard, Mail-Link) | Fehler bei deputies_list still (258) |
| F-uebergabe-17 | „Nach Asana“ (nur bei bestätigten Zeilen) (89, 280-298) | `confirm()`; öffnet Asana im neuen Fenster (294) | gfweekly:`asana_export` | nach außen wirkend (Asana) | Knopf „läuft …“ (283); fehlendes Token als eigener Toast (296) |
| F-uebergabe-18 | Protokoll ansehen und Notiz eintragen (40-46, 301-311) | Eingabe nur mit Platzhalter | gfweekly:`handover_log`, `handover_log_add` | Formular speichern | „noch nichts“ (303-305); Fehler als Toast (310) |

---

### 3.21 rueckkehr.html · Rückkehr
**Hauptaufgabe:** Nach einer Abwesenheit zeigen, was in Vertretung entschieden, weitergegeben und erledigt wurde, was wartet und wie die Vorhaben-Bälle stehen, und die Rückübergabe bestätigen.
**Darstellungsformen:** Kopfbereich mit Briefing, KPI-Kacheln, Zeilenlisten, aufklappbare Mehr-Liste (`<details>`).
**Navigation/Einstieg:** `gfMountTopbar("rueckkehr")` (rueckkehr.html:177). URL `?id=<Abwesenheit>` (137); ohne `?id=` gewinnt die erste Abwesenheit im Status Rückkehr der aktiven Person, sonst irgendeine (140).

| ID | Fähigkeit / Auslöser | Verborgener Zugang | Datenquelle | Speicherwirkung | Zustände |
|---|---|---|---|---|---|
| F-rueckkehr-01 | Abwesenheit wählen und laden (136-149) | URL `?id=` (137); Testabwesenheiten eingeschlossen (138) | gfweekly:`absence_list` (include_test), `handover_list`, `handover_log` | liest | leer „Keine Rückkehr offen“, Bestätigen ausgeblendet (141-143); Ladefehler nicht abgefangen (Gate-Fehlerpfad, core.js:125-126) |
| F-rueckkehr-02 | Kopf „Willkommen zurück“, Zeitraum, Briefing der Rückkehr (79-84) | – | `absence_list` (note_rueckkehr) | liest | – |
| F-rueckkehr-03 | Kacheln: entschieden, weitergegeben, wartet, Asana offen/erledigt (85-98) | Asana-Kachel nur, wenn Zeilen eine Asana-Kennung haben; `title=` (96) | `handover_list`, `handover_log` | liest | – |
| F-rueckkehr-04 | Liste „In Vertretung entschieden“ (Entscheidung, Weitergabe, Erledigt) (99-109) | – | `handover_log` | liest | leer (108) |
| F-rueckkehr-05 | „Gesehen“ je Eintrag als persönliche Lesebestätigung (72-77, 105) | nur im Browser | localStorage `gf_rk_gesehen_<id>` | sofort speichern (nur Browser) | – |
| F-rueckkehr-06 | „Wartet auf dich“ (rot und ruhend) mit „Übernehmen“ (110-129) | kein Bestätigungsdialog | gfweekly:`handover_zurueck` | sofort speichern | Fehler als Toast (128); leer (119) |
| F-rueckkehr-07 | „Deine Vorhaben zurück“: Ball zurück/noch in Vertretung/hat geruht, Verlauf seit Abreise, fünf plus Rest aufklappbar (153-174) | Link `vorhaben.html?v=…&tab=verlauf` (170) | gfweekly:`vorhaben_rueckkehr` | liest | „lädt …“ `role="status"` (154); Fehler `role="alert"` mit „noch einmal laden“ (158-159); leer (162) |
| F-rueckkehr-08 | „Rückübergabe bestätigen“ beendet die Abwesenheit, danach Startseite (55, 130-134) | gesperrt, bis die Vorhaben geladen sind, Grund nur im `title=` (156, 159); `confirm()` | gfweekly:`absence_end` (archiviert serverseitig Asana, index.ts:1928-1934) | fachlich bestätigen, nach außen wirkend (Asana) | Fehler als Toast (133); keine Prüfung, ob die aktive Person die zurückkehrende ist |

---

### 3.22 seiten.html · Wichtige Seiten
**Hauptaufgabe:** Übersicht der Arbeitsseiten der Geschäftsleitung mit Vorschaubild, Zweck und hinterlegtem Zugang; Seiten und Bereiche pflegen.
**Darstellungsformen:** Kennzahlenleiste, Kacheln (Karten mit Bild), Liste (Tabellenzeilen mit Kopfzeile), Schnellstart (Bildraster), Inline-Formular.
**Navigation/Einstieg:** `gfMountTopbar("seiten")` (seiten.html:252). Keine URL-Parameter.

| ID | Fähigkeit / Auslöser | Verborgener Zugang | Datenquelle | Speicherwirkung | Zustände |
|---|---|---|---|---|---|
| F-seiten-01 | Laden von Bereichen und Seiten (seiten.html:80-83) | – | gfweekly:`sites_list` (liefert auch hinterlegte Zugangsdaten an den Browser) | liest | laden „lädt …“; Fehler „Fehler beim Laden: …“ (seiten.html:82); leer „Noch keine Seiten hinterlegt.“ (seiten.html:113) |
| F-seiten-02 | Kennzahlen Seiten/Bereiche/mit Zugang/mit Vorschau (seiten.html:88-92) | – | lokal | liest | – |
| F-seiten-03 | Suche über Name, URL, Zweck, Notizen, Zugangsnutzer, Hinweis, Bereich (seiten.html:40, 75-78, 244) | Taste `/` (seiten.html:245) | lokal | liest | „Keine Seite passt zur Suche.“ |
| F-seiten-04 | Ansicht Kacheln/Liste/Schnellstart (seiten.html:41-45, 246) | title= je Knopf | localStorage `gf_sites_mode` | liest | – |
| F-seiten-05 | Filter Aktiv / Alle inkl. Entwurf & Archiv (seiten.html:46-49, 247) | – | lokal | liest | – |
| F-seiten-06 | Seite öffnen (Name, Vorschaubild, „Öffnen ↗“, neuer Tab) (seiten.html:119-122, 141, 165, 174) | Vorschaubild ist doppelter Link mit tabindex=-1 | – | – | Platzhalter mit Hostname ohne Vorschau |
| F-seiten-07 | Link kopieren ⧉ (seiten.html:141, 169, 213) | Symbolknopf nur title= „Link kopieren“ | core.js `gfCopy` | nach außen wirkend (Clipboard) | Toast (auch bei Fehlschlag, siehe Querschnitt) |
| F-seiten-08 | Zugangsdaten anzeigen/verbergen (seiten.html:126, 131, 215) | Knopf „zeigen/verbergen“, Zustand nur im Speicher der Seite | lokal (REVEAL) | liest | – |
| F-seiten-09 | Zugangsnutzer bzw. Zugangskennwort kopieren ⧉ (seiten.html:130-131, 214) | Symbolknopf nur title= „Kopieren“ | core.js `gfCopy` | nach außen wirkend (Clipboard) | Toast |
| F-seiten-10 | Bearbeitungsmodus ein/aus (seiten.html:50, 248) | title= | lokal | – | Knopftext „✓ Fertig“ |
| F-seiten-11 | Seite bearbeiten (✎ nur im Bearbeitungsmodus) und speichern: Name, Bereich, URL, Zweck, Notizen, Zugangsfelder, Hinweis, Vorschaubild-Pfad, Status, Reihenfolge (Stepper) (seiten.html:181-203, 212, 230-237) | ✎ nur title=; Zugangskennwort als normales Textfeld (seiten.html:191) | gfweekly:`sites_save` (updated_by = gfWho) | Formular speichern | `required` an Name/URL; Fehler-Toast „Fehler: …“; keine Konfliktprüfung |
| F-seiten-12 | Neue Seite anlegen (seiten.html:51, 249) | schaltet Bearbeitungsmodus ein | gfweekly:`sites_save` | Formular speichern | wie F-seiten-11 |
| F-seiten-13 | Neuen Bereich anlegen über Chip „Neuer Bereich …“ (seiten.html:186, 222-229) | Name und Symbol über zwei `prompt()` | gfweekly:`category_save` | sofort speichern | Fehler-Toast; Abbruch setzt Chip zurück |
| F-seiten-14 | Seite löschen (seiten.html:200, 217, 240) | `confirm()` | gfweekly:`sites_delete` | sofort speichern (endgültig) | Fehler-Toast |
| F-seiten-15 | Aktualisieren ↻ (seiten.html:52, 250) | nur Symbol, title= | gfweekly:`sites_list` | liest | wie F-seiten-01 |
| F-seiten-16 | Lange Texte aufklappen (gfClamp) (seiten.html:132, 143, 170-171) | – | localStorage `gf_open_<key>` | liest | – |

---

### 3.23 bearbeiten.html · Bearbeiten
**Hauptaufgabe:** Themen und wiederkehrende Check-ins in allen Feldern pflegen, Links anhängen und das Team-Verzeichnis (Personen) bearbeiten.
**Darstellungsformen:** Segment-Umschalter (zwei Ansichten), Anlegezeile, aufklappbare Bearbeitungskarten mit Formular-Raster, Link-Liste je Thema, Personenkarten mit Formular.
**Navigation/Einstieg:** `gfMountTopbar("edit")` (bearbeiten.html:82), Hero „pflege“ compact. Keine URL-Parameter.

| ID | Fähigkeit / Auslöser | Verborgener Zugang | Datenquelle | Speicherwirkung | Zustände |
|---|---|---|---|---|---|
| F-bearbeiten-01 | Laden von Themen, Personen, Links (bearbeiten.html:83–88) | – | gfweekly:`list`, `people_list`, `links_all` | liest | kein Ladehinweis; Ladefehler nicht abgefangen (Fehler landet im verdeckten Gate-Feld); leer „keine“ (149–150) |
| F-bearbeiten-02 | Umschalter „Themen & Check-ins“ / „Team-Verzeichnis“ (35–38, 91) | – | lokal | liest | Zustand nur als Klasse `on`, ohne aria-pressed/aria-selected |
| F-bearbeiten-03 | „↻“ Aktualisieren (39, 92) | Knopf nur Symbol ohne Namen/Titel | wie F-bearbeiten-01 | liest | Toast „Aktualisiert“ / „Fehler“ |
| F-bearbeiten-04 | Neues Thema / Check-in anlegen mit Typ- und Prioritäts-Chips (45–48, 165) | Feld nur mit Platzhalter; leerer Titel setzt nur den Fokus | gfweekly:`add` | Formular speichern | Toast „Angelegt“ / „Konnte nicht anlegen“ |
| F-bearbeiten-05 | Karte auf-/zuklappen über Kopfzeile (105, 155) | Klick auf `div.eh` (nicht fokussierbar, keine Tastaturbedienung) | lokal | liest | Pfeil ▸/▾ als Zustand |
| F-bearbeiten-06 | Themenfelder bearbeiten (Titel, Kurzbeschreibung, Typ, Priorität, Status, Relevanz, Quellen, Zeit-Stepper, Rhythmus, Personenfelder mit Vorschlagsliste, Delegationsstatus, Datumsfelder, Textbereiche) (107–134) | Personenfelder mit `datalist` (98, 69, 89) | – | – | – |
| F-bearbeiten-07 | „Speichern“ je Thema (144, 156–157) | – | gfweekly:`update` (alle Felder der Karte) | Formular speichern | „✓ gespeichert“ blendet 1,5 s ein (157) + Toast; Fehler Toast „Speichern fehlgeschlagen“; keine Konfliktprüfung |
| F-bearbeiten-08 | Thema löschen (144, 158) | `confirm()` | gfweekly:`delete` | sofort speichern (Löschen) | Toast „Gelöscht“ / „Fehler“ |
| F-bearbeiten-09 | Link hinzufügen (Titel, Art-Chips, URL) (137–142, 159–160) | Felder nur mit Platzhalter | gfweekly:`link_add` | Formular speichern | Toast „Titel oder URL angeben“, „Link hinzugefügt“, „Konnte Link nicht speichern“ |
| F-bearbeiten-10 | Link entfernen „✕“ (100, 163) | Knopf nur Symbol, ohne Namen; keine Rückfrage | gfweekly:`link_delete` | sofort speichern (Löschen) | Toast „Link entfernt“ / „Fehler“ |
| F-bearbeiten-11 | Link öffnen (100) | neuer Tab | extern | liest | – |
| F-bearbeiten-12 | Person bearbeiten (Name, E-Mail, Rolle, Team, Notiz, aktiv, zuweisbar) und „Speichern“ (168–186) | – | gfweekly:`people_save` | Formular speichern | „✓“ 1,4 s + Toast; Fehler Toast „Fehler“ |
| F-bearbeiten-13 | Person entfernen (180, 187) | `confirm()` | gfweekly:`people_delete` | sofort speichern (Löschen) | Toast |
| F-bearbeiten-14 | Person hinzufügen (Name, E-Mail, Rolle) (60–65, 190–191) | Felder nur mit Platzhalter, feste Mindestbreiten inline | gfweekly:`people_save` | Formular speichern | Toast „Name oder E-Mail angeben“ |

---

### 3.24 aufraeumen.html · Aufräumen
**Hauptaufgabe:** Allen offenen Themen und Kandidaten einen „Ausgang“ (GF gemeinsam, Alex, Lea, Team, Plattform, Kann warten) geben, den Vorschlag des automatischen Laufs bestätigen oder korrigieren und optional eine Frist setzen.
**Darstellungsformen:** KPI-Kacheln, Filterleiste (Chips, Checkbox), Liste von Zeilenkarten mit Chip-Reihe und Datumsfeld.
**Navigation/Einstieg:** `gfMountTopbar("aufraeumen")` (aufraeumen.html:130), Hero „pflege“ compact (131). Keine URL-Parameter.

| ID | Fähigkeit / Auslöser | Verborgener Zugang | Datenquelle | Speicherwirkung | Zustände |
|---|---|---|---|---|---|
| F-aufraeumen-01 | Laden der Einträge und Stränge (aufraeumen.html:125–128) | – | gfweekly:`gate_list` (limit 1000), gfweekly:`cycle_get` | liest | Laden „lädt …“ (43); Fehler beim Laden nicht abgefangen (kein try/catch in `load`, Fehler landet im verdeckten Gate-Feld, core.js:125–126) |
| F-aufraeumen-02 | KPI-Kacheln: gesamt, unbestätigt, gehören der GF, zugewiesen (62–70) | – | aus `gate_list` | liest | Ton „warn“ ab Schwelle (66–67) |
| F-aufraeumen-03 | Filter nach Ausgang (Chips Alle … Kann warten) (37, 116) | – | lokal | liest | leer: „Nichts in dieser Ansicht.“ (92) |
| F-aufraeumen-04 | Checkbox „nur unbestätigte“ (38, 117) | – | lokal | liest | leer: „Alles bestätigt. Nichts wartet mehr auf einen Ausgang.“ (92) |
| F-aufraeumen-05 | Ausgang je Zeile per Chip wählen (75, 84, 105–110) | Vorschlag des Laufs als gestrichelter Chip (`.chip.prop`, styles.css:1315) | gfweekly:`gate_set` (by = gfWho) | fachlich bestätigen (sofort) | bestätigte Zeile blendet nach 600 ms + 250 ms aus (102); Fehler per Toast „Fehler: …“ (103) |
| F-aufraeumen-06 | Frist je Zeile (Datumsfeld) (85, 111–115) | wirkt nur, wenn schon ein Ausgang gesetzt ist, sonst still ohne Wirkung (114) | gfweekly:`gate_set` mit frist | sofort speichern | Fehler per Toast |
| F-aufraeumen-07 | „Alle Vorschläge übernehmen“ (40, 118–124) | Wirkung nur im `title` erklärt (40); `confirm()` (121) | gfweekly:`gate_set_many` | fachlich bestätigen (Sammelbestätigung) | „Nichts zu übernehmen“ per Toast (120); Ergebnis „n übernommen“ per Toast; Fehler per Toast |

---

### 3.25 checkin.html · Check-in vorbereiten
**Hauptaufgabe:** Vorbereitung auf das Weekly: Agenda aus den Board-Spalten, Neues seit der letzten Besprechung, fällige und lange offene Themen, letzte Besprechung.
**Darstellungsformen:** Zahlenkacheln (Dashboard), nummerierte Agenda-Liste (Links), vier Spalten mit Vorbereitungskarten, Karte „Letzte Besprechung“, Textdialog (Agenda kopieren/mailen).
**Navigation/Einstieg:** `gfMountTopbar("checkin")` (checkin.html:131); der Schlüssel „checkin“ steht nicht in `GF_NAV`, kein Eintrag aktiv, Seite nicht in der Seitenleiste. Hero „lager“ mit Knöpfen (132). Keine URL-Parameter.

| ID | Fähigkeit / Auslöser | Verborgener Zugang | Datenquelle | Speicherwirkung | Zustände |
|---|---|---|---|---|---|
| F-checkin-01 | Laden von Themen und letzten Besprechungen (134–137) | – | gfweekly:`list`, `sessions_list` (limit 5) | liest | Laden: Skelett-Platzhalter (133); Fehler „Fehler beim Laden: …“ (137) |
| F-checkin-02 | Kennzahlen Agenda, Neu, Termin, Lange offen mit Hochzählen (94–99) | – | aus `list` | liest | Hochzählen respektiert reduzierte Bewegung (core.js:274) |
| F-checkin-03 | Agenda-Liste in Reihenfolge des Besprechungsmodus, Eintrag öffnet Thema im Board (68–71, 102–106) | Ziel `board.html?topic=<id>` | aus `list` | liest | leer: „Nichts zu besprechen …“ mit Link auf Eingabe (105) |
| F-checkin-04 | Checkbox „wiederkehrende zeigen“ (38, 128) | gemerkt in localStorage `gf_board_rec` (60, 128), geteilt mit dem Board | lokal | liest | – |
| F-checkin-05 | „Besprechung starten“ (39, 132) | Direktlink `board.html?meeting=1` | – | liest | – |
| F-checkin-06 | „Agenda kopieren“ öffnet Textdialog mit Kopieren und „Per Mail senden“ (40, 121–127) | `mailto:`-Link im Dialog (core.js:318) | lokal erzeugter Text | nach außen wirkend (Clipboard, Mail-Link) | leer: Toast „Keine Themen in der Agenda“ (127) |
| F-checkin-07 | Vorbereitung in vier Spalten: neu seit letzter Besprechung, Termin diese Woche/überfällig, länger als vier Wochen offen, entschieden mit nächstem Schritt (108–112) | Karten verlinken auf `board.html?topic=` | aus `list` | liest | leer-Texte je Spalte („nichts Neues“ …) |
| F-checkin-08 | Letzte Besprechung mit Link „Entscheidungslog“ (114–117) | – | aus `sessions_list` | liest | ohne Sitzung leer; „läuft noch“ (116) |

---

## 4. Querschnitt-Befunde für einen Gestaltungs- und Bedienstandard

Zusammengeführt aus dem Kern (`core.js`, `game.js`, `eggs.js`, `styles.css`) und den fünf Seitengruppen. Die vollständigen Einzelbeobachtungen je Gruppe stehen im Anhang. Q-Nummern sind fortlaufend und dienen als Bezug.

### 4.1 Rechte, Anmeldung, Identität

- **Q01 Personenwahl ist keine Anmeldung.** Alle Rechte „nur Alex oder Lea“ prüfen den Namen, den der Browser selbst mitschickt (`core.js:14, 206, 217`; `game.js:34` hängt `who` an jeden Aufruf). Server: EF:1110–1116, 2503–2504, 2559–2560; `organisation/index.ts:53`; `besetzung/index.ts:133`; `arbeiten/index.ts:66`. Im Code selbst als „keine Sicherheitsfunktion“ benannt (`arbeiten.html:1065`).
- **Q02 Bestätigende Person frei wählbar, unabhängig von der aktiven Person:** `launch.html:384, 409`, `saison.html:325`.
- **Q03 Uneinheitliche Personenregel je Funktion:** `launch_send`/`launch_sync` ohne Personenprüfung (EF:2594), `saison` nimmt jeden Namen an (`saison/index.ts:35`), `absence_end` und `absence_set` ohne `by`/`who` aus `vertretung.html:193–199, 211`, „Rückübergabe bestätigen“ für jede gewählte Person (`rueckkehr.html:130–134`).
- **Q04 Zugangsdaten Dritter im Klartext im Browser:** `sites_list` liefert Benutzername und Passwort; „verbergen“ ist nur Anzeige (`seiten.html:126, 191, 214`).
- **Q05 Gate:** Passwortfeld nur mit Platzhalter (z. B. `index.html:28`; nur `arbeiten.html:209` hat `aria-label`), Fehlerzeile ohne Live-Region (`index.html:30`), kein Abmelden.

### 4.2 Fehlerbehandlung und Rückmeldung

- **Q06 Ladefehler werden unsichtbar und löschen das Passwort.** `gfGate` führt `onReady()` im selben `try` aus wie die Passwortprüfung und blendet das Gate vorher aus; ein Fehler beim Seitenaufbau landet in der versteckten Gate-Fehlerzeile, und `sessionStorage.gf_pw` wird gelöscht (`core.js:125–126`). Betroffen, weil `load()` dort kein eigenes `catch` hat: `aufraeumen.html:125–133`, `bearbeiten.html:82–88`, `inbox.html:46–47`, `rueckkehr.html:136–149`, `uebergabe.html:313–333`, `vertretung.html:241–250`, `cockpit.html:98, 105`.
- **Q07 Hängende „lädt …“-Zustände** nach Teilfehlern: `index.html:41, 259–288`, `entscheidungen.html:52, 77`, `jahr.html:63, 367–371`, `launch.html:486`. Ladefehler als Leerzustand getarnt: `besprechung.html:231–233` („Noch keine Besprechung protokolliert“).
- **Q08 Fehler fast nur als Toast:** `gfToast` 2,6 s, ohne Rolle (`core.js:33–37`); statisches `#toast` ohne Live-Region in 24 von 25 Seiten (nur `arbeiten.html:315` mit `role="status"`). Oft ohne Ursache: `bearbeiten.html:158, 163, 186, 187`, `cockpit.html:276, 281, 286`.
- **Q09 Gute Gegenbeispiele** (als Muster für den Standard): Statuszeile mit `aria-live`, Fokusführung und Sperre bei veraltetem Stand in `kommunikation.html:147–149, 462–486`; Fehler mit `role="alert"` im Einwurf (`core.js:825`) und in Vorhaben-Dialogen (`vorhaben.html:512`); Statuszeile in `arbeiten.html:219–220`.
- **Q10 Hintergrundaufrufe ohne Fehleranzeige:** Zähler der Seitenleiste (`core.js:229–232`), Einchecken (`game.js:116`), Taler-Ereignisse (`core.js:330`, `entscheidungen.html:191`).
- **Q11 `gfCopy` meldet Erfolg, bevor das Kopieren gelungen ist** (`core.js:38`, `writeText` nicht abgewartet).
- **Q12 Kein Offline-Zustand:** kein Service Worker, keine `navigator.onLine`-Prüfung; Netzfehler erscheinen als „Fehler: …“ bzw. gar nicht (Q06).

### 4.3 Konflikte und gleichzeitiges Bearbeiten

- **Q13 Konfliktschutz nur in Teilen.** Mit gesehenem Stand: Einwurf (`core.js:884–885`, `revision`, `expect`, `expect_ball`), Vorhaben (`vorhaben.html:258, 370, 393, 429, 587`), Kommunikation (`kommunikation.html:418`), Organisation (`organisation.html:507–511`, `expect_rev`), Besetzung (`besetzung.html:311–313`, `version`), Saisonzeilen mit Plattformtermin (`saison/index.ts:157, 180`).
- **Q14 Ohne Schutz, letzter Schreiber gewinnt:** Themen `update` (EF:1406–1424) mit Board-Autosave nach 1,5 s (`board.html:213`), `decision_update`, `sites_save`, `milestone_save` (EF:1573–1580), `gate_set` (aufraeumen), `launch_set` (`launch.html:435–467`, Sofortspeichern), Saison-Rad `item_save`/`row_save`, Organisation `begruendung`/`tor` (`organisation/index.ts:86, 139`), `punkt_toggle` (`vorhaben.html:379`). `uebergabe.html:200, 219` schickt keinen Stand mit, obwohl der Server ihn auswertet (EF:2004–2012).
- **Q15 Konflikt wird am Fehlertext erkannt, nicht am Status 409:** `gfApi` gibt den Status nicht weiter (`core.js:27`); Regex `/inzwischen|geändert/` in `core.js:892`, `vorhaben.html:372, 394`, `/geändert/i` in `kommunikation.html:420`. Das Kennzeichen `konflikt` aus `handover_set_many` (EF:2014) wird nicht ausgewertet.
- **Q16 Besprechungszustand nur im Gerät:** `localStorage.gf_meeting` (`board.html:365`) und `gf_besprechung` (`besprechung.html:66`), zwei getrennte Stände; „gesehen“-Marken ebenfalls je Browser (`core.js:440–443, 709–711`).

### 4.4 Bedienbarkeit (Tastatur, Zeiger, versteckte Zugänge)

- **Q17 Klick auf nicht fokussierbaren Elementen:** `cockpit.html:180, 200–202, 221–233, 257` (div/span als Aufklapper und Kartenziel), `cockpit.html:224, 260` (Prioritäts-Pill wechselt reihum, nur über `title=` erklärt), `bearbeiten.html:105, 155` (Kartenkopf ohne Tastaturzugang), `saison-rad.html:143, 177` (SVG-Formen und -Texte, nur Maus). Positiv: Board-Karte `tabindex=0` mit Enter (`board.html:127, 196`), Diagrammziele in `kommunikation.html:312, 336–338` mit Tastatur.
- **Q18 Ziehen:** Board-Spalten (`board.html:193–201`) mit Alternative ⇄-Menü (`board.html:348–361`), aber Reihenfolge innerhalb der Spalte nur per Ziehen (Menü legt ans Ende, `board.html:357`); Menü ohne Escape und Fokus. Vorhaben-Board (`vorhaben.html:219–225`) mit Alternative „Ball weitergeben“ (`vorhaben.html:142`). HTML5-Ziehen funktioniert auf Touchgeräten in der Regel nicht.
- **Q19 Kein Rechtsklick, kein Doppelklick** in der ganzen App (Grep `contextmenu`, `dblclick`: keine Treffer).
- **Q20 Nur bei Zeiger sichtbare Bedienung:** ⇄ mit Deckkraft .55 bis Hover/Fokus (`styles.css:679–681`), „Ball weitergeben“ mit Maus nur bei Hover/Fokus (`styles.css:1655–1658`), Infozeile im Jahresrad nur bei `mouseenter` (`saison-rad.html:143, 188–192`). Der Fokus-Rückweg in `core.js:744–745` behandelt diesen Fall ausdrücklich.
- **Q21 Wichtige Information nur in `title=`:** Stepper-Grenzen (`core.js:59, 64`), Gründe gesperrter Knöpfe (`rueckkehr.html:156`, `organisation.html:407`, `saison.html:331, 391`), Matrix-Begründung (`uebergabe.html:146`), Jahresband-Werte an nicht fokussierbaren `span` (`kommunikation.html:373, 375`), Namen überlasteter Personen (`launch.html:252`), Wirkung von „Alle Vorschläge übernehmen“ (`aufraeumen.html:40`), Meilensteintexte unter 600 px (`jahr.html:137–163`, `styles.css:489, 548`).
- **Q22 Symbolknöpfe ohne zugänglichen Namen:** ✎ ✕ ⧉ ↻ ← → ▶ ◀ nur mit `title=` oder ganz ohne (`bearbeiten.html:39, 100`; `entscheidungen.html:121, 160`; `seiten.html:52, 130–145`; `jahr.html:159–161, 221`; `besprechung.html:145`; `board.html:397`; `cockpit.html:63`). Der ✕ in `bearbeiten.html:100` löscht ohne Rückfrage.
- **Q23 Zustand ohne ARIA:** Theme-Umschalter und Personenwahl nur Klasse `on` (`core.js:187, 206, 213–217`), Chips in `capture.html:39–46`, Segmente `bearbeiten.html:35–38`. Die Chip-Reihe des Kerns setzt dagegen `aria-pressed` (`core.js:49, 54`).
- **Q24 Tastaturkürzel unsichtbar:** „/“ nur im Platzhalter erwähnt (`neuigkeiten.html:53`), „möhre“ undokumentiert; ein einzelner Klick auf die Marke navigiert wegen Easter Egg erst nach 380 ms (`eggs.js:28–31`).

### 4.5 Formulare

- **Q25 Platzhalter statt Label:** Gate (alle Seiten), Suchfelder (`board.html:37`, `cockpit.html:54`, `entscheidungen.html:39`, `seiten.html:40`, `neuigkeiten.html:53`), Neuanlage (`cockpit.html:67`, `jahr.html:77`, `bearbeiten.html:45, 61–63, 138, 140`, `inbox.html:68`), Übergabe/Vertretung (`uebergabe.html:45, 157`, `vertretung.html:128, 177–178`).
- **Q26 Labels ohne Verknüpfung** (Geschwister ohne `for`): `capture.html:35–50`, `bearbeiten.html:96–99`, `board.html:246–255`, `seiten.html:185–195`, `jahr.html:232–241`, `saison-rad.html:237–248`. Gut gelöst: Akte und Einwurf (`vorhaben.html:304, 314, 409–413`, `core.js:789`).
- **Q27 Drei Speicherarten nebeneinander, ohne einheitliche Kennzeichnung:** Sofortspeichern (Launch, Board-Panel 1,5 s, Saison-Rad), Formular mit Knopf (Kommunikation, Akte), zweistufig mit Bestätigung (Einwurf, Übergabe). Kein Rückgängig außer Board (5 s Toast-Knopf, `board.html:186–188`) und „Zuordnung gelöst“ in Vorhaben (`vorhaben.html:319`).
- **Q28 Doppelte Anlage möglich:** Speichern ohne Sperre oder Ladezustand in `capture.html:73–76` und `bearbeiten.html`.

### 4.6 Dialoge und Bestätigungen

- **Q29 Kein `<dialog>`-Element; acht eigene Bauarten:** `gfTextModal` (kein Escape, keine Fokusführung, `core.js:314–332`), `gfNewsModal` (Escape, keine Falle, `core.js:461–480`), Einwurf/Vorhaben mit `gfModalAuf` (inert, Tab-Falle, Fokus zurück, `core.js:729–746`, `vorhaben.html:239, 463`), Board-Panel als `aside` ohne Fokusführung (`board.html:60–64, 272`), Bereinigen-Overlay (`board.html:293–326`), „Abwesenheit anlegen“ ohne Escape/Fokus/Hintergrundklick, Listener wird bei jedem Öffnen erneut angehängt (`vertretung.html:164–189`), Saison-Rad-Panel ohne Fokus (`saison-rad.html:212–215`), Spielkarten (`game.js:85–94`). Muster mit `gfModalAuf` ist das vollständigste.
- **Q30 Native Browser-Dialoge an 32 Stellen** (`confirm()`/`prompt()`), auch für fachlich wirksame Schritte nach außen: Asana-Versand (`kommunikation.html:395`, `launch.html:420`, `uebergabe.html:282`, `saison.html:468`), Neuanlage per `prompt()` (`board.html:345`, `seiten.html:225–226`, `besprechung.html:127`).
- **Q31 Uneinheitliche Rückfrage:** ohne Rückfrage löschen bzw. verwerfen: Punkt (`vorhaben.html:421`), Kandidat (`neuigkeiten.html:210`), Link (`bearbeiten.html:100`), Vertretungszeile (`vertretung.html:216`). Zweiklick-Bestätigung ohne Ansage: `arbeiten.html:952–956`. Inline-Bestätigung: `besetzung.html:257`.

### 4.7 Darstellung, Formatierung, Layout

- **Q32 „Heute“ wird auf mindestens vier Arten bestimmt**, teils mit Fehler um einen Tag: lokale Mitternacht plus `toISOString` ergibt in Berlin den Vortag (`board.html:101–102`, `entscheidungen.html:66–67`, `checkin.html:61–62`); UTC (`uebergabe.html:74`, `vertretung.html:162`, `saison-rad.html:128`, `cockpit.html:89`, `core.js:293` `gfTomorrow`); lokal per `sv-SE` (`index.html:83`, `besprechung.html:59`); Berlin explizit (`vorhaben.html:82`, `besetzung.html:182`). Fest verdrahtet: `HEUTE="2026-10-05"` (`organisation.html:264, 330`).
- **Q33 Datumsformate je Seite eigen:** Kernhelfer `gfFmtShort`, `gfFmtDay`, `gfFmtTime`, `gfFrist`, `gfVhTag`, `gfNewsWhen`, `gfTeamShortDate` (`core.js:91–96, 333–338, 445–452, 533, 701`) neben eigenen `fmtD`/`fmt`/`datumDE` (`aufraeumen.html:59`, `inbox.html:49`, `arbeiten.html:339`, `index.html:87`, `uebergabe.html:70`, `vertretung.html:75`, `saison-rad.html:127`) und Logik-eigenen `kurz()` in UTC (`komm-logik.js:35–45`, `launch-logik.js:30–38`). Zahlen einheitlich über `toLocaleString("de-DE")` (`core.js:107`, `launch-logik.js:43`).
- **Q34 Feste Mindestbreiten:** Zeitachse 900 px mit Querscroll (`organisation.html:122`), Akte 380 px (`organisation.html:48`), Inline-`min-width` in `bearbeiten.html:61–63, 138–140`, Suchfelder 200–220 px (`styles.css:202, 219, 350, 546, 604`). Bekannter Mangel: Überlauf bei 390 px (`docs/BEKANNTE-MAENGEL.md`, Befund 26, teils behoben).
- **Q35 Status nie nur Farbe** ist im Kern angelegt (`gfZustand`, `gfAmpel`, `gfQuadrant`, `core.js:77–97`); Kontrastschuld ist dokumentiert (`docs/BEKANNTE-MAENGEL.md`, Nachtrag 22.09.: 18 Muster unter 4,5:1, u. a. Platzhalterfarbe).
- **Q36 Inhalte fest im HTML** statt in Daten: `organisation.html:265–313`, `saison-steckbriefe.html:147–335`.

### 4.8 Bewegung

- **Q37 Globale Abschaltung** aller CSS-Animationen und -Übergänge bei `prefers-reduced-motion: reduce` (`styles.css:596`); Laufband steht und wird scrollbar (`styles.css:1013`); `gfCountUp`, `game.js`, `eggs.js` prüfen die Einstellung in JS (`core.js:274`, `game.js:12`, `eggs.js:8`).
- **Q38 Nicht abgedeckt:** `scrollIntoView({behavior:"smooth"})` aus JS (`besprechung.html:246`, `organisation.html:612, 619`, `neuigkeiten.html:254`); Ausblenden per Inline-Opacity und Timeout (`aufraeumen.html:102`, `uebergabe.html:204`); automatischer Weitersprung nach 200 ms (`arbeiten.html:839, 887`); Sekundentimer in der Besprechung (`besprechung.html:183`). Spielkarten schließen sich nach 7–9 s selbst (`game.js:92`), außer bei Zeiger darüber.

### 4.9 Export, Kopieren, nach außen

- **Q39 Kein CSV, kein Download, kein Druck** in der Oberfläche (Grep `download|Blob|csv|print`: keine Treffer in `site/`; `csvZeilen` in `komm-logik.js:282` nur für den Server).
- **Q40 Kopieren** nur über `gfCopy`: Protokoll, Wochenmail, Vertretungsbrief im Textfenster, Delegations- und Asana-Text (`cockpit.html:267–268`), Link und Zugangsdaten (`seiten.html:213–214`).
- **Q41 Mail** nur als `mailto:` an beide GF aus dem Textfenster (`core.js:318`), nie automatisch.
- **Q42 Wirkung nach außen, teils schon beim Laden:** Asana-Senden (Launch, Saison, Besetzung, Übergabe, Kommunikation); Asana-Rückweg **beim bloßen Öffnen** von `launch.html` (EF:2375–2386, wenn der älteste Abgleich älter als 60 min ist) und `besetzung.html` (`besetzung/index.ts:112–116`): liest Asana und schreibt Stände in die Kompass-Datenbank; Text an die KI beim Einwurf und beim Bereinigen.
- **Q43 Taler-Ereignisse an der falschen Stelle:** Wochenmail zählt schon beim Öffnen des Entwurfs (`entscheidungen.html:191`), Protokoll beim Klick auf den Mail-Link, nicht beim Versand (`core.js:330`).

### 4.10 Ladeanzeigen und Live-Regionen

- **Q44 Ladeanzeigen uneinheitlich:** überwiegend statischer Text „lädt …“ ohne Rolle (z. B. `aufraeumen.html:43`, `inbox.html:37`, `vorhaben.html:53`, `kommunikation.html:155`, `launch.html:151`, `organisation.html:211`), Skelette über `gfSkeleton` (`core.js:279`; `board.html:475`, `checkin.html:133`, `saison-rad.html:324`, Plattformen `core.js:667`), Knopftextwechsel („läuft …“, „sendet …“, „holt …“, „Claude liest …“: `uebergabe.html:283`, `launch.html:414, 421`, `besetzung.html:338, 362`, `board.html:312`), `aria-busy` nur in `arbeiten.html:752`. Schreibvorgänge oft ohne Ladezustand (Q28).
- **Q45 Live-Regionen nur auf 5 von 25 Seiten:** `arbeiten.html:220, 306, 315, 598`, `kommunikation.html:147, 250–253, 318, 472`, `organisation.html:211, 236, 240`, `vorhaben.html:37, 53, 319, 501, 512`, `rueckkehr.html:154, 158`, dazu der Einwurf (`core.js:808–825`). Auf den übrigen 20 Seiten werden weder Toasts noch Speicherstatus noch Ladefehler angesagt (z. B. Panel-Speicherstatus `board.html:212`, „✓ gespeichert“ `cockpit.html:167`, Autosave-Zustand im Saison-Rad).

---

## 5. Unerreichbare oder ohne echtes Backend nicht prüfbare Bereiche

**Nur mit echtem Backend und gemeinsamem Passwort.** Ohne das Passwort bleibt jede Seite hinter dem Gate. Die vorhandenen Bedienproben ersetzen das Backend durch Testdaten (`docs/TECHNIKSTAND.md:103–111`; `docs/BEKANNTE-MAENGEL.md`, Befund 29: sie belegen die Oberfläche, nicht die Wirkung in der Datenbank). Für ein Inventar per Browser heißt das: Zustände wie 409-Konflikt, 403 „nur Alex oder Lea“ oder Teilerfolge sind nur mit präparierten Antworten vorführbar.

| Bereich | Warum nicht direkt prüfbar | Beleg |
|---|---|---|
| Asana (Export Vertretung, Launch senden und Rückweg, Besetzung senden, Kommunikation Rahmen) | Echte Aufgaben in einem externen Arbeitsbereich; Token nur serverseitig; Rückweg zusätzlich stündlich per pg_cron | EF:706–708, `asana_export` EF:2201, `asana_sync` EF:2361, `launch_send` EF:2591, `launch_sync` EF:2746; `besetzung/index.ts:188, 227`; `docs/TECHNIKSTAND.md:576` |
| KI-Aufrufe (Anthropic) | Einwurf-Vorschlag, Bereinigen-Vorschlag; Antworten sind nicht deterministisch, Ausfall nur als „ohne Vorschlag“ sichtbar | EF:139–141 (`tidy_suggest`), EF:1222–1224 (`einwurf_add`/`einwurf_vorschlag`), `core.js:808` |
| Google-Tabelle (Kommunikation) | Schreiben über ein Dienstkonto, nur konfiguriert sichtbar (`kommTabelleConfigured`) | EF:1380; `supabase/functions/gfweekly/komm.ts` |
| Hub- und Plattformdaten | Lesesichten `hh_*`, `vvp_events`, `platform_digest`, Besetzungswerkstatt im Hub, Werkzeugregister im Hub; Inhalte entstehen außerhalb des Kompass | `saison/index.ts:6–11`, `besetzung/index.ts:3–8`, `arbeiten/index.ts:10`, `core.js:613–678` |
| Team- und Partneranalyse | Eigene Edge Function `tpa`, eigene Plattform; bei 401 Hinweis „Die Analyse kennt dieses Passwort nicht.“ | `core.js:521–530, 607–608` |
| Tägliche und zeitgesteuerte Läufe | `absence_tick` als Cron 04:40 UTC; täglicher Cowork-Auftrag schreibt Neuigkeiten, Lage-Absätze und Kandidaten; Abgleich-Auftrag liefert Einwürfe aus Mail/WhatsApp | `docs/TECHNIKSTAND.md:162, 239–289, 413–415`; `docs/BEKANNTE-MAENGEL.md` V31 Punkte 1–2 |
| Mail | Es wird nie selbst gesendet; nur `mailto:`-Links im Textfenster | `core.js:313–330` |
| Prüf- und Testhilfen | `probe_aufraeumen` (nur für Prüfskripte), `?game=…`, `?egg=…`, Testabwesenheiten mit `test=true`, Probe-Hinweis im Vorhaben-Dialog | EF:3060–3070, `game.js:9, 137–139`, `eggs.js:5, 97–99`, `vorhaben.html:501` |
| Verwaiste Seiten | `inbox.html`, `checkin.html`, `saison-rad.html`, `saison-steckbriefe.html` haben keinen Navigationseintrag und keinen klickbaren Link; erreichbar nur per Direktadresse | Abschnitt 2.1 |
| Zeitabhängige Zustände | Nachtmodus 23–5 Uhr, Festivaltage 20.–23.08., „überfällig“, Serien, Wochenziele | `eggs.js:48, 82`, `core.js:91–96`, `game.js:104–127` |
| Offline | Kein Service Worker, keine Offline-Erkennung (`navigator.onLine` kommt nicht vor). Ein Netzfehler erscheint als „Fehler: …“ bzw. als Fehlermeldung der jeweiligen Seite | Grep über `site/` |

---

## 6. Zusammenfassung mit Zählungen

- Seiten: 25 HTML-Seiten (Auftrag nannte 26), davon 4 ohne Navigationseintrag und ohne klickbaren Link (inbox, checkin, saison-rad, saison-steckbriefe).
- Fähigkeitszeilen (F-…): **430** gesamt.
- Je Seite: index 11, vorhaben 35, neuigkeiten 23, besprechung 17, board 25, cockpit 21, entscheidungen 14, inbox 6, jahr 20, saison 17, saison-rad 17, saison-steckbriefe 7, kommunikation 27, launch 28, organisation 21, besetzung 17, arbeiten 36, capture 7, vertretung 10, uebergabe 18, rueckkehr 8, seiten 16, bearbeiten 14, aufraeumen 7, checkin 8.
- Speicherwirkung (grob nach erstem Stichwort der Spalte gezählt): liest 232, sofort speichern 92, fachlich bestätigen 31, Formular speichern 24, nach außen wirkend 22, ohne Angabe 29.
- Edge Functions: 5 (`gfweekly` mit rund 100 Aktionen plus Modul `komm`, `arbeiten` 12, `besetzung` 7, `organisation` 8, `saison` 7, jeweils einschließlich `ping`), dazu die externe Funktion `tpa` (nur lesend).
- Navigation: 4 Gruppen, 19 Haupteinträge, 4 Unterpunkte unter „Themen“; 2 Theme-Modi (dunkel, hell); 3 Layoutmodi (offen, schmal, Schublade).
- Querschnitt-Befunde: 45 (Q01–Q45) in 10 Kategorien: Rechte 5, Fehler/Rückmeldung 7, Konflikte 4, Bedienbarkeit 8, Formulare 4, Dialoge 3, Darstellung 5, Bewegung 2, Export/außen 5, Ladeanzeigen/Live-Regionen 2.
- Dialoge: 0 `<dialog>`-Elemente, 8 eigene Bauarten, 32 native `confirm()`/`prompt()`.
- Toast-Live-Regionen: 1 von 25 Seiten; Live-Regionen überhaupt: 5 von 25 Seiten plus Einwurf-Dialog.
- Ziehen: 2 Boards (Themen, Vorhaben); Rechtsklick und Doppelklick: 0.
- Export: kein CSV/Download/Druck; Kopieren über `gfCopy` an 5 Aufrufstellen (davon eine im gemeinsamen Textfenster); Mail nur `mailto:`.

---

## Anhang: Einzelbeobachtungen der Seitengruppen

Ungekürzt aus der Seitenlektüre; Grundlage für Abschnitt 4. Gruppe A: arbeiten, aufraeumen, bearbeiten, capture, inbox, checkin · B: vorhaben, index, neuigkeiten, rueckkehr, uebergabe, vertretung · C: board, cockpit, entscheidungen, besprechung, seiten, jahr · D: kommunikation, launch · E: organisation, besetzung, saison, saison-rad, saison-steckbriefe.

### A.Querschnitt-Beobachtungen Gruppe A

- **Klick auf nicht fokussierbarem Element:** bearbeiten.html:105/155 Kartenkopf `div.eh.js-toggle` mit onclick, ohne button/tabindex/role/aria-expanded; das Aufklappen der Bearbeitungskarten ist per Tastatur nicht erreichbar. Sonst in Gruppe A durchgehend `<button>` oder `<a>`.
- **Ziehen / Rechtsklick / Doppelklick:** in Gruppe A keine.
- **Zweiklick-Bestätigung statt Dialog:** arbeiten.html:952–956 (`saConfirm`): Knopftext wechselt 5 s auf „Wirklich …?“, zweiter Klick bestätigt; Wechsel wird nicht angesagt (kein aria-live am Knopf). Andere Seiten nutzen natives `confirm()`: aufraeumen.html:121, bearbeiten.html:158, 187, inbox.html:75. Kein `alert()`/`prompt()`.
- **Hover/Title-only-Inhalte:** aufraeumen.html:40 Wirkung von „Alle Vorschläge übernehmen“ nur im `title`; arbeiten.html:416 Hinweis „auch unvollständig abgeben“ nur im `title`; Stepper-Grenzen nur im `title` (core.js:59/64, genutzt in arbeiten.html:627, bearbeiten.html:115). Hover-Hervorhebung `.del:hover` (styles.css:300), `.prep-item.link:hover` (styles.css:784) ohne zusätzliche Information.
- **Platzhalter statt Label:** Passwortfeld im Gate ohne Label/aria-label auf aufraeumen.html:24, bearbeiten.html:24, capture.html:24, inbox.html:24, checkin.html:24 (arbeiten.html:209 hat aria-label). bearbeiten.html:45 (neues Thema), 61–63 (Name/E-Mail/Rolle), 138/140 (Link-Titel/URL); inbox.html:68 Titel; arbeiten.html:457–459 (Systemfelder, nur aria-label), 304 (Suche, aria-label), 477. Labels ohne `for`/Verknüpfung: capture.html:35, 38, 40, 42, 49–50; bearbeiten.html:96–99 (`.fld label` ohne `for`). Natives `<select>` ohne Label: inbox.html:69.
- **Zustand ohne ARIA:** capture.html:39–46 Chips nur Klasse `on` (kein aria-pressed), Mehr-Details-Knopf ohne aria-expanded (47, 72); bearbeiten.html:35–38 Segment-Umschalter ohne aria-pressed. Symbol-Knöpfe ohne Namen: bearbeiten.html:39 „↻“, 100 „✕“ (Link löschen, ohne Rückfrage).
- **Dialoge:** in Gruppe A nur `gfTextModal` (checkin.html:127; core.js:314–332: eigenes Overlay `.modal-back`, kein Escape, keine Fokusfalle, kein Fokus-Rückweg). Keine `<dialog>`-Elemente.
- **Toasts für Fehler:** durchgehend: aufraeumen.html:103, 123; bearbeiten.html:92, 157, 158, 160, 163, 165, 186, 187, 191 (oft nur „Fehler“ ohne Ursache); capture.html:76; inbox.html:48, 74, 75; arbeiten.html:340 (zusätzlich zur Statuszeile). Toast-Element hat role=status/aria-live nur auf arbeiten.html:315; auf den übrigen fünf Seiten schlichtes `<div class="toast">` ohne Live-Region (aufraeumen.html:46, bearbeiten.html:70, capture.html:61, inbox.html:39, checkin.html:52).
- **Ladefehler unsichtbar:** aufraeumen.html:125–133, bearbeiten.html:82–88, inbox.html:46–47 laden ohne try/catch im `gfGate`-Rückruf; ein Fehler wird von core.js:125–126 in das bereits ausgeblendete Gate-Fehlerfeld geschrieben und das gespeicherte Passwort gelöscht, die Seite bleibt bei „lädt …“ bzw. leer stehen. checkin.html:137 und arbeiten.html:808–814 zeigen Fehler sichtbar.
- **Ladeanzeigen:** „lädt …“ statisch (aufraeumen.html:43, inbox.html:37), Skelett (checkin.html:133), Statuszeile mit role=status aria-live und aria-busy am main (arbeiten.html:219–220, 752). capture.html:73–76 und bearbeiten.html Speichern ohne Ladezustand/Sperre (Doppelklick legt doppelt an möglich).
- **aria-live/role:** arbeiten.html:220 (Status), 306 (Trefferzahl), 315 (Toast), 598 (`#swFehler` role=alert), 618 (progressbar). Sonst in Gruppe A keine Live-Regionen.
- **Konfliktbehandlung:** keine `expect`-Felder in Gruppe A. bearbeiten.html:156 sendet alle Felder ohne gesehenen Stand (letzter Schreiber gewinnt). aufraeumen `gate_set` ohne Stand-Prüfung. arbeiten: Server antwortet 409 (Abgabe, Rücknahme, neue Runde; arbeiten/index.ts), Seite zeigt nur den Text in Statuszeile und Toast; Personenwechsel wird bei ungespeicherten Änderungen blockiert (arbeiten.html:1056–1059); Wettlauf beim Laden über Lade-Zähler abgefangen (803).
- **Rechteprüfung:** nur über gewählte Person (`gfWho`, sessionStorage), keine Anmeldung je Person; arbeiten.html:255 und 1065 sagen ausdrücklich „keine Konten“ / „keine Sicherheitsfunktion“. Die Edge Function `arbeiten` erzwingt Alex/Lea (400) und Eigentum am Steckbrief (404), filtert Sichtbarkeit der anderen Person serverseitig. `gate_set`, `update`, `delete`, `people_*`, `inbox_*` prüfen keine Person.
- **Feste Breiten inline:** bearbeiten.html:61–63 (min-width 140/180/120 px), 138/140 (min-width 120/160 px); arbeiten.html:397 (max-width 220 px); capture.html:34, 52 Inline-Styles für Abstände/Schriftgröße 16 px.
- **Datum/Zahl:** eigene Formatierer statt core-Helfer: aufraeumen.html:59 `fmtD`, inbox.html:49 `fmt` (Monat kurz, mit Uhrzeit), arbeiten.html:339 `datumDE` (explizit Europe/Berlin). checkin.html:62 `iso=d=>d.toISOString().slice(0,10)` auf lokaler Mitternacht (61) ergibt in Berlin den Vortag; Vergleiche „überfällig“ (90, 110) dadurch um einen Tag verschoben. checkin nutzt sonst `gfFmtShort`, `gfFmtDay`, `gfFmtTime`.
- **Export/Kopieren:** nur checkin.html:127 (Textdialog mit Kopieren und mailto). Keine CSV/Download-Funktion in Gruppe A.
- **Animationen:** aufraeumen.html:102 Ausblenden per Opacity/Timeout ohne Prüfung von reduzierter Bewegung; `gfStagger` (aufraeumen.html:94, checkin.html:118) ohne Prüfung in JS; arbeiten.html:192–197 Übergänge korrekt unter `prefers-reduced-motion:no-preference`; `.editcard .ebody` max-height-Übergang (styles.css:356). Automatischer Weitersprung nach 200 ms in arbeiten.html:839, 887.
- **Veraltete Bezüge:** capture.html:59 „Inbox“/„Cockpit“-Links, inbox.html:70/74 „Ins Cockpit übernehmen“; checkin.html und inbox.html sind nicht in der Seitenleiste (nur Direktaufruf).

### A.Querschnitt-Beobachtungen Gruppe B

- **Klick-Handler auf nicht fokussierbaren Elementen:** in Gruppe B nicht gefunden; alle Zeilen- und Kartenauslöser sind `<button>` oder `<a>` (z. B. vorhaben.html:136, 195; neuigkeiten.html:139, 178, 227; core.js:498). Delegierte Listener hängen an Containern (vorhaben.html:212, uebergabe.html:228). Ausnahme mit ungültiger Verschachtelung: Link `<a href="#korb">` innerhalb des Zeilen-`<button>` der Themenlage (neuigkeiten.html:227).
- **Ziehen ohne Alternative:** Ziehen im Vorhaben-Board (vorhaben.html:219-225) hat Alternativen (Knopf „Ball weitergeben“ 142, Ball-Chips in der Akte 325). Der Knopf auf der Karte ist mit Maus nur bei Hover oder Fokus sichtbar (styles.css:1655-1658).
- **Rechtsklick/contextmenu, Doppelklick:** in Gruppe B nicht vorhanden.
- **Hover-only-Inhalte:** Laufband hält nur bei Hover/Fokus (styles.css:1002), hat aber einen Pausenknopf (core.js:501, 505). Begründung der Matrix-Achsen nur im `title=` (uebergabe.html:146). Grund des gesperrten Knopfs „Rückübergabe bestätigen“ nur im `title=` (rueckkehr.html:156, 159). Gekürzte Markentexte voll nur im `title=` (vorhaben.html:130). Zweck des ✕ der Vertretungslinie nur im `title=` (vertretung.html:129).
- **Platzhalter statt Label:** Suche Neuigkeiten (neuigkeiten.html:53), Protokollnotiz (uebergabe.html:45), Regel/Notiz je Zeile (uebergabe.html:157), Vollmacht (vertretung.html:128), Gesprächszeit und Notfallkanal (vertretung.html:177-178). Passwortfeld des Gates auf allen Seiten nur mit Platzhalter (z. B. index.html:28). Gut gelöst mit Label: Akte und Einwurf (vorhaben.html:304, 314, 409-413).
- **Dialogbau:** drei Bauarten nebeneinander. (1) Vorhaben-Dialoge mit `gfModalAuf` (inert, Fokusfalle, Fokusrückkehr) und Escape (vorhaben.html:239, 246, 463, 527). (2) `gfNewsModal` mit Escape, ohne Fokusfalle (neuigkeiten.html:131). (3) `gfTextModal` ohne Escape und ohne Fokusführung (Vertretungsbrief, uebergabe.html:275). (4) Eigenes Overlay „Abwesenheit anlegen“ ohne Escape, ohne Fokus, ohne Hintergrund-Schließen; der `change`-Listener wird bei jedem Öffnen erneut angehängt (vertretung.html:164-189). Kein `<dialog>`-Element.
- **confirm():** neuigkeiten.html:132, 215; rueckkehr.html:131; uebergabe.html:217, 282; vertretung.html:210. Ohne Rückfrage dagegen: Punkt löschen (vorhaben.html:421), Kandidat verwerfen (neuigkeiten.html:210), „Übernehmen“ in der Rückkehr (rueckkehr.html:125), Vertretungszeile abschalten (vertretung.html:216).
- **Toasts für Fehler:** Fast alle Schreibfehler erscheinen nur als Toast mit 2,6 s Anzeige (core.js:36), etwa vorhaben.html:261, 371, 380; neuigkeiten.html:132, 213; uebergabe.html:207, 226; vertretung.html:202, 211. Teilfehler von „Alle Vorschläge übernehmen“ nennen höchstens drei Titel, der Rest nur in `console.warn` (uebergabe.html:221-224). Fehler im Dialog statt Toast: Einwurf und Übergeben (`role="alert"`, vorhaben.html:512).
- **Ladefehler, die nicht abgefangen werden:** `load()` in rueckkehr.html:136-149, uebergabe.html:313-333 und vertretung.html:241-250 hat kein `catch`; der Fehler landet im Gate-Fehlerpfad (core.js:125-126), dessen Meldung bei bereits ausgeblendetem Gate nicht sichtbar ist, und das gespeicherte Passwort wird dabei entfernt. index.html: scheitert `gate_list`, bleiben „Deine Vorhaben“ und andere Blöcke bei „lädt …“ (index.html:41, 259-288).
- **Konfliktbehandlung:** sorgfältig in vorhaben.html (expect je Feld 370, 433-434; `expect_ball` 258, 571; `expect_vorhaben_id` 393; `expect_stand` 429; `expect{status,ampel,vertretung}` 587). Erkennung des Konflikts per Textmuster „inzwischen“ statt HTTP-Status (vorhaben.html:372, 394). In uebergabe.html senden `handover_set` und `handover_set_many` keinen `expect` (200, 219), obwohl die Edge Function ihn auswertet (index.ts:2004-2008). `punkt_toggle` ohne expect (vorhaben.html:379). Die Antwort von `handover_set_many` mit `konflikt`-Kennzeichen (index.ts:2014) wird nicht als Konflikt unterschieden.
- **Rechteprüfung im Browser:** keine sichtbare Prüfung der Rolle; schreibende Vorhaben-Aktionen senden `by:gfWho()`, die Edge Function verlangt Alex oder Lea (index.ts:1110-1116). `absence_end` aus vertretung.html sendet kein `by` (211). „Rückübergabe bestätigen“ ist für jede gewählte Person möglich (rueckkehr.html:130-134). `absence_set` aus vertretung.html sendet kein `who` (193-199).
- **Datums- und Zahlenformatierung:** viele lokale Varianten: `fmtD` je Seite mit unterschiedlichen Formaten (index.html:87 TT.MM., uebergabe.html:70 und vertretung.html:75 TT.MM.JJ), `fmtT` (rueckkehr.html:78), `toLocaleDateString("de-DE")` direkt (rueckkehr.html:82), `toLocaleString` (uebergabe.html:304), dazu core.js `gfVhTag`, `gfFrist`, `gfFmtShort`, `gfNewsWhen`. „Heute“ wird unterschiedlich bestimmt: `toLocaleDateString("sv-SE")` lokal (index.html:83), mit `timeZone:"Europe/Berlin"` (vorhaben.html:82, 461), `toISOString().slice(0,10)` in UTC (uebergabe.html:74, vertretung.html:162). Wochenrechnung in UTC (vorhaben.html:78-81).
- **aria-live/role:** `aria-live="polite"` auf dem Vorhaben-Hauptbereich (vorhaben.html:53), `role="status"` Lagezeile (37), Hinweise (319, 501), Laden in Rückkehr (rueckkehr.html:154), `role="alert"` Fehler (rueckkehr.html:158; vorhaben.html:512). Toast selbst ohne Live-Region (core.js:33-37).
- **Ladeanzeigen:** Text „lädt …“ als Platzhalter (vorhaben.html:53, 269; index.html:41, 51; neuigkeiten.html:59, 64; uebergabe.html:38; vertretung.html:43); Knopf-Zustand „läuft …“ (uebergabe.html:283); gesperrte Knöpfe während Speichern (vorhaben.html:378, 388, 391).
- **Export/Kopieren:** Vertretungsbrief zum Kopieren und als Mail-Link (uebergabe.html:275 über core.js:314-332). Kein CSV oder Download in Gruppe B.
- **Feste Breiten inline:** `max-width:200px` am Datumsfeld (vertretung.html:170); `.vt-line input.txt{min-width:160px}` (styles.css:1385, unter 560 px aufgehoben 1397); Akte-Grid `--maxw:1376px` (vorhaben.html:30).
- **Animationen:** `gfStagger` auf allen Listen (z. B. vorhaben.html:210, index.html:114, neuigkeiten.html:162); per CSS bei reduzierter Bewegung abgeschaltet (styles.css:596). `scrollIntoView({behavior:"smooth"})` beim Hash-Sprung (neuigkeiten.html:254) prüft die Einstellung nicht selbst. Zeile blendet vor dem Verschwinden per Inline-Opacity aus (uebergabe.html:204).
- **Persönliche Browserzustände:** `gf_vh_view`, `gf_vh_filter`, `gf_vh_seen_<Person>`, `gf_news_seen_<Person>`, `gf_nw_<abschnitt>`, `gf_rk_gesehen_<id>`, sessionStorage `gf_nw_filter`. „Gesehen“ in der Rückkehr und „Alles gesehen“ wirken nur im jeweiligen Browser.

### A.Querschnitt-Beobachtungen Gruppe C

- **Klick auf nicht fokussierbaren Elementen:** cockpit.html:200-202 (div `.next[data-go]`), cockpit.html:180 und 221-233 mit 257 (div `.rec-main`, div `.ttl`, div `.subline`, span `.expand-btn`, div `.chev` als Aufklapper), cockpit.html:224 und 260 (span `.pill.prio` wechselt Priorität, nur title=). Die Board-Karte ist dagegen `article tabindex=0` mit Enter (board.html:127, 196), aber ohne role.
- **Ziehen ohne vollständige Alternative:** Board-Spaltenwechsel hat den Knopf ⇄ mit Menü (board.html:348-361) und die Spaltenknöpfe im Panel (board.html:244); die Reihenfolge innerhalb einer Spalte (lane_order) ist nur per Ziehen änderbar, das Menü legt immer ans Ende (board.html:357, `beforeId` null). Ziehen per Touch wird von HTML5-drag in der Regel nicht unterstützt.
- **contextmenu:** in Gruppe C nicht verwendet.
- **Hover-only / title-only:** ⇄ bei opacity .55 erst bei Hover/Fokus voll sichtbar (styles.css:679-681); Jahresband-Übergangs- und Meilensteintexte nur in title=, unter 600 px auch die Kurzbeschriftung ausgeblendet (jahr.html:137, 140, 163; styles.css:489, 548); Abzeichen-Details nur title= (entscheidungen.html:84, jahr.html:343); Symbolknöpfe ✎ ✕ ⧉ ↻ ← → ▶ ◀ nur mit title=, ohne aria-label (entscheidungen.html:121, 160; seiten.html:52, 130-131, 141, 145; jahr.html:159-161, 221; besprechung.html:145; board.html:397; cockpit.html:63).
- **Platzhalter statt Label:** Suchfelder board.html:37, cockpit.html:54, entscheidungen.html:39, seiten.html:40; Neues-Thema-Feld cockpit.html:67; Neues-Ritual-Feld jahr.html:77. In Formularen sonst `<label>` ohne `for`-Verknüpfung (z. B. board.html:246-255, seiten.html:185-195, jahr.html:232-241); Labels stehen als Geschwister vor dem Feld, nicht umschließend.
- **Dialogbau:** Detailpanel als `aside` mit aria-hidden, ohne Fokusverschiebung/Fokusfalle, Escape und Hintergrundklick schließen (board.html:60-64, 272, 281-282). Bereinigen/Aufräumen als eigenes `.modal-back`-Overlay mit role=dialog/aria-modal, Escape über den Seiten-Keydown (board.html:282), kein Fokusmanagement (board.html:293-304, 319-326). Protokoll/Wochenmail über `gfTextModal` (kein Escape, kein Fokus). Verschieben-Popover ohne Escape und ohne Fokus ins Menü (board.html:348-361). Delegations-Dropdown ohne Escape (cockpit.html:263-264, 271).
- **Native Browser-Dialoge:** `prompt()` für neues Thema (board.html:345), Teilnehmende (besprechung.html:127, board.html:373), neuen Bereich und Symbol (seiten.html:225-226); `confirm()` für alle Löschungen (board.html:271, 276; entscheidungen.html:141, 163; seiten.html:217, 240; jahr.html:203, 271).
- **Toasts für Fehler:** fast alle Schreibfehler nur als Toast „Fehler: …“, bei cockpit ohne Grund („Speichern fehlgeschlagen“, cockpit.html:276; „Konnte nicht hinzufügen“, cockpit.html:281; „Fehler“, cockpit.html:286). Board-Rückgängig ersetzt den Toast-Inhalt durch einen Knopf, 5 s sichtbar, Toast ohne role/aria-live (board.html:186-188). Rückgängig-Fehler verschluckt (board.html:187).
- **Ladefehler unvollständig:** cockpit lädt ohne try/catch, bleibt bei Fehler auf „lädt …“ (cockpit.html:98, 105); entscheidungen zeigt Fehler nur im Log, Besprechungen bleiben „lädt …“ (entscheidungen.html:52, 77); jahr: bei `cycle_get`-Fehler bleiben Meilensteine auf „lädt …“ (jahr.html:63, 367-371); besprechung zeigt Ladefehler der letzten Besprechung als „Noch keine Besprechung protokolliert“ (besprechung.html:231-233, 112).
- **Konfliktbehandlung:** keine. `update`, `decision_update`, `sites_save`, `milestone_save` schreiben ohne expect/Revision (supabase/functions/gfweekly/index.ts:1406-1424, 1573-1580); letzter Schreiber gewinnt; Board-Autosave alle 1,5 s erhöht das Risiko bei gleichzeitiger Bearbeitung.
- **Datumsformatierung und Off-by-one:** board.html:101-102 und entscheidungen.html:66-67 bilden „heute“ als lokale Mitternacht und formatieren mit `toISOString().slice(0,10)`; in Berlin (UTC+1/+2) ergibt das den Vortag. Betroffen: „heute besprochen“ (board.html:270), Vertagen und Zeitraum-Verschieben (board.html:166, 451), Besprechungsergebnis last_discussed (board.html:445), Standarddatum neuer Entscheidung und Zeitraumfilter (entscheidungen.html:89, 127, 198). cockpit.html:89 nutzt UTC-Jetztzeit (falsch zwischen 0 und 2 Uhr). besprechung.html:59 rechnet korrekt mit `toLocaleDateString("sv-SE")`. Daneben eigene `toLocaleDateString("de-DE", …)`-Varianten je Seite (board.html:133, 217; cockpit.html:215; seiten.html:73; jahr.html:118-119, 191, 225, 286) statt gemeinsamer Helfer `gfFmtShort`/`gfFmtTime`.
- **Export/Kopieren:** Clipboard für Delegationstext, Asana-Text (cockpit.html:267-268), Link und Zugangsdaten (seiten.html:213-214), Protokoll/Wochenmail im Textdialog; Mailversand nur als `mailto:` aus `gfTextModal`. Kein CSV, kein Download. Kein direkter Asana-Export auf diesen Seiten (nur kopierbarer Text).
- **Zugangsdaten:** `sites_list` liefert hinterlegte Zugangsdaten vollständig an den Browser; Verbergen ist reine Anzeige (seiten.html:126); im Formular als normales Textfeld (seiten.html:191).
- **aria-live/Statusmeldungen:** keine in Gruppe C; Panel-Speicherstatus (board.html:212) und „✓ gespeichert“ (cockpit.html:167) ohne aria-live.
- **Ladeanzeigen:** „lädt …“-Texte und `gfSkeleton` (board.html:475); KI-Knopf mit Text „Claude liest …“ (board.html:312).
- **Animationen:** `gfStagger` auf allen Listen (CSS-Animation nur bei `prefers-reduced-motion:no-preference`, styles.css:582-596); Panel-Einschub per transition; `scrollIntoView({behavior:"smooth"})` in JS (board.html:195, besprechung.html:109, 246; entscheidungen.html:198; seiten.html:249; jahr.html:276; cockpit.html:202) wird von der CSS-Regel `scroll-behavior:auto` bei reduzierter Bewegung nicht abgefangen. Sekundentimer in der Besprechung (besprechung.html:183, board.html:427).
- **Rechte im Browser:** keine Prüfung auf Alex/Lea; `gfWho()` wird nur als Urheberangabe mitgeschickt (created_by, decided_by, started_by, updated_by, done_by, gate_set by). Weitergeben „An Lea/An Alex“ ist für jede angemeldete Sitzung möglich (besprechung.html:196).
- **Zwei Besprechungsstände:** Board nutzt localStorage `gf_meeting` (board.html:365), Besprechung `gf_besprechung` (besprechung.html:66); laufende Besprechung ist an Browser/Gerät gebunden, nicht geteilt. `startMeet` auf dem Board ist toter Code (board.html:372, 470).
- **Taler beim Erzeugen:** Wochenmail meldet `score_event` schon beim Öffnen des Entwurfs, nicht beim Versand (entscheidungen.html:191).

### A.Querschnitt-Beobachtungen Gruppe D

- **Klick-Handler auf nicht fokussierbaren Elementen:** keine gefunden; alle Aktionen sind `button`/`a` mit `data-act`. Diagrammziele sind SVG-`rect` mit `tabindex` und `role=img` (kommunikation.html:312), Tastaturbedienung vorhanden (336-338).
- **Ziehen:** keines in beiden Seiten.
- **contextmenu:** keines.
- **Hover-only-Inhalte:** Einzelwerte im Jahresband nur über `title=` an nicht fokussierbaren `span` (kommunikation.html:373, 375); Ersatz nur als `aria-label` der Spur (377), nicht sichtbar. Kachel-Titel mit Namen der überlasteten Personen und geplantem VVK-Datum nur per `title=` (launch.html:251-252). Wochen-Tooltip dagegen auch per Fokus/Klick/Tastatur (kommunikation.html:333-338).
- **Platzhalter statt Label:** nur im Passwort-Gate (`placeholder="Passwort"`, kommunikation.html:136, launch.html:132). Felder sonst mit `label`/`aria-label` (kommunikation.html:268, launch.html:346, 349, 364).
- **Dialogbau:** keine eigenen Dialoge; Bestätigungen über natives `confirm()` vor Asana-Versand und Freigaben (kommunikation.html:395, 446; launch.html:420, 439). Bestätigungstext nennt die Person aus sessionStorage.
- **Rückmeldung/Toasts:** Kommunikation nutzt eine sichtbare Statuszeile plus `aria-live`-Region mit Fokusführung (kommunikation.html:147-148, 462-463), keine Toasts. Launch meldet Erfolg und Fehler ausschließlich über `gfToast` (launch.html:402-403, 410-411, 415-416, 430), das in core.js kein `role`/`aria-live` hat und nach 2,6 s verschwindet.
- **Autosave ohne Rückgängig:** In Launch speichern `select`, Chip-Reihen, Ist-Stunden, Stepper (700 ms Verzögerung) und Datumsfelder sofort beim Ändern (launch.html:446-467); Personenknöpfe in Weg B speichern beim ersten Klick (435-436). Kein Rückgängig, keine Konfliktprüfung.
- **Konfliktbehandlung:** Kommunikation sendet `expect_stufe/expect_extras/expect_notiz/expect_am` (kommunikation.html:418, 448), Server antwortet 409 (komm.ts:313-314, 320 PT409); erkannt wird der Konflikt im Browser nur per Regex `/geändert/i` auf dem Fehlertext (kommunikation.html:420). Launch sendet keine erwarteten Werte; `launch_set` überschreibt ohne Prüfung (letzter gewinnt).
- **Veraltet-Sperre:** Kommunikation sperrt Entscheidungen nach gescheitertem Neuladen und sagt das ausdrücklich (kommunikation.html:149, 464-465, 480-486) – vorbildliches Muster; Launch lädt nach jedem Schreiben neu, aber Fehler beim Neuladen werden nicht gemeldet (launch.html:401-403, `load` ohne eigenen catch).
- **Fehlerbehandlung beim Laden:** Kommunikation zeigt Fehler je Abschnitt mit „Noch einmal laden“ (kommunikation.html:469-477). Launch zeigt nur einen Satz im Lagebereich (launch.html:486); die übrigen Abschnitte bleiben bei „lädt …“ stehen.
- **Rechteprüfung Browser vs. Server:** Server prüft „nur Alex oder Lea“ für `komm_send` (komm.ts:389), Rot/Budget-Extras (komm.ts:296), `launch_confirm` und bestätigende `launch_set` (index.ts:2504, 2560) – aber gegen den vom Browser mitgeschickten Namen `by` aus sessionStorage `gf_who`; die Person ist keine Anmeldung. In Launch kann zudem die bestätigende Person per Chip frei gewählt werden (launch.html:384, 409). `launch_set` (ohne Bestätigen), `launch_send` und `launch_sync` prüfen keine Person (index.ts:2594 berechnet `von`, prüft aber nicht).
- **Nebenwirkung beim Lesen:** `launch_list` stößt serverseitig den Asana-Rückweg an, wenn er älter als 60 Minuten ist (index.ts:2375-2386); Laden der Seite kann also Asana lesen und Daten schreiben.
- **Datum/Zahl:** Komm- und Launch-Logik rechnen bewusst in UTC mit eigenem `kurz()`/`kurzOhneJahr()` (komm-logik.js:35-45, launch-logik.js:30-38); Launch-Kopfdatum dagegen lokal per `toLocaleDateString` (launch.html:246), Sync-Zeit per `toLocaleString` (263). Zahlen über `gfFmtInt` bzw. `LaunchLogik.fmt` (`toLocaleString de-DE`, launch-logik.js:43).
- **Feste Breiten:** Jahresband-Zeilenkopf 110 px und Monatsleiste mit 118 px Einzug (kommunikation.html:111, 118), unter 520 px aufgehoben (125); Diagrammbreite mindestens 320 px im SVG-`viewBox` (283); Ist-Stunden-Feld 64 px, Stepper max. 150 px (launch.html:81, 93-94). Tabellen in Kommunikation am Handy gestapelt statt waagrecht scrollend (84-94).
- **Ladeanzeigen:** Text „lädt …“ ohne `role=status` beim Erstladen (kommunikation.html:155, 161, 172; launch.html:151, 180); Vorschau/Versand in Kommunikation mit `role=status` (250, 253); Launch-Knöpfe wechseln Text auf „holt …“/„sendet …“ (414, 421).
- **Animationen:** nur Chevron-Drehung; Launch schaltet sie bei `prefers-reduced-motion` ab (launch.html:121), Kommunikation nicht (kommunikation.html:105-106).
- **Export/Kopieren/CSV:** auf beiden Seiten keiner; komm-logik.js enthält `csvZeilen` (282) nur für Prüfung und Server, nicht in der Oberfläche.
- **Farbe:** Kommunikation kennzeichnet Status ausdrücklich als Wort, Farbe nur im Diagramm (Legende plus Liste als Alternative) (kommunikation.html:16-18, 164-167).

### A.Querschnitt-Beobachtungen Gruppe E

- **Klick auf nicht fokussierbaren Elementen:** saison-rad.html:143 hängt `click` und `mouseenter` an SVG-`path`/`rect`/`circle` (Jahresrad und Zeitleiste) ohne tabindex/role; saison-rad.html:177 `click` auf SVG-`text` (Zeilennamen). Alternative für Elemente ist die Liste „Zur Abstimmung“ (nur nicht abgestimmte Elemente, saison-rad.html:203) und für Zeilen die Zeilen-Chips (200); abgestimmte Elemente sind per Tastatur nicht erreichbar. Alle anderen Klickziele der Gruppe sind `button`, `a` oder `summary`.
- **Hover-only:** saison-rad.html:143/188–192 Detailinfo eines Elements nur bei `mouseenter`. Zahlreiche Erklärungen nur im `title=`: Sperrgrund gesperrter Rollen (organisation.html:407), Zeitachsen-Balken mit Zustand und Notiz (458), Stufen-Untertitel (385), Phasensegmente und KPI-Details (saison.html:357, 365–369), Quelle/Notiz der Besetzung (389, 412), Gründe deaktivierter Knöpfe (331, 391), schreibgeschützte Plattformtermine (saison-rad.html:285).
- **Ziehen / Rechtsklick / Doppelklick:** keine in Gruppe E.
- **Platzhalter statt Label:** Passwortfeld aller Seiten nur mit Platzhalter (z. B. organisation.html:198). Suchfeld Personenwahl hat Platzhalter plus aria-label (besetzung.html:236). organisation-Akte und saison-rad-Panel haben sichtbare Labels; in saison-rad sind `<label>` ohne `for` neben Feldern statt umschließend (saison-rad.html:237–248), Zuordnung damit nicht programmatisch.
- **Dialoge/Panels:** saison-rad.html:72–77/212–215 eigenes Seitenpanel (`aside.panel`, aria-hidden umgeschaltet, kein role=dialog), Escape und Hintergrundklick schließen, aber kein Fokus ins Panel beim Bearbeiten, keine Fokusfalle, kein Fokusrückweg. Organisation, Besetzung, Saison nutzen Inline-Bereiche statt Dialoge; Bestätigungen über natives `confirm()` (saison.html:468, 485; saison-rad.html:258, 301). Besetzung nutzt eine Inline-Bestätigung statt `confirm()` (besetzung.html:257).
- **Toasts für Fehler:** Alle API-Fehler beim Schreiben landen im flüchtigen Toast (core.js:33, 2,6 s, ohne role/aria-live): organisation.html:509, besetzung.html:313, saison.html:455/467/473, saison-rad.html:258/262/299. Organisation hat zusätzlich eine eigene Bild-Meldung mit role=status (organisation.html:240, 496) – zweites, abweichendes Meldungsmuster.
- **aria-live/role=status:** organisation.html:211 (Lagezeile), 236 (Akte `aria-live=polite`, wird bei jedem Render komplett neu geschrieben), 240. Keine Live-Regionen in besetzung, saison, saison-rad; Autosave-Zustand „Gespeichert/Fehler“ in saison-rad (pState) ohne Live-Region.
- **Ladeanzeigen:** Text „lädt …“ (organisation.html:211/234, besetzung.html:134, saison.html:177), Skelett (saison-rad.html:324), Knopftexte „Wird angelegt …/Wird gesendet …/startet …/holt …“ (besetzung.html:338/362, saison.html:461/469). Organisation-Schreibvorgänge optimistisch ohne Ladeanzeige.
- **Konfliktbehandlung:** organisation sendet `expect_rev` (Wahl, Rolle, Log-Verknüpfung) bzw. `expect_wahl` (Rückmeldung) und lädt bei 409 neu (organisation.html:507–511); `begruendung` und `tor` ohne Versionsschutz (organisation/index.ts:86, 139). besetzung sendet `version`, Server antwortet 409 mit `aktuell`, Seite ersetzt Zeile (besetzung.html:311–313). saison (`launch_set`) und saison-rad (`item_save`, `row_save`) ohne Versionsschutz: letzter Schreiber gewinnt; saison-rad 409 nur bei Plattformterminen.
- **Rechte Browser vs. Server:** organisation: Browser lässt nur Alex wählen und nur Lea zurückmelden (organisation.html:519, 553), Server erzwingt dasselbe in der Datenbankfunktion (Migration hh_org_wahl_gilt_sofort: PT400) und lehnt Schreiben ohne Alex/Lea mit 400 „Nur Alex oder Lea können hier schreiben“ ab (organisation/index.ts:53). besetzung: Server 400 „Bitte oben Alex oder Lea wählen.“ bei jedem Schreiben. saison: `launch_confirm`/`launch_send` nur Alex/Lea (403), `launch_set` ohne Personenprüfung; die Vorschau lässt die bestätigende Person unabhängig von der aktiven Person wählen (saison.html:325). saison-rad: Server akzeptiert jeden `who` (fällt auf Freitext/„unbekannt“ zurück, saison/index.ts:35), keine Rechteprüfung. Personenwahl ist überall nur eine Sitzungsangabe (sessionStorage), keine Anmeldung.
- **Nach außen wirkend:** besetzung `asana_senden` (Asana-Aufgabe je Aufgabe, mit Doppelsende-Sperre); saison `launch_send` (Asana-Projekt/Aufgaben je Festival) und `launch_sync`; besetzung `lage` gleicht bei jedem Laden mit Asana ab (besetzung/index.ts:112–116); organisation `decision_add` vergibt Habitat-Taler.
- **Feste Breiten/min-width:** organisation Zeitachse `min-width:900px` mit horizontalem Scroll (organisation.html:122), Akte-Spalte 380 px (48), Rollenspalte 250 px (123); saison-Tafel 9,5rem-Spalte (saison.html:69); besetzung `max-width:1040px`, Feldspalte 150 px (besetzung.html:19, 49). Zeitachse und Track haben schmale Umbrüche (organisation.html:186–187).
- **Datums-/Zahlenformatierung:** uneinheitlich je Seite: organisation rechnet Fristen gegen Berlin-Datum (`sv-SE`, organisation.html:331–332), hat aber `HEUTE="2026-10-05"` fest verdrahtet für die „eilt“-Markierung (264, 330); besetzung formatiert mit `timeZone:"Europe/Berlin"` (besetzung.html:182), nutzt aber `toISOString` als Fallback-Heute (181); saison nutzt `LaunchLogik.kurz/kurzOhneJahr` und `d.heute` vom Server (499); saison-rad eigenes Format `d.m.yy` (saison-rad.html:127) und `TODAY` aus `toISOString` (UTC, 128); steckbriefe rechnet lokale Mitternacht (saison-steckbriefe.html:338–341). Zahlen über `gfKachel`/`gfFmtInt` (de-DE) bzw. `LL.fmt`.
- **Animationen:** globale Abschaltung bei reduzierter Bewegung (styles.css:596) deckt CSS ab; `scrollIntoView({behavior:"smooth"})` in organisation.html:612 und 619 wird davon nicht erfasst. Organisation-Animationen nur bei `no-preference` (179–182).
- **Export/Kopieren/Download:** keine in Gruppe E.
- **Verborgene Seiten:** saison-rad.html und saison-steckbriefe.html haben keinen Menüeintrag und keinen klickbaren Link aus anderen Seiten (nur Textnennung saison.html:226); saison-rad ist trotzdem voll schreibend (Elemente und Zeilen inkl. Löschen).
- **Inhalt im HTML:** organisation.html (265–313) und saison-steckbriefe.html (147–335) tragen fachliche Inhalte, Termine und teils Namen Dritter fest im Quelltext; Änderungen gehen nur über Code.
