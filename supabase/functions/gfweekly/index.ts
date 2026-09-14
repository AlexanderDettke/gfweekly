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
function slugKey(s: string){ return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40) || 'sonstiges'; }

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
    if (action === 'ping') return json({ ok:true, version:17 });
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
    if (action === 'request_protocol') {
      const { data, error } = await admin.from('gfweekly_protocol_requests').insert({ requested_by:(t.requested_by??'').toString().slice(0,120), note:(t.note??'').toString() }).select().single();
      if (error) throw error; return json({ request: data });
    }

    /* ----- Inbox ----- */
    /* v16: Eingaben landen direkt als Thema in „Zu besprechen" (kein Inbox-Zwischenschritt mehr, Entscheid 13.09.2026).
       v17: Seiten haben ein Vorschaubild (preview, Pfad unter /assets/previews/).
       Antwortform bleibt kompatibel: item = das angelegte Thema. */
    function topicFromCapture(c: any){
      const raw=(c.raw_text ?? c.title ?? '').toString().trim(); if(!raw) return null;
      const first=raw.split('\n')[0].trim();
      const prio=['hoch','mittel','niedrig'].includes(c.urgency)?c.urgency:(['hoch','mittel','niedrig'].includes(c.priority)?c.priority:'mittel');
      return {
        title: first.slice(0,300), context: raw.slice(0,4000), priority: prio, status:'offen', kind:'einmalig',
        source: c.source==='chat' ? 'claude' : 'manuell', created_by:(c.created_by??'').toString().slice(0,120),
        board_lane:'zu_besprechen', lane_order: 0,
        short_description:(c.type_hint??'').toString().slice(0,200), owner:(c.owner_hint??'').toString().slice(0,120),
        involved:(c.stakeholder_hint??'').toString().slice(0,200), dependencies:(c.related_hint??'').toString().slice(0,200),
        notes: c.due_hint ? ('Fällig: '+c.due_hint.toString().slice(0,60)) : '',
      };
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

    return json({ error:'unknown action' }, 400);
  } catch (e) { return json({ error:String((e as Error).message ?? e) }, 500); }
});
