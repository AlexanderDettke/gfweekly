/* Prüfung der Rechenlogik Kommunikation (V32, 06.10.2026), ohne Browser und ohne Edge Function.
   Aufruf: node pruefung/komm-test.mjs
   1. Lusatia mit Stichtag 05.10.2026 gegen docs/referenz/postingplan/beispiel-lus-2027-aufgaben.csv, Zeile für Zeile
      (105 Hauptaufgaben in der CSV, davon 3 Wochenaufgaben, 776 Schritte, 14 überfällige Schritte, 0 Freigaben am Wochenende),
      einmal im Referenzmodus, einmal im Betriebsmodus (Slots ab V; für Lusatia identisch, weil V nach dem Stichtag liegt).
   2. Werktagsregel an einem Feiertag. 3. Vorgezogener Timetable vor dem 15.06.2027. 4. Slots partnerfähig nur mit Thema
   aus partnerfaehig_themen. Dazu Asana-Rahmen, Fixtermine, Partner-Slots, Tick und die Kopien in der Edge Function. */
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const K = require('../site/assets/komm-logik.js');
const RW_PFAD = new URL('../docs/referenz/postingplan/habitat-postingplan-regelwerk.json', import.meta.url);
const rw = JSON.parse(fs.readFileSync(RW_PFAD, 'utf8'));

let fehler = 0, ok = 0;
const gleich = (name, ist, soll) => {
  const a = JSON.stringify(ist), b = JSON.stringify(soll);
  if (a === b) { ok++; console.log('  ok     ' + name); }
  else { fehler++; console.log('  FEHLT  ' + name + '\n         ist  ' + a.slice(0, 400) + '\n         soll ' + b.slice(0, 400)); }
};
const wahr = (name, b) => gleich(name, !!b, true);

function csv(t) {
  const rows = []; let i = 0, f = '', row = [], q = false;
  while (i < t.length) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; } else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; } else if (c !== '\r') f += c;
    i++;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  const h = rows.shift();
  return rows.map(r => Object.fromEntries(h.map((k, j) => [k, r[j]])));
}

const STICHTAG = '2026-10-05';
const lusRw = rw.festivals_2027.find(f => f.id === 'lus');
const LUS = { fid: 'lus', name: lusRw.name, ausgabe: 2027, V: lusRw.V, F: lusRw.F, Z: lusRw.Z, merkmale: lusRw.merkmale, kuerzel: 'LUS', short_name: 'LUSRD27' };
const SAISON = K.plus(rw.festivals_2027.map(f => f.F).sort()[0], -21);
const csvRef = csv(fs.readFileSync(new URL('../docs/referenz/postingplan/beispiel-lus-2027-aufgaben.csv', import.meta.url), 'utf8'));

console.log('\n1. Lusatia gegen die Beispiel-CSV');
for (const modus of [{ referenz: true }, { referenz: false }]) {
  const erg = K.berechne(rw, LUS, STICHTAG, Object.assign({ saison_start: SAISON }, modus));
  const zeilen = K.csvZeilen(LUS, erg, STICHTAG);
  const name = modus.referenz ? 'Referenzmodus' : 'Betriebsmodus';
  const haupt = zeilen.filter(r => !r.eltern_id);
  gleich(`${name}: 105 Hauptaufgaben (102 Veröffentlichungen und interne, 3 Wochenaufgaben)`, [haupt.length, erg.pubs.length, erg.wochen.length], [105, 102, 3]);
  gleich(`${name}: 776 Schritte`, erg.pubs.reduce((s, p) => s + p.schritte.length, 0), 776);
  gleich(`${name}: 14 überfällige Schritte`, K.ueberfaellig(erg.pubs, STICHTAG).schritte, 14);
  const ft = K.regelwerkInfo(rw).feiertage;
  const amWochenende = zeilen.filter(r => r.eltern_id && ['planung', 'erstellung', 'abstimmung', 'freigabe'].includes(r.phase) && (K.wochentag(r.faellig) >= 5 || ft.has(r.faellig)));
  gleich(`${name}: 0 Freigaben oder Erstellungen am Wochenende oder Feiertag`, amWochenende.length, 0);
  const ref = new Map(csvRef.map(r => [r.aufgabe_id, r]));
  let abw = [];
  gleich(`${name}: gleiche Zeilenzahl wie die CSV`, zeilen.length, csvRef.length);
  for (const r of zeilen) {
    const p = ref.get(r.aufgabe_id);
    if (!p) { abw.push(r.aufgabe_id + ' fehlt in der CSV'); continue; }
    for (const k of ['eltern_id', 'regel_id', 'titel', 'schritt', 'phase', 'rolle', 'werkzeug', 'start', 'faellig', 'kanal', 'klasse', 'bezug', 'veroeffentlichung', 'status', 'hinweis', 'abstand'])
      if (String(r[k] ?? '') !== String(p[k] ?? '')) abw.push(`${r.aufgabe_id} ${k}: ${r[k]} statt ${p[k]}`);
    if ((r.stunden === '' ? '' : Number(r.stunden)) !== (p.stunden === '' ? '' : Number(p.stunden))) abw.push(`${r.aufgabe_id} stunden: ${r.stunden} statt ${p.stunden}`);
  }
  gleich(`${name}: jede Zeile gleich (Kennung, Termine, Rollen, Stunden, Status)`, abw.slice(0, 5), []);
}

