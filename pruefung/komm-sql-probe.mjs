/* SQL-Probe V32 Kommunikation: die Migration 20261007052131 in einem lokalen Postgres (PGlite, WebAssembly) einspielen und
   hh_komm_einspielen, hh_komm_gesendet, hh_komm_sperre, hh_komm_pruefpunkt_set und hh_komm_regelwerk_aktivieren
   mit wiederholten Aufrufen und Teilfehlern prüfen. Kein Zugriff auf die Produktion.
   Aufruf: PGLITE_MODUL=<pfad>/node_modules/@electric-sql/pglite/dist/index.js node pruefung/komm-sql-probe.mjs
   (das Paket gehört bewusst nicht ins Repo, wie playwright für die Schirme) */
import { createRequire } from 'node:module';
import fs from 'node:fs';
const { PGlite } = await import(process.env.PGLITE_MODUL || '@electric-sql/pglite');
const require = createRequire(import.meta.url);
const K = require('../site/assets/komm-logik.js');
const rw = JSON.parse(fs.readFileSync(new URL('../docs/referenz/postingplan/habitat-postingplan-regelwerk.json', import.meta.url), 'utf8'));
const MIGRATION = fs.readFileSync(new URL('../supabase/migrations/20261007052131_hh_komm_v32a.sql', import.meta.url), 'utf8');

let ok = 0, fehler = 0;
const gleich = (name, ist, soll) => { const a = JSON.stringify(ist), b = JSON.stringify(soll); if (a === b) { ok++; console.log('  ok     ' + name); } else { fehler++; console.log('  FEHLT  ' + name + '\n         ist  ' + a + '\n         soll ' + b); } };
const wahr = (name, b) => gleich(name, !!b, true);

const db = new PGlite();
await db.exec(`create role anon; create role authenticated; create role service_role;
  create table public.vvp_events(id uuid primary key);
  insert into public.vvp_events(id) values ('00000000-0000-0000-0000-0000000000a1');`);
await db.exec(MIGRATION);
const EV = '00000000-0000-0000-0000-0000000000a1';
const q = async (sql, p = []) => (await db.query(sql, p)).rows;
const fehlerCode = async (sql, p = []) => { try { await db.query(sql, p); return null; } catch (e) { return e.code || e.message; } };

const f = rw.festivals_2027.find(x => x.id === 'lus');
const LUS = { fid: 'lus', name: f.name, ausgabe: 2027, V: f.V, F: f.F, Z: f.Z, merkmale: f.merkmale };
const SAISON = '2027-07-02';
const HEUTE = '2026-10-05';
const erg = K.berechne(rw, LUS, HEUTE, { saison_start: SAISON });
const einspielen = async (pubs, heute = HEUTE) => (await q('select public.hh_komm_einspielen($1, $2, $3::jsonb, $4::date) as r', ['LUSRD27', EV, JSON.stringify(pubs), heute]))[0].r;

console.log('\n1. Einspielen und Idempotenz');
const r1 = await einspielen(erg.pubs);
gleich('erster Lauf legt 102 an', [r1.neu, r1.aktualisiert, r1.unveraendert], [102, 0, 0]);
gleich('Schritte gespeichert', Number((await q('select count(*) n from komm_schritte'))[0].n), 776);
const r2 = await einspielen(erg.pubs);
gleich('zweiter Lauf ändert nichts', [r2.neu, r2.aktualisiert, r2.unveraendert, r2.zu_pruefen, r2.entfernt], [0, 0, 102, 0, 0]);
gleich('leere Liste bricht ab (PT400)', await fehlerCode(`select public.hh_komm_einspielen('LUSRD27', null, '[]'::jsonb, '2026-10-05')`), 'PT400');

