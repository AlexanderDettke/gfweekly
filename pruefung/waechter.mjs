/* Waechter: die statischen Prueffungen, die keine Meinung brauchen.
   Jede davon haette einen Befund vom 22.09.2026 vor dem Commit gefunden.
   Aufruf:  node pruefung/waechter.mjs
   Ergebnis: je Befund eine Zeile, Rueckgabewert 1 bei mindestens einem Befund.

   Der Waechter urteilt nicht ueber Geschmack. Er prueft nur Dinge, die falsch oder richtig sind. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

/* fileURLToPath statt URL.pathname: sonst bleibt in einem Pfad mit Leerzeichen %20 stehen
   und jede Datei gilt als fehlend (Befund 10 der Prüfung von 4cdd506). */
const WURZEL = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const lies = (p) => fs.readFileSync(path.join(WURZEL, p), 'utf8');
const gibt = (p) => fs.existsSync(path.join(WURZEL, p));
const befunde = [];
const melde = (pruefung, text) => befunde.push({ pruefung, text });

/* ---- 1. Migrationen: eindeutige, aufsteigende Versionskennungen ----
   Befund 21 der Pruefung vom 22.09.2026: drei Dateien trugen 20260921, drei trugen 20260922.
   Als geordnete Kette ist das nicht reproduzierbar; Supabase verlangt eindeutige Zeitstempel. */
function migrationen() {
  const ordner = 'supabase/migrations';
  if (!gibt(ordner)) return;
  const dateien = fs.readdirSync(path.join(WURZEL, ordner)).filter(f => f.endsWith('.sql')).sort();
  const nachKennung = new Map();
  for (const f of dateien) {
    const m = f.match(/^(\d{8,14})_/);
    if (!m) { melde('migrationen', `${f} hat keine Versionskennung am Anfang`); continue; }
    const k = m[1];
    if (!nachKennung.has(k)) nachKennung.set(k, []);
    nachKennung.get(k).push(f);
  }
  for (const [k, fs_] of nachKennung) {
    if (fs_.length > 1) melde('migrationen', `Versionskennung ${k} tragen ${fs_.length} Dateien: ${fs_.join(', ')}`);
  }
}

/* ---- 2. Behauptungen in der Dokumentation ----
   Befund 10, 33 und 34: README und Technikstand haben mehr Verlaesslichkeit behauptet, als da war
   („nie“, „immer“, „abgenommen“). Solche Woerter brauchen einen Beleg in derselben Zeile oder der davor:
   einen Commit, eine Zahl, eine Datei, ein Datum. Sonst sind sie Wunschdenken. */
