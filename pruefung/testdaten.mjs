/* Testdaten für die Prüfläufe: dieselben Antworten für schirme.mjs (Schirme) und bedienung.mjs (Bedienung).
   Die Edge Function wird abgefangen, damit ohne Passwort geprüft werden kann. Die Daten sind erfunden,
   aber in Form und Feldern das, was v29 liefert. */
export const heute = new Date().toISOString().slice(0, 10);
export const tag = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
export const zeit = (n) => new Date(Date.now() + n * 86400000).toISOString();

export const THEMEN = [
  { id:'t1', title:'Vertrag mit dem Landkreis verlängern', context:'Der Vertrag läuft zum Jahresende aus.', short_description:'Verlängerung bis 2029 klären', priority:'hoch', status:'offen', kind:'einmalig', board_lane:'zu_besprechen', lane_order:1, owner:'Alex', next_action:'Termin mit dem Amt', relevance:'kritisch', gate:'gf', gate_frist:tag(5), gate_by:'lauf', created_by:'Alex', created_at:zeit(-20), updated_at:zeit(-2), archived:false, involved:'Lea', notes:'' },
  { id:'t2', title:'Shuttle für das Festival ausschreiben', context:'Drei Anbieter haben geantwortet.', short_description:'Anbieter wählen', priority:'mittel', status:'in_klaerung', kind:'einmalig', board_lane:'in_klaerung', lane_order:1, owner:'Lea', next_action:'Angebote vergleichen', relevance:'hoch', gate:'Lea', gate_frist:tag(12), gate_by:'Alex', created_by:'Lea', created_at:zeit(-14), updated_at:zeit(-1), archived:false },
  { id:'t3', title:'Wochenbrief an das Team', context:'Format steht.', short_description:'Jeden Freitag', priority:'niedrig', status:'offen', kind:'recurring', frequency:'woechentlich', board_lane:'zu_besprechen', lane_order:2, owner:'Alex', next_action:'Vorlage schreiben', relevance:'mittel', gate:'team', created_by:'Alex', created_at:zeit(-40), updated_at:zeit(-3), archived:false },
  { id:'t5', title:'Zeltwiese: Fläche und Lärmschutz klären', context:'Kam aus der Pressefrage.', short_description:'', priority:'hoch',
    status:'offen', kind:'einmalig', board_lane:'zu_besprechen', lane_order:3, owner:'Lea', next_action:'', relevance:'hoch',
    gate:'lea', gate_frist:tag(9), gate_by:'lauf', created_by:'Lea', created_at:zeit(-4), updated_at:zeit(-1), archived:false },
  { id:'t4', title:'Gastro-Partner für 2027 bestätigen', context:'Zusage mündlich da.', priority:'hoch', status:'erledigt', kind:'einmalig', board_lane:'entschieden', lane_order:1, owner:'Lea', decision:'Wir machen mit dem bisherigen Partner weiter.', next_action:'Vertrag schicken', relevance:'hoch', created_by:'Lea', created_at:zeit(-60), updated_at:zeit(-5), archived:false },
];
export const NEWS = [
  { id:'n1', kind:'ticker', title:'Amt meldet sich zum Vertrag', body:'Kurzer Anruf, Termin folgt.', source:'mail', source_title:'Mail vom Amt', source_url:'https://example.org/1', who:'Alex', strand:'habitate', happened_at:zeit(0), created_at:zeit(0), status:'neu' },
  { id:'n2', kind:'ticker', title:'Shuttle-Angebot eingegangen', body:'Drittes Angebot liegt vor.', source:'asana', who:'Lea', strand:'wwp', happened_at:zeit(-1), created_at:zeit(-1), status:'neu' },
  { id:'n3', kind:'kandidat', title:'Pressefrage zur Zeltwiese', body:'Lokalzeitung fragt nach der Fläche.', quote:'Wie viele Menschen passen auf die Wiese?', relevance:'hoch', source:'mail', source_title:'Mail der Redaktion', source_url:'https://example.org/2', who:'Alex', strand:'habitate', happened_at:zeit(-2), created_at:zeit(-2), status:'neu', gate:'gf', gate_by:'lauf', gate_frist:tag(3) },
  { id:'n4', kind:'kandidat', title:'Helferplanung beginnt', body:'Erste Anmeldungen liegen vor.', relevance:'mittel', source:'notiz', who:'Lea', strand:'habitate', happened_at:zeit(-3), created_at:zeit(-3), status:'neu' },
  { id:'n5', kind:'lage', strand:'habitate', title:'Lage Wilde Habitate', body:'Ruhige Woche, zwei Entscheidungen offen.', source:'plattform', happened_at:zeit(0), created_at:zeit(0), status:'neu' },
  { id:'n6', kind:'lage', strand:'wwp', title:'Lage Wild Wild Partner', body:'Zwei Partner haben sich bewegt.', source:'plattform', happened_at:zeit(0), created_at:zeit(0), status:'neu' },
  { id:'n7', kind:'ticker', title:'Besprechung mit dem Büro', body:'Termin am Donnerstag.', source:'kalender', who:'Alex,Lea', happened_at:zeit(2), created_at:zeit(-1), status:'neu' },
];
export const PHASEN = [
  { id:'p1', key:'planung', label:'Planung', months:[1,2,3], color_token:'accent', sort_order:1, hint:'Ziele setzen' },
  { id:'p2', key:'fruehbucher', label:'Frühbucher', months:[4,5,6], color_token:'pos', sort_order:2, hint:'Vorverkauf' },
  { id:'p3', key:'produktion', label:'Produktion', months:[7,8], color_token:'warn', sort_order:3, hint:'Aufbau' },
  { id:'p4', key:'verbesserung', label:'Verbesserung', months:[9,10,11,12], color_token:'info', sort_order:4, hint:'Nacharbeit' },
];
export const mon = (n) => new Date(Date.now() - n * 2592000000).toISOString().slice(0, 7);
export const TPA = { months:[mon(2),mon(1),mon(0)],
  dimensions:[ { key:'verlaesslichkeit', label:'Verlässlichkeit', sort:1 }, { key:'tempo', label:'Tempo', sort:2 },
               { key:'klarheit', label:'Klarheit', sort:3 }, { key:'naehe', label:'Nähe', sort:4 },
               { key:'initiative', label:'Initiative', sort:5 }, { key:'ruhe', label:'Ruhe', sort:6 } ],
  people:[
    { id:'alex', name:'Alex', initials:'AL', circle:'team', is_leader:true, role:'GF',
      evidence:{ total:9, stuetzt:6, neutral:2, schwaecht:1, proposals:0, months:{ [mon(2)]:{stuetzt:2,neutral:1,schwaecht:0}, [mon(1)]:{stuetzt:2,neutral:1,schwaecht:0}, [mon(0)]:{stuetzt:2,neutral:0,schwaecht:1} } },
      latest:{ assessed_at:tag(-20), scores:{ verlaesslichkeit:72, tempo:64, klarheit:70, naehe:66, initiative:75, ruhe:60 } },
      previous:{ assessed_at:tag(-60), scores:{ verlaesslichkeit:68, tempo:62, klarheit:66, naehe:64, initiative:70, ruhe:58 } },
      draft:null, last:{ text:'Hat den Vertrag sauber vorbereitet.', at:tag(-6), direction:'stuetzt' } },
    { id:'lea', name:'Lea', initials:'LE', circle:'team', is_leader:true, role:'GF',
      evidence:{ total:7, stuetzt:4, neutral:2, schwaecht:1, proposals:1, months:{ [mon(2)]:{stuetzt:1,neutral:1,schwaecht:0}, [mon(1)]:{stuetzt:2,neutral:0,schwaecht:1}, [mon(0)]:{stuetzt:1,neutral:1,schwaecht:0} } },
      latest:{ assessed_at:tag(-30), scores:{ verlaesslichkeit:70, tempo:68, klarheit:66, naehe:74, initiative:66, ruhe:64 } },
      previous:null,
      draft:{ assessed_at:tag(-4), scores:{ verlaesslichkeit:72, tempo:70, klarheit:68, naehe:75, initiative:68, ruhe:66 } },
      last:{ text:'Shuttle-Angebote zusammengetragen.', at:tag(-3), direction:'stuetzt' } } ] };

