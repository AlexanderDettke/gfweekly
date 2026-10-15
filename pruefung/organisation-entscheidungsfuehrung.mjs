/* Oberfläche mit abgefangener API. Datenbankbeleg separat in der SQL Probe. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { ANTWORT, FALLBACK } from './testdaten.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODUL || 'playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../site');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
 const f=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
 if(!f.startsWith(root+path.sep)||!fs.existsSync(f)){res.writeHead(404);return res.end();}
 res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch();
let checks=0;
const check=(v,msg)=>{assert.ok(v,msg);checks++;};
try {
 for(const width of [390,1440]) for(const theme of ['light','dark']) {
  const ctx=await browser.newContext({viewport:{width,height:1000},locale:'de-DE'});
  await ctx.addInitScript(({theme})=>{sessionStorage.setItem('gf_pw','test');sessionStorage.setItem('gf_who','Lea');localStorage.setItem('gf_theme',theme);},{theme});
  const p=await ctx.newPage(), calls=[], errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  let d={id:1,wahl:null,alex_frei:false,lea_frei:false,freigegeben_am:null,log_decision_id:null,rev:0};
  const stoerung={begruendung:false,verknuepfen:false};
  await p.route('**/functions/v1/**',async route=>{
   const b=route.request().postDataJSON();calls.push(b);
   let result;
   if(route.request().url().endsWith('/organisation')&&b.action==='begruendung'&&stoerung.begruendung)
    return route.fulfill({status:409,contentType:'application/json',body:JSON.stringify({error:'Inzwischen geändert'})});
   if(route.request().url().endsWith('/organisation')&&b.action==='log_verknuepfen'&&stoerung.verknuepfen)
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({verknuepft:false})});
   if(route.request().url().endsWith('/organisation')) {
    if(b.action==='begruendung') { d={...d,begruendung:b.payload.text}; result={entscheidung:d}; }
    else
    if(b.action==='get') result={entscheidungen:[d],rollen:[],tore:[],log:[]};
    else if(b.action==='wahl') {
     if(b.payload.who!=='Alex') throw Error('Lea darf nicht wählen');
     const anders=d.wahl!==b.payload.wahl;
     d={...d,wahl:b.payload.wahl,alex_frei:true,freigegeben_am:anders||!d.freigegeben_am?'2026-10-15T1'+(d.rev%10)+':00:00Z':d.freigegeben_am,rev:d.rev+1};
     if(anders) d={...d,lea_frei:false,log_decision_id:null};
     result={entscheidung:d};
    } else if(b.action==='freigabe') {
     if(b.payload.who!=='Lea') throw Error('Alex braucht keine Freigabe');
     d={...d,lea_frei:b.payload.on,rev:d.rev+1};
     result={entscheidung:d,neu_freigegeben:false};
    } else if(b.action==='log_verknuepfen') { d={...d,log_decision_id:b.payload.decision_id}; result={verknuepft:true}; }
    else if(b.action==='rolle') result={rolle:{id:b.payload.id,...b.payload.patch,rev:1}};
    else throw Error('Unerwartete Organisationsaktion '+b.action);
   } else if(b.action==='decision_add') result={decision:{id:'11111111-1111-4111-8111-111111111111'}};
   else {const a=ANTWORT[b.action];result=typeof a==='function'?a(b.payload):a||FALLBACK;}
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(result)});
  });
  await p.goto(process.env.ORG_UI_URL || `http://127.0.0.1:${server.address().port}/organisation.html`);
  await p.locator('#ogDecSum').filter({hasText:'Alex entscheidet'}).waitFor();
  check(!/Deine Freigabe fehlt|Freigaben, die auf dich warten/.test(await p.locator('#ogZug').innerText()),'Keine pauschale Freigabeaufgabe für Lea');
  check((await p.locator('[data-frei="Lea:1"]').innerText()).includes('Optional'), 'Rückmeldung ausdrücklich optional');
  await p.locator('[data-wahl="1:0"]').click();
  check(!calls.some(x=>x.action==='wahl'),'Lea wählt nicht');
  await p.evaluate(()=>oeffne('rolle','daten'));
  let before=calls.filter(x=>x.action==='rolle').length;
  await p.locator('[data-schritt="daten:1"]').click();
  check(calls.filter(x=>x.action==='rolle').length===before,'Offene Entscheidung bleibt echte Abhängigkeit');
  const switchTo=async who=>p.evaluate(w=>{gfSetWho(w);document.dispatchEvent(new Event('gf-who'));},who);
  await switchTo('Alex'); await p.evaluate(()=>oeffne('dec',1));
  check(await p.locator('[data-frei="Alex:1"]').count()===0,'Kein Freigabeknopf für Alex');
  await p.locator('[data-wahl="1:0"]').click();
  await p.waitForFunction(()=>!!dec(1).log_decision_id);
  check(d.wahl===0&&d.alex_frei&&!d.lea_frei&&!!d.freigegeben_am,'Alex’ Wahl gilt mit einem Klick');
  check(!calls.some(x=>x.action==='freigabe'),'Kein zweiter Schritt nötig');
  const log=calls.find(x=>x.action==='decision_add').payload;
  check(log.decided_by==='Alex'&&log.owner==='Alex','Entscheidungslog schreibt Alex, keine behauptete Mitentscheidung');
  check((await p.locator('#ogDecSum').innerText()).startsWith('1 von 8'),'Fortschritt zählt Alex allein');
  check(!/Deine Freigabe fehlt|Freigeben/.test(await p.locator('#ogZug').innerText()),'Dein Zug verlangt keine Freigabe');
  check((await p.locator('#ogAkte').innerText()).includes('Alex hat entschieden'),'Akte zeigt die Entscheidung');
  await switchTo('Lea');
  await p.locator('[data-frei="Lea:1"]').click();
  await p.waitForFunction(()=>dec(1).lea_frei);
  await p.locator('[data-frei="Lea:1"]').click();
  await p.waitForFunction(()=>!dec(1).lea_frei);
  check(await p.evaluate(()=>decOk(1)),'Leas Rücknahme lässt die Entscheidung stehen');
  await p.evaluate(()=>oeffne('rolle','daten'));
  await p.locator('[data-schritt="daten:1"]').click();
  await p.waitForFunction(()=>rol('daten').rev===1);
  check(calls.some(x=>x.action==='rolle'&&x.payload.id==='daten'&&x.payload.patch.schritt===1),'Rollenaufbau ohne Lea Freigabe bedienbar');
  await switchTo('Alex'); await p.evaluate(()=>oeffne('dec',1));
  const logs=calls.filter(x=>x.action==='decision_add').length;
  await p.locator('[data-wahl="1:2"]').click();
  await p.waitForFunction(()=>dec(1).wahl===2&&!!dec(1).log_decision_id);
  check(d.wahl===2&&!!d.freigegeben_am,'Andere Wahl ersetzt die Entscheidung sofort');
  check(calls.filter(x=>x.action==='decision_add').length===logs+1,'Geänderte Entscheidung kommt neu ins Entscheidungslog');
  check((await p.locator('#ogDecSum').innerText()).startsWith('1 von 8'),'Ersetzen zählt weiter als entschieden');
  // Scheitert die Begründung, wird die Wahl nicht ausgelöst.
  stoerung.begruendung=true;
  const wahlen=calls.filter(x=>x.action==='wahl').length;
  await p.locator('#ogWhy').fill('Testbegründung');
  const gets=calls.filter(x=>x.action==='get').length;
  await p.locator('[data-wahl="1:1"]').click();
  await p.waitForTimeout(400);
  check(calls.filter(x=>x.action==='get').length>gets,'Gescheiterte Begründung lädt den Stand neu');
  check(calls.filter(x=>x.action==='wahl').length===wahlen,'Ohne gespeicherte Begründung keine Wahl');
  check(d.wahl===2,'Entscheidung bleibt bei gescheiterter Begründung unverändert');
  stoerung.begruendung=false;
  // Geltende Entscheidung ohne Logeintrag: Nachtrag; eine abgelehnte Verknüpfung wird nicht als gespeichert gezeigt.
  d={...d,log_decision_id:null}; stoerung.verknuepfen=true;
  await p.evaluate(()=>laden());
  const verk=calls.filter(x=>x.action==='log_verknuepfen').length;
  await p.locator('[data-log="1"]').click();
  await p.waitForTimeout(400);
  check(calls.filter(x=>x.action==='log_verknuepfen').length===verk+1,'Nachtrag versucht die Verknüpfung');
  check(await p.evaluate(()=>!dec(1).log_decision_id),'Abgelehnte Verknüpfung bleibt sichtbar offen');
  stoerung.verknuepfen=false;
  const vorNachtrag=calls.filter(x=>x.action==='decision_add').length;
  await p.locator('[data-log="1"]').click();
  await p.waitForFunction(()=>!!dec(1).log_decision_id);
  check(calls.filter(x=>x.action==='decision_add').length===vorNachtrag+1,'Nachtrag schreibt einen Logeintrag');
  check(await p.locator('[data-log="1"]').count()===0,'Nach dem Nachtrag kein Knopf mehr');
  check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Kein horizontaler Seitenüberlauf');
  check(errors.length===0,'Keine Skriptfehler: '+errors.join(';'));
  const out=process.env.PROBE_OUT||'/tmp/organisation-entscheidungsfuehrung';fs.mkdirSync(out,{recursive:true});
  await p.screenshot({path:`${out}/${width}-${theme}.png`,fullPage:true});
  await ctx.close();
 }
 console.log(`${checks} Oberflächenprüfungen bestanden (API abgefangen).`);
} finally {await browser.close();await new Promise(r=>server.close(r));}
