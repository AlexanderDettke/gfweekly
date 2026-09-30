/* Prüfung der Launch-Rechenlogik (V27 Phase B), ohne Browser und ohne Edge Function.
   Aufruf: node pruefung/launch-test.mjs
   Vier Fälle aus dem Auftrag: die Kette Lusatia, die Last einer Person über zwei Festivals,
   Hilfe mit Briefing, VVK verschieben. Dazu Reihenfolge, Kandidaten und Wörter.
   Fester Stichtag, damit der Test nicht durch Zeitablauf falsch wird. */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const L = require('../site/assets/launch-logik.js');

const STICHTAG = '2026-10-01';
let fehler = 0, ok = 0;
const gleich = (name, ist, soll) => {
  const a = JSON.stringify(ist), b = JSON.stringify(soll);
  if (a === b) { ok++; console.log('  ok     ' + name); }
  else { fehler++; console.log('  FEHLT  ' + name + '\n         ist  ' + a + '\n         soll ' + b); }
};
const nahe = (name, ist, soll, eps = 0.01) => {
  if (Math.abs(ist - soll) <= eps) { ok++; console.log('  ok     ' + name); }
  else { fehler++; console.log(`  FEHLT  ${name}\n         ist  ${ist}\n         soll ${soll}`); }
};

/* Richtwerte wie in gfweekly_launch_richtwerte (Stand 30.09.2026), nur die Felder, die die Logik braucht. */
const RW = [
  ['Launch-Termin bestätigt', 'gf', 0.5, 1, 1, 0, -56, []],
  ['Positionierung freigegeben', 'fv', 4, 8, 5, 0, -42, []],
  ['Zielgruppen definiert', 'fv', 2, 4, 2, 0, -42, []],
  ['Kernbotschaft freigegeben', 'fv', 3, 6, 3, 0.3, -35, ['Positionierung freigegeben']],
  ['Ticketmodell vollständig', 'ticket', 3, 6, 3, 0, -35, []],
  ['Preislogik vollständig', 'ticket', 3, 6, 3, 0, -35, ['Ticketmodell vollständig']],
  ['Produktions-Briefing bereit', 'content', 3, 5, 2, 0.3, -35, []],
  ['Shotliste bereit', 'content', 2, 4, 2, 0.3, -30, ['Produktions-Briefing bereit']],
  ['Content produziert', 'content', 16, 32, 10, 0.5, -14, ['Shotliste bereit']],
  ['Landingpage bereit', 'komm', 8, 16, 7, 0.4, -10, ['Kernbotschaft freigegeben']],
  ['Bild-, Musik- und Persönlichkeitsrechte geklärt', 'recht', 2, 4, 7, 0, -10, []],
  ['Ticketshop bereit', 'ticket', 4, 8, 4, 0, -7, ['Ticketmodell vollständig', 'Preislogik vollständig']],
  ['Partnerpaket bereit', 'partner', 4, 8, 10, 0.3, -7, ['Kernbotschaft freigegeben']],
  ['Hauptfilm freigegeben', 'content', 6, 12, 5, 0, -5, ['Content produziert']],
  ['Social-Assets bereit', 'content', 6, 10, 4, 0.8, -5, ['Content produziert']],
  ['Tracking getestet', 'sys', 2, 4, 2, 0, -3, ['Landingpage bereit', 'Ticketshop bereit']],
  ['Newsletter bereit', 'komm', 3, 5, 2, 0.5, -3, ['Kernbotschaft freigegeben']],
  ['Ads-Kampagne vorbereitet', 'komm', 6, 12, 4, 0.3, -2, ['Landingpage bereit']],
  ['Launch-Checkliste vollständig', 'fv', 2, 3, 1, 0, -1, ['Ticketshop bereit', 'Landingpage bereit', 'Tracking getestet', 'Hauptfilm freigegeben', 'Social-Assets bereit', 'Newsletter bereit', 'Ads-Kampagne vorbereitet', 'Partnerpaket bereit', 'Bild-, Musik- und Persönlichkeitsrechte geklärt']],
  ['Launch durchgeführt', 'fv', 6, 10, 1, 0, 0, ['Launch-Checkliste vollständig']],
  ['24-Stunden-Rückblick', 'fv', 1, 2, 1, 0, 1, ['Launch durchgeführt']],
  ['7-Tage-Rückblick', 'fv', 2, 3, 1, 0, 7, ['Launch durchgeführt']],
  ['Kampagnen-Optimierung abgeschlossen', 'komm', 8, 16, 42, 0.3, 42, ['7-Tage-Rückblick']],
  ['Abschluss-Auswertung abgeschlossen', 'fv', 3, 6, 5, 0, 90, ['Kampagnen-Optimierung abgeschlossen']],
].map(([title, bereich, lo, hi, dauer, g, off, vorg]) => ({ title, bereich, aufwand_lo: lo, aufwand_hi: hi, dauer_tage: dauer, generator_anteil: g, vvk_offset_tage: off, vorgaenger: vorg }));

