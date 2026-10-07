# Antwort auf Review V32a, Runde 1 (Codex, Commit a845881)

Alle sieben Befunde bestätigt und behoben; die Migration war noch nicht eingespielt und ist deshalb direkt geändert.

1. **schwer, gesendete Beiträge nach Teilfehler veränderbar.** Behoben: `hh_komm_einspielen` schützt jetzt auch Zeilen mit `asana_task_gid` (nicht nur `gesendet_am`), beim Ändern und beim Entfernen. Kennung und erstes Sendedatum speichert `hh_komm_gesendet(ids, gid)` in einem Update (`gesendet_am = coalesce(gesendet_am, now())`).
2. **schwer, gleichzeitiger Versand.** Behoben: Tabelle `komm_sperre` mit `hh_komm_sperre(schluessel, sekunden, von)` (atomar per `insert … on conflict do update where bis < now()`) und `hh_komm_frei`. `komm_send` nimmt die Sperre `send:<festival>` für 180 Sekunden (länger als das Zeitbudget von 90 Sekunden), ein zweiter Aufruf bekommt 409. Der Tabellenabgleich nutzt dieselbe Sperre (`tabelle`).
3. **mittel, Wochenlast ohne laufende Arbeit nach T.** Behoben: für die Last zählen alle gespeicherten Veröffentlichungen mit einem Schritt ab dieser Woche, unabhängig von T (Anzeigenkontrolle, Nachbereitung). Probe in `komm-test.mjs` Abschnitt 10.
4. **mittel, Horizont schneidet Aftermovies ab.** Behoben: der Horizont ist die späteste Fälligkeit eines Schritts oder das Ende einer Wochenaufgabe. Ergänzt zur Einordnung: Rechenregel 7 zieht die Produktion des Aftermovies (T = Z+60, Klasse L, nach Saisonbeginn) in die Vorproduktion vor; nach Z+31 bleiben Freigabe, Posting und Nachbereitung, die jetzt mitzählen.
5. **mittel, Versandstatus aus begrenztem Protokoll.** Behoben: letzter Versand und letzte Berechnung je Festival gezielt abgefragt (`detail->>festival` beziehungsweise `detail @> {festivale:[…]}`); die 200 Zeilen dienen nur dem sichtbaren Verlauf.
6. **mittel, Name bei Prüfpunkten geht verloren.** Behoben: Rechte prüft `whoNorm`, gespeichert wird der genannte Name (bis 60 Zeichen), bei Alex und Lea normiert.
7. **mittel, gleichzeitige Prüfpunktänderungen.** Behoben: `hh_komm_pruefpunkt_set` liest den Vorzustand mit Zeilensperre, schreibt Entscheidung und Protokoll in einer Transaktion; optional `expect_stufe` (gesehene Stufe), Abweichung 409.

Empfehlungen: Rechte für `service_role` ausdrücklich erteilt (Tabellen, Sequenz, Funktionen); Regelwerk wird über `hh_komm_regelwerk_aktivieren` atomar umgeschaltet; der Vergleich aller fünf Festivals mit dem Python-Rechner liegt als `pruefung/komm-vergleich.mjs` im Repo (0 Abweichungen in allen fünf); Wochenlast hat eigene Proben. `komm-test.mjs`: 63 ok, 0 Fehler.
