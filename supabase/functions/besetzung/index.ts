/* Das Hohe Haus · Edge Function „besetzung“ (Paket Besetzung B1, 02.10.2026)
   Aufgaben aus der Besetzungswerkstatt des Habitat Hubs verteilen.

   Führende Quellen
   - Habitat Hub (Schema hub, Tabellen besetzung_*): Partner, Angebote, Formate, Zuordnungen mit Gesprächsstand,
     Gesprächszuständigkeit (Text) und nächstem Schritt. Diese Funktion liest dort nur über zwei Lesefunktionen
     (hh_besetzung_lage, hh_besetzung_zuordnung) und schreibt nie in den Hub.
   - Das Hohe Haus (gfweekly_besetzung_aufgaben): konkrete Aufgaben mit eindeutiger Person aus gfweekly_people,
     Aufgabenstand offen / in_arbeit / erledigt / verworfen, Termin. Der Aufgabenstand ist vom Gesprächsstand getrennt.
   - Asana: erst nach ausdrücklichem Senden; danach führt Asana für „erledigt“ und den Termin (Rückweg asana_sync).

   Auth wie gfweekly und saison: Passwort im Body oder Header x-gfweekly-key gegen das Secret GFWEEKLY_PASSWORD.
   Eigene Funktion, damit die große Funktion gfweekly (parallel in Arbeit) unberührt bleibt. */
import { createClient } from 'jsr:@supabase/supabase-js@2';

const VERSION = 1;
const PASSWORD = Deno.env.get('GFWEEKLY_PASSWORD') ?? '';
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const ASANA_TOKEN = Deno.env.get('ASANA_TOKEN') ?? '';
const ASANA_WORKSPACE = Deno.env.get('ASANA_WORKSPACE') ?? '57435200923138';
const HH_BASIS = 'https://hohes-haus.netlify.app';
const HUB_BESETZUNG = 'https://habitat-hub.netlify.app/besetzung';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-gfweekly-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

const STATUS = ['offen', 'in_arbeit', 'erledigt', 'verworfen'];
const GESPRAECH_WORT: Record<string, string> = { vorgeschlagen: 'vorgeschlagen', angefragt: 'angefragt', in_verhandlung: 'in Verhandlung',
  bestaetigt: 'bestätigt (Planungsstand)', zurueckgestellt: 'zurückgestellt', abgesagt: 'abgesagt' };
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SPALTEN = 'id,zuordnung_id,angebot_id,partner_id,format_slug,jahr,bereich,titel,beschreibung,person_id,status,faellig,aus_schritt,aus_schritt_version,erstellt_von,geaendert_von,created_at,updated_at,erledigt_at,version,asana_task_gid,asana_gesendet_at,asana_gesendet_von,asana_sync_at';

const str = (v: unknown, n = 2000) => (v ?? '').toString().slice(0, n);
const who = (v: unknown) => { const s = str(v, 60).toLowerCase(); return s.includes('lea') ? 'Lea' : s.includes('alex') ? 'Alex' : ''; };
const schluessel = (t: string) => t.trim().replace(/\s+/g, ' ').toLowerCase();
const datum = (v: unknown): string | null | undefined => { if (v === undefined) return undefined; if (v === null || v === '') return null; const s = str(v, 10); return ISO.test(s) ? s : undefined; };

class Fehler extends Error { constructor(public status: number, msg: string, public extra: Record<string, unknown> = {}) { super(msg); } }

async function zuordnung(id: string) {
  const { data, error } = await db.rpc('hh_besetzung_zuordnung', { p_id: id });
  if (error) throw new Error(error.message);
  return data as any;
}
async function person(id: string) {
  const { data, error } = await db.from('gfweekly_people').select('id,name,typ,active,assignable,asana_gid').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data as any;
}
async function aufgabe(id: string) {
  const { data, error } = await db.from('gfweekly_besetzung_aufgaben').select(SPALTEN).eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data as any;
}