const PERSONEN = {
  jessica: { id: 'p-jessica', name: 'Jessica', typ: 'team', felder: ['fv', 'partner'], generator: true, launch_std_woche: 10, verfuegbar_ab: null, briefing_std: 0, stundensatz: null, sort_order: 7 },
  christian: { id: 'p-christian', name: 'Christian', typ: 'extern', felder: ['komm', 'sys'], generator: true, launch_std_woche: null, verfuegbar_ab: null, briefing_std: 2, stundensatz: null, sort_order: 12 },
  antonia: { id: 'p-antonia', name: 'Antonia', typ: 'team', felder: ['komm', 'content'], generator: true, launch_std_woche: 8, verfuegbar_ab: null, briefing_std: 0, stundensatz: null, sort_order: 6 },
  nina: { id: 'p-nina', name: 'Nina', typ: 'minijob', felder: ['content'], generator: true, launch_std_woche: 6, verfuegbar_ab: '2026-10-10', briefing_std: 2, stundensatz: null, sort_order: 33 },
  agentur: { id: 'p-agentur', name: 'Agentur', typ: 'agentur', felder: ['content'], generator: true, launch_std_woche: null, verfuegbar_ab: null, briefing_std: 3, stundensatz: 60, sort_order: 50 },
  alex: { id: 'p-alex', name: 'Alexander Dettke', typ: 'gf', felder: ['gf', 'fv'], generator: true, launch_std_woche: 4, verfuegbar_ab: null, briefing_std: 0, stundensatz: null, sort_order: 1 },
  lea: { id: 'p-lea', name: 'Lea Luce', typ: 'gf', felder: ['gf', 'recht', 'ticket'], generator: true, launch_std_woche: null, verfuegbar_ab: null, briefing_std: 0, stundensatz: null, sort_order: 2 },
};
const POOL = Object.values(PERSONEN);

/* Ein Festival aus den Richtwerten bauen: Zieltermine wie die Edge Function aus VVK-Start plus Abstand. */
function festival(kurz, vvk, wer) {
  return RW.map((r, i) => ({ id: `${kurz}-${i}`, festival: kurz, title: r.title, bereich: r.bereich, status: 'not_started',
    due_on: L.plusTage(vvk, r.vvk_offset_tage), aufwand_lo: r.aufwand_lo, aufwand_hi: r.aufwand_hi, dauer_tage: r.dauer_tage,
    generator_anteil: r.generator_anteil, person_id: wer(r) || null, hilfe_person_id: null, zuordnung_status: 'vorschlag' }));
}
const wer = r => ({ fv: 'p-jessica', gf: 'p-alex', komm: 'p-christian', sys: 'p-christian', content: 'p-antonia', ticket: 'p-lea', partner: 'p-jessica', recht: 'p-lea' })[r.bereich];
const byTitle = (liste, t) => liste.find(m => m.title === t);

