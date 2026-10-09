#!/bin/bash
# V33 So arbeiten wir · Rückfall ohne Claude: Codex setzt die Teilpakete nacheinander um und prüft sich nach jedem
# Teilpaket selbst mit docs/reviews/V33-pruefauftrag.md (eine Runde, nur lesend).
# Aufruf aus dem Repo:  nohup bash pruefung/v33-codex-allein.sh [ab-teilpaket] > /tmp/v33-codex-allein.log 2>&1 &
# Beispiel: bash pruefung/v33-codex-allein.sh V33c   (überspringt V33a und V33b, wenn die schon fertig sind)
# Stand der Teilpakete: docs/reviews/V33-uebergabe.md.
set -u
set -o pipefail
cd "$(dirname "$0")/.."
REPO="$PWD"
AB="${1:-V33a}"
LOG=/tmp
GRENZEN="Grenzen: Ändere nichts an supabase/functions/gfweekly. Keine Lösungsfunktionen in die Seite (keine Anfragen, Zusagen, Erreichbarkeit), keine Bewertung von Personen, keine Hinweise auf Gesundheit. Starte keine weiteren Reviewer oder Agenten. Was nur Alex tun kann, als eine Zeile mit Dauer und genauem Schritt in FRAGEN_FUER_MORGEN.md. Keine Mails verschicken."

teilpaket() {
  local tp="$1" kurz="$2" sandbox="$3" zusatz="$4"
  echo "== $tp: Umsetzung ($(date '+%H:%M')) =="
  if ! codex exec --sandbox "$sandbox" -C "$REPO" --output-last-message "$LOG/v33-codex-$tp.md" \
    "Lies docs/PAKET-V33-SO-ARBEITEN-WIR.md und docs/reviews/V33-uebergabe.md (falls vorhanden) und setze Teilpaket $tp vollständig um. Ändere nur, was das Teilpaket verlangt. $GRENZEN $zusatz Committe am Ende auf main mit der Nachricht '$tp: $kurz'. Schreibe als letzte Nachricht: Commit-SHA, geänderte Dateien, was du geprüft hast, was offen ist." \
    < /dev/null; then
    echo "$tp: Codex-Umsetzung fehlgeschlagen, Abbruch."; exit 1
  fi
  local sha; sha=$(git rev-parse HEAD)
  echo "== $tp: Selbstprüfung am Commit $sha =="
  if ! codex exec --sandbox read-only -C "$REPO" --output-last-message "$LOG/v33-pruefung-$tp.md" \
    "Prüfe Teilpaket $tp am Commit $sha nach docs/reviews/V33-pruefauftrag.md (git show $sha und die betroffenen Dateien). Du änderst nichts und startest keine weiteren Reviewer. Gib den Bericht genau im Ausgabeformat des Prüfauftrags aus." \
    < /dev/null; then
    echo "$tp: Selbstprüfung fehlgeschlagen. Eine fehlende Prüfung gilt nicht als bestanden."; exit 1
  fi
  cp "$LOG/v33-pruefung-$tp.md" "docs/reviews/$tp-runde-selbst.md"
  if grep -Eq '\[(schwer|mittel)\]' "docs/reviews/$tp-runde-selbst.md"; then
    echo "== $tp: Befunde schwer/mittel, eine Korrekturrunde =="
    codex exec --sandbox "$sandbox" -C "$REPO" --output-last-message "$LOG/v33-codex-$tp-korrektur.md" \
      "Arbeite die Befunde der Schwere schwer und mittel aus docs/reviews/$tp-runde-selbst.md ab. Verwirfst du einen Befund, belege das in docs/reviews/$tp-antwort-selbst.md mit Datei und Zeile. $GRENZEN Committe auf main mit der Nachricht '$tp: Antwort auf Selbstprüfung'." \
      < /dev/null || { echo "$tp: Korrekturrunde fehlgeschlagen, Abbruch."; exit 1; }
  else
    git add "docs/reviews/$tp-runde-selbst.md" && git commit -q -m "$tp: Selbstprüfung ohne schwere oder mittlere Befunde" || true
  fi
}

lauf=0
for tp in V33a V33b V33c V33d; do
  [ "$tp" = "$AB" ] && lauf=1
  [ "$lauf" = 1 ] || continue
  case "$tp" in
    V33a) teilpaket V33a "Seite feingeschliffen" workspace-write "Du hast in dieser Sandbox kein Netz." ;;
    V33b) teilpaket V33b "Wirkungsprobe und Aufräumen" danger-full-access "Für Aufrufe der Edge Function brauchst du das Passwort in GF_PW (Umgebung). Fehlt es, schreibe die Probe als pruefung/arbeiten-probe.mjs (Aufruf GF_PW=… node …) und trage das Ausführen samt Aufräumen als Zeile in FRAGEN_FUER_MORGEN.md ein." ;;
    V33c) teilpaket V33c "Dokumentation" workspace-write "Du hast in dieser Sandbox kein Netz." ;;
    V33d) teilpaket V33d "veröffentlicht" danger-full-access "Vor dem Push git fetch und git status; Push nach origin/main mit 'git push origin main' und prüfe den Rückgabewert, ohne die Ausgabe zu filtern. Danach live prüfen: curl auf https://hohes-haus.netlify.app/arbeiten.html (200, Menüpunkt in /assets/core.js)." ;;
  esac
done
echo "== fertig ($(date '+%H:%M')) =="