/* V24b · Vertretung: drei Abwesenheiten, damit alle drei Seiten etwas zu zeigen haben.
   A1 Lea geplant und lang (Übergabe), A2 Alex sofort und kurz mit test = true (Wache und die Marke Testdaten),
   A3 Alex in Rückkehr. Nur A2 trägt test = true, sonst blieben die Blöcke auf „Für dich“ leer,
   denn dort werden Testabwesenheiten zu Recht nicht gezeigt. */
export const A1 = { id:'abs-1', person:'Lea', von:tag(14), bis:tag(34), bis_geschaetzt:null, art:'geplant', kontakt:'wochenbrief',
  kanal:'Signal, nur Notfall', gespraech_zeit:null, vertretung_standard:'Alex', stufe:'lang', status:'geplant', test:false,
  note:null, note_rueckkehr:null, created_by:'Alex', created_at:zeit(-1), updated_at:zeit(-1) };
export const A2 = { id:'abs-2', person:'Alex', korb_truncated:true, korb_abgeschnitten:'Kandidaten',
  von:heute, bis:null, bis_geschaetzt:tag(2), art:'sofort', kontakt:'keiner',
  kanal:null, gespraech_zeit:null, vertretung_standard:'Lea', stufe:'kurz', status:'aktiv', test:true,
  note:'aus dem Kalender', note_rueckkehr:null, created_by:'Lea', created_at:zeit(0), updated_at:zeit(0) };
export const A3 = { id:'abs-3', person:'Alex', asana_project_gid:'1200000000000000', asana_synced_at:null, von:tag(-20), bis:tag(-1), bis_geschaetzt:null, art:'geplant', kontakt:'wochenbrief',
  kanal:null, gespraech_zeit:null, vertretung_standard:'Lea', stufe:'lang', status:'rueckkehr', test:false, note:null,
  note_rueckkehr:'Seit '+tag(-20)+' bis '+tag(-1)+':\n2 Entscheidungen in Vertretung\n1 Weitergabe\n1 erledigter Punkt\n2 Punkte warten auf dich',
  created_by:'Alex', created_at:zeit(-21), updated_at:zeit(-1) };

export const korbZeile = (o) => ({ id:o.id, absence_id:o.absence_id, kind:o.kind||'thema', ref_id:o.ref_id||('t'+o.id),
  title:o.title, strand:o.strand||null, frist:o.frist||null, z:o.z, f:o.f, u:o.u, g:o.g, score:o.z+o.f+o.u+o.g,
  dringend:o.z>=2, wichtig:(o.f+o.g)>=3, quadrant:o.quadrant, cluster:o.cluster, ampel:o.ampel,
  vertretung:o.vertretung||null, regel_note:o.regel_note||null, begruendung:o.begruendung,
  dossier:o.dossier||{ stand:o.stand||null, naechster_schritt:o.schritt||null }, luecke:!!o.luecke,
  status:o.status||'vorschlag', by:'lauf', asana_gid:o.asana_gid||null, asana_section:null, created_at:zeit(-1), updated_at:zeit(-1) });

export const KORB_SAAT = {
  'abs-1': [
    /* V31d: eine Vorhaben-Zeile, schon bestätigt (Vertretung Alex), damit Übergabe und Dialog sie zeigen. */
    korbZeile({ id:'hv1', absence_id:'abs-1', kind:'vorhaben', ref_id:'vh-xceed', title:'XCeed Ticketing-Vertrag', frist:tag(10), z:2,f:3,u:0,g:2,
      quadrant:'sofort', cluster:'E', ampel:'gelb', vertretung:'Alex', status:'bestaetigt',
      dossier:{ art:'vorhaben', slug:'xceed', stand:'Alles verhandelt bis auf Bürgschaftstext.', naechster_schritt:'Bürgschaftstext an XCeed senden', ball:'Lea', konflikt:null,
        punkte_offen:[{ titel:'Bürgschaftstext auf Deutsch', stand:'in Arbeit', wer:'Niclaas', frist:tag(1) }], verlauf:[{ happened_at:zeit(-1), art:'telefon', wer:'Alex mit Victor', text:'Auszahlung ab Monat 1 mündlich zugesagt.' }] },
      begruendung:'Zur anderen GF, weil Geld ab 5.000 € im Spiel ist (Z2 F3 U0 G2).' }),
    korbZeile({ id:'h1', absence_id:'abs-1', ref_id:'t1', title:'Vertrag mit dem Landkreis verlängern', frist:tag(3), z:3,f:3,u:2,g:3,
      quadrant:'sofort', cluster:'A', ampel:'vorher', luecke:true, begruendung:'Vor Abreise, weil die Frist vor der Abreise liegt; Sache der GF; Stand und nächster Schritt fehlen (Z3 F3 U2 G3).' }),
    korbZeile({ id:'h2', absence_id:'abs-1', ref_id:'t2', title:'Shuttle für das Festival ausschreiben', frist:tag(18), z:2,f:2,u:1,g:2,
      quadrant:'sofort', cluster:'C', ampel:'gelb', vertretung:'Alex', regel_note:'Lange Abwesenheit: ab Tag 15 entscheidet die Vertretung gelbe Punkte ohne Einspruchsfrist.',
      stand:'Drei Anbieter haben geantwortet.', schritt:'Angebote vergleichen',
      begruendung:'Übergeben mit Rückfrage, weil die Frist in die Abwesenheit fällt; Partnerstrang (Z2 F2 U1 G2).' }),
    korbZeile({ id:'h3', absence_id:'abs-1', kind:'partner', title:'Partner A', strand:'wwp', frist:tag(20), z:2,f:2,u:0,g:2,
      quadrant:'sofort', cluster:'C', ampel:'gelb', vertretung:'Alex', stand:'Gespräch lief gut.', schritt:'Angebot schicken',
      begruendung:'Übergeben mit Rückfrage, weil die Frist in die Abwesenheit fällt; Partnergespräch in der Phase negotiation (Z2 F2 U0 G2).' }),
    korbZeile({ id:'h4', absence_id:'abs-1', ref_id:'t3', title:'Wochenbrief an das Team', frist:tag(3), z:2,f:1,u:0,g:1,
      quadrant:'delegieren', cluster:'B', ampel:'gruen', vertretung:'Alex', stand:'Format steht.', schritt:'Vorlage schreiben',
      begruendung:'Übergeben mit Vollmacht, weil die Frist in die Abwesenheit fällt; das Team hängt daran (Z2 F1 U0 G1).' }),
    korbZeile({ id:'h5', absence_id:'abs-1', kind:'kandidat', ref_id:'n3', title:'Pressefrage zur Zeltwiese', frist:tag(16), z:2,f:3,u:2,g:1,
      quadrant:'sofort', cluster:'E', ampel:'rot', luecke:true,
      begruendung:'Zur anderen GF, weil die Frist in die Abwesenheit fällt; Sache der GF (Stichwort Presse); Stand fehlt (Z2 F3 U2 G1).' }),
    korbZeile({ id:'h6', absence_id:'abs-1', kind:'meilenstein', title:'Vorverkauf startet', frist:tag(40), z:1,f:2,u:1,g:0,
      quadrant:'warten', cluster:'D', ampel:'ruht', stand:'Termin steht im Jahresplan.',
      begruendung:'Ruht bis zur Rückkehr, weil die Frist nach der Rückkehr liegt (Z1 F2 U1 G0).' }),
    korbZeile({ id:'h7', absence_id:'abs-1', kind:'ritual', title:'Rückblick schreiben', z:0,f:0,u:1,g:0,
      quadrant:'warten', cluster:'D', ampel:'ruht', status:'bestaetigt',
      begruendung:'Ruht bis zur Rückkehr, weil keine Frist gesetzt ist (Z0 F0 U1 G0).' }),
  ],
  'abs-2': [
    korbZeile({ id:'h8', absence_id:'abs-2', title:'Klage der Nachbarn beantworten', frist:tag(1), z:3,f:3,u:2,g:3,
      quadrant:'sofort', cluster:'A', ampel:'rot', luecke:true,
      begruendung:'Vor Abreise, weil die Frist überfällig ist; Sache der GF (Stichwort Klage) (Z3 F3 U2 G3).' }),
    korbZeile({ id:'h9', absence_id:'abs-2', title:'Newsletter freigeben', frist:tag(2), z:2,f:1,u:0,g:1,
      quadrant:'delegieren', cluster:'D', ampel:'ruht', regel_note:'Kurze Abwesenheit: nichts wird umgehängt, die Wache zeigt nur Fristen.',
      stand:'Entwurf steht.', schritt:'Freigabe klicken',
      begruendung:'Ruht bis zur Rückkehr, weil die Abwesenheit kurz ist (Z2 F1 U0 G1).' }),
  ],
  'abs-3': [
    korbZeile({ id:'h10', absence_id:'abs-3', title:'Bankvollmacht erneuern', frist:tag(-2), z:3,f:3,u:3,g:1,
      quadrant:'sofort', cluster:'A', ampel:'rot', luecke:true, status:'bestaetigt', asana_gid:'1200000000000001',
      begruendung:'Zur anderen GF, weil die Frist überfällig ist; gebunden an die Person (Vollmacht) (Z3 F3 U3 G1).' }),
    korbZeile({ id:'h11', absence_id:'abs-3', kind:'meilenstein', title:'Aufbau beginnt', frist:tag(30), z:0,f:2,u:1,g:0,
      quadrant:'warten', cluster:'D', ampel:'ruht', status:'bestaetigt',
      begruendung:'Ruht bis zur Rückkehr, weil die Frist weit hinter der Rückkehr liegt (Z0 F2 U1 G0).' }),
  ],
};
/* Die Testdaten merken sich, was geschrieben wurde. Sonst käme eine bestätigte Zeile beim nächsten Lesen
   wieder als Vorschlag zurück, und die Probe „die Zeile verlässt die Ansicht“ wäre wertlos.
   zuruecksetzen() stellt den Saatstand wieder her; die Bedienprüfung ruft das vor jedem Fall. */
