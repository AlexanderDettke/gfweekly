/* ===========================================================
   GF Weekly · V12 · gemeinsamer Kern
   API-Zugriff, Login-Gate, Navigation, Theme-Umschaltung, Helfer.
   Es werden bewusst KEINE apikey/Authorization-Header gesendet
   (das Supabase-Gateway lehnt sonst ab); Auth läuft über das
   Passwort im Request-Body (serverseitig in der Edge Function geprüft).
   =========================================================== */
const GF_FN = "https://bnfmupnmqyrcltrphfak.supabase.co/functions/v1/gfweekly";

/* ---- session helpers ---- */
function gfPW(){ return sessionStorage.getItem("gf_pw") || ""; }
function gfWho(){ return sessionStorage.getItem("gf_who") || "Alex"; }
function gfSetWho(w){ sessionStorage.setItem("gf_who", w); }
function gfEsc(s){ return (s||"").toString().replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }

/* ---- API ---- */
async function gfApi(action, payload){
  const res = await fetch(GF_FN, { method:"POST", headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ action, password: gfPW(), payload }) });
  let d={}; try{ d = await res.json(); }catch(e){}
  if(res.status===401) throw { auth:true };
  if(!res.ok) throw new Error(d.error || ("HTTP "+res.status));
  return d;
}

/* ---- toast ---- */
let _gft;
function gfToast(m){
  let t=document.getElementById("toast");
  if(!t){ t=document.createElement("div"); t.id="toast"; t.className="toast"; document.body.appendChild(t); }
  t.textContent=m; t.classList.add("show"); clearTimeout(_gft); _gft=setTimeout(()=>t.classList.remove("show"),2600);
}
function gfCopy(text){ try{ navigator.clipboard.writeText(text); gfToast("In die Zwischenablage kopiert"); }catch(e){ gfToast("Kopieren nicht möglich"); } }

/* ---- Theme (dark Standard / light), persistiert in localStorage ---- */
function gfTheme(){ const t=localStorage.getItem("gf_theme"); return (t==="light"||t==="dark") ? t : (t==="colorful" ? "light" : "dark"); }
function gfApplyTheme(n){ document.documentElement.dataset.theme = n; localStorage.setItem("gf_theme", n); }
/* Frühes Setzen gegen Flackern: in <head> zusätzlich inline aufrufen. */
gfApplyTheme(gfTheme());

/* ---- Login-Gate (validiert das Passwort über people_list) ---- */
function gfGate(onReady){
  const gate=document.getElementById("gate"), inp=document.getElementById("pw"), btn=document.getElementById("unlock"), err=document.getElementById("gateErr");
  async function attempt(pw){
    sessionStorage.setItem("gf_pw", pw);
    try{ await gfApi("people_list"); if(gate) gate.style.display="none"; await onReady(); }
    catch(e){ if(err) err.textContent = e.auth ? "Falsches Passwort." : ("Fehler: "+(e.message||"Verbindung")); sessionStorage.removeItem("gf_pw"); }
  }
  if(btn) btn.onclick=()=>attempt(inp.value.trim());
  if(inp) inp.addEventListener("keydown",e=>{ if(e.key==="Enter") btn.click(); });
  if(gfPW()) attempt(gfPW()); else if(inp) inp.focus();
}

