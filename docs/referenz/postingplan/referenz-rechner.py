# Referenz-Rechner: liest das Regelwerk und berechnet Aufgaben für ein Festival (Rückwärtsrechnung).
import json, csv, sys, datetime as dt
from collections import defaultdict

RW = json.load(open("habitat-postingplan-regelwerk.json"))
HEUTE = dt.date(2026, 10, 5)
D = dt.date.fromisoformat
FEIERTAGE = {D(x) for x in RW["verbund_2027"]["feiertage"]}
STICHTAG = D(RW["verbund_2027"]["stichtag_vorproduktion"])
FENSTER = RW["verbund_2027"]["vorproduktion_fenster_tage"]
SAISON_START = min(D(f["F"]) for f in RW["festivals_2027"]) - dt.timedelta(21)
ROLLE_NAME = {r["id"]: r["name"] for r in RW["rollen"]}

def werktag(d):
    while d.weekday() >= 5 or d in FEIERTAGE:
        d -= dt.timedelta(1)
    return d

def offs(base, n):
    return base + dt.timedelta(n)

def berechne(fid):
    f = next(x for x in RW["festivals_2027"] if x["id"] == fid)
    V, F, Z = D(f["V"]), D(f["F"]), D(f["Z"])
    merk = dict(f["merkmale"]); merk["budget_freigegeben"] = True; merk["testkauf_erfolgreich"] = True; merk["angebot_freigegeben"] = False
    ev = {"V": [V], "F": [F], "Z": [Z], "R": [Z + dt.timedelta(60)], "L": [V],
          "P": [offs(F, n) for n in (-200, -150, -100, -45)],
          "S-BF": [D("2026-11-27")], "S-XMAS": [D("2026-12-15")],
          "S-NL": [D(x) for x in ("2027-01-20", "2027-03-17", "2027-04-28")]}
    if f.get("A"): ev["A"] = [D(f["A"])]
    offen = ["D-PREIS (Preiswechsel)", "D-ADDON (Buchungsschlüsse)", "D-TRANSFER (Ticketumschreibung)", "B-OPEN/D-BEW (Bewerbungen)", "G (begleitende Veranstaltungen)", "A (Aufbaubeginn)", "L (eigener Launch, hier gleich V gesetzt)"]
    pubs = []
    for r in RW["regeln"]:
        if r["id"] == "SLOT" or r["bezug"] not in ev: continue
        if r.get("bedingung") and not merk.get(r["bedingung"], False): continue
        for n, e in enumerate(ev[r["bezug"]], 1):
            T = offs(e, r["abstand"])
            pubs.append({"regel": r, "T": T, "nr": n})
    # Zusammenführen: L und V am selben Tag
    ids = {(p["regel"]["id"], p["T"]) for p in pubs}
    drop = set()
    if ev["L"][0] == V:
        drop |= {"L-HAUPT", "L-NEUGIER"}  # in V-START bzw. V-ANK enthalten
    pubs = [p for p in pubs if p["regel"]["id"] not in drop]
    # Slots ergänzen
    feeds = sorted(p["T"] for p in pubs if p["regel"]["kanal"] in ("feed", "reel"))
    def rate(d):
        if d < V + dt.timedelta(28): return 1.25
        if d < F - dt.timedelta(150): return 0.6
        if d < F - dt.timedelta(60): return 1.0
        if d < F: return 2.0
        if d <= Z: return 0
        if d <= Z + dt.timedelta(30): return 1.25
        return 0
    themen = ["erlebnis", "menschen", "entscheidung", "orientierung"]
    genutzt = defaultdict(int)
    acc, d, k = 0.0, max(HEUTE, V), 0
    slotregel = next(r for r in RW["regeln"] if r["id"] == "SLOT")
    while d <= Z + dt.timedelta(30):
        acc += rate(d) / 7
        if any(abs((d - x).days) <= 0 for x in feeds):
            acc -= 1
        elif acc >= 1 and not any(abs((d - x).days) <= 2 for x in feeds):
            kl = "S" if k % 5 in (0, 2, 4) else "M"
            fx = (d - F).days
            kand = [t for t in RW["themenbibliothek"] if t.get("slot") and t["slot"]["von"] <= fx <= t["slot"]["bis"]]
            if kand:
                t = min(kand, key=lambda t: (genutzt[t["id"]], t["id"])); genutzt[t["id"]] += 1
                r = {**slotregel, "klasse": kl, "abstand": 0, "bezug": "phase", "thema": t["id"], "titel": f'{t["titel"]} ({t["id"]})', "inhalt": t["inhalt"]}
            else:
                r = {**slotregel, "klasse": kl, "abstand": 0, "bezug": "phase", "thema": themen[k % 4], "titel": "Redaktionsslot " + themen[k % 4]}
            pubs.append({"regel": r, "T": d, "nr": k + 1}); feeds.append(d); k += 1; acc -= 1
        d += dt.timedelta(1)
    # Prüfpunkte
    pp = [offs(V, 7), offs(V, 28)]
    x = offs(V, 56)
    while x < offs(F, -90): pp.append(x); x += dt.timedelta(28)
    pp += [offs(F, n) for n in (-90, -60, -45, -30, -21)]
    for i, t in enumerate(sorted(set(pp)), 1):
        r = {"id": "PRUEF", "bezug": "pruefpunkt", "abstand": 0, "klasse": "INT", "titel": "Prüfpunkt Verkauf gegen Zielpfad", "kanal": "intern",
             "schritte": [{"id": "I1", "phase": "nachbereitung", "titel": "Verkauf, Fragen, Reichweite prüfen; Stufe festlegen; Extras auswählen", "rolle": "KOM", "werkzeug": None, "von": 0, "bis": 0, "stunden": 0.5, "werktag": True}]}
        pubs.append({"regel": r, "T": t, "nr": i})
    # begleitende Website-Updates
    extra = []
    for p in pubs:
        if "website" in p["regel"].get("begleitend", []):
            r = {"id": p["regel"]["id"] + "-WEB", "bezug": p["regel"]["bezug"], "abstand": p["regel"].get("abstand", 0), "klasse": "WEB",
                 "titel": "Website zu: " + p["regel"]["titel"], "kanal": "website", "fachfreigabe": p["regel"].get("fachfreigabe", "KOM")}
            extra.append({"regel": r, "T": p["T"], "nr": p["nr"]})
    pubs += extra
    # Schritte
    rows, aufgaben = [], []
    vz = sorted([(p["regel"]["id"], p["T"]) for p in pubs if p["T"] >= SAISON_START and p["regel"]["klasse"] in ("M", "P", "L")], key=lambda x: x[1])
    vorzieh_rang = {k: i for i, k in enumerate(vz)}
    vergangen = [p for p in pubs if (p["T"] < HEUTE and p["regel"]["id"] != "V-SHOP") or (p["regel"]["id"] == "V-SHOP" and V < HEUTE)]
    pubs = [p for p in pubs if p not in vergangen]
    for p in sorted(pubs, key=lambda p: (p["T"], p["regel"]["id"])):
        r, T = p["regel"], p["T"]
        kl = r["klasse"]
        kanal = r.get("kanal", "")
        bez = r["bezug"] + (str(p["nr"]) if r["bezug"] in ("P", "S-NL") or r["id"] in ("SLOT", "PRUEF") else "")
        aid = f'{fid}-2027-{r["id"]}-{bez}-{kanal}'
        schritte = r.get("schritte") or RW["klassen"][kl]["schritte"]
        base = T
        if kl == "INT" and r["id"] == "V-SHOP": base = T
        steps = []
        for s in schritte:
            if "wiederholung" in s:
                ende = T + dt.timedelta(r.get("laufzeit_tage", 28))
                w = T + dt.timedelta(7); n = 0
                while w <= ende:
                    steps.append({**s, "start": werktag(w), "faellig": werktag(w), "stunden": s["stunden_je_wiederholung"], "titel": s["titel"] + f" (Woche {n+1})", "id": f'{s["id"]}w{n+1}'}); w += dt.timedelta(7); n += 1
                continue
            a, b = s["von"], s["bis"]
            if isinstance(a, str):  # ende+3
                ende = T + dt.timedelta(r.get("laufzeit_tage", 28)); a = b = (ende - T).days + 3
            st, fa = offs(base, a), offs(base, b)
            if s.get("werktag", True): st, fa = werktag(st), werktag(fa)
            rolle = s["rolle"]
            if rolle in (None, "{fachfreigabe}"): rolle = r.get("fachfreigabe", "KOM")
            steps.append({**s, "start": st, "faellig": fa, "rolle": rolle})
        if "story" in r.get("begleitend", []):
            steps.append({"id": "X9", "phase": "posting", "titel": "Story begleitend ausspielen", "rolle": "CM", "werkzeug": "GEN-CONTENT", "start": T, "faellig": T, "stunden": 0.5})
        # Verbund-Stichtag
        hinweis = ""
        if T >= SAISON_START and kl in ("M", "P", "L"):
            betroffen = [s for s in steps if s["phase"] in ("planung", "erstellung", "abstimmung")]
            spaet = max(s["faellig"] for s in betroffen)
            if spaet > STICHTAG:
                # gleichmäßig über das Vorproduktionsfenster verteilen, früheste Veröffentlichung zuerst
                i = vorzieh_rang[(r["id"], T)]
                ziel = STICHTAG - dt.timedelta(FENSTER) + dt.timedelta(round((i + 1) * FENSTER / max(1, len(vorzieh_rang))))
                delta = min(ziel, STICHTAG) - spaet
                for s in betroffen:
                    s["start"] = werktag(s["start"] + delta); s["faellig"] = werktag(s["faellig"] + delta)
                steps.append({"id": "E9", "phase": "erstellung", "titel": "Fakten aktualisieren und Fassung finalisieren", "rolle": "RED", "werkzeug": "GEN-TEXT", "start": werktag(offs(T, -7)), "faellig": werktag(offs(T, -6)), "stunden": 0.5})
                hinweis = f"vorgezogen auf Stichtag {STICHTAG.strftime('%d.%m.')}"
        steps.sort(key=lambda s: (s["start"], s["faellig"]))
        h = sum(s["stunden"] for s in steps)
        ueber = any(s["faellig"] < HEUTE for s in steps)
        aufgaben.append({"id": aid, "regel": r["id"], "titel": r["titel"], "kanal": kanal, "klasse": kl, "T": T, "stunden": h, "steps": steps})
        rows.append({"aufgabe_id": aid, "eltern_id": "", "festival": f["name"], "ausgabe": 2027, "regel_id": r["id"], "titel": r["titel"], "schritt": "", "phase": "", "rolle": "KOM", "person": "", "werkzeug": "",
                     "start": min(s["start"] for s in steps).isoformat(), "faellig": (max(s["faellig"] for s in steps) if kl == "INT" else T).isoformat(), "stunden": round(h, 2), "kanal": kanal, "klasse": kl, "bezug": r["bezug"], "abstand": r.get("abstand", 0),
                     "veroeffentlichung": T.isoformat(), "status": "ueberfaellig" if T < HEUTE else ("teilweise_ueberfaellig" if ueber else "offen"), "hinweis": hinweis})
        for s in steps:
            rows.append({"aufgabe_id": f'{aid}-{s["id"]}', "eltern_id": aid, "festival": f["name"], "ausgabe": 2027, "regel_id": r["id"], "titel": s["titel"], "schritt": s["id"], "phase": s["phase"], "rolle": s["rolle"], "person": "",
                         "werkzeug": s.get("werkzeug") or "", "start": s["start"].isoformat(), "faellig": s["faellig"].isoformat(), "stunden": s["stunden"], "kanal": kanal, "klasse": kl, "bezug": r["bezug"], "abstand": r.get("abstand", 0),
                         "veroeffentlichung": T.isoformat(), "status": "ueberfaellig" if s["faellig"] < HEUTE else "offen", "hinweis": ""})
    # Wochenaufgaben je Phase als wiederkehrende Aufgabe
    grenzen = [("winterruhe", max(HEUTE, V + dt.timedelta(28)), F - dt.timedelta(150)), ("programmaufbau", F - dt.timedelta(150), F - dt.timedelta(60)),
               ("heisse_phase", F - dt.timedelta(60), F - dt.timedelta(7)), ("festival", F - dt.timedelta(7), Z + dt.timedelta(1)), ("nachbereitung", Z + dt.timedelta(1), Z + dt.timedelta(15))]
    if V + dt.timedelta(28) > HEUTE:
        grenzen.insert(0, ("verkaufsstart", max(HEUTE, V), V + dt.timedelta(28)))
    wochen_h = 0.0
    for wa in RW["wochenaufgaben"]:
        pid = f'{fid}-2027-{wa["id"]}'
        rows.append({"aufgabe_id": pid, "eltern_id": "", "festival": f["name"], "ausgabe": 2027, "regel_id": wa["id"], "titel": wa["titel"], "schritt": "", "phase": "", "rolle": wa["rolle"], "person": "", "werkzeug": wa.get("werkzeug") or "",
                     "start": grenzen[0][1].isoformat(), "faellig": grenzen[-1][2].isoformat(), "stunden": "", "kanal": "laufend", "klasse": "WOCHE", "bezug": "phase", "abstand": "", "veroeffentlichung": "", "status": "offen", "hinweis": "wiederkehrend wöchentlich"})
        for ph, a, b in grenzen:
            if b <= a: continue
            rate = wa["stunden_je_woche"].get(ph, wa["stunden_je_woche"].get("alle_aktiven_phasen", wa["stunden_je_woche"].get("programmaufbau", 1.0)))
            wochen = (b - a).days / 7; wochen_h += rate * wochen
            rows.append({"aufgabe_id": f"{pid}-{ph}", "eltern_id": pid, "festival": f["name"], "ausgabe": 2027, "regel_id": wa["id"], "titel": f'{wa["titel"]} ({ph.replace("_", " ")})', "schritt": ph, "phase": "laufend", "rolle": wa["rolle"], "person": "", "werkzeug": wa.get("werkzeug") or "",
                         "start": a.isoformat(), "faellig": b.isoformat(), "stunden": round(rate * wochen, 1), "kanal": "laufend", "klasse": "WOCHE", "bezug": "phase", "abstand": "", "veroeffentlichung": "", "status": "offen", "hinweis": f"{rate} h pro Woche"})
    return f, aufgaben, rows, offen, vergangen, wochen_h

