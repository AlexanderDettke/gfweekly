"""UI-Probe besetzung.html gegen ein nachgebildetes Backend (Logik wie die Edge Function „besetzung“:
Dedup über Gespräch + normalisierten Titel, Versionsprüfung, Asana nur mit bestaetigt=true).
Das echte Backend wurde separat per pg_net geprüft. Aufruf: python3 ui_test.py"""
import json, re, uuid, copy, threading, http.server, socketserver, functools, sys, os
from playwright.sync_api import sync_playwright

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'site')
PORT = 8766
BER = ["Konzept und Kuration","Programm und Booking","Gestaltung","Workshops und Rahmenprogramm","Marketing und Community","Produktion"]
P = lambda i,n,t,a: {"id":i,"name":n,"typ":t,"asana":a}
FIX = {
 "jahr":2027,"jahre":[2027],"heute":"2026-10-02","asana_bereit":True,"sync":None,"hub":"https://habitat-hub.netlify.app/besetzung",
 "bestand":{"partner":207,"angebote":233},
 "formate":[{"slug":s,"name":n,"konzept_da":k,"bereiche":BER} for s,n,k in [("by-nature","by nature",True),("fluidity","Fluidity",True),("jugendfestival","Jugendfestival",False),("lusatia","Lusatia",True),("family","Malina, Morio & die Draußenbande",True),("praerie","Praerie",False),("wellness-retreat","Wellness-Retreat",False),("wilde-moehre","Wilde Möhre",True)]],
 "zuordnungen":[
  {"id":"258576af-b1b5-4004-b99c-041fd2e1d1b0","format_slug":"lusatia","jahr":2027,"bereich":"Konzept und Kuration","status":"in_verhandlung","partner":"Subardo","angebot":"Subardo","verantwortlich":"Alexander","naechster_schritt":"Crewvorschlag zu Floors, Sound, Budget und Bar einholen. Terminwiderspruch klären.","faellig":None,"version":1,"updated_at":"2026-10-02T04:55:30Z","geaendert_von":"Alexander","notizen":0,"gesperrt":False},
  {"id":"154ea445-48d9-4b4a-82d8-8db3f5162c7f","format_slug":"lusatia","jahr":2027,"bereich":"Programm und Booking","status":"in_verhandlung","partner":"The Saturday / Jane","angebot":"Aufbauhilfe für Programm und Bookingarchitektur","verantwortlich":"Lea","naechster_schritt":"Mit Jessi Programmarchitektur und Vertragsstandard abstimmen. Honorar, Vertragspartner und Datenlogik klären.","faellig":None,"version":1,"updated_at":"2026-10-02T04:55:30Z","geaendert_von":"Alexander","notizen":0,"gesperrt":False},
  {"id":"ee571562-2560-4a4a-aece-7cba54e050c9","format_slug":"family","jahr":2027,"bereich":"Konzept und Kuration","status":"abgesagt","partner":"Björn Oesingmann","angebot":"Björn Oesingmann","verantwortlich":"Lea","naechster_schritt":"Rechte am Namen und an der Figurenwelt separat klären. Das Familienfestival wird selbst produziert.","faellig":None,"version":1,"updated_at":"2026-10-02T04:55:30Z","geaendert_von":"Alexander","notizen":0,"gesperrt":True},
  {"id":"7e22f347-fa94-43b7-a62f-5915c678423b","format_slug":"by-nature","jahr":2027,"bereich":"Workshops und Rahmenprogramm","status":"angefragt","partner":"Natural High","angebot":"Natural High","verantwortlich":"Alexander","naechster_schritt":"Chris nach einem konkreten Pilotbeitrag, Qualität und Ressourcen fragen.","faellig":"2026-10-15","version":1,"updated_at":"2026-10-02T04:55:30Z","geaendert_von":"Alexander","notizen":2,"gesperrt":False},
 ],
 "aufgaben":[
  {"id":"a0000000-0000-4000-8000-000000000001","zuordnung_id":"ee571562-2560-4a4a-aece-7cba54e050c9","format_slug":"family","jahr":2027,"bereich":"Konzept und Kuration","titel":"Namensrechte prüfen lassen","beschreibung":"","person_id":"faea951c-2bff-4c25-b1b7-53a7e741a58b","status":"offen","faellig":"2026-09-30","erstellt_von":"Lea","geaendert_von":"Lea","created_at":"2026-10-01T08:00:00Z","updated_at":"2026-10-01T08:00:00Z","version":1,"asana_task_gid":None,"asana_gesendet_at":None},
 ],
 "personen":[P("3b1a1d8b-a295-4e31-bacd-b2eee6855c96","Alexander Dettke","gf",True),P("faea951c-2bff-4c25-b1b7-53a7e741a58b","Lea Luce","gf",True),
   P("03152240-8e49-44ab-b4cf-62c3cfaf59d7","Jessica Seiler","team",True),P("58887e31-ec81-42fb-b46d-d407bc6d320f","Helge","team",True),
   P("1b511023-087b-4a7d-88bd-2bedb488c97e","Nina","minijob",False),P("84fe6413-502d-4965-9dbd-13415c63cf17","Subardo","partner",False),
   P("cbaa602f-5f2e-4378-89e9-07c1b67e151e","Slawik Snitkowski","extern",True)],
}
STATE = copy.deepcopy(FIX)
CALLS = []
key = lambda t: re.sub(r'\s+',' ',t.strip()).lower()

