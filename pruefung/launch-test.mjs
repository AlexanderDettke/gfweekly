/* Prüfung der Launch-Rechenlogik (V27 Phase B), ohne Browser und ohne Edge Function.
   Aufruf: node pruefung/launch-test.mjs
   Vier Fälle aus dem Auftrag: die Kette Lusatia, die Last einer Person über zwei Festivals,
   Hilfe mit Briefing, VVK verschieben. Dazu Reihenfolge, Kandidaten und Wörter.
   V28 (Saison, vier Fragen): drei Launches in sechs Wochen, Draußenbande nicht haltbar, Lusatia haltbar mit Puffer,
   Phase heute, Entscheidungen, Hebel, Bisher und Jetzt, Änderungen, Wochenplan.
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

console.log('\n== 6. Saison: Phase, Lage, Entscheidungen (V28) ==');
const PHASEN = [
  { key: 'p1', name: 'Abbau und Analyse', von: '2026-09-01', bis: '2026-10-15', herausforderung: 'Auswerten, ohne den Launch zu vergessen.' },
  { key: 'p2', name: 'Systembau, Launch und Formatpartner', von: '2026-10-01', bis: '2026-12-31', herausforderung: 'Drei Launches, Systembau und Kollektivsuche fallen in denselben Oktober.' },
  { key: 'p3', name: 'Kernteam-Planung', von: '2027-01-01', bis: '2027-03-31', herausforderung: 'x' },
  { key: 'p4', name: 'Onboarding', von: '2027-04-01', bis: '2027-06-30', herausforderung: 'x' },
  { key: 'p5', name: 'Aufbau und Produktion', von: '2027-07-01', bis: '2027-09-30', herausforderung: 'x' },
];
const FEST5 = [
  { plan_id: 'pl-fl', event_id: 'e-fl', short_name: 'FLRD27', name: 'Fluidity 2027', kurzname: 'Fluidity', sales_start_on: '2026-08-01', launch_type: 'campaign_boost', hinweise: [] },
  { plan_id: 'pl-wm', event_id: 'e-wm', short_name: 'WMRD27', name: 'Wilde Möhre Freude Edition 2027', kurzname: 'Wilde Möhre Freude Edition', sales_start_on: '2026-09-01', hinweise: [] },
  { plan_id: 'pl-fam', event_id: 'e-fam', short_name: 'FAMRD27', name: 'Malina, Morio & die Draußenbande 2027', kurzname: 'Draußenbande', sales_start_on: '2026-10-01', hinweise: ['Drei VVK-Termine kursieren: 01.10., 11.10., 01.12.'] },
  { plan_id: 'pl-lus', event_id: 'e-lus', short_name: 'LUSRD27', name: 'Lusatia 2027', kurzname: 'Lusatia', sales_start_on: '2026-10-15', hinweise: [] },
  { plan_id: 'pl-byn', event_id: 'e-byn', short_name: 'BYNRD27', name: 'by nature 2027', kurzname: 'by nature', sales_start_on: '2026-11-01', hinweise: ['Ob by nature 2027 stattfindet, ist offen.'] },
];
const BEREICHE = [['fv', 'Festivalverantwortung'], ['komm', 'Kommunikation'], ['content', 'Content'], ['ticket', 'Ticketing'], ['partner', 'Partner'], ['sys', 'Systeme'], ['recht', 'Recht'], ['gf', 'Geschäftsführung']].map(([key, name]) => ({ key, name }));
const bName = k => (BEREICHE.find(b => b.key === k) || {}).name || k;
const pName = id => (POOL.find(p => p.id === id) || {}).name || id;
/* Besetzung: Draußenbande ohne Festivalverantwortung, sonst Vorschlag; Wilde Möhre bestätigt. */
const BES = FEST5.flatMap(f => BEREICHE.map(b => { const pid = f.short_name === 'FAMRD27' && b.key === 'fv' ? null : wer({ bereich: b.key });
  return { event_id: f.event_id, bereich: b.key, person_id: pid, status: !pid ? 'offen' : f.short_name === 'WMRD27' ? 'bestaetigt' : 'vorschlag', quelle: 'Vorsortierung', notiz: !pid ? 'keine tragfähige Besetzung' : null }; }));
