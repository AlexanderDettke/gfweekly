import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeHandler, cleanPatch, taskPayload } from '../supabase/functions/vorstand/handler.mjs';
const key='synthetic-office-test';
const base={id:'TEST-handler',organization:'mit-freude',version:1,title:'Synthetische Anfrage',source_url:'https://groups.google.com/a/freude-eg.de/g/vorstand/c/test-handler',task_title:'Prüfaufgabe',task_notes:'Nur synthetische Prüfung',task_assignee:'Alex',task_state:'none',asana_gid:null,created_at:'2026-10-22T03:00:00Z'};
function mockDb(){
  let row=structuredClone(base);const calls=[];
  const db={calls,get row(){return row;},set row(v){row=v;},
    from(table){return {select(){return table==='gfweekly_people'?Promise.resolve({data:[{email:'Alex@wildemoehre.org ',asana_gid:'11'},{email:'lea@wildemoehre.org',asana_gid:'22'}]}):this;},in(){return Promise.resolve({data:[{email:'alex@wildemoehre.org',asana_gid:'11'},{email:'lea@wildemoehre.org',asana_gid:'22'}]});},eq(){return this;},maybeSingle(){return Promise.resolve({data:row});}};},
    async rpc(name,p){calls.push({name,p});
      if(name==='hh_vorstand_task_claim'){
        if(row.asana_gid)return {data:{existing:true,item:structuredClone(row)}};
        if(['creating','unclear'].includes(row.task_state))return {error:{code:'PT409',message:'Zuerst in Asana abgleichen.'}};
        row={...row,task_claim:p.p_claim,task_state:'creating',version:row.version+1};return {data:{existing:false,item:structuredClone(row)}};
      }
      if(name==='hh_vorstand_task_result'){
        row={...row,task_state:p.p_state,task_error:p.p_error,asana_gid:p.p_gid,asana_url:p.p_url,version:row.version+1};return {data:structuredClone(row)};
      }
      throw new Error('unexpected RPC '+name);
    }
  };return db;
}
function request(action='task_create',payload={id:base.id,version:1,by:'Alex'},password=key){return new Request('https://example.invalid/vorstand',{method:'POST',body:JSON.stringify({action,payload,password})});}
test('Fail closed: fehlender oder falscher Zugang erlaubt keine Datenabfrage',async()=>{
  let calls=0;const db={from(){calls++;throw new Error('unexpected');}};
  for(const configured of ['',key]){const fn=makeHandler({db,password:configured});const r=await fn(request('lage',{by:'Lea'},'wrong'));assert.equal(r.status,401);}
  assert.equal(calls,0);
});
test('Felder sind begrenzt, Asana Belege und fremde Personen nicht beschreibbar',()=>{
  assert.throws(()=>cleanPatch({asana_gid:'1'}));assert.throws(()=>cleanPatch({owner:'Sebastian'}));assert.throws(()=>cleanPatch({reply_to:'ok@example.org\nBCC:other@example.org'}));assert.throws(()=>cleanPatch({reply_body:'x'.repeat(16001)}));
  assert.deepEqual(cleanPatch({owner:'Lea',task_due_on:null,status:'wartet'}),{owner:'Lea',task_due_on:null,status:'wartet'});
});
test('Aufgaben haben eindeutige Quelle und beide Beteiligten, keine erfundene Frist',()=>{
  const d=taskPayload(base,{Alex:'11',Lea:'22'},'33');assert.equal(d.assignee,'11');assert.deepEqual(d.followers,['11','22']);assert(!('due_on' in d));assert(d.notes.includes('[Kompass Vorstand TEST-handler]'));assert(d.notes.includes(base.source_url));assert(!('completed' in d));
});
test('Bestätigte Anlage liefert den echten Aufgabenbeleg; zweiter Klick erzeugt keine Dublette',async()=>{
  const db=mockDb();let count=0;const fn=makeHandler({db,password:key,asanaToken:'synthetic',workspace:'33',fetchImpl:async()=>{count++;return Response.json({data:{gid:'123',permalink_url:'https://app.asana.com/0/0/123',completed:false}},{status:201});}});
  const first=await fn(request());assert.equal(first.status,201);assert.equal((await first.json()).item.asana_gid,'123');
  const second=await fn(request());assert.equal(second.status,200);assert.equal((await second.json()).existing,true);assert.equal(count,1);
});
test('Unklarer externer Ausgang bleibt reserviert; Wiederholung erzeugt keine zweite Aufgabe',async()=>{
  const db=mockDb();let count=0;const fn=makeHandler({db,password:key,asanaToken:'synthetic',workspace:'33',fetchImpl:async()=>{count++;throw new TypeError('network lost');}});
  assert.equal((await fn(request())).status,409);assert.equal(db.row.task_state,'unclear');assert.equal((await fn(request())).status,409);assert.equal(count,1);
});
test('Asana Ablehnung wird nicht als erfolgreiche Anlage gespeichert',async()=>{
  const db=mockDb();const fn=makeHandler({db,password:key,asanaToken:'synthetic',workspace:'33',fetchImpl:async()=>Response.json({errors:[{message:'Forbidden'}]},{status:403})});
  assert.equal((await fn(request())).status,400);assert.equal(db.row.task_state,'failed');assert.equal(db.row.asana_gid,null);
});
test('Fehlender Aufgabenbeleg in einer 2xx Antwort ist kein Erfolg',async()=>{
  const db=mockDb();const fn=makeHandler({db,password:key,asanaToken:'synthetic',workspace:'33',fetchImpl:async()=>Response.json({data:{}})});
  assert.equal((await fn(request())).status,409);assert.equal(db.row.task_state,'unclear');
});
test('Speicherfehler nach Asana Anlage bleibt gesperrt und wird nicht erneut angelegt',async()=>{
  const db=mockDb(),rpc=db.rpc;db.rpc=async(name,p)=>name==='hh_vorstand_task_result'?{error:{code:'XX000',message:'temporary'}}:rpc(name,p);
  let count=0;const fn=makeHandler({db,password:key,asanaToken:'synthetic',workspace:'33',fetchImpl:async()=>{count++;return Response.json({data:{gid:'123',permalink_url:'https://app.asana.com/0/0/123'}});}});
  assert.equal((await fn(request())).status,500);assert.equal(db.row.task_state,'creating');assert.equal((await fn(request())).status,409);assert.equal(count,1);
});
test('Unklarer Auftrag kann über den eindeutigen Marker mit Asana abgeglichen werden',async()=>{
  const db=mockDb();db.row={...base,task_state:'unclear',task_claim:crypto.randomUUID()};
  const fn=makeHandler({db,password:key,asanaToken:'synthetic',workspace:'33',fetchImpl:async url=>{assert(url.includes('/tasks?assignee=11&workspace=33'));assert(url.includes('modified_since=2026-10-22T03%3A00%3A00Z'));return Response.json({data:[{gid:'123',notes:'[Kompass Vorstand TEST-handler]',permalink_url:'https://app.asana.com/0/0/123',completed:false}]});}});
  const r=await fn(request('task_check'));assert.equal(r.status,200);assert.equal((await r.json()).item.asana_gid,'123');
});

