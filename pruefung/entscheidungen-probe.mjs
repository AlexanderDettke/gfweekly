/* Stufe 1 · Entscheiden können (25.10.2026, docs/PAKET-STUFE-1-ENTSCHEIDUNGEN.md, Abschnitt 8.2). Zwei Teile:
   1. Rechenregeln (immer): enRechne, enFilter, enSetEingabe, fristZustand aus supabase/functions/gfweekly/entscheidungen.ts mit festen Daten.
   2. Wirkung gegen das echte Backend (nur mit GF_PW): Testvorhaben mit Testpunkt (wer GF gemeinsam), Testthema (Ausgang gf) und
      Testkandidat; sammeln ist idempotent, entscheiden schreibt ins Original und ist per zurueck umkehrbar, vertagen zieht die Frist nach,
      abgeben setzt gate bzw. wer, hinfällig bei archivierter Quelle, Korb zuordnen und verwerfen, Fehlerzustand (leeres Ergebnis).
      Danach löscht die Probe genau ihre eigenen Zeilen (nach Kennung, über npx supabase db query --linked aus einem leeren Arbeitsordner)
      und liest zurück. Rückweg von Hand: pruefung/entscheidungen-testdaten-loeschen.sql.
   Aufruf: node pruefung/entscheidungen-probe.mjs
           GF_PW=… node pruefung/entscheidungen-probe.mjs   (Passwort aus dem Vault, nie ausgeben; siehe docs/TECHNIKSTAND.md) */
import { enRechne, enFilter, enSetEingabe, fristZustand, istReif, gueltigerTag } from '../supabase/functions/gfweekly/entscheidungen.ts';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let ok = 0, fehler = 0;
const pruefe = (name, b, info = '') => { if (b) { ok++; console.log('  ok     ' + name); } else { fehler++; console.log('  FEHLT  ' + name + (info ? ' · ' + String(info).slice(0, 300) : '')); } };
const H = '2026-10-25';
const tag = (n) => new Date(Date.UTC(2026, 9, 25 + n)).toISOString().slice(0, 10);
const z = (o) => ({ id: o.id, quelle_art: o.art || 'thema', quelle_id: o.id + 'q', frage: o.frage || 'Frage ' + o.id, frage_form: !!o.form, frist: o.frist || null, vorschlag: o.vorschlag || null,
  status: o.status || 'offen', vertagt_bis: o.vertagt_bis || null, entschieden_am: o.entschieden_am || null, updated_at: o.updated_at || '2026-10-20T10:00:00Z' });

console.log('== Entscheidungen: Rechenregeln ==');
pruefe('Fristzustand: vor heute überfällig, heute, bis sechs Tage diese Woche, bis 14 Tage zwei Wochen, danach später, ohne',
  [fristZustand(tag(-1), H), fristZustand(tag(0), H), fristZustand(tag(6), H), fristZustand(tag(7), H), fristZustand(tag(14), H), fristZustand(tag(15), H), fristZustand(null, H)].join(',') === 'ueberfaellig,heute,woche,zwei_wochen,zwei_wochen,spaeter,ohne');