console.log('\n== 1. Kette Lusatia (VVK 15.10., heute 01.10.) ==');
{
  const LUS = festival('lus', '2026-10-15', wer);
  const k = L.kette(LUS, RW, { heute: STICHTAG });
  const f = t => k.je[byTitle(LUS, t).id];
  gleich('Positionierung beginnt heute, 5 Tage', [f('Positionierung freigegeben').beginn, f('Positionierung freigegeben').fertig], ['2026-10-01', '2026-10-05']);
  gleich('Kernbotschaft beginnt am Tag nach dem Vorgänger', [f('Kernbotschaft freigegeben').beginn, f('Kernbotschaft freigegeben').fertig], ['2026-10-06', '2026-10-08']);
  gleich('Landingpage nach der Kernbotschaft, 7 Tage', [f('Landingpage bereit').beginn, f('Landingpage bereit').fertig], ['2026-10-09', '2026-10-15']);
  gleich('Ticketshop nach Ticketmodell und Preislogik', [f('Ticketshop bereit').beginn, f('Ticketshop bereit').fertig], ['2026-10-07', '2026-10-10']);
  gleich('Tracking wartet auf den späteren Vorgänger (Landingpage)', [f('Tracking getestet').beginn, f('Tracking getestet').fertig], ['2026-10-16', '2026-10-17']);
  gleich('Content: Briefing, Shotliste, Produktion, Hauptfilm', [f('Produktions-Briefing bereit').fertig, f('Shotliste bereit').fertig, f('Content produziert').fertig, f('Hauptfilm freigegeben').fertig], ['2026-10-02', '2026-10-04', '2026-10-14', '2026-10-19']);
  gleich('Checkliste nach allen neun Vorgängern', [f('Launch-Checkliste vollständig').beginn, f('Launch-Checkliste vollständig').fertig], ['2026-10-20', '2026-10-20']);
  gleich('Launchtag am Tag nach der Checkliste', f('Launch durchgeführt').fertig, '2026-10-21');
  gleich('Verzug am Launchtag: 6 Tage später als geplant', [f('Launch durchgeführt').verzug, f('Launch durchgeführt').wort], [6, '6 Tage später als geplant']);
  gleich('Zielgruppen: Zieltermin 03.09. liegt zurück, 29 Tage später als geplant', [f('Zielgruppen definiert').fertig, f('Zielgruppen definiert').wort], ['2026-10-02', '29 Tage später als geplant']);
  gleich('Nachlauf: 7-Tage-Rückblick am 22.10., trifft den Zieltermin', [f('7-Tage-Rückblick').fertig, f('7-Tage-Rückblick').verzug], ['2026-10-22', 0]);
  /* Frühester machbarer VVK: der Launchtag der Kette, 21.10. */
  gleich('Frühester machbarer VVK-Start ist der Launchtag der Kette', k.fruehesterVVK, '2026-10-21');

  /* Spätere Verfügbarkeit einer Person schiebt den Beginn und damit die ganze Kette. */
  const LUS2 = festival('lus2', '2026-10-15', r => r.bereich === 'content' && r.title === 'Produktions-Briefing bereit' ? 'p-nina' : wer(r));
  const k2 = L.kette(LUS2, RW, { heute: STICHTAG, verfuegbarAb: { 'p-nina': '2026-10-10' } });
  const f2 = t => k2.je[byTitle(LUS2, t).id];
  gleich('Nina erst ab 10.10.: Briefing beginnt am 10.10.', [f2('Produktions-Briefing bereit').beginn, f2('Produktions-Briefing bereit').fertig], ['2026-10-10', '2026-10-11']);
  gleich('… und die Shotliste rückt nach', f2('Shotliste bereit').beginn, '2026-10-12');
  gleich('… bis zum Hauptfilm am 28.10.', f2('Hauptfilm freigegeben').fertig, '2026-10-28');
  gleich('… Checkliste 29.10., Launchtag und machbarer VVK am 30.10.', [f2('Launch-Checkliste vollständig').fertig, k2.fruehesterVVK], ['2026-10-29', '2026-10-30']);

  /* Erledigtes liegt fest und schiebt nichts, Laufendes hat schon begonnen. */
  const LUS3 = festival('lus3', '2026-10-15', wer);
  Object.assign(byTitle(LUS3, 'Positionierung freigegeben'), { status: 'complete', completed_on: '2026-09-20' });
  Object.assign(byTitle(LUS3, 'Ticketmodell vollständig'), { status: 'in_progress' });
  const k3 = L.kette(LUS3, RW, { heute: STICHTAG });
  const f3 = t => k3.je[byTitle(LUS3, t).id];
  gleich('Erledigt liegt fest am completed_on', [f3('Positionierung freigegeben').fertig, f3('Positionierung freigegeben').fest], ['2026-09-20', true]);
  gleich('Kernbotschaft nach erledigtem Vorgänger beginnt heute', f3('Kernbotschaft freigegeben').beginn, '2026-10-01');
  gleich('Laufendes beginnt heute, Preislogik danach', [f3('Ticketmodell vollständig').beginn, f3('Preislogik vollständig').beginn], ['2026-10-01', '2026-10-04']);
  gleich('Erledigtes und Laufendes ändern den Launchtag hier nicht: 21.10.', k3.fruehesterVVK, '2026-10-21');
}

