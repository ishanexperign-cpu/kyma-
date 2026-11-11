/* KYMA · home — choose a studio, manage projects
   The open project is whichever you picked last; each studio card opens it in that studio. */
const STUDIO_NAMES={compose:'Compose',hum:'Hum',video:'Video',atmos:'Atmosphere',dj:'DJ'};
const KEYS=['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
const H={q:'',sel:null};
const fmtLen=(len,bpm)=>{ if(!len||!bpm) return ''; const s=Math.round(len*60/bpm/4); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); };
function ago(t){ const d=(Date.now()-t)/1000; if(d<45) return 'just now'; if(d<3600) return Math.round(d/60)+' min ago'; if(d<86400) return Math.round(d/3600)+' h ago'; if(d<86400*7) return Math.round(d/86400)+' d ago'; return new Date(t).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}); }
function metaLine(m){ return [m.bpm&&m.bpm+' BPM',m.root!=null&&m.scale&&KEYS[m.root]+' '+m.scale.toLowerCase(),fmtLen(m.len,m.bpm),m.tracks?m.tracks+' track'+(m.tracks>1?'s':''):'empty',m.video&&'▶ '+m.video,m.atmos&&'≈ '+m.atmos].filter(Boolean).join(' · '); }
function nextName(){ const n=Store.list().filter(m=>/^Untitled( \d+)?$/.test(m.name)).length; return n?'Untitled '+(n+1):'Untitled'; }
function newProject(studio){ const p={app:'kyma',v:1,id:Store.newId(),created:Date.now(),updated:Date.now(),studio:studio||'compose',name:nextName(),song:null}; Store.put(p); Store.setCurrent(p.id); return p; }
function current(){ const id=Store.current(), m=Store.list().find(x=>x.id===id); return m||null; }
function go(studio,id){ if(!id){ const c=current(); id=c?c.id:newProject(studio).id; } Store.setCurrent(id); location.href=studio+'.html?p='+encodeURIComponent(id); }

/* ---------- render ---------- */
function renderCurrent(){
  const c=current();
  $('hCurName').textContent=c?c.name:'None yet';
  $('hCurMeta').textContent=c?metaLine(c)+' · edited '+ago(c.updated):'Pick a studio and one starts on its own.';
  document.querySelectorAll('.st-proj').forEach(b=>b.textContent=c?'“'+c.name+'”':'a new project');
}
function renderList(){
  const all=Store.list(), box=$('hList'); box.innerHTML='';
  $('hCount').textContent=all.length?all.length+' saved':''; $('hSearch').hidden=all.length<7;
  const q=H.q.trim().toLowerCase(), items=all.filter(m=>!q||m.name.toLowerCase().includes(q));
  if(!all.length){ box.innerHTML='<div class="h-empty"><span>Nothing saved yet.</span></div>'; return; }
  if(!items.length){ box.innerHTML='<div class="h-empty"><span>Nothing matches.</span></div>'; return; }
  const cur=Store.current();
  items.forEach(m=>{
    const row=document.createElement('div'); row.className='h-row'+(m.id===cur?' current':''); row.setAttribute('role','listitem');
    row.innerHTML=`<button class="h-main" title="Make this the open project"><span class="h-dot" data-s="${m.studio}"></span><span class="h-txt"><b></b><small></small></span></button>
      <span class="h-when"></span>
      <div class="h-open" role="group" aria-label="Open in a studio">${Object.entries(STUDIO_NAMES).map(([k,n])=>`<button class="h-st" data-s="${k}" title="Open in ${n}" aria-label="Open ${m.name.replace(/"/g,'')} in ${n}">${n}</button>`).join('')}</div>
      <button class="btn ghost h-more" aria-label="More for ${m.name.replace(/"/g,'')}" title="Rename, duplicate, download, delete">⋯</button>`;
    row.querySelector('b').textContent=m.name; row.querySelector('small').textContent=metaLine(m);
    row.querySelector('.h-when').textContent=ago(m.updated)+(m.synced&&m.synced>=m.updated-1000?' · synced':'');
    row.querySelector('.h-main').onclick=()=>{ Store.setCurrent(m.id); renderAll(); };
    row.querySelector('.h-main').ondblclick=()=>go(m.studio||'compose',m.id);
    row.querySelectorAll('.h-st').forEach(b=>{ if(b.dataset.s===m.studio) b.classList.add('last'); b.onclick=()=>go(b.dataset.s,m.id); });
    row.querySelector('.h-more').onclick=e=>rowMenu(m,e.currentTarget);
    box.appendChild(row);
  });
}
function renderAll(){ renderCurrent(); renderList(); }

