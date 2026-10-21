# Zugang: Google, Domänen und Rollen

Öffentliche Lesefassung 1.0 vom 17.10.2026. Grundlage: BAUSTEIN-ZUGANG-GOOGLE-DOMAENEN-ROLLEN.md vom 07.10.2026. Art: technischer Baustein zu ST-01 bis ST-05, kein zusätzlicher allgemeiner Organisationsstandard.

## Zweck und Geltung

Der Baustein beschreibt einen wiederverwendbaren Zugang für Team und ausdrücklich zugelassene Partner. Gäste, Bewerbende und bewusst öffentliche Angebote benötigen eine eigene passende Zugangsregel. Je Firma bleiben Zulassung, Konten, Rollen, Daten und Konfiguration getrennt. Maßgeblich für diese Abgrenzung ist die spätere Firmenregel im [Wilde Habitate Katalog](WILDE-HABITATE-STANDARD.md), Fassung 0.2.

## Warum dieser Baustein sinnvoll ist

Eine gemeinsame Bauweise vereinfacht Anmeldung und Prüfung, während Rechte am jeweiligen Werkzeug durchgesetzt werden. Drei getrennte Fragen bleiben erkennbar: Wer meldet sich an? Wer darf ein Konto erhalten? Was darf dieses Konto lesen oder ändern?

## Die drei Schichten

1. **Anmeldung.** Google über Supabase Auth mit PKCE und eigenem OAuth Client je Werkzeug. Die Quelle sieht den internen Einverständnisbildschirm der eigenen Organisation und Anmeldelinks nur für bestehende Konten vor. Eine Domänenvorgabe im Anmeldefenster erleichtert die Auswahl, ersetzt aber keine Zugangsprüfung.
2. **Zulassung.** Neue Konten werden vor ihrer Erstellung nach der freigegebenen Domäne oder Einladung geprüft. Der Before User Created Hook ist dafür ein serverseitiger Mechanismus. Ein erst beim Datenzugriff wirkendes Tor verhindert nicht automatisch die Registrierung.
3. **Rechte.** Rollen liegen serverseitig vor und werden bei geschützten Zugriffen geprüft. Der Browser zeigt passende Bedienung; er erteilt keine Rechte. Zeilenberechtigungen und Funktionen begrenzen Lesen, Schreiben und Rollenänderungen.

## Vor einem Einbau klären

Die verantwortliche Person legt Organisation, zugelassene Konten, externe Beteiligte, erste Administration, Rollen und den führenden Pflegeort fest. Ein interner Google Einverständnisbildschirm und die Einladung externer Google Konten sind nicht automatisch miteinander vereinbar. Der gewählte Weg muss den tatsächlich benötigten Zugang ermöglichen und unzulässigen Zugang verhindern.

Rollen einer bestehenden Fachanwendung werden nicht allein wegen ähnlicher Namen ersetzt. Identitätsverknüpfung, erhaltene Rechte und bestehende Sitzungen brauchen eigene Prüfungen. Die ältere Aussage, das Sperren eines Google Kontos entziehe automatisch sofort jeden Werkzeugzugang, wird nicht als Garantie übernommen.

## Konkrete Prüfung

1. Zugelassene Person meldet sich an, kehrt korrekt zurück, behält nach Neuladen ihre Sitzung und kann sich abmelden.
2. Eine nicht zugelassene Registrierung wird auch beim direkten Schnittstellenaufruf abgewiesen und erzeugt kein Konto. Fehlercode und Zustand werden tatsächlich geprüft; ein bestimmter Code allein genügt nicht.
3. Lesende Rolle kann nicht schreiben. Bearbeitende Rolle kann keine Rechte ausweiten. Personendaten bleiben auf die fachlich berechtigten Rollen beschränkt.
4. Gesperrte Konten und bereits laufende Sitzungen werden getrennt geprüft. Ein abgemeldeter Browser ist kein ausreichender Beleg für die Ungültigkeit eines bereits ausgestellten Zugriffstokens.
5. Einladungen, Konten ohne Profil, Rückfallanmeldung und Zugriffe über alle vorgesehenen Datenwege werden passend zum Projekt geprüft. Produktive Testkonten oder Nachrichten entstehen nur im dafür autorisierten Auftrag.

Der Prüfbericht nennt Projekt, Fassung, Datum und konkrete Fälle. Er übernimmt keine frühere Ampel als heutigen Befund. Schema und Zählungen können Hinweise liefern, ersetzen aber keine erlaubten und verweigerten Zugriffe.

## Herkunft und fachliche Einordnung

Die Originalübergabe wurde am 07.10.2026 von Claude Cowork erstellt. Sie beschreibt damalige Referenzumsetzungen und eine Bestandsaufnahme. Ein genanntes Beispiel hatte ein Tor beim Datenzugriff, aber keinen Hook vor der Registrierung. Die pauschale Aussage, alle drei Schichten seien damit überall erfüllt, ist deshalb nicht belastbar. Historische Projektbefunde, Kennungen, Kontenzahlen und Sicherheitslücken sind nicht Teil dieser öffentlichen Lesefassung.

Am 17.10.2026 wurde die Einordnung an aktuellen Herstellerquellen geprüft: Google erklärt, dass der angefragte Parameter hd nur die Kontoauswahl beeinflusst; der verifizierte Token muss separat geprüft werden. Supabase beschreibt den Hook vor dem Anlegen neuer Nutzer sowie eigenständige Sitzungen mit kurzlebigen Zugriffstokens. Diese Dokumentationsprüfung ist kein Test unserer Anwendungen.

1. [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect).
2. [Supabase: Before User Created Hook](https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook).
3. [Supabase: Sitzungen und Zugriffstokens](https://supabase.com/docs/guides/auth/sessions).

Die Aussage eines zentralen Zugangs für alle Werkzeuge ist auf die jeweilige Firma zu begrenzen. Eine Verbindung über Firmengrenzen folgt daraus nicht. Der Originaltext bleibt unverändert; diese Fassung zeigt die nötige Abgrenzung ausdrücklich. [Herkunft der Bibliothek](QUELLEN.md).