console.log('\n2. Gesendet bleibt gesendet');
const tt = erg.pubs.find(p => p.regel_id === 'F14-TT'), shop = erg.pubs.find(p => p.regel_id === 'V-PRUEF'), slot = erg.pubs.find(p => p.regel_id === 'SLOT' && p.partnerfaehig && p.t > '2027-03-01');
const nurGid = erg.pubs.find(p => p.regel_id === 'F30-PR');
gleich('hh_komm_gesendet zählt die Zeilen', (await q('select public.hh_komm_gesendet($1::text[], $2) n', [[tt.id], '111']))[0].n, 1);
const g1 = (await q('select gesendet_am from komm_veroeffentlichungen where id = $1', [tt.id]))[0].gesendet_am;
await q('select public.hh_komm_gesendet($1::text[], $2) n', [[tt.id], '112']);
const g2 = (await q('select gesendet_am, asana_task_gid from komm_veroeffentlichungen where id = $1', [tt.id]))[0];
gleich('erstes Sendedatum bleibt, Kennung folgt dem letzten Versand', [String(g2.gesendet_am) === String(g1), g2.asana_task_gid], [true, '112']);
gleich('unbekannte Kennung: 0 Zeilen', (await q('select public.hh_komm_gesendet($1::text[], $2) n', [['gibt-es-nicht'], '1']))[0].n, 0);
await q(`update komm_veroeffentlichungen set asana_task_gid = '222' where id = $1`, [nurGid.id]);   // Teilfehler: Kennung ohne Sendedatum
await q(`update komm_veroeffentlichungen set partner_uebernommen_am = now(), partner_name = 'Kollektiv Test', freigabe_status = 'korrektur', freigabe_notiz = 'bitte Credits' where id = $1`, [slot.id]);
/* Ereignis verschiebt sich: F eine Woche später. */
const LUS2 = Object.assign({}, LUS, { F: K.plus(f.F, 7), Z: K.plus(f.Z, 7) });
const erg2 = K.berechne(rw, LUS2, HEUTE, { saison_start: SAISON });
const r3 = await einspielen(erg2.pubs);
const zeile = async id => (await q('select t::text, t_neu::text, status_bearbeitung, titel, partner_name, freigabe_status, freigabe_notiz from komm_veroeffentlichungen where id = $1', [id]))[0];
const z1 = await zeile(tt.id);
gleich('gesendeter Timetable: T bleibt, t_neu und zu_pruefen gesetzt', [z1.t, z1.t_neu, z1.status_bearbeitung], [tt.t, K.plus(tt.t, 7), 'zu_pruefen']);
const z2 = await zeile(nurGid.id);
gleich('nur mit Asana-Kennung (ohne Sendedatum) ebenso geschützt', [z2.t, z2.status_bearbeitung], [nurGid.t, 'zu_pruefen']);
const zs = await zeile(slot.id);
wahr('übernommener Slot geschützt, Partnerfelder unverändert', zs.t === slot.t && zs.partner_name === 'Kollektiv Test' && zs.freigabe_status === 'korrektur' && zs.freigabe_notiz === 'bitte Credits');
const z3 = await zeile(shop.id);
gleich('ungesendete Veröffentlichung mit V-Bezug bleibt, wo sie ist', z3.t, shop.t);
const welle = erg.pubs.find(p => p.regel_id === 'P-WELLE' && p.nr === 2);
gleich('ungesendete Programmwelle wandert mit F', (await zeile(welle.id)).t, K.plus(welle.t, 7));
gleich('Schritte der gesendeten Veröffentlichung unverändert', (await q('select faellig::text from komm_schritte where veroeffentlichung_id = $1 and schritt_id = $2', [tt.id, 'F1']))[0].faellig, tt.schritte.find(s => s.schritt_id === 'F1').faellig);
wahr('Lauf meldet zu_pruefen', r3.zu_pruefen >= 3);
const r4 = await einspielen(erg2.pubs);
gleich('wiederholter Lauf mit derselben Verschiebung meldet nichts Neues', [r4.zu_pruefen, r4.neu, r4.aktualisiert], [0, 0, 0]);

console.log('\n3. Was die Rechnung nicht mehr kennt');
const ohne = erg2.pubs.filter(p => p.id !== welle.id && p.id !== tt.id);
const r5 = await einspielen(ohne);
gleich('ungesendet: gelöscht, gesendet: zu prüfen', [r5.entfernt, (await zeile(welle.id)) === undefined, (await zeile(tt.id)).status_bearbeitung], [1, true, 'zu_pruefen']);
gleich('Schritte der gelöschten Zeile mitgelöscht', Number((await q('select count(*) n from komm_schritte where veroeffentlichung_id = $1', [welle.id]))[0].n), 0);
const alt = (await q(`select count(*) n from komm_veroeffentlichungen where t < '2026-10-05'`))[0].n;
await einspielen(ohne, '2027-01-10');
gleich('Vergangenes bleibt beim späteren Lauf stehen', Number((await q(`select count(*) n from komm_veroeffentlichungen where t < '2027-01-10'`))[0].n) >= Number(alt), true);

console.log('\n4. Sperre');
const s1 = (await q(`select public.hh_komm_sperre('festival:LUSRD27', 60, 'a') ok`))[0].ok;
const s2 = (await q(`select public.hh_komm_sperre('festival:LUSRD27', 60, 'b') ok`))[0].ok;
await q(`select public.hh_komm_frei('festival:LUSRD27', 'b')`);
const s3 = (await q(`select public.hh_komm_sperre('festival:LUSRD27', 60, 'c') ok`))[0].ok;
await q(`select public.hh_komm_frei('festival:LUSRD27', 'a')`);
const s4 = (await q(`select public.hh_komm_sperre('festival:LUSRD27', 60, 'd') ok`))[0].ok;
await q(`update komm_sperre set bis = now() - interval '1 second' where schluessel = 'festival:LUSRD27'`);
const s5 = (await q(`select public.hh_komm_sperre('festival:LUSRD27', 60, 'e') ok`))[0].ok;
gleich('erste nimmt, zweite nicht, fremde Freigabe wirkt nicht, eigene schon, abgelaufene wird übernommen', [s1, s2, s3, s4, s5], [true, false, false, true, true]);

