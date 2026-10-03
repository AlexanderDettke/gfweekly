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
const HO_KIND = ['thema','kandidat','meilenstein','ritual','termin','asana','partner','vorhaben']; // v38: vorhaben
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
  /* F liest genau die Felder, die die Vorgabe nennt. U darf weiter suchen: dort geht es darum, ob der Vorgang
     an eine Person gebunden ist, und das steht oft im nächsten Schritt oder in den Notizen. */
  const textF = [item.title, item.short_description, item.context, item.body].filter(Boolean).join(' \n ').toLowerCase();
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
  const geld = geldMax(textF);
  const gfWort = trefferWort(textF, GF_WORTE);
  const betriebWort = trefferWort(textF, BETRIEB_WORTE);
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
  } else if (item.kind === 'vorhaben') {
    Object.assign(d, await vhDossier(item));
  }
  const inhalt = [d.stand, d.naechster_schritt, (d as any).kontext, (d as any).text, (d as any).beschreibung,
    (d as any).signal, (d as any).entscheidung, (d as any).notizen, (d as any).zitat, (d as any).hinweis, (d as any).wartet_auf,
    ((d as any).punkte_offen || []).length ? 'punkte' : null, ((d as any).verlauf || []).length ? 'verlauf' : null];
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
const HO_GRENZE = 2000;
/* Befund 7.2: die Obergrenzen bleiben, aber der Korb sagt, welche Quelle an ihre Grenze gestoßen ist.
   Erkannt wird das über die genaue Zeilenzahl der Quelle, nicht über die Länge der Antwort: ein niedrigeres
   Limit der Plattform bliebe sonst unbemerkt. Die Liste gehört zum Ergebnis, nicht in eine globale Variable,
   sonst überschreiben sich zwei gleichzeitige Bauten gegenseitig. */
async function handoverItems(absence: any){
  const hoAbgeschnitten: string[] = [];
  const person = whoNorm(absence.person), gate = absGate(absence.person);
  const von = absence.von as string, ende = absEnde(absence), heute = heuteBerlin();
  const items: any[] = [];

  const zaehle = async (name: string, q: any, geholt: number) => {
    const { count, error } = await q;
    if (error) throw new Error(name + ' konnten nicht gezählt werden: ' + error.message);
    if ((count ?? 0) > geholt) hoAbgeschnitten.push(`${name} (${geholt} von ${count})`);
  };
  const { data: themen, error: e1 } = await admin.from('gfweekly_topics')
    .select('id,title,short_description,context,decision,notes,next_action,owner,involved,priority,relevance,board_lane,gate,gate_frist,archived')
    .eq('archived', false).limit(HO_GRENZE);
  if (e1) throw new Error('Themen konnten nicht gelesen werden: '+e1.message);
  await zaehle('Themen', admin.from('gfweekly_topics').select('id', { count:'exact', head:true }).eq('archived', false), (themen || []).length);
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
    .eq('kind','kandidat').eq('status','neu').eq('gate', gate).limit(HO_GRENZE);
  if (e2) throw new Error('Kandidaten konnten nicht gelesen werden: '+e2.message);
  await zaehle('Kandidaten', admin.from('gfweekly_news').select('id', { count:'exact', head:true })
    .eq('kind','kandidat').eq('status','neu').eq('gate', gate), (kandidaten || []).length);
  for (const x of (kandidaten || [])) {
    items.push({ kind:'kandidat', ref_id:x.id, title:x.title, strand:x.strand, frist:x.gate_frist || null,
      body:x.body, quote:x.quote, relevance:x.relevance, who:x.who, source:x.source, source_title:x.source_title,
      source_url:x.source_url, gate:x.gate });
  }

  const { data: meilen, error: e3 } = await admin.from('gfweekly_milestones')
    .select('id,title,description,date_from,date_to,zeitraum,strand,owner,status,archived')
    .eq('archived', false).not('status','in','("erreicht","abgesagt")').limit(HO_GRENZE);
  if (e3) throw new Error('Meilensteine konnten nicht gelesen werden: '+e3.message);
  await zaehle('Meilensteine', admin.from('gfweekly_milestones').select('id', { count:'exact', head:true })
    .eq('archived', false).not('status','in','("erreicht","abgesagt")'), (meilen || []).length);
  for (const x of (meilen || [])) {
    const frist = x.date_from || null;
    if (!frist || frist < von || frist > ende) continue;
    items.push({ kind:'meilenstein', ref_id:x.id, title:x.title, strand:x.strand, frist,
      context:x.description, zeitraum:x.zeitraum, owner:x.owner, who:x.owner, status:x.status, priority:null, gate:null });
  }

  const { data: phasen, error: e6 } = await admin.from('gfweekly_cycle_phases').select('key,label,months,lead');
  if (e6) throw new Error('Phasen konnten nicht gelesen werden: '+e6.message);
  const monate = new Set<number>();
  for (let d = von; d <= ende; d = addDays(d, 1)) monate.add(parseInt(d.slice(5,7)));
  const fuehrt = (lead: unknown) => (lead ?? '').toString().split(/[,;/]| und /i).map(x => x.trim()).filter(Boolean)
    .some(n => whoNorm(n) === person && (person === 'Alex' || person === 'Lea'));
  const meinePhasen = (phasen || []).filter((p: any) => fuehrt(p.lead) && (p.months || []).some((m: number) => monate.has(m)));
  if (meinePhasen.length) {
    const { data: rituale, error: e7 } = await admin.from('gfweekly_rituals').select('id,phase_key,title,hint,active')
      .in('phase_key', meinePhasen.map((p: any) => p.key)).eq('active', true).limit(HO_GRENZE);
    if (e7) throw new Error('Rituale konnten nicht gelesen werden: '+e7.message);
    await zaehle('Rituale', admin.from('gfweekly_rituals').select('id', { count:'exact', head:true })
      .in('phase_key', meinePhasen.map((p: any) => p.key)).eq('active', true), (rituale || []).length);
    for (const x of (rituale || [])) {
      items.push({ kind:'ritual', ref_id:x.id, title:x.title, strand:null, frist:null, context:x.hint,
        phase:(meinePhasen.find((p: any)=>p.key===x.phase_key)||{}).label, owner:absence.person, who:absence.person, gate:null });
    }
  }

  const { data: partner, error: e4 } = await admin.from('hh_partner_stand')
    .select('partner_id,name,lane,stage,owner,next_action,target_on,waiting_for,signal,overdue').limit(HO_GRENZE);
  if (e4) throw new Error('Partnerstand konnte nicht gelesen werden: '+e4.message);
  await zaehle('Partner', admin.from('hh_partner_stand').select('partner_id', { count:'exact', head:true }), (partner || []).length);
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
    .eq('source','kalender').gte('happened_at', addDays(von,-1)+'T00:00:00Z').lte('happened_at', addDays(ende,1)+'T23:59:59Z').limit(HO_GRENZE);
  if (e5) throw new Error('Termine konnten nicht gelesen werden: '+e5.message);
  await zaehle('Termine', admin.from('gfweekly_news').select('id', { count:'exact', head:true })
    .eq('source','kalender').gte('happened_at', addDays(von,-1)+'T00:00:00Z').lte('happened_at', addDays(ende,1)+'T23:59:59Z'),
    (termine || []).length);
  for (const x of (termine || [])) {
    const tag = new Date(x.happened_at).toLocaleDateString('sv-SE', { timeZone:'Europe/Berlin' });
    if (tag < von || tag > ende) continue;
    if (whoNorm(x.who) !== person && !(x.who || '').toLowerCase().includes(person.toLowerCase())) continue;
    const kennung = (x.source_ref || '').startsWith('cal:') ? x.source_ref : 'cal:' + x.id;
    items.push({ kind:'termin', ref_id:kennung, title:x.title, strand:x.strand, frist:tag,
      body:x.body, who:vornamen(x.who), source_url:x.source_url, gate:null });
  }
  /* v38 (V31): Vorhaben mit Ball bei der abwesenden Person oder bei der GF mit Frist im Fenster. */
  items.push(...await vhHandoverItems(absence, von, ende));
  /* Ein Vorgang, eine Zeile: derselbe Termin kann als mehrere Neuigkeiten vorliegen. */
  const gesehen = new Set<string>();
  const eindeutig = items.filter(x => { const k = x.kind+'|'+x.ref_id; if (gesehen.has(k)) return false; gesehen.add(k); return true; });
  return { items: eindeutig, abgeschnitten: hoAbgeschnitten };
}

/* Baut den Korb neu: bewertet jede Zeile, legt neue an, ergänzt bestehende. Bestätigte Zeilen bleiben unangetastet,
   nur frist, dossier und luecke wandern nach. */
async function handoverBuild(absence: any){
  const [dep, vor] = await Promise.all([
    admin.from('gfweekly_deputies').select('*').eq('active', true),
    admin.from('gfweekly_handover').select('*').eq('absence_id', absence.id),
  ]);
  if (dep.error) throw new Error('Vertretungslinie konnte nicht gelesen werden: '+dep.error.message);
  if (vor.error) throw new Error('Der bisherige Korb konnte nicht gelesen werden: '+vor.error.message);
  const deputies = dep.data, alt = vor.data;
  const vorhanden = new Map<string, any>((alt || []).map((r: any) => [r.kind+'|'+r.ref_id, r]));
  const { items, abgeschnitten } = await handoverItems(absence);
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
  /* Der Zustand steht an der Abwesenheit, damit die Übergabeseite den Hinweis auch dann zeigt,
     wenn sie nur liest und nicht selbst baut. Schreibfehler beim Korb zählen mit: dann ist der Korb
     genauso unvollständig, als wäre eine Quelle abgeschnitten worden. */
  const unvollstaendig = abgeschnitten.length > 0 || fehler > 0;
  const grund = [...abgeschnitten, ...(fehler ? [`${fehler} Zeilen ließen sich nicht schreiben`] : [])];
  const { error: kf } = await admin.from('gfweekly_absences').update({
    korb_truncated: unvollstaendig,
    korb_abgeschnitten: grund.length ? grund.join(', ') : null,
  }).eq('id', absence.id);
  return { neu, ergaenzt, fehler, gesamt: items.length,
           truncated: unvollstaendig, abgeschnitten: grund,
           hinweis_gespeichert: !kf };
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
  const { error } = await admin.from('gfweekly_handover_log')
    .insert({ absence_id, handover_id: handover_id || null, art, who: who || null, text: (text||'').slice(0,2000) });
  return !error;
}

/* ===== v29 · V24c (21.09.2026) · Asana: die bestätigte Übergabe als Projekt, der Rücksync als Protokoll.
   Das Token steht im Secret ASANA_TOKEN (Personal Access Token), der Arbeitsbereich in ASANA_WORKSPACE
   (Standard 57435200923138), das Team in ASANA_TEAM. Ohne Token passiert nichts, und die Antwort sagt warum:
   halbe Projekte sind schlimmer als gar keine. Fallback ohne Token ist Abschnitt H des täglichen Auftrags. ===== */
const ASANA_TOKEN = Deno.env.get('ASANA_TOKEN') ?? '';
const ASANA_WORKSPACE = Deno.env.get('ASANA_WORKSPACE') ?? '57435200923138';
const ASANA_TEAM = Deno.env.get('ASANA_TEAM') ?? '';
const ASANA_ABSCHNITTE = ['Sofort', 'Grün', 'Gelb', 'Rot bei der GF', 'Ruht bis Rückkehr'];
/* Die Vertretungslinie kennt nur diese beiden. Ihre E-Mail ist der eindeutige Schlüssel zum Asana-Konto. */
const MAIL_ALEX = 'alex@wildemoehre.org';
const MAIL_LEA  = 'lea@wildemoehre.org';
const HH_BASIS = 'https://hohes-haus.netlify.app';

