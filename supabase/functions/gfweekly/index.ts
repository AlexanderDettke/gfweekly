import { createClient } from 'jsr:@supabase/supabase-js@2';

const PASSWORD = Deno.env.get('GFWEEKLY_PASSWORD') ?? '';
const PROJECT_URL = Deno.env.get('SUPABASE_URL')!;
const PUBLIC_PAGE = PROJECT_URL + '/storage/v1/object/public/site/gfweekly.html';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-gfweekly-key',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};
function json(b: unknown, s = 200){ return new Response(JSON.stringify(b), { status:s, headers:{ ...cors, 'Content-Type':'application/json' } }); }
const admin = createClient(PROJECT_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
async function ensurePageInStorage(){ const { data } = await admin.from('gfweekly_assets').select('content').eq('key','page').single(); if(!data) return; const bytes = Uint8Array.from(atob(data.content), c=>c.charCodeAt(0)); await admin.storage.from('site').upload('gfweekly.html', bytes, { contentType:'text/html; charset=utf-8', upsert:true }); }

const PRIOS = ['hoch','mittel','niedrig'];
const STATUSES = ['offen','in_klaerung','erledigt'];
const TOPIC_FIELDS = ['title','context','decision','priority','status','kind','short_description','time_minutes','relevance','relevance_reason','relevance_source','recommendation','recommendation_source','owner','delegate_to','involved','needs_input_from','reviewer','approver','next_action','dependencies','notes','delegation_state','frequency','last_discussed','next_suggested','board_lane','lane_order'];
const LANES = ['zu_besprechen','in_klaerung','entschieden','erledigt'];
const INBOX_SOURCES = ['form','chat','calendar','manuell','meeting']; // entspricht CHECK gfweekly_inbox_source_check

/* v13: Passwort zusätzlich per Header (x-gfweekly-key oder Authorization: Bearer) — für ChatGPT-Actions / Connectoren,
   damit der Schlüssel nicht im Prompt stehen muss. Body-Passwort bleibt für die Website unverändert gültig. */
/* v15: Passwort liegt nicht mehr im Quelltext, sondern im Supabase-Secret GFWEEKLY_PASSWORD (fail closed). */
/* v14: Seitenverzeichnis für die Steuerungsmaske (gfweekly_sites, gfweekly_site_categories):
   sites_list, sites_save, sites_delete, category_save.
   v15 (13.09.2026): neues Passwort; Meta-Planung Stufe 2: cycle_get, ritual_toggle, ritual_save, ritual_delete,
   milestones_list, milestone_save, milestone_delete. */
function keyFromHeaders(req: Request): string {
  const h = req.headers.get('x-gfweekly-key'); if (h) return h.trim();
  const a = req.headers.get('authorization') || '';
  const m = a.match(/^Bearer\s+(.+)$/i); return m ? m[1].trim() : '';
}
function inboxRow(t: any){
  const raw = (t.raw_text ?? '').toString().trim(); if(!raw) return null;
  return {
    raw_text: raw.slice(0,4000), created_by:(t.created_by??'').toString().slice(0,120),
    source: INBOX_SOURCES.includes(t.source)?t.source:'form',
    urgency:(t.urgency??'').toString().slice(0,40), type_hint:(t.type_hint??'').toString().slice(0,60),
    related_hint:(t.related_hint??'').toString().slice(0,200), stakeholder_hint:(t.stakeholder_hint??'').toString().slice(0,200),
    due_hint:(t.due_hint??'').toString().slice(0,60), owner_hint:(t.owner_hint??'').toString().slice(0,120),
  };
}
const SITE_FIELDS = ['name','url','category','purpose','notes','login_user','login_password','login_note','status','preview'];
const SITE_STATUSES = ['aktiv','entwurf','archiv'];
/* v22 (14.09.2026): Habitat-Punkte, siehe Modul unten (checkin, score_get, score_event, score_events, score_rules; Vergabe in add/capture/update/decision_add/ritual_toggle/session_end/milestone_save).
   v21 (14.09.2026): Neuigkeiten (gfweekly_news): Ticker, Sichtungskorb (Kandidaten), Themenlage je Strang.
   Befüllt vom täglichen Cowork-Auftrag (news_add_many, Dedup über source_ref), gelesen von site/neuigkeiten.html. */
const NEWS_KINDS = ['ticker','kandidat','lage'];
const NEWS_SOURCES = ['notiz','asana','kalender','mail','protokoll','entscheidung','manuell'];
const NEWS_STATUS = ['neu','gesehen','uebernommen','verworfen'];
const NEWS_FIELDS = ['who','source','strand','title','body','quote','source_title','source_url','source_ref','relevance','topic_id','status','run_id'];
function newsRow(n: any){
  const title=(n.title??'').toString().trim(); if(!title) return null;
  const row: Record<string, unknown> = {
    kind: NEWS_KINDS.includes(n.kind) ? n.kind : 'ticker',
    happened_at: n.happened_at ? new Date(n.happened_at).toISOString() : new Date().toISOString(),
    who:(n.who??'').toString().slice(0,120), source: NEWS_SOURCES.includes(n.source)?n.source:'notiz',
    strand:(n.strand??'').toString().slice(0,60), title: title.slice(0,500), body:(n.body??'').toString().slice(0,6000),
    quote:(n.quote??'').toString().slice(0,3000), source_title:(n.source_title??'').toString().slice(0,300),
    source_url:(n.source_url??'').toString().slice(0,2000), source_ref:((n.source_ref??'').toString().trim().slice(0,300) || null),
    relevance: PRIOS.includes(n.relevance)?n.relevance:'mittel', topic_id: n.topic_id||null,
    status: NEWS_STATUS.includes(n.status)?n.status:'neu', run_id:(n.run_id??'').toString().slice(0,60),
  };
  if(isNaN(Date.parse(row.happened_at as string))) row.happened_at=new Date().toISOString();
  return row;
}
function slugKey(s: string){ return s.toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40) || 'sonstiges'; }

/* ===== v20 (14.09.2026): Bereinigen. Gleiche Marker-Logik wie gfTidyTopic in site/assets/core.js (dort gepflegt, hier gespiegelt).
   topicFromCapture zerlegt markierten Eingabetext („Titel: … Worum geht es: … Vorschlag: … Quelle: …“) sofort in Felder,
   tidy_suggest fragt die Anthropic-API nach einer Aufteilung (Secret ANTHROPIC_API_KEY, optional GFWEEKLY_TIDY_MODEL). ===== */