export let KORB = JSON.parse(JSON.stringify(KORB_SAAT));
export let NEUE = [];
export function zuruecksetzen(){ KORB = JSON.parse(JSON.stringify(KORB_SAAT)); NEUE = []; if (typeof vhZuruecksetzen === 'function') vhZuruecksetzen(); }
const zeileVon = (id) => Object.values(KORB).flat().find(r => r.id === id);
const vorgangVon = (z) => z && z.kind === 'thema'
  ? { id:z.ref_id, gate: z.vertretung ? 'alex' : 'lea', owner_backup: z.vertretung || null } : null;

export const zaehleKorb = (rows) => {
  const z = (feld) => rows.reduce((a,r)=>{ const k=r[feld]||'offen'; a[k]=(a[k]||0)+1; return a; },{});
  const ohne = rows.filter(r=>!r.luecke).length;
  return { quadrant:z('quadrant'), cluster:z('cluster'), ampel:z('ampel'), status:z('status'),
    luecken:rows.filter(r=>r.luecke).length, gesamt:rows.length,
    uebernahmefaehigkeit: rows.length ? Math.round(ohne/rows.length*100) : null };
};
export const PROTOKOLL = {
  'abs-3': [
    { id:'l1', absence_id:'abs-3', handover_id:'h10', at:zeit(-5), who:'Lea', art:'entscheidung', text:'Bankvollmacht: Termin auf nach der Rückkehr gelegt.' },
    { id:'l2', absence_id:'abs-3', handover_id:null, at:zeit(-7), who:'Lea', art:'weitergabe', text:'Shuttle-Angebote: geht an Merle.' },
    { id:'l3', absence_id:'abs-3', handover_id:null, at:zeit(-9), who:'Lea', art:'erledigt', text:'Newsletter freigegeben.' },
    { id:'l4', absence_id:'abs-3', handover_id:null, at:zeit(-12), who:'Lea', art:'entscheidung', text:'Gastro-Partner bestätigt.' },
  ],
};

/* V27 Phase B · Launch verteilen: fünf Festivals, zehn Richtwerte, ein kleiner Pool. Termine relativ zu heute,
   damit die Seite immer etwas Offenes, etwas Laufendes und etwas Erledigtes zeigt. */
export const LAUNCH_BEREICHE = [
  { key:'fv', name:'Festivalverantwortung', beschreibung:'Trägt das Ergebnis', sort_order:1 }, { key:'gf', name:'Geschäftsführung', beschreibung:'Entscheidungen der GF', sort_order:2 },
  { key:'komm', name:'Kommunikation', beschreibung:'Website, Newsletter, Ads', sort_order:3 }, { key:'content', name:'Content', beschreibung:'Film, Fotos, Social', sort_order:4 },
  { key:'ticket', name:'Ticketing', beschreibung:'Ticketmodell, Shop', sort_order:5 }, { key:'formatpartner', name:'Formatpartner', beschreibung:'Formatpartner, Partnerpaket', sort_order:6 }, { key:'kollektive', name:'Kollektive', beschreibung:'Kollektive auswählen und einbinden', sort_order:7 },
  { key:'sys', name:'Systeme', beschreibung:'Tracking, Technik', sort_order:8 }, { key:'recht', name:'Recht', beschreibung:'Rechte, Verträge', sort_order:9 },
  { key:'partner', name:'Partner (alt, entfällt)', beschreibung:'abgelöst am 02.10.2026', sort_order:99 } ];