async function asana(pfad: string, methode = 'GET', koerper?: unknown) {
  const res = await fetch('https://app.asana.com/api/1.0' + pfad, {
    method: methode,
    headers: { 'Authorization': 'Bearer ' + ASANA_TOKEN, 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: koerper === undefined ? undefined : JSON.stringify({ data: koerper }),
  });
  const text = await res.text();
  let d: any = {}; try { d = JSON.parse(text); } catch (_e) { d = {}; }
  if (!res.ok) throw new Error(`Asana ${res.status}: ${(d?.errors?.[0]?.message) || text.slice(0, 160)}`);
  return d.data;
}

/* Rückweg aus Asana: nur für gesendete Aufgaben. Erledigt in Asana setzt erledigt im Haus, eine geänderte Fälligkeit
   übernimmt das Haus. Nichts wird gelöscht, nichts wieder geöffnet, der Gesprächsstand im Hub bleibt unberührt. */
async function asanaSync(nur?: string[]) {
  const erg = { geprueft: 0, erledigt: 0, termin: 0, fehler: 0, ohne_token: !ASANA_TOKEN };
  if (!ASANA_TOKEN) return erg;
  let q = db.from('gfweekly_besetzung_aufgaben').select(SPALTEN).not('asana_task_gid', 'is', null).neq('status', 'verworfen').limit(200);
  if (nur && nur.length) q = q.in('id', nur);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  for (const a of (data || []) as any[]) {
    erg.geprueft++;
    let t: any;
    try { t = await asana(`/tasks/${a.asana_task_gid}?opt_fields=completed,due_on`); } catch (_e) { erg.fehler++; continue; }
    const neu: Record<string, unknown> = { asana_sync_at: new Date().toISOString() };
    let geaendert = false;
    if (t?.completed && a.status !== 'erledigt') { neu.status = 'erledigt'; neu.erledigt_at = new Date().toISOString(); erg.erledigt++; geaendert = true; }
    if ((t?.due_on ?? null) !== (a.faellig ?? null)) { neu.faellig = t?.due_on ?? null; erg.termin++; geaendert = true; }
    if (geaendert) { neu.geaendert_von = 'Asana'; neu.version = a.version + 1; neu.updated_at = new Date().toISOString(); }
    const { error: e2 } = await db.from('gfweekly_besetzung_aufgaben').update(neu).eq('id', a.id).eq('version', a.version);
    if (e2) erg.fehler++;
  }
  return erg;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  let body: any; try { body = await req.json(); } catch { return json({ error: 'bad json' }, 400); }
  const given = str(body?.password, 200) || str(req.headers.get('x-gfweekly-key'), 200);
  if (!PASSWORD || given !== PASSWORD) return json({ error: 'unauthorized' }, 401);
  const action = str(body?.action, 40);
  const t = body?.payload ?? {};

  try {
    if (action === 'ping') return json({ ok: true, version: VERSION });

    /* Lage für eine Saison: Formate, Zuordnungen aus dem Hub, Aufgaben des Hauses, Personen-Pool. */
    if (action === 'lage') {
      const jahr = Number.isInteger(t.jahr) ? t.jahr : null;
      let sync: unknown = null;
      if (ASANA_TOKEN) {
        const { data: alt } = await db.from('gfweekly_besetzung_aufgaben').select('id,asana_sync_at').not('asana_task_gid', 'is', null).neq('status', 'verworfen').limit(200);
        const faellig = (alt || []).filter((x: any) => !x.asana_sync_at || Date.now() - Date.parse(x.asana_sync_at) > 60 * 60 * 1000).map((x: any) => x.id);
        if (faellig.length) { try { sync = await asanaSync(faellig.slice(0, 40)); } catch (e) { sync = { fehler: 1, text: (e as Error).message }; } }
      }
      const { data: lage, error } = await db.rpc('hh_besetzung_lage', { p_jahr: jahr });
      if (error) throw new Error(error.message);
      const [{ data: aufgaben, error: e1 }, { data: leute, error: e2 }] = await Promise.all([
        db.from('gfweekly_besetzung_aufgaben').select(SPALTEN).eq('jahr', (lage as any).jahr).order('created_at'),
        db.from('gfweekly_people').select('id,name,typ,active,assignable,asana_gid,sort_order').eq('active', true).eq('assignable', true).order('sort_order').order('name'),
      ]);
      if (e1) throw new Error(e1.message);
      if (e2) throw new Error(e2.message);
      const personen = (leute || []).map((p: any) => ({ id: p.id, name: p.name, typ: p.typ, asana: !!p.asana_gid }));
      return json({ ...(lage as any), aufgaben: aufgaben || [], personen, asana_bereit: !!ASANA_TOKEN, sync, hub: HUB_BESETZUNG, heute: new Date().toISOString().slice(0, 10) });
    }

    /* Nächsten Schritt (oder eine eigene Formulierung) als Aufgabe übernehmen. Gleicher Titel am selben Gespräch
       ergibt keine zweite Aufgabe, sondern liefert die vorhandene zurück (neu = false). */
    if (action === 'uebernehmen') {
      const W = who(t.who); if (!W) throw new Fehler(400, 'Bitte oben Alex oder Lea wählen.');
      const zid = str(t.zuordnung_id, 40); if (!UUID.test(zid)) throw new Fehler(400, 'Das Gespräch fehlt.');
      const titel = str(t.titel, 400).trim(); if (!titel || titel.length > 300) throw new Fehler(400, 'Bitte einen Aufgabentitel mit höchstens 300 Zeichen angeben.');
      const z = await zuordnung(zid); if (!z) throw new Fehler(404, 'Dieses Gespräch gibt es im Habitat Hub nicht mehr. Bitte neu laden.');
      let pid: string | null = null;
      if (t.person_id) {
        pid = str(t.person_id, 40); const p = UUID.test(pid) ? await person(pid) : null;
        if (!p || !p.active || !p.assignable) throw new Fehler(400, 'Diese Person ist im Pool nicht aktiv. Bitte eine andere wählen.');
      }
      const faellig = datum(t.faellig); if (faellig === undefined && t.faellig !== undefined) throw new Fehler(400, 'Der Termin ist kein Datum.');
      const zeile = {
        zuordnung_id: z.id, angebot_id: z.angebot_id, partner_id: z.partner_id, format_slug: z.format_slug, jahr: z.jahr, bereich: z.bereich,
        titel, beschreibung: str(t.beschreibung, 4000), person_id: pid, faellig: faellig ?? null,
        aus_schritt: str(z.naechster_schritt, 2000), aus_schritt_version: z.version, erstellt_von: W, geaendert_von: W,
      };
      const { data: ins, error } = await db.from('gfweekly_besetzung_aufgaben')
        .upsert(zeile, { onConflict: 'zuordnung_id,titel_schluessel', ignoreDuplicates: true }).select(SPALTEN);
      if (error) throw new Error(error.message);
      if (ins && ins.length) return json({ ok: true, neu: true, aufgabe: ins[0] });
      const { data: da, error: e3 } = await db.from('gfweekly_besetzung_aufgaben').select(SPALTEN).eq('zuordnung_id', z.id).eq('titel_schluessel', schluessel(titel)).maybeSingle();
      if (e3) throw new Error(e3.message);
      return json({ ok: true, neu: false, aufgabe: da });
    }

    /* Aufgabe ändern: Person, Stand, Termin, Titel, Beschreibung. Mit Versionsprüfung gegen stilles Überschreiben. */
    if (action === 'setzen') {
      const W = who(t.who); if (!W) throw new Fehler(400, 'Bitte oben Alex oder Lea wählen.');
      const id = str(t.id, 40); if (!UUID.test(id)) throw new Fehler(400, 'Die Aufgabe fehlt.');
      const v = Number(t.version); if (!Number.isInteger(v)) throw new Fehler(400, 'Der Stand der Aufgabe fehlt. Bitte neu laden.');
      const neu: Record<string, unknown> = {};
      if (t.titel !== undefined) { const ti = str(t.titel, 400).trim(); if (!ti || ti.length > 300) throw new Fehler(400, 'Bitte einen Aufgabentitel mit höchstens 300 Zeichen angeben.'); neu.titel = ti; }
      if (t.beschreibung !== undefined) neu.beschreibung = str(t.beschreibung, 4000);
      if (t.person_id !== undefined) {
        if (t.person_id === null || t.person_id === '') neu.person_id = null;
        else { const pid = str(t.person_id, 40); const p = UUID.test(pid) ? await person(pid) : null; if (!p || !p.active || !p.assignable) throw new Fehler(400, 'Diese Person ist im Pool nicht aktiv. Bitte eine andere wählen.'); neu.person_id = pid; }
      }
      if (t.status !== undefined) { if (!STATUS.includes(t.status)) throw new Fehler(400, 'Unbekannter Aufgabenstand.'); neu.status = t.status; neu.erledigt_at = t.status === 'erledigt' ? new Date().toISOString() : null; }
      if (t.faellig !== undefined) { const f = datum(t.faellig); if (f === undefined) throw new Fehler(400, 'Der Termin ist kein Datum.'); neu.faellig = f; }
      if (!Object.keys(neu).length) throw new Fehler(400, 'Nichts zu ändern.');
      const vor = await aufgabe(id); if (!vor) throw new Fehler(404, 'Diese Aufgabe gibt es nicht mehr. Bitte neu laden.');
      if (vor.asana_task_gid && neu.person_id !== undefined && neu.person_id !== vor.person_id)
        throw new Fehler(409, 'Die Aufgabe liegt schon in Asana. Eine andere Person bitte dort zuweisen oder eine neue Aufgabe anlegen.', { aktuell: vor });
      if (vor.asana_task_gid && neu.faellig !== undefined && neu.faellig !== vor.faellig)
        throw new Fehler(409, 'Die Aufgabe liegt schon in Asana. Den Termin bitte dort ändern, das Haus übernimmt ihn beim nächsten Abgleich.', { aktuell: vor });
      Object.assign(neu, { geaendert_von: W, version: v + 1, updated_at: new Date().toISOString() });
      const { data, error } = await db.from('gfweekly_besetzung_aufgaben').update(neu).eq('id', id).eq('version', v).select(SPALTEN);
      if (error) {
        if ((error as any).code === '23505') throw new Fehler(409, 'Bei diesem Gespräch gibt es schon eine Aufgabe mit diesem Titel.', { doppelt: true });
        throw new Error(error.message);
      }
      if (!data || !data.length) throw new Fehler(409, `Inzwischen hat ${vor.geaendert_von} die Aufgabe geändert. Der aktuelle Stand ist geladen, bitte noch einmal ändern.`, { aktuell: vor });
      return json({ ok: true, aufgabe: data[0] });
    }

    /* Nach Asana senden, nur mit ausdrücklicher Bestätigung und nur an eine Person mit Asana-Konto. Einmal je Aufgabe. */
    if (action === 'asana_senden') {
      const W = who(t.who); if (!W) throw new Fehler(400, 'Bitte oben Alex oder Lea wählen.');
      if (t.bestaetigt !== true) throw new Fehler(400, 'Senden nach Asana braucht eine ausdrückliche Bestätigung.');
      if (!ASANA_TOKEN) throw new Fehler(503, 'Asana ist für das Hohe Haus nicht eingerichtet. Die Aufgabe bleibt im Haus.');
      const id = str(t.id, 40); if (!UUID.test(id)) throw new Fehler(400, 'Die Aufgabe fehlt.');
      const a = await aufgabe(id); if (!a) throw new Fehler(404, 'Diese Aufgabe gibt es nicht mehr. Bitte neu laden.');
      if (a.asana_task_gid) return json({ ok: true, schon: true, aufgabe: a });
      if (!a.person_id) throw new Fehler(400, 'Erst eine Person zuweisen, dann senden.');
      const p = await person(a.person_id); if (!p?.asana_gid) throw new Fehler(400, `${p?.name || 'Diese Person'} hat kein Asana-Konto im Pool. Die Aufgabe bleibt im Haus.`);
      const z = await zuordnung(a.zuordnung_id);
      /* Sperre gegen doppeltes Senden: wer die Zeile zuerst markiert, sendet. */
      const { data: claim, error: ec } = await db.from('gfweekly_besetzung_aufgaben')
        .update({ asana_gesendet_at: new Date().toISOString(), asana_gesendet_von: W }).eq('id', id).is('asana_task_gid', null).is('asana_gesendet_at', null).select('id');
      if (ec) throw new Error(ec.message);
      if (!claim || !claim.length) throw new Fehler(409, 'Diese Aufgabe wird gerade gesendet oder wurde schon gesendet. Bitte neu laden.');
      const zeilen = [
        z ? `Aus dem Hohen Haus · Besetzung ${z.format} ${z.jahr} · ${z.bereich}` : `Aus dem Hohen Haus · Besetzung ${a.format_slug} ${a.jahr} · ${a.bereich}`,
        z ? `Gespräch: ${z.partner}${z.angebot && z.angebot !== z.partner ? ' (' + z.angebot + ')' : ''}, Stand im Habitat Hub: ${GESPRAECH_WORT[z.status] || z.status}.` : '',
        a.beschreibung ? '\n' + a.beschreibung : '',
        `\nIm Hohen Haus: ${HH_BASIS}/besetzung.html?festival=${encodeURIComponent(a.format_slug)}&aufgabe=${a.id}`,
        `Gesprächsstand und Partnerprofil: ${HUB_BESETZUNG}`,
        'Erledigt in Asana heißt erledigt im Haus. Gesprächsstand, Budget und Verträge bleiben davon unberührt.',
      ].filter(Boolean);
      let gid = '';
      try {
        const neu = await asana('/tasks', 'POST', Object.assign({ name: a.titel, notes: zeilen.join('\n'), assignee: p.asana_gid, workspace: ASANA_WORKSPACE }, a.faellig ? { due_on: a.faellig } : {}));
        gid = neu?.gid || '';
      } catch (e) {
        await db.from('gfweekly_besetzung_aufgaben').update({ asana_gesendet_at: null, asana_gesendet_von: null }).eq('id', id);
        throw new Fehler(502, 'Asana hat die Aufgabe nicht angenommen: ' + (e as Error).message);
      }
      const jetzt = await aufgabe(id);
      const { data: fertig, error: ef } = await db.from('gfweekly_besetzung_aufgaben')
        .update({ asana_task_gid: gid, asana_sync_at: new Date().toISOString(), geaendert_von: W, version: (jetzt?.version ?? a.version) + 1, updated_at: new Date().toISOString() })
        .eq('id', id).select(SPALTEN);
      if (ef) throw new Error(ef.message);
      return json({ ok: true, schon: false, aufgabe: fertig?.[0], url: `https://app.asana.com/0/0/${gid}` });
    }

    if (action === 'asana_sync') return json({ ok: true, sync: await asanaSync() });

    /* Verlauf einer Aufgabe, jüngste zuerst. */
    if (action === 'verlauf') {
      const id = str(t.id, 40); if (!UUID.test(id)) throw new Fehler(400, 'Die Aufgabe fehlt.');
      const { data, error } = await db.from('gfweekly_besetzung_aufgaben_log').select('wer,was,alt,neu,at').eq('aufgabe_id', id).order('at', { ascending: false }).limit(30);
      if (error) throw new Error(error.message);
      return json({ ok: true, verlauf: data || [] });
    }

    return json({ error: 'Unbekannte Aktion' }, 400);
  } catch (e) {
    if (e instanceof Fehler) return json({ error: e.message, ...e.extra }, e.status);
    return json({ error: (e as Error).message || 'Fehler' }, 500);
  }
});
