/* Wirkungsprobe V31 · Vorhaben gegen das echte Backend, ohne Abfangen.
   Aufruf:  GF_PW=<passwort> node pruefung/vorhaben-probe.mjs
   Arbeitet nur an den Testvorhaben test-v31 und test-v31-ziel und an einer Testabwesenheit (test: true, Notiz
   „V31-Probe“). Zu Beginn löscht probe_aufraeumen die archivierten Testdaten eines früheren Laufs, am Ende stehen
   beide Testvorhaben wieder auf archiviert. Höchstens ein Lauf bleibt so als archivierter Bestand liegen.
   Echte Vorhaben werden nur gelesen: am Anfang und am Ende vergleicht die Probe jede Akte (Felder, Punkte, Verlauf).
   Läuft dazwischen der Abgleich aus Cowork, kann dieser Vergleich zu Recht anschlagen; dann den Lauf wiederholen.
   Die KI-Proben brauchen ANTHROPIC_API_KEY in der Edge Function. */
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
/* Erwarteter Fehler: Status und Grund müssen stimmen, sonst zählt die Probe als nicht bestanden. */
async function abgelehnt(action, payload, status, grund, text) {
  const d = await api(action, payload, status);
  ok(grund.test(d.error || ''), `${text} (${status}: ${(d.error || '').slice(0, 70)})`);
  return d;
}
const TEST = ['test-v31', 'test-v31-ziel'];
/* Ganze Akten der echten Vorhaben, ohne Felder, die sich allein durch die Zeit ändern. */
async function schnappschuss() {
  const liste = (await api('vorhaben_list', { status: 'alle' })).vorhaben.filter(v => !TEST.includes(v.slug));
  const out = {};
  for (const v of liste) {
    const a = await api('vorhaben_get', { id: v.id });
    const { zustand, updated_at, ...feste } = a.vorhaben;
    out[v.slug] = JSON.stringify({ v: feste, p: a.punkte.map(p => [p.id, p.titel, p.stand, p.wer, p.frist, p.erledigt, p.erledigt_at]),
      e: a.verlauf.map(e => [e.id, e.status]), t: a.themen.map(x => x.id), k: a.kandidaten.map(x => x.id), w: a.einwuerfe.map(x => [x.id, x.status]) });
  }
  return out;
}
async function testVorhaben(slug, titel) {
  const alle = (await api('vorhaben_list', { status: 'alle' })).vorhaben;
  const da = alle.find(v => v.slug === slug);
  if (da) return (await api('vorhaben_save', { id: da.id, status: 'aktiv', ball: 'offen', by: BY })).vorhaben;
  const r = await api('vorhaben_save', { title: titel, gruppe: 'sonstiges', stand: 'Testvorhaben der Wirkungsprobe', naechster_schritt: 'Probe läuft', by: BY });
  ok(r.vorhaben.slug === slug, `${slug} angelegt (${r.vorhaben.slug})`);
  return r.vorhaben;
}

