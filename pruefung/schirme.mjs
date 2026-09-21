/* Schirmpruefung (V23): alle Seiten bei 1440 und 390, dunkel und hell.
   Die Edge Function wird abgefangen und mit Testdaten beantwortet, damit ohne Passwort geprueft werden kann.
   Aufruf:  PLAYWRIGHT_MODUL=<pfad>/node_modules/playwright/index.mjs node pruefung/schirme.mjs [zielordner]
   (ohne die Variable muss playwright im Suchpfad liegen; das Paket gehoert bewusst nicht ins Repo)
   Ergebnis: je Seite ein Bild im Zielordner, Konsolenfehler und fehlende Dateien auf der Ausgabe. */
const { chromium } = await import(process.env.PLAYWRIGHT_MODUL || 'playwright');
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'site');
const OUT = process.argv[2] || '/tmp/hh-schirme';
fs.mkdirSync(OUT, { recursive: true });

const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.webp':'image/webp', '.png':'image/png', '.ico':'image/x-icon', '.json':'application/json', '.webmanifest':'application/manifest+json', '.svg':'image/svg+xml' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  const f = path.join(ROOT, p === '/' ? 'index.html' : p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('nicht da'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, r));
const BASE = 'http://127.0.0.1:' + server.address().port;

const heute = new Date().toISOString().slice(0, 10);
const tag = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const zeit = (n) => new Date(Date.now() + n * 86400000).toISOString();