export const LAUNCH_RICHTWERTE = [
  ['Launch-Termin bestätigt', 'strategy', 'gf', 0.5, 1, 1, 0, -56, [], 'Entscheidung GF'],
  ['Positionierung freigegeben', 'strategy', 'fv', 4, 8, 5, 0, -42, [], null],
  ['Kernbotschaft freigegeben', 'strategy', 'fv', 3, 6, 3, 0.3, -35, ['Positionierung freigegeben'], 'Entwürfe mit Generatoren'],
  ['Ticketmodell vollständig', 'ticketing', 'ticket', 3, 6, 3, 0, -35, [], null],
  ['Produktions-Briefing bereit', 'content', 'content', 3, 5, 2, 0.3, -35, [], null],
  ['Content produziert', 'content', 'content', 16, 32, 10, 0.5, -14, ['Produktions-Briefing bereit'], 'Kurzclips mit Generatoren'],
  ['Landingpage bereit', 'website', 'komm', 8, 16, 7, 0.4, -10, ['Kernbotschaft freigegeben'], null],
  ['Partnerpaket bereit', 'partners', 'formatpartner', 4, 8, 10, 0.3, -7, ['Kernbotschaft freigegeben'], 'Warten auf Partner'],
  ['Bild-, Musik- und Persönlichkeitsrechte geklärt', 'legal', 'recht', 2, 4, 7, 0, -10, [], null],
  ['Tracking getestet', 'tracking', 'sys', 2, 4, 2, 0, -3, ['Landingpage bereit'], null],
  ['Launch durchgeführt', 'operations', 'fv', 6, 10, 1, 0, 0, ['Landingpage bereit', 'Tracking getestet', 'Content produziert', 'Partnerpaket bereit'], 'Launchtag'],
].map(([title, category, bereich, lo, hi, dauer, g, off, vorg, hinweis]) => ({ title, category, bereich, aufwand_lo: lo, aufwand_hi: hi, dauer_tage: dauer, generator_anteil: g, vvk_offset_tage: off, vorgaenger: vorg, hinweis, quelle: 'Richtwert Claude 30.09.2026, Kalibrierung über Ist-Stunden' }));
export const LAUNCH_POOL = [
  { id:'a', name:'Alex', typ:'gf', felder:['gf','fv'], generator:true, launch_std_woche:6, verfuegbar_ab:null, briefing_std:0, stundensatz:null, hat_asana:true, active:true, assignable:true, sort_order:1 },
  { id:'l', name:'Lea', typ:'gf', felder:['gf','recht','ticket'], generator:true, launch_std_woche:null, verfuegbar_ab:null, briefing_std:0, stundensatz:null, hat_asana:true, active:true, assignable:true, sort_order:2 },
  { id:'m', name:'Merle', typ:'team', felder:['fv','formatpartner','kollektive'], generator:true, launch_std_woche:10, verfuegbar_ab:null, briefing_std:0, stundensatz:null, hat_asana:true, active:true, assignable:true, sort_order:3 },
  { id:'t', name:'Tim', typ:'team', felder:['komm','content'], generator:true, launch_std_woche:4, verfuegbar_ab:null, briefing_std:0, stundensatz:null, hat_asana:true, active:true, assignable:true, sort_order:4 },
  { id:'c', name:'Christoph', typ:'extern', felder:['komm','sys'], generator:true, launch_std_woche:null, verfuegbar_ab:null, briefing_std:2, stundensatz:null, hat_asana:true, active:true, assignable:true, sort_order:5 },
  { id:'n', name:'Nora', typ:'minijob', felder:['content'], generator:true, launch_std_woche:5, verfuegbar_ab:tag(9), briefing_std:2, stundensatz:null, hat_asana:false, active:true, assignable:true, sort_order:6 },
  { id:'g', name:'Agentur Nord', typ:'agentur', felder:['content'], generator:true, launch_std_woche:null, verfuegbar_ab:null, briefing_std:3, stundensatz:60, hat_asana:false, active:true, assignable:true, sort_order:7 },
  { id:'k', name:'Kollektiv Ost', typ:'partner', felder:['formatpartner','kollektive','fv'], generator:false, launch_std_woche:null, verfuegbar_ab:null, briefing_std:3, stundensatz:null, hat_asana:false, active:true, assignable:true, sort_order:8 },
];
export const LAUNCH_FESTIVALS = [
  { plan_id:'pl-fl', event_id:'ev-fl', name:'Fluidity 2027', kurzname:'Fluidity', short_name:'FLRD27', sales_start_on:tag(-60), launch_type:'campaign_boost', plan_status:'active', hinweise:[] },
  { plan_id:'pl-wm', event_id:'ev-wm', name:'Wilde Möhre Freude Edition 2027', kurzname:'Wilde Möhre Freude Edition', short_name:'WMRD27', sales_start_on:tag(-30), launch_type:'presale_launch', plan_status:'active', hinweise:[] },
  { plan_id:'pl-fam', event_id:'ev-fam', name:'Malina, Morio & die Draußenbande 2027', kurzname:'Malina, Morio & die Draußenbande', short_name:'FAMRD27', sales_start_on:tag(1), launch_type:'first_launch', plan_status:'active', hinweise:['Für die Draußenbande kursieren drei VVK-Termine: 01.10., 11.10. und 01.12. Welcher gilt, ist nicht entschieden.'] },
  { plan_id:'pl-lus', event_id:'ev-lus', name:'Lusatia 2027', kurzname:'Lusatia', short_name:'LUSRD27', sales_start_on:tag(14), launch_type:'relaunch', plan_status:'active', hinweise:[] },
  { plan_id:'pl-byn', event_id:'ev-byn', name:'by nature 2027', kurzname:'by nature', short_name:'BYNRD27', sales_start_on:tag(31), launch_type:'first_launch', plan_status:'active', hinweise:['Ob by nature 2027 stattfindet, ist als Vorhaben offen.'] },
];
const LAUNCH_WER = { fv:{ 'ev-fl':'c', 'ev-wm':'a', 'ev-fam':null, 'ev-lus':'m', 'ev-byn':'m' }, gf:'a', komm:'c', content:'t', ticket:'l', formatpartner:'m', kollektive:'m', sys:'c', recht:'l', partner:null };
export const LAUNCH_BESETZUNG = LAUNCH_FESTIVALS.flatMap(f => LAUNCH_BEREICHE.filter(b => b.sort_order < 99).map(b => {
  const w = typeof LAUNCH_WER[b.key] === 'object' ? LAUNCH_WER[b.key][f.event_id] : LAUNCH_WER[b.key];
  return { id:`b-${f.short_name}-${b.key}`, event_id:f.event_id, bereich:b.key, person_id:w || null, status:w ? (f.short_name === 'WMRD27' ? 'bestaetigt' : 'vorschlag') : 'offen',
    quelle:'Vorsortierung', notiz: !w ? 'keine tragfähige Besetzung' : null, bestaetigt_von: f.short_name === 'WMRD27' && w ? 'Alex' : null, bestaetigt_am: null }; }));
export const LAUNCH_MEILENSTEINE = LAUNCH_FESTIVALS.flatMap(f => LAUNCH_RICHTWERTE.map((r, i) => {
  const b = LAUNCH_BESETZUNG.find(x => x.event_id === f.event_id && x.bereich === r.bereich);
  const due = f.launch_type === 'campaign_boost' ? null : tag(0) && (() => { const d = new Date(f.sales_start_on + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + r.vvk_offset_tage); return d.toISOString().slice(0, 10); })();
  const vergangen = due && due < heute;
  const status = f.short_name === 'WMRD27' ? 'complete' : (vergangen && i % 3 === 0 ? 'complete' : (vergangen && i % 3 === 1 ? 'in_progress' : 'not_started'));
  const zu = f.short_name === 'WMRD27' ? 'gesendet' : (b && b.person_id ? 'vorschlag' : 'offen');
  return { id:`m-${f.short_name}-${i}`, plan_id:f.plan_id, event_id:f.event_id, festival:f.short_name, title:r.title, category:r.category, status, due_on:due, due_on_vorher: f.short_name === 'LUSRD27' && due ? tag(-13 + r.vvk_offset_tage) : null,
    bereich:r.bereich, person_id: b ? b.person_id : null, hilfe_person_id: r.title === 'Content produziert' && f.short_name === 'LUSRD27' ? 'n' : null, zuordnung_status: zu,
    aufwand_lo:r.aufwand_lo, aufwand_hi:r.aufwand_hi, dauer_tage:r.dauer_tage, generator_anteil:r.generator_anteil, responsible: zu === 'gesendet' && b ? LAUNCH_POOL.find(p => p.id === b.person_id)?.name : null,
    asana_task_gid: zu === 'gesendet' ? '120000000000' + i : null, ist_stunden: status === 'complete' && i % 2 === 0 ? r.aufwand_lo + i : null, completed_on: status === 'complete' ? (due || tag(-20)) : null, sort_order:i, notes: r.title === 'Launch durchgeführt' ? 'Launchtag' : null, depends_on:null };
}));
/* V28 · Saison: Besetzung „bisher“ (Stand Sommer 2026), Launch-Protokoll und created_at im Pool (Nora und die Agentur sind neu). */
export const LAUNCH_VORHER = [
  ['fv','faktisch die GF'],['komm','Antonia (Newsletter, Social)'],['content','Antonia allein'],['ticket','je Festival verschieden, Annie nur Fluidity'],
  ['formatpartner','Lea (Kollektiv-Thread)'],['kollektive','Lea (Kollektiv-Thread)'],['sys','verteilt, Tracking bei niemandem'],['recht','Legal'],['gf','GF'],
].map(([bereich, text], i) => ({ bereich, text, quelle:'Rollen in Pool, TPA und Coda, Stand Sommer 2026', sort_order:i + 1 }));
export const LAUNCH_LOG = [
  { at:zeit(-0.2), who:'Alex', what:'launch_confirm', row_id:'WMRD27', item_id:null, detail:{ bestaetigt:8, besetzung:7, offen:0, fehler:[] } },
  { at:zeit(-0.5), who:'Lea', what:'launch_set', row_id:'LUSRD27', item_id:null, detail:{ bereich:'content', person_id:'t', meilensteine:4 } },
  { at:zeit(-1), who:'Alex', what:'launch_set', row_id:null, item_id:'m-LUSRD27-2', detail:{ titel:'Ticketmodell vollständig', geaendert:['status'], patch:{ status:'in_progress' } } },
  { at:zeit(-1.2), who:'Alex', what:'launch_set', row_id:null, item_id:null, detail:{ person:'Merle', patch:{ launch_std_woche:10 } } },
  { at:zeit(-2), who:'Alex', what:'launch_send', row_id:'WMRD27', item_id:null, detail:{ projekt:'1200000000000001', url:'https://app.asana.com/0/1200000000000001', neu:8, aktualisiert:0, unteraufgaben:1, angebot:[], ohne_konto:[], fehler:[], empfaenger:{ Alex:3, Merle:2, Tim:1, Christoph:1, Lea:1 } } },
];
for (const p of LAUNCH_POOL) p.created_at = (p.id === 'n' || p.id === 'g') ? zeit(-1) : zeit(-100);
/* V29: Stand des Rückwegs aus Asana, wie launch_list ihn liefert. */
export const LAUNCH_SYNC = { automatisch:false, synced_at:zeit(-0.02), aeltester:zeit(-0.03), plaene:[], uebersprungen:'' , geprueft:8, erledigt:1, faelligkeit:0, kommentare:2, fehler:0 };
LAUNCH_LOG.unshift({ at:zeit(-0.02), who:'System', what:'launch_sync', row_id:'WMRD27', item_id:'m-WMRD27-0', detail:{ titel:'Launch-Termin bestätigt', asana_gid:'9001', asana_task_gid:'1200000000000', text:'[asana:9001] Launch-Termin bestätigt: Alex schreibt „Termin steht“.' } });
export const LAUNCH_LIST = { festivals: LAUNCH_FESTIVALS, meilensteine: LAUNCH_MEILENSTEINE, besetzung: LAUNCH_BESETZUNG, pool: LAUNCH_POOL,
  richtwerte: LAUNCH_RICHTWERTE, bereiche: LAUNCH_BEREICHE, last: [], vorher: LAUNCH_VORHER, log: LAUNCH_LOG, sync: LAUNCH_SYNC, asanaConfigured: true, heute };

