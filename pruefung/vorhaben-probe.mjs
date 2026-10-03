/* Wirkungsprobe V31 · Vorhaben gegen das echte Backend, ohne Abfangen.
   Aufruf:  GF_PW=<passwort> node pruefung/vorhaben-probe.mjs
   Arbeitet nur am Testvorhaben test-v31 (legt es an oder holt es aus dem Archiv) und an einer Testabwesenheit
   (test: true). Echte Vorhaben werden nur gelesen; am Ende vergleicht die Probe ihren Zustand mit dem Anfang.
   Zum Schluss steht test-v31 wieder auf archiviert. Die KI-Probe braucht ANTHROPIC_API_KEY in der Edge Function. */
const FN = process.env.GF_FN || 'https://bnfmupnmqyrcltrphfak.supabase.co/functions/v1/gfweekly';
const PW = process.env.GF_PW || '';
if (!PW) { console.error('GF_PW fehlt (Passwort des Hohen Hauses in der Umgebung).'); process.exit(2); }
const BY = 'Alex';
let fehler = 0, n = 0;
const ok = (bed, text, extra) => { n++; if (bed) console.log('  ✓ ' + text); else { fehler++; console.log('  ✕ ' + text + (extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 300) : '')); } };
async function api(action, payload = {}, erwartet = 200) {
  const res = await fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, password: PW, payload }) });
  let d = {}; try { d = await res.json(); } catch (e) {}
  if (res.status !== erwartet) throw new Error(`${action}: HTTP ${res.status} statt ${erwartet}: ${d.error || ''}`);
  return d;
}
const schnappschuss = (liste) => Object.fromEntries(liste.filter(v => v.slug !== 'test-v31')
  .map(v => [v.slug, [v.ball, v.ball_name, v.stand, v.naechster_schritt, v.frist, v.status, v.punkte_erledigt, v.punkte_gesamt, v.zuletzt_bewegt, v.absence_id].join('|')]));