console.log('\n2. Werktagsregel an einem Feiertag');
const ft = K.regelwerkInfo(rw).feiertage;
gleich('Pfingstmontag 17.05.2027 rückt auf Freitag 14.05.2027', K.werktag('2027-05-17', ft), '2027-05-14');
gleich('Tag der Deutschen Einheit 03.10.2026 (Samstag) rückt auf Freitag 02.10.2026', K.werktag('2026-10-03', ft), '2026-10-02');
gleich('Karfreitag 26.03.2027 rückt auf Donnerstag 25.03.2027', K.werktag('2027-03-26', ft), '2027-03-25');
gleich('ein normaler Mittwoch bleibt', K.werktag('2027-05-12', ft), '2027-05-12');
{
  /* Ein Schritt, dessen Rohtermin auf einen Feiertag fällt: S-Beitrag mit T = 31.10.2026 + 4 (Sa), F1 bei T-4 = 31.10. (Reformationstag) */
  const erg = K.berechne(rw, LUS, STICHTAG, { saison_start: SAISON });
  const roh = [];
  for (const p of erg.pubs) for (const s of p.schritte) if (ft.has(s.faellig) && ['planung', 'erstellung', 'abstimmung', 'freigabe'].includes(s.phase)) roh.push(p.id + ' ' + s.schritt_id);
  gleich('kein Planungs-, Erstellungs-, Abstimmungs- oder Freigabeschritt fällt in der Lusatia-Rechnung auf einen Feiertag', roh, []);
}

console.log('\n3. Vorgezogener Timetable vor dem 15.06.2027');
{
  const erg = K.berechne(rw, LUS, STICHTAG, { saison_start: SAISON });
  const tt = erg.pubs.find(p => p.regel_id === 'F14-TT');
  gleich('Timetable Lusatia am 09.07.2027', tt.t, '2027-07-09');
  const vor = tt.schritte.filter(s => ['planung', 'erstellung', 'abstimmung'].includes(s.phase) && s.schritt_id !== 'E9');
  wahr('alle Planungs-, Erstellungs- und Abstimmungsschritte enden spätestens am 15.06.2027', vor.every(s => s.faellig <= '2027-06-15'));
  gleich('E9 Fakten aktualisieren T-7 bis T-6, beides auf Freitag 02.07.2027 (Werktag)', tt.schritte.filter(s => s.schritt_id === 'E9').map(s => [s.start, s.faellig]), [['2027-07-02', '2027-07-02']]);
  gleich('Hinweis „vorgezogen auf Stichtag 15.06.“', tt.hinweis, 'vorgezogen auf Stichtag 15.06.');
  const f1 = tt.schritte.find(s => s.schritt_id === 'F1');
  gleich('Faktencheck bleibt kurz vor T (T-5 bis T-4, Werktag)', [f1.start, f1.faellig], ['2027-07-02', '2027-07-05']);
  wahr('vor der Saison (vor dem 02.07.2027) wird nichts vorgezogen', erg.pubs.filter(p => p.t < SAISON).every(p => !p.hinweis));
  gleich('8 vorgezogene Veröffentlichungen bei Lusatia (wie der Referenz-Rechner)', erg.pubs.filter(p => p.schritte.some(s => s.schritt_id === 'E9')).length, 8);
}

