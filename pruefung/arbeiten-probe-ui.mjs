/* V33a: ausschließlich lokale UI-Probe mit nachgebautem Backend, keine echten Backendaufrufe.
   node pruefung/arbeiten-probe-ui.mjs
   Optional: PLAYWRIGHT_MODUL=/pfad/playwright/index.mjs, PROBE_OUT=/tmp/arbeiten-probe-ui.
   Ohne Browser: node pruefung/arbeiten-probe-ui.mjs --logic-only
   Node >= 22.13 für die lokale Ausführung des TypeScript Funktionscodes.
   Prüft UI und Funktionscode mit Datenbankdouble, nicht Supabase, RLS oder den Live-Stand. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../site');
const out=process.env.PROBE_OUT || '/tmp/arbeiten-probe-ui'; fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
const base='http://arbeiten-probe.local';
// Use the 24 existing questions so the probe also covers real text lengths and all answer types.
const sql=fs.readFileSync(new URL('../supabase/migrations/20261009031412_hh_so_arbeiten_wir.sql',import.meta.url),'utf8');
const questions=[...sql.matchAll(/\((\d+),'([^']*)','([^']*)','(skala|zahl|wahl|text)','([^']*)',(true|false),'([^']*)',(\d+)\)/g)].map(m=>({nr:+m[1],thema:m[2],text:m[3],art:m[4],optionen:m[5],umgekehrt:m[6]==='true',hinweis:m[7],sort:+m[8]}));
assert.equal(questions.length,24);
let count=0;
const check=(name,ok)=>{assert.ok(ok,name);count++;console.log('✓ '+name);};
const stamp='2026-10-09T08:00:00Z';
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
function fixture(){return {
  ist:[{id:id(900),person:'Lea',ablauf:'Privater Entwurf',freigegeben:false,einordnung:'offen'}],
  systeme:[{id:id(100),name:'Notizen',wofuer:'Gemeinsame Vorgänge',beobachtung:'Stand festhalten',stand_quelle:'Probe 09.10.2026',reifegrad:'erprobung',einordnung:'offen'}],
  werkzeuge:Array.from({length:93},(_,i)=>({id:id(i+1),name:i===92?'SehrLangerWerkzeugnameOhneTrennzeichen'.repeat(3):`Werkzeug ${String(i+1).padStart(2,'0')}`,zweck:'Vorgänge festhalten',status:i<70?'aktiv':'aufbau',sichtbarkeit:i%3?'team':'gf',kuemmerer:i%2?'Alex':'Lea',quelle_der_wahrheit:i%2===0,url:'',stand:{reifegrad:'',einordnung:'offen',notiz:''}})),
  runden:[{nr:1,bezug:'die letzten vier Wochen',abgegeben_alex:null,abgegeben_lea:null}], antworten:[], next:1000
};}
function backend(state,action,p){
  const who=p.who, other=who==='Alex'?'Lea':'Alex', r=state.runden.at(-1), ab=w=>'abgegeben_'+w.toLowerCase();
  const own=()=>state.antworten.filter(x=>x.runde===r.nr&&x.person===who);
  const failure=(error,code=409)=>({code,data:{error}});
  if(action==='lage'){
    const beide=!!(r&&r.abgegeben_alex&&r.abgegeben_lea);
    return {who,andere:other,ist:{eigene:state.ist.filter(x=>x.person===who),andere:state.ist.filter(x=>x.person===other&&x.freigegeben),andere_gesamt:state.ist.filter(x=>x.person===other).length},systeme:state.systeme,werkzeuge:state.werkzeuge,umfrage:{fragen:questions,runde:r||null,runden:state.runden,beide,eigene:r?own():[],andere:beide?state.antworten.filter(x=>x.person===other&&x.runde===r.nr):[],verlauf:[]}};
  }
  if(action==='ist_save'){
    let x=state.ist.find(x=>x.id===p.id&&x.person===who);
    if(p.id&&!x)return failure('Steckbrief gehört nicht dir.',404);
    if(!x){x={id:id(state.next++),person:who,freigegeben:false,einordnung:'offen',beruehrt_andere:false};state.ist.push(x);}
    if(p.ablauf==='')return failure('Der Ablauf braucht einen Namen.',400);
    Object.assign(x,p);return {ist:x};
  }
  if(action==='ist_freigeben'){const x=state.ist.find(x=>x.id===p.id&&x.person===who);x.freigegeben=p.freigegeben;return {ist:x};}
  if(action==='ist_delete'){state.ist=state.ist.filter(x=>x.id!==p.id||x.person!==who);return {};}
  if(action==='system_save'){
    let x=state.systeme.find(x=>x.id===p.id);
    if(!x){x={id:id(state.next++),reifegrad:'alltag',einordnung:'offen'};state.systeme.push(x);}
    Object.assign(x,p);return {system:x};
  }
  if(action==='system_delete'){state.systeme=state.systeme.filter(x=>x.id!==p.id);return {};}
  if(action==='hub_stand_set'){const x=state.werkzeuge.find(x=>x.id===p.werkzeug_id);Object.assign(x.stand,p);return {stand:x.stand};}
  if(action==='antwort_set'){
    if(r[ab(who)])return failure('Schon abgegeben.');
    let x=own().find(x=>x.nr===p.nr);if(!x){x={person:who};state.antworten.push(x);}Object.assign(x,p);return {antwort:x};
  }
  if(action==='abgeben'){r[ab(who)]=stamp;return {beide:!!(r.abgegeben_alex&&r.abgegeben_lea)};}
  if(action==='abgabe_zurueck'){if(r[ab(other)])return failure('Andere Person hat schon abgegeben.');r[ab(who)]=null;return {};}
  if(action==='runde_neu'){if(!r.abgegeben_alex||!r.abgegeben_lea)return failure('Runde noch offen.');state.runden.push({nr:r.nr+1,bezug:r.bezug,abgegeben_alex:null,abgegeben_lea:null});return {};}
  throw new Error('Nicht nachgebaut: '+action);
}
// Execute the actual Edge Function locally. The fluent database double evaluates
// conditional updates after an injected competing write, without Supabase or network.
async function functionProbe(){
  const { stripTypeScriptTypes }=await import('node:module');
  const { default:vm }=await import('node:vm');
  const source=fs.readFileSync(new URL('../supabase/functions/arbeiten/index.ts',import.meta.url),'utf8');
  const code=stripTypeScriptTypes(source.replace(/^import .*createClient.*;$/m,''),{mode:'transform'});
  let handler, beforeUpdate=null;
  const tables={gfweekly_sa_runden:[],gfweekly_sa_fragen:[],gfweekly_sa_antworten:[],gfweekly_sa_log:[]};
  class Query{
    constructor(table){this.table=table;this.filters=[];this.write=null;}
    select(){return this;}eq(k,v){this.filters.push(x=>x[k]===v);return this;}
    is(k,v){this.filters.push(x=>x[k]===v);return this;}
    update(row){this.write=['update',row];return this;}
    insert(row){this.write=['insert',row];return this;}
    upsert(row){this.write=['upsert',row];return this;}
    execute(){
      if(this.write?.[0]==='update'&&beforeUpdate){const hook=beforeUpdate;beforeUpdate=null;hook();}
      const rows=tables[this.table], selected=rows.filter(x=>this.filters.every(f=>f(x)));
      if(this.write){
        const [kind,row]=this.write;
        if(kind==='update')selected.forEach(x=>Object.assign(x,row));
        else {const x=structuredClone(row);rows.push(x);return {data:x,error:null};}
      }
      return {data:structuredClone(selected[0]||null),error:null};
    }
    maybeSingle(){return Promise.resolve(this.execute());}single(){return this.maybeSingle();}
    then(resolve,reject){return Promise.resolve(this.execute()).then(resolve,reject);}
  }
  const db={from:table=>new Query(table)};
  vm.runInNewContext(code,{
    createClient:()=>db,Deno:{env:{get:()=> 'lokale-probe'},serve:fn=>handler=fn},
    Response,Date,Intl,console
  });
  const call=async(action,who,payload={})=>{
    const res=await handler(new Request('http://local.invalid',{method:'POST',body:JSON.stringify({action,password:'lokale-probe',payload:{who,runde:1,...payload}})}));
    return {status:res.status,...await res.json()};
  };
  check('Echte Funktion meldet Version 2',(await call('ping','Alex')).version===2);
  for(const who of ['Alex','Lea']){
    const own='abgegeben_'+who.toLowerCase(), other=who==='Alex'?'abgegeben_lea':'abgegeben_alex';
    const reset=()=>{tables.gfweekly_sa_runden=[{nr:1,abgegeben_alex:null,abgegeben_lea:null}];tables.gfweekly_sa_log=[];return tables.gfweekly_sa_runden[0];};
    let r=reset();r[own]=stamp;
    check(who+': Rücknahme ohne fremde Abgabe erlaubt',(await call('abgabe_zurueck',who)).status===200&&r[own]===null);
    r=reset();r[own]=stamp;r[other]=stamp;
    check(who+': Rücknahme nach fremder Abgabe ergibt 409',(await call('abgabe_zurueck',who)).status===409&&r[own]===stamp);
    r=reset();r[own]=stamp;beforeUpdate=()=>{r[other]=stamp;};
    check(who+': Fremde Abgabe zwischen Lesen und Update verhindert Rücknahme',(await call('abgabe_zurueck',who)).status===409&&r[own]===stamp&&tables.gfweekly_sa_log.length===0);
    r=reset();let d=await call('abgeben',who);const first=r[own];
    check(who+': Erste Abgabe gespeichert',d.status===200&&!!first&&tables.gfweekly_sa_log.length===1);
    d=await call('abgeben',who);
    check(who+': Doppelaufruf behält Zeitpunkt',d.schon===true&&r[own]===first&&tables.gfweekly_sa_log.length===1);
    r=reset();beforeUpdate=()=>{r[own]=stamp;};d=await call('abgeben',who);
    check(who+': Konkurrierende eigene Abgabe bleibt unverändert',d.schon===true&&d.runde[own]===stamp&&r[own]===stamp&&tables.gfweekly_sa_log.length===0);
    reset();tables.gfweekly_sa_fragen=[{nr:1,aktiv:false,art:'skala'}];tables.gfweekly_sa_antworten=[];
    check(who+': Inaktive Frage ergibt 404 ohne Antwort',(await call('antwort_set',who,{nr:1,wert:3})).status===404&&tables.gfweekly_sa_antworten.length===0);
    tables.gfweekly_sa_fragen[0].aktiv=true;
    check(who+': Aktive Frage weiterhin beantwortbar',(await call('antwort_set',who,{nr:1,wert:3})).status===200&&tables.gfweekly_sa_antworten[0].wert===3);
    check(who+': Fehlende Frage ergibt 404',(await call('antwort_set',who,{nr:99,wert:3})).status===404&&tables.gfweekly_sa_antworten.length===1);
  }
}
async function logicProbe(){
  const { default:vm }=await import('node:vm');
  const html=fs.readFileSync(path.join(root,'arbeiten.html'),'utf8');
  const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  for(const [,script] of scripts)new vm.Script(script);
  check('Inline JavaScript syntaktisch gültig',true);
  const tokens=new Set([...fs.readFileSync(path.join(root,'assets/styles.css'),'utf8').matchAll(/(--[\w-]+)\s*:/g)].map(m=>m[1]));
  const style=html.match(/<style>([\s\S]*?)<\/style>/)[1];
  check('Alle verwendeten CSS Tokens definiert',[...style.matchAll(/var\((--[\w-]+)/g)].every(m=>tokens.has(m[1])));
  check('Komponentenfarben ausschließlich Tokens',!/(?:#[0-9a-f]{3,8}\b|rgba?\(|hsla?\()/i.test(style));
  check('Keine Gedankenstriche in statischen Seitentexten',!/[–—]/.test(html));
  const nodes=new Map(), handlers=new Map(), inputs=[], hubDetails=[];
  class Node{
    constructor(){this.textContent='';this.innerHTML='';this.style={};this.attrs={};this.dataset={};this.value='';this.disabled=false;this.hidden=false;this.tabIndex=0;this.parents={};this.classList={toggle(){}};}
    setAttribute(k,v){this.attrs[k]=v;}removeAttribute(k){delete this.attrs[k];}getAttribute(k){return this.attrs[k]??null;}
    querySelectorAll(selector){return selector==='input,textarea,.chip'?inputs:[];}
    querySelector(){return null;}closest(selector){return this.parents[selector]||null;}
    matches(selector){return selector==='#sa input,#sa textarea'||(selector==='details.sa-hub'&&this.dataset.hub);}
    addEventListener(){}focus(){}select(){}
  }
  const node=key=>{if(!nodes.has(key))nodes.set(key,new Node());return nodes.get(key);};
  const state=fixture(), calls=[], destinations=[];let fail='', wait=0, selected='Alex', malformed=false;
  const ctx=vm.createContext({
    console, setTimeout, clearTimeout, Date, Map, Set, Promise, Number, Math, Error,
    location:{reload(){},hash:''},history:{replaceState(){}},
    sessionStorage:{removeItem(){},setItem(k,v){if(k==='gf_who')selected=v;}},
    document:{querySelector:node,querySelectorAll:selector=>selector==='details.sa-hub[open]'?hubDetails.filter(x=>x.open):[],addEventListener:(key,handler)=>handlers.set(key,handler)},
    gfPW:()=> 'lokale-probe',gfWho:()=>selected,gfSetWho:w=>selected=w,
    gfEsc:s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])),
    gfToast:m=>node('#toast').textContent=m,gfGate(){},gfMountTopbar(){},gfMountHero(){},
    fetch:async(url,opt)=>{
      const body=JSON.parse(opt.body);calls.push(body);destinations.push(url);if(wait)await new Promise(r=>setTimeout(r,wait));
      if(fail===body.action){fail='';return {status:500,ok:false,json:async()=>({error:'Lokaler Testfehler'})};}
      if(malformed&&body.action==='lage'){malformed=false;return {status:200,ok:true,json:async()=>({})};}
      const d=backend(state,body.action,body.payload), code=d.code||200;
      return {status:code,ok:code===200,json:async()=>structuredClone(d.data||d)};
    }
  });
  // The original chip renderer is executed too, so markup checks cover the real helper.
  const core=fs.readFileSync(path.join(root,'assets/core.js'),'utf8');
  vm.runInContext(core.slice(core.indexOf('function gfChips('),core.indexOf('function gfChipsSet(')),ctx);
  vm.runInContext(scripts.at(-1)[1],ctx);
  const run=code=>vm.runInContext(code,ctx);
  const reload=async()=>{await run('load()');};
  const flush=async()=>{await run('SAVE');};
  const input=(parent,field,value,extra={})=>{
    const el=new Node();el.value=value;el.dataset={f:field,...extra};el.parents=parent;inputs.push(el);return el;
  };
  const change=async el=>{handlers.get('change')({target:el});await flush();};
  await reload();
  check('Ladezustand endet mit geladenem Stand',node('#saStatus').textContent==='✓ Geladen'&&run('D.who')==='Alex');
  check('Leere Steckbriefanzeige',node('#saIstEigene').innerHTML.includes('Noch kein Steckbrief'));
  check('Privater Steckbrief wird nicht gerendert',!node('#saIstFremd').innerHTML.includes('Privater Entwurf'));
  check('Keine Auswertung vor beiden Abgaben',node('#saUmAusw').innerHTML==='');
  check('24 Fragen in Renderausgabe',(node('#saUmFragen').innerHTML.match(/data-frage=/g)||[]).length===24);
  check('Fragen haben zugängliche Beschriftungen',node('#saUmFragen').innerHTML.includes('aria-labelledby="frage-12"')&&node('#saUmFragen').innerHTML.includes('aria-label="Frage 1:'));
  const scaleMarkup=run('frageHtml(D.umfrage.fragen.find(f=>f.art==="skala"))');
  check('Skalenenden umschließen 1 bis 5 vor Nichtbeurteilung',scaleMarkup.indexOf('trifft gar nicht zu')<scaleMarkup.indexOf('data-v="1"')&&scaleMarkup.indexOf('data-v="5"')<scaleMarkup.indexOf('trifft voll zu')&&scaleMarkup.indexOf('trifft voll zu')<scaleMarkup.indexOf('data-v="kn"'));
  check('Skala nutzt ein gemeinsames verstecktes Feld',(scaleMarkup.match(/data-art="skala"/g)||[]).length===1&&scaleMarkup.includes('sa-scale-options'));
  const newIst=backend(state,'ist_save',{who:'Alex',ablauf:'Ablauf Probe'}).ist;await reload();
  const card=new Node();card.dataset.id=newIst.id;const stat=new Node();card.querySelector=()=>stat;
  await change(input({'[data-id]':card},'beruehrt_andere','1'));
  await change(input({'[data-id]':card},'einordnung','anpassen'));
  check('Steckbriefchips schreiben Boolean und Einordnung',newIst.beruehrt_andere&&newIst.einordnung==='anpassen');
  check('Steckbrieflabel verweist auf Feld',node('#saIstEigene').innerHTML.includes(`for="ist-${newIst.id}-ablauf"`));
  const q=(nr,art,v)=>input({},undefined,v,{nr:String(nr),art});
  wait=20;
  const scale=q(1,'skala','2'),example=q(1,'beispiel','Konkreter Vorgang');
  handlers.get('change')({target:scale});handlers.get('change')({target:example});
  check('Ausstehender Speicherzustand sichtbar: '+node('#saStatus').textContent,node('#saStatus').textContent==='○ Wird gespeichert …');
  await flush();wait=0;
  check('Antwort und Beispiel bei schnellen Änderungen erhalten',state.antworten.find(x=>x.nr===1).wert===2&&state.antworten.find(x=>x.nr===1).beispiel==='Konkreter Vorgang');
  await change(q(2,'skala','kn'));await change(q(12,'zahl','0'));await change(q(15,'text','Textantwort'));await change(q(21,'wahl','3'));await change(q(21,'beispiel','Beispiel zur Wahl'));
  check('Alle Antwortarten und Zahl 0 gespeichert',state.antworten.find(x=>x.nr===2).kann_nicht&&state.antworten.find(x=>x.nr===12).wert===0&&state.antworten.find(x=>x.nr===15).beispiel==='Textantwort'&&state.antworten.find(x=>x.nr===21).wert===3);
  fail='antwort_set';const failed=q(3,'skala','4');await change(failed);
  check('Speicherfehler sichtbar und erneut ausführbar',run('FAILED.size')===1&&failed.getAttribute('aria-invalid')==='true'&&node('#saStatus').textContent.includes('Lokaler Testfehler'));
  await assert.rejects(run('settled()'),/nicht gespeichert/);
  check('Fehler verhindert Abgabe und Neuladen',true);
  await run('for(const job of [...FAILED.values()])queueSave(job.key,job.el,job.run);');await flush();
  check('Wiederholung speichert die unveränderte Nutzlast',run('FAILED.size')===0&&state.antworten.find(x=>x.nr===3).wert===4);
  const bad=q(12,'zahl','2.5');const before=calls.length;await change(bad);
  check('Ungültige Zahl wird ohne Backendaufruf abgelehnt',calls.length===before&&state.antworten.find(x=>x.nr===12).wert===0&&bad.getAttribute('aria-invalid')==='true');
  bad.value='3';await change(bad);
  check('Korrektur hebt Speicherfehler auf',run('FAILED.size')===0&&state.antworten.find(x=>x.nr===12).wert===3&&bad.getAttribute('aria-invalid')===null);
  // A failed earlier write must not keep an obsolete retry job after a newer successful write.
  fail='antwort_set';wait=20;
  handlers.get('change')({target:q(4,'skala','1')});handlers.get('change')({target:q(4,'skala','5')});await flush();wait=0;
  check('Neuere Änderung ersetzt fehlgeschlagene ältere Änderung',run('FAILED.size')===0&&state.antworten.find(x=>x.nr===4).wert===5);
  const sys=new Node();sys.dataset.sys=state.systeme[0].id;
  await change(input({'[data-sys]':sys},'reifegrad','alltag'));await change(input({'[data-sys]':sys},'einordnung','behalten'));
  check('Systemchips schreiben den Stand',state.systeme[0].reifegrad==='alltag'&&state.systeme[0].einordnung==='behalten');
  const hub=new Node();hub.dataset.hub=state.werkzeuge[0].id;
  await change(input({'[data-hub]':hub},'reifegrad','erprobung'));await change(input({'[data-hub]':hub},'einordnung','umbauen'));
  check('Hubchips ändern nur die lokale Einordnung',state.werkzeuge[0].stand.einordnung==='umbauen'&&state.werkzeuge[0].status==='aktiv');
  run('HUBF="alle";renderHub();');
  check('93 Werkzeuge gerendert',(node('#saHub').innerHTML.match(/data-hub=/g)||[]).length===93);
  check('Hubwerkzeuge zunächst kompakt geschlossen',!node('#saHub').innerHTML.includes('<details open')&&(node('#saHub').innerHTML.match(/<summary /g)||[]).length===93);
  run('HUBF="offen";renderHub();');check('Noch offen lässt eingeordnetes Werkzeug aus',node('#saHubZahl').textContent==='92 von 93');
  run('HUBF="alle";renderHub();');
  const one=new Node(), two=new Node();one.dataset.hub=id(1);two.dataset.hub=id(2);one.open=two.open=true;hubDetails.push(one,two);
  handlers.get('toggle')({target:two});check('Öffnen schließt andere Hubbearbeitung',two.open&&!one.open);
  two.open=false;handlers.get('toggle')({target:two});check('Schließen lässt alle Hubzeilen geschlossen',hubDetails.every(x=>!x.open));
  run('HUBS="Werkzeug 09";renderHub();');check('Hub Suche grenzt ein',(node('#saHub').innerHTML.match(/data-hub=/g)||[]).length===1);
  run('HUBS="kein Treffer";renderHub();');check('Leere Suche erklärt',node('#saHub').innerHTML.includes('Keine Werkzeuge passen'));
  run('HUBS="";HUBF="gf";renderHub();');check('GF Filter',node('#saHubZahl').textContent==='31 von 93');
  // Capture the previous person before the request starts, even if a switch occurs in the meantime.
  wait=20;handlers.get('change')({target:q(5,'skala','4')});selected='Lea';await flush();wait=0;
  check('Ausstehende Änderung behält ursprüngliche Person',calls.at(-1).payload.who==='Alex'&&state.antworten.find(x=>x.nr===5).person==='Alex');
  await reload();check('Personenwechsel lädt neue Antworten',run('D.who')==='Lea'&&run('D.umfrage.eigene.length')===0);
  backend(state,'ist_freigeben',{who:'Alex',id:newIst.id,freigegeben:true});await reload();
  check('Freigegebener Ablauf der anderen Person sichtbar',node('#saIstFremd').innerHTML.includes('Ablauf Probe'));
  backend(state,'abgeben',{who:'Alex'});selected='Alex';await reload();
  const locked=q(1,'skala','1');inputs.push(locked);locked.parents['#saUmFragen']=new Node();run('controls()');
  check('Eigene Abgabe deaktiviert Felder',locked.disabled===true&&node('#saUmKnopf').innerHTML.includes('um-zurueck'));
  backend(state,'abgabe_zurueck',{who:'Alex'});await reload();check('Zurücknehmen entsperrt Felder',locked.disabled===false);
  backend(state,'abgeben',{who:'Alex'});backend(state,'antwort_set',{who:'Lea',runde:1,nr:1,wert:5,kann_nicht:false,beispiel:'Leas Beispiel'});backend(state,'abgeben',{who:'Lea'});await reload();
  check('Auswertung erst nach beiden Abgaben',node('#saUmAusw').innerHTML.includes('Konkreter Vorgang')&&node('#saUmAusw').innerHTML.includes('Leas Beispiel'));
  check('Auswertung enthält Wahlbeispiele und Zahl',node('#saUmAusw').innerHTML.includes('Beispiel zur Wahl')&&node('#saUmAusw').innerHTML.includes('3 h'));
  check('Auswertung ohne abgeleitete Personenbewertung',!node('#saUmAusw').innerHTML.includes('Handlungsbedarf')&&!node('#saUmAusw').innerHTML.includes('Belastung'));
  const original=structuredClone(state.antworten);
  const scales=questions.filter(f=>f.art==='skala');
  state.antworten=scales.map((f,i)=>({person:'Alex',runde:1,nr:f.nr,wert:f.umgekehrt?4:2,kann_nicht:false})).concat(scales.map(f=>({person:'Lea',runde:1,nr:f.nr,wert:f.umgekehrt?3:3,kann_nicht:false})));
  await reload();
  const common=()=>node('#saUmAusw').innerHTML.split('<h2>Größte Unterschiede</h2>')[0];
  check('Gemeinsame Sicht vor Unterschieden und höchstens sechs Aussagen',(common().match(/role="cell"/g)||[]).length===24&&common().includes('Wo es bei beiden hakt'));
  check('Gemeinsame Sicht beachtet beide Skalenrichtungen',run('D.umfrage.fragen.filter(f=>f.art==="skala").slice(0,6).every(f=>document.querySelector("#saUmAusw").innerHTML.split("<h2>Größte Unterschiede</h2>")[0].includes(f.text))'));
  const normal=scales.find(f=>!f.umgekehrt), inverse=scales.find(f=>f.umgekehrt);
  state.antworten=[normal,inverse].flatMap(f=>['Alex','Lea'].map(person=>({person,runde:1,nr:f.nr,wert:f.umgekehrt?4:2,kann_nicht:false})));
  await reload();check('Normale und umgekehrte Aussage bei gleichem kritischem Wert enthalten',common().includes(normal.text)&&common().includes(inverse.text));
  for(const x of state.antworten)x.wert=questions.find(f=>f.nr===x.nr).umgekehrt?2:4;
  await reload();check('Beide Richtungen bei unkritischen Werten ausgeschlossen',common().includes('Keine Aussage erreicht'));
  for(const x of state.antworten)x.wert=questions.find(f=>f.nr===x.nr).umgekehrt?3:3;
  await reload();check('Gemeinsamer Mittelwert unter 3,5 ausgeblendet',common().includes('Keine Aussage erreicht'));
  for(const x of state.antworten){const f=questions.find(f=>f.nr===x.nr);x.wert=f.umgekehrt?5:1;if(x.person==='Lea')x.kann_nicht=true;}
  await reload();check('Nicht beurteilbare Antworten ausgeschlossen',common().includes('Keine Aussage erreicht'));
  state.antworten=state.antworten.filter(x=>x.person==='Alex');await reload();check('Fehlende zweite Antwort ausgeschlossen',common().includes('Keine Aussage erreicht'));
  state.antworten=original;await reload();
  check('Beide Abgaben erlauben neue Runde und keine Rücknahme',node('#saUmKnopf').innerHTML.includes('um-neu')&&!node('#saUmKnopf').innerHTML.includes('um-zurueck'));
  backend(state,'runde_neu',{who:'Alex'});await reload();check('Neue Runde leer und entsperrt',run('D.umfrage.runde.nr')===2&&node('#saUmAusw').innerHTML===''&&!locked.disabled);
  fail='lage';await reload();
  check('Ladefehler entfernt alte vertrauliche Inhalte',run('D')===null&&node('#saUmAusw').innerHTML===''&&node('#saUmFragen').innerHTML.includes('Laden fehlgeschlagen'));
  await reload();check('Erneutes Laden erholt sich',run('D.who')==='Alex');
  malformed=true;await reload();check('Unvollständige Ladeantwort wird als Fehler behandelt',run('D')===null&&node('#saUmKnopf').textContent==='');
  await reload();
  state.runden=[];await reload();check('Keine Runde als Leerzustand',node('#saUmFragen').innerHTML.includes('Keine laufende Runde')&&!node('#saUmKnopf').innerHTML.includes('um-abgeben'));
  state.werkzeuge=[];await reload();check('Leeres Register benannt',node('#saHub').innerHTML.includes('Noch keine Werkzeuge'));
  check('Schreibaufrufe immer mit ursprünglicher Person',calls.filter(x=>x.action!=='lage').every(x=>['Alex','Lea'].includes(x.payload.who)));
  check('Probe sendet ausschließlich an arbeiten',destinations.every(url=>url.endsWith('/functions/v1/arbeiten')));
  console.log(`\n${count} statische und Logikprüfungen bestanden. Keine Layout- oder Browserabnahme.`);
}

await functionProbe();
if(process.argv.includes("--logic-only")){await logicProbe();}else{
const { chromium } = await import(process.env.PLAYWRIGHT_MODUL || '/Users/alexanderdettke/spiel-test/node_modules/playwright/index.mjs');
const browser=await chromium.launch();
try{
  for(const width of [390,1440])for(const theme of ['dark','light']){
    const tag=`${width}-${theme}`, state=fixture(), calls=[], errors=[], network=[];
    let fail='', delay=0;
    const ctx=await browser.newContext({viewport:{width,height:width===390?844:1000},locale:'de-DE',timezoneId:'Europe/Berlin'});
    await ctx.addInitScript(({theme})=>{
      localStorage.setItem('gf_theme',theme);sessionStorage.setItem('gf_pw','lokale-probe');
      if(!sessionStorage.getItem('gf_who')) sessionStorage.setItem('gf_who','Alex');
      const day=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin'}).format(new Date());
      for(const who of ['Alex','Lea'])localStorage.setItem(`gf_ci_${who}_${day}`,'1');
    },{theme});
    // No unmocked external request may leave the browser.
    await ctx.route('**/*',async route=>{
      const req=route.request(), url=req.url();
      if(url.startsWith(base+'/')){
        const file=path.resolve(root,'.'+new URL(url).pathname);
        if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return route.fulfill({status:404,body:''});
        return route.fulfill({status:200,contentType:mime[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});
      }
      if(!url.includes('/functions/v1/')){network.push(url);return route.fulfill({status:200,body:''});}
      const body=req.postDataJSON()||{};
      if(!url.endsWith('/arbeiten'))return route.fulfill({json:{people:[],items:[],topics:[]}});
      calls.push(body);if(delay)await new Promise(r=>setTimeout(r,delay));
      if(fail===body.action){fail='';return route.fulfill({status:500,json:{error:'Lokaler Testfehler'}});}
      const d=backend(state,body.action,body.payload);
      return route.fulfill({status:d.code||200,json:d.data||structuredClone(d)});
    });
    const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error'&&!/status of (500|400|409)/.test(m.text()))errors.push(m.text());});
    const ready=()=>page.waitForFunction(()=>document.querySelector('#sa').getAttribute('aria-busy')==='false'&&document.querySelector('#saStand b'));
    const saved=()=>page.waitForFunction(()=>typeof PENDING!=='undefined'&&PENDING===0);
    const tab=async name=>{await page.locator(`[data-tab=${name}]`).click();};
    const who=async name=>{await page.evaluate(name=>{gfSetWho(name);document.dispatchEvent(new CustomEvent('gf-who'));},name);await ready();};
    const screen=async name=>{await page.screenshot({path:path.join(out,`${name}-${tag}.png`),fullPage:true});};
    await page.goto(base+'/arbeiten.html');await ready();
    check(tag+': Theme und Navigation',await page.getAttribute('html','data-theme')===theme&&await page.locator('.sb-nav a[data-k=arbeiten].active').count()===1);
    await screen('start');
    await page.locator('[data-tab=start]').focus();await page.keyboard.press('ArrowRight');
    check(tag+': Tabs per Tastatur',await page.getAttribute('[data-tab=ist]','aria-selected')==='true'&&await page.locator('[data-tab=ist]').evaluate(el=>el===document.activeElement));
    check(tag+': Fokus sichtbar',await page.locator('[data-tab=ist]').evaluate(el=>getComputedStyle(el).outlineStyle==='solid'));
    check(tag+': Leere Steckbriefe und privater Entwurf verborgen',(await page.innerText('#saIstEigene')).includes('Noch kein')&&!(await page.innerText('#sa')).includes('Privater Entwurf'));
    await page.locator('[data-act=ist-neu]').click();await page.locator('[data-id]').waitFor();
    const card=page.locator('[data-id]').first();await card.locator('[data-f=ablauf]').fill('Newsletter freigeben');await card.locator('[data-f=haeufigkeit]').click();await saved();
    await card.locator('.chip[data-v="1"]').click();await saved();
    await card.locator('.chip[data-v=anpassen]').click();await saved();
    check(tag+': Steckbrief Chips gespeichert',state.ist.find(x=>x.person==='Alex').beruehrt_andere===true&&state.ist.find(x=>x.person==='Alex').einordnung==='anpassen');
    check(tag+': Beschriftung greift',await card.getByLabel('Ablauf',{exact:true}).count()===1);
    await card.locator('[data-act=ist-frei]').click();await page.waitForFunction(()=>!BUSY);await screen('ist');
    await who('Lea');await tab('ist');check(tag+': Freigegebener Ablauf sichtbar',(await page.innerText('#saIstFremd')).includes('Newsletter freigeben'));
    await who('Alex');await tab('umfrage');
    const q=nr=>page.locator(`[data-frage="${nr}"]`);
    check(tag+': 24 Fragen und keine vorzeitige Auswertung',await page.locator('[data-frage]').count()===24&&await page.innerText('#saUmAusw')==='');
    const scaleEnds=await q(1).locator('.enden').allTextContents();
    check(tag+': Skalenenden korrekt',scaleEnds.join('|')==='trifft gar nicht zu|trifft voll zu');
    check(tag+': Nichtbeurteilung unter Skalenende',await q(1).evaluate(el=>el.querySelector('[data-v="kn"]').getBoundingClientRect().top>=el.querySelectorAll('.enden')[1].getBoundingClientRect().bottom));
    // Answer + example before the first request has completed.
    delay=150;await q(1).locator('[data-v="2"]').click();await q(1).locator('summary').click();await q(1).locator('textarea').fill('Ein konkreter Vorgang');await q(2).locator('[data-v=kn]').click();await saved();delay=0;
    check(tag+': Schnelle Antwort und Beispiel bleiben erhalten',state.antworten.find(x=>x.person==='Alex'&&x.nr===1).wert===2&&state.antworten.find(x=>x.person==='Alex'&&x.nr===1).beispiel==='Ein konkreter Vorgang');
    check(tag+': Kann nicht beurteilen gespeichert',state.antworten.find(x=>x.nr===2).kann_nicht===true);
    await q(2).locator('[data-v="4"]').click();await saved();
    check(tag+': Zahl ersetzt Nichtbeurteilung',state.antworten.find(x=>x.nr===2).wert===4&&!state.antworten.find(x=>x.nr===2).kann_nicht&&await q(2).locator('[aria-pressed=true]').count()===1);
    await q(2).locator('[data-v=kn]').click();await saved();
    check(tag+': Nichtbeurteilung ersetzt Zahl',state.antworten.find(x=>x.nr===2).wert===null&&state.antworten.find(x=>x.nr===2).kann_nicht&&await q(2).locator('[aria-pressed=true]').count()===1);
    await q(12).locator('input').fill('0');await q(15).locator('textarea').fill('Übergabe dokumentieren');await q(21).locator('[data-v="3"]').click();await saved();
    await q(21).locator('summary').click();await q(21).locator('textarea').fill('Tagesliste und Übersicht');await q(24).locator('textarea').click();await saved();
    check(tag+': Zahl null, Text und Wahl gespeichert',state.antworten.find(x=>x.nr===12).wert===0&&state.antworten.find(x=>x.nr===15).beispiel==='Übergabe dokumentieren'&&state.antworten.find(x=>x.nr===21).wert===3);
    await screen('umfrage');
    fail='antwort_set';await q(3).locator('[data-v="4"]').click();await saved();
    check(tag+': Speicherfehler bleibt sichtbar',(await page.innerText('#saStatus')).includes('nicht gespeichert')&&await page.locator('[data-act=speichern-retry]').isVisible());
    await page.locator('[data-act=speichern-retry]').click();await saved();check(tag+': Speicherfehler erneut gespeichert',state.antworten.find(x=>x.nr===3).wert===4&&!await page.locator('[data-act=speichern-retry]').isVisible());
    await q(12).locator('input').fill('2.5');await q(24).locator('textarea').click();await saved();
    check(tag+': Keine stillschweigende Rundung',state.antworten.find(x=>x.nr===12).wert===0&&await q(12).locator('input').getAttribute('aria-invalid')==='true');
    await q(12).locator('input').fill('3');await q(24).locator('textarea').click();await saved();
    check(tag+': Korrigierte Zahl gespeichert',state.antworten.find(x=>x.nr===12).wert===3&&!await page.locator('[data-act=speichern-retry]').isVisible());
    await page.locator('[data-act=um-abgeben]').click();check(tag+': Erste Bestätigung sendet nichts',!state.runden[0].abgegeben_alex);
    await page.locator('[data-act=um-abgeben]').click();await ready();
    check(tag+': Abgabe sperrt alle Felder und Chips',await page.locator('#saUmFragen input:enabled,#saUmFragen textarea:enabled,#saUmFragen .chip:enabled').count()===0&&await page.locator('[data-act=um-zurueck]').count()===1);
    await page.locator('[data-act=um-zurueck]').click();await ready();check(tag+': Zurücknehmen entsperrt',await q(1).locator('[data-v="1"]').isEnabled());
    await page.locator('[data-act=um-abgeben]').click();await page.locator('[data-act=um-abgeben]').click();await ready();
    await who('Lea');await tab('umfrage');
    check(tag+': Andere Antworten bleiben vor zweiter Abgabe verborgen',await page.innerText('#saUmAusw')===''&&await q(1).locator('textarea').inputValue()==='');
    await q(1).locator('[data-v="1"]').click();await saved();await page.locator('[data-act=um-abgeben]').click();await page.locator('[data-act=um-abgeben]').click();await ready();
    check(tag+': Gemeinsame Auswertung ohne Wertung',(await page.innerText('#saUmAusw')).includes('Ein konkreter Vorgang')&&!(await page.innerText('#saUmAusw')).includes('Handlungsbedarf')&&await page.locator('[data-act=um-zurueck]').count()===0);
    check(tag+': Gemeinsame Auswertung wieder vorhanden',await page.locator('[aria-label="Wo es bei beiden hakt"] [role=row]').count()===2);
    check(tag+': Beispiele für Wahl erscheinen',(await page.innerText('#saUmAusw')).includes('Tagesliste und Übersicht'));
    await screen('auswertung');
    await page.locator('[data-act=um-neu]').click();await page.locator('[data-act=um-neu]').click();await ready();check(tag+': Neue Runde leer und bearbeitbar',state.runden.length===2&&await q(1).locator('[data-v="1"]').isEnabled()&&await page.innerText('#saUmAusw')==='');
    await tab('systeme');
    await page.locator('[data-sys] .chip[data-v=alltag]').click();await saved();await page.locator('[data-sys] .chip[data-v=behalten]').click();await saved();
    check(tag+': Systemchips gespeichert',state.systeme[0].reifegrad==='alltag'&&state.systeme[0].einordnung==='behalten');
    await page.locator('#saHubFilter .chip[data-v=alle]').click();check(tag+': 93 Werkzeuge ohne Fokusverlust',await page.locator('[data-hub]').count()===93&&await page.locator('#saHubFilter .chip[data-v=alle]').evaluate(el=>el===document.activeElement));
    await page.locator('#saHubSuche').fill('Werkzeug 09');check(tag+': Suche am Handy',await page.locator('[data-hub]').count()===1);
    if(width===390)check(tag+': Geschlossene Hubzeile höchstens 90 px',await page.locator('[data-hub]').evaluateAll(els=>els.every(el=>el.getBoundingClientRect().height<=90)));
    await page.locator('[data-hub] summary').click();
    await page.locator('[data-hub] .chip[data-v=erprobung]').click();await saved();await page.locator('[data-hub] .chip[data-v=umbauen]').click();await saved();
    check(tag+': Hubchips gespeichert',state.werkzeuge[8].stand.reifegrad==='erprobung'&&state.werkzeuge[8].stand.einordnung==='umbauen');
    check(tag+': Hubzusammenfassung aktualisiert',(await page.innerText('[data-hub] summary')).includes('✓ umbauen · in Erprobung'));
    await page.locator('#saHubSuche').fill('');
    if(width===390)check(tag+': Auch lange Namen kompakt',await page.locator('[data-hub]').evaluateAll(els=>els.every(el=>el.getBoundingClientRect().height<=90)));
    const rows=page.locator('[data-hub]');
    await rows.nth(0).locator('summary').focus();await page.keyboard.press('Enter');
    check(tag+': Hubbearbeitung per Tastatur',await rows.nth(0).getAttribute('open')!==null);
    await rows.nth(1).locator('summary').click();
    await page.waitForFunction(()=>document.querySelectorAll('[data-hub][open]').length===1&&!document.querySelector('[data-hub]').open);
    check(tag+': Nur eine Hubbearbeitung offen',await page.locator('[data-hub][open]').count()===1&&await rows.nth(0).getAttribute('open')===null);
    await page.locator('#saHubFilter .chip[data-v=offen]').click();
    check(tag+': Noch offen grenzt Hub ein',await page.locator('[data-hub]').count()===92&&(await page.innerText('#saHubZahl'))==='92 von 93'&&await page.locator(`[data-hub="${state.werkzeuge[8].id}"]`).count()===0);
    await page.locator('#saHubFilter .chip[data-v=alle]').click();
    await page.locator('#saHubSuche').fill('kein Treffer');check(tag+': Leere Suche benannt',(await page.innerText('#saHub')).includes('Keine Werkzeuge passen'));
    await page.locator('#saHubSuche').fill('');await screen('systeme');
    check(tag+': Bedienelemente mindestens 44 px',await page.locator('#sa button:visible,#sa input:not([type=hidden]):visible,#sa textarea:visible').evaluateAll(els=>els.every(e=>e.getBoundingClientRect().height>=44)));
    check(tag+': Kein horizontales Scrollen bei 93 Werkzeugen',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    for(const t of ['start','ist','umfrage']){await tab(t);check(tag+': '+t+' ohne Überbreite',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
    // A failed identity change must never leave the old person's answers on screen.
    fail='lage';await page.evaluate(()=>{gfSetWho('Alex');document.dispatchEvent(new CustomEvent('gf-who'));});await page.waitForFunction(()=>!BUSY&&document.querySelector('#saStatus').textContent.includes('Testfehler'));
    check(tag+': Fehler beim Personenwechsel entfernt alte Inhalte',await page.locator('[data-frage]').count()===0&&(await page.innerText('#saStatus')).includes('Testfehler'));
    await screen('ladefehler');await page.locator('[data-act=neu-laden]').click();await ready();check(tag+': Neu laden erholt sich',await page.locator('[data-frage]').count()===24);
    state.runden=[];await page.locator('[data-act=neu-laden]').click();await ready();await tab('umfrage');check(tag+': Keine Runde als Leerzustand',await page.locator('[data-act=um-abgeben]').count()===0&&(await page.innerText('#saUmFragen')).includes('Keine laufende Runde'));
    check(tag+': Keine Gedankenstriche in der Seite',!/[–—]/.test(await page.innerText('#sa')));
    check(tag+': Keine Skriptfehler',errors.length===0);
    check(tag+': Schreibaufrufe tragen Person',calls.filter(x=>x.action!=='lage').every(x=>['Alex','Lea'].includes(x.payload.who)));
    await ctx.close();
  }
  console.log(`\n${count} Prüfungen bestanden. Bildschirmproben: ${out}`);
}finally{await browser.close();}

}