/* ---------- row actions ---------- */
function closePop(){ $('pop').hidden=true; }
function placePop(p,anchor){ p.hidden=false; const r=anchor.getBoundingClientRect(), w=p.offsetWidth, h=p.offsetHeight; p.style.left=Math.max(8,Math.min(r.right-w,innerWidth-w-8))+'px'; p.style.top=Math.max(8,Math.min(r.bottom+4,innerHeight-h-8))+'px'; }
function rowMenu(m,anchor){
  const p=$('pop'); p.className='pop menu'; p.innerHTML='';
  [['Rename',()=>rename(m,anchor)],['Duplicate',()=>duplicate(m)],['Download project file',()=>download(m)],['Delete',()=>remove(m),true]].forEach(([l,fn,danger])=>{ const b=document.createElement('button'); b.textContent=l; if(danger) b.className='danger'; b.onclick=()=>{ closePop(); fn(); }; p.appendChild(b); });
  placePop(p,anchor);
}
function rename(m,anchor){
  const p=$('pop'); p.className='pop clipmenu'; p.innerHTML='<label class="fld"><span>Project name</span><input class="pin" spellcheck="false"></label><div class="pact" style="justify-content:flex-end"><button class="btn ghost" data-a="x">Cancel</button><button class="btn primary" data-a="ok">Rename</button></div>';
  const inp=p.querySelector('input'); inp.value=m.name;
  const ok=()=>{ const v=inp.value.trim(); closePop(); if(!v||v===m.name) return; const x=Store.get(m.id); if(!x) return; x.name=v; if(x.song) x.song.name=v; x.updated=Date.now(); Store.put(x); Store.sync(x); renderAll(); };
  p.querySelector('[data-a=ok]').onclick=ok; p.querySelector('[data-a=x]').onclick=closePop; inp.onkeydown=e=>{ if(e.key==='Enter') ok(); if(e.key==='Escape') closePop(); };
  placePop(p,anchor); inp.focus(); inp.select();
}
function duplicate(m){ const x=Store.get(m.id); if(!x) return; const c={...JSON.parse(JSON.stringify(x)),id:Store.newId(),created:Date.now(),updated:Date.now()}; const nm=(m.name||'Untitled')+' copy'; c.name=nm; if(c.song) c.song.name=nm; Store.put(c); Store.sync(c); renderAll(); toast('Made “'+nm+'”'); }
function download(m){ const x=Store.get(m.id); if(x) offerFile(slug(m.name)+'.kyma',Store.toFile(x)); }
function remove(m){
  const x=Store.get(m.id); Store.remove(m.id); renderAll();
  toast('Deleted “'+m.name+'”',[{label:'Undo',fn:()=>{ if(!x) return; x.updated=Date.now(); Store.put(x); Store.sync(x); renderAll(); }}],7000);
}

/* ---------- wiring ---------- */
(function initHome(){
  const migrated=Store.migrate(); if(migrated&&!Store.current()) Store.setCurrent(migrated.id);
  document.querySelectorAll('.studio').forEach(a=>a.addEventListener('click',e=>{ e.preventDefault(); go(a.dataset.studio); }));
  const mk=document.querySelector('.k-mascot'); if(mk){ mk.addEventListener('click',()=>{ mk.classList.remove('hop'); void mk.offsetWidth; mk.classList.add('hop'); }); mk.addEventListener('animationend',e=>{ if(e.animationName==='k-hop') mk.classList.remove('hop'); }); }
  $('hNew').onclick=()=>{ const p=newProject(); renderAll(); toast('“'+p.name+'” is ready. Pick a studio to start.'); };
  $('hImport').onclick=()=>$('hFile').click();
  $('hFile').onchange=async e=>{ const f=e.target.files[0]; e.target.value=''; if(!f) return; try{ const p=Store.fromFile(await f.text()); Store.put(p); Store.sync(p); Store.setCurrent(p.id); renderAll(); toast('Opened “'+(p.song&&p.song.name||p.name||'project')+'”. Pick a studio.'); }catch(err){ toast('That file isn’t a Kyma project.'); } };
  $('hSearch').oninput=e=>{ H.q=e.target.value; renderList(); };
  document.addEventListener('pointerdown',e=>{ const p=$('pop'); if(!p.hidden&&!p.contains(e.target)&&!e.target.closest('.h-more')) closePop(); },true);
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') closePop(); });
  renderAll();
  if(migrated) toast('Your earlier song is here as “'+(migrated.song.name||'Untitled')+'”.');
  /* cloud library: merge, then show where projects live */
  Store.cloud.ready.then(async ok=>{ $('hSync').textContent=ok?'synced to your account':'saved in this browser'; if(ok){ const local=Store.list(); for(const m of local){ if(!m.synced){ const p=Store.get(m.id); if(p&&p.song) await Store.sync(p); } } if(await Store.pull()) renderAll(); else renderList(); } });
  addEventListener('focus',()=>renderAll());
})();