const TIDY_MARKERS: [string, string[]][] = [
  ["title",   ["Titel","Thema","Betreff"]],
  ["about",   ["Worum geht es","Worum geht’s","Worum geht's","Zusammenfassung","Kurz","Hintergrund","Kontext","Stand","Aktueller Stand","Agenda","Ziel","Situation","Entscheidungsgrundlage","Offen","Offene Fragen","Offene Punkte","Zu entscheiden in dieser Runde","Zu entscheiden","Zu klären","Lage","Ausgangslage"]],
  ["why",     ["Warum ins Weekly","Warum","Relevanz","Warum jetzt"]],
  ["next",    ["Vorschlag","Empfehlung","Nächster Schritt","Naechster Schritt","Nächste Schritte","Naechste Schritte","To do","Todo","Maßnahme","Massnahme","Aufgabe","Nächstes"]],
  ["owner",   ["Verantwortlich","Verantwortliche","Verantwortlichkeit","Verantwortung","Owner","Zuständig","Zustaendig"]],
  ["decision",["Entscheidung","Entschieden","Beschluss"]],
  ["notes",   ["Quelle","Quellen","Typ","Eingang","Notiz","Notizen","Hinweis","Anmerkung","Termin","Frist","Fällig","Faellig","Deadline"]],
];
const TIDY_KIND: Record<string,string> = {}; TIDY_MARKERS.forEach(([k,ls])=>ls.forEach(l=>TIDY_KIND[l.toLowerCase()]=k));
const TIDY_ALT = TIDY_MARKERS.flatMap(([,ls])=>ls).sort((a,b)=>b.length-a.length).map(l=>l.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');
const TIDY_RE = new RegExp('(?<![A-ZÄÖÜ])('+TIDY_ALT+')\\s*:','gu');
const TIDY_STRIP_L=/^[\s—–*_#>\u2600-\u27BF\uFE0F\u200D\p{Extended_Pictographic}]+/u, TIDY_STRIP_R=/[\s—–\-•*_#>\u2600-\u27BF\uFE0F\u200D\p{Extended_Pictographic}]+$/u;
const TIDY_SHORT = new Set(['title','next','owner','decision','notes']);
type Seg = { kind:string; label:string; text:string };
function tidyKind(label: string){ return TIDY_KIND[label.trim().replace(/\s+/g,' ').toLowerCase()] || null; }
function tidyClean(s: string){ return (s||'').replace(TIDY_STRIP_L,'').replace(TIDY_STRIP_R,'').trim(); }
function tidySegments(text: string): Seg[] {
  const src=(text||'').replace(/\r/g,'').replace(/^\s*[—–-]{1,2}\s*(.+?)\s*[—–-]{1,2}\s*$/gmu,'\n$1:\n');
  const raw: Seg[]=[]; let last=0, cur: Seg|null=null;
  for(const m of src.matchAll(TIDY_RE)){
    const kind=tidyKind(m[1]); if(!kind) continue;
    const before=tidyClean(src.slice(last, m.index));
    if(cur) cur.text=before; else if(before) raw.push({kind:'pre',label:'',text:before});
    cur={kind,label:m[1].trim(),text:''}; raw.push(cur); last=(m.index as number)+m[0].length;
  }
  const tail=tidyClean(src.slice(last)); if(cur) cur.text=tail; else if(tail) raw.push({kind:'pre',label:'',text:tail});
  const out: Seg[]=[];
  for(const s of raw){
    if(TIDY_SHORT.has(s.kind)){ const k=s.text.search(/\n\s*\n/); if(k>0){ out.push({...s,text:s.text.slice(0,k).trim()}); const rest=tidyClean(s.text.slice(k)); if(rest) out.push({kind:'pre',label:'',text:rest}); continue; } }
    out.push(s);
  }
  return out.filter(s=>s.kind!=='pre'||s.text);
}
function tidyHasMarkers(text: string){ for(const m of (text||'').matchAll(TIDY_RE)) if(tidyKind(m[1])) return true; return false; }
function firstSentence(s: string, max=180){ const t=(s||'').replace(/\s+/g,' ').trim(); if(!t) return ''; let m=t.match(/^.{20,}?[.!?](?=\s|$)/); if(m && m[0].length<45){ const m2=t.match(/^.{45,}?[.!?](?=\s|$)/); if(m2 && m2[0].length<=max) m=m2; } const out=(m?m[0]:t); return out.length>max?out.slice(0,max-1).trimEnd()+'…':out; }
/* Liefert Feldänderungen für ein Thema (title, context, short_description, next_action, owner, decision, notes) oder null. */
function tidyParse(t: Record<string, any>): { changes: Record<string,string>, found: string[] } | null {
  const title=(t.title||'').toString().trim(), context=(t.context||'').toString().trim();
  const titleDump=tidyHasMarkers(title) || title.length>140;
  const segs=(titleDump?tidySegments(title):[]).concat(tidySegments(context));
  if(!segs.some(s=>s.kind!=='pre')) return null;
  const pick=(k: string)=>segs.filter(s=>s.kind===k);
  const found=[...new Set(segs.filter(s=>s.kind!=='pre').map(s=>s.label))];
  const ch: Record<string,string>={};
  let newTitle=pick('title').map(s=>s.text).find(Boolean)||'';
  if(!newTitle && titleDump){ const ab=pick('about')[0]; newTitle=firstSentence(ab?ab.text:title,120); }
  if(newTitle){ newTitle=newTitle.replace(/\s+/g,' ').replace(/[.:]\s*$/,'').slice(0,300); if(newTitle!==title && (titleDump||!title)) ch.title=newTitle; }
  const ctxParts: string[]=[];
  segs.forEach(s=>{ if(s.kind==='pre'){ if(s.text && s.text!==title) ctxParts.push(s.text); return; } if(s.kind!=='about'||!s.text) return; const plain=/^(worum|zusammenfassung|kurz|kontext|hintergrund|lage|ausgangslage)/i.test(s.label); ctxParts.push(plain?s.text:(s.label+': '+s.text)); });
  pick('why').forEach(s=>{ if(s.text) ctxParts.push('Warum ins Weekly: '+s.text); });
  const newCtx=ctxParts.join('\n\n').trim(); if(newCtx!==context) ch.context=newCtx;
  if(!(t.short_description||'').toString().trim()){ const ab=segs.find(s=>(s.kind==='about'||s.kind==='pre')&&s.text&&s.text!==title); const sd=firstSentence(ab?ab.text:'',180); if(sd && sd!==(ch.title||title)) ch.short_description=sd; }
  const nx=pick('next').map(s=>s.text).filter(Boolean); if(nx.length){ const cur=(t.next_action||'').toString().trim(); const add=nx.filter(x=>!cur.includes(x)); if(add.length) ch.next_action=[cur,...add].filter(Boolean).join('\n'); }
  const ow=pick('owner').map(s=>s.text).find(Boolean); if(ow && !(t.owner||'').toString().trim()) ch.owner=ow.split(/[\n;]/)[0].slice(0,120);
  const dc=pick('decision').map(s=>s.text).filter(Boolean); if(dc.length && !(t.decision||'').toString().trim()) ch.decision=dc.join('\n');
  const nt=pick('notes').filter(s=>s.text).map(s=>s.label+': '+s.text); if(nt.length){ const cur=(t.notes||'').toString().trim(); const add=nt.filter(x=>!cur.includes(x)); if(add.length) ch.notes=[cur,...add].filter(Boolean).join('\n'); }
  if(!Object.keys(ch).length) return null;
  return { changes: ch, found };
}
const TIDY_FIELDS = ['title','short_description','context','next_action','owner','decision','notes'];
async function tidySuggestAI(topic: Record<string, any>){
  const key = Deno.env.get('ANTHROPIC_API_KEY') || '';
  if(!key) throw new Error('ANTHROPIC_API_KEY fehlt (Supabase-Secret setzen)');
  const model = Deno.env.get('GFWEEKLY_TIDY_MODEL') || 'claude-sonnet-5';
  const current = Object.fromEntries(TIDY_FIELDS.map(f=>[f,(topic[f]??'').toString()]));
  const system = `Du ordnest Einträge eines Geschäftsführungs-Boards (Wilde Möhre GmbH, Festival- und Kulturbetrieb; Geschäftsführung Alex und Lea) in saubere Felder.
Felder: title (kurzer Betreff, max. 90 Zeichen, kein Doppelpunkt-Präfix wie „Titel:“), short_description (ein Satz, was das Thema ist), context (Hintergrund, Stand, Fakten, Quellenhinweise in ganzen Sätzen oder knappen Absätzen; behalte alle Fakten, erfinde nichts), next_action (konkreter nächster Schritt, wenn einer im Text steht oder vorgeschlagen wird), owner (eine Person oder „Alex“, „Lea“, „Lea & Alex“, nur wenn im Text genannt), decision (nur was ausdrücklich als entschieden formuliert ist; Vorschläge gehören NICHT hierhin), notes (Quelle, Eingangsweg, Typ, Termine, Randbemerkungen).
Regeln: Nichts weglassen, was inhaltlich zählt; nichts hinzuerfinden; Wortlaut weitgehend behalten, nur Marker wie „Worum geht es:“ entfernen; Sprache Deutsch; lasse ein Feld unverändert (weg), wenn es schon passend gefüllt ist; gib nur Felder zurück, die sich ändern.`;
  const body = {
    model, max_tokens: 2000, system,
    tools: [{ name:'set_fields', description:'Gibt die bereinigten Felder zurück. Nur geänderte Felder angeben.',
      input_schema: { type:'object', properties: Object.fromEntries(TIDY_FIELDS.map(f=>[f,{type:'string'}])), additionalProperties:false } }],
    tool_choice: { type:'tool', name:'set_fields' },
    messages: [{ role:'user', content: 'Aktueller Eintrag als JSON:\n'+JSON.stringify(current, null, 1) }],
  };
  const res = await fetch('https://api.anthropic.com/v1/messages', { method:'POST', headers:{ 'content-type':'application/json', 'x-api-key':key, 'anthropic-version':'2023-06-01' }, body: JSON.stringify(body) });
  const data = await res.json();
  if(!res.ok) throw new Error('Anthropic: '+(data?.error?.message || res.status));
  const tool = (data.content||[]).find((c: any)=>c.type==='tool_use');
  const input = (tool?.input || {}) as Record<string, unknown>;
  const changes: Record<string,string> = {};
  for(const f of TIDY_FIELDS){ const v=input[f]; if(typeof v==='string' && v.trim() && v.trim()!==current[f].trim()) changes[f]=v.trim().slice(0, f==='title'?300:6000); }
  return { changes, model, usage: data.usage };
}

/* ===== v22 (14.09.2026): Habitat-Punkte. Eine Währung (Taler), je Person zugeschrieben, gemeinsamer Jahrestopf.
   Vergabe passiert serverseitig in den bestehenden Actions (add, capture, update, decision_add, ritual_toggle, session_end,
   milestone_save) sowie in checkin. Antworten tragen zusätzlich `gains` (Liste der gerade vergebenen Taler).
   Regeln und Stufen liegen in gfweekly_score_rules und gfweekly_score_levels und lassen sich ohne Code ändern.
   Konzept: Projektwissen „gfweekly_Plan_V16_Habitatpunkte“. ===== */
type Gain = { kind:string; points:number; who:string; label:string; icon:string; ref?:string };
type Rule = { kind:string; points:number; cap_per_day:number|null; label:string; icon:string };
let RULES_CACHE: { at:number; rules:Record<string,Rule> } | null = null;
async function scoreRules(): Promise<Record<string,Rule>> {
  if (RULES_CACHE && Date.now()-RULES_CACHE.at < 60000) return RULES_CACHE.rules;
  const { data } = await admin.from('gfweekly_score_rules').select('*');
  const rules: Record<string,Rule> = {}; for (const r of (data||[])) rules[r.kind]=r;
  RULES_CACHE = { at: Date.now(), rules }; return rules;
}
function whoNorm(w: unknown): string { const s=(w??'').toString().toLowerCase(); if(s.includes('lea')) return 'Lea'; if(s.includes('alex')) return 'Alex'; return 'Team'; }
function dayOf(t: any): string { const d=(t?.local_day??'').toString(); return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : new Date().toISOString().slice(0,10); }
function isoWeek(day: string): string { const d=new Date(day+'T00:00:00Z'); const dn=(d.getUTCDay()+6)%7; d.setUTCDate(d.getUTCDate()-dn+3); const y=d.getUTCFullYear(); const jan4=new Date(Date.UTC(y,0,4)); const w=1+Math.round(((d.getTime()-jan4.getTime())/86400000-3+((jan4.getUTCDay()+6)%7))/7); return `${y}-W${String(w).padStart(2,'0')}`; }
function addDays(day: string, n: number){ const d=new Date(day+'T00:00:00Z'); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0,10); }
function isWeekend(day: string){ const g=new Date(day+'T00:00:00Z').getUTCDay(); return g===0||g===6; }
/* Vergibt Taler. ref_id macht die Vergabe einmalig (je kind, ref_id, who). cap_per_day begrenzt je Person und Tag. */
async function award(gains: Gain[], kind: string, who: string, refType: string, refId: string, day: string, extra=0, note=''): Promise<Gain|null> {
  const rules = await scoreRules(); const r = rules[kind]; if(!r) return null;
  const w = whoNorm(who); const points = (r.points||0) + extra;
  if (r.cap_per_day) {
    const { count } = await admin.from('gfweekly_score_events').select('id',{count:'exact',head:true}).eq('kind',kind).eq('who',w).eq('day',day);
    if ((count||0) >= r.cap_per_day) return null;
  }
  const row = { who:w, kind, points, ref_type:refType, ref_id:refId||'', day, week:isoWeek(day), year:parseInt(day.slice(0,4)), note:note.slice(0,300) };
  const { error } = await admin.from('gfweekly_score_events').insert(row);
  if (error) { if ((error as any).code==='23505') return null; throw error; }
  const g: Gain = { kind, points, who:w, label:r.label, icon:r.icon, ref:refId }; gains.push(g); return g;
}
async function hasEvent(kind: string, refId: string, who?: string){ let q=admin.from('gfweekly_score_events').select('id',{count:'exact',head:true}).eq('kind',kind).eq('ref_id',refId); if(who) q=q.eq('who',whoNorm(who)); const { count }=await q; return (count||0)>0; }
function topicComplete(row: any){ return !!((row.title||'').toString().trim() && (row.short_description||'').toString().trim() && ((row.owner||'').toString().trim() || (row.next_action||'').toString().trim())); }
/* Übergänge eines Themas bewerten (nach Update): erledigt, Altlast, Saat, Bewegen */
async function scoreTopicTransition(gains: Gain[], before: any, after: any, who: string, day: string){
  if(!before||!after) return;
  const wasDone = before.board_lane==='erledigt' || before.status==='erledigt';
  const isDone = after.board_lane==='erledigt' || after.status==='erledigt';
  if(isDone && !wasDone){
    await award(gains,'thema_erledigt',who,'topic',after.id,day);
    const ageDays=(Date.now()-new Date(after.created_at).getTime())/86400000;
    if(ageDays>90) await award(gains,'altlast',who,'topic',after.id,day);
  }
  const decidedNow = (after.board_lane==='entschieden' && before.board_lane!=='entschieden') || (isDone && !wasDone);
  if(decidedNow && after.kind!=='recurring'){ const creator=whoNorm(after.created_by); if(creator!=='Team') await award(gains,'saat',creator,'topic',after.id,day); }
  const hadBoth = (before.owner||'').toString().trim() && (before.next_action||'').toString().trim();
  const hasBoth = (after.owner||'').toString().trim() && (after.next_action||'').toString().trim();
  if(hasBoth && !hadBoth) await award(gains,'bewegen',who,'topic',after.id,day);
}
/* Serie: Tage in Folge mit Check-in, Wochenenden zählen nicht als Lücke */
async function streakFor(who: string, day: string){
  const { data } = await admin.from('gfweekly_checkins').select('day,hour').eq('who',whoNorm(who)).lte('day',day).order('day',{ascending:false}).limit(120);
  const days=new Set((data||[]).map((r: any)=>r.day)); if(!days.has(day)) return { streak:0, days:[] as string[] };
  let n=0, cur=day; const list: string[]=[];
  while(days.has(cur)){ n++; list.push(cur); let prev=addDays(cur,-1); while(isWeekend(prev) && !days.has(prev)) prev=addDays(prev,-1); cur=prev; }
  return { streak:n, days:list };
}
async function doCheckin(gains: Gain[], who: string, day: string, hour: number){
  const w=whoNorm(who); if(w==='Team') return { first:false, streak:0 };
  const { error } = await admin.from('gfweekly_checkins').insert({ who:w, day, hour });
  const first = !error; if(error && (error as any).code!=='23505') throw error;
  if(first) await award(gains,'einchecken',w,'checkin',`${w}:${day}`,day);
  const { streak, days } = await streakFor(w, day);
  if(first){ const start=days[days.length-1]; for(const n of [3,7,14,30]) if(streak===n) await award(gains,`serie_${n}`,w,'serie',`${w}:${start}:${n}`,day); if(streak>30 && streak%30===0) await award(gains,'serie_30',w,'serie',`${w}:${days[days.length-1]}:${streak}`,day,0,`${streak} Tage`); }
  return { first, streak };
}
/* Tages- und Wochenziel */
const DAY_GOALS: [string,string,string][] = [
  ['erledigen','Ein Thema erledigen','thema_erledigt'],
  ['verantwortung','Einem Thema Verantwortung und nächsten Schritt geben','bewegen'],
  ['ritual','Ein Ritual abhaken','ritual'],
  ['einbringen','Ein vollständiges Thema einbringen','thema_vollstaendig'],
  ['entscheiden','Eine Entscheidung festhalten','entscheidung'],
];
function dayGoal(day: string){ const n=parseInt(day.replace(/-/g,''),10); return DAY_GOALS[n % DAY_GOALS.length]; }
async function checkGoals(gains: Gain[], who: string, day: string){
  const w=whoNorm(who); if(w==='Team') return;
  const [key,label,kind]=dayGoal(day);
  const { count } = await admin.from('gfweekly_score_events').select('id',{count:'exact',head:true}).eq('kind',kind).eq('who',w).eq('day',day);
  if((count||0)>0) await award(gains,'tagesziel',w,'goal',`${w}:${day}:${key}`,day,0,label);
  const week=isoWeek(day);
  const [{ count: sess },{ count: dec }] = await Promise.all([
    admin.from('gfweekly_score_events').select('id',{count:'exact',head:true}).eq('kind','besprechung').eq('week',week),
    admin.from('gfweekly_score_events').select('id',{count:'exact',head:true}).eq('kind','entscheidung').eq('week',week),
  ]);
  if((sess||0)>0 && (dec||0)>=2) for(const p of ['Alex','Lea']) await award(gains,'wochenziel',p,'goal',`${p}:${week}`,day);
}
/* Abzeichen: einmal je Jahr, je 25 Taler */
const BADGES: [string,string,string][] = [
  ['erste-entscheidung','Erste Entscheidung','Team'],['zehn-entscheidungen','Zehn Entscheidungen','Team'],['altlast','Altlast geräumt','Team'],
  ['fruehaufsteher','Frühaufsteher','who'],['marathon','Marathon','Team'],['kurz-und-knackig','Kurz und knackig','Team'],['leere-agenda','Leere Agenda','Team'],
  ['ritualmeister','Ritualmeister','Team'],['meilenstein','Meilenstein gesetzt','Team'],['protokollant','Protokollant','Team'],['wochenmail','Vier Wochen Wochenmail','Team'],
  ['jahresring','Jahresring','Team'],['drei-tage','Drei Tage in Folge','who'],['volle-woche','Volle Woche','who'],['ein-monat','Ein Monat','who'],
  ['saatgut','Saatgut','who'],['gaertner','Gärtner','who'],['vollstaendig','Vollständig','who'],['tagesziel-serie','Tagesziel-Serie','who'],
];
async function grantBadge(gains: Gain[], key: string, who: string, year: number, day: string, ref=''){
  const w = BADGES.find(b=>b[0]===key)?.[2]==='who' ? whoNorm(who) : 'Team'; if(w==='Team' && BADGES.find(b=>b[0]===key)?.[2]==='who') return null;
  const { error } = await admin.from('gfweekly_badges').insert({ key, who:w, year, ref });
  if(error){ if((error as any).code==='23505') return null; throw error; }
  const label=BADGES.find(b=>b[0]===key)?.[1]||key;
  const g=await award(gains,'abzeichen', w==='Team'?'Team':w,'badge',`${key}:${w}:${year}`,day,0,label);
  if(g){ g.label='Abzeichen: '+label; g.icon='abzeichen-'+key; (g as any).badge=key; }
  return g;
}
async function countEv(kind: string, year: number, who?: string){ let q=admin.from('gfweekly_score_events').select('id',{count:'exact',head:true}).eq('kind',kind).eq('year',year); if(who) q=q.eq('who',who); const { count }=await q; return count||0; }
async function checkBadges(gains: Gain[], who: string, day: string, ctx: Record<string, any> = {}){
  const year=parseInt(day.slice(0,4)); const w=whoNorm(who);
  if(await countEv('entscheidung',year)>=1) await grantBadge(gains,'erste-entscheidung',w,year,day);
  if(await countEv('entscheidung',year)>=10) await grantBadge(gains,'zehn-entscheidungen',w,year,day);
  if(await countEv('altlast',year)>=1) await grantBadge(gains,'altlast',w,year,day);
  if(await countEv('meilenstein',year)>=1) await grantBadge(gains,'meilenstein',w,year,day);
  if(await countEv('besprechung',year)>=5) await grantBadge(gains,'protokollant',w,year,day);
  if(w!=='Team'){
    if(await countEv('thema_neu',year,w)+await countEv('thema_vollstaendig',year,w)>=10) await grantBadge(gains,'saatgut',w,year,day);
    if(await countEv('saat',year,w)>=5) await grantBadge(gains,'gaertner',w,year,day);
    if(await countEv('thema_vollstaendig',year,w)>=10) await grantBadge(gains,'vollstaendig',w,year,day);
    if(await countEv('tagesziel',year,w)>=7) await grantBadge(gains,'tagesziel-serie',w,year,day);
    const { count: early } = await admin.from('gfweekly_checkins').select('who',{count:'exact',head:true}).eq('who',w).lt('hour',8).gte('day',`${year}-01-01`);
    if((early||0)>=5) await grantBadge(gains,'fruehaufsteher',w,year,day);
    if(ctx.streak>=3) await grantBadge(gains,'drei-tage',w,year,day);
    if(ctx.streak>=7) await grantBadge(gains,'volle-woche',w,year,day);
    if(ctx.streak>=30) await grantBadge(gains,'ein-monat',w,year,day);
  }
  if(ctx.session){ const s=ctx.session; const log=Array.isArray(s.summary)?s.summary:[]; const dur=(new Date(s.ended_at).getTime()-new Date(s.started_at).getTime())/60000;
    if(log.length>=10) await grantBadge(gains,'marathon',w,year,day,s.id);
    if(dur<20 && log.filter((l: any)=>l.outcome&&l.outcome!=='besprochen').length>=3) await grantBadge(gains,'kurz-und-knackig',w,year,day,s.id);
    if(ctx.agendaLeer) await grantBadge(gains,'leere-agenda',w,year,day,s.id); }
  if(ctx.phaseComplete) await grantBadge(gains,'ritualmeister',w,year,day,ctx.phaseKey||'');
  const { data: wm } = await admin.from('gfweekly_score_events').select('week').eq('kind','wochenmail').eq('year',year);
  if(new Set((wm||[]).map((x: any)=>x.week)).size>=4) await grantBadge(gains,'wochenmail',w,year,day);
}
async function scoreState(who: string, day: string){
  const year=parseInt(day.slice(0,4)); const week=isoWeek(day); const w=whoNorm(who);
  const [{ data: ev },{ data: lv },{ data: bd },{ data: sess }] = await Promise.all([
    admin.from('gfweekly_score_events').select('who,kind,points,day,week').eq('year',year),
    admin.from('gfweekly_score_levels').select('*').order('threshold',{ascending:true}),
    admin.from('gfweekly_badges').select('*').eq('year',year).order('earned_at',{ascending:false}),
    admin.from('gfweekly_sessions').select('ended_at').not('ended_at','is',null).order('ended_at',{ascending:false}).limit(60),
  ]);
  const events=ev||[]; const total=events.reduce((n: number,e: any)=>n+e.points,0);
  const weekPts=events.filter((e: any)=>e.week===week).reduce((n: number,e: any)=>n+e.points,0);
  const todayPts=events.filter((e: any)=>e.day===day && e.who===w).reduce((n: number,e: any)=>n+e.points,0);
  const levels=lv||[]; let level=levels[0], next: any=null; for(const l of levels){ if(total>=l.threshold) level=l; else { next=l; break; } }
  const rank = weekPts>=600?'gold':weekPts>=350?'silber':weekPts>=150?'bronze':'';
  const { streak } = w==='Team' ? { streak:0 } : await streakFor(w, day);
  const weeksWithSession=new Set((sess||[]).map((s: any)=>isoWeek(s.ended_at.slice(0,10)))); let fire=0; while(fire<60 && weeksWithSession.has(isoWeek(addDays(day,-7*fire)))) fire++;
  const [gk,gl,gkind]=dayGoal(day);
  const goalDone = events.some((e: any)=>e.kind==='tagesziel' && e.day===day && e.who===w);
  const weekGoalDone = events.some((e: any)=>e.kind==='wochenziel' && e.week===week);
  const perKind: Record<string,number> = {}; for(const e of events) perKind[e.kind]=(perKind[e.kind]||0)+e.points;
  return { year, week, day, who:w, total, weekPts, todayPts, level:{ key:level?.key, label:level?.label, threshold:level?.threshold, image:level?.image }, next: next?{ key:next.key,label:next.label,threshold:next.threshold }:null, rank, streak, fire, goal:{ key:gk, label:gl, kind:gkind, done:goalDone }, weekGoal:{ label:'Eine Besprechung abschließen und zwei Entscheidungen festhalten', done:weekGoalDone }, badges:(bd||[]).map((b: any)=>({ key:b.key, who:b.who, earned_at:b.earned_at, label:(BADGES.find(x=>x[0]===b.key)||[])[1]||b.key })), perKind, checkedInToday: w!=='Team' && streak>0 };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method === 'GET') { try { await ensurePageInStorage(); } catch(_e){} return new Response(null,{ status:302, headers:{ 'Location':PUBLIC_PAGE, 'Cache-Control':'no-store' } }); }
  if (req.method !== 'POST') return json({ error:'method' }, 405);
  let body: any; try { body = await req.json(); } catch { return json({ error:'bad json' }, 400); }
  const { action, password, payload } = body ?? {};
  const given = (password ?? '').toString() || keyFromHeaders(req);
  if (!PASSWORD || given !== PASSWORD) return json({ error:'unauthorized' }, 401);
  const t = payload ?? {};
  const gains: Gain[] = []; const DAY = dayOf(t); const WHO = whoNorm(t.who ?? t.created_by ?? t.updated_by ?? t.done_by ?? t.decided_by ?? t.started_by ?? t.ended_by ?? '');

  try {
    if (action === 'ping') return json({ ok:true, version:22, secretConfigured: !!PASSWORD, aiConfigured: !!Deno.env.get('ANTHROPIC_API_KEY') });
    if (action === 'list') {
      const { data, error } = await admin.from('gfweekly_topics').select('*').eq('archived', false)
        .order('created_at', { ascending: true });
      if (error) throw error; return json({ topics: data });
    }
    if (action === 'add') {
      const row: Record<string, unknown> = {
        title: (t.title ?? '').toString().slice(0,500),
        context: (t.context ?? '').toString(),
        priority: PRIOS.includes(t.priority) ? t.priority : 'mittel',
        created_by: (t.created_by ?? '').toString().slice(0,120),
        source: t.source === 'claude' ? 'claude' : 'manuell',
        kind: t.kind === 'recurring' ? 'recurring' : 'einmalig',
        board_lane: LANES.includes(t.board_lane) ? t.board_lane : 'zu_besprechen',
        lane_order: parseInt(t.lane_order) || 0,
      };
      for (const f of ['short_description','relevance','relevance_reason','recommendation','owner','delegate_to','involved','needs_input_from','reviewer','approver','next_action','dependencies','notes','frequency']) if (t[f] !== undefined) row[f] = t[f];
      if (t.time_minutes !== undefined && t.time_minutes !== null && t.time_minutes !== '') row.time_minutes = parseInt(t.time_minutes) || null;
      const { data, error } = await admin.from('gfweekly_topics').insert(row).select().single();
      if (error) throw error;
      if (data.kind!=='recurring') { await award(gains, topicComplete(data)?'thema_vollstaendig':'thema_neu', WHO, 'topic', data.id, DAY); await checkGoals(gains, WHO, DAY); await checkBadges(gains, WHO, DAY); }
      return json({ topic: data, gains });
    }
    if (action === 'update') {
      if (!t.id) return json({ error:'id fehlt' }, 400);
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      for (const f of TOPIC_FIELDS) {
        if (t[f] === undefined) continue;
        if (f === 'priority' && !PRIOS.includes(t[f])) continue;
        if (f === 'status') { if(!STATUSES.includes(t[f])) continue; patch.resolved_at = t[f]==='erledigt' ? new Date().toISOString() : null; }
        if (f === 'board_lane') { if(!LANES.includes(t[f])) continue; }
        if (f === 'lane_order') { patch.lane_order = parseInt(t[f]) || 0; continue; }
        if (f === 'time_minutes') { patch.time_minutes = (t[f]===''||t[f]===null) ? null : (parseInt(t[f])||null); continue; }
        if (f === 'last_discussed' || f === 'next_suggested') { patch[f] = t[f] || null; continue; }
        patch[f] = typeof t[f] === 'string' ? t[f] : t[f];
      }
      const { data: before } = await admin.from('gfweekly_topics').select('*').eq('id', t.id).single();
      const { data, error } = await admin.from('gfweekly_topics').update(patch).eq('id', t.id).select().single();
      if (error) throw error;
      await scoreTopicTransition(gains, before, data, WHO, DAY);
      if (gains.length) { await checkGoals(gains, WHO, DAY); await checkBadges(gains, WHO, DAY); }
      return json({ topic: data, gains });
    }
    if (action === 'delete') {
      if (!t.id) return json({ error:'id fehlt' }, 400);
      const { error } = await admin.from('gfweekly_topics').delete().eq('id', t.id);
      if (error) throw error; return json({ ok:true });
    }
    /* v20: Bereinigen */
    if (action === 'tidy_parse') {
      if (!t.id) return json({ error:'id fehlt' }, 400);
      const { data, error } = await admin.from('gfweekly_topics').select('*').eq('id', t.id).single(); if (error) throw error;
      return json({ result: tidyParse(data) });
    }
    if (action === 'tidy_suggest') {
      if (!t.id) return json({ error:'id fehlt' }, 400);
      const { data, error } = await admin.from('gfweekly_topics').select('*').eq('id', t.id).single(); if (error) throw error;
      const r = await tidySuggestAI(data);
      return json({ changes: r.changes, model: r.model, usage: r.usage, rules: tidyParse(data)?.changes || null });
    }
    if (action === 'request_protocol') {
      const { data, error } = await admin.from('gfweekly_protocol_requests').insert({ requested_by:(t.requested_by??'').toString().slice(0,120), note:(t.note??'').toString() }).select().single();
      if (error) throw error; return json({ request: data });
    }

    /* ----- Inbox ----- */
    /* v16: Eingaben landen direkt als Thema in „Zu besprechen" (kein Inbox-Zwischenschritt mehr, Entscheid 13.09.2026).
       v17: Seiten haben ein Vorschaubild (preview, Pfad unter /assets/previews/).
       v18: Besprechungen (gfweekly_sessions) und Entscheidungslog (gfweekly_decisions): session_start/end/list/delete, decision_add/update/list/delete.
       Antwortform bleibt kompatibel: item = das angelegte Thema. */
    function topicFromCapture(c: any){
      const raw=(c.raw_text ?? c.title ?? '').toString().trim(); if(!raw) return null;
      const first=raw.split('\n')[0].trim();
      const prio=['hoch','mittel','niedrig'].includes(c.urgency)?c.urgency:(['hoch','mittel','niedrig'].includes(c.priority)?c.priority:'mittel');
      const row: Record<string, any> = {
        title: first.slice(0,300), context: raw.slice(0,4000), priority: prio, status:'offen', kind:'einmalig',
        source: c.source==='chat' ? 'claude' : 'manuell', created_by:(c.created_by??'').toString().slice(0,120),
        board_lane:'zu_besprechen', lane_order: 0,
        short_description:(c.type_hint??'').toString().slice(0,200), owner:(c.owner_hint??'').toString().slice(0,120),
        involved:(c.stakeholder_hint??'').toString().slice(0,200), dependencies:(c.related_hint??'').toString().slice(0,200),
        notes: c.due_hint ? ('Fällig: '+c.due_hint.toString().slice(0,60)) : '',
      };
      /* v20: markierter Eingabetext („Titel: … Worum geht es: … Vorschlag: … Quelle: …“) wird sofort in Felder zerlegt.
         Der Rohtext bleibt vollständig in notes erhalten, falls die Zerlegung etwas falsch zuordnet. */
      const parsed = tidyParse({ title: raw, context: '', short_description: row.short_description, owner: row.owner, notes: row.notes, next_action: '', decision: '' });
      if(parsed && (parsed.changes.title || parsed.changes.context)){
        for(const f of TIDY_FIELDS) if(parsed.changes[f]!==undefined) row[f]=parsed.changes[f];
        row.title=(row.title||first).toString().slice(0,300);
        row.notes=[row.notes||'', 'Eingang (Rohtext): '+raw.slice(0,3000)].filter(Boolean).join('\n');
      }
      return row;
    }
    if (action === 'capture') {
      const row = topicFromCapture(t); if(!row) return json({ error:'leer' },400);
      const { data, error } = await admin.from('gfweekly_topics').insert(row).select().single();
      if (error) throw error;
      await award(gains, topicComplete(data)?'thema_vollstaendig':'thema_neu', WHO, 'topic', data.id, DAY); await checkGoals(gains, WHO, DAY); await checkBadges(gains, WHO, DAY);
      return json({ item:data, topic:data, gains });
    }
    if (action === 'capture_many') {
      const items = Array.isArray(t.items) ? t.items.slice(0,30) : [];
      const rows = items.map((it: any) => topicFromCapture({ ...it, created_by: it.created_by ?? t.created_by, source: it.source ?? t.source })).filter(Boolean);
      if(!rows.length) return json({ error:'leer' },400);
      const { data, error } = await admin.from('gfweekly_topics').insert(rows).select();
      if (error) throw error;
      for (const d of data) await award(gains, topicComplete(d)?'thema_vollstaendig':'thema_neu', WHO, 'topic', d.id, DAY);
      return json({ items:data, count:data.length, gains });
    }
    if (action === 'inbox_list') {
      const statuses = Array.isArray(t.statuses)&&t.statuses.length ? t.statuses : ['neu','reviewed'];
      const { data, error } = await admin.from('gfweekly_inbox').select('*').in('status',statuses).order('needs_review',{ascending:false}).order('created_at',{ascending:false});
      if (error) throw error; return json({ items:data });
    }
    if (action === 'inbox_update') {
      if(!t.id) return json({ error:'id fehlt' },400);
      const allowed=['ai_type','ai_module','ai_development_field','ai_stakeholder','ai_owner','ai_priority','ai_urgency','ai_dependencies','ai_next_action','ai_recurring','ai_summary','ai_confidence','needs_review','status','raw_text'];
      const patch:Record<string,unknown>={}; for(const k of allowed) if(t[k]!==undefined) patch[k]=t[k];
      if(!Object.keys(patch).length) return json({ error:'nichts' },400);
      const { data, error } = await admin.from('gfweekly_inbox').update(patch).eq('id',t.id).select().single();
      if(error) throw error; return json({ item:data });
    }
    if (action === 'inbox_reject') {
      if(!t.id) return json({ error:'id fehlt' },400);
      const { data, error } = await admin.from('gfweekly_inbox').update({ status:'rejected', reviewed_at:new Date().toISOString() }).eq('id',t.id).select().single();
      if(error) throw error; return json({ item:data });
    }
    if (action === 'inbox_promote') {
      if(!t.id) return json({ error:'id fehlt' },400);
      const { data: inb, error:e0 } = await admin.from('gfweekly_inbox').select('*').eq('id',t.id).single();
      if(e0||!inb) throw (e0||new Error('inbox item fehlt'));
      const title=(t.title ?? inb.ai_summary ?? inb.raw_text ?? '').toString().trim().slice(0,300) || inb.raw_text.slice(0,120);
      const priority=PRIOS.includes(t.priority)?t.priority:(PRIOS.includes(inb.ai_priority)?inb.ai_priority:'mittel');
      const ctx:string[]=[]; ctx.push('Eingang: '+inb.raw_text);
      if(inb.ai_type) ctx.push('Typ: '+inb.ai_type);
      if(inb.ai_next_action) ctx.push('Nächster Schritt: '+inb.ai_next_action);
      const { data: topic, error:e1 } = await admin.from('gfweekly_topics').insert({
        title, context:(t.context ?? ctx.join('\n')).toString(), priority, status:'offen', source:'claude',
        created_by: inb.created_by||'Inbox', owner: inb.ai_owner||'', relevance: inb.ai_priority||'', next_action: inb.ai_next_action||''
      }).select().single();
      if(e1) throw e1;
      const { data: item, error:e2 } = await admin.from('gfweekly_inbox').update({ status:'promoted', promoted_topic_id:topic.id, reviewed_at:new Date().toISOString() }).eq('id',t.id).select().single();
      if(e2) throw e2; return json({ topic, item });
    }

    /* ----- People directory ----- */
    if (action === 'people_list') {
      const { data, error } = await admin.from('gfweekly_people').select('*').order('sort_order',{ascending:true}).order('name',{ascending:true});
      if(error) throw error; return json({ people:data });
    }
    if (action === 'people_save') {
      const row:Record<string,unknown>={};
      for(const f of ['name','email','role','team','default_task_types','notes']) if(t[f]!==undefined) row[f]=(t[f]??'').toString();
      if(t.active!==undefined) row.active=!!t.active;
      if(t.assignable!==undefined) row.assignable=!!t.assignable;
      if(t.sort_order!==undefined) row.sort_order=parseInt(t.sort_order)||0;
      if(t.id){ const { data, error } = await admin.from('gfweekly_people').update(row).eq('id',t.id).select().single(); if(error) throw error; return json({ person:data }); }
      if(!row.email) return json({ error:'email fehlt' },400);
      const { data, error } = await admin.from('gfweekly_people').insert(row).select().single(); if(error) throw error; return json({ person:data });
    }
    if (action === 'people_delete') {
      if(!t.id) return json({ error:'id fehlt' },400);
      const { error } = await admin.from('gfweekly_people').delete().eq('id',t.id); if(error) throw error; return json({ ok:true });
    }

    /* ----- Linked documents ----- */
    if (action === 'links_all') {
      const { data, error } = await admin.from('gfweekly_links').select('*').order('created_at',{ascending:true});
      if(error) throw error; return json({ links:data });
    }
    if (action === 'link_add') {
      const { data, error } = await admin.from('gfweekly_links').insert({
        item_id: t.item_id||null, title:(t.title??'').toString().slice(0,300), type:(t.type??'url').toString(),
        url:(t.url??'').toString().slice(0,2000), description:(t.description??'').toString().slice(0,500), added_by:(t.added_by??'').toString().slice(0,120),
      }).select().single();
      if(error) throw error; return json({ link:data });
    }
    if (action === 'link_delete') {
      if(!t.id) return json({ error:'id fehlt' },400);
      const { error } = await admin.from('gfweekly_links').delete().eq('id',t.id); if(error) throw error; return json({ ok:true });
    }

    /* ----- Steuerungsmaske: Seitenverzeichnis (v14) ----- */
    if (action === 'sites_list') {
      const [c, s] = await Promise.all([
        admin.from('gfweekly_site_categories').select('*').order('sort_order',{ascending:true}).order('label',{ascending:true}),
        admin.from('gfweekly_sites').select('*').order('sort_order',{ascending:true}).order('name',{ascending:true}),
      ]);
      if(c.error) throw c.error; if(s.error) throw s.error;
      return json({ categories:c.data, sites:s.data });
    }
    if (action === 'sites_save') {
      const row:Record<string,unknown>={ updated_at:new Date().toISOString(), updated_by:(t.updated_by??'').toString().slice(0,120) };
      for(const f of SITE_FIELDS) if(t[f]!==undefined) row[f]=(t[f]??'').toString().slice(0, f==='purpose'||f==='notes'||f==='login_note' ? 2000 : 500);
      if(row.status!==undefined && !SITE_STATUSES.includes(row.status as string)) row.status='aktiv';
      if(t.sort_order!==undefined && t.sort_order!=='') row.sort_order=parseInt(t.sort_order)||100;
      if(t.id){ const { data, error } = await admin.from('gfweekly_sites').update(row).eq('id',t.id).select().single(); if(error) throw error; return json({ site:data }); }
      if(!row.name || !row.url) return json({ error:'name und url fehlen' },400);
      const { data, error } = await admin.from('gfweekly_sites').insert(row).select().single(); if(error) throw error; return json({ site:data });
    }
    if (action === 'sites_delete') {
      if(!t.id) return json({ error:'id fehlt' },400);
      const { error } = await admin.from('gfweekly_sites').delete().eq('id',t.id); if(error) throw error; return json({ ok:true });
    }
    if (action === 'category_save') {
      const label=(t.label??'').toString().trim().slice(0,80); if(!label) return json({ error:'label fehlt' },400);
      const key=(t.key??'').toString().trim() || slugKey(label);
      const row:Record<string,unknown>={ key, label, icon:(t.icon??'').toString().slice(0,8) };
      if(t.sort_order!==undefined && t.sort_order!=='') row.sort_order=parseInt(t.sort_order)||100;
      const { data, error } = await admin.from('gfweekly_site_categories').upsert(row,{ onConflict:'key' }).select().single(); if(error) throw error; return json({ category:data });
    }

    /* ----- Meta-Planung Stufe 2 (v15): Zyklus, Rituale, Meilensteine ----- */
    if (action === 'cycle_get') {
      const year = parseInt(t.year) || new Date().getFullYear();
      const [ph, tr, ri, ck, st] = await Promise.all([
        admin.from('gfweekly_cycle_phases').select('*').order('sort_order',{ascending:true}),
        admin.from('gfweekly_cycle_transitions').select('*').order('sort_order',{ascending:true}),
        admin.from('gfweekly_rituals').select('*').eq('active',true).order('sort_order',{ascending:true}),
        admin.from('gfweekly_ritual_checks').select('*').eq('year',year),
        admin.from('gfweekly_strands').select('*').order('sort_order',{ascending:true}),
      ]);
      for (const r of [ph,tr,ri,ck,st]) if(r.error) throw r.error;
      return json({ year, phases:ph.data, transitions:tr.data, rituals:ri.data, checks:ck.data, strands:st.data });
    }
    if (action === 'ritual_toggle') {
      if(!t.ritual_id) return json({ error:'ritual_id fehlt' },400);
      const year = parseInt(t.year) || new Date().getFullYear();
      if (t.done === false) { const { error } = await admin.from('gfweekly_ritual_checks').delete().eq('ritual_id',t.ritual_id).eq('year',year); if(error) throw error; return json({ ok:true, done:false }); }
      const { data, error } = await admin.from('gfweekly_ritual_checks').upsert({ ritual_id:t.ritual_id, year, done_by:(t.done_by??'').toString().slice(0,120), note:(t.note??'').toString().slice(0,500), done_at:new Date().toISOString() },{ onConflict:'ritual_id,year' }).select().single();
      if(error) throw error;
      await award(gains,'ritual',WHO,'ritual',`${t.ritual_id}:${year}`,DAY);
      let phaseComplete=false, phaseKey='';
      const { data: rit } = await admin.from('gfweekly_rituals').select('id,phase_key').eq('id',t.ritual_id).single();
      if(rit){ phaseKey=rit.phase_key; const [{ data: all },{ data: done }] = await Promise.all([admin.from('gfweekly_rituals').select('id').eq('phase_key',rit.phase_key).eq('active',true), admin.from('gfweekly_ritual_checks').select('ritual_id').eq('year',year)]);
        const doneSet=new Set((done||[]).map((c: any)=>c.ritual_id)); phaseComplete=(all||[]).length>0 && (all||[]).every((r: any)=>doneSet.has(r.id));
        if(phaseComplete) await award(gains,'phase_komplett','Team','phase',`${rit.phase_key}:${year}`,DAY); }
      await checkGoals(gains, WHO, DAY); await checkBadges(gains, WHO, DAY, { phaseComplete, phaseKey });
      return json({ ok:true, done:true, check:data, gains });
    }
    if (action === 'ritual_save') {
      const row:Record<string,unknown>={};
      if(t.phase_key!==undefined) row.phase_key=(t.phase_key??'').toString();
      if(t.title!==undefined) row.title=(t.title??'').toString().slice(0,300);
      if(t.hint!==undefined) row.hint=(t.hint??'').toString().slice(0,500);
      if(t.sort_order!==undefined && t.sort_order!=='') row.sort_order=parseInt(t.sort_order)||100;
      if(t.active!==undefined) row.active=!!t.active;
      if(t.id){ const { data, error } = await admin.from('gfweekly_rituals').update(row).eq('id',t.id).select().single(); if(error) throw error; return json({ ritual:data }); }
      if(!row.title || !row.phase_key) return json({ error:'title und phase_key fehlen' },400);
      const { data, error } = await admin.from('gfweekly_rituals').insert(row).select().single(); if(error) throw error; return json({ ritual:data });
    }
    if (action === 'ritual_delete') {
      if(!t.id) return json({ error:'id fehlt' },400);
      const { error } = await admin.from('gfweekly_rituals').delete().eq('id',t.id); if(error) throw error; return json({ ok:true });
    }
    if (action === 'milestones_list') {
      let q = admin.from('gfweekly_milestones').select('*').eq('archived', false);
      if (!t.all) q = q.not('status','in','("erreicht","abgesagt")');
      const { data, error } = await q.order('date_from',{ascending:true, nullsFirst:false}).order('sort_order',{ascending:true});
      if(error) throw error; return json({ milestones:data });
    }
    if (action === 'milestone_save') {
      const MS_STATUS=['geplant','laufend','erreicht','verschoben','abgesagt'];
      const row:Record<string,unknown>={ updated_at:new Date().toISOString(), updated_by:(t.updated_by??'').toString().slice(0,120) };
      for (const f of ['title','description','zeitraum','strand','owner','link_url']) if(t[f]!==undefined) row[f]=(t[f]??'').toString().slice(0, f==='description'?2000:500);
      for (const f of ['date_from','date_to']) if(t[f]!==undefined) row[f]= t[f] ? t[f] : null;
      if(t.status!==undefined) row.status = MS_STATUS.includes(t.status) ? t.status : 'geplant';
      if(t.sort_order!==undefined && t.sort_order!=='') row.sort_order=parseInt(t.sort_order)||100;
      if(t.archived!==undefined) row.archived=!!t.archived;
      if(t.topic_id!==undefined) row.topic_id = t.topic_id || null;
      if(t.id){ const { data: before } = await admin.from('gfweekly_milestones').select('status').eq('id',t.id).single();
        const { data, error } = await admin.from('gfweekly_milestones').update(row).eq('id',t.id).select().single(); if(error) throw error;
        if(data.status==='erreicht' && before?.status!=='erreicht'){ await award(gains,'meilenstein',WHO,'milestone',data.id,DAY); await checkBadges(gains, WHO, DAY); }
        return json({ milestone:data, gains }); }
      if(!row.title) return json({ error:'title fehlt' },400);
      const { data, error } = await admin.from('gfweekly_milestones').insert(row).select().single(); if(error) throw error; return json({ milestone:data });
    }
    if (action === 'milestone_delete') {
      if(!t.id) return json({ error:'id fehlt' },400);
      const { error } = await admin.from('gfweekly_milestones').delete().eq('id',t.id); if(error) throw error; return json({ ok:true });
    }

    /* ----- Sprint C (v18): Besprechungen und Entscheidungslog ----- */
    if (action === 'session_start') {
      const row = { participants:(t.participants??'Alex, Lea').toString().slice(0,300), started_by:(t.started_by??'').toString().slice(0,120), title:(t.title??'').toString().slice(0,300) };
      const { data, error } = await admin.from('gfweekly_sessions').insert(row).select().single(); if(error) throw error; return json({ session:data });
    }
    if (action === 'session_end') {
      if(!t.id) return json({ error:'id fehlt' },400);
      const patch:Record<string,unknown> = { ended_at:new Date().toISOString() };
      if(t.protocol!==undefined) patch.protocol=(t.protocol??'').toString().slice(0,20000);
      if(t.summary!==undefined) patch.summary=Array.isArray(t.summary)?t.summary.slice(0,200):[];
      if(t.title!==undefined) patch.title=(t.title??'').toString().slice(0,300);
      const { data, error } = await admin.from('gfweekly_sessions').update(patch).eq('id',t.id).select().single(); if(error) throw error;
      const log=Array.isArray(data.summary)?data.summary:[]; const handled=log.filter((l: any)=>l.outcome && l.outcome!=='skip').length;
      const parts=['Alex','Lea'].filter(p=>(data.participants||'').toLowerCase().includes(p.toLowerCase())); if(!parts.length) parts.push(WHO);
      for(const p of parts){ if(p==='Team') continue; await award(gains,'besprechung',p,'session',data.id,DAY,handled*5,`${handled} Themen`); }
      await checkGoals(gains, parts[0]||WHO, DAY); await checkBadges(gains, parts[0]||WHO, DAY, { session:data, agendaLeer: !!t.agenda_leer });
      return json({ session:data, gains });
    }
    if (action === 'sessions_list') {
      const limit = Math.min(parseInt(t.limit)||30, 200);
      const { data, error } = await admin.from('gfweekly_sessions').select('*').order('started_at',{ascending:false}).limit(limit); if(error) throw error; return json({ sessions:data });
    }
    if (action === 'session_delete') {
      if(!t.id) return json({ error:'id fehlt' },400);
      const { error } = await admin.from('gfweekly_sessions').delete().eq('id',t.id); if(error) throw error; return json({ ok:true });
    }
    if (action === 'decision_add') {
      const decision=(t.decision??'').toString().trim().slice(0,4000); if(!decision) return json({ error:'decision fehlt' },400);
      const row:Record<string,unknown> = { decision, topic_id:t.topic_id||null, session_id:t.session_id||null,
        topic_title:(t.topic_title??'').toString().slice(0,500), next_action:(t.next_action??'').toString().slice(0,2000),
        owner:(t.owner??'').toString().slice(0,120), strand:(t.strand??'').toString().slice(0,120), decided_by:(t.decided_by??'').toString().slice(0,120) };
      if(t.decided_at) row.decided_at=t.decided_at;
      const { data, error } = await admin.from('gfweekly_decisions').insert(row).select().single(); if(error) throw error;
      await award(gains,'entscheidung',WHO,'decision',data.id,DAY);
      if(data.topic_id){ const { data: tp } = await admin.from('gfweekly_topics').select('*').eq('id',data.topic_id).single(); if(tp && tp.kind!=='recurring'){ const creator=whoNorm(tp.created_by); if(creator!=='Team') await award(gains,'saat',creator,'topic',tp.id,DAY); } }
      await checkGoals(gains, WHO, DAY); await checkBadges(gains, WHO, DAY);
      return json({ decision:data, gains });
    }
    if (action === 'decision_update') {
      if(!t.id) return json({ error:'id fehlt' },400);
      const patch:Record<string,unknown>={};
      for(const f of ['decision','next_action','owner','strand','topic_title']) if(t[f]!==undefined) patch[f]=(t[f]??'').toString().slice(0, f==='decision'?4000:2000);
      if(t.decided_at!==undefined) patch.decided_at=t.decided_at||new Date().toISOString().slice(0,10);
      const { data, error } = await admin.from('gfweekly_decisions').update(patch).eq('id',t.id).select().single(); if(error) throw error; return json({ decision:data });
    }
    if (action === 'decisions_list') {
      let q = admin.from('gfweekly_decisions').select('*').order('decided_at',{ascending:false}).order('created_at',{ascending:false});
      if(t.topic_id) q = q.eq('topic_id', t.topic_id);
      if(t.session_id) q = q.eq('session_id', t.session_id);
      if(t.since) q = q.gte('decided_at', t.since);
      q = q.limit(Math.min(parseInt(t.limit)||300, 1000));
      const { data, error } = await q; if(error) throw error; return json({ decisions:data });
    }
    if (action === 'decision_delete') {
      if(!t.id) return json({ error:'id fehlt' },400);
      const { error } = await admin.from('gfweekly_decisions').delete().eq('id',t.id); if(error) throw error; return json({ ok:true });
    }

    /* ----- Neuigkeiten (v21): Ticker, Sichtungskorb, Themenlage ----- */
    if (action === 'news_add_many') {
      const items = Array.isArray(t.items) ? t.items.slice(0,500) : [];
      const rows = items.map(newsRow).filter(Boolean) as Record<string, unknown>[];
      if(!rows.length) return json({ error:'leer' },400);
      const lage = rows.filter(r=>r.kind==='lage' && r.source_ref);          // Themenlage: neuester Stand ersetzt den alten
      const keyed = rows.filter(r=>r.kind!=='lage' && r.source_ref);         // Ticker/Kandidaten: gleiche Quelle nie doppelt
      const loose = rows.filter(r=>!r.source_ref);
      let added=0, updated=0;
      if(lage.length){ const { data, error } = await admin.from('gfweekly_news').upsert(lage,{ onConflict:'source_ref' }).select('id'); if(error) throw error; updated+=data.length; }
      if(keyed.length){ const { data, error } = await admin.from('gfweekly_news').upsert(keyed,{ onConflict:'source_ref', ignoreDuplicates:true }).select('id'); if(error) throw error; added+=data.length; }
      if(loose.length){ const { data, error } = await admin.from('gfweekly_news').insert(loose).select('id'); if(error) throw error; added+=data.length; }
      return json({ ok:true, added, updated, skipped: keyed.length-(added-loose.length) });
    }
    if (action === 'news_list') {
      const limit = Math.min(parseInt(t.limit)||400, 2000);
      let q = admin.from('gfweekly_news').select('*').order('happened_at',{ascending:false}).limit(limit);
      if(Array.isArray(t.kinds)&&t.kinds.length) q = q.in('kind', t.kinds.filter((k: string)=>NEWS_KINDS.includes(k)));
      if(Array.isArray(t.statuses)&&t.statuses.length) q = q.in('status', t.statuses.filter((k: string)=>NEWS_STATUS.includes(k)));
      if(t.since) q = q.gte('happened_at', t.since);
      if(t.strand) q = q.eq('strand', t.strand);
      const { data, error } = await q; if(error) throw error;
      return json({ items:data });
    }
    if (action === 'news_update') {
      if(!t.id) return json({ error:'id fehlt' },400);
      const patch:Record<string,unknown>={};
      for(const f of ['title','body','quote','strand','who','source_title','source_url']) if(t[f]!==undefined) patch[f]=(t[f]??'').toString().slice(0, f==='body'?6000:500);
      if(t.relevance!==undefined && PRIOS.includes(t.relevance)) patch.relevance=t.relevance;
      if(t.topic_id!==undefined) patch.topic_id=t.topic_id||null;
      if(t.status!==undefined){ if(!NEWS_STATUS.includes(t.status)) return json({ error:'status' },400); patch.status=t.status; patch.decided_by=(t.decided_by??'').toString().slice(0,120); patch.decided_at=new Date().toISOString(); }
      if(!Object.keys(patch).length) return json({ error:'nichts' },400);
      const { data, error } = await admin.from('gfweekly_news').update(patch).eq('id',t.id).select().single(); if(error) throw error; return json({ item:data });
    }
    /* Kandidat übernehmen: neues Thema in „Zu besprechen“ oder Hinweis an ein bestehendes Thema hängen. */
    if (action === 'news_accept') {
      if(!t.id) return json({ error:'id fehlt' },400);
      const { data: n, error:e0 } = await admin.from('gfweekly_news').select('*').eq('id',t.id).single(); if(e0||!n) throw (e0||new Error('Eintrag fehlt'));
      const src = [n.source_title, n.source_url].filter(Boolean).join(' · ');
      const when = new Date(n.happened_at).toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'});
      let topic: any = null;
      if (t.topic_id) {
        const { data: old, error:e1 } = await admin.from('gfweekly_topics').select('id,notes,context').eq('id',t.topic_id).single(); if(e1||!old) throw (e1||new Error('Thema fehlt'));
        const note = `Neu erwähnt (${when}${n.source_title?`, ${n.source_title}`:''}): ${n.title}${n.quote?` – „${n.quote}“`:''}${n.source_url?` ${n.source_url}`:''}`;
        const { data: up, error:e2 } = await admin.from('gfweekly_topics').update({ notes:[(old.notes||'').toString(), note].filter(Boolean).join('\n'), updated_at:new Date().toISOString() }).eq('id',old.id).select().single(); if(e2) throw e2; topic=up;
      } else {
        const row: Record<string, unknown> = {
          title:(t.title ?? n.title).toString().slice(0,300),
          context:[(t.context ?? n.body).toString(), n.quote?`Aus der Quelle: „${n.quote}“`:''].filter(Boolean).join('\n\n').slice(0,6000),
          short_description:(t.short_description ?? '').toString().slice(0,200),
          priority: PRIOS.includes(t.priority) ? t.priority : (n.relevance==='hoch'?'hoch':'mittel'),
          status:'offen', kind:'einmalig', source:'claude', created_by:(t.decided_by??'Neuigkeiten').toString().slice(0,120),
          board_lane:'zu_besprechen', lane_order:0, owner:(t.owner??'').toString().slice(0,120), next_action:(t.next_action??'').toString().slice(0,2000),
          notes:[`Quelle: ${n.source==='notiz'?'Besprechungsnotiz':n.source} ${when}${src?` · ${src}`:''}`, n.who?`Beteiligt: ${n.who}`:''].filter(Boolean).join('\n'),
        };
        const { data: nt, error:e3 } = await admin.from('gfweekly_topics').insert(row).select().single(); if(e3) throw e3; topic=nt;
      }
      const { data: item, error:e4 } = await admin.from('gfweekly_news').update({ status:'uebernommen', topic_id:topic.id, decided_by:(t.decided_by??'').toString().slice(0,120), decided_at:new Date().toISOString() }).eq('id',n.id).select().single(); if(e4) throw e4;
      return json({ topic, item });
    }
    if (action === 'news_delete') {
      if(!t.id) return json({ error:'id fehlt' },400);
      const { error } = await admin.from('gfweekly_news').delete().eq('id',t.id); if(error) throw error; return json({ ok:true });
    }

    /* ----- v22: Habitat-Punkte ----- */
    if (action === 'checkin') {
      const hour = Math.max(0, Math.min(23, parseInt(t.hour) || new Date().getHours()));
      const r = await doCheckin(gains, WHO, DAY, hour);
      if (r.first) { await checkGoals(gains, WHO, DAY); await checkBadges(gains, WHO, DAY, { streak:r.streak }); }
      const state = await scoreState(WHO, DAY);
      return json({ ok:true, first:r.first, streak:r.streak, gains, state });
    }
    if (action === 'score_get') return json({ state: await scoreState(WHO, DAY) });
    if (action === 'score_event') {
      const allowed = ['wochenmail','protokoll']; const kind=(t.kind??'').toString(); if(!allowed.includes(kind)) return json({ error:'kind nicht erlaubt' },400);
      const ref = kind==='wochenmail' ? `wochenmail:${isoWeek(DAY)}` : `protokoll:${(t.ref??DAY).toString().slice(0,80)}`;
      await award(gains, kind, WHO, 'manual', ref, DAY); await checkBadges(gains, WHO, DAY);
      return json({ ok:true, gains });
    }
    if (action === 'score_events') {
      const limit=Math.min(parseInt(t.limit)||200, 1000);
      let q=admin.from('gfweekly_score_events').select('*').order('created_at',{ascending:false}).limit(limit);
      if(t.year) q=q.eq('year',parseInt(t.year)); if(t.who) q=q.eq('who',whoNorm(t.who));
      const { data, error } = await q; if(error) throw error; return json({ events:data });
    }
    if (action === 'score_rules') { const { data } = await admin.from('gfweekly_score_rules').select('*').order('sort_order'); const { data: lv } = await admin.from('gfweekly_score_levels').select('*').order('threshold'); return json({ rules:data, levels:lv, badges: BADGES.map(b=>({ key:b[0], label:b[1], scope:b[2] })), dayGoals: DAY_GOALS.map(g=>({ key:g[0], label:g[1] })) }); }

    return json({ error:'unknown action' }, 400);
  } catch (e) { return json({ error:String((e as Error).message ?? e) }, 500); }
});
