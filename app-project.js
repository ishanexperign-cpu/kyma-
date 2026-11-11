/* KYMA · app/project — the project open in this studio
   Opens the project named in the URL (?p=id) or the last one used, autosaves every edit to the
   library, and handles Save, Save a copy, project files and the trip back to the home screen. */
const Project={
  cur:null, last:null, timer:null, cloudTimer:null, status:'saved',
  defaultSong(){
    const s=newSong(); s.name=Project.freshName();
    if(STUDIO==='dj'){ const d=sanitizeSong(demoSong('Ambient Ghosts')); d.name=s.name; return d; }
    if(STUDIO==='hum'){ s.len=16*16; const prev=S; S=s; const kit=INSTS.find(i=>i.kind==='drum'), cel=INSTS.find(i=>i.name==='Cello'); if(kit){ const t=newTrack(kit.id,{name:'Beatbox · '+kit.name}); t.role='drums'; s.tracks.push(t); } if(cel){ const t=newTrack(cel.id,{name:'Hum · Cello'}); t.role='melody'; s.tracks.push(t); } S=prev; return s; }
    if(STUDIO==='compose'||STUDIO==='video'){ s.len=16*16; const prev=S; S=s; ['Drums','Bass','Keys'].map(c=>INSTS.find(i=>i.cat===c)).filter(Boolean).forEach(I=>s.tracks.push(newTrack(I.id))); S=prev; }
    return s;
  },
  freshName(){ const n=Store.list().filter(m=>/^Untitled( \d+)?$/.test(m.name)).length; return n?'Untitled '+(n+1):'Untitled'; },
  async open(){
    const q=new URLSearchParams(location.search).get('p'), id=q||Store.current();
    let p=id?Store.get(id):null;
    if(!p&&id){ p=await Promise.race([Store.fetch(id),new Promise(r=>setTimeout(()=>r(null),3500))]); if(p) Store.put(p); }
    if(!p){ p={app:'kyma',v:1,id:Store.newId(),created:Date.now(),updated:Date.now(),studio:STUDIO,song:null,fresh:true}; }
    const song=p.song?sanitizeSong(p.song):Project.defaultSong(); if(!p.song&&p.name) song.name=p.name;
    const {song:_,...rest}=p; Project.cur=rest; S=song; Store.setCurrent(p.id);
    if(q&&history.replaceState){ try{ history.replaceState(null,'',location.pathname); }catch(e){} }
    Project.renderStatus();
    return p;
  },
  snapshot(){ const p={...Project.cur,app:'kyma',v:1,studio:STUDIO,updated:Date.now(),song:JSON.parse(snapshot())}; delete p.fresh; emit('serialize',p); return p; },
  touch(){ Project.setStatus('editing'); clearTimeout(Project.timer); Project.timer=setTimeout(()=>Project.saveNow(),700); },
  saveNow(explicit){
    clearTimeout(Project.timer); const p=Project.snapshot(); Store.put(p); Project.cur.updated=p.updated; delete Project.cur.fresh; Project.last=p;
    Project.setStatus('saved'); Project.cloudSoon(explicit?0:6000);
    if(explicit) toast(`Saved “${S.name}” to your projects`+(Store.cloud.ok?' and your account':' in this browser'));
    return p;
  },
  cloudSoon(ms){ clearTimeout(Project.cloudTimer); Project.cloudTimer=setTimeout(async()=>{ const p=Project.last||Project.snapshot(); if(await Store.sync(p)) Project.setStatus('synced'); },ms); },
  setStatus(s){ Project.status=s; Project.renderStatus(); },
  renderStatus(){ const el=$('saveState'); if(!el) return; const s=Project.status;
    el.dataset.state=s; el.textContent=s==='editing'?'Saving…':s==='synced'?'Saved · synced':Project.cur&&Project.cur.fresh?'Not saved yet':'Saved'; },
  saveCopy(){ const p=Project.saveNow(); const c={...p,id:Store.newId(),created:Date.now(),updated:Date.now()}; c.song={...c.song,name:(p.song.name||'Untitled')+' copy'};
    Store.put(c); Store.sync(c); Project.cur={...Project.cur,id:c.id,created:c.created}; S.name=c.song.name; Store.setCurrent(c.id); renderHeader(); toast(`Now working on “${S.name}”. The original is unchanged.`); },
  download(){ const p=Project.saveNow(); offerFile(slug(S.name)+'.kyma',Store.toFile(p)); },
  async openFile(file){
    try{ const p=Store.fromFile(await file.text()); Project.saveNow(); Store.put(p); Store.sync(p); Store.setCurrent(p.id); location.href=STUDIO+'.html?p='+encodeURIComponent(p.id); }
    catch(e){ toast('That file isn’t a Kyma project.'); }
  },
  /* a fresh project in this studio; the one open now is saved first */
  newFile(){ Project.saveNow(); const p={app:'kyma',v:1,id:Store.newId(),created:Date.now(),updated:Date.now(),studio:STUDIO,name:Project.freshName(),song:null};
    Store.put(p); Store.setCurrent(p.id); try{ if(playing) stopPlay(); }catch(e){} location.href=STUDIO+'.html?p='+encodeURIComponent(p.id); },
  home(){ if(Project.status==='editing'||Project.cur&&Project.cur.fresh&&S.tracks.some(t=>t.clips.length)) Project.saveNow(); else if(Project.timer) Project.saveNow();
    try{ if(playing) stopPlay(); }catch(e){}
    location.href='index.html'; },
};
addEventListener('pagehide',()=>{ if(Project.status==='editing') Project.saveNow(); });