pruefe('reif: Frageform oder Frist oder Vorschlag', istReif(z({ id: 'a', form: true })) && istReif(z({ id: 'b', frist: tag(3) })) && istReif(z({ id: 'c', vorschlag: 'x' })) && !istReif(z({ id: 'd' })) && !istReif(z({ id: 'e', vorschlag: '  ' })));
{
  const rows = [z({ id: 'ohne1', updated_at: '2026-10-21T00:00:00Z' }), z({ id: 'sp', frist: tag(30) }), z({ id: 'ueb', frist: tag(-3) }), z({ id: 'ohne2', updated_at: '2026-10-23T00:00:00Z' }), z({ id: 'wo', frist: tag(2) }), z({ id: 'heute', frist: tag(0) }),
    z({ id: 'vt_due', status: 'vertagt', vertagt_bis: tag(-1), frist: tag(-1) }), z({ id: 'vt', status: 'vertagt', vertagt_bis: tag(5), frist: tag(5) }), z({ id: 'abg', status: 'abgegeben' }),
    z({ id: 'ent', status: 'entschieden', entschieden_am: '2026-10-20T08:00:00Z' }), z({ id: 'ent_alt', status: 'entschieden', entschieden_am: '2026-09-01T08:00:00Z' }), z({ id: 'vs', vorschlag: 'Vorschlag' })];
  const { alle, offen, zaehler } = enRechne(rows, H);
  pruefe('Sortierung: überfällig, dann Frist aufsteigend, dann ohne Frist nach updated_at (jüngste zuerst)', offen.map(e => e.id).join(',') === 'ueb,vt_due,heute,wo,sp,ohne2,ohne1,vs' || offen.map(e => e.id).join(',') === 'ueb,vt_due,heute,wo,sp,ohne2,vs,ohne1', offen.map(e => e.id).join(','));
  pruefe('wieder fällig: vertagt mit Datum bis heute zählt zu offen, später vertagt nicht', offen.some(e => e.id === 'vt_due' && e.wieder_faellig) && !offen.some(e => e.id === 'vt'));
  pruefe('Zähler: offen 8, diese Woche 4, überfällig 2, mit Vorschlag 1, unreif 2, vertagt 1, abgegeben 1', JSON.stringify(zaehler) === JSON.stringify({ offen: 8, diese_woche: 4, ueberfaellig: 2, mit_vorschlag: 1, unreif: 2, vertagt: 1, abgegeben: 1 }), JSON.stringify(zaehler));
  pruefe('Filter offen = fällig; vertagt = alle vertagten; abgegeben; alle', enFilter(alle, 'offen', H).length === 8 && enFilter(alle, 'vertagt', H).length === 2 && enFilter(alle, 'abgegeben', H).length === 1 && enFilter(alle, 'alle', H).length === rows.length);
  pruefe('Filter entschieden: nur die letzten 30 Tage, jüngste zuerst', enFilter(alle, 'entschieden', H).map(e => e.id).join(',') === 'ent');
  pruefe('ganz ohne Zeilen: Zähler null, nichts fällig', enRechne([], H).offen.length === 0 && enRechne([], H).zaehler.offen === 0);
}
console.log('\n== Entscheidungen: Eingabe für entscheidung_set ==');
pruefe('nur gegebene Felder; Frage setzt frage_form', JSON.stringify(enSetEingabe({ frage: ' Zahlen wir?  ' }, H)) === JSON.stringify({ frage: 'Zahlen wir?', frage_form: true }));
pruefe('Frist leer leert mit Quelle; Datum setzt Quelle hand', JSON.stringify(enSetEingabe({ frist: '' }, H)) === JSON.stringify({ frist: null, frist_quelle: null }) && JSON.stringify(enSetEingabe({ frist: '2026-11-02' }, H)) === JSON.stringify({ frist: '2026-11-02', frist_quelle: 'hand' }));
pruefe('Vorschlag leer wird null', enSetEingabe({ vorschlag: '  ' }, H).vorschlag === null);
const wirft = (f) => { try { f(); return null; } catch (e) { return e.message; } };
pruefe('Frage zu kurz, Frist kein Datum, nichts zu ändern: abgelehnt', /Frage/.test(wirft(() => enSetEingabe({ frage: 'ab' }, H))) && /Frist/.test(wirft(() => enSetEingabe({ frist: '2026-13-40' }, H))) && /nichts/.test(wirft(() => enSetEingabe({}, H))));
pruefe('gueltigerTag: nur echte Kalendertage', gueltigerTag('2026-02-29') === null && gueltigerTag('2028-02-29') === '2028-02-29' && gueltigerTag('heute') === null);

