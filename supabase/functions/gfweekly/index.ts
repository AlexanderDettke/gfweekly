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
/* v28 (20.09.2026): Pförtner: gate_set, gate_set_many, gate_list (Themen und Kandidaten mit gate/gate_frist/gate_note; Vorschlag des Laufs gate_by=lauf).
   v27 (20.09.2026): Plattformen: platform_digest {days}, platform_feed {platform, since, limit} lesen die Views hh_feed_habitate/hh_feed_partner/hh_partner_stand/hh_habitate_offen (nur SELECT, nie Schreiben in vvp_*); NEWS_SOURCES um 'plattform'.
   v22 (14.09.2026): Habitat-Punkte, siehe Modul unten (checkin, score_get, score_event, score_events, score_rules; Vergabe in add/capture/update/decision_add/ritual_toggle/session_end/milestone_save).
   v21 (14.09.2026): Neuigkeiten (gfweekly_news): Ticker, Sichtungskorb (Kandidaten), Themenlage je Strang.
   Befüllt vom täglichen Cowork-Auftrag (news_add_many, Dedup über source_ref), gelesen von site/neuigkeiten.html. */
const NEWS_KINDS = ['ticker','kandidat','lage'];
const NEWS_SOURCES = ['notiz','asana','kalender','mail','protokoll','entscheidung','manuell','plattform']; // v27: plattform (Wilde Habitate, Wild Wild Partner)
const NEWS_STATUS = ['neu','gesehen','uebernommen','verworfen'];
const GATES = ['gf','alex','lea','team','plattform','warten']; // v28 Pförtner
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

/* ===== v29 · V24a (21.09.2026) · Vertretung: Abwesenheit, Vertretungslinie, Übergabekorb, Matrix, Tick.
   Der Korb baut sich selbst (handoverBuild), bewertet sich selbst (score) und hält sich täglich aktuell (absence_tick).
   score ist eine reine Funktion: gleiche Eingabe, gleiches Ergebnis, keine KI, jede Zeile bekommt einen Begründungssatz.
   Migration: supabase/migrations/20260921_hh_vertretung.sql ===== */
const ABS_ART = ['geplant','sofort'];
const ABS_KONTAKT = ['keiner','wochenbrief','gespraech'];
const ABS_STATUS = ['geplant','aktiv','rueckkehr','beendet'];
const HO_KIND = ['thema','kandidat','meilenstein','ritual','termin','asana','partner'];
const HO_AMPEL = ['gruen','gelb','rot','vorher','ruht'];
const HO_CLUSTER = ['A','B','C','D','E'];
const HO_STATUS = ['vorschlag','bestaetigt','erledigt','entfallen'];
/* Pförtner-Schlüsselwörter der gf-Klasse: was die GF gemeinsam entscheidet (Notfalldefinition: Geld ab 5.000 €,
   Recht, Personal, Presse, Behörde, Sicherheit). */
const GF_WORTE = ['vertrag','bank','darlehen','kredit','bürgschaft','buergschaft','grundschuld','kündigung','kuendigung',
  'einstellung','gehalt','gesellschafter','aufsichtsrat','generalversammlung','rechtsstreit','anwalt','klage','notar',
  'kaufoption','kaufvertrag','liquidität','liquiditaet','insolvenz','investor','beteiligung','austritt','satzung','presse','behörde','behoerde'];
const BETRIEB_WORTE = ['newsletter','social','programm','ticket','booking','gastro','aufbau','helfer','sponsoring'];
const SCHWER_WORTE = ['unterschrift','vollmacht','notar','bank','konto','zugangsdaten'];
const CLUSTER_TEXT: Record<string,string> = {
  A:'vor Abreise', B:'übergeben mit Vollmacht', C:'übergeben mit Rückfrage', D:'ruht bis Rückkehr', E:'zu der anderen GF',
};

function tageBis(a: string, b: string){ return Math.round((Date.parse(b+'T00:00:00Z') - Date.parse(a+'T00:00:00Z'))/86400000); }
/* Fenster der Abwesenheit. Ohne bis und ohne Schätzung wird mit 14 Tagen gerechnet, damit die Matrix eine Kante hat;
   der Tick rechnet jeden Tag neu, sobald ein Enddatum eingetragen ist. */
function absEnde(a: any): string { return (a?.bis || a?.bis_geschaetzt || addDays(a?.von, 13)); }
function absStufe(a: any): string {
  /* Vorgabe: ohne festes bis ist die Abwesenheit kurz. Eine Schätzung ändert die Stufe nicht,
     dafür stuft der Tick bei art = sofort am Tag 4 und am Tag 15 hoch. */
  if (!a?.bis) return 'kurz';
  const d = tageBis(a.von, a.bis) + 1; return d <= 3 ? 'kurz' : d <= 14 ? 'mittel' : 'lang';
}
function absGate(person: string){ const w = whoNorm(person); return w === 'Lea' ? 'lea' : w === 'Alex' ? 'alex' : ''; }
function heuteBerlin(){ return new Date().toLocaleDateString('sv-SE', { timeZone:'Europe/Berlin' }); }

/* Größter Geldbetrag im Text, in Euro. Erkennt „5.000 €“, „€ 5000“, „2.500,50 EUR“. */
function geldMax(text: string): number {
  let max = 0;
  const re = /(?:(?:€|eur|euro)\s*([0-9][0-9.\s]{0,12}(?:,[0-9]{1,2})?)|([0-9][0-9.\s]{0,12}(?:,[0-9]{1,2})?)\s*(?:€|eur\b|euro\b))/gi;
  for (const m of text.matchAll(re)) {
    const roh = (m[1] ?? m[2] ?? '').replace(/\s/g,'').replace(/\./g,'').replace(',', '.');
    const n = parseFloat(roh); if (!isNaN(n) && n > max) max = n;
  }
  return max;
}
/* Stichwortsuche am Wortanfang: „Ankündigungen“ darf nicht als „Kündigung“ zählen, „Kündigungsfrist“ schon.
   \b hilft bei Umlauten nicht, deshalb die ausdrückliche Grenze vor dem Wort. */