let testId = null, absenceId = null, echt0 = null;
try {
  console.log('== Grundlage ==');
  const ping = await api('ping');
  ok(ping.version === 38, `ping meldet Version 38 (ist ${ping.version})`);
  ok(ping.aiConfigured === true, 'ANTHROPIC_API_KEY ist gesetzt');
  const vorher = await api('vorhaben_list', { status: 'alle' });
  echt0 = schnappschuss(vorher.vorhaben);
  const aktiv = await api('vorhaben_list');
  ok(aktiv.vorhaben.filter(v => v.slug !== 'test-v31').length >= 16, `vorhaben_list liefert mindestens 16 echte Vorhaben (${aktiv.vorhaben.length})`);
  ok(aktiv.vorhaben.every(v => ['aktiv', 'pausiert'].includes(v.status)), 'Standard liefert nur aktiv und pausiert');
  ok(Array.isArray(aktiv.abwesenheiten) && typeof aktiv.einwuerfe_offen === 'number', 'Abwesenheiten und offene Einwürfe sind dabei');
  const xc = await api('vorhaben_get', { slug: 'xceed' });
  ok(xc.punkte.length === 9, `vorhaben_get xceed liefert 9 Punkte (${xc.punkte.length})`);
  ok(Array.isArray(xc.verlauf) && Array.isArray(xc.themen) && Array.isArray(xc.kandidaten), 'Akte hat Verlauf, Themen, Kandidaten');
  await api('vorhaben_get', { slug: 'gibt-es-nicht-v31' }, 404); ok(true, 'unbekannter slug ergibt 404');
  await api('vorhaben_save', { slug: 'xceed', stand: 'x' }, 400); ok(true, 'schreiben ohne by wird abgelehnt (400)');
  const unauth = await fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'vorhaben_list', password: 'falsch' }) });
  ok(unauth.status === 401, 'vorhaben_list ohne Passwort ergibt 401');

  console.log('== Testvorhaben ==');
  const alle = vorher.vorhaben.find(v => v.slug === 'test-v31');
  if (alle) { const r = await api('vorhaben_save', { id: alle.id, status: 'aktiv', ball: 'offen', naechster_schritt: 'Probe läuft', by: BY }); testId = r.vorhaben.id; }
  else { const r = await api('vorhaben_save', { title: 'Test V31', gruppe: 'sonstiges', stand: 'Testvorhaben der Wirkungsprobe', naechster_schritt: 'Probe läuft', by: BY }); testId = r.vorhaben.id; ok(r.vorhaben.slug === 'test-v31', `neu angelegt als test-v31 (${r.vorhaben.slug})`); }
  ok(!!testId, 'Testvorhaben bereit');
  /* Offene Punkte früherer Läufe abhaken, damit die KI eindeutig „Probe“ findet. */
  const t0 = await api('vorhaben_get', { id: testId });
  for (const p of t0.punkte.filter(p => !p.erledigt)) await api('punkt_toggle', { id: p.id, erledigt: true, by: BY });

  const p1 = (await api('punkt_save', { vorhaben_id: testId, titel: 'Probe', wer: 'Testperson', frist: '2026-12-01', by: BY })).punkt;
  ok(p1 && p1.titel === 'Probe' && !p1.erledigt, 'Punkt „Probe“ angelegt');
  await api('punkt_save', { vorhaben_id: testId, titel: 'Probe', frist: '2026-13-45', by: BY }, 400); ok(true, 'ungültige Frist wird abgelehnt (400)');
  const a1 = await api('punkt_toggle', { id: p1.id, erledigt: true, by: BY });
  ok(a1.geaendert && a1.punkt.erledigt && a1.punkt.erledigt_by === 'Alex', 'abgehakt, erledigt_by Alex');
  const a2 = await api('punkt_toggle', { id: p1.id, erledigt: true, by: BY });
  ok(!a2.geaendert && !a2.verlauf, 'zweites Abhaken ändert nichts und schreibt keinen Verlauf');
  const a3 = await api('punkt_toggle', { id: p1.id, erledigt: false, by: BY });
  ok(a3.geaendert && !a3.punkt.erledigt && !a3.punkt.erledigt_at, 'wieder offen, erledigt_at geleert');
  let akte = await api('vorhaben_get', { id: testId });
  ok(akte.verlauf.some(e => e.text === 'Punkt erledigt: Probe') && akte.verlauf.some(e => e.text === 'Punkt wieder offen: Probe'), 'Verlauf hat „Punkt erledigt“ und „Punkt wieder offen“');
  ok(akte.verlauf.filter(e => e.text === 'Punkt erledigt: Probe' && e.punkt_id === p1.id).length === 1, 'genau ein „Punkt erledigt“ für diesen Punkt');
  const del1 = await api('punkt_delete', { id: p1.id, by: BY }, 409);
  ok(/Verlauf/.test(del1.error), 'Punkt mit Verlauf lässt sich nicht löschen (409 mit Grund)');
  const p2 = (await api('punkt_save', { vorhaben_id: testId, titel: 'Wegwerfpunkt', by: BY })).punkt;
  await api('punkt_delete', { id: p2.id, by: BY }); ok(true, 'Punkt ohne Verlauf lässt sich löschen');

  console.log('== Ball ==');
  const b1 = await api('vorhaben_save', { id: testId, ball: 'lea', expect_ball: 'offen', by: BY });
  ok(b1.ball_geaendert && b1.vorhaben.ball === 'lea' && !!b1.vorhaben.ball_seit, 'Ball von niemand an Lea, ball_seit gesetzt');
  const b2 = await api('vorhaben_save', { id: testId, ball: 'alex', expect_ball: 'offen', by: BY }, 409);
  ok(/inzwischen/.test(b2.error), 'veralteter Stand beim Ballwechsel ergibt 409');
  const b3 = await api('vorhaben_save', { id: testId, ball: 'team', ball_name: 'Testperson', notiz: 'bitte prüfen', by: BY });
  ok(b3.vorhaben.ball === 'team' && b3.vorhaben.ball_name === 'Testperson', 'Ball an Team mit Name');
  const b4 = await api('vorhaben_save', { id: testId, ball: 'lea', naechster_schritt: 'Probe: nächster Schritt', by: BY });
  ok(b4.vorhaben.ball_name === null, 'Name fällt weg, wenn der Ball an Lea geht');
  akte = await api('vorhaben_get', { id: testId });
  ok(akte.verlauf.some(e => e.art === 'uebergabe' && e.text === 'Ball von niemand an Lea'), 'Verlauf „Ball von niemand an Lea“');
  ok(akte.verlauf.some(e => e.art === 'uebergabe' && e.text === 'Ball von Lea an Testperson. bitte prüfen'), 'Verlauf mit Notiz');
  ok(akte.verlauf.some(e => e.art === 'system' && e.text === 'Nächster Schritt: Probe: nächster Schritt'), 'Verlauf „Nächster Schritt“ als system');

  console.log('== Verlauf ==');
  const v1 = (await api('verlauf_add', { vorhaben_id: testId, art: 'telefon', wer: 'Alex mit Testperson', text: 'Probe-Telefonat', by: BY })).verlauf;
  ok(v1.status === 'bestaetigt', 'verlauf_add schreibt bestätigt');
  await api('verlauf_add', { vorhaben_id: testId, art: 'unsinn', text: 'x', by: BY }, 400); ok(true, 'unbekannte art wird abgelehnt');
  await api('verlauf_status', { id: v1.id, status: 'verworfen', by: BY });
  akte = await api('vorhaben_get', { id: testId });
  ok(!akte.verlauf.some(e => e.id === v1.id), 'verworfener Eintrag fehlt in der Akte');

  console.log('== Einwurf mit KI ==');
  const e1 = await api('einwurf_add', { text: 'Telefonat mit Testperson, Punkt Probe ist erledigt', kanal: 'knopf', von: 'Alex', by: BY });
  const ew = e1.einwurf, vs = ew.vorschlag;
  ok(!e1.ki_fehler, 'KI hat geantwortet', e1.ki_fehler);
  ok(ew.status === 'vorgeschlagen' && !!vs, 'Einwurf steht mit Vorschlag', ew.status);
  const erkannt = vs && vs.vorhaben_slug === 'test-v31';
  ok(erkannt, `erkannt: test-v31 (ist ${vs && vs.vorhaben_slug})`);
  ok(vs && vs.punkte.some(p => p.id === p1.id && p.erledigt === true), 'Vorschlag: Punkt Probe erledigt', vs && vs.punkte);
  ok(vs && ['telefon', 'notiz'].includes(vs.verlauf.art) && vs.verlauf.text.length > 0, `Verlaufsvorschlag (${vs && vs.verlauf.art})`);
  const vorApply = await api('vorhaben_get', { id: testId });
  ok(vorApply.punkte.find(p => p.id === p1.id).erledigt === false, 'vor dem Übernehmen ist nichts angewendet');
  if (!erkannt) { await api('einwurf_verwerfen', { id: ew.id, by: BY }); ok(false, 'Einwurf verworfen, weil die KI ein anderes Vorhaben erkannt hat'); }
  else {
    const ap = await api('einwurf_apply', { id: ew.id, vorhaben_id: testId, auswahl: { verlauf: true, punkte: [p1.id], neue_punkte: [], ball: false, naechster_schritt: false, frist: false }, benachrichtigung: 'morgen', by: BY });
    ok(ap.ok && ap.verlauf && ap.verlauf.source_ref === 'einwurf:' + ew.id, 'Verlauf trägt source_ref einwurf:<id>');
    akte = await api('vorhaben_get', { id: testId });
    ok(akte.punkte.find(p => p.id === p1.id).erledigt === true, 'Punkt Probe ist in der Datenbank erledigt');
    ok(!akte.einwuerfe.some(x => x.id === ew.id), 'Einwurf ist nicht mehr offen');
    const liste = await api('einwurf_list', { status: 'alle', vorhaben_id: testId });
    ok(liste.einwuerfe.find(x => x.id === ew.id)?.status === 'uebernommen', 'Einwurf hat Status uebernommen');
    await api('einwurf_apply', { id: ew.id, auswahl: { verlauf: true }, by: BY }, 409); ok(true, 'zweites Übernehmen ergibt 409');
  }
  /* Einwurf mit vorgegebenem Vorhaben und fremder Punkt-ID: die Prüfung verwirft sie. */
  const e2 = await api('einwurf_add', { text: `Probe: Punkt ${xc.punkte[0].id} ist erledigt`, vorhaben_id: testId, by: BY });
  ok(e2.einwurf.vorhaben_id === testId, 'vorgegebenes Vorhaben hat Vorrang');
  ok(!(e2.einwurf.vorschlag?.punkte || []).some(p => p.id === xc.punkte[0].id), 'Punkt eines fremden Vorhabens steht nicht im Vorschlag');
  await api('einwurf_verwerfen', { id: e2.einwurf.id, by: BY }); ok(true, 'Einwurf verworfen');

  console.log('== Schichtwechsel ==');
  const s1 = await api('schicht_uebergabe', { von: 'Lea', an: 'Alex', eintraege: [{ vorhaben_id: testId, ball: 'alex', notiz: 'Probe Feierabend' }], by: 'Lea' });
  ok(s1.ok && s1.ergebnis[0].ball === 'alex', 'Schichtwechsel setzt den Ball auf Alex');
  akte = await api('vorhaben_get', { id: testId });
  ok(akte.verlauf.some(e => e.text === 'Schichtwechsel Lea an Alex: Ball von Lea an Alex. Probe Feierabend'), 'Verlauf des Schichtwechsels mit Notiz');

  console.log('== Abwesenheit ==');
  await api('vorhaben_save', { id: testId, ball: 'lea', frist: '2026-11-20', by: BY });
  const von = new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10), bis = new Date(Date.now() + 86400000 * 33).toISOString().slice(0, 10);
  const ab = await api('absence_set', { person: 'Lea', von, bis, art: 'geplant', kontakt: 'keiner', vertretung_standard: 'Alex', test: true, note: 'V31-Probe', who: 'Alex' });
  absenceId = ab.absence.id;
  const korb = await api('handover_list', { absence_id: absenceId });
  const zeile = korb.items.find(x => x.kind === 'vorhaben' && x.ref_id === testId);
  ok(!!zeile, 'Korb enthält das Testvorhaben als Vorhaben-Zeile');
  ok(zeile && zeile.dossier && zeile.dossier.slug === 'test-v31' && Array.isArray(zeile.dossier.verlauf), 'Dossier mit slug und Verlauf');
  if (zeile) {
    const h1 = await api('handover_set', { id: zeile.id, ampel: 'gruen', vertretung: 'Alex', by: BY });
    ok(h1.vorgang && h1.vorgang.ball === 'alex' && h1.vorgang.absence_id === absenceId, 'Vertretung: Ball bei Alex, absence_id gesetzt');
    await api('handover_set', { id: zeile.id, ampel: 'gruen', vertretung: 'Alex', by: BY });
    akte = await api('vorhaben_get', { id: testId });
    ok(akte.vorhaben.ball_vor_abwesenheit === 'lea', 'ball_vor_abwesenheit = lea');
    ok(akte.verlauf.filter(e => /^in Vertretung für Lea/.test(e.text)).length === 1, 'genau ein Verlaufseintrag „in Vertretung für Lea“ trotz doppeltem Setzen');
    const end = await api('absence_end', { id: absenceId, by: BY });
    ok((end.vorhaben_zurueck || []).some(x => x.id === testId && x.an === 'lea'), 'absence_end gibt den Ball an Lea zurück');
    akte = await api('vorhaben_get', { id: testId });
    ok(akte.vorhaben.ball === 'lea' && !akte.vorhaben.absence_id && !akte.vorhaben.ball_vor_abwesenheit, 'Ball bei Lea, Bindung gelöst');
    const rk = await api('vorhaben_rueckkehr', { absence_id: absenceId });
    ok(rk.vorhaben.some(v => v.id === testId && v.zurueck), 'Rückkehr kennt das Vorhaben mit Rückgabe');
  }
} catch (e) {
  fehler++; console.log('  ✕ Abbruch: ' + e.message);
} finally {
  console.log('== Aufräumen ==');
  try {
    if (absenceId) { try { await api('absence_end', { id: absenceId, by: BY }); } catch (e) {} }
    if (testId) {
      const akte = await api('vorhaben_get', { id: testId });
      for (const w of akte.einwuerfe) await api('einwurf_verwerfen', { id: w.id, by: BY });
      await api('vorhaben_save', { id: testId, status: 'archiviert', ball: 'offen', by: BY });
      const nach = await api('vorhaben_get', { id: testId });
      ok(nach.vorhaben.status === 'archiviert', 'test-v31 ist archiviert');
    }
    if (!echt0) throw new Error('kein Anfangszustand, Vergleich nicht möglich');
    const nachher = await api('vorhaben_list', { status: 'alle' });
    const echt1 = schnappschuss(nachher.vorhaben);
    const geaendert = Object.keys(echt0).filter(k => echt0[k] !== echt1[k]);
    ok(!geaendert.length, 'echte Vorhaben unverändert (Ball, Stand, Schritt, Frist, Status, Punkte, letzte Bewegung)', geaendert);
    ok(!(await api('vorhaben_list')).vorhaben.some(v => v.slug === 'test-v31'), 'kein Testvorhaben unter den aktiven');
  } catch (e) { fehler++; console.log('  ✕ Aufräumen: ' + e.message); }
}
console.log(`\n${n - fehler} von ${n} Proben bestanden.`);
process.exit(fehler ? 1 : 0);