console.log('\n== 2. Last über zwei Festivals ==');
{
  const A = [{ id: 'a1', festival: 'A', title: 'x', status: 'not_started', due_on: '2026-10-15', aufwand_lo: 8, aufwand_hi: 16, generator_anteil: 0, person_id: 'p-jessica' }];
  const B = [{ id: 'b1', festival: 'B', title: 'y', status: 'not_started', due_on: '2026-10-29', aufwand_lo: 12, aufwand_hi: 24, generator_anteil: 0, person_id: 'p-jessica' },
             { id: 'b2', festival: 'B', title: 'z', status: 'complete', due_on: '2026-09-20', aufwand_lo: 40, aufwand_hi: 80, generator_anteil: 0, person_id: 'p-jessica' }];
  const l = L.last([...A, ...B], POOL, { heute: STICHTAG }).find(x => x.person_id === 'p-jessica');
  gleich('Stunden aus beiden Festivals, Erledigtes nicht', [l.stunden.lo, l.stunden.hi, l.aufgaben, l.festivals.sort()], [20, 40, 2, ['A', 'B']]);
  gleich('Fenster bis zum spätesten Termin: 29 Tage, 5 Wochen', [l.ende, l.wochen], ['2026-10-29', 5]);
  nahe('Pro Woche unten 4', l.proWoche.lo, 4); nahe('Pro Woche oben 8', l.proWoche.hi, 8);
  gleich('Mitte 6 von 10 Stunden: 60 Prozent, passt', [l.prozent, l.wort, l.ueber], [60, 'passt', false]);

  const eng = Object.assign({}, PERSONEN.jessica, { launch_std_woche: 6 });
  const l2 = L.last([...A, ...B], [eng], { heute: STICHTAG })[0];
  gleich('Mitte 6 von 6: 100 Prozent, knapp', [l2.prozent, l2.wort, l2.ueber], [100, 'knapp', false]);
  const zuviel = Object.assign({}, PERSONEN.jessica, { launch_std_woche: 5 });
  const l3 = L.last([...A, ...B], [zuviel], { heute: STICHTAG })[0];
  gleich('Mitte 6 von 5: 120 Prozent, zu viel', [l3.prozent, l3.wort, l3.ueber], [120, 'zu viel', true]);
  const ohne = Object.assign({}, PERSONEN.jessica, { launch_std_woche: null });
  const l4 = L.last([...A, ...B], [ohne], { heute: STICHTAG })[0];
  gleich('Ohne Eintrag: keine Zeit eingetragen, keine Überlast', [l4.prozent, l4.wort, l4.ueber, l4.ohneZeit], [null, 'keine Zeit eingetragen', false, true]);

  /* Hilfe teilt den Aufwand: Generator-Anteil an die Hilfe, der Rest bleibt. */
  const H = [{ id: 'h1', festival: 'A', title: 'w', status: 'not_started', due_on: '2026-10-08', aufwand_lo: 16, aufwand_hi: 32, generator_anteil: 0.5, person_id: 'p-antonia', hilfe_person_id: 'p-nina' }];
  const lh = L.last(H, POOL, { heute: STICHTAG });
  gleich('Zuständige behält die Hälfte', lh.find(x => x.person_id === 'p-antonia').stunden, { lo: 8, hi: 16 });
  const nina = lh.find(x => x.person_id === 'p-nina');
  gleich('Hilfe bekommt den Generator-Anteil', nina.stunden, { lo: 8, hi: 16 });
  gleich('Fenster der Hilfe beginnt erst mit ihrer Verfügbarkeit', [nina.beginn, nina.wochen], ['2026-10-10', 1]);

  /* Verfügbarkeit erst nach dem letzten Termin: Fenster eine Woche, nicht negativ. */
  const spaet = Object.assign({}, PERSONEN.jessica, { verfuegbar_ab: '2026-12-01' });
  const l5 = L.last([...A, ...B], [spaet], { heute: STICHTAG })[0];
  gleich('Verfügbar nach dem Ende: eine Woche, alles darin', [l5.wochen, l5.beginn], [1, '2026-12-01']);

  const LUS = festival('lus', '2026-10-15', wer);
  const k = L.kette(LUS, RW, { heute: STICHTAG });
  const ll = L.last(LUS, POOL, { heute: STICHTAG, fertigJe: k.je });
  const lg = L.lage(LUS, ll, k);
  gleich('Lage: 24 offene Aufgaben, Stundenspanne, machbarer VVK', [lg.offen, lg.stunden.lo, lg.stunden.hi, lg.fruehesterVVK], [24, 99.5, 191, '2026-10-21']);
  gleich('Lage zählt nur Beteiligte mit Wort „zu viel“, nicht „keine Zeit eingetragen“', [lg.ueber, lg.ohneZeit], [ll.filter(x => x.ueber && ['p-jessica', 'p-alex', 'p-christian', 'p-antonia', 'p-lea'].includes(x.person_id)).length, 2]);
  gleich('Lagesatz nennt vier Dinge', L.lageSatz({ kurzname: 'Lusatia' }, { offen: 3, stunden: { lo: 10, hi: 20 }, fruehesterVVK: '2026-10-24', ueber: 1 }),
    'Lusatia: 3 offene Aufgaben, 10 bis 20 Stunden nach Richtwerten, frühestens machbar am 24.10.2026, 1 Person über ihrer Zeit.');
}