function behauptungen() {
  const dateien = ['README.md', 'docs/TECHNIKSTAND.md', 'ARBEITSSTAND.md', 'FRAGEN_FUER_MORGEN.md'].filter(gibt);
  const stark = /\b(nie|niemals|immer|in jedem Fall|garantiert|vollständig geprüft|abgenommen|abnahmefähig|lückenlos|kann nicht passieren)\b/i;
  const beleg = /(\b[0-9a-f]{7,40}\b|\d+[,.]\d+|\d{2}\.\d{2}\.\d{4}|\d+\s*(Zeilen|Proben|Bilder|Prozent|px|Aufgaben)|`[^`]+\.(md|sql|ts|js|mjs|py|json|html|css|sh)`|BEKANNTE-MAENGEL)/;
  for (const f of dateien) {
    const zeilen = lies(f).split('\n');
    zeilen.forEach((z, i) => {
      if (z.trimStart().startsWith('>')) return;              // Warnkasten darf deutlich sein
      if (/nicht abnahmefähig|nicht abgenommen|keine Abnahme/i.test(z)) return;
      if (!stark.test(z)) return;
      const umfeld = (zeilen[i - 1] || '') + z + (zeilen[i + 1] || '');
      if (beleg.test(umfeld)) return;
      melde('behauptungen', `${f}:${i + 1} behauptet ohne Beleg: „${z.trim().slice(0, 90)}“`);
    });
  }
}

/* ---- 3. Prueffungen duerfen sich nicht selbst bestaetigen ----
   Befund 29, der schwerste: pruefung/bedienung.mjs faengt alle Aufrufe der Edge Function ab und prueft
   gegen selbst gebaute Objekte. Solche Skripte duerfen sich nicht Abnahme nennen. */
function selbstbestaetigung() {
  const ordner = 'pruefung';
  if (!gibt(ordner)) return;
  for (const f of fs.readdirSync(path.join(WURZEL, ordner))) {
    if (!/\.(mjs|js)$/.test(f)) continue;
    const t = lies(path.join(ordner, f));
    const faengtAb = /page\.route\(|ctx\.route\(|context\.route\(/.test(t);
    if (!faengtAb) continue;
    if (!/Oberfl(ä|ae)chentest/i.test(t)) {
      melde('selbstbestaetigung',
        `pruefung/${f} fängt Aufrufe ab, nennt sich aber nicht Oberflächentest. `
        + 'Ein Test gegen selbst gebaute Antworten belegt die Oberfläche, nicht die Wirkung.');
    }
    /* Das Stichwort im Kopf darf die Behauptung nicht legitimieren: wer abfängt, darf nicht
       „Abnahme bestanden“ ausgeben (Befund 3 der Prüfung von 4cdd506). */
    const behauptet = t.split('\n').filter(z =>
      /Abnahme\b[^\n]{0,40}?\b(bestanden|erfolgreich|in Ordnung|grün)\b/i.test(z)
      && !/\b(keine|kein|nicht|ohne)\b[^\n]{0,20}Abnahme/i.test(z)
      && !/^\s*(\/\/|\/\*|\*|#)/.test(z));
    if (behauptet.length) {
      melde('selbstbestaetigung',
        `pruefung/${f} fängt Aufrufe ab und meldet trotzdem eine bestandene Abnahme: „${behauptet[0].trim().slice(0, 70)}“.`);
    }
  }
  if (gibt('pruefung/abnahme.sh')) {
    const t = lies('pruefung/abnahme.sh');
    if (/Abnahme bestanden/.test(t) && !/Oberfl(ä|ae)che/i.test(t)) {
      melde('selbstbestaetigung',
        'pruefung/abnahme.sh meldet „Abnahme bestanden“, ohne zu sagen, welcher Teil davon nur die Oberfläche prüft.');
    }
  }
}

/* ---- 4. Feste Datumswerte in Prueffungen ----
   Befund 30: mehrere Matrixerwartungen rechnen mit festen Oktoberdaten ohne festen Stichtag.
   Sie werden allein durch Zeitablauf falsch, ohne dass jemand etwas aendert. */
function stichtag() {
  for (const f of ['pruefung/matrix-test.mjs', 'pruefung/korb-probe.mjs', 'pruefung/matrix-probe.mjs'].filter(gibt)) {
    const t = lies(f);
    const hatDatum = /20\d{2}-\d{2}-\d{2}/.test(t);
    const hatStichtag = /STICHTAG|stichtag|heute\s*=\s*['"]20\d{2}-/.test(t);
    if (hatDatum && !hatStichtag) {
      melde('stichtag', `${f} rechnet mit festen Datumswerten, aber ohne festen Stichtag. Der Test wird durch Zeitablauf falsch.`);
    }
  }
}

/* ---- 5. Ist die letzte Abnahme zum aktuellen Stand gelaufen? ----
   Damit „fertig“ nicht behauptet werden kann, solange die Pruefung zu einem aelteren Commit gehoert. */
function frische() {
  const datei = 'pruefung/letzte-abnahme.json';
  if (!gibt(datei)) {
    melde('frische', `${datei} fehlt. Ohne sie ist unbelegt, zu welchem Stand die letzte Prüfung gehört.`);
    return;
  }
  let d = {};
  try { d = JSON.parse(lies(datei)); } catch (_e) { melde('frische', `${datei} ist kein gültiges JSON.`); return; }
  /* Ein Beleg mit passender Prüfsumme, aber leeren Feldern wäre ein Freifahrtschein
     (Befund 5 der Prüfung von 4cdd506). Deshalb wird der Inhalt geprüft, nicht nur das Vorhandensein. */
  /* Streng, weil ein Beleg sonst nur eine Behauptung in Dateiform ist (Befund 14 der Prüfung von 12d9458):
     echter Commit, echtes Datum in der Vergangenheit, je Lauf ein eigener kurzer Eintrag. */
  const PFLICHT = ['tokens', 'farbscan', 'kontrast', 'matrix', 'schirme', 'bedienung', 'waechter'];
  if (!/^[0-9a-f]{64}$/.test(String(d.stand || ''))) melde('frische', `${datei}: „stand“ ist keine Prüfsumme.`);
  if (!/^[0-9a-f]{40}$/.test(String(d.commit || ''))) melde('frische', `${datei}: „commit“ ist kein Commit.`);
  else {
    /* In einem flachen Klon (GitHub Actions holt standardmäßig nur einen Commit) fehlt die Geschichte.
       Dann ist ein unbekannter Commit kein Befund, sondern eine Grenze des Klons. */
    let flach = false;
    try { flach = execSync('git rev-parse --is-shallow-repository', { cwd: WURZEL }).toString().trim() === 'true'; } catch (_e) {}
    if (!flach) {
      try { execSync(`git cat-file -e ${d.commit}^{commit}`, { cwd: WURZEL, stdio:'ignore' }); }
      catch (_e) { melde('frische', `${datei}: den Commit ${String(d.commit).slice(0,7)} gibt es in diesem Repo nicht.`); }
    }
  }
  const zeit = Date.parse(String(d.datum || ''));
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(String(d.datum || '')) || Number.isNaN(zeit)) {
    melde('frische', `${datei}: „datum“ fehlt oder ist keine gültige Zeitangabe.`);
  } else if (zeit > Date.now() + 3600000) {
    melde('frische', `${datei}: „datum“ liegt in der Zukunft.`);
  }
  if (!Array.isArray(d.laeufe) || !d.laeufe.length) melde('frische', `${datei}: „laeufe“ ist leer.`);
  else {
    const eintraege = d.laeufe.map(l => String(l).toLowerCase().trim());
    if (eintraege.some(l => l.length > 40)) melde('frische', `${datei}: ein Eintrag in „laeufe“ ist keine Laufbezeichnung, sondern ein Satz.`);
    const fehlt = PFLICHT.filter(n => !eintraege.some(l => l.split(/[^a-zäöüß]+/).includes(n)));
    if (fehlt.length) melde('frische', `${datei}: der Beleg nennt diese Läufe nicht als eigenen Eintrag: ${fehlt.join(', ')}.`);
  }
  if (typeof d.ungeprueft !== 'string' || d.ungeprueft.trim().length < 10) {
    melde('frische', `${datei}: „ungeprueft“ fehlt oder ist zu dünn. Jede Prüfung hat blinde Flecken, sie gehören benannt.`);
  }
  /* Der Stand ist eine Prüfsumme über alles, was die Abnahme prüft. Er haengt bewusst nicht am Commit:
     sonst waere der Beleg nach jedem weiteren Commit veraltet, ohne dass sich Geprueftes geaendert hat. */
  let jetzt = '';
  /* Scheitert die Prüfsumme, ist das ein Befund und kein Grund zum Durchwinken
     (Befund 6 der Prüfung von 4cdd506). */
  try { jetzt = execSync('pruefung/stand.sh', { cwd: WURZEL, stdio:['ignore','pipe','pipe'] }).toString().trim(); }
  catch (e) { melde('frische', 'pruefung/stand.sh ließ sich nicht ausführen: ' + String(e.message).slice(0, 120)); return; }
  if (!/^[0-9a-f]{64}$/.test(jetzt)) { melde('frische', 'pruefung/stand.sh hat keine Prüfsumme geliefert.'); return; }
  if (d.stand !== jetzt) {
    melde('frische', `Seit der letzten Abnahme (${String(d.datum).slice(0, 16)}) hat sich Geprüftes geändert. `
      + `Beleg ${String(d.stand).slice(0, 12)}, jetzt ${jetzt.slice(0, 12)}. Die Abnahme gehört nicht zu diesem Stand.`);
  }
}

/* ---- 6. Bekannte Maengel muessen sichtbar sein ----
   Wenn es offene Befunde gibt, muss das README darauf zeigen, nicht nur eine Datei im docs-Ordner. */
function maengelSichtbar() {
  if (!gibt('docs/BEKANNTE-MAENGEL.md')) return;
  if (!gibt('README.md')) return;
  if (!/BEKANNTE-MAENGEL/.test(lies('README.md'))) {
    melde('maengel', 'docs/BEKANNTE-MAENGEL.md gibt es, aber das README zeigt nicht darauf.');
  }
}

/* Waehrend der Abnahme selbst wird die Frischepruefung ausgelassen: sie prueft den Beleg, den dieselbe
   Abnahme erst schreibt. Danach laeuft der Waechter noch einmal vollstaendig. */
const pruefungen = [migrationen, behauptungen, selbstbestaetigung, stichtag, maengelSichtbar];
if (!process.env.WAECHTER_OHNE_FRISCHE) pruefungen.push(frische);
for (const f of pruefungen) {
  try { f(); } catch (e) { melde(f.name, 'Prüfung selbst fehlgeschlagen, das gilt als Befund: ' + e.message); }
}

if (!befunde.length) {
  console.log('Wächter: keine Befunde.');
  process.exit(0);
}
const nachPruefung = new Map();
for (const b of befunde) {
  if (!nachPruefung.has(b.pruefung)) nachPruefung.set(b.pruefung, []);
  nachPruefung.get(b.pruefung).push(b.text);
}
for (const [p, liste] of nachPruefung) {
  console.log(`\n== ${p} ==`);
  for (const t of liste) console.log('   ' + t);
}
console.log(`\nWächter: ${befunde.length} Befunde.`);
process.exit(1);
