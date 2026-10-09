#!/bin/bash
# V33 So arbeiten wir · Rückfall ohne Claude: Codex setzt die Teilpakete nacheinander um und prüft sich nach jedem
# Teilpaket selbst mit docs/reviews/V33-pruefauftrag.md (eine Runde, nur lesend).
# Aufruf aus dem Repo:  nohup bash pruefung/v33-codex-allein.sh [ab-teilpaket] > /tmp/v33-codex-allein.log 2>&1 &
# Beispiel: bash pruefung/v33-codex-allein.sh V33c   (überspringt V33a und V33b, wenn die schon fertig sind)
# Stand der Teilpakete: docs/reviews/V33-uebergabe.md.
# Codex läuft immer mit --sandbox workspace-write (kein Netz, .git gesperrt). Darum committet dieses Skript selbst nach
# jedem Lauf, und V33d (Push, Live-Abruf) erledigt das Skript in der Shell.
set -u
set -o pipefail
cd "$(dirname "$0")/.."
REPO="$PWD"
AB="${1:-V33a}"
LOG=/tmp
GRENZEN="Grenzen: Du hast kein Netz und kannst nicht committen; das Skript committet nach deinem Lauf. Ändere nichts an supabase/functions/gfweekly. Keine Lösungsfunktionen in die Seite (keine Anfragen, Zusagen, Erreichbarkeit), keine Bewertung von Personen, keine Hinweise auf Gesundheit. Starte keine weiteren Reviewer oder Agenten. Was nur Alex tun kann, als eine Zeile mit Dauer und genauem Schritt in FRAGEN_FUER_MORGEN.md. Keine Mails verschicken."

sichern() {  # alle Änderungen außer dem unversionierten Session-Review committen
  git add -A -- . ':!docs/SESSION-REVIEW-*' && git commit -q -m "$1" || echo "(nichts zu committen)"
}

teilpaket() {
  local tp="$1" kurz="$2" zusatz="$3"
  echo "== $tp: Umsetzung ($(date '+%H:%M')) =="
  if ! codex exec --sandbox workspace-write -C "$REPO" --output-last-message "$LOG/v33-codex-$tp.md" \
    "Lies docs/PAKET-V33-SO-ARBEITEN-WIR.md und docs/reviews/V33-uebergabe.md (falls vorhanden) und setze Teilpaket $tp vollständig um. Ändere nur, was das Teilpaket verlangt. $GRENZEN $zusatz Schreibe als letzte Nachricht: geänderte Dateien, was du geprüft hast, was offen ist." \
    < /dev/null; then
    echo "$tp: Codex-Umsetzung fehlgeschlagen, Abbruch."; exit 1
  fi
  sichern "$tp: $kurz"
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
    codex exec --sandbox workspace-write -C "$REPO" --output-last-message "$LOG/v33-codex-$tp-korrektur.md" \
      "Arbeite die Befunde der Schwere schwer und mittel aus docs/reviews/$tp-runde-selbst.md ab. Verwirfst du einen Befund, belege das in docs/reviews/$tp-antwort-selbst.md mit Datei und Zeile. $GRENZEN" \
      < /dev/null || { echo "$tp: Korrekturrunde fehlgeschlagen, Abbruch."; exit 1; }
    sichern "$tp: Antwort auf Selbstprüfung"
  else
    sichern "$tp: Selbstprüfung ohne schwere oder mittlere Befunde"
  fi
}

veroeffentlichen() {
  echo "== V33d: Push und Live-Abruf ($(date '+%H:%M')) =="
  git fetch -q origin || { echo "fetch fehlgeschlagen"; exit 1; }
  if ! git merge-base --is-ancestor origin/main HEAD; then echo "origin/main ist weiter, Push abgebrochen (Parallelarbeit prüfen)."; exit 1; fi
  if ! git push origin main; then echo "Push fehlgeschlagen."; exit 1; fi
  for i in 1 2 3 4 5 6 7 8 9 10; do
    code=$(curl -s -o /dev/null -w '%{http_code}' https://hohes-haus.netlify.app/arbeiten.html)
    menue=$(curl -s https://hohes-haus.netlify.app/assets/core.js | grep -c 'arbeiten.html')
    [ "$code" = 200 ] && [ "$menue" -ge 1 ] && { echo "live: arbeiten.html 200, Menüpunkt da"; return 0; }
    sleep 30
  done
  echo "live nicht bestätigt (Code $code, Menüpunkt $menue)"; exit 1
}

lauf=0
for tp in V33a V33b V33c V33d; do
  [ "$tp" = "$AB" ] && lauf=1
  [ "$lauf" = 1 ] || continue
  case "$tp" in
    V33a) teilpaket V33a "Seite feingeschliffen" "" ;;
    V33b) teilpaket V33b "Wirkungsprobe vorbereitet" "Das Backend erreichst du nicht. Schreibe die Probe als pruefung/arbeiten-probe.mjs (Aufruf GF_PW=… node pruefung/arbeiten-probe.mjs, mit Aufräumen am Ende) und trage das Ausführen als Zeile in FRAGEN_FUER_MORGEN.md ein." ;;
    V33c) teilpaket V33c "Dokumentation" "" ;;
    V33d) veroeffentlichen ;;
  esac
done
echo "== fertig ($(date '+%H:%M')) =="