export const ANTWORT = {
  ping: { ok:true, version:37 },
  launch_list: () => LAUNCH_LIST,
  launch_confirm: (p) => ({ ok:true, von:p.by||'Alex', bestaetigt:3, besetzung:2, offen:1, fehler:[] }),
  launch_sync: () => Object.assign({ ok:true }, LAUNCH_SYNC, { laeufe:5 }),
  launch_send: () => ({ ok:true, projekt:'1200000000000001', url:'https://app.asana.com/0/1200000000000001', neu:4, aktualisiert:0, unteraufgaben:1, angebot:['Landingpage bereit → Christoph, Aufgabe bei Merle'], ohne_konto:[], fehler:[] }),
  people_list: { people:[
    { id:'a', name:'Alex', email:'alex@example.org', role:'GF', team:'GF', active:true, assignable:true, sort_order:1 },
    { id:'l', name:'Lea', email:'lea@example.org', role:'GF', team:'GF', active:true, assignable:true, sort_order:2 },
    { id:'m', name:'Merle', email:'merle@example.org', role:'Büro', team:'Team', active:true, assignable:true, sort_order:3 } ] },
  list: { topics: THEMEN },
  links_all: { links:[ { id:'l1', item_id:'t1', title:'Vertragsentwurf', type:'drive', url:'https://example.org/v', description:'', added_by:'Alex', created_at:zeit(-10) } ] },
  sites_list: { categories:[ { id:'c1', key:'arbeit', label:'Arbeiten', sort_order:1 }, { id:'c2', key:'technik', label:'Technik', sort_order:2 } ],
    sites:[ { id:'s1', name:'Das Hohe Haus', url:'https://hohes-haus.netlify.app', category:'arbeit', purpose:'Cockpit der GF', notes:'', login_user:'', login_password:'', login_note:'', status:'aktiv', preview:'', sort_order:1 },
            { id:'s2', name:'Team- und Partneranalyse', url:'https://team-partner-analyse.netlify.app', category:'technik', purpose:'Einschätzungen', notes:'', login_user:'alex', login_password:'geheim', login_note:'', status:'aktiv', preview:'', sort_order:2 } ] },
  cycle_get: { year:new Date().getFullYear(), phases:PHASEN,
    transitions:[ { id:'x1', key:'planungsauftakt', label:'Planungsauftakt', month:1, day:15, description:'Jahresstart', sort_order:1 },
                  { id:'x2', key:'produktionsfreigabe', label:'Produktionsfreigabe', month:7, day:1, description:'Alles bestellt', sort_order:2 },
                  { id:'x3', key:'jahresabschluss', label:'Jahresabschluss', month:11, day:30, description:'Rückblick', sort_order:3 } ],
    rituals:[ { id:'r1', phase_key:'planung', title:'Jahresziele festlegen', hint:'Eine Sitzung', sort_order:10, active:true },
              { id:'r2', phase_key:'planung', title:'Budget durchsehen', hint:'', sort_order:20, active:true },
              { id:'r3', phase_key:'verbesserung', title:'Rückblick schreiben', hint:'', sort_order:10, active:true } ],
    checks:[ { id:'k1', ritual_id:'r1', year:new Date().getFullYear(), done_by:'Alex', done_at:zeit(-30), note:'' } ],
    strands:[ { id:'g1', key:'habitate', label:'Wilde Habitate', short:'Habitate', sort_order:1 },
              { id:'g2', key:'wwp', label:'Wild Wild Partner', short:'Partner', sort_order:2 },
              { id:'g3', key:'fluidity', label:'Fluidität', short:'Fluid', sort_order:3 } ] },
  milestones_list: { milestones:[
    { id:'m1', title:'Vorverkauf startet', date_from:tag(20), date_to:null, status:'geplant', strand:'habitate', owner:'Lea', sort_order:10, description:'', archived:false },
    { id:'m2', title:'Aufbau beginnt', date_from:tag(60), date_to:tag(66), status:'geplant', strand:'habitate', owner:'Alex', sort_order:20, description:'', archived:false } ] },
  sessions_list: { sessions:[ { id:'s1', started_at:zeit(-7), ended_at:zeit(-7), participants:'Alex, Lea', protocol:'Zwei Punkte besprochen.', topics_count:2, created_at:zeit(-7) } ] },
  decisions_list: { decisions:[
    { id:'d1', decision:'Wir bleiben beim bisherigen Gastro-Partner.', topic_id:'t4', topic_title:'Gastro-Partner für 2027 bestätigen', next_action:'Vertrag schicken', owner:'Lea', strand:'habitate', decided_by:'Alex', decided_at:tag(-5), created_at:zeit(-5) },
    { id:'d2', decision:'Der Wochenbrief geht freitags raus.', topic_id:'t3', topic_title:'Wochenbrief an das Team', next_action:'Vorlage schreiben', owner:'Alex', strand:'habitate', decided_by:'Lea', decided_at:tag(-12), created_at:zeit(-12) } ] },
  news_list: { items: NEWS },
  gate_list: { items:[ { kind:'thema', ...THEMEN[0] }, { kind:'kandidat', ...NEWS[2] }, { kind:'thema', ...THEMEN[1] } ],
    counts:{ gf:2, Lea:1 }, themen:2, kandidaten:1 },
  absence_list: (p) => { const alle=[...NEUE, A1, A2, A3].filter(a=>p.include_test||!a.test);
    return { absences:alle, zaehler:Object.fromEntries(alle.map(a=>[a.id, zaehleKorb(KORB[a.id]||[])])) }; },
  /* Anlegen liefert die neue Abwesenheit zurück, damit die Seite dorthin weiterleiten kann. */
  absence_set: (p) => {
    const neu = { ...A1, ...p, id:'abs-neu', test:!!p.test, status:'aktiv',
      stufe: p.bis ? 'lang' : 'kurz', korb_truncated:false, korb_abgeschnitten:null };
    NEUE.push(neu); KORB['abs-neu'] = [];
    return { absence:neu, bau:{ neu:0, ergaenzt:0, fehler:0, gesamt:0, truncated:false }, zaehler:zaehleKorb([]) };
  },
  handover_list: (p) => { const rows=KORB[p.absence_id] || (p.absence_id ? [] : KORB['abs-1']);
    const abs=[...NEUE, A1, A2, A3].find(a=>a.id===p.absence_id) || A1;
    return { items:rows, absence:abs, ...zaehleKorb(rows) }; },
  handover_log: (p) => ({ log: PROTOKOLL[p.absence_id]||[] }),
  /* v30: handover_set läuft über die Datenbankfunktion und antwortet mit Zeile und Vorgang.
     Hier wird wirklich geschrieben, damit die nächste Leseabfrage den neuen Stand zeigt. */
  handover_set: (p) => {
    const z = zeileVon(p.id);
    if (!z) return { __status:404, error:'Korbzeile gibt es nicht' };
    if (p.cluster) z.cluster = p.cluster;
    if (p.ampel) z.ampel = p.ampel;
    if (p.vertretung !== undefined) z.vertretung = p.vertretung || null;
    if (p.frist !== undefined) z.frist = p.frist || null;
    if (p.regel_note !== undefined) z.regel_note = p.regel_note || null;
    if (z.ampel === 'ruht' || z.ampel === 'vorher') z.vertretung = null;
    z.status = p.status || 'bestaetigt'; z.by = p.by || 'Alex';
    return { item:{ ...z }, vorgang: vorgangVon(z) };
  },
  handover_set_many: (p) => {
    let n = 0; const misslungen = [];
    for (const it of (p.items || [])) {
      if (!it.id) { misslungen.push({ id:null, titel:null, grund:'ohne id' }); continue; }
      const z = zeileVon(it.id);
      if (!z) { misslungen.push({ id:it.id, titel:null, grund:'Korbzeile gibt es nicht' }); continue; }
      if (it.cluster) z.cluster = it.cluster;
      if (it.ampel) z.ampel = it.ampel;
      if (it.vertretung !== undefined) z.vertretung = it.vertretung || null;
      if (z.ampel === 'ruht' || z.ampel === 'vorher') z.vertretung = null;
      z.status = it.status || 'bestaetigt'; z.by = p.by || 'Alex'; n++;
    }
    return { ok: misslungen.length === 0, updated:n, misslungen };
  },
  /* Rücknahme bei der Rückkehr: die Antwort zeigt, was das Backend gespeichert hat. */
  handover_zurueck: (p) => {
    const z = zeileVon(p.id);
    if (!z) return { __status:404, error:'Korbzeile gibt es nicht' };
    z.status = 'erledigt'; z.vertretung = null;
    return { item:{ ...z }, thema: z.kind === 'thema' ? { id:z.ref_id, gate:'alex', owner_backup:null } : null };
  },
  /* Asana ohne Token: genau die Antwort, die v29 ohne Secret gibt. */
  asana_export: () => ({ __status:400, error:'ASANA_TOKEN fehlt', hinweis:'Secret in Supabase anlegen, dann erneut versuchen.' }),
  deputies_list: { deputies:[
    { id:'d1', person:'Lea', bereich:'gf', vertretung:'Alex', vollmacht:'Ausgaben bis 2.000 € aus freigegebenen Budgets, keine neuen Verpflichtungen', sort:10, active:true },
    { id:'d2', person:'Lea', bereich:'*', vertretung:'Alex', vollmacht:null, sort:90, active:true },
    { id:'d3', person:'Alex', bereich:'gf', vertretung:'Lea', vollmacht:'Ausgaben bis 2.000 € aus freigegebenen Budgets, keine neuen Verpflichtungen', sort:10, active:true },
    { id:'d4', person:'Alex', bereich:'*', vertretung:'Lea', vollmacht:null, sort:90, active:true } ] },
  /* Die Übernahmefähigkeit wird aus denselben Themen gerechnet, die der Lückenfilter im Board zeigt.
     Sonst könnten Kachel und Board verschiedene Zahlen nennen, ohne dass es auffällt. */
  uebernahme_stat: () => {
    const wer = (x) => { const t=(x||'').toLowerCase(); return t.includes('lea') ? 'Lea' : t.includes('alex') ? 'Alex' : 'Team'; };
    const rechne = (p) => {
      const tor = p === 'Lea' ? 'lea' : 'alex';
      const meine = THEMEN.filter(t => !t.archived && (wer(t.owner) === p || t.gate === tor));
      const ohneStand = meine.filter(t => !(t.short_description||'').trim()).length;
      const ohneSchritt = meine.filter(t => !(t.next_action||'').trim()).length;
      const bereit = meine.filter(t => (t.short_description||'').trim() && (t.next_action||'').trim()).length;
      return { themen:meine.length, ohne_stand:ohneStand, ohne_schritt:ohneSchritt,
               ohne_frist:meine.filter(t => !t.gate_frist).length,
               uebernahmefaehigkeit: meine.length ? Math.round(bereit/meine.length*100) : null };
    };
    return { stat:{ Alex:rechne('Alex'), Lea:rechne('Lea') } };
  },
  inbox_list: { items:[ { id:'i1', title:'Alter Eintrag aus dem Archiv', raw_text:'Kam über das Formular.', source:'form', priority:'mittel', created_at:zeit(-90), created_by:'Alex', status:'neu' } ] },
  score_get: { state:{ year:new Date().getFullYear(), week:heute.slice(0,4)+'-W38', day:heute, who:'Alex', total:1240, weekPts:180, todayPts:15,
    level:{ key:'dorf', label:'Dorf', threshold:1800, image:'habitat-3-dorf' }, next:{ key:'festival', label:'Festival', threshold:3600 },
    rank:'bronze', streak:4, fire:3, goal:{ key:'thema', label:'Ein Thema vollständig erfassen', kind:'thema', done:false },
    weekGoal:{ label:'Eine Besprechung abschließen und zwei Entscheidungen festhalten', done:false },
    badges:[ { key:'erste-entscheidung', who:'Alex', earned_at:zeit(-20), label:'Erste Entscheidung' } ], perKind:{ thema:120 }, checkedInToday:true } },
  platform_digest: { days:7, since:zeit(-7), today:heute,
    habitate:{ url:'https://wilde-habitate.netlify.app', total:12, by_kind:{ entscheidung:3, changelog:9 }, decisions:3,
      latest:[ { happened_at:zeit(-1), platform:'habitate', kind:'entscheidung', title:'Zeltwiese bleibt', body:'', url:'', who:'Alex' } ],
      open:{ total:2, by_urgency:{ offen:1, 'überfällig':1 }, overdue:1,
        latest:[ { frage:'Wer uebernimmt den Shuttle?', dringlichkeit:'offen', wer_entscheidet:'Lea', updated_at:zeit(-2) } ] } },
    wwp:{ url:'https://wild-wild-partner.netlify.app', total:5, by_kind:{ gespraech:5 },
      latest:[ { happened_at:zeit(-2), platform:'wwp', kind:'gespraech', title:'Gespräch mit Partner A', body:'', url:'', who:'Lea' } ],
      partners_moved:[ { name:'Partner A', lane:'aktiv', stage:'negotiation', owner:'Lea', signal:'gutes Gespräch', next_action:'Angebot schicken', target_on:tag(10), waiting_for:'', overdue:false, updated_at:zeit(-2) } ],
      partners_moved_count:1, overdue:[], overdue_count:0, upcoming:[] } },
};