const THEMEN = [
  { id:'t1', title:'Vertrag mit dem Landkreis verlängern', context:'Der Vertrag läuft zum Jahresende aus.', short_description:'Verlängerung bis 2029 klären', priority:'hoch', status:'offen', kind:'einmalig', board_lane:'zu_besprechen', lane_order:1, owner:'Alex', next_action:'Termin mit dem Amt', relevance:'kritisch', gate:'gf', gate_frist:tag(5), gate_by:'lauf', created_by:'Alex', created_at:zeit(-20), updated_at:zeit(-2), archived:false, involved:'Lea', notes:'' },
  { id:'t2', title:'Shuttle für das Festival ausschreiben', context:'Drei Anbieter haben geantwortet.', short_description:'Anbieter wählen', priority:'mittel', status:'in_klaerung', kind:'einmalig', board_lane:'in_klaerung', lane_order:1, owner:'Lea', next_action:'Angebote vergleichen', relevance:'hoch', gate:'Lea', gate_frist:tag(12), gate_by:'Alex', created_by:'Lea', created_at:zeit(-14), updated_at:zeit(-1), archived:false },
  { id:'t3', title:'Wochenbrief an das Team', context:'Format steht.', short_description:'Jeden Freitag', priority:'niedrig', status:'offen', kind:'recurring', frequency:'woechentlich', board_lane:'zu_besprechen', lane_order:2, owner:'Alex', next_action:'Vorlage schreiben', relevance:'mittel', gate:'team', created_by:'Alex', created_at:zeit(-40), updated_at:zeit(-3), archived:false },
  { id:'t4', title:'Gastro-Partner für 2027 bestätigen', context:'Zusage mündlich da.', priority:'hoch', status:'erledigt', kind:'einmalig', board_lane:'entschieden', lane_order:1, owner:'Lea', decision:'Wir machen mit dem bisherigen Partner weiter.', next_action:'Vertrag schicken', relevance:'hoch', created_by:'Lea', created_at:zeit(-60), updated_at:zeit(-5), archived:false },
];
const NEWS = [
  { id:'n1', kind:'ticker', title:'Amt meldet sich zum Vertrag', body:'Kurzer Anruf, Termin folgt.', source:'mail', source_title:'Mail vom Amt', source_url:'https://example.org/1', who:'Alex', strand:'habitate', happened_at:zeit(0), created_at:zeit(0), status:'neu' },
  { id:'n2', kind:'ticker', title:'Shuttle-Angebot eingegangen', body:'Drittes Angebot liegt vor.', source:'asana', who:'Lea', strand:'wwp', happened_at:zeit(-1), created_at:zeit(-1), status:'neu' },
  { id:'n3', kind:'kandidat', title:'Pressefrage zur Zeltwiese', body:'Lokalzeitung fragt nach der Fläche.', quote:'Wie viele Menschen passen auf die Wiese?', relevance:'hoch', source:'mail', source_title:'Mail der Redaktion', source_url:'https://example.org/2', who:'Alex', strand:'habitate', happened_at:zeit(-2), created_at:zeit(-2), status:'neu', gate:'gf', gate_by:'lauf', gate_frist:tag(3) },
  { id:'n4', kind:'kandidat', title:'Helferplanung beginnt', body:'Erste Anmeldungen liegen vor.', relevance:'mittel', source:'notiz', who:'Lea', strand:'habitate', happened_at:zeit(-3), created_at:zeit(-3), status:'neu' },
  { id:'n5', kind:'lage', strand:'habitate', title:'Lage Wilde Habitate', body:'Ruhige Woche, zwei Entscheidungen offen.', source:'plattform', happened_at:zeit(0), created_at:zeit(0), status:'neu' },
  { id:'n6', kind:'lage', strand:'wwp', title:'Lage Wild Wild Partner', body:'Zwei Partner haben sich bewegt.', source:'plattform', happened_at:zeit(0), created_at:zeit(0), status:'neu' },
  { id:'n7', kind:'ticker', title:'Besprechung mit dem Büro', body:'Termin am Donnerstag.', source:'kalender', who:'Alex,Lea', happened_at:zeit(2), created_at:zeit(-1), status:'neu' },
];
const PHASEN = [
  { id:'p1', key:'planung', label:'Planung', months:[1,2,3], color_token:'accent', sort_order:1, hint:'Ziele setzen' },
  { id:'p2', key:'fruehbucher', label:'Frühbucher', months:[4,5,6], color_token:'pos', sort_order:2, hint:'Vorverkauf' },
  { id:'p3', key:'produktion', label:'Produktion', months:[7,8], color_token:'warn', sort_order:3, hint:'Aufbau' },
  { id:'p4', key:'verbesserung', label:'Verbesserung', months:[9,10,11,12], color_token:'info', sort_order:4, hint:'Nacharbeit' },
];
const mon = (n) => new Date(Date.now() - n * 2592000000).toISOString().slice(0, 7);
const TPA = { months:[mon(2),mon(1),mon(0)],
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
const ANTWORT = {
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
const FALLBACK = { ok:true, items:[], topics:[], gains:[] };
// Schreibende Aktionen darf der Lauf beantworten, ohne dass die Testdaten sie kennen; alles andere ist ein Testfehler.
const SCHREIBEND = new Set(['add','update','delete','capture','capture_many','checkin','score_event','decision_add','decision_update','decision_delete',
  'session_start','session_end','session_delete','ritual_toggle','ritual_save','ritual_delete','milestone_save','milestone_delete','news_update','news_accept','news_delete',
  'people_save','people_delete','link_add','link_delete','sites_save','sites_delete','category_save','gate_set','gate_set_many','inbox_promote','inbox_reject','tidy_suggest']);

/* Je Seite: Kerninhalt, der nach dem Laden gefuellt sein muss (Text laenger als 20 Zeichen).
   Ohne diese Probe wuerde eine leer gebliebene Seite als bestanden durchgehen, weil gfGate das Tor schon vorher versteckt. */
const SEITEN = [
  ['index.html', '#fdEntL'], ['neuigkeiten.html', '#feed'], ['besprechung.html', '#bsAgL'], ['board.html', '#lanes,#grid,.board'],
  ['cockpit.html', '#list'], ['entscheidungen.html', '#log'], ['jahr.html', '#cycle'], ['capture.html', '#form'],
  ['seiten.html', '#groups'], ['bearbeiten.html', '#itemsView'], ['aufraeumen.html', '#list'], ['checkin.html', '#agenda'],
  ['inbox.html', '#list'],
];
const SCHIRME = [ { name:'1440', w:1440, h:900 }, { name:'390', w:390, h:844 } ];
const THEMES = ['dark','light'];

const browser = await chromium.launch();
const unbekannt = new Set();
let fehler = 0, bilder = 0;
for (const thema of THEMES) {
  for (const s of SCHIRME) {
    const ctx = await browser.newContext({ viewport:{ width:s.w, height:s.h }, deviceScaleFactor:1, locale:'de-DE', timezoneId:'Europe/Berlin' });
    await ctx.addInitScript((thema) => {
      try {
        localStorage.setItem('gf_theme', thema);
        localStorage.setItem('gf_nav', 'open');
        // Der Tagesschluessel kommt aus dem lokalen Kalendertag des Browsers, genau wie in game.js
        const d = new Date();
        const tag = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
        for (const w of ['Alex','Lea']) localStorage.setItem(`gf_ci_${w}_${tag}`, '1');   // Check-in-Karte im Test unterdruecken
        sessionStorage.setItem('gf_pw', 'test');
        sessionStorage.setItem('gf_who', 'Alex');
      } catch (e) {}
    }, thema);
    await ctx.route('**/functions/v1/**', async (route) => {
      const req = route.request();
      if (req.url().includes('/tpa')) return route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify(TPA) });
      let action = '';
      try { action = JSON.parse(req.postData() || '{}').action || ''; } catch (e) {}
      if (!ANTWORT[action] && !SCHREIBEND.has(action)) unbekannt.add(action || '(ohne Aktion)');
      const body = ANTWORT[action] || FALLBACK;
      await route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify(body) });
    });
    for (const [seite, kern] of SEITEN) {
      const page = await ctx.newPage();
      const meldungen = [];
      page.on('console', m => { if (m.type() === 'error') meldungen.push('Konsole: ' + m.text()); });
      page.on('pageerror', e => meldungen.push('Skriptfehler: ' + e.message));
      page.on('requestfailed', r => { if (r.url().startsWith(BASE)) meldungen.push('Datei fehlt: ' + r.url().replace(BASE, '')); });
      page.on('response', r => { if (r.url().startsWith(BASE) && r.status() >= 400) meldungen.push('HTTP ' + r.status() + ': ' + r.url().replace(BASE, '')); });
      await page.goto(BASE + '/' + seite, { waitUntil:'load' });
      await page.waitForTimeout(900);
      const befund = await page.evaluate((kern) => {
        const g = document.getElementById('gate');
        const app = document.querySelector('.app,.cwrap,.iwrap');
        const el = kern.split(',').map(k => document.querySelector(k.trim())).find(Boolean);
        return {
          tor: !!g && g.style.display !== 'none',
          app: !!app && getComputedStyle(app).display !== 'none',
          nav: document.querySelectorAll('.sb-nav a[data-k]').length,
          unternav: document.querySelectorAll('.sb-nav a[data-sk]').length,
          fehltext: (() => {
            const t = document.body.innerText || '';
            const muster = ['Fehler beim Laden', 'Fehler: ', 'nicht erreichbar', 'Konnte nicht', 'Falsches Passwort'];
            return muster.filter(m => t.includes(m));
          })(),
          kern: el ? (el.innerText || '').trim().length : -1,
          laedt: (document.body.innerText || '').includes('lädt …'),
        };
      }, kern);
      if (befund.tor) meldungen.push('Tor blieb zu');
      if (!befund.app) meldungen.push('Seiteninhalt blieb verborgen');
      if (befund.nav !== 9) meldungen.push('Navigation unvollständig (' + befund.nav + ' von 9 Haupteinträgen)');
      if (befund.unternav !== 4) meldungen.push('Unternavigation unvollständig (' + befund.unternav + ' von 4 Einträgen)');
      if (befund.fehltext.length) meldungen.push('Fehlermeldung auf der Seite: ' + befund.fehltext.join(', '));
      if (befund.kern < 0) meldungen.push('Kerninhalt ' + kern + ' fehlt im Aufbau');
      else if (befund.kern < 20) meldungen.push('Kerninhalt ' + kern + ' blieb leer (' + befund.kern + ' Zeichen)');
      if (befund.laedt) meldungen.push('„lädt …“ blieb stehen');
      const datei = path.join(OUT, `${seite.replace('.html','')}--${s.name}--${thema}.png`);
      await page.screenshot({ path:datei, fullPage:true });
      bilder++;
      if (meldungen.length) { fehler += meldungen.length; console.log(`\n${seite}  ${s.name}  ${thema}`); for (const m of meldungen) console.log('   ' + m); }
      await page.close();
    }
    await ctx.close();
  }
}
await browser.close();
server.close();
if (unbekannt.size) { console.log('\nAktionen ohne Testdaten (Antwort war ein leerer Erfolg): ' + [...unbekannt].join(', ')); fehler += unbekannt.size; }
console.log(`\nBilder: ${bilder}  ·  Meldungen: ${fehler}  ·  Ordner: ${OUT}`);
process.exit(fehler ? 1 : 0);