/* ---- Topbar (V12): zwei ruhige Zeilen auf jeder Breite. Zeile 1 Marke + Modus + Person, Zeile 2 Navigation (+ Unternavigation rechts) ---- */
function gfMountTopbar(active){
  const el=document.getElementById("topbar"); if(!el) return;
  el.className="topbar";
  el.innerHTML=`
    <div class="tb-row tb-top">
      <a class="brand" href="index.html"><div class="mark">GF</div><div><h1>GF Weekly</h1><div class="meta">Geschäftsleitung · vertraulich</div></div></a>
      <div class="tb-ctl">
        <div class="theme-sw" id="themeSw" role="group" aria-label="Designmodus">
          <button data-th="dark" aria-label="Dunkler Modus">Dunkel</button>
          <button data-th="light" aria-label="Heller Modus">Hell</button>
        </div>
        <div class="whoami" id="whoSw" role="group" aria-label="Aktive Person"><span>als</span>
          <button data-w="Alex">Alex</button><button data-w="Lea">Lea</button>
        </div>
      </div>
    </div>
    <div class="tb-row tb-nav">
      <nav class="nav" aria-label="Hauptnavigation">
        <a href="index.html" data-k="start"><span class="lbl">Start</span></a>
        <a href="board.html" data-k="themen"><span class="lbl">Themen</span><span class="nbadge" id="themenBadge" style="display:none">0</span></a>
        <a href="seiten.html" data-k="seiten"><span class="lbl">Wichtige Seiten</span></a>
        <a href="checkin.html" data-k="checkin"><span class="lbl">Check-in</span></a>
        <a href="capture.html" data-k="capture"><span class="lbl">Eingabe</span></a>
        <a href="bearbeiten.html" data-k="edit"><span class="lbl">Bearbeiten</span></a>
      </nav>
      <div class="tb-sub" id="subnavSlot"></div>
    </div>`;
  const a=el.querySelector(`[data-k="${active}"]`); if(a){ a.classList.add("active"); a.setAttribute("aria-current","page"); }
  const cur=gfTheme();
  el.querySelectorAll("#themeSw button").forEach(b=>{ if(b.dataset.th===cur) b.classList.add("on");
    b.onclick=()=>{ gfApplyTheme(b.dataset.th); el.querySelectorAll("#themeSw button").forEach(x=>x.classList.toggle("on",x.dataset.th===b.dataset.th)); }; });
  const w0=gfWho()==="Lea"?"Lea":"Alex"; if(gfWho()!==w0) gfSetWho(w0);
  el.querySelectorAll("#whoSw button").forEach(b=>{ b.classList.toggle("on",b.dataset.w===w0);
    b.onclick=()=>{ gfSetWho(b.dataset.w); el.querySelectorAll("#whoSw button").forEach(x=>x.classList.toggle("on",x===b)); document.dispatchEvent(new CustomEvent("gf-who",{detail:b.dataset.w})); }; });
  const sub=document.getElementById("subnav"); if(sub) el.querySelector("#subnavSlot").appendChild(sub);
  if(active!=="themen") gfApi("list").then(d=>{ const n=(d.topics||[]).filter(t=>t.board_lane==="zu_besprechen" && t.kind!=="recurring").length; const b=el.querySelector("#themenBadge"); if(n>0){ b.textContent=n; b.style.display="inline-flex"; b.title=n+" Themen zu besprechen"; } }).catch(()=>{});
}

/* ---- Unternavigation „Themen": Board · Kacheln · Liste (sitzt rechts in der Navigationszeile) ---- */
function gfMountSubnav(active){
  const el=document.getElementById("subnav"); if(!el) return;
  const items=[["board","board.html?view=board","Board","Spalten nach Ablauf, Prio, Zeitraum oder Person, verschiebbar"],["kacheln","board.html?view=kacheln","Kacheln","Gruppen als Kachelraster"],["liste","cockpit.html","Liste","Ausführliche Liste mit Details, Check-in-Themen und Protokoll"]];
  el.className="subnav";
  el.innerHTML=items.map(([k,h,l,t])=>`<a href="${h}" data-k="${k}" title="${t}" class="${k===active?"on":""}">${l}</a>`).join("");
  const slot=document.getElementById("subnavSlot"); if(slot && el.parentElement!==slot) slot.appendChild(el);
}

/* ---- Kopfbild (V12): Grafik frei sichtbar, ohne Scrim und ohne Text darauf; Titel und Knöpfe stehen darunter ---- */
const GF_IMG={ tor:"/assets/img/tor-menschen.webp", ankunft:"/assets/img/ankunft.webp", kiste:"/assets/img/kiste-regen.webp", lager:"/assets/img/lager-begruessung.webp", buehne:"/assets/img/buehne-herbst.webp", lagerfeuer:"/assets/img/lagerfeuer.webp" };
const GF_IMG_ALT={ tor:"Festivaltor mit ankommenden Menschen", ankunft:"Ankunft auf dem Festivalgelände", kiste:"Kiste im Regen zwischen den Zelten", lager:"Begrüßung im Lager", buehne:"Bühne im Herbstwald", lagerfeuer:"Lagerfeuer am Abend" };
function gfMountHero(img, title, sub, opts={}){
  const el=document.getElementById("hero"); if(!el) return;
  el.className="hero"+(opts.compact?" compact":"");
  const src=GF_IMG[img]||img;
  el.innerHTML=`<figure class="hero-pic"><img src="${src}" alt="${gfEsc(GF_IMG_ALT[img]||"")}" width="1600" height="900" decoding="async" fetchpriority="high"></figure>
    <div class="hero-head"><div class="hero-text"><h2 id="heroTitle">${title}</h2>${sub?`<p id="heroSub">${sub}</p>`:""}</div>${opts.aside?`<div class="hero-aside">${opts.aside}</div>`:""}</div>`;
}
function gfHeroText(title, sub){ const t=document.getElementById("heroTitle"), s=document.getElementById("heroSub"); if(t&&title!=null) t.innerHTML=title; if(s&&sub!=null) s.innerHTML=sub; }

