export class OfficeError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const PERSONS = { Alex: 'alex@wildemoehre.org', Lea: 'lea@wildemoehre.org' };
const STATES = ['pruefen','in_bearbeitung','wartet','erledigt'];
const TEXT = { title:500, finding:8000, next_action:4000, waiting_on:2000, completion_evidence:4000, reply_to:320, reply_subject:500, reply_body:16000, task_title:500, task_notes:12000 };
const SOURCE = /^https:\/\/(groups\.google\.com\/a\/freude-eg\.de\/g\/vorstand\/c\/[A-Za-z0-9_-]+|mail\.google\.com\/mail\/[^\s]+)$/;
const ID = /^(MFMAIL-\d{3}|VG-[a-f0-9-]{36}|TEST-[a-z0-9-]+)$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const asText = (v, n=500) => typeof v === 'string' ? v.trim().slice(0,n) : '';
const errorStatus = error => /^PT\d{3}$/.test(error?.code || '') ? Number(error.code.slice(2)) : /^22|^23/.test(error?.code || '') ? 400 : 500;
export function cleanPatch(raw={}) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new OfficeError(400,'Ungültige Eingabe.');
  const out={};
  for (const [key,value] of Object.entries(raw)) {
    if (key in TEXT) { if (typeof value !== 'string' || value.length>TEXT[key]) throw new OfficeError(400,'Text fehlt oder ist zu lang: '+key); out[key]=value.trim(); }
    else if (key==='priority') { if (typeof value!=='boolean') throw new OfficeError(400,'Priorität ist ungültig.'); out[key]=value; }
    else if (key==='status' && STATES.includes(value)) out[key]=value;
    else if (key==='owner' && ['',...Object.keys(PERSONS)].includes(value)) out[key]=value;
    else if (key==='task_assignee' && Object.keys(PERSONS).includes(value)) out[key]=value;
    else if (['due_on','task_due_on'].includes(key) && (value===null || (typeof value==='string' && DATE.test(value) && !Number.isNaN(Date.parse(value+'T00:00:00Z'))))) out[key]=value;
    else throw new OfficeError(400,'Ungültiges Feld: '+key);
  }
  if (out.title!==undefined && !out.title) throw new OfficeError(400,'Ein Titel wird benötigt.');
  if (out.reply_to && !/^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/.test(out.reply_to)) throw new OfficeError(400,'Bitte eine gültige Antwortadresse angeben.');
  return out;
}
export function taskPayload(item, people, workspace) {
  const who=item.task_assignee;
  if (!people[who]) throw new OfficeError(400,'Die zuständige Person ist in Asana nicht eindeutig verknüpft.');
  const marker='[Kompass Vorstand '+item.id+']';
  const notes=[item.task_notes,'',marker,'Original: '+item.source_url,'Kompass: https://kompass.wildehabitate.de/vorstand.html?id='+encodeURIComponent(item.id),'','Die Anlage der Aufgabe schließt den Mailvorgang nicht ab.'].join('\n');
  const data={ workspace, name:item.task_title, notes, assignee:people[who], followers:[...new Set(Object.values(people))] };
  if(item.task_due_on) data.due_on=item.task_due_on;
  return data;
}
export function makeHandler({db,password,asanaToken='',workspace,fetchImpl=fetch}) {
  const cors={ 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Headers':'content-type,x-gfweekly-key', 'Access-Control-Allow-Methods':'POST,OPTIONS', 'Cache-Control':'no-store' };
  const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});
  async function checked(promise) { const r=await promise; if(r.error)throw new OfficeError(errorStatus(r.error), errorStatus(r.error)<500?r.error.message:'Der gemeinsame Stand konnte nicht gespeichert werden.');return r.data; }
  const rpc=(name,args)=>checked(db.rpc(name,args));
  async function itemById(id) {
    if(!ID.test(id||''))throw new OfficeError(400,'Ungültiger Vorgang.');
    const row=await checked(db.from('hh_vorstand_cases').select('*').eq('id',id).eq('organization','mit-freude').maybeSingle());
    if(!row)throw new OfficeError(404,'Vorgang nicht gefunden.');return row;
  }
  async function people() {
    const rows=await checked(db.from('gfweekly_people').select('name,email,asana_gid'));
    const result={};
    for(const [who,email] of Object.entries(PERSONS)) {
      const matches=(rows||[]).filter(p=>(p.email||'').trim().toLowerCase()===email && /^\d+$/.test(p.asana_gid||''));
      if(matches.length!==1)throw new OfficeError(400,'Asana Zuordnung für '+who+' ist nicht eindeutig.');
      result[who]=matches[0].asana_gid;
    }
    return result;
  }
  async function asana(path,init={}) {
    if(!asanaToken)throw new OfficeError(503,'Die Asana Verbindung ist noch nicht eingerichtet.');
    const response=await fetchImpl('https://app.asana.com/api/1.0/'+path,{...init,headers:{'Authorization':'Bearer '+asanaToken,'Content-Type':'application/json','Accept':'application/json'},signal:AbortSignal.timeout(20000)});
    let body;try{body=await response.json();}catch{body={};}
    if(!response.ok)throw new OfficeError(response.status, asText(body.errors?.[0]?.message,200)||'Asana hat die Anfrage nicht bestätigt.');
    return body;
  }
  async function finish(item,state,task=null,message='',who='Alex') {
    return rpc('hh_vorstand_task_result',{p_id:item.id,p_claim:item.task_claim,p_state:state,p_gid:task?.gid||null,p_url:task?.permalink_url||null,p_error:message,p_completed:task?.completed??null,p_by:who});
  }
  return async req=>{
    if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
    if(req.method!=='POST')return json({error:'POST erforderlich.'},405);
    let body;try{const raw=await req.text();if(raw.length>100000)return json({error:'Eingabe zu groß.'},413);body=JSON.parse(raw);}catch{return json({error:'Ungültige Eingabe.'},400);}
    const given=body?.password||req.headers.get('x-gfweekly-key');
    if(!password || typeof given!=='string' || given!==password)return json({error:'Bitte den Kompass entsperren.'},401);
    const t=body.payload||{},who=t.by||t.who;
    try {
      if(body.action==='ping')return json({ok:true,version:1,asanaConfigured:!!asanaToken,drafts:'shared-kompass'});
      if(!Object.hasOwn(PERSONS,who))throw new OfficeError(400,'Bitte Alex oder Lea in der Kopfzeile wählen.');
      if(body.action==='lage') {
        const items=await checked(db.from('hh_vorstand_cases').select('*').eq('organization','mit-freude').order('priority',{ascending:false}).order('created_at'));
        return json({items,asanaConfigured:!!asanaToken,checked_at:new Date().toISOString()});
      }
      if(body.action==='case_save') {
        const patch=cleanPatch(t.patch);
        return json({item:await rpc('hh_vorstand_save',{p_id:t.id,p_version:t.version,p_patch:patch,p_by:who})});
      }
      if(body.action==='case_add') {
        const patch=cleanPatch(t.patch);const url=asText(t.source_url,1500);
        if(!SOURCE.test(url))throw new OfficeError(400,'Bitte den Originalverlauf in der Vorstandsgruppe oder Gmail verlinken.');
        if(!patch.title)throw new OfficeError(400,'Ein Titel wird benötigt.');
        const row=await checked(db.from('hh_vorstand_cases').insert({id:'VG-'+crypto.randomUUID(),...patch,organization:'mit-freude',source_url:url,last_by:who}).select().single());
        return json({item:row},201);
      }
      if(body.action==='task_create') {
        if(!asanaToken)throw new OfficeError(503,'Die Asana Verbindung ist noch nicht eingerichtet.');
        const ids=await people();
        if(!ID.test(t.id||''))throw new OfficeError(400,'Ungültiger Vorgang.');
        const claim=await rpc('hh_vorstand_task_claim',{p_id:t.id,p_version:t.version,p_claim:crypto.randomUUID(),p_by:who});
        if(claim.existing)return json({item:claim.item,existing:true});
        const item=claim.item;
        let task;
        try {
          const payload=taskPayload(item,ids,workspace);
          const r=await asana('tasks?opt_fields=gid,permalink_url,completed',{method:'POST',body:JSON.stringify({data:payload})});
          task=r.data;
          if(!/^\d+$/.test(task?.gid||'') || !/^https:\/\/app\.asana\.com\//.test(task?.permalink_url||''))throw new OfficeError(502,'Asana lieferte keinen eindeutigen Aufgabenbeleg.');
        }catch(error) {
          const definite=error instanceof OfficeError && error.status>=400 && error.status<500;
          const next=await finish(item,definite?'failed':'unclear',null,definite?error.message:'Die Anlage ist nicht eindeutig bestätigt. Vor einer Wiederholung Asana abgleichen.',who);
          return json({error:next.task_error,item:next},definite?400:409);
        }
        // Bei einem Speicherfehler nach externer Anlage bleibt der Auftrag reserviert.
        // Ein zweiter Klick erzeugt damit keine zweite Aufgabe. task_check findet den Beleg.
        return json({item:await finish(item,'created',task,'',who)},201);
      }
      if(body.action==='task_link') {
        const item=await itemById(t.id);
        if(!['creating','unclear'].includes(item.task_state)||item.asana_gid)throw new OfficeError(409,'Nur ein ungeklärter Auftrag kann so abgeglichen werden.');
        const url=asText(t.asana_url,1000),gid=/^https:\/\/app\.asana\.com\/[^\s]*?([0-9]+)\/?$/.exec(url)?.[1];
        if(!gid)throw new OfficeError(400,'Bitte den vollständigen Asana Aufgabenlink einfügen.');
        const r=await asana('tasks/'+gid+'?opt_fields=gid,notes,permalink_url,completed');
        if(!(r.data?.notes||'').includes('[Kompass Vorstand '+item.id+']'))throw new OfficeError(400,'Die Aufgabe enthält nicht die Quellenkennung dieses Vorgangs.');
        return json({item:await finish(item,'created',r.data,'',who)});
      }
      if(body.action==='task_check'||body.action==='task_release') {
        const item=await itemById(t.id);
        if(item.asana_gid) {
          const r=await asana('tasks/'+item.asana_gid+'?opt_fields=gid,completed,permalink_url');
          return json({item:await rpc('hh_vorstand_task_sync',{p_id:item.id,p_gid:item.asana_gid,p_completed:r.data.completed,p_by:who})});
        }
        if(!['creating','unclear'].includes(item.task_state))throw new OfficeError(400,'Für diesen Vorgang wurde noch keine Aufgabe angefordert.');
        const release=body.action==='task_release';
        if(release&&(t.confirm!==true||t.version!==item.version))throw new OfficeError(409,'Bitte den aktuellen Stand abgleichen und die Freigabe bestätigen.');
        const ids=await people(),found=[];let offset='';
        for(let page=0;page<10;page++) {
          const r=await asana('tasks?assignee='+ids[item.task_assignee]+'&workspace='+workspace+'&limit=100&modified_since='+encodeURIComponent(item.created_at||'1970-01-01T00:00:00Z')+'&opt_fields=gid,notes,permalink_url,completed'+(offset?'&offset='+encodeURIComponent(offset):''));
          for(const task of r.data||[])if((task.notes||'').includes('[Kompass Vorstand '+item.id+']'))found.push(task);
          offset=r.next_page?.offset||'';if(!offset)break;
        }
        if(offset)throw new OfficeError(409,'Der Abgleich ist nach 1000 Aufgaben noch unvollständig. Die Reservierung bleibt bestehen. Bitte den Aufgabenbestand prüfen.');
        if(found.length>1)return json({item,error:'Mehrere passende Aufgaben gefunden. Bitte den Originalbestand prüfen.'},409);
        if(!found.length){
          const releaseAllowed=Date.now()-Date.parse(item.updated_at)>120000;
          if(release&&releaseAllowed)return json({item:await finish(item,'failed',null,'Nach vollständigem Asana Abgleich zur erneuten Anlage freigegeben.',who)});
          return json({item,releaseAllowed,error:releaseAllowed?'Vollständiger Abgleich: keine passende Aufgabe gefunden. Eine erneute Anlage kann ausdrücklich freigegeben werden.':'Keine passende Aufgabe gefunden. Nach zwei Minuten erneut abgleichen, damit ein laufender Auftrag Zeit zum Abschluss hat.'},409);
        }
        return json({item:await finish(item,'created',found[0],'',who)});
      }
      throw new OfficeError(400,'Unbekannte Aktion.');
    }catch(error) {return json({error:error instanceof OfficeError?error.message:'Die Aktion konnte nicht bestätigt werden. Den aktuellen Stand neu laden.',code:error instanceof OfficeError?error.status:500},error instanceof OfficeError?error.status:500);}
  };
}
