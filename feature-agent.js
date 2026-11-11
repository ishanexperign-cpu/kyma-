/* KYMA · features/agent — the learning agent
   Drop in tracks or sound files you love (or the song you're making). The agent measures each one
   with analyseTrack (tempo, swing, key, brightness, density, the 16-step kick, snare and hat groove,
   and the energy arc), weighs them, and folds them into one taste. The taste becomes a ★ genre in
   Magic, can set the project's key and tempo, shapes the energy of full tracks, and travels as a
   .kymataste file that anyone can import. Only measurements and credit lines are kept, never audio. */
const AGENT={tracks:[],busy:false,used:[],lib:[],cur:null};
const AG_LIB='kyma.tastes';
const AG_SOURCES=[['Instrumental','https://freemusicarchive.org/genre/Instrumental/'],['Experimental','https://freemusicarchive.org/genre/Experimental/'],['Electronic','https://freemusicarchive.org/genre/Electronic/'],['Blues','https://freemusicarchive.org/genre/Blues/'],['Pop','https://freemusicarchive.org/genre/Pop/']];
try{ const l=JSON.parse(localStorage.getItem(AG_LIB)||'[]'); if(Array.isArray(l)) AGENT.lib=l.map(agClean).filter(Boolean).slice(0,20); }catch(e){}
const agSaveLib=()=>{ try{ localStorage.setItem(AG_LIB,JSON.stringify(AGENT.lib.slice(0,20))); }catch(e){} };

/* ---------- a taste file is only numbers and credits, so it is checked field by field ---------- */
function agCleanTrack(t){
  if(!t||typeof t!=='object') return null; const num=(v,a,b,d)=>isFinite(v)?clamp(+v,a,b):d, str=(v,n)=>typeof v==='string'?v.slice(0,n):'';
  const grid=g=>Array.isArray(g)&&g.length===16?g.map(v=>num(v,-6,6,0)):null, grids=Array.isArray(t.grids)?t.grids.map(grid):[];
  if(!isFinite(t.tempo)||grids.length!==3||grids.some(g=>!g)) return null;
  const k=t.key||{};
  return {title:str(t.title,80)||'Untitled',artist:str(t.artist,60),credit:str(t.credit,80),secs:num(t.secs,0,3600,0),tempo:num(t.tempo,40,240,100),off:num(t.off,0,1,.5),
    key:{r:num(k.r,0,11,0)|0,mode:k.mode==='minor'?'minor':'major',c:num(k.c,-1,1,0)},centroid:num(t.centroid,100,8000,1500),density:num(t.density,0,30,2),
    grids,arc:Array.isArray(t.arc)?t.arc.slice(0,48).map(v=>num(v,0,1,0)):[],w:num(t.w,0,2,1),own:!!t.own};
}
function agClean(f){ if(!f||f.kind!=='taste'||!Array.isArray(f.tracks)) return null; const tracks=f.tracks.slice(0,200).map(agCleanTrack).filter(Boolean); if(!tracks.length) return null;
  return {app:'kyma',kind:'taste',v:1,name:(typeof f.name==='string'&&f.name.trim()?f.name.trim():'Shared taste').slice(0,28),created:isFinite(f.created)?+f.created:Date.now(),by:typeof f.by==='string'?f.by.slice(0,60):'',tracks}; }