/* V31 · Vorhaben: erfundene Vorhaben in der Form von hh_vorhaben_lage, Fristen relativ zu heute, damit Woche, Board und
   Liste alle Zustände zeigen (überfällig, Ball fehlt, Konflikt, Launch, ohne Datum, Spalte mit mehr als fünf). */
const vhZeile = (o) => ({ id:'vh-'+o.slug, slug:o.slug, title:o.title, gruppe:o.gruppe||'sonstiges', strand:null, metaphase:'Systembau, Launch und Formatpartner',
  saison_row_id:o.saison?'lus':null, saison_item_id:null, ball:o.ball, ball_name:o.ball_name||null, ball_seit:zeit(-2), owner:o.owner||null,
  stand:o.stand||null, naechster_schritt:o.schritt||null, frist:o.frist||null, frist_text:o.frist_text||null, konflikt:o.konflikt||null,
  status:o.status||'aktiv', sort:o.sort||100, quellen:o.quellen||[], updated_by:'Alex', created_at:zeit(-5), updated_at:zeit(-1),
  ball_vor_abwesenheit:null, absence_id:null, punkt_frist:o.punkt_frist||null, frist_massgeblich:o.frist||o.punkt_frist||null,
  punkte_gesamt:o.pg??4, punkte_erledigt:o.pe??1, zuletzt_bewegt:zeit(o.bewegt??-1), themen_offen:o.th??1, kandidaten_neu:o.kd??2,
  einwuerfe_offen:o.ew??0, vorschlaege_offen:0, zustand:o.zustand||'ruhig',
  saison:o.saison?{ label:'Lusatia', vvk_start:o.frist, item_title:'VVK-Start', item_von:o.frist, item_bis:o.frist }:null });
