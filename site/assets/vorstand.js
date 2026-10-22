/* Kompass Vorstandsbüro. Gemeinsame Daten kommen ausschließlich vom geschützten Server. */
(() => {
  const ENDPOINT='https://bnfmupnmqyrcltrphfak.supabase.co/functions/v1/vorstand';
  const LABELS={pruefen:'Zu prüfen',in_bearbeitung:'In Bearbeitung',wartet:'Wartet',erledigt:'Erledigt'};
  const esc=s=>gfEsc(s==null?'':String(s));
  const date=s=>s?new Date(s).toLocaleString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}):'';
  async function api(action,payload={}) {
    const r=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,password:gfPW(),payload:{...payload,by:gfWho()==='Lea'?'Lea':'Alex'}}),signal:AbortSignal.timeout(45000)});
    let d;try{d=await r.json();}catch{throw new Error('Der Server hat die Aktion nicht eindeutig bestätigt.');}
    if(!r.ok){const e=new Error(d.error||'Die Aktion konnte nicht bestätigt werden.');e.status=r.status;e.item=d.item;throw e;}return d;
  }
  function summary(items) {const open=items.filter(x=>x.status!=='erledigt');return {open:open.length,urgent:open.filter(x=>x.priority).length,waiting:open.filter(x=>x.status==='wartet').length};}
  let cardRun=0;
  window.gfLoadVorstandCard=async function() {
    const box=document.getElementById('fdVorstandL');if(!box)return;
    const seq=++cardRun,me=gfWho()==='Lea'?'Lea':'Alex';
    try{
      const d=await api('lage');if(seq!==cardRun||me!==(gfWho()==='Lea'?'Lea':'Alex'))return;const n=summary(d.items||[]);
      const list=(d.items||[]).filter(x=>x.status!=='erledigt'&&(!x.owner||x.owner===me)).slice(0,3);
      document.getElementById('fdVorstandN').textContent=n.open+' offen';
      box.innerHTML='<p class="vb-card-meta">mit Freude eG · '+n.urgent+' dringend · '+n.waiting+' warten</p>'+list.map(x=>'<div class="fd-row"><a class="t" href="vorstand.html?id='+encodeURIComponent(x.id)+'">'+esc(x.title)+'</a><span>'+esc(x.owner||'Noch unzugewiesen')+'</span>'+gfZustand(x.status==='wartet'?'warn':'offen',LABELS[x.status])+'<a href="vorstand.html?id='+encodeURIComponent(x.id)+'&tab=reply">Antwortentwurf</a><a href="vorstand.html?id='+encodeURIComponent(x.id)+'&tab=task">Aufgabe</a></div>').join('')+(list.length?'':'<p class="vb-card-meta">Gerade kein offener Vorgang bei dir oder ohne Zuständigkeit.</p>');
    }catch(e){if(seq!==cardRun)return;document.getElementById('fdVorstandN').textContent='';box.innerHTML='<p class="vb-card-meta">Gemeinsamer Stand derzeit nicht geladen. <a href="vorstand.html">Vorstandsbüro öffnen</a></p>';}
  };
  window.gfVorstandStart=function() {
    const root=document.getElementById('vb');if(!root)return;
    const $=s=>root.querySelector(s),q=new URLSearchParams(location.search);
    let items=[],current=null,dirty=false,busy=false,run=0,filter='offen',tab=['reply','task','status'].includes(q.get('tab'))?q.get('tab'):'reply',asanaReady=false;
    const text=(id,value)=>{$(id).textContent=value;};
    function note(message,error=false){text('#vbNotice',message);$('#vbNotice').classList.toggle('vb-error',error);}
    function setBusy(on){busy=on;root.querySelectorAll('[data-write]').forEach(b=>b.disabled=on);taskButtons();}
    function taskButtons(){
      const pending=current&&['creating','unclear','created'].includes(current.task_state);
      $('#vbTaskCreate').disabled=busy||!current||pending||!asanaReady;
      $('#vbTaskCheck').disabled=busy||!current||!['creating','unclear','created'].includes(current.task_state)||!asanaReady;
    }
    function showTab(){root.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===tab)));root.querySelectorAll('[data-panel]').forEach(p=>p.hidden=p.dataset.panel!==tab);}
    function list(){
      const n=summary(items);text('#vbCounts',n.open+' offen · '+n.urgent+' dringend · '+n.waiting+' warten');
      const me=gfWho()==='Lea'?'Lea':'Alex';
      const rows=items.filter(x=>filter==='alle'||filter==='erledigt'&&x.status==='erledigt'||filter==='offen'&&x.status!=='erledigt'||filter==='meine'&&x.status!=='erledigt'&&x.owner===me||filter==='unzugewiesen'&&x.status!=='erledigt'&&!x.owner||filter==='wartet'&&x.status==='wartet');
      $('#vbList').innerHTML=rows.map(x=>'<button type="button" class="vb-mail'+(current?.id===x.id?' active':'')+'" data-case="'+esc(x.id)+'" aria-pressed="'+String(current?.id===x.id)+'"><span class="vb-mail-meta">'+esc(x.id)+(x.priority?' · Dringend':'')+'</span><strong>'+esc(x.title)+'</strong><span>'+esc(x.owner||'Noch unzugewiesen')+' · '+LABELS[x.status]+'</span></button>').join('')||'<p class="vb-muted">In dieser Ansicht gibt es keine Vorgänge.</p>';
      root.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===filter)));
    }
    function readPatch(){return {owner:$('#vbOwner').value,status:$('#vbStatus').value,due_on:$('#vbDue').value||null,waiting_on:$('#vbWaiting').value,completion_evidence:$('#vbEvidence').value,next_action:$('#vbNext').value,reply_to:$('#vbTo').value,reply_subject:$('#vbSubject').value,reply_body:$('#vbBody').value,task_title:$('#vbTaskTitle').value,task_notes:$('#vbTaskNotes').value,task_assignee:$('#vbTaskWho').value,task_due_on:$('#vbTaskDue').value||null};}
    function mailLink(){
      const to=$('#vbTo').value.trim(),body=$('#vbBody').value;
      const ok=/^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/.test(to)&&body.trim();
      const a=$('#vbMailto');a.hidden=!ok;if(ok)a.href='mailto:'+encodeURIComponent(to)+'?cc='+encodeURIComponent('vorstand@freude-eg.de')+'&subject='+encodeURIComponent($('#vbSubject').value)+'&body='+encodeURIComponent(body);
    }
    function draw(){
      const x=current;$('#vbDetail').hidden=!x;$('#vbEmpty').hidden=!!x;if(!x){taskButtons();return;}
      text('#vbCaseId',x.id);text('#vbTitle',x.title);text('#vbFinding',x.finding||'Noch kein belegter Stand erfasst.');text('#vbBasis','Ausgangsprüfung: '+date(x.basis_at));text('#vbSaved','Gemeinsam gespeichert von '+x.last_by+' · '+date(x.updated_at));
      $('#vbOriginal').href=x.source_url;$('#vbReplyOriginal').href=x.source_url;
      const fields={vbOwner:x.owner,vbStatus:x.status,vbDue:x.due_on,vbWaiting:x.waiting_on,vbEvidence:x.completion_evidence,vbNext:x.next_action,vbTo:x.reply_to,vbSubject:x.reply_subject,vbBody:x.reply_body,vbTaskTitle:x.task_title,vbTaskNotes:x.task_notes,vbTaskWho:x.task_assignee,vbTaskDue:x.task_due_on};
      for(const [id,v] of Object.entries(fields))$('#'+id).value=v||'';
      const locked=['creating','unclear','created'].includes(x.task_state);
      for(const id of ['vbTaskTitle','vbTaskNotes','vbTaskWho','vbTaskDue'])$('#'+id).disabled=locked;
      const link=$('#vbAsana');link.hidden=!x.asana_gid;if(x.asana_gid){link.href=x.asana_url;text('#vbTaskResult','Aufgabe angelegt · '+(x.asana_completed?'in Asana erledigt':'in Asana offen')+(x.asana_checked_at?' · abgeglichen '+date(x.asana_checked_at):''));}
      else text('#vbTaskResult',x.task_state==='creating'?'Anlage angefordert. Vor einer Wiederholung abgleichen.':x.task_state==='unclear'?'Anlage nicht eindeutig bestätigt. Zuerst in Asana abgleichen.':x.task_error||(!asanaReady?'Asana Verbindung derzeit nicht verfügbar.':'Noch keine Aufgabe angelegt.'));
      dirty=false;$('#vbChanged').hidden=true;showTab();mailLink();taskButtons();
    }
    async function load(force=false){
      const seq=++run;
      try{
        const d=await api('lage');if(seq!==run)return;items=d.items||[];asanaReady=d.asanaConfigured;
        if(!current){current=items.find(x=>x.id===q.get('id'))||items.find(x=>x.status!=='erledigt')||items[0]||null;draw();}
        else {const fresh=items.find(x=>x.id===current.id);if(fresh&&(force||!dirty)){current=fresh;draw();}else if(fresh&&fresh.version!==current.version){$('#vbChanged').hidden=false;}}
        list();
      }catch(e){note(e.message||'Der gemeinsame Stand konnte nicht geladen werden.',true);}
    }
    async function save(){
      if(!current)throw new Error('Bitte zuerst einen Vorgang wählen.');
      const d=await api('case_save',{id:current.id,version:current.version,patch:readPatch()});current=d.item;items=items.map(x=>x.id===current.id?current:x);draw();list();note('Gemeinsamer Stand gespeichert.');return current;
    }
    root.addEventListener('input',e=>{if(e.target.closest('#vbDetail')&&e.target.matches('input,textarea,select')){dirty=true;mailLink();text('#vbSaved','Ungespeicherte Änderungen');}});
    root.addEventListener('change',e=>{if(e.target.closest('#vbDetail')&&e.target.matches('input,textarea,select')){dirty=true;mailLink();text('#vbSaved','Ungespeicherte Änderungen');}});
    root.addEventListener('click',async e=>{
      const pick=e.target.closest('[data-case]');if(pick){if(busy)return;if(dirty&&!confirm('Ungespeicherte Änderungen verwerfen und den anderen Vorgang öffnen?'))return;current=items.find(x=>x.id===pick.dataset.case);draw();list();history.replaceState(null,'','vorstand.html?id='+encodeURIComponent(current.id)+'&tab='+tab);return;}
      const f=e.target.closest('[data-filter]');if(f){filter=f.dataset.filter;list();return;}
      const b=e.target.closest('[data-tab]');if(b){tab=b.dataset.tab;showTab();return;}
    });
    $('#vbSave').onclick=async()=>{setBusy(true);try{await save();}catch(e){note(e.message,true);}finally{setBusy(false);}};
    $('#vbReload').onclick=async()=>{if(dirty&&!confirm('Ungespeicherte Änderungen verwerfen und den gemeinsamen Stand laden?'))return;dirty=false;await load(true);};
    $('#vbCopy').onclick=async()=>{try{await navigator.clipboard.writeText($('#vbBody').value);note('Antworttext kopiert. Im Originalverlauf einfügen und dort prüfen.');}catch{note('Kopieren derzeit nicht möglich. Du kannst den Text im Entwurfsfeld markieren.',true);}};
    $('#vbSuggest').onclick=()=>{if($('#vbBody').value.trim()&&!confirm('Den bisherigen Antworttext durch einen neuen Vorschlag ersetzen?'))return;$('#vbBody').value='Guten Tag,\n\nvielen Dank für Ihre Nachricht. Wir übernehmen die Klärung im Vorstand und prüfen den aktuellen Bearbeitungsstand. Anschließend melden wir uns mit dem geprüften Ergebnis und den nächsten Schritten.\n\nFreundliche Grüße\n'+(gfWho()==='Lea'?'Lea':'Alexander');dirty=true;mailLink();text('#vbSaved','Vorschlag eingefügt, noch nicht gespeichert');};
    $('#vbTake').onclick=()=>{$('#vbOwner').value=gfWho()==='Lea'?'Lea':'Alex';if($('#vbStatus').value==='pruefen')$('#vbStatus').value='in_bearbeitung';dirty=true;tab='status';showTab();text('#vbSaved','Übernahme gewählt, bitte speichern');};
    $('#vbTaskCreate').onclick=async()=>{
      setBusy(true);try{
        await save();const d=await api('task_create',{id:current.id,version:current.version});current=d.item;items=items.map(x=>x.id===current.id?current:x);draw();list();note(d.existing?'Die vorhandene Aufgabe ist verknüpft.':'Asana hat die Aufgabe bestätigt. Der Mailvorgang bleibt offen.');
      }catch(e){if(e.item){current=e.item;draw();}note(e.message,true);if(!e.item)await load(false);}finally{setBusy(false);}
    };
    $('#vbTaskCheck').onclick=async()=>{setBusy(true);try{if(dirty)await save();const d=await api('task_check',{id:current.id});current=d.item;draw();await load(false);note('Asana Stand abgeglichen. Die Erledigung des Mailvorgangs wird gesondert geprüft.');}catch(e){if(e.item){current=e.item;draw();}note(e.message,true);}finally{setBusy(false);}};
    $('#vbNewToggle').onclick=()=>{$('#vbNew').hidden=!$('#vbNew').hidden;if(!$('#vbNew').hidden)$('#vbNewTitle').focus();};
    $('#vbNewSave').onclick=async()=>{setBusy(true);try{if(dirty)throw new Error('Bitte zuerst den offenen Vorgang speichern.');const title=$('#vbNewTitle').value.trim(),url=$('#vbNewSource').value.trim();const d=await api('case_add',{source_url:url,patch:{title,next_action:$('#vbNewNext').value,task_title:title,task_notes:$('#vbNewNext').value,task_assignee:gfWho()==='Lea'?'Lea':'Alex'}});items.unshift(d.item);current=d.item;$('#vbNew').hidden=true;$('#vbNewTitle').value='';$('#vbNewSource').value='';$('#vbNewNext').value='';draw();list();note('Vorgang gemeinsam aufgenommen.');}catch(e){note(e.message,true);}finally{setBusy(false);}};
    document.addEventListener('gf-who',()=>{list();if(!dirty)draw();});
    window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!busy)load(false);});
    setInterval(()=>{if(!document.hidden&&!busy)load(false);},45000);
    load(true);
  };
})();
