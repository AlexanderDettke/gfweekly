/* Stufe 2 · Ein Behälter (25.10.2026, docs/PAKET-STUFE-2-EIN-BEHAELTER.md, Abschnitt 8.2). Zwei Teile:
   1. Rechenregeln (immer): ein Datum aus der Quelle (frist_vorschlag) ist keine Frist, macht nicht reif und ergibt keinen Fristzustand;
      Fokus-Reihenfolge der Phasen (GF_PHASE_REIHE) wie in core.js.
   2. Wirkung gegen das echte Backend (nur mit GF_PW): Testvorhaben mit Phase und Fokus, Testpunkt, Testthema mit gate_frist (Vorschlag,
      keine Frist), Vorschlag übernehmen, Sammelaktion „nicht jetzt“ mit Konflikt je Zeile und Rückgängig, Auflösung eines Testthemas in
      einen Punkt mit Umhängen der Entscheidung, „hinfällig“ mit Rückweg, Lauf erledigt einen Punkt (created_by 'lauf') und Rückgängig
      aus der Akte (lauf_rueckgaengig), lauf_bilanz, Korb einer Testabwesenheit nur mit Vorhaben, Übergabe „Erledigt“, Rückkehr-Lagebild.
      Danach löscht die Probe genau ihre eigenen Zeilen (nach Kennung) und liest zurück.
   Aufruf: node pruefung/stufe2-probe.mjs
           GF_PW=… node pruefung/stufe2-probe.mjs   (Passwort aus dem Vault, nie ausgeben; siehe docs/TECHNIKSTAND.md) */
import { fristZustand, istReif } from '../supabase/functions/gfweekly/entscheidungen.ts';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let ok = 0, fehler = 0;
const pruefe = (name, b, info = '') => { if (b) { ok++; console.log('  ok     ' + name); } else { fehler++; console.log('  FEHLT  ' + name + (info ? ' · ' + String(info).slice(0, 300) : '')); } };
const H = '2026-10-25';
const tag = (n) => new Date(Date.UTC(2026, 9, 25 + n)).toISOString().slice(0, 10);
const z = (o) => ({ id: o.id, quelle_art: o.art || 'thema', quelle_id: o.id + 'q', frage: o.frage || 'Frage ' + o.id, frage_form: !!o.form, frist: o.frist || null, frist_vorschlag: o.frist_vorschlag || null,
  vorschlag: o.vorschlag || null, status: o.status || 'offen', vertagt_bis: null, entschieden_am: null, updated_at: '2026-10-20T10:00:00Z' });