async function asana(pfad: string, methode = 'GET', koerper?: unknown, signal?: AbortSignal){
  const res = await fetch('https://app.asana.com/api/1.0' + pfad, {
    method: methode, signal,
    headers: { 'Authorization': 'Bearer ' + ASANA_TOKEN, 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: koerper === undefined ? undefined : JSON.stringify({ data: koerper }),
  });
  const text = await res.text();
  let d: any = {}; try { d = JSON.parse(text); } catch (_e) { d = { raw: text }; }
  if (!res.ok) throw new Error(`Asana ${methode} ${pfad}: ${res.status} ${(d?.errors?.[0]?.message) || text.slice(0,200)}`);
  return d.data;
}
/* Eine Seite der Asana-Antwort mit next_page, damit Listen vollständig gelesen werden können. */
async function asanaSeite(pfad: string, signal?: AbortSignal){
  const res = await fetch('https://app.asana.com/api/1.0' + pfad, {
    signal, headers: { 'Authorization': 'Bearer ' + ASANA_TOKEN, 'Accept': 'application/json' },
  });
  const text = await res.text();
  let d: any = {}; try { d = JSON.parse(text); } catch (_e) { d = {}; }
  if (!res.ok) throw new Error(`Asana GET ${pfad}: ${res.status} ${(d?.errors?.[0]?.message) || text.slice(0,200)}`);
  return d;
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
  if (row.kind === 'vorhaben') return `${HH_BASIS}/vorhaben.html?v=${encodeURIComponent(row.dossier?.slug || row.ref_id)}`;
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
  const { data: schon, error: se } = await admin.from('gfweekly_handover_log').select('text').eq('absence_id', absence.id).eq('art','asana');
  if (se) return { erledigt:0, kommentare:0, fehler:1 };   // ohne die bekannten Kennungen würde doppelt protokolliert
  const bekannt = new Set((schon || []).map((l: any) => (String(l.text).match(/\[asana:(\d+)\]/) || [])[1]).filter(Boolean));
  /* Ob eine Zeile ihren Erledigungsvermerk schon hat, wird je Zeile gefragt. Eine vorab geladene Liste
     könnte an der Obergrenze abgeschnitten sein, und dann schriebe jeder Lauf denselben Vermerk erneut. */
  const hatVermerk = async (handover_id: string) => {
    const { data, error } = await admin.from('gfweekly_handover_log').select('id')
      .eq('absence_id', absence.id).eq('handover_id', handover_id).eq('art','erledigt').limit(1);
    return error ? null : (data || []).length > 0;
  };
  let erledigt = 0, kommentare = 0, fehler = 0;
  for (const row of (rows || [])) {
    let aufgabe: any = null;
    try { aufgabe = await asana(`/tasks/${row.asana_gid}?opt_fields=completed,completed_at,name`); } catch (_e) { fehler++; continue; }
    if (aufgabe?.completed) {
      /* Erst der Vermerk, dann der Status: umgekehrt hätte ein misslungenes Protokoll die Zeile für immer
         übersprungen, weil der nächste Lauf sie schon als erledigt sieht. */
      const da = await hatVermerk(String(row.id));
      if (da === null) fehler++;
      else {
        const gut = da || await handoverLog(absence.id, 'erledigt', `${row.title}: in Asana erledigt.`, 'asana', row.id);
        if (!gut) fehler++;
        else if (row.status !== 'erledigt') {
          const { error } = await admin.from('gfweekly_handover').update({ status:'erledigt', updated_at:new Date().toISOString() }).eq('id', row.id);
          if (error) fehler++; else erledigt++;
        }
      }
    }
    /* Die Kommentare kommen seitenweise. Ungeblättert schneidet Asana lange Listen ab, und weil der
       Zeitstempel danach vorrückt, fielen die fehlenden Kommentare für immer aus dem Fenster. */
    let stories: any[] = []; let seitenRest = false;
    try {
      let pfad = `/tasks/${row.asana_gid}/stories?opt_fields=gid,text,created_at,type,created_by.name&limit=100`;
      /* Zweihundert Seiten sind zwanzigtausend Einträge an einer einzigen Aufgabe. Wird das je erreicht,
         steht der Zeitstempel dieser Abwesenheit still, und jeder Lauf begänne wieder bei Seite eins.
         Deshalb bleibt es nicht bei einem stummen Zähler: der Fall steht im Protokoll und braucht eine Hand. */
      for (let seite = 0; seite < 200 && pfad; seite++) {
        const antwort = await asanaSeite(pfad);
        stories = stories.concat(antwort.data || []);
        pfad = antwort.next_page?.path || '';
      }
      seitenRest = !!pfad;
    } catch (_e) { fehler++; continue; }
    if (seitenRest) {
      fehler++;   // unvollständig gelesen: das Zeitfenster bleibt stehen, sonst gingen Kommentare verloren
      await handoverLog(absence.id, 'asana',
        `${row.title}: die Kommentare dieser Aufgabe sind nach zweihundert Seiten nicht zu Ende. `
        + 'Der Rücksync dieser Abwesenheit kommt nicht weiter, bis die Aufgabe geteilt oder archiviert ist.',
        'asana', row.id);
    }
    for (const s of stories) {
      if (s.type !== 'comment' || !s.created_at) continue;
      if (s.created_at <= seit || s.created_at > laufBeginn) continue;   // genau das Fenster dieses Laufs
      if (s.gid && bekannt.has(String(s.gid))) continue;                 // schon übernommen
      const notiert = await handoverLog(absence.id, 'asana',
        `[asana:${s.gid || '0'}] ${row.title}: ${(s.created_by?.name || 'Asana')} schreibt „${(s.text||'').slice(0,400)}“.`, 'asana', row.id);
      if (!notiert) { fehler++; continue; }   // nicht gezählt und nicht vergessen: das Fenster bleibt stehen
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

/* ===== v33 · V27 Phase B (30.09.2026) · Launch verteilen: Meilensteine, Besetzung, Pool, Bestätigung, Asana.
   Liest vvp_launch_plans, vvp_events, vvp_launch_milestones, gfweekly_launch_*, gfweekly_people.
   Schreibt nur die in Phase A dafür angelegten Spalten: an den Meilensteinen person_id, hilfe_person_id,
   zuordnung_status, responsible, status, completed_on, due_on, due_on_vorher, asana_task_gid; an den Personen
   launch_std_woche und verfuegbar_ab; an vvp_events sales_start_on; die Besetzung ganz. Protokoll in
   gfweekly_saison_log (what = launch_*), der VVK-Wechsel zusätzlich in vvp_launch_plan_changes, damit die
   Cockpit-Historie ihn kennt. Die Rechenlogik der Seite liegt in site/assets/launch-logik.js; hier steht nur,
   was die Datenbank braucht. ===== */
const LAUNCH_STATUS = ['not_started','in_progress','blocked','under_review','complete','not_required'];
const LAUNCH_STATUS_WORT: Record<string,string> = { offen:'not_started', 'läuft':'in_progress', laeuft:'in_progress', erledigt:'complete' };
const LAUNCH_ZUORDNUNG = ['offen','vorschlag','bestaetigt','gesendet'];
/* Externe im Sinn des Versands: Typ extern, agentur oder partner UND ohne Asana-Konto. Sie bekommen keine
   Asana-Aufgabe, sondern beim übergebenden Zuständigen entsteht „Angebot einholen und beauftragen: <Titel>“.
   Externe mit Konto (Christian, Annie, Slawik, Robin, Kevin) bekommen ihre Aufgaben direkt, wie das Team
   (Entscheidung Alex 30.09.: keine Einschränkungen ohne Auftrag). Wer intern ist und kein Konto hat, bekommt
   ebenfalls keine Aufgabe; das steht als Notiz in der Antwort und auf der Seite. */
const LAUNCH_EXTERN_TYPEN = ['extern','agentur','partner'];
/* Widersprüche, die in den Daten stehen (Technikstand V27 Phase A). Hinweiszeile am Festival, keine Blockade. */
const LAUNCH_HINWEISE: Record<string,string[]> = {
  FAMRD27: ['Für die Draußenbande kursieren drei VVK-Termine: 01.10. (Plattform), 11.10. (Saisonabstimmung) und 01.12. Welcher gilt, ist nicht entschieden; die Termine unten rechnen mit dem Wert der Plattform.'],
  BYNRD27: ['Ob by nature 2027 stattfindet, ist als Vorhaben offen (Klärungsaufgabe 10). Die Zuordnung kann trotzdem vorbereitet werden.'],
};
const LAUNCH_PERSON_SPALTEN = 'id,name,typ,felder,generator,launch_std_woche,verfuegbar_ab,briefing_std,stundensatz,asana_gid,active,assignable,sort_order,email,created_at';
/* Nach außen ohne E-Mail, ohne Asana-Kennung und ohne Pool-Notiz (sie kann Vertragsdetails tragen); ob ein Konto besteht, genügt der Seite. */
function launchPersonAussen(p: any){
  return { id:p.id, name:p.name, typ:p.typ || 'team', felder:p.felder || [], generator:p.generator !== false,
    launch_std_woche:p.launch_std_woche, verfuegbar_ab:p.verfuegbar_ab, briefing_std:p.briefing_std ?? 0, stundensatz:p.stundensatz,
    hat_asana:!!p.asana_gid, active:p.active !== false, assignable:p.assignable !== false, sort_order:p.sort_order ?? 0, created_at:p.created_at ?? null };
}
function launchIstExtern(p: any){ return !!p && LAUNCH_EXTERN_TYPEN.includes(p.typ) && !p.asana_gid; }
function launchFestivalKurz(name: unknown){ return String(name ?? '').replace(/\s+20\d\d$/, ''); }
async function launchLog(who: string, what: string, row_id: string | null, item_id: string | null, detail: unknown){
  const { error } = await admin.from('gfweekly_saison_log').insert({ who, what, row_id, item_id, detail });
  return !error;
}
/* Die Pläne mit ihren Festivals, nach VVK-Start; heute die fünf für 2027. */
async function launchFestivals(){
  const { data: plans, error: pe } = await admin.from('vvp_launch_plans').select('id,event_id,launch_type,status,launch_date,notes');
  if (pe) throw pe;
  const ids = (plans || []).map((p: any) => p.event_id).filter(Boolean);
  const { data: events, error: ee } = ids.length ? await admin.from('vvp_events').select('id,name,short_name,sales_start_on,year,archived,starts_on,ends_on').in('id', ids) : { data: [], error: null } as any;
  if (ee) throw ee;
  const je = new Map((events || []).map((e: any) => [e.id, e]));
  const aus: any[] = [];
  for (const p of (plans || [])) {
    /* Festivals dieses oder eines späteren Jahres; Vergangenes und Archiviertes bleibt draußen. */
    const e = je.get(p.event_id); if (!e || e.archived || (e.year && e.year < new Date().getFullYear())) continue;
    aus.push({ plan_id:p.id, event_id:e.id, name:e.name, kurzname:launchFestivalKurz(e.name), short_name:e.short_name, sales_start_on:e.sales_start_on,
      starts_on:e.starts_on, ends_on:e.ends_on, launch_type:p.launch_type, plan_status:p.status, plan_notes:p.notes || null,
      hinweise: LAUNCH_HINWEISE[e.short_name] || [] });
  }
  aus.sort((a, b) => String(a.sales_start_on || '9999').localeCompare(String(b.sales_start_on || '9999')) || String(a.name).localeCompare(String(b.name)));
  return aus;
}
async function launchFestival(event_id: string){
  const alle = await launchFestivals();
  return alle.find(f => f.event_id === event_id) || null;
}
async function launchPersonen(){
  const { data, error } = await admin.from('gfweekly_people').select(LAUNCH_PERSON_SPALTEN).order('sort_order',{ascending:true}).order('name',{ascending:true});
  if (error) throw error; return data || [];
}
/* V29: Satz in jeder Aufgabe, damit in Asana klar ist, was zurückfließt. */
const LAUNCH_SICHTBAR = 'Stand und Fälligkeit werden stündlich ins Hohe Haus übernommen; erledigt in Asana heißt erledigt im Haus.';
const LAUNCH_SYNC_MINUTEN = 60;
/* V29b: Laufsperre und Zeitbudget. Die Sperre ist eine Zeile in gfweekly_launch_sync mit fester Kennung; ein Lauf nimmt sie
   per bedingtem Update (frei oder älter als die Haltezeit) und gibt sie am Ende frei. Das Budget hält einen Lauf unter dem
   Limit von pg_net (120 s) und der Edge Function (150 s); was nicht drankam, folgt im nächsten Lauf. */
const LAUNCH_SYNC_SPERRE = '00000000-0000-0000-0000-000000000001';
const LAUNCH_SYNC_HALTEN_MS = 5 * 60000;
const LAUNCH_SYNC_BUDGET_MS = 90000;
/* Projektbeschreibung: VVK-Start, Festivalverantwortung, Link auf die Saisonseite. */
function launchProjektNotiz(festival: any, fvName: string | null){
  return [`Launch ${festival.kurzname} 2027 · VVK-Start ${festival.sales_start_on || 'offen'} · Festivalverantwortung ${fvName || 'offen'}.`,
    'Launch-Aufgaben aus dem Hohen Haus, je Bereich ein Abschnitt. Aufwände sind Richtwerte und werden über Ist-Stunden kalibriert.',
    LAUNCH_SICHTBAR, '', `Saison im Hohen Haus: ${HH_BASIS}/saison.html`, `Launch verteilen: ${HH_BASIS}/launch.html?festival=${encodeURIComponent(festival.short_name || '')}`].join('\n');
}
/* ===== V29 · Rückweg aus Asana, nach dem Muster asanaSync der Vertretung =====
   Für alle Meilensteine mit asana_task_gid: completed setzt status complete und completed_on; eine geänderte
   Fälligkeit setzt due_on und sichert den alten Wert in due_on_vorher; neue Kommentare (story vom Typ comment)
   kommen als Zeile what = launch_sync in gfweekly_saison_log, mit [asana:<gid>] im Text zur Entdopplung.
   Keine Löschungen. Der Zeitstempel je Plan steht in gfweekly_launch_sync und wandert nur weiter, wenn der
   Lauf des Plans fehlerfrei war. Ohne Token oder ohne gesendete Aufgaben läuft die Funktion leer durch. ===== */
async function launchSync(festivals: any[], who: string){
  const laufBeginn = new Date().toISOString();
  const aus = { laeufe:0, geprueft:0, erledigt:0, faelligkeit:0, kommentare:0, fehler:0, plaene:[] as any[], synced_at: laufBeginn, uebersprungen: '' };
  if (!ASANA_TOKEN) { aus.uebersprungen = 'ASANA_TOKEN fehlt'; return aus; }
  const planIds = (festivals || []).map(f => f.plan_id).filter(Boolean);
  if (!planIds.length) return aus;
  /* Sperre nehmen: Zeile anlegen, falls es sie nicht gibt, dann bedingt beanspruchen. */
  const start = Date.now();
  await admin.from('gfweekly_launch_sync').upsert({ plan_id: LAUNCH_SYNC_SPERRE, synced_at: '1970-01-01T00:00:00Z', ergebnis: { sperre: true }, updated_at: '1970-01-01T00:00:00Z' }, { onConflict: 'plan_id', ignoreDuplicates: true });
  const { data: genommen, error: ge } = await admin.from('gfweekly_launch_sync').update({ updated_at: laufBeginn, ergebnis: { sperre: true, von: who, seit: laufBeginn } })
    .eq('plan_id', LAUNCH_SYNC_SPERRE).lt('updated_at', new Date(Date.now() - LAUNCH_SYNC_HALTEN_MS).toISOString()).select('plan_id');
  if (ge) { aus.fehler++; aus.uebersprungen = 'Sperre nicht lesbar: ' + ge.message; return aus; }
  if (!(genommen || []).length) { aus.uebersprungen = 'Ein anderer Lauf ist gerade dabei'; return aus; }
  try {
  const [{ data: ms, error: me }, { data: st, error: se }, { data: schon, error: le }] = await Promise.all([
    admin.from('vvp_launch_milestones').select('id,plan_id,title,status,due_on,due_on_vorher,asana_task_gid,completed_on').in('plan_id', planIds).not('asana_task_gid','is',null),
    admin.from('gfweekly_launch_sync').select('plan_id,synced_at,ergebnis').in('plan_id', planIds),
    admin.from('gfweekly_saison_log').select('detail').eq('what','launch_sync').not('detail->>asana_gid','is',null).order('at',{ascending:false}).limit(2000),
  ]);
  if (me || se || le) { aus.fehler++; aus.uebersprungen = 'Daten nicht lesbar: ' + String((me || se || le)!.message); return aus; }
  const bekannt = new Set((schon || []).map((l: any) => String(l.detail?.asana_gid || '')).filter(Boolean));
  const seitJe = new Map((st || []).map((x: any) => [x.plan_id, x.synced_at]));
  /* Fortschrittsmarke je Plan: nach einem Abbruch geht es hinter der letzten fertigen Aufgabe weiter (Review V29b, Runde 2, Befund 2). */
  const markeJe = new Map((st || []).map((x: any) => [x.plan_id, x.ergebnis && x.ergebnis.marke ? x.ergebnis : null]));
  const frist = () => Math.max(0, LAUNCH_SYNC_BUDGET_MS - (Date.now() - start));
  const signal = () => AbortSignal.timeout(Math.max(1000, frist()));
  const istAbbruch = (e: unknown) => ['TimeoutError', 'AbortError'].includes(String((e as Error)?.name || ''));
  const jetzt = new Date().toISOString();
  /* Älteste zuerst, damit bei knappem Budget jeder Plan an die Reihe kommt. */
  const reihe = [...festivals].sort((a, b) => String(seitJe.get(a.plan_id) || '').localeCompare(String(seitJe.get(b.plan_id) || '')));
  let rest = 0;
  for (const f of reihe) {
    if (Date.now() - start > LAUNCH_SYNC_BUDGET_MS) { rest++; continue; }
    const markeAlt: any = markeJe.get(f.plan_id);
    const alle = (ms || []).filter((m: any) => m.plan_id === f.plan_id).sort((a: any, b: any) => String(a.id).localeCompare(String(b.id)));
    const meine = markeAlt ? alle.filter((m: any) => String(m.id) > String(markeAlt.marke)) : alle;
    /* Zyklusbeginn: der Lauf, in dem dieser Durchgang des Plans begann; er wird am Ende der neue Zeitstempel,
       damit Kommentare an früher geprüften Aufgaben nicht aus dem Fenster fallen. */
    const zyklus = markeAlt?.zyklus || laufBeginn;
    let letzteFertig: string | null = null;
    /* Erster Lauf eines Plans: alle Kommentare, die Entdopplung läuft über die Kennung der Story (Review V29, Runde 2, Befund 5). */
    const seit = seitJe.get(f.plan_id) || '1970-01-01T00:00:00Z';
    let fehler = 0, erledigt = 0, faelligkeit = 0, kommentare = 0;
    let abgebrochen = false;
    for (const m of meine) {
      if (Date.now() - start > LAUNCH_SYNC_BUDGET_MS) { abgebrochen = true; break; }
      aus.geprueft++;
      let aufgabe: any = null;
      try { aufgabe = await asana(`/tasks/${m.asana_task_gid}?opt_fields=completed,completed_at,due_on,name`, 'GET', undefined, signal()); }
      catch (e) { if (istAbbruch(e)) { abgebrochen = true; break; } fehler++; continue; }
      const patch: Record<string, unknown> = {};
      if (aufgabe?.completed && m.status !== 'complete' && m.status !== 'not_required') {
        patch.status = 'complete'; patch.completed_on = String(aufgabe.completed_at || jetzt).slice(0, 10);
      }
      /* Fälligkeit: ein anderes Datum oder eine entfernte Fälligkeit (null) in Asana gilt; der alte Wert geht nach due_on_vorher. */
      if (aufgabe && aufgabe.due_on !== undefined) {
        const neuDue = aufgabe.due_on === null ? null : (/^\d{4}-\d{2}-\d{2}$/.test(String(aufgabe.due_on)) ? String(aufgabe.due_on) : undefined);
        if (neuDue !== undefined && neuDue !== (m.due_on || null)) { patch.due_on_vorher = m.due_on; patch.due_on = neuDue; }
      }
      if (Object.keys(patch).length) {
        patch.updated_at = jetzt;
        /* Erst das Protokoll, dann die Änderung: scheitert das Protokoll, bleibt die Änderung aus und der nächste Lauf
           erkennt sie wieder (Muster asanaSync; Review V29, Befund 5). */
        const ok = await launchLog(who, 'launch_sync', f.short_name, m.id, { titel: m.title, asana_task_gid: m.asana_task_gid, patch });
        if (!ok) { fehler++; continue; }
        const { error } = await admin.from('vvp_launch_milestones').update(patch).eq('id', m.id);
        if (error) { fehler++; continue; }
        if (patch.status) erledigt++;
        if ('due_on' in patch) faelligkeit++;
      }
      /* Kommentare seitenweise, genau das Fenster dieses Laufs, Entdopplung über die Asana-Kennung der Story. */
      let stories: any[] = []; let seitenRest = false;
      try {
        let pfad = `/tasks/${m.asana_task_gid}/stories?opt_fields=gid,text,created_at,type,created_by.name&limit=100`;
        for (let seite = 0; seite < 50 && pfad; seite++) { const antwort = await asanaSeite(pfad, signal()); stories = stories.concat(antwort.data || []); pfad = antwort.next_page?.path || ''; }
        seitenRest = !!pfad;
      } catch (e) { if (istAbbruch(e)) { abgebrochen = true; break; } fehler++; continue; }
      if (seitenRest) fehler++;
      /* Neue Kommentare dieser Aufgabe in einem einzigen Insert (Review V29b, Runde 3): die Datenbankarbeit wächst nicht mit
         der Zahl der Kommentare. Nur bei einem Konflikt mit dem eindeutigen Index (23505) einzeln, dann gilt ein Doppel als übernommen. */
      const neue = stories.filter((x: any) => x.type === 'comment' && x.created_at && x.created_at > seit && x.created_at <= laufBeginn && !(x.gid && bekannt.has(String(x.gid))))
        .map((x: any) => ({ who, what: 'launch_sync', row_id: f.short_name, item_id: m.id, detail: { titel: m.title, asana_gid: String(x.gid || '0'), asana_task_gid: m.asana_task_gid,
          text: `[asana:${x.gid || '0'}] ${m.title}: ${(x.created_by?.name || 'Asana')} schreibt „${(x.text || '').slice(0, 400)}“.` } }));
      if (neue.length) {
        const { error: ke } = await admin.from('gfweekly_saison_log').insert(neue);
        if (!ke) { for (const z of neue) bekannt.add(z.detail.asana_gid); kommentare += neue.length; }
        else if ((ke as any).code === '23505') {
          let einzelnFehler = false;
          for (const z of neue) {
            if (frist() <= 0) { abgebrochen = true; break; }
            const { error: e1 } = await admin.from('gfweekly_saison_log').insert(z);
            if (e1 && (e1 as any).code !== '23505') { fehler++; einzelnFehler = true; continue; }
            bekannt.add(z.detail.asana_gid); if (!e1) kommentare++;
          }
          if (abgebrochen) break;
          if (einzelnFehler) continue;
        } else { fehler++; continue; }
      }
      letzteFertig = String(m.id);
    }
    if (abgebrochen) {
      rest++;
      /* Fortschritt sichern, Zeitstempel bleibt; bei Fehlern keine neue Marke, damit die Aufgabe wieder drankommt. */
      if (!fehler && (letzteFertig || markeAlt)) {
        const { error } = await admin.from('gfweekly_launch_sync').upsert({ plan_id: f.plan_id, synced_at: seitJe.get(f.plan_id) || '1970-01-01T00:00:00Z',
          ergebnis: { marke: letzteFertig || markeAlt.marke, zyklus, at: laufBeginn }, updated_at: jetzt }, { onConflict: 'plan_id' });
        if (error) fehler++;
      }
    }
    const ergebnis = { geprueft: meine.length, erledigt, faelligkeit, kommentare, fehler, abgebrochen, at: zyklus };
    /* Zeitstempel nur bei sauberem, vollständigem Lauf; ohne gesendete Aufgaben ist der Lauf trivial sauber. */
    if (!fehler && !abgebrochen) { const { error } = await admin.from('gfweekly_launch_sync').upsert({ plan_id: f.plan_id, synced_at: zyklus, ergebnis, updated_at: jetzt }, { onConflict: 'plan_id' }); if (error) fehler++; }
    aus.laeufe++; aus.erledigt += erledigt; aus.faelligkeit += faelligkeit; aus.kommentare += kommentare; aus.fehler += fehler;
    aus.plaene.push(Object.assign({ plan_id: f.plan_id, short_name: f.short_name }, ergebnis, { fehler }));
  }
  (aus as any).rest = rest; (aus as any).dauer_ms = Date.now() - start;
  return aus;
  } finally {
    /* Sperre freigeben, auch nach einem Fehler. */
    await admin.from('gfweekly_launch_sync').update({ updated_at: '1970-01-01T00:00:00Z', ergebnis: { sperre: true, zuletzt: laufBeginn, von: who } }).eq('plan_id', LAUNCH_SYNC_SPERRE);
  }
}
/* Der Text einer Asana-Aufgabe: Aufwand als Spanne, Dauer, Vorgänger, Generator-Anteil, Link ins Haus. */
function launchAsanaNotiz(m: any, r: any, festival: any, zust: any, helfer: any, zusatz = ''){
  const lo = Number(m.aufwand_lo ?? r?.aufwand_lo ?? 0), hi = Number(m.aufwand_hi ?? r?.aufwand_hi ?? lo);
  const g = Number(m.generator_anteil ?? r?.generator_anteil ?? 0);
  const f = (x: number) => x.toLocaleString('de-DE', { maximumFractionDigits: 1 });
  const zeilen = [
    `Launch ${festival.kurzname} 2027 · Bereich ${m.bereich || 'ohne'} · VVK-Start ${festival.sales_start_on || 'offen'}.`,
    '',
    `Aufwand: ${lo === hi ? f(lo) : f(lo) + ' bis ' + f(hi)} Stunden (Richtwert, wird über Ist-Stunden kalibriert).`,
    `Dauer: ${m.dauer_tage ?? r?.dauer_tage ?? '?'} Tage.`,
    `Vorgänger: ${(r?.vorgaenger || []).length ? (r.vorgaenger as string[]).join(', ') : 'keine'}.`,
    g > 0 ? `Generator-Anteil: ${Math.round(g * 100)} Prozent${helfer ? `, übernimmt ${helfer.name}` : ', noch ohne Hilfe'}.` : 'Generator-Anteil: keiner.',
    zust ? `Zuständig: ${zust.name}.` : 'Zuständig: noch offen.',
    r?.hinweis ? `Hinweis: ${r.hinweis}` : '',
    '',
    `Im Hohen Haus: ${HH_BASIS}/launch.html?festival=${encodeURIComponent(festival.short_name || '')}`,
    LAUNCH_SICHTBAR,
    zusatz ? '\n' + zusatz : '',
  ];
  return zeilen.filter(z => z !== null && z !== undefined).join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/* ===== v38 · V31 (03.10.2026) · Vorhaben: Woche, Board, Liste, Akte, Einwurf, Übergabe.
   Tabellen hh_vorhaben, hh_vorhaben_punkte, hh_vorhaben_verlauf, hh_einwurf, Sicht hh_vorhaben_lage
   (Migrationen 20261003162639 bis 20261003165328). Speichern mit Ballwechsel und Verlauf läuft über die
   Datenbankfunktion hh_vorhaben_save, damit Zeile und Verlauf nur zusammen entstehen. Die KI im Einwurf schlägt vor,
   angewendet wird erst mit einwurf_apply und nur, was die Person anhakt. Auftrag: docs/PAKET-V31-VORHABEN.md. ===== */
const VH_BALL = ['alex','lea','gf','team','extern','offen'];
const VH_GRUPPE = ['launch','geld','team','partner','system','sonstiges'];
const VH_STATUS = ['aktiv','pausiert','erledigt','archiviert'];
const VH_OWNER = ['alex','lea','gf'];
const VH_ART = ['whatsapp','telefon','mail','plattform','notiz','einwurf','uebergabe','system','entscheidung','kalender','termin'];
const VH_FELDER = ['title','gruppe','strand','ball','ball_name','owner','stand','naechster_schritt','frist','frist_text','konflikt','status','sort'];
const VH_LAENGE: Record<string, number> = { title:200, strand:60, ball_name:120, stand:2000, naechster_schritt:1000, frist_text:200, konflikt:500 };
const EW_KANAL = ['knopf','sprache','cowork','whatsapp','mail'];
const EW_TIMEOUT_MS = 20000;
const VH_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* Fehler mit HTTP-Status, damit die Aktionen klar zwischen falscher Eingabe (400/404/409) und Störung (500) trennen. */
class VhFehler extends Error { status: number; constructor(m: string, s = 400){ super(m); this.status = s; } }
/* Gültiges Datum JJJJ-MM-TT, leer heißt null, alles andere undefined (ungültig). */
function vhDatum(x: unknown): string | null | undefined {
  if (x === null || x === undefined || x === '') return null;
  const s = String(x).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;
  const d = new Date(s + 'T00:00:00Z');
  return isNaN(d.getTime()) || d.toISOString().slice(0,10) !== s ? undefined : s;
}
/* Schreibende Aktionen brauchen by, normiert auf Alex oder Lea. */
function vhBy(t: any): string {
  const roh = (t?.by ?? '').toString().trim();
  if (!roh) throw new VhFehler('by fehlt (Alex oder Lea)');
  const w = whoNorm(roh);
  if (w !== 'Alex' && w !== 'Lea') throw new VhFehler('by muss Alex oder Lea sein');
  return w;
}
function vhText(x: unknown, max: number){ return (x ?? '').toString().trim().slice(0, max); }
function vhBallWort(ball: string, name?: string | null){
  return ({ alex:'Alex', lea:'Lea', gf:'GF gemeinsam', offen:'niemand' } as Record<string,string>)[ball]
    || ((name || '').trim() || (ball === 'team' ? 'Team' : 'extern'));
}
/* Prüft die Felder für vorhaben_save. Unbekannte Felder werden ignoriert, ungültige Werte abgelehnt. */
function vhPatch(t: any){
  const patch: Record<string, unknown> = {};
  for (const f of VH_FELDER) {
    if (t[f] === undefined) continue;
    const v = t[f];
    if (f === 'title') { const s = vhText(v, VH_LAENGE.title); if (!s) throw new VhFehler('title darf nicht leer sein'); patch.title = s; continue; }
    if (f === 'gruppe') { if (!VH_GRUPPE.includes(v)) throw new VhFehler('gruppe: ' + VH_GRUPPE.join('|')); patch.gruppe = v; continue; }
    if (f === 'ball') { if (!VH_BALL.includes(v)) throw new VhFehler('ball: ' + VH_BALL.join('|')); patch.ball = v; continue; }
    if (f === 'owner') { if (v !== null && v !== '' && !VH_OWNER.includes(v)) throw new VhFehler('owner: ' + VH_OWNER.join('|') + ' oder leer'); patch.owner = v || null; continue; }
    if (f === 'status') { if (!VH_STATUS.includes(v)) throw new VhFehler('status: ' + VH_STATUS.join('|')); patch.status = v; continue; }
    if (f === 'frist') { const d = vhDatum(v); if (d === undefined) throw new VhFehler('frist ist kein Datum (JJJJ-MM-TT)'); patch.frist = d; continue; }
    if (f === 'sort') { const n = parseInt(v); if (isNaN(n)) throw new VhFehler('sort ist keine Zahl'); patch.sort = n; continue; }
    patch[f] = vhText(v, VH_LAENGE[f] || 500) || null;
  }
  /* Bei Alex, Lea, GF und niemand gibt es keinen Namen; ein alter Name von Team oder extern fällt weg. */
  if (patch.ball !== undefined && ['alex','lea','gf','offen'].includes(patch.ball as string)) patch.ball_name = null;
  return patch;
}
async function vhLese(ref: string){
  const q = admin.from('hh_vorhaben_lage').select('*');
  const { data, error } = await (VH_UUID.test(ref) ? q.eq('id', ref) : q.eq('slug', ref)).maybeSingle();
  if (error) throw error;
  if (!data) throw new VhFehler('Vorhaben ' + ref + ' gibt es nicht', 404);
  return data;
}
/* Datenbankfunktionen der Vorhaben melden Eingabefehler mit PT400, PT404, PT409 (PostgREST antwortet mit diesem
   HTTP-Status); daraus wird hier ein VhFehler mit demselben Status. */
async function vhRpc(name: string, args: Record<string, unknown>){
  const { data, error } = await admin.rpc(name, args);
  if (error) {
    const m = /^PT(\d{3})$/.exec(error.code || '');
    if (m) throw new VhFehler(error.message, parseInt(m[1]));
    if (error.code === 'P0002') throw new VhFehler(error.message, 404);
    throw error;
  }
  return data as any;
}
async function vhSave(id: string, patch: Record<string, unknown>, by: string, notiz?: string | null, anlass?: string | null){
  return await vhRpc('hh_vorhaben_save', { p_id: id, p_patch: patch, p_by: by, p_notiz: notiz || null, p_anlass: anlass || null }) as { vorhaben: any, ball_geaendert: boolean, verlauf: number };
}
async function vhVerlaufAdd(row: Record<string, unknown>){
  const { data, error } = await admin.from('hh_vorhaben_verlauf').insert(row).select().single();
  if (error) throw error; return data;
}
async function vhSlug(title: string){
  const basis = slugKey(title);
  const { data, error } = await admin.from('hh_vorhaben').select('slug').like('slug', basis + '%');
  if (error) throw error;
  const da = new Set((data || []).map((r: any) => r.slug));
  if (!da.has(basis)) return basis;
  for (let i = 2; i < 1000; i++) if (!da.has(basis + '-' + i)) return basis + '-' + i;
  return basis + '-' + crypto.randomUUID().slice(0, 8);
}
/* Abhaken und Wieder-Öffnen. Nur wer den Zustand wirklich ändert, schreibt Verlauf: ein doppelter Klick oder
   Alex und Lea gleichzeitig ergeben einen Eintrag, nicht zwei. */
async function vhPunktToggle(id: string, erledigt: boolean, by: string, quelle?: string | null){
  /* Punkt und Verlauf in einer Transaktion (hh_punkt_toggle, Review 31a Befund 4). */
  if (!VH_UUID.test(id)) throw new VhFehler('Punkt ' + id + ' gibt es nicht', 404);
  return await vhRpc('hh_punkt_toggle', { p_id: id, p_erledigt: erledigt, p_by: by, p_quelle: quelle || null });
}

/* ----- Einwurf: KI-Vorschlag, streng geprüft ----- */
function vhHeuteText(){
  const d = new Date();
  return d.toLocaleDateString('de-DE', { timeZone:'Europe/Berlin', weekday:'long', day:'2-digit', month:'2-digit', year:'numeric' })
    + ' (' + heuteBerlin() + ')';
}
/* Aktive Vorhaben mit ihren offenen Punkten: Grundlage für die KI und für die Prüfung ihrer Antwort. */
async function vhKontext(nurId?: string | null){
  let q = admin.from('hh_vorhaben').select('id,slug,title,ball,ball_name,stand,naechster_schritt,frist').in('status', ['aktiv','pausiert']).order('sort');
  if (nurId) q = q.eq('id', nurId);
  const { data: vh, error } = await q; if (error) throw error;
  const ids = (vh || []).map((v: any) => v.id);
  const { data: pk, error: e2 } = ids.length
    ? await admin.from('hh_vorhaben_punkte').select('id,vorhaben_id,titel,stand,wer,frist').in('vorhaben_id', ids).eq('erledigt', false).order('sort')
    : { data: [], error: null };
  if (e2) throw e2;
  return (vh || []).map((v: any) => ({ ...v, punkte: (pk || []).filter((p: any) => p.vorhaben_id === v.id) }));
}
async function einwurfKI(text: string, person: string, kontext: any[]){
  const key = Deno.env.get('ANTHROPIC_API_KEY') || '';
  if (!key) throw new Error('ANTHROPIC_API_KEY fehlt');
  const model = Deno.env.get('GFWEEKLY_EINWURF_MODEL') || Deno.env.get('GFWEEKLY_TIDY_MODEL') || 'claude-sonnet-5';
  const system = `Du ordnest kurze Meldungen der Geschäftsführung der Wilde Möhre GmbH (Alex und Lea) einem laufenden Vorhaben zu und schlägst vor, was sich in seiner Akte ändert. Du schlägst nur vor, angewendet wird erst nach Bestätigung.
Regeln:
- vorhaben_slug nur aus der Liste. Passt keines eindeutig, gib den besten Treffer mit niedriger sicherheit (unter 0.5) an.
- verlauf: art ist eines von telefon, mail, whatsapp, notiz, entscheidung, termin, plattform. wer: wer mit wem (z. B. „Alex mit Victor“). text: ein bis zwei sachliche Sätze, was passiert ist und was vereinbart wurde. tag: optional ein Stichwort.
- punkte: nur IDs offener Punkte dieses Vorhabens aus der Liste. erledigt nur true, wenn die Meldung es ausdrücklich sagt. stand nur, wenn sich am Punkt etwas geändert hat.
- neue_punkte: nur, wenn die Meldung eine neue Aufgabe nennt, die noch nicht als Punkt existiert. frist als JJJJ-MM-TT, relativ zum heutigen Datum gerechnet („bis Montag“ ist der nächste Montag), sonst null.
- ball (alex, lea, gf, team, extern, offen) nur, wenn die Meldung sagt, wer jetzt dran ist; bei team oder extern den Namen in ball_name. naechster_schritt und frist nur bei klarer Änderung, sonst null.
- benachrichtigung: sofort nur, wenn die andere Person heute handeln muss, sonst morgen.
- Vertraulich: keine Aussagen über Gesundheit, Befinden oder Eignung von Personen, keine Bewertungen von Menschen, keine Passwörter oder Kontodaten in den Text übernehmen. Personalthemen nur auf Sachebene.
- Erfinde nichts, was nicht in der Meldung steht. Sprache Deutsch, keine Gedankenstriche.`;
  const liste = kontext.map((v: any) => ({ slug: v.slug, titel: v.title, ball: vhBallWort(v.ball, v.ball_name), stand: v.stand, naechster_schritt: v.naechster_schritt, frist: v.frist,
    offene_punkte: v.punkte.map((p: any) => ({ id: p.id, titel: p.titel, stand: p.stand, wer: p.wer, frist: p.frist })) }));
  const body = {
    model, max_tokens: 1500, system,
    tools: [{ name: 'vorschlag', description: 'Gibt den Vorschlag für die Akte zurück.',
      input_schema: { type: 'object', additionalProperties: false, required: ['vorhaben_slug','sicherheit','verlauf'],
        properties: {
          vorhaben_slug: { type: 'string' }, sicherheit: { type: 'number' },
          verlauf: { type: 'object', properties: { art: { type: 'string' }, wer: { type: 'string' }, text: { type: 'string' }, tag: { type: ['string','null'] } }, required: ['art','text'] },
          punkte: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, stand: { type: ['string','null'] }, erledigt: { type: 'boolean' } }, required: ['id'] } },
          neue_punkte: { type: 'array', items: { type: 'object', properties: { titel: { type: 'string' }, wer: { type: ['string','null'] }, frist: { type: ['string','null'] } }, required: ['titel'] } },
          ball: { type: ['string','null'] }, ball_name: { type: ['string','null'] }, naechster_schritt: { type: ['string','null'] }, frist: { type: ['string','null'] },
          benachrichtigung: { type: 'string', enum: ['morgen','sofort'] },
        } } }],
    tool_choice: { type: 'tool', name: 'vorschlag' },
    messages: [{ role: 'user', content: `Heute: ${vhHeuteText()}. Meldung von ${person}:\n${text}\n\nAktive Vorhaben:\n${JSON.stringify(liste)}` }],
  };
  const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), EW_TIMEOUT_MS);
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', { method:'POST', signal: ctl.signal,
      headers: { 'content-type':'application/json', 'x-api-key':key, 'anthropic-version':'2023-06-01' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) throw new Error('Anthropic: ' + (data?.error?.message || res.status));
    const tool = (data.content || []).find((c: any) => c.type === 'tool_use');
    if (!tool?.input) throw new Error('Anthropic: keine Antwort im erwarteten Format');
    return { roh: tool.input, model };
  } finally { clearTimeout(timer); }
}
/* Vertraulichkeit (Review 31a Befund 7): Texte der KI, die nach Zugangsdaten, Konto- oder Kartennummern oder
   Gesundheit und Befinden aussehen, werden nicht übernommen. Der Verlaufstext bleibt leer und ist als vertraulich
   markiert; einwurf_apply verlangt dann einen bearbeiteten Text. Das ist ein Wortfilter, kein Verständnis: er fängt
   die offensichtlichen Fälle, nicht jede Umschreibung. */
