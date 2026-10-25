/* Wirkungsprobe · Mehrfachauswahl im Board (23.10.2026) gegen das echte Backend, ohne Abfangen.
   Aufruf:  GF_PW=<passwort> node pruefung/themen-sammeln-probe.mjs
   Legt über die angemeldete Supabase-CLI zwei Testthemen an (created_by „probe-sammeln“), prüft themen_sammeln
   (erledigt, zurücksetzen, verschieben, weitergeben, archivieren, Konflikt, Eingabeprüfung) und die Archivierung
   erledigter Themen in einer zurückgerollten Transaktion. Am Ende (auch nach Abbruch) werden die Testthemen gelöscht. */
import { execFileSync } from 'node:child_process';
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
const sql = (q) => JSON.parse(execFileSync('npx', ['--yes', 'supabase', 'db', 'query', '--linked', '--project-ref', 'bnfmupnmqyrcltrphfak', q], { stdio: ['ignore', 'pipe', 'ignore'] }).toString()).rows;
const aufraeumen = () => sql("delete from public.gfweekly_topics where created_by = 'probe-sammeln'");
const thema = (id) => sql(`select id, board_lane, status, resolved_at, next_suggested, gate, gate_by, archived, archiv_grund, updated_at from public.gfweekly_topics where id = '${id}'`)[0];

