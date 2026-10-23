/* KYMA · app/state — the open song's view state, undo history and song validation
   Shared by every studio. The song itself is the global S (core/engine). */
/* A tiny event hub so studios can react to shared changes without knowing about each other.
   Events: draw, tracks, header, frame, key, project, serialize, restore, song */
const HOOK={};
function on(ev,fn){ (HOOK[ev]=HOOK[ev]||[]).push(fn); }
function emit(ev,...a){ let r=false; (HOOK[ev]||[]).forEach(f=>{ try{ if(f(...a)===true) r=true; }catch(e){ console.error(e); } }); return r; }
function requestDraw(){ emit('draw'); }
function renderTracks(){ emit('tracks'); }

/* Per-viewer conveniences (zoom, snap, hum options). Zoom is kept per studio. */
const UI={pps:0,snap:4,loopSel:false,humBacking:true,humReplace:true,humOpen:false,humStyle:'smooth',follow:true};
try{ const u=JSON.parse(localStorage.getItem('kyma.ui')||'{}'); Object.assign(UI,u,{pps:(u.zoom||{})[STUDIO]||0}); }catch(e){}
function saveUI(){ try{ const u=JSON.parse(localStorage.getItem('kyma.ui')||'{}'); const zoom={...(u.zoom||{}),[STUDIO]:UI.pps}; const {pps,...rest}=UI; localStorage.setItem('kyma.ui',JSON.stringify({...rest,zoom})); }catch(e){} }
let SEL={clips:new Set(),notes:new Set()}, RANGE=null, FOCUS=null, CLIPBOARD=null;
const RULER_H=30, LANE_H=72, OPEN_H=320, BAR_H=24, ADD_H=52;
const HUM={recording:false,exclude:null,trace:[],chunks:[],target:null,a:0,b:0,t0:0,firstT:null,finish:null,timer:null,count:0};
const css={};
function readTheme(){
  const cs=getComputedStyle(document.documentElement);
  ['--surface','--surface-2','--line','--cell','--cell-hi','--fg','--muted','--accent','--play','--bg','--warn','--screen'].forEach(k=>css[k]=cs.getPropertyValue(k).trim());
  COLORS.forEach(k=>css[k]=cs.getPropertyValue(k).trim());
}
const trCol=tr=>css[COLORS[tr.color%COLORS.length]]||'#ff8a2a';
const fontMono=()=>getComputedStyle(document.body).getPropertyValue('--font-mono');
const fmtClock=s=>{ s=Math.max(0,s); const m=Math.floor(s/60), r=s-m*60; return String(m).padStart(2,'0')+':'+r.toFixed(1).padStart(4,'0'); };
const fmtMS=s=>{ s=Math.round(Math.max(0,s)); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); };
const snapTo=(x,q)=>Math.round(x/(q||UI.snap))*(q||UI.snap);
const curStep=()=>{ if(playing&&playView.step>=0&&ac) return playView.step+clamp((ac.currentTime-playView.t)/stepDur(),0,1); return PH.step; };

