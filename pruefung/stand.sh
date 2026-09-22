#!/bin/sh
# Pruefsumme ueber alles, was die Abnahme prueft. Der Beleg selbst zaehlt nicht mit,
# sonst koennte er sich nie auf den eigenen Stand beziehen.
cd "$(dirname "$0")/.." || exit 1
git ls-files site supabase pruefung \
  | grep -v 'pruefung/letzte-abnahme.json' \
  | sort \
  | xargs shasum -a 256 2>/dev/null \
  | shasum -a 256 \
  | cut -d' ' -f1