console.log('\n4. Slots partnerfähig nur mit Thema aus partnerfaehig_themen');
{
  const themen = new Set(rw.partnerfaehig_themen);
  const erg = K.berechne(rw, LUS, STICHTAG, { saison_start: SAISON });
  const slots = erg.pubs.filter(p => p.regel_id === 'SLOT');
  wahr('Lusatia hat Slots', slots.length > 10);
  gleich('jeder Slot: partnerfähig genau dann, wenn sein Thema in der Liste steht', slots.filter(p => p.partnerfaehig !== themen.has(p.thema)).map(p => p.id), []);
  wahr('es gibt partnerfähige und zentrale Slots', slots.some(p => p.partnerfaehig) && slots.some(p => !p.partnerfaehig));
  gleich('Grundthemen ohne Bibliothek sind nie partnerfähig', slots.filter(p => ['erlebnis', 'menschen', 'entscheidung', 'orientierung'].includes(p.thema) && p.partnerfaehig).length, 0);
  const regeln = new Set(rw.regeln.filter(r => r.partnerfaehig && r.id !== 'SLOT').map(r => r.id));
  gleich('partnerfähige Regeln wie im Regelwerk', erg.pubs.filter(p => p.regel_id !== 'SLOT' && p.partnerfaehig !== regeln.has(p.regel_id)).map(p => p.id), []);
  gleich('Pflicht heißt: jede Regel außer SLOT', erg.pubs.filter(p => p.pflicht === (p.regel_id === 'SLOT')).length, 0);
}

console.log('\n5. Stabile Kennungen im Betriebsmodus');
{
  const a = K.berechne(rw, LUS, '2026-10-20', { saison_start: SAISON });
  const b = K.berechne(rw, LUS, '2026-11-10', { saison_start: SAISON });
  const ta = new Map(a.pubs.map(p => [p.id, p.t]));
  const verschoben = b.pubs.filter(p => ta.has(p.id) && ta.get(p.id) !== p.t).map(p => p.id);
  gleich('zwischen zwei Rechentagen ändert keine Kennung ihren Termin', verschoben, []);
  gleich('alle Kennungen eindeutig', new Set(a.pubs.map(p => p.id)).size, a.pubs.length);
  const ref = K.berechne(rw, LUS, '2026-11-10', { saison_start: SAISON, referenz: true });
  const tr = new Map(a.pubs.map(p => [p.id, p.t]));
  wahr('im Referenzmodus würden Slots wandern (deshalb Betriebsmodus ab V)', ref.pubs.some(p => p.regel_id === 'SLOT' && tr.has(p.id) && tr.get(p.id) !== p.t));
}

console.log('\n6. Asana-Rahmen');
{
  const erg = K.berechne(rw, LUS, STICHTAG, { saison_start: SAISON });
  const r = K.asanaRahmen(Object.assign({ short_name: 'LUSRD27' }, LUS), erg.pubs, 'https://hohes-haus.netlify.app');
  const einzelnSoll = erg.pubs.filter(p => p.regel_id !== 'PRUEF' && (['P', 'L', 'PR', 'TM', 'NL', 'AD', 'INT'].includes(p.klasse) || (p.klasse === 'M' && p.pflicht))).length;
  gleich('Einzelaufgaben: P, L, PR, TM, NL, AD, INT und Pflicht-M, dazu die Prüfpunkte', [r.einzeln - r.pruefpunkte, r.pruefpunkte], [einzelnSoll, erg.pubs.filter(p => p.regel_id === 'PRUEF').length]);
  const gebuendelt = r.aufgaben.filter(a => a.art === 'buendel').reduce((s, a) => s + a.ids.length, 0);
  gleich('jede Veröffentlichung genau einmal: einzeln oder im Monatsbündel', r.einzeln + gebuendelt, erg.pubs.length);
  wahr('Bündel heißen „Redaktion <Monat>: n Beiträge“', r.aufgaben.filter(a => a.art === 'buendel').every(a => /^Redaktion [A-ZÄÖÜ][a-zä]+ 20\d\d: \d+ Beiträge · Lusatia$/.test(a.name)));
  wahr('Schritte als abhakbare Liste mit dem Satz „Vorschlag aus dem Regelwerk, Verteilung durch dich“', r.aufgaben.filter(a => a.art === 'veroeffentlichung').every(a => a.notes.includes('Vorschlag aus dem Regelwerk, Verteilung durch dich:') && a.notes.includes('[ ] ')));
  wahr('Partner-Slots im Bündel markiert', r.aufgaben.some(a => a.art === 'buendel' && a.notes.includes('Partner-Slot')));
  wahr('Prüfpunkte verlinken auf kommunikation.html', r.aufgaben.filter(a => a.art === 'pruefpunkt').every(a => a.notes.includes('/kommunikation.html?festival=LUSRD27')));
  gleich('Abschnitte je Monat in Reihenfolge', r.abschnitte.slice(0, 3), ['September 2026', 'Oktober 2026', 'November 2026']);
  gleich('Namen eindeutig (Kennung im Projekt)', new Set(r.aufgaben.map(a => a.name)).size, r.aufgaben.length);
  const s = K.versandSaetze(Object.assign({ short_name: 'LUSRD27' }, LUS), r, 'Christian Linck', new Set());
  wahr('Vorschau nennt Projekt und Person', s[0].includes('Kommunikation Lusatia 2027') && s[0].includes('Christian Linck'));
}

