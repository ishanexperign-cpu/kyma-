/* KYMA · app/store — the project library
   Projects are saved in this browser (localStorage) the moment they change. When the page runs as a
   published artifact for a signed-in person, each project is also kept in that person's private
   artifact database, so the library follows them to other browsers and devices.
   A project file is plain JSON: {app:'kyma', v:1, id, created, updated, studio, song, atmos, video}. */
const Store=(()=>{
  const IDX='kyma.index', PK='kyma.p.', CUR='kyma.current', mem={};
  const ls={
    get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } },
    set(k,v){ try{ localStorage.setItem(k,v); return true; }catch(e){ return false; } },
    del(k){ try{ localStorage.removeItem(k); }catch(e){} },
  };
  /* the library used to live under spectral.* keys (the tool's earlier name): carry it over once */
  try{ if(!localStorage.getItem('kyma.index')&&localStorage.getItem('spectral.index')){ for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k&&k.startsWith('spectral.')){ const nk='kyma.'+k.slice(9); if(localStorage.getItem(nk)==null) localStorage.setItem(nk,localStorage.getItem(k)); } } } }catch(e){}
  const newId=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  function metaOf(p){ const s=p.song||{};
    return {id:p.id,name:s.name||p.name||'Untitled',created:p.created||p.updated||Date.now(),updated:p.updated||Date.now(),studio:p.studio||'compose',
      bpm:s.bpm||null,root:s.root??null,scale:s.scale||null,len:s.len||0,tracks:Array.isArray(s.tracks)?s.tracks.length:0,
      video:p.video&&p.video.name?p.video.name:null,atmos:p.atmos&&p.atmos.scene?p.atmos.scene:null,chunks:p._chunks||0}; }
  function index(){ try{ const a=JSON.parse(ls.get(IDX)||'[]'); return Array.isArray(a)?a.filter(m=>m&&m.id):[]; }catch(e){ return []; } }
  function writeIndex(a){ a.sort((x,y)=>(y.updated||0)-(x.updated||0)); if(!ls.set(IDX,JSON.stringify(a))) mem[IDX]=a; }
  function listLocal(){ return mem[IDX]&&!ls.get(IDX)?mem[IDX]:index(); }
  function getLocal(id){ const raw=ls.get(PK+id)??mem[id]; if(!raw) return null; try{ return JSON.parse(raw); }catch(e){ return null; } }
  function putLocal(p){ const raw=JSON.stringify(p); if(!ls.set(PK+p.id,raw)) mem[p.id]=raw; const a=listLocal().filter(m=>m.id!==p.id); a.push(metaOf(p)); writeIndex(a); return true; }
  function delLocal(id){ ls.del(PK+id); delete mem[id]; writeIndex(listLocal().filter(m=>m.id!==id)); }

  /* ---------- the person's private artifact database (when published) ---------- */
  const cloud={db:null,uid:null,ok:false};
  cloud.ready=(async()=>{
    try{ if(!window.claude||typeof window.claude.use!=='function') return false;
      const [db,user]=await Promise.all([window.claude.use('db'),window.claude.use('user')]); if(!db||!user) return false;
      const uid=await user.id(); if(!uid) return false; cloud.db=db; cloud.uid=uid; cloud.ok=true; return true; }
    catch(e){ return false; } })();
  const col=()=>cloud.db.collection('data/users/'+cloud.uid);
  const CH=180000;
  async function pushCloud(p){
    if(!await cloud.ready) return false;
    const body=JSON.stringify(p), n=Math.max(1,Math.ceil(body.length/CH)), prev=(listLocal().find(m=>m.id===p.id)||{}).cloudChunks||0;
    for(let i=1;i<n;i++) await col().doc('c_'+p.id+'_'+i).set({kind:'chunk',body:body.slice(i*CH,(i+1)*CH)});
    await col().doc('p_'+p.id).set({kind:'project',id:p.id,updated:p.updated,meta:metaOf(p),chunks:n,body:body.slice(0,CH)});
    for(let i=n;i<prev;i++){ try{ await col().doc('c_'+p.id+'_'+i).delete(); }catch(e){} }
    const a=listLocal(), m=a.find(x=>x.id===p.id); if(m){ m.cloudChunks=n; m.synced=p.updated; writeIndex(a); }
    return true;
  }
  async function listCloud(){
    if(!await cloud.ready) return [];
    try{ const snap=await col().where('kind','==','project').get(); return snap.docs.map(d=>d.data()).filter(x=>x&&x.meta&&x.id).map(x=>({...x.meta,id:x.id,updated:x.updated,cloud:true,cloudChunks:x.chunks})); }
    catch(e){ return []; }
  }
  async function getCloud(id){
    if(!await cloud.ready) return null;
    try{ const d=await col().doc('p_'+id).get(); if(!d.exists) return null; const x=d.data(); let body=x.body||'';
      for(let i=1;i<(x.chunks||1);i++){ const c=await col().doc('c_'+id+'_'+i).get(); body+=c.exists?(c.data().body||''):''; }
      return JSON.parse(body); }
    catch(e){ return null; }
  }
  async function delCloud(id,chunks){
    if(!await cloud.ready) return;
    try{ await col().doc('p_'+id).delete(); for(let i=1;i<(chunks||1);i++) await col().doc('c_'+id+'_'+i).delete(); }catch(e){}
  }

  /* ---------- public API ---------- */
  return {
    newId, metaOf, cloud,
    list:listLocal,
    get:getLocal,
    put(p){ p.updated=p.updated||Date.now(); return putLocal(p); },
    async sync(p){ try{ return await pushCloud(p); }catch(e){ console.warn('cloud save',e); return false; } },
    async remove(id){ const m=listLocal().find(x=>x.id===id); delLocal(id); if(ls.get(CUR)===id) ls.del(CUR); await delCloud(id,m&&m.cloudChunks); },
    /* merge the cloud library into this browser: newer cloud copies replace local ones */
    async pull(){
      const remote=await listCloud(); if(!remote.length) return false; let changed=false; const local=listLocal();
      for(const r of remote){ const l=local.find(x=>x.id===r.id);
        if(!l||(r.updated||0)>(l.updated||0)+500){ const p=await getCloud(r.id); if(p&&p.id){ putLocal(p); const a=listLocal(), m=a.find(x=>x.id===p.id); if(m){ m.cloudChunks=r.cloudChunks; m.synced=p.updated; writeIndex(a); } changed=true; } } }
      for(const l of local){ if(!remote.some(r=>r.id===l.id)&&l.synced){ /* deleted elsewhere: keep it here, but mark it local only */ l.synced=0; changed=true; } }
      if(changed) writeIndex(listLocal());
      return changed;
    },
    async fetch(id){ return getLocal(id)||await getCloud(id); },
    current(){ return ls.get(CUR); },
    setCurrent(id){ if(id) ls.set(CUR,id); else ls.del(CUR); },
    /* one-time import of the song Ghostloop kept in this browser */
    migrate(){
      if(ls.get('kyma.migrated')) return null; ls.set('kyma.migrated','1');
      const raw=ls.get('ghostloop.v5'); if(!raw) return null;
      try{ const song=JSON.parse(raw); if(!song||!Array.isArray(song.tracks)||!song.tracks.length) return null;
        const p={app:'kyma',v:1,id:newId(),created:Date.now(),updated:Date.now(),studio:'compose',song};
        try{ const a=JSON.parse(ls.get('ghostloop.atmos')||'null'); if(a&&a.scene) p.atmos={scene:a.scene,p:a.p,space:a.space,level:a.level}; }catch(e){}
        putLocal(p); return p; }catch(e){ return null; }
    },
    /* project file in and out */
    toFile(p){ const {_chunks,...rest}=p; return JSON.stringify({...rest,app:'kyma',v:1},null,0); },
    fromFile(text){
      const o=JSON.parse(text);
      if(o&&(o.app==='kyma'||o.app==='spectral')&&o.song) return {...o,id:newId(),created:o.created||Date.now(),updated:Date.now()};
      if(o&&Array.isArray(o.tracks)) return {app:'kyma',v:1,id:newId(),created:Date.now(),updated:Date.now(),studio:'compose',song:o};
      throw new Error('not a project');
    },
  };
})();