try {
  aufraeumen();
  const neu = sql(`insert into public.gfweekly_topics (title, board_lane, status, created_by, priority) values
    ('Probe Sammeln 1', 'zu_besprechen', 'offen', 'probe-sammeln', 'mittel'), ('Probe Sammeln 2', 'zu_besprechen', 'offen', 'probe-sammeln', 'niedrig') returning id, updated_at`);
  const [a, b] = neu;
  const exp = (x) => ({ board_lane: 'zu_besprechen', updated_at: x.updated_at });
  console.log('\n== Eingabeprüfung ==');
  await api('themen_sammeln', { items: [{ id: a.id }], aktion: 'erledigt', by: 'Gast' }, 400).then(d => ok(/Alex oder Lea/.test(d.error), 'by Gast wird abgelehnt'));
  await api('themen_sammeln', { items: [{ id: a.id }], aktion: 'loeschen', by: 'Alex' }, 400).then(() => ok(true, 'unbekannte Aktion wird abgelehnt'));
  await api('themen_sammeln', { items: [{ id: a.id }], aktion: 'weitergeben', wert: 'hans', by: 'Alex' }, 400).then(() => ok(true, 'Weitergeben nur an alex, lea, gf, team'));
  await api('themen_sammeln', { items: [{ id: a.id }], aktion: 'verschieben', wert: '24.10.', by: 'Alex' }, 400).then(() => ok(true, 'Verschieben nur mit Datum'));
  console.log('\n== Erledigt und Rückgängig ==');
  const r = await api('themen_sammeln', { items: [{ id: a.id, expect: exp(a) }, { id: b.id, expect: exp(b) }], aktion: 'erledigt', by: 'Alex' });
  ok(r.ok === 2 && r.ergebnis.every(x => x.ok && x.vorher.board_lane === 'zu_besprechen'), 'beide erledigt, Stand davor zurückgegeben', r);
  let ta = thema(a.id);
  ok(ta.board_lane === 'erledigt' && ta.status === 'erledigt' && !!ta.resolved_at, 'Datenbank: Spalte, Status und Erledigt-Zeitpunkt');
  const u = await api('themen_sammeln', { items: r.ergebnis.map(x => ({ id: x.id, aktion: 'zuruecksetzen', wert: x.vorher, expect: { updated_at: x.thema.updated_at } })), by: 'Alex' });
  ta = thema(a.id);
  ok(u.ok === 2 && ta.board_lane === 'zu_besprechen' && ta.status === 'offen' && ta.resolved_at === null, 'Rückgängig stellt Spalte, Status und Erledigt-Zeitpunkt her', ta);
  console.log('\n== Konflikt ==');
  const k = await api('themen_sammeln', { items: [{ id: a.id, expect: { board_lane: 'zu_besprechen', updated_at: '2020-01-01T00:00:00Z' } }, { id: b.id, expect: { board_lane: 'zu_besprechen', updated_at: thema(b.id).updated_at } }], aktion: 'in_bearbeitung', by: 'Lea' });
  ok(k.ok === 1 && k.ergebnis.find(x => x.id === a.id)?.konflikt === true && thema(a.id).board_lane === 'zu_besprechen' && thema(b.id).board_lane === 'in_klaerung', 'veralteter Stand: dieses Thema bleibt, das andere wird gespeichert', k.ergebnis);
  console.log('\n== Verschieben, Weitergeben, Archivieren ==');
  const v = await api('themen_sammeln', { items: [{ id: a.id }], aktion: 'verschieben', wert: '2026-11-02', by: 'Alex' });
  ok(v.ok === 1 && thema(a.id).next_suggested === '2026-11-02', 'Verschieben setzt den Termin');
  const w = await api('themen_sammeln', { items: [{ id: a.id }], aktion: 'weitergeben', wert: 'lea', by: 'Alex' });
  ta = thema(a.id);
  ok(w.ok === 1 && ta.gate === 'lea' && ta.gate_by === 'Alex', 'Weitergeben setzt den Pförtner mit Person');
  const ar = await api('themen_sammeln', { items: [{ id: a.id }], aktion: 'archivieren', by: 'Alex' });
  ta = thema(a.id);
  const liste = (await api('list')).topics;
  ok(ar.ok === 1 && ta.archived === true && ta.archiv_grund === 'hand' && !liste.some(x => x.id === a.id), 'Archivieren: Grund „hand“, verschwindet aus dem Board');
  await api('themen_sammeln', { items: ar.ergebnis.map(x => ({ id: x.id, aktion: 'zuruecksetzen', wert: x.vorher })), by: 'Alex' });
  ta = thema(a.id);
  ok(ta.archived === false && ta.archiv_grund === null && (await api('list')).topics.some(x => x.id === a.id), 'Rückgängig holt es ins Board zurück');
  console.log('\n== Konflikte durch andere Wege ==');
  const vorGate = thema(a.id).updated_at;
  await api('gate_set', { kind: 'thema', id: a.id, gate: 'alex', by: 'Lea' });
  ok(thema(a.id).updated_at !== vorGate, 'Pförtner (gate_set) setzt updated_at, die Konfliktprüfung sieht die Änderung');
  await api('themen_sammeln', { items: [{ id: a.id }], aktion: 'archivieren', by: 'Alex' });
  const ka = await api('themen_sammeln', { items: [{ id: a.id }], aktion: 'erledigt', by: 'Alex' });
  ok(ka.ok === 0 && ka.ergebnis[0].konflikt === true && /archiviert/.test(ka.ergebnis[0].grund), 'archiviertes Thema: Sammelaktion meldet Konflikt statt Erfolg', ka.ergebnis);
  await api('themen_sammeln', { items: [{ id: a.id, aktion: 'zuruecksetzen', wert: { archived: false, archiv_grund: null } }], by: 'Alex' });
  ok(thema(a.id).archived === false, 'Rückgängig (zuruecksetzen) darf es zurückholen');
  console.log('\n== Archivieren erledigter Themen (zurückgerollt) ==');
  const vorher = sql("select count(*)::int n from public.gfweekly_topics where archived")[0].n;
  const p = sql(`begin; update public.gfweekly_topics set board_lane='erledigt', status='erledigt', resolved_at=now()-interval '20 days' where id='${b.id}'; select public.hh_themen_erledigt_archivieren(14); select archived, archiv_grund from public.gfweekly_topics where id='${b.id}'; rollback;`);
  ok(p[0]?.archived === true && p[0]?.archiv_grund === 'erledigt-14', 'seit 20 Tagen erledigt: archiviert mit Grund erledigt-14', p);
  ok(sql("select count(*)::int n from public.gfweekly_topics where archived")[0].n === vorher, 'nach dem Rollback Archivbestand unverändert');
  const hu = sql(`begin; update public.gfweekly_topics set board_lane='erledigt', status='erledigt', resolved_at=now()-interval '20 days' where id='${b.id}';
    with ab as (insert into public.gfweekly_absences (person, von, art, kontakt, status, test, note) values ('Alex', current_date, 'sofort', 'keiner', 'aktiv', true, 'Probe Sammeln') returning id)
    insert into public.gfweekly_handover (absence_id, kind, ref_id, title, status) select id, 'thema', '${b.id}', 'Probe Sammeln 2', 'bestaetigt' from ab;
    select public.hh_themen_erledigt_archivieren(14); select archived from public.gfweekly_topics where id='${b.id}'; rollback;`);
  ok(hu[0]?.archived === false, 'Thema in laufender Übergabe wird nicht archiviert', hu);
} catch (e) { ok(false, 'Probe abgebrochen', e.message); }
finally {
  try { aufraeumen(); console.log('  · Testthemen gelöscht'); } catch (e) { ok(false, 'Testthemen nicht gelöscht (created_by probe-sammeln)'); }
}
console.log(`\n${n - fehler} von ${n} bestanden`);
process.exit(fehler ? 1 : 0);
