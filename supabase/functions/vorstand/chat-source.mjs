import { OfficeError } from './office-error.mjs';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const STAGES=['besprochen','vorgeschlagen','entschieden','vorbereitet','umgesetzt','technisch_geprueft','fachlich_angenommen','wirkung_beobachtet'];
const LIMITS={thread_id:36,turn_id:36,occurred_at:40,evidence_stage:40,evidence_basis:40,leadership_relevance:4000,open_decision:4000,recommendation:4000,excerpt:2000};
export function chatSource(value){
  let u;try{u=new URL(value);}catch{throw new OfficeError(400,'Bitte den Originalchat verlinken.');}
  if(u.username||u.password||u.port)throw new OfficeError(400,'Der Quellenlink ist ungültig.');
  const id=u.protocol==='https:'&&u.hostname==='chatgpt.com'?/^\/c\/([^/]+)\/?$/.exec(u.pathname)?.[1]:u.protocol==='codex:'&&u.hostname==='threads'?/^\/([^/]+)\/?$/.exec(u.pathname)?.[1]:null;
  if(!UUID.test(id||''))throw new OfficeError(400,'Bitte einen konkreten ChatGPT oder Codex Chat verlinken.');
  return {thread_id:id.toLowerCase(),url:u.protocol==='codex:'?'codex://threads/'+id.toLowerCase():'https://chatgpt.com/c/'+id.toLowerCase()};
}
export function cleanInsight(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new OfficeError(400,'Die Angaben zur Chaterkenntnis fehlen.');
  const out={};
  for(const [key,value] of Object.entries(raw)){
    if(key==='references'){
      if(!Array.isArray(value)||value.length>10)throw new OfficeError(400,'Bitte höchstens zehn ergänzende Quellen angeben.');
      out.references=value.map(r=>{
        if(!r||Object.keys(r).some(k=>!['url','label'].includes(k))||typeof r.url!=='string'||r.url.length>1500||typeof r.label!=='string'||!r.label.trim()||r.label.length>500)throw new OfficeError(400,'Eine ergänzende Quelle ist ungültig.');
        let u;try{u=new URL(r.url);}catch{throw new OfficeError(400,'Eine ergänzende Quelle ist ungültig.');}
        if(u.username||u.password||u.port||!['https:','codex:'].includes(u.protocol))throw new OfficeError(400,'Bitte eine sichere ergänzende Quelle verlinken.');
        if(u.protocol==='codex:')chatSource(r.url);
        return {url:r.url.trim(),label:r.label.trim()};
      });
    }else{
      if(!Object.hasOwn(LIMITS,key)||typeof value!=='string'||value.length>LIMITS[key])throw new OfficeError(400,'Ungültige Angabe zur Chaterkenntnis: '+key);
      out[key]=value.trim();
    }
  }
  if(!UUID.test(out.thread_id||''))throw new OfficeError(400,'Der Originalchat muss eindeutig belegt sein.');
  if(out.turn_id&&!UUID.test(out.turn_id))throw new OfficeError(400,'Die Beitragskennung ist ungültig.');
  if(!out.turn_id&&!out.excerpt?.trim())throw new OfficeError(400,'Bitte den genauen Beitrag oder einen kurzen Belegauszug angeben.');
  out.thread_id=out.thread_id.toLowerCase();out.turn_id=(out.turn_id||'').toLowerCase();out.excerpt??='';
  const date=out.occurred_at||'';
  if(!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2}))?$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date.slice(0,10)+'T00:00:00Z').toISOString().slice(0,10)!==date.slice(0,10))throw new OfficeError(400,'Bitte das tatsächliche Quelldatum angeben.');
  if(!STAGES.includes(out.evidence_stage)||!out.leadership_relevance)throw new OfficeError(400,'Stand und Bedeutung für den Vorstand fehlen.');
  out.evidence_basis??='quellchat';
  if(!['original_geprueft','quellchat','offen'].includes(out.evidence_basis))throw new OfficeError(400,'Die Belegsicherheit ist ungültig.');
  out.open_decision??='';out.recommendation??='';out.references??=[];
  return out;
}
export function chatInput(payload){
  if(payload.organization!=='mit-freude')throw new OfficeError(400,'Diese Aufnahme ist ausschließlich für die mit Freude eG bestimmt.');
  const source=chatSource(payload.source_url),insight=cleanInsight(payload.insight);
  if(source.thread_id!==insight.thread_id)throw new OfficeError(400,'Quellenlink und Chatkennung stimmen nicht überein.');
  const prefix='chat:'+insight.thread_id+':'+(insight.turn_id||'manual')+':';
  if(typeof payload.source_key!=='string'||!payload.source_key.startsWith(prefix)||!/^[A-Za-z0-9._:-]{1,120}$/.test(payload.source_key.slice(prefix.length)))throw new OfficeError(400,'Die eindeutige Herkunft der Erkenntnis fehlt.');
  return {source_url:source.url,source_key:payload.source_key,source_kind:'chat',source_ids:[insight.thread_id,...(insight.turn_id?[insight.turn_id]:[])],insight};
}
