/* ===========================================================
   GF Weekly · Easter Eggs (V14)
   Sechs kleine Überraschungen. Alle harmlos, alle ohne Ton,
   alle respektieren prefers-reduced-motion. Zum Testen:
   ?egg=fest | ?egg=nacht | ?egg=bus | ?egg=konfetti | ?egg=moehre
   =========================================================== */
(function(){
  const REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const params = new URLSearchParams(location.search); const FORCE = params.get("egg") || "";
  const COLORS = ["var(--accent)","var(--warn)","var(--pos)","var(--info)","var(--crit)","var(--action)"];
  const $ = (s,r=document)=>r.querySelector(s);
  const ready = (fn)=>{ if(document.readyState!=="loading") fn(); else document.addEventListener("DOMContentLoaded",fn); };
  const CARROT = `<svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true"><path d="M20 6c6 4 9 3 14 0-2 8 2 10 8 12-6 2-8 6-8 12-4-4-9-4-14-2 3-5 3-10 0-22z" fill="#5c9a3a"/><path d="M34 16 12 58c0 0 22-8 40-30 4-5 4-10 0-13-4-3-12-2-18 1z" fill="#e0722d"/><path d="M28 30l10 4M22 40l12 5M18 48l8 4" stroke="#b9501a" stroke-width="2.5" stroke-linecap="round"/></svg>`;
  const BUS = `<svg viewBox="0 0 220 110" width="220" height="110" aria-hidden="true"><path d="M14 30h150l30 26v26H14z" fill="#3f7f86"/><path d="M14 52h180v12H14z" fill="#e9dfcf"/><rect x="24" y="36" width="30" height="20" fill="#cfe7ec"/><rect x="62" y="36" width="30" height="20" fill="#cfe7ec"/><rect x="100" y="36" width="30" height="20" fill="#cfe7ec"/><path d="M164 36l22 20h-22z" fill="#cfe7ec"/><rect x="30" y="18" width="110" height="12" fill="#c98a4b"/><rect x="40" y="10" width="26" height="8" fill="#e0722d"/><rect x="80" y="10" width="40" height="8" fill="#5c9a3a"/><circle cx="52" cy="84" r="14" fill="#1f1f22"/><circle cx="52" cy="84" r="6" fill="#bdbdbd"/><circle cx="160" cy="84" r="14" fill="#1f1f22"/><circle cx="160" cy="84" r="6" fill="#bdbdbd"/><rect x="190" y="60" width="6" height="8" fill="#f2c14e"/></svg>`;

  /* 1) Fünfmal auf die Fahne: Konfetti, Timer sagt „Pause?“ */
  function konfetti(){
    if(REDUCED){ toastOnce("Konfetti (ohne Bewegung, wie eingestellt)."); return; }
    const box=document.createElement("div"); box.className="egg-konfetti"; document.body.appendChild(box);
    const n=90;
    for(let i=0;i<n;i++){ const p=document.createElement("i"); p.style.left=(Math.random()*100)+"vw"; p.style.background=COLORS[i%COLORS.length]; p.style.animationDelay=(Math.random()*600)+"ms"; p.style.animationDuration=(2200+Math.random()*1400)+"ms"; p.style.transform=`rotate(${Math.random()*360}deg)`; p.style.width=(6+Math.random()*6)+"px"; box.appendChild(p); }
    setTimeout(()=>box.remove(),4200);
    const t=$("#meetTimer"); if(t){ const old=t.textContent; t.textContent="Pause?"; t.classList.add("egg-pause"); setTimeout(()=>{ t.classList.remove("egg-pause"); if(t.textContent==="Pause?") t.textContent=old; },3000); }
  }
  function wireBrand(){
    const brand=$(".brand"); if(!brand||brand.dataset.egg) return; brand.dataset.egg="1";
    let clicks=0, timer=null;
    brand.addEventListener("click",e=>{
      e.preventDefault(); clicks++; clearTimeout(timer);
      if(clicks>=5){ clicks=0; konfetti(); return; }
      timer=setTimeout(()=>{ const c=clicks; clicks=0; if(c===1) location.href=brand.getAttribute("href")||"index.html"; },380);
    });
  }

  document.addEventListener("gf-egg-konfetti",()=>konfetti()); /* V17: Stufenaufstieg im Spiel */

  /* 2) Der Bus fährt los, wenn die Agenda leer ist */
  let busDone=false;
  function bus(){
    if(busDone||REDUCED) return; busDone=true;
    const el=document.createElement("div"); el.className="egg-bus"; el.innerHTML=`<span class="egg-tuut">tuut</span>${BUS}`; document.body.appendChild(el);
    setTimeout(()=>el.remove(),7000);
  }
  document.addEventListener("gf-egg-bus",bus);

  /* 3) Nachtmodus: Sterne hinter dem Tor, Untertitel „eigentlich Feierabend“ */
  function nacht(){
    const h=new Date().getHours(); const isNight = FORCE==="nacht" || (h>=23||h<5);
    if(!isNight) return;
    const gate=$("#gate"); if(!gate) return;
    if(!$(".egg-stars",gate) && !REDUCED){ const s=document.createElement("div"); s.className="egg-stars"; for(let i=0;i<26;i++){ const st=document.createElement("i"); st.style.left=(Math.random()*100)+"%"; st.style.top=(Math.random()*38)+"%"; st.style.animationDelay=(Math.random()*4)+"s"; st.style.animationDuration=(2.4+Math.random()*2.6)+"s"; s.appendChild(st); } gate.prepend(s); }
    const sub=$(".gate-card .sub",gate); if(sub && !/Feierabend/.test(sub.textContent)) sub.textContent=sub.textContent.replace("Geschäftsleitung Wilde Möhre","Geschäftsleitung · eigentlich Feierabend");
    const meta=$(".brand .meta"); if(meta && !/Feierabend/.test(meta.textContent)) meta.textContent="Geschäftsleitung · eigentlich Feierabend";
  }

  /* 4) Möhre-Code: „möhre“ tippen */
  let buf="";
  document.addEventListener("keydown",e=>{
    if(/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    if(e.key.length!==1) return;
    buf=(buf+e.key.toLowerCase()).slice(-6);
    if(buf.endsWith("möhre")||buf.endsWith("moehre")){ buf=""; moehre(); }
  });
  function moehre(){
    const mark=$(".brand .mark"); if(mark && !mark.dataset.carrot){ mark.dataset.carrot="1"; const old=mark.innerHTML; mark.innerHTML=CARROT; mark.classList.add("egg-carrot"); setTimeout(()=>{ mark.innerHTML=old; mark.classList.remove("egg-carrot"); delete mark.dataset.carrot; },4000); }
    const els=[...document.querySelectorAll(".stat .v, .sstat .v, .nbadge")].filter(el=>/^\d+$/.test(el.textContent.trim()));
    els.forEach((el,i)=>{ const n=parseInt(el.textContent); if(REDUCED) return; setTimeout(()=>{ countTo(el,n,0,500,()=>countTo(el,0,n,700)); }, i*60); });
    toastOnce("Möhre.");
  }
  function countTo(el,from,to,ms,done){ const t0=performance.now(); function step(now){ const p=Math.min(1,(now-t0)/ms); const e=1-Math.pow(1-p,3); el.textContent=Math.round(from+(to-from)*e); if(p<1) requestAnimationFrame(step); else if(done) done(); } requestAnimationFrame(step); }

  /* 5) Rituale-Streak: alle Rituale der aktuellen Phase abgehakt */
  document.addEventListener("gf-rituals",e=>{
    const d=e.detail||{}; const old=$(".egg-badge"); if(old) old.remove();
    if(!d.isCurrent || !d.total || d.done<d.total) return;
    const h=$("#ritH"); if(!h) return;
    const b=document.createElement("span"); b.className="egg-badge"; b.title="Alle Rituale dieser Phase sind abgehakt."; b.innerHTML=`<i class="egg-fire"></i>Phase gemeistert`; h.after(b);
  });

  /* 6) Festival-Tage: Wimpelkette an der Fahne, andere Begrüßung */
  function fest(){
    const d=new Date(); const isFest = FORCE==="fest" || (d.getMonth()===7 && d.getDate()>=20 && d.getDate()<=23);
    if(!isFest) return;
    document.querySelectorAll(".mark.pic:not(.egg-fest)").forEach(m=>m.classList.add("egg-fest"));
    const fix=()=>{ const t=$("#heroTitle"); if(t && /^Guten Tag/.test(t.textContent) && !/Möhre\.$/.test(t.textContent)) t.textContent=t.textContent.replace(/\.?$/,"")+". Heute ist Möhre."; };
    fix();
    if(!fest.wired){ fest.wired=true; document.addEventListener("gf-who",()=>setTimeout(fix,0)); }
  }

  let toasted=false; function toastOnce(m){ if(typeof gfToast==="function"){ gfToast(m); } }

  /* Anlaufen: Topbar wird per JS gebaut, deshalb beobachten */
  ready(()=>{
    nacht();
    const mo=new MutationObserver(()=>{ wireBrand(); fest(); nacht(); }); mo.observe(document.body,{childList:true,subtree:true});
    wireBrand(); fest();
    if(FORCE==="konfetti") setTimeout(konfetti,800);
    if(FORCE==="bus") setTimeout(bus,800);
    if(FORCE==="moehre") setTimeout(moehre,1200);
  });
})();
