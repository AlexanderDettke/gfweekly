/* Wirkungsprobe · Vorhaben abschließen (21.10.2026) gegen das echte Backend, ohne Abfangen.
   Aufruf:  GF_PW=<passwort> node pruefung/abschliessen-probe.mjs [--xceed]
   Vorher legt pruefung/abschliessen-testdaten-anlegen.sql das Testvorhaben test-abschluss mit zwei offenen und einem
   erledigten Punkt, zwei verknüpften Testthemen und einer Korbzeile in einer beendeten Testabwesenheit an; am Ende (auch
   nach einem Abbruch) führt die Probe pruefung/abschliessen-testdaten-loeschen.sql selbst aus (--testdaten-behalten: nicht).
   Mit --xceed spielt die Probe den Ablauf aus dem Paket am echten Vorhaben xceed durch und lässt es am Ende erledigt
   (verknüpfte Themen bleiben offen, Punkte gibt es dort keine). */
import { execSync } from 'node:child_process';
const FN = process.env.GF_FN || 'https://bnfmupnmqyrcltrphfak.supabase.co/functions/v1/gfweekly';
const PW = process.env.GF_PW || '';
if (!PW) { console.error('GF_PW fehlt (Passwort des Kompass in der Umgebung).'); process.exit(2); }
let fehler = 0, n = 0;
const ok = (bed, text, extra) => { n++; if (bed) console.log('  ✓ ' + text); else { fehler++; console.log('  ✕ ' + text + (extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 300) : '')); } };
async function api(action, payload = {}, erwartet = 200) {
  const res = await fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, password: PW, payload }) });
  let d = {}; try { d = await res.json(); } catch (e) {}
  if (res.status !== erwartet) throw new Error(`${action}: HTTP ${res.status} statt ${erwartet}: ${d.error || ''}`);
  return d;
}
let KORBZEILE = null;
/* Die beendete Testabwesenheit „Abschluss-Probe“ aus den Testdaten und ihre Korbzeile. */
async function korbAbwesenheit() {
  const l = await api('absence_list', { include_test: true, alle: true }).catch(() => ({}));
  const a = (l.absences || l.abwesenheiten || []).find(x => x.note === 'Abschluss-Probe');
  if (!a) throw new Error('Testabwesenheit „Abschluss-Probe“ fehlt: erst pruefung/abschliessen-testdaten-anlegen.sql ausführen');
  return a.id;
}
const offen = async () => (await api('vorhaben_list')).vorhaben;
const erledigt = async () => (await api('vorhaben_list', { status: 'erledigt' })).vorhaben;