/* ---------- training: fold the tracks into one profile ---------- */
function wmedian(xs,ws,q=.5){ const o=xs.map((x,i)=>[x,ws[i]]).sort((a,b)=>a[0]-b[0]), tot=o.reduce((s,x)=>s+x[1],0); let acc=0; for(const [x,w] of o){ acc+=w; if(acc>=tot*q) return x; } return o.length?o[o.length-1][0]:0; }
function agAggregate(list){
  const L=list.filter(t=>t.w>0); if(!L.length) return null; const W=L.map(t=>t.w), tw=W.reduce((a,b)=>a+b,0), mean=f=>L.reduce((s,t,i)=>s+f(t)*W[i],0)/tw;
  /* tempo: fold half and double time onto the group's centre before taking the median */
  const ref=wmedian(L.map(t=>t.tempo),W), folded=L.map(t=>{ let b=t.tempo; while(b<ref*.7) b*=2; while(b>ref*1.42) b/=2; return b; });
  const tempo=wmedian(folded,W), lo=Math.round(wmedian(folded,W,.2)), hi=Math.round(wmedian(folded,W,.8));
  /* key: every track votes for its key, weighted by how sure it was */
  const votes={}; L.forEach((t,i)=>{ const k=t.key.r+':'+t.key.mode; votes[k]=(votes[k]||0)+W[i]*(.3+Math.max(0,t.key.c)); });
  const [kr,km]=Object.entries(votes).sort((a,b)=>b[1]-a[1])[0][0].split(':'), keyShare=votes[kr+':'+km]/Object.values(votes).reduce((a,b)=>a+b,0);
  const grids=[0,1,2].map(b=>{ const g=new Array(16).fill(0); L.forEach((t,i)=>t.grids[b].forEach((v,s)=>g[s]+=v*W[i])); const m=g.reduce((a,x)=>a+x,0)/16, sd=Math.sqrt(g.reduce((a,x)=>a+(x-m)*(x-m),0)/16)||1; return g.map(v=>+((v-m)/sd).toFixed(2)); });
  const arc=new Array(24).fill(0); L.forEach((t,i)=>{ const a=t.arc.length?t.arc:[1]; for(let j=0;j<24;j++){ const x=j/23*(a.length-1), k=Math.floor(x), f=x-k; arc[j]+=((a[k]??0)*(1-f)+(a[k+1]??a[k]??0)*f)*W[i]; } });
  const am=Math.max(...arc)||1;
  return {tempo:+tempo.toFixed(1),lo:Math.max(40,Math.min(lo,Math.round(tempo)-2)),hi:Math.min(220,Math.max(hi,Math.round(tempo)+2)),off:+mean(t=>t.off).toFixed(3),
    key:{r:+kr,mode:km,c:+keyShare.toFixed(2)},centroid:Math.round(mean(t=>t.centroid)),density:+mean(t=>t.density).toFixed(2),grids,arc:arc.map(v=>+(v/am).toFixed(2)),n:L.length,secs:Math.round(L.reduce((s,t)=>s+t.secs,0))};
}
function agStyle(name,agg){ const st=styleFromAnalysis(name,agg); st.taste={lo:agg.lo,hi:agg.hi,n:agg.n,keyShare:agg.key.c}; st.arc=agg.arc; return st; }
/* make the taste a ★ genre in Magic, replacing an older one with the same name */
function agRegister(st){
  const gn='★ '+st.name; if(GENRES[gn]){ delete GENRES[gn]; const i=GENRE_ORDER.indexOf(gn); if(i>=0) GENRE_ORDER.splice(i,1); }
  registerLearned(st); GENRES[gn].bpm=[st.taste.lo,st.taste.hi];
  LEARNED=LEARNED.filter(x=>x.name!==st.name); LEARNED.unshift(st); LEARNED=LEARNED.slice(0,24); saveLearned(); return gn;
}
function agFileOf(name,tracks){ return {app:'kyma',kind:'taste',v:1,name,created:Date.now(),by:'',tracks:tracks.filter(t=>t.a||t.tempo).map(t=>{ const a=t.a||t; return {title:t.title,artist:t.artist||'',credit:t.credit||'',secs:a.secs,tempo:a.tempo,off:a.off,key:a.key,centroid:a.centroid,density:a.density,grids:a.grids,arc:a.arc,w:t.w,own:!!t.own}; })}; }
const agName=()=>($('agName').value.trim()||'My taste').slice(0,28);
const agDone=()=>AGENT.tracks.filter(t=>t.a);
const agSet=()=>agDone().map(t=>({...t.a,w:t.w}));

