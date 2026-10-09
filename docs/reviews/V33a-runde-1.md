Geprüft: V33a, Commit a52d6f5, 2 Dateien (site/arbeiten.html, pruefung/arbeiten-probe-ui.mjs); dazu supabase/functions/arbeiten/index.ts am selben Stand (unverändert seit e6b28f6).

Prüfer: Claude Code. Grundlage: docs/reviews/V33-pruefauftrag.md. UI-Probe außerhalb der Sandbox ausgeführt:
`node pruefung/arbeiten-probe-ui.mjs` → 152 Prüfungen bestanden, Bildschirmproben 390/1440 hell/dunkel angesehen
(Start, Ist, Umfrage, Systeme, Auswertung, Ladefehler). Tokens: `python3 pruefung/tokens.py` 0 Abweichungen, jede
`var(--…)` der Seite existiert in styles.css.

1. [mittel] Rücknahme der Abgabe ist nicht atomar
Fundstelle: supabase/functions/arbeiten/index.ts:222-230
Was passiert: `abgabe_zurueck` liest die Runde, prüft `abgegeben(r, A)` und setzt danach ohne Bedingung `abgegeben_<W> = null`. Gibt Lea zwischen Lesen und Schreiben ab, bekommt sie `beide: true` und sieht in `lage` Alex' Antworten; Alex' Rücknahme läuft trotzdem durch, und Alex kann danach seine Antworten ändern, obwohl Lea sie schon gesehen hat.
Warum falsch: Paketregel „zurücknehmen nur, solange die andere Person noch nicht abgegeben hat“ gilt so nur ohne Gleichzeitigkeit.
Vorschlag: Bedingung in das Update legen: `.update({[feldAbgabe(W)]: null}).eq('nr', nr).is(feldAbgabe(A), null).select('*')`; leeres Ergebnis → 409 mit dem bestehenden Satz. Ebenso `abgeben` mit `.is(feldAbgabe(W), null)` (doppelter Aufruf behält den ersten Zeitpunkt, Antwort `schon: true`). VERSION auf 2. Hinweis: Du kannst nicht deployen; der Prüfer deployt nach dem Commit.

2. [mittel] Auswertung „gemeinsam“ ohne Auftrag entfernt
Fundstelle: site/arbeiten.html:338-358 (vorher Abschnitt „Größte gemeinsame Belastung“)
Was passiert: Die Auswertung zeigt nur noch Unterschiede und alle Werte. Der Abschnitt, der zeigt, wo es bei beiden zugleich hakt, ist weg; der Hinweis nach beidseitiger Abgabe wurde mit umgeschrieben.
Warum falsch: V33a verlangt Prüfen und Feinschleifen, nicht das Entfernen einer Auswertung. Gerade die gemeinsame Sicht ist der Einstieg für Schritt 3 „Gemeinsam einordnen“. Eine Aussage über Abläufe, die beide niedrig einschätzen, ist keine Bewertung einer Person. Das Wort „Belastung“ war unglücklich (Nähe zu Gesundheit), das rechtfertigt eine neue Benennung, nicht das Weglassen.
Vorschlag: Abschnitt wiederherstellen als „Wo es bei beiden hakt“: Skalenfragen, bei denen beide geantwortet haben, gemittelt auf die Richtung „hakt“ (bei `umgekehrt` der Wert, sonst 6 minus Wert), höchstens sechs, nur Mittelwert ab 3,5; Satz „Aussagen, die ihr beide eher kritisch seht. Ein Gesprächsanlass, keine Bewertung.“ Danach „Größte Unterschiede“. Keine Rangfolge von Personen, keine Summen je Person. Probe anpassen.

