/* Wirkungsprobe · Vorhaben abschließen (21.10.2026) gegen das echte Backend, ohne Abfangen.
   Aufruf:  GF_PW=<passwort> node pruefung/abschliessen-probe.mjs [--xceed]
   Vorher legt pruefung/abschliessen-testdaten.sql (Teil „anlegen“) das Testvorhaben test-abschluss mit zwei offenen und
   einem erledigten Punkt und zwei verknüpften Testthemen an, danach löscht derselbe Teil „löschen“ alles wieder.
   Mit --xceed spielt die Probe den Ablauf aus dem Paket am echten Vorhaben xceed durch und lässt es am Ende erledigt
   (verknüpfte Themen bleiben offen, Punkte gibt es dort keine). */
const FN = process.env.GF_FN || 'https://bnfmupnmqyrcltrphfak.supabase.co/functions/v1/gfweekly';
const PW = process.env.GF_PW || '';
if (!PW) { console.error('GF_PW fehlt (Passwort des Hohen Hauses in der Umgebung).'); process.exit(2); }
let fehler = 0, n = 0;
const ok = (bed, text, extra) => { n++; if (bed) console.log('  ✓ ' + text); else { fehler++; console.log('  ✕ ' + text + (extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 300) : '')); } };
async function api(action, payload = {}, erwartet = 200) {
  const res = await fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, password: PW, payload }) });
  let d = {}; try { d = await res.json(); } catch (e) {}
  if (res.status !== erwartet) throw new Error(`${action}: HTTP ${res.status} statt ${erwartet}: ${d.error || ''}`);
  return d;
}
const offen = async () => (await api('vorhaben_list')).vorhaben;
const erledigt = async () => (await api('vorhaben_list', { status: 'erledigt' })).vorhaben;

async function testvorhaben() {
  console.log('\n== Testvorhaben test-abschluss ==');
  let a = await api('vorhaben_get', { slug: 'test-abschluss' });
  const v = a.vorhaben;
  ok(v.status === 'aktiv' && a.punkte.filter(p => !p.erledigt).length === 2 && a.themen.length === 2, 'Ausgang: aktiv, 2 offene Punkte, 2 Themen', { s: v.status, p: a.punkte.length, t: a.themen.length });
  const vorher = { punkte: a.punkte.map(p => [p.id, p.erledigt, p.erledigt_at]).sort().join('|'), themen: a.themen.map(t => t.id).sort().join('|') };
  await api('vorhaben_abschliessen', { id: v.id, by: 'Gast' }, 400).then(d => ok(/Alex oder Lea/.test(d.error), 'by Gast wird abgelehnt'));
  await api('vorhaben_abschliessen', { id: v.id, by: 'Alex', expect: '2020-01-01T00:00:00Z' }, 409).then(d => ok(/inzwischen/.test(d.error), 'veralteter Stand (expect) gibt 409'));
  const r = await api('vorhaben_abschliessen', { id: v.id, by: 'Alex', ergebnis: 'Probe abgeschlossen', punkte_mit: true, themen_mit: true, expect: v.updated_at });
  ok(r.vorhaben.status === 'erledigt' && r.punkte === 2 && r.themen === 2, 'Abschluss mit beiden Haken: erledigt, 2 Punkte, 2 Themen', r);
  ok(r.rueckgaengig.punkte.length === 2 && r.rueckgaengig.themen.length === 2, 'Rückgabe nennt genau die geänderten Kennungen');
  await api('vorhaben_abschliessen', { id: v.id, by: 'Alex' }, 409).then(d => ok(/schon erledigt/.test(d.error), 'zweites Abschließen gibt 409'));
  a = await api('vorhaben_get', { slug: 'test-abschluss' });
  ok(a.punkte.every(p => p.erledigt) && a.themen.length === 0, 'danach: alle Punkte erledigt, keine offenen Themen');
  const e = a.verlauf.find(x => x.art === 'entscheidung');
  ok(e && e.text === 'Erledigt: Probe abgeschlossen (2 Punkte abgehakt, 2 Themen archiviert)' && e.created_by === 'hohes-haus' && e.wer === 'Alex', 'Verlaufseintrag Entscheidung mit Ergebnis', e);
  ok(!a.verlauf.some(x => /^Status: /.test(x.text) && new Date(x.created_at) > new Date(Date.now() - 60000)), 'kein zusätzlicher „Status:“-Eintrag');
  ok(!(await offen()).some(x => x.slug === 'test-abschluss'), 'verschwindet aus der Liste offener Vorhaben');
  const el = (await erledigt()).find(x => x.slug === 'test-abschluss');
  ok(el && el.ergebnis === 'Probe abgeschlossen (2 Punkte abgehakt, 2 Themen archiviert)' && el.erledigt_am, 'erscheint im Filter Erledigt mit Ergebnis und Datum', el);
  await api('vorhaben_wiedereroeffnen', { id: v.id, by: 'Alex', rueckgaengig: { punkte: ['x'] } }, 400).then(() => ok(true, 'kaputtes rueckgaengig wird abgelehnt'));
  const w = await api('vorhaben_wiedereroeffnen', { id: v.id, by: 'Lea', rueckgaengig: r.rueckgaengig });
  ok(w.vorhaben.status === 'aktiv' && w.punkte === 2 && w.themen === 2, 'Rückgängig: aktiv, 2 Punkte offen, 2 Themen zurück', w);
  a = await api('vorhaben_get', { slug: 'test-abschluss' });
  const nachher = { punkte: a.punkte.map(p => [p.id, p.erledigt, p.erledigt_at]).sort().join('|'), themen: a.themen.map(t => t.id).sort().join('|') };
  ok(nachher.punkte === vorher.punkte && nachher.themen === vorher.themen, 'Rückgängig stellt Punkte und Themen exakt her', { vorher, nachher });
  await api('vorhaben_wiedereroeffnen', { id: v.id, by: 'Alex' }, 409).then(d => ok(/nicht abgeschlossen/.test(d.error), 'Wieder öffnen eines aktiven Vorhabens gibt 409'));
  /* Pausieren, Fortsetzen, Archivieren laufen über vorhaben_save. */
  let s = await api('vorhaben_save', { id: v.id, status: 'pausiert', expect: { status: 'aktiv' }, by: 'Alex' });
  ok(s.vorhaben.status === 'pausiert', 'Pausieren');
  s = await api('vorhaben_save', { id: v.id, status: 'aktiv', expect: { status: 'pausiert' }, by: 'Alex' });
  ok(s.vorhaben.status === 'aktiv', 'Fortsetzen');
  const r2 = await api('vorhaben_abschliessen', { id: v.id, by: 'Alex', punkte_mit: false, themen_mit: false });
  ok(r2.punkte === 0 && r2.themen === 0 && r2.rueckgaengig.punkte.length === 0, 'Abschluss ohne Haken ändert keine Punkte und Themen', r2);
  a = await api('vorhaben_get', { slug: 'test-abschluss' });
  ok(a.punkte.filter(p => !p.erledigt).length === 2 && a.themen.length === 2, 'ohne Haken: Punkte und Themen bleiben offen');
  ok(a.verlauf.some(x => x.text === 'Erledigt: ohne Ergebnissatz'), 'leerer Ergebnissatz wird als „ohne Ergebnissatz“ verbucht');
  const w2 = await api('vorhaben_wiedereroeffnen', { id: v.id, by: 'Alex' });
  ok(w2.vorhaben.status === 'aktiv', 'Wieder öffnen ohne Rückgängig');
  s = await api('vorhaben_save', { id: v.id, status: 'archiviert', expect: { status: 'aktiv' }, by: 'Alex' });
  ok(s.vorhaben.status === 'archiviert' && !(await offen()).some(x => x.slug === 'test-abschluss') && !(await erledigt()).some(x => x.slug === 'test-abschluss'), 'Archivieren: weder offen noch erledigt');
}