console.log('\n== 3. Hilfe mit Briefing ==');
{
  const gross = { title: 'Content produziert', aufwand_lo: 16, aufwand_hi: 32, generator_anteil: 0.5 };
  const b = L.hilfeBewerten(gross, PERSONEN.nina, { als: 'hilfe' });
  gleich('Generator-Anteil 8 bis 16 Stunden, 2 Briefing, 6 bis 14 Entlastung, sinnvoll', [b.uebergeben, b.briefing, b.entlastung, b.sinnvoll], [{ lo: 8, hi: 16 }, 2, { lo: 6, hi: 14 }, true]);
  gleich('Ohne Stundensatz keine Kosten', b.kosten, null);
  const klein = { title: 'Shotliste bereit', aufwand_lo: 2, aufwand_hi: 4, generator_anteil: 0.3 };
  const b2 = L.hilfeBewerten(klein, PERSONEN.nina, { als: 'hilfe' });
  gleich('Kleine Aufgabe: nach Briefing bleibt nichts, nicht sinnvoll', [b2.sinnvoll, Math.round(b2.entlastung.lo * 10) / 10], [false, -1.4]);
  const b3 = L.hilfeBewerten(gross, PERSONEN.agentur, { als: 'zustaendig' });
  gleich('Ganz übergeben an die Agentur: 16 bis 32, Kosten 960 bis 1920', [b3.uebergeben, b3.kosten, b3.sinnvoll], [{ lo: 16, hi: 32 }, { lo: 960, hi: 1920 }, true]);
  const b4 = L.hilfeBewerten({ aufwand_lo: 4, aufwand_hi: 8, generator_anteil: 0 }, PERSONEN.nina, { als: 'hilfe' });
  gleich('Ohne Generator-Anteil gibt es als Hilfe nichts abzugeben', [b4.anteil, b4.sinnvoll], [0, false]);
  gleich('Grenze genau zwei Stunden unten ist sinnvoll', L.hilfeBewerten({ aufwand_lo: 4, aufwand_hi: 10, generator_anteil: 1 }, PERSONEN.nina, { als: 'hilfe' }).sinnvoll, true);
}