const VH_VERTRAULICH = /(passwort|kennwort|zugangsdaten|\bpin\b|\btan\b|\biban\b|\bDE\d{2}(?:\s?\d{4}){4}|\b(?:\d{4}[ -]?){3}\d{4}\b|krank|diagnose|therapie|psychisch|depress|burn-?out|schwanger|\barzt|klinik|gesundheit|befinden)/i;
function vhVertraulich(x: unknown){ return typeof x === 'string' && VH_VERTRAULICH.test(x); }
/* Die Antwort der KI gilt als fremde Eingabe: jedes Feld wird geprüft, Unbekanntes verworfen und benannt. */
function einwurfPruefen(roh: any, kontext: any[], vorgabeId: string | null, person: string){
  const verworfen: string[] = [];
  let vh = vorgabeId ? kontext.find((v: any) => v.id === vorgabeId) : null;
  if (!vh) {
    vh = kontext.find((v: any) => v.slug === roh?.vorhaben_slug) || null;
    if (!vh && roh?.vorhaben_slug) verworfen.push(`Vorhaben „${vhText(roh.vorhaben_slug, 60)}“ gibt es nicht`);
  }
  let sicherheit = Number(roh?.sicherheit); if (!isFinite(sicherheit)) sicherheit = 0; sicherheit = Math.max(0, Math.min(1, sicherheit));
  if (vorgabeId && vh) sicherheit = 1;
  const v0 = roh?.verlauf || {};
  const vArt = ['telefon','mail','whatsapp','notiz','entscheidung','termin','plattform'].includes(v0.art) ? v0.art : 'notiz';
  if (v0.art && vArt !== v0.art) verworfen.push(`Kanal „${vhText(v0.art, 30)}“ unbekannt, als Notiz eingetragen`);
  const verlauf = { art: vArt, wer: vhText(v0.wer, 120) || person, text: vhText(v0.text, 2000), tag: vhText(v0.tag, 120) || null };
  const offen = new Map<string, any>((vh?.punkte || []).map((p: any) => [p.id, p]));
  const punkte: any[] = [];
  for (const p of (Array.isArray(roh?.punkte) ? roh.punkte.slice(0, 20) : [])) {
    const da = offen.get(String(p?.id || ''));
    if (!da) { verworfen.push(`Punkt ${vhText(p?.id, 40) || 'ohne ID'} ist kein offener Punkt dieses Vorhabens`); continue; }
    const stand = vhText(p.stand, 500) || null, erledigt = p.erledigt === true;
    if (!stand && !erledigt) continue;
    if (punkte.some(x => x.id === da.id)) continue;
    punkte.push({ id: da.id, titel: da.titel, stand, erledigt });
  }
  const neue: any[] = [];
  for (const n of (Array.isArray(roh?.neue_punkte) ? roh.neue_punkte.slice(0, 10) : [])) {
    const titel = vhText(n?.titel, 300); if (!titel) { verworfen.push('neuer Punkt ohne Titel'); continue; }
    let frist = vhDatum(n.frist); if (frist === undefined) { verworfen.push(`Frist „${vhText(n.frist, 30)}“ bei „${titel}“ ist kein Datum`); frist = null; }
    neue.push({ titel, wer: vhText(n.wer, 120) || null, frist });
  }
  let ball = roh?.ball ?? null;
  if (ball !== null && !VH_BALL.includes(ball)) { verworfen.push(`Ball „${vhText(ball, 30)}“ unbekannt`); ball = null; }
  if (ball !== null && vh && ball === vh.ball) ball = null;
  const ball_name = ball && ['team','extern'].includes(ball) ? (vhText(roh?.ball_name, 120) || null) : null;
  let frist = vhDatum(roh?.frist); if (frist === undefined) { verworfen.push(`Frist „${vhText(roh?.frist, 30)}“ ist kein Datum`); frist = null; }
  if (frist && vh && frist === vh.frist) frist = null;
  let naechster_schritt = vhText(roh?.naechster_schritt, 1000) || null;
  if (naechster_schritt && vh && naechster_schritt === (vh.naechster_schritt || '').trim()) naechster_schritt = null;
  const benachrichtigung = roh?.benachrichtigung === 'sofort' ? 'sofort' : 'morgen';
  if (!vh) { punkte.length = 0; neue.length = 0; ball = null; frist = null; naechster_schritt = null; }
  const vertraulich: string[] = [];
  if (vhVertraulich(verlauf.text) || vhVertraulich(verlauf.wer) || vhVertraulich(verlauf.tag)) {
    vertraulich.push('verlauf'); verlauf.text = ''; verlauf.tag = null; if (vhVertraulich(verlauf.wer)) verlauf.wer = person;
    verworfen.push('Der Verlaufstext enthält möglicherweise vertrauliche Angaben und muss bearbeitet werden');
  }
  for (const p of punkte) if (vhVertraulich(p.stand)) { p.stand = null; vertraulich.push('punkt:' + p.id); verworfen.push(`Stand zu „${p.titel}“ möglicherweise vertraulich, weggelassen`); }
  for (let i = neue.length - 1; i >= 0; i--) if (vhVertraulich(neue[i].titel) || vhVertraulich(neue[i].wer)) { verworfen.push('ein neuer Punkt war möglicherweise vertraulich und ist weggelassen'); vertraulich.push('neuer_punkt'); neue.splice(i, 1); }
  if (vhVertraulich(naechster_schritt)) { naechster_schritt = null; vertraulich.push('naechster_schritt'); verworfen.push('Nächster Schritt möglicherweise vertraulich, weggelassen'); }
  return { vorhaben_id: vh?.id || null, vorhaben_slug: vh?.slug || null, vorhaben_titel: vh?.title || null, sicherheit,
    verlauf, punkte: punkte.filter(p => p.stand || p.erledigt), neue_punkte: neue, ball, ball_name, naechster_schritt, frist, benachrichtigung, verworfen, vertraulich };
}

