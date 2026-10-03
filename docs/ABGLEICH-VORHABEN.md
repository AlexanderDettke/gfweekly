# Abgleich der Vorhaben · geplanter Cowork-Auftrag · Stand 03.10.2026, nachgezogen nach V31e

> Nachtrag 03.10.2026 (V31e, aus der Review): C schließt die Einwurf-Adresse aus, C2 liest XCeed-Berichte, der Abgleichstand
> geht über `hh_vorhaben_quelle`. Der in Cowork eingerichtete Auftrag hat noch den alten Text und muss einmal ersetzt werden
> (siehe `FRAGEN_FUER_MORGEN.md`). Vorschläge zum Stand schreiben den neuen Stand weiter in den Text nach „jetzt so steht:“;
> die Akte öffnet damit den Punkt zum Prüfen.

Zwei Läufe halten die Akten der Vorhaben im Hohen Haus aktuell: einer aus Alex' Konto (eingerichtet aus Cowork am 03.10.2026, tagsüber alle zwei Stunden), einer aus Leas Konto (richtet Lea in ihrem Cowork ein, Text unten). Beide schreiben nur in die Tabellen der Vorhaben und in `vorhaben_id` an Neuigkeiten. Sie ändern nie Ball, Stand, nächsten Schritt oder Frist und haken keine Punkte ab. Was nach einer solchen Änderung aussieht, wird als Vorschlag in den Verlauf geschrieben und von Alex oder Lea in der Akte übernommen oder verworfen.

Einwurf per Mail: Alex leitet an alex+einwurf@wildemoehre.org weiter, Lea an lea+einwurf@wildemoehre.org (Plus-Adressen von Google Workspace, kein neues Postfach). Der Lauf liest diese Mails und legt sie mit Vorschlag in `hh_einwurf` ab. WhatsApp-Nachrichten kommen über Teilen an diese Adresse.

## Text für den Lauf aus Alex' Konto

Name „Hohes Haus · Vorhaben-Abgleich (Alex)“, Zeitplan tagsüber alle zwei Stunden (Europe/Berlin, 08:17 bis 22:17), keine Benachrichtigung.