def backend(action, p):
    CALLS.append((action, p))
    if action == 'lage': return 200, STATE
    if action == 'uebernehmen':
        z = next((z for z in STATE['zuordnungen'] if z['id']==p['zuordnung_id']), None)
        if not z: return 404, {"error":"Dieses Gespräch gibt es im Habitat Hub nicht mehr. Bitte neu laden."}
        da = next((a for a in STATE['aufgaben'] if a['zuordnung_id']==z['id'] and key(a['titel'])==key(p['titel'])), None)
        if da: return 200, {"ok":True,"neu":False,"aufgabe":da}
        a = {"id":str(uuid.uuid4()),"zuordnung_id":z['id'],"format_slug":z['format_slug'],"jahr":z['jahr'],"bereich":z['bereich'],"titel":p['titel'].strip(),
             "beschreibung":p.get('beschreibung',''),"person_id":p.get('person_id'),"status":"offen","faellig":p.get('faellig'),"erstellt_von":p['who'],"geaendert_von":p['who'],
             "created_at":"2026-10-02T09:00:00Z","updated_at":"2026-10-02T09:00:00Z","version":1,"asana_task_gid":None,"asana_gesendet_at":None}
        STATE['aufgaben'].append(a); return 200, {"ok":True,"neu":True,"aufgabe":a}
    if action == 'setzen':
        a = next((a for a in STATE['aufgaben'] if a['id']==p['id']), None)
        if a['version'] != p['version']: return 409, {"error":f"Inzwischen hat {a['geaendert_von']} die Aufgabe geändert. Der aktuelle Stand ist geladen, bitte noch einmal ändern.","aktuell":a}
        for k in ('titel','person_id','status','faellig','beschreibung'):
            if k in p: a[k] = p[k]
        a['version'] += 1; a['geaendert_von'] = p['who']; a['updated_at'] = "2026-10-02T09:05:00Z"
        return 200, {"ok":True,"aufgabe":a}
    if action == 'asana_senden':
        if p.get('bestaetigt') is not True: return 400, {"error":"Senden nach Asana braucht eine ausdrückliche Bestätigung."}
        a = next(a for a in STATE['aufgaben'] if a['id']==p['id'])
        if a['asana_task_gid']: return 200, {"ok":True,"schon":True,"aufgabe":a}
        a['asana_task_gid'] = "1209999999999"; a['asana_gesendet_at'] = "2026-10-02T09:10:00Z"; a['version'] += 1
        return 200, {"ok":True,"schon":False,"aufgabe":a}
    return 400, {"error":"Unbekannte Aktion"}

def gf_backend(action, p):
    if action == 'list': return 200, {"topics":[]}
    if action == 'news_list': return 200, {"items":[]}
    if action in ('people_list',): return 200, {"people":[]}
    return 200, {}