console.log('\n7. Fixtermine für die Redaktionstabelle');
{
  const fest = rw.festivals_2027.map(f => ({ fid: f.id, short_name: Object.keys(K.FESTIVALS).find(k => K.FESTIVALS[k].fid === f.id), kuerzel: K.FESTIVALS[Object.keys(K.FESTIVALS).find(k => K.FESTIVALS[k].fid === f.id)].kuerzel, V: f.V, F: f.F, Z: f.Z }));
  const ber = {};
  for (const f of fest) ber[f.short_name] = K.berechne(rw, Object.assign({ name: f.fid, ausgabe: 2027, merkmale: {} }, f), STICHTAG, { saison_start: SAISON }).pubs;
  const fx = K.fixtermine(rw, fest, ber);
  const tag = d => (fx.find(x => x.datum === d) || {}).text;
  gleich('Lusatia öffnet am 23.07.2027, F-7 der Draußenbande liegt nicht in der Tabelle', tag('2027-07-23'), 'LUS F');
  wahr('Stichtag Vorproduktion am 15.06.2027', (tag('2027-06-15') || '').split(' · ').includes('Stichtag Vorproduktion'));
  gleich('Gästeinfos freigegeben am 01.07.2027', tag('2027-07-01'), 'Gästeinfos freigegeben');
  wahr('Lineup Lusatia (F-45) am 08.06.2027, dazu der Prüfpunkt F-45', tag('2027-06-08') === 'LUS Lineup · LUS Prüfpunkt');
  gleich('VVK Lusatia am 15.10.2026', tag('2026-10-15'), 'LUS VVK');
  wahr('mehrere Einträge eines Tages mit „ · “ getrennt', fx.some(x => x.eintraege.length > 1 && x.text.includes(' · ')));
  wahr('jede Zelle trägt die Kennung komm: im Hinweis', fx.every(x => /^komm:fix-\d{4}-\d{2}-\d{2}$/.test(x.notiz)));
  gleich('Spalte F ist der Starttag, 31.12.2027 liegt in Spalte QT', [K.spaltenName(K.spalteZu('2026-10-01', '2026-10-01')), K.spaltenName(K.spalteZu('2026-10-01', '2027-12-31'))], ['F', 'QT']);
  gleich('Zelle frei: leer oder von uns', [K.zelleFrei('', ''), K.zelleFrei('LUS F', 'komm:fix-2027-07-23'), K.zelleFrei('Christians Eintrag', ''), K.zelleFrei('x', 'Notiz von Christian')], [true, true, false, false]);
}

console.log('\n8. Partner-Slots und Tick');
{
  const p = { id: 'x', partnerfaehig: true, t: '2027-03-01', freigabe_status: 'offen' };
  gleich('offen, wenn partnerfähig, nicht übernommen und mindestens 14 Tage entfernt', [K.slotOffen(p, '2027-02-15'), K.slotOffen(p, '2027-02-16')], [true, false]);
  gleich('übernommen ist nicht mehr offen', K.slotOffen(Object.assign({}, p, { partner_uebernommen_am: '2027-01-01T00:00:00Z' }), '2027-01-02'), false);
  gleich('Abgabefrist T-7', K.abgabefrist(p), '2027-02-22');
  const tick = K.tickEntscheidungen([
    { id: 'a', partnerfaehig: true, t: '2027-03-11', freigabe_status: 'offen' },
    { id: 'b', partnerfaehig: true, t: '2027-03-12', freigabe_status: 'offen' },
    { id: 'c', partnerfaehig: true, t: '2027-03-04', partner_uebernommen_am: 'x', abgabe_am: 'y', freigabe_status: 'offen' },
    { id: 'd', partnerfaehig: true, t: '2027-03-04', partner_uebernommen_am: 'x', abgabe_am: 'y', freigabe_status: 'freigegeben' },
    { id: 'e', partnerfaehig: false, t: '2027-03-05', freigabe_status: 'offen' },
  ], '2027-03-01');
  gleich('Rückfall 10 Tage vor T ohne Übernahme, Hinweis 3 Tage vor T bei Abgabe ohne Freigabe', tick, { zurueck: ['a'], hinweis: ['c'] });
}