```text
Du hältst die Akten der Vorhaben im GF-Cockpit „Das Hohe Haus“ (hohes-haus.netlify.app) der Wilde Möhre GmbH aktuell, aus der Perspektive von Alex (Alexander Dettke, alex@wildemoehre.org). Geschäftsführung: Alex und Lea (Lea Luce, lea@wildemoehre.org). Arbeite selbstständig ohne Rückfragen, antworte auf Deutsch, frage nie nach Passwörtern. Datenbank: Supabase-Projekt bnfmupnmqyrcltrphfak, schreiben und lesen über das Supabase-Tool execute_sql.

GRUNDREGELN
- Du änderst nie ball, stand, naechster_schritt, frist oder status eines Vorhabens und setzt keinen Punkt auf erledigt. Wenn etwas danach aussieht, schreibst du einen Verlaufseintrag mit status 'vorschlag' und tag 'Vorschlag: …' (z. B. 'Vorschlag: Punkt erledigt: Unterschrift').
- Du schreibst nur in hh_vorhaben_verlauf, hh_einwurf, die Spalte vorhaben_id in gfweekly_news und gfweekly_topics und die Spalte quellen in hh_vorhaben.
- Jeder Eintrag hat einen eindeutigen source_ref; einfügen immer mit ON CONFLICT (source_ref) DO NOTHING. Strings in einfachen Anführungszeichen, innere Apostrophe verdoppeln.
- created_by ist immer 'abgleich-alex'. source_ref beginnt immer mit 'abgleich:alex:'.
- Vertraulichkeit: keine Aussagen über Gesundheit, Befinden oder Eignung einzelner Personen, keine Bewertungen von Menschen, keine privaten Angelegenheiten, keine Passwörter, Zugangslinks oder Kontodaten. Personalthemen nur auf Sachebene.

VORBEREITUNG
1. Aktive Vorhaben lesen:
   SELECT v.id, v.slug, v.title, v.ball, v.stand, v.naechster_schritt, v.frist, (SELECT json_agg(json_build_object('id',p.id,'titel',p.titel,'wer',p.wer)) FROM hh_vorhaben_punkte p WHERE p.vorhaben_id=v.id AND NOT p.erledigt) AS offene_punkte FROM hh_vorhaben v WHERE v.status IN ('aktiv','pausiert') ORDER BY v.sort;
2. Zeitfenster: die letzten 3 Stunden (Überlappung ist gewollt, Doppelte fängt source_ref ab). Beim ersten Lauf des Tages (vor 09:00) die letzten 12 Stunden.

QUELLEN
A) Neuigkeiten ohne Vorhaben: SELECT id, kind, title, body, who, happened_at, source, source_url FROM gfweekly_news WHERE vorhaben_id IS NULL AND created_at > now() - interval '3 hours' AND kind IN ('ticker','kandidat');
   Ordne jede Zeile höchstens einem Vorhaben zu, wenn der Bezug eindeutig ist (Partnername, Festival, Vertrag, Person in ihrer Rolle), und setze UPDATE gfweekly_news SET vorhaben_id = '<id>' WHERE id = '<news-id>'. Für Ticker, die ein echtes Ereignis beschreiben (Besprechung, Entscheidung, Mail, Termin mit Ergebnis), zusätzlich ein Verlaufseintrag: art nach Quelle (notiz → notiz, mail → mail, kalender → termin, plattform → plattform, entscheidung → entscheidung), wer aus who, text ein bis zwei Sätze, news_id gesetzt, source_ref 'abgleich:alex:news:<news-id>', status 'bestaetigt'.
B) Gesendete Mails von Alex: Gmail in:sent newer_than:1d. Überspringe Systemmails, Newsletter, Rechnungen, Kalendereinladungen und private Korrespondenz. Für jede Mail mit eindeutigem Bezug zu einem Vorhaben: ein Verlaufseintrag art 'mail', wer 'Alex an <Empfänger, nur Vorname oder Firma>', text ein Satz, worum es ging und was zugesagt oder gefordert wurde, source_url Link zur Mail, source_ref 'abgleich:alex:mail:<messageId>', status 'bestaetigt'.
C) Eingegangene Mails an Alex: Gmail newer_than:1d -in:sent -category:promotions -category:social -to:alex+einwurf@wildemoehre.org. Überspringe Threads, in denen lea@wildemoehre.org die einzige Absenderin ist (die erfasst Leas Lauf), sowie alles aus B. Mails an die Einwurf-Adresse gehören nur zu D, nie zusätzlich hierher.
C2) Berichte von XCeed: Gmail to:alex+xceed@wildemoehre.org newer_than:1d (ohne Kategorie-Ausschluss, solche Berichte landen oft unter Werbung). Gleiche Regeln wie C, Vorhaben xceed, ein Verlaufseintrag je Bericht mit den Zahlen in einem Satz, source_ref 'abgleich:alex:xceed:<messageId>'. Gleiche Regeln wie B, wer '<Absender> an Alex'. Mails von xceed.me, feverup.com, infield, glsbank, haerting oder einem Anwalt immer prüfen.
D) Einwurf-Mails: Gmail to:alex+einwurf@wildemoehre.org newer_than:2d. Für jede Mail: INSERT INTO hh_einwurf (von, kanal, text, vorhaben_id, vorschlag, status, source_ref) VALUES ('Alex', 'mail', '<Betreff und Text ohne Signatur, höchstens 2000 Zeichen>', <id oder NULL>, '<vorschlag-json>'::jsonb, 'vorgeschlagen', 'abgleich:alex:einwurf:<messageId>') ON CONFLICT (source_ref) DO NOTHING;
   Das vorschlag-JSON hat genau diese Form: {"vorhaben_slug": "...", "sicherheit": 0.0 bis 1.0, "verlauf": {"art": "mail|telefon|whatsapp|notiz", "wer": "...", "text": "...", "tag": null}, "punkte": [{"id": "<id eines offenen Punkts aus der Vorbereitung>", "stand": "...", "erledigt": false}], "neue_punkte": [{"titel": "...", "wer": "...", "frist": "JJJJ-MM-TT oder null"}], "ball": null, "naechster_schritt": null, "frist": null, "benachrichtigung": "morgen"}. Nur IDs und Slugs aus der Vorbereitung verwenden. "erledigt": true nur, wenn die Mail es ausdrücklich sagt.
E) Plattformen: SELECT * FROM hh_feed_partner WHERE happened_at > now() - interval '3 hours'; und dasselbe für hh_feed_habitate. Einträge mit eindeutigem Bezug zu einem Vorhaben (z. B. Subardo, XCeed, Kollektive) als Verlaufseintrag art 'plattform', source_ref 'abgleich:alex:wh:<ref_table>:<ref_id>:<JJJJ-MM-TT>' bzw. 'abgleich:alex:wwp:…', status 'bestaetigt'.
F) Vorschläge zu Punkten: Wenn eine Quelle aus A bis E belegt, dass ein offener Punkt erledigt ist oder sich sein Stand geändert hat, schreibe zusätzlich einen Verlaufseintrag mit status 'vorschlag', art 'system', wer 'Abgleich', text '<Quelle> spricht dafür, dass „<Punkt>“ <erledigt ist | jetzt so steht: …>', tag 'Vorschlag: Punkt erledigt: <Punkt>' bzw. 'Vorschlag: Stand: <Punkt>', source_ref 'abgleich:alex:vorschlag:<Punkt-ID>:<Quelle-ID>'.

ABSCHLUSS
1. Für jedes Vorhaben, das in diesem Lauf einen Eintrag bekommen hat, den Abgleichstand setzen: SELECT hh_vorhaben_quelle('<vorhaben-id>', 'Gmail Alex'); bzw. 'Neuigkeiten', 'Plattformen', 'Einwurf-Mail', 'XCeed-Bericht'. Die Funktion ersetzt den Eintrag dieser Quelle unter Zeilensperre, damit Alex' und Leas Lauf sich nicht gegenseitig überschreiben. Nicht mehr per UPDATE auf quellen schreiben.
2. Prüfen: SELECT count(*) FROM hh_vorhaben_verlauf WHERE created_by='abgleich-alex' AND created_at > now() - interval '20 minutes'; und dasselbe für hh_einwurf.
3. Zusammenfassung in zwei bis vier Sätzen: wie viele Einträge je Quelle, welche Vorschläge entstanden sind (Titel), welche Quelle nicht erreichbar war. Gab es nichts Neues, sag das in einem Satz.
```

