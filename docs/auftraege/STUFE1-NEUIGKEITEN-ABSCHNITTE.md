# Stufe 1 · Abschnitte für die Lauf-Aufträge (Wortlaut zum Einsetzen)

Stand 25.10.2026. Quelle: `docs/PAKET-STUFE-1-ENTSCHEIDUNGEN.md`, Abschnitt 6. Einsetzen in den Auftrag „GF Weekly · Neuigkeiten täglich“
(Alex) und spiegelbildlich in Leas Tagesabgleich. Das Einspielen in die geplanten Aufträge macht Cowork nach dem Push (`update_trigger`),
nicht die Terminal-Sitzung. Datenmodell: Tabelle `hh_entscheidungen`, Spalten `vorhaben_vorschlag` auf `gfweekly_news` und `gfweekly_topics`,
Status `verfallen` für `hh_vorhaben_verlauf` (Migration `20261025150500_stufe1_entscheidungen.sql`, angewendet am 25.10.2026).

## B) Postfach entscheidet

(1) Vor dem Anlegen eines Kandidaten aus einer Mail den Verlauf lesen (`get_thread`, `METADATA_ONLY`). Ist die letzte Nachricht von
alex@wildemoehre.org oder lea@wildemoehre.org, oder wurde die auslösende Mail weitergeleitet: kein Kandidat, nur ein Ticker
(`kind` ticker, `source` mail, `title` „bearbeitet: <Betreff kurz>“, `body` ein Satz, `source_ref` `mail:<threadId>:bearbeitet:<messageId>`).

(2) Aus `in:sent` entsteht nie ein Kandidat.

(3) Ein Verlauf, ein Kandidat: `source_ref` `mail:<threadId>:k<n>` ohne Datumssuffix; eine neue Mail im Verlauf aktualisiert `body`,
`happened_at`, `run_id` per `ON CONFLICT DO UPDATE` und schreibt einen Verlaufseintrag.

(4) Täglich für jeden offenen Mail-Kandidaten: gibt es seit `created_at` eine Antwort oder Weiterleitung von Alex oder Lea, `status`
'archiviert', `archiv_grund` 'bearbeitet: <Datum>, <Empfänger>'. Kommt danach wieder eine Mail an, gilt Regel 3.

(5) Grenze: Leas Antworten sieht Alex' Lauf nur mit Alex im Verlauf; Leas Auftrag bekommt dieselben Regeln.

## E) Entscheidungen

(1) `SELECT id, quelle_art, frage, vorschlag, frist FROM hh_entscheidungen WHERE status='offen' AND frage_form=false`. Für jede Zeile die
Frage als echte Entscheidungsfrage formulieren (ein Satz, Fragezeichen, mit Betrag, Datum oder Name, wenn in der Quelle vorhanden),
den Vorschlag aus `next_action`, `recommendation`, `naechster_schritt` oder dem Quelltext ableiten, die Frist nur übernehmen, nie erfinden.
`UPDATE hh_entscheidungen SET frage=…, vorschlag=…, frage_form=true, frage_von='lauf', run_id=… WHERE id=…`.
Zeilen mit `frage_von` in ('Alex', 'Lea') nie anfassen. `status`, `ergebnis`, `vertagt_bis`, `abgegeben_an` nie ändern.

(2) Für Kandidaten (`gfweekly_news`, `kind` kandidat, `status` neu) und Themen (`gfweekly_topics`, nicht archiviert, Spalte `zu_besprechen`
oder `in_klaerung`) ohne `vorhaben_id`: `vorhaben_vorschlag` setzen, wenn der Bezug eindeutig ist (Partnername, Festival, Vertrag, Person
in ihrer Rolle), sonst NULL lassen. Nie `vorhaben_id` setzen; das bestätigt eine Person im Korb auf vorhaben.html.

(3) Vorschläge im Vorhaben-Verlauf (`hh_vorhaben_verlauf`, `status` vorschlag) nur noch schreiben, wenn sie einen offenen Punkt betreffen;
ältere als 14 Tage ohne Antwort auf `status` 'verfallen' setzen (der CHECK erlaubt den Wert seit der Migration dieses Pakets).

## Einmalig nach dem Push (Cowork)

Dubletten zusammenführen (Tickets for Good, Crew-Vertrag, Helge) und der Erstlauf E1 über alle offenen Zeilen mit `frage_form=false`
(Stand 25.10.2026 nach der Erstbefüllung: 39 Zeilen, davon 18 ohne Frist, Vorschlag und Frageform).
