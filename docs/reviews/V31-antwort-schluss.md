# Antwort auf die letzten Runden (31c, 31d, 31e jeweils Runde 3) und die Gesamtprüfung · Commit 3f04c4c

Es gibt keine weitere Codex-Runde (höchstens drei je Teilpaket, eine Gesamtprüfung). Was behoben ist, ist hier belegt; was offen bleibt,
steht mit Begründung in `docs/BEKANNTE-MAENGEL.md`, Abschnitt V31. Belege: Migration `supabase/migrations/20261003191414_hh_vorhaben_v31_schluss.sql`
(angewendet am 03.10.2026), v38 neu deployt nach Diff gegen den Live-Stand, Wirkungsprobe 97 von 97 (danach in der Datenbank: kein Testvorhaben,
keine Testabwesenheit, kein Probe-Einwurf, kein Probe-Ticker), Bedienung „Alle Bedienproben in Ordnung“, Abnahme „Alle Prüfungen bestanden“.

## 31c, Runde 3

| Nr. | Schwere | Entscheidung | Beleg |
|---|---|---|---|
| 1 | schwer | übernommen | `hh_einwurf_apply` vergleicht gesehene Werte unter der Sperre: Punktstand (aus dem Dialog, sonst `stand_gesehen` der KI-Prüfung), nächster Schritt und Frist (aus dem Dialog, sonst `schritt_gesehen`, `frist_gesehen`) über `expect` an `hh_vorhaben_save`; Abweichung 409. Wirkungsprobe: „Einwurf gegen einen inzwischen geänderten Punkt (409)“, „Leas Stand bleibt stehen“. |
| 2 | mittel | übernommen | Die Wahl heißt jetzt „in Für dich, beim nächsten Besuch“ und „sofort im Laufband“; der Morgenbericht ist nicht angebunden (`BEKANNTE-MAENGEL.md`, V31, Punkt 2; Frage 7). |
| 3 | mittel | übernommen | Der Dialog steht sofort mit Ladehinweis und Schließen da; die Seite wird erst danach inert, Abbrechen während des Ladens beendet sauber. |
| 4 | leicht | übernommen | Technikstand nennt die Zahl aus dem Code (siehe dort). |

Empfehlungen: 1 offen (Vorschläge des Abgleichs tragen keine Revision; das braucht den neuen Abgleich-Text). 2 teilweise: nach 409 lädt der Dialog den Einwurf neu, die Werte stehen in der Meldung.

## 31d, Runde 3

| Nr. | Schwere | Entscheidung | Beleg |
|---|---|---|---|
| 1 | mittel | übernommen anders | Statt eines Cursors: über 2.000 Einträge gibt es „Alles gesehen“ nicht, und der Kopf sagt „nur die neuesten geladen, bitte in den Akten lesen“; der Zeitpunkt rückt dann nicht vor, es geht nichts verloren. Ein Cursor lohnt bei der heutigen Menge (unter 100 Einträge am Tag) nicht. |
| 2 | mittel | übernommen | `load()` auf Für dich trägt eine laufende Nummer und die Person; eine ältere Antwort oder die der anderen Person wird verworfen. |
| 3 | mittel | übernommen | Die Rückkehr zeigt alle Einträge seit Beginn selbst (fünf offen, der Rest aufklappbar), statt auf die Akte mit ihrer Grenze von 200 zu verweisen. |
| 4 | schwer | übernommen | `absence_end` ruft `hh_absence_end`: Status, Themen (nur an Zeilen dieser Abwesenheit), Rückgabe der Vorhaben-Bälle und Protokoll in einer Transaktion; Asana wird danach archiviert. Wirkungsprobe: beide Testabwesenheiten enden über diesen Weg, Bälle zurück. |

Empfehlungen: 1 offen (Abschlussansicht des Korbs, Frage 11). 2 übernommen (siehe 1). 3 bleibt Lea und Alex vor dem 13.10. (Frage 2).

## 31e, Runde 3