/* Meilensteine: Draußenbande ohne fv-Person, sonst wie oben; Fluidity und Möhre liegen zurück. */
const MS = {};
for (const f of FEST5) MS[f.short_name] = festival(f.short_name, f.sales_start_on, r => f.short_name === 'FAMRD27' && r.bereich === 'fv' ? null : wer(r)).map(m => Object.assign(m, { festival: f.short_name, event_id: f.event_id, plan_id: f.plan_id }));
const ALLE = Object.values(MS).flat();
const KETTEN = {}; for (const f of FEST5) KETTEN[f.short_name] = L.kette(MS[f.short_name], RW, { heute: STICHTAG });
{
  const ph = L.phaseHeute(PHASEN, STICHTAG);
  gleich('Am 01.10. laufen zwei Phasen, die jüngere ist die Phase der Lage', [ph.laufend.map(p => p.key), ph.aktuell.key, ph.naechste.key], [['p1', 'p2'], 'p2', 'p3']);
  gleich('Stand je Phase als Wort', ['p1', 'p2', 'p3', 'p5'].map(k => ph.je[k].stand), ['läuft aus', 'läuft', 'als Nächstes', 'später']);
  gleich('Analyse hat am 01.10. noch 14 Tage', ph.je.p1.tageBisEnde, 14);
  gleich('Am 30.09. läuft nur die Analyse, Systembau ist als Nächstes', [L.phaseHeute(PHASEN, '2026-09-30').aktuell.key, L.phaseHeute(PHASEN, '2026-09-30').naechste.key], ['p1', 'p2']);
  gleich('Im Februar läuft die Kernteam-Planung, Analyse ist vorbei', [L.phaseHeute(PHASEN, '2027-02-10').aktuell.key, L.phaseHeute(PHASEN, '2027-02-10').je.p1.stand], ['p3', 'vorbei']);

  gleich('Drei Launches in sechs Wochen ab 01.10.: Draußenbande, Lusatia, by nature', L.launchesBis(FEST5, STICHTAG, 42).map(f => f.short_name), ['FAMRD27', 'LUSRD27', 'BYNRD27']);
  gleich('Ab 02.10. sind es noch zwei', L.launchesBis(FEST5, '2026-10-02', 42).map(f => f.short_name), ['LUSRD27', 'BYNRD27']);
  const lage = L.saisonLage(FEST5, ALLE, BES, POOL, { heute: STICHTAG });
  gleich('Lage: drei Launches, Draußenbande ohne Festivalverantwortung, zwei nur Vorschlag', [lage.bald.length, lage.baldOhneFv.map(f => f.short_name), lage.baldNurVorschlag.map(f => f.short_name), lage.ohneFv.length], [3, ['FAMRD27'], ['LUSRD27', 'BYNRD27'], 1]);
  gleich('Offene Aufgaben bis Jahresende: alle mit Termin bis 31.12. (Abschluss-Auswertung der späten Festivals fällt raus)', lage.offeneBisJahresende, ALLE.filter(m => m.due_on <= '2026-12-31').length);
  gleich('Personen mit Zeit von allen im Pool: 4 von 7 (Christian, Agentur, Lea ohne Eintrag)', [lage.personenMitZeit, lage.poolGesamt], [4, 7]);
  const s = L.saisonLageSatz(lage, PHASEN[1]);
  gleich('Lagesatz nennt Launches mit Termin und die Festivalverantwortung', s.satz1,
    'In den nächsten sechs Wochen starten 3 Launches: Draußenbande (01.10.), Lusatia (15.10.) und by nature (01.11.). Bei Draußenbande ist die Festivalverantwortung nicht besetzt, bei Lusatia und by nature ist sie nur ein Vorschlag.');
  gleich('Zweiter Satz: die Herausforderung der Phase', s.satz2, 'Die Herausforderung der Phase „Systembau, Launch und Formatpartner“: Drei Launches, Systembau und Kollektivsuche fallen in denselben Oktober.');
  gleich('Ohne Launches im Fenster ein klarer Satz', L.saisonLageSatz(L.saisonLage(FEST5, ALLE, BES, POOL, { heute: '2027-01-10' }), null).satz1, 'In den nächsten sechs Wochen startet kein Launch.');

  const ent = L.entscheidungen(FEST5, BES, KETTEN, { heute: STICHTAG, bereich: bName });
  gleich('Entscheiden je Festival: Draußenbande offen, Termin, Daten; Lusatia Termin; by nature Daten', ent.map(e => e.festival + ':' + e.art), ['FAMRD27:besetzung', 'FAMRD27:termin', 'FAMRD27:daten', 'LUSRD27:termin', 'BYNRD27:daten']);
  gleich('Draußenbande: Festivalverantwortung offen mit Notiz', ent.find(e => e.art === 'besetzung').text, 'Draußenbande: Festivalverantwortung ist offen (keine tragfähige Besetzung).');
  gleich('Lusatia 15.10. ist nicht zu halten, machbar 21.10.', ent.filter(e => e.art === 'termin')[1].text, 'Lusatia: VVK-Start 15.10.2026 ist nach den Richtwerten nicht zu halten, machbar ist frühestens der 21.10.2026.');
  gleich('by nature (01.11.) liegt außerhalb der drei Wochen: kein Terminpunkt', ent.some(e => e.art === 'termin' && e.festival === 'BYNRD27'), false);
  /* Review-Runde 2, Befund 4: ein Festival ohne Besetzungszeilen ist in allen Bereichen offen. */
  const OHNE = [{ event_id: 'e-neu', short_name: 'NEU', kurzname: 'Neu', sales_start_on: '2027-03-01', hinweise: [] }];
  const entOhne = L.entscheidungen(OHNE, BES, {}, { heute: STICHTAG, bereich: bName, bereiche: BEREICHE.map(b => b.key) });
  gleich('Ohne Zeilen: acht offene Bereiche mit Hinweis „keine Besetzung eingetragen“', [entOhne.length, entOhne[0].text], [8, 'Neu: Festivalverantwortung ist offen (keine Besetzung eingetragen).']);
  gleich('Ohne opt.bereiche gelten die Bereiche aus der Besetzung', L.entscheidungen(OHNE, BES, {}, { heute: STICHTAG }).length, 8);
}