export const VORHABEN = [
  vhZeile({ slug:'xceed', title:'XCeed Ticketing-Vertrag', gruppe:'geld', ball:'lea', owner:'gf', frist:tag(10), sort:5, pg:9, pe:4, zustand:'bewegt',
    stand:'Alles verhandelt bis auf Bürgschaftstext und Freigabe.', schritt:'Bürgschaftstext einarbeiten und an XCeed senden', th:10, kd:32,
    quellen:[{ quelle:'Gmail Alex', at:zeit(-0.1) },{ quelle:'Neuigkeiten', at:zeit(-0.2) }] }),
  vhZeile({ slug:'liquiditaet', title:'Liquidität viertes Quartal', gruppe:'geld', ball:'lea', owner:'lea', punkt_frist:tag(3), sort:8, zustand:'bewegt', stand:'Lücke bis Jahresende.', schritt:'Zahlungsplan Oktober' }),
  vhZeile({ slug:'draussenbande', title:'Draußenbande · Vorverkauf', gruppe:'launch', ball:'lea', owner:'lea', frist:tag(7), sort:10, zustand:'bewegt', schritt:'Familienpass festlegen, Shop öffnen' }),
  vhZeile({ slug:'gls', title:'GLS-Kredit Glamping und Automaten', gruppe:'geld', ball:'extern', ball_name:'GLS (Michael Wegstein)', owner:'alex', frist:tag(-3), sort:25, zustand:'ueberfaellig',
    konflikt:'Rückmeldung war bis Ende September erbeten', schritt:'Bei GLS nachfassen' }),
  vhZeile({ slug:'lusatia', title:'Lusatia · Vorverkauf', gruppe:'launch', ball:'alex', owner:'alex', frist:tag(12), sort:20, saison:true, schritt:'Seite fertigstellen, Ticketing anlegen' }),
  vhZeile({ slug:'subardo', title:'Subardo als Formatpartner', gruppe:'partner', ball:'lea', owner:'gf', frist:tag(3), sort:35, zustand:'bewegt',
    konflikt:'Gesprächstermin liegt in Leas Abwesenheit', schritt:'Fragen einsammeln, Termin festlegen' }),
  vhZeile({ slug:'freude-pakete', title:'Pakete und Flex-Tickets mit Freude eG', gruppe:'launch', ball:'offen', frist:tag(43), sort:40, zustand:'ball_fehlt', schritt:'Zuständigkeit festlegen', pg:3, pe:0 }),
  vhZeile({ slug:'bynature', title:'by nature · Vorverkauf', gruppe:'launch', ball:'team', ball_name:'Helge', owner:'gf', frist:tag(29), sort:30, schritt:'Ansprache-Plan' }),
  vhZeile({ slug:'helge', title:'Rolle Helge ab 2027', gruppe:'team', ball:'gf', owner:'gf', frist:tag(89), sort:80, schritt:'Rollenbeschreibung mit Befugnissen und Zielen' }),
  vhZeile({ slug:'backoffice', title:'Backoffice und Buchhaltung', gruppe:'team', ball:'lea', owner:'lea', sort:90, schritt:'Entscheidung treffen' }),
  vhZeile({ slug:'booking', title:'Booking-Standards', gruppe:'team', ball:'lea', owner:'lea', sort:95, schritt:'Paket schnüren' }),
  vhZeile({ slug:'habitat-hub', title:'Habitat Hub und Aufgabenbereiche', gruppe:'system', ball:'alex', owner:'alex', frist:tag(89), sort:100, zustand:'bewegt', schritt:'Team einführen' }),
];
const VH_SAAT = JSON.stringify(VORHABEN);
function vhZuruecksetzen(){ VORHABEN.splice(0, VORHABEN.length, ...JSON.parse(VH_SAAT)); }
const vhPunkte = [
  { id:'p1', vorhaben_id:'vh-xceed', titel:'Bürgschaftstext auf Deutsch', position:null, stand:'in Arbeit', wer:'Niclaas', frist:tag(1), erledigt:false, erledigt_at:null, erledigt_by:null, sort:10, quelle:'seed', created_at:zeit(-5), updated_at:zeit(-1) },
  { id:'p2', vorhaben_id:'vh-xceed', titel:'Schriftliche Freigabe Infield', position:null, stand:null, wer:'Lea', frist:tag(-1), erledigt:false, erledigt_at:null, erledigt_by:null, sort:20, quelle:'seed', created_at:zeit(-5), updated_at:zeit(-1) },
  { id:'p3', vorhaben_id:'vh-xceed', titel:'Auszahlung ab Monat 1 schriftlich', position:null, stand:'mündlich zugesagt', wer:'Alex', frist:null, erledigt:false, erledigt_at:null, erledigt_by:null, sort:30, quelle:'seed', created_at:zeit(-5), updated_at:zeit(-1) },
  { id:'p4', vorhaben_id:'vh-xceed', titel:'Entscheidung für XCeed', position:null, stand:null, wer:'GF', frist:null, erledigt:true, erledigt_at:zeit(-9), erledigt_by:'Alex', sort:40, quelle:'seed', created_at:zeit(-9), updated_at:zeit(-9) },
];
const vhVerlauf = [
  { id:'e1', vorhaben_id:'vh-xceed', happened_at:zeit(-0.2), art:'telefon', wer:'Alex mit Victor', text:'Auszahlung ab Monat 1 mündlich zugesagt, schriftlich bis Montag.', tag:null, status:'bestaetigt', source_ref:'seed:1', source_url:null, created_at:zeit(-0.2) },
  { id:'e2', vorhaben_id:'vh-xceed', happened_at:zeit(-0.5), art:'system', wer:'Abgleich', text:'Mail von XCeed spricht dafür, dass „Entscheidung für XCeed“ erledigt ist.', tag:'Vorschlag: Punkt erledigt: Entscheidung für XCeed', status:'vorschlag', source_ref:'abgleich:alex:vorschlag:p4:m1', source_url:null, created_at:zeit(-0.5) },
  { id:'e5', vorhaben_id:'vh-xceed', happened_at:zeit(-0.4), art:'system', wer:'Abgleich', text:'Mail von Niclaas spricht dafür, dass „Bürgschaftstext auf Deutsch“ jetzt so steht: fertig übersetzt.', tag:'Vorschlag: Stand: Bürgschaftstext auf Deutsch', status:'vorschlag', source_ref:'abgleich:alex:vorschlag:p1:m2', source_url:null, created_at:zeit(-0.4) },
  { id:'e3', vorhaben_id:'vh-xceed', happened_at:zeit(-1), art:'uebergabe', wer:'Alex', text:'Ball von Alex an Lea', tag:null, status:'bestaetigt', source_ref:null, source_url:null, created_at:zeit(-1) },
  { id:'e4', vorhaben_id:'vh-xceed', happened_at:zeit(-9), art:'entscheidung', wer:'Alex und Lea', text:'XCeed wird Ticketanbieter.', tag:'Entscheidung', status:'bestaetigt', source_ref:'seed:2', source_url:null, created_at:zeit(-9) },
];
export const VH_ANTWORT = {
  vorhaben_list: () => ({ stand:zeit(0), heute, vorhaben:VORHABEN, metaphase:{ title:'Analyse und Retro', starts_on:tag(-12), ends_on:tag(12) },
    abwesenheiten:[A1].map(a=>({ id:a.id, person:a.person, von:a.von, bis:a.bis, bis_geschaetzt:a.bis_geschaetzt, status:a.status, vertretung_standard:a.vertretung_standard, test:a.test })),
    einwuerfe_offen:1, einwuerfe_ohne_vorhaben:1 }),
  vorhaben_badge: { einwuerfe:1, ueberfaellig_bei_mir:0, n:1 },
  schicht_uebergabe: (p) => ({ ok:true, fehler:[], ergebnis:(p.eintraege||[]).map(e => ({ vorhaben_id:e.vorhaben_id, title:'', ball:e.ball, ball_geaendert:e.ball !== e.expect_ball })) }),
  vorhaben_seit: () => ({ seit:zeit(-1), vorhaben:VORHABEN,
    eintraege:[ { id:'s1', vorhaben_id:'vh-lusatia', happened_at:zeit(-0.1), created_at:zeit(-0.1), art:'uebergabe', wer:'Lea', text:'Ball von Lea an Alex. Seite ist fast fertig.', created_by:'Lea' },
                { id:'s2', vorhaben_id:'vh-lusatia', happened_at:zeit(-0.3), created_at:zeit(-0.3), art:'system', wer:'Lea', text:'Stand: Website als Prototyp', created_by:'Lea' },
                { id:'s3', vorhaben_id:'vh-xceed', happened_at:zeit(-0.5), created_at:zeit(-0.5), art:'mail', wer:'Niclaas an Lea', text:'Bürgschaftstext kommt heute Nacht.', created_by:'abgleich-lea' } ] }),
  vorhaben_rueckkehr: () => ({ absence:A3, vorhaben:[ { ...VORHABEN[0], ball:'alex', absence_id:null, korb:{ ref_id:'vh-xceed', ampel:'gruen', vertretung:'Lea', status:'bestaetigt' },
    zurueck:{ vorhaben_id:'vh-xceed', text:'Zurück nach der Abwesenheit von Alex: Ball von Lea an Alex', happened_at:zeit(-1) },
    verlauf:[ { id:'r1', vorhaben_id:'vh-xceed', happened_at:zeit(-3), art:'telefon', wer:'Lea mit Victor', text:'Tranche bestätigt.' } ] } ] }),
  /* Ballwechsel wie das Backend: veralteter Ball ergibt 409, sonst wird wirklich geschrieben. */
  vorhaben_save: (p) => {
    const v = VORHABEN.find(x => x.id === p.id || x.slug === p.slug);
    if (!v) return { __status:404, error:'Vorhaben gibt es nicht' };
    if (p.expect_ball && p.expect_ball !== v.ball) return { __status:409, error:'Der Ball liegt inzwischen bei '+v.ball+', bitte neu laden' };
    const alt = v.ball + '|' + (v.ball_name || '');
    for (const f of ['ball','ball_name','stand','naechster_schritt','frist','status']) if (p[f] !== undefined) v[f] = p[f];
    return { vorhaben:v, ball_geaendert: alt !== v.ball + '|' + (v.ball_name || ''), verlauf:1 };
  },
  vorhaben_get: (p) => { const v = VORHABEN.find(x => x.slug === p.slug || x.id === p.id || x.id === p.slug) || VORHABEN[0];
    return { vorhaben:v, punkte:vhPunkte.filter(x=>x.vorhaben_id===v.id), verlauf:vhVerlauf.filter(x=>x.vorhaben_id===v.id),
      themen:v.slug==='xceed'?[{ id:'t1', title:'Vertrag mit dem Landkreis verlängern', board_lane:'zu_besprechen', gate:'gf' }]:[],
      kandidaten:v.slug==='xceed'?[{ id:'n3', title:'Pressefrage zur Zeltwiese', relevance:'hoch' }]:[], einwuerfe:[] }; },
  /* Einwurf: Vorschlag wie aus einwurfPruefen, mit revision und ball_gesehen. */
  einwurf_add: (p) => ({ einwurf:{ id:'w-neu', created_at:zeit(0), von:p.von||'Alex', kanal:p.kanal||'knopf', text:p.text, vorhaben_id:'vh-xceed', status:'vorgeschlagen',
    vorschlag:{ vorhaben_id:'vh-xceed', vorhaben_slug:'xceed', vorhaben_titel:'XCeed Ticketing-Vertrag', ball_gesehen:'lea', sicherheit:0.9, revision:'rev-1',
      verlauf:{ art:'telefon', wer:'Alex mit Victor', text:'Victor sagt Auszahlung ab Monat 1 zu, schriftlich bis Montag.', tag:null },
      punkte:[{ id:'p3', titel:'Auszahlung ab Monat 1 schriftlich', stand:'mündlich zugesagt', erledigt:false }],
      neue_punkte:[{ titel:'Bestätigung von Victor abholen', wer:'Alex', frist:tag(2) }],
      ball:'alex', ball_name:null, naechster_schritt:null, frist:tag(2), benachrichtigung:'morgen', verworfen:['Punkt x ist kein offener Punkt dieses Vorhabens'], vertraulich:[] } }, ki_fehler:null }),
  einwurf_vorschlag: (p) => ({ einwurf:{ id:p.id, created_at:zeit(0), von:'Alex', kanal:'knopf', text:'Text', vorhaben_id:p.vorhaben_id, status:'vorgeschlagen',
    vorschlag:{ vorhaben_id:p.vorhaben_id, sicherheit:1, revision:'rev-2', verlauf:{ art:'notiz', wer:'Alex', text:'Neu geprüft.' }, punkte:[], neue_punkte:[], ball:null, naechster_schritt:null, frist:null, benachrichtigung:'morgen', verworfen:[] } }, ki_fehler:null }),
  einwurf_apply: (p) => { const v = VORHABEN.find(x => x.id === p.vorhaben_id) || VORHABEN[0];
    return { ok:true, vorhaben:v, verlauf:{ id:'e-neu', text:'eingetragen', art:'telefon' }, punkte:(p.auswahl&&p.auswahl.punkte)||[], neue_punkte:[], felder:null, ticker:p.benachrichtigung==='sofort', uebersprungen:[] }; },
  einwurf_list: { einwuerfe:[ { id:'w1', created_at:zeit(-0.3), von:'Lea', kanal:'mail', text:'Mail von Niclaas: Bürgschaftstext ist fertig, liegt im Ordner.', vorhaben_id:null, status:'vorgeschlagen',
    vorschlag:{ vorhaben_id:'vh-xceed', vorhaben_slug:'xceed', vorhaben_titel:'XCeed Ticketing-Vertrag', sicherheit:0.86,
      verlauf:{ art:'mail', wer:'Niclaas an Lea', text:'Bürgschaftstext ist fertig und liegt im Ordner.', tag:null },
      punkte:[{ id:'p1', titel:'Bürgschaftstext auf Deutsch', stand:'fertig', erledigt:true }], neue_punkte:[{ titel:'Text an XCeed senden', wer:'Lea', frist:tag(2) }],
      ball:null, ball_name:null, naechster_schritt:'Bürgschaftstext an XCeed senden', frist:null, benachrichtigung:'morgen', verworfen:[] },
    vorhaben:null } ] },
};