let testId = null, zielId = null, absenceId = null, echt0 = null;
const LAUF = Date.now().toString(36);   // Kennung dieses Laufs in source_ref der Einwürfe
try {
  console.log('== Grundlage ==');
  const ping = await api('ping');
  ok(ping.version === 38, `ping meldet Version 38 (ist ${ping.version})`);
  ok(ping.aiConfigured === true, 'ANTHROPIC_API_KEY ist gesetzt');
  const auf = await api('probe_aufraeumen', { by: BY });
  ok(auf.ok && !auf.aktiv_uebrig, `Reste früherer Läufe gelöscht (${auf.vorhaben} Vorhaben, ${auf.einwuerfe} Einwürfe, ${auf.abwesenheiten} Abwesenheiten)`);
  echt0 = await schnappschuss();
  ok(Object.keys(echt0).length >= 16, `Anfangszustand von ${Object.keys(echt0).length} echten Akten gemerkt`);
  const aktiv = await api('vorhaben_list');
  ok(aktiv.vorhaben.filter(v => !TEST.includes(v.slug)).length >= 16, `vorhaben_list liefert mindestens 16 echte Vorhaben (${aktiv.vorhaben.length})`);
  ok(aktiv.vorhaben.every(v => ['aktiv', 'pausiert'].includes(v.status)), 'Standard liefert nur aktiv und pausiert');
  ok(Array.isArray(aktiv.abwesenheiten) && typeof aktiv.einwuerfe_offen === 'number', 'Abwesenheiten und offene Einwürfe sind dabei');
  const xc = await api('vorhaben_get', { slug: 'xceed' });
  ok(xc.punkte.length === 9, `vorhaben_get xceed liefert 9 Punkte (${xc.punkte.length})`);
  await abgelehnt('vorhaben_get', { slug: 'gibt-es-nicht-v31' }, 404, /gibt es nicht/, 'unbekannter slug');
  if (xc.themen.length) await abgelehnt('vorhaben_verknuepfen', { kind: 'thema', id: xc.themen[0].id, vorhaben_id: null, expect_vorhaben_id: '00000000-0000-0000-0000-000000000000', by: BY }, 409, /inzwischen geändert/, 'Zuordnung mit veraltetem Bezug (ändert nichts)');
  await abgelehnt('vorhaben_save', { slug: 'xceed', stand: 'x' }, 400, /by fehlt/, 'schreiben ohne by');
  await abgelehnt('vorhaben_save', { slug: 'xceed', stand: 'x', by: 'Jemand' }, 400, /Alex oder Lea/, 'by außerhalb der GF');
  const unauth = await fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'vorhaben_list', password: 'falsch' }) });
  ok(unauth.status === 401, 'vorhaben_list ohne Passwort ergibt 401');

  console.log('== Testvorhaben und Punkte ==');
  testId = (await testVorhaben('test-v31', 'Test V31')).id;
  zielId = (await testVorhaben('test-v31-ziel', 'Test V31 Ziel')).id;
  const p1 = (await api('punkt_save', { vorhaben_id: testId, titel: 'Probe', wer: 'Testperson', frist: '2026-12-01', by: BY })).punkt;
  ok(p1 && p1.titel === 'Probe' && !p1.erledigt, 'Punkt „Probe“ angelegt');
  await abgelehnt('punkt_save', { vorhaben_id: testId, titel: 'Probe', frist: '2026-13-45', by: BY }, 400, /kein Datum/, 'ungültige Frist');
  const a1 = await api('punkt_toggle', { id: p1.id, erledigt: true, by: BY });
  ok(a1.geaendert && a1.punkt.erledigt && a1.punkt.erledigt_by === 'Alex', 'abgehakt, erledigt_by Alex');
  const a2 = await api('punkt_toggle', { id: p1.id, erledigt: true, by: BY });
  ok(!a2.geaendert && !a2.verlauf, 'zweites Abhaken ändert nichts und schreibt keinen Verlauf');
  const a3 = await api('punkt_toggle', { id: p1.id, erledigt: false, by: BY });
  ok(a3.geaendert && !a3.punkt.erledigt && !a3.punkt.erledigt_at, 'wieder offen, erledigt_at geleert');
  const s1 = await api('punkt_save', { id: p1.id, stand: 'Probe in Arbeit', by: BY });
  ok(s1.punkt.stand === 'Probe in Arbeit', 'Stand am Punkt geändert');
  let akte = await api('vorhaben_get', { id: testId });
  ok(akte.verlauf.filter(e => e.punkt_id === p1.id && e.text === 'Punkt erledigt: Probe').length === 1, 'genau ein „Punkt erledigt“ mit Bezug zum Punkt');
  ok(akte.verlauf.some(e => e.punkt_id === p1.id && e.text === 'Punkt wieder offen: Probe'), '„Punkt wieder offen“ im Verlauf');
  ok(akte.verlauf.some(e => e.punkt_id === p1.id && e.text === 'Punkt Probe: Probe in Arbeit'), 'neuer Stand im Verlauf');
  ok(akte.verlauf.some(e => e.text === 'Vorhaben angelegt') || !!akte.verlauf.length, 'Verlauf des Testvorhabens vorhanden');
  await abgelehnt('punkt_delete', { id: p1.id, by: BY }, 409, /schon Verlauf/, 'Punkt mit Verlauf lässt sich nicht löschen');
  /* Alex und Lea bearbeiten denselben Punkt: anderes Feld geht durch, dasselbe Feld mit altem Wert ergibt 409. */
  await api('punkt_save', { id: p1.id, wer: 'Lea', expect: { wer: 'Testperson' }, by: 'Lea' });
  const pf = await api('punkt_save', { id: p1.id, frist: '2026-12-02', expect: { frist: '2026-12-01' }, by: BY });
  ok(pf.punkt.wer === 'Lea' && pf.punkt.frist === '2026-12-02', 'Änderung an einem anderen Feld lässt die fremde Änderung stehen');
  await abgelehnt('punkt_save', { id: p1.id, wer: 'Alex', expect: { wer: 'Testperson' }, by: BY }, 409, /Inzwischen geändert \(wer\)/, 'dasselbe Feld mit altem Wert');
  await abgelehnt('vorhaben_save', { id: testId, stand: 'B', expect: { stand: 'gibt es nicht' }, by: BY }, 409, /Inzwischen geändert \(stand\)/, 'Stand mit altem Wert');
  await abgelehnt('punkt_save', { id: p1.id, wer: 'Alex', expect: { geheim: 1 }, by: BY }, 400, /kennt das Feld/, 'expect mit unbekanntem Feld');
  const p2 = (await api('punkt_save', { vorhaben_id: testId, titel: 'Wegwerfpunkt', by: BY })).punkt;
  await api('punkt_delete', { id: p2.id, by: BY }); ok(true, 'Punkt ohne Verlauf lässt sich löschen');

  console.log('== Ball ==');
  const b1 = await api('vorhaben_save', { id: testId, ball: 'lea', expect_ball: 'offen', by: BY });
  ok(b1.ball_geaendert && b1.vorhaben.ball === 'lea' && !!b1.vorhaben.ball_seit, 'Ball von niemand an Lea, ball_seit gesetzt');
  await abgelehnt('vorhaben_save', { id: testId, ball: 'alex', expect_ball: 'offen', by: BY }, 409, /inzwischen bei Lea/, 'veralteter Stand beim Ballwechsel');
  /* Alex und Lea geben im selben Augenblick weiter: genau einer gewinnt, der andere erfährt es. */
  const gleich = await Promise.all([
    fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'vorhaben_save', password: PW, payload: { id: testId, ball: 'alex', expect_ball: 'lea', by: 'Lea' } }) }),
    fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'vorhaben_save', password: PW, payload: { id: testId, ball: 'gf', expect_ball: 'lea', by: 'Alex' } }) }),
  ]);
  const st = gleich.map(r => r.status).sort();
  ok(st[0] === 200 && st[1] === 409, `gleichzeitige Ballwechsel: einer 200, einer 409 (${st.join(', ')})`);
  akte = await api('vorhaben_get', { id: testId });
  ok(akte.verlauf.filter(e => e.art === 'uebergabe' && /^Ball von Lea an /.test(e.text)).length === 1, 'genau ein Verlaufseintrag für den gleichzeitigen Wechsel');
  const b3 = await api('vorhaben_save', { id: testId, ball: 'team', ball_name: 'Testperson', notiz: 'bitte prüfen', expect_ball: akte.vorhaben.ball, by: BY });
  ok(b3.vorhaben.ball === 'team' && b3.vorhaben.ball_name === 'Testperson', 'Ball an Team mit Name');
  await abgelehnt('vorhaben_save', { id: testId, ball: 'team', ball_name: 'Jemand anderes', expect_ball: 'team', expect: { ball_name: 'Alter Name' }, by: BY }, 409, /Inzwischen geändert \(ball_name\)/, 'Teamname mit veraltetem Stand');
  const b4 = await api('vorhaben_save', { id: testId, ball: 'lea', naechster_schritt: 'Probe: nächster Schritt', by: BY });
  ok(b4.vorhaben.ball_name === null, 'Name fällt weg, wenn der Ball an Lea geht');
  akte = await api('vorhaben_get', { id: testId });
  ok(akte.verlauf.some(e => e.art === 'uebergabe' && e.text === 'Ball von niemand an Lea'), 'Verlauf „Ball von niemand an Lea“');
  ok(akte.verlauf.some(e => e.art === 'uebergabe' && /an Testperson\. bitte prüfen$/.test(e.text)), 'Verlauf mit Notiz');
  ok(akte.verlauf.some(e => e.art === 'system' && e.text === 'Nächster Schritt: Probe: nächster Schritt'), 'Verlauf „Nächster Schritt“ als system');

  console.log('== Verlauf ==');
  const v1 = (await api('verlauf_add', { vorhaben_id: testId, art: 'telefon', wer: 'Alex mit Testperson', text: 'Probe-Telefonat', by: BY })).verlauf;
  ok(v1.status === 'bestaetigt', 'verlauf_add schreibt bestätigt');
  await abgelehnt('verlauf_add', { vorhaben_id: testId, art: 'unsinn', text: 'x', by: BY }, 400, /^art:/, 'unbekannte art');
  await api('verlauf_status', { id: v1.id, status: 'verworfen', by: BY });
  akte = await api('vorhaben_get', { id: testId });
  ok(!akte.verlauf.some(e => e.id === v1.id), 'verworfener Eintrag fehlt in der Akte');

  console.log('== Einwurf mit KI ==');
  const e1 = await api('einwurf_add', { text: 'V31-Probe: Telefonat mit Testperson, Punkt Probe ist erledigt', kanal: 'knopf', von: 'Alex', by: BY, source_ref: `probe:v31:${LAUF}:1` });
  const ew = e1.einwurf, vs = ew.vorschlag;
  ok(!e1.ki_fehler, 'KI hat geantwortet', e1.ki_fehler);
  ok(ew.status === 'vorgeschlagen' && !!vs, 'Einwurf steht mit Vorschlag', ew.status);
  const erkannt = vs && vs.vorhaben_slug === 'test-v31';
  ok(erkannt, `erkannt: test-v31 (ist ${vs && vs.vorhaben_slug})`);
  ok(vs && vs.punkte.some(p => p.id === p1.id && p.erledigt === true), 'Vorschlag: Punkt Probe erledigt', vs && vs.punkte);
  ok(vs && ['telefon', 'notiz'].includes(vs.verlauf.art) && vs.verlauf.text.length > 0, `Verlaufsvorschlag (${vs && vs.verlauf.art})`);
  ok((await api('vorhaben_get', { id: testId })).punkte.find(p => p.id === p1.id).erledigt === false, 'vor dem Übernehmen ist nichts angewendet');
  await abgelehnt('einwurf_apply', { id: ew.id, vorhaben_id: testId, auswahl: { verlauf: true }, bearbeitet: { verlauf_text: 'Das Passwort ist 1234' }, revision: vs && vs.revision, by: BY }, 400, /vertraulich/, 'bearbeiteter Text mit Passwort wird abgelehnt');
  await abgelehnt('einwurf_apply', { id: ew.id, vorhaben_id: testId, auswahl: { verlauf: true, naechster_schritt: true }, bearbeitet: { naechster_schritt: 'Kennwort an XCeed schicken' }, revision: vs && vs.revision, by: BY }, 400, /vertraulich/, 'bearbeiteter nächster Schritt mit Kennwort wird abgelehnt');
  await abgelehnt('einwurf_apply', { id: ew.id, vorhaben_id: testId, auswahl: { verlauf: true }, revision: 'alt', by: BY }, 409, /geändert/, 'veraltete Revision des Vorschlags');
  if (!erkannt) { await api('einwurf_verwerfen', { id: ew.id, by: BY }); ok(false, 'Einwurf verworfen, weil die KI ein anderes Vorhaben erkannt hat'); }
  else {
    const ap = await api('einwurf_apply', { id: ew.id, vorhaben_id: testId, auswahl: { verlauf: true, punkte: [p1.id], neue_punkte: [], ball: false, naechster_schritt: false, frist: false }, benachrichtigung: 'morgen', revision: vs.revision, by: BY });
    ok(ap.ok && ap.verlauf && ap.verlauf.source_ref === 'einwurf:' + ew.id, 'Verlauf trägt source_ref einwurf:<id>');
    akte = await api('vorhaben_get', { id: testId });
    ok(akte.punkte.find(p => p.id === p1.id).erledigt === true, 'Punkt Probe ist in der Datenbank erledigt');
    const liste = await api('einwurf_list', { status: 'alle', vorhaben_id: testId });
    ok(liste.einwuerfe.find(x => x.id === ew.id)?.status === 'uebernommen', 'Einwurf hat Status uebernommen');
    await abgelehnt('einwurf_apply', { id: ew.id, auswahl: { verlauf: true }, by: BY }, 409, /schon übernommen/, 'zweites Übernehmen');
  }
  /* Zielwechsel: Vorschlag für test-v31, übernommen in test-v31-ziel. Nur der Verlauf darf ankommen. */
  const p3 = (await api('punkt_save', { vorhaben_id: testId, titel: 'Zweite Probe', by: BY })).punkt;
  const e2 = await api('einwurf_add', { text: 'V31-Probe: Punkt Zweite Probe ist erledigt, Telefonat mit Testperson', vorhaben_id: testId, by: BY, source_ref: `probe:v31:${LAUF}:2` });
  ok(e2.einwurf.vorhaben_id === testId, 'vorgegebenes Vorhaben hat Vorrang');
  const ap2 = await api('einwurf_apply', { id: e2.einwurf.id, vorhaben_id: zielId, auswahl: { verlauf: true, punkte: [p3.id], ball: true, naechster_schritt: true, frist: true }, revision: e2.einwurf.vorschlag?.revision, by: BY });
  ok(ap2.uebersprungen.some(x => /galt für/.test(x)) && !ap2.punkte.length && !ap2.felder && ap2.ticker === false, 'Zielwechsel: nur der Verlauf, kein Ticker, Hinweis „galt für“');
  /* Zielwechsel mit vertraulichem Text: ohne bearbeiteten Text kein Eintrag. */
  const e4 = await api('einwurf_add', { text: 'V31-Probe: Testperson ist krank, Termin verschiebt sich', vorhaben_id: testId, by: BY, source_ref: `probe:v31:${LAUF}:3` });
  await abgelehnt('einwurf_apply', { id: e4.einwurf.id, vorhaben_id: zielId, auswahl: { verlauf: true }, revision: e4.einwurf.vorschlag?.revision, by: BY }, 400, /vertraulich/, 'Zielwechsel mit vertraulichem Einwurftext braucht Bearbeitung');
  const ap4 = await api('einwurf_apply', { id: e4.einwurf.id, vorhaben_id: zielId, auswahl: { verlauf: true }, bearbeitet: { verlauf_text: 'Termin mit Testperson verschiebt sich.' }, benachrichtigung: 'sofort', revision: e4.einwurf.vorschlag?.revision, by: BY });
  ok(ap4.verlauf?.text === 'Termin mit Testperson verschiebt sich.' && ap4.ticker === true, 'bearbeiteter Text wird eingetragen, ausdrücklich „sofort“ legt den Ticker an');
  ok((await api('vorhaben_get', { id: testId })).punkte.find(p => p.id === p3.id).erledigt === false, 'Punkt im ursprünglichen Vorhaben bleibt offen');
  ok((await api('vorhaben_get', { id: zielId })).verlauf.some(e => e.source_ref === 'einwurf:' + e2.einwurf.id), 'Verlauf steht im gewählten Vorhaben');
  /* Ziel ändern mit neuem Vorschlag */
  const e3 = await api('einwurf_add', { text: `V31-Probe: Punkt ${xc.punkte[0].id} ist erledigt`, vorhaben_id: testId, by: BY, source_ref: `probe:v31:${LAUF}:4` });
  ok(!(e3.einwurf.vorschlag?.punkte || []).some(p => p.id === xc.punkte[0].id), 'Punkt eines fremden Vorhabens steht nicht im Vorschlag');
  const e3b = await api('einwurf_vorschlag', { id: e3.einwurf.id, vorhaben_id: zielId, by: BY });
  ok(e3b.einwurf.vorhaben_id === zielId && (e3b.ki_fehler || e3b.einwurf.vorschlag?.vorhaben_id === zielId), 'einwurf_vorschlag prüft gegen das neue Ziel', e3b.ki_fehler);
  ok(!e3b.einwurf.vorschlag?.revision || e3b.einwurf.vorschlag.revision !== e3.einwurf.vorschlag?.revision, 'neuer Vorschlag hat eine neue Revision');
  await api('einwurf_verwerfen', { id: e3.einwurf.id, by: BY }); ok(true, 'Einwurf verworfen');

  console.log('== Schichtwechsel ==');
  await abgelehnt('schicht_uebergabe', { von: 'Lea', an: 'Alex', eintraege: [{ vorhaben_id: testId, ball: 'alex' }], by: 'Alex' }, 400, /by muss von sein/, 'Schichtwechsel nur durch die Person, die abgibt');
  const swx = await api('schicht_uebergabe', { von: 'Lea', an: 'Alex', eintraege: [{ vorhaben_id: testId, ball: 'alex' }], by: 'Lea' });
  ok(!swx.ok && /expect_ball fehlt/.test(swx.fehler[0]?.grund || ''), 'Schichtwechsel ohne gesehenen Ball wird je Zeile abgelehnt');
  const sw = await api('schicht_uebergabe', { von: 'Lea', an: 'Alex', eintraege: [{ vorhaben_id: testId, ball: 'alex', notiz: 'Probe Feierabend', expect_ball: 'lea' }], by: 'Lea' });
  ok(sw.ok && sw.ergebnis[0].ball === 'alex', 'Schichtwechsel setzt den Ball auf Alex');
  const sw2 = await api('schicht_uebergabe', { von: 'Lea', an: 'Alex', eintraege: [{ vorhaben_id: testId, ball: 'gf', expect_ball: 'lea' }], by: 'Lea' });
  ok(!sw2.ok && sw2.fehler[0]?.konflikt === true, 'veralteter Stand im Schichtwechsel meldet Konflikt');
  akte = await api('vorhaben_get', { id: testId });
  ok(akte.verlauf.some(e => e.text === 'Schichtwechsel Lea an Alex: Ball von Lea an Alex. Probe Feierabend'), 'Verlauf des Schichtwechsels mit Notiz');

  const seit = await api('vorhaben_seit', { seit: new Date(Date.now() - 15 * 60000).toISOString(), person: 'Alex' });
  ok(seit.eintraege.some(e => e.created_by === 'Lea') && !seit.eintraege.some(e => e.created_by === 'Alex'), 'vorhaben_seit: Einträge von Lea ja, eigene nein');
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
    await abgelehnt('handover_set', { id: zeile.id, ampel: 'ruht', expect: { status: 'vorschlag', ampel: zeile.ampel, vertretung: null }, by: 'Lea' }, 409, /inzwischen geändert/, 'Korbzeile mit veraltetem Stand');
    akte = await api('vorhaben_get', { id: testId });
    ok(akte.vorhaben.ball_vor_abwesenheit === 'lea', 'ball_vor_abwesenheit = lea');
    ok(akte.verlauf.filter(e => /^in Vertretung für Lea/.test(e.text)).length === 1, 'genau ein Eintrag „in Vertretung für Lea“ trotz doppeltem Setzen');
    const prot = (await api('handover_log', { absence_id: absenceId })).log.filter(l => l.handover_id === zeile.id);
    ok(prot.length === 1, `genau ein Übergabeprotokoll trotz doppeltem Setzen (${prot.length})`);
    const end = await api('absence_end', { id: absenceId, by: BY });
    ok((end.vorhaben_zurueck || []).some(x => x.id === testId && x.an === 'lea'), 'absence_end gibt den Ball an Lea zurück');
    akte = await api('vorhaben_get', { id: testId });
    ok(akte.vorhaben.ball === 'lea' && !akte.vorhaben.absence_id && !akte.vorhaben.ball_vor_abwesenheit, 'Ball bei Lea, Bindung gelöst');
    const rk = await api('vorhaben_rueckkehr', { absence_id: absenceId });
    ok(rk.vorhaben.some(v => v.id === testId && v.zurueck), 'Rückkehr kennt das Vorhaben mit Rückgabe');
  }
  /* Zweite Abwesenheit: wer den Ball während der Vertretung von Hand bewegt, behält ihn, auch bei erneuter Bestätigung. */
  const ab2 = await api('absence_set', { person: 'Lea', von, bis, art: 'geplant', kontakt: 'keiner', vertretung_standard: 'Alex', test: true, note: 'V31-Probe', who: 'Alex' });
  const absence2 = ab2.absence.id;
  const z2 = (await api('handover_list', { absence_id: absence2 })).items.find(x => x.kind === 'vorhaben' && x.ref_id === testId);
  if (z2) {
    await api('handover_set', { id: z2.id, ampel: 'gruen', vertretung: 'Alex', by: BY });
    await api('vorhaben_save', { id: testId, ball: 'gf', expect_ball: 'alex', by: BY });
    await api('handover_set', { id: z2.id, ampel: 'gruen', vertretung: 'Alex', by: BY });
    akte = await api('vorhaben_get', { id: testId });
    ok(akte.vorhaben.ball === 'gf', 'erneute Bestätigung setzt den von Hand bewegten Ball nicht zurück');
    const end2 = await api('absence_end', { id: absence2, by: BY });
    ok(!(end2.vorhaben_zurueck || []).some(x => x.id === testId) && (await api('vorhaben_get', { id: testId })).vorhaben.ball === 'gf', 'Rückgabe lässt den von Hand gesetzten Ball stehen');
  } else { ok(false, 'zweiter Korb ohne Testvorhaben'); await api('absence_end', { id: absence2, by: BY }); }
} catch (e) {
  fehler++; console.log('  ✕ Abbruch: ' + e.message);
} finally {
  console.log('== Aufräumen ==');
  try {
    if (absenceId) { try { await api('absence_end', { id: absenceId, by: BY }); } catch (e) {} }
    for (const id of [testId, zielId].filter(Boolean)) {
      const akte = await api('vorhaben_get', { id });
      for (const w of akte.einwuerfe) await api('einwurf_verwerfen', { id: w.id, by: BY });
      await api('vorhaben_save', { id, status: 'archiviert', ball: 'offen', by: BY });
      ok((await api('vorhaben_get', { id })).vorhaben.status === 'archiviert', `${akte.vorhaben.slug} ist archiviert`);
    }
    const rest = await api('probe_aufraeumen', { nur_einwuerfe: true, by: BY });
    ok(rest.ok && rest.ticker >= 1, `Einwürfe und Ticker der Probe gelöscht (${rest.einwuerfe} Einwürfe, ${rest.ticker} Ticker)`);
    if (!echt0) throw new Error('kein Anfangszustand, Vergleich nicht möglich');
    const echt1 = await schnappschuss();
    const geaendert = Object.keys(echt0).filter(k => echt0[k] !== echt1[k]);
    ok(!geaendert.length, 'echte Akten unverändert (Felder, Punkte, Verlauf, Themen, Kandidaten, Einwürfe)', geaendert);
    ok(!(await api('vorhaben_list')).vorhaben.some(v => TEST.includes(v.slug)), 'kein Testvorhaben unter den aktiven');
  } catch (e) { fehler++; console.log('  ✕ Aufräumen: ' + e.message); }
}
console.log(`\n${n - fehler} von ${n} Proben bestanden.`);
process.exit(fehler ? 1 : 0);