3. [mittel] Hub-Liste am Handy kaum bedienbar
Fundstelle: site/arbeiten.html:370-387 (hubZeile, renderHub)
Was passiert: Bei 390 px braucht ein Werkzeug rund 420 px Höhe (Name, Zweck, Notizfeld, zwei Chip-Reihen mit 4 und 5 Chips). Der Filter „aktiv“ zeigt rund 70 Werkzeuge, also etwa 29.000 px Scrollweg; „alle“ etwa 39.000 px.
Warum falsch: Paket V33a nennt ausdrücklich „Hub-Liste mit Filter und Suche bei 93 Einträgen am Handy“. Durchgehen und Einordnen ist so am Handy nicht machbar.
Vorschlag: Je Werkzeug eine kompakte Zeile (Name, Status, aktuelle Einordnung und Reifegrad als Text mit Symbol, z. B. „✓ behalten · im Alltag“ oder „○ offen“), Bearbeiten aufklappbar (`<details>` oder Knopf mit `aria-expanded`), immer nur eines offen. Zusätzlich Filter „noch offen“ (Einordnung offen), damit beide sehen, was noch fehlt. Zahl „x von y“ bleibt. Probe: Höhe einer zugeklappten Zeile bei 390 px ≤ 90 px.

4. [leicht] Skalenenden in falscher Reihenfolge am Handy
Fundstelle: site/arbeiten.html:307
Was passiert: „kann ich nicht beurteilen“ steht zwischen 5 und „trifft voll zu“; bei 390 px bricht es so um, dass „trifft voll zu“ unter dem Chip „kann ich nicht beurteilen“ steht (Bildschirmprobe umfrage-390-dark).
Vorschlag: Reihenfolge „trifft gar nicht zu · 1 … 5 · trifft voll zu“, darunter getrennt der Chip „kann ich nicht beurteilen“ (zwei gfChips-Gruppen, die dasselbe versteckte Feld bedienen, oder eine Gruppe mit eigener Zeile für „kn“).

5. [leicht] Antworten auf inaktive Fragen möglich
Fundstelle: supabase/functions/arbeiten/index.ts:183-185
Was passiert: `antwort_set` lädt die Frage ohne `aktiv = true`.
Vorschlag: `.eq('aktiv', true)` ergänzen; sonst 404.

6. [mittel, Daten, gehört zu V33b] Nutzungsvergleich je Person in der Systemliste
Fundstelle: gfweekly_sa_systeme, Eintrag „Das Hohe Haus“, Feld beobachtung (Seed in supabase/migrations/20261009031412_hh_so_arbeiten_wir.sql)
Was passiert: „Nutzung ungleich (Pförtner 52:0, Themen 63:7, Einchecken 24:10 Tage)“ stellt die Nutzung von Alex und Lea gegeneinander.
Warum falsch: Grenze „keine Bewertungen von Personen“. Zahlen je Person in einer gemeinsamen Liste lesen sich als Vergleich.
Vorschlag: Der Prüfer formuliert den Datensatz in V33b um („gebaut von Alex; welche Teile im Alltag tragen, klären wir in der Ist-Aufnahme“). Für Codex in dieser Runde nichts zu tun.

Empfehlungen
- Auf „Start“ ein Satz, wie lange die Umfrage dauert (24 Fragen, etwa 15 Minuten).
- In der Ist-Aufnahme nach „+ Ablauf“ das Feld „Ablauf“ leer statt „Neuer Ablauf“ vorbelegen (Platzhalter reicht), damit keine Steckbriefe mit Platzhaltertitel liegen bleiben; falls die Funktion einen Namen verlangt, beim Anlegen nur lokal öffnen und erst beim ersten Speichern anlegen.
- In der Auswertung die Beispiele direkt unter der jeweiligen Aussage zeigen statt in einem eigenen Abschnitt.
- Die Systemliste nach Reifegrad gruppieren (früher, heute, ruht), damit „damals und heute“ sichtbar wird.

Nicht geprüft: Verhalten gegen das echte Backend (folgt in V33b), Bildschirmleser real (nur Rollen und Beschriftungen im Code).
