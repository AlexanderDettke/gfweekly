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
  let d={id:1,wahl:0,alex_frei:false,lea_frei:false,freigegeben_am:null,rev:1};
  await p.route('**/functions/v1/**',async route=>{
   const b=route.request().postDataJSON();calls.push(b);
   let result;
   if(route.request().url().endsWith('/organisation')) {
    if(b.action==='get') result={entscheidungen:[d],rollen:[],tore:[],log:[]};
    else if(b.action==='freigabe') {
     const {who,on}=b.payload; const newly=who==='Alex'&&on&&!d.freigegeben_am;
     d={...d,[who==='Alex'?'alex_frei':'lea_frei']:on,rev:d.rev+1};
     if(who==='Alex') d.freigegeben_am=on?'2026-10-15T10:00:00Z':null;
     result={entscheidung:d,neu_freigegeben:newly};
    } else if(b.action==='log_verknuepfen') result={verknuepft:true};
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
  const switchTo=async who=>p.evaluate(w=>{gfSetWho(w);document.dispatchEvent(new Event('gf-who'));},who);
  await switchTo('Alex');
  await p.locator('[data-frei="Alex:1"]').click();
  await p.waitForFunction(()=>!!dec(1).log_decision_id);
  check(d.alex_frei&&!d.lea_frei&&!!d.freigegeben_am,'Alex allein wird freigegeben angezeigt');
  const log=calls.find(x=>x.action==='decision_add').payload;
  check(log.decided_by==='Alex'&&log.owner==='Alex','Entscheidungslog schreibt Alex, keine behauptete Mitentscheidung');
  check((await p.locator('#ogDecSum').innerText()).startsWith('1 von 8'),'Fortschritt zählt Alex allein');
  await switchTo('Lea');
  await p.locator('[data-frei="Lea:1"]').click();
  await p.waitForFunction(()=>dec(1).lea_frei);
  await p.locator('[data-frei="Lea:1"]').click();
  await p.waitForFunction(()=>!dec(1).lea_frei);
  check(await p.evaluate(()=>decOk(1)),'Leas Rücknahme lässt Freigabe stehen');
  await p.evaluate(()=>oeffne('rolle','daten'));
  await p.locator('[data-schritt="daten:1"]').click();
  await p.waitForFunction(()=>rol('daten').rev===1);
  check(calls.some(x=>x.action==='rolle'&&x.payload.id==='daten'&&x.payload.patch.schritt===1),'Rollenaufbau ohne Lea Freigabe bedienbar');
  await switchTo('Alex'); await p.evaluate(()=>oeffne('dec',1));
  await p.locator('[data-frei="Alex:1"]').click();
  await p.waitForFunction(()=>!decOk(1));
  check((await p.locator('#ogDecSum').innerText()).startsWith('0 von 8'),'Alex kann zurücknehmen');
  await p.evaluate(()=>oeffne('rolle','daten'));
  const before=calls.filter(x=>x.action==='rolle').length;
  await p.locator('[data-schritt="daten:2"]').click();
  check(calls.filter(x=>x.action==='rolle').length===before,'Offene Entscheidung bleibt echte Abhängigkeit');
  check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Kein horizontaler Seitenüberlauf');
  check(errors.length===0,'Keine Skriptfehler: '+errors.join(';'));
  const out=process.env.PROBE_OUT||'/tmp/organisation-entscheidungsfuehrung';fs.mkdirSync(out,{recursive:true});
  await p.screenshot({path:`${out}/${width}-${theme}.png`,fullPage:true});
  await ctx.close();
 }
 console.log(`${checks} Oberflächenprüfungen bestanden (API abgefangen).`);
} finally {await browser.close();await new Promise(r=>server.close(r));}