console.log('\n== 4. VVK verschieben ==');
{
  const LUS = festival('lus', '2026-10-15', wer);
  Object.assign(byTitle(LUS, 'Zielgruppen definiert'), { status: 'complete', completed_on: '2026-09-28' });
  const v = L.vvkVerschieben(LUS, RW, '2026-10-29');
  const z = t => v.find(x => x.title === t);
  gleich('Positionierung: 42 Tage vor dem neuen VVK', [z('Positionierung freigegeben').due_on_alt, z('Positionierung freigegeben').due_on_neu], ['2026-09-03', '2026-09-17']);
  gleich('Launchtag auf den neuen VVK', z('Launch durchgeführt').due_on_neu, '2026-10-29');
  gleich('Rückblick 7 Tage danach', z('7-Tage-Rückblick').due_on_neu, '2026-11-05');
  gleich('Erledigtes wird nicht verschoben', z('Zielgruppen definiert'), undefined);
  gleich('23 von 24 Zeilen, alle geändert', [v.length, v.every(x => x.geaendert)], [23, true]);
  const FEST = [
    { event_id: 'e-fl', short_name: 'FLRD27', name: 'Fluidity 2027', sales_start_on: '2026-08-01' },
    { event_id: 'e-wm', short_name: 'WMRD27', name: 'Wilde Möhre Freude Edition 2027', sales_start_on: '2026-09-01' },
    { event_id: 'e-fam', short_name: 'FAMRD27', name: 'Malina, Morio & die Draußenbande 2027', sales_start_on: '2026-10-01' },
    { event_id: 'e-lus', short_name: 'LUSRD27', name: 'Lusatia 2027', sales_start_on: '2026-10-15' },
    { event_id: 'e-byn', short_name: 'BYNRD27', name: 'by nature 2027', sales_start_on: '2026-11-01' },
  ];
  const ab = L.abstaende(FEST, 'e-lus', '2026-10-29');
  gleich('Abstände, nächster zuerst: by nature 3 Tage davor', [ab[0].short_name, ab[0].tage, L.abstandWort(ab[0].tage)], ['BYNRD27', -3, '3 Tage davor']);
  gleich('Draußenbande 28 Tage danach', [ab[1].short_name, ab[1].tage, L.abstandWort(ab[1].tage)], ['FAMRD27', 28, '28 Tage danach']);
  gleich('Das eigene Festival fehlt in der Liste', ab.some(x => x.event_id === 'e-lus'), false);
  gleich('Ungültiges Datum: nichts', [L.vvkVerschieben(LUS, RW, 'bald').length, L.abstaende(FEST, 'e-lus', '').length], [0, 0]);
}