class Leise(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
def serve():
    h = functools.partial(Leise, directory=ROOT)
    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.TCPServer(("127.0.0.1", PORT), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv

def route(r):
    url = r.request.url
    if r.request.method == 'OPTIONS': return r.fulfill(status=200, body='ok')
    body = json.loads(r.request.post_data or '{}')
    fn = backend if url.endswith('/besetzung') else gf_backend
    st, d = fn(body.get('action'), body.get('payload') or {})
    r.fulfill(status=st, content_type='application/json', body=json.dumps(d))

OUT = os.path.join('/tmp', 'besetzung-probe'); os.makedirs(OUT, exist_ok=True)
fehler = []
def check(cond, msg):
    print(('OK   ' if cond else 'FEHL ') + msg)
    if not cond: fehler.append(msg)

srv = serve()
with sync_playwright() as pw:
    br = pw.chromium.launch()
    for w,h,theme in [(1440,1000,'dark'),(390,844,'light')]:
        STATE = copy.deepcopy(FIX); CALLS.clear()
        ctx = br.new_context(viewport={"width":w,"height":h})
        ctx.add_init_script(f"sessionStorage.setItem('gf_pw','x');sessionStorage.setItem('gf_who','Lea');localStorage.setItem('gf_theme','{theme}');localStorage.setItem('gf_ci_Lea_2026-10-02','1');localStorage.setItem('gf_ci_Alex_2026-10-02','1');")
        ctx.route(re.compile(r'.*supabase\.co/functions/v1/.*'), route)
        page = ctx.new_page(); cons = []
        page.on('console', lambda m: cons.append(m.text) if m.type=='error' else None)
        page.on('pageerror', lambda e: cons.append(str(e)))
        page.goto(f'http://127.0.0.1:{PORT}/besetzung.html?festival=lusatia')
        page.wait_for_selector('.bz-gs')
        tag = f'{w}-{theme}'
        page.screenshot(path=f'{OUT}/start-{tag}.png', full_page=True)
        check('lusatia' in page.inner_text('#bzStand').lower(), f'{tag}: Festival aus ?festival gewählt')
        check(page.locator('.sb-nav a[data-k="besetzung"].active').count()==1, f'{tag}: Navigationseintrag Besetzung aktiv')
        check(page.locator('#z-258576af-b1b5-4004-b99c-041fd2e1d1b0').count()==1, f'{tag}: Subardo-Gespräch sichtbar')
        check('noch kein Gespräch' in page.inner_text('#bzBereiche'), f'{tag}: unbesetzte Bereiche benannt')
        # Übernehmen: Formular mit Vorschlag
        gs = page.locator('#z-258576af-b1b5-4004-b99c-041fd2e1d1b0')
        gs.locator('[data-act="form-auf"]').click()
        ta = gs.locator('textarea[name="titel"]')
        check(ta.input_value().startswith('Crewvorschlag'), f'{tag}: Titel aus nächstem Schritt vorgeschlagen')
        ta.fill('Vorschlag zu Floors und Produktionsumfang einholen')
        gs.locator('[data-pwahl="neu"][data-pid="faea951c-2bff-4c25-b1b7-53a7e741a58b"]').click()
        check(gs.locator('[data-pwahl="neu"][data-pid="faea951c-2bff-4c25-b1b7-53a7e741a58b"][aria-pressed="true"]').count()==1, f'{tag}: Person Lea gewählt, Titel bleibt')
        check(gs.locator('textarea[name="titel"]').input_value()=='Vorschlag zu Floors und Produktionsumfang einholen', f'{tag}: Titel nach Personenwahl erhalten')
        page.screenshot(path=f'{OUT}/formular-{tag}.png', full_page=True)
        gs.locator('button[type="submit"]').click()
        page.wait_for_selector('.bz-a.ziel')
        check(len([c for c in CALLS if c[0]=='uebernehmen'])==1, f'{tag}: ein Aufruf uebernehmen')
        check('Lea Luce' in gs.inner_text(), f'{tag}: Aufgabe zeigt Lea Luce')
        # Zweite Aufgabe, ohne Person
        gs.locator('[data-act="form-auf"]').click()
        gs.locator('textarea[name="titel"]').fill('Technische Anforderungen abstimmen')
        gs.locator('button[type="submit"]').click(); page.wait_for_timeout(300)
        # Wiederholt übernehmen mit gleichem Titel (andere Schreibweise)
        gs.locator('[data-act="form-auf"]').click()
        gs.locator('textarea[name="titel"]').fill('  vorschlag zu floors und  Produktionsumfang einholen ')
        gs.locator('button[type="submit"]').click(); page.wait_for_timeout(300)
        n = len([a for a in STATE['aufgaben'] if a['zuordnung_id']=='258576af-b1b5-4004-b99c-041fd2e1d1b0'])
        check(n==2, f'{tag}: zwei unterschiedliche Aufgaben, keine Dublette (n={n})')
        check('gab es schon' in page.inner_text('#toast'), f'{tag}: Hinweis „gab es schon“')
        # Gesprächsstand bleibt, Aufgabenstand ändern
        a1 = next(a for a in STATE['aufgaben'] if a['titel'].startswith('Vorschlag'))
        page.locator(f'#a-{a1["id"]} .fchips .chip[data-v="erledigt"]').click(); page.wait_for_timeout(300)
        check(a1['status']=='erledigt', f'{tag}: Aufgabenstand erledigt gespeichert')
        check(STATE['zuordnungen'][0]['status']=='in_verhandlung' and 'in Verhandlung' in gs.inner_text(), f'{tag}: Gesprächsstand unverändert in Verhandlung')
        # Person an unbesetzter Aufgabe wählen
        a2 = next(a for a in STATE['aufgaben'] if a['titel'].startswith('Technische'))
        page.locator(f'#a-{a2["id"]} [data-act="pers-auf"]').click()
        page.locator(f'#a-{a2["id"]} [data-such]').fill('hel')
        page.locator(f'#a-{a2["id"]} [data-pwahl][data-pid="58887e31-ec81-42fb-b46d-d407bc6d320f"]').click(); page.wait_for_timeout(300)
        check(a2['person_id']=='58887e31-ec81-42fb-b46d-d407bc6d320f', f'{tag}: Person per Suche zugewiesen (Helge)')
        # Versionskonflikt: Fremdänderung im Hintergrund
        a2['version'] += 1; a2['geaendert_von'] = 'Alex'; a2['status'] = 'in_arbeit'
        page.locator(f'#a-{a2["id"]} .fchips .chip[data-v="erledigt"]').click(); page.wait_for_timeout(300)
        check('Inzwischen hat Alex' in page.inner_text('#toast'), f'{tag}: Konflikt verständlich gemeldet')
        check(a2['status']=='in_arbeit', f'{tag}: Fremdänderung nicht überschrieben')
        check(page.locator(f'#a-{a2["id"]} .fchips .chip.on').get_attribute('data-v')=='in_arbeit', f'{tag}: aktueller Stand nach Konflikt angezeigt')
        # Asana: zweistufig
        page.locator(f'#a-{a2["id"]} [data-act="asana-frage"]').click()
        check(not any(c[0]=='asana_senden' for c in CALLS), f'{tag}: erster Klick sendet nichts')
        page.screenshot(path=f'{OUT}/asana-{tag}.png', full_page=True)
        page.locator(f'#a-{a2["id"]} [data-act="asana-senden"]').click(); page.wait_for_timeout(300)
        check(a2['asana_task_gid'] is not None and 'in Asana' in page.locator(f'#a-{a2["id"]}').inner_text(), f'{tag}: nach Bestätigung in Asana')
        # Neuladen: Aufgaben wiederfinden
        page.reload(); page.wait_for_selector('.bz-gs')
        txt = page.inner_text('#bzBereiche')
        check('Vorschlag zu Floors' in txt and 'Technische Anforderungen' in txt, f'{tag}: nach Neuladen wiedergefunden')
        check('Lea Luce' in page.inner_text('#bzLast') or 'Helge' in page.inner_text('#bzLast'), f'{tag}: Wer trägt was gefüllt')
        page.screenshot(path=f'{OUT}/neuladen-{tag}.png', full_page=True)
        # Familienfestival: Absage-Hinweis
        page.locator('[data-fest="family"]').click(); page.wait_for_timeout(200)
        check('Eine Absage erledigt Aufgaben nicht automatisch' in page.inner_text('#bzHinweise'), f'{tag}: Hinweis Absage mit offenen Aufgaben')
        check('überfällig' in page.inner_text('#bzBereiche'), f'{tag}: überfälliger Termin als Wort')
        page.screenshot(path=f'{OUT}/family-{tag}.png', full_page=True)
        # Deep-Link aus Asana
        page.goto(f'http://127.0.0.1:{PORT}/besetzung.html?aufgabe=a0000000-0000-4000-8000-000000000001'); page.wait_for_selector('.bz-a.ziel')
        check('malina' in page.inner_text('#bzStand').lower(), f'{tag}: Link ?aufgabe= öffnet richtiges Festival')
        # Querformat ohne horizontales Scrollen
        sw = page.evaluate('document.documentElement.scrollWidth'); check(sw <= w+1, f'{tag}: keine waagerechte Scrollbreite ({sw})')
        cons=[c for c in cons if not ('404' in c or '409' in c)]; check(not cons, f'{tag}: keine Konsolenfehler {cons[:3]}')
        ctx.close()
    br.close()
srv.shutdown()
print('\nBEFUNDE:', len(fehler)); sys.exit(1 if fehler else 0)
