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
export const A2 = { id:'abs-2', person:'Alex', von:heute, bis:null, bis_geschaetzt:tag(2), art:'sofort', kontakt:'keiner',
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

export const KORB = {
  'abs-1': [
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
export const ANTWORT = {
  ping: { ok:true, version:28 },
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
  absence_list: (p) => { const alle=[A1,A2,A3].filter(a=>p.include_test||!a.test);
    return { absences:alle, zaehler:Object.fromEntries(alle.map(a=>[a.id, zaehleKorb(KORB[a.id]||[])])) }; },
  handover_list: (p) => { const rows=KORB[p.absence_id]||KORB['abs-1'];
    const abs=[A1,A2,A3].find(a=>a.id===p.absence_id)||A1;
    return { items:rows, absence:abs, ...zaehleKorb(rows) }; },
  handover_log: (p) => ({ log: PROTOKOLL[p.absence_id]||[] }),
  /* Rücknahme bei der Rückkehr: die Antwort zeigt, was das Backend gespeichert hat. */
  handover_zurueck: (p) => {
    const zeile = Object.values(KORB).flat().find(r => r.id === p.id);
    return { item: { ...(zeile||{}), status:'erledigt', vertretung:null },
             thema: zeile && zeile.kind === 'thema' ? { id:zeile.ref_id, gate:'alex', owner_backup:null } : null };
  },
  /* Asana ohne Token: genau die Antwort, die v29 ohne Secret gibt. */
  asana_export: () => ({ __status:400, error:'ASANA_TOKEN fehlt', hinweis:'Secret in Supabase anlegen, dann erneut versuchen.' }),
  deputies_list: { deputies:[
    { id:'d1', person:'Lea', bereich:'gf', vertretung:'Alex', vollmacht:'Ausgaben bis 2.000 € aus freigegebenen Budgets, keine neuen Verpflichtungen', sort:10, active:true },
    { id:'d2', person:'Lea', bereich:'*', vertretung:'Alex', vollmacht:null, sort:90, active:true },
    { id:'d3', person:'Alex', bereich:'gf', vertretung:'Lea', vollmacht:'Ausgaben bis 2.000 € aus freigegebenen Budgets, keine neuen Verpflichtungen', sort:10, active:true },
    { id:'d4', person:'Alex', bereich:'*', vertretung:'Lea', vollmacht:null, sort:90, active:true } ] },
  uebernahme_stat: { stat:{ Alex:{ themen:24, ohne_stand:9, ohne_schritt:6, ohne_frist:14, uebernahmefaehigkeit:58 },
                            Lea:{ themen:18, ohne_stand:11, ohne_schritt:8, ohne_frist:12, uebernahmefaehigkeit:39 } } },
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
export const FALLBACK = { ok:true, items:[], topics:[], gains:[] };
// Schreibende Aktionen darf der Lauf beantworten, ohne dass die Testdaten sie kennen; alles andere ist ein Testfehler.
export const SCHREIBEND = new Set(['add','update','delete','capture','capture_many','checkin','score_event','decision_add','decision_update','decision_delete',
  'session_start','session_end','session_delete','ritual_toggle','ritual_save','ritual_delete','milestone_save','milestone_delete','news_update','news_accept','news_delete',
  'people_save','people_delete','link_add','link_delete','sites_save','sites_delete','category_save','gate_set','gate_set_many','inbox_promote','inbox_reject','tidy_suggest',
  'absence_set','absence_end','absence_tick','deputies_set','handover_build','handover_set','handover_set_many','handover_dossier','handover_log_add']);

/* Je Seite: Kerninhalt, der nach dem Laden gefuellt sein muss (Text laenger als 20 Zeichen).
   Ohne diese Probe wuerde eine leer gebliebene Seite als bestanden durchgehen, weil gfGate das Tor schon vorher versteckt. */


/* Schreibende Aktionen darf der Lauf mit einem leeren Erfolg beantworten; alles andere ohne Testdaten ist ein Testfehler. */