console.log('\n== 7. Saison: Kette, haltbar, Hebel, nächste Termine ==');
{
  const kk = L.kritischeKette(MS.LUSRD27, KETTEN.LUSRD27);
  gleich('Kritische Kette Lusatia: vier Meilensteine mit fertig-am', kk.map(k => [k.title, k.fertig]), [['Content produziert', '2026-10-14'], ['Hauptfilm freigegeben', '2026-10-19'], ['Launch-Checkliste vollständig', '2026-10-20'], ['Launch durchgeführt', '2026-10-21']]);
  gleich('Längste Kette rückwärts vom Launchtag', L.laengsteKette(MS.LUSRD27, RW, KETTEN.LUSRD27), ['Produktions-Briefing bereit', 'Shotliste bereit', 'Content produziert', 'Hauptfilm freigegeben', 'Launch-Checkliste vollständig', 'Launch durchgeführt']);

  const hFam = L.haltbar(FEST5[2], MS.FAMRD27, RW, KETTEN.FAMRD27, BES, { heute: STICHTAG });
  gleich('Draußenbande 01.10. nicht haltbar, frühestens 21.10., 20 Tage später', [hFam.haltbar, hFam.fruehester, hFam.puffer], [false, '2026-10-21', -20]);
  gleich('Ursachen: längste Kette, Festivalverantwortung, Aufgaben ohne Person, Überfälliges', hFam.ursachen, [
    'längste Kette über Produktions-Briefing bereit, Shotliste bereit, Content produziert, Hauptfilm freigegeben und Launch-Checkliste vollständig',
    'Festivalverantwortung nicht besetzt', '8 Aufgaben ohne Person', '19 überfällige Aufgaben']);
  gleich('Satz dazu, Termin unter Besetzungsvorbehalt', L.haltbarSatz(hFam), 'Launchziel 01.10.2026 ist nicht haltbar. Frühester machbarer Termin ist der 21.10.2026 (rechnerisch, unter Besetzungsvorbehalt), 20 Tage später. Ursache: längste Kette über Produktions-Briefing bereit, Shotliste bereit, Content produziert, Hauptfilm freigegeben und Launch-Checkliste vollständig, Festivalverantwortung nicht besetzt, 8 Aufgaben ohne Person und 19 überfällige Aufgaben.');
  const LUS_SPAET = Object.assign({}, FEST5[3], { sales_start_on: '2026-11-15' });
  const msSpaet = festival('lusx', '2026-11-15', wer);
  const kSpaet = L.kette(msSpaet, RW, { heute: STICHTAG });
  const hLus = L.haltbar(LUS_SPAET, msSpaet, RW, kSpaet, BES, { heute: STICHTAG });
  gleich('Lusatia mit VVK 15.11. haltbar, 25 Tage Puffer', [hLus.haltbar, hLus.fruehester, hLus.puffer], [true, '2026-10-21', 25]);
  gleich('Satz: rechnerisch haltbar mit Puffer, ohne Vorbehalt (alles besetzt)', [L.haltbarSatz(hLus), hLus.vorbehalte], ['Launchziel 15.11.2026 ist rechnerisch haltbar, mit 25 Tage Puffer.', []]);
  /* Review-Runde 1, Befund 4: haltbar darf nichts versprechen, wenn Verantwortung oder Aufgaben unbesetzt sind. */
  const msOffen = festival('lusy', '2026-11-15', r => r.bereich === 'fv' ? null : wer(r));
  const hOffen = L.haltbar(Object.assign({}, FEST5[2], { sales_start_on: '2026-11-15' }), msOffen, RW, L.kette(msOffen, RW, { heute: STICHTAG }), BES, { heute: STICHTAG });
  gleich('Rechnerisch haltbar, aber Festivalverantwortung und Aufgaben ohne Person als Vorbehalt', [hOffen.haltbar, hOffen.vorbehalte], [true, ['Festivalverantwortung nicht besetzt', '8 Aufgaben ohne Person']]);
  gleich('Satz nennt den Vorbehalt', L.haltbarSatz(hOffen), 'Launchziel 15.11.2026 ist rechnerisch haltbar, mit 25 Tage Puffer, aber Festivalverantwortung nicht besetzt und 8 Aufgaben ohne Person.');
  gleich('Ohne offenen Launchtag kein Urteil', L.haltbar(FEST5[3], [], RW, { je: {}, fruehesterVVK: null }, BES).haltbar, null);
  gleich('Satz ohne Ziel', L.haltbarSatz(L.haltbar({ event_id: 'x' }, [], RW, { je: {}, fruehesterVVK: null }, [])), 'Kein Launchziel eingetragen.');

  const hb = L.hebel(FEST5[3], MS.LUSRD27, POOL, FEST5, KETTEN.LUSRD27, { heute: STICHTAG, name: pName });
  gleich('Parallel: größter Generator-Anteil zuerst, an passende Felder ohne die Zuständige', [hb.parallel.liste[0].title, hb.parallel.liste[0].prozent, hb.parallel.liste[0].an.map(pName)], ['Content produziert', 50, ['Nina', 'Agentur']]);
  gleich('Parallel-Text nennt Anteil und Personen', hb.parallel.text.startsWith('Content produziert: 50 Prozent (8 bis 16 Std.) an Nina und Agentur'), true);
  gleich('Verschieben: 21.10., sechs Tage nach dem Ziel, by nature 11 Tage danach', hb.verschieben.text, 'Frühester machbarer Termin 21.10.2026, 6 Tage nach dem Ziel; der nächste Launch ist by nature (01.11.), 11 Tage später.');
  const hbFam = L.hebel(FEST5[2], MS.FAMRD27, POOL, FEST5, KETTEN.FAMRD27, { heute: STICHTAG, name: pName });
  gleich('Verschieben bei unbesetzten Aufgaben: Termin unter Besetzungsvorbehalt', hbFam.verschieben.text.startsWith('Rechnerisch frühester Termin (unter Besetzungsvorbehalt) 21.10.2026, 20 Tage nach dem Ziel'), true);
  gleich('Hilfe: niemand angehakt, Verfügbare mit „ab“', [hb.hilfe.angehakt, hb.hilfe.text], [[], 'Verfügbar: Christian, Nina (ab 10.10.) und Agentur.']);
  gleich('Entscheiden nur mit Auftrag', [hb.entscheiden, L.hebel(FEST5[4], MS.BYNRD27, POOL, FEST5, KETTEN.BYNRD27, { heute: STICHTAG, entscheiden: 'stattfindet oder 2027/28' }).entscheiden.text], [undefined, 'stattfindet oder 2027/28']);
  const mitHilfe = MS.LUSRD27.map(m => m.title === 'Content produziert' ? Object.assign({}, m, { hilfe_person_id: 'p-nina' }) : m);
  const hb2 = L.hebel(FEST5[3], mitHilfe, POOL, FEST5, KETTEN.LUSRD27, { heute: STICHTAG, name: pName });
  gleich('Angehakte Hilfe erscheint zuerst und fällt aus „verfügbar“', hb2.hilfe.text, 'Angehakt: Nina. Verfügbar: Christian und Agentur.');

  const nf = L.naechsteFaellig(MS.WMRD27, STICHTAG, 3);
  gleich('Wilde Möhre (VVK 01.09.): drei nächste fällige, kommende zuerst, dann das jüngste Überfällige', nf.liste.map(m => [m.title, m.due_on]), [['Kampagnen-Optimierung abgeschlossen', '2026-10-13'], ['Abschluss-Auswertung abgeschlossen', '2026-11-30'], ['7-Tage-Rückblick', '2026-09-08']]);
  gleich('… dazu die Zahl der überfälligen', [nf.ueberfaellig, nf.offen], [22, 24]);
}