if __name__ == "__main__":
    fid = sys.argv[1] if len(sys.argv) > 1 else "lus"
    f, aufgaben, rows, offen, vergangen, wochen_h = berechne(fid)
    with open(f"beispiel-{fid}-2027-aufgaben.csv", "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=RW["export"]["csv_spalten"]); w.writeheader(); w.writerows(rows)
    pubs = [a for a in aufgaben if a["kanal"] not in ("intern", "brief_und_mail", "story_app")]
    print(f["name"], "Hauptaufgaben", len(aufgaben), "davon Veröffentlichungen", len(pubs), "Schritte", sum(len(a["steps"]) for a in aufgaben))
    by = defaultdict(int)
    for a in aufgaben: by[a["klasse"]] += 1
    print(dict(by))
    print("Stunden Aufgaben", round(sum(a["stunden"] for a in aufgaben)), "Wochenaufgaben", round(wochen_h), "vergangen übersprungen", len(vergangen))
    rh = defaultdict(float)
    for a in aufgaben:
        for s in a["steps"]: rh[s["rolle"]] += s["stunden"]
    print({k: round(v) for k, v in sorted(rh.items(), key=lambda x: -x[1])})
    print("überfällige Schritte", sum(1 for r in rows if r["eltern_id"] and r["status"] == "ueberfaellig"))
    print("vorgezogen", sum(1 for a in aufgaben for s in a["steps"] if s["id"] == "E9"))
    # Werktagsprüfung
    bad = [r for r in rows if r["eltern_id"] and r["phase"] in ("planung", "erstellung", "abstimmung", "freigabe") and (D(r["faellig"]).weekday() >= 5 or D(r["faellig"]) in FEIERTAGE)]
    print("Freigabe/Erstellung am Wochenende:", len(bad))