/* ----- Übergabe: Vorhaben als Korbzeilen ----- */
async function vhHandoverItems(absence: any, von: string, ende: string){
  const gate = absGate(absence.person);
  const { data, error } = await admin.from('hh_vorhaben_lage')
    .select('id,slug,title,strand,ball,ball_name,owner,stand,naechster_schritt,frist,frist_massgeblich,konflikt,status,absence_id')
    .in('status', ['aktiv','pausiert']).limit(HO_GRENZE);
  if (error) throw new Error('Vorhaben konnten nicht gelesen werden: ' + error.message);
  const ids = (data || []).map((v: any) => v.id);
  const { data: pk, error: e2 } = ids.length
    ? await admin.from('hh_vorhaben_punkte').select('vorhaben_id,titel,stand,wer,frist').in('vorhaben_id', ids).eq('erledigt', false).order('sort')
    : { data: [], error: null };
  if (e2) throw new Error('Punkte konnten nicht gelesen werden: ' + e2.message);
  const heute = heuteBerlin(); const items: any[] = [];
  for (const v of (data || [])) {
    const frist = v.frist_massgeblich || null;
    /* Ball bei der abwesenden Person: immer. Ball bei der GF: nur, wenn die Frist ins Fenster fällt oder überfällig ist.
       Was dieser Abwesenheit schon übergeben ist (absence_id), bleibt drin, auch wenn der Ball jetzt bei der Vertretung liegt. */
    const meins = !!gate && v.ball === gate;
    const gfImFenster = v.ball === 'gf' && !!frist && frist <= ende && (frist >= von || frist < heute);
    if (!(meins || gfImFenster || v.absence_id === absence.id)) continue;
    const offen = (pk || []).filter((p: any) => p.vorhaben_id === v.id);
    items.push({ kind:'vorhaben', ref_id:v.id, title:v.title, strand:v.strand || null, frist,
      short_description: v.stand, next_action: v.naechster_schritt,
      context: [offen.length ? 'Offene Punkte: ' + offen.map((p: any) => p.titel).join('; ') : '', v.konflikt ? 'Konflikt: ' + v.konflikt : ''].filter(Boolean).join('\n'),
      owner: v.owner ? vhBallWort(v.owner) : null, who: vhBallWort(v.ball, v.ball_name),
      gate: ['gf','alex','lea'].includes(v.ball) ? v.ball : null, priority: null, slug: v.slug, konflikt: v.konflikt, punkte: offen });
  }
  return items;
}
async function vhDossier(item: any){
  const { data: vl } = await admin.from('hh_vorhaben_verlauf').select('happened_at,art,wer,text')
    .eq('vorhaben_id', item.ref_id).eq('status', 'bestaetigt').order('happened_at', { ascending:false }).limit(5);
  return { slug: item.slug, konflikt: item.konflikt || null, ball: item.who,
    punkte_offen: (item.punkte || []).map((p: any) => ({ titel: p.titel, stand: p.stand, wer: p.wer, frist: p.frist })),
    verlauf: vl || [] };
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
    if (action === 'ping') return json({ ok:true, version:38, secretConfigured: !!PASSWORD, asanaConfigured: !!ASANA_TOKEN, aiConfigured: !!Deno.env.get('ANTHROPIC_API_KEY') });
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
      const nichtGeleert: string[] = [];
      for (const r of (rows || [])) {
        /* v38: nur Themen, die an genau dieser Korbzeile hängen. Sonst leert das Ende einer Testabwesenheit die
           Vertretung einer echten, die dasselbe Thema im Korb hat. */
        const { error } = await admin.from('gfweekly_topics').update({ owner_backup:null }).eq('id', r.ref_id).eq('handover_id', r.id);
        if (error) nichtGeleert.push(r.ref_id);
      }
      if (nichtGeleert.length) return json({ error:`Die Abwesenheit ist beendet, aber ${nichtGeleert.length} Themen tragen noch eine Vertretung.`, themen:nichtGeleert },500);
      /* v38: Vorhaben, deren Ball wegen dieser Abwesenheit gewandert ist, gehen zurück (hh_vorhaben_zurueck). */
      const { data: vz, error: vze } = await admin.rpc('hh_vorhaben_zurueck', { p_absence: t.id, p_by: (t.by ?? WHO).toString().slice(0,60) });
      if (vze) return json({ error:'Die Abwesenheit ist beendet, aber die Bälle der Vorhaben ließen sich nicht zurückgeben: '+vze.message },500);
      const vorhabenZurueck = (vz as any)?.zurueck || [];
      await handoverLog(t.id, 'notiz', `Rückübergabe bestätigt, ${(rows||[]).length} Themen wieder bei ${absence.person}`
        + (vorhabenZurueck.length ? `, ${vorhabenZurueck.length} Vorhaben zurück.` : '.'), WHO);
      const archiviert = await asanaArchivieren(absence);
      return json({ absence, asana_archiviert: archiviert, vorhaben_zurueck: vorhabenZurueck });
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
      let q = admin.from('gfweekly_handover').select('*', { count:'exact' }).eq('absence_id', t.absence_id)
        .order('score', { ascending:false }).order('frist', { ascending:true, nullsFirst:false });
      if (t.cluster) q = q.in('cluster', Array.isArray(t.cluster) ? t.cluster : [t.cluster]);
      if (t.quadrant) q = q.in('quadrant', Array.isArray(t.quadrant) ? t.quadrant : [t.quadrant]);
      if (t.status) q = q.in('status', Array.isArray(t.status) ? t.status : [t.status]);
      q = q.range(0, 4999);
      const { data, error, count } = await q; if (error) throw error;
      const { data: alle, count: alleZahl } = await admin.from('gfweekly_handover')
        .select('quadrant,cluster,ampel,status,luecke', { count:'exact' }).eq('absence_id', t.absence_id).range(0, 4999);
      const { data: absence } = await admin.from('gfweekly_absences').select('*').eq('id', t.absence_id).single();
      /* Nicht nur der Bau kann an eine Obergrenze stoßen, auch die Antwort selbst. Dann zeigt die Seite
         einen Ausschnitt und zu kleine Zähler; gesagt wird es hier, nicht erst beim nächsten Bau. */
      const gekuerzt = (count ?? 0) > (data || []).length || (alleZahl ?? 0) > (alle || []).length;
      return json({ items:data, absence, gekuerzt,
        ...handoverZaehler(alle || []), gesamt: alleZahl ?? (alle || []).length });
    }
    if (action === 'handover_set' || action === 'handover_set_many') {
      /* v30 (Befund 7.1): Korbzeile, Vorgang und Protokoll wandern in einem Zug über die Datenbankfunktion
         hh_handover_set. Entweder alles oder nichts; eine bestätigte Zeile ohne Wirkung kann es nicht mehr geben. */
      const liste = action === 'handover_set' ? [t] : (Array.isArray(t.items) ? t.items.slice(0,500) : []);
      const by = (t.by ?? WHO).toString().slice(0,60);
      const ergebnis: any[] = []; const misslungen: any[] = []; let n = 0;
      for (const it of liste) {
        if (!it.id) { misslungen.push({ id:null, titel:null, grund:'ohne id' }); continue; }
        const patch: Record<string, unknown> = {};
        if (it.cluster !== undefined && HO_CLUSTER.includes(it.cluster)) patch.cluster = it.cluster;
        if (it.ampel !== undefined && HO_AMPEL.includes(it.ampel)) patch.ampel = it.ampel;
        if (it.vertretung !== undefined) patch.vertretung = (it.vertretung ?? '').toString().slice(0,120);
        if (it.frist !== undefined) patch.frist = it.frist || '';
        if (it.regel_note !== undefined) patch.regel_note = (it.regel_note ?? '').toString().slice(0,500);
        if (it.status !== undefined && HO_STATUS.includes(it.status)) patch.status = it.status;
        const { data, error } = await admin.rpc('hh_handover_set', { p_id: it.id, p_by: by, p_patch: patch });
        if (error) {
          if (action === 'handover_set') return json({ error:'Übergabe nicht gespeichert: '+error.message },500);
          const { data: t0 } = await admin.from('gfweekly_handover').select('title').eq('id', it.id).maybeSingle();
          misslungen.push({ id: it.id, titel: t0?.title ?? null, grund: error.message });
          continue;
        }
        n++; ergebnis.push({ ...(data?.item ?? {}), vorgang: data?.vorgang ?? null });
      }
      if (action === 'handover_set') return json({ item: ergebnis[0] || null, vorgang: ergebnis[0]?.vorgang ?? null });
      return json({ ok: misslungen.length === 0, updated:n, misslungen });
    }
    if (action === 'handover_zurueck') {
      /* Rückkehr: die Zeile ist erledigt, die Vertretung fällt weg, und das Thema gehört wieder der Person. */
      if (!t.id) return json({ error:'id fehlt' },400);
      const by = (t.by ?? WHO).toString().slice(0,60);
      const { data: row } = await admin.from('gfweekly_handover').select('*').eq('id', t.id).single();
      if (!row) return json({ error:'Zeile fehlt' },404);
      const { data: absence, error: ae } = await admin.from('gfweekly_absences').select('*').eq('id', row.absence_id).single();
      if (ae || !absence) return json({ error:'Abwesenheit konnte nicht gelesen werden, deshalb wurde nichts geändert.' },500);
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
      if (row.kind === 'vorhaben' && absence) {
        const { data: vz, error: vze } = await admin.rpc('hh_vorhaben_zurueck', { p_absence: absence.id, p_by: by, p_vorhaben: row.ref_id });
        if (vze) return json({ error:'Vorhaben konnte nicht zurückgegeben werden: '+vze.message },500);
        thema = (vz as any)?.zurueck?.[0] || null;
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
      const { items } = await handoverItems(absence);
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
      const { data: laufende, error: le } = await admin.from('gfweekly_absences').select('*').in('status', ['geplant','aktiv','rueckkehr']);
      if (le) return json({ error:'Abwesenheiten konnten nicht gelesen werden: '+le.message },500);
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
            schritte.push(`Korb: ${bau.neu} neu, ${bau.ergaenzt} ergänzt` + (bau.fehler ? `, ${bau.fehler} Fehler` : '')
              + (bau.truncated ? `, unvollständig (${bau.abgeschnitten.join(', ')})` : '')
              + (bau.hinweis_gespeichert ? '' : ', Hinweis auf den unvollständigen Korb ließ sich nicht speichern'));
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
          /* v38: Bälle der Vorhaben zurück an die Person, die wiederkommt. */
          const { data: vz, error: vze } = await admin.rpc('hh_vorhaben_zurueck', { p_absence: absence.id, p_by: 'lauf' });
          if (vze) schritte.push('Vorhaben: Bälle nicht zurückgegeben (' + vze.message.slice(0,120) + ')');
          else if (((vz as any)?.zurueck || []).length) schritte.push(`${(vz as any).zurueck.length} Vorhaben zurück`);
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
            const { data: themen } = await admin.from('gfweekly_handover').select('id,ref_id').eq('absence_id', absence.id).eq('kind','thema');
            for (const r of (themen || [])) await admin.from('gfweekly_topics').update({ owner_backup:null }).eq('id', r.ref_id).eq('handover_id', r.id);
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
      const [{ data: leute, error: lf }, { data: deputies, error: df }] = await Promise.all([
        admin.from('gfweekly_people').select('id,name,email,asana_gid'),
        admin.from('gfweekly_deputies').select('*').eq('person', absence.person).eq('active', true),
      ]);
      /* Ohne Personenliste wüsste der Export nicht, wem die Aufgaben gehören, und würde sie stillschweigend
         herrenlos anlegen oder bestehende Zuweisungen löschen. Dann lieber nichts tun. */
      if (lf || df) return json({ error:'Die Personen ließen sich nicht lesen: ' + (lf || df)!.message,
        hinweis:'In Asana wurde nichts geändert. Bitte später erneut versuchen.' },502);
      /* Zuordnung über den Namen selbst, nicht über whoNorm: das macht aus Merle und Tim sonst dieselbe Person. */
      const norm = (x: unknown) => (x ?? '').toString().trim().toLowerCase();
      const ohneGid: string[] = [];

      /* v30 (Befund 7.3): Wer noch keine Asana-Kennung hat, bekommt sie einmalig über die E-Mail.
         Die Liste aus Asana wird einmal je Export geholt, die Treffer wandern nach gfweekly_people.
         Wer dort kein Konto hat, erscheint in der Antwort und seine Aufgaben gehen an die Vertretung. */
      /* Zugeordnet wird über die E-Mail, und die ist je Person eindeutig. Zugewiesen bekommt ohnehin nur,
         wer in der Vertretungslinie steht, und das sind Alex und Lea. */
      const fehlen = (leute || []).filter((p: any) => !p.asana_gid && p.email);
      let nutzerFehler = '';
      if (fehlen.length) {
        try {
          const nachMail = new Map<string,string>();
          let pfad = `/users?workspace=${ASANA_WORKSPACE}&opt_fields=email,name&limit=100`;
          for (let seite = 0; seite < 20 && pfad; seite++) {
            const antwort = await asanaSeite(pfad);
            for (const u of (antwort.data || [])) if (u?.email) nachMail.set(norm(u.email), u.gid);
            pfad = antwort.next_page?.path || '';
          }
          /* Zwanzig Seiten sind die Schutzgrenze, nicht das Listenende. Bleibt danach etwas übrig, ist die
             Auflösung unvollständig, und das gehört in die Antwort statt in die Annahme „kein Konto“. */
          if (pfad) nutzerFehler = 'Die Nutzerliste war nach zwanzig Seiten nicht zu Ende; einzelne Kennungen bleiben offen.';
          for (const p of fehlen) {
            const gid = nachMail.get(norm(p.email));
            if (!gid) continue;
            const { error } = await admin.from('gfweekly_people').update({ asana_gid: gid }).eq('id', p.id);
            if (error) nutzerFehler = 'Kennung ließ sich nicht merken: ' + error.message;
            else p.asana_gid = gid;
          }
        } catch (e) { nutzerFehler = 'Nutzerliste nicht lesbar: ' + String((e as Error).message).slice(0,160); }
      }

      const perMail = (mail: string) => (leute || []).find((q: any) => norm(q.email) === mail) || null;
      const gidVon = (name: string) => {
        if (!name) return null;
        let p = (leute || []).find((q: any) => norm(q.name) === norm(name));
        /* Die Vertretungslinie führt „Alex“ und „Lea“, die Personenliste „Alexander Dettke“ und „Lea Luce“.
           Aufgelöst wird allein über die feste E-Mail der beiden. Ein Vergleich auf die Zeichenkette im Namen
           würde „Alexandra“ mitnehmen, auch als einziger Treffer; dann lieber keine Kennung und ein Name in
           der Antwort. Für alle anderen zählt der genaue Name, sonst würden Merle und Tim zur selben Person. */
        if (!p) {
          const w = whoNorm(name);
          if (w === 'Alex' || w === 'Lea') p = perMail(w === 'Alex' ? MAIL_ALEX : MAIL_LEA);
        }
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
      /* Asana legt jedem neuen Projekt einen leeren Abschnitt ohne Namen bei. Der wandert weg, sobald die
         eigenen Abschnitte stehen; ist er nicht leer, bleibt er unangetastet. */
      for (const a of (vorhanden || [])) {
        if (!/^(unbenannter abschnitt|untitled section)$/i.test((a.name || '').trim())) continue;
        try {
          const drin = await asana(`/sections/${a.gid}/tasks?limit=1`);
          if (!(drin || []).length) { await asana(`/sections/${a.gid}`, 'DELETE'); delete abschnitt[a.name]; }
        } catch (_e) { /* bleibt stehen, stört nur die Optik */ }
      }

      /* Wer kein Asana-Konto hat, dessen Aufgaben gehen an Alex; die Namen stehen in der Antwort.
         So bleibt keine Aufgabe herrenlos (ANTWORTEN_ZU_FRAGEN.md, Punkt 7.3). Fehlt auch Alex eine Kennung,
         bleibt die Aufgabe unzugewiesen, und die Antwort sagt genau das, statt einen Empfänger zu behaupten. */
      const ersatz = perMail(MAIL_ALEX)?.asana_gid || null;
      const folgen = [ersatz, perMail(MAIL_LEA)?.asana_gid].filter(Boolean) as string[];
      let neu = 0, aktualisiert = 0;
      for (const row of rows) {
        const sek = asanaAbschnitt(row);
        const daten: Record<string, unknown> = {
          name: `[Vertretung] ${row.title || 'ohne Titel'}`,
          notes: asanaNotiz(row, absence, vollmachtVon(row)),
          due_on: row.frist || null,
        };
        const zu = (row.vertretung ? gidVon(row.vertretung) : null) ?? (row.vertretung ? ersatz : null);
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
      const wohin = ersatz ? ', deshalb an Alex' : ', und auch Alex hat keine Kennung: diese Aufgaben bleiben unzugewiesen';
      await handoverLog(absence.id, 'asana', `Nach Asana exportiert: ${neu} neue und ${aktualisiert} aktualisierte Aufgaben.`
        + (ohneGid.length ? ` Ohne eigenes Asana-Konto${wohin}: ${ohneGid.join(', ')}.` : '')
        + (nutzerFehler ? ` ${nutzerFehler}` : ''), (t.by ?? WHO).toString());
      return json({ ok:true, projekt, neu, aktualisiert, ohne_zuweisung:ohneGid,
        ersatz_zuweisung: ohneGid.length ? (ersatz ? 'Alex' : null) : null, nutzerliste: nutzerFehler || null,
        url:`https://app.asana.com/0/${projekt}` });
    }
    if (action === 'asana_sync') {
      if (!ASANA_TOKEN) return json({ error:'ASANA_TOKEN fehlt' },400);
      if (!t.absence_id) return json({ error:'absence_id fehlt' },400);
      const { data: absence } = await admin.from('gfweekly_absences').select('*').eq('id', t.absence_id).single();
      if (!absence) return json({ error:'Abwesenheit fehlt' },404);
      const bericht = await asanaSync(absence);
      return json({ ok:true, ...bericht });
    }


    /* ----- v33 · V27 Phase B · Launch verteilen ----- */
    if (action === 'launch_list') {
      const festivals = await launchFestivals();
      const planIds = festivals.map(f => f.plan_id);
      /* V29: Rückweg aus Asana, wenn der letzte Lauf älter als 60 Minuten ist. Ein Fehler darin bricht die Liste nicht ab. */
      let sync: any = null;
      try {
        const { data: st } = planIds.length ? await admin.from('gfweekly_launch_sync').select('plan_id,synced_at,ergebnis').in('plan_id', planIds).neq('plan_id', LAUNCH_SYNC_SPERRE) : { data: [] } as any;
        /* Der älteste Zeitstempel entscheidet: bleibt ein Plan nach einem Fehler zurück, wird er beim nächsten Aufruf wieder versucht (Review V29, Befund 1). */
        const zeiten = (st || []).map((x: any) => x.synced_at).sort();
        const letzter = zeiten[zeiten.length - 1] || null, aeltester = zeiten[0] || null;
        const alt = !aeltester || (Date.now() - Date.parse(aeltester)) > LAUNCH_SYNC_MINUTEN * 60000 || (st || []).length < planIds.length;
        if (alt && ASANA_TOKEN) {
          sync = Object.assign({ automatisch: true }, await launchSync(festivals, 'System'));
          /* Für die Warnung zählt der gespeicherte Stand, nicht der Laufbeginn (Review V29b, Runde 2, Befund 3). */
          const { data: st2 } = await admin.from('gfweekly_launch_sync').select('synced_at').in('plan_id', planIds);
          const z2 = (st2 || []).map((x: any) => x.synced_at).sort();
          sync.aeltester = (st2 || []).length < planIds.length ? null : (z2[0] || null);
        }
        else sync = { automatisch: false, synced_at: letzter, aeltester: aeltester, plaene: st || [], uebersprungen: ASANA_TOKEN ? '' : 'ASANA_TOKEN fehlt' };
      } catch (e) { sync = { automatisch: true, fehler: 1, uebersprungen: String((e as Error).message).slice(0, 200) }; }
      const eventIds = festivals.map(f => f.event_id);
      /* v36 (V28): dazu die Besetzung „bisher“ (Stand Sommer 2026) und das Launch-Protokoll für saison.html. */
      const [ms, bes, leute, rw, ber, vorher, log, sendLog] = await Promise.all([
        planIds.length ? admin.from('vvp_launch_milestones').select('id,plan_id,title,category,status,due_on,due_on_vorher,bereich,person_id,hilfe_person_id,zuordnung_status,aufwand_lo,aufwand_hi,dauer_tage,generator_anteil,responsible,asana_task_gid,ist_stunden,completed_on,sort_order,notes,depends_on').in('plan_id', planIds).order('sort_order',{ascending:true}).order('title',{ascending:true}) : Promise.resolve({ data: [], error: null }),
        eventIds.length ? admin.from('gfweekly_launch_besetzung').select('*').in('event_id', eventIds) : Promise.resolve({ data: [], error: null }),
        launchPersonen(),
        admin.from('gfweekly_launch_richtwerte').select('*'),
        admin.from('gfweekly_launch_bereiche').select('*').order('sort_order',{ascending:true}),
        admin.from('gfweekly_launch_besetzung_vorher').select('bereich,text,quelle,sort_order').order('sort_order',{ascending:true}),
        admin.from('gfweekly_saison_log').select('at,who,what,row_id,item_id,detail').in('what', ['launch_set','launch_confirm','launch_send','launch_sync']).order('at',{ascending:false}).limit(120),
        /* Versandzeilen getrennt, damit viele Sync-Kommentare den Projektlink und das Startdatum nicht verdrängen (Review V29, Befund 7). */
        admin.from('gfweekly_saison_log').select('at,who,what,row_id,item_id,detail').eq('what','launch_send').order('at',{ascending:false}).limit(100),
      ]);
      if ((sendLog as any).error) throw (sendLog as any).error;
      const logZeilen = (() => { const alle = ((log as any).data || []).concat((sendLog as any).data || []); const seen = new Set<string>(); return alle.filter((z: any) => { const k = z.at + '|' + z.what + '|' + (z.row_id || '') + '|' + (z.item_id || ''); if (seen.has(k)) return false; seen.add(k); return true; }).sort((a: any, b: any) => String(b.at).localeCompare(String(a.at))); })();
      if ((ms as any).error) throw (ms as any).error;
      if ((bes as any).error) throw (bes as any).error;
      if ((rw as any).error) throw (rw as any).error;
      if ((ber as any).error) throw (ber as any).error;
      if ((vorher as any).error) throw (vorher as any).error;
      if ((log as any).error) throw (log as any).error;
      const planZuEvent = new Map(festivals.map(f => [f.plan_id, f]));
      const meilensteine = ((ms as any).data || []).map((m: any) => {
        const f = planZuEvent.get(m.plan_id);
        return Object.assign({}, m, { event_id: f?.event_id || null, festival: f?.short_name || null });
      });
      /* Last je Person über alle Launches: offene Meilensteine, als Zuständige der eigene Anteil, als Hilfe der
         Generator-Anteil. Die Seite rechnet Fenster und Prozent selbst (launch-logik.js), hier stehen die Summen. */
      const last: Record<string, any> = {};
      const buche = (pid: string, lo: number, hi: number, festival: string | null) => {
        const e = last[pid] || (last[pid] = { person_id: pid, stunden_lo: 0, stunden_hi: 0, aufgaben: 0, festivals: [] as string[] });
        e.stunden_lo += lo; e.stunden_hi += hi; e.aufgaben++; if (festival && !e.festivals.includes(festival)) e.festivals.push(festival);
      };
      for (const m of meilensteine) {
        if (m.status === 'complete' || m.status === 'not_required') continue;
        const lo = Number(m.aufwand_lo ?? 0), hi = Number(m.aufwand_hi ?? lo), g = Math.min(1, Math.max(0, Number(m.generator_anteil ?? 0)));
        const hatHilfe = !!m.hilfe_person_id && g > 0;
        if (m.person_id) buche(m.person_id, lo * (hatHilfe ? 1 - g : 1), hi * (hatHilfe ? 1 - g : 1), m.festival);
        if (hatHilfe) buche(m.hilfe_person_id, lo * g, hi * g, m.festival);
      }
      return json({ festivals, meilensteine, besetzung: (bes as any).data || [], pool: (leute as any[]).map(launchPersonAussen),
        richtwerte: (rw as any).data || [], bereiche: (ber as any).data || [], last: Object.values(last),
        vorher: (vorher as any).data || [], log: logZeilen, sync,
        asanaConfigured: !!ASANA_TOKEN, heute: heuteBerlin() });
    }
    if (action === 'launch_set') {
      const by = (t.by ?? WHO).toString();
      const jetzt = new Date().toISOString();
      /* a) Ein Meilenstein: Zuständigkeit, Hilfe, Stand. */
      if (t.milestone_id) {
        const { data: m, error: me } = await admin.from('vvp_launch_milestones').select('id,plan_id,title,status,person_id,hilfe_person_id,zuordnung_status,responsible,asana_task_gid,completed_on').eq('id', t.milestone_id).single();
        if (me || !m) return json({ error:'Meilenstein fehlt' },404);
        const patch: Record<string, unknown> = { updated_at: jetzt };
        const geaendert: string[] = [];
        if (t.person_id !== undefined) {
          patch.person_id = t.person_id || null; geaendert.push('person');
          /* Eine geänderte Zuordnung ist wieder ein Vorschlag; „responsible“ bleibt leer bis zur Bestätigung.
             Die Asana-Kennung bleibt stehen, damit der nächste Versand die Aufgabe aktualisiert statt verdoppelt. */
          patch.zuordnung_status = t.person_id ? 'vorschlag' : 'offen'; patch.responsible = null;
        }
        if (t.hilfe_person_id !== undefined) {
          patch.hilfe_person_id = t.hilfe_person_id || null; geaendert.push('hilfe');
          if (m.zuordnung_status === 'bestaetigt' || m.zuordnung_status === 'gesendet') { patch.zuordnung_status = m.person_id ? 'vorschlag' : 'offen'; patch.responsible = null; }
        }
        if (t.status !== undefined) {
          const s = LAUNCH_STATUS_WORT[String(t.status)] || String(t.status);
          if (!LAUNCH_STATUS.includes(s)) return json({ error:'status unbekannt' },400);
          patch.status = s; geaendert.push('status');
          patch.completed_on = s === 'complete' ? (m.completed_on || heuteBerlin()) : null;
        }
        /* V29: Ist-Stunden am erledigten Meilenstein, Grundlage der Kalibrierung. Nur diese Spalte. */
        if (t.ist_stunden !== undefined) {
          const v = t.ist_stunden === null || t.ist_stunden === '' ? null : Number(t.ist_stunden);
          if (v !== null && (!Number.isFinite(v) || v < 0 || v > 1000)) return json({ error:'ist_stunden muss zwischen 0 und 1000 liegen oder leer sein' },400);
          patch.ist_stunden = v; geaendert.push('ist_stunden');
        }
        if (!geaendert.length) return json({ error:'nichts zu ändern' },400);
        const { data, error } = await admin.from('vvp_launch_milestones').update(patch).eq('id', m.id).select().single();
        if (error) throw error;
        await launchLog(by, 'launch_set', null, m.id, { titel: m.title, geaendert, patch });
        return json({ ok:true, milestone:data });
      }
      /* b) Eine Person: Stunden je Woche, verfügbar ab. Nur diese beiden Spalten. */
      if (t.person_id && (t.launch_std_woche !== undefined || t.verfuegbar_ab !== undefined)) {
        const patch: Record<string, unknown> = {};
        if (t.launch_std_woche !== undefined) {
          const v = t.launch_std_woche === null || t.launch_std_woche === '' ? null : Number(t.launch_std_woche);
          if (v !== null && (!Number.isFinite(v) || v < 0 || v > 80)) return json({ error:'launch_std_woche muss zwischen 0 und 80 liegen oder leer sein' },400);
          patch.launch_std_woche = v;
        }
        if (t.verfuegbar_ab !== undefined) {
          const v = t.verfuegbar_ab ? String(t.verfuegbar_ab) : null;
          if (v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) return json({ error:'verfuegbar_ab muss ein Datum sein' },400);
          patch.verfuegbar_ab = v;
        }
        const { data, error } = await admin.from('gfweekly_people').update(patch).eq('id', t.person_id).select(LAUNCH_PERSON_SPALTEN).single();
        if (error) throw error;
        await launchLog(by, 'launch_set', null, null, { person: data?.name, patch });
        return json({ ok:true, person: launchPersonAussen(data) });
      }
      /* c) Besetzung je Bereich: die Zeile und alle noch nicht bestätigten Meilensteine des Bereichs folgen.
         v36 (V28): optional status = 'bestaetigt' (nur Alex oder Lea) setzt die Zeile und die Meilensteine des Bereichs
         gleich fest; ohne person_id bleibt die eingetragene Person. Quelle und Notiz bleiben stehen, solange die Person
         dieselbe ist; der Vorzustand steht im Protokoll, damit die Historie erhalten bleibt. */
      if (t.event_id && t.bereich) {
        const festival = await launchFestival(t.event_id);
        if (!festival) return json({ error:'Festival fehlt' },404);
        const bereich = String(t.bereich);
        const { data: alt } = await admin.from('gfweekly_launch_besetzung').select('person_id,status,quelle,notiz').eq('event_id', festival.event_id).eq('bereich', bereich).maybeSingle();
        const pid = t.person_id !== undefined ? (t.person_id || null) : (alt?.person_id || null);
        const bestaetigen = t.status === 'bestaetigt';
        const von = whoNorm(by);
        if (bestaetigen && von !== 'Alex' && von !== 'Lea') return json({ error:'Bestätigen können nur Alex oder Lea' },403);
        if (bestaetigen && !pid) return json({ error:'Ohne Person lässt sich nichts bestätigen' },400);
        const gleichePerson = !!alt && (alt.person_id || null) === pid;
        const zeile: Record<string, unknown> = { event_id: festival.event_id, bereich, person_id: pid,
          status: bestaetigen ? 'bestaetigt' : (pid ? 'vorschlag' : 'offen'),
          quelle: gleichePerson && alt?.quelle ? alt.quelle : `Hohes Haus, ${by}`,
          notiz: t.notiz !== undefined ? (t.notiz || null) : (gleichePerson ? alt?.notiz ?? null : undefined),
          bestaetigt_von: bestaetigen ? von : null, bestaetigt_am: bestaetigen ? jetzt : null, updated_at: jetzt };
        if (zeile.notiz === undefined) delete zeile.notiz;
        const { data: b, error: be } = await admin.from('gfweekly_launch_besetzung').upsert(zeile, { onConflict:'event_id,bereich' }).select().single();
        if (be) throw be;
        let name: string | null = null;
        if (bestaetigen) { const leute = await launchPersonen(); name = (leute as any[]).find(p => p.id === pid)?.name || null; }
        const { data: ms, error: me } = await admin.from('vvp_launch_milestones')
          .update({ person_id: pid, zuordnung_status: bestaetigen ? 'bestaetigt' : (pid ? 'vorschlag' : 'offen'), responsible: bestaetigen ? name : null, updated_at: jetzt })
          .eq('plan_id', festival.plan_id).eq('bereich', bereich).in('zuordnung_status', ['offen','vorschlag']).select('id,title');
        if (me) throw me;
        await launchLog(by, 'launch_set', festival.short_name, null, { bereich, person_id: pid, meilensteine: (ms || []).length, status: bestaetigen ? 'bestaetigt' : undefined, vorher: alt || null });
        return json({ ok:true, besetzung: b, meilensteine: (ms || []).length });
      }
      /* d) VVK-Start: vvp_events.sales_start_on, dazu alle offenen Zieltermine neu aus den Richtwerten,
         der alte Termin wandert nach due_on_vorher. Erledigtes bleibt, wie es war. */
      if (t.event_id && t.sales_start_on !== undefined) {
        const neu = String(t.sales_start_on || '');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(neu)) return json({ error:'sales_start_on muss ein Datum sein' },400);
        const festival = await launchFestival(t.event_id);
        if (!festival) return json({ error:'Festival fehlt' },404);
        const alt = festival.sales_start_on || null;
        const { error: ee } = await admin.from('vvp_events').update({ sales_start_on: neu, updated_at: jetzt }).eq('id', festival.event_id);
        if (ee) throw ee;
        const [{ data: ms, error: me }, { data: rw, error: re }] = await Promise.all([
          admin.from('vvp_launch_milestones').select('id,title,status,due_on').eq('plan_id', festival.plan_id),
          admin.from('gfweekly_launch_richtwerte').select('title,vvk_offset_tage'),
        ]);
        if (me) throw me; if (re) throw re;
        const offset = new Map((rw || []).map((r: any) => [r.title, r.vvk_offset_tage]));
        let verschoben = 0; const fehler: string[] = [];
        for (const m of (ms || [])) {
          if (m.status === 'complete' || m.status === 'not_required') continue;
          const off = offset.get(m.title); if (off === null || off === undefined) continue;
          const ziel = addDays(neu, Number(off));
          if (ziel === m.due_on) continue;
          const { error } = await admin.from('vvp_launch_milestones').update({ due_on_vorher: m.due_on, due_on: ziel, updated_at: jetzt }).eq('id', m.id);
          if (error) fehler.push(`${m.title}: ${error.message}`); else verschoben++;
        }
        /* Die Cockpit-Historie kennt den Wechsel als Änderung am Plan. */
        const { data: plan } = await admin.from('vvp_launch_plans').select('org_id').eq('id', festival.plan_id).single();
        if (plan?.org_id) await admin.from('vvp_launch_plan_changes').insert({ org_id: plan.org_id, plan_id: festival.plan_id, field: 'sales_start_on', old_value: alt, new_value: neu, changed_by: `Hohes Haus, ${by}` });
        await launchLog(by, 'launch_set', festival.short_name, null, { sales_start_on: { alt, neu }, verschoben, fehler });
        return json({ ok:true, sales_start_on: neu, vorher: alt, verschoben, fehler });
      }
      return json({ error:'launch_set braucht milestone_id, person_id oder event_id mit bereich oder sales_start_on' },400);
    }
    if (action === 'launch_confirm') {
      /* Eine Bestätigung reicht, aber sie muss von Alex oder Lea kommen. */
      const von = whoNorm(t.by ?? WHO);
      if (von !== 'Alex' && von !== 'Lea') return json({ error:'Bestätigen können nur Alex oder Lea' },403);
      if (!t.event_id) return json({ error:'event_id fehlt' },400);
      const festival = await launchFestival(t.event_id);
      if (!festival) return json({ error:'Festival fehlt' },404);
      const jetzt = new Date().toISOString();
      const leute = await launchPersonen();
      const nameVon = new Map(leute.map((p: any) => [p.id, p.name]));
      let q = admin.from('vvp_launch_milestones').select('id,title,person_id,zuordnung_status').eq('plan_id', festival.plan_id).not('person_id','is',null).in('zuordnung_status', ['offen','vorschlag']);
      if (Array.isArray(t.milestone_ids) && t.milestone_ids.length) q = q.in('id', t.milestone_ids.map(String));
      const { data: ms, error: me } = await q;
      if (me) throw me;
      let bestaetigt = 0; const fehler: string[] = [];
      for (const m of (ms || [])) {
        const name = nameVon.get(m.person_id) || null;
        if (!name) { fehler.push(`${m.title}: Person unbekannt`); continue; }
        const { error } = await admin.from('vvp_launch_milestones').update({ zuordnung_status: 'bestaetigt', responsible: name, updated_at: jetzt }).eq('id', m.id);
        if (error) fehler.push(`${m.title}: ${error.message}`); else bestaetigt++;
      }
      /* Besetzung: alle Zeilen mit Person, die noch nicht bestätigt sind. */
      let besetzung = 0;
      if (!Array.isArray(t.milestone_ids) || !t.milestone_ids.length) {
        const { data: b, error: be } = await admin.from('gfweekly_launch_besetzung')
          .update({ status: 'bestaetigt', bestaetigt_von: von, bestaetigt_am: jetzt, updated_at: jetzt })
          .eq('event_id', festival.event_id).not('person_id','is',null).neq('status','bestaetigt').select('id');
        if (be) fehler.push('Besetzung: ' + be.message); else besetzung = (b || []).length;
      }
      const { count: offen } = await admin.from('vvp_launch_milestones').select('id', { count:'exact', head:true }).eq('plan_id', festival.plan_id).is('person_id', null).not('status','in','("complete","not_required")');
      const protokoll = await launchLog(von, 'launch_confirm', festival.short_name, null, { bestaetigt, besetzung, offen: offen || 0, fehler, milestone_ids: t.milestone_ids || null });
      if (!protokoll) fehler.push('Die Bestätigung ließ sich nicht protokollieren (gfweekly_saison_log).');
      return json({ ok:true, von, bestaetigt, besetzung, offen: offen || 0, fehler, protokoll });
    }
    if (action === 'launch_send') {
      if (!ASANA_TOKEN) return json({ error:'ASANA_TOKEN fehlt', hinweis:'Secret in Supabase anlegen, dann erneut senden. Bis dahin bleibt der Stand „bestätigt“.' },400);
      if (!t.event_id) return json({ error:'event_id fehlt' },400);
      const von = whoNorm(t.by ?? WHO);
      const festival = await launchFestival(t.event_id);
      if (!festival) return json({ error:'Festival fehlt' },404);
      const [{ data: ms, error: me }, { data: bes, error: be }, leute, { data: rw, error: re }, { data: ber, error: bre }] = await Promise.all([
        admin.from('vvp_launch_milestones').select('*').eq('plan_id', festival.plan_id).in('zuordnung_status', ['bestaetigt','gesendet']).order('sort_order',{ascending:true}),
        admin.from('gfweekly_launch_besetzung').select('*').eq('event_id', festival.event_id),
        launchPersonen(),
        admin.from('gfweekly_launch_richtwerte').select('*'),
        admin.from('gfweekly_launch_bereiche').select('*').order('sort_order',{ascending:true}),
      ]);
      if (me || be || re || bre) return json({ error:'Daten ließen sich nicht lesen: ' + (me || be || re || bre)!.message, hinweis:'In Asana wurde nichts geändert.' },502);
      const zuSenden = (ms || []).filter((m: any) => m.person_id && m.status !== 'complete' && m.status !== 'not_required');
      if (!zuSenden.length) return json({ error:'nichts zu senden', hinweis:'Es gibt keine bestätigten, offenen Meilensteine mit Person.' },400);
      const personJe = new Map((leute as any[]).map(p => [p.id, p]));
      const rwJe = new Map((rw || []).map((r: any) => [r.title, r]));
      const norm = (x: unknown) => (x ?? '').toString().trim().toLowerCase();
      const perMail = (mail: string) => (leute as any[]).find(q => norm(q.email) === mail) || null;
      const alex = perMail(MAIL_ALEX), lea = perMail(MAIL_LEA);
      const folgen = [alex?.asana_gid, lea?.asana_gid].filter(Boolean) as string[];
      /* Übergebender: die Festivalverantwortung, wenn sie intern ist und ein Konto hat, sonst Alex. */
      const fv = (bes || []).find((b: any) => b.bereich === 'fv' && b.person_id);
      const fvPerson = fv ? personJe.get(fv.person_id) : null;
      const uebergebender = (fvPerson && !launchIstExtern(fvPerson) && fvPerson.asana_gid) ? fvPerson : alex;
      const projektNotiz = launchProjektNotiz(festival, fvPerson?.name || null);

      /* Projekt: zuerst die Kennung aus dem letzten Versand, dann die Suche nach dem Namen, sonst neu anlegen. */
      const name = `Launch ${festival.kurzname} 2027`;
      let projekt: string | null = null;
      const { data: letzter } = await admin.from('gfweekly_saison_log').select('detail').eq('what','launch_send').eq('row_id', festival.short_name).not('detail->>projekt','is',null).order('at',{ascending:false}).limit(1);
      const gemerkt = (letzter || [])[0]?.detail?.projekt;
      if (gemerkt) {
        try { const p = await asana(`/projects/${gemerkt}?opt_fields=name,archived`); if (p && !p.archived) projekt = String(p.gid); }
        catch (e) { if (!/: 404 /.test(String((e as Error).message))) return json({ error:String((e as Error).message), hinweis:'Das gemerkte Projekt ließ sich nicht erreichen. Nichts geändert.' },502); }
      }
      if (!projekt) {
        try {
          let pfad = `/projects?workspace=${ASANA_WORKSPACE}&archived=false&opt_fields=name&limit=100`;
          for (let seite = 0; seite < 20 && pfad && !projekt; seite++) {
            const antwort = await asanaSeite(pfad);
            const treffer = (antwort.data || []).find((p: any) => norm(p.name) === norm(name));
            if (treffer) projekt = String(treffer.gid);
            pfad = antwort.next_page?.path || '';
          }
        } catch (e) { return json({ error:'Projektliste nicht lesbar: ' + String((e as Error).message), hinweis:'Nichts geändert.' },502); }
      }
      if (!projekt) {
        let team = (t.team ?? ASANA_TEAM ?? '').toString();
        if (!team) {
          try { const liste = await asana(`/projects?workspace=${ASANA_WORKSPACE}&limit=20&opt_fields=team,name,archived`); team = (liste || []).find((p: any) => p?.team?.gid && !p.archived)?.team?.gid || ''; }
          catch (_e) { team = ''; }
        }
        const daten: Record<string, unknown> = { name, workspace: ASANA_WORKSPACE, notes: projektNotiz };
        if (team) daten.team = team;
        try { projekt = String((await asana('/projects', 'POST', daten)).gid); }
        catch (e) { return json({ error:String((e as Error).message), hinweis:'Braucht der Arbeitsbereich ein Team, ASANA_TEAM setzen oder team in der Nutzlast mitgeben.' },400); }
        /* Die Kennung wird sofort protokolliert, damit ein Abbruch danach kein zweites Projekt erzeugt.
           Scheitert das, bricht der Versand vor der ersten Aufgabe ab; das Projekt steht leer in Asana und wird beim
           nächsten Versand über den Namen wiedergefunden. */
        const gemerktOk = await launchLog(von, 'launch_send', festival.short_name, null, { projekt, schritt:'Projekt angelegt', neu:0, aktualisiert:0 });
        if (!gemerktOk) return json({ error:'Das Projekt steht in Asana, ließ sich aber nicht protokollieren.', projekt, hinweis:'Noch keine Aufgabe angelegt. Später erneut senden; das Projekt wird über den Namen gefunden.' },500);
      }
      /* V29: Beschreibung bei jedem Versand nachziehen (VVK-Start und Festivalverantwortung können sich ändern). */
      const fruehFehler: string[] = [];
      try { await asana(`/projects/${projekt}`, 'PUT', { notes: projektNotiz }); } catch (e) { fruehFehler.push('Projektbeschreibung nicht aktualisiert: ' + String((e as Error).message).slice(0, 160)); }
      /* Abschnitte je Bereich, in der Reihenfolge der Bereiche. */
      const vorhanden = await asana(`/projects/${projekt}/sections?opt_fields=name`);
      const abschnitt: Record<string,string> = {};
      for (const a of (vorhanden || [])) abschnitt[a.name] = a.gid;
      const bereichName: Record<string,string> = {};
      for (const b of (ber || [])) { bereichName[b.key] = b.name; if (!abschnitt[b.name]) abschnitt[b.name] = (await asana(`/projects/${projekt}/sections`, 'POST', { name:b.name })).gid; }
      if (!abschnitt['Ohne Bereich']) { for (const m of zuSenden) if (!m.bereich || !bereichName[m.bereich]) { abschnitt['Ohne Bereich'] = (await asana(`/projects/${projekt}/sections`, 'POST', { name:'Ohne Bereich' })).gid; break; } }
      for (const a of (vorhanden || [])) {
        if (!/^(unbenannter abschnitt|untitled section)$/i.test((a.name || '').trim())) continue;
        try { const drin = await asana(`/sections/${a.gid}/tasks?limit=1`); if (!(drin || []).length) { await asana(`/sections/${a.gid}`, 'DELETE'); delete abschnitt[a.name]; } } catch (_e) { /* bleibt stehen */ }
      }

      /* Aufgaben, die schon im Projekt stehen, nach Namen: hat ein Meilenstein keine Kennung, weil das Merken nach
         dem Anlegen scheiterte, wird die vorhandene Aufgabe weiterverwendet statt eine zweite anzulegen. */
      const imProjekt = new Map<string,string>();
      try {
        let pfad = `/projects/${projekt}/tasks?opt_fields=name&limit=100`;
        for (let seite = 0; seite < 50 && pfad; seite++) {
          const antwort = await asanaSeite(pfad);
          for (const a of (antwort.data || [])) if (a?.name && !imProjekt.has(norm(a.name))) imProjekt.set(norm(a.name), String(a.gid));
          pfad = antwort.next_page?.path || '';
        }
      } catch (e) { return json({ error:'Aufgabenliste des Projekts nicht lesbar: ' + String((e as Error).message).slice(0,160), projekt, hinweis:'Nichts geändert, sonst könnten Aufgaben doppelt entstehen.' },502); }
      let neu = 0, aktualisiert = 0, unteraufgaben = 0;
      const angebot: string[] = [], ohneKonto: string[] = [], fehler: string[] = fruehFehler.slice();
      const empfaenger: Record<string, number> = {};   // tatsächliche Asana-Empfänger je Name (Review V29, Runde 2, Befund 3)
      const jetzt = new Date().toISOString();
      for (const m of zuSenden) {
        const zust = personJe.get(m.person_id); const helfer = m.hilfe_person_id ? personJe.get(m.hilfe_person_id) : null;
        const r = rwJe.get(m.title);
        if (!zust) { fehler.push(`${m.title}: Person unbekannt`); continue; }
        const sek = abschnitt[bereichName[m.bereich] || ''] || abschnitt['Ohne Bereich'];
        let daten: Record<string, unknown>;
        if (launchIstExtern(zust)) {
          /* Externe bekommen keine Aufgabe; der Übergebende holt das Angebot ein und beauftragt. */
          if (!uebergebender?.asana_gid) { ohneKonto.push(`${m.title}: ${zust.name} ist extern, und es gibt keinen Übergebenden mit Asana-Konto`); continue; }
          daten = { name:`Angebot einholen und beauftragen: ${m.title}`, assignee: uebergebender.asana_gid, due_on: m.due_on || null,
            notes: launchAsanaNotiz(m, r, festival, zust, helfer, `${zust.name} (${zust.typ}) ist laut Plan zuständig und bekommt keine Asana-Aufgabe. Diese Aufgabe gehört ${uebergebender.name}: Angebot einholen, beauftragen, briefen.`) };
          angebot.push(`${m.title} → ${zust.name}, Aufgabe bei ${uebergebender.name}`);
        } else if (!zust.asana_gid) {
          ohneKonto.push(`${m.title}: ${zust.name} hat kein Asana-Konto`); continue;
        } else {
          daten = { name: m.title, assignee: zust.asana_gid, due_on: m.due_on || null, notes: launchAsanaNotiz(m, r, festival, zust, helfer) };
        }
        let gid: string | null = m.asana_task_gid || imProjekt.get(norm(String(daten.name))) || null;
        try {
          if (gid) {
            await asana(`/tasks/${gid}`, 'PUT', daten);
            if (sek) { try { await asana(`/sections/${sek}/addTask`, 'POST', { task: gid }); } catch (_e) { /* Abschnitt ist Optik */ } }
            aktualisiert++;
          } else {
            const aufgabe = await asana('/tasks', 'POST', Object.assign({}, daten, { workspace: ASANA_WORKSPACE, followers: folgen }, sek ? { memberships:[{ project: projekt, section: sek }] } : { projects:[projekt] }));
            gid = String(aufgabe.gid); neu++;
          }
          const { error } = await admin.from('vvp_launch_milestones').update({ asana_task_gid: gid, zuordnung_status: 'gesendet', updated_at: jetzt }).eq('id', m.id);
          if (error) { fehler.push(`${m.title}: Aufgabe ${gid} steht in Asana, ließ sich aber nicht merken: ${error.message}`); continue; }
          const empfName = launchIstExtern(zust) ? uebergebender!.name : zust.name; empfaenger[empfName] = (empfaenger[empfName] || 0) + 1;
        } catch (e) { fehler.push(`${m.title}: ${String((e as Error).message).slice(0,160)}`); continue; }
        /* Generator-Anteil als Unteraufgabe beim Helfer; bestehende gleichnamige Unteraufgabe wird weiterverwendet. */
        const g = Number(m.generator_anteil ?? 0);
        if (helfer && g > 0 && gid) {
          const uname = `Generator-Anteil (${Math.round(g * 100)} Prozent): ${m.title}`;
          let ziel: any = null, unotiz = '';
          if (launchIstExtern(helfer)) {
            if (zust.asana_gid && !launchIstExtern(zust)) { ziel = zust; unotiz = `${helfer.name} (${helfer.typ}) soll den Generator-Anteil übernehmen und bekommt keine Asana-Aufgabe. Angebot einholen, beauftragen, briefen.`; angebot.push(`Generator-Anteil ${m.title} → ${helfer.name}, Unteraufgabe bei ${zust.name}`); }
            else ohneKonto.push(`Generator-Anteil ${m.title}: ${helfer.name} ist extern, und ${zust.name} hat keine Aufgabe dafür`);
          } else if (helfer.asana_gid) ziel = helfer;
          else ohneKonto.push(`Generator-Anteil ${m.title}: ${helfer.name} hat kein Asana-Konto`);
          if (ziel) {
            try {
              const bestehend = await asana(`/tasks/${gid}/subtasks?opt_fields=name`);
              const uwirklich = ziel === zust ? `Angebot einholen und beauftragen: ${uname}` : uname;
              /* Suche mit demselben Namen, der geschrieben wird; sonst entstünde bei jedem Versand eine weitere Angebots-Unteraufgabe (Review V29, Runde 2, Befund 1). */
              const da = (bestehend || []).find((s: any) => norm(s.name) === norm(uwirklich) || norm(s.name) === norm(uname));
              const udaten = { name: uwirklich, assignee: ziel.asana_gid, due_on: m.due_on || null,
                notes: `${Math.round(g * 100)} Prozent von ${m.title}, Richtwert ${Number(m.aufwand_lo ?? 0) * g} bis ${Number(m.aufwand_hi ?? 0) * g} Stunden.${unotiz ? '\n' + unotiz : ''}\n${HH_BASIS}/launch.html?festival=${encodeURIComponent(festival.short_name || '')}\n${LAUNCH_SICHTBAR}` };
              if (da) await asana(`/tasks/${da.gid}`, 'PUT', udaten);
              else { await asana(`/tasks/${gid}/subtasks`, 'POST', udaten); unteraufgaben++; }
            } catch (e) { fehler.push(`Generator-Anteil ${m.title}: ${String((e as Error).message).slice(0,160)}`); }
          }
        }
      }
      const url = `https://app.asana.com/0/${projekt}`;
      const protokoll = await launchLog(von, 'launch_send', festival.short_name, null, { projekt, url, neu, aktualisiert, unteraufgaben, angebot, ohne_konto: ohneKonto, fehler, empfaenger });
      if (!protokoll) fehler.push('Der Versand ließ sich nicht protokollieren (gfweekly_saison_log); die Projektkennung ' + projekt + ' steht nur in dieser Antwort.');
      return json({ ok:true, projekt, url, neu, aktualisiert, unteraufgaben, angebot, ohne_konto: ohneKonto, fehler, empfaenger, protokoll });
    }

    if (action === 'launch_sync') {
      /* V29: Rückweg aus Asana auf Knopfdruck. event_id grenzt auf ein Festival ein, sonst alle. */
      const festivals = await launchFestivals();
      const liste = t.event_id ? festivals.filter(f => f.event_id === t.event_id) : festivals;
      if (t.event_id && !liste.length) return json({ error:'Festival fehlt' },404);
      const r = await launchSync(liste, (t.by ?? WHO).toString());
      return json(Object.assign({ ok: true, automatisch: false }, r));
    }

    /* ----- Vorhaben (v38, V31) ----- */
    if (action === 'vorhaben_list') {
      let q = admin.from('hh_vorhaben_lage').select('*').order('sort').order('title');
      if (t.status !== 'alle') q = q.in('status', ['aktiv','pausiert']);
      const heute = heuteBerlin();
      let qa = admin.from('gfweekly_absences').select('id,person,von,bis,bis_geschaetzt,status,vertretung_standard,test').in('status', ['geplant','aktiv']).order('von');
      if (!t.include_test) qa = qa.eq('test', false);
      const [vh, rows, items, meta, abs, ew] = await Promise.all([
        q,
        admin.from('gfweekly_saison_rows').select('id,label,vvk_start'),
        admin.from('gfweekly_saison_items').select('id,title,starts_on,ends_on').not('id', 'is', null),
        admin.from('gfweekly_saison_items').select('title,starts_on,ends_on').eq('row_id', 'meta').eq('archived', false).lte('starts_on', heute).gte('ends_on', heute).order('starts_on').limit(1),
        qa,
        admin.from('hh_einwurf').select('id,vorhaben_id').in('status', ['neu','vorgeschlagen']),
      ]);
      for (const r of [vh, rows, items, meta, abs, ew]) if (r.error) throw r.error;
      const rowMap = new Map((rows.data || []).map((r: any) => [r.id, r]));
      const itemMap = new Map((items.data || []).map((r: any) => [r.id, r]));
      const liste = (vh.data || []).map((v: any) => {
        const r: any = v.saison_row_id ? rowMap.get(v.saison_row_id) : null; const i: any = v.saison_item_id ? itemMap.get(v.saison_item_id) : null;
        return { ...v, saison: (r || i) ? { label: r?.label || null, vvk_start: r?.vvk_start || null, item_title: i?.title || null, item_von: i?.starts_on || null, item_bis: i?.ends_on || null } : null };
      });
      return json({ stand: new Date().toISOString(), heute, vorhaben: liste, metaphase: (meta.data || [])[0] || null,
        abwesenheiten: abs.data || [], einwuerfe_offen: (ew.data || []).length,
        einwuerfe_ohne_vorhaben: (ew.data || []).filter((x: any) => !x.vorhaben_id).length });
    }
    if (action === 'vorhaben_badge') {
      /* Zähler an „Vorhaben“ in der Navigation: offene Einwürfe plus Vorhaben mit Ball bei mir und Zustand überfällig. */
      const ich = absGate(t.person || WHO);
      const [ew, vh] = await Promise.all([
        admin.from('hh_einwurf').select('id', { count:'exact', head:true }).in('status', ['neu','vorgeschlagen']),
        ich ? admin.from('hh_vorhaben_lage').select('id', { count:'exact', head:true }).eq('ball', ich).eq('zustand', 'ueberfaellig').in('status', ['aktiv','pausiert'])
            : Promise.resolve({ count: 0, error: null } as any),
      ]);
      if (ew.error) throw ew.error; if (vh.error) throw vh.error;
      return json({ einwuerfe: ew.count || 0, ueberfaellig_bei_mir: vh.count || 0, n: (ew.count || 0) + (vh.count || 0) });
    }
    if (action === 'vorhaben_get') {
      const ref = (t.id || t.slug || '').toString().trim(); if (!ref) return json({ error:'id oder slug fehlt' },400);
      const v = await vhLese(ref);
      const [pk, vl, th, kd, ew, sr, si] = await Promise.all([
        admin.from('hh_vorhaben_punkte').select('*').eq('vorhaben_id', v.id).order('sort').order('created_at'),
        admin.from('hh_vorhaben_verlauf').select('*').eq('vorhaben_id', v.id).in('status', ['bestaetigt','vorschlag']).order('happened_at', { ascending:false }).limit(200),
        admin.from('gfweekly_topics').select('id,title,board_lane,gate').eq('vorhaben_id', v.id).eq('archived', false).order('created_at', { ascending:false }),
        admin.from('gfweekly_news').select('id,title,relevance').eq('vorhaben_id', v.id).eq('kind', 'kandidat').eq('status', 'neu').order('happened_at', { ascending:false }),
        admin.from('hh_einwurf').select('*').eq('vorhaben_id', v.id).in('status', ['neu','vorgeschlagen']).order('created_at', { ascending:false }),
        v.saison_row_id ? admin.from('gfweekly_saison_rows').select('id,label,vvk_start').eq('id', v.saison_row_id).maybeSingle() : Promise.resolve({ data:null, error:null } as any),
        v.saison_item_id ? admin.from('gfweekly_saison_items').select('id,title,starts_on,ends_on').eq('id', v.saison_item_id).maybeSingle() : Promise.resolve({ data:null, error:null } as any),
      ]);
      for (const r of [pk, vl, th, kd, ew, sr, si]) if (r.error) throw r.error;
      const saison = (sr.data || si.data) ? { label: sr.data?.label || null, vvk_start: sr.data?.vvk_start || null, item_title: si.data?.title || null, item_von: si.data?.starts_on || null, item_bis: si.data?.ends_on || null } : null;
      return json({ vorhaben: { ...v, saison }, punkte: pk.data || [], verlauf: vl.data || [], themen: th.data || [], kandidaten: kd.data || [], einwuerfe: ew.data || [] });
    }
    if (action === 'vorhaben_save') {
      const by = vhBy(t); const patch = vhPatch(t);
      const notiz = vhText(t.notiz, 1000) || null;
      if (t.id || t.slug) {
        const v = await vhLese((t.id || t.slug).toString());
        if (t.expect_ball !== undefined && t.expect_ball !== null) patch.expect_ball = t.expect_ball;
        if (!Object.keys(patch).filter(k => k !== 'expect_ball').length && !notiz) return json({ error:'nichts zu ändern' },400);
        const r = await vhSave(v.id, patch, by, notiz, null);
        return json({ vorhaben: await vhLese(v.id), ball_geaendert: r.ball_geaendert, verlauf: r.verlauf });
      }
      if (!patch.title) return json({ error:'title fehlt' },400);
      delete patch.expect_ball;
      let neu: any = null;
      for (let versuch = 0; versuch < 3 && !neu; versuch++) {
        const slug = await vhSlug(patch.title as string);
        const { data, error } = await admin.rpc('hh_vorhaben_neu', { p_row: { ...patch, slug }, p_by: by, p_notiz: notiz });
        if (error && error.code === '23505') continue;   // slug gleichzeitig vergeben: neuer Versuch
        if (error) throw error; neu = (data as any).vorhaben;
      }
      if (!neu) return json({ error:'Kein freier slug gefunden' },409);
      return json({ vorhaben: await vhLese(neu.id), angelegt: true });
    }
    if (action === 'punkt_save') {
      const by = vhBy(t);
      const patch: Record<string, unknown> = {};
      if (t.titel !== undefined) { const s = vhText(t.titel, 300); if (!s) return json({ error:'titel darf nicht leer sein' },400); patch.titel = s; }
      for (const f of ['position','stand','wer']) if (t[f] !== undefined) patch[f] = vhText(t[f], f === 'stand' ? 1000 : 120) || null;
      if (t.frist !== undefined) { const d = vhDatum(t.frist); if (d === undefined) return json({ error:'frist ist kein Datum (JJJJ-MM-TT)' },400); patch.frist = d; }
      if (t.sort !== undefined) { const n = parseInt(t.sort); if (isNaN(n)) return json({ error:'sort ist keine Zahl' },400); patch.sort = n; }
      if (t.id) {
        const { data: alt, error: e0 } = await admin.from('hh_vorhaben_punkte').select('*').eq('id', t.id).maybeSingle();
        if (e0) throw e0; if (!alt) return json({ error:'Punkt gibt es nicht' },404);
        if (!Object.keys(patch).length) return json({ error:'nichts zu ändern' },400);
        /* Ein neuer Stand ist Bewegung im Vorhaben und gehört in den Verlauf, im selben Zug wie die Änderung. */
        return json(await vhRpc('hh_punkt_save', { p_id: alt.id, p_patch: patch, p_by: by }));
      }
      if (!t.vorhaben_id || !patch.titel) return json({ error:'vorhaben_id und titel fehlen' },400);
      const v = await vhLese(t.vorhaben_id.toString());
      if (patch.sort === undefined) {
        const { data: letzte } = await admin.from('hh_vorhaben_punkte').select('sort').eq('vorhaben_id', v.id).order('sort', { ascending:false }).limit(1);
        patch.sort = ((letzte || [])[0]?.sort ?? 0) + 10;
      }
      const { data, error } = await admin.from('hh_vorhaben_punkte').insert({ ...patch, vorhaben_id: v.id, quelle: vhText(t.quelle, 200) || 'von Hand' }).select().single();
      if (error) throw error; return json({ punkt: data });
    }
    if (action === 'punkt_toggle') {
      const by = vhBy(t); if (!t.id || typeof t.erledigt !== 'boolean') return json({ error:'id und erledigt (true|false) fehlen' },400);
      return json(await vhPunktToggle(t.id.toString(), t.erledigt, by));
    }
    if (action === 'punkt_delete') {
      vhBy(t); if (!t.id) return json({ error:'id fehlt' },400);
      const { data: p, error: e0 } = await admin.from('hh_vorhaben_punkte').select('id,titel').eq('id', t.id).maybeSingle();
      if (e0) throw e0; if (!p) return json({ error:'Punkt gibt es nicht' },404);
      const { data: bezug, error: e1 } = await admin.from('hh_vorhaben_verlauf').select('id,text,happened_at')
        .or(`punkt_id.eq.${p.id},source_ref.like.*${p.id}*`).limit(1);
      if (e1) throw e1;
      if ((bezug || []).length) return json({ error:`„${p.titel}“ hat schon Verlauf (${(bezug as any)[0].text.slice(0,80)}). Löschen würde ihn aus dem Zusammenhang reißen; setze den Punkt stattdessen auf erledigt oder ändere den Titel.` },409);
      const { error } = await admin.from('hh_vorhaben_punkte').delete().eq('id', p.id); if (error) throw error;
      return json({ ok:true });
    }
    if (action === 'verlauf_add') {
      const by = vhBy(t);
      if (!t.vorhaben_id) return json({ error:'vorhaben_id fehlt' },400);
      if (!VH_ART.includes(t.art)) return json({ error:'art: '+VH_ART.join('|') },400);
      const text = vhText(t.text, 4000); if (!text) return json({ error:'text fehlt' },400);
      const v = await vhLese(t.vorhaben_id.toString());
      let happened = new Date().toISOString();
      if (t.happened_at) { const d = new Date(t.happened_at); if (isNaN(d.getTime())) return json({ error:'happened_at ist kein Zeitpunkt' },400); happened = d.toISOString(); }
      const url = vhText(t.source_url, 2000); if (url && !/^https?:\/\//i.test(url)) return json({ error:'source_url muss mit http beginnen' },400);
      const row = await vhVerlaufAdd({ vorhaben_id: v.id, art: t.art, wer: vhText(t.wer, 120) || by, text, tag: vhText(t.tag, 120) || null,
        happened_at: happened, source_url: url || null, status: 'bestaetigt', created_by: by });
      return json({ verlauf: row });
    }
    if (action === 'verlauf_status') {
      const by = vhBy(t);
      if (!t.id || !['bestaetigt','verworfen'].includes(t.status)) return json({ error:'id und status (bestaetigt|verworfen) fehlen' },400);
      if (!VH_UUID.test(String(t.id))) return json({ error:'Eintrag gibt es nicht' },404);
      /* Übernimmt jemand einen Vorschlag des Abgleichs „Punkt erledigt“, hakt hh_verlauf_status den Punkt im selben Zug ab.
         Die Punkt-ID steht im source_ref (abgleich:<person>:vorschlag:<Punkt-ID>:<Quelle>), so legt docs/ABGLEICH-VORHABEN.md es fest. */
      return json(await vhRpc('hh_verlauf_status', { p_id: t.id, p_status: t.status, p_by: by }));
    }
    if (action === 'vorhaben_verknuepfen') {
      vhBy(t);
      const table = t.kind === 'thema' ? 'gfweekly_topics' : t.kind === 'kandidat' ? 'gfweekly_news' : null;
      if (!table || !t.id) return json({ error:'kind (thema|kandidat) und id fehlen' },400);
      let vid: string | null = null;
      if (t.vorhaben_id) vid = (await vhLese(t.vorhaben_id.toString())).id;
      const { data, error } = await admin.from(table).update({ vorhaben_id: vid }).eq('id', t.id).select('id,title,vorhaben_id').maybeSingle();
      if (error) throw error; if (!data) return json({ error:'Eintrag gibt es nicht' },404);
      return json({ item: data });
    }
    if (action === 'einwurf_add') {
      const by = vhBy(t);
      const text = vhText(t.text, 4000); if (!text) return json({ error:'text fehlt' },400);
      const kanal = EW_KANAL.includes(t.kanal) ? t.kanal : 'knopf';
      const von = ['Alex','Lea'].includes(whoNorm(t.von)) ? whoNorm(t.von) : by;
      const vorgabe = t.vorhaben_id ? (await vhLese(t.vorhaben_id.toString())).id : null;
      const { data: ew, error } = await admin.from('hh_einwurf').insert({ von, kanal, text, vorhaben_id: vorgabe, status:'neu' }).select().single();
      if (error) throw error;
      let ki_fehler: string | null = null; let einwurf = ew;
      try {
        const kontext = await vhKontext(vorgabe);
        if (!kontext.length) throw new Error(vorgabe ? 'Das Vorhaben ist nicht aktiv' : 'Es gibt keine aktiven Vorhaben');
        const { roh, model } = await einwurfKI(text, von, kontext);
        const vs: any = einwurfPruefen(roh, kontext, vorgabe, von); vs.model = model; vs.revision = crypto.randomUUID();
        const { data: up, error: ue } = await admin.from('hh_einwurf')
          .update({ vorschlag: vs, status:'vorgeschlagen', vorhaben_id: vs.vorhaben_id || vorgabe }).eq('id', ew.id).eq('status','neu').select().single();
        if (ue) throw ue; einwurf = up;
      } catch (e) {
        ki_fehler = (e as Error).name === 'AbortError' ? 'Die KI hat nicht innerhalb von 20 Sekunden geantwortet.' : String((e as Error).message || e).slice(0,300);
      }
      return json({ einwurf, ki_fehler });
    }
    if (action === 'einwurf_apply') {
      /* Alles oder nichts in hh_einwurf_apply (Review 31a Befunde 1 und 2). Hier wird nur das Ziel bestimmt und die
         Bearbeitung geprüft. Gilt der Vorschlag für ein anderes Vorhaben, übernimmt die Funktion nur den Verlaufseintrag. */
      const by = vhBy(t); if (!t.id || !VH_UUID.test(String(t.id))) return json({ error:'id fehlt' },400);
      const { data: ew, error: e0 } = await admin.from('hh_einwurf').select('id,vorhaben_id,vorschlag,status').eq('id', t.id).maybeSingle();
      if (e0) throw e0; if (!ew) return json({ error:'Einwurf gibt es nicht' },404);
      const zielRef = (t.vorhaben_id || ew.vorhaben_id || ew.vorschlag?.vorhaben_id || '').toString();
      if (!zielRef) return json({ error:'Bitte ein Vorhaben wählen.' },400);
      const vh = await vhLese(zielRef);
      const b = t.bearbeitet || {};
      const fristB = vhDatum(b.frist); if (fristB === undefined) return json({ error:'Frist ist kein Datum (JJJJ-MM-TT)' },400);
      const bearbeitet = { verlauf_text: vhText(b.verlauf_text, 2000) || null, naechster_schritt: vhText(b.naechster_schritt, 1000) || null, frist: fristB };
      if (vhVertraulich(bearbeitet.verlauf_text) || vhVertraulich(bearbeitet.naechster_schritt)) return json({ error:'Der Text enthält möglicherweise vertrauliche Angaben (Zugangsdaten, Kontonummer, Gesundheit). Bitte so formulieren, dass er in die Akte darf.' },400);
      const a = t.auswahl || {};
      const auswahl = { verlauf: !!a.verlauf, ball: !!a.ball, naechster_schritt: !!a.naechster_schritt, frist: !!a.frist,
        punkte: Array.isArray(a.punkte) ? a.punkte.map(String).filter((x: string) => VH_UUID.test(x)).slice(0, 50) : [],
        neue_punkte: Array.isArray(a.neue_punkte) ? a.neue_punkte.map((x: unknown) => parseInt(String(x))).filter((x: number) => x >= 0 && x < 50) : [] };
      const ben = ['sofort','morgen'].includes(t.benachrichtigung) ? t.benachrichtigung : null;
      /* revision: der Vorschlag, den die Person gesehen hat (Review 31a Runde 2, Befund 5). */
      const erg = await vhRpc('hh_einwurf_apply', { p_id: ew.id, p_vorhaben: vh.id, p_auswahl: auswahl, p_bearbeitet: bearbeitet, p_benachrichtigung: ben, p_by: by,
        p_revision: t.revision ? String(t.revision).slice(0, 64) : null });
      return json({ ok:true, vorhaben: await vhLese(vh.id), ...erg });
    }
    if (action === 'einwurf_vorschlag') {
      /* Wer im Einwurf das Vorhaben ändert, bekommt einen neuen, gegen dieses Vorhaben geprüften Vorschlag. */
      const by = vhBy(t); if (!t.id || !t.vorhaben_id) return json({ error:'id und vorhaben_id fehlen' },400);
      const { data: ew, error: e0 } = await admin.from('hh_einwurf').select('*').eq('id', t.id).maybeSingle();
      if (e0) throw e0; if (!ew) return json({ error:'Einwurf gibt es nicht' },404);
      if (!['neu','vorgeschlagen'].includes(ew.status)) return json({ error:'Der Einwurf ist schon entschieden.' },409);
      const vh = await vhLese(t.vorhaben_id.toString());
      let ki_fehler: string | null = null; let einwurf = ew;
      try {
        const kontext = await vhKontext(vh.id);
        if (!kontext.length) throw new Error('Das Vorhaben ist nicht aktiv');
        const { roh, model } = await einwurfKI(ew.text, ew.von, kontext);
        const vs: any = einwurfPruefen(roh, kontext, vh.id, ew.von); vs.model = model; vs.neu_geprueft_von = by; vs.revision = crypto.randomUUID();
        const { data: up, error: ue } = await admin.from('hh_einwurf').update({ vorschlag: vs, status:'vorgeschlagen', vorhaben_id: vh.id })
          .eq('id', ew.id).in('status', ['neu','vorgeschlagen']).select().maybeSingle();
        if (ue) throw ue; if (!up) return json({ error:'Der Einwurf wurde gerade entschieden.' },409);
        einwurf = up;
      } catch (e) {
        ki_fehler = (e as Error).name === 'AbortError' ? 'Die KI hat nicht innerhalb von 20 Sekunden geantwortet.' : String((e as Error).message || e).slice(0,300);
        /* Ohne neuen Vorschlag gilt das gewählte Ziel trotzdem; übernommen wird dann nur der Verlaufseintrag. */
        await admin.from('hh_einwurf').update({ vorhaben_id: vh.id }).eq('id', ew.id).in('status', ['neu','vorgeschlagen']);
        einwurf = { ...ew, vorhaben_id: vh.id };
      }
      return json({ einwurf, ki_fehler });
    }
    if (action === 'einwurf_verwerfen') {
      const by = vhBy(t); if (!t.id) return json({ error:'id fehlt' },400);
      const { data, error } = await admin.from('hh_einwurf').update({ status:'verworfen', entschieden_by: by, entschieden_at: new Date().toISOString() })
        .eq('id', t.id).in('status', ['neu','vorgeschlagen']).select().maybeSingle();
      if (error) throw error; if (!data) return json({ error:'Der Einwurf ist schon entschieden oder fehlt.' },409);
      return json({ einwurf: data });
    }
    if (action === 'einwurf_list') {
      let q = admin.from('hh_einwurf').select('*, vorhaben:hh_vorhaben(id,slug,title)').order('created_at', { ascending:false }).limit(200);
      if (t.status !== 'alle') q = q.in('status', ['neu','vorgeschlagen']);
      if (t.vorhaben_id) q = q.eq('vorhaben_id', t.vorhaben_id);
      const { data, error } = await q; if (error) throw error;
      return json({ einwuerfe: data || [] });
    }
    if (action === 'schicht_uebergabe') {
      const by = vhBy(t);
      const von = whoNorm(t.von), an = whoNorm(t.an);
      if (!['Alex','Lea'].includes(von) || !['Alex','Lea'].includes(an)) return json({ error:'von und an müssen Alex oder Lea sein' },400);
      if (by !== von) return json({ error:'Übergeben kann nur, wer die Schicht abgibt (by muss von sein).' },400);
      const eintraege = Array.isArray(t.eintraege) ? t.eintraege.slice(0, 100) : [];
      if (!eintraege.length) return json({ error:'eintraege fehlen' },400);
      const ergebnis: any[] = [], fehler: any[] = [];
      for (const e of eintraege) {
        try {
          if (!e?.vorhaben_id) throw new VhFehler('vorhaben_id fehlt');
          if (!VH_BALL.includes(e.ball)) throw new VhFehler('ball: ' + VH_BALL.join('|'));
          const v = await vhLese(e.vorhaben_id.toString());
          const patch: Record<string, unknown> = { ball: e.ball, ball_name: ['team','extern'].includes(e.ball) ? (vhText(e.ball_name, 120) || null) : null };
          const bleibt = v.ball === e.ball && (v.ball_name || '') === ((patch.ball_name as string) || '');
          const notiz = vhText(e.notiz, 1000) || (bleibt ? 'Ball bleibt bei ' + vhBallWort(v.ball, v.ball_name) : null);
          /* Der Ball, den die Person im Dialog gesehen hat, ist Pflicht. Liegt er inzwischen woanders, meldet die Zeile einen Konflikt. */
          if (!VH_BALL.includes(e.expect_ball)) throw new VhFehler('expect_ball fehlt: welcher Ball war im Dialog zu sehen?');
          patch.expect_ball = e.expect_ball;
          const r = await vhSave(v.id, patch, by, notiz, `Schichtwechsel ${von} an ${an}`);
          ergebnis.push({ vorhaben_id: v.id, title: v.title, ball: r.vorhaben.ball, ball_geaendert: r.ball_geaendert });
        } catch (err) { fehler.push({ vorhaben_id: e?.vorhaben_id || null, konflikt: err instanceof VhFehler && err.status === 409, grund: String((err as Error).message || err).slice(0,200) }); }
      }
      return json({ ok: fehler.length === 0, ergebnis, fehler });
    }
    if (action === 'probe_aufraeumen') {
      /* Nur für pruefung/vorhaben-probe.mjs: löscht das Testvorhaben test-v31 eines früheren Laufs (nur wenn archiviert)
         mit Punkten, Verlauf und Einwürfen, und beendete Testabwesenheiten mit der Notiz „V31-Probe“ samt Korb.
         Echte Vorhaben und echte Abwesenheiten erreicht diese Aktion nicht: slug, Status, test und Notiz sind fest. */
      vhBy(t);
      /* Einwürfe der Probe tragen den Text „V31-Probe: …“, auch wenn die KI sie einem echten Vorhaben zugeordnet hat. */
      let vorhaben = 0, einwuerfe = 0, abwesenheiten = 0;
      const { data: pe, error: e6 } = await admin.from('hh_einwurf').delete().like('text', 'V31-Probe:%').select('id'); if (e6) throw e6; einwuerfe += (pe || []).length;
      /* Ticker aus „sofort“ an den Testvorhaben gehören nicht ins Laufband, auch nicht bis zum nächsten Lauf. */
      const { data: tv } = await admin.from('hh_vorhaben').select('id').in('slug', ['test-v31','test-v31-ziel']);
      let ticker = 0;
      if ((tv || []).length) {
        const { data: tk, error: e7 } = await admin.from('gfweekly_news').delete().like('source_ref', 'einwurf:%').in('vorhaben_id', (tv || []).map((x: any) => x.id)).select('id');
        if (e7) throw e7; ticker = (tk || []).length;
      }
      if (t.nur_einwuerfe) return json({ ok:true, vorhaben, einwuerfe, ticker, abwesenheiten, aktiv_uebrig:false });
      const { data: alte, error: e0 } = await admin.from('hh_vorhaben').select('id,slug,status').in('slug', ['test-v31','test-v31-ziel']);
      if (e0) throw e0;
      for (const alt of (alte || [])) {
        if (alt.status !== 'archiviert') continue;
        const { data: ew, error: e1 } = await admin.from('hh_einwurf').delete().eq('vorhaben_id', alt.id).select('id'); if (e1) throw e1; einwuerfe += (ew || []).length;
        const { error: e2 } = await admin.from('gfweekly_news').delete().like('source_ref', 'einwurf:%').eq('vorhaben_id', alt.id); if (e2) throw e2;
        const { error: e5 } = await admin.from('gfweekly_handover').delete().eq('kind', 'vorhaben').eq('ref_id', alt.id); if (e5) throw e5;
        const { error: e3 } = await admin.from('hh_vorhaben').delete().eq('id', alt.id).in('slug', ['test-v31','test-v31-ziel']).eq('status', 'archiviert'); if (e3) throw e3; vorhaben++;
      }
      const alt = (alte || []).find((x: any) => x.status !== 'archiviert');
      const { data: ab, error: e4 } = await admin.from('gfweekly_absences').delete().eq('test', true).eq('note', 'V31-Probe').eq('status', 'beendet').select('id');
      if (e4) throw e4; abwesenheiten = (ab || []).length;
      return json({ ok:true, vorhaben, einwuerfe, abwesenheiten, aktiv_uebrig: !!(alt && alt.status !== 'archiviert') });
    }
    if (action === 'vorhaben_rueckkehr') {
      /* Für rueckkehr.html: Vorhaben, die in dieser Abwesenheit übergeben waren oder ruhten, mit ihrem Verlauf seit Beginn. */
      if (!t.absence_id) return json({ error:'absence_id fehlt' },400);
      const { data: absence, error: ae } = await admin.from('gfweekly_absences').select('*').eq('id', t.absence_id).maybeSingle();
      if (ae) throw ae; if (!absence) return json({ error:'Abwesenheit fehlt' },404);
      const [ho, zr, gebunden] = await Promise.all([
        admin.from('gfweekly_handover').select('ref_id,ampel,vertretung,status').eq('absence_id', absence.id).eq('kind', 'vorhaben').neq('status', 'vorschlag'),
        admin.from('hh_vorhaben_verlauf').select('vorhaben_id,text,happened_at').like('source_ref', `abwesenheit:${absence.id}:zurueck:%`),
        admin.from('hh_vorhaben').select('id').eq('absence_id', absence.id),
      ]);
      for (const r of [ho, zr, gebunden]) if (r.error) throw r.error;
      const ids = [...new Set([...(ho.data || []).map((r: any) => r.ref_id), ...(zr.data || []).map((r: any) => r.vorhaben_id), ...(gebunden.data || []).map((r: any) => r.id)])];
      if (!ids.length) return json({ absence, vorhaben: [] });
      const [vh, vl] = await Promise.all([
        admin.from('hh_vorhaben_lage').select('id,slug,title,ball,ball_name,stand,naechster_schritt,frist_massgeblich,zustand,absence_id').in('id', ids),
        admin.from('hh_vorhaben_verlauf').select('id,vorhaben_id,happened_at,art,wer,text,tag').in('vorhaben_id', ids).eq('status', 'bestaetigt')
          .gte('happened_at', addDays(absence.von, -1) + 'T22:00:00Z').order('happened_at', { ascending:false }).limit(500),
      ]);
      if (vh.error) throw vh.error; if (vl.error) throw vl.error;
      const liste = (vh.data || []).map((v: any) => ({ ...v,
        korb: (ho.data || []).find((r: any) => r.ref_id === v.id) || null,
        zurueck: (zr.data || []).find((r: any) => r.vorhaben_id === v.id) || null,
        verlauf: (vl.data || []).filter((e: any) => e.vorhaben_id === v.id) }));
      return json({ absence, vorhaben: liste });
    }

    return json({ error:'unknown action' }, 400);
  } catch (e) {
    if (e instanceof VhFehler) return json({ error: e.message }, e.status);
    return json({ error:String((e as Error).message ?? e) }, 500);
  }
});