console.log('\n== 8. Saison: Bisher und Jetzt, Änderungen, Wochenplan ==');
{
  const VORHER = [
    { bereich: 'fv', text: 'faktisch die GF', quelle: 'Rollen, Sommer 2026' }, { bereich: 'komm', text: 'Antonia (Newsletter, Social)', quelle: 'Rollen, Sommer 2026' },
    { bereich: 'content', text: 'Antonia allein', quelle: 'Rollen, Sommer 2026' }, { bereich: 'ticket', text: 'je Festival verschieden, Annie nur Fluidity', quelle: 'Rollen, Sommer 2026' },
    { bereich: 'partner', text: 'Lea (Kollektiv-Thread)', quelle: 'Rollen, Sommer 2026' }, { bereich: 'sys', text: 'verteilt, Tracking bei niemandem', quelle: 'Rollen, Sommer 2026' },
    { bereich: 'recht', text: 'Legal', quelle: 'Rollen, Sommer 2026' }, { bereich: 'gf', text: 'GF', quelle: 'Rollen, Sommer 2026' } ];
  const bj = L.bisherJetzt(VORHER, BES, FEST5, POOL, BEREICHE, { alias: { Legal: 'Lea Luce' } });
  const z = k => bj.find(x => x.key === k);
  gleich('Reihenfolge der Bereiche wie übergeben', bj.map(x => x.key), ['fv', 'komm', 'content', 'ticket', 'partner', 'sys', 'recht', 'gf']);
  gleich('Festivalverantwortung: je Festival, teils offen, Änderung „neu“ (bisher faktisch die GF)', [z('fv').jetztText, z('fv').statusWort, z('fv').aenderung], ['Fluidity: Jessica · Wilde Möhre Freude Edition: Jessica · Draußenbande: offen · Lusatia: Jessica · by nature: Jessica', 'teils offen', 'neu']);
  gleich('Content: überall Antonia, unverändert, Status teils bestätigt', [z('content').jetztText, z('content').statusWort, z('content').aenderung], ['Antonia', 'teils bestätigt', 'unverändert']);
  gleich('Kommunikation: jetzt Christian statt Antonia, geändert', [z('komm').jetztText, z('komm').aenderung], ['Christian', 'geändert']);
  gleich('Systeme: bisher verteilt, jetzt Christian, neu', z('sys').aenderung, 'neu');
  gleich('Recht: Legal ist per Alias Lea, unverändert', z('recht').aenderung, 'unverändert');
  gleich('GF: Alexander ist Typ gf, „GF“ im Bisher-Text passt', z('gf').aenderung, 'unverändert');
  gleich('Jedes Feld trägt Quelle und Notiz der Besetzung', [z('fv').jetzt[2].quelle, z('fv').jetzt[2].notiz], ['Vorsortierung', 'keine tragfähige Besetzung']);

  const LOG = [
    { at: '2026-10-01T09:00:00Z', who: 'Alex', what: 'launch_confirm', row_id: 'LUSRD27', detail: { bestaetigt: 12, besetzung: 7 } },
    { at: '2026-09-30T18:00:00Z', who: 'Lea', what: 'launch_set', row_id: 'FAMRD27', detail: { bereich: 'fv', person_id: 'p-jessica', meilensteine: 8 } },
    { at: '2026-09-30T17:00:00Z', who: 'Alex', what: 'launch_set', row_id: null, detail: { titel: 'Zielgruppen definiert', geaendert: ['status'] } },
    { at: '2026-09-30T16:00:00Z', who: 'Alex', what: 'launch_set', row_id: null, detail: { person: 'Antonia', patch: { launch_std_woche: 8 } } },
    { at: '2026-09-30T15:00:00Z', who: 'Alex', what: 'launch_set', row_id: 'LUSRD27', detail: { sales_start_on: { alt: '2026-10-15', neu: '2026-10-29' }, verschoben: 23 } },
    { at: '2026-09-30T14:00:00Z', who: 'Alex', what: 'launch_send', row_id: 'LUSRD27', detail: { projekt: '1', schritt: 'Projekt angelegt' } },
    { at: '2026-09-30T14:01:00Z', who: 'Alex', what: 'launch_send', row_id: 'LUSRD27', detail: { projekt: '1', neu: 12, aktualisiert: 0 } },
  ];
  const POOL2 = POOL.map(p => Object.assign({}, p, { created_at: p.id === 'p-nina' || p.id === 'p-agentur' ? '2026-09-30T12:00:00Z' : '2026-06-22T00:00:00Z' }));
  const ae = L.aenderungen(LOG, POOL2, { seit: '2026-09-30', name: pName, festival: s => (FEST5.find(f => f.short_name === s) || {}).kurzname, bereich: bName });
  gleich('Neueste zuerst, Protokoll und Pool gemischt', ae.map(a => a.datum + ' ' + a.art), ['2026-10-01 launch_confirm', '2026-09-30 launch_set', '2026-09-30 launch_set', '2026-09-30 launch_set', '2026-09-30 launch_set', '2026-09-30 launch_send', '2026-09-30 launch_send', '2026-09-30 pool', '2026-09-30 pool']);
  gleich('Sätze aus dem Protokoll', ae.slice(0, 7).map(a => a.text), [
    'Lusatia: 12 Zuordnungen und 7 Besetzungen bestätigt',
    'Draußenbande: Festivalverantwortung an Jessica, 8 Aufgaben nachgezogen',
    'Meilenstein „Zielgruppen definiert“: Stand geändert',
    'Antonia: Stunden je Woche auf 8',
    'Lusatia: VVK-Start von 15.10.2026 auf 29.10.2026, 23 Termine verschoben',
    'Lusatia: nach Asana gesendet, 12 neu, 0 aktualisiert',
    'Lusatia: Asana-Projekt angelegt']);
  gleich('Pool: neu mit Typ und „ab“', ae.slice(7).map(a => a.text).sort(), ['Agentur neu im Pool (Agentur)', 'Nina neu im Pool (Minijob), ab 10.10.2026']);
  /* Review-Runde 1, Befund 6: ein „ab“-Datum vor dem Stichtag gehört nicht in „seit dem Sommer“. */
  const POOL3 = POOL2.map(p => p.id === 'p-jessica' ? Object.assign({}, p, { verfuegbar_ab: '2026-02-01' }) : p.id === 'p-antonia' ? Object.assign({}, p, { verfuegbar_ab: '2026-10-20' }) : p);
  const ae3 = L.aenderungen([], POOL3, { seit: '2026-09-30', name: pName });
  gleich('„ab“ nur ab dem Stichtag: Antonia ja, Jessica (Februar) nein', ae3.map(a => a.text).sort(), ['Agentur neu im Pool (Agentur)', 'Antonia: ab 20.10.2026', 'Nina neu im Pool (Minijob), ab 10.10.2026']);
  const aeSync = L.aenderungen([
    { at: '2026-10-02T08:00:00Z', who: 'System', what: 'launch_sync', row_id: 'LUSRD27', detail: { titel: 'Shotliste bereit', patch: { status: 'complete', completed_on: '2026-10-02' } } },
    { at: '2026-10-02T08:00:01Z', who: 'System', what: 'launch_sync', row_id: 'LUSRD27', detail: { titel: 'Landingpage bereit', patch: { due_on: '2026-10-12', due_on_vorher: '2026-10-05' } } },
    { at: '2026-10-02T08:00:02Z', who: 'System', what: 'launch_sync', row_id: 'LUSRD27', detail: { titel: 'Content produziert', asana_gid: '77', text: '[asana:77] Content produziert: Antonia schreibt „Dreh verschoben“.' } },
  ], [], { festival: s => 'Lusatia' });
  gleich('Sync-Zeilen als Sätze: erledigt, Fälligkeit, Kommentar ohne Kennung', aeSync.map(a => a.text), ['Lusatia: Content produziert: Antonia schreibt „Dreh verschoben“.', 'Lusatia: „Landingpage bereit“ Fälligkeit in Asana auf 12.10.2026 (vorher 05.10.2026)', 'Lusatia: „Shotliste bereit“ in Asana erledigt am 02.10.2026']);
  gleich('Höchstens 30 Zeilen', L.aenderungen(Array.from({ length: 40 }, (_, i) => ({ at: '2026-09-30T00:00:' + String(i).padStart(2, '0') + 'Z', who: 'Alex', what: 'launch_confirm', row_id: 'LUSRD27', detail: {} })), [], {}).length, 30);

  const wp = L.wochenplan(ALLE, FEST5, { heute: STICHTAG, bis: '2026-12-31' });
  gleich('Wochen ab dem Montag der laufenden Woche, aufsteigend', [wp[0].montag, wp[0].sonntag, wp.every((w, i) => !i || w.montag > wp[i - 1].montag)], ['2026-09-28', '2026-10-04', true]);
  const w1 = wp[0];
  gleich('Erste Woche: Draußenbande (Launch, Rückblick), Lusatia (Content) und by nature (Briefing, Shotliste u. a.): drei Launches', [w1.festivals.map(f => f.short_name), w1.dreiLaunches], [['FAMRD27', 'LUSRD27', 'BYNRD27'], true]);
  gleich('Stunden als Mitte der Spanne, Summe je Woche', [w1.festivals.find(f => f.short_name === 'FAMRD27').anzahl, w1.stunden === Math.round(w1.festivals.reduce((a, f) => a + f.stunden, 0) * 10) / 10], [6, true]);
  gleich('Nichts nach dem 31.12. und nichts Erledigtes', wp.every(w => w.montag <= '2026-12-31'), true);
  gleich('Montag rechnet richtig (01.10.2026 ist ein Donnerstag)', [L.montag('2026-10-01'), L.montag('2026-10-05'), L.montag('2026-10-04')], ['2026-09-28', '2026-10-05', '2026-09-28']);

  /* Fenster nach Launches (Review-Runde 1, Befund 3): laufende und in 60 Tagen startende Launches ganz, spätere gar nicht. */
  const FEST6 = FEST5.concat([{ plan_id: 'pl-eg', event_id: 'e-eg', short_name: 'EGRD27', name: 'mit Freude eG 2027', kurzname: 'mit Freude eG', sales_start_on: '2026-12-15', hinweise: [] }]);
  const spaet = festival('eg', '2026-12-15', wer).map(m => Object.assign(m, { festival: 'EGRD27' }));
  const fenster = L.imFenster(ALLE.concat(spaet), STICHTAG, 60, FEST6);
  gleich('Fenster 60 Tage: Möhre (läuft) und by nature (01.11.) ganz drin, auch spätere Termine', [fenster.some(m => m.festival === 'WMRD27' && m.due_on < STICHTAG), fenster.some(m => m.festival === 'BYNRD27' && m.title === 'Abschluss-Auswertung abgeschlossen')], [true, true]);
  gleich('… ein Launch am 15.12. bleibt draußen, Erledigtes auch', [fenster.some(m => m.festival === 'EGRD27'), fenster.some(m => L.FERTIG.has(m.status))], [false, false]);
  gleich('Wörter: Liste, Tage, Anzahl', [L.listeWorte(['a']), L.listeWorte(['a', 'b']), L.listeWorte(['a', 'b', 'c']), L.tageWort(1), L.tageWort(-3), L.anzahlWort(1, 'Tag', 'Tage')], ['a', 'a und b', 'a, b und c', '1 Tag', '3 Tage', '1 Tag']);
}