async function testvorhaben() {
  console.log('\n== Testvorhaben test-abschluss ==');
  let a = await api('vorhaben_get', { slug: 'test-abschluss' });
  const v = a.vorhaben;
  ok(v.status === 'aktiv' && a.punkte.filter(p => !p.erledigt).length === 2 && a.themen.length === 2, 'Ausgang: aktiv, 2 offene Punkte, 2 Themen', { s: v.status, p: a.punkte.length, t: a.themen.length });
  const abw0 = await korbAbwesenheit();
  KORBZEILE = (await api('handover_list', { absence_id: abw0 })).items.find(x => x.ref_id === v.id)?.id || null;
  ok(!!KORBZEILE, 'Ausgang: Korbzeile zum Testvorhaben in der Testabwesenheit');
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
  ok(e && e.text === 'Erledigt: Probe abgeschlossen · 2 Punkte abgehakt, 2 Themen archiviert' && e.created_by === 'hohes-haus' && e.wer === 'Alex', 'Verlaufseintrag Entscheidung mit Ergebnis', e);
  ok(!a.verlauf.some(x => /^Status: /.test(x.text) && new Date(x.created_at) > new Date(Date.now() - 60000)), 'kein zusätzlicher „Status:“-Eintrag');
  ok(!(await offen()).some(x => x.slug === 'test-abschluss'), 'verschwindet aus der Liste offener Vorhaben');
  const el = (await erledigt()).find(x => x.slug === 'test-abschluss');
  ok(el && el.ergebnis === 'Probe abgeschlossen' && el.erledigt_am, 'erscheint im Filter Erledigt mit Ergebnissatz (ohne Zahlen) und Datum', el);
  /* Übergabekorb: die Zeile zum erledigten Vorhaben fällt heraus und lässt sich nicht mehr entscheiden. */
  const abw = await korbAbwesenheit();
  let korb = await api('handover_list', { absence_id: abw });
  ok(!korb.items.some(x => x.ref_id === v.id) && korb.gesamt === 0, 'Übergabekorb zeigt das erledigte Vorhaben nicht mehr', { n: korb.items.length, gesamt: korb.gesamt });
  await api('handover_set', { id: KORBZEILE, ampel: 'ruht', by: 'Alex' }, 409).then(d => ok(/abgeschlossen/.test(d.error), 'Übergabe einer erledigten Korbzeile gibt 409'));
  const vielen = await api('handover_set_many', { items: [{ id: KORBZEILE, ampel: 'ruht' }], by: 'Alex' });
  ok(vielen.ok === false && vielen.updated === 0 && vielen.misslungen[0]?.konflikt === true, 'handover_set_many lehnt sie ebenso ab', vielen);
  ok(r.rueckgaengig.zeit && !isNaN(Date.parse(r.rueckgaengig.zeit)), 'Rückgabe nennt den Zeitpunkt des Abschlusses');
  await api('vorhaben_wiedereroeffnen', { id: v.id, by: 'Alex', rueckgaengig: { punkte: r.rueckgaengig.punkte, themen: [] } }, 400).then(() => ok(true, 'rueckgaengig ohne zeit wird abgelehnt'));
  await api('vorhaben_wiedereroeffnen', { id: v.id, by: 'Alex', rueckgaengig: { punkte: ['x'] } }, 400).then(() => ok(true, 'kaputtes rueckgaengig wird abgelehnt'));
  const w = await api('vorhaben_wiedereroeffnen', { id: v.id, by: 'Lea', rueckgaengig: r.rueckgaengig });
  ok(w.vorhaben.status === 'aktiv' && w.punkte === 2 && w.themen === 2, 'Rückgängig: aktiv, 2 Punkte offen, 2 Themen zurück', w);
  a = await api('vorhaben_get', { slug: 'test-abschluss' });
  const nachher = { punkte: a.punkte.map(p => [p.id, p.erledigt, p.erledigt_at]).sort().join('|'), themen: a.themen.map(t => t.id).sort().join('|') };
  ok(nachher.punkte === vorher.punkte && nachher.themen === vorher.themen, 'Rückgängig stellt Punkte und Themen exakt her', { vorher, nachher });
  korb = await api('handover_list', { absence_id: abw });
  ok(korb.items.some(x => x.ref_id === v.id) && korb.gesamt === 1, 'nach dem Wieder öffnen steht die Korbzeile wieder da');
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
  /* Rückgängig gilt nur für den jüngsten Abschluss: nach Wieder öffnen und erneutem Abschluss gibt ein alter Wert 409
     und ändert nichts, auch nicht an einem inzwischen von Lea neu abgehakten Punkt. */
  const r3 = await api('vorhaben_abschliessen', { id: v.id, by: 'Alex', punkte_mit: true, themen_mit: true });
  await api('vorhaben_wiedereroeffnen', { id: v.id, by: 'Alex' });
  const [p1] = r3.rueckgaengig.punkte;
  await api('punkt_toggle', { id: p1, erledigt: false, by: 'Lea' });
  await api('punkt_toggle', { id: p1, erledigt: true, by: 'Lea' });
  const r4 = await api('vorhaben_abschliessen', { id: v.id, by: 'Alex' });
  const vorAlt = await api('vorhaben_get', { slug: 'test-abschluss' });
  await api('vorhaben_wiedereroeffnen', { id: v.id, by: 'Alex', rueckgaengig: r3.rueckgaengig }, 409).then(d => ok(/letzten Abschluss/.test(d.error), 'alter Rückgängig-Wert nach erneutem Abschluss gibt 409'));
  a = await api('vorhaben_get', { slug: 'test-abschluss' });
  ok(a.vorhaben.status === 'erledigt' && JSON.stringify(a.punkte) === JSON.stringify(vorAlt.punkte) && a.themen.length === vorAlt.themen.length, 'und ändert nichts');
  const w4 = await api('vorhaben_wiedereroeffnen', { id: v.id, by: 'Alex', rueckgaengig: r4.rueckgaengig });
  ok(w4.vorhaben.status === 'aktiv' && w4.punkte === 0 && w4.themen === 0, 'Rückgängig des jüngsten Abschlusses (ohne Haken) öffnet nur wieder', w4);
  /* Nach Wieder öffnen und Status „erledigt“ über vorhaben_save verfällt der Rückgängig-Wert ebenfalls. */
  const r6 = await api('vorhaben_abschliessen', { id: v.id, by: 'Alex', punkte_mit: true });
  await api('vorhaben_wiedereroeffnen', { id: v.id, by: 'Alex' });
  await api('vorhaben_save', { id: v.id, status: 'erledigt', expect: { status: 'aktiv' }, by: 'Alex' });
  await api('vorhaben_wiedereroeffnen', { id: v.id, by: 'Alex', rueckgaengig: r6.rueckgaengig }, 409).then(d => ok(/letzten Abschluss/.test(d.error), 'alter Rückgängig-Wert nach Wieder öffnen und Status erledigt gibt 409'));
  /* Einwurf auf ein erledigtes Vorhaben: mehr als der Verlaufseintrag wird abgelehnt. */
  const ew = (await api('einwurf_list', {})).einwuerfe?.find(x => x.source_ref === 'probe:abschluss:1') || null;
  if (ew) await api('einwurf_apply', { id: ew.id, vorhaben_id: v.id, auswahl: { naechster_schritt: true }, bearbeitet: { naechster_schritt: 'Probe' }, by: 'Alex' }, 409)
    .then(d => ok(/nur der Verlaufseintrag/.test(d.error), 'Einwurf mit nächstem Schritt auf ein erledigtes Vorhaben gibt 409'));
  else ok(false, 'Testeinwurf probe:abschluss:1 nicht gefunden');
  await api('vorhaben_wiedereroeffnen', { id: v.id, by: 'Alex' });
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

try { if (process.argv.includes('--xceed')) await xceed(); else await testvorhaben(); }
catch (e) { ok(false, 'Probe abgebrochen', e.message); }
finally {
  /* Sicherung: XCeed endet erledigt, auch wenn die Probe mittendrin abbricht. */
  /* Testdaten abräumen, auch nach einem Abbruch (über die angemeldete Supabase-CLI, wie beim Anlegen). */
  if (!process.argv.includes('--xceed') && !process.argv.includes('--testdaten-behalten')) {
    try { execSync(`npx --yes supabase db query --linked --project-ref bnfmupnmqyrcltrphfak -f "${decodeURIComponent(new URL('./abschliessen-testdaten-loeschen.sql', import.meta.url).pathname)}"`, { stdio: ['ignore', 'ignore', 'inherit'] }); console.log('  · Testdaten abgeräumt'); }
    catch (e) { ok(false, 'Testdaten nicht abgeräumt, bitte pruefung/abschliessen-testdaten-loeschen.sql ausführen'); }
  }
  if (process.argv.includes('--xceed')) {
    const v = (await api('vorhaben_get', { slug: 'xceed' }).catch(() => ({}))).vorhaben;
    if (v && v.status !== 'erledigt') { await api('vorhaben_abschliessen', { id: v.id, by: 'Alex', ergebnis: 'Ticketing-Vertrag mit Xceed abgeschlossen' }).catch(() => {}); console.log('  · Sicherung: XCeed wieder erledigt'); }
  }
}
console.log(`\n${n - fehler} von ${n} bestanden`);
process.exit(fehler ? 1 : 0);
