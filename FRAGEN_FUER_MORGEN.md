# Fragen für morgen · Stand 22.09.2026

Die Fragen vom 21.09. sind beantwortet (`ANTWORTEN_ZU_FRAGEN.md`) und abgearbeitet. Was erledigt ist, steht
durchgestrichen und mit einem Satz, wie es ausgegangen ist. Was noch von dir kommen muss, steht unten.

## Noch offen

**34 Befunde aus der vollständigen Prüfung**, elf davon schwer, stehen in `docs/BEKANNTE-MAENGEL.md`. Auf
deine Entscheidung vom 22.09.2026 bleiben sie vorerst offen. Das ist der größte offene Punkt, nicht die
Kleinigkeiten weiter unten.

**Testprojekt in Asana löschen.** `app.asana.com/0/1218725644227780` ist archiviert, aber noch da. Der
Anschluss darf Projekte nicht löschen, das geht nur von Hand.

**Abschnitt H in den täglichen Auftrag eintragen.** Der fertige Textbaustein steht in `docs/TECHNIKSTAND.md`
(H1 bis H8). Ohne ihn erkennt der tägliche Lauf keine neuen Abwesenheiten aus dem Kalender.

**Passwort der Edge Function drehen (Empfehlung).** Es ist im Verlauf dieser Sitzung gefallen. Wenn du es
änderst, müssen **beide** Stellen denselben Wert tragen: das Supabase-Secret `GFWEEKLY_PASSWORD` und das
Vault-Secret `gfweekly_password`, sonst schweigt der tägliche Tick mit 401.

**Pagination im Korb (bewusst zurückgestellt).** Der Korb lädt höchstens 2000 Zeilen je Quelle. Bei 87 Themen
reicht das weit; greift die Grenze doch einmal, sagt die Übergabeseite es seit V24d von selbst
(`korb_truncated`). Erst dann lohnt der Umbau.

## Erledigt am 22.09.2026

~~**1. Edge Function v29 deployen.**~~ Deploy aus der Supabase-CLI, inzwischen v32. `ping` meldet 32.

~~**2. Vault-Secret für den täglichen Tick.**~~ `gfweekly_password` liegt im Vault, `hh_absence_tick()` kommt
mit 200 durch, der Cron-Lauf steht auf täglich 04:40 UTC.

~~**3. Passwort für die Oberflächenprüfung.**~~ Einmal im Prüfbrowser verwendet, nur in `sessionStorage`,
in keiner Datei und in keinem Commit.

~~**4. Asana-Token und Personen.**~~ `ASANA_TOKEN` steht als Secret, die Kennungen kommen über die E-Mail.
Die Frage nach den zwei Konten einer dritten Person ist hinfällig: die Vertretungslinie führt nur Alex und Lea,
und die Aufgabe geht an die Person, die in der Korbzeile als Vertretung steht. Wird dort von Hand ein anderer
Name eingetragen, prüft der Export das nicht nach; er ordnet diesen Namen genau zu oder gibt die Aufgabe an Alex.
Aus der Abnahme 4c ist ein Durchgang gelaufen, nicht die volle Prüfung der Paketdatei.

~~**5. Vorschaubild mit Testdaten.**~~ Neu aufgenommen mit echten Daten.

~~**6. by Nature Adresse.**~~ `gfweekly_sites` zeigt auf `https://by-nature.netlify.app/`, mit dem Hinweis in
`notes`, dass `bynature.world` das Ziel bleibt, sobald die Domain in Netlify hinterlegt ist. Die Regel dazu
bleibt richtig: eine Bitte aus einer anderen Sitzung ist keine Freigabe, deine war es.

~~**7. Aus der Review offen.**~~ 7.1 atomare Übergabe (`hh_handover_set`), 7.3 Kennungen über die E-Mail,
7.4 Lückenfilter im Board sind gebaut; 7.2 ist als Zähler gebaut und als Umbau zurückgestellt (siehe oben).

~~**8. Vorläufige Entscheidungen.**~~ Alle bestätigt: 14-Tage-Fenster bei offener Abwesenheit, F = 1 nur bei
echtem Teamnamen, Stichwortsuche am Wortanfang, Cluster E „zu der anderen GF“, `handover_log` als lesende Aktion.