/* ---- Lange Texte einklappen (ab ~220 Zeichen), Zustand je Schlüssel gemerkt ---- */
const GF_CLAMP=220;
function gfClamp(text, key, limit=GF_CLAMP){
  const t=(text||"").toString(); if(t.length<=limit+40) return gfEsc(t);
  let open=false; try{ open=localStorage.getItem("gf_open_"+key)==="1"; }catch(e){}
  const cut=t.slice(0,limit).replace(/\s+\S*$/,"");
  return `<span class="clamp ${open?"open":""}" data-key="${gfEsc(key)}"><span class="c-short">${gfEsc(cut)}… </span><span class="c-full">${gfEsc(t)} </span><button type="button" class="c-more">${open?"weniger":"mehr"}</button></span>`;
}
document.addEventListener("click",e=>{
  const b=e.target.closest(".c-more"); if(!b) return;
  e.preventDefault(); e.stopPropagation();
  const c=b.closest(".clamp"); const open=!c.classList.contains("open"); c.classList.toggle("open",open); b.textContent=open?"weniger":"mehr";
  try{ localStorage.setItem("gf_open_"+c.dataset.key, open?"1":"0"); }catch(err){}
});

/* ---- Lebendigkeit: gestaffeltes Einlaufen, Zähler ---- */
function gfStagger(root, sel){
  const els=(root||document).querySelectorAll(sel); els.forEach((el,i)=>{ el.classList.add("ht-rise"); el.style.animationDelay=(Math.min(i,8)*40)+"ms"; });
}
function gfCountUp(el, to, ms=400){
  if(!el) return; const n=parseInt(to); if(isNaN(n)){ el.textContent=to; return; }
  if(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches){ el.textContent=n; return; }
  const t0=performance.now(); const from=0;
  function step(now){ const p=Math.min(1,(now-t0)/ms); const e=1-Math.pow(1-p,3); el.textContent=Math.round(from+(n-from)*e); if(p<1) requestAnimationFrame(step); }
  requestAnimationFrame(step);
}
function gfSkeleton(n=3, cls="card"){ return Array.from({length:n},()=>`<div class="skel ${cls}"><i></i><i class="w60"></i><i class="w80"></i></div>`).join(""); }

/* ---- Personen (für Delegation) ---- */
let GF_PEOPLE=[];
async function gfLoadPeople(){ try{ const d=await gfApi("people_list"); GF_PEOPLE=(d.people||[]).filter(p=>p.active!==false); }catch(e){ GF_PEOPLE=[]; } return GF_PEOPLE; }
function gfAssignable(){ return GF_PEOPLE.filter(p=>p.assignable!==false); }

/* ---- Anzeige-Helfer ---- */
const GF_REL_RANK={ kritisch:0, hoch:1, mittel:2, niedrig:3, "":4 };
const GF_PRANK={ hoch:0, mittel:1, niedrig:2 };
function gfRelLabel(r){ return r ? (r.charAt(0).toUpperCase()+r.slice(1)) : ""; }
function gfDefaultTime(t){ if(t.time_minutes) return t.time_minutes; return t.priority==="hoch"?15:(t.priority==="niedrig"?5:10); }
function gfSrcBadge(src){ return ({ki:"KI-Vorschlag",manuell:"manuell",pruefen:"prüfen",bestaetigt:"bestätigt"})[src]||src||""; }
function gfNames(s){ return (s||"").split(",").map(x=>x.trim()).filter(Boolean); }
function gfTomorrow(){ const d=new Date(Date.now()+86400000); return d.toISOString().slice(0,10); }

/* Delegations-Nachricht (kopierbar – es wird KEINE Mail automatisch versendet) */
function gfDelegationMsg(t){
  const who=t.delegate_to || t.owner || "[Name]";
  const ctx=(t.short_description || (t.context||"").split("\n")[0] || "").slice(0,240);
  return `Hi ${who},\n\nkönntest du „${t.title}" übernehmen?\nKontext: ${ctx}\nNächster Schritt: ${t.next_action||"[nächster Schritt]"}\nRückmeldung/Follow-up bis: ${t.next_suggested||gfTomorrow()}\n\nDanke dir!\n${gfWho()}`;
}
/* Asana-fertiger Text (Option B). Echte API-Anbindung: siehe README + netlify/functions/asana.js */
function gfAsanaText(t){
  return `Titel: ${t.title}\n`+
         `Zuständig: ${t.delegate_to||t.owner||"—"}\n`+
         `Fällig: ${gfTomorrow()} (morgen)\n`+
         `Kontext: ${t.short_description||(t.context||"").split("\n")[0]||"—"}\n`+
         `Empfehlung: ${t.recommendation||"—"}\n`+
         `Nächster Schritt: ${t.next_action||"—"}\n`+
         `Quelle: GF Weekly`;
}