/* ---------- history + persistence ---------- */
let hist=[], fut=[];
const snapshot=()=>JSON.stringify(S);
function pushHist(){ hist.push(snapshot()); if(hist.length>80) hist.shift(); fut=[]; }
let histArmed=true; function pushHistOnce(){ if(histArmed){ pushHist(); histArmed=false; setTimeout(()=>histArmed=true,700);} }
function restore(json){ S=sanitizeSong(JSON.parse(json)); SEL={clips:new Set(),notes:new Set()}; markDirty(); if(G) applyGraph(G); renderAll(); persist(); emit('restore'); }
function undo(){ if(!hist.length) return toast('Nothing to undo'); fut.push(snapshot()); restore(hist.pop()); toast('Undone'); }
function redo(){ if(!fut.length) return; hist.push(snapshot()); restore(fut.pop()); }
/* Every edit autosaves the open project (see app/project.js). */
function persist(){ Project.touch(); }
function sanitizeSong(o){
  const s=newSong(); if(!o||typeof o!=='object'||!Array.isArray(o.tracks)) return s;
  ['name','desc'].forEach(k=>{ if(typeof o[k]==='string') s[k]=o[k]; }); if(VIBES[o.vibe]) s.vibe=o.vibe;
  if(isFinite(o.bpm)) s.bpm=clamp(+o.bpm,40,220); if(isFinite(o.swing)) s.swing=clamp(+o.swing,0,1); if(isFinite(o.human)) s.human=clamp(+o.human,0,1);
  if(isFinite(o.root)) s.root=clamp(o.root|0,0,11); if(SCALES[o.scale]) s.scale=o.scale;
  if(isFinite(o.len)) s.len=clamp(Math.round(o.len),16,16*400); s.loop=o.loop!==false;
  if(o.master) MASTER.forEach(m=>{ if(isFinite(o.master[m.k])) s.master[m.k]=clamp(+o.master[m.k],m.min,m.max); });
  if(o.magic&&o.magic.prog&&typeof o.magic.prog==='object'){ s.magic={prog:{}}; Object.entries(o.magic.prog).slice(0,2000).forEach(([k,v])=>{ if(isFinite(k)&&isFinite(v)) s.magic.prog[+k]=clamp(Math.round(v),0,6); }); }
  s.tracks=o.tracks.slice(0,48).map((t,i)=>{ const I=INST[t.inst]||INSTS[0];
    const tr={id:String(t.id||nid()),name:String(t.name||I.name).slice(0,60),inst:I.id,p:{...I.p},oct:isFinite(t.oct)?clamp(t.oct|0,0,7):I.oct,kind:I.kind,color:isFinite(t.color)?t.color|0:i,
      vol:isFinite(t.vol)?clamp(+t.vol,0,1.4):.8,pan:isFinite(t.pan)?clamp(+t.pan,-1,1):0,space:isFinite(t.space)?clamp(+t.space,0,1):.2,echo:isFinite(t.echo)?clamp(+t.echo,0,1):0,
      mute:!!t.mute,solo:!!t.solo,open:!!t.open,quant:[.5,1,2].includes(t.quant)?t.quant:1,clips:[],...(['drums','bass','chords','melody','arp','pad','counter','texture'].includes(t.role)?{role:t.role}:{})};
    if(t.p) (ESCHEMA[I.engine]||[]).forEach(e=>{ const v=t.p[e.k]; if(e.opts){ if(e.opts.includes(v)) tr.p[e.k]=v; } else if(isFinite(v)) tr.p[e.k]=clamp(+v,e.min,e.max); });
    if(Array.isArray(t.clips)) tr.clips=t.clips.slice(0,400).filter(c=>c&&isFinite(c.start)&&isFinite(c.len)).map(c=>({id:String(c.id||nid()),start:Math.max(0,Math.round(c.start)),len:Math.max(1,Math.round(c.len)),offset:Math.round(+c.offset||0),
      loop:!!c.loop,loopLen:Math.max(1,Math.round(+c.loopLen||c.len)),name:String(c.name||'').slice(0,40),
      fin:{type:TRANS_IN[c.fin?.type]?c.fin.type:'cut',len:clamp(+c.fin?.len||0,0,64)},fout:{type:TRANS_OUT[c.fout?.type]?c.fout.type:'cut',len:clamp(+c.fout?.len||0,0,64)},...(c.magic&&typeof c.magic==='object'?{magic:{role:String(c.magic.role||''),mood:String(c.magic.mood||''),genre:String(c.magic.genre||''),last:isFinite(c.magic.last)?+c.magic.last:null,motif:c.magic.motif&&Array.isArray(c.magic.motif.rhythm)?{rhythm:c.magic.motif.rhythm.slice(0,64).filter(r=>Array.isArray(r)&&isFinite(r[0])&&isFinite(r[1])).map(r=>[+r[0],+r[1]])}:null}}:{}),
      notes:(Array.isArray(c.notes)?c.notes:[]).slice(0,6000).filter(n=>n&&isFinite(n.t)&&isFinite(n.n)).map(n=>({t:+n.t,d:Math.max(.05,+n.d||1),n:Math.round(+n.n),v:clamp(+n.v||.85,.05,1),...(n.l?{l:1}:{})}))}));
    return tr; });
  return s;
}