const WORT_RE = new Map<string, RegExp>();
function wortRe(w: string){ let re = WORT_RE.get(w); if (!re) { re = new RegExp('(?<![a-zäöüß])' + w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'), 'i'); WORT_RE.set(w, re); } return re; }
function hatWort(text: string, worte: string[]){ return worte.some(w => wortRe(w).test(text)); }
/* Teilnehmende eines Termins nur mit Vornamen weitergeben. */
function vornamen(who: unknown){ return (who ?? '').toString().split(/[,;]| und /i).map(x => x.trim().split(/\s+/)[0]).filter(Boolean).join(', '); }
/* Erste Person im who-Feld, die weder Alex noch Lea ist: ein Teamname im Sinne der Matrix (F = 1). */
function teamName(who: unknown){ return (who ?? '').toString().split(/[,;]| und /i).map(x => x.trim())
  .find(n => n && whoNorm(n) === 'Team') || ''; }
function trefferWort(text: string, worte: string[]){ return worte.find(w => wortRe(w).test(text)) || ''; }

/* Die Bewertungsmatrix. item ist eine vereinheitlichte Korbzeile (siehe handoverItems), absence die Abwesenheit.
   Vier Achsen 0 bis 3: Z Zeitdruck, F Folgen bei Stillstand, U Übertragbarkeit (hoch = schwer), G Entscheidungsgewicht. */
function score(item: any, absence: any, heute: string = heuteBerlin()){
  const von = absence.von as string, ende = absEnde(absence);
  const stufe = absence.stufe || absStufe(absence);
  const text = [item.title, item.short_description, item.context, item.body, item.next_action, item.decision, item.notes, item.signal]
    .filter(Boolean).join(' \n ').toLowerCase();
  const frist = item.frist || null;
  const gruende: string[] = [];

  // Z Zeitdruck
  let z = 0;
  if (!frist) { z = 0; gruende.push('ohne Frist'); }
  else if (frist < von || frist < heute) { z = 3; gruende.push(`Frist ${frist} liegt vor der Abreise oder ist überfällig`); }
  else if (frist <= ende) { z = 2; gruende.push(`Frist ${frist} fällt in die Abwesenheit`); }
  else if (frist <= addDays(ende, 14)) { z = 1; gruende.push(`Frist ${frist} kommt kurz nach der Rückkehr`); }
  else { z = 0; gruende.push(`Frist ${frist} liegt weit hinter der Rückkehr`); }

  // F Folgen bei Stillstand
  const geld = geldMax(text);
  const gfWort = trefferWort(text, GF_WORTE);
  const betriebWort = trefferWort(text, BETRIEB_WORTE);
  let f = 0;
  if (geld >= 5000) { f = 3; gruende.push(`Geld ab 5.000 € im Spiel (${Math.round(geld).toLocaleString('de-DE')} €)`); }
  else if (gfWort) { f = 3; gruende.push(`Sache der GF (Stichwort ${gfWort})`); }
  else if (item.relevance === 'kritisch') { f = 3; gruende.push('Relevanz kritisch'); }
  else if (item.strand === 'wwp' || item.kind === 'partner') { f = 2; gruende.push('Partnerstrang'); }
  else if (item.relevance === 'hoch' || item.priority === 'hoch') { f = 2; gruende.push('hohe Priorität'); }
  else if (geld > 0) { f = 2; gruende.push(`Geld unter 5.000 € im Spiel (${Math.round(geld).toLocaleString('de-DE')} €)`); }
  else if (betriebWort) { f = 1; gruende.push(`Betrieb (Stichwort ${betriebWort})`); }
  else if (teamName(item.who)) { f = 1; gruende.push(`das Team hängt daran (${teamName(item.who)})`); }
  else { f = 0; gruende.push('ohne erkennbare Folgen bei Stillstand'); }

  // U Übertragbarkeit, hoch heißt schwer zu übergeben
  const schwerWort = trefferWort(text, SCHWER_WORTE);
  const standDa = !!(item.short_description || '').toString().trim();
  const schrittDa = !!(item.next_action || '').toString().trim();
  const nurPerson = !!(item.who && whoNorm(item.who) === whoNorm(absence.person) && !/,|;| und /i.test(item.who));
  let u = 0;
  if (schwerWort) { u = 3; gruende.push(`gebunden an die Person (${schwerWort})`); }
  else if (item.kind === 'kandidat') {
    /* Ein Kandidat hat weder Stand noch nächsten Schritt, nur seinen Text. Kurz heißt hier: unter 80 Zeichen. */
    const text = (item.body || '').toString().trim();
    if (text.length < 80) { u = 2; gruende.push('der Kandidat sagt zu wenig'); }
    else if (nurPerson) { u = 1; gruende.push('nur die abwesende Person kennt den Vorgang'); }
    else { u = 0; gruende.push('der Kandidat erklärt sich selbst'); }
  }
  else if (!standDa && !schrittDa) { u = 2; gruende.push('Stand und nächster Schritt fehlen'); }
  else if (!standDa || !schrittDa || nurPerson) { u = 1; gruende.push(!standDa ? 'Stand fehlt' : !schrittDa ? 'nächster Schritt fehlt' : 'nur die abwesende Person kennt den Vorgang'); }
  else { u = 0; gruende.push('Stand und nächster Schritt stehen da'); }

  // G Entscheidungsgewicht
  const meinGate = absGate(absence.person);
  const stage = (item.stage || '').toString();
  let g = 0;
  if (item.gate === 'gf') { g = 3; gruende.push('liegt bei der GF gemeinsam'); }
  else if (item.board_lane === 'zu_besprechen' && item.priority === 'hoch') { g = 3; gruende.push('steht mit hoher Priorität zur Besprechung'); }
  else if (item.gate === meinGate && item.priority === 'hoch') { g = 2; gruende.push('Entscheidung der abwesenden Person, hohe Priorität'); }
  else if (item.kind === 'partner' && (stage === 'negotiation' || stage.startsWith('offer_'))) { g = 2; gruende.push(`Partnergespräch in der Phase ${stage}`); }
  else if (item.gate === meinGate) { g = 1; gruende.push('Entscheidung der abwesenden Person'); }
  else { g = 0; gruende.push(item.gate ? `Ausgang ${item.gate}` : 'ohne Ausgang beim Pförtner'); }

  const dringend = z >= 2;
  const wichtig = (f + g) >= 3;
  const quadrant = dringend && wichtig ? 'sofort' : wichtig ? 'planen' : dringend ? 'delegieren' : 'warten';

  let cluster = 'B';
  if (z === 3 || (u === 3 && z >= 2)) cluster = 'A';
  else if (g === 3 || f === 3) cluster = 'E';
  else if (z >= 2 && (g === 2 || f === 2 || u === 2)) cluster = 'C';
  else if (z <= 1 && f <= 1) cluster = 'D';

  let ampel = cluster === 'A' ? (absence.art === 'sofort' ? 'rot' : 'vorher')
            : cluster === 'B' ? 'gruen'
            : cluster === 'C' ? 'gelb'
            : cluster === 'E' ? 'rot' : 'ruht';
  let regel = '';
  if (stufe === 'kurz' && f !== 3) { ampel = 'ruht'; regel = 'Kurze Abwesenheit: nichts wird umgehängt, die Wache zeigt nur Fristen.'; }
  else if (stufe === 'lang' && ampel === 'gelb') { regel = 'Lange Abwesenheit: ab Tag 15 entscheidet die Vertretung gelbe Punkte ohne Einspruchsfrist.'; }

  const luecke = u >= 2;
  const satz = `${CLUSTER_TEXT[cluster]}, weil ${gruende.join('; ')} (Z${z} F${f} U${u} G${g}).`;
  return { z, f, u, g, score: z + f + u + g, dringend, wichtig, quadrant, cluster, ampel, luecke,
           regel_note: regel, begruendung: satz.charAt(0).toUpperCase() + satz.slice(1) };
}

/* Wer vertritt: erst (Person, Strang), dann (Person, gf) wenn G = 3, dann (Person, *), sonst der Standard der Abwesenheit.
   Bei ruht und vorher bleibt die Vertretung leer, denn dort wird nichts umgehängt. */
function vertretungFuer(bew: any, item: any, absence: any, deputies: any[]){
  if (bew.ampel === 'ruht' || bew.ampel === 'vorher') return null;
  const meine = deputies.filter(d => whoNorm(d.person) === whoNorm(absence.person) && d.active !== false);
  const strang = item.strand ? meine.find(d => d.bereich === item.strand) : null;
  const gf = bew.g === 3 ? meine.find(d => d.bereich === 'gf') : null;
  const stern = meine.find(d => d.bereich === '*');
  return (strang?.vertretung) || (gf?.vertretung) || (stern?.vertretung) || absence.vertretung_standard || null;
}

/* Dossier je Korbzeile: alles, was das Backend über den Vorgang schon weiß. Keine neuen Abfragen nach außen,
   Mail und Drive nur über die schon gespeicherten Quelllinks der Neuigkeiten. */
async function dossierFuer(item: any, absence: any){
  const d: Record<string, unknown> = { art: item.kind, stand: item.short_description || null, naechster_schritt: item.next_action || null };
  if (item.kind === 'thema') {
    d.kontext = item.context || null; d.entscheidung = item.decision || null; d.notizen = item.notes || null;
    d.verantwortung = item.owner || null; d.beteiligte = item.involved || null;
    const [news, besch] = await Promise.all([
      admin.from('gfweekly_news').select('title,body,source,source_title,source_url,happened_at').eq('topic_id', item.ref_id).order('happened_at',{ascending:false}).limit(5),
      admin.from('gfweekly_decisions').select('decision,next_action,owner,decided_at,decided_by').eq('topic_id', item.ref_id).order('decided_at',{ascending:false}).limit(5),
    ]);
    d.news = news.data || []; d.beschluesse = besch.data || [];
  } else if (item.kind === 'kandidat') {
    d.text = item.body || null; d.zitat = item.quote || null; d.quelle = item.source_title || item.source || null; d.quelle_url = item.source_url || null;
  } else if (item.kind === 'partner') {
    d.partner = item.title; d.phase = item.stage || null; d.wartet_auf = item.waiting_for || null; d.signal = item.signal || null;
    d.zieldatum = item.frist || null; d.verantwortung = item.owner || null;
  } else if (item.kind === 'meilenstein') {
    d.beschreibung = item.context || null; d.zeitraum = item.zeitraum || null; d.verantwortung = item.owner || null; d.stand = item.status || null;
  } else if (item.kind === 'ritual') {
    d.hinweis = item.context || null; d.phase = item.phase || null;
  } else if (item.kind === 'termin') {
    d.beschreibung = item.body || null; d.wer = item.who || null; d.quelle_url = item.source_url || null;
  }
  const inhalt = [d.stand, d.naechster_schritt, (d as any).kontext, (d as any).text, (d as any).beschreibung,
    (d as any).signal, (d as any).entscheidung, (d as any).notizen, (d as any).zitat, (d as any).hinweis, (d as any).wartet_auf];
  const leer = !inhalt.some(Boolean) && !((d.news as unknown[]) || []).length && !((d.beschluesse as unknown[]) || []).length;
  if (leer) {
    d.leer = true;
    const fragen = new Set<string>();
    for (const w of (item.who || '').split(/[,;]| und /i)) { const n = w.trim(); if (n && whoNorm(n) !== whoNorm(absence.person)) fragen.add(n); }
    if (item.owner && whoNorm(item.owner) !== whoNorm(absence.person)) fragen.add(item.owner);
    d.fragen = [...fragen];
  }
  return d;
}

/* Sammelt alles, was im Fenster der Abwesenheit liegt, und vereinheitlicht es zu Korbzeilen. */
async function handoverItems(absence: any){
  const person = whoNorm(absence.person), gate = absGate(absence.person);
  const von = absence.von as string, ende = absEnde(absence), heute = heuteBerlin();
  const items: any[] = [];

  const { data: themen, error: e1 } = await admin.from('gfweekly_topics')
    .select('id,title,short_description,context,decision,notes,next_action,owner,involved,priority,relevance,board_lane,gate,gate_frist,archived')
    .eq('archived', false).limit(2000);
  if (e1) throw new Error('Themen konnten nicht gelesen werden: '+e1.message);
  for (const x of (themen || [])) {
    const frist = x.gate_frist || null;
    /* Fenster der Abwesenheit. Überfälliges zählt mit, denn es bleibt liegen, solange niemand da ist. */
    const imFenster = !!frist && frist <= ende && (frist >= von || frist < heute);
    const meins = x.gate === gate || whoNorm(x.owner) === person;
    if (!(meins || imFenster)) continue;
    items.push({ kind:'thema', ref_id:x.id, title:x.title, strand:null, frist,
      short_description:x.short_description, context:x.context, decision:x.decision, notes:x.notes, next_action:x.next_action,
      owner:x.owner, who:[x.owner, x.involved].filter(Boolean).join(', '), involved:x.involved,
      priority:x.priority, relevance:x.relevance, board_lane:x.board_lane, gate:x.gate });
  }

  const { data: kandidaten, error: e2 } = await admin.from('gfweekly_news')
    .select('id,title,body,quote,relevance,strand,who,source,source_title,source_url,happened_at,gate,gate_frist')
    .eq('kind','kandidat').eq('status','neu').eq('gate', gate).limit(2000);
  if (e2) throw new Error('Kandidaten konnten nicht gelesen werden: '+e2.message);
  for (const x of (kandidaten || [])) {
    items.push({ kind:'kandidat', ref_id:x.id, title:x.title, strand:x.strand, frist:x.gate_frist || null,
      body:x.body, quote:x.quote, relevance:x.relevance, who:x.who, source:x.source, source_title:x.source_title,
      source_url:x.source_url, gate:x.gate });
  }

  const { data: meilen, error: e3 } = await admin.from('gfweekly_milestones')
    .select('id,title,description,date_from,date_to,zeitraum,strand,owner,status,archived')
    .eq('archived', false).not('status','in','("erreicht","abgesagt")').limit(1000);
  if (e3) throw new Error('Meilensteine konnten nicht gelesen werden: '+e3.message);
  for (const x of (meilen || [])) {
    const frist = x.date_from || null;
    if (!frist || frist < von || frist > ende) continue;
    items.push({ kind:'meilenstein', ref_id:x.id, title:x.title, strand:x.strand, frist,
      context:x.description, zeitraum:x.zeitraum, owner:x.owner, who:x.owner, status:x.status, priority:null, gate:null });
  }

  const { data: phasen } = await admin.from('gfweekly_cycle_phases').select('key,label,months,lead');
  const monate = new Set<number>();
  for (let d = von; d <= ende; d = addDays(d, 1)) monate.add(parseInt(d.slice(5,7)));
  const fuehrt = (lead: unknown) => (lead ?? '').toString().split(/[,;/]| und /i).map(x => x.trim()).filter(Boolean)
    .some(n => whoNorm(n) === person && (person === 'Alex' || person === 'Lea'));
  const meinePhasen = (phasen || []).filter((p: any) => fuehrt(p.lead) && (p.months || []).some((m: number) => monate.has(m)));
  if (meinePhasen.length) {
    const { data: rituale } = await admin.from('gfweekly_rituals').select('id,phase_key,title,hint,active')
      .in('phase_key', meinePhasen.map((p: any) => p.key)).eq('active', true).limit(100);
    for (const x of (rituale || [])) {
      items.push({ kind:'ritual', ref_id:x.id, title:x.title, strand:null, frist:null, context:x.hint,
        phase:(meinePhasen.find((p: any)=>p.key===x.phase_key)||{}).label, owner:absence.person, who:absence.person, gate:null });
    }
  }

  const { data: partner, error: e4 } = await admin.from('hh_partner_stand')
    .select('partner_id,name,lane,stage,owner,next_action,target_on,waiting_for,signal,overdue').limit(1000);
  if (e4) throw new Error('Partnerstand konnte nicht gelesen werden: '+e4.message);
  for (const x of (partner || [])) {
    const mein = whoNorm(x.owner) === person || (x.owner || '').toLowerCase() === 'together';
    if (!mein) continue;
    const frist = x.target_on || null;
    const passt = x.overdue || (!!frist && frist >= von && frist <= ende);
    if (!passt) continue;
    items.push({ kind:'partner', ref_id:String(x.partner_id), title:x.name, strand:'wwp', frist,
      next_action:x.next_action, waiting_for:x.waiting_for, signal:x.signal, stage:x.stage, owner:x.owner, who:x.owner, gate:null });
  }

  /* Einen Tag Rand holen und dann nach dem Berliner Kalendertag filtern: UTC-Grenzen schneiden sonst
     Termine am Rand ab oder nehmen fremde mit. */
  const { data: termine, error: e5 } = await admin.from('gfweekly_news')
    .select('id,title,body,who,happened_at,source_url,source_title,strand,source_ref')
    .eq('source','kalender').gte('happened_at', addDays(von,-1)+'T00:00:00Z').lte('happened_at', addDays(ende,1)+'T23:59:59Z').limit(2000);
  if (e5) throw new Error('Termine konnten nicht gelesen werden: '+e5.message);
  for (const x of (termine || [])) {
    const tag = new Date(x.happened_at).toLocaleDateString('sv-SE', { timeZone:'Europe/Berlin' });
    if (tag < von || tag > ende) continue;
    if (whoNorm(x.who) !== person && !(x.who || '').toLowerCase().includes(person.toLowerCase())) continue;
    const kennung = (x.source_ref || '').startsWith('cal:') ? x.source_ref : 'cal:' + x.id;
    items.push({ kind:'termin', ref_id:kennung, title:x.title, strand:x.strand, frist:tag,
      body:x.body, who:vornamen(x.who), source_url:x.source_url, gate:null });
  }
  /* Ein Vorgang, eine Zeile: derselbe Termin kann als mehrere Neuigkeiten vorliegen. */
  const gesehen = new Set<string>();
  return items.filter(x => { const k = x.kind+'|'+x.ref_id; if (gesehen.has(k)) return false; gesehen.add(k); return true; });
}

/* Baut den Korb neu: bewertet jede Zeile, legt neue an, ergänzt bestehende. Bestätigte Zeilen bleiben unangetastet,
   nur frist, dossier und luecke wandern nach. */
async function handoverBuild(absence: any){
  const [{ data: deputies }, { data: alt }] = await Promise.all([
    admin.from('gfweekly_deputies').select('*').eq('active', true),
    admin.from('gfweekly_handover').select('*').eq('absence_id', absence.id),
  ]);
  const vorhanden = new Map<string, any>((alt || []).map((r: any) => [r.kind+'|'+r.ref_id, r]));
  const items = await handoverItems(absence);
  const heute = heuteBerlin();
  let neu = 0, ergaenzt = 0, fehler = 0;
  for (const item of items) {
    const bew = score(item, absence, heute);
    const dossier = await dossierFuer(item, absence);
    const da = vorhanden.get(item.kind+'|'+item.ref_id);
    if (da && da.status !== 'vorschlag') {
      const patch: Record<string, unknown> = { frist:item.frist || null, dossier, luecke:bew.luecke, updated_at:new Date().toISOString() };
      const { error } = await admin.from('gfweekly_handover').update(patch).eq('id', da.id);
      if (error) fehler++; else ergaenzt++;
      continue;
    }
    const row: Record<string, unknown> = {
      absence_id: absence.id, kind: item.kind, ref_id: String(item.ref_id),
      title: (item.title ?? '').toString().slice(0,500), strand: item.strand || null, frist: item.frist || null,
      z: bew.z, f: bew.f, u: bew.u, g: bew.g, score: bew.score, dringend: bew.dringend, wichtig: bew.wichtig,
      quadrant: bew.quadrant, cluster: bew.cluster, ampel: bew.ampel, regel_note: bew.regel_note || null,
      begruendung: bew.begruendung, dossier, luecke: bew.luecke,
      vertretung: vertretungFuer(bew, item, absence, deputies || []),
      status: 'vorschlag', by: 'lauf', updated_at: new Date().toISOString(),
    };
    if (da) {
      /* status = vorschlag steht als Bedingung in der Anweisung selbst: wer zwischendurch bestätigt hat, gewinnt. */
      const { data, error } = await admin.from('gfweekly_handover').update(row).eq('id', da.id).eq('status','vorschlag').select('id');
      if (error) fehler++; else if ((data || []).length) ergaenzt++;
    } else {
      const { error } = await admin.from('gfweekly_handover').upsert(row, { onConflict:'absence_id,kind,ref_id', ignoreDuplicates:true });
      if (error) fehler++; else neu++;
    }
  }
  return { neu, ergaenzt, fehler, gesamt: items.length };
}

/* Zähler und Übernahmefähigkeit für die Übergabeseite. */
function handoverZaehler(rows: any[]){
  const zaehl = (feld: string) => rows.reduce((a: Record<string,number>, r: any) => { const k = r[feld] || 'offen'; a[k] = (a[k]||0)+1; return a; }, {} as Record<string,number>);
  const ohneLuecke = rows.filter((r: any) => !r.luecke).length;
  return { quadrant: zaehl('quadrant'), cluster: zaehl('cluster'), ampel: zaehl('ampel'), status: zaehl('status'),
    luecken: rows.filter((r: any) => r.luecke).length, gesamt: rows.length,
    uebernahmefaehigkeit: rows.length ? Math.round(ohneLuecke / rows.length * 100) : null };
}

async function handoverLog(absence_id: string, art: string, text: string, who: string, handover_id?: string|null){
  await admin.from('gfweekly_handover_log').insert({ absence_id, handover_id: handover_id || null, art, who: who || null, text: (text||'').slice(0,2000) });
}

/* ===== v29 · V24c (21.09.2026) · Asana: die bestätigte Übergabe als Projekt, der Rücksync als Protokoll.
   Das Token steht im Secret ASANA_TOKEN (Personal Access Token), der Arbeitsbereich in ASANA_WORKSPACE
   (Standard 57435200923138), das Team in ASANA_TEAM. Ohne Token passiert nichts, und die Antwort sagt warum:
   halbe Projekte sind schlimmer als gar keine. Fallback ohne Token ist Abschnitt H des täglichen Auftrags. ===== */
const ASANA_TOKEN = Deno.env.get('ASANA_TOKEN') ?? '';
const ASANA_WORKSPACE = Deno.env.get('ASANA_WORKSPACE') ?? '57435200923138';
const ASANA_TEAM = Deno.env.get('ASANA_TEAM') ?? '';
const ASANA_ABSCHNITTE = ['Sofort', 'Grün', 'Gelb', 'Rot bei der GF', 'Ruht bis Rückkehr'];
const HH_BASIS = 'https://hohes-haus.netlify.app';

async function asana(pfad: string, methode = 'GET', koerper?: unknown){
  const res = await fetch('https://app.asana.com/api/1.0' + pfad, {
    method: methode,
    headers: { 'Authorization': 'Bearer ' + ASANA_TOKEN, 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: koerper === undefined ? undefined : JSON.stringify({ data: koerper }),
  });
  const text = await res.text();
  let d: any = {}; try { d = JSON.parse(text); } catch (_e) { d = { raw: text }; }
  if (!res.ok) throw new Error(`Asana ${methode} ${pfad}: ${res.status} ${(d?.errors?.[0]?.message) || text.slice(0,200)}`);
  return d.data;
}
/* Welcher Abschnitt für welche Zeile: der Quadrant sticht, danach die Ampel. */
function asanaAbschnitt(row: any){
  if (row.quadrant === 'sofort') return 'Sofort';
  if (row.ampel === 'gruen') return 'Grün';
  if (row.ampel === 'gelb') return 'Gelb';
  if (row.ampel === 'rot') return 'Rot bei der GF';
  return 'Ruht bis Rückkehr';
}
function asanaLink(row: any){
  if (row.kind === 'thema') return `${HH_BASIS}/board.html?topic=${row.ref_id}`;
  if (row.kind === 'kandidat') return `${HH_BASIS}/neuigkeiten.html`;
  return `${HH_BASIS}/uebergabe.html?id=${row.absence_id}`;
}
/* Der Aufgabentext: Stand, nächster Schritt, Ampelregel als Satz, Notfalldefinition, Vollmacht, Frist, Link. */
function asanaNotiz(row: any, absence: any, vollmacht: string){
  const d = row.dossier || {};
  const ampelSatz: Record<string,string> = {
    gruen: 'Grün: du entscheidest im Rahmen der Vollmacht, ohne Rückfrage.',
    gelb: 'Gelb: du entscheidest nach kurzer Rückfrage. Kommt keine Antwort, gilt dein Vorschlag.',
    rot: `Rot: das gehört der GF gemeinsam, nicht der Vertretung. Warte auf ${absence.person} oder hole die andere GF dazu.`,
    vorher: 'Vor Abreise: das soll erledigt sein, bevor die Abwesenheit beginnt.',
    ruht: 'Ruht: nichts tun, das wartet bis zur Rückkehr.',
  };
  return [
    `In Vertretung für ${absence.person}, ${absence.von}${absence.bis ? ' bis ' + absence.bis : ' bis auf Weiteres'}.`,
    '',
    `Stand: ${d.stand || d.kontext || 'nicht notiert'}`,
    `Nächster Schritt: ${d.naechster_schritt || 'nicht notiert'}`,
    '',
    row.regel_note || ampelSatz[row.ampel] || 'Ohne Ampel: bitte in der Übergabe nachsehen.',
    'Notfall heißt: Geld ab 5.000 €, Recht, Personal, Presse, Behörde, Sicherheit. Notfälle gehen immer an die GF.',
    vollmacht ? `Vollmacht: ${vollmacht}` : 'Vollmacht: nicht festgelegt.',
    row.frist ? `Frist: ${row.frist}` : 'Frist: keine.',
    '',
    `Im Hohen Haus: ${asanaLink(row)}`,
    row.begruendung ? `\nWarum diese Einordnung: ${row.begruendung}` : '',
  ].join('\n');
}

/* Rücksync: erledigte Aufgaben und neue Kommentare zurück ins Haus. Läuft im Tick mit, wenn ein Token da ist. */
async function asanaSync(absence: any){
  if (!ASANA_TOKEN || !absence.asana_project_gid) return { erledigt:0, kommentare:0, fehler:0 };
  const seit = absence.asana_synced_at || absence.created_at || new Date(Date.now()-7*86400000).toISOString();
  const laufBeginn = new Date().toISOString();
  const { data: rows, error: le } = await admin.from('gfweekly_handover').select('*').eq('absence_id', absence.id).not('asana_gid','is',null);
  if (le) return { erledigt:0, kommentare:0, fehler:1 };
  /* Schon übernommene Kommentare stehen mit ihrer Asana-Kennung im Protokoll und kommen nicht zweimal. */
  const { data: schon } = await admin.from('gfweekly_handover_log').select('text').eq('absence_id', absence.id).eq('art','asana');
  const bekannt = new Set((schon || []).map((l: any) => (String(l.text).match(/\[asana:(\d+)\]/) || [])[1]).filter(Boolean));
  let erledigt = 0, kommentare = 0, fehler = 0;
  for (const row of (rows || [])) {
    let aufgabe: any = null;
    try { aufgabe = await asana(`/tasks/${row.asana_gid}?opt_fields=completed,completed_at,name`); } catch (_e) { fehler++; continue; }
    if (aufgabe?.completed && row.status !== 'erledigt') {
      const { error } = await admin.from('gfweekly_handover').update({ status:'erledigt', updated_at:new Date().toISOString() }).eq('id', row.id);
      if (error) { fehler++; }
      else { await handoverLog(absence.id, 'erledigt', `${row.title}: in Asana erledigt.`, 'asana', row.id); erledigt++; }
    }
    let stories: any[] = [];
    try { stories = await asana(`/tasks/${row.asana_gid}/stories?opt_fields=gid,text,created_at,type,created_by.name`) || []; } catch (_e) { fehler++; continue; }
    for (const s of stories) {
      if (s.type !== 'comment' || !s.created_at) continue;
      if (s.created_at <= seit || s.created_at > laufBeginn) continue;   // genau das Fenster dieses Laufs
      if (s.gid && bekannt.has(String(s.gid))) continue;                 // schon übernommen
      await handoverLog(absence.id, 'asana',
        `[asana:${s.gid || '0'}] ${row.title}: ${(s.created_by?.name || 'Asana')} schreibt „${(s.text||'').slice(0,400)}“.`, 'asana', row.id);
      if (s.gid) bekannt.add(String(s.gid));
      kommentare++;
    }
  }
  /* Der Zeitstempel wandert nur weiter, wenn der Lauf sauber war, und nur bis zum Laufbeginn.
     Sonst verschluckt ein einzelner Fehler ein ganzes Zeitfenster voller Kommentare. */
  if (!fehler) await admin.from('gfweekly_absences').update({ asana_synced_at: laufBeginn }).eq('id', absence.id);
  return { erledigt, kommentare, fehler };
}
/* Bei der Rückkehr wandert das Projekt ins Archiv. */
async function asanaArchivieren(absence: any){
  if (!ASANA_TOKEN || !absence.asana_project_gid) return false;
  try { await asana(`/projects/${absence.asana_project_gid}`, 'PUT', { archived:true }); return true; } catch (_e) { return false; }
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
    if (action === 'ping') return json({ ok:true, version:29, secretConfigured: !!PASSWORD, asanaConfigured: !!ASANA_TOKEN, aiConfigured: !!Deno.env.get('ANTHROPIC_API_KEY') });
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
    /* ----- Plattformen (v27, 20.09.2026): Executive Briefing aus Wilde Habitate (vvp_*) und Wild Wild Partner.
       Nur lesend über die Views hh_feed_habitate, hh_feed_partner, hh_partner_stand, hh_habitate_offen (Migration 20260920_hh_feeds).
       Nichts wird gespeichert, nichts gerechnet, was nicht aus den Views kommt. Zeitfenster 1 bis 90 Tage, Standard 7. ----- */
    if (action === 'platform_digest') {
      const days = Math.min(90, Math.max(1, parseInt(t.days)||7));
      const since = new Date(Date.now()-days*86400000).toISOString();
      const today = new Date().toLocaleDateString('sv-SE',{ timeZone:'Europe/Berlin' });
      const counts = (rows: any[]) => { const by: Record<string,number> = {}; for(const r of rows) by[r.kind]=(by[r.kind]||0)+1; return { total: rows.length, by_kind: by }; };
      const [hab, wwp, stand, offen] = await Promise.all([
        admin.from('hh_feed_habitate').select('*').gte('happened_at', since).order('happened_at',{ascending:false}).limit(500),
        admin.from('hh_feed_partner').select('*').gte('happened_at', since).order('happened_at',{ascending:false}).limit(500),
        admin.from('hh_partner_stand').select('*').order('updated_at',{ascending:false}),
        admin.from('hh_habitate_offen').select('*').order('updated_at',{ascending:false}),
      ]);
      for(const r of [hab,wwp,stand,offen]) if(r.error) throw r.error;
      const habRows = hab.data||[], wwpRows = wwp.data||[], standRows = stand.data||[], offenRows = offen.data||[];
      const moved = standRows.filter((p: any)=>p.updated_at && p.updated_at>=since);
      const upcoming = standRows.filter((p: any)=>p.target_on && p.target_on>=today && !['closed','paused'].includes(p.stage||'')).sort((a: any,b: any)=>a.target_on.localeCompare(b.target_on)).slice(0,3);
      const overdue = standRows.filter((p: any)=>p.overdue);
      const strip = (p: any) => ({ name:p.name, lane:p.lane, stage:p.stage, owner:p.owner, signal:(p.signal||'').slice(0,220), next_action:p.next_action, target_on:p.target_on, waiting_for:p.waiting_for, overdue:!!p.overdue, updated_at:p.updated_at });
      return json({ days, since, today,
        habitate: { url:'https://wilde-habitate.netlify.app', ...counts(habRows), latest: habRows.slice(0,10),
          decisions: habRows.filter((r: any)=>['entscheidung','entscheidung_status','habitat_entscheidung'].includes(r.kind)).length,
          open: { total: offenRows.length, by_urgency: offenRows.reduce((a: Record<string,number>, r: any)=>{ a[r.dringlichkeit]=(a[r.dringlichkeit]||0)+1; return a; },{}), overdue: offenRows.filter((r: any)=>r.dringlichkeit==='überfällig'||r.dringlichkeit==='blockiert').length,
                   latest: offenRows.slice(0,5).map((r: any)=>({ frage:r.frage, dringlichkeit:r.dringlichkeit, wer:r.wer_entscheidet, updated_at:r.updated_at })) } },
        wwp: { url:'https://wild-wild-partner.netlify.app', ...counts(wwpRows), latest: wwpRows.slice(0,10),
          partners_moved: moved.map(strip), partners_moved_count: moved.length,
          overdue: overdue.map(strip), overdue_count: overdue.length, upcoming: upcoming.map(strip) } });
    }
    if (action === 'platform_feed') {
      const view = t.platform==='wwp' ? 'hh_feed_partner' : t.platform==='habitate' ? 'hh_feed_habitate' : null;
      if(!view) return json({ error:'platform: habitate oder wwp' },400);
      const limit = Math.min(parseInt(t.limit)||100, 500);
      const since = t.since ? new Date(t.since) : new Date(Date.now()-7*86400000);
      const minSince = new Date(Date.now()-90*86400000); const s0 = (isNaN(since.getTime()) || since<minSince ? minSince : since).toISOString();
      const { data, error } = await admin.from(view).select('*').gte('happened_at', s0).order('happened_at',{ascending:false}).limit(limit);
      if(error) throw error; return json({ platform:t.platform, since:s0, items:data });
    }
    /* ----- Pförtner (v28, 20.09.2026): jeder Eintrag (Thema oder Kandidat) trägt gate (gf|alex|lea|team|plattform|warten),
       gate_frist, gate_note, gate_by (lauf = Vorschlag, sonst Person), gate_at. Migration 20260920_hh_gate. -----*/
    if (action === 'gate_set') {
      const table = t.kind==='thema' ? 'gfweekly_topics' : t.kind==='kandidat' ? 'gfweekly_news' : null;
      if(!table || !t.id) return json({ error:'kind (thema|kandidat) und id fehlen' },400);
      if(!GATES.includes(t.gate)) return json({ error:'gate: '+GATES.join('|') },400);
      const patch: Record<string,unknown> = { gate:t.gate, gate_by:(t.by ?? WHO).toString().slice(0,60), gate_at:new Date().toISOString() };
      if(t.frist!==undefined) patch.gate_frist = t.frist ? t.frist : null;
      if(t.note!==undefined) patch.gate_note = (t.note??'').toString().slice(0,300);
      const { data, error } = await admin.from(table).update(patch).eq('id',t.id).select().single(); if(error) throw error;
      return json({ item:data });
    }
    if (action === 'gate_set_many') {
      const items = Array.isArray(t.items) ? t.items.slice(0,500) : []; let n=0;
      for(const it of items){ const table = it.kind==='thema' ? 'gfweekly_topics' : it.kind==='kandidat' ? 'gfweekly_news' : null; if(!table||!it.id||!GATES.includes(it.gate)) continue;
        const patch: Record<string,unknown> = { gate:it.gate, gate_by:(t.by ?? WHO).toString().slice(0,60), gate_at:new Date().toISOString() };
        if(it.frist!==undefined) patch.gate_frist = it.frist||null; if(it.note!==undefined) patch.gate_note=(it.note??'').toString().slice(0,300);
        const { error } = await admin.from(table).update(patch).eq('id',it.id); if(error) throw error; n++; }
      return json({ ok:true, updated:n });
    }
    if (action === 'gate_list') {
      const gates = Array.isArray(t.gates) ? t.gates.filter((g: string)=>GATES.includes(g)) : (GATES.includes(t.gate) ? [t.gate] : null);
      const unconfirmed = !!t.unconfirmed; const limit = Math.min(parseInt(t.limit)||300, 1000);
      let q1 = admin.from('gfweekly_topics').select('id,title,short_description,context,priority,board_lane,owner,next_action,recommendation,decision,next_suggested,created_at,updated_at,relevance,gate,gate_frist,gate_by,gate_at,gate_note').eq('archived',false).in('board_lane',['zu_besprechen','in_klaerung']).limit(limit);
      let q2 = admin.from('gfweekly_news').select('id,title,body,quote,relevance,strand,who,source,source_title,source_url,happened_at,created_at,topic_id,gate,gate_frist,gate_by,gate_at,gate_note').eq('kind','kandidat').eq('status','neu').limit(limit);
      if(gates){ q1 = q1.in('gate',gates); q2 = q2.in('gate',gates); }
      if(unconfirmed){ q1 = q1.eq('gate_by','lauf'); q2 = q2.eq('gate_by','lauf'); }
      const [a,b] = await Promise.all([q1,q2]); if(a.error) throw a.error; if(b.error) throw b.error;
      const themen = (a.data||[]).map((x: any)=>({ kind:'thema', ...x }));
      const kandidaten = (b.data||[]).map((x: any)=>({ kind:'kandidat', ...x }));
      const all = [...themen, ...kandidaten].sort((x: any,y: any)=> (x.gate_frist||'9999').localeCompare(y.gate_frist||'9999') || (x.created_at||'').localeCompare(y.created_at||''));
      const counts: Record<string,number> = {}; for(const x of all) counts[x.gate||'offen']=(counts[x.gate||'offen']||0)+1;
      return json({ items: all, counts, themen: themen.length, kandidaten: kandidaten.length });
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

    /* ----- Vertretung (v29, 21.09.2026): Abwesenheit, Vertretungslinie, Übergabekorb, Protokoll, Tick.
       Migration 20260921_hh_vertretung. Die Matrix steht als reine Funktion score(item, absence) weiter oben. ----- */
    if (action === 'absence_set') {
      const person = whoNorm(t.person);
      if (!t.von) return json({ error:'von fehlt' },400);
      if (!ABS_ART.includes(t.art)) return json({ error:'art: '+ABS_ART.join('|') },400);
      if (!ABS_KONTAKT.includes(t.kontakt)) return json({ error:'kontakt: '+ABS_KONTAKT.join('|') },400);
      const roh: Record<string, unknown> = {
        person, von: t.von, bis: t.bis || null, bis_geschaetzt: t.bis_geschaetzt || null,
        art: t.art, kontakt: t.kontakt, kanal: (t.kanal ?? '').toString().slice(0,300) || null,
        gespraech_zeit: (t.gespraech_zeit ?? '').toString().slice(0,200) || null,
        vertretung_standard: (t.vertretung_standard ?? '').toString().slice(0,120) || null,
        test: !!t.test, note: (t.note ?? '').toString().slice(0,2000) || null,
        updated_at: new Date().toISOString(),
      };
      roh.stufe = absStufe(roh);
      const heute = heuteBerlin();
      let absence: any;
      if (t.id) {
        const { data: vorher } = await admin.from('gfweekly_absences').select('status').eq('id', t.id).single();
        roh.status = (vorher?.status === 'rueckkehr' || vorher?.status === 'beendet') ? vorher.status : ((roh.von as string) > heute ? 'geplant' : 'aktiv');
        const { data, error } = await admin.from('gfweekly_absences').update(roh).eq('id', t.id).select().single();
        if (error) throw error; absence = data;
      } else {
        roh.status = (roh.von as string) > heute ? 'geplant' : 'aktiv';
        roh.created_by = WHO;
        const { data, error } = await admin.from('gfweekly_absences').insert(roh).select().single();
        if (error) throw error; absence = data;
      }
      const bau = await handoverBuild(absence);
      const { data: rows } = await admin.from('gfweekly_handover').select('*').eq('absence_id', absence.id);
      return json({ absence, bau, zaehler: handoverZaehler(rows || []) });
    }
    if (action === 'absence_list') {
      let q = admin.from('gfweekly_absences').select('*').order('von', { ascending:false });
      if (t.status) q = q.in('status', Array.isArray(t.status) ? t.status : [t.status]);
      if (!t.include_test) q = q.eq('test', false);
      const { data, error } = await q; if (error) throw error;
      const ids = (data || []).map((a: any) => a.id);
      let zaehler: Record<string, unknown> = {};
      if (ids.length) {
        const { data: rows } = await admin.from('gfweekly_handover').select('absence_id,quadrant,cluster,ampel,status,luecke,vertretung').in('absence_id', ids);
        for (const a of (data || [])) zaehler[a.id] = handoverZaehler((rows || []).filter((r: any) => r.absence_id === a.id));
      }
      return json({ absences: data, zaehler });
    }
    if (action === 'absence_end') {
      if (!t.id) return json({ error:'id fehlt' },400);
      const { data: absence, error } = await admin.from('gfweekly_absences')
        .update({ status:'beendet', updated_at:new Date().toISOString() }).eq('id', t.id).select().single();
      if (error) throw error;
      const { data: rows } = await admin.from('gfweekly_handover').select('id,ref_id,kind').eq('absence_id', t.id).eq('kind','thema');
      for (const r of (rows || [])) await admin.from('gfweekly_topics').update({ owner_backup:null }).eq('id', r.ref_id);
      await handoverLog(t.id, 'notiz', `Rückübergabe bestätigt, ${(rows||[]).length} Themen wieder bei ${absence.person}.`, WHO);
      const archiviert = await asanaArchivieren(absence);
      return json({ absence, asana_archiviert: archiviert });
    }
    if (action === 'deputies_list') {
      let q = admin.from('gfweekly_deputies').select('*').order('person').order('sort');
      if (t.person) q = q.eq('person', whoNorm(t.person));
      const { data, error } = await q; if (error) throw error; return json({ deputies:data });
    }
    if (action === 'deputies_set') {
      if (!t.person || !t.bereich || (!t.vertretung && t.active !== false)) return json({ error:'person, bereich und vertretung fehlen' },400);
      const row: Record<string, unknown> = {
        person: whoNorm(t.person), bereich: (t.bereich ?? '').toString().slice(0,60),
        vertretung: (t.vertretung ?? '').toString().slice(0,120),
        vollmacht: t.vollmacht === undefined ? undefined : ((t.vollmacht ?? '').toString().slice(0,1000) || null),
        sort: t.sort === undefined ? undefined : (parseInt(t.sort) || 100),
        active: t.active === undefined ? undefined : !!t.active,
        updated_at: new Date().toISOString(),
      };
      for (const k of Object.keys(row)) if (row[k] === undefined) delete row[k];
      if (t.id) {
        /* Mit id wird die vorhandene Zeile geändert. Ohne id entsteht eine neue, und ein schon belegter
           Bereich wird nicht heimlich überschrieben. */
        const { data, error } = await admin.from('gfweekly_deputies').update(row).eq('id', t.id).select().single();
        if (error) throw error; return json({ deputy:data });
      }
      const { data: schon } = await admin.from('gfweekly_deputies').select('id').eq('person', row.person).eq('bereich', row.bereich).maybeSingle();
      if (schon) return json({ error:'Für diesen Bereich gibt es schon eine Zeile.', id:schon.id },409);
      const { data, error } = await admin.from('gfweekly_deputies').insert(row).select().single();
      if (error) throw error; return json({ deputy:data });
    }
    if (action === 'handover_build') {
      if (!t.absence_id) return json({ error:'absence_id fehlt' },400);
      const { data: absence, error } = await admin.from('gfweekly_absences').select('*').eq('id', t.absence_id).single();
      if (error || !absence) return json({ error:'Abwesenheit fehlt' },404);
      const bau = await handoverBuild(absence);
      const { data: rows } = await admin.from('gfweekly_handover').select('*').eq('absence_id', absence.id);
      return json({ bau, zaehler: handoverZaehler(rows || []) });
    }
    if (action === 'handover_list') {
      if (!t.absence_id) return json({ error:'absence_id fehlt' },400);
      let q = admin.from('gfweekly_handover').select('*').eq('absence_id', t.absence_id)
        .order('score', { ascending:false }).order('frist', { ascending:true, nullsFirst:false });
      if (t.cluster) q = q.in('cluster', Array.isArray(t.cluster) ? t.cluster : [t.cluster]);
      if (t.quadrant) q = q.in('quadrant', Array.isArray(t.quadrant) ? t.quadrant : [t.quadrant]);
      if (t.status) q = q.in('status', Array.isArray(t.status) ? t.status : [t.status]);
      const { data, error } = await q; if (error) throw error;
      const { data: alle } = await admin.from('gfweekly_handover').select('quadrant,cluster,ampel,status,luecke').eq('absence_id', t.absence_id);
      const { data: absence } = await admin.from('gfweekly_absences').select('*').eq('id', t.absence_id).single();
      return json({ items:data, absence, ...handoverZaehler(alle || []) });
    }
    if (action === 'handover_set' || action === 'handover_set_many') {
      const liste = action === 'handover_set' ? [t] : (Array.isArray(t.items) ? t.items.slice(0,500) : []);
      const by = (t.by ?? WHO).toString().slice(0,60);
      const ergebnis: any[] = []; let n = 0;
      for (const it of liste) {
        if (!it.id) continue;
        const { data: alt } = await admin.from('gfweekly_handover').select('*').eq('id', it.id).single();
        if (!alt) continue;
        const { data: absence } = await admin.from('gfweekly_absences').select('*').eq('id', alt.absence_id).single();
        const patch: Record<string, unknown> = { by, updated_at:new Date().toISOString() };
        if (it.cluster !== undefined && HO_CLUSTER.includes(it.cluster)) patch.cluster = it.cluster;
        if (it.ampel !== undefined && HO_AMPEL.includes(it.ampel)) patch.ampel = it.ampel;
        if (it.vertretung !== undefined) patch.vertretung = (it.vertretung ?? '').toString().slice(0,120) || null;
        if (it.ampel === 'ruht') patch.vertretung = null;   // was ruht, wird nicht vertreten
        if (it.frist !== undefined) patch.frist = it.frist || null;
        if (it.regel_note !== undefined) patch.regel_note = (it.regel_note ?? '').toString().slice(0,500) || null;
        patch.status = (it.status !== undefined && HO_STATUS.includes(it.status)) ? it.status : 'bestaetigt';
        const { data: neu, error } = await admin.from('gfweekly_handover').update(patch).eq('id', it.id).select().single();
        if (error) throw error;
        n++; ergebnis.push(neu);

        const ampel = (neu.ampel ?? alt.ampel) as string;
        const vertretung = neu.vertretung as string | null;   // aus der gespeicherten Zeile, nicht aus dem alten Stand
        if (neu.kind === 'thema' && absence) {
          const themenPatch: Record<string, unknown> = { handover_id: neu.id, updated_at:new Date().toISOString() };
          if (ampel === 'ruht') {
            themenPatch.gate = 'warten';
            themenPatch.gate_frist = addDays(absEnde(absence), 1);
            themenPatch.gate_by = by; themenPatch.gate_at = new Date().toISOString();
            themenPatch.gate_note = `ruht bis zur Rückkehr von ${absence.person}`;
            themenPatch.owner_backup = null;                  // was ruht, hat keine Vertretung
          } else if (vertretung) {
            const g = absGate(vertretung);
            themenPatch.owner_backup = vertretung;
            themenPatch.gate = g || 'team';
            themenPatch.gate_by = by; themenPatch.gate_at = new Date().toISOString();
            themenPatch.gate_note = `in Vertretung für ${absence.person}`;
          } else {
            /* Keine Vertretung mehr: der Ausgang gehört wieder der abwesenden Person, sonst bliebe das Thema
               bei jemandem hängen, der es nicht mehr hat. */
            themenPatch.owner_backup = null;
            themenPatch.gate = absGate(absence.person) || 'gf';
            themenPatch.gate_by = by; themenPatch.gate_at = new Date().toISOString();
            themenPatch.gate_note = `wieder bei ${absence.person}`;
          }
          const { error: tf } = await admin.from('gfweekly_topics').update(themenPatch).eq('id', neu.ref_id);
          if (tf) return json({ error:'Thema konnte nicht nachgezogen werden: '+tf.message },500);
        }
        if (absence) {
          const wort = ampel === 'ruht' ? 'ruht bis zur Rückkehr' : vertretung ? `geht an ${vertretung}` : 'bestätigt';
          await handoverLog(absence.id, patch.status === 'erledigt' ? 'erledigt' : vertretung ? 'weitergabe' : 'notiz',
            `${neu.title}: ${wort} (Ampel ${ampel || 'offen'}).`, by, neu.id);
        }
      }
      return action === 'handover_set' ? json({ item: ergebnis[0] || null }) : json({ ok:true, updated:n });
    }
    if (action === 'handover_zurueck') {
      /* Rückkehr: die Zeile ist erledigt, die Vertretung fällt weg, und das Thema gehört wieder der Person. */
      if (!t.id) return json({ error:'id fehlt' },400);
      const by = (t.by ?? WHO).toString().slice(0,60);
      const { data: row } = await admin.from('gfweekly_handover').select('*').eq('id', t.id).single();
      if (!row) return json({ error:'Zeile fehlt' },404);
      const { data: absence } = await admin.from('gfweekly_absences').select('*').eq('id', row.absence_id).single();
      /* Reihenfolge mit Absicht: erst der Vorgang, dann die Korbzeile. Scheitert der erste Schritt, bleibt die
         Zeile sichtbar, und niemand hält etwas für erledigt, das noch falsch zugeordnet ist. */
      let thema = null;
      const g = absGate(absence?.person || '') || 'gf';
      if (row.kind === 'thema' && absence) {
        const { data: tp, error: tf } = await admin.from('gfweekly_topics')
          .update({ owner_backup:null, gate:g, gate_by:by, gate_at:new Date().toISOString(),
                    gate_note:`zurück bei ${absence.person} nach der Vertretung`, updated_at:new Date().toISOString() })
          .eq('id', row.ref_id).select('id,gate,owner_backup').single();
        if (tf) return json({ error:'Thema konnte nicht zurückgegeben werden: '+tf.message },500);
        thema = tp;
      }
      if (row.kind === 'kandidat' && absence) {
        const { data: kd, error: kf } = await admin.from('gfweekly_news')
          .update({ gate:g, gate_by:by, gate_at:new Date().toISOString(), gate_note:`zurück bei ${absence.person} nach der Vertretung` })
          .eq('id', row.ref_id).select('id,gate').single();
        if (kf) return json({ error:'Kandidat konnte nicht zurückgegeben werden: '+kf.message },500);
        thema = kd;
      }
      const { data: neu, error } = await admin.from('gfweekly_handover')
        .update({ status:'erledigt', vertretung:null, by, updated_at:new Date().toISOString() }).eq('id', t.id).select().single();
      if (error) throw error;
      if (absence) await handoverLog(absence.id, 'notiz', `${row.title}: wieder bei ${absence.person}.`, by, row.id);
      return json({ item:neu, thema });
    }
    if (action === 'handover_dossier') {
      if (!t.id) return json({ error:'id fehlt' },400);
      const { data: row } = await admin.from('gfweekly_handover').select('*').eq('id', t.id).single();
      if (!row) return json({ error:'Zeile fehlt' },404);
      const { data: absence } = await admin.from('gfweekly_absences').select('*').eq('id', row.absence_id).single();
      const items = await handoverItems(absence);
      const item = items.find((x: any) => x.kind === row.kind && String(x.ref_id) === row.ref_id);
      if (!item) return json({ error:'Vorgang nicht mehr im Fenster' },404);
      const dossier = await dossierFuer(item, absence);
      const { data, error } = await admin.from('gfweekly_handover').update({ dossier, updated_at:new Date().toISOString() }).eq('id', t.id).select().single();
      if (error) throw error; return json({ item:data });
    }
    if (action === 'handover_log_add') {
      if (!t.absence_id || !t.art) return json({ error:'absence_id und art fehlen' },400);
      await handoverLog(t.absence_id, t.art, (t.text ?? '').toString(), (t.who ?? WHO).toString(), t.handover_id || null);
      const { data } = await admin.from('gfweekly_handover_log').select('*').eq('absence_id', t.absence_id).order('at', { ascending:false }).limit(200);
      return json({ log:data });
    }
    if (action === 'handover_log') {
      if (!t.absence_id) return json({ error:'absence_id fehlt' },400);
      const { data, error } = await admin.from('gfweekly_handover_log').select('*').eq('absence_id', t.absence_id).order('at', { ascending:false }).limit(300);
      if (error) throw error; return json({ log:data });
    }
    if (action === 'uebernahme_stat') {
      const personen = t.person ? [whoNorm(t.person)] : ['Alex','Lea'];
      const stat: Record<string, unknown> = {};
      for (const p of personen) {
        const { data } = await admin.from('gfweekly_topics').select('id,short_description,next_action,gate_frist,owner,gate').eq('archived', false);
        const meine = (data || []).filter((x: any) => whoNorm(x.owner) === p || x.gate === absGate(p));
        const ohneStand = meine.filter((x: any) => !(x.short_description || '').trim()).length;
        const ohneSchritt = meine.filter((x: any) => !(x.next_action || '').trim()).length;
        const ohneFrist = meine.filter((x: any) => !x.gate_frist).length;
        const bereit = meine.filter((x: any) => (x.short_description || '').trim() && (x.next_action || '').trim()).length;
        stat[p] = { themen: meine.length, ohne_stand: ohneStand, ohne_schritt: ohneSchritt, ohne_frist: ohneFrist,
                    uebernahmefaehigkeit: meine.length ? Math.round(bereit / meine.length * 100) : null };
      }
      return json({ stat });
    }
    if (action === 'absence_tick') {
      const heute = heuteBerlin();
      const { data: laufende } = await admin.from('gfweekly_absences').select('*').in('status', ['geplant','aktiv','rueckkehr']);
      const bericht: any[] = [];
      for (const a of (laufende || [])) {
        const schritte: string[] = [];
        let absence = a;

        // Hochstufung bei einer sofortigen Abwesenheit ohne Enddatum
        if (absence.art === 'sofort' && absence.status !== 'rueckkehr') {
          const tag = tageBis(absence.von, heute) + 1;
          const neueStufe = tag >= 15 ? 'lang' : tag >= 4 ? 'mittel' : absence.stufe;
          if (neueStufe !== absence.stufe && (absence.stufe === 'kurz' || absence.stufe === 'mittel')) {
            const { data } = await admin.from('gfweekly_absences').update({ stufe:neueStufe, updated_at:new Date().toISOString() }).eq('id', absence.id).select().single();
            absence = data || absence;
            await handoverLog(absence.id, 'hochstufung', `Tag ${tag}: aus einer ${a.stufe}en Abwesenheit wird eine ${neueStufe}e. Die Vorschläge werden neu bewertet.`, 'lauf');
            await admin.from('gfweekly_handover').delete().eq('absence_id', absence.id).eq('status','vorschlag');
            schritte.push('hochgestuft auf '+neueStufe);
          }
        }

        if (absence.status !== 'rueckkehr') {
          try {
            const bau = await handoverBuild(absence);
            schritte.push(`Korb: ${bau.neu} neu, ${bau.ergaenzt} ergänzt` + (bau.fehler ? `, ${bau.fehler} Fehler` : ''));
          } catch (e) { schritte.push('Korb konnte nicht gebaut werden: ' + String((e as Error).message).slice(0,160)); }
        }

        // Statuswechsel
        const ende = absence.bis || null;
        if (absence.status === 'geplant' && absence.von <= heute) {
          await admin.from('gfweekly_absences').update({ status:'aktiv', updated_at:new Date().toISOString() }).eq('id', absence.id);
          await handoverLog(absence.id, 'notiz', `Die Abwesenheit von ${absence.person} beginnt heute.`, 'lauf');
          absence.status = 'aktiv'; schritte.push('aktiv');
        }
        if (absence.status === 'aktiv' && ende && heute > ende) {
          const { data: log } = await admin.from('gfweekly_handover_log').select('art,text,at').eq('absence_id', absence.id).order('at');
          const gruppe = (art: string) => (log || []).filter((l: any) => l.art === art).length;
          const { data: offen } = await admin.from('gfweekly_handover').select('id,title,ampel,status').eq('absence_id', absence.id).neq('status','erledigt');
          const briefing = [
            `Seit ${absence.von} bis ${ende}:`,
            `${gruppe('entscheidung')} Entscheidungen in Vertretung`,
            `${gruppe('weitergabe')} Weitergaben`,
            `${gruppe('erledigt')} erledigte Punkte`,
            `${(offen || []).filter((o: any) => o.ampel === 'rot' || o.ampel === 'ruht').length} Punkte warten auf dich`,
          ].join('\n');
          const jetzt = new Date().toISOString();
          await admin.from('gfweekly_absences').update({ status:'rueckkehr', note_rueckkehr:briefing, rueckkehr_at:jetzt, updated_at:jetzt }).eq('id', absence.id);
          await handoverLog(absence.id, 'notiz', `Rückkehr von ${absence.person}, das Briefing steht bereit.`, 'lauf');
          absence.status = 'rueckkehr'; absence.rueckkehr_at = jetzt; schritte.push('Rückkehr');
          if (await asanaArchivieren(absence)) schritte.push('Asana-Projekt archiviert');
        }
        if (absence.status === 'rueckkehr') {
          /* Drei Tage ab dem Wechsel auf rueckkehr, nicht ab irgendeiner Änderung. Fehlt der Zeitpunkt
             (Abwesenheit aus der Zeit vor diesem Feld), wird er jetzt gesetzt und die Frist beginnt heute. */
          if (!absence.rueckkehr_at) {
            const jetzt = new Date().toISOString();
            await admin.from('gfweekly_absences').update({ rueckkehr_at: jetzt }).eq('id', absence.id);
            absence.rueckkehr_at = jetzt;
          }
          const seit = tageBis(absence.rueckkehr_at.slice(0,10), heute);
          if (seit >= 3) {
            await admin.from('gfweekly_absences').update({ status:'beendet', updated_at:new Date().toISOString() }).eq('id', absence.id);
            absence.status = 'beendet';
            const { data: themen } = await admin.from('gfweekly_handover').select('ref_id').eq('absence_id', absence.id).eq('kind','thema');
            for (const r of (themen || [])) await admin.from('gfweekly_topics').update({ owner_backup:null }).eq('id', r.ref_id);
            await handoverLog(absence.id, 'notiz', 'Drei Tage nach der Rückkehr ohne Bestätigung: die Abwesenheit ist beendet.', 'lauf');
            schritte.push('beendet');
          }
        }

        // Wache: was in den nächsten drei Tagen fällig wird, bekommt eine Marke im Dossier
        const { data: bald } = await admin.from('gfweekly_handover').select('id,dossier,frist,status')
          .eq('absence_id', absence.id).neq('status','erledigt').not('frist','is',null).lte('frist', addDays(heute, 3));
        for (const r of (bald || [])) {
          const d = { ...(r.dossier || {}), wache:true };
          await admin.from('gfweekly_handover').update({ dossier:d }).eq('id', r.id);
        }
        if ((bald || []).length) { schritte.push(`${(bald || []).length} auf der Wache`); }

        // V24c: erledigte Aufgaben und neue Kommentare aus Asana zurückholen
        if (ASANA_TOKEN && absence.asana_project_gid) {
          try { const a = await asanaSync(absence);
            if (a.erledigt || a.kommentare || a.fehler) schritte.push(`Asana: ${a.erledigt} erledigt, ${a.kommentare} Kommentare` + (a.fehler ? `, ${a.fehler} Fehler` : '')); }
          catch (e) { schritte.push('Asana: ' + String((e as Error).message).slice(0,120)); }
        }
        if (absence.status === 'beendet') await asanaArchivieren(absence);
        bericht.push({ id:absence.id, person:absence.person, status:absence.status, stufe:absence.stufe, schritte });
      }
      return json({ ok:true, heute, absences:bericht.length, bericht });
    }

    /* ----- Asana (v29, V24c): Export der bestätigten Übergabe und Rücksync. Ohne ASANA_TOKEN passiert nichts. ----- */
    if (action === 'asana_export') {
      if (!ASANA_TOKEN) return json({ error:'ASANA_TOKEN fehlt', hinweis:'Secret in Supabase anlegen, dann erneut versuchen. Bis dahin exportiert der tägliche Auftrag (Abschnitt H).' }, 400);
      if (!t.absence_id) return json({ error:'absence_id fehlt' },400);
      const { data: absence } = await admin.from('gfweekly_absences').select('*').eq('id', t.absence_id).single();
      if (!absence) return json({ error:'Abwesenheit fehlt' },404);
      const { data: rows } = await admin.from('gfweekly_handover').select('*').eq('absence_id', absence.id)
        .eq('status','bestaetigt').neq('ampel','vorher');
      if (!rows || !rows.length) return json({ error:'nichts zu exportieren', hinweis:'Es gibt keine bestätigten Zeilen außerhalb von „vor Abreise“.' },400);
      const [{ data: leute }, { data: deputies }] = await Promise.all([
        admin.from('gfweekly_people').select('name,email,asana_gid'),
        admin.from('gfweekly_deputies').select('*').eq('person', absence.person).eq('active', true),
      ]);
      /* Zuordnung über den Namen selbst, nicht über whoNorm: das macht aus Merle und Tim sonst dieselbe Person. */
      const norm = (x: unknown) => (x ?? '').toString().trim().toLowerCase();
      const ohneGid: string[] = [];
      const gidVon = (name: string) => {
        if (!name) return null;
        const p = (leute || []).find((q: any) => norm(q.name) === norm(name));
        if (!p?.asana_gid) { if (name && !ohneGid.includes(name)) ohneGid.push(name); return null; }
        return p.asana_gid;
      };
      /* Vollmacht nach derselben Bereichsregel wie die Vertretung: erst Strang, dann gf, dann Stern. */
      const vollmachtVon = (row: any) => {
        if (!row.vertretung) return '';
        const meine = (deputies || []).filter((d: any) => norm(d.vertretung) === norm(row.vertretung));
        /* Erst die zuständige Regel bestimmen, dann ihre Vollmacht lesen. Eine Regel ohne Vollmacht bedeutet
           „keine Vollmacht“ und darf nicht durch die Vollmacht eines anderen Bereichs ersetzt werden. */
        const regel = (row.strand && meine.find((d: any) => d.bereich === row.strand))
          || (row.g === 3 && meine.find((d: any) => d.bereich === 'gf'))
          || meine.find((d: any) => d.bereich === '*') || null;
        return regel ? (regel.vollmacht || '') : '';
      };

      /* Projekt anlegen oder das bestehende weiterverwenden. Das Team kommt aus ASANA_TEAM oder aus der Nutzlast. */
      const name = `Vertretung ${absence.person} · ${absence.von} bis ${absence.bis || 'offen'}`;
      let projekt = absence.asana_project_gid;
      if (projekt) {
        try { await asana(`/projects/${projekt}`, 'PUT', { name, archived:false }); }
        catch (e) {
          const m = String((e as Error).message);
          /* Nur ein wirklich verschwundenes Projekt wird ersetzt. Bei allen anderen Fehlern brechen wir ab,
             sonst entsteht aus einer Störung ein zweites Projekt. */
          if (/: 404 /.test(m)) projekt = null;
          else return json({ error:m, hinweis:'Das bestehende Projekt ließ sich nicht erreichen. Nichts geändert, bitte später erneut versuchen.' },502);
        }
      }
      if (!projekt) {
        /* Team: erst die Nutzlast, dann das Secret, sonst aus einem bestehenden Projekt des Arbeitsbereichs. */
        let team = (t.team ?? ASANA_TEAM ?? '').toString();
        if (!team) {
          try {
            const liste = await asana(`/projects?workspace=${ASANA_WORKSPACE}&limit=20&opt_fields=team,name,archived`);
            team = (liste || []).find((p: any) => p?.team?.gid && !p.archived)?.team?.gid || '';
          } catch (_e) { team = ''; }
        }
        const daten: Record<string, unknown> = { name, workspace: ASANA_WORKSPACE,
          notes:`Übergabekorb aus dem Hohen Haus. Eine Aufgabe je Punkt, Abschnitte nach Dringlichkeit und Ampel.\n${HH_BASIS}/uebergabe.html?id=${absence.id}` };
        if (team) daten.team = team;
        try { projekt = (await asana('/projects', 'POST', daten)).gid; }
        catch (e) { return json({ error:String((e as Error).message), hinweis:'Braucht der Arbeitsbereich ein Team, ASANA_TEAM setzen oder team in der Nutzlast mitgeben.' },400); }
        const { error: pf } = await admin.from('gfweekly_absences').update({ asana_project_gid: projekt }).eq('id', absence.id);
        if (pf) return json({ error:'Das Projekt steht in Asana, ließ sich aber nicht merken: '+pf.message,
          projekt, hinweis:'Bitte die Kennung von Hand in gfweekly_absences.asana_project_gid eintragen, sonst legt der nächste Export ein zweites Projekt an.' },500);
      }
      /* Abschnitte: vorhandene weiterverwenden, fehlende anlegen. */
      const vorhanden = await asana(`/projects/${projekt}/sections?opt_fields=name`);
      const abschnitt: Record<string,string> = {};
      for (const a of (vorhanden || [])) abschnitt[a.name] = a.gid;
      for (const n of ASANA_ABSCHNITTE) if (!abschnitt[n]) abschnitt[n] = (await asana(`/projects/${projekt}/sections`, 'POST', { name:n })).gid;

      const folgen = [gidVon('Alex'), gidVon('Lea')].filter(Boolean) as string[];
      let neu = 0, aktualisiert = 0;
      for (const row of rows) {
        const sek = asanaAbschnitt(row);
        const daten: Record<string, unknown> = {
          name: `[Vertretung] ${row.title || 'ohne Titel'}`,
          notes: asanaNotiz(row, absence, vollmachtVon(row)),
          due_on: row.frist || null,
        };
        const zu = row.vertretung ? gidVon(row.vertretung) : null;
        if (row.asana_gid) {
          /* Beim Auffrischen wird die Zuweisung ausdrücklich gesetzt oder gelöscht, sonst bliebe sie
             bei der Person hängen, die vorher vertreten hat. */
          await asana(`/tasks/${row.asana_gid}`, 'PUT', Object.assign({}, daten, { assignee: zu }));
          if (row.asana_section !== abschnitt[sek]) await asana(`/sections/${abschnitt[sek]}/addTask`, 'POST', { task: row.asana_gid });
          await admin.from('gfweekly_handover').update({ asana_section: abschnitt[sek] }).eq('id', row.id);
          aktualisiert++;
        } else {
          const aufgabe = await asana('/tasks', 'POST', Object.assign({}, daten, zu ? { assignee: zu } : {}, {
            workspace: ASANA_WORKSPACE, memberships:[{ project: projekt, section: abschnitt[sek] }],
            followers: folgen }));
          const { error: af } = await admin.from('gfweekly_handover').update({ asana_gid: aufgabe.gid, asana_section: abschnitt[sek] }).eq('id', row.id);
          if (af) return json({ error:'Aufgabe steht in Asana, ließ sich aber nicht merken: '+af.message, projekt, aufgabe:aufgabe.gid },500);
          neu++;
        }
      }
      await handoverLog(absence.id, 'asana', `Nach Asana exportiert: ${neu} neue und ${aktualisiert} aktualisierte Aufgaben.`
        + (ohneGid.length ? ` Ohne Zuweisung, weil die Asana-Kennung fehlt: ${ohneGid.join(', ')}.` : ''), (t.by ?? WHO).toString());
      return json({ ok:true, projekt, neu, aktualisiert, ohne_zuweisung:ohneGid, url:`https://app.asana.com/0/${projekt}` });
    }
    if (action === 'asana_sync') {
      if (!ASANA_TOKEN) return json({ error:'ASANA_TOKEN fehlt' },400);
      if (!t.absence_id) return json({ error:'absence_id fehlt' },400);
      const { data: absence } = await admin.from('gfweekly_absences').select('*').eq('id', t.absence_id).single();
      if (!absence) return json({ error:'Abwesenheit fehlt' },404);
      const bericht = await asanaSync(absence);
      return json({ ok:true, ...bericht });
    }

    return json({ error:'unknown action' }, 400);
  } catch (e) { return json({ error:String((e as Error).message ?? e) }, 500); }
});
