# Wilde Habitate: Standards für digitale Werkzeuge

Öffentliche Lesefassung 1.0 vom 17.10.2026. Grundlage: WILDE-HABITATE-STANDARD.md, Fassung 0.2 vom 09.10.2026. Dokumentierter interner Katalog; die Aufnahme in diese Bibliothek erteilt keine neue Freigabe für andere Firmen oder Projekte.

## Zweck und Geltung

Der Katalog bündelt Anforderungen an Zugang, Daten, Redaktion, Betrieb und Gestaltung digitaler Werkzeuge. Die Quelle richtet sich an Webseiten, interne Anwendungen und Plattformen mit Anmeldung, Personendaten oder bearbeitbaren Inhalten. Reine Informationsseiten wenden nur die passenden allgemeinen Regeln an.

Vorrangig ist die in der Quelle ergänzte Firmenregel vom 07.10.2026: Jede Firma führt eigene Daten, Personen, Kennungen, Anmeldung, Rechte und ein eigenes Register. Gemeinsam ist die datenfreie Bauweise. Die GmbH umfasst die fünf Festivals; andere Rechtsträger bleiben eigenständig. Bestehende ausdrücklich beschlossene Ausnahmen bleiben erhalten. Eine gemeinsame Gestaltung oder technische Grundlage schafft keine gemeinsame Datenberechtigung.

## Warum dieser Katalog sinnvoll ist

Wiederkehrende Anforderungen müssen nicht bei jedem Werkzeug neu erfunden werden. Prüfbare Regeln sollen offene Zugänge, verlorene redaktionelle Arbeit und unklare Zuständigkeiten vermeiden. Das ist der dokumentierte Zweck. Die Aufnahme bestätigt weder die aktuelle Erfüllung in einzelnen Anwendungen noch eine gemessene Wirkung.

## Die vierzehn Anforderungen

Die Quelle bezeichnet ST-01 bis ST-13 als Pflicht und ST-14 als Empfehlung innerhalb ihres Geltungsbereichs. Ausnahmen entscheidet Alexander; sie werden mit Grund, Geltung und Ablaufdatum im jeweiligen Projekt und dessen Register dokumentiert.