console.log('\n== 5. Reihenfolge, Kandidaten, Wörter ==');
{
  const r = L.reihenfolge(POOL).map(p => p.name);
  gleich('Team, dann Hilfe, dann GF', r, ['Antonia', 'Jessica', 'Christian', 'Nina', 'Agentur', 'Alexander Dettke', 'Lea Luce']);
  const l = L.last([], POOL, { heute: STICHTAG });
  gleich('Kandidaten für content: Feld passt, GF nicht ohne Schalter', L.kandidaten('content', POOL, { last: l }).map(p => p.name), ['Antonia', 'Nina', 'Agentur']);
  gleich('Mit GF-Schalter kommen Alex und Lea dazu', L.kandidaten('content', POOL, { last: l, mitGF: true }).map(p => p.name), ['Antonia', 'Nina', 'Agentur', 'Alexander Dettke', 'Lea Luce']);
  const gen = L.kandidaten('recht', POOL, { last: l, generatorArbeit: true });
  gleich('Generator-Arbeit: dazu alle mit eingetragener Zeit, ohne Überlast, ohne GF', gen.map(p => p.name), ['Antonia', 'Jessica', 'Nina']);
  gleich('Kandidat trägt seinen Grund', gen.find(p => p.name === 'Jessica').grund, 'Generator-Arbeit, hat Zeit');
  gleich('Status als Wort', ['not_started', 'in_progress', 'complete', 'blocked'].map(L.statusWort), ['offen', 'läuft', 'erledigt', 'blockiert']);
  gleich('Wort zurück in den Status', ['offen', 'läuft', 'erledigt'].map(L.statusAusWort), ['not_started', 'in_progress', 'complete']);
  gleich('Zuordnung als Wort', ['offen', 'vorschlag', 'bestaetigt', 'gesendet'].map(L.zuordnungWort), ['offen', 'Vorschlag', 'bestätigt', 'gesendet']);
  gleich('Spanne als Text', [L.spanne(3, 6, 'Std.'), L.spanne(4, 4, 'Std.'), L.spanne(0.5, 1)], ['3 bis 6 Std.', '4 Std.', '0,5 bis 1']);
  gleich('Versandweg: Externe ohne Konto Angebot, Externe mit Konto Aufgabe, Interne ohne Konto Notiz', [
    L.versandWeg(Object.assign({}, PERSONEN.agentur, { hat_asana: false })).weg,
    L.versandWeg(Object.assign({}, PERSONEN.christian, { hat_asana: true })).weg,
    L.versandWeg(Object.assign({}, PERSONEN.nina, { hat_asana: false })).weg,
    L.versandWeg(Object.assign({}, PERSONEN.jessica, { hat_asana: true })).weg,
    L.versandWeg(null).weg,
  ], ['angebot', 'aufgabe', 'notiz', 'aufgabe', 'keine']);
  gleich('istExtern gilt nur ohne Konto', [L.istExtern(Object.assign({}, PERSONEN.christian, { hat_asana: true })), L.istExtern(PERSONEN.agentur), L.istExtern(PERSONEN.nina)], [false, true, false]);
  gleich('Festivalname ohne Jahr', L.festivalKurz('Lusatia 2027'), 'Lusatia');
  /* Reinheit: dieselbe Eingabe, dasselbe Ergebnis, Eingabe unverändert. */
  const LUS = festival('lus', '2026-10-15', wer);
  const vorher = JSON.stringify(LUS);
  const a = L.kette(LUS, RW, { heute: STICHTAG }), b = L.kette(LUS, RW, { heute: STICHTAG });
  gleich('Reine Funktion: zweimal gleich, Eingabe unverändert', [JSON.stringify(a) === JSON.stringify(b), JSON.stringify(LUS) === vorher], [true, true]);
}

console.log(`\nLaunch-Logik: ${ok} in Ordnung, ${fehler} Befunde.`);
process.exit(fehler ? 1 : 0);