async function xceed() {
  console.log('\n== XCeed (echtes Vorhaben) ==');
  let a = await api('vorhaben_get', { slug: 'xceed' });
  const v = a.vorhaben, themen = a.themen.map(t => t.id).sort().join('|');
  ok(v.status === 'erledigt', 'Ausgang: XCeed erledigt', v.status);
  ok((await erledigt()).some(x => x.slug === 'xceed'), 'XCeed steht im Filter Erledigt');
  const w = await api('vorhaben_wiedereroeffnen', { id: v.id, by: 'Alex' });
  ok(w.vorhaben.status === 'aktiv', 'Wieder öffnen: aktiv');
  ok(w.vorhaben.zustand === 'ueberfaellig', 'Wieder öffnen: überfällig (Frist ' + v.frist + ')', w.vorhaben.zustand);
  ok((await offen()).some(x => x.slug === 'xceed'), 'XCeed ist wieder in der Liste');
  const r = await api('vorhaben_abschliessen', { id: v.id, by: 'Alex', ergebnis: 'Vertrag abgeschlossen', punkte_mit: true, themen_mit: false, expect: w.vorhaben.updated_at });
  ok(r.vorhaben.status === 'erledigt' && r.themen === 0, 'erneut abgeschlossen ohne Themen-Haken', r);
  a = await api('vorhaben_get', { slug: 'xceed' });
  ok(a.themen.length === 11 && a.themen.map(t => t.id).sort().join('|') === themen, '11 Themen bleiben offen', a.themen.length);
  const u = await api('vorhaben_wiedereroeffnen', { id: v.id, by: 'Alex', rueckgaengig: r.rueckgaengig });
  a = await api('vorhaben_get', { slug: 'xceed' });
  ok(u.vorhaben.status === 'aktiv' && a.themen.map(t => t.id).sort().join('|') === themen, 'Rückgängig stellt exakt her (aktiv, Themen unverändert)');
  const z = await api('vorhaben_abschliessen', { id: v.id, by: 'Alex', ergebnis: 'Ticketing-Vertrag mit Xceed abgeschlossen', punkte_mit: false, themen_mit: false });
  ok(z.vorhaben.status === 'erledigt', 'Am Ende: XCeed wieder erledigt');
}

if (process.argv.includes('--xceed')) await xceed(); else await testvorhaben();
console.log(`\n${n - fehler} von ${n} bestanden`);
process.exit(fehler ? 1 : 0);