console.log('\n10. Wochenlast');
{
  const erg = K.berechne(rw, LUS, STICHTAG, { saison_start: SAISON });
  /* Erwartet: jeder Schritt mit dem Anteil seiner Tage ab dieser Woche (Überfälliges davor zählt nicht mehr zur Last). */
  const mo = K.montag(STICHTAG);
  const alle = erg.pubs.reduce((a, p) => a + p.schritte.reduce((b, x) => { const n = Math.max(1, K.tage(x.start, x.faellig) + 1); let m = 0; for (let i = 0; i < n; i++) if (K.plus(x.start, i) >= mo) m++; return b + Number(x.stunden) * m / n; }, 0), 0);
  const woche = erg.wochen.reduce((a, w) => a + w.teile.reduce((b, t) => b + t.stunden, 0), 0);
  const L = K.wochenlast([{ kuerzel: 'LUS', pubs: erg.pubs, wochen: erg.wochen }], STICHTAG, null);
  const summe = L.reduce((a, w) => a + w.gesamt, 0);
  wahr('alle Stunden ab dieser Woche landen in der Wochenlast (Abweichung nur durch Runden)', Math.abs(summe - (alle + woche)) < L.length * 0.06 + 1);
  const ad = erg.pubs.find(p => p.regel_id === 'AD-WINTER');
  const kontrolle = ad.schritte.filter(x => /w\d+$/.test(x.schritt_id));
  wahr('Anzeigenkontrolle läuft wöchentlich nach dem Kampagnenstart weiter', kontrolle.length >= 4 && kontrolle.every(x => x.faellig > ad.t));
  const nachT = K.wochenlast([{ kuerzel: 'LUS', pubs: [ad], wochen: [] }], K.plus(ad.t, 8), null);
  wahr('eine Woche nach dem Start zählt die Kontrolle noch zur Last', nachT.length > 0 && nachT[0].gesamt > 0);
  const after = erg.pubs.find(p => p.regel_id === 'R-AFTER');
  wahr('Aftermovie bei Z+60 mit Schritten nach Z+30', after.t === K.plus(LUS.Z, 60) && after.schritte.some(x => x.faellig > K.plus(LUS.Z, 30)));
  const bis = K.wochenlast([{ kuerzel: 'LUS', pubs: erg.pubs, wochen: erg.wochen }], STICHTAG, K.plus(LUS.Z, 31));
  /* Die Produktion des Aftermovies zieht Rechenregel 7 in die Vorproduktion vor; nach Z+31 bleiben Freigabe, Posting, Nachbereitung. */
  wahr('ein zu kurzer Horizont schneidet die späten Aftermovie-Schritte ab (deshalb Horizont aus dem letzten Schritt)', bis.reduce((a, w) => a + w.gesamt, 0) < summe - 1 && L[L.length - 1].woche >= K.montag(after.t));
  gleich('Wörter für Stellen', [K.stellenWort(30), K.stellenWort(70), K.stellenWort(151)], ['bis eine Stelle', 'bis zwei Stellen', 'über vier Stellen']);
}

console.log('\n9. Kopien in der Edge Function');
{
  const a = fs.readFileSync(new URL('../site/assets/komm-logik.js', import.meta.url));
  const b = fs.readFileSync(new URL('../supabase/functions/gfweekly/komm-logik.js', import.meta.url));
  gleich('komm-logik.js byte-gleich in site/assets und supabase/functions/gfweekly', a.equals(b), true);
  const c = fs.readFileSync(RW_PFAD);
  const d = fs.readFileSync(new URL('../supabase/functions/gfweekly/komm-regelwerk.json', import.meta.url));
  gleich('Regelwerk byte-gleich in docs/referenz und supabase/functions/gfweekly', c.equals(d), true);
}

console.log(`\n${ok} ok, ${fehler} Fehler`);
process.exit(fehler ? 1 : 0);