console.log('\n== 9. Verteilen und starten (V29): Vorschau und Kalibrierung ==');
{
  /* Pool mit Konten: Jessica, Antonia, Christian (extern mit Konto), Alex ja; Nina (Minijob) und Agentur (extern) ohne Konto; Lea mit Konto. */
  const POOLK = POOL.map(p => Object.assign({}, p, { hat_asana: !['p-nina', 'p-agentur'].includes(p.id) }));
  const LUS = festival('lus', '2026-10-15', wer).map(m => Object.assign(m, { festival: 'LUSRD27', event_id: 'e-lus' }));
  byTitle(LUS, 'Content produziert').hilfe_person_id = 'p-nina';
  byTitle(LUS, 'Shotliste bereit').person_id = 'p-agentur';          // extern ohne Konto: Angebot beim Übergebenden
  byTitle(LUS, 'Social-Assets bereit').person_id = 'p-nina';         // Minijob ohne Konto: Notiz
  byTitle(LUS, 'Zielgruppen definiert').person_id = null;             // ohne Person
  Object.assign(byTitle(LUS, 'Launch-Termin bestätigt'), { status: 'complete' });
  byTitle(LUS, 'Landingpage bereit').asana_task_gid = '1200000000000099';
  const v = L.versandVorschau(LUS, POOLK, BES, FEST5[3]);
  gleich('Offen 23 (eine erledigt), 1 ohne Person, 2 ohne Konto (Nina als Zuständige und als Hilfe), 1 Angebot', [v.offen, v.ohnePerson.map(m => m.title), v.ohneKonto.map(m => [m.title, m.name]), v.angebot.map(m => [m.title, m.name, m.bei])],
    [23, ['Zielgruppen definiert'], [['Generator-Anteil (50 Prozent): Content produziert', 'Nina'], ['Social-Assets bereit', 'Nina']], [['Shotliste bereit', 'Agentur', 'Jessica']]]);
  gleich('Übergebender ist die Festivalverantwortung Jessica (intern, mit Konto)', v.uebergebender, 'Jessica');
  gleich('21 Aufgaben gehen an 4 Personen (die einzige Aufgabe von Alex ist erledigt), Jessica trägt die Angebotsaufgabe mit', [v.gesendet, v.personen.length, v.personen.find(p => p.name === 'Jessica').angebote], [21, 4, 1]);
  gleich('Je Person Anzahl und Stunden als Mitte: Antonia 3 Aufgaben (Briefing 4, Content 24 abzüglich Generator-Hälfte 12, Hauptfilm 9) = 25', [v.personen.find(p => p.name === 'Antonia').anzahl, v.personen.find(p => p.name === 'Antonia').stunden], [3, 25]);
  gleich('Nina ohne Konto bekommt keine Unteraufgabe; Unteraufgaben 0', [v.unteraufgaben, v.unteraufgabenListe.length], [0, 0]);
  /* Hilfe mit Konto: Unteraufgabe und Stunden bei der Hilfe, Angebot bei externer Hilfe ohne Konto beim Zuständigen. */
  const LUS2 = festival('lus2', '2026-10-15', wer).map(m => Object.assign(m, { festival: 'LUSRD27', event_id: 'e-lus' }));
  byTitle(LUS2, 'Content produziert').hilfe_person_id = 'p-christian';   // extern mit Konto
  byTitle(LUS2, 'Social-Assets bereit').hilfe_person_id = 'p-agentur';   // extern ohne Konto → Angebot bei Antonia
  const v2 = L.versandVorschau(LUS2, POOLK, BES, FEST5[3]);
  gleich('Christian bekommt eine Unteraufgabe mit 12 Std., Antonia ein Angebot für die Agentur (als Unteraufgabe gezählt)', [v2.personen.find(p => p.name === 'Christian').unteraufgaben, v2.personen.find(p => p.name === 'Christian').stunden - 12 >= 0, v2.unteraufgaben, v2.angebot.map(a => [a.name, a.bei]), v2.personen.find(p => p.name === 'Antonia').unteraufgaben], [1, true, 2, [['Agentur', 'Antonia']], 1]);
  gleich('Angebotssatz nennt den Empfänger je Angebot (hier Antonia, nicht die Übergebende Jessica)', L.versandVorschauSaetze(v2, FEST5[3]).find(x => x.startsWith('Externe ohne Konto')), 'Externe ohne Konto: Agentur. Dafür entsteht eine Angebotsaufgabe bei Antonia.');
  const LUS3 = festival('lus3', '2026-10-15', wer).map(m => Object.assign(m, { festival: 'LUSRD27', event_id: 'e-lus' }));
  byTitle(LUS3, 'Shotliste bereit').person_id = 'p-agentur'; byTitle(LUS3, 'Social-Assets bereit').hilfe_person_id = 'p-agentur';
  gleich('Zwei Empfänger von Angeboten mit Zahl', L.versandVorschauSaetze(L.versandVorschau(LUS3, POOLK, BES, FEST5[3]), FEST5[3]).find(x => x.startsWith('Externe ohne Konto')), 'Externe ohne Konto: Agentur. Dafür entstehen 2 Angebotsaufgaben bei Jessica (1) und Antonia (1).');
  gleich('Satz: Christian hat auch Hauptaufgaben, also 5 Personen, dazu 2 Unteraufgaben', [L.versandVorschauSaetze(v2, FEST5[3])[0].includes(' an 5 Personen: '), L.versandVorschauSaetze(v2, FEST5[3])[0].endsWith(' Dazu 2 Unteraufgaben für Generator-Anteile.')], [true, true]);
  /* Wer nur eine Unteraufgabe bekommt, zählt nicht bei „an m Personen“, sondern steht getrennt (Review V29, Runde 3, Befund 2). */
  const POOLN = POOLK.map(p => p.id === 'p-nina' ? Object.assign({}, p, { hat_asana: true }) : p);
  const LUS4 = festival('lus4', '2026-10-15', wer).map(m => Object.assign(m, { festival: 'LUSRD27', event_id: 'e-lus' }));
  byTitle(LUS4, 'Content produziert').hilfe_person_id = 'p-nina';
  const s4 = L.versandVorschauSaetze(L.versandVorschau(LUS4, POOLN, BES, FEST5[3]), FEST5[3])[0];
  gleich('Nina nur als Unteraufgaben-Empfängerin: 5 Personen, getrennt genannt', [s4.includes(' an 5 Personen: '), s4.endsWith(' Dazu 1 Unteraufgabe für Generator-Anteile, nur als Unteraufgabe bei Nina (1, 12 Std.).')], [true, true]);
  gleich('opt.alle zählt auch Erledigtes', L.versandVorschau(LUS, POOLK, BES, FEST5[3], { alle: true }).offen, 24);
  gleich('Eine wird aktualisiert (hat asana_task_gid), der Rest ist neu', [v.aktualisiert, v.neu], [1, 20]);
  gleich('Besetzung Lusatia ist Vorschlag, nicht bestätigt; 22 Zuordnungen würden mitbestätigt', [v.besetzungBestaetigt, v.zuBestaetigen], [false, 22]);
  const saetze = L.versandVorschauSaetze(v, FEST5[3]);
  gleich('Vorschau-Sätze: Personen, neu/aktualisiert, ohne Person, ohne Konto, Externe, Besetzung', saetze.length, 6);
  gleich('Erster Satz beginnt mit der Zählung', saetze[0].startsWith('Lusatia: 21 Aufgaben gehen an 4 Personen: '), true);
  gleich('Satz ohne Person nennt den Titel', saetze[2], '1 Aufgabe hat noch keine Person und wird nicht gesendet: Zielgruppen definiert.');
  gleich('Satz ohne Konto', saetze[3], 'Ohne Asana-Konto, bleiben als Notiz im Haus: Nina (2 Aufgaben).');
  gleich('Satz Externe', saetze[4], 'Externe ohne Konto: Agentur. Dafür entsteht eine Angebotsaufgabe bei Jessica.');
  gleich('Satz Besetzung', saetze[5], 'Die Besetzung ist noch nicht bestätigt; der Start bestätigt sie mit (22 Zuordnungen).');
  const WM = festival('wm', '2026-09-01', wer).map(m => Object.assign(m, { festival: 'WMRD27', event_id: 'e-wm', zuordnung_status: 'bestaetigt' }));
  const vWm = L.versandVorschau(WM, POOLK, BES, FEST5[1]);
  gleich('Wilde Möhre: Besetzung bestätigt, nichts mehr zu bestätigen', [vWm.besetzungBestaetigt, vWm.zuBestaetigen, L.versandVorschauSaetze(vWm, FEST5[1]).pop()], [true, 0, 'Die Besetzung des Festivals ist bestätigt.']);
  gleich('Leere Liste: nichts zu senden', L.versandVorschauSaetze(L.versandVorschau([], POOLK, BES, FEST5[3]), FEST5[3])[0], 'Lusatia: keine Aufgabe mit Person und Asana-Konto, es gibt nichts zu senden.');
  /* Fluidity: Festivalverantwortung extern (Slawik mit Konto) wäre kein Übergebender; ohne fv fällt es auf Alex. */
  const vFam = L.versandVorschau(MS.FAMRD27, POOLK, BES, FEST5[2]);
  gleich('Ohne Festivalverantwortung ist Alex der Übergebende', vFam.uebergebender, 'Alexander Dettke');

  /* Kalibrierung: Ist gegen Mitte je Titel. */
  const K = [
    { title: 'Content produziert', aufwand_lo: 16, aufwand_hi: 32, ist_stunden: 30 },
    { title: 'Content produziert', aufwand_lo: 16, aufwand_hi: 32, ist_stunden: 26 },
    { title: 'Shotliste bereit', aufwand_lo: 2, aufwand_hi: 4, ist_stunden: 3 },
    { title: 'Landingpage bereit', aufwand_lo: 8, aufwand_hi: 16, ist_stunden: 9.5 },
    { title: 'Newsletter bereit', aufwand_lo: 3, aufwand_hi: 5, ist_stunden: null },
    { title: 'Tracking getestet', aufwand_lo: 2, aufwand_hi: 4 },
  ];
  const k = L.kalibrierung(K);
  gleich('4 von 6 mit Ist-Stunden, 3 Titel', [k.mitIst, k.gesamt, k.titel], [4, 6, 3]);
  gleich('Content: Schnitt 28 gegen Mitte 24, 4 Std. über, 17 Prozent', [k.jeTitel['Content produziert'].n, k.jeTitel['Content produziert'].istSchnitt, k.jeTitel['Content produziert'].mitte, k.jeTitel['Content produziert'].abweichung, k.jeTitel['Content produziert'].prozent, k.jeTitel['Content produziert'].wort], [2, 28, 24, 4, 17, '4 Std. über dem Richtwert']);
  gleich('Shotliste trifft den Richtwert', k.jeTitel['Shotliste bereit'].wort, 'wie der Richtwert');
  gleich('Landingpage 2,5 unter', [k.jeTitel['Landingpage bereit'].abweichung, k.jeTitel['Landingpage bereit'].wort], [-2.5, '2,5 Std. unter dem Richtwert']);
  gleich('Satz für die Aufgabenzeile', L.kalibrierungSatz(k, 'Content produziert'), 'bisher im Schnitt 28 Std. (2 Ist-Werte, 4 Std. über dem Richtwert)');
  gleich('Ohne Ist-Werte kein Satz', [L.kalibrierungSatz(k, 'Newsletter bereit'), L.kalibrierung([]).mitIst], ['', 0]);
}

console.log(`\nLaunch-Logik: ${ok} in Ordnung, ${fehler} Befunde.`);
process.exit(fehler ? 1 : 0);