console.log('\n5. Prüfpunkte');
const pp = erg.pubs.find(p => p.regel_id === 'PRUEF').t;
await q(`select public.hh_komm_pruefpunkt_set('LUSRD27', $1::date, 'gelb', array['E01'], 'erste', true, 'Christian Linck', null)`, [pp]);
await q(`select public.hh_komm_pruefpunkt_set('LUSRD27', $1::date, 'rot', array['E01','E04'], null, false, 'Alex', 'gelb')`, [pp]);
const ppz = (await q(`select stufe, extras, notiz, entschieden_von from komm_pruefpunkte where festival_short = 'LUSRD27' and datum = $1::date`, [pp]))[0];
gleich('zweite Entscheidung mit gesehener Stufe, Notiz bleibt', [ppz.stufe, ppz.extras, ppz.notiz, ppz.entschieden_von], ['rot', ['E01', 'E04'], 'erste', 'Alex']);
gleich('veraltete gesehene Stufe: PT409', await fehlerCode(`select public.hh_komm_pruefpunkt_set('LUSRD27', $1::date, 'gruen', '{}', null, false, 'Lea', 'gelb')`, [pp]), 'PT409');
const plog = await q(`select detail from komm_log where what = 'komm_pruefpunkt_set' order by id`);
gleich('Protokoll mit Vorzustand', [plog.length, plog[0].detail.vorher, plog[1].detail.vorher.stufe], [2, null, 'gelb']);
gleich('Prüfpunkt an einem Tag ohne Prüfpunkt (etwa nach einer Verschiebung): PT409', await fehlerCode(`select public.hh_komm_pruefpunkt_set('LUSRD27', '2027-01-01'::date, 'gelb', '{}', null, false, 'Alex', null)`), 'PT409');
wahr('unbekanntes Extra wird abgewiesen', !!(await fehlerCode(`select public.hh_komm_pruefpunkt_set('LUSRD27', $1::date, 'gelb', array['E99'], null, false, 'Alex', null)`, [pp])));

console.log('\n6. Regelwerk');
const a1 = (await q(`select public.hh_komm_regelwerk_aktivieren('1.2.0 (2026-10-05)', '{"a":1}'::jsonb) v`))[0].v;
const a2 = (await q(`select public.hh_komm_regelwerk_aktivieren('1.2.0 (2026-10-05)', '{"a":2}'::jsonb) v`))[0].v;
const a3 = (await q(`select public.hh_komm_regelwerk_aktivieren('1.3.0 (2026-11-01)', '{"a":3}'::jsonb) v`))[0].v;
const aktiv = await q(`select version from komm_regelwerk where aktiv`);
gleich('erste Fassung aktiv, gleiche bleibt, neue löst ab, genau eine aktiv', [a1, a2, a3, aktiv.map(x => x.version)], ['1.2.0 (2026-10-05)', '1.2.0 (2026-10-05)', '1.3.0 (2026-11-01)', ['1.3.0 (2026-11-01)']]);
gleich('zweite aktive Zeile scheitert am Teilindex', !!(await fehlerCode(`update komm_regelwerk set aktiv = true`)), true);

console.log('\n7. Rechte');
const rechte = await q(`select c.relname, c.relrowsecurity rls, has_table_privilege('anon', c.oid, 'select') anon, has_table_privilege('authenticated', c.oid, 'select') auth, has_table_privilege('service_role', c.oid, 'insert') svc
  from pg_class c where c.relname like 'komm\\_%' and c.relkind = 'r' order by 1`);
gleich('RLS an, anon und authenticated ohne Lesen, service_role schreibt', rechte.map(r => [r.relname, r.rls, r.anon, r.auth, r.svc]),
  ['komm_log', 'komm_pruefpunkte', 'komm_regelwerk', 'komm_schritte', 'komm_sperre', 'komm_veroeffentlichungen'].map(n => [n, true, false, false, true]));
const fx = await q(`select p.proname, has_function_privilege('anon', p.oid, 'execute') anon, has_function_privilege('service_role', p.oid, 'execute') svc from pg_proc p where p.proname like 'hh_komm\\_%' and p.proname <> 'hh_komm_touch' order by 1`);
gleich('Funktionen nur für service_role', fx.map(r => [r.proname, r.anon, r.svc]), fx.map(r => [r.proname, false, true]));

console.log(`\n${ok} ok, ${fehler} Fehler`);
process.exit(fehler ? 1 : 0);