1. **ST-01 Anmeldung mit Google.** Für Teamwerkzeuge mit Anmeldung: Google über Supabase Auth mit PKCE, eigener OAuth Client je Werkzeug im Projekt der jeweiligen Organisation und in der Quelle interner Einverständnisbildschirm. Ein Anmeldelink ist nur für bestehende Konten als Rückfall vorgesehen. Prüfen: zulässige Anmeldung, verweigerter Zugang, bereinigte Rückkehradresse, Sitzung nach Neuladen und Abmeldung. Der [Zugangsbaustein](BAUSTEIN-ZUGANG-GOOGLE-DOMAENEN-ROLLEN.md) erläutert die offenen Abgrenzungen.
2. **ST-02 Domänentor in der Datenbank.** Neue Konten nur nach der eigenen Zulassungsregel, serverseitig vor der Kontoerstellung geprüft. Externe benötigen eine freigegebene Einladung; anonyme Teamanmeldung ist ausgeschaltet. Prüfen: Ein unzulässiger direkter Registrierungsversuch erzeugt kein Konto. Ein Tor beim späteren Datenzugriff ist ein anderer Mechanismus und kein Nachweis dieser Anforderung.
3. **ST-03 Rollen und Rechte auf dem Server.** Die Quelle sieht mindestens admin, editor und viewer vor. Rollenvergabe, Rollenänderung und benötigter Zugriff auf Personendaten werden serverseitig entschieden. Prüfen: lesende Rolle kann nicht schreiben; bearbeitende Rolle kann keine Rechte ausweiten; eine Sperre greift am geschützten Zugriff. Abweichende fachliche Rollenmodelle sind ausdrücklich abzugleichen.
4. **ST-04 Zeilenschutz ohne pauschalen Zugang.** Tabellen mit Datenzugriff erhalten passende Zeilenberechtigungen. Die Quelle untersagt uneingeschränktes true für angemeldete Konten und anonyme Schreibrechte außer geprüften Formulareinfügungen. Personendaten sollen nur über rollenprüfende Funktionen lesbar sein. Prüfen: tatsächliche erlaubte und verweigerte Lese und Schreibwege. Eine reine Anzahl von Regeln beweist keine wirksame Absicherung.
5. **ST-05 Geheimnisse schützen.** Geheimnisse liegen in den dafür vorgesehenen geschützten Diensten, niemals im Repository, öffentlichen Browsercode oder Protokoll. Im Browser sind nur dafür vorgesehene öffentliche Schlüssel zulässig. Prüfen: Quellbestand, erzeugte Ausgabe und Protokolle; Schlüsselwerte nicht in Nachweise übernehmen.
6. **ST-06 Teaminhalte vor Updates schützen.** Redaktionelle Daten haben einen führenden Pflegeort. Geschützte Werte bekommen bei einem Abgleich einen Änderungsvorschlag; ungeschützte Werte können übernommen werden. Feste Kennungen und serverseitiger Schutz verhindern Überschreiben oder Löschen geschützter Inhalte. Prüfen: geschützten und ungeschützten Fall sowie direkte Schreibversuche einschließlich privilegierter Zugänge.
7. **ST-07 Versionen und Protokoll.** Änderungen veröffentlichter Werte bewahren Person, Zeitpunkt, Art und Herkunft. Rechteänderungen, sensible Exporte und Löschungen werden berechtigt einsehbar protokolliert. Frühere Fassungen müssen über die Oberfläche wiederherstellbar sein. Prüfen: Änderung und tatsächliche Wiederherstellung.
8. **ST-08 Sicherheitsregeln der Seite.** Die Quelle verlangt eine restriktive Content Security Policy, Schutz vor falscher Inhaltserkennung, begrenzte Referrerweitergabe und Schutz vor fremder Einbettung. Interne Bereiche tragen noindex; das ersetzt keine Anmeldung. Fremde Skripte benötigen eine Begründung. Prüfen: ausgelieferte Header und normale Bedienung auf schmalem und großem Bildschirm.
9. **ST-09 Impressum, Datenschutz und Einwilligung.** Öffentliche Seiten weisen ihre richtige Betreiberin und eingesetzte Dienste aus. Einwilligungen bewahren ihre Textfassung; Auskunft und Löschung sind möglich und nachvollziehbar. Die fachliche und rechtliche Prüfung erfolgt im jeweiligen Projekt. Dieser Katalog ist kein Nachweis rechtlicher Konformität.
10. **ST-10 Rückweg, Freigabe und zweite Prüfung.** Arbeit erfolgt in freigegebenen Paketen. Migrationen haben einen getesteten Rückweg, wesentliche Änderungen eine unabhängige Gegenprüfung. Produktionsänderungen benötigen den passenden Auftrag Alexanders. Ein bestehender konkreter Veröffentlichungsauftrag wird nicht durch eine zusätzliche pauschale Rückfrage ersetzt.
11. **ST-11 Gestaltung, Sprache und Barrierefreiheit.** Das jeweilige Designsystem und die festgelegte Sprache bleiben erhalten. Die Quelle nennt du und ihr, Gendern mit Doppelpunkt, WCAG AA Kontrast, Tastaturbedienung, Ziele ab 44 Pixel, reduzierte Bewegung und überlauffreie Ansichten bei 320, 390 und 1440 Pixel. Prüfen: tatsächliche Hauptwege, verständlicher Fokus und Lesbarkeit. Daraus folgt keine bereits erreichte Barrierefreiheit.
12. **ST-12 Eigenes Werkzeugregister.** Name, Adresse, Zweck, Verantwortung, Repository, Datenprojekt, Rollenmodell und belegter Standardstand stehen im Register der jeweiligen Firma. Andere Firmen erscheinen allenfalls als Sprunglink. Prüfen: Zuordnung, Aktualität und verantwortliche Pflege.
13. **ST-13 Eine Quelle je Datenart.** Jede Firma legt je Datenart einen führenden Pflegeort fest. Eigene Anwendungen lesen oder verweisen entsprechend ihrer Rechte. Fremde Firmen greifen nicht allein wegen gemeinsamer Technik auf diese Daten zu. Prüfen: Herkunft, erlaubte Übergaben und Konfliktregel vor neuen Tabellen.
14. **ST-14 Adresse und Hosting, empfohlen.** Die Quelle empfiehlt Netlify, Supabase in einer EU Region, eigene Domains und Anmeldekonfiguration je Firma sowie ein Repository mit benanntem Produktionszweig je Werkzeug. Prüfen: passende Geltung, Kosten, Betrieb und begründete Abweichungen.

## Anwendung und Nachweis

Vor Änderungen die tatsächlich passenden Anforderungen, den vorhandenen Stand und offene Ausnahmen bestimmen. Erfüllt, teilweise erfüllt, ungeprüft und nicht zutreffend unterscheiden. Jeder Erfüllungsnachweis nennt Datum, geprüfte Fassung, konkreten Ablauf, Ergebnis und Grenze. Die Schritte Katalog, Startvorlage, Prüfer und Zugang je Firma sind in der Quelle ein Entwicklungsweg; diese Veröffentlichung richtet sie nicht automatisch ein.

## Herkunft und offene Punkte

Die Quelle nennt Claude Cowork als Ersteller und dokumentiert Alexanders Freigabe des Vorgehens vom 07.10.2026. Fassung 0.2 ergänzt am 09.10.2026 die Firmenregel. Diese Angaben werden als Quellenangaben erhalten; eine neue unternehmensweite Annahme ist damit nicht bestätigt.

Dies ist eine gekürzte und öffentlich aufbereitete Lesefassung. Interne Sicherheitsbefunde, Projektkennungen und Originalpfade sind ausgelassen. Technische Anforderungen sind vor einem Einbau am konkreten Projekt zu prüfen. Insbesondere externer Zugang trotz internem Google Einverständnisbildschirm, abweichende Rollen und vorhandene Ausnahmen bleiben projektspezifisch zu klären. Die Originaldatei bleibt unverändert erhalten. [Herkunft der Bibliothek](QUELLEN.md).