console.log('== Stufe 2: Rechenregeln ==');
pruefe('Vorschlagsfrist macht nicht reif und ergibt keinen Fristzustand (Frist nur von Person oder Punkt)',
  !istReif(z({ id: 'a', frist_vorschlag: tag(3) })) && fristZustand(null, H) === 'ohne' && istReif(z({ id: 'b', frist: tag(3) })));
{
  const core = fs.readFileSync(new URL('../site/assets/core.js', import.meta.url), 'utf8');
  const m = core.match(/const GF_PHASE_REIHE=\[([^\]]+)\]/);
  pruefe('Phasenreihe in core.js: launch, formatpartner, systembau, sonstiges', !!m && m[1].replace(/["\s]/g, '') === 'launch,formatpartner,systembau,sonstiges', m && m[1]);
  pruefe('Navigation ohne Themen, Eingabe, Aufräumen; board.html bleibt als Datei', !/\["themen","board\.html"/.test(core) && !/\["capture","capture\.html"/.test(core) && !/\["aufraeumen","aufraeumen\.html"/.test(core) && fs.existsSync(new URL('../site/board.html', import.meta.url)));
}

/* ---- Teil 2: Wirkung gegen das echte Backend ---- */
const PW = process.env.GF_PW || '';
if (!PW) { console.log('\nWirkung gegen das echte Backend übersprungen (GF_PW nicht gesetzt).'); }
else {
  console.log('\n== Stufe 2: Wirkung gegen das echte Backend (Testvorhaben, Testpunkte, Testthema, Testabwesenheit) ==');
  const URL_FN = 'https://bnfmupnmqyrcltrphfak.supabase.co/functions/v1/gfweekly';
  const api = async (action, payload) => { const r = await fetch(URL_FN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, password: PW, payload }) }); let d = null; try { d = await r.json(); } catch { d = null; } return { status: r.status, d }; };
  const M = 'Stufe 2 Probe (Test)';
  const K = { vorhaben: null, punktA: null, punktB: null, thema: null, absence: null };
  const sql = (text) => {
    const leer = fs.mkdtempSync(path.join(os.tmpdir(), 's2-probe-')); const f = path.join(leer, 'q.sql'); fs.writeFileSync(f, text);
    const r = spawnSync('npx', ['--yes', 'supabase', 'db', 'query', '--linked', '--project-ref', 'bnfmupnmqyrcltrphfak', '-f', f], { cwd: leer, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
    if (r.status !== 0) return { fehler: (r.stderr || r.stdout || '').slice(0, 300) };
    try { const s = r.stdout; return JSON.parse(s.slice(s.indexOf('{'))); } catch (e) { return { fehler: 'keine JSON-Antwort' }; }
  };
  const aufraeumen = () => {
    const t = [];
    const q = [K.punktA, K.punktB, K.thema].filter(Boolean).map(i => `'${i}'`).join(',');
    if (q) t.push(`delete from public.hh_entscheidungen where quelle_id in (${q});`);
    if (K.absence) { t.push(`delete from public.gfweekly_handover where absence_id = '${K.absence}';`); t.push(`delete from public.gfweekly_handover_log where absence_id = '${K.absence}';`); t.push(`delete from public.gfweekly_absences where id = '${K.absence}' and test = true;`); }
    if (K.vorhaben) { t.push(`delete from public.hh_vorhaben_verlauf where vorhaben_id = '${K.vorhaben}';`); t.push(`delete from public.hh_vorhaben_punkte where vorhaben_id = '${K.vorhaben}';`); t.push(`delete from public.hh_vorhaben where id = '${K.vorhaben}' and title like '%(Test)%';`); }
    if (K.thema) { t.push(`delete from public.gfweekly_decisions where topic_id = '${K.thema}';`); t.push(`delete from public.gfweekly_topics where id = '${K.thema}' and title like '%(Test)%';`); }
    if (!t.length) return { rows: [] };
    t.push(`select (select count(*) from public.hh_entscheidungen where quelle_id in (${q || "'00000000-0000-0000-0000-000000000000'"})) as en, (select count(*) from public.hh_vorhaben where id ${K.vorhaben ? `= '${K.vorhaben}'` : 'is null'}) as vh, (select count(*) from public.gfweekly_topics where id ${K.thema ? `= '${K.thema}'` : 'is null'}) as th, (select count(*) from public.gfweekly_absences where id ${K.absence ? `= '${K.absence}'` : 'is null'}) as ab;`);
    return sql(t.join('\n'));
  };
  const heute = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
  const plus = (n) => { const d = new Date(heute + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const meine = (l) => (l.d?.eintraege || []).filter(e => [K.punktA, K.punktB, K.thema].includes(e.quelle_id));
  try {
    const ping = await api('ping', {});
    pruefe('Edge Function mit Stufe 2 (ping version ≥ 42)', ping.status === 200 && ping.d.version >= 42, JSON.stringify(ping.d));
    /* Vorhaben mit Phase und Fokus */
    const vh = await api('vorhaben_save', { title: M + ' Vorhaben', by: 'Alex', gruppe: 'sonstiges', ball: 'gf', frist: plus(2) });
    K.vorhaben = vh.d?.vorhaben?.id || null;
    pruefe('Testvorhaben angelegt (Ball GF, Frist in zwei Tagen)', vh.status === 200 && !!K.vorhaben, JSON.stringify(vh.d).slice(0, 200));
    const ph = await api('vorhaben_phase', { id: K.vorhaben, phase: 'launch', fokus: true, by: 'Lea' });
    const ph2 = await api('vorhaben_phase', { id: K.vorhaben, phase: 'irgendwas', by: 'Lea' });
    const ph3 = await api('vorhaben_phase', { id: K.vorhaben, phase: 'launch', fokus: true, by: 'Lea' });
    const phv = sql(`select phase, fokus, (select count(*) from public.hh_vorhaben_verlauf x where x.vorhaben_id = v.id and x.art = 'system' and x.text like 'Phase: launch%') as verlauf from public.hh_vorhaben v where id = '${K.vorhaben}';`);
    pruefe('Phase Launch und Fokus gesetzt, Verlaufseintrag einmal, falsche Phase 400, Wiederholung ohne zweiten Eintrag', ph.status === 200 && ph.d.geaendert === true && ph2.status === 400 && ph3.status === 200 && ph3.d.geaendert === false && phv.rows?.[0]?.phase === 'launch' && phv.rows[0].fokus === true && Number(phv.rows[0].verlauf) === 1, JSON.stringify([ph.status, ph2.status, ph3.d, phv.rows]).slice(0, 300));
    /* Punkt A und Thema mit gate_frist */
    const pa = await api('punkt_save', { vorhaben_id: K.vorhaben, titel: M + ' Punkt A', wer: 'GF gemeinsam', by: 'Alex' });
    K.punktA = pa.d?.punkt?.id || null;
    const th = await api('add', { title: M + ' Thema', context: 'Probe mit Handlung: Angebot schicken', created_by: 'Alex', board_lane: 'zu_besprechen', priority: 'niedrig' });
    K.thema = th.d?.topic?.id || null;
    const gs = K.thema ? await api('gate_set', { kind: 'thema', id: K.thema, gate: 'gf', frist: plus(4), by: 'Alex' }) : { status: 0 };
    pruefe('Testpunkt A ohne Frist und Testthema mit Ausgang gf und gate_frist in vier Tagen', pa.status === 200 && !!K.punktA && th.status === 200 && !!K.thema && gs.status === 200, JSON.stringify([pa.d, th.d]).slice(0, 200));
    const l1 = await api('entscheidungen_list', { status: 'alle' });
    const eA = meine(l1).find(e => e.quelle_id === K.punktA), eT = meine(l1).find(e => e.quelle_id === K.thema);
    pruefe('Thema: Frist leer, frist_vorschlag aus gate_frist, nicht reif, Zustand ohne; Punkt: Vorhaben mit Phase launch und Fokus', eT && eT.frist === null && eT.frist_vorschlag === plus(4) && !eT.reif && eT.zustand === 'ohne' && eA && eA.vorhaben?.phase === 'launch' && eA.vorhaben?.fokus === true, JSON.stringify([eT, eA]).slice(0, 400));
    /* Vorschlag übernehmen = Frist von Hand */
    const fu = await api('entscheidung_set', { id: eT.id, frist: eT.frist_vorschlag, expect_updated_at: eT.updated_at, by: 'Alex' });
    pruefe('Vorschlag übernehmen setzt Frist mit Quelle hand und macht reif', fu.status === 200 && fu.d.entscheidung.frist === plus(4) && fu.d.entscheidung.frist_quelle === 'hand', JSON.stringify(fu.d).slice(0, 200));
    /* Sammelaktion mit Konflikt je Zeile und Rückgängig */
    const l2 = await api('entscheidungen_list', { status: 'alle' });
    const eA2 = meine(l2).find(e => e.quelle_id === K.punktA), eT2 = meine(l2).find(e => e.quelle_id === K.thema);
    const sa = await api('entscheidungen_sammelaktion', { items: [{ id: eA2.id, expect_updated_at: eA2.updated_at }, { id: eT2.id, expect_updated_at: '2020-01-01T00:00:00Z' }], aktion: 'nicht_jetzt', by: 'Alex' });
    const montag = (() => { const d = new Date(heute + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 28); const w = d.getUTCDay() || 7; d.setUTCDate(d.getUTCDate() + (8 - w) % 7); return d.toISOString().slice(0, 10); })();
    pruefe('Sammelaktion nicht jetzt: eine Zeile vertagt bis zum ersten Montag nach vier Wochen, die veraltete als Konflikt je Zeile', sa.status === 200 && sa.d.ok === 1 && sa.d.gesamt === 2 && sa.d.wert === montag && sa.d.ergebnis.find(r => r.id === eT2.id)?.konflikt === true && sa.d.ergebnis.find(r => r.id === eA2.id)?.entscheidung?.status === 'vertagt', JSON.stringify(sa.d).slice(0, 300));
    const sa2 = await api('entscheidungen_sammelaktion', { items: [{ id: eA2.id }], aktion: 'abgeben', wert: 'helge', by: 'Alex' });
    const sa3 = await api('entscheidungen_sammelaktion', { items: [], aktion: 'nicht_jetzt', by: 'Alex' });
    pruefe('falscher Empfänger 400, leere Liste 400', sa2.status === 400 && sa3.status === 400, [sa2.status, sa3.status].join(','));
    const rz = await api('entscheidung_zurueck', { id: eA2.id, by: 'Alex' });
    pruefe('Rückgängig der Sammelaktion: Zeile wieder offen', rz.status === 200 && rz.d.entscheidung.status === 'offen', JSON.stringify(rz.d).slice(0, 200));
    /* Auflösung: Thema wird Punkt B, Entscheidung wandert mit (hh_entscheidung_umhaengen) */
    const pb = await api('punkt_save', { vorhaben_id: K.vorhaben, titel: M + ' Punkt B (aus Thema)', wer: 'Lea', by: 'Alex', quelle: 'thema:' + K.thema });
    K.punktB = pb.d?.punkt?.id || null;
    const um = sql(`select public.hh_entscheidung_umhaengen('${eT2.id}', 'punkt', '${K.punktB}', 'Alex') as r; update public.gfweekly_topics set archived = true, archiv_grund = 'stufe2:punkt' where id = '${K.thema}'; select quelle_art, quelle_id, status, vorhaben_id from public.hh_entscheidungen where id = '${eT2.id}';`);
    const l3 = await api('entscheidungen_list', { status: 'alle' });
    const eB = meine(l3).find(e => e.quelle_id === K.punktB);
    pruefe('Umhängen: Entscheidung zeigt auf Punkt B, bleibt offen nach Archivierung des Themas, Vorhaben gesetzt; keine zweite Zeile für Punkt B', um.rows?.[0]?.quelle_art === 'punkt' && um.rows[0].quelle_id === K.punktB && um.rows[0].status === 'offen' && um.rows[0].vorhaben_id === K.vorhaben && eB && eB.id === eT2.id && meine(l3).filter(e => e.quelle_id === K.punktB).length === 1 && !meine(l3).some(e => e.quelle_id === K.thema), JSON.stringify([um, eB && eB.id]).slice(0, 300));
    /* Hinfällig mit Rückweg */
    const hf = await api('entscheidungen_sammelaktion', { items: [{ id: eA2.id }], aktion: 'hinfaellig', by: 'Lea' });
    const hq = sql(`select erledigt, erledigt_by from public.hh_vorhaben_punkte where id = '${K.punktA}';`);
    const hr = await api('entscheidung_zurueck', { id: eA2.id, by: 'Lea' });
    const hq2 = sql(`select erledigt from public.hh_vorhaben_punkte where id = '${K.punktA}';`);
    pruefe('Hinfällig: Punkt A erledigt mit Rückweg (original und nach); Rückgängig öffnet Punkt und Zeile wieder', hf.status === 200 && hf.d.ok === 1 && hq.rows?.[0]?.erledigt === true && hf.d.ergebnis[0].entscheidung.rueckweg?.original && hf.d.ergebnis[0].entscheidung.rueckweg?.nach && hr.status === 200 && hr.d.entscheidung.status === 'offen' && hq2.rows?.[0]?.erledigt === false, JSON.stringify([hf.d, hr.d]).slice(0, 300));
    /* Lauf erledigt Punkt B, Rückgängig aus der Akte */
    const ref = 'test:stufe2:' + Date.now();
    const lauf = sql(`select (public.hh_punkt_toggle('${K.punktB}', true, 'lauf', '${ref}:erledigt')->'verlauf'->>'id') as vid; insert into public.hh_vorhaben_verlauf (vorhaben_id, punkt_id, art, wer, text, status, created_by, source_ref) values ('${K.vorhaben}', '${K.punktB}', 'mail', 'Lauf', 'Erledigt (Lauf): Antwort gesendet (Test)', 'bestaetigt', 'lauf', '${ref}:beleg'); select (select public.hh_punkt_toggle('${K.punktB}', true, 'lauf', '${ref}:x')->>'geaendert') as nochmal, id as vid from public.hh_vorhaben_verlauf where punkt_id = '${K.punktB}' and created_by = 'lauf' and art = 'system' limit 1;`);
    const vid = lauf.rows?.[0]?.vid;
    const l4 = await api('entscheidungen_list', { status: 'alle' });
    const bil = await api('lauf_bilanz', { wochen: 1 });
    const akte = await api('vorhaben_get', { id: K.vorhaben });
    const laufEintrag = (akte.d?.verlauf || []).find(e => e.id === vid);
    pruefe('Lauf: Punkt B erledigt (erledigt_by lauf), Entscheidung hinfällig, Bilanz zählt mindestens einen, Akte liefert den Lauf-Eintrag mit created_by und punkt_id', !!vid && lauf.rows[0].nochmal === 'false' && !meine(l4).some(e => e.quelle_id === K.punktB && e.status === 'offen') && bil.status === 200 && (bil.d.summe?.erledigt || 0) >= 1 && Array.isArray(bil.d.wochen) && laufEintrag && laufEintrag.created_by === 'lauf' && laufEintrag.punkt_id === K.punktB, JSON.stringify([lauf, bil.d?.summe, laufEintrag]).slice(0, 400));
    const lr0 = await api('lauf_rueckgaengig', { id: vid, by: 'Helge' });
    const lr = await api('lauf_rueckgaengig', { id: vid, by: 'Alex' });
    const lr2 = await api('lauf_rueckgaengig', { id: vid, by: 'Alex' });
    const lq = sql(`select p.erledigt, (select count(*) from public.hh_vorhaben_verlauf x where x.punkt_id = p.id and x.created_by = 'lauf' and x.status = 'verworfen') as verworfen, (select status from public.hh_entscheidungen e where e.quelle_id = p.id) as en from public.hh_vorhaben_punkte p where p.id = '${K.punktB}';`);
    pruefe('Rückgängig aus der Akte: fremde Person 400, Punkt wieder offen, zwei Lauf-Einträge verworfen, Entscheidung wieder offen, zweiter Versuch 409', lr0.status === 400 && lr.status === 200 && lr.d.verworfen === 2 && lr2.status === 409 && lq.rows?.[0]?.erledigt === false && Number(lq.rows[0].verworfen) === 2 && lq.rows[0].en === 'offen', JSON.stringify([lr0.status, lr.d, lr2.status, lq.rows]).slice(0, 300));
    /* Korb nur Vorhaben, Übergabe Erledigt, Rückkehr-Lagebild */
    const ab = await api('absence_set', { person: 'Lea', von: heute, bis: plus(5), art: 'geplant', kontakt: 'wochenbrief', test: true, note: M, by: 'Alex' });
    K.absence = ab.d?.absence?.id || ab.d?.id || null;
    const hb = K.absence ? await api('handover_build', { absence_id: K.absence }) : { status: 0 };
    const hl = K.absence ? await api('handover_list', { absence_id: K.absence }) : { status: 0, d: {} };
    const zeilen = hl.d?.items || hl.d?.rows || [];
    const fremd = zeilen.filter(z => z.kind !== 'vorhaben');
    const meineZeile = zeilen.find(z => z.ref_id === K.vorhaben);
    pruefe('Korb der Testabwesenheit: nur Vorhaben (keine Themen, keine Kandidaten), Testvorhaben mit Frist im Fenster ist dabei', ab.status === 200 && !!K.absence && hb.status === 200 && hl.status === 200 && fremd.length === 0 && !!meineZeile, JSON.stringify([ab.status, hb.status, hl.status, fremd.length, zeilen.length, meineZeile]).slice(0, 300));
    const hs = meineZeile ? await api('handover_set', { id: meineZeile.id, status: 'erledigt', by: 'Alex' }) : { status: 0 };
    const hsq = K.absence ? sql(`select status from public.gfweekly_handover where id = '${meineZeile?.id}';`) : {};
    pruefe('Übergabe: Zeile auf Erledigt gesetzt', hs.status === 200 && hsq.rows?.[0]?.status === 'erledigt', JSON.stringify([hs.d, hsq.rows]).slice(0, 200));
    const rl = K.absence ? await api('rueckkehr_lage', { absence_id: K.absence }) : { status: 0 };
    const rb = K.absence ? await api('rueckkehr_brief_set', { absence_id: K.absence, text: 'Probe-Brief (Test)', by: 'Lea' }) : { status: 0 };
    const rl2 = K.absence ? await api('rueckkehr_lage', { absence_id: K.absence }) : { status: 0 };
    const rl404 = await api('rueckkehr_lage', { absence_id: '00000000-0000-0000-0000-000000000000' });
    pruefe('Rückkehr-Lagebild: vier Phasen in fester Reihenfolge, nach Menschen, Brief schreiben und lesen, unbekannte Abwesenheit 404', rl.status === 200 && (rl.d.phasen || []).map(p => p.phase).join(',') === 'launch,formatpartner,systembau,sonstiges' && Array.isArray(rl.d.nach_menschen) && rb.status === 200 && rl2.d?.brief === 'Probe-Brief (Test)' && rl404.status === 404, JSON.stringify([rl.status, rl.d?.zaehler, rb.d, rl404.status]).slice(0, 300));
    const ae = K.absence ? await api('absence_end', { id: K.absence, by: 'Alex' }) : { status: 0 };
    pruefe('Willkommen zurück: Abwesenheit beendet, nichts liegen geblieben (Zeile war erledigt)', ae.status === 200 && (ae.d.liegen_geblieben || 0) === 0, JSON.stringify(ae.d).slice(0, 200));
  } catch (e) {
    fehler++; console.log('  FEHLT  Ausnahme in der Wirkungsprobe · ' + (e.stack || e.message).slice(0, 400));
  } finally {
    const r = aufraeumen();
    const z = r.rows?.[0];
    pruefe('Aufgeräumt: eigene Entscheidungen, Vorhaben, Punkte, Verlauf, Thema, Abwesenheit und Korb gelöscht', !!z && Number(z.en) === 0 && Number(z.vh) === 0 && Number(z.th) === 0 && Number(z.ab) === 0, JSON.stringify(r).slice(0, 300));
  }
}
console.log(`\n${ok} ok, ${fehler} Abweichungen`);
process.exit(fehler ? 1 : 0);