export const FALLBACK = { ok:true, items:[], topics:[], gains:[] };
// Schreibende Aktionen darf der Lauf beantworten, ohne dass die Testdaten sie kennen; alles andere ist ein Testfehler.
export const SCHREIBEND = new Set(['add','update','delete','capture','capture_many','checkin','score_event','decision_add','decision_update','decision_delete',
  'session_start','session_end','session_delete','ritual_toggle','ritual_save','ritual_delete','milestone_save','milestone_delete','news_update','news_accept','news_delete',
  'people_save','people_delete','link_add','link_delete','sites_save','sites_delete','category_save','gate_set','gate_set_many','inbox_promote','inbox_reject','tidy_suggest',
  'absence_end','absence_tick','deputies_set','handover_build','handover_dossier','handover_log_add','launch_set',
  'handover_set_many','vorhaben_save','punkt_save','punkt_toggle','punkt_delete','verlauf_add','verlauf_status','vorhaben_verknuepfen','einwurf_verwerfen']);

/* Je Seite: Kerninhalt, der nach dem Laden gefuellt sein muss (Text laenger als 20 Zeichen).
   Ohne diese Probe wuerde eine leer gebliebene Seite als bestanden durchgehen, weil gfGate das Tor schon vorher versteckt. */


/* Schreibende Aktionen darf der Lauf mit einem leeren Erfolg beantworten; alles andere ohne Testdaten ist ein Testfehler. */
Object.assign(ANTWORT, VH_ANTWORT);
