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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method === 'GET') { try { await ensurePageInStorage(); } catch(_e){} return new Response(null,{ status:302, headers:{ 'Location':PUBLIC_PAGE, 'Cache-Control':'no-store' } }); }
  if (req.method !== 'POST') return json({ error:'method' }, 405);
  let body: any; try { body = await req.json(); } catch { return json({ error:'bad json' }, 400); }
  const { action, password, payload } = body ?? {};
  const given = (password ?? '').toString() || keyFromHeaders(req);
  if (!PASSWORD || given !== PASSWORD) return json({ error:'unauthorized' }, 401);
  const t = payload ?? {};

  try {
    if (action === 'ping') return json({ ok:true, version:20, secretConfigured: !!PASSWORD, aiConfigured: !!Deno.env.get('ANTHROPIC_API_KEY') });
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
      if (error) throw error; return json({ topic: data });
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
      const { data, error } = await admin.from('gfweekly_topics').update(patch).eq('id', t.id).select().single();
      if (error) throw error; return json({ topic: data });
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
      if (error) throw error; return json({ item:data, topic:data });
    }
    if (action === 'capture_many') {
      const items = Array.isArray(t.items) ? t.items.slice(0,30) : [];
      const rows = items.map((it: any) => topicFromCapture({ ...it, created_by: it.created_by ?? t.created_by, source: it.source ?? t.source })).filter(Boolean);
      if(!rows.length) return json({ error:'leer' },400);
      const { data, error } = await admin.from('gfweekly_topics').insert(rows).select();
      if (error) throw error; return json({ items:data, count:data.length });
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
      if(error) throw error; return json({ ok:true, done:true, check:data });
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
      if(t.id){ const { data, error } = await admin.from('gfweekly_milestones').update(row).eq('id',t.id).select().single(); if(error) throw error; return json({ milestone:data }); }
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
      const { data, error } = await admin.from('gfweekly_sessions').update(patch).eq('id',t.id).select().single(); if(error) throw error; return json({ session:data });
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
      const { data, error } = await admin.from('gfweekly_decisions').insert(row).select().single(); if(error) throw error; return json({ decision:data });
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

    return json({ error:'unknown action' }, 400);
  } catch (e) { return json({ error:String((e as Error).message ?? e) }, 500); }
});