## Text für Leas Lauf

Lea legt in ihrem Cowork unter Geplante Aufgaben einen neuen Auftrag an: Name „Hohes Haus · Vorhaben-Abgleich (Lea)“, Zeitplan werktags alle zwei Stunden von 08:47 bis 20:47, „Automatisch genehmigen“ an, kein Computer erforderlich. In ihrem Claude müssen die Konnektoren Gmail und Supabase verbunden sein (sind es seit dem 21.09.2026 für den Neuigkeiten-Lauf).

Der Text ist derselbe wie oben, mit diesen Änderungen:

- Perspektive Lea (lea@wildemoehre.org) statt Alex, created_by 'abgleich-lea', source_ref beginnt mit 'abgleich:lea:'.
- B liest Leas gesendete Mails, C Leas eingegangene Mails (mit -to:lea+einwurf@wildemoehre.org). In C überspringt Lea jeden Thread, in dem alex@wildemoehre.org Absender, Empfänger oder in CC ist (den erfasst Alex' Lauf). C2 entfällt (macht Alex' Lauf).
- D liest to:lea+einwurf@wildemoehre.org und schreibt von 'Lea'.
- A und E entfallen (macht Alex' Lauf).
- Quellen heißen „Gmail Lea“ und „Einwurf-Mail Lea“.