test('Erneute Anlage verlangt vollständigen Abgleich und ausdrückliche aktuelle Freigabe',async()=>{
 const db=mockDb();db.row={...base,task_state:'unclear',task_claim:crypto.randomUUID(),updated_at:new Date(Date.now()-180000).toISOString()};let reads=0;
 const fn=makeHandler({db,password:key,asanaToken:'synthetic',workspace:'33',fetchImpl:async()=>{reads++;return Response.json({data:[]});}});
 let r=await fn(request('task_check'));assert.equal(r.status,409);assert.equal((await r.json()).releaseAllowed,true);assert.equal(db.row.task_state,'unclear');
 assert.equal((await fn(request('task_release'))).status,409);assert.equal(reads,1);
 r=await fn(request('task_release',{id:base.id,version:1,by:'Alex',confirm:true}));assert.equal(r.status,200);assert.equal(db.row.task_state,'failed');
});
test('Unvollständige Suche gibt keine Reservierung frei',async()=>{
 const db=mockDb();db.row={...base,task_state:'unclear',task_claim:crypto.randomUUID(),updated_at:new Date(Date.now()-180000).toISOString()};let reads=0;
 const fn=makeHandler({db,password:key,asanaToken:'synthetic',workspace:'33',fetchImpl:async()=>{reads++;return Response.json({data:[],next_page:{offset:'more'}});}});
 const r=await fn(request('task_release',{id:base.id,version:1,by:'Alex',confirm:true}));assert.equal(r.status,409);assert.equal(db.row.task_state,'unclear');assert.equal(reads,10);
});

test('Direkter Asana Beleg wird nur mit der passenden Quellenkennung verknüpft',async()=>{
 const db=mockDb();db.row={...base,task_state:'unclear',task_claim:crypto.randomUUID()};let matching=false;
 const fn=makeHandler({db,password:key,asanaToken:'synthetic',workspace:'33',fetchImpl:async url=>{assert(url.includes('/tasks/123?'));return Response.json({data:{gid:'123',notes:matching?'[Kompass Vorstand TEST-handler]':'Andere Aufgabe',permalink_url:'https://app.asana.com/0/0/123'}});}});
 const payload={id:base.id,by:'Alex',asana_url:'https://app.asana.com/1/33/task/123'};assert.equal((await fn(request('task_link',payload))).status,400);assert.equal(db.row.asana_gid,null);matching=true;assert.equal((await fn(request('task_link',payload))).status,200);assert.equal(db.row.asana_gid,'123');
});
