#!/bin/sh
# Pruefsumme ueber alles, was die Abnahme prueft. Der Beleg selbst zaehlt nicht mit,
# sonst koennte er sich nie auf den eigenen Stand beziehen.
# Erfasst werden versionierte UND noch nicht versionierte Dateien: sonst liesse sich eine neue
# Datei nach der Abnahme hinzufuegen, ohne den Beleg zu entwerten (Befund 4 der Pruefung von 4cdd506).
set -eu
cd "$(dirname "$0")/.." || exit 1
git rev-parse --git-dir >/dev/null 2>&1 || { echo "kein Git-Repo" >&2; exit 1; }
git ls-files -z --cached --others --exclude-standard site supabase pruefung \
  | tr '\0' '\n' \
  | grep -v '^pruefung/letzte-abnahme.json$' \
  | LC_ALL=C sort \
  | while IFS= read -r f; do [ -f "$f" ] && shasum -a 256 "$f"; done \
  | shasum -a 256 \
  | cut -d' ' -f1