| Nr. | Schwere | Entscheidung | Beleg |
|---|---|---|---|
| 1 | mittel | offen, mit Begründung | Der eingerichtete Cowork-Auftrag lässt sich aus dieser Sitzung nicht ändern; der Text ist fertig. `BEKANNTE-MAENGEL.md`, V31, Punkt 1; Frage 3. |
| 2 | mittel | übernommen | Quelle B schließt beide Einwurf-Adressen aus (bei Alex und Lea). |
| 3 | mittel | übernommen | Beim Stand-Vorschlag sind Titel, wer und Frist schreibgeschützt (`readonly`, `aria-readonly`); gespeichert wird nur der Stand. |
| 4 | leicht | übernommen | README: das Passwort kommt aus dem Secret `GFWEEKLY_PASSWORD`. |

Empfehlungen: 1 offen (strukturierte Vorschläge, Frage 8). 2 offen (`hh_vorhaben_quelle` parallel nicht live geprüft, Mängel Punkt 5). 3 offen: C2 prüft Absender und Berichtsart noch nicht; das gehört in den neuen Abgleich-Text, sobald klar ist, ob XCeed überhaupt Berichte schickt. 4 übernommen als Live-Prüfung in `V31e-antwort-2.md`, nicht in der wiederholbaren Probe (sie kann keine Vorschläge schreiben).

## Gesamtprüfung

| Nr. | Schwere | Entscheidung | Beleg |
|---|---|---|---|
| 1 | schwer | übernommen | Ein sofortiger Ticker entsteht nur aus dem übernommenen Verlaufstext; ohne Verlauf bleibt es bei Für dich, `uebersprungen` sagt es. Der Rohtext geht nie ins Laufband. |
| 2 | mittel | übernommen | `schicht_uebergabe` gibt nur Bälle weiter, die bei der abgebenden Person liegen (`expect_ball` muss ihr Ball sein, die Datenbank prüft, dass er noch dort liegt). Wirkungsprobe: „Schichtwechsel gibt keinen fremden Ball weiter“. |
| 3 | mittel | übernommen | `handover_set` und `handover_set_many` verlangen `by` (Alex oder Lea). Wirkungsprobe: „Übergabe ohne by (400)“. Beide Seiten schicken `by` schon mit. |
| 4 | mittel | übernommen in der Beschriftung | siehe 31c/2. |
| 5 | mittel | offen | siehe 31e/1. |
| 6 | mittel | offen, mit Begründung | Der Einwurf aus Abnahme Punkt 3 ist technisch bis zum Vorschlag für XCeed durchgespielt und am Testvorhaben übernommen; in der echten Akte steht er erst, wenn Alex die Zusage bestätigt (Frage 5). |
| 7 | mittel | übernommen | Die Probe archiviert am Ende wie im Paket und löscht dann allen Testbestand; Probe prüft „kein Testvorhaben mehr in der Datenbank“. |

Empfehlungen: 1 offen (Mängel Punkt 4). 2 übernommen im Technikstand (Abnahme V31, getrennt nach Oberfläche, Wirkung, live). 3 offen (Frage 11). 4 nicht übernommen: `wer` am Punkt braucht die KI, um „Niclaas schickt …“ dem richtigen Punkt zuzuordnen; es sind Vornamen ohne Bewertung.

### Gestaltung und Bedienung

1. Nächster Schritt vor dem Stand auf den Karten: ist schon so (Karten zeigen Tag, Titel, nächsten Schritt, Ball, Punkte; der Stand steht nur in Liste und Akte).
2. Feste Kurzzeile „Ball bei … · nächster Schritt … · bis …“: nicht übernommen. Karten in Woche und Board tragen genau diese drei Angaben, die Akte zeigt sie als Kacheln und Kasten oben; eine zweite Zeile mit demselben Inhalt wäre mehr Text.
3. Filter „Vor dem 14.10. entscheiden“: nicht in V31. Der Übergabekorb sammelt genau diese Fälle (Ball bei Lea, Ball GF mit Frist im Fenster) und ordnet sie; ein zweiter Ort wäre ein weiterer Posteingang. Frage 12.
4. In „Seit du zuletzt da warst“ Ballwechsel zuerst: übernommen (was jetzt bei mir liegt und dorthin gewandert ist, steht oben).