/* ---------- listening ---------- */
function agTitle(fn){ const base=fn.replace(/\.[^.]+$/,'').replace(/[_]+/g,' ').replace(/\s+/g,' ').trim(); const m=base.match(/^(.+?)\s+[-–—]\s+(.+)$/); return m?{artist:m[1].slice(0,60),title:m[2].slice(0,80)}:{artist:'',title:base.slice(0,80)||'Untitled'}; }
function agAdd(files){ [...files].filter(f=>/^audio\//.test(f.type)||/\.(wav|mp3|m4a|aac|ogg|oga|flac|webm|aiff?)$/i.test(f.name)).slice(0,60).forEach(f=>{ const n=agTitle(f.name); AGENT.tracks.push({id:nid(),...n,credit:'',file:f,status:'queued',p:0,w:1}); });
  renderAgent(); agRun(); }
async function agRun(){
  if(AGENT.busy) return; AGENT.busy=true; ensureAudio();
  for(const t of AGENT.tracks){ if(t.status!=='queued') continue; t.status='learning'; t.p=0; renderAgent();
    try{ const buf=t.buf||await ac.decodeAudioData(await t.file.arrayBuffer()); t.a=await analyseTrack(buf,f=>{ t.p=f; agRow(t); }); t.status='done'; }
    catch(e){ console.warn(e); t.status='error'; }
    delete t.file; delete t.buf; renderAgent(); }
  AGENT.busy=false; renderAgent();
}
async function agLearnSelf(){
  const notes=S.tracks.some(tr=>tr.clips.some(c=>c.notes.length)); if(!notes){ toast('This song is empty. Add some music first, or drop in tracks.'); return; }
  const b=Math.min(S.len,Math.ceil(90/stepDur())), t={id:nid(),title:S.name+' (this song)',artist:'',credit:'Own work',status:'learning',p:0,w:1,own:true}; AGENT.tracks.push(t); renderAgent();
  try{ t.buf=await renderSong({a:0,b,onProgress:f=>{ t.p=f*.4; agRow(t); }}); t.status='queued'; }catch(e){ console.warn(e); t.status='error'; }
  renderAgent(); agRun();
}

/* ---------- using and sharing ---------- */
function agUse(){
  const agg=agAggregate(agSet()); if(!agg){ toast('Add a track first.'); return; }
  const name=agName(), st=agStyle(name,agg), gn=agRegister(st), file=agFileOf(name,agDone());
  AGENT.used=AGENT.used.filter(x=>x.name!==name); AGENT.used.unshift(file); AGENT.used=AGENT.used.slice(0,6); agKeep(file);
  MAGIC.genre=gn; MAGIC.mood=st.mood; saveMagic(); if(typeof renderMagicControls==='function') renderMagicControls(); if(typeof buildDeck==='function') buildDeck(); persist(); renderAgent();
  toast(`“${name}” is now a genre in Magic: ${Math.round(agg.tempo)} BPM, ${NOTE_NAMES[agg.key.r]} ${agg.key.mode}, closest to ${st.base}. Full tracks follow its key and energy arc.`,[{label:'Make a track',fn:()=>{ closeAgent(); $('mgMake')&&$('mgMake').click(); }}],8000);
}
function agTakeKey(){ const agg=agAggregate(agSet()); if(!agg) return; pushHist(); S.bpm=clamp(Math.round(agg.tempo),40,220); S.root=agg.key.r; S.scale=agg.key.mode==='minor'?'Minor':'Major';
  if(G) applyGraph(G); renderAll(); persist(); toast(`Tempo ${S.bpm} BPM, key ${NOTE_NAMES[S.root]} ${S.scale}`,[{label:'Undo',fn:undo}]); }
function agKeep(file){ AGENT.lib=AGENT.lib.filter(x=>x.name!==file.name); AGENT.lib.unshift(file); agSaveLib(); }
const agJson=f=>JSON.stringify(f,null,1);
function agDownload(){ if(!agDone().length){ toast('Add a track first.'); return; } const f=agFileOf(agName(),agDone()); agKeep(f); renderAgent(); offerFile(slug(f.name)+'.kymataste',new Blob([agJson(f)],{type:'application/json'})); }
async function agShare(){ const f=agFileOf(agName(),agDone()); const file=new File([agJson(f)],slug(f.name)+'.kymataste',{type:'application/json'});
  try{ await navigator.share({files:[file],title:'Kyma taste · '+f.name,text:'A Kyma taste file. Import it in Kyma’s learning agent.'}); }catch(e){ if(e&&e.name!=='AbortError') agDownload(); } }
function agLoad(file,quiet){ AGENT.tracks=file.tracks.map(t=>({id:nid(),title:t.title,artist:t.artist,credit:t.credit,status:'done',w:t.w,own:t.own,a:{secs:t.secs,tempo:t.tempo,off:t.off,key:t.key,centroid:t.centroid,density:t.density,grids:t.grids,arc:t.arc}}));
  $('agName').value=file.name; renderAgent(); if(!quiet) toast(`Loaded “${file.name}”, learned from ${file.tracks.length} track${file.tracks.length>1?'s':''}. Use it in this project to hear it.`); }
async function agImport(f){ try{ const x=agClean(JSON.parse(await f.text())); if(!x) throw 0; agKeep(x); agLoad(x); }catch(e){ toast('That isn’t a Kyma taste file.'); } }

/* ---------- render ---------- */
function agRow(t){ const el=document.querySelector(`.ag-trk[data-id="${t.id}"]`); if(!el) return; const pb=el.querySelector('.ag-p i'); if(pb) pb.style.width=Math.round((t.p||0)*100)+'%'; }
const agFmtHz=v=>v>=1000?(v/1000).toFixed(1)+' kHz':v+' Hz';
function renderAgent(){
  if(!$('agentSheet')) return;
  const list=$('agList'); list.innerHTML='';
  if(!AGENT.tracks.length) list.innerHTML='<p class="ag-empty">Nothing learned yet. Drop a few tracks with the sound you want, from one artist, one mood or one era, and the agent finds what they share.</p>';
  AGENT.tracks.forEach(t=>{ const r=document.createElement('div'); r.className='ag-trk '+t.status; r.dataset.id=t.id; const a=t.a;
    r.innerHTML=`<div class="ag-tl"><input class="ag-title" aria-label="Title" spellcheck="false"><input class="ag-credit" aria-label="Artist and licence" placeholder="artist · licence, e.g. CC BY 4.0" spellcheck="false"></div>
      <div class="ag-read">${a?`<span><b>${Math.round(a.tempo)}</b>bpm</span><span><b>${NOTE_NAMES[a.key.r]}${a.key.mode==='minor'?'m':''}</b>key</span><span><b>${Math.round(clamp((a.off-.5)*2.2,0,.45)*100)}</b>swing</span><span><b>${agFmtHz(a.centroid)}</b>bright</span>`:t.status==='error'?'<span class="err">couldn’t read this file</span>':`<span class="ag-p"><i></i></span><span class="ag-st">${t.status==='learning'?'listening…':'waiting'}</span>`}</div>
      <label class="ag-w" title="How much this track counts"><span>weight</span><input type="range" min="0" max="2" step=".1" aria-label="Weight"></label>
      <button class="ibtn icon ag-x" aria-label="Remove">${ICONS.close}</button>`;
    const ti=r.querySelector('.ag-title'), cr=r.querySelector('.ag-credit'), w=r.querySelector('.ag-w input'); ti.value=t.title; cr.value=t.credit||t.artist||'';
    ti.onchange=()=>{ t.title=ti.value.trim().slice(0,80)||'Untitled'; }; cr.onchange=()=>{ t.credit=cr.value.trim().slice(0,80); };
    w.value=t.w; w.oninput=()=>{ t.w=+w.value; renderProfile(); }; w.disabled=!a;
    r.querySelector('.ag-x').onclick=()=>{ AGENT.tracks=AGENT.tracks.filter(x=>x!==t); renderAgent(); };
    list.appendChild(r); agRow(t); });
  const n=agDone().length, busy=AGENT.tracks.some(t=>t.status==='learning'||t.status==='queued');
  $('agState').textContent=busy?'listening':n?`trained · ${n} track${n>1?'s':''}`:'idle'; $('agState').dataset.on=busy?'busy':n?'on':'';
  ['agUse','agKey','agDownload','agShare'].forEach(id=>$(id).disabled=!n);
  $('agShare').hidden=!(navigator.canShare&&navigator.canShare({files:[new File(['{}'],'t.kymataste',{type:'application/json'})]}));
  renderProfile(); renderLib();
  const badge=$('agentBadge'); if(badge){ badge.hidden=!AGENT.used.length; badge.textContent=AGENT.used.length; }
}
function renderProfile(){
  const agg=agAggregate(agSet()), box=$('agProfile'), gv=$('agGroove'), arc=$('agArc');
  if(!agg){ box.innerHTML='<div class="ag-ph">Your taste appears here: tempo range, key, swing, brightness, density and the groove the tracks share.</div>'; gv.innerHTML=''; arc.innerHTML=''; $('agHint').textContent=''; return; }
  const st=styleFromAnalysis(agName(),agg), sw=Math.round(clamp((agg.off-.5)*2.2,0,.45)*100);
  const cell=(k,v,s)=>`<div class="ag-cell"><span class="cb-cap">${k}</span><b>${v}</b>${s?`<small>${s}</small>`:''}</div>`;
  box.innerHTML=cell('tempo',Math.round(agg.tempo),agg.lo+'–'+agg.hi+' bpm')+cell('key',NOTE_NAMES[agg.key.r]+(agg.key.mode==='minor'?'m':''),Math.round(agg.key.c*100)+'% agree')+cell('swing',sw+'%',sw>18?'shuffled':sw>6?'loose':'straight')
    +cell('brightness',agFmtHz(agg.centroid),agg.centroid>1900?'bright':agg.centroid>1200?'balanced':'dark')+cell('density',agg.density.toFixed(1),'hits / s')+cell('mood',st.mood,'closest: '+st.base);
  gv.innerHTML=''; ['kick','snare','hat'].forEach((nm,b)=>{ const row=document.createElement('div'); row.className='ag-grow'; row.innerHTML=`<span>${nm}</span>`;
    agg.grids[b].forEach((v,i)=>{ const c=document.createElement('i'); c.style.setProperty('--v',clamp((v+1)/3,0,1).toFixed(2)); if(i%4===0) c.className='bt'; row.appendChild(c); }); gv.appendChild(row); });
  const pts=agg.arc.map((v,i)=>`${(i/(agg.arc.length-1)*240).toFixed(1)},${(52-v*46).toFixed(1)}`).join(' ');
  arc.innerHTML=`<polyline points="0,52 ${pts} 240,52" class="fill"/><polyline points="${pts}" class="line"/>`;
  $('agHint').textContent=`Learned from ${agg.n} track${agg.n>1?'s':''}, ${fmtMS(agg.secs)} of listening. The taste file holds these numbers and the credit lines, not the audio.`;
}
function renderLib(){
  const box=$('agLib'); box.innerHTML=''; if(!AGENT.lib.length){ box.innerHTML='<p class="hint">Tastes you use, download or import are kept here.</p>'; return; }
  AGENT.lib.forEach(f=>{ const c=document.createElement('div'); c.className='ag-libi'; c.innerHTML=`<button class="ag-lgo"><b></b><small>${f.tracks.length} track${f.tracks.length>1?'s':''}</small></button><button class="ibtn icon" data-a="d" aria-label="Download">${ICONS.download}</button><button class="ibtn icon" data-a="x" aria-label="Remove">${ICONS.close}</button>`;
    c.querySelector('b').textContent=f.name; c.querySelector('.ag-lgo').onclick=()=>agLoad(f);
    c.querySelector('[data-a=d]').onclick=()=>offerFile(slug(f.name)+'.kymataste',new Blob([agJson(f)],{type:'application/json'}));
    c.querySelector('[data-a=x]').onclick=()=>{ AGENT.lib=AGENT.lib.filter(x=>x!==f); agSaveLib(); renderLib(); };
    box.appendChild(c); });
}
function openAgent(){ renderAgent(); $('agentSheet').hidden=false; }
function closeAgent(){ $('agentSheet').hidden=true; }

/* ---------- wiring ---------- */
(function initAgent(){
  if(!$('agentSheet')) return;
  paintIcons($('agentSheet'));
  $('agLinks').innerHTML=AG_SOURCES.map(([n,u])=>`<a href="${u}" target="_blank" rel="noopener">${ICONS.link}<span>${n}</span></a>`).join('');
  const drop=$('agDrop'), inp=$('agFiles');
  drop.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); inp.click(); } });
  inp.onchange=e=>{ agAdd(e.target.files); e.target.value=''; };
  ['dragenter','dragover'].forEach(ev=>drop.addEventListener(ev,e=>{ e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{ e.preventDefault(); drop.classList.remove('over'); if(ev==='drop'&&e.dataTransfer) agAdd(e.dataTransfer.files); }));
  $('agSelf').onclick=agLearnSelf; $('agImport').onclick=()=>$('agImportIn').click(); $('agImportIn').onchange=e=>{ const f=e.target.files[0]; e.target.value=''; if(f) agImport(f); };
  $('agUse').onclick=agUse; $('agKey').onclick=agTakeKey; $('agDownload').onclick=agDownload; $('agShare').onclick=agShare;
  $('agName').oninput=()=>renderProfile();
  $('agClose').onclick=closeAgent; $('agentSheet').addEventListener('click',e=>{ if(e.target.id==='agentSheet') closeAgent(); });
  const ab=$('agentBtn'); if(ab) ab.onclick=openAgent;
  control({id:'agent',group:'Magic',label:'Learning agent',icon:'agent',tip:'Teach Kyma your taste from tracks you love',run:openAgent});
  /* tastes travel inside the project file, so whoever opens it gets the same ★ genres */
  on('serialize',p=>{ if(AGENT.used.length) p.tastes=AGENT.used; });
  on('project',p=>{ const list=Array.isArray(p.tastes)?p.tastes.map(agClean).filter(Boolean).slice(0,6):[]; AGENT.used=list;
    list.forEach(f=>{ const agg=agAggregate(f.tracks); if(agg) agRegister(agStyle(f.name,agg)); });
    if(list.length&&typeof renderMagicControls==='function') renderMagicControls(); renderAgent(); });
})();