/* ---- Teil 2: Wirkung gegen das echte Backend ---- */
const PW = process.env.GF_PW || '';
if (!PW) { console.log('\nWirkung gegen das echte Backend übersprungen (GF_PW nicht gesetzt).'); }
else {
  console.log('\n== Entscheidungen: Wirkung gegen das echte Backend (Testvorhaben, Testpunkt, Testthema, Testkandidat) ==');
  const URL_FN = 'https://bnfmupnmqyrcltrphfak.supabase.co/functions/v1/gfweekly';
  const api = async (action, payload) => { const r = await fetch(URL_FN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, password: PW, payload }) }); let d = null; try { d = await r.json(); } catch (e) {} return { status: r.status, d }; };
  const M = 'Stufe 1 Probe (Test)';
  const K = { vorhaben: null, punkt: null, thema: null, kandidat: null, session: null };
  const sql = (text) => {
    const leer = fs.mkdtempSync(path.join(os.tmpdir(), 'en-probe-')); const f = path.join(leer, 'q.sql'); fs.writeFileSync(f, text);
    const r = spawnSync('npx', ['--yes', 'supabase', 'db', 'query', '--linked', '--project-ref', 'bnfmupnmqyrcltrphfak', '-f', f], { cwd: leer, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
    if (r.status !== 0) return { fehler: (r.stderr || r.stdout || '').slice(0, 300) };
    try { const s = r.stdout; return JSON.parse(s.slice(s.indexOf('{'))); } catch (e) { return { fehler: 'keine JSON-Antwort' }; }
  };
  const aufraeumen = () => {
    const ids = [K.punkt, K.thema, K.kandidat].filter(Boolean).map(i => `'${i}'`).join(',');
    const t = [];
    if (ids) t.push(`delete from public.hh_entscheidungen where quelle_id in (${ids});`);
    if (K.thema) t.push(`delete from public.gfweekly_decisions where topic_id = '${K.thema}';`);
    if (K.session) t.push(`delete from public.gfweekly_sessions where id = '${K.session}' and title like '%(Test)%';`);
    if (K.vorhaben) { t.push(`delete from public.hh_vorhaben_verlauf where vorhaben_id = '${K.vorhaben}';`); t.push(`delete from public.hh_vorhaben_punkte where vorhaben_id = '${K.vorhaben}';`); t.push(`delete from public.hh_vorhaben where id = '${K.vorhaben}' and title like '%(Test)%';`); }
    if (K.thema) t.push(`delete from public.gfweekly_topics where id = '${K.thema}' and title like '%(Test)%';`);
    if (K.kandidat) t.push(`delete from public.gfweekly_news where id = '${K.kandidat}' and title like '%(Test)%';`);
    if (!t.length) return { rows: [] };
    t.push(`select (select count(*) from public.hh_entscheidungen where quelle_id in (${ids || "'00000000-0000-0000-0000-000000000000'"})) as en, (select count(*) from public.hh_vorhaben where id ${K.vorhaben ? `= '${K.vorhaben}'` : 'is null'}) as vh, (select count(*) from public.gfweekly_topics where id ${K.thema ? `= '${K.thema}'` : 'is null'}) as th, (select count(*) from public.gfweekly_news where id ${K.kandidat ? `= '${K.kandidat}'` : 'is null'}) as kd;`);
    return sql(t.join('\n'));
  };
  const heute = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
  const plus = (n) => { const d = new Date(heute + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  try {
    const ping = await api('ping', {});
    pruefe('Edge Function mit Stufe 1 (ping version ≥ 41)', ping.status === 200 && ping.d.version >= 41, JSON.stringify(ping.d));
    /* Anlegen */
    const vh = await api('vorhaben_save', { title: M + ' Vorhaben', by: 'Alex', gruppe: 'sonstiges', ball: 'gf' });
    K.vorhaben = vh.d?.vorhaben?.id || null;
    pruefe('Testvorhaben angelegt', vh.status === 200 && !!K.vorhaben, JSON.stringify(vh.d).slice(0, 200));
    const pk = await api('punkt_save', { vorhaben_id: K.vorhaben, titel: M + ' Punkt', wer: 'GF gemeinsam', frist: plus(3), by: 'Alex' });
    K.punkt = pk.d?.punkt?.id || null;
    pruefe('Testpunkt mit wer GF gemeinsam und Frist in drei Tagen', pk.status === 200 && !!K.punkt, JSON.stringify(pk.d).slice(0, 200));
    const th = await api('add', { title: M + ' Thema', context: 'Probe', created_by: 'Alex', board_lane: 'zu_besprechen', priority: 'niedrig' });
    K.thema = th.d?.topic?.id || null;
    const gs = K.thema ? await api('gate_set', { kind: 'thema', id: K.thema, gate: 'gf', frist: plus(1), by: 'Alex' }) : { status: 0 };
    pruefe('Testthema mit Ausgang gf und Frist morgen', th.status === 200 && !!K.thema && gs.status === 200, JSON.stringify(th.d).slice(0, 200));
    const ref = 'test:stufe1:' + Date.now();
    const kd = await api('news_add_many', { items: [{ kind: 'kandidat', title: M + ' Kandidat', body: 'Probe', source: 'notiz', source_ref: ref, who: 'Alex' }] });
    const kl = await api('news_list', { kinds: ['kandidat'], statuses: ['neu'], limit: 500 });
    K.kandidat = (kl.d?.items || []).find(x => x.source_ref === ref)?.id || null;
    pruefe('Testkandidat angelegt (ohne Vorhaben, für den Korb)', kd.status === 200 && !!K.kandidat, JSON.stringify(kd.d).slice(0, 160));
    /* Sammeln idempotent */
    const [l1, l2] = await Promise.all([api('entscheidungen_list', { status: 'alle' }), api('entscheidungen_list', { status: 'alle' })]);   // gleichzeitig: ON CONFLICT (Runde 1, Befund 5)
    const meine = (l) => (l.d?.eintraege || []).filter(e => [K.punkt, K.thema].includes(e.quelle_id));
    pruefe('sammeln ist idempotent, auch gleichzeitig: beide Aufrufe 200, gleiche Gesamtzahl, Testpunkt und Testthema je einmal', l1.status === 200 && l2.status === 200 && l1.d.gesamt === l2.d.gesamt && meine(l1).length === 2 && meine(l2).length === 2, `${l1.status}/${l2.status} ${l1.d?.gesamt} / ${l2.d?.gesamt}, ${meine(l2).length}`);
    const eP = meine(l2).find(e => e.quelle_art === 'punkt'), eT = meine(l2).find(e => e.quelle_art === 'thema');
    pruefe('Punkt: Frage = Titel, Frist aus dem Punkt, Vorhaben aufgelöst, Link zur Akte', eP && eP.frage === M + ' Punkt' && eP.frist === plus(3) && eP.frist_quelle === 'punkt' && eP.vorhaben?.id === K.vorhaben && /^vorhaben\.html\?v=/.test(eP.herkunft?.url || ''), JSON.stringify(eP).slice(0, 300));
    pruefe('Thema: Frist aus gate_frist, Zustand diese Woche, reif, Link zum Thema', eT && eT.frist === plus(1) && ['heute', 'woche'].includes(eT.zustand) && eT.reif && eT.herkunft?.url === `board.html?topic=${K.thema}`, JSON.stringify(eT).slice(0, 300));
    /* Fehlerzustand */
    const f1 = await api('entscheidung_entscheiden', { id: eP.id, ergebnis: '  ', by: 'Alex' });
    const f2 = await api('entscheidung_entscheiden', { id: eP.id, ergebnis: 'Probe Ergebnis', by: 'Helge' });
    const f3 = await api('entscheidung_vertagen', { id: eP.id, bis: plus(-1), by: 'Alex' });
    const f4 = await api('entscheidung_abgeben', { id: '00000000-0000-0000-0000-000000000000', an: 'lea', by: 'Alex' });
    pruefe('leeres Ergebnis 400, fremde Person 400, Datum gestern 400, unbekannte Kennung 404', f1.status === 400 && f2.status === 400 && f3.status === 400 && f4.status === 404, [f1.status, f2.status, f3.status, f4.status].join(','));
    /* Entscheiden schreibt ins Original, Doppelaufruf ohne Dublette, zurück */
    const e1 = await api('entscheidung_entscheiden', { id: eP.id, ergebnis: 'Probe: so machen wir es (Test)', by: 'Lea' });
    const e2 = await api('entscheidung_entscheiden', { id: eP.id, ergebnis: 'Probe: so machen wir es (Test)', by: 'Lea' });
    const q1 = sql(`select p.erledigt, p.erledigt_by, (select count(*) from public.hh_vorhaben_verlauf v where v.punkt_id = p.id and v.art = 'entscheidung' and v.created_by = 'kompass') as verlauf from public.hh_vorhaben_punkte p where p.id = '${K.punkt}';`);
    pruefe('Punkt entscheiden: erledigt, erledigt_by Lea, ein Verlaufseintrag art entscheidung; Doppelaufruf ändert nichts', e1.status === 200 && e1.d.geaendert === true && e1.d.entscheidung.status === 'entschieden' && e2.status === 200 && e2.d.geaendert === false && q1.rows?.[0]?.erledigt === true && q1.rows[0].erledigt_by === 'Lea' && Number(q1.rows[0].verlauf) === 1, JSON.stringify(q1).slice(0, 200));
    await api('punkt_save', { id: K.punkt, stand: 'inzwischen geändert (Test)', wer: 'Lea', by: 'Alex' });
    const rk = await api('entscheidung_zurueck', { id: eP.id, by: 'Alex' });
    pruefe('zurück nach Änderung am Original: 409, nichts überschrieben (Runde 1, Befund 1)', rk.status === 409 && sql(`select wer from public.hh_vorhaben_punkte where id = '${K.punkt}';`).rows?.[0]?.wer === 'Lea', JSON.stringify(rk.d));
    await api('punkt_save', { id: K.punkt, wer: 'GF gemeinsam', by: 'Alex' });
    const e2b = await api('entscheidung_entscheiden', { id: eP.id, ergebnis: 'Ein anderes Ergebnis (Test)', by: 'Alex' });
    pruefe('zweiter Aufruf mit anderem Ergebnis: 409, gespeichert bleibt das erste (Runde 2, Befund 1)', e2b.status === 409 && /Schon entschieden/.test(e2b.d?.error || ''), JSON.stringify(e2b.d));
    const r1 = await api('entscheidung_zurueck', { id: eP.id, by: 'Alex' });
    const q2 = sql(`select p.erledigt, (select count(*) from public.hh_vorhaben_verlauf v where v.punkt_id = p.id and v.art = 'entscheidung') as verlauf from public.hh_vorhaben_punkte p where p.id = '${K.punkt}';`);
    pruefe('zurück: Punkt wieder offen, Verlaufseintrag entfernt, Status offen', r1.status === 200 && r1.d.entscheidung.status === 'offen' && q2.rows?.[0]?.erledigt === false && Number(q2.rows[0].verlauf) === 0, JSON.stringify(q2).slice(0, 200));
    /* Thema entscheiden: Beschluss und board_lane; zurück */
    const ss = await api('session_start', { participants: 'Alex, Lea', started_by: 'Alex', title: 'Stufe 1 Probe (Test)' });
    K.session = ss.d?.session?.id || null;
    const e3 = await api('entscheidung_entscheiden', { id: eT.id, ergebnis: 'Probe Thema entschieden (Test)', by: 'Alex', session_id: K.session });
    const tg = await api('topic_get', { id: K.thema });
    const q3 = sql(`select count(*) as n, max(session_id::text) as s from public.gfweekly_decisions where topic_id = '${K.thema}';`);
    pruefe('Thema entscheiden: board_lane entschieden, decision, ein Beschluss mit der Sitzungskennung (Runde 1, Befund 4)', e3.status === 200 && tg.d?.topic?.board_lane === 'entschieden' && tg.d.topic.decision === 'Probe Thema entschieden (Test)' && Number(q3.rows?.[0]?.n) === 1 && !!K.session && q3.rows[0].s === K.session, JSON.stringify([tg.d?.topic?.board_lane, q3.rows]).slice(0, 200));
    await api('themen_sammeln', { items: [{ id: K.thema, aktion: 'archivieren' }], by: 'Alex' });
    const rz = await api('entscheidung_zurueck', { id: eT.id, by: 'Alex' });
    const q3b = sql(`select count(*) as n from public.gfweekly_decisions where topic_id = '${K.thema}';`);
    pruefe('Thema nach dem Entscheiden archiviert: Rückgängig 409, Beschluss bleibt (Runde 2, Befund 2)', rz.status === 409 && Number(q3b.rows?.[0]?.n) === 1, JSON.stringify(rz.d));
    await api('themen_sammeln', { items: [{ id: K.thema, aktion: 'zuruecksetzen', wert: { archived: false, archiv_grund: null } }], by: 'Alex' });
    const r2 = await api('entscheidung_zurueck', { id: eT.id, by: 'Alex' });
    const tg2 = await api('topic_get', { id: K.thema });
    const q4 = sql(`select count(*) as n from public.gfweekly_decisions where topic_id = '${K.thema}';`);
    pruefe('zurück: Thema wieder zu besprechen, Beschluss entfernt', r2.status === 200 && tg2.d?.topic?.board_lane === 'zu_besprechen' && Number(q4.rows?.[0]?.n) === 0);
    /* Vertagen zieht die Frist nach */
    const v1 = await api('entscheidung_vertagen', { id: eT.id, bis: plus(7), by: 'Lea' });
    const tg3 = await api('topic_get', { id: K.thema });
    pruefe('vertagen: Status vertagt, gate_frist des Themas nachgezogen, Frist von Hand', v1.status === 200 && v1.d.entscheidung.status === 'vertagt' && v1.d.entscheidung.vertagt_bis === plus(7) && tg3.d?.topic?.gate_frist === plus(7) && v1.d.entscheidung.frist_quelle === 'hand');
    const l3 = await api('entscheidungen_list', { status: 'offen' });
    pruefe('vertagt bis in sieben Tagen steht nicht in Offen; sammeln überschreibt die Frist von Hand nicht', !(l3.d?.eintraege || []).some(e => e.id === eT.id) && (await api('entscheidungen_list', { status: 'vertagt' })).d.eintraege.find(e => e.id === eT.id)?.frist === plus(7));
    /* Abgeben setzt gate; Punkt: wer */
    const a1 = await api('entscheidung_abgeben', { id: eT.id, an: 'lea', by: 'Alex' });
    const tg4 = await api('topic_get', { id: K.thema });
    pruefe('abgeben an Lea: Status abgegeben, gate lea am Thema', a1.status === 200 && a1.d.entscheidung.status === 'abgegeben' && tg4.d?.topic?.gate === 'lea' && tg4.d.topic.gate_by === 'Alex');
    const ax = await api('entscheidung_entscheiden', { id: eT.id, ergebnis: 'Probe nach Abgabe', by: 'Alex' });
    pruefe('abgegebene Entscheidung lässt sich nicht entscheiden (409, Runde 1 Befund 2)', ax.status === 409, String(ax.status));
    const a2 = await api('entscheidung_abgeben', { id: eP.id, an: 'team', by: 'Lea' });
    const q5 = sql(`select wer from public.hh_vorhaben_punkte where id = '${K.punkt}';`);
    pruefe('abgeben Punkt ins Team: wer = Team, Verlaufseintrag', a2.status === 200 && q5.rows?.[0]?.wer === 'Team');
    const l4 = await api('entscheidungen_list', { status: 'alle' });
    pruefe('nach dem Sammeln bleiben abgegebene Zeilen abgegeben (nicht hinfällig)', (l4.d?.eintraege || []).filter(e => [eP.id, eT.id].includes(e.id)).every(e => e.status === 'abgegeben'));
    const r3 = await api('entscheidung_zurueck', { id: eT.id, by: 'Alex' }); const r4 = await api('entscheidung_zurueck', { id: eP.id, by: 'Alex' });
    const tg5 = await api('topic_get', { id: K.thema });
    pruefe('zurück nach abgeben: gate wieder gf, Punkt wieder GF gemeinsam', r3.status === 200 && r4.status === 200 && tg5.d?.topic?.gate === 'gf' && sql(`select wer from public.hh_vorhaben_punkte where id = '${K.punkt}';`).rows?.[0]?.wer === 'GF gemeinsam');
    /* entscheidung_set */
    const s1 = await api('entscheidung_set', { id: eP.id, frage: 'Probe: stimmen wir dem Testpunkt zu?', vorschlag: 'Ja', by: 'Lea' });
    const l5 = await api('entscheidungen_list', { status: 'alle' });
    const eP2 = (l5.d?.eintraege || []).find(e => e.id === eP.id);
    pruefe('entscheidung_set: Frage von Lea, frage_form, sammeln überschreibt sie nicht', s1.status === 200 && eP2 && eP2.frage === 'Probe: stimmen wir dem Testpunkt zu?' && eP2.frage_form === true && eP2.frage_von === 'Lea' && eP2.vorschlag === 'Ja');
    /* Korb: Kandidat ohne Vorhaben zuordnen, Thema erscheint nicht (hat Ausgang gf, aber kein Vorhaben: erscheint) */
    const k1 = await api('korb_list', {});
    pruefe('korb_list zeigt Testkandidat und Testthema (ohne Vorhaben)', k1.status === 200 && (k1.d.eintraege || []).some(x => x.id === K.kandidat && x.kind === 'kandidat') && (k1.d.eintraege || []).some(x => x.id === K.thema && x.kind === 'thema'));
    const k2 = await api('korb_set', { kind: 'thema', id: K.thema, aktion: 'zuordnen', vorhaben_id: K.vorhaben, by: 'Alex' });
    const k3 = await api('korb_set', { kind: 'thema', id: K.thema, aktion: 'zuordnen', vorhaben_id: K.vorhaben, by: 'Alex' });
    const q6 = sql(`select (select vorhaben_id from public.gfweekly_topics where id = '${K.thema}') = '${K.vorhaben}' as zu, (select count(*) from public.hh_vorhaben_verlauf where vorhaben_id = '${K.vorhaben}' and text like 'Aus dem Korb zugeordnet:%') as verlauf;`);
    pruefe('Korb zuordnen: vorhaben_id gesetzt, ein Verlaufseintrag; zweiter Aufruf 409 ohne zweiten Eintrag', k2.status === 200 && k3.status === 409 && q6.rows?.[0]?.zu === true && Number(q6.rows[0].verlauf) === 1, JSON.stringify([k2.status, k3.status, q6]).slice(0, 200));
    const k4 = await api('korb_set', { kind: 'kandidat', id: K.kandidat, aktion: 'verwerfen', by: 'Lea' });
    pruefe('Korb verwerfen: Kandidat verworfen, nicht mehr im Korb', k4.status === 200 && k4.d.item.status === 'verworfen' && !((await api('korb_list', {})).d.eintraege || []).some(x => x.id === K.kandidat));
    const k6 = await api('korb_set', { kind: 'kandidat', id: K.kandidat, aktion: 'zuordnen', vorhaben_id: K.vorhaben, by: 'Lea' });
    pruefe('Korb: verworfener Kandidat lässt sich nicht mehr zuordnen (409, Runde 2 Befund 3)', k6.status === 409, String(k6.status));
    const k5 = await api('korb_set', { kind: 'kandidat', id: K.kandidat, aktion: 'archivieren', by: 'Lea' });
    pruefe('Korb: archivieren für Kandidaten abgelehnt (400)', k5.status === 400);
    /* Hinfällig bei archivierter Quelle */
    const ar = await api('themen_sammeln', { items: [{ id: K.thema, aktion: 'archivieren' }], by: 'Alex' });
    const alt = await api('entscheidung_entscheiden', { id: eT.id, ergebnis: 'Probe auf archiviertes Thema', by: 'Alex' });
    pruefe('Entscheiden auf eine inzwischen archivierte Quelle: 409 (Runde 1, Befund 2)', alt.status === 409, String(alt.status));
    const l6 = await api('entscheidungen_list', { status: 'alle' });
    const eT3 = (l6.d?.eintraege || []).find(e => e.id === eT.id);
    pruefe('Thema archiviert: Zeile hinfällig (nicht mehr in alle), Punkt bleibt offen', ar.status === 200 && !eT3 && (l6.d?.eintraege || []).some(e => e.id === eP.id && e.status === 'offen'), JSON.stringify(eT3 || null).slice(0, 160));
    const q7 = sql(`select status from public.hh_entscheidungen where id = '${eT.id}';`);
    pruefe('hinfällig steht so in der Tabelle', q7.rows?.[0]?.status === 'hinfaellig', JSON.stringify(q7).slice(0, 120));
    /* Hinfällig und zurück: Punkt auf Lea umschreiben, dann wieder GF */
    await api('punkt_save', { id: K.punkt, wer: 'Lea', by: 'Alex' });
    const l7 = await api('entscheidungen_list', { status: 'alle' });
    await api('punkt_save', { id: K.punkt, wer: 'GF gemeinsam', by: 'Alex' });
    const l8 = await api('entscheidungen_list', { status: 'alle' });
    pruefe('Punkt an Lea: hinfällig; wieder GF: dieselbe Zeile wieder offen (keine Dublette)', !(l7.d?.eintraege || []).some(e => e.id === eP.id) && (l8.d?.eintraege || []).filter(e => e.quelle_id === K.punkt).length === 1 && (l8.d.eintraege.find(e => e.quelle_id === K.punkt) || {}).status === 'offen');
  } catch (e) {
    pruefe('Ablauf ohne Ausnahme', false, e.message);
  } finally {
    const r = aufraeumen();
    const z0 = r.rows && r.rows[0];
    pruefe('eigene Testzeilen gelöscht und zurückgelesen (Entscheidungen, Vorhaben, Thema, Kandidat je 0)', !!z0 && Number(z0.en) === 0 && Number(z0.vh) === 0 && Number(z0.th) === 0 && Number(z0.kd) === 0, JSON.stringify(r).slice(0, 300));
  }
}
console.log(fehler ? `\nEntscheidungen-Probe: ${fehler} Befunde (${ok} in Ordnung)` : `\nEntscheidungen-Probe: alle ${ok} in Ordnung`);
process.exit(fehler ? 1 : 0);
